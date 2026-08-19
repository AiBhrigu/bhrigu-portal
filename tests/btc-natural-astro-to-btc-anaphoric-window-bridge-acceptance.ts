import assert from "node:assert/strict";
import fs from "node:fs";
import {
  BTC_COSMOGRAPHER_CONTEXT_SCHEMA,
  routeBtcCosmographerQuestion,
  type BtcCosmographerContextPacket,
  type BtcCosmographerRoute,
} from "../lib/btc-cosmographer-route-graph";

type Locale = "ru" | "en";
type BridgeCase = {
  id: string;
  locale: Locale;
  turn1: string;
  turn2: string;
  expectedMarketClass: string;
};

const RU_TURN_1 = "Планетарные аспекты 2026 — где самые сильные окна?";
const EN_TURN_1 = "Planetary aspects in 2026 — where are the strongest windows?";

const bridgeCases: BridgeCase[] = [
  { id: "RU_1", locale: "ru", turn1: RU_TURN_1,
    turn2: "Где в этих окнах волатильность BTC самая высокая?",
    expectedMarketClass: "temporal_pressure" },
  { id: "RU_2", locale: "ru", turn1: RU_TURN_1,
    turn2: "А в них где волатильность BTC выше?",
    expectedMarketClass: "temporal_pressure" },
  { id: "RU_3", locale: "ru", turn1: RU_TURN_1,
    turn2: "Где в этих окнах ликвидность BTC выше?",
    expectedMarketClass: "liquidity" },
  { id: "EN_1", locale: "en", turn1: EN_TURN_1,
    turn2: "Where is BTC volatility highest in these windows?",
    expectedMarketClass: "temporal_pressure" },
  { id: "EN_2", locale: "en", turn1: EN_TURN_1,
    turn2: "Which of these windows has higher BTC liquidity?",
    expectedMarketClass: "liquidity" },
  { id: "EN_3", locale: "en", turn1: EN_TURN_1,
    turn2: "How did BTC move in these windows?",
    expectedMarketClass: "change_memory" },
];

function contextFrom(route: BtcCosmographerRoute): BtcCosmographerContextPacket {
  return {
    schema: BTC_COSMOGRAPHER_CONTEXT_SCHEMA,
    prior_domain: route.domain,
    prior_subject: route.subject,
    prior_intents: route.intents,
    prior_answer_state: "CONFIRMED",
    prior_market_question_class: route.market_question_class,
    prior_time_start: route.time_range?.start ?? null,
    prior_time_end: route.time_range?.end ?? null,
    prior_snapshot_generated_at_utc: null,
  };
}

function firstTurn(locale: Locale, question: string): BtcCosmographerRoute {
  const first = routeBtcCosmographerQuestion(locale, question, null);
  assert.equal(first.domain, "astromodule", `${locale}: turn 1 must open Astro Field`);
  assert.equal(first.subject, "planetary_aspects", `${locale}: turn 1 subject`);
  assert.equal(first.time_range?.start, "2026-01-01", `${locale}: turn 1 period start`);
  assert.equal(first.time_range?.end, "2026-12-31", `${locale}: turn 1 period end`);
  return first;
}

const results = new Map<string, BtcCosmographerRoute>();

for (const dialogue of bridgeCases) {
  const first = firstTurn(dialogue.locale, dialogue.turn1);
  const second = routeBtcCosmographerQuestion(
    dialogue.locale,
    dialogue.turn2,
    contextFrom(first),
  );

  assert.equal(second.domain, "astro_btc_bridge", `${dialogue.id}: turn 2 domain`);
  assert.equal(second.context_relation, "CROSS_MODULE_BRIDGE", `${dialogue.id}: turn 2 relation`);
  assert.equal(second.subject, "planetary_aspects", `${dialogue.id}: active Astro subject retained`);
  assert.equal(second.time_range?.start, "2026-01-01", `${dialogue.id}: context period start retained`);
  assert.equal(second.time_range?.end, "2026-12-31", `${dialogue.id}: context period end retained`);
  assert.equal(second.time_range?.source, "CONTEXT", `${dialogue.id}: period must be context-bound`);
  assert.equal(second.market_question_class, dialogue.expectedMarketClass, `${dialogue.id}: BTC market classification`);
  assert.ok(second.intents.includes("interval_analysis"), `${dialogue.id}: interval analysis required`);
  assert.notEqual(second.context_relation, "GENUINELY_AMBIGUOUS", `${dialogue.id}: no clarification`);
  assert.notEqual(second.confidence, "LOW", `${dialogue.id}: no low-confidence clarification path`);
  results.set(dialogue.id, second);
}

function parityFingerprint(route: BtcCosmographerRoute) {
  return {
    domain: route.domain,
    relation: route.context_relation,
    subject: route.subject,
    period_start: route.time_range?.start,
    period_end: route.time_range?.end,
    period_source: route.time_range?.source,
    market_class: route.market_question_class,
    confidence: route.confidence,
  };
}

assert.deepEqual(
  parityFingerprint(results.get("EN_1")!),
  parityFingerprint(results.get("RU_1")!),
  "RU/EN volatility semantic parity must hold",
);
assert.deepEqual(
  parityFingerprint(results.get("EN_2")!),
  parityFingerprint(results.get("RU_3")!),
  "RU/EN liquidity semantic parity must hold",
);

const ruContext = contextFrom(firstTurn("ru", RU_TURN_1));
const enContext = contextFrom(firstTurn("en", EN_TURN_1));

const pureAstro = routeBtcCosmographerQuestion(
  "en",
  "Which of these windows is astronomically strongest?",
  enContext,
);
assert.equal(pureAstro.domain, "astromodule", "pure Astro window question must remain Astro");
assert.notEqual(pureAstro.context_relation, "CROSS_MODULE_BRIDGE", "pure Astro question must not bridge to BTC");

const directBtc = routeBtcCosmographerQuestion(
  "ru",
  "Что сейчас с волатильностью BTC?",
  ruContext,
);
assert.equal(directBtc.domain, "btc_market", "direct BTC volatility question must route to BTC market");
assert.equal(directBtc.market_question_class, "temporal_pressure", "direct BTC volatility keeps market class");
assert.notEqual(directBtc.context_relation, "CROSS_MODULE_BRIDGE", "direct BTC question needs no Astro bridge");

const protocolOnly = routeBtcCosmographerQuestion(
  "ru",
  "Что происходило с халвингом Bitcoin в этих окнах?",
  ruContext,
);
assert.notEqual(protocolOnly.domain, "astro_btc_bridge", "BTC token alone must not convert protocol-only wording into market bridge");
assert.notEqual(protocolOnly.context_relation, "CROSS_MODULE_BRIDGE", "protocol-only wording must not create Astro×BTC market bridge");

const causal = routeBtcCosmographerQuestion(
  "ru",
  "Вызывают ли эти аспекты рост волатильности BTC?",
  ruContext,
);
assert.equal(causal.domain, "astromodule", "existing causal-boundary route must remain Astro");
assert.equal(causal.subject, "planetary_aspects", "existing causal-boundary subject must remain intact");
assert.equal(causal.context_relation, "FOLLOW_UP", "existing causal-boundary relation must remain intact");
assert.equal(causal.market_question_class, null, "causal wording must not silently gain market authority");

const live = fs.readFileSync("pages/crypto-astro/btc/live.tsx", "utf8");
assert.match(
  live,
  /\["btc_market", "snapshot_memory", "astro_btc_bridge"\]\.includes\(route\.domain\)/,
  "astro_btc_bridge must require BTC market evidence on the live corridor",
);

console.log("BTC_NATURAL_ASTRO_TO_BTC_ANAPHORIC_WINDOW_BRIDGE_ACCEPTANCE=PASS");
console.log("MANDATORY_RU=3/3_PASS");
console.log("MANDATORY_EN=3/3_PASS");
console.log("NEGATIVE_CONTROLS=4/4_PASS");
console.log("RU_EN_SEMANTIC_PARITY=PASS");
