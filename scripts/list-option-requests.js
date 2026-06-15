import { prepareDatabase } from "../db/index.js";

const db = prepareDatabase();
const requests = db.prepare(`
  SELECT request_text AS request, character_name AS requested_by, status, created_at
  FROM option_requests
  ORDER BY created_at DESC
`).all();

console.table(requests);
db.close();
