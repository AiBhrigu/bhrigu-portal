import { createHash } from "node:crypto";

export const BTC_BINANCE_PUBLIC_MARKET_EVIDENCE_SCHEMA = "btc_binance_public_market_evidence_v0_1" as const;
export const BTC_BINANCE_PUBLIC_MARKET_SNAPSHOT_SCHEMA = "btc_binance_public_market_shadow_snapshot_v0_1" as const;
export const BTC_BINANCE_LIVE_FRESHNESS_CONTRACT_ID = "btc_binance_live_freshness_v0_1" as const;
export const BTC_BINANCE_PROVIDER = "Binance" as const;
export const BTC_BINANCE_VENUE = "Binance Spot" as const;
export const BTC_BINANCE_MARKET = "spot" as const;
export const BTC_BINANCE_PRIMARY_SYMBOL = "BTCUSDT" as const;

export type BinanceEvidenceAuthorityLayer = "RAW" | "DERIVED";
export type BinanceEvidenceFreshnessState = "FRESH" | "STALE_LIMITED" | "UNAVAILABLE" | "CLOSED_AS_OF";
export type BinanceEvidenceFreshnessKind = "PRICE_BOOK_TRADE" | "DEPTH" | "TICKER_24H" | "OPEN_KLINE" | "EXCHANGE_INFO" | "CLOSED_KLINE" | "SERVER_TIME";
export type BinanceEvidenceDataSource = "Memory" | "Database";
export type BinanceEvidenceEndpoint =
  | "/api/v3/exchangeInfo"
  | "/api/v3/time"
  | "/api/v3/ticker/price"
  | "/api/v3/ticker/24hr"
  | "/api/v3/ticker/bookTicker"
  | "/api/v3/depth"
  | "/api/v3/aggTrades"
  | "/api/v3/klines";

export type BinanceFreshness = {
  contract_id: typeof BTC_BINANCE_LIVE_FRESHNESS_CONTRACT_ID;
  state: BinanceEvidenceFreshnessState;
  event_age_ms: number | null;
  retrieval_age_ms: number;
  reason: "OK" | "NO_PROVIDER_EVENT_TIME" | "STALE" | "TOO_OLD" | "CLOSED_CANDLE" | "FUTURE_EVENT";
};

export type BinanceProvenance = {
  provider: typeof BTC_BINANCE_PROVIDER;
  venue: typeof BTC_BINANCE_VENUE;
  endpoint_or_stream: BinanceEvidenceEndpoint | "derived";
  parameters_hash: string;
  event_or_update_id: string | null;
  observation_hash: string;
};

export type BtcBinancePublicMarketEvidence<T = unknown> = {
  schema_version: typeof BTC_BINANCE_PUBLIC_MARKET_EVIDENCE_SCHEMA;
  evidence_id: string;
  authority_layer: BinanceEvidenceAuthorityLayer;
  provider: typeof BTC_BINANCE_PROVIDER;
  venue: typeof BTC_BINANCE_VENUE;
  market: typeof BTC_BINANCE_MARKET;
  symbol: typeof BTC_BINANCE_PRIMARY_SYMBOL;
  event_time: string | null;
  retrieval_time: string;
  source_type: "REST";
  endpoint_or_stream: BinanceEvidenceEndpoint | "derived";
  security_type: "NONE";
  data_source: BinanceEvidenceDataSource | "BHRIGU";
  raw_value: unknown;
  normalized_value: T;
  freshness: BinanceFreshness;
  provenance: BinanceProvenance;
  derivation_version: string | null;
  input_evidence_ids: string[];
  uncertainty: string[];
};

export type BtcBinanceShadowSnapshot = {
  schema_version: typeof BTC_BINANCE_PUBLIC_MARKET_SNAPSHOT_SCHEMA;
  status: "READY_SHADOW";
  public_enabled: false;
  provider: typeof BTC_BINANCE_PROVIDER;
  venue: typeof BTC_BINANCE_VENUE;
  symbol: typeof BTC_BINANCE_PRIMARY_SYMBOL;
  retrieved_at: string;
  clock_drift_ms: number;
  request_weight_budget: number;
  evidence: BtcBinancePublicMarketEvidence[];
  derived: {
    mid_price_usdt: number;
    spread_usdt: number;
    spread_bps: number;
    top_book_imbalance: number;
  };
  boundary: {
    api_key_required: false;
    authentication_used: false;
    trading_authority: false;
    withdrawal_authority: false;
    transfer_authority: false;
    private_account_data: false;
    raw_provider_payload_exposed: false;
    global_btc_price_claim: false;
    existing_static_corridor_replaced: false;
  };
};

export type BtcMarketSourceDisagreement = {
  schema_version: "btc_market_source_disagreement_v0_1";
  source_a: { provider: string; venue: string; symbol: string; value: number; event_time: string | null };
  source_b: { provider: string; venue: string; symbol: string; value: number; event_time: string | null };
  absolute_delta: number;
  relative_delta_bps: number | null;
  resolution: "VISIBLE_NO_SILENT_REPLACEMENT";
};

const WINDOWS: Record<Exclude<BinanceEvidenceFreshnessKind, "CLOSED_KLINE">, { freshMs: number; unavailableMs: number }> = {
  PRICE_BOOK_TRADE: { freshMs: 5_000, unavailableMs: 30_000 },
  DEPTH: { freshMs: 5_000, unavailableMs: 15_000 },
  TICKER_24H: { freshMs: 15_000, unavailableMs: 60_000 },
  OPEN_KLINE: { freshMs: 15_000, unavailableMs: 60_000 },
  EXCHANGE_INFO: { freshMs: 5 * 60_000, unavailableMs: 30 * 60_000 },
  SERVER_TIME: { freshMs: 5_000, unavailableMs: 30_000 },
};

function stable(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stable);
  if (!value || typeof value !== "object") return value;
  const input = value as Record<string, unknown>;
  return Object.fromEntries(Object.keys(input).sort().map((key) => [key, stable(input[key])]));
}

export function canonicalJson(value: unknown): string {
  return JSON.stringify(stable(value));
}

export function sha256Canonical(value: unknown): string {
  return createHash("sha256").update(canonicalJson(value), "utf8").digest("hex");
}

export function isoFromMillis(value: number): string | null {
  if (!Number.isFinite(value) || value <= 0) return null;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
}

export function normalizeDecimal(value: unknown): string {
  if (typeof value !== "string" || !/^(?:0|[1-9]\d*)(?:\.\d+)?$/.test(value)) throw new Error("BINANCE_DECIMAL_INVALID");
  return value;
}

export function finiteNumber(value: unknown): number {
  const number = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(number)) throw new Error("BINANCE_NUMBER_INVALID");
  return number;
}

export function classifyBinanceEvidenceFreshness(input: {
  kind: BinanceEvidenceFreshnessKind;
  eventTimeMs: number | null;
  retrievalTimeMs: number;
  nowMs?: number;
  closed?: boolean;
}): BinanceFreshness {
  const nowMs = input.nowMs ?? Date.now();
  const retrievalAge = Math.max(0, nowMs - input.retrievalTimeMs);
  if (input.kind === "CLOSED_KLINE" || input.closed) {
    return { contract_id: BTC_BINANCE_LIVE_FRESHNESS_CONTRACT_ID, state: "CLOSED_AS_OF", event_age_ms: input.eventTimeMs === null ? null : Math.max(0, nowMs - input.eventTimeMs), retrieval_age_ms: retrievalAge, reason: "CLOSED_CANDLE" };
  }
  const window = WINDOWS[input.kind];
  if (input.eventTimeMs !== null && input.eventTimeMs > nowMs + 5_000) {
    return { contract_id: BTC_BINANCE_LIVE_FRESHNESS_CONTRACT_ID, state: "UNAVAILABLE", event_age_ms: nowMs - input.eventTimeMs, retrieval_age_ms: retrievalAge, reason: "FUTURE_EVENT" };
  }
  const age = input.eventTimeMs === null ? retrievalAge : Math.max(0, nowMs - input.eventTimeMs);
  if (age <= window.freshMs) {
    return { contract_id: BTC_BINANCE_LIVE_FRESHNESS_CONTRACT_ID, state: "FRESH", event_age_ms: input.eventTimeMs === null ? null : age, retrieval_age_ms: retrievalAge, reason: input.eventTimeMs === null ? "NO_PROVIDER_EVENT_TIME" : "OK" };
  }
  if (age <= window.unavailableMs) {
    return { contract_id: BTC_BINANCE_LIVE_FRESHNESS_CONTRACT_ID, state: "STALE_LIMITED", event_age_ms: input.eventTimeMs === null ? null : age, retrieval_age_ms: retrievalAge, reason: "STALE" };
  }
  return { contract_id: BTC_BINANCE_LIVE_FRESHNESS_CONTRACT_ID, state: "UNAVAILABLE", event_age_ms: input.eventTimeMs === null ? null : age, retrieval_age_ms: retrievalAge, reason: "TOO_OLD" };
}

export function buildBinanceEvidence<T>(input: {
  endpoint: BinanceEvidenceEndpoint | "derived";
  dataSource: BinanceEvidenceDataSource | "BHRIGU";
  retrievalTimeMs: number;
  eventTimeMs: number | null;
  freshnessKind: BinanceEvidenceFreshnessKind;
  rawValue: unknown;
  normalizedValue: T;
  parameters: Record<string, string | number>;
  eventOrUpdateId?: string | number | null;
  derivationVersion?: string | null;
  inputEvidenceIds?: string[];
  uncertainty?: string[];
  nowMs?: number;
  closed?: boolean;
}): BtcBinancePublicMarketEvidence<T> {
  const retrievalTime = new Date(input.retrievalTimeMs).toISOString();
  const eventTime = input.eventTimeMs === null ? null : isoFromMillis(input.eventTimeMs);
  const parametersHash = sha256Canonical(input.parameters);
  const observationHash = sha256Canonical({ endpoint: input.endpoint, raw_value: input.rawValue, normalized_value: input.normalizedValue, event_time: eventTime, retrieval_time: retrievalTime });
  const evidenceId = `binance_${sha256Canonical({ endpoint: input.endpoint, observationHash }).slice(0, 24)}`;
  return {
    schema_version: BTC_BINANCE_PUBLIC_MARKET_EVIDENCE_SCHEMA,
    evidence_id: evidenceId,
    authority_layer: input.endpoint === "derived" ? "DERIVED" : "RAW",
    provider: BTC_BINANCE_PROVIDER,
    venue: BTC_BINANCE_VENUE,
    market: BTC_BINANCE_MARKET,
    symbol: BTC_BINANCE_PRIMARY_SYMBOL,
    event_time: eventTime,
    retrieval_time: retrievalTime,
    source_type: "REST",
    endpoint_or_stream: input.endpoint,
    security_type: "NONE",
    data_source: input.dataSource,
    raw_value: input.rawValue,
    normalized_value: input.normalizedValue,
    freshness: classifyBinanceEvidenceFreshness({ kind: input.freshnessKind, eventTimeMs: input.eventTimeMs, retrievalTimeMs: input.retrievalTimeMs, nowMs: input.nowMs, closed: input.closed }),
    provenance: {
      provider: BTC_BINANCE_PROVIDER,
      venue: BTC_BINANCE_VENUE,
      endpoint_or_stream: input.endpoint,
      parameters_hash: parametersHash,
      event_or_update_id: input.eventOrUpdateId === undefined || input.eventOrUpdateId === null ? null : String(input.eventOrUpdateId),
      observation_hash: observationHash,
    },
    derivation_version: input.derivationVersion ?? null,
    input_evidence_ids: input.inputEvidenceIds ?? [],
    uncertainty: input.uncertainty ?? [],
  };
}

export function compareMarketSources(input: BtcMarketSourceDisagreement["source_a"], other: BtcMarketSourceDisagreement["source_b"]): BtcMarketSourceDisagreement {
  const absoluteDelta = other.value - input.value;
  const midpoint = (Math.abs(input.value) + Math.abs(other.value)) / 2;
  return {
    schema_version: "btc_market_source_disagreement_v0_1",
    source_a: input,
    source_b: other,
    absolute_delta: absoluteDelta,
    relative_delta_bps: midpoint === 0 ? null : (absoluteDelta / midpoint) * 10_000,
    resolution: "VISIBLE_NO_SILENT_REPLACEMENT",
  };
}
