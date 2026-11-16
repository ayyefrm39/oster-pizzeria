import { DatabaseSync } from "node:sqlite";
import { mkdirSync, readFileSync, readdirSync } from "node:fs";
import { dirname } from "node:path";

export function openDatabase(
  filename = process.env.DATABASE_PATH || "data/oster.sqlite",
) {
  if (filename !== ":memory:")
    mkdirSync(dirname(filename), { recursive: true, mode: 0o700 });
  const db = new DatabaseSync(filename);
  db.exec(
    "PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000;",
  );
  db.exec(
    "CREATE TABLE IF NOT EXISTS schema_migrations (version TEXT PRIMARY KEY)",
  );
  const dir = new URL("./migrations/", import.meta.url);
  for (const name of readdirSync(dir).sort()) {
    if (
      !name.endsWith(".sql") ||
      db.prepare("SELECT 1 FROM schema_migrations WHERE version = ?").get(name)
    )
      continue;
    transaction(db, () => {
      db.exec(readFileSync(new URL(name, dir), "utf8"));
      db.prepare("INSERT INTO schema_migrations(version) VALUES (?)").run(name);
    });
  }
  return db;
}
export function transaction(db, fn) {
  db.exec("BEGIN IMMEDIATE");
  try {
    const result = fn();
    db.exec("COMMIT");
    return result;
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}
