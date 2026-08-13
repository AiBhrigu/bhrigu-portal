import assert from "node:assert/strict";
import fs from "node:fs";
import {
  routeBtcCosmographerQuestion,
  type BtcCosmographerContextPacket,
} from "../lib/btc-cosmographer-route-graph";
import { applyBtcRelationIntentPrecedence } from "../lib/btc-cosmographer-evidence-navigation-runtime";
import { buildBtcCosmographerAnswer } from "../lib/btc-cosmographer-answer";
import { composeBtcPublicSnapshot } from "../lib/btc-public-snapshot-composer";

async function main() {
const prepared = [
  ["Подтверждают ли доля стейблкоинов, DeFi TVL и объём DEX текущие условия ликвидности BTC?", "btc_market", "liquidity"],
  ["Подтверждают ли режим, Market Field Score и рыночная капитализация текущую структуру BTC?", "btc_market", "market_structure"],
  ["Что показывает принятая Snapshot Memory по сравнению с предыдущим проверенным снимком?", "snapshot_memory", "change_memory"],
] as const;

for (const [question, domain, subject] of prepared) {
  const initial = routeBtcCosmographerQuestion("ru", question, null);
  const resolved = applyBtcRelationIntentPrecedence(initial, question, null);
  assert.equal(resolved.route.domain, domain, `prepared route domain: ${question}`);
  assert.equal(resolved.route.subject, subject, `prepared route subject: ${question}`);
  assert.equal(resolved.relation_resolution, "SINGLE_DOMAIN", `prepared route relation: ${question}`);
}
const jupiter = routeBtcCosmographerQuestion("ru", "Где находится Юпитер в августе 2026?", null);
const packet: BtcCosmographerContextPacket = {
  schema: "btc_cosmographer_context_v0_1",
  prior_domain: jupiter.domain,
  prior_subject: jupiter.subject,
  prior_intents: jupiter.intents,
  prior_answer_state: "CONFIRMED",
  prior_market_question_class: jupiter.market_question_class,
  prior_time_start: jupiter.time_range?.start ?? null,
  prior_time_end: jupiter.time_range?.end ?? null,
  prior_snapshot_generated_at_utc: "2026-08-12T03:05:07Z",
};
const mercury = routeBtcCosmographerQuestion("ru", "А Меркурий?", packet);
assert.equal(mercury.domain, "astromodule", "explicit Mercury must stay Astro");
assert.equal(mercury.subject, "mercury", "explicit Mercury must replace Jupiter");
assert.equal(mercury.time_range?.start, "2026-08-01", "compatible period retained");

for (const question of [
  "Юпитер и Меркурий в августе 2026?",
  "Юпитер или Меркурий — который важнее для BTC в августе 2026?",
]) {
  const route = routeBtcCosmographerQuestion("ru", question, null);
  const resolved = applyBtcRelationIntentPrecedence(route, question, null);
  assert.equal(resolved.route.domain, "unsupported", `multi-object must fail closed: ${question}`);
  assert.equal(resolved.route.subject, "multiple_planetary_objects", `multi-object subject: ${question}`);
}

const eth = routeBtcCosmographerQuestion("ru", "ETH сейчас?", null);
assert.equal(eth.domain, "unsupported", "standalone ETH must not become BTC market analysis");
const astroProtocolQuestion = "Как Юпитер связан с протоколом Bitcoin в августе 2026?";
const astroProtocolInitial = routeBtcCosmographerQuestion("ru", astroProtocolQuestion, null);
const astroProtocol = applyBtcRelationIntentPrecedence(astroProtocolInitial, astroProtocolQuestion, null);
assert.equal(astroProtocol.route.domain, "astro_btc_bridge", "Astro + Protocol must remain bridge");
assert.equal(astroProtocol.btc_side_state_type, "PROTOCOL", "BTC side must be Protocol");
assert.ok(astroProtocol.route.explicit_entities.includes("btc_side:protocol"), "Protocol side marker required");
const astroProtocolAnswer = buildBtcCosmographerAnswer("ru", astroProtocol.route, { snapshot: null, envelope: null });
assert.match(astroProtocolAnswer.headline, /Протокол Bitcoin/, "bridge headline must identify Protocol");
assert.match(astroProtocolAnswer.direct_answer, /протокол Bitcoin/i, "bridge answer must use protocol evidence");
assert.doesNotMatch(astroProtocolAnswer.direct_answer, /Гравитация BTC|Field Score|ликвидност/i, "market substitution forbidden");

const boundary = {
  read_only: true, static_public_snapshot: true, no_live_adapter_claim: true,
  no_true_live_feed_claim: true, no_trading_signal: true, no_forecast: true,
  no_price_target: true, no_investment_recommendation: true, backend_api_closed: true,
  runtime_closed: true, payment_closed: true, orion_core_protected: true, formula_weights_exposed: false,
} as const;
const at = "2026-08-12T03:05:07Z";
const labels = [
  "coingecko_global", "coingecko_asset_markets_btc_eth_sol_ton_icp", "coingecko_top250_markets",
  "coingecko_stablecoin_sample", "defillama_protocols", "defillama_dex_overview", "defillama_stablecoins",
];
const bundle: any = {
  ok: true,
  snapshot: {
    schema_version: "crypto_astro_snapshot_public_v0_1", generated_at_utc: at, source_mode: "static_public_snapshot",
    market_reality: { total_market_cap_usd: 2.27e12, volume_24h_usd: 5.19e10, market_cap_change_24h_pct: -0.05,
      btc_dominance_pct: 56.28, stablecoin_share_pct: 13.53 },
    field_output: { market_field_score: 65, regime_label: "Balanced Expansion", direction_bias: "Neutral → Bullish" },
    liquidity_tvl: { liquidity_context_state: "context fresh" },
    altcoin_rotation: { alt_breadth_24h_pct: 34 },
    public_samples: { assets: { BTC: { price_usd: 118000, market_cap_rank: 1, market_24h_change_pct: 0.5,
      market_7d_change_pct: 1.2, market_30d_change_pct: 3.4, market_context_label: "BTC market", score: 65 } } },
    boundary,
  },
  proof: {
    schema_version: "crypto_astro_snapshot_proof_public_v0_1", generated_at_utc: at, source_mode: "static_public_snapshot",
    sources: labels.map((label, index) => ({ label, url: `https://example.com/${index}`, status: "PASS",
      fetched_at_utc: at, sha256: String(index + 1).repeat(64).slice(0, 64), bytes: 100 + index })),
    boundary,
  },
  marketField: {
    field_output: { market_field_score: 65, regime_label: "Balanced Expansion", direction_bias: "Neutral → Bullish" },
    vectors: { CT_temporal: { state: "bounded" } },
  },
  freshness: "FRESH", age_hours: 1,
};
let temporalRunnerCalled = false;
const temporal = await composeBtcPublicSnapshot(bundle, {
  question: "Как выбранная дата меняет контекст наблюдения BTC и временное давление?",
  date: "2026-08-12",
  now: new Date("2026-08-12T04:00:00Z"),
  temporalRunner: async () => {
    temporalRunnerCalled = true;
    return {
      phase_density: 0.9, harmonic_tension: 0.9, resonance_level: 0.9,
      eclipse_proximity: 0.9, structural_stability: 0.9,
    };
  },
});
assert.equal(temporal.ok, true, "static temporal composition must remain valid");
if (temporal.ok) {
  assert.equal(temporalRunnerCalled, false, "unsupported numeric temporal runner must not execute");
  assert.equal(temporal.value.temporal_context.state, "static_state_only");
  assert.equal(temporal.value.temporal_context.label, "bounded_static_context");
  assert.equal(temporal.value.temporal_context.metrics, null);
  assert.equal(temporal.value.aspect_pressure.harmonic_tension, null);
  assert.equal(temporal.value.aspect_pressure.evidence_mode, "no_numeric_aspect_claim");
}

const livePage = fs.readFileSync("pages/crypto-astro/btc/live.tsx", "utf8");
const dialogue = fs.readFileSync("components/btc/BtcCosmographerDialogue.tsx", "utf8");
assert.ok(livePage.includes("buildEvidenceNavigation"), "exact evidence navigation must be bound server-side");
assert.ok(dialogue.includes('data-evidence-artifact-targets="exact"'), "exact evidence targets must render");
assert.ok(dialogue.includes("evidence_revision_id"), "evidence revision must be independent of market timestamp");

console.log("BTC_PUBLIC_CORRIDOR_PROVEN_DEFECT_REPAIR_ACCEPTANCE=PASS");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
