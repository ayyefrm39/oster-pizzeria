import { z } from "zod";
const text = z.string().trim().max(300);
const money = z
  .number()
  .finite()
  .min(0)
  .max(100000)
  .refine(
    (n) => Math.abs(n * 100 - Math.round(n * 100)) < 0.000001,
    "Högst två decimaler",
  );
const option = z.object({ name: text.min(1), price: money.default(0) });
const group = z.object({
  id: text.min(1),
  name: text.min(1),
  type: z.enum(["size", "extras", "remove", "sauces"]),
  required: z.boolean().default(false),
  multiple: z.boolean().default(false),
  options: z.array(option).min(1).max(100),
});
const hour = z.object({
  day: z.number().int().min(0).max(6),
  open: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  close: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  closesNextDay: z.boolean(),
});
export const schemas = {
  MenuCategory: z.object({
    translatedNames: z.record(z.string(), z.string().max(300)).optional(),
    name: text.min(1),
    description: text.default(""),
    active: z.boolean().default(true),
    sortOrder: z.number().int().min(0).default(0),
  }),
  MenuItem: z.object({
    translatedNames: z.record(z.string(), z.string().max(300)).optional(),
    translatedDescriptions: z
      .record(z.string(), z.string().max(3000))
      .optional(),
    allergens: z.array(z.string().max(100)).max(50).optional(),
    name: text.min(1),
    description: z.string().max(3000).default(""),
    categoryId: text.min(1),
    price: money,
    familyPrice: money.optional(),
    image: z
      .string()
      .max(1000)
      .refine(
        (s) =>
          !s ||
          /^\/uploads\/[a-f0-9-]+\.(png|jpg|webp)$/.test(s) ||
          /^https:\/\//.test(s),
        "Använd HTTPS eller en uppladdad bild",
      )
      .default(""),
    popular: z.boolean().default(false),
    active: z.boolean().default(true),
    soldOut: z.boolean().default(false),
    optionGroups: z.array(group).max(20).default([]),
  }),
  RestaurantSettings: z.object({
    privacyPolicy: z.string().max(8000).default(""),
    cookieInfo: z.string().max(8000).default(""),
    allergenInfo: z.string().max(8000).default(""),
    restaurantName: text.min(1),
    address: text,
    phone: text,
    openingHours: z
      .array(hour)
      .max(7)
      .refine((a) => new Set(a.map((h) => h.day)).size === a.length),
    deliveryEnabled: z.boolean(),
    pickupEnabled: z.boolean(),
    deliveryFee: money,
    minDeliveryOrder: money,
    freeDeliveryThreshold: money,
    estimatedPrepTime: z.number().int().min(1).max(240),
    acceptPreOrders: z.boolean(),
    ordersPaused: z.boolean(),
    deliveryAreas: text,
  }),
  DeliveryZone: z.object({
    name: text.min(1),
    postalCodes: z
      .array(z.string().regex(/^\d{3}(\d{2})?$/))
      .min(1)
      .max(200),
    deliveryFee: money,
    minOrder: money,
    active: z.boolean().default(true),
  }),
  Offer: z
    .object({
      name: text.min(1),
      code: z
        .string()
        .trim()
        .toUpperCase()
        .regex(/^[A-Z0-9_-]{3,30}$/),
      percent: z.number().int().min(1).max(100),
      minOrder: money,
      active: z.boolean(),
      startsAt: z.string().datetime(),
      endsAt: z.string().datetime(),
    })
    .refine((o) => o.endsAt > o.startsAt, "Sluttid måste vara efter starttid"),
};
export const orderSchema = z.object({
  expectedTotalMinor: z.number().int().positive().optional(),
  idempotencyKey: z.string().uuid(),
  orderType: z.enum(["pickup", "delivery"]),
  customer: z.object({
    name: text.min(1).max(80),
    phone: z
      .string()
      .trim()
      .regex(/^[+\d ()-]{6,30}$/),
  }),
  deliveryAddress: z
    .object({
      street: text,
      postal: text,
      city: text,
      apartment: text.optional(),
      floor: text.optional(),
      instructions: text.optional(),
    })
    .optional(),
  items: z
    .array(
      z.object({
        itemId: text.min(1),
        qty: z.number().int().min(1).max(50),
        size: text.nullable().optional(),
        extras: z.array(text).max(30).default([]),
        notes: text.default(""),
      }),
    )
    .min(1)
    .max(50),
  paymentMethod: z.enum(["cash", "stripe"]),
  customerNotes: text.default(""),
  scheduledFor: z.string().max(40).default(""),
  offerCode: z.string().max(30).optional(),
});
export const minor = (value) => Math.round(value * 100);
