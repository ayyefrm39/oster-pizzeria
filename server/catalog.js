import { randomUUID } from "node:crypto";
import { schemas, minor } from "./validation.js";
import { requireThat } from "./security.js";
import { rowData, listData } from "./orders.js";
import { transaction } from "./db.js";
export const tables = {
  MenuCategory: "categories",
  MenuItem: "products",
  RestaurantSettings: "settings",
  DeliveryZone: "delivery_zones",
  Offer: "offers",
};
export function saveEntity(db, entity, id, input, patch = false) {
  const table = tables[entity];
  requireThat(table, "Okänd resurs.", 404);
  const previous =
    id && rowData(db.prepare(`SELECT data FROM ${table} WHERE id = ?`).get(id));
  if (patch) requireThat(previous, "Resursen hittades inte.", 404);
  requireThat(
    entity !== "RestaurantSettings" || id === "restaurant",
    "Inställningar finns redan.",
    409,
  );
  const schema = schemas[entity];
  const data = schema.parse({ ...previous, ...input });
  const value = {
    ...data,
    id: id || randomUUID(),
    created_date: previous?.created_date || new Date().toISOString(),
  };
  transaction(db, () => {
    if (entity === "MenuItem") {
      requireThat(
        db
          .prepare("SELECT 1 FROM categories WHERE id = ?")
          .get(value.categoryId),
        "Kategorin saknas.",
      );
      value.optionGroups = value.optionGroups.filter(
        (g) => g.id !== "family-size",
      );
      requireThat(
        value.optionGroups.filter((g) => g.type === "size").length <= 1,
        "Endast en storleksgrupp är tillåten.",
      );
      if (
        !value.optionGroups.some((g) => g.type === "size") &&
        value.familyPrice > value.price
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
      requireThat(
        new Set(value.optionGroups.map((g) => g.id)).size ===
          value.optionGroups.length,
        "Dubbla tillvalsgrupper.",
      );
      const names = value.optionGroups.flatMap((g) =>
        g.options.map((o) => o.name),
      );
      requireThat(
        new Set(names).size === names.length,
        "Tillvalsnamn måste vara unika inom produkten.",
      );
      db.prepare(
        "INSERT INTO products VALUES (?,?,?,?) ON CONFLICT(id) DO UPDATE SET category_id=excluded.category_id,price_minor=excluded.price_minor,data=excluded.data",
      ).run(
        value.id,
        value.categoryId,
        minor(value.price),
        JSON.stringify(value),
      );
      db.prepare("DELETE FROM option_groups WHERE product_id = ?").run(
        value.id,
      );
      for (const group of value.optionGroups) {
        const groupId = `${value.id}:${group.id}`;
        db.prepare("INSERT INTO option_groups VALUES (?,?,?)").run(
          groupId,
          value.id,
          JSON.stringify(group),
        );
        for (const option of group.options)
          db.prepare("INSERT INTO product_options VALUES (?,?,?,?)").run(
            randomUUID(),
            groupId,
            minor(option.price),
            JSON.stringify(option),
          );
      }
    } else {
      if (entity === "Offer")
        requireThat(
          !listData(db, table).some(
            (o) => o.code === value.code && o.id !== value.id,
          ),
          "Erbjudandekoden finns redan.",
          409,
        );
      db.prepare(
        `INSERT INTO ${table} VALUES (?,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data`,
      ).run(value.id, JSON.stringify(value));
    }
  });
  return value;
}
export function archiveEntity(db, entity, id) {
  requireThat(
    entity !== "RestaurantSettings",
    "Inställningar kan inte tas bort.",
  );
  if (entity === "MenuCategory")
    requireThat(
      !listData(db, "products").some((p) => p.categoryId === id && p.active),
      "Dölj eller flytta kategorins produkter först.",
      409,
    );
  return saveEntity(db, entity, id, { active: false }, true);
}
export function initializeSettings(db) {
  // Source defaults, paused until the owner has reviewed menu and opening hours.
  if (db.prepare("SELECT 1 FROM settings").get()) return;
  saveEntity(db, "RestaurantSettings", "restaurant", {
    restaurantName: "Öster Pizzeria",
    address: "Södergatan 20, 241 30 Eslöv",
    phone: "076-963 62 22",
    openingHours: [1, 2, 3, 4, 5, 6, 0].map((day) => ({
      day,
      open: "10:00",
      close: [5, 6].includes(day) ? "02:00" : day === 0 ? "22:00" : "20:00",
      closesNextDay: [5, 6].includes(day),
    })),
    deliveryEnabled: false,
    pickupEnabled: true,
    deliveryFee: 39,
    minDeliveryOrder: 150,
    freeDeliveryThreshold: 400,
    estimatedPrepTime: 25,
    acceptPreOrders: false,
    ordersPaused: true,
    deliveryAreas: "",
  });
}
