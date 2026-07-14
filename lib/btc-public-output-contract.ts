export const BTC_PUBLIC_SCHEMA = "bhrigu_btc_public_snapshot_v0_1" as const;
export const BTC_ASSET = { id: "bitcoin", symbol: "BTC", label: "Bitcoin" } as const;

export const BTC_PUBLIC_REQUIRED_FIELDS = [
  "request_id", "asset", "question", "observation_time_utc", "market_snapshot",
  "btc_gravity", "market_structure", "aspect_pressure", "temporal_context",
  "watch_conditions", "source_proof", "uncertainty", "boundary",
  "generated_at_utc", "deeper_access_route",
] as const;

export const BTC_QUESTION_LENSES = [
  "market_gravity",
  "market_structure",
  "pressure_context",
  "temporal_context",
  "general",
] as const;

export const FRESHNESS_STATES = ["FRESH", "STALE_LIMITED", "UNAVAILABLE"] as const;
export const TEMPORAL_STATES = ["available_bounded", "static_state_only", "unavailable"] as const;
export const TEMPORAL_METRIC_KEYS = [
  "phase_density",
  "harmonic_tension",
  "resonance_level",
  "eclipse_proximity",
  "structural_stability",
] as const;
export const TEMPORAL_ANALYSIS_KEYS = ["volatility_index", "coherence_score", "phase_bias"] as const;

export type BtcQuestionLens = (typeof BTC_QUESTION_LENSES)[number];
export type FreshnessState = (typeof FRESHNESS_STATES)[number];
export type TemporalState = (typeof TEMPORAL_STATES)[number];
export type TemporalMetricKey = (typeof TEMPORAL_METRIC_KEYS)[number];
export type TemporalAnalysisKey = (typeof TEMPORAL_ANALYSIS_KEYS)[number];

export type BtcFailureCode =
  | "invalid_input"
  | "source_missing"
  | "source_timeout"
  | "source_schema_invalid"
  | "proof_failed"
  | "snapshot_incompatible"
  | "snapshot_too_old"
  | "internal_composition_error";

export type SourceProofItem = {
  label: string;
  url: string;
  status: "PASS";
  fetched_at_utc: string;
  sha256: string;
  bytes: number;
};

export type TemporalMetrics = Record<TemporalMetricKey, number>;
export type TemporalAnalysis = Partial<Record<TemporalAnalysisKey, number>>;

export type BtcPublicBoundary = {
  read_only: true;
  static_public_snapshot: true;
  no_live_adapter_claim: true;
  no_true_live_feed_claim: true;
  no_trading_signal: true;
  no_forecast: true;
  no_price_target: true;
  no_investment_recommendation: true;
  backend_api_closed: true;
  runtime_closed: true;
  payment_closed: true;
  orion_core_protected: true;
  formula_weights_exposed: false;
};

export type BtcPublicSnapshot = {
  request_id: string;
  asset: typeof BTC_ASSET;
  question: {
    raw: string;
    normalized: string;
    lens: BtcQuestionLens;
    safe_reframed: boolean;
  };
  observation_time_utc: string;
  market_snapshot: {
    price_usd: number;
    change_24h_pct: number;
    change_7d_pct: number;
    change_30d_pct: number;
    total_market_cap_usd: number;
    volume_24h_usd: number;
    market_cap_change_24h_pct: number;
    source_generated_at_utc: string;
    freshness: FreshnessState;
  };
  btc_gravity: {
    dominance_pct: number;
    dominance_band: "high" | "balanced" | "lower";
    market_cap_rank: number;
    market_context_label: string;
    score: number;
  };
  market_structure: {
    regime_label: string;
    field_score: number;
    direction_bias: string;
    liquidity_state: string;
    stablecoin_share_pct: number;
    alt_breadth_24h_pct: number;
    context_only: true;
  };
  aspect_pressure: {
    state: TemporalState;
    pressure_band: "elevated" | "moderate" | "low" | null;
    harmonic_tension: number | null;
    evidence_mode: "bounded_numeric_metric" | "no_numeric_aspect_claim";
    label: string;
  };
  temporal_context: {
    state: TemporalState;
    label: "bounded_cosmographic_metric";
    observation_date: string;
    metrics: TemporalMetrics | null;
    analysis: TemporalAnalysis | null;
    limitation: string;
  };
  watch_conditions: string[];
  source_proof: {
    schema_version: "crypto_astro_snapshot_proof_public_v0_1";
    source_mode: "static_public_snapshot";
    generated_at_utc: string;
    sources: SourceProofItem[];
  };
  uncertainty: {
    freshness: string;
    question_limit: string;
    temporal_limit: string;
    source_limit: string;
  };
  boundary: BtcPublicBoundary;
  generated_at_utc: string;
  deeper_access_route: string;
};

export type BtcSourceFailure = {
  ok: false;
  code: BtcFailureCode;
  message: string;
  last_verified_at_utc?: string;
};

const REQUIRED_PROOF_LABEL_LIST = [
  "coingecko_global",
  "coingecko_asset_markets_btc_eth_sol_ton_icp",
  "coingecko_top250_markets",
  "coingecko_stablecoin_sample",
  "defillama_protocols",
  "defillama_dex_overview",
  "defillama_stablecoins",
] as const;
const REQUIRED_PROOF_LABELS = new Set<string>(REQUIRED_PROOF_LABEL_LIST);

const BOUNDARY_KEYS = [
  "read_only",
  "static_public_snapshot",
  "no_live_adapter_claim",
  "no_true_live_feed_claim",
  "no_trading_signal",
  "no_forecast",
  "no_price_target",
  "no_investment_recommendation",
  "backend_api_closed",
  "runtime_closed",
  "payment_closed",
  "orion_core_protected",
  "formula_weights_exposed",
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function hasExactKeys(value: Record<string, unknown>, expected: readonly string[]): boolean {
  const keys = Object.keys(value);
  return keys.length === expected.length && expected.every((key) => Object.prototype.hasOwnProperty.call(value, key));
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isFiniteInRange(value: unknown, min: number, max: number): value is number {
  return isFiniteNumber(value) && value >= min && value <= max;
}

function isNonEmptyString(value: unknown, maxLength = 4096): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.length <= maxLength;
}

function isUtcTimestamp(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value)) return false;
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime());
}

function isUtcDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function isHttpsUrl(value: unknown): value is string {
  if (typeof value !== "string" || value.length > 2048) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && Boolean(url.hostname) && !url.username && !url.password;
  } catch {
    return false;
  }
}

function isAccessRoute(value: unknown): value is string {
  return typeof value === "string"
    && value.length <= 4096
    && /^\/access(?:\?[^\s#]*)?$/.test(value)
    && !value.includes("://")
    && !value.startsWith("//");
}

function hasUnsafeSerializableValue(value: unknown, seen = new Set<object>()): boolean {
  if (value === undefined) return true;
  if (typeof value === "number") return !Number.isFinite(value);
  if (typeof value === "string") return value.trim().toLowerCase() === "undefined";
  if (value === null || typeof value === "boolean") return false;
  if (typeof value !== "object") return true;
  if (seen.has(value as object)) return true;
  seen.add(value as object);
  if (Array.isArray(value)) return value.some((item) => hasUnsafeSerializableValue(item, seen));
  return Object.values(value as Record<string, unknown>).some((item) => hasUnsafeSerializableValue(item, seen));
}

function isBoundary(value: unknown): value is BtcPublicBoundary {
  if (!isRecord(value) || !hasExactKeys(value, BOUNDARY_KEYS)) return false;
  return value.read_only === true
    && value.static_public_snapshot === true
    && value.no_live_adapter_claim === true
    && value.no_true_live_feed_claim === true
    && value.no_trading_signal === true
    && value.no_forecast === true
    && value.no_price_target === true
    && value.no_investment_recommendation === true
    && value.backend_api_closed === true
    && value.runtime_closed === true
    && value.payment_closed === true
    && value.orion_core_protected === true
    && value.formula_weights_exposed === false;
}

function isSourceProofItem(value: unknown): value is SourceProofItem {
  if (!isRecord(value) || !hasExactKeys(value, ["label", "url", "status", "fetched_at_utc", "sha256", "bytes"])) return false;
  return isNonEmptyString(value.label, 120)
    && isHttpsUrl(value.url)
    && value.status === "PASS"
    && isUtcTimestamp(value.fetched_at_utc)
    && typeof value.sha256 === "string"
    && /^[a-f0-9]{64}$/.test(value.sha256)
    && Number.isInteger(value.bytes)
    && (value.bytes as number) > 0;
}

function isTemporalMetrics(value: unknown): value is TemporalMetrics {
  if (!isRecord(value) || !hasExactKeys(value, TEMPORAL_METRIC_KEYS)) return false;
  return TEMPORAL_METRIC_KEYS.every((key) => isFiniteInRange(value[key], 0, 1));
}

function isTemporalAnalysis(value: unknown): value is TemporalAnalysis {
  if (!isRecord(value)) return false;
  const keys = Object.keys(value);
  if (keys.some((key) => !TEMPORAL_ANALYSIS_KEYS.includes(key as TemporalAnalysisKey))) return false;
  return keys.every((key) => {
    const range = key === "phase_bias" ? [-1, 1] : [0, 1];
    return isFiniteInRange(value[key], range[0], range[1]);
  });
}

export function guardBtcPublicSnapshot(value: unknown): value is BtcPublicSnapshot {
  if (!isRecord(value) || hasUnsafeSerializableValue(value)) return false;
  if (!hasExactKeys(value, BTC_PUBLIC_REQUIRED_FIELDS)) return false;

  if (typeof value.request_id !== "string" || !/^btc_pub_[a-z0-9]{8,64}$/.test(value.request_id)) return false;
  if (!isRecord(value.asset) || !hasExactKeys(value.asset, ["id", "symbol", "label"])) return false;
  if (value.asset.id !== BTC_ASSET.id || value.asset.symbol !== BTC_ASSET.symbol || value.asset.label !== BTC_ASSET.label) return false;

  if (!isRecord(value.question) || !hasExactKeys(value.question, ["raw", "normalized", "lens", "safe_reframed"])) return false;
  if (typeof value.question.raw !== "string" || value.question.raw.length > 280) return false;
  const compactRawQuestion = value.question.raw.trim().replace(/\s+/g, " ");
  if (compactRawQuestion.length < 8 || compactRawQuestion.length > 280) return false;
  if (!isNonEmptyString(value.question.normalized, 280) || value.question.normalized.trim().length < 8) return false;
  if (!BTC_QUESTION_LENSES.includes(value.question.lens as BtcQuestionLens) || typeof value.question.safe_reframed !== "boolean") return false;

  if (!isUtcTimestamp(value.observation_time_utc)) return false;

  if (!isRecord(value.market_snapshot) || !hasExactKeys(value.market_snapshot, [
    "price_usd", "change_24h_pct", "change_7d_pct", "change_30d_pct", "total_market_cap_usd",
    "volume_24h_usd", "market_cap_change_24h_pct", "source_generated_at_utc", "freshness",
  ])) return false;
  if (!isFiniteNumber(value.market_snapshot.price_usd) || value.market_snapshot.price_usd < 0) return false;
  if (!["change_24h_pct", "change_7d_pct", "change_30d_pct", "market_cap_change_24h_pct"].every((key) => isFiniteNumber(value.market_snapshot[key]))) return false;
  if (!isFiniteNumber(value.market_snapshot.total_market_cap_usd) || value.market_snapshot.total_market_cap_usd < 0) return false;
  if (!isFiniteNumber(value.market_snapshot.volume_24h_usd) || value.market_snapshot.volume_24h_usd < 0) return false;
  if (!isUtcTimestamp(value.market_snapshot.source_generated_at_utc)) return false;
  if (!FRESHNESS_STATES.includes(value.market_snapshot.freshness as FreshnessState) || value.market_snapshot.freshness === "UNAVAILABLE") return false;

  if (!isRecord(value.btc_gravity) || !hasExactKeys(value.btc_gravity, ["dominance_pct", "dominance_band", "market_cap_rank", "market_context_label", "score"])) return false;
  if (!isFiniteInRange(value.btc_gravity.dominance_pct, 0, 100)) return false;
  if (!["high", "balanced", "lower"].includes(value.btc_gravity.dominance_band as string)) return false;
  if (!Number.isInteger(value.btc_gravity.market_cap_rank) || (value.btc_gravity.market_cap_rank as number) < 1) return false;
  if (!isNonEmptyString(value.btc_gravity.market_context_label, 160) || !isFiniteNumber(value.btc_gravity.score)) return false;

  if (!isRecord(value.market_structure) || !hasExactKeys(value.market_structure, [
    "regime_label", "field_score", "direction_bias", "liquidity_state", "stablecoin_share_pct", "alt_breadth_24h_pct", "context_only",
  ])) return false;
  if (!isNonEmptyString(value.market_structure.regime_label, 160) || !isFiniteNumber(value.market_structure.field_score)) return false;
  if (!isNonEmptyString(value.market_structure.direction_bias, 160) || !isNonEmptyString(value.market_structure.liquidity_state, 160)) return false;
  if (!isFiniteInRange(value.market_structure.stablecoin_share_pct, 0, 100) || !isFiniteInRange(value.market_structure.alt_breadth_24h_pct, 0, 100)) return false;
  if (value.market_structure.context_only !== true) return false;

  if (!isRecord(value.aspect_pressure) || !hasExactKeys(value.aspect_pressure, ["state", "pressure_band", "harmonic_tension", "evidence_mode", "label"])) return false;
  if (!TEMPORAL_STATES.includes(value.aspect_pressure.state as TemporalState)) return false;
  if (value.aspect_pressure.pressure_band !== null && !["elevated", "moderate", "low"].includes(value.aspect_pressure.pressure_band as string)) return false;
  if (value.aspect_pressure.harmonic_tension !== null && !isFiniteInRange(value.aspect_pressure.harmonic_tension, 0, 1)) return false;
  if (!["bounded_numeric_metric", "no_numeric_aspect_claim"].includes(value.aspect_pressure.evidence_mode as string)) return false;
  if (!isNonEmptyString(value.aspect_pressure.label, 160)) return false;
  const hasPressure = value.aspect_pressure.pressure_band !== null;
  if (hasPressure !== (value.aspect_pressure.harmonic_tension !== null)) return false;
  if (hasPressure !== (value.aspect_pressure.evidence_mode === "bounded_numeric_metric")) return false;

  if (!isRecord(value.temporal_context) || !hasExactKeys(value.temporal_context, ["state", "label", "observation_date", "metrics", "analysis", "limitation"])) return false;
  if (!TEMPORAL_STATES.includes(value.temporal_context.state as TemporalState)) return false;
  if (value.temporal_context.label !== "bounded_cosmographic_metric" || !isUtcDate(value.temporal_context.observation_date)) return false;
  if (!isNonEmptyString(value.temporal_context.limitation, 1200)) return false;
  let validatedTemporalMetrics: TemporalMetrics | null = null;
  if (value.temporal_context.state === "available_bounded") {
    if (!isTemporalMetrics(value.temporal_context.metrics)) return false;
    validatedTemporalMetrics = value.temporal_context.metrics;
    if (value.temporal_context.analysis !== null && !isTemporalAnalysis(value.temporal_context.analysis)) return false;
  } else if (value.temporal_context.metrics !== null || value.temporal_context.analysis !== null) {
    return false;
  }
  if (value.aspect_pressure.state !== value.temporal_context.state) return false;
  if (validatedTemporalMetrics) {
    if (value.aspect_pressure.harmonic_tension !== validatedTemporalMetrics.harmonic_tension) return false;
  } else if (value.aspect_pressure.pressure_band !== null || value.aspect_pressure.harmonic_tension !== null) {
    return false;
  }

  if (!Array.isArray(value.watch_conditions) || value.watch_conditions.length < 1 || value.watch_conditions.length > 4) return false;
  if (!value.watch_conditions.every((item) => isNonEmptyString(item, 600))) return false;

  if (!isRecord(value.source_proof) || !hasExactKeys(value.source_proof, ["schema_version", "source_mode", "generated_at_utc", "sources"])) return false;
  if (value.source_proof.schema_version !== "crypto_astro_snapshot_proof_public_v0_1" || value.source_proof.source_mode !== "static_public_snapshot") return false;
  if (!isUtcTimestamp(value.source_proof.generated_at_utc) || !Array.isArray(value.source_proof.sources) || value.source_proof.sources.length !== REQUIRED_PROOF_LABELS.size) return false;
  if (!value.source_proof.sources.every(isSourceProofItem)) return false;
  const labels = new Set(value.source_proof.sources.map((item) => item.label));
  if (labels.size !== REQUIRED_PROOF_LABELS.size || REQUIRED_PROOF_LABEL_LIST.some((label) => !labels.has(label))) return false;

  if (!isRecord(value.uncertainty) || !hasExactKeys(value.uncertainty, ["freshness", "question_limit", "temporal_limit", "source_limit"])) return false;
  if (![value.uncertainty.freshness, value.uncertainty.question_limit, value.uncertainty.temporal_limit, value.uncertainty.source_limit].every((item) => isNonEmptyString(item, 1200))) return false;

  if (!isBoundary(value.boundary)) return false;
  if (!isUtcTimestamp(value.generated_at_utc) || !isAccessRoute(value.deeper_access_route)) return false;

  try {
    const serialized = JSON.stringify(value);
    if (!serialized || serialized.includes('"undefined"')) return false;
  } catch {
    return false;
  }
  return true;
}
