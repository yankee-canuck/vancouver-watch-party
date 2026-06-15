import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { prepareDatabase } from "../db/index.js";

const rootDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const outputFile = path.join(rootDir, "data", "venue-coordinates.json");
const db = prepareDatabase();
const venues = db.prepare("SELECT id, name, address, city FROM venues ORDER BY name").all();
const results = [];
const failures = [];

for (const venue of venues) {
  const queries = [
    `${venue.address}, Canada`,
    ...(venue.address.includes(" at ") ? [`${venue.address.split(" at ").at(-1)}, Canada`] : []),
    `${venue.name}, ${venue.city}, BC, Canada`,
  ];
  let result = null;

  for (const query of queries) {
    result = await geocode(query);
    if (result && isMetroVancouver(result)) break;
    result = null;
    await wait(1100);
  }

  if (!result) {
    failures.push(venue.name);
    console.log(`No verified Metro Vancouver result: ${venue.name}`);
    continue;
  }

  const latitude = Number(result.lat);
  const longitude = Number(result.lon);
  const sourceUrl = `https://www.openstreetmap.org/${result.osm_type}/${result.osm_id}`;
  const geocodedAt = new Date().toISOString();
  db.prepare(`
    UPDATE venues SET latitude = ?, longitude = ?, geocoding_source_url = ?, geocoded_at = ?, updated_at = ?
    WHERE id = ?
  `).run(latitude, longitude, sourceUrl, geocodedAt, geocodedAt, venue.id);
  results.push({
    name: venue.name,
    address: venue.address,
    latitude,
    longitude,
    sourceUrl,
  });
  console.log(`Geocoded: ${venue.name}`);
  await wait(1100);
}

await fs.writeFile(outputFile, `${JSON.stringify(results, null, 2)}\n`);
db.close();

console.log(`Geocoded ${results.length}/${venues.length} venues.`);
if (failures.length) {
  console.log(`Needs manual review: ${failures.join(", ")}`);
  process.exitCode = 1;
}

async function geocode(query) {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "1");
  url.searchParams.set("countrycodes", "ca");
  url.searchParams.set("q", query);
  const response = await fetch(url, {
    headers: { "user-agent": "ExtraTimeWatchParty/0.1 venue geocoder" },
  });
  if (!response.ok) throw new Error(`Nominatim request failed with HTTP ${response.status}`);
  return (await response.json())[0] || null;
}

function isMetroVancouver(result) {
  const latitude = Number(result.lat);
  const longitude = Number(result.lon);
  return latitude >= 49.15 && latitude <= 49.4 && longitude >= -123.35 && longitude <= -122.9;
}

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
