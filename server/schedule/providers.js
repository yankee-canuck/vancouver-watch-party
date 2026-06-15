import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.dirname(path.dirname(path.dirname(fileURLToPath(import.meta.url))));

/**
 * @typedef {Object} ExternalTeam
 * @property {string} id
 * @property {string} name
 * @property {string=} shortName
 * @property {string=} fifaCode
 * @property {string=} countryCode
 * @property {string=} flagEmoji
 * @property {string=} primaryColor
 * @property {string=} secondaryColor
 */

/**
 * @typedef {Object} ExternalFixture
 * @property {string} id
 * @property {ExternalTeam} homeTeam
 * @property {ExternalTeam} awayTeam
 * @property {string} kickoffUtc
 */

export const requiredSportmonksEnvironment = [
  "SPORTMONKS_API_KEY",
  "SPORTMONKS_BASE_URL",
  "SPORTMONKS_WORLD_CUP_LEAGUE_ID",
  "SPORTMONKS_WORLD_CUP_SEASON_ID",
];

export function missingSportmonksEnvironment() {
  return requiredSportmonksEnvironment.filter((name) => !process.env[name]);
}

export class SportmonksScheduleProvider {
  name = "sportmonks";

  async fetchFixtures() {
    const missing = missingSportmonksEnvironment();
    if (missing.length) {
      throw new Error(`Missing Sportmonks environment variables: ${missing.join(", ")}`);
    }

    // TODO: Confirm the final World Cup fixture endpoint and include parameters
    // against the Sportmonks account documentation once credentials are added.
    const url = new URL("/v3/football/fixtures", process.env.SPORTMONKS_BASE_URL);
    url.searchParams.set("api_token", process.env.SPORTMONKS_API_KEY);
    url.searchParams.set(
      "filters",
      `fixtureLeagues:${process.env.SPORTMONKS_WORLD_CUP_LEAGUE_ID};fixtureSeasons:${process.env.SPORTMONKS_WORLD_CUP_SEASON_ID}`,
    );
    url.searchParams.set("include", "participants;venue;stage;group;scores");

    const response = await fetch(url);
    if (!response.ok) throw new Error(`Sportmonks request failed with HTTP ${response.status}`);
    const payload = await response.json();
    return (payload.data || []).map(normalizeSportmonksFixture);
  }
}

export class OpenFootballScheduleProvider {
  name = "openfootball";

  async fetchFixtures() {
    const file = path.join(rootDir, "data", "openfootball-worldcup-2026.txt");
    return parseOpenFootballFixtures(await fs.readFile(file, "utf8"));
  }
}

const teamAliases = {
  "Cape Verde": "Cabo Verde",
  "Czech Republic": "Czechia",
  "DR Congo": "Congo DR",
  Iran: "IR Iran",
  "Ivory Coast": "Côte d'Ivoire",
  Turkey: "Türkiye",
};

const teamCodes = {
  Algeria: ["ALG", "DZ"], Argentina: ["ARG", "AR"], Australia: ["AUS", "AU"], Austria: ["AUT", "AT"],
  Belgium: ["BEL", "BE"], "Bosnia & Herzegovina": ["BIH", "BA"], Brazil: ["BRA", "BR"], "Cabo Verde": ["CPV", "CV"],
  Canada: ["CAN", "CA"], Colombia: ["COL", "CO"], "Congo DR": ["COD", "CD"], Croatia: ["CRO", "HR"],
  Curaçao: ["CUW", "CW"], "Côte d'Ivoire": ["CIV", "CI"], Czechia: ["CZE", "CZ"], Ecuador: ["ECU", "EC"],
  Egypt: ["EGY", "EG"], England: ["ENG", "GB"], France: ["FRA", "FR"], Germany: ["GER", "DE"],
  Ghana: ["GHA", "GH"], Haiti: ["HAI", "HT"], Iraq: ["IRQ", "IQ"], "IR Iran": ["IRN", "IR"],
  Japan: ["JPN", "JP"], Jordan: ["JOR", "JO"], Mexico: ["MEX", "MX"], Morocco: ["MAR", "MA"],
  Netherlands: ["NED", "NL"], "New Zealand": ["NZL", "NZ"], Norway: ["NOR", "NO"], Panama: ["PAN", "PA"],
  Paraguay: ["PAR", "PY"], Portugal: ["POR", "PT"], Qatar: ["QAT", "QA"], "Saudi Arabia": ["KSA", "SA"],
  Scotland: ["SCO", "GB"], Senegal: ["SEN", "SN"], "South Africa": ["RSA", "ZA"], "South Korea": ["KOR", "KR"],
  Spain: ["ESP", "ES"], Sweden: ["SWE", "SE"], Switzerland: ["SUI", "CH"], Tunisia: ["TUN", "TN"],
  Türkiye: ["TUR", "TR"], Uruguay: ["URU", "UY"], USA: ["USA", "US"], Uzbekistan: ["UZB", "UZ"],
};

const hostVenues = {
  Atlanta: ["Mercedes-Benz Stadium", "United States"],
  "Boston (Foxborough)": ["Gillette Stadium", "United States"],
  "Dallas (Arlington)": ["AT&T Stadium", "United States"],
  "Guadalajara (Zapopan)": ["Estadio Akron", "Mexico"],
  Houston: ["NRG Stadium", "United States"],
  "Kansas City": ["Arrowhead Stadium", "United States"],
  "Los Angeles (Inglewood)": ["SoFi Stadium", "United States"],
  "Mexico City": ["Estadio Azteca", "Mexico"],
  "Miami (Miami Gardens)": ["Hard Rock Stadium", "United States"],
  "Monterrey (Guadalupe)": ["Estadio BBVA", "Mexico"],
  "New York/New Jersey (East Rutherford)": ["MetLife Stadium", "United States"],
  Philadelphia: ["Lincoln Financial Field", "United States"],
  "San Francisco Bay Area (Santa Clara)": ["Levi's Stadium", "United States"],
  Seattle: ["Lumen Field", "United States"],
  Toronto: ["BMO Field", "Canada"],
  Vancouver: ["BC Place", "Canada"],
};

export function parseOpenFootballFixtures(source) {
  const fixtures = [];
  let groupName = null;
  let day = null;

  for (const line of source.split(/\r?\n/)) {
    const groupMatch = line.match(/^▪ Group ([A-L])$/);
    if (groupMatch) {
      groupName = `Group ${groupMatch[1]}`;
      continue;
    }

    const dateMatch = line.match(/^(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun) June (\d{1,2})$/);
    if (dateMatch) {
      day = Number(dateMatch[1]);
      continue;
    }

    const fixtureMatch = line.match(/^\s*(\d{2}:\d{2})\s+UTC([+-]\d{1,2})\s+(.+?)\s+v\s+(.+?)\s+@\s+(.+?)\s*$/);
    if (!fixtureMatch || !groupName || !day) continue;

    const [, time, utcOffset, rawHome, rawAway, city] = fixtureMatch;
    const offset = `${utcOffset[0]}${utcOffset.slice(1).padStart(2, "0")}:00`;
    const homeTeam = openFootballTeam(rawHome.trim());
    const awayTeam = openFootballTeam(rawAway.trim());
    const venue = hostVenues[city];
    if (!venue) throw new Error(`OpenFootball fixture uses an unknown host city: ${city}`);

    fixtures.push({
      id: `wc26-${slug(groupName)}-${slug(homeTeam.name)}-${slug(awayTeam.name)}`,
      homeTeam,
      awayTeam,
      groupName,
      stage: "Group stage",
      kickoffUtc: new Date(`2026-06-${String(day).padStart(2, "0")}T${time}:00${offset}`).toISOString(),
      city,
      country: venue[1],
      stadium: venue[0],
      status: "scheduled",
    });
  }

  if (fixtures.length !== 72) {
    throw new Error(`Expected 72 OpenFootball group-stage fixtures, found ${fixtures.length}`);
  }
  return fixtures;
}

function openFootballTeam(sourceName) {
  const name = teamAliases[sourceName] || sourceName;
  const [fifaCode, countryCode] = teamCodes[name] || [];
  if (!fifaCode) throw new Error(`OpenFootball fixture uses an unknown team: ${name}`);
  return {
    id: fifaCode.toLowerCase(),
    name,
    shortName: name,
    fifaCode,
    countryCode,
    flagEmoji: flagEmoji(name, countryCode),
  };
}

function flagEmoji(name, countryCode) {
  if (name === "England") return "🏴";
  if (name === "Scotland") return "🏴";
  return [...countryCode].map((letter) => String.fromCodePoint(127397 + letter.charCodeAt())).join("");
}

function slug(value) {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function normalizeSportmonksFixture(fixture) {
  const participants = fixture.participants || [];
  const home = participants.find((participant) => participant.meta?.location === "home") || participants[0];
  const away = participants.find((participant) => participant.meta?.location === "away") || participants[1];
  const scores = fixture.scores || [];
  const currentHome = scores.find((score) => score.description === "CURRENT" && score.score?.participant === "home");
  const currentAway = scores.find((score) => score.description === "CURRENT" && score.score?.participant === "away");

  if (!home || !away || !fixture.starting_at) {
    throw new Error(`Sportmonks fixture ${fixture.id} is missing participants or kickoff time`);
  }

  return {
    id: String(fixture.id),
    homeTeam: { id: String(home.id), name: home.name, shortName: home.short_code, fifaCode: home.short_code },
    awayTeam: { id: String(away.id), name: away.name, shortName: away.short_code, fifaCode: away.short_code },
    groupName: fixture.group?.name,
    stage: fixture.stage?.name,
    kickoffUtc: new Date(`${fixture.starting_at}Z`).toISOString(),
    city: fixture.venue?.city_name,
    country: fixture.venue?.country_name,
    stadium: fixture.venue?.name,
    status: fixture.state?.state || "scheduled",
    homeScore: currentHome?.score?.goals,
    awayScore: currentAway?.score?.goals,
    sourceLastUpdatedAt: fixture.updated_at,
  };
}
