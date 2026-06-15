import { prepareDatabase } from "../db/index.js";
import postgres from "postgres";

let requests;

if (process.env.DATABASE_URL) {
  const db = postgres(process.env.DATABASE_URL, { ssl: "require", max: 1 });
  requests = await db`
    SELECT request_text AS request, character_name AS requested_by, status, created_at
    FROM option_requests
    ORDER BY created_at DESC
  `;
  await db.end();
} else {
  const db = prepareDatabase();
  requests = db.prepare(`
    SELECT request_text AS request, character_name AS requested_by, status, created_at
    FROM option_requests
    ORDER BY created_at DESC
  `).all();
  db.close();
}

console.table(requests);
