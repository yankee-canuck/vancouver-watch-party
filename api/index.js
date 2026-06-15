import {
  createOptionRequest,
  ensureCharacter,
  getMatch,
  getPostgres,
  listMatches,
  listMatchVenues,
  listTopRatedGuinness,
  listVenuesGrouped,
  rateVenueGuinness,
  setInterest,
  voteForVenue,
} from "../server/postgres-repository.js";
import { ApiError } from "../server/repository.js";

export default async function handler(request, response) {
  try {
    const db = getPostgres();
    const url = new URL(request.url, `https://${request.headers.host}`);
    const characterId = request.headers["x-character-id"];
    const characterName = request.headers["x-character-name"] || "Friend";
    if (request.method === "OPTIONS") return send(response, 204);
    if (request.method === "GET" && url.pathname === "/api/health") return send(response, 200, { status: "ok" });
    if (request.method === "GET" && url.pathname === "/api/matches") return send(response, 200, { matches: await listMatches(db, characterId), message: null });
    if (request.method === "GET" && url.pathname === "/api/venues") return send(response, 200, { neighbourhoods: await listVenuesGrouped(db) });
    if (request.method === "GET" && url.pathname === "/api/guinness/top-rated") return send(response, 200, { venues: await listTopRatedGuinness(db) });
    if (request.method === "POST" && url.pathname === "/api/character") {
      await ensureCharacter(db, characterId, characterName, request.body?.profile || null);
      return send(response, 200, { saved: true });
    }
    if (request.method === "POST" && url.pathname === "/api/option-requests") {
      await ensureCharacter(db, characterId, characterName);
      return send(response, 201, { request: await createOptionRequest(db, characterId, characterName, request.body?.requestText) });
    }
    let match = url.pathname.match(/^\/api\/matches\/([^/]+)$/);
    if (request.method === "GET" && match) return send(response, 200, { match: await getMatch(db, match[1], characterId) });
    match = url.pathname.match(/^\/api\/matches\/([^/]+)\/venues$/);
    if (request.method === "GET" && match) return send(response, 200, { venues: await listMatchVenues(db, match[1], characterId) });
    match = url.pathname.match(/^\/api\/matches\/([^/]+)\/interest$/);
    if (match && ["POST", "DELETE"].includes(request.method)) {
      await ensureCharacter(db, characterId, characterName);
      return send(response, 200, { match: await setInterest(db, match[1], characterId, request.method === "POST") });
    }
    match = url.pathname.match(/^\/api\/matches\/([^/]+)\/venue-vote$/);
    if (request.method === "POST" && match) {
      await ensureCharacter(db, characterId, characterName);
      if (!request.body?.venueId) throw new ApiError(400, "venueId is required.");
      return send(response, 200, { venues: await voteForVenue(db, match[1], request.body.venueId, characterId) });
    }
    match = url.pathname.match(/^\/api\/venues\/([^/]+)\/guinness-rating$/);
    if (request.method === "POST" && match) {
      await ensureCharacter(db, characterId, characterName);
      return send(response, 200, { rating: await rateVenueGuinness(db, match[1], characterId, Number(request.body?.rating)) });
    }
    throw new ApiError(404, "API route not found.");
  } catch (error) {
    if (!(error instanceof ApiError)) console.error(error);
    return send(response, error instanceof ApiError ? error.status : 500, { error: error.message || "Unexpected server error." });
  }
}

function send(response, status, body) {
  response.setHeader("access-control-allow-origin", "*");
  response.setHeader("access-control-allow-methods", "GET, POST, DELETE, OPTIONS");
  response.setHeader("access-control-allow-headers", "content-type, x-character-id, x-character-name");
  return body === undefined ? response.status(status).end() : response.status(status).json(body);
}
