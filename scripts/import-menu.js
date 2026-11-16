import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { openDatabase, transaction } from "../server/db.js";
import { saveEntity } from "../server/catalog.js";
import { schemas } from "../server/validation.js";
import { requireThat } from "../server/security.js";
export function importMenu(db, data, { apply = false } = {}) {
  requireThat(
    Array.isArray(data.categories) && Array.isArray(data.products),
    "Import requires categories and products arrays.",
  );
  const ids = new Set();
  for (const c of data.categories) {
    schemas.MenuCategory.parse(c);
    requireThat(
      typeof c.id === "string" && c.id.length > 0 && !ids.has(c.id),
      "Invalid/duplicate category ID.",
    );
    ids.add(c.id);
  }
  const products = new Set();
  for (const p of data.products) {
    schemas.MenuItem.parse(p);
    requireThat(
      typeof p.id === "string" && p.id.length > 0 && !products.has(p.id),
      "Invalid/duplicate product ID.",
    );
    products.add(p.id);
    requireThat(ids.has(p.categoryId), "Unknown category.");
  }
  if (!apply)
    return {
      dryRun: true,
      categories: ids.size,
      products: products.size,
      reviewed: data.reviewed === true,
    };
  requireThat(
    data.reviewed === true,
    "Import is not reviewed; confirm original prices, descriptions, images and completeness first.",
  );
  // Validate in an isolated database before a single atomic application transaction.
  const check = openDatabase(":memory:");
  try {
    for (const c of data.categories) saveEntity(check, "MenuCategory", c.id, c);
    for (const p of data.products) saveEntity(check, "MenuItem", p.id, p);
  } finally {
    check.close();
  }
  transaction(db, () => {
    // saveEntity uses transactions; use savepoints for this import's nested calls.
    for (const c of data.categories) {
      requireThat(
        !db.prepare("SELECT 1 FROM categories WHERE id=?").get(c.id),
        "Existing category would be overwritten.",
      );
      const value = {
        ...schemas.MenuCategory.parse(c),
        id: c.id,
        created_date: c.created_date || new Date().toISOString(),
      };
      db.prepare(
        "INSERT INTO categories VALUES (?,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data",
      ).run(c.id, JSON.stringify(value));
    }
    for (const p of data.products) {
      // Fail safely if an import would overwrite operational edits. New imports are insert-only.
      requireThat(
        !db.prepare("SELECT 1 FROM products WHERE id = ?").get(p.id),
        "Existing product would be overwritten; review/update through admin instead.",
      );
      const value = {
        ...schemas.MenuItem.parse(p),
        id: p.id,
        created_date: p.created_date || new Date().toISOString(),
      };
      if (
        value.familyPrice > value.price &&
        !value.optionGroups.some((g) => g.type === "size")
      )
        value.optionGroups.push({
          id: "family-size",
          name: "Storlek",
          type: "size",
          required: true,
          multiple: false,
          options: [
            { name: "Normal", price: 0 },
            {
              name: "Familj",
              price: Math.round((value.familyPrice - value.price) * 100) / 100,
            },
          ],
        });
      db.prepare("INSERT INTO products VALUES (?,?,?,?)").run(
        p.id,
        p.categoryId,
        Math.round(p.price * 100),
        JSON.stringify(value),
      );
      for (const g of value.optionGroups) {
        const groupId = `${p.id}:${g.id}`;
        db.prepare("INSERT INTO option_groups VALUES (?,?,?)").run(
          groupId,
          p.id,
          JSON.stringify(g),
        );
        for (const [i, o] of g.options.entries())
          db.prepare("INSERT INTO product_options VALUES (?,?,?,?)").run(
            `${groupId}:${i}`,
            groupId,
            Math.round(o.price * 100),
            JSON.stringify(o),
          );
      }
    }
  });
  return { applied: true, categories: ids.size, products: products.size };
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const file = process.argv[2];
  if (!file)
    throw new Error(
      "Usage: npm run data:import -- menu.json [--apply]. Default: validate/dry run.",
    );
  const db = openDatabase();
  try {
    console.log(
      importMenu(db, JSON.parse(readFileSync(file, "utf8")), {
        apply: process.argv.includes("--apply"),
      }),
    );
  } finally {
    db.close();
  }
}
