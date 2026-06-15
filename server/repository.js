import { randomUUID } from "node:crypto";
import { ApiError } from "./api-error.js";

export { ApiError } from "./api-error.js";

export function ensureCharacter(db, id, displayName = "Friend", profile = null) {
  if (!id) throw new ApiError(401, "A character ID is required.");
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO characters (id, display_name, profile_json, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      display_name = excluded.display_name,
      profile_json = COALESCE(excluded.profile_json, characters.profile_json),
      updated_at = excluded.updated_at
  `).run(id, displayName, profile ? JSON.stringify(profile) : null, now, now);
}

export function createOptionRequest(db, characterId, characterName, requestText) {
  const text = requestText?.trim();
  if (!text) throw new ApiError(400, "A request is required.");
  if (text.length > 80) throw new ApiError(400, "Requests must be 80 characters or fewer.");

  const request = {
    id: randomUUID(),
    characterId,
    characterName,
    requestText: text,
    status: "new",
    createdAt: new Date().toISOString(),
  };
  db.prepare(`
    INSERT INTO option_requests (id, character_id, character_name, request_text, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(request.id, request.characterId, request.characterName, request.requestText, request.status, request.createdAt);
  return request;
}

export function listMatches(db, characterId) {
  const rows = db.prepare(`
    SELECT
      m.*, ht.flag_emoji AS home_flag_emoji, at.flag_emoji AS away_flag_emoji,
      (SELECT COUNT(*) FROM match_watch_interest i WHERE i.match_id = m.id) AS interested_count,
      EXISTS(
        SELECT 1 FROM match_watch_interest i
        WHERE i.match_id = m.id AND i.character_id = ?
      ) AS current_character_interested
    FROM matches m
    LEFT JOIN teams ht ON ht.id = m.home_team_id
    LEFT JOIN teams at ON at.id = m.away_team_id
    ORDER BY m.kickoff_local
  `).all(characterId || "");
  return rows.map((row) => ({
    ...matchFromRow(row),
    winningVenues: winningVenues(db, row.id),
    interestedCharacters: interestedCharacters(db, row.id),
  }));
}

export function getMatch(db, id, characterId) {
  const row = db.prepare(`
    SELECT
      m.*, ht.flag_emoji AS home_flag_emoji, at.flag_emoji AS away_flag_emoji,
      (SELECT COUNT(*) FROM match_watch_interest i WHERE i.match_id = m.id) AS interested_count,
      EXISTS(
        SELECT 1 FROM match_watch_interest i
        WHERE i.match_id = m.id AND i.character_id = ?
      ) AS current_character_interested
    FROM matches m
    LEFT JOIN teams ht ON ht.id = m.home_team_id
    LEFT JOIN teams at ON at.id = m.away_team_id
    WHERE m.id = ?
  `).get(characterId || "", id);
  if (!row) throw new ApiError(404, "Match not found.");
  return {
    ...matchFromRow(row),
    winningVenues: winningVenues(db, id),
    interestedCharacters: interestedCharacters(db, id),
    venues: listMatchVenues(db, id, characterId),
  };
}

export function setInterest(db, matchId, characterId, interested) {
  requireMatch(db, matchId);
  if (interested) {
    db.prepare(`
      INSERT INTO match_watch_interest (id, match_id, character_id, created_at)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(match_id, character_id) DO NOTHING
    `).run(randomUUID(), matchId, characterId, new Date().toISOString());
  } else {
    db.prepare("DELETE FROM match_watch_interest WHERE match_id = ? AND character_id = ?").run(matchId, characterId);
  }
  return getMatch(db, matchId, characterId);
}

export function listMatchVenues(db, matchId, characterId) {
  requireMatch(db, matchId);
  return db.prepare(`
    SELECT
      v.*,
      COUNT(vv.id) AS vote_count,
      (SELECT ROUND(AVG(gr.rating), 1) FROM guinness_ratings gr WHERE gr.venue_id = v.id) AS guinness_rating_average,
      (SELECT COUNT(*) FROM guinness_ratings gr WHERE gr.venue_id = v.id) AS guinness_rating_count,
      (SELECT gr.rating FROM guinness_ratings gr WHERE gr.venue_id = v.id AND gr.character_id = ?) AS current_character_guinness_rating,
      EXISTS(
        SELECT 1 FROM venue_votes own_vote
        WHERE own_vote.match_id = ? AND own_vote.venue_id = v.id AND own_vote.character_id = ?
      ) AS current_character_voted
    FROM venues v
    LEFT JOIN venue_votes vv ON vv.venue_id = v.id AND vv.match_id = ?
    GROUP BY v.id
    ORDER BY v.neighbourhood, vote_count DESC, v.name
  `).all(characterId || "", matchId, characterId || "", matchId).map(venueFromRow);
}

export function voteForVenue(db, matchId, venueId, characterId) {
  requireMatch(db, matchId);
  const venue = db.prepare("SELECT confirmed_world_cup, serves_guinness_tap FROM venues WHERE id = ?").get(venueId);
  if (!venue) throw new ApiError(404, "Venue not found.");
  if (!venue.confirmed_world_cup && !venue.serves_guinness_tap) {
    throw new ApiError(400, "This venue is not available for match voting.");
  }
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO venue_votes (id, match_id, venue_id, character_id, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(match_id, character_id) DO UPDATE SET
      venue_id = excluded.venue_id,
      updated_at = excluded.updated_at
  `).run(randomUUID(), matchId, venueId, characterId, now, now);
  return listMatchVenues(db, matchId, characterId);
}

export function rateVenueGuinness(db, venueId, characterId, rating) {
  const venue = db.prepare("SELECT serves_guinness_tap FROM venues WHERE id = ?").get(venueId);
  if (!venue) throw new ApiError(404, "Venue not found.");
  if (!venue.serves_guinness_tap) throw new ApiError(400, "This venue is not listed as serving Guinness on tap.");
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw new ApiError(400, "Rating must be between 1 and 5.");
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO guinness_ratings (id, venue_id, character_id, rating, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(venue_id, character_id) DO UPDATE SET
      rating = excluded.rating,
      updated_at = excluded.updated_at
  `).run(randomUUID(), venueId, characterId, rating, now, now);
  return guinnessRating(db, venueId, characterId);
}

export function listVenuesGrouped(db) {
  const grouped = {};
  for (const venue of db.prepare("SELECT * FROM venues ORDER BY neighbourhood, name").all().map(venueFromRow)) {
    (grouped[venue.neighbourhood] ||= []).push(venue);
  }
  return grouped;
}

export function listTopRatedGuinness(db) {
  return db.prepare(`
    SELECT
      v.id,
      v.name,
      v.neighbourhood,
      ROUND(AVG(gr.rating), 1) AS guinness_rating_average,
      COUNT(gr.id) AS guinness_rating_count
    FROM venues v
    LEFT JOIN guinness_ratings gr ON gr.venue_id = v.id
    WHERE v.serves_guinness_tap = 1
    GROUP BY v.id
    ORDER BY guinness_rating_count > 0 DESC, guinness_rating_average DESC, guinness_rating_count DESC, v.name
    LIMIT 3
  `).all().map((row) => ({
    id: row.id,
    name: row.name,
    neighbourhood: row.neighbourhood,
    guinnessRatingAverage: row.guinness_rating_average ?? null,
    guinnessRatingCount: row.guinness_rating_count,
  }));
}

function winningVenues(db, matchId) {
  const results = db.prepare(`
    SELECT v.id, v.name, COUNT(vv.id) AS vote_count
    FROM venue_votes vv
    JOIN venues v ON v.id = vv.venue_id
    WHERE vv.match_id = ?
    GROUP BY v.id
    ORDER BY vote_count DESC, v.name
  `).all(matchId);
  if (!results.length) return [];
  const topCount = results[0].vote_count;
  return results.filter((result) => result.vote_count === topCount).map((result) => ({
    id: result.id,
    name: result.name,
    voteCount: result.vote_count,
  }));
}

function interestedCharacters(db, matchId) {
  return db.prepare(`
    SELECT c.id, c.display_name, c.profile_json
    FROM match_watch_interest i
    JOIN characters c ON c.id = i.character_id
    WHERE i.match_id = ?
    ORDER BY i.created_at, c.display_name
    LIMIT 6
  `).all(matchId).map((row) => ({
    id: row.id,
    displayName: row.display_name,
    profile: parseProfile(row.profile_json),
  }));
}

function parseProfile(value) {
  try {
    return value ? JSON.parse(value) : {};
  } catch {
    return {};
  }
}

function requireMatch(db, matchId) {
  if (!db.prepare("SELECT 1 FROM matches WHERE id = ?").get(matchId)) throw new ApiError(404, "Match not found.");
}

function guinnessRating(db, venueId, characterId) {
  const row = db.prepare(`
    SELECT
      ROUND(AVG(rating), 1) AS average,
      COUNT(*) AS count,
      MAX(CASE WHEN character_id = ? THEN rating END) AS current_character_rating
    FROM guinness_ratings
    WHERE venue_id = ?
  `).get(characterId || "", venueId);
  return {
    average: row.average,
    count: row.count,
    currentCharacterRating: row.current_character_rating,
  };
}

function matchFromRow(row) {
  return {
    id: row.id,
    externalSource: row.external_source,
    externalMatchId: row.external_match_id,
    homeTeamId: row.home_team_id,
    awayTeamId: row.away_team_id,
    homeTeamNameSnapshot: row.home_team_name_snapshot,
    awayTeamNameSnapshot: row.away_team_name_snapshot,
    homeFlagEmoji: row.home_flag_emoji,
    awayFlagEmoji: row.away_flag_emoji,
    groupName: row.group_name,
    stage: row.stage,
    kickoffUtc: row.kickoff_utc,
    kickoffLocal: row.kickoff_local,
    timezone: row.timezone,
    city: row.city,
    country: row.country,
    stadium: row.stadium,
    status: row.status,
    homeScore: row.home_score,
    awayScore: row.away_score,
    winnerTeamId: row.winner_team_id,
    sourceLastUpdatedAt: row.source_last_updated_at,
    lastSyncedAt: row.last_synced_at,
    manuallyOverridden: Boolean(row.manually_overridden),
    manualNotes: row.manual_notes,
    interestedCount: row.interested_count,
    currentCharacterInterested: Boolean(row.current_character_interested),
  };
}

function venueFromRow(row) {
  return {
    id: row.id,
    name: row.name,
    address: row.address,
    neighbourhood: row.neighbourhood,
    city: row.city,
    province: row.province,
    postalCode: row.postal_code,
    latitude: row.latitude,
    longitude: row.longitude,
    geocodingSourceUrl: row.geocoding_source_url,
    geocodedAt: row.geocoded_at,
    venueType: row.venue_type,
    confirmedWorldCup: Boolean(row.confirmed_world_cup),
    reservationUrl: row.reservation_url,
    websiteUrl: row.website_url,
    sourceUrl: row.source_url,
    latestPhotoUrl: row.latest_photo_url,
    latestPhotoSourceUrl: row.latest_photo_source_url,
    latestPhotoSourceLabel: row.latest_photo_source_label,
    ratingAverage: row.rating_average,
    ratingCount: row.rating_count,
    ratingSourceUrl: row.rating_source_url,
    menuUrl: row.menu_url,
    socialUrl: row.social_url,
    tvCount: row.tv_count,
    specials: row.specials,
    watchPartyDetails: row.watch_party_details,
    servesGuinnessTap: Boolean(row.serves_guinness_tap),
    guinnessSourceUrl: row.guinness_source_url,
    guinnessRatingAverage: row.guinness_rating_average ?? null,
    guinnessRatingCount: row.guinness_rating_count ?? 0,
    currentCharacterGuinnessRating: row.current_character_guinness_rating ?? null,
    detailsLastSyncedAt: row.details_last_synced_at,
    notes: row.notes,
    voteCount: row.vote_count ?? 0,
    currentCharacterVoted: Boolean(row.current_character_voted),
  };
}
