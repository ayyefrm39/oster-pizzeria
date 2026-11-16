import test from "node:test";
import assert from "node:assert/strict";
import Stripe from "stripe";
import { harness } from "./helpers.js";
import { paymentGateway, processEvent } from "../server/payments.js";
import { createOrder } from "../server/orders.js";

// Local gateway contract tests, not evidence of a real Stripe checkout.
function gatewayDouble() {
  const sessions = new Map();
  let refunds = 0;
  return {
    sessions,
    get refunds() {
      return refunds;
    },
    async checkout(o) {
      const s = {
        id: `cs_test_${o.id}`,
        url: "https://checkout.stripe.com/test",
        status: "open",
      };
      sessions.set(s.id, s);
      return s;
    },
    async retrieve(id) {
      return sessions.get(id);
    },
    async refund() {
      refunds++;
      return { id: "re_test_1", status: "succeeded" };
    },
    verify() {
      throw new Error("Invalid signature");
    },
  };
}
function event(order, session, patch = {}) {
  return {
    id: crypto.randomUUID(),
    type: "checkout.session.completed",
    livemode: false,
    data: {
      object: {
        id: session,
        client_reference_id: order.id,
        metadata: { orderId: order.id },
        currency: "sek",
        amount_total: order.totalMinor,
        payment_status: "paid",
        payment_intent: `pi_${order.id}`,
        ...patch,
      },
    },
  };
}
test("missing payment configuration fails explicitly and live keys are rejected", async (t) => {
  const h = await harness(t);
  assert.equal(
    (
      await h.request("/api/orders", {
        method: "POST",
        body: h.order({ paymentMethod: "stripe" }),
      })
    ).status,
    503,
  );
  assert.throws(() =>
    paymentGateway({ STRIPE_SECRET_KEY: "sk_live_never_use" }),
  );
  assert.equal(h.db.prepare("SELECT COUNT(*) AS n FROM orders").get().n, 0);
});
test("trusted checkout totals, session reuse, signed-event settlement and idempotent refunds", async (t) => {
  const gateway = gatewayDouble();
  const h = await harness(t, gateway);
  const response = await h.request("/api/orders", {
    method: "POST",
    body: h.order({ paymentMethod: "stripe", total: 1 }),
  });
  assert.equal(response.status, 201);
  assert.ok(response.data.checkoutUrl);
  const id = response.data.orderId;
  const order = JSON.parse(
    h.db.prepare("SELECT data FROM orders WHERE id = ?").get(id).data,
  );
  assert.equal(order.totalMinor, 11000);
  assert.equal(order.paymentStatus, "pending");
  const retry = await h.request("/api/payment-session", {
    method: "POST",
    body: { orderId: id, token: response.data.token },
  });
  assert.equal(retry.data.checkoutUrl, response.data.checkoutUrl);
  assert.equal(gateway.sessions.size, 1);
  const cookie = await h.login();
  assert.equal(
    (
      await h.request(`/api/admin/Order/${id}`, {
        method: "PATCH",
        cookie,
        body: { paymentStatus: "paid" },
      })
    ).status,
    409,
  );
  const evt = event(order, `cs_test_${id}`);
  processEvent(h.db, evt);
  assert.equal(processEvent(h.db, evt).duplicate, true);
  assert.equal(
    JSON.parse(
      h.db.prepare("SELECT data FROM orders WHERE id = ?").get(id).data,
    ).paymentStatus,
    "paid",
  );
  assert.equal(
    h.db.prepare("SELECT COUNT(*) AS n FROM payment_events").get().n,
    1,
  );
  const refund = await h.request("/api/refund", {
    method: "POST",
    cookie,
    body: { orderId: id },
  });
  assert.equal(refund.data.paymentStatus, "refunded");
  await h.request("/api/refund", {
    method: "POST",
    cookie,
    body: { orderId: id },
  });
  assert.equal(gateway.refunds, 1);
  processEvent(h.db, { ...evt, id: crypto.randomUUID() });
  assert.equal(
    JSON.parse(
      h.db.prepare("SELECT data FROM orders WHERE id = ?").get(id).data,
    ).paymentStatus,
    "refunded",
  );
});
test("reject forged signatures, mismatched totals/currency/order and live events", async (t) => {
  const gateway = gatewayDouble();
  const h = await harness(t, gateway);
  const response = await h.request("/api/orders", {
    method: "POST",
    body: h.order({ paymentMethod: "stripe" }),
  });
  const id = response.data.orderId;
  const order = JSON.parse(
    h.db.prepare("SELECT data FROM orders WHERE id = ?").get(id).data,
  );
  assert.equal(
    (
      await h.request("/api/payments/webhook", {
        method: "POST",
        headers: { "stripe-signature": "forged" },
        body: { x: 1 },
      })
    ).status,
    400,
  );
  for (const patch of [
    { amount_total: 1 },
    { currency: "eur" },
    { metadata: { orderId: "wrong" } },
    { client_reference_id: "wrong" },
  ])
    assert.throws(() =>
      processEvent(h.db, event(order, `cs_test_${id}`, patch)),
    );
  assert.throws(() =>
    processEvent(h.db, { ...event(order, `cs_test_${id}`), livemode: true }),
  );
  assert.equal(
    h.db.prepare("SELECT COUNT(*) AS n FROM payment_events").get().n,
    0,
  );
});
test("Stripe SDK verifies raw payload signatures and rejects altered payloads", () => {
  const stripe = new Stripe("sk_test_local_signature_test");
  const secret = "whsec_local_test_only";
  const payload = JSON.stringify({
    id: "evt_local_signature",
    livemode: false,
    type: "test",
    data: { object: {} },
  });
  const header = Stripe.webhooks.generateTestHeaderString({ payload, secret });
  assert.equal(
    stripe.webhooks.constructEvent(payload, header, secret).id,
    "evt_local_signature",
  );
  assert.throws(() =>
    stripe.webhooks.constructEvent(payload + " ", header, secret),
  );
});
test("asynchronous failure stays unpaid; out-of-order failure cannot undo success", async (t) => {
  const h = await harness(t, gatewayDouble());
  const { order } = createOrder(h.db, h.order({ paymentMethod: "stripe" }));
  h.db
    .prepare("UPDATE payments SET session_id=? WHERE order_id=?")
    .run("cs_failed", order.id);
  h.db
    .prepare("INSERT INTO checkout_sessions VALUES (?,?)")
    .run("cs_failed", order.id);
  const failed = {
    ...event(order, "cs_failed", { payment_status: "unpaid" }),
    type: "checkout.session.async_payment_failed",
  };
  processEvent(h.db, failed);
  assert.equal(
    JSON.parse(
      h.db.prepare("SELECT data FROM orders WHERE id=?").get(order.id).data,
    ).paymentStatus,
    "failed",
  );
  processEvent(h.db, {
    ...event(order, "cs_failed"),
    type: "checkout.session.async_payment_succeeded",
  });
  processEvent(h.db, { ...failed, id: crypto.randomUUID() });
  assert.equal(
    JSON.parse(
      h.db.prepare("SELECT data FROM orders WHERE id=?").get(order.id).data,
    ).paymentStatus,
    "paid",
  );
});

test("failed refunds remain paid and a later attempt uses a fresh idempotency generation", async (t) => {
  const gateway = gatewayDouble();
  const attempts = [];
  gateway.refund = async (o, id, attempt) => {
    attempts.push(attempt);
    return {
      id: attempt === "first" ? "re_failed" : "re_succeeded",
      status: attempt === "first" ? "failed" : "succeeded",
    };
  };
  const h = await harness(t, gateway);
  const created = await h.request("/api/orders", {
    method: "POST",
    body: h.order({ paymentMethod: "stripe" }),
  });
  const id = created.data.orderId;
  const order = JSON.parse(
    h.db.prepare("SELECT data FROM orders WHERE id=?").get(id).data,
  );
  processEvent(h.db, event(order, `cs_test_${id}`));
  const cookie = await h.login();
  const failed = await h.request("/api/refund", {
    method: "POST",
    cookie,
    body: { orderId: id },
  });
  assert.equal(failed.data.paymentStatus, "paid");
  const done = await h.request("/api/refund", {
    method: "POST",
    cookie,
    body: { orderId: id },
  });
  assert.equal(done.data.paymentStatus, "refunded");
  assert.deepEqual(attempts, ["first", "re_failed"]);
});
