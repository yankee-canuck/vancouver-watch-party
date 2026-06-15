import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";
import { prepareDatabase } from "../db/index.js";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required. Use the Supabase Session pooler connection string.");

const rootDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const local = prepareDatabase();
const remote = postgres(process.env.DATABASE_URL, { ssl: "require", max: 1 });
const schema = fs.readFileSync(path.join(rootDir, "supabase", "schema.sql"), "utf8");

for (const statement of schema.split(";").map((value) => value.trim()).filter(Boolean)) {
  await remote.unsafe(statement);
}

const [{ matches, venues }] = await remote`
  SELECT
    (SELECT COUNT(*)::int FROM matches) AS matches,
    (SELECT COUNT(*)::int FROM venues) AS venues
`;
if (matches || venues) {
  throw new Error("Supabase already contains seeded data. Bootstrap is intentionally one-time to protect user votes and ratings.");
}

for (const table of ["teams", "matches", "venues"]) {
  const rows = local.prepare(`SELECT * FROM ${table}`).all();
  if (!rows.length) continue;
  const columns = Object.keys(rows[0]);
  await remote`INSERT INTO ${remote(table)} ${remote(rows, columns)}`;
  console.log(`Copied ${rows.length} ${table}.`);
}

local.close();
await remote.end();
console.log("Supabase bootstrap complete.");
