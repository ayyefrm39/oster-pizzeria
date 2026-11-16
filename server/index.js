import { openDatabase } from "./db.js";
import { createApp } from "./app.js";
import { paymentGateway } from "./payments.js";
const production = process.env.NODE_ENV === "production";
if (
  production &&
  (!process.env.APP_ORIGIN?.startsWith("https://") ||
    !process.env.DATABASE_PATH)
)
  throw new Error(
    "Production requires HTTPS APP_ORIGIN and persistent DATABASE_PATH",
  );
const db = openDatabase();
const app = createApp({
  db,
  gateway: paymentGateway(),
  origin: process.env.APP_ORIGIN || "http://localhost:5173",
  production,
  uploadDir: process.env.UPLOAD_DIR || "data/uploads",
  serveFrontend: true,
});
const server = app.listen(Number(process.env.PORT || 3001), "0.0.0.0", () =>
  console.log("Öster API listening on port", server.address().port),
);
for (const signal of ["SIGTERM", "SIGINT"])
  process.on(signal, () =>
    server.close(() => {
      db.close();
      process.exit(0);
    }),
  );
