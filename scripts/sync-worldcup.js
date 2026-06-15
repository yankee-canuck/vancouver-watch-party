import { prepareDatabase } from "../db/index.js";
import {
  missingSportmonksEnvironment,
  OpenFootballScheduleProvider,
  SportmonksScheduleProvider,
} from "../server/schedule/providers.js";
import { syncSchedule } from "../server/schedule/sync.js";

const missing = missingSportmonksEnvironment();
const provider = missing.length ? new OpenFootballScheduleProvider() : new SportmonksScheduleProvider();

if (missing.length) {
  console.log(`Sportmonks is not configured. Missing: ${missing.join(", ")}`);
  console.log("Using the local OpenFootball 72-match group-stage fallback.");
}

const db = prepareDatabase();
const summary = await syncSchedule(db, provider);
db.close();

console.log(`Provider: ${summary.provider}`);
console.log(`Fixtures fetched: ${summary.fixturesFetched}`);
console.log(`Teams upserted: ${summary.teamsUpserted}`);
console.log(`Matches created: ${summary.matchesCreated}`);
console.log(`Matches updated: ${summary.matchesUpdated}`);
console.log(`Skipped due to manual override: ${summary.skippedManualOverrides}`);
console.log(`Errors: ${summary.errors.length ? summary.errors.join("; ") : "none"}`);
