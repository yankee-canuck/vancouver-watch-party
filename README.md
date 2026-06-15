# Vancouver World Cup Watch Parties

A dependency-free World Cup 2026 watch-party prototype with a cached SQLite
schedule, Vancouver venue voting, and a simple character-based identity.

## Run locally

Requires Node.js 22.5 or newer for the built-in `node:sqlite` module.

```bash
npm run db:migrate
npm run db:seed:venues
npm run sync:worldcup
npm start
```

Open `http://127.0.0.1:4173`.

The SQLite cache is created at `data/watch-party.sqlite` and is ignored by Git.
The venue seed is repeatable and inserts the 33 supplied venues grouped by
neighbourhood. Vancouver is used as the city except for the North Vancouver
venue. Cached OpenStreetMap coordinates are applied when available.

Refresh venue coordinates from OpenStreetMap Nominatim:

```bash
npm run geocode:venues
npm run db:seed:venues
```

The watch map uses a locally vendored Leaflet runtime with OpenStreetMap tiles
and cached coordinates. Its initial bounds include every seeded Vancouver and
North Vancouver venue.

## Schedule sources

`npm run sync:worldcup` uses Sportmonks when every required environment
variable is configured. Otherwise it clearly reports the missing values and
uses the local 72-match group-stage schedule in
`data/openfootball-worldcup-2026.txt`.

The fallback data is derived from the
[OpenFootball 2026 source](https://github.com/openfootball/worldcup/blob/master/2026--usa/cup.txt).
Production schedule updates should be checked against the
[official FIFA schedule](https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/articles/match-schedule-fixtures-results-teams-stadiums).
FIFA is a verification source, not the app's scraped data source.

Copy `.env.example` to `.env` and provide:

```dotenv
SPORTMONKS_API_KEY=
SPORTMONKS_BASE_URL=https://api.sportmonks.com/v3
SPORTMONKS_WORLD_CUP_LEAGUE_ID=
SPORTMONKS_WORLD_CUP_SEASON_ID=
```

Each sync upserts teams and matches, preserves manually overridden matches,
stores Vancouver local time alongside canonical UTC time, and records the
attempt in `data_sync_logs`. Page loads only read the local cache.

## Manual match corrections

Apply an admin-friendly correction by match ID:

```bash
npm run override:match -- <match-id> '{"stadium":"Corrected Stadium","manualNotes":"Verified manually"}'
```

A manually overridden match keeps its display and result fields during later
syncs. Sync metadata such as `sourceLastUpdatedAt` and `lastSyncedAt` can still
refresh.

Add verified venue details by exact name or ID:

```bash
npm run venue:details -- "BC Place" '{"websiteUrl":"https://...","menuUrl":"https://..."}'
```

Photos require `latestPhotoSourceUrl`, and ratings require `ratingSourceUrl`.
This prevents unsourced venue content from appearing on the watch map.
Verified watch-party details can also include `tvCount`, `specials`, and
`watchPartyDetails`.

View new drink and dish suggestions submitted from the character builder:

```bash
npm run requests:list
```

## API

- `GET /api/matches`
- `POST /api/character`
- `POST /api/option-requests` with `{ "requestText": "..." }`
- `GET /api/matches/:id`
- `POST /api/matches/:id/interest`
- `DELETE /api/matches/:id/interest`
- `GET /api/matches/:id/venues`
- `POST /api/matches/:id/venue-vote` with `{ "venueId": "..." }`
- `GET /api/venues`

The prototype sends `x-character-id` and `x-character-name` headers from the
locally created character. Database uniqueness constraints ensure one interest
record and one venue vote per character per match. Changing venue updates the
existing vote, and tied winning venues are returned together.

Users can submit drink or dish suggestions from the character builder. These
are stored separately from character profiles for later backend review.

Venue records also support nullable source-backed fields for a latest photo,
photo source, average rating, rating source, menu, social profile, and detail
sync timestamp. The map UI shows an explicit unavailable state until those
fields are populated; it does not invent venue media or ratings.

## Deploy on Render

The repository includes `render.yaml` for a Node web service with a persistent
disk. The production start command automatically seeds venues, loads the local
72-match schedule, runs database migrations, and starts the server.

1. Push this directory to a GitHub repository.
2. In Render, create a new Blueprint and select that repository.
3. Review the paid Starter web service and 1 GB persistent disk, then deploy.

The public app will receive an `onrender.com` URL. A custom domain is optional.
The persistent disk stores SQLite at `/var/data/watch-party.sqlite`, preserving
characters, votes, option requests, and Guinness ratings across restarts.

## TODO

- Confirm the final Sportmonks fixture endpoint, filters, and include parameters
  against the account documentation once credentials are available.
- Verify production Sportmonks sync results against the official FIFA schedule.
- Add knockout fixtures to the offline fallback as teams qualify. Sportmonks
  remains the source for the evolving complete 104-match tournament schedule.
- Add a venue-details sync provider for source-backed photos, ratings, menus,
  and social links.
- Add Slack-style character statuses such as on vacation, sleepy, or watching
  from home, and show them when viewing friends.
- Replace local character-header identity with real authentication if the app
  moves beyond the prototype.
