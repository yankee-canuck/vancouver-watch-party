import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { prepareDatabase } from "./db/index.js";
import {
  ApiError,
  createOptionRequest,
  ensureCharacter,
  getMatch,
  listMatches,
  listMatchVenues,
  listTopRatedGuinness,
  listVenuesGrouped,
  rateVenueGuinness,
  setInterest,
  voteForVenue,
} from "./server/repository.js";

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const db = prepareDatabase();
const port = Number(process.env.PORT || 4173);
const host = process.env.HOST || "0.0.0.0";

const server = http.createServer(async (request, response) => {
  try {
    if (request.url.startsWith("/api/")) {
      await handleApi(request, response);
      return;
    }
    serveStatic(request, response);
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 500;
    if (status === 500) console.error(error);
    sendJson(response, status, { error: error.message || "Unexpected server error." });
  }
});

async function handleApi(request, response) {
  const url = new URL(request.url, `http://${request.headers.host}`);
  const characterId = request.headers["x-character-id"];
  const characterName = request.headers["x-character-name"] || "Friend";

  if (request.method === "OPTIONS") {
    response.writeHead(204, corsHeaders());
    response.end();
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/health") {
    sendJson(response, 200, { status: "ok" });
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/matches") {
    const matches = listMatches(db, characterId);
    sendJson(response, 200, {
      matches,
      message: matches.length ? null : "The cached World Cup schedule is not available yet. Run npm run sync:worldcup.",
    });
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/venues") {
    sendJson(response, 200, { neighbourhoods: listVenuesGrouped(db) });
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/guinness/top-rated") {
    sendJson(response, 200, { venues: listTopRatedGuinness(db) });
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/character") {
    const body = await readJson(request);
    ensureCharacter(db, characterId, characterName, body.profile || null);
    sendJson(response, 200, { saved: true });
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/option-requests") {
    const body = await readJson(request);
    ensureCharacter(db, characterId, characterName);
    sendJson(response, 201, { request: createOptionRequest(db, characterId, characterName, body.requestText) });
    return;
  }

  let match = url.pathname.match(/^\/api\/matches\/([^/]+)$/);
  if (request.method === "GET" && match) {
    sendJson(response, 200, { match: getMatch(db, match[1], characterId) });
    return;
  }

  match = url.pathname.match(/^\/api\/matches\/([^/]+)\/venues$/);
  if (request.method === "GET" && match) {
    sendJson(response, 200, { venues: listMatchVenues(db, match[1], characterId) });
    return;
  }

  match = url.pathname.match(/^\/api\/matches\/([^/]+)\/interest$/);
  if (match && ["POST", "DELETE"].includes(request.method)) {
    ensureCharacter(db, characterId, characterName);
    sendJson(response, 200, { match: setInterest(db, match[1], characterId, request.method === "POST") });
    return;
  }

  match = url.pathname.match(/^\/api\/matches\/([^/]+)\/venue-vote$/);
  if (request.method === "POST" && match) {
    ensureCharacter(db, characterId, characterName);
    const body = await readJson(request);
    if (!body.venueId) throw new ApiError(400, "venueId is required.");
    sendJson(response, 200, { venues: voteForVenue(db, match[1], body.venueId, characterId) });
    return;
  }

  match = url.pathname.match(/^\/api\/venues\/([^/]+)\/guinness-rating$/);
  if (request.method === "POST" && match) {
    ensureCharacter(db, characterId, characterName);
    const body = await readJson(request);
    sendJson(response, 200, { rating: rateVenueGuinness(db, match[1], characterId, Number(body.rating)) });
    return;
  }

  throw new ApiError(404, "API route not found.");
}

function serveStatic(request, response) {
  const pathname = new URL(request.url, `http://${request.headers.host}`).pathname;
  const requested = pathname === "/" ? "index.html" : pathname.slice(1);
  const file = path.resolve(rootDir, requested);
  if (!file.startsWith(rootDir) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    response.writeHead(404);
    response.end("Not found");
    return;
  }
  const extension = path.extname(file);
  const types = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".json": "application/json" };
  response.writeHead(200, { "content-type": types[extension] || "application/octet-stream" });
  fs.createReadStream(file).pipe(response);
}

async function readJson(request) {
  let body = "";
  for await (const chunk of request) body += chunk;
  return body ? JSON.parse(body) : {};
}

function sendJson(response, status, value) {
  response.writeHead(status, { "content-type": "application/json", ...corsHeaders() });
  response.end(JSON.stringify(value));
}

function corsHeaders() {
  return {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET, POST, DELETE, OPTIONS",
    "access-control-allow-headers": "content-type, x-character-id, x-character-name",
  };
}

server.listen(port, host, () => {
  console.log(`Watch party app running at http://${host}:${port}`);
});

function shutdown() {
  db.close();
  server.close();
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
