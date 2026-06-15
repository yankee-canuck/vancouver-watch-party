CREATE TABLE IF NOT EXISTS teams (
  id TEXT PRIMARY KEY, external_source TEXT, external_team_id TEXT, name TEXT NOT NULL, short_name TEXT,
  fifa_code TEXT, country_code TEXT, flag_emoji TEXT, primary_color TEXT, secondary_color TEXT,
  created_at TEXT NOT NULL, updated_at TEXT NOT NULL, UNIQUE(external_source, external_team_id)
);
CREATE TABLE IF NOT EXISTS matches (
  id TEXT PRIMARY KEY, external_source TEXT NOT NULL, external_match_id TEXT NOT NULL,
  home_team_id TEXT REFERENCES teams(id), away_team_id TEXT REFERENCES teams(id),
  home_team_name_snapshot TEXT NOT NULL, away_team_name_snapshot TEXT NOT NULL, group_name TEXT, stage TEXT,
  kickoff_utc TEXT NOT NULL, kickoff_local TEXT NOT NULL, timezone TEXT NOT NULL DEFAULT 'America/Vancouver',
  city TEXT, country TEXT, stadium TEXT, status TEXT NOT NULL DEFAULT 'scheduled', home_score INTEGER,
  away_score INTEGER, winner_team_id TEXT REFERENCES teams(id), source_last_updated_at TEXT, last_synced_at TEXT NOT NULL,
  manually_overridden INTEGER NOT NULL DEFAULT 0, manual_notes TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
  UNIQUE(external_source, external_match_id)
);
CREATE TABLE IF NOT EXISTS venues (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, address TEXT NOT NULL, neighbourhood TEXT NOT NULL, city TEXT NOT NULL,
  province TEXT NOT NULL, postal_code TEXT, latitude REAL, longitude REAL, venue_type TEXT,
  confirmed_world_cup INTEGER NOT NULL DEFAULT 0, reservation_url TEXT, website_url TEXT, source_url TEXT, notes TEXT,
  created_at TEXT NOT NULL, updated_at TEXT NOT NULL, latest_photo_url TEXT, latest_photo_source_url TEXT,
  latest_photo_source_label TEXT, rating_average REAL, rating_count INTEGER, rating_source_url TEXT, menu_url TEXT,
  social_url TEXT, details_last_synced_at TEXT, geocoding_source_url TEXT, geocoded_at TEXT, tv_count INTEGER,
  specials TEXT, watch_party_details TEXT, serves_guinness_tap INTEGER NOT NULL DEFAULT 0, guinness_source_url TEXT,
  UNIQUE(name, address)
);
CREATE TABLE IF NOT EXISTS characters (
  id TEXT PRIMARY KEY, display_name TEXT NOT NULL, profile_json TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS match_watch_interest (
  id TEXT PRIMARY KEY, match_id TEXT NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  character_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE, created_at TEXT NOT NULL,
  UNIQUE(match_id, character_id)
);
CREATE TABLE IF NOT EXISTS venue_votes (
  id TEXT PRIMARY KEY, match_id TEXT NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  venue_id TEXT NOT NULL REFERENCES venues(id) ON DELETE CASCADE, character_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL, updated_at TEXT NOT NULL, UNIQUE(match_id, character_id)
);
CREATE TABLE IF NOT EXISTS data_sync_logs (
  id TEXT PRIMARY KEY, provider TEXT NOT NULL, status TEXT NOT NULL, fixtures_fetched INTEGER NOT NULL DEFAULT 0,
  teams_upserted INTEGER NOT NULL DEFAULT 0, matches_created INTEGER NOT NULL DEFAULT 0, matches_updated INTEGER NOT NULL DEFAULT 0,
  skipped_manual_overrides INTEGER NOT NULL DEFAULT 0, errors_json TEXT, started_at TEXT NOT NULL, completed_at TEXT
);
CREATE TABLE IF NOT EXISTS option_requests (
  id TEXT PRIMARY KEY, character_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE, character_name TEXT NOT NULL,
  request_text TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'new', created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS guinness_ratings (
  id TEXT PRIMARY KEY, venue_id TEXT NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  character_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE, rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  created_at TEXT NOT NULL, updated_at TEXT NOT NULL, UNIQUE (venue_id, character_id)
);
CREATE INDEX IF NOT EXISTS idx_matches_kickoff_local ON matches(kickoff_local);
CREATE INDEX IF NOT EXISTS idx_interest_match ON match_watch_interest(match_id);
CREATE INDEX IF NOT EXISTS idx_votes_match ON venue_votes(match_id);
CREATE INDEX IF NOT EXISTS idx_venues_neighbourhood ON venues(neighbourhood);
CREATE INDEX IF NOT EXISTS idx_option_requests_status ON option_requests(status, created_at);
CREATE INDEX IF NOT EXISTS guinness_ratings_venue_idx ON guinness_ratings(venue_id);
