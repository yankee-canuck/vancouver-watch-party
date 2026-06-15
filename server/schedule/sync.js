import { createHash, randomUUID } from "node:crypto";

const timezone = "America/Vancouver";

function stableId(prefix, source, externalId) {
  return `${prefix}_${createHash("sha1").update(`${source}:${externalId}`).digest("hex").slice(0, 20)}`;
}

function kickoffLocal(utc) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(utc));
  const value = (type) => parts.find((part) => part.type === type).value;
  return `${value("year")}-${value("month")}-${value("day")}T${value("hour")}:${value("minute")}:${value("second")}`;
}

export async function syncSchedule(db, provider) {
  const startedAt = new Date().toISOString();
  const summary = {
    provider: provider.name,
    fixturesFetched: 0,
    teamsUpserted: 0,
    matchesCreated: 0,
    matchesUpdated: 0,
    skippedManualOverrides: 0,
    errors: [],
  };
  const logId = randomUUID();

  db.prepare(`
    INSERT INTO data_sync_logs (id, provider, status, started_at)
    VALUES (?, ?, 'running', ?)
  `).run(logId, provider.name, startedAt);

  try {
    const fixtures = await provider.fetchFixtures();
    summary.fixturesFetched = fixtures.length;
    const syncedAt = new Date().toISOString();

    db.exec("BEGIN");
    try {
      for (const fixture of fixtures) {
        const homeTeamId = upsertTeam(db, provider.name, fixture.homeTeam, syncedAt);
        const awayTeamId = upsertTeam(db, provider.name, fixture.awayTeam, syncedAt);
        summary.teamsUpserted += 2;

        const matchId = stableId("match", provider.name, fixture.id);
        const existing = db.prepare("SELECT id, manually_overridden FROM matches WHERE external_source = ? AND external_match_id = ?")
          .get(provider.name, String(fixture.id));

        if (existing?.manually_overridden) {
          // Manual edits protect all display and result fields. Sync metadata remains safe to refresh.
          db.prepare(`
            UPDATE matches SET source_last_updated_at = ?, last_synced_at = ?, updated_at = ?
            WHERE id = ?
          `).run(fixture.sourceLastUpdatedAt || syncedAt, syncedAt, syncedAt, existing.id);
          summary.skippedManualOverrides += 1;
          continue;
        }

        const values = [
          matchId, provider.name, String(fixture.id), homeTeamId, awayTeamId,
          fixture.homeTeam.name, fixture.awayTeam.name, fixture.groupName || null, fixture.stage || null,
          new Date(fixture.kickoffUtc).toISOString(), kickoffLocal(fixture.kickoffUtc), timezone,
          fixture.city || null, fixture.country || null, fixture.stadium || null, fixture.status || "scheduled",
          fixture.homeScore ?? null, fixture.awayScore ?? null, fixture.winnerTeamId || null,
          fixture.sourceLastUpdatedAt || syncedAt, syncedAt, syncedAt, syncedAt,
        ];

        db.prepare(`
          INSERT INTO matches (
            id, external_source, external_match_id, home_team_id, away_team_id,
            home_team_name_snapshot, away_team_name_snapshot, group_name, stage,
            kickoff_utc, kickoff_local, timezone, city, country, stadium, status,
            home_score, away_score, winner_team_id, source_last_updated_at, last_synced_at,
            created_at, updated_at
          ) VALUES (${values.map(() => "?").join(", ")})
          ON CONFLICT(external_source, external_match_id) DO UPDATE SET
            home_team_id = excluded.home_team_id,
            away_team_id = excluded.away_team_id,
            home_team_name_snapshot = excluded.home_team_name_snapshot,
            away_team_name_snapshot = excluded.away_team_name_snapshot,
            group_name = excluded.group_name,
            stage = excluded.stage,
            kickoff_utc = excluded.kickoff_utc,
            kickoff_local = excluded.kickoff_local,
            timezone = excluded.timezone,
            city = excluded.city,
            country = excluded.country,
            stadium = excluded.stadium,
            status = excluded.status,
            home_score = excluded.home_score,
            away_score = excluded.away_score,
            winner_team_id = excluded.winner_team_id,
            source_last_updated_at = excluded.source_last_updated_at,
            last_synced_at = excluded.last_synced_at,
            updated_at = excluded.updated_at
        `).run(...values);

        if (existing) summary.matchesUpdated += 1;
        else summary.matchesCreated += 1;
      }
      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }

    completeLog(db, logId, "success", summary);
  } catch (error) {
    summary.errors.push(error.message);
    completeLog(db, logId, "failed", summary);
  }

  return summary;
}

function upsertTeam(db, source, team, now) {
  const id = stableId("team", source, team.id);
  db.prepare(`
    INSERT INTO teams (
      id, external_source, external_team_id, name, short_name, fifa_code, country_code,
      flag_emoji, primary_color, secondary_color, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(external_source, external_team_id) DO UPDATE SET
      name = excluded.name,
      short_name = excluded.short_name,
      fifa_code = excluded.fifa_code,
      country_code = excluded.country_code,
      flag_emoji = excluded.flag_emoji,
      primary_color = COALESCE(excluded.primary_color, teams.primary_color),
      secondary_color = COALESCE(excluded.secondary_color, teams.secondary_color),
      updated_at = excluded.updated_at
  `).run(
    id, source, String(team.id), team.name, team.shortName || null, team.fifaCode || null,
    team.countryCode || null, team.flagEmoji || null, team.primaryColor || null,
    team.secondaryColor || null, now, now,
  );
  return id;
}

function completeLog(db, logId, status, summary) {
  db.prepare(`
    UPDATE data_sync_logs SET
      status = ?, fixtures_fetched = ?, teams_upserted = ?, matches_created = ?,
      matches_updated = ?, skipped_manual_overrides = ?, errors_json = ?, completed_at = ?
    WHERE id = ?
  `).run(
    status, summary.fixturesFetched, summary.teamsUpserted, summary.matchesCreated,
    summary.matchesUpdated, summary.skippedManualOverrides, JSON.stringify(summary.errors),
    new Date().toISOString(), logId,
  );
}
