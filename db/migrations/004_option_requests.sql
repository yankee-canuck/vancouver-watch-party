CREATE TABLE IF NOT EXISTS option_requests (
  id TEXT PRIMARY KEY,
  character_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  character_name TEXT NOT NULL,
  request_text TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new',
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_option_requests_status ON option_requests(status, created_at);
