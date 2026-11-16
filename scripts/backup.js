import { backup } from "node:sqlite";
import { mkdirSync, chmodSync } from "node:fs";
import { join } from "node:path";
import { openDatabase } from "../server/db.js";
const db = openDatabase();
const directory = process.env.BACKUP_DIR || "data/backups";
mkdirSync(directory, { recursive: true, mode: 0o700 });
const destination = join(
  directory,
  `oster-${new Date().toISOString().replace(/[:.]/g, "-")}.sqlite`,
);
try {
  await backup(db, destination);
  chmodSync(destination, 0o600);
  console.log("Consistent SQLite backup saved:", destination);
} finally {
  db.close();
}
