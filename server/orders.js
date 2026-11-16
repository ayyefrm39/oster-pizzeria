import { randomUUID } from "node:crypto";
import { ApiError, requireThat, token, hash } from "./security.js";
import { minor, orderSchema } from "./validation.js";
import { transaction } from "./db.js";

export const rowData = (row) => (row ? JSON.parse(row.data) : null);
export const listData = (db, table) =>
  db.prepare(`SELECT data FROM ${table}`).all().map(rowData);
export const settings = (db) =>
  rowData(
    db.prepare("SELECT data FROM settings WHERE id = ?").get("restaurant"),
  );
const minutes = (value) =>
  Number(value.slice(0, 2)) * 60 + Number(value.slice(3));
export function isOpen(hours, now = new Date()) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Stockholm",
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(now)
      .map((p) => [p.type, p.value]),
  );
  const day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(
    parts.weekday,
  );
  const current = Number(parts.hour) * 60 + Number(parts.minute);
  return hours.some((h) =>
    h.closesNextDay
      ? (h.day === day && current >= minutes(h.open)) ||
        (h.day === (day + 6) % 7 && current < minutes(h.close))
      : h.day === day &&
        current >= minutes(h.open) &&
        current < minutes(h.close),
  );
}
export function priceOrder(db, input, now = new Date()) {
  const config = settings(db);
  requireThat(
    config && !config.ordersPaused,
    "Onlinebeställningar är pausade.",
    409,
  );
  requireThat(
    input.orderType === "delivery"
      ? config.deliveryEnabled
      : config.pickupEnabled,
    "Beställningssättet är inte tillgängligt.",
    409,
  );
  if (input.scheduledFor) {
    // ISO timestamps avoid ambiguous browser/server timezones.
    const scheduled = new Date(input.scheduledFor);
    requireThat(
      config.acceptPreOrders &&
        /^\d{4}-\d\d-\d\dT/.test(input.scheduledFor) &&
        Number.isFinite(+scheduled) &&
        +scheduled > +now &&
        +scheduled < +now + 7 * 86400000 &&
        isOpen(config.openingHours, scheduled),
      "Ogiltig förbeställningstid.",
    );
  } else
    requireThat(
      isOpen(config.openingHours, now),
      "Restaurangen är stängd.",
      409,
    );
  const lines = input.items.map((line) => {
    const product = rowData(
      db.prepare("SELECT data FROM products WHERE id = ?").get(line.itemId),
    );
    const category =
      product &&
      rowData(
        db
          .prepare("SELECT data FROM categories WHERE id = ?")
          .get(product.categoryId),
      );
    requireThat(
      product && product.active && !product.soldOut && category?.active,
      "En rätt är inte tillgänglig.",
      409,
    );
    let unit = minor(product.price);
    const groups = product.optionGroups || [];
    const sizeGroup = groups.find((g) => g.type === "size");
    if (line.size) {
      const size = sizeGroup?.options.find((o) => o.name === line.size);
      requireThat(size, "Ogiltig storlek.");
      unit += minor(size.price);
    }
    requireThat(!sizeGroup?.required || line.size, "Välj storlek.");
    requireThat(
      new Set(line.extras).size === line.extras.length,
      "Dubbla tillval.",
    );
    const selected = new Map();
    for (const name of line.extras) {
      const matches = groups.filter(
        (g) =>
          !["size", "remove"].includes(g.type) &&
          g.options.some((o) => o.name === name),
      );
      requireThat(matches.length === 1, "Ogiltigt eller tvetydigt tillval.");
      const g = matches[0];
      selected.set(g.id, (selected.get(g.id) || 0) + 1);
      unit += minor(g.options.find((o) => o.name === name).price);
    }
    for (const g of groups.filter(
      (g) => !["size", "remove"].includes(g.type),
    )) {
      requireThat(
        !g.required || selected.get(g.id),
        "Ett obligatoriskt tillval saknas.",
      );
      requireThat(
        g.multiple || (selected.get(g.id) || 0) <= 1,
        "För många tillval.",
      );
    }
    return {
      productId: product.id,
      name: product.name,
      qty: line.qty,
      unitMinor: unit,
      price: unit / 100,
      basePrice: product.price,
      size: line.size || "",
      extras: line.extras,
      notes: line.notes,
    };
  });
  const subtotalMinor = lines.reduce(
    (sum, line) => sum + line.unitMinor * line.qty,
    0,
  );
  let fee = 0;
  if (input.orderType === "delivery") {
    const address = input.deliveryAddress;
    requireThat(
      address?.street &&
        address.city &&
        /^\d{5}$/.test(address.postal.replace(/\s/g, "")),
      "Ange en fullständig leveransadress.",
    );
    const postal = address.postal.replace(/\s/g, "");
    const zone = listData(db, "delivery_zones").find(
      (z) =>
        z.active &&
        z.postalCodes.some(
          (p) => postal === p || (p.length === 3 && postal.startsWith(p)),
        ),
    );
    requireThat(zone, "Adressen ligger utanför leveransområdet.");
    requireThat(
      subtotalMinor >= minor(Math.max(config.minDeliveryOrder, zone.minOrder)),
      "Minsta beställningsbelopp för leverans är inte uppnått.",
    );
    fee =
      config.freeDeliveryThreshold > 0 &&
      subtotalMinor >= minor(config.freeDeliveryThreshold)
        ? 0
        : minor(zone.deliveryFee);
  }
  let discount = 0;
  if (input.offerCode) {
    const offer = listData(db, "offers").find(
      (o) => o.active && o.code === input.offerCode.toUpperCase(),
    );
    requireThat(
      offer &&
        +new Date(offer.startsAt) <= +now &&
        +new Date(offer.endsAt) > +now &&
        subtotalMinor >= minor(offer.minOrder),
      "Erbjudandet gäller inte.",
    );
    discount = Math.floor((subtotalMinor * offer.percent) / 100);
  }
  requireThat(
    subtotalMinor - discount + fee > 0 && subtotalMinor + fee <= 10000000,
    "Ogiltigt totalbelopp.",
  );
  return {
    lines,
    subtotalMinor,
    deliveryFeeMinor: fee,
    discountMinor: discount,
    totalMinor: subtotalMinor - discount + fee,
    estimatedReadyTime: config.estimatedPrepTime,
  };
}
export function createOrder(db, raw, now) {
  const input = orderSchema.parse(raw);
  const requestHash = hash(JSON.stringify(input));
  return transaction(db, () => {
    const existing = db
      .prepare("SELECT * FROM orders WHERE idempotency_key = ?")
      .get(input.idempotencyKey);
    if (existing) {
      requireThat(
        existing.request_hash === requestHash,
        "Beställningsnyckeln har redan använts.",
        409,
      );
      return {
        order: rowData(existing),
        trackingToken: existing.tracking_token,
      };
    }
    const priced = priceOrder(db, input, now);
    requireThat(
      input.expectedTotalMinor === undefined ||
        input.expectedTotalMinor === priced.totalMinor,
      "Priset har ändrats. Kontrollera beställningen igen.",
      409,
    );
    const id = randomUUID();
    const trackingToken = token();
    const number = db
      .prepare("SELECT COALESCE(MAX(order_number), 1041)+1 AS n FROM orders")
      .get().n;
    const order = {
      id,
      orderNumber: number,
      created_date: new Date().toISOString(),
      orderType: input.orderType,
      customer: input.customer,
      deliveryAddress: input.deliveryAddress || {},
      customerNotes: input.customerNotes,
      scheduledFor: input.scheduledFor,
      items: priced.lines,
      subtotal: priced.subtotalMinor / 100,
      deliveryFee: priced.deliveryFeeMinor / 100,
      discount: priced.discountMinor / 100,
      total: priced.totalMinor / 100,
      totalMinor: priced.totalMinor,
      estimatedReadyTime: priced.estimatedReadyTime,
      status: "pending",
      paymentMethod: input.paymentMethod,
      paymentStatus: input.paymentMethod === "cash" ? "unpaid" : "pending",
    };
    db.prepare("INSERT INTO orders VALUES (?,?,?,?,?,?,?,?)").run(
      id,
      number,
      input.idempotencyKey,
      requestHash,
      hash(trackingToken),
      trackingToken,
      priced.totalMinor,
      JSON.stringify(order),
    );
    for (const line of priced.lines)
      db.prepare("INSERT INTO order_items VALUES (?,?,?,?,?,?)").run(
        randomUUID(),
        id,
        line.productId,
        line.unitMinor,
        line.qty,
        JSON.stringify(line),
      );
    db.prepare("INSERT INTO payments(order_id) VALUES (?)").run(id);
    return { order, trackingToken };
  });
}
export function getTrackedOrder(db, id, trackingToken) {
  const row = db
    .prepare("SELECT * FROM orders WHERE id = ? AND tracking_hash = ?")
    .get(id, hash(String(trackingToken || "")));
  if (!row) throw new ApiError(404, "Beställningen hittades inte.");
  return rowData(row);
}
export function updateOrder(db, order) {
  db.prepare("UPDATE orders SET data = ? WHERE id = ?").run(
    JSON.stringify(order),
    order.id,
  );
}
