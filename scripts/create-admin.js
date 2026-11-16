import { randomUUID } from "node:crypto";
import { openDatabase } from "../server/db.js";
import { hashPassword } from "../server/security.js";
const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD;
if (
  !email ||
  !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
  !password ||
  password.length < 14
)
  throw new Error(
    "Set ADMIN_EMAIL and ADMIN_PASSWORD (at least 14 characters) securely in the process environment.",
  );
const db = openDatabase();
db.prepare("INSERT INTO admins VALUES (?,?,?,?)").run(
  randomUUID(),
  email,
  hashPassword(password),
  new Date().toISOString(),
);
db.close();
console.log("Administrator created. No credentials written to source files.");
