import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";

const rootDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const dataDir = path.join(rootDir, "data");
const migrationsDir = path.join(rootDir, "db", "migrations");
const dbPath = process.env.WATCH_PARTY_DB_PATH || path.join(dataDir, "watch-party.sqlite");

export function openDatabase() {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  const db = new DatabaseSync(dbPath);
  db.exec("PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;");
  return db;
}

export function runMigrations(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL
    );
  `);

  for (const filename of fs.readdirSync(migrationsDir).filter((name) => name.endsWith(".sql")).sort()) {
    const applied = db.prepare("SELECT 1 FROM schema_migrations WHERE filename = ?").get(filename);
    if (applied) continue;

    const sql = fs.readFileSync(path.join(migrationsDir, filename), "utf8");
    db.exec("BEGIN");
    try {
      db.exec(sql);
      db.prepare("INSERT INTO schema_migrations (filename, applied_at) VALUES (?, ?)").run(filename, new Date().toISOString());
      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
  }
}

export function prepareDatabase() {
  const db = openDatabase();
  runMigrations(db);
  return db;
}
