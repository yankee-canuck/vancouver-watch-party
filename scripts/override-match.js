import { prepareDatabase } from "../db/index.js";

const [matchId, json] = process.argv.slice(2);
if (!matchId || !json) {
  console.error("Usage: npm run override:match -- <match-id> '{\"stadium\":\"...\",\"manualNotes\":\"...\"}'");
  process.exitCode = 1;
} else {
  const input = JSON.parse(json);
  const allowed = {
    homeTeamNameSnapshot: "home_team_name_snapshot",
    awayTeamNameSnapshot: "away_team_name_snapshot",
    groupName: "group_name",
    stage: "stage",
    kickoffUtc: "kickoff_utc",
    kickoffLocal: "kickoff_local",
    city: "city",
    country: "country",
    stadium: "stadium",
    status: "status",
    homeScore: "home_score",
    awayScore: "away_score",
    manualNotes: "manual_notes",
  };
  const changes = Object.entries(input).filter(([key]) => allowed[key]);
  if (!changes.length) throw new Error("No supported override fields provided.");

  const db = prepareDatabase();
  const sets = changes.map(([key]) => `${allowed[key]} = ?`);
  const result = db.prepare(`
    UPDATE matches SET ${sets.join(", ")}, manually_overridden = 1, updated_at = ?
    WHERE id = ?
  `).run(...changes.map(([, value]) => value), new Date().toISOString(), matchId);
  db.close();
  console.log(`Manual override applied to ${result.changes} match(es).`);
}
