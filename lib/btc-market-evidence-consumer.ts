import type {
  BtcBinancePublicMarketEvidence,
  BinanceEvidenceFreshnessState,
} from "./btc-binance-public-market-evidence";

export const BTC_MARKET_EVIDENCE_CONSUMER_SCHEMA = "btc_market_evidence_consumer_v0_1" as const;
export const BTC_MARKET_SOURCE_CONFLICT_SCHEMA = "btc_market_source_conflict_v0_1" as const;

export type BtcMarketConsumerMode = "BTC_FIELD_NOW" | "BTC_CHANGE_MEMORY" | "METHOD_AND_PROOF";
export type EvidenceSuppressionReason =
  | "STALE_NOT_CURRENT"
  | "UNAVAILABLE"
  | "CLOSED_NOT_CURRENT"
  | "DERIVED_INPUT_NOT_ADMISSIBLE";

export type MarketEvidenceSummary = {
  evidence_id: string;
  authority_layer: "RAW" | "DERIVED";
  provider: string;
  venue: string;
  market: string;
  symbol: string;
  source_type: "REST" | "WEBSOCKET";
  endpoint_or_stream: string;
  event_time: string | null;
  retrieval_time: string;
  freshness: BtcBinancePublicMarketEvidence["freshness"];
  provenance: BtcBinancePublicMarketEvidence["provenance"];
  derivation_version: string | null;
  input_evidence_ids: string[];
  uncertainty: string[];
  normalized_value: unknown | null;
};

export type MarketEvidenceConsumerView = {
  schema_version: typeof BTC_MARKET_EVIDENCE_CONSUMER_SCHEMA;
  mode: BtcMarketConsumerMode;
  shadow_only: true;
  public_enabled: false;
  admitted: MarketEvidenceSummary[];
  suppressed: Array<{ evidence_id: string; reason: EvidenceSuppressionReason }>;
  boundary: {
    raw_provider_payload_exposed: false;
    silent_source_replacement: false;
    global_btc_price_claim: false;
    trading_authority: false;
    withdrawal_authority: false;
    transfer_authority: false;
  };
};

function baseAdmissibility(mode: BtcMarketConsumerMode, freshness: BinanceEvidenceFreshnessState): EvidenceSuppressionReason | null {
  if (mode === "METHOD_AND_PROOF") return null;
  if (freshness === "UNAVAILABLE") return "UNAVAILABLE";
  if (mode === "BTC_FIELD_NOW") {
    if (freshness === "CLOSED_AS_OF") return "CLOSED_NOT_CURRENT";
    if (freshness !== "FRESH") return "STALE_NOT_CURRENT";
  }
  if (mode === "BTC_CHANGE_MEMORY" && freshness === "STALE_LIMITED") return "STALE_NOT_CURRENT";
  return null;
}

function summarize(item: BtcBinancePublicMarketEvidence, mode: BtcMarketConsumerMode): MarketEvidenceSummary {
  return {
    evidence_id: item.evidence_id,
    authority_layer: item.authority_layer,
    provider: item.provider,
    venue: item.venue,
    market: item.market,
    symbol: item.symbol,
    source_type: item.source_type,
    endpoint_or_stream: item.endpoint_or_stream,
    event_time: item.event_time,
    retrieval_time: item.retrieval_time,
    freshness: item.freshness,
    provenance: item.provenance,
    derivation_version: item.derivation_version,
    input_evidence_ids: [...item.input_evidence_ids],
    uncertainty: [...item.uncertainty],
    normalized_value: mode === "METHOD_AND_PROOF" ? null : item.normalized_value,
  };
}

export function consumeBtcMarketEvidence(
  mode: BtcMarketConsumerMode,
  evidence: readonly BtcBinancePublicMarketEvidence[],
): MarketEvidenceConsumerView {
  const byId = new Map(evidence.map((item) => [item.evidence_id, item]));
  const suppression = new Map<string, EvidenceSuppressionReason>();

  for (const item of evidence) {
    const reason = baseAdmissibility(mode, item.freshness.state);
    if (reason) suppression.set(item.evidence_id, reason);
  }

  if (mode !== "METHOD_AND_PROOF") {
    for (const item of evidence) {
      if (item.authority_layer !== "DERIVED" || suppression.has(item.evidence_id)) continue;
      const allInputsAdmissible = item.input_evidence_ids.every((id) => byId.has(id) && !suppression.has(id));
      if (!allInputsAdmissible) suppression.set(item.evidence_id, "DERIVED_INPUT_NOT_ADMISSIBLE");
    }
  }

  return {
    schema_version: BTC_MARKET_EVIDENCE_CONSUMER_SCHEMA,
    mode,
    shadow_only: true,
    public_enabled: false,
    admitted: evidence.filter((item) => !suppression.has(item.evidence_id)).map((item) => summarize(item, mode)),
    suppressed: evidence.filter((item) => suppression.has(item.evidence_id)).map((item) => ({ evidence_id: item.evidence_id, reason: suppression.get(item.evidence_id)! })),
    boundary: {
      raw_provider_payload_exposed: false,
      silent_source_replacement: false,
      global_btc_price_claim: false,
      trading_authority: false,
      withdrawal_authority: false,
      transfer_authority: false,
    },
  };
}

export type ComparableMarketObservation = {
  provider: string;
  venue: string;
  symbol: string;
  metric: string;
  value: number;
  unit: string;
  quote_basis: string;
  observed_at: string;
  freshness: BinanceEvidenceFreshnessState;
};

export type MarketSourceConflict = {
  schema_version: typeof BTC_MARKET_SOURCE_CONFLICT_SCHEMA;
  status: "NOT_COMPARABLE" | "SOURCE_UNAVAILABLE" | "DELTA_VISIBLE";
  source_a: ComparableMarketObservation;
  source_b: ComparableMarketObservation;
  absolute_delta: number | null;
  relative_delta_bps: number | null;
  materiality: "UNCALIBRATED";
  winner: null;
  reasons: string[];
};

export function compareCompatibleMarketObservations(
  sourceA: ComparableMarketObservation,
  sourceB: ComparableMarketObservation,
  maxTimeSkewMs = 30_000,
): MarketSourceConflict {
  const reasons: string[] = [];
  if (sourceA.freshness !== "FRESH" || sourceB.freshness !== "FRESH") reasons.push("SOURCE_NOT_FRESH");
  if (sourceA.metric !== sourceB.metric) reasons.push("METRIC_MISMATCH");
  if (sourceA.unit !== sourceB.unit) reasons.push("UNIT_MISMATCH");
  if (!sourceA.quote_basis || !sourceB.quote_basis || sourceA.quote_basis !== sourceB.quote_basis) reasons.push("QUOTE_BASIS_MISMATCH");
  const timeA = Date.parse(sourceA.observed_at);
  const timeB = Date.parse(sourceB.observed_at);
  if (!Number.isFinite(timeA) || !Number.isFinite(timeB) || Math.abs(timeA - timeB) > maxTimeSkewMs) reasons.push("TIME_WINDOW_MISMATCH");

  const unavailable = reasons.includes("SOURCE_NOT_FRESH");
  if (reasons.length > 0) {
    return {
      schema_version: BTC_MARKET_SOURCE_CONFLICT_SCHEMA,
      status: unavailable ? "SOURCE_UNAVAILABLE" : "NOT_COMPARABLE",
      source_a: sourceA,
      source_b: sourceB,
      absolute_delta: null,
      relative_delta_bps: null,
      materiality: "UNCALIBRATED",
      winner: null,
      reasons,
    };
  }

  const absoluteDelta = sourceB.value - sourceA.value;
  const midpoint = (Math.abs(sourceA.value) + Math.abs(sourceB.value)) / 2;
  return {
    schema_version: BTC_MARKET_SOURCE_CONFLICT_SCHEMA,
    status: "DELTA_VISIBLE",
    source_a: sourceA,
    source_b: sourceB,
    absolute_delta: absoluteDelta,
    relative_delta_bps: midpoint === 0 ? null : (absoluteDelta / midpoint) * 10_000,
    materiality: "UNCALIBRATED",
    winner: null,
    reasons: [],
  };
}
