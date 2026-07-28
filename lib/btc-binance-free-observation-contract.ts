import { createHash } from "node:crypto";

export const BTC_BINANCE_FREE_OBSERVATION_SCHEMA =
  "btc_market_cosmographer_binance_free_observation_public_candidate_v0_1" as const;
export const BTC_BINANCE_FREE_OBSERVATION_CANDIDATE_SHA256 =
  "b0bfa9c6489e5eff94233a903d6c29b9e31122c30499f84f1328e2ad19943aa3" as const;
export const BTC_BINANCE_FREE_OBSERVATION_DATA_PATH =
  "data/btc-binance-free-observation-v0-1.json" as const;
export const BTC_BINANCE_FREE_OBSERVATION_FILE_SHA256 =
  "e8f109f8b17d6c5e38bb2c2e5ea28ee56cee07c98bda7ab60c758aea7c2f1494" as const;

const DERIVED_KEYS = [
  "drawdown_from_trailing_365d_high",
  "quote_volume_ratio_to_prior_30d_median",
  "range_position_30d",
  "realized_volatility_30d_annualized",
  "return_1d",
  "return_30d",
  "return_7d",
  "trend_persistence_30d",
] as const;

export type BtcBinanceDerivedMetric = (typeof DERIVED_KEYS)[number];

export type BtcBinanceFreeObservation = {
  schema_version: typeof BTC_BINANCE_FREE_OBSERVATION_SCHEMA;
  status: "PASS_PUBLIC_CANDIDATE_SHADOW_ONLY";
  mode: "FREE_HISTORICAL_OBSERVATION";
  observation: {
    target_date: "2024-04-20";
    context_start: "2024-01-22";
    context_end: "2024-04-20";
    provider: "Binance";
    venue: "Binance Spot";
    instrument: "BTCUSDT";
    interval: "1d";
    quote_asset: "USDT";
    open_usdt: number;
    high_usdt: number;
    low_usdt: number;
    close_usdt: number;
    volume_btc: number;
    quote_volume_usdt: number;
    trade_count: number;
  };
  derived_market: Record<BtcBinanceDerivedMetric, number>;
  cosmographer_context: {
    market_state: "MIXED_30D_TREND";
    trend_structure: "FRAGMENTED";
    cross_layer_confirmation: "NO_STRONG_ACTIVITY_CONFIRMATION";
    cross_layer_divergence: "ASTRO_ACTIVITY_DOMINANT";
    meaning: string;
  };
  evidence_card: {
    claim_type: "OBSERVED_AND_DERIVED";
    provider: "Binance";
    venue: "Binance Spot";
    instrument: "BTCUSDT";
    interval: "1d";
    observation_period: {
      target: "2024-04-20";
      context_start: "2024-01-22";
      context_end: "2024-04-20";
    };
    method_id: "BTC_BINANCE_FREE_OBSERVATION_SHADOW_READER_v0_1";
    source_archive_set_sha256: string;
    target_market_row_sha256: string;
    astro_packet_sha256: string;
    shadow_join_sha256: string;
    rights_state: "PUBLIC_FREE_SANITIZED_DERIVED_VENUE_OBSERVATION_WITH_PROVENANCE";
    attribution_en: string;
    attribution_ru: string;
    boundary_statement: string;
    independence_notice: string;
  };
  uncertainty: [string, string, string, string];
  integration: {
    mode: "ADDITIVE_PANEL_SEPARATE_FROM_EXISTING_QUESTION_RESULT";
    feature_flag: "BTC_BINANCE_FREE_OBSERVATION_ENABLED";
    feature_flag_default: false;
    fallback: "CURRENT_STATIC_BTC_CORRIDOR";
    rollback: "DISABLE_FEATURE_FLAG_NO_DATA_MIGRATION";
    direct_replacement: false;
    public_activation: false;
  };
  boundary: {
    read_only: true;
    free_observation_only: true;
    historical_observation: true;
    maximum_observed_rows: 1;
    historical_window_rows_exposed: 0;
    raw_provider_payload_exposed: false;
    private_corpus_rows_exposed: false;
    paid_question: false;
    payment_activation: false;
    no_global_btc_usd_claim: true;
    no_trading_signal: true;
    no_forecast: true;
    no_investment_recommendation: true;
    current_static_corridor_fallback_preserved: true;
  };
  candidate_sha256: typeof BTC_BINANCE_FREE_OBSERVATION_CANDIDATE_SHA256;
};

export class BtcBinanceObservationContractError extends Error {
  constructor(readonly code: string) {
    super(code);
    this.name = "BtcBinanceObservationContractError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function exactKeys(value: Record<string, unknown>, keys: readonly string[]): boolean {
  const actual = Object.keys(value);
  return actual.length === keys.length && keys.every((key) => Object.prototype.hasOwnProperty.call(value, key));
}

function finite(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function sha(value: unknown): value is string {
  return typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
}

export function computeBtcBinanceObservationFileSha256(raw: string): string {
  return createHash("sha256").update(raw, "utf8").digest("hex");
}

export function guardBtcBinanceFreeObservation(value: unknown): value is BtcBinanceFreeObservation {
  if (!isRecord(value) || !exactKeys(value, [
    "boundary", "candidate_sha256", "cosmographer_context", "derived_market", "evidence_card",
    "integration", "mode", "observation", "schema_version", "status", "uncertainty",
  ])) return false;
  if (value.schema_version !== BTC_BINANCE_FREE_OBSERVATION_SCHEMA
    || value.status !== "PASS_PUBLIC_CANDIDATE_SHADOW_ONLY"
    || value.mode !== "FREE_HISTORICAL_OBSERVATION"
    || value.candidate_sha256 !== BTC_BINANCE_FREE_OBSERVATION_CANDIDATE_SHA256) return false;

  const observation = value.observation;
  if (!isRecord(observation) || !exactKeys(observation, [
    "close_usdt", "context_end", "context_start", "high_usdt", "instrument", "interval", "low_usdt",
    "open_usdt", "provider", "quote_asset", "quote_volume_usdt", "target_date", "trade_count", "venue", "volume_btc",
  ])) return false;
  if (observation.target_date !== "2024-04-20" || observation.context_start !== "2024-01-22"
    || observation.context_end !== "2024-04-20" || observation.provider !== "Binance"
    || observation.venue !== "Binance Spot" || observation.instrument !== "BTCUSDT"
    || observation.interval !== "1d" || observation.quote_asset !== "USDT") return false;
  if (!["open_usdt", "high_usdt", "low_usdt", "close_usdt", "volume_btc", "quote_volume_usdt", "trade_count"]
    .every((key) => finite(observation[key]) && (observation[key] as number) >= 0)) return false;
  if (!Number.isInteger(observation.trade_count)) return false;

  const derived = value.derived_market;
  if (!isRecord(derived) || !exactKeys(derived, DERIVED_KEYS) || !DERIVED_KEYS.every((key) => finite(derived[key]))) return false;

  const context = value.cosmographer_context;
  if (!isRecord(context) || !exactKeys(context, [
    "cross_layer_confirmation", "cross_layer_divergence", "market_state", "meaning", "trend_structure",
  ])) return false;
  if (context.market_state !== "MIXED_30D_TREND" || context.trend_structure !== "FRAGMENTED"
    || context.cross_layer_confirmation !== "NO_STRONG_ACTIVITY_CONFIRMATION"
    || context.cross_layer_divergence !== "ASTRO_ACTIVITY_DOMINANT"
    || typeof context.meaning !== "string" || !context.meaning.includes("No causality")) return false;

  const evidence = value.evidence_card;
  if (!isRecord(evidence) || !exactKeys(evidence, [
    "astro_packet_sha256", "attribution_en", "attribution_ru", "boundary_statement", "claim_type",
    "independence_notice", "instrument", "interval", "method_id", "observation_period", "provider",
    "rights_state", "shadow_join_sha256", "source_archive_set_sha256", "target_market_row_sha256", "venue",
  ])) return false;
  if (evidence.claim_type !== "OBSERVED_AND_DERIVED" || evidence.provider !== "Binance"
    || evidence.venue !== "Binance Spot" || evidence.instrument !== "BTCUSDT" || evidence.interval !== "1d"
    || evidence.method_id !== "BTC_BINANCE_FREE_OBSERVATION_SHADOW_READER_v0_1"
    || evidence.rights_state !== "PUBLIC_FREE_SANITIZED_DERIVED_VENUE_OBSERVATION_WITH_PROVENANCE") return false;
  if (![evidence.source_archive_set_sha256, evidence.target_market_row_sha256, evidence.astro_packet_sha256, evidence.shadow_join_sha256].every(sha)) return false;
  if (![evidence.attribution_en, evidence.attribution_ru, evidence.boundary_statement, evidence.independence_notice]
    .every((item) => typeof item === "string" && item.length > 10)) return false;
  const period = evidence.observation_period;
  if (!isRecord(period) || !exactKeys(period, ["context_end", "context_start", "target"])
    || period.target !== "2024-04-20" || period.context_start !== "2024-01-22" || period.context_end !== "2024-04-20") return false;

  if (!Array.isArray(value.uncertainty) || value.uncertainty.length !== 4
    || !value.uncertainty.every((item) => typeof item === "string" && item.length > 20)) return false;

  const integration = value.integration;
  if (!isRecord(integration) || !exactKeys(integration, [
    "direct_replacement", "fallback", "feature_flag", "feature_flag_default", "mode", "public_activation", "rollback",
  ])) return false;
  if (integration.mode !== "ADDITIVE_PANEL_SEPARATE_FROM_EXISTING_QUESTION_RESULT"
    || integration.feature_flag !== "BTC_BINANCE_FREE_OBSERVATION_ENABLED"
    || integration.feature_flag_default !== false || integration.fallback !== "CURRENT_STATIC_BTC_CORRIDOR"
    || integration.rollback !== "DISABLE_FEATURE_FLAG_NO_DATA_MIGRATION"
    || integration.direct_replacement !== false || integration.public_activation !== false) return false;

  const boundary = value.boundary;
  if (!isRecord(boundary) || !exactKeys(boundary, [
    "current_static_corridor_fallback_preserved", "free_observation_only", "historical_observation",
    "historical_window_rows_exposed", "maximum_observed_rows", "no_forecast", "no_global_btc_usd_claim",
    "no_investment_recommendation", "no_trading_signal", "paid_question", "payment_activation",
    "private_corpus_rows_exposed", "raw_provider_payload_exposed", "read_only",
  ])) return false;
  if (boundary.read_only !== true || boundary.free_observation_only !== true || boundary.historical_observation !== true
    || boundary.maximum_observed_rows !== 1 || boundary.historical_window_rows_exposed !== 0
    || boundary.raw_provider_payload_exposed !== false || boundary.private_corpus_rows_exposed !== false
    || boundary.paid_question !== false || boundary.payment_activation !== false
    || boundary.no_global_btc_usd_claim !== true || boundary.no_trading_signal !== true
    || boundary.no_forecast !== true || boundary.no_investment_recommendation !== true
    || boundary.current_static_corridor_fallback_preserved !== true) return false;

  return true;
}

export function parseBtcBinanceFreeObservation(value: unknown): BtcBinanceFreeObservation {
  if (!guardBtcBinanceFreeObservation(value)) throw new BtcBinanceObservationContractError("BTC_BINANCE_OBSERVATION_CONTRACT_INVALID");
  return value;
}
