import fs from "node:fs";
import postgres from "postgres";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");

const coordinates = JSON.parse(fs.readFileSync("data/venue-coordinates.json", "utf8"));
const db = postgres(process.env.DATABASE_URL, { ssl: "require", max: 1 });
const now = new Date().toISOString();
let updated = 0;

for (const venue of coordinates) {
  const result = await db`
    UPDATE venues SET
      latitude = ${venue.latitude},
      longitude = ${venue.longitude},
      geocoding_source_url = ${venue.sourceUrl},
      geocoded_at = ${now},
      updated_at = ${now}
    WHERE name = ${venue.name} AND address = ${venue.address}
  `;
  updated += result.count;
}

await db.end();
console.log(`Updated ${updated}/${coordinates.length} production venue coordinate rows.`);
