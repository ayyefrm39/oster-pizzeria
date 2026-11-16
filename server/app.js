import express from "express";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import multer from "multer";
import sharp from "sharp";
import { randomUUID } from "node:crypto";
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { z } from "zod";
import {
  ApiError,
  requireThat,
  hash,
  token,
  verifyPassword,
} from "./security.js";
import {
  listData,
  rowData,
  createOrder,
  getTrackedOrder,
  updateOrder,
  priceOrder,
} from "./orders.js";
import { orderSchema } from "./validation.js";
import {
  initializeSettings,
  tables,
  saveEntity,
  archiveEntity,
} from "./catalog.js";
import { checkout, processEvent, refund } from "./payments.js";

const transitions = {
  pending: ["accepted", "rejected", "cancelled"],
  accepted: ["preparing", "ready", "cancelled"],
  preparing: ["ready", "cancelled"],
  ready: ["out_for_delivery", "completed", "cancelled"],
  out_for_delivery: ["completed"],
  completed: [],
  rejected: [],
  cancelled: [],
};
export function createApp({
  db,
  gateway = null,
  origin = "http://localhost:5173",
  production = false,
  uploadDir = "data/uploads",
  serveFrontend = false,
}) {
  const app = express();
  app.disable("x-powered-by");
  if (process.env.TRUST_PROXY === "1") app.set("trust proxy", 1);
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: [
            "'self'",
            "'unsafe-inline'",
            "https://fonts.googleapis.com",
          ],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'"],
          upgradeInsecureRequests: production ? [] : null,
        },
      },
      crossOriginEmbedderPolicy: false,
    }),
  );
  app.use("/api", (req, res, next) => {
    res.set("Cache-Control", "no-store");
    res.set("Referrer-Policy", "no-referrer");
    next();
  });
  app.use(
    "/api",
    rateLimit({
      windowMs: 60000,
      limit: 300,
      standardHeaders: "draft-7",
      legacyHeaders: false,
    }),
  );
  app.post(
    "/api/payments/webhook",
    express.raw({ type: "application/json", limit: "256kb" }),
    (req, res, next) => {
      try {
        requireThat(gateway, "Stripe är inte konfigurerat.", 503);
        let event;
        try {
          event = gateway.verify(req.body, req.get("stripe-signature"));
        } catch (e) {
          if (e.status === 503) throw e;
          throw new ApiError(400, "Ogiltig webhook-signatur.");
        }
        res.json(processEvent(db, event));
      } catch (e) {
        next(e);
      }
    },
  );
  app.use(express.json({ limit: "128kb" }));
  app.use("/api", (req, res, next) => {
    if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
    // All browser writes must originate from the configured same-origin site.
    if (req.get("origin") !== origin)
      return next(new ApiError(403, "Otillåtet ursprung."));
    next();
  });
  const auth = (req, res, next) => {
    const raw = req.headers.cookie
      ?.split(";")
      .map((s) => s.trim())
      .find((s) => s.startsWith("oster_session="))
      ?.slice(14);
    const session =
      raw &&
      db
        .prepare(
          "SELECT admins.id,admins.email FROM sessions JOIN admins ON admins.id = sessions.admin_id WHERE token_hash = ? AND expires_at > ?",
        )
        .get(hash(raw), Date.now());
    if (!session) return next(new ApiError(401, "Logga in som administratör."));
    req.admin = session;
    next();
  };
  const audit = (req, action, id) =>
    db
      .prepare(
        "INSERT INTO audit_log(actor,action,target_id,created_at) VALUES (?,?,?,?)",
      )
      .run(req.admin.id, action, id, new Date().toISOString());
  initializeSettings(db);
  app.get("/api/health", (req, res) => {
    db.prepare("SELECT 1").get();
    res.json({ ok: true });
  });
  const loginLimiter = rateLimit({
    windowMs: 15 * 60000,
    limit: 10,
    standardHeaders: "draft-7",
    legacyHeaders: false,
  });
  app.post("/api/auth/login", loginLimiter, (req, res, next) => {
    try {
      const input = z
        .object({
          email: z.string().email().max(254),
          password: z.string().min(1).max(200),
        })
        .parse(req.body);
      const admin = db
        .prepare("SELECT * FROM admins WHERE email = ?")
        .get(input.email.toLowerCase());
      // Constant-cost password verification also for unknown accounts.
      const fallback = "00000000000000000000000000000000:" + "00".repeat(64);
      requireThat(
        verifyPassword(input.password, admin?.password_hash || fallback) &&
          admin,
        "Fel e-postadress eller lösenord.",
        401,
      );
      const session = token();
      db.prepare("DELETE FROM sessions WHERE expires_at <= ?").run(Date.now());
      db.prepare("INSERT INTO sessions VALUES (?,?,?)").run(
        hash(session),
        admin.id,
        Date.now() + 8 * 3600000,
      );
      res.cookie("oster_session", session, {
        httpOnly: true,
        secure: production,
        sameSite: "strict",
        path: "/",
        maxAge: 8 * 3600000,
      });
      res.json({ id: admin.id, email: admin.email, role: "admin" });
    } catch (e) {
      next(e);
    }
  });
  app.get("/api/auth/me", auth, (req, res) =>
    res.json({ ...req.admin, role: "admin" }),
  );
  app.post("/api/auth/logout", (req, res) => {
    const cookie = req.headers.cookie
      ?.split(";")
      .map((s) => s.trim())
      .find((s) => s.startsWith("oster_session="))
      ?.slice(14);
    if (cookie)
      db.prepare("DELETE FROM sessions WHERE token_hash = ?").run(hash(cookie));
    res.clearCookie("oster_session", {
      httpOnly: true,
      secure: production,
      sameSite: "strict",
      path: "/",
    });
    res.json({ ok: true });
  });
  app.get("/api/public/config", (req, res) =>
    res.json({ name: "Öster Pizzeria", onlinePaymentEnabled: !!gateway }),
  );
  app.get("/api/catalog/:entity", (req, res, next) => {
    try {
      const entity = req.params.entity;
      requireThat(
        [
          "MenuCategory",
          "MenuItem",
          "RestaurantSettings",
          "DeliveryZone",
          "Offer",
        ].includes(entity),
        "Okänd resurs.",
        404,
      );
      let rows = listData(db, tables[entity]);
      if (entity !== "RestaurantSettings") rows = rows.filter((r) => r.active);
      if (entity === "MenuItem") {
        const visible = new Set(
          listData(db, "categories")
            .filter((c) => c.active)
            .map((c) => c.id),
        );
        rows = rows.filter((r) => visible.has(r.categoryId));
      }
      if (entity === "Offer")
        rows = rows.map(({ id, name, startsAt, endsAt }) => ({
          id,
          name,
          startsAt,
          endsAt,
        }));
      res.json(rows);
    } catch (e) {
      next(e);
    }
  });
  app.get("/api/admin/:entity", auth, (req, res, next) => {
    try {
      const table =
        req.params.entity === "Order" ? "orders" : tables[req.params.entity];
      requireThat(table, "Okänd resurs.", 404);
      res.json(listData(db, table));
    } catch (e) {
      next(e);
    }
  });
  app.post("/api/admin/:entity", auth, (req, res, next) => {
    try {
      const value = saveEntity(db, req.params.entity, null, req.body);
      audit(req, "create:" + req.params.entity, value.id);
      res.status(201).json(value);
    } catch (e) {
      next(e);
    }
  });
  app.patch("/api/admin/:entity/:id", auth, (req, res, next) => {
    try {
      const { entity, id } = req.params;
      let value;
      if (entity === "Order") {
        value = rowData(
          db.prepare("SELECT data FROM orders WHERE id = ?").get(id),
        );
        requireThat(value, "Beställningen saknas.", 404);
        const patch = z
          .object({
            status: z.enum(Object.keys(transitions)).optional(),
            estimatedReadyTime: z.number().int().min(1).max(240).optional(),
            paymentStatus: z.literal("paid").optional(),
            paidAt: z.string().datetime().optional(),
          })
          .strict()
          .parse(req.body);
        if (patch.status && patch.status !== value.status)
          requireThat(
            transitions[value.status].includes(patch.status),
            "Otillåten statusändring.",
            409,
          );
        if (patch.paymentStatus)
          requireThat(
            value.paymentMethod === "cash" && value.paymentStatus === "unpaid",
            "Onlinebetalningar kan endast bekräftas av betalningsleverantören.",
            409,
          );
        value = { ...value, ...patch };
        updateOrder(db, value);
      } else value = saveEntity(db, entity, id, req.body, true);
      audit(req, "update:" + entity, id);
      res.json(value);
    } catch (e) {
      next(e);
    }
  });
  app.delete("/api/admin/:entity/:id", auth, (req, res, next) => {
    try {
      const value = archiveEntity(db, req.params.entity, req.params.id);
      audit(req, "archive:" + req.params.entity, req.params.id);
      res.json(value);
    } catch (e) {
      next(e);
    }
  });
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024, files: 1, fields: 0 },
  });
  mkdirSync(uploadDir, { recursive: true, mode: 0o700 });
  app.post(
    "/api/uploads",
    auth,
    upload.single("file"),
    async (req, res, next) => {
      try {
        const b = req.file?.buffer;
        requireThat(b, "Välj en bild.");
        let ext;
        if (
          b
            .subarray(0, 8)
            .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
        )
          ext = "png";
        else if (b[0] === 255 && b[1] === 216 && b[2] === 255) ext = "jpg";
        else if (
          b.toString("ascii", 0, 4) === "RIFF" &&
          b.toString("ascii", 8, 12) === "WEBP"
        )
          ext = "webp";
        requireThat(ext, "Endast PNG, JPEG och WebP är tillåtna.");
        let image;
        try {
          image = await sharp(b, { limitInputPixels: 20000000 })
            .rotate()
            .resize({
              width: 1600,
              height: 1600,
              fit: "inside",
              withoutEnlargement: true,
            })
            .webp({ quality: 85 })
            .toBuffer();
        } catch {
          throw new ApiError(400, "Bilden är skadad eller för stor.");
        }
        const name = `${randomUUID()}.webp`;
        writeFileSync(resolve(uploadDir, name), image, {
          flag: "wx",
          mode: 0o600,
        });
        audit(req, "upload", name);
        res.status(201).json({ url: `/uploads/${name}` });
      } catch (e) {
        next(e);
      }
    },
  );
  app.use(
    "/uploads",
    express.static(resolve(uploadDir), {
      dotfiles: "deny",
      setHeaders: (res) => res.set("X-Content-Type-Options", "nosniff"),
    }),
  );
  app.post("/api/quote", (req, res, next) => {
    try {
      const priced = priceOrder(db, orderSchema.parse(req.body));
      res.json({
        subtotal: priced.subtotalMinor / 100,
        deliveryFee: priced.deliveryFeeMinor / 100,
        discount: priced.discountMinor / 100,
        total: priced.totalMinor / 100,
      });
    } catch (e) {
      next(e);
    }
  });
  app.post(
    "/api/orders",
    rateLimit({
      windowMs: 60000,
      limit: 15,
      standardHeaders: "draft-7",
      legacyHeaders: false,
    }),
    async (req, res, next) => {
      try {
        if (req.body.paymentMethod === "stripe")
          requireThat(
            gateway,
            "Onlinebetalning är ännu inte konfigurerad.",
            503,
          );
        const { order, trackingToken } = createOrder(db, req.body);
        // Persist the order even if Stripe is temporarily unavailable. The tracking page can retry.
        let session = null;
        if (
          order.paymentMethod === "stripe" &&
          !["paid", "refunded", "refund_pending"].includes(order.paymentStatus)
        ) {
          try {
            session = await checkout(db, gateway, order, trackingToken);
          } catch (e) {
            console.error("checkout_failed", {
              orderId: order.id,
              type: e.type || e.name,
            });
          }
        }
        res.status(201).json({
          orderId: order.id,
          token: trackingToken,
          checkoutUrl: session?.url || null,
        });
      } catch (e) {
        next(e);
      }
    },
  );
  app.post("/api/order-status", (req, res, next) => {
    try {
      const o = getTrackedOrder(db, req.body.orderId, req.body.token);
      // Customer tracking excludes phone/address and internal payment references.
      const { customer, deliveryAddress, ...safe } = o;
      res.json({ order: safe });
    } catch (e) {
      next(e);
    }
  });
  app.post("/api/payment-session", async (req, res, next) => {
    try {
      const order = getTrackedOrder(db, req.body.orderId, req.body.token);
      const s = await checkout(db, gateway, order, req.body.token);
      res.json({ checkoutUrl: s.url });
    } catch (e) {
      next(e);
    }
  });
  app.post("/api/refund", auth, async (req, res, next) => {
    try {
      const o = rowData(
        db
          .prepare("SELECT data FROM orders WHERE id = ?")
          .get(req.body.orderId),
      );
      requireThat(o, "Beställningen saknas.", 404);
      const result = await refund(db, gateway, o);
      audit(req, "refund", o.id);
      res.json(result);
    } catch (e) {
      next(e);
    }
  });
  app.use("/api", (req, res, next) =>
    next(new ApiError(404, "API-resursen hittades inte.")),
  );
  if (serveFrontend && existsSync("dist/index.html")) {
    app.use(express.static(resolve("dist"), { index: false }));
    app.get("/{*path}", (req, res) => res.sendFile(resolve("dist/index.html")));
  }
  app.use((err, req, res, next) => {
    if (res.headersSent) return next(err);
    if (err instanceof z.ZodError)
      return res.status(400).json({
        error: "Kontrollera formulärets uppgifter.",
        fields: err.issues.map((i) => ({ path: i.path, message: i.message })),
      });
    const status =
      err instanceof ApiError
        ? err.status
        : err.type === "entity.parse.failed" ||
            err instanceof multer.MulterError
          ? 400
          : 500;
    if (status === 500)
      console.error("api_error", { type: err.name, code: err.code });
    res.status(status).json({
      error:
        status === 500
          ? "Ett serverfel inträffade. Försök igen."
          : err.type === "entity.parse.failed"
            ? "Ogiltig JSON."
            : err.message,
    });
  });
  return app;
}
