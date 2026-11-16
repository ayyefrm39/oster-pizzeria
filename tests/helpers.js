import { randomUUID } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { openDatabase } from "../server/db.js";
import { createApp } from "../server/app.js";
import { saveEntity, initializeSettings } from "../server/catalog.js";
import { hashPassword } from "../server/security.js";
export function fixture(db) {
  initializeSettings(db);
  saveEntity(
    db,
    "RestaurantSettings",
    "restaurant",
    {
      ordersPaused: false,
      deliveryEnabled: true,
      openingHours: [0, 1, 2, 3, 4, 5, 6].map((day) => ({
        day,
        open: "00:00",
        close: "00:00",
        closesNextDay: true,
      })),
    },
    true,
  );
  const category = saveEntity(db, "MenuCategory", null, {
    name: "TEST – kategori",
    sortOrder: 0,
  });
  const product = saveEntity(db, "MenuItem", null, {
    name: "TEST – pizza",
    categoryId: category.id,
    price: 110,
    optionGroups: [
      {
        id: "size",
        name: "Storlek",
        type: "size",
        required: true,
        options: [
          { name: "Normal", price: 0 },
          { name: "Familj", price: 80 },
        ],
      },
      {
        id: "extras",
        name: "Tillval",
        type: "extras",
        multiple: true,
        options: [{ name: "Extra ost", price: 10 }],
      },
    ],
  });
  const zone = saveEntity(db, "DeliveryZone", null, {
    name: "TEST – zon",
    postalCodes: ["241"],
    deliveryFee: 39,
    minOrder: 150,
  });
  db.prepare("INSERT INTO admins VALUES (?,?,?,?)").run(
    "test-admin",
    "admin@example.test",
    hashPassword("test-password-only-123"),
    new Date().toISOString(),
  );
  return { category, product, zone };
}
export async function harness(t, gateway = null) {
  const db = openDatabase(":memory:");
  const data = fixture(db);
  const dir = mkdtempSync(join(tmpdir(), "oster-test-"));
  const app = createApp({
    db,
    gateway,
    origin: "http://test.local",
    uploadDir: dir,
  });
  const server = await new Promise((resolve) => {
    const s = app.listen(0, "127.0.0.1", () => resolve(s));
  });
  t.after(async () => {
    await new Promise((resolve) => server.close(resolve));
    db.close();
    rmSync(dir, { recursive: true, force: true });
  });
  const url = `http://127.0.0.1:${server.address().port}`;
  async function request(
    path,
    {
      method = "GET",
      body,
      cookie,
      origin = "http://test.local",
      headers = {},
    } = {},
  ) {
    const res = await fetch(url + path, {
      method,
      headers: {
        ...(body ? { "Content-Type": "application/json" } : {}),
        Origin: origin,
        ...(cookie ? { Cookie: cookie } : {}),
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json();
    return {
      status: res.status,
      data,
      cookie: res.headers.get("set-cookie")?.split(";")[0],
      headers: res.headers,
    };
  }
  async function login() {
    return (
      await request("/api/auth/login", {
        method: "POST",
        body: {
          email: "admin@example.test",
          password: "test-password-only-123",
        },
      })
    ).cookie;
  }
  const order = (patch) => ({
    idempotencyKey: randomUUID(),
    orderType: "pickup",
    customer: { name: "Testkund", phone: "0701234567" },
    items: [{ itemId: data.product.id, qty: 1, size: "Normal", extras: [] }],
    paymentMethod: "cash",
    ...patch,
  });
  return { db, ...data, request, login, order, url };
}
