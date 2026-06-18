const PROFILE_KEY = "extra-time-profile";
const API_BASE = location.protocol === "file:" ? "http://127.0.0.1:4173" : "";
let matches = [];
let venues = [];
let topRatedGuinness = [];
let selectedVenueId = "";
let venueMap = null;
let venueMarkers = [];
const matchFilters = { team: "", date: "", watching: false };

const skins = [
  { id: "light", label: "Light", color: "#f1c7a5" },
  { id: "warm", label: "Warm", color: "#d79052" },
  { id: "tan", label: "Tan", color: "#ad693e" },
  { id: "deep", label: "Deep", color: "#71472f" },
];

const hairStyles = [
  { id: "fade", label: "Fresh fade" },
  { id: "curls", label: "Curls" },
  { id: "buzz", label: "Buzz cut" },
  { id: "mohawk", label: "Mohawk" },
  { id: "waves", label: "Waves" },
  { id: "long", label: "Long hair" },
  { id: "bun", label: "Top knot" },
  { id: "spikes", label: "Liberty spikes" },
  { id: "mullet", label: "Mullet" },
  { id: "pigtails", label: "Pigtails" },
  { id: "bald", label: "Clean shaven" },
];

const hairColors = [
  { id: "black", label: "Black", color: "#211b18" },
  { id: "brown", label: "Brown", color: "#5a3827" },
  { id: "blonde", label: "Blonde", color: "#d5ae62" },
  { id: "ginger", label: "Ginger", color: "#b94f2b" },
];

const faces = [
  { id: "smile", label: "Smile", icon: ":)" },
  { id: "calm", label: "Calm", icon: "- -" },
  { id: "wow", label: "Wow", icon: ":o" },
];

const drinks = [
  { id: "water", label: "Water" },
  { id: "stout", label: "Guinness" },
  { id: "caesar", label: "Ceasar" },
  { id: "spritz", label: "Spritz" },
];

const cleatColors = [
  { id: "black", label: "Black", color: "#1f1a17" },
  { id: "white", label: "White", color: "#f6f1e7" },
  { id: "red", label: "Red", color: "#d91f36" },
  { id: "royal", label: "Royal blue", color: "#2457d6" },
  { id: "navy", label: "Navy", color: "#1e2f66" },
  { id: "volt", label: "Volt", color: "#d9f64d" },
  { id: "green", label: "Green", color: "#31c86a" },
  { id: "orange", label: "Orange", color: "#f27622" },
  { id: "pink", label: "Pink", color: "#f14f9f" },
  { id: "purple", label: "Purple", color: "#7044d6" },
];

const jerseys = [
  { id: "can", name: "Canada", code: "CAN", main: "#d91e36", alt: "#f6f4e9", trim: "#c7162c" },
  { id: "mex", name: "Mexico", code: "MEX", main: "#126246", alt: "#f3f2e7", trim: "#c82c3a" },
  { id: "usa", name: "United States", code: "USA", main: "#f4f3e9", alt: "#284c88", trim: "#c92e42" },
  { id: "arg", name: "Argentina", code: "ARG", main: "#8ac9e9", alt: "#f9f8ed", trim: "#d3ad4a" },
  { id: "bra", name: "Brazil", code: "BRA", main: "#f2d33c", alt: "#26734f", trim: "#1f5599" },
  { id: "fra", name: "France", code: "FRA", main: "#203d7b", alt: "#f1eee5", trim: "#d5af4b" },
  { id: "eng", name: "England", code: "ENG", main: "#f1efe5", alt: "#31538c", trim: "#d94149" },
  { id: "por", name: "Portugal", code: "POR", main: "#bd2835", alt: "#17603d", trim: "#d6b64c" },
  { id: "alg", name: "Algeria", code: "ALG", main: "#f2f1e8", alt: "#168557", trim: "#c5323d" },
  { id: "aus", name: "Australia", code: "AUS", main: "#e7c93d", alt: "#1f6b52", trim: "#1c5847" },
  { id: "aut", name: "Austria", code: "AUT", main: "#c92f3b", alt: "#f3f1e7", trim: "#a51f2c" },
  { id: "bel", name: "Belgium", code: "BEL", main: "#972a34", alt: "#1c2522", trim: "#d6b73d" },
  { id: "bih", name: "Bosnia & Herzegovina", code: "BIH", main: "#31518b", alt: "#e7c444", trim: "#f0efe5" },
  { id: "cpv", name: "Cape Verde", code: "CPV", main: "#31508d", alt: "#f0eee4", trim: "#d13b42" },
  { id: "col", name: "Colombia", code: "COL", main: "#e8cb3d", alt: "#254a86", trim: "#c52d3b" },
  { id: "civ", name: "Côte d'Ivoire", code: "CIV", main: "#e87c35", alt: "#f0eee4", trim: "#2d815a" },
  { id: "cro", name: "Croatia", code: "CRO", main: "#f3f1e8", alt: "#c83c42", trim: "#31518a" },
  { id: "cur", name: "Curaçao", code: "CUR", main: "#24509a", alt: "#e8c93c", trim: "#f1efe7" },
  { id: "cze", name: "Czechia", code: "CZE", main: "#b92d3a", alt: "#31528c", trim: "#f0eee4" },
  { id: "cod", name: "DR Congo", code: "COD", main: "#2673b4", alt: "#d84046", trim: "#e7c83c" },
  { id: "ecu", name: "Ecuador", code: "ECU", main: "#e4c83c", alt: "#31508a", trim: "#c8323c" },
  { id: "egy", name: "Egypt", code: "EGY", main: "#c9323c", alt: "#f1efe6", trim: "#202722" },
  { id: "ger", name: "Germany", code: "GER", main: "#f2f0e7", alt: "#202722", trim: "#d2ab3c" },
  { id: "gha", name: "Ghana", code: "GHA", main: "#f1efe7", alt: "#c8323c", trim: "#e4c53a" },
  { id: "hai", name: "Haiti", code: "HAI", main: "#29509a", alt: "#c9313d", trim: "#f0eee5" },
  { id: "irn", name: "Iran", code: "IRN", main: "#f2f0e7", alt: "#238258", trim: "#c6323d" },
  { id: "irq", name: "Iraq", code: "IRQ", main: "#2c7653", alt: "#f1efe6", trim: "#c6313d" },
  { id: "jpn", name: "Japan", code: "JPN", main: "#294b8d", alt: "#eaf0f4", trim: "#df3040" },
  { id: "jor", name: "Jordan", code: "JOR", main: "#f1efe6", alt: "#c8323d", trim: "#26815b" },
  { id: "mar", name: "Morocco", code: "MAR", main: "#bc2431", alt: "#f0eee4", trim: "#176345" },
  { id: "ned", name: "Netherlands", code: "NED", main: "#e87835", alt: "#263d78", trim: "#f1efe6" },
  { id: "nzl", name: "New Zealand", code: "NZL", main: "#202722", alt: "#f1efe7", trim: "#b8bdb7" },
  { id: "nor", name: "Norway", code: "NOR", main: "#b92d3b", alt: "#23447e", trim: "#f1efe7" },
  { id: "pan", name: "Panama", code: "PAN", main: "#c6313c", alt: "#f2f0e7", trim: "#284b88" },
  { id: "par", name: "Paraguay", code: "PAR", main: "#c9323d", alt: "#f1efe7", trim: "#31508a" },
  { id: "qat", name: "Qatar", code: "QAT", main: "#7e2741", alt: "#f1efe7", trim: "#6c2037" },
  { id: "ksa", name: "Saudi Arabia", code: "KSA", main: "#238057", alt: "#f1efe7", trim: "#196844" },
  { id: "sco", name: "Scotland", code: "SCO", main: "#263d78", alt: "#f1efe7", trim: "#d6b542" },
  { id: "sen", name: "Senegal", code: "SEN", main: "#f2f0e7", alt: "#238057", trim: "#e4c33b" },
  { id: "rsa", name: "South Africa", code: "RSA", main: "#e2c43b", alt: "#258059", trim: "#202722" },
  { id: "kor", name: "South Korea", code: "KOR", main: "#c9323c", alt: "#f1efe7", trim: "#31508b" },
  { id: "esp", name: "Spain", code: "ESP", main: "#bd2936", alt: "#e5c43c", trim: "#26447a" },
  { id: "swe", name: "Sweden", code: "SWE", main: "#e4c63d", alt: "#315292", trim: "#25467d" },
  { id: "sui", name: "Switzerland", code: "SUI", main: "#c8323d", alt: "#f2f0e7", trim: "#ad2632" },
  { id: "tun", name: "Tunisia", code: "TUN", main: "#f2f0e7", alt: "#c9313d", trim: "#b62734" },
  { id: "tur", name: "Türkiye", code: "TUR", main: "#c8313d", alt: "#f1efe7", trim: "#a92330" },
  { id: "uru", name: "Uruguay", code: "URU", main: "#83c2e3", alt: "#f2f0e7", trim: "#d5b23d" },
  { id: "uzb", name: "Uzbekistan", code: "UZB", main: "#f1efe7", alt: "#3696bf", trim: "#49a85e" },
];

const popularJerseyIds = ["can", "mex", "usa", "arg", "bra", "eng", "fra", "por"];

const profile = {
  id: "",
  name: "",
  skin: "warm",
  hair: "fade",
  hairColor: "black",
  face: "smile",
  drink: "water",
  cleatColor: "black",
  jersey: "can",
};

function createCharacterId() {
  if (typeof globalThis.crypto?.randomUUID === "function") return globalThis.crypto.randomUUID();
  const bytes = new Uint8Array(16);
  if (typeof globalThis.crypto?.getRandomValues === "function") {
    globalThis.crypto.getRandomValues(bytes);
  } else {
    for (let index = 0; index < bytes.length; index += 1) bytes[index] = Math.floor(Math.random() * 256);
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  return [...bytes].map((byte, index) => `${[4, 6, 8, 10].includes(index) ? "-" : ""}${byte.toString(16).padStart(2, "0")}`).join("");
}

const character = document.querySelector("#character");
const siteHeader = document.querySelector(".site-header");
const onboarding = document.querySelector("#onboarding");
const dashboard = document.querySelector("#dashboard");
const venuePicker = document.querySelector("#venue-picker");
const profileForm = document.querySelector("#profile-form");
const nameInput = document.querySelector("#display-name");
const editProfileButton = document.querySelector("#edit-profile");
const backToCharacterButton = document.querySelector("#back-to-character");
const requestToggle = document.querySelector("#request-toggle");
const requestSuggestion = document.querySelector("#request-suggestion");
const requestSuggestionInput = document.querySelector("#request-suggestion-input");
const requestSendButton = document.querySelector("#request-send");
const requestFeedback = document.querySelector("#request-feedback");
const matchTeamFilter = document.querySelector("#match-team-filter");
const matchDateFilter = document.querySelector("#match-date-filter");
const matchWatchingFilter = document.querySelector("#match-watching-filter");
const clearMatchFiltersButton = document.querySelector("#clear-match-filters");
let activeMatchId = "";

async function apiFetch(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "content-type": "application/json",
      "x-character-id": profile.id,
      "x-character-name": profile.name || "Friend",
      ...options.headers,
    },
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || "The request failed.");
  return payload;
}

function createButton({ className, label, title, dataset, style }) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = className;
  button.setAttribute("aria-label", title);
  button.title = title;
  button.innerHTML = label;

  Object.entries(dataset).forEach(([key, value]) => {
    button.dataset[key] = value;
  });

  if (style) {
    Object.entries(style).forEach(([property, value]) => {
      button.style.setProperty(property, value);
    });
  }

  return button;
}

function stoutGlassArt() {
  return `
    <svg class="stout-glass-art" viewBox="0 0 64 88" aria-hidden="true" focusable="false">
      <path class="stout-glass-shell" d="M8 12Q32 2 56 12L51 70Q49 83 32 85Q15 83 13 70Z"></path>
      <path class="stout-glass-fill" d="M12 20Q32 26 52 20L48 69Q46 77 32 79Q18 77 16 69Z"></path>
      <ellipse class="stout-foam" cx="32" cy="18" rx="20" ry="7"></ellipse>
      <path class="stout-glass-rim" d="M8 12Q32 25 56 12"></path>
      <path class="stout-glass-highlight" d="M16 25 19 62M47 27 44 61"></path>
      <path class="stout-glass-base" d="M17 69Q32 78 47 69"></path>
      <g class="stout-brand">
        <path d="M25 36v11c0 4 2 6 5 6 6 0 8-7 9-15l-14-2"></path>
        <path d="M29 38v11M33 38v11M37 39v7"></path>
      </g>
      <text class="stout-wordmark" x="32" y="63" text-anchor="middle">GUINNESS</text>
    </svg>
  `;
}

function caesarGlassArt() {
  return `
    <svg class="caesar-glass-art" viewBox="0 0 72 92" aria-hidden="true" focusable="false">
      <path class="caesar-coaster" d="M12 82h46l6 5H18Z"></path>
      <path class="caesar-glass-shell" d="M17 18h38l-6 58c-.5 6-5 10-13 10s-12.5-4-13-10Z"></path>
      <path class="caesar-fill" d="M20 24h32l-5 51c-.4 4-4 7-11 7s-10.6-3-11-7Z"></path>
      <path class="caesar-rim" d="M17 18h38"></path>
      <path class="caesar-highlight" d="M28 32l7 6-6 5 7 8-8 4 5 8"></path>
      <path class="caesar-celery" d="M42 19c4-9 9-12 15-16-3 8-1 11-8 18m-6-1c-1-8 1-13 5-19 1 8 4 12 0 20"></path>
      <path class="caesar-lime" d="M55 33c8 0 12 4 13 10-7 0-11-3-13-10Z"></path>
      <path class="caesar-straw" d="M18 4 34 27"></path>
      <circle class="caesar-garnish" cx="39" cy="19" r="5"></circle>
      <circle class="caesar-garnish" cx="48" cy="17" r="4"></circle>
    </svg>
  `;
}

function spritzGlassArt() {
  return `
    <svg class="spritz-glass-art" viewBox="0 0 78 104" aria-hidden="true" focusable="false">
      <path class="spritz-shadow" d="M12 98h54"></path>
      <path class="spritz-stem" d="M39 74v23"></path>
      <path class="spritz-base" d="M25 98h28"></path>
      <path class="spritz-glass-shell" d="M18 14h42l-6 44c-1 10-7 17-15 17s-14-7-15-17Z"></path>
      <path class="spritz-fill" d="M21 32h36l-5 25c-2 8-7 14-13 14s-11-6-13-14Z"></path>
      <path class="spritz-rim" d="M18 14h42"></path>
      <path class="spritz-straw" d="M49 4 42 57"></path>
      <g class="spritz-bubbles">
        <circle cx="32" cy="49" r="2"></circle>
        <circle cx="45" cy="43" r="1.8"></circle>
        <circle cx="38" cy="59" r="1.6"></circle>
      </g>
      <g class="spritz-orange">
        <path d="M23 31c11-15 23-20 34-20-2 14-12 24-30 28Z"></path>
        <path d="M28 31 53 15M34 34l13-19M40 29l14-10"></path>
      </g>
      <g class="spritz-garnish">
        <path d="M24 13c0-7 2-11 6-14-1 8 3 11 0 18m-4-3c-4-5-5-10-3-15 3 6 8 8 8 15"></path>
        <path d="M57 34c8 1 12 5 13 11-8 0-12-4-13-11Z"></path>
      </g>
      <path class="spritz-ice" d="M29 42 39 38l5 11-11 5Zm15 13 11-4 4 12-12 4Z"></path>
    </svg>
  `;
}

function renderOptions() {
  const skinContainer = document.querySelector("#skin-options");
  skins.forEach((skin) => {
    skinContainer.appendChild(
      createButton({
        className: "option-button swatch",
        label: "",
        title: skin.label,
        dataset: { option: "skin", value: skin.id },
        style: { background: skin.color },
      }),
    );
  });

  const hairContainer = document.querySelector("#hair-options");
  hairStyles.forEach((hair) => {
    hairContainer.appendChild(
      createButton({
        className: "option-button hair-option",
        label: `<span class="hair-option-head"><span class="hair-option-style hair-option-${hair.id}"></span></span>`,
        title: hair.label,
        dataset: { option: "hair", value: hair.id },
      }),
    );
  });

  const hairColorContainer = document.querySelector("#hair-color-options");
  hairColors.forEach((hairColor) => {
    hairColorContainer.appendChild(
      createButton({
        className: "option-button swatch hair-color-swatch",
        label: "",
        title: `${hairColor.label} hair`,
        dataset: { option: "hairColor", value: hairColor.id },
        style: { background: hairColor.color },
      }),
    );
  });

  const faceContainer = document.querySelector("#face-options");
  faces.forEach((face) => {
    faceContainer.appendChild(
      createButton({
        className: "option-button",
        label: face.icon,
        title: face.label,
        dataset: { option: "face", value: face.id },
      }),
    );
  });

  const drinkContainer = document.querySelector("#drink-options");
  drinks.forEach((drink) => {
    drinkContainer.appendChild(
      createButton({
        className: "option-button drink-option",
        label: drinkOptionLabel(drink),
        title: drink.label,
        dataset: { option: "drink", value: drink.id },
      }),
    );
  });

  const cleatColorContainer = document.querySelector("#cleat-color-options");
  cleatColors.forEach((cleatColor) => {
    cleatColorContainer.appendChild(
      createButton({
        className: "option-button cleat-option",
        label: `<span class="cleat-option-icon"></span>`,
        title: `${cleatColor.label} cleats`,
        dataset: { option: "cleatColor", value: cleatColor.id },
        style: { "--cleat-swatch": cleatColor.color },
      }),
    );
  });

  const jerseyContainer = document.querySelector("#jersey-options");
  jerseys.filter((jersey) => popularJerseyIds.includes(jersey.id)).forEach((jersey) => {
    jerseyContainer.appendChild(
      createButton({
        className: "jersey-button",
        label: `<span class="kit-icon"></span><span>${jersey.name}</span>`,
        title: `${jersey.name} jersey`,
        dataset: { option: "jersey", value: jersey.id },
        style: { "--kit-main": jersey.main, "--kit-alt": jersey.alt },
      }),
    );
  });

  const moreJerseys = document.querySelector("#jersey-more");
  jerseys
    .filter((jersey) => !popularJerseyIds.includes(jersey.id))
    .sort((a, b) => a.name.localeCompare(b.name))
    .forEach((jersey) => {
      const option = document.createElement("option");
      option.value = jersey.id;
      option.textContent = jersey.name;
      moreJerseys.appendChild(option);
    });
}

function drinkOptionLabel(drink) {
  if (drink.id === "stout") return `<span class="drink-option-art">${stoutGlassArt()}</span><span>${drink.label}</span>`;
  if (drink.id === "caesar") return `<span class="drink-option-art">${caesarGlassArt()}</span><span>${drink.label}</span>`;
  if (drink.id === "spritz") return `<span class="drink-option-art">${spritzGlassArt()}</span><span>${drink.label}</span>`;
  return `<span class="drink-option-glass drink-option-water"><span></span></span><span>${drink.label}</span>`;
}

function updateCharacter() {
  const skin = skins.find((item) => item.id === profile.skin);
  const hairColor = hairColors.find((item) => item.id === profile.hairColor) || hairColors[0];
  const jersey = jerseys.find((item) => item.id === profile.jersey);
  const cleatColor = cleatColors.find((item) => item.id === profile.cleatColor) || cleatColors[0];
  const hair = character.querySelector(".hair");
  const mouth = character.querySelector(".mouth");
  const drink = character.querySelector(".drink");

  document.documentElement.style.setProperty("--skin", skin.color);
  document.documentElement.style.setProperty("--hair", hairColor.color);
  document.documentElement.style.setProperty("--jersey", jersey.main);
  document.documentElement.style.setProperty("--jersey-alt", jersey.alt);
  document.documentElement.style.setProperty("--jersey-trim", jersey.trim);
  document.documentElement.style.setProperty("--cleat-color", cleatColor.color);
  document.querySelector("#jersey-crest").textContent = jersey.code;
  document.querySelector("#jersey-label").textContent = jersey.name;

  hair.className = `hair hair-${profile.hair}`;
  mouth.className = `mouth mouth-${profile.face}`;
  drink.className = `drink drink-${profile.drink}`;
  document.querySelector("#header-avatar").innerHTML = renderScaledMatchdayCharacter({
    ...characterParts(profile),
    variant: "avatar",
  });

  document.querySelectorAll("[data-option]").forEach((button) => {
    const selected = profile[button.dataset.option] === button.dataset.value;
    button.classList.toggle("is-selected", selected);
    button.setAttribute("aria-pressed", selected ? "true" : "false");
  });

  document.querySelector("#jersey-more").value = popularJerseyIds.includes(profile.jersey)
    ? ""
    : profile.jersey;
}

function showBuilder() {
  nameInput.value = profile.name;
  siteHeader.classList.add("is-hidden");
  onboarding.classList.remove("is-hidden");
  dashboard.classList.add("is-hidden");
  venuePicker.classList.add("is-hidden");
  editProfileButton.classList.add("is-hidden");
  backToCharacterButton.classList.add("is-hidden");
  updateCharacter();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function showDashboard() {
  const firstName = profile.name.trim().split(/\s+/)[0];
  document.querySelector("#welcome-title").textContent = `${firstName}, ready for kickoff?`;
  document.querySelector("#header-name").textContent = firstName;

  siteHeader.classList.remove("is-hidden");
  onboarding.classList.add("is-hidden");
  venuePicker.classList.add("is-hidden");
  dashboard.classList.remove("is-hidden");
  editProfileButton.classList.remove("is-hidden");
  backToCharacterButton.classList.remove("is-hidden");
  updateCharacter();
  renderPopularMatches();
  renderTopRatedGuinness();
  renderMatchList();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function loadSchedule() {
  try {
    const [payload, guinnessPayload] = await Promise.all([
      apiFetch("/api/matches"),
      apiFetch("/api/guinness/top-rated"),
    ]);
    matches = payload.matches;
    topRatedGuinness = guinnessPayload.venues;
    renderDateFilterOptions();
    setScheduleMessage(payload.message);
  } catch {
    matches = [];
    topRatedGuinness = [];
    setScheduleMessage("The cached match schedule is temporarily unavailable. Please try again shortly.");
  }
  renderPopularMatches();
  renderTopRatedGuinness();
  renderMatchList();
}

function renderPopularMatches() {
  const container = document.querySelector("#popular-match-list");
  const now = Date.now();
  const popularMatches = [...matches]
    .filter((match) => isUpcomingMatch(match, now))
    .sort((a, b) => (b.interestedCount || 0) - (a.interestedCount || 0))
    .slice(0, 3);

  if (!popularMatches.length) {
    container.innerHTML = `<p class="popular-match-empty">No upcoming matches yet.</p>`;
    return;
  }

  container.innerHTML = popularMatches.map((match) => `
    <button class="popular-match" data-open-popular-match="${match.id}" type="button">
      <span class="popular-match-copy">
        <span class="popular-match-teams">${teamWithFlag(match.homeTeamNameSnapshot, match.homeFlagEmoji)} <span class="versus">vs</span> ${teamWithFlag(match.awayTeamNameSnapshot, match.awayFlagEmoji)}</span>
        <span class="popular-match-date">${formatPopularMatchDate(match)}</span>
        <span class="popular-match-location">${formatPopularMatchLocation(match)}</span>
      </span>
      <strong>${match.interestedCount || 0} ${match.interestedCount === 1 ? "attendee" : "attendees"}</strong>
    </button>
  `).join("");
}

function isUpcomingMatch(match, now = Date.now()) {
  return new Date(match.kickoffUtc).getTime() > now;
}

function formatPopularMatchDate(match) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Vancouver",
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(match.kickoffUtc));
}

function formatPopularMatchLocation(match) {
  const winners = match.winningVenues || [];
  if (!winners.length) return "No venue votes yet";
  const label = winners.length > 1 ? "Tied" : "Leading";
  return `${label} · ${winners.map((venue) => escapeHtml(venue.name)).join(" / ")}`;
}

function renderTopRatedGuinness() {
  const container = document.querySelector("#top-guinness-list");
  if (!topRatedGuinness.length) {
    container.innerHTML = `<p class="top-guinness-empty">No Guinness ratings yet. Rate a pint on the venue map to set the first leaderboard.</p>`;
    return;
  }
  container.innerHTML = topRatedGuinness.map((venue, index) => `
    <article class="top-guinness-card">
      <span class="top-guinness-rank">#${index + 1}</span>
      <span class="top-guinness-copy">
        <strong>${escapeHtml(venue.name)}</strong>
        <small>${escapeHtml(venue.neighbourhood)}</small>
      </span>
      <span class="top-guinness-score">${venue.guinnessRatingCount ? `★ ${Number(venue.guinnessRatingAverage).toFixed(1)}<small>${venue.guinnessRatingCount} ${venue.guinnessRatingCount === 1 ? "rating" : "ratings"}</small>` : `Not rated<small>Be the first</small>`}</span>
    </article>
  `).join("");
}

function renderDateFilterOptions() {
  const current = matchDateFilter.value;
  const dates = [...new Set(matches.map((match) => match.kickoffLocal?.slice(0, 10)).filter(Boolean))];
  matchDateFilter.innerHTML = `<option value="">All dates</option>${dates.map((date) => {
    const label = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Vancouver",
      month: "short",
      day: "numeric",
      weekday: "short",
    }).format(new Date(`${date}T12:00:00-07:00`));
    return `<option value="${date}">${label}</option>`;
  }).join("")}`;
  matchDateFilter.value = dates.includes(current) ? current : "";
}

function setScheduleMessage(message) {
  const element = document.querySelector("#schedule-message");
  element.textContent = message || "";
  element.classList.toggle("is-hidden", !message);
}

function renderMatchList() {
  const container = document.querySelector("#match-list");
  const filteredMatches = matches.filter((match) => {
    const teams = `${match.homeTeamNameSnapshot} ${match.awayTeamNameSnapshot}`.toLowerCase();
    return (!matchFilters.team || teams.includes(matchFilters.team))
      && (!matchFilters.date || match.kickoffLocal?.startsWith(matchFilters.date))
      && (!matchFilters.watching || match.currentCharacterInterested);
  });
  const stages = new Set(filteredMatches.map((match) => match.stage).filter(Boolean));
  document.querySelector("#match-count").textContent = filteredMatches.length
    ? `${filteredMatches.length}${filteredMatches.length !== matches.length ? ` of ${matches.length}` : ""} ${stages.size === 1 && stages.has("Group stage") ? "group-stage " : ""}matches`
    : "No matches";
  const filtersActive = Boolean(matchFilters.team || matchFilters.date || matchFilters.watching);
  clearMatchFiltersButton.classList.toggle("is-hidden", !filtersActive);
  const now = Date.now();
  const upcomingMatches = filteredMatches.filter((match) => !isPastMatch(match, now));
  const pastMatches = filteredMatches.filter((match) => isPastMatch(match, now));
  let matchIndex = 0;
  const upcomingMarkup = renderMatchDays(upcomingMatches, () => matchIndex++);
  const pastMarkup = renderMatchDays(pastMatches, () => matchIndex++);

  if (!filteredMatches.length) {
    container.innerHTML = `<p class="empty-filter-results">No matches fit those filters.</p>`;
    return;
  }

  container.innerHTML = [
    upcomingMarkup || (!filtersActive ? `<p class="empty-filter-results">No upcoming matches fit those filters.</p>` : ""),
    pastMatches.length
      ? `<details class="past-matches" ${filtersActive && !upcomingMatches.length ? "open" : ""}>
          <summary>
            <span>Past matches</span>
            <strong>${pastMatches.length} ${pastMatches.length === 1 ? "match" : "matches"}</strong>
          </summary>
          ${pastMarkup}
        </details>`
      : "",
  ].join("");
}

function isPastMatch(match, now = Date.now()) {
  return new Date(match.kickoffUtc).getTime() + 2 * 60 * 60 * 1000 < now;
}

function renderMatchDays(dayMatches, nextIndex) {
  const matchesByDay = dayMatches.reduce((groups, match) => {
    const date = match.kickoffLocal?.slice(0, 10) || match.kickoffUtc.slice(0, 10);
    if (!groups.has(date)) groups.set(date, []);
    groups.get(date).push(match);
    return groups;
  }, new Map());

  return [...matchesByDay.entries()].map(([date, matchesForDay]) => {
    const dateLabel = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Vancouver",
      weekday: "long",
      month: "long",
      day: "numeric",
    }).format(new Date(`${date}T12:00:00-07:00`));
    const cards = matchesForDay.map((match) => renderMatchCard(match, nextIndex())).join("");
    return `
      <section class="match-day" aria-labelledby="match-day-${date}">
        <div class="match-day-heading">
          <h3 id="match-day-${date}">${dateLabel}</h3>
          <span>${matchesForDay.length} ${matchesForDay.length === 1 ? "match" : "matches"}</span>
        </div>
        <div class="match-day-grid">${cards}</div>
      </section>
    `;
  }).join("");
}

function renderMatchCard(match, index) {
  const kickoff = new Date(match.kickoffUtc);
    const day = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Vancouver", day: "2-digit" }).format(kickoff);
    const month = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Vancouver", month: "short" }).format(kickoff).toUpperCase();
    const time = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Vancouver", hour: "numeric", minute: "2-digit" }).format(kickoff);
    const winners = match.winningVenues || [];
    const winningText = winners.length
      ? `${winners.length > 1 ? "Tied" : "Leading"} · ${winners.map((venue) => venue.name).join(" / ")}`
      : "No venue votes yet";
    const interestedCharacters = match.interestedCharacters || [];

    return `
      <article class="match-card ${index === 0 ? "featured" : ""}" data-open-match="${match.id}" role="button" tabindex="0" aria-label="Open ${match.homeTeamNameSnapshot} vs ${match.awayTeamNameSnapshot}">
        <div class="date-tile"><strong>${day}</strong><span>${month}</span></div>
        <div class="match-info">
          <span class="match-tag">${match.groupName || match.stage || "World Cup 2026"}</span>
          <h3>${teamWithFlag(match.homeTeamNameSnapshot, match.homeFlagEmoji)} <span class="versus">vs</span> ${teamWithFlag(match.awayTeamNameSnapshot, match.awayFlagEmoji)}</h3>
          <p>${time} · ${match.stadium || match.city || "Venue TBD"}</p>
          <p class="your-plan">${winningText}</p>
        </div>
        <div class="going ${match.interestedCount ? "" : "empty"}">
          ${renderInterestedCharacters(interestedCharacters)}
          <strong>${match.interestedCount || "Be first"}${match.interestedCount ? " watching" : ""}</strong>
          <span>${winners.length ? `${winners[0].voteCount} top vote${winners[0].voteCount === 1 ? "" : "s"}` : "Pick a venue"}</span>
          <button class="interest-button ${match.currentCharacterInterested ? "is-selected" : ""}" data-toggle-interest="${match.id}" type="button">
            ${match.currentCharacterInterested ? "Watching ✓" : "Want to watch"}
          </button>
        </div>
        <span class="card-button" aria-hidden="true">&rarr;</span>
      </article>
    `;
}

function renderInterestedCharacters(characters, options = {}) {
  if (!characters.length) return "";
  const full = options.variant === "full";
  return `<div class="matchday-mini-stack ${full ? "is-full" : ""}" aria-label="${characters.length} interested ${characters.length === 1 ? "person" : "people"}">${characters.map((person) => {
    const parts = characterParts(person.profile || {});
    return `
      <span class="matchday-person" title="${escapeHtml(person.displayName)} · Supports ${escapeHtml(parts.jersey.name)}">
        ${renderScaledMatchdayCharacter({ ...parts, variant: full ? "full" : "compact" })}
        <span class="matchday-person-name">${escapeHtml(person.displayName)}</span>
        <span class="matchday-person-team">${escapeHtml(parts.jersey.name)}</span>
      </span>
    `;
  }).join("")}</div>`;
}

function characterParts(personProfile = {}) {
  return {
    skin: skins.find((item) => item.id === personProfile.skin)?.color || skins[1].color,
    hair: hairColors.find((item) => item.id === personProfile.hairColor)?.color || hairColors[0].color,
    hairStyle: hairStyles.find((item) => item.id === personProfile.hair)?.id || "fade",
    face: faces.find((item) => item.id === personProfile.face)?.id || "smile",
    jersey: jerseys.find((item) => item.id === personProfile.jersey) || jerseys[0],
    drink: drinks.find((item) => item.id === personProfile.drink)?.id || "water",
    cleatColor: cleatColors.find((item) => item.id === personProfile.cleatColor)?.color || cleatColors[0].color,
  };
}

function renderScaledMatchdayCharacter({ skin, hair, hairStyle, face, jersey, drink, cleatColor, variant = "compact" }) {
  return `
    <span class="matchday-character-frame is-${variant}" aria-hidden="true">
      <span class="character matchday-character" style="--skin:${skin};--hair:${hair};--jersey:${jersey.main};--jersey-alt:${jersey.alt};--jersey-trim:${jersey.trim};--cleat-color:${cleatColor}">
        <span class="hair hair-${hairStyle}"></span>
        <span class="head">
          <span class="brows"></span>
          <span class="eyes"></span>
          <span class="mouth mouth-${face}"></span>
        </span>
        <span class="neck"></span>
        <span class="body">
          <span class="jersey-detail"></span>
          <span class="jersey-crest">${escapeHtml(jersey.code)}</span>
        </span>
        <span class="arm arm-left"></span>
        <span class="arm arm-right"></span>
        <span class="drink drink-${drink}" aria-hidden="true">
          <span class="drink-liquid"></span>
          <span class="stout-glass-holder">${stoutGlassArt()}</span>
          <span class="caesar-glass-holder">${caesarGlassArt()}</span>
          <span class="spritz-glass-holder">${spritzGlassArt()}</span>
        </span>
        <span class="shorts"></span>
        <span class="leg leg-left"></span>
        <span class="leg leg-right"></span>
        <span class="cleat cleat-left"><span class="cleat-laces"></span><span class="cleat-stud cleat-stud-a"></span><span class="cleat-stud cleat-stud-b"></span></span>
        <span class="cleat cleat-right"><span class="cleat-laces"></span><span class="cleat-stud cleat-stud-a"></span><span class="cleat-stud cleat-stud-b"></span></span>
      </span>
    </span>
  `;
}

function renderVenueAttendees(match) {
  const container = document.querySelector("#venue-attendees");
  const characters = match.interestedCharacters || [];
  container.innerHTML = characters.length
    ? `
      <p class="venue-attendees-label">${characters.length} attending</p>
      ${renderInterestedCharacters(characters, { variant: "full" })}
    `
    : `
      <p class="venue-attendees-label">No one attending yet</p>
      <span class="venue-attendees-empty">Be first to attend.</span>
    `;
}

function escapeHtml(value) {
  return String(value || "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]);
}

function teamWithFlag(name, flag) {
  const words = name.split(" ");
  const finalWord = words.pop();
  const prefix = words.length ? `${words.join(" ")} ` : "";
  return `${prefix}<span class="team-name-flag">${finalWord}${flag ? ` <span class="team-flag" aria-hidden="true">${flag}</span>` : ""}</span>`;
}

function soccerBallArt() {
  return `
    <svg class="soccer-ball-art" viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      <circle class="ball-base" cx="50" cy="50" r="47"></circle>
      <path class="classic-panel classic-panel-center" d="M50 31 68 44 61 65 39 65 32 44Z"></path>
      <path class="classic-panel" d="M50 2 62 10 57 24 43 24 38 10Z"></path>
      <path class="classic-panel" d="M94 28 99 42 88 52 75 43 80 29Z"></path>
      <path class="classic-panel" d="M82 83 70 97 55 91 57 75 72 68Z"></path>
      <path class="classic-panel" d="M18 83 30 97 45 91 43 75 28 68Z"></path>
      <path class="classic-panel" d="M6 28 1 42 12 52 25 43 20 29Z"></path>
      <path class="classic-seams" d="M50 31V24M68 44l7-1M61 65l11 3M39 65l-11 3M32 44l-7-1M57 24l23 5M88 52l-6 31M55 91H45M18 83l-6-31M20 29l23-5"></path>
      <circle class="ball-shine" cx="34" cy="27" r="8"></circle>
    </svg>
  `;
}

function watchTvArt() {
  return `
    <svg class="watch-tv-art" viewBox="0 0 72 64" aria-hidden="true" focusable="false">
      <path class="tv-antenna" d="M31 14 19 1M38 14 51 1"></path>
      <circle class="tv-antenna-hub" cx="35" cy="14" r="4"></circle>
      <rect class="tv-case" x="2" y="13" width="68" height="44" rx="6"></rect>
      <rect class="tv-case-inset" x="5" y="16" width="62" height="38" rx="4"></rect>
      <path class="tv-screen" d="M9 19c10-3 27-3 37 0v31c-10 3-27 3-37 0Z"></path>
      <path class="tv-screen-shine" d="M13 23c5-3 10-4 16-4-8 5-12 11-15 19Z"></path>
      <path class="tv-screen-glint" d="M43 43c-3 4-7 6-13 7 6 0 11-.5 14-2Z"></path>
      <circle class="tv-dial" cx="57" cy="24" r="5"></circle>
      <path class="tv-dial-mark" d="m57 20 2 4-3 2"></path>
      <circle class="tv-dial" cx="57" cy="36" r="4"></circle>
      <path class="tv-dial-mark" d="m57 33-2 3 3 1"></path>
      <circle class="tv-button" cx="52" cy="46" r="1.4"></circle>
      <circle class="tv-button" cx="59" cy="46" r="1.4"></circle>
      <path class="tv-speaker" d="M50 50h14M50 53h14M52 48v7M56 48v7M60 48v7M64 48v7"></path>
      <path class="tv-feet" d="m16 57-5 6h12l3-6m30 0 3 6h12l-5-6"></path>
    </svg>
  `;
}

function guinnessTapArt() {
  return `
    <svg class="guinness-map-art" viewBox="0 0 56 68" aria-hidden="true" focusable="false">
      <path class="guinness-glass" d="M9 6h38l-3 48c-.4 6-5 10-11 10H23c-6 0-10.6-4-11-10Z"></path>
      <path class="guinness-head" d="M10 7h36l-1 12H11Z"></path>
      <path class="guinness-harp" d="M32 27c-8 1-11 5-10 14 1 7 7 9 12 6-6 1-8-2-8-7 0-6 2-10 6-13Zm0 0v20"></path>
      <text class="guinness-g" x="28" y="57" text-anchor="middle">G</text>
    </svg>
  `;
}

function hydrateTournamentBalls(root = document) {
  root.querySelectorAll(".tournament-ball").forEach((ball) => {
    if (!ball.querySelector(".soccer-ball-art")) ball.innerHTML = soccerBallArt();
  });
}

function hydrateWatchTvs(root = document) {
  root.querySelectorAll(".watch-tv").forEach((tv) => {
    if (!tv.querySelector(".watch-tv-art")) tv.innerHTML = watchTvArt();
  });
}

function renderVenueMap() {
  const mappedVenues = venues.filter((venue) => venue.latitude != null && venue.longitude != null);
  if (!window.L || !mappedVenues.length) {
    document.querySelector("#watch-map").innerHTML = `<p class="map-unavailable">Accurate venue coordinates are unavailable.</p>`;
    renderVenueDetail();
    return;
  }

  if (!venueMap) {
    venueMap = L.map("watch-map", {
      scrollWheelZoom: false,
      zoomControl: true,
      minZoom: 10,
      maxZoom: 17,
    });
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',
      maxZoom: 19,
    }).addTo(venueMap);
    const bounds = L.latLngBounds(mappedVenues.map((venue) => [venue.latitude, venue.longitude])).pad(0.32);
    venueMap.fitBounds(bounds, { padding: [28, 28], maxZoom: 12 });
    venueMap.on("zoomend", () => renderVenueMarkers(mappedVenues));
  }

  renderVenueMarkers(mappedVenues);
  renderVenueDetail();
}

function groupVenuesForMap(mappedVenues) {
  const zoom = venueMap.getZoom();
  const mobileFactor = venueMap.getSize().x < 600 ? 1.8 : 1;
  const cellSize = (zoom <= 11 ? 0.025 : zoom <= 12 ? 0.012 : zoom <= 13 ? 0.006 : 0) * mobileFactor;
  if (!cellSize) return mappedVenues.map((venue) => [venue]);

  const groups = new Map();
  mappedVenues.forEach((venue) => {
    const key = venue.id === selectedVenueId
      ? venue.id
      : `${Math.round(venue.latitude / cellSize)}:${Math.round(venue.longitude / cellSize)}`;
    const group = groups.get(key) || [];
    group.push(venue);
    groups.set(key, group);
  });
  return [...groups.values()];
}

function renderVenueMarkers(mappedVenues) {
  venueMarkers.forEach((marker) => marker.remove());
  venueMarkers = groupVenuesForMap(mappedVenues).map((group, index) => {
    if (group.length > 1) {
      const latitude = group.reduce((sum, venue) => sum + venue.latitude, 0) / group.length;
      const longitude = group.reduce((sum, venue) => sum + venue.longitude, 0) / group.length;
      const marker = L.marker([latitude, longitude], {
        title: `${group.length} watch-party venues`,
        alt: `Zoom to ${group.length} watch-party venues`,
        icon: L.divIcon({
          className: "venue-map-marker-wrap",
          html: `
            <span class="venue-map-marker is-cluster" style="--delay:${(index % 12) * -0.17}s">
              ${watchTvArt()}
              <span class="marker-cluster-count">${group.length}</span>
            </span>
          `,
          iconSize: [48, 46],
          iconAnchor: [24, 42],
        }),
      }).addTo(venueMap);
      marker.getElement()?.setAttribute("aria-label", `Zoom to ${group.length} watch-party venues`);
      marker.on("click", () => venueMap.setView([latitude, longitude], Math.min(venueMap.getZoom() + 2, 17)));
      return marker;
    }

    const venue = group[0];
    const selected = venue.id === selectedVenueId;
    const marker = L.marker([venue.latitude, venue.longitude], {
      title: venue.name,
      alt: `Open ${venue.name}`,
      icon: L.divIcon({
        className: "venue-map-marker-wrap",
        html: `
          <span class="venue-map-marker ${venue.servesGuinnessTap ? "has-guinness" : ""} ${selected ? "is-active" : ""} ${venue.currentCharacterVoted ? "is-voted" : ""}" style="--delay:${(index % 12) * -0.17}s">
            ${venue.servesGuinnessTap ? guinnessTapArt() : watchTvArt()}
            <span class="map-pin-count">${venue.voteCount}</span>
          </span>
        `,
        iconSize: [44, 42],
        iconAnchor: [22, 38],
      }),
      zIndexOffset: selected ? 1000 : 0,
    }).addTo(venueMap);
    marker.getElement()?.setAttribute("aria-label", `Open ${venue.name}${venue.servesGuinnessTap ? ", Guinness on tap" : ""}, ${venue.voteCount} votes`);
    marker.on("click", async () => {
      if (selected && venue.currentCharacterVoted) {
        await toggleVenueVote(venue.id);
        return;
      }
      selectedVenueId = venue.id;
      renderVenueMarkers(mappedVenues);
      renderVenueDetail();
      scrollVenueDetailIntoView();
    });
    return marker;
  });
}

function scrollVenueDetailIntoView() {
  if (!window.matchMedia("(max-width: 640px)").matches) return;
  const detail = document.querySelector("#venue-detail");
  requestAnimationFrame(() => {
    detail.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      block: "start",
    });
  });
}

function scrollVenueMapIntoView() {
  const map = document.querySelector("#watch-map");
  requestAnimationFrame(() => {
    map.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      block: "start",
    });
  });
}

function renderVenueDetail() {
  const container = document.querySelector("#venue-detail");
  const venue = venues.find((item) => item.id === selectedVenueId);
  if (!venue) {
    container.innerHTML = `
      <div class="venue-detail-empty">
        <span class="venue-detail-tv watch-tv" aria-hidden="true">${watchTvArt()}</span>
        <p class="eyebrow">Select a venue</p>
        <h3>Choose a marker on the map.</h3>
        <p>The venue address, watch-party details, links, and voting will appear here.</p>
      </div>
    `;
    return;
  }

  const rating = venue.ratingAverage
    ? `<a class="venue-rating" href="${venue.ratingSourceUrl || venue.websiteUrl || "#"}" ${venue.ratingSourceUrl || venue.websiteUrl ? 'target="_blank" rel="noreferrer"' : ""}>★ ${Number(venue.ratingAverage).toFixed(1)}${venue.ratingCount ? ` · ${venue.ratingCount} ratings` : ""}</a>`
    : "";
  const photo = venue.latestPhotoUrl
    ? `<img src="${venue.latestPhotoUrl}" alt="Latest view from ${venue.name}" />`
    : "";
  const links = [
    venue.ratingSourceUrl && `<a href="${venue.ratingSourceUrl}" target="_blank" rel="noreferrer">Google Business ↗</a>`,
    venue.reservationUrl && `<a href="${venue.reservationUrl}" target="_blank" rel="noreferrer">Reservations ↗</a>`,
    venue.menuUrl && `<a href="${venue.menuUrl}" target="_blank" rel="noreferrer">View menu ↗</a>`,
    venue.socialUrl && `<a href="${venue.socialUrl}" target="_blank" rel="noreferrer">Social profile ↗</a>`,
    venue.websiteUrl && `<a href="${venue.websiteUrl}" target="_blank" rel="noreferrer">Website ↗</a>`,
    venue.sourceUrl && `<a href="${venue.sourceUrl}" target="_blank" rel="noreferrer">Watch-party source ↗</a>`,
    venue.guinnessSourceUrl && `<a href="${venue.guinnessSourceUrl}" target="_blank" rel="noreferrer">Guinness source ↗</a>`,
  ].filter(Boolean);
  const watchPartyDetails = [
    venue.tvCount != null && `<span><strong>${venue.tvCount}</strong> TV${venue.tvCount === 1 ? "" : "s"}</span>`,
    venue.specials && `<span><strong>Specials</strong>${venue.specials}</span>`,
    venue.watchPartyDetails && `<span><strong>Watch-party setup</strong>${venue.watchPartyDetails}</span>`,
    venue.venueType && `<span><strong>Venue type</strong>${venue.venueType}</span>`,
    venue.confirmedWorldCup && `<span><strong>Confirmed</strong>World Cup watch party</span>`,
    venue.servesGuinnessTap && `<span><strong>Guinness</strong>Confirmed on tap</span>`,
  ].filter(Boolean);
  const hasVerifiedDetails = Boolean(
    venue.confirmedWorldCup
    || venue.servesGuinnessTap
    || venue.tvCount != null
    || venue.specials
    || venue.watchPartyDetails
    || venue.sourceUrl
  );
  const verificationNote = !venue.confirmedWorldCup && venue.servesGuinnessTap
    ? "Not watch-party verified. This is a curated Guinness-on-tap stop, but World Cup screening has not been confirmed."
    : !hasVerifiedDetails
      ? "We haven’t verified this venue’s watch-party setup yet."
      : "";
  const guinnessRating = venue.servesGuinnessTap ? `
    <div class="guinness-rating">
      <div>
        <p class="eyebrow">Rate the Guinness</p>
        <strong>${venue.guinnessRatingAverage ? `${Number(venue.guinnessRatingAverage).toFixed(1)} / 5` : "No ratings yet"}</strong>
        ${venue.guinnessRatingCount ? `<span>${venue.guinnessRatingCount} ${venue.guinnessRatingCount === 1 ? "rating" : "ratings"}</span>` : ""}
      </div>
      <div class="guinness-stars" role="group" aria-label="Rate the Guinness at ${escapeHtml(venue.name)}">
        ${[1, 2, 3, 4, 5].map((ratingValue) => `
          <button class="${ratingValue <= (venue.currentCharacterGuinnessRating || 0) ? "is-selected" : ""}" data-guinness-rating="${ratingValue}" data-venue-id="${venue.id}" type="button" aria-label="${ratingValue} star${ratingValue === 1 ? "" : "s"}">★</button>
        `).join("")}
      </div>
    </div>
  ` : "";

  container.innerHTML = `
    ${photo ? `
      <div class="venue-detail-photo">
        ${photo}
        ${venue.latestPhotoSourceUrl ? `<a href="${venue.latestPhotoSourceUrl}" target="_blank" rel="noreferrer">${venue.latestPhotoSourceLabel || "Photo source"} ↗</a>` : ""}
      </div>
    ` : ""}
    <div class="venue-detail-copy">
      <p class="eyebrow">${venue.neighbourhood}</p>
      <h3>${venue.name}</h3>
      <p>${venue.address}</p>
      <div class="venue-detail-meta">
        <strong>${venue.voteCount} vote${venue.voteCount === 1 ? "" : "s"}</strong>
        ${rating}
      </div>
      ${watchPartyDetails.length ? `
        <div class="venue-watch-details">
          <p class="eyebrow">${venue.confirmedWorldCup ? "Watch-party details" : "Venue details"}</p>
          ${watchPartyDetails.join("")}
        </div>
      ` : ""}
      ${links.length ? `<div class="venue-detail-links">${links.join("")}</div>` : ""}
      ${verificationNote ? `<p class="venue-verification-note">${verificationNote}</p>` : ""}
      ${guinnessRating}
      ${venue.confirmedWorldCup || venue.servesGuinnessTap ? `
        <button class="primary-button venue-vote-button" data-choose-venue="${venue.id}" type="button">
          <span>${venue.currentCharacterVoted ? "Remove my vote" : "Vote for this spot"}</span>
          <span aria-hidden="true">${venue.currentCharacterVoted ? "×" : "→"}</span>
        </button>
      ` : ""}
    </div>
  `;
}

async function showVenuePicker(matchId, options = {}) {
  const match = matches.find((item) => item.id === matchId);
  if (!match) return;
  activeMatchId = matchId;
  document.querySelector("#venue-match-tag").textContent = match.groupName || match.stage || "World Cup 2026";
  document.querySelector("#venue-picker-title").innerHTML = `${teamWithFlag(match.homeTeamNameSnapshot, match.homeFlagEmoji)} <span class="versus">vs</span> ${teamWithFlag(match.awayTeamNameSnapshot, match.awayFlagEmoji)}`;
  const kickoff = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Vancouver",
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(match.kickoffUtc));
  document.querySelector("#venue-match-time").textContent = `${kickoff} · ${match.stadium || match.city || "Venue TBD"}`;
  renderVenueAttendees(match);

  onboarding.classList.add("is-hidden");
  siteHeader.classList.remove("is-hidden");
  dashboard.classList.add("is-hidden");
  venuePicker.classList.remove("is-hidden");
  editProfileButton.classList.remove("is-hidden");
  backToCharacterButton.classList.add("is-hidden");
  const payload = await apiFetch(`/api/matches/${matchId}/venues`);
  venues = payload.venues;
  selectedVenueId = venues.find((venue) => venue.currentCharacterVoted)?.id || "";
  if (venueMap) {
    venueMap.remove();
    venueMap = null;
  }
  renderVenueMap();
  setTimeout(() => {
    venueMap?.invalidateSize();
    if (options.focusMap) {
      scrollVenueMapIntoView();
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, 0);
}

async function toggleVenueVote(venueId) {
  const venue = venues.find((item) => item.id === venueId);
  if (!venue) return;
  const removingVote = Boolean(venue.currentCharacterVoted);
  const payload = await apiFetch(`/api/matches/${activeMatchId}/venue-vote`, {
    method: removingVote ? "DELETE" : "POST",
    body: JSON.stringify({
      venueId,
      profile: removingVote ? undefined : profile,
    }),
  });
  venues = payload.venues;
  selectedVenueId = removingVote ? "" : venueId;
  renderVenueMap();
  await loadSchedule();
  const match = matches.find((item) => item.id === activeMatchId);
  if (match) renderVenueAttendees(match);
}

document.addEventListener("click", async (event) => {
  const guinnessRatingButton = event.target.closest("[data-guinness-rating]");
  if (guinnessRatingButton) {
    const payload = await apiFetch(`/api/venues/${guinnessRatingButton.dataset.venueId}/guinness-rating`, {
      method: "POST",
      body: JSON.stringify({ rating: Number(guinnessRatingButton.dataset.guinnessRating) }),
    });
    const venue = venues.find((item) => item.id === guinnessRatingButton.dataset.venueId);
    if (venue) {
      venue.guinnessRatingAverage = payload.rating.average;
      venue.guinnessRatingCount = payload.rating.count;
      venue.currentCharacterGuinnessRating = payload.rating.currentCharacterRating;
      renderVenueDetail();
    }
    return;
  }

  const venueButton = event.target.closest("[data-choose-venue]");
  if (venueButton) {
    await toggleVenueVote(venueButton.dataset.chooseVenue);
    return;
  }

  const interestButton = event.target.closest("[data-toggle-interest]");
  if (interestButton) {
    const match = matches.find((item) => item.id === interestButton.dataset.toggleInterest);
    const alreadyWatching = Boolean(match.currentCharacterInterested);
    await apiFetch(`/api/matches/${match.id}/interest`, {
      method: alreadyWatching ? "DELETE" : "POST",
      body: alreadyWatching ? undefined : JSON.stringify({ profile }),
    });
    await loadSchedule();
    if (!alreadyWatching) await showVenuePicker(match.id, { focusMap: true });
    return;
  }

  const openMatchButton = event.target.closest("[data-open-match]");
  if (openMatchButton && !event.target.closest("button, a, input, select")) {
    await showVenuePicker(openMatchButton.dataset.openMatch);
    return;
  }

  const popularMatchButton = event.target.closest("[data-open-popular-match]");
  if (popularMatchButton) {
    await showVenuePicker(popularMatchButton.dataset.openPopularMatch);
    return;
  }

  const button = event.target.closest("[data-option]");
  if (!button) return;

  profile[button.dataset.option] = button.dataset.value;
  updateCharacter();
});

document.addEventListener("keydown", async (event) => {
  const matchCard = event.target.closest(".match-card[data-open-match]");
  if (!matchCard || event.target.closest("button, a, input, select") || !["Enter", " "].includes(event.key)) return;
  event.preventDefault();
  await showVenuePicker(matchCard.dataset.openMatch);
});

profileForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  profile.name = nameInput.value.trim();
  if (!profile.name) {
    nameInput.focus();
    return;
  }
  if (!profile.id) profile.id = createCharacterId();

  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  await apiFetch("/api/character", {
    method: "POST",
    body: JSON.stringify({ profile }),
  });
  await loadSchedule();
  showDashboard();
});

editProfileButton.addEventListener("click", showBuilder);
backToCharacterButton.addEventListener("click", showBuilder);
document.querySelector("#back-to-matches").addEventListener("click", showDashboard);
matchTeamFilter.addEventListener("input", () => {
  matchFilters.team = matchTeamFilter.value.trim().toLowerCase();
  renderMatchList();
});
matchDateFilter.addEventListener("change", () => {
  matchFilters.date = matchDateFilter.value;
  renderMatchList();
});
matchWatchingFilter.addEventListener("change", () => {
  matchFilters.watching = matchWatchingFilter.checked;
  renderMatchList();
});
clearMatchFiltersButton.addEventListener("click", () => {
  matchFilters.team = "";
  matchFilters.date = "";
  matchFilters.watching = false;
  matchTeamFilter.value = "";
  matchDateFilter.value = "";
  matchWatchingFilter.checked = false;
  renderMatchList();
});
document.querySelector("#jersey-more").addEventListener("change", (event) => {
  if (!event.target.value) return;
  profile.jersey = event.target.value;
  updateCharacter();
});
requestToggle.addEventListener("click", () => {
  const open = requestSuggestion.classList.contains("is-hidden");
  requestSuggestion.classList.toggle("is-hidden", !open);
  requestToggle.classList.toggle("is-selected", open);
  requestToggle.setAttribute("aria-expanded", open ? "true" : "false");
  requestFeedback.classList.add("is-hidden");
  if (open) requestSuggestionInput.focus();
});
requestSendButton.addEventListener("click", async () => {
  const requestText = requestSuggestionInput.value.trim();
  if (!requestText) {
    requestSuggestionInput.focus();
    return;
  }

  requestSendButton.disabled = true;
  requestFeedback.textContent = "";
  requestFeedback.classList.add("is-hidden");
  try {
    profile.name = nameInput.value.trim() || profile.name || "Friend";
    await apiFetch("/api/option-requests", {
      method: "POST",
      body: JSON.stringify({ requestText }),
    });
    requestSuggestionInput.value = "";
    requestFeedback.textContent = "Sent. We will review it for the next update.";
    requestFeedback.classList.remove("is-hidden");
  } catch {
    requestFeedback.textContent = "Could not send that request. Please try again.";
    requestFeedback.classList.remove("is-hidden");
  } finally {
    requestSendButton.disabled = false;
  }
});

async function initialize() {
  document.querySelector(".stout-glass-holder").innerHTML = stoutGlassArt();
  document.querySelector(".caesar-glass-holder").innerHTML = caesarGlassArt();
  document.querySelector(".spritz-glass-holder").innerHTML = spritzGlassArt();
  renderOptions();
  hydrateTournamentBalls();
  hydrateWatchTvs();
  try {
    const savedProfile = JSON.parse(localStorage.getItem(PROFILE_KEY));
    if (savedProfile?.name) {
      Object.assign(profile, savedProfile);
      if (!profile.id) profile.id = createCharacterId();
      if (!hairStyles.some((hair) => hair.id === profile.hair)) profile.hair = "fade";
      if (!hairColors.some((hairColor) => hairColor.id === profile.hairColor)) profile.hairColor = "black";
      if (!drinks.some((drink) => drink.id === profile.drink)) profile.drink = "water";
      if (!cleatColors.some((cleatColor) => cleatColor.id === profile.cleatColor)) profile.cleatColor = "black";
      if (!jerseys.some((jersey) => jersey.id === profile.jersey)) profile.jersey = "can";
      delete profile.requestType;
      delete profile.requestDetail;
      localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
      await loadSchedule();
      showDashboard();
    } else {
      profile.id = createCharacterId();
      showBuilder();
    }
  } catch {
    localStorage.removeItem(PROFILE_KEY);
    profile.id = createCharacterId();
    showBuilder();
  }
}

initialize();
