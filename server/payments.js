import Stripe from "stripe";
import { HttpsProxyAgent } from "https-proxy-agent";
import { ApiError, requireThat } from "./security.js";
import { transaction } from "./db.js";
import { rowData, updateOrder } from "./orders.js";

export function paymentGateway(env = process.env) {
  if (!env.STRIPE_SECRET_KEY) return null;
  requireThat(
    env.STRIPE_SECRET_KEY.startsWith("sk_test_"),
    "Endast Stripe-testnycklar är tillåtna.",
    500,
  );
  requireThat(env.APP_ORIGIN, "APP_ORIGIN saknas.", 500);
  const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
    httpAgent:
      env.HTTPS_PROXY || env.HTTP_PROXY
        ? new HttpsProxyAgent(env.HTTPS_PROXY || env.HTTP_PROXY)
        : undefined,
    maxNetworkRetries: 2,
    timeout: 15000,
  });
  const methods = (env.STRIPE_PAYMENT_METHODS || "card")
    .split(",")
    .map((s) => s.trim());
  requireThat(
    methods.every((m) => ["card", "swish", "klarna"].includes(m)),
    "Ogiltigt betalningssätt.",
    500,
  );
  return {
    async checkout(order, trackingToken, attempt) {
      return stripe.checkout.sessions.create(
        {
          mode: "payment",
          currency: "sek",
          payment_method_types: methods,
          client_reference_id: order.id,
          metadata: { orderId: order.id },
          payment_intent_data: { metadata: { orderId: order.id } },
          line_items: [
            {
              price_data: {
                currency: "sek",
                unit_amount: order.totalMinor,
                product_data: { name: `Öster Pizzeria #${order.orderNumber}` },
              },
              quantity: 1,
            },
          ],
          success_url: `${env.APP_ORIGIN}/order/${order.id}?token=${trackingToken}&payment=success`,
          cancel_url: `${env.APP_ORIGIN}/order/${order.id}?token=${trackingToken}&payment=cancelled`,
        },
        { idempotencyKey: `checkout-${order.id}-${attempt}` },
      );
    },
    retrieve: (id) => stripe.checkout.sessions.retrieve(id),
    refund: (order, id, attempt) =>
      stripe.refunds.create(
        { payment_intent: id, metadata: { orderId: order.id } },
        { idempotencyKey: `refund-${order.id}-${attempt}` },
      ),
    verify: (body, signature) => {
      requireThat(env.STRIPE_WEBHOOK_SECRET, "Webhook-hemlighet saknas.", 503);
      return stripe.webhooks.constructEvent(
        body,
        signature,
        env.STRIPE_WEBHOOK_SECRET,
      );
    },
  };
}
export async function checkout(db, gateway, order, trackingToken) {
  requireThat(gateway, "Onlinebetalning är ännu inte konfigurerad.", 503);
  requireThat(
    order.paymentMethod === "stripe" &&
      !["paid", "refunded", "refund_pending"].includes(order.paymentStatus) &&
      !["cancelled", "rejected"].includes(order.status),
    "Beställningen kan inte betalas.",
    409,
  );
  const payment = db
    .prepare("SELECT * FROM payments WHERE order_id = ?")
    .get(order.id);
  if (payment.session_id) {
    const existing = await gateway.retrieve(payment.session_id);
    if (existing.status === "open") return existing;
    requireThat(
      existing.status === "expired",
      "Betalningen bearbetas redan.",
      409,
    );
  }
  const session = await gateway.checkout(
    order,
    trackingToken,
    payment.session_id || "first",
  );
  transaction(db, () => {
    db.prepare("INSERT OR IGNORE INTO checkout_sessions VALUES (?,?)").run(
      session.id,
      order.id,
    );
    db.prepare("UPDATE payments SET session_id = ? WHERE order_id = ?").run(
      session.id,
      order.id,
    );
  });
  return session;
}
// Only verified Stripe events enter this function. Redirects never update payment state.
export function processEvent(db, event) {
  requireThat(event.livemode === false, "Livehändelser är inte tillåtna.");
  return transaction(db, () => {
    if (db.prepare("SELECT 1 FROM payment_events WHERE id = ?").get(event.id))
      return { duplicate: true };
    const object = event.data.object;
    if (
      [
        "checkout.session.completed",
        "checkout.session.async_payment_succeeded",
        "checkout.session.async_payment_failed",
        "checkout.session.expired",
      ].includes(event.type)
    ) {
      const payment = db
        .prepare(
          "SELECT payments.* FROM checkout_sessions JOIN payments ON payments.order_id=checkout_sessions.order_id WHERE checkout_sessions.id = ?",
        )
        .get(object.id);
      requireThat(payment, "Okänd betalningssession.", 409);
      const order = rowData(
        db
          .prepare("SELECT data FROM orders WHERE id = ?")
          .get(payment.order_id),
      );
      requireThat(
        object.metadata?.orderId === order.id &&
          object.client_reference_id === order.id &&
          object.currency === "sek" &&
          object.amount_total === order.totalMinor,
        "Betalningen matchar inte beställningen.",
        409,
      );
      if (
        object.payment_status === "paid" &&
        [
          "checkout.session.completed",
          "checkout.session.async_payment_succeeded",
        ].includes(event.type)
      ) {
        requireThat(object.payment_intent, "Betalningsreferens saknas.");
        if (!["refund_pending", "refunded"].includes(order.paymentStatus)) {
          order.paymentStatus = "paid";
          order.paidAt = new Date().toISOString();
        }
        db.prepare("UPDATE payments SET intent_id = ? WHERE order_id = ?").run(
          object.payment_intent,
          order.id,
        );
      } else if (
        payment.session_id === object.id &&
        !["paid", "refund_pending", "refunded"].includes(order.paymentStatus) &&
        [
          "checkout.session.expired",
          "checkout.session.async_payment_failed",
        ].includes(event.type)
      ) {
        order.paymentStatus = "failed";
      }
      updateOrder(db, order);
    }
    if (event.type === "refund.updated" || event.type === "refund.failed") {
      const payment = db
        .prepare("SELECT * FROM payments WHERE intent_id = ?")
        .get(object.payment_intent);
      requireThat(payment, "Okänd återbetalning.", 409);
      const order = rowData(
        db
          .prepare("SELECT data FROM orders WHERE id = ?")
          .get(payment.order_id),
      );
      requireThat(
        object.amount === order.totalMinor,
        "Ofullständig återbetalning stöds inte.",
        409,
      );
      order.paymentStatus =
        object.status === "succeeded"
          ? "refunded"
          : ["failed", "canceled"].includes(object.status)
            ? "paid"
            : "refund_pending";
      db.prepare("UPDATE payments SET refund_id = ? WHERE order_id = ?").run(
        object.id,
        order.id,
      );
      updateOrder(db, order);
    }
    db.prepare("INSERT INTO payment_events VALUES (?,?,?)").run(
      event.id,
      event.type,
      new Date().toISOString(),
    );
    return { received: true };
  });
}
export async function refund(db, gateway, order) {
  if (!gateway) throw new ApiError(503, "Stripe är inte konfigurerat.");
  requireThat(
    order.paymentMethod === "stripe" &&
      ["paid", "refund_pending", "refunded"].includes(order.paymentStatus),
    "Ingen onlinebetalning att återbetala.",
    409,
  );
  const payment = db
    .prepare("SELECT * FROM payments WHERE order_id = ?")
    .get(order.id);
  if (["refunded", "refund_pending"].includes(order.paymentStatus))
    return order;
  requireThat(payment.intent_id, "Betalningsreferens saknas.", 409);
  const result = await gateway.refund(
    order,
    payment.intent_id,
    payment.refund_id || "first",
  );
  order.paymentStatus =
    result.status === "succeeded"
      ? "refunded"
      : ["failed", "canceled"].includes(result.status)
        ? "paid"
        : "refund_pending";
  transaction(db, () => {
    db.prepare("UPDATE payments SET refund_id = ? WHERE order_id = ?").run(
      result.id,
      order.id,
    );
    updateOrder(db, order);
  });
  return order;
}
