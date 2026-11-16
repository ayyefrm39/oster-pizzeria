import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { openDatabase } from "../server/db.js";
import { importMenu } from "../scripts/import-menu.js";
test("review excerpt cannot silently populate production; reviewed import is atomic and insert-only", () => {
  const db = openDatabase(":memory:");
  try {
    const data = JSON.parse(readFileSync("docs/menu-review.json", "utf8"));
    assert.equal(importMenu(db, data).products, 6);
    assert.throws(() => importMenu(db, data, { apply: true }));
    assert.equal(db.prepare("SELECT COUNT(*) AS n FROM products").get().n, 0);
    const reviewed = { ...data, reviewed: true };
    assert.equal(importMenu(db, reviewed, { apply: true }).products, 6);
    assert.throws(() => importMenu(db, reviewed, { apply: true }));
    assert.equal(db.prepare("SELECT COUNT(*) AS n FROM products").get().n, 6);
    const invalid = {
      reviewed: true,
      categories: [{ id: "new", name: "Test" }],
      products: [{ id: "bad", name: "Bad", categoryId: "missing", price: 1 }],
    };
    assert.throws(() => importMenu(db, invalid, { apply: true }));
    assert.equal(
      db.prepare("SELECT 1 FROM categories WHERE id=?").get("new"),
      undefined,
    );
  } finally {
    db.close();
  }
});
