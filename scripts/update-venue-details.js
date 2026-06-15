import { prepareDatabase } from "../db/index.js";

const [venueNameOrId, json] = process.argv.slice(2);
if (!venueNameOrId || !json) {
  console.error(`Usage: npm run venue:details -- "Venue name or ID" '{"websiteUrl":"...","menuUrl":"..."}'`);
  process.exitCode = 1;
} else {
  const input = JSON.parse(json);
  if (input.latestPhotoUrl && !input.latestPhotoSourceUrl) {
    throw new Error("latestPhotoSourceUrl is required when latestPhotoUrl is provided.");
  }
  if (input.ratingAverage != null && !input.ratingSourceUrl) {
    throw new Error("ratingSourceUrl is required when ratingAverage is provided.");
  }
  if (input.ratingAverage != null && (Number(input.ratingAverage) < 0 || Number(input.ratingAverage) > 5)) {
    throw new Error("ratingAverage must be between 0 and 5.");
  }
  if (input.tvCount != null && (!Number.isInteger(Number(input.tvCount)) || Number(input.tvCount) < 0)) {
    throw new Error("tvCount must be a non-negative integer.");
  }

  const allowed = {
    confirmedWorldCup: "confirmed_world_cup",
    venueType: "venue_type",
    reservationUrl: "reservation_url",
    sourceUrl: "source_url",
    latestPhotoUrl: "latest_photo_url",
    latestPhotoSourceUrl: "latest_photo_source_url",
    latestPhotoSourceLabel: "latest_photo_source_label",
    ratingAverage: "rating_average",
    ratingCount: "rating_count",
    ratingSourceUrl: "rating_source_url",
    menuUrl: "menu_url",
    socialUrl: "social_url",
    websiteUrl: "website_url",
    tvCount: "tv_count",
    specials: "specials",
    watchPartyDetails: "watch_party_details",
    servesGuinnessTap: "serves_guinness_tap",
    guinnessSourceUrl: "guinness_source_url",
  };
  const changes = Object.entries(input).filter(([key]) => allowed[key]);
  if (!changes.length) throw new Error("No supported venue detail fields provided.");

  const db = prepareDatabase();
  const sets = changes.map(([key]) => `${allowed[key]} = ?`);
  const result = db.prepare(`
    UPDATE venues SET ${sets.join(", ")}, details_last_synced_at = ?, updated_at = ?
    WHERE id = ? OR name = ?
  `).run(
    ...changes.map(([key, value]) => ["confirmedWorldCup", "servesGuinnessTap"].includes(key) ? Number(Boolean(value)) : value),
    new Date().toISOString(),
    new Date().toISOString(),
    venueNameOrId,
    venueNameOrId,
  );
  db.close();

  if (!result.changes) throw new Error(`Venue not found: ${venueNameOrId}`);
  console.log(`Venue details updated for ${result.changes} venue(s).`);
}
