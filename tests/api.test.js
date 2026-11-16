import test from "node:test";
import assert from "node:assert/strict";
import { harness } from "./helpers.js";
import { openDatabase } from "../server/db.js";
import { saveEntity } from "../server/catalog.js";
import { isOpen } from "../server/orders.js";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

test("migrations repeat safely and settings persist across database reopen", () => {
  const dir = mkdtempSync(join(tmpdir(), "oster-db-"));
  const file = join(dir, "db.sqlite");
  try {
    let db = openDatabase(file);
    saveEntity(db, "MenuCategory", null, { name: "Persistens" });
    db.close();
    db = openDatabase(file);
    assert.equal(db.prepare("SELECT count(*) AS n FROM categories").get().n, 1);
    assert.equal(
      db.prepare("SELECT count(*) AS n FROM schema_migrations").get().n,
      2,
    );
    db.close();
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
test("admin authentication, authorization, session revocation and CSRF", async (t) => {
  const h = await harness(t);
  assert.equal((await h.request("/api/admin/Order")).status, 401);
  assert.equal(
    (
      await h.request("/api/admin/MenuItem", {
        method: "POST",
        body: { name: "x" },
      })
    ).status,
    401,
  );
  assert.equal(
    (
      await h.request("/api/auth/login", {
        method: "POST",
        body: { email: "admin@example.test", password: "wrong" },
      })
    ).status,
    401,
  );
  const login = await h.request("/api/auth/login", {
    method: "POST",
    body: { email: "admin@example.test", password: "test-password-only-123" },
  });
  assert.match(login.headers.get("set-cookie"), /HttpOnly/);
  assert.match(login.headers.get("set-cookie"), /SameSite=Strict/);
  assert.equal(
    (await h.request("/api/auth/me", { cookie: login.cookie })).data.role,
    "admin",
  );
  assert.equal(
    (
      await h.request("/api/admin/MenuCategory", {
        method: "POST",
        cookie: login.cookie,
        origin: "https://evil.test",
        body: { name: "evil" },
      })
    ).status,
    403,
  );
  await h.request("/api/auth/logout", {
    method: "POST",
    cookie: login.cookie,
    body: {},
  });
  assert.equal(
    (await h.request("/api/auth/me", { cookie: login.cookie })).status,
    401,
  );
});
test("product/category CRUD, price edits, availability, safe archive and settings", async (t) => {
  const h = await harness(t);
  const cookie = await h.login();
  const category = await h.request("/api/admin/MenuCategory", {
    method: "POST",
    cookie,
    body: { name: "Ny kategori", sortOrder: 3 },
  });
  assert.equal(category.status, 201);
  const product = await h.request("/api/admin/MenuItem", {
    method: "POST",
    cookie,
    body: {
      name: "Ny rätt",
      categoryId: category.data.id,
      price: 125,
      familyPrice: 205,
    },
  });
  assert.equal(product.status, 201);
  assert.equal(product.data.optionGroups[0].options[1].price, 80);
  const edit = await h.request(`/api/admin/MenuItem/${product.data.id}`, {
    method: "PATCH",
    cookie,
    body: { price: 130 },
  });
  assert.equal(edit.data.price, 130);
  assert.equal(edit.data.optionGroups[0].options[1].price, 75);
  assert.equal(
    (
      await h.request(`/api/admin/MenuCategory/${category.data.id}`, {
        method: "DELETE",
        cookie,
      })
    ).status,
    409,
  );
  await h.request(`/api/admin/MenuItem/${product.data.id}`, {
    method: "PATCH",
    cookie,
    body: { soldOut: true },
  });
  assert.equal(
    (await h.request("/api/catalog/MenuItem")).data.find(
      (p) => p.id === product.data.id,
    ).soldOut,
    true,
  );
  await h.request(`/api/admin/MenuItem/${product.data.id}`, {
    method: "DELETE",
    cookie,
  });
  assert.equal(
    (await h.request("/api/catalog/MenuItem")).data.some(
      (p) => p.id === product.data.id,
    ),
    false,
  );
  assert.equal(
    (
      await h.request(`/api/admin/MenuCategory/${category.data.id}`, {
        method: "DELETE",
        cookie,
      })
    ).status,
    200,
  );
  const settings = await h.request("/api/admin/RestaurantSettings/restaurant", {
    method: "PATCH",
    cookie,
    body: { phone: "0709876543" },
  });
  assert.equal(settings.data.phone, "0709876543");
  assert.equal(
    (await h.request("/api/catalog/RestaurantSettings")).data[0].phone,
    "0709876543",
  );
});
test("server calculates SEK totals, sizes and extras; repeat submissions return one order", async (t) => {
  const h = await harness(t);
  const input = h.order({
    items: [
      {
        itemId: h.product.id,
        qty: 2,
        size: "Familj",
        extras: ["Extra ost"],
        price: 1,
      },
    ],
    total: 1,
  });
  const one = await h.request("/api/orders", { method: "POST", body: input });
  assert.equal(one.status, 201);
  const two = await h.request("/api/orders", { method: "POST", body: input });
  assert.equal(two.data.orderId, one.data.orderId);
  assert.equal(two.data.token, one.data.token);
  const status = await h.request("/api/order-status", {
    method: "POST",
    body: { orderId: one.data.orderId, token: one.data.token },
  });
  assert.equal(status.data.order.totalMinor, 40000);
  assert.equal(status.data.order.items[0].price, 200);
  assert.equal(status.data.order.customer, undefined);
  assert.equal(h.db.prepare("SELECT COUNT(*) AS n FROM orders").get().n, 1);
  assert.equal(
    (
      await h.request("/api/orders", {
        method: "POST",
        body: { ...input, customerNotes: "changed" },
      })
    ).status,
    409,
  );
  assert.equal(
    (
      await h.request("/api/order-status", {
        method: "POST",
        body: { orderId: one.data.orderId, token: "wrong" },
      })
    ).status,
    404,
  );
  assert.equal((await h.request("/api/admin/Order")).status, 401);
});
test("reject tampered options, quantities, unavailable products, unknown IDs and closed hours", async (t) => {
  const h = await harness(t);
  for (const line of [
    { qty: 0 },
    { qty: 1.5 },
    { qty: 51 },
    { size: "Fake" },
    { size: null },
    { extras: ["Fake"] },
    { extras: ["Extra ost", "Extra ost"] },
    { itemId: "missing" },
  ]) {
    const input = h.order();
    Object.assign(input.items[0], line);
    const res = await h.request("/api/orders", { method: "POST", body: input });
    assert.ok([400, 409].includes(res.status), JSON.stringify(res));
  }
  const cookie = await h.login();
  await h.request(`/api/admin/MenuItem/${h.product.id}`, {
    method: "PATCH",
    cookie,
    body: { soldOut: true },
  });
  assert.equal(
    (await h.request("/api/orders", { method: "POST", body: h.order() }))
      .status,
    409,
  );
  await h.request(`/api/admin/MenuItem/${h.product.id}`, {
    method: "PATCH",
    cookie,
    body: { soldOut: false },
  });
  await h.request("/api/admin/RestaurantSettings/restaurant", {
    method: "PATCH",
    cookie,
    body: { openingHours: [] },
  });
  assert.equal(
    (await h.request("/api/orders", { method: "POST", body: h.order() }))
      .status,
    409,
  );
});
test("delivery zones, minimum amount, fee and free delivery are server validated", async (t) => {
  const h = await harness(t);
  const input = h.order({
    orderType: "delivery",
    deliveryAddress: { street: "Testgatan 1", postal: "241 30", city: "Eslöv" },
    items: [{ itemId: h.product.id, qty: 2, size: "Normal", extras: [] }],
  });
  const response = await h.request("/api/orders", {
    method: "POST",
    body: input,
  });
  assert.equal(response.status, 201);
  let row = JSON.parse(
    h.db
      .prepare("SELECT data FROM orders WHERE id = ?")
      .get(response.data.orderId).data,
  );
  assert.equal(row.deliveryFee, 39);
  assert.equal(row.totalMinor, 25900);
  const bad = h.order({
    ...input,
    idempotencyKey: crypto.randomUUID(),
    deliveryAddress: { street: "Test", postal: "99999", city: "Other" },
  });
  assert.equal(
    (await h.request("/api/orders", { method: "POST", body: bad })).status,
    400,
  );
  const low = h.order({
    ...input,
    idempotencyKey: crypto.randomUUID(),
    items: [{ itemId: h.product.id, qty: 1, size: "Normal" }],
  });
  assert.equal(
    (await h.request("/api/orders", { method: "POST", body: low })).status,
    400,
  );
  const free = await h.request("/api/orders", {
    method: "POST",
    body: h.order({
      ...input,
      idempotencyKey: crypto.randomUUID(),
      items: [{ itemId: h.product.id, qty: 4, size: "Normal" }],
    }),
  });
  row = JSON.parse(
    h.db.prepare("SELECT data FROM orders WHERE id = ?").get(free.data.orderId)
      .data,
  );
  assert.equal(row.deliveryFee, 0);
});
test("offers have dates/conditions and discounts are calculated on server", async (t) => {
  const h = await harness(t);
  const cookie = await h.login();
  const offer = await h.request("/api/admin/Offer", {
    method: "POST",
    cookie,
    body: {
      name: "TEST offer",
      code: "TEST10",
      percent: 10,
      minOrder: 100,
      active: true,
      startsAt: "2020-01-01T00:00:00.000Z",
      endsAt: "2099-01-01T00:00:00.000Z",
    },
  });
  assert.equal(offer.status, 201);
  const res = await h.request("/api/orders", {
    method: "POST",
    body: h.order({ offerCode: "TEST10" }),
  });
  assert.equal(res.status, 201);
  assert.equal(
    JSON.parse(
      h.db.prepare("SELECT data FROM orders WHERE id = ?").get(res.data.orderId)
        .data,
    ).totalMinor,
    9900,
  );
  assert.equal(
    (
      await h.request("/api/orders", {
        method: "POST",
        body: h.order({ offerCode: "FAKE" }),
      })
    ).status,
    400,
  );
});
test("order dashboard updates are restricted, persist and never forge online payment", async (t) => {
  const h = await harness(t);
  const created = await h.request("/api/orders", {
    method: "POST",
    body: h.order(),
  });
  const cookie = await h.login();
  const path = `/api/admin/Order/${created.data.orderId}`;
  assert.equal(
    (
      await h.request(path, {
        method: "PATCH",
        cookie,
        body: { status: "completed" },
      })
    ).status,
    409,
  );
  for (const status of ["accepted", "preparing", "ready", "completed"])
    assert.equal(
      (await h.request(path, { method: "PATCH", cookie, body: { status } }))
        .data.status,
      status,
    );
  assert.equal(
    (
      await h.request(path, {
        method: "PATCH",
        cookie,
        body: { paymentStatus: "paid" },
      })
    ).status,
    200,
  );
  assert.equal(
    (await h.request(path, { method: "PATCH", cookie, body: { total: 1 } }))
      .status,
    400,
  );
  assert.equal(
    (await h.request("/api/admin/Order", { cookie })).data[0].status,
    "completed",
  );
  assert.equal(
    (
      await h.request("/api/refund", {
        method: "POST",
        body: { orderId: created.data.orderId },
      })
    ).status,
    401,
  );
});
test("Swedish opening hours respect Stockholm timezone and overnight sessions", () => {
  const hours = [
    { day: 5, open: "10:00", close: "02:00", closesNextDay: true },
  ];
  assert.equal(isOpen(hours, new Date("2026-11-14T00:30:00Z")), true);
  assert.equal(isOpen(hours, new Date("2026-11-14T02:00:00Z")), false);
  assert.equal(isOpen([], new Date()), false);
});

test('frontend opening status uses Stockholm time and DST independently of visitor timezone',async()=>{
 const {getStatusNow}=await import('../src/lib/openingHours.js');
 const hours=[{day:1,open:'10:00',close:'20:00',closesNextDay:false}];
 assert.equal(getStatusNow(hours,new Date('2026-11-16T09:30:00Z')).open,true);
 assert.equal(getStatusNow(hours,new Date('2026-11-16T08:30:00Z')).nextChange.toISOString(),'2026-11-16T09:00:00.000Z');
 assert.equal(getStatusNow(hours,new Date('2026-07-06T07:30:00Z')).nextChange.toISOString(),'2026-07-06T08:00:00.000Z');
});
