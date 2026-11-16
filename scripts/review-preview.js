// Local visual review only: isolated test data, no Stripe gateway and no production database.
import { randomUUID } from "node:crypto";
import { mkdtempSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { openDatabase } from "../server/db.js";
import { createApp } from "../server/app.js";
import { createOrder } from "../server/orders.js";
import { fixture } from "../tests/helpers.js";
if (!existsSync("dist/index.html"))
  throw new Error("Run npm run build before starting the review preview.");
const db = openDatabase(":memory:");
const { product } = fixture(db);
createOrder(db, {
  idempotencyKey: randomUUID(),
  orderType: "pickup",
  customer: { name: "TEST – visningsbeställning", phone: "0700000000" },
  items: [{ itemId: product.id, qty: 2, size: "Normal", extras: [] }],
  paymentMethod: "cash",
  customerNotes: "Endast testdata för visuell granskning.",
});
const uploadDir = mkdtempSync(join(tmpdir(), "oster-review-uploads-"));
const app = createApp({
  db,
  gateway: null,
  origin: "http://127.0.0.1:4173",
  uploadDir,
  serveFrontend: true,
});
const server = app.listen(4173, "127.0.0.1", () =>
  console.log(
    "Local review ready on 127.0.0.1:4173. TEST data only; online payments disabled.",
  ),
);
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () =>
    server.close(() => {
      db.close();
      rmSync(uploadDir, { recursive: true, force: true });
      process.exit(0);
    }),
  );
