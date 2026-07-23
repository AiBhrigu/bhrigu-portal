import {
  BTC_GOLDEN_MODULE_IDS,
  buildBtcMarketEnvelopeFromDocuments,
  classifyBtcEnvelopeQuestion,
} from "../lib/btc-market-envelope";

declare const process: { exitCode?: number };

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const boundary = {
  read_only: true, static_public_snapshot: true, no_live_adapter_claim: true,
  no_true_live_feed_claim: true, no_trading_signal: true, no_forecast: true,
  no_price_target: true, no_investment_recommendation: true, backend_api_closed: true,
  runtime_closed: true, payment_closed: true, orion_core_protected: true, formula_weights_exposed: false,
};

function snapshot(at: string, price: number, score: number, breadth24: number, breadth7: number, dominance: number, tvl: number) {
  return {
    schema_version: "crypto_astro_snapshot_public_v0_1", generated_at_utc: at, source_mode: "static_public_snapshot",
    market_reality: { total_market_cap_usd: 2_000_000, volume_24h_usd: 200_000, market_cap_change_24h_pct: -1,
      btc_dominance_pct: dominance, eth_dominance_pct: 10, stablecoin_cap_usd: 300_000, stablecoin_share_pct: 13.2 },
    field_output: { market_field_score: score, regime_label: "Balanced Expansion", direction_bias: "Neutral", continuation_label: "Scenario", confidence_label: "static" },
    probability_continuation: { base_path_pct: 60, expansion_path_pct: 25, compression_reversal_pct: 15, window_label: "7D", boundary: "Scenario only. Not a forecast." },
    liquidity_tvl: { stablecoin_cap_usd: 300_000, defi_tvl_usd: tvl, defi_tvl_methodology_id: "defillama_historical_chain_tvl_ex_double_count_v0_1",
      defi_tvl_methodology: "DefiLlama historicalChainTvl; excludes liquid staking and double-counted TVL.", defi_tvl_excludes_liquid_staking: true,
      defi_tvl_excludes_double_counted: true, dex_volume_24h_usd: 50_000, liquidity_context_state: "context fresh" },
    altcoin_rotation: { alt_breadth_24h_pct: breadth24, alt_breadth_7d_pct: breadth7, eth_rotation_anchor_pct: 10, top_10_flow_concentration_pct: 65 },
    public_samples: { assets: { BTC: { price_usd: price, market_24h_change_pct: -1, market_7d_change_pct: 2, market_30d_change_pct: 4 } } },
    boundary,
  };
}

const previousAt = "2026-07-22T08:00:00Z";
const currentAt = "2026-07-22T12:00:00Z";
const previous = snapshot(previousAt, 64_000, 72, 35, 42, 57, 76_000_000_000);
const current = snapshot(currentAt, 65_000, 70, 32, 44, 56.9, 77_000_000_000);
const currentCommit = "a".repeat(40);
const previousCommit = "b".repeat(40);
const hash = "c".repeat(64);
const proofSources = Array.from({ length: 7 }, (_, index) => ({ label: `source_${index}`, url: `https://example.com/${index}`, status: "PASS" }));
const proof = { schema_version: "crypto_astro_snapshot_proof_public_v0_1", generated_at_utc: currentAt, sources: proofSources };
const marketField = { schema_version: "crypto_astro_market_field_public_v0_2", updated_at_utc: currentAt };
const bindings = { schema_version: "crypto_astro_public_module_bindings_v0_1", generated_at_utc: currentAt };
const methodologyIds: Record<string, string> = {
  btc_gravity_pct: "m1", stablecoin_share_pct: "m2", alt_breadth_24h_pct: "m3", alt_breadth_7d_pct: "m4",
  market_field_score: "m5", regime_label: "m6", defi_tvl_usd: "defillama_historical_chain_tvl_ex_double_count_v0_1", liquidity_context_state: "m8",
};
const registry = {
  schema_version: "crypto_astro_snapshot_registry_public_v0_2", registry_generated_at_utc: currentAt, selection_policy: "EXPLICIT_ACCEPTED_PAIR",
  current: { acceptance_status: "ACCEPTED", generated_at_utc: currentAt, commit_sha: currentCommit, snapshot_id: "current", snapshot_sha256: hash, proof_sha256: hash, bindings_sha256: hash },
  previous: { acceptance_status: "ACCEPTED", generated_at_utc: previousAt, commit_sha: previousCommit, snapshot_id: "previous", snapshot_sha256: hash, proof_sha256: hash, bindings_sha256: hash },
  metric_methodologies: Object.fromEntries(Object.entries(methodologyIds).map(([id, methodology]) => [id, { comparable: true, current_methodology_id: methodology, previous_methodology_id: methodology }])),
};
function numeric(currentValue: number, previousValue: number, methodology: string, unit = "percent") {
  const delta = currentValue - previousValue;
  return { current_value: String(currentValue), previous_value: String(previousValue), raw_delta: String(delta), display_delta: `${delta >= 0 ? "+" : ""}${delta.toFixed(1)}`,
    direction: delta > 0 ? "UP" : delta < 0 ? "DOWN" : "UNCHANGED", status: "COMPARABLE", type: "NUMERIC", unit, methodology_id: methodology, proof_sources: ["source_0"] };
}
const delta = {
  schema_version: "crypto_astro_snapshot_delta_public_v0_2", generated_at_utc: currentAt, comparison_status: "FULL_COMPARABLE",
  current_snapshot_id: "current", previous_snapshot_id: "previous", unavailable_metrics: {},
  metrics: {
    btc_gravity_pct: numeric(56.9, 57, methodologyIds.btc_gravity_pct),
    stablecoin_share_pct: numeric(13.2, 13.1, methodologyIds.stablecoin_share_pct),
    alt_breadth_24h_pct: numeric(32, 35, methodologyIds.alt_breadth_24h_pct),
    alt_breadth_7d_pct: numeric(44, 42, methodologyIds.alt_breadth_7d_pct),
    market_field_score: numeric(70, 72, methodologyIds.market_field_score, "score_0_100"),
    regime_label: { current_value: "Balanced Expansion", previous_value: "Balanced Expansion", transition: "UNCHANGED", status: "COMPARABLE", type: "CATEGORICAL", unit: "state", methodology_id: methodologyIds.regime_label, proof_sources: ["source_0"] },
    defi_tvl_usd: numeric(77_000_000_000, 76_000_000_000, methodologyIds.defi_tvl_usd, "usd"),
    liquidity_context_state: { current_value: "context fresh", previous_value: "context fresh", transition: "UNCHANGED", status: "COMPARABLE", type: "CATEGORICAL", unit: "state", methodology_id: methodologyIds.liquidity_context_state, proof_sources: ["source_0"] },
  },
};

for (const [question, expected] of [
  ["What changed since the previous accepted snapshot?", "change_memory"],
  ["What does BTC dominance show?", "btc_gravity"],
  ["How is DeFi liquidity and DEX volume?", "liquidity"],
  ["What does alt breadth and rotation show?", "market_participation_rotation"],
  ["What is the temporal pressure?", "temporal_pressure"],
] as const) assert(classifyBtcEnvelopeQuestion(question) === expected, `classifier:${expected}`);

const result = buildBtcMarketEnvelopeFromDocuments("What changed in the BTC field?", {
  snapshot: current, previousSnapshot: previous, proof, marketField, bindings, registry, delta,
}, { now: new Date("2026-07-23T00:00:00Z"), temporal: { state: "available_bounded", label: "bounded", harmonic_tension: 0.62 } });
assert(result.ok, "envelope fixture must pass");
assert(result.value.route.primary_modules.length === 2, "exactly two primary modules");
assert(new Set([...result.value.route.primary_modules, ...result.value.route.supporting_modules, ...result.value.route.unavailable_modules]).size === BTC_GOLDEN_MODULE_IDS.length, "five-node partition");
assert(result.value.memory.comparable_metric_count === 8, "eight comparable memory metrics");
assert(result.value.memory.methodology_compatible, "methodology compatibility");
assert(result.value.verified_history.available && result.value.verified_history.checkpoints.length === 2, "two immutable checkpoints");
assert(result.value.synthesis.state === "DIVERGENCE", "mixed fixture must route to divergence");
assert(result.value.synthesis.what_changed.some((line) => line.includes("BTC dominance")), "what changed uses Snapshot Delta");
assert(result.value.boundary.no_trading_signal && result.value.boundary.no_forecast && result.value.boundary.no_price_target, "public boundary");

const incompatibleRegistry = JSON.parse(JSON.stringify(registry));
incompatibleRegistry.metric_methodologies.defi_tvl_usd.comparable = false;
const incompatible = buildBtcMarketEnvelopeFromDocuments("What changed?", {
  snapshot: current, previousSnapshot: previous, proof, marketField, bindings, registry: incompatibleRegistry, delta,
}, { now: new Date("2026-07-23T00:00:00Z") });
assert(incompatible.ok, "incompatible metric is suppressed rather than invented");
assert(!incompatible.value.memory.methodology_compatible, "methodology mismatch visible");
assert(incompatible.value.memory.unavailable_metrics.includes("defi_tvl_usd"), "incompatible metric unavailable");

const stale = buildBtcMarketEnvelopeFromDocuments("What changed?", {
  snapshot: current, previousSnapshot: previous, proof, marketField, bindings, registry, delta,
}, { now: new Date("2026-07-27T00:00:00Z") });
assert(stale.ok && stale.value.current.source_freshness === "STALE_LIMITED", "stale limited behavior");
assert(stale.value.synthesis.state === "INSUFFICIENT_EVIDENCE", "stale evidence fails closed");

console.log("BTC_MARKET_ENVELOPE_FIXTURE=PASS");
