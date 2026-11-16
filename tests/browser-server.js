import { openDatabase } from "../server/db.js";
import { createApp } from "../server/app.js";
import { fixture } from "./helpers.js";
const db = openDatabase(":memory:");
fixture(db);
const app = createApp({
  db,
  origin: "http://127.0.0.1:4173",
  uploadDir: "/tmp/oster-browser-uploads",
  serveFrontend: true,
});
app.listen(4173, "127.0.0.1", () =>
  console.log("Browser test server ready. TEST fixtures only."),
);
