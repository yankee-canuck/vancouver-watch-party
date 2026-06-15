import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { prepareDatabase } from "../db/index.js";
import { venueSeed } from "../db/venue-seed.js";

const rootDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const coordinatesPath = path.join(rootDir, "data", "venue-coordinates.json");
const coordinates = fs.existsSync(coordinatesPath)
  ? new Map(JSON.parse(fs.readFileSync(coordinatesPath, "utf8")).map((venue) => [`${venue.name}|${venue.address}`, venue]))
  : new Map();

const db = prepareDatabase();
const now = new Date().toISOString();
const fields = [
  "id", "name", "address", "neighbourhood", "city", "province", "latitude", "longitude",
  "confirmed_world_cup", "geocoding_source_url", "geocoded_at", "rating_source_url",
  "venue_type", "reservation_url", "website_url", "source_url", "latest_photo_url",
  "latest_photo_source_url", "latest_photo_source_label", "menu_url", "social_url", "tv_count",
  "specials", "watch_party_details", "serves_guinness_tap", "guinness_source_url",
  "notes", "details_last_synced_at", "created_at", "updated_at",
];
const updateFields = fields.filter((field) => !["id", "created_at"].includes(field));
const upsert = db.prepare(`
  INSERT INTO venues (${fields.join(", ")})
  VALUES (${fields.map(() => "?").join(", ")})
  ON CONFLICT(name, address) DO UPDATE SET
    ${updateFields.map((field) => `${field} = excluded.${field}`).join(",\n    ")}
`);

db.exec("BEGIN");
try {
  const keepIds = [];
  for (const venue of venueSeed) {
    const cachedCoordinates = coordinates.get(`${venue.name}|${venue.address}`) || {};
    const city = venue.city || (venue.address.includes("North Vancouver") ? "North Vancouver" : "Vancouver");
    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${venue.name}, ${venue.address}`)}`;
    const values = {
      id: randomUUID(),
      name: venue.name,
      address: venue.address,
      neighbourhood: venue.neighbourhood,
      city,
      province: "BC",
      latitude: venue.latitude ?? cachedCoordinates.latitude ?? null,
      longitude: venue.longitude ?? cachedCoordinates.longitude ?? null,
      confirmed_world_cup: Number(Boolean(venue.confirmedWorldCup)),
      geocoding_source_url: venue.geocodingSourceUrl ?? cachedCoordinates.sourceUrl ?? null,
      geocoded_at: venue.latitude != null || cachedCoordinates.latitude != null ? now : null,
      rating_source_url: venue.ratingSourceUrl || googleMapsUrl,
      venue_type: venue.venueType ?? null,
      reservation_url: venue.reservationUrl ?? null,
      website_url: venue.websiteUrl ?? null,
      source_url: venue.sourceUrl ?? null,
      latest_photo_url: venue.latestPhotoUrl ?? null,
      latest_photo_source_url: venue.latestPhotoSourceUrl ?? null,
      latest_photo_source_label: venue.latestPhotoSourceLabel ?? null,
      menu_url: venue.menuUrl ?? null,
      social_url: venue.socialUrl ?? null,
      tv_count: venue.tvCount ?? null,
      specials: venue.specials ?? null,
      watch_party_details: venue.watchPartyDetails ?? null,
      serves_guinness_tap: Number(Boolean(venue.servesGuinnessTap)),
      guinness_source_url: venue.guinnessSourceUrl ?? null,
      notes: "Verified watch-party source required for inclusion.",
      details_last_synced_at: now,
      created_at: now,
      updated_at: now,
    };
    upsert.run(...fields.map((field) => values[field]));
    keepIds.push(db.prepare("SELECT id FROM venues WHERE name = ? AND address = ?").get(venue.name, venue.address).id);
  }

  db.prepare(`DELETE FROM venues WHERE id NOT IN (${keepIds.map(() => "?").join(", ")})`).run(...keepIds);
  db.exec("COMMIT");
} catch (error) {
  db.exec("ROLLBACK");
  throw error;
}

const count = db.prepare("SELECT COUNT(*) AS count FROM venues").get().count;
db.close();
console.log(`Verified venue seed complete. ${count} venue(s) available.`);
