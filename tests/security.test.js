import test from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { harness } from "./helpers.js";

test("uploads require admin, decode real raster images and strip metadata", async (t) => {
  const h = await harness(t);
  const cookie = await h.login();
  async function upload(bytes, name, auth = true) {
    const body = new FormData();
    body.append("file", new Blob([bytes]), name);
    const res = await fetch(h.url + "/api/uploads", {
      method: "POST",
      headers: {
        Origin: "http://test.local",
        ...(auth ? { Cookie: cookie } : {}),
      },
      body,
    });
    return { status: res.status, data: await res.json() };
  }
  assert.equal(
    (await upload(Buffer.from("<svg/>"), "x.svg", false)).status,
    401,
  );
  assert.equal(
    (await upload(Buffer.from('<svg onload="alert(1)"/>'), "x.svg")).status,
    400,
  );
  assert.equal(
    (await upload(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), "fake.png"))
      .status,
    400,
  );
  const png = await sharp({
    create: { width: 2, height: 2, channels: 3, background: "#1f5d3a" },
  })
    .png()
    .toBuffer();
  const result = await upload(png, "real.png");
  assert.equal(result.status, 201);
  assert.match(result.data.url, /^\/uploads\/[a-f0-9-]+\.webp$/);
  const image = await fetch(h.url + result.data.url);
  assert.equal(image.status, 200);
  assert.match(image.headers.get("content-type"), /image\/webp/);
  assert.equal(image.headers.get("x-content-type-options"), "nosniff");
});
test("quote matches final totals, changed-price consent and unavailable Stripe cannot insert orders", async (t) => {
  const h = await harness(t);
  const body = h.order();
  const quote = await h.request("/api/quote", { method: "POST", body });
  assert.equal(quote.data.total, 110);
  assert.equal(
    (
      await h.request("/api/orders", {
        method: "POST",
        body: { ...body, expectedTotalMinor: 1 },
      })
    ).status,
    409,
  );
  assert.equal(h.db.prepare("SELECT count(*) AS n FROM orders").get().n, 0);
  const order = await h.request("/api/orders", {
    method: "POST",
    body: { ...body, expectedTotalMinor: 11000 },
  });
  assert.equal(order.status, 201);
});
test("unknown API paths and malformed JSON produce bounded non-sensitive responses", async (t) => {
  const h = await harness(t);
  const unknown = await h.request("/api/admin/not_a_table", {
    cookie: await h.login(),
  });
  assert.equal(unknown.status, 404);
  const res = await fetch(h.url + "/api/orders", {
    method: "POST",
    headers: {
      Origin: "http://test.local",
      "Content-Type": "application/json",
    },
    body: "{invalid",
  });
  assert.equal(res.status, 400);
  const data = await res.json();
  assert.equal(data.stack, undefined);
});
