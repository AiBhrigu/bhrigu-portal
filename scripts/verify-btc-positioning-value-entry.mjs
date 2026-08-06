import fs from "node:fs";

const read = (path) => fs.readFileSync(path, "utf8");
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const home = read("pages/index.js");
const header = read("components/BhriguPhiHeader.jsx");
const entry = read("pages/crypto-astro/btc.tsx");
const hero = read("components/btc/BtcHeroQuestionLaunch.tsx");
const membrane = read("components/btc/BtcQuestionMembrane.tsx");
const dialogue = read("components/btc/BtcCosmographerDialogue.tsx");

assert(home.includes("For self-directed Bitcoin investors with multi-week to multi-month decision horizons"), "EN primary audience missing from Home");
assert(home.includes("Для самостоятельных Bitcoin-инвесторов с горизонтом решений от нескольких недель до нескольких месяцев"), "RU primary audience missing from Home");
assert(home.includes("Ask what changed in Bitcoin"), "EN primary CTA missing");
assert(home.includes("Спросить, что изменилось в Bitcoin"), "RU primary CTA missing");
assert(home.includes("btcQuestionHref"), "Home CTA is not bound to a prepared question");
assert(hero.includes("data-primary-btc-change-question=\"true\""), "BTC entry one-click question marker missing");
assert(hero.includes("previous accepted Snapshot"), "Prepared EN change question missing");
assert(hero.includes("предыдущего принятого Snapshot"), "Prepared RU change question missing");
assert(header.includes("const btc = path.startsWith(\"/crypto-astro/btc\")"), "BTC header route not isolated");
assert(header.includes("home || btc"), "BTC header still falls through to generic Frey/ORION navigation");
assert(entry.includes("Self-directed Bitcoin investors with multi-week to multi-month decision horizons"), "Structured audience missing from BTC entry");
assert(!entry.includes("Источник публикации"), "Visible RU deployment SHA disclosure remains");
assert(!entry.includes("Deployment source\"} · <code>"), "Visible EN deployment SHA disclosure remains");
assert(membrane.indexOf("data-prepared-routes-before-outcomes") < membrane.indexOf("data-outcomes-after-prepared-routes"), "Prepared questions do not precede outcome explanation");
assert(dialogue.includes("data-btc-market-prepared=\"primary\""), "Empty live state does not prioritize BTC market questions");
assert(dialogue.includes("data-bitcoin-origins-secondary=\"true\""), "Origins questions are not retained as a secondary lane");
assert(dialogue.indexOf("data-btc-market-prepared=\"primary\"") < dialogue.indexOf("data-bitcoin-origins-secondary=\"true\""), "Origins still precede current BTC questions");
assert(!home.includes("BTC_SUPPORT"), "Support scope leaked into Home");
assert(!home.includes("TOKEN_ROLE"), "Token scope leaked into Home");

console.log(JSON.stringify({
  schema_version: "bhrigu_btc_positioning_value_entry_acceptance_v0_1",
  primary_audience: "PASS",
  one_click_prepared_question: "PASS",
  primary_cta: "PASS",
  prepared_routes_before_outcomes: "PASS",
  live_market_questions_primary: "PASS",
  origins_secondary: "PASS",
  btc_header_role_separation: "PASS",
  visible_deployment_sha_removed: "PASS",
  support_scope: "UNCHANGED_HOLD",
  token_scope: "UNCHANGED_UNDEFINED"
}));
