import assert from "node:assert/strict";
import fs from "node:fs";
import {
  BTC_COSMOGRAPHER_CONTEXT_SCHEMA,
  routeBtcCosmographerQuestion,
  type BtcCosmographerContextPacket,
  type BtcCosmographerRoute,
} from "../lib/btc-cosmographer-route-graph";

type DialogueCase = {
  locale: "ru" | "en";
  turn1: string;
  turn2: string;
};

const cases: DialogueCase[] = [
  {
    locale: "ru",
    turn1: "Планетарные аспекты 2026 — где самые сильные окна?",
    turn2: "Где в этих окнах волатильность BTC самая высокая?",
  },
  {
    locale: "en",
    turn1: "Planetary aspects in 2026 — where are the strongest windows?",
    turn2: "Where is BTC volatility highest in these windows?",
  },
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

const fingerprints: Record<string, unknown> = {};

for (const dialogue of cases) {
  const first = routeBtcCosmographerQuestion(dialogue.locale, dialogue.turn1, null);
  assert.equal(first.domain, "astromodule", `${dialogue.locale}: turn 1 must open Astro Field`);
  assert.equal(first.subject, "planetary_aspects", `${dialogue.locale}: turn 1 subject`);
  assert.equal(first.time_range?.start, "2026-01-01", `${dialogue.locale}: turn 1 period start`);
  assert.equal(first.time_range?.end, "2026-12-31", `${dialogue.locale}: turn 1 period end`);

  const second = routeBtcCosmographerQuestion(
    dialogue.locale,
    dialogue.turn2,
    contextFrom(first),
  );

  assert.equal(second.domain, "astro_btc_bridge", `${dialogue.locale}: turn 2 domain`);
  assert.equal(second.context_relation, "CROSS_MODULE_BRIDGE", `${dialogue.locale}: turn 2 relation`);
  assert.equal(second.subject, "planetary_aspects", `${dialogue.locale}: active Astro subject retained`);
  assert.equal(second.time_range?.start, "2026-01-01", `${dialogue.locale}: context period start retained`);
  assert.equal(second.time_range?.end, "2026-12-31", `${dialogue.locale}: context period end retained`);
  assert.equal(second.time_range?.source, "CONTEXT", `${dialogue.locale}: period must be context-bound`);
  assert.equal(second.market_question_class, "temporal_pressure", `${dialogue.locale}: BTC evidence class required`);
  assert.ok(second.intents.includes("interval_analysis"), `${dialogue.locale}: interval analysis required`);
  assert.notEqual(second.context_relation, "GENUINELY_AMBIGUOUS", `${dialogue.locale}: no clarification`);
  assert.notEqual(second.confidence, "LOW", `${dialogue.locale}: no low-confidence clarification path`);

  fingerprints[dialogue.locale] = {
    domain: second.domain,
    relation: second.context_relation,
    subject: second.subject,
    period_start: second.time_range?.start,
    period_end: second.time_range?.end,
    period_source: second.time_range?.source,
    market_class: second.market_question_class,
    confidence: second.confidence,
  };
}

assert.deepEqual(fingerprints.en, fingerprints.ru, "RU/EN semantic parity must hold");

const live = fs.readFileSync("pages/crypto-astro/btc/live.tsx", "utf8");
assert.match(
  live,
  /\["btc_market", "snapshot_memory", "astro_btc_bridge"\]\.includes\(route\.domain\)/,
  "astro_btc_bridge must require BTC market evidence on the live corridor",
);

console.log("BTC_NATURAL_ASTRO_TO_BTC_ANAPHORIC_WINDOW_BRIDGE_ACCEPTANCE=PASS");
