import { prepareDatabase } from "../db/index.js";

const db = prepareDatabase();
const count = db.prepare("SELECT COUNT(*) AS count FROM schema_migrations").get().count;
db.close();
console.log(`Database ready. ${count} migration(s) applied.`);
