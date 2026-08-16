import type { BtcCosmographerRoute } from "./btc-cosmographer-route-graph";
import {
  compareCompatibleMarketObservations,
  consumeBtcMarketEvidence,
  type MarketEvidenceSummary,
} from "./btc-market-evidence-consumer";
import type { BinancePublicMarketResult } from "./btc-binance-public-market-source";

export const BTC_BINANCE_PUBLIC_BINDING_SCHEMA = "btc_binance_public_binding_v0_1" as const;
export type BtcBinancePublicBindingMode = "BTC_FIELD_NOW" | "BTC_CHANGE_MEMORY" | "METHOD_AND_PROOF";
export type BtcBinancePublicBindingGateState =
  | "ENABLED_PREVIEW"
  | "DISABLED_PRODUCTION"
  | "DISABLED_KILL_SWITCH"
  | "INELIGIBLE_FINANCIAL_INTENT"
  | "INELIGIBLE_ROUTE";

export type BtcBinancePublicBindingDecision = {
  eligible: boolean;
  fetch: boolean;
  mode: BtcBinancePublicBindingMode | null;
  gate_state: BtcBinancePublicBindingGateState;
  preview_only: true;
  production_enabled: false;
};

export type BtcBinancePublicFact = {
  id: string;
  label_en: string;
  label_ru: string;
  value: string;
  unit: string;
  authority_layer: "RAW" | "DERIVED";
};

const DERIVED_DISPLAY_DECIMALS: Readonly<Record<string, number>> = {
  spread: 4,
  spread_bps: 4,
  top5_book_imbalance: 3,
};

export function formatBtcBinancePublicFactDisplayValue(item: BtcBinancePublicFact): string {
  if (item.authority_layer !== "DERIVED") return item.value;
  const decimals = DERIVED_DISPLAY_DECIMALS[item.id];
  if (decimals === undefined) return item.value;
  const numeric = Number(item.value);
  if (!Number.isFinite(numeric)) return item.value;
  const bounded = numeric.toFixed(decimals).replace(/\.?0+$/, "");
  return bounded === "-0" ? "0" : bounded;
}

export type BtcBinancePublicProof = {
  evidence_id: string;
  authority_layer: "RAW" | "DERIVED";
  endpoint_or_stream: string;
  event_time: string | null;
  retrieval_time: string;
  freshness_state: string;
  freshness_reason: string;
  observation_hash: string;
  parameters_hash: string;
  derivation_version: string | null;
  uncertainty: string[];
};

export type BtcBinanceAcceptedStaticPeer = {
  price_usd: number;
  observed_at: string;
  freshness: "FRESH" | "STALE_LIMITED" | "UNAVAILABLE";
};

export type BtcBinancePublicBindingPacket = {
  schema_version: typeof BTC_BINANCE_PUBLIC_BINDING_SCHEMA;
  status: "READY" | "LIVE_VENUE_UNAVAILABLE";
  mode: BtcBinancePublicBindingMode;
  preview_only: true;
  production_enabled: false;
  provider: "Binance";
  venue: "Binance Spot";
  market: "spot";
  symbol: "BTCUSDT";
  observed_at: string | null;
  retrieved_at: string | null;
  freshness_state: "FRESH" | "UNAVAILABLE";
  facts: BtcBinancePublicFact[];
  proof: BtcBinancePublicProof[];
  source_comparison: {
    status: "NOT_COMPARABLE" | "SOURCE_UNAVAILABLE" | "DELTA_VISIBLE";
    reasons: string[];
    materiality: "UNCALIBRATED";
    winner: null;
  } | null;
  failure: { code: string; message: string } | null;
  boundary: {
    venue_specific_observation: true;
    accepted_snapshot_remains_primary: true;
    base_answer_rewrite: false;
    global_btc_price_claim: false;
    raw_provider_payload_exposed: false;
    session_live_value_persistence: false;
    trading_authority: false;
    withdrawal_authority: false;
    transfer_authority: false;
  };
};

const DIRECT_FINANCIAL_ACTION_PATTERNS: readonly RegExp[] = [
  /\b(?:should|shall|do i|can i|would you|when should i|is it (?:a )?good time to)\s+(?:buy|sell|long|short)\b/i,
  /^(?:buy|sell|long|short)\b/i,
  /\b(?:buy|sell)\s+(?:btc|bitcoin)\s+(?:now|today)\b/i,
  /\b(?:go|enter)\s+(?:long|short)\b/i,
  /\b(?:use|with)\s+(?:leverage|margin)\b/i,
  /\b(?:entry|exit)\s+(?:point|level|price)\b/i,
  /\bposition\s+(?:size|sizing)\b/i,
  /\bprice\s+target\b/i,
  /\btrading\s+signal\b/i,
  /(?:стоит\s+ли|следует\s+ли|мне\s+ли|можно\s+ли).*?(?:купить|покупать|продать|продавать|войти|входить|выйти|выходить)/i,
  /(?:купить|покупать|продать|продавать)\s+(?:btc|bitcoin|биткоин[а-яё]*)[^?!.]*(?:сейчас|сегодня)/i,
  /(?:лонг|шорт|в\s+лонг|в\s+шорт|плеч[оа]|маржинальн)/i,
  /точк[а-яё]*\s+(?:вход|выход)|(?:вход|выход)[а-яё]*\s+(?:точк|уров|цен)/i,
  /размер[а-яё]*\s+позици|позици[а-яё]*\s+размер/i,
  /ценов[а-яё]*\s+цел|цел[а-яё]*\s+по\s+цен/i,
  /торгов[а-яё]*\s+сигнал/i,
];

export function hasDirectBtcFinancialActionIntent(question: string): boolean {
  const normalized = question.trim().replace(/\s+/g, " ");
  return DIRECT_FINANCIAL_ACTION_PATTERNS.some((pattern) => pattern.test(normalized));
}

function eligibleMode(route: BtcCosmographerRoute): BtcBinancePublicBindingMode | null {
  if (route.domain === "btc_market") {
    if (route.market_question_class === "general_btc_field" || route.market_question_class === "market_structure") {
      return "BTC_FIELD_NOW";
    }
    return null;
  }
  if (route.domain === "snapshot_memory" && route.market_question_class === "change_memory") {
    return "BTC_CHANGE_MEMORY";
  }
  if (route.domain === "methodology" && /\bbinance\b|live\s+(?:source|market|venue|data)|venue\s+observation|жив[а-яё]*\s+(?:источник|рынок|данн)|бирж[а-яё]*\s+(?:источник|данн)/i.test(route.raw_question)) {
    return "METHOD_AND_PROOF";
  }
  return null;
}

export function decideBtcBinancePublicBinding(input: {
  route: BtcCosmographerRoute;
  vercelEnv: string | undefined;
  disabled?: boolean;
}): BtcBinancePublicBindingDecision {
  if (hasDirectBtcFinancialActionIntent(input.route.raw_question)) {
    return { eligible: false, fetch: false, mode: null, gate_state: "INELIGIBLE_FINANCIAL_INTENT", preview_only: true, production_enabled: false };
  }
  const mode = eligibleMode(input.route);
  if (!mode) return { eligible: false, fetch: false, mode: null, gate_state: "INELIGIBLE_ROUTE", preview_only: true, production_enabled: false };
  if (input.disabled) return { eligible: true, fetch: false, mode, gate_state: "DISABLED_KILL_SWITCH", preview_only: true, production_enabled: false };
  if (input.vercelEnv !== "preview") return { eligible: true, fetch: false, mode, gate_state: "DISABLED_PRODUCTION", preview_only: true, production_enabled: false };
  return { eligible: true, fetch: true, mode, gate_state: "ENABLED_PREVIEW", preview_only: true, production_enabled: false };
}

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function summaryByEndpoint(items: readonly MarketEvidenceSummary[], endpoint: string, authority?: "RAW" | "DERIVED") {
  return items.find((item) => item.endpoint_or_stream === endpoint && (!authority || item.authority_layer === authority)) ?? null;
}

function valueOf(item: MarketEvidenceSummary | null, key: string): string | null {
  const normalized = record(item?.normalized_value ?? null);
  const value = normalized?.[key];
  if (typeof value === "string" && value.length > 0) return value;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return null;
}

function fact(
  items: readonly MarketEvidenceSummary[],
  endpoint: string,
  key: string,
  id: string,
  labels: [string, string],
  unit: string,
  authority: "RAW" | "DERIVED" = "RAW",
): BtcBinancePublicFact | null {
  const item = summaryByEndpoint(items, endpoint, authority);
  const value = valueOf(item, key);
  return value === null ? null : { id, label_en: labels[0], label_ru: labels[1], value, unit, authority_layer: authority };
}

function proof(items: readonly MarketEvidenceSummary[]): BtcBinancePublicProof[] {
  return items.map((item) => ({
    evidence_id: item.evidence_id,
    authority_layer: item.authority_layer,
    endpoint_or_stream: item.endpoint_or_stream,
    event_time: item.event_time,
    retrieval_time: item.retrieval_time,
    freshness_state: item.freshness.state,
    freshness_reason: item.freshness.reason,
    observation_hash: item.provenance.observation_hash,
    parameters_hash: item.provenance.parameters_hash,
    derivation_version: item.derivation_version,
    uncertainty: [...item.uncertainty],
  }));
}

function latestObservation(items: readonly MarketEvidenceSummary[]): string | null {
  const values = items.flatMap((item) => [item.event_time, item.retrieval_time]).filter((value): value is string => Boolean(value));
  if (!values.length) return null;
  return values.sort((a, b) => Date.parse(b) - Date.parse(a))[0] ?? null;
}

function staticComparison(items: readonly MarketEvidenceSummary[], peer: BtcBinanceAcceptedStaticPeer | null) {
  if (!peer) return null;
  const price = summaryByEndpoint(items, "/api/v3/ticker/price", "RAW");
  const liveValue = Number(valueOf(price, "price_usdt"));
  const observedAt = price?.event_time ?? price?.retrieval_time ?? "";
  if (!Number.isFinite(liveValue) || !observedAt) return null;
  const result = compareCompatibleMarketObservations(
    {
      provider: "Binance",
      venue: "Binance Spot",
      symbol: "BTCUSDT",
      metric: "BTC_REFERENCE_PRICE",
      value: liveValue,
      unit: "QUOTE_PER_BTC",
      quote_basis: "USDT",
      observed_at: observedAt,
      freshness: price!.freshness.state,
    },
    {
      provider: "BHRIGU accepted aggregate snapshot",
      venue: "aggregate",
      symbol: "BTCUSD",
      metric: "BTC_REFERENCE_PRICE",
      value: peer.price_usd,
      unit: "QUOTE_PER_BTC",
      quote_basis: "USD",
      observed_at: peer.observed_at,
      freshness: peer.freshness,
    },
  );
  return { status: result.status, reasons: [...result.reasons], materiality: result.materiality, winner: result.winner };
}

const BOUNDARY: BtcBinancePublicBindingPacket["boundary"] = {
  venue_specific_observation: true,
  accepted_snapshot_remains_primary: true,
  base_answer_rewrite: false,
  global_btc_price_claim: false,
  raw_provider_payload_exposed: false,
  session_live_value_persistence: false,
  trading_authority: false,
  withdrawal_authority: false,
  transfer_authority: false,
};

export function buildBtcBinancePublicBinding(input: {
  decision: BtcBinancePublicBindingDecision;
  result: BinancePublicMarketResult;
  staticPeer?: BtcBinanceAcceptedStaticPeer | null;
}): BtcBinancePublicBindingPacket | null {
  if (!input.decision.fetch || !input.decision.mode) return null;
  const mode = input.decision.mode;
  if (input.result.ok === false) {
    return {
      schema_version: BTC_BINANCE_PUBLIC_BINDING_SCHEMA,
      status: "LIVE_VENUE_UNAVAILABLE",
      mode,
      preview_only: true,
      production_enabled: false,
      provider: "Binance",
      venue: "Binance Spot",
      market: "spot",
      symbol: "BTCUSDT",
      observed_at: null,
      retrieved_at: null,
      freshness_state: "UNAVAILABLE",
      facts: [],
      proof: [],
      source_comparison: null,
      failure: { code: input.result.code, message: input.result.message },
      boundary: BOUNDARY,
    };
  }

  const view = consumeBtcMarketEvidence(mode, input.result.snapshot.evidence);
  const admitted = view.admitted;
  const facts = mode === "METHOD_AND_PROOF" ? [] : [
    fact(admitted, "/api/v3/ticker/price", "price_usdt", "last_price", ["Last price", "Последняя цена"], "USDT/BTC"),
    fact(admitted, "/api/v3/ticker/bookTicker", "bid_price_usdt", "best_bid", ["Best bid", "Лучшая цена покупки"], "USDT/BTC"),
    fact(admitted, "/api/v3/ticker/bookTicker", "ask_price_usdt", "best_ask", ["Best ask", "Лучшая цена продажи"], "USDT/BTC"),
    fact(admitted, "derived", "spread_usdt", "spread", ["Bid/ask spread", "Спред bid/ask"], "USDT", "DERIVED"),
    fact(admitted, "derived", "spread_bps", "spread_bps", ["Spread", "Спред"], "bps", "DERIVED"),
    fact(admitted, "/api/v3/ticker/24hr", "price_change_usdt", "change_24h", ["Rolling 24h change", "Изменение за скользящие 24ч"], "USDT"),
    fact(admitted, "/api/v3/ticker/24hr", "price_change_percent", "change_24h_pct", ["Rolling 24h change", "Изменение за скользящие 24ч"], "%"),
    fact(admitted, "/api/v3/ticker/24hr", "high_price_usdt", "high_24h", ["Rolling 24h high", "Максимум за скользящие 24ч"], "USDT/BTC"),
    fact(admitted, "/api/v3/ticker/24hr", "low_price_usdt", "low_24h", ["Rolling 24h low", "Минимум за скользящие 24ч"], "USDT/BTC"),
    fact(admitted, "/api/v3/ticker/24hr", "volume_btc", "volume_24h_btc", ["Rolling 24h volume", "Объём за скользящие 24ч"], "BTC"),
    fact(admitted, "/api/v3/ticker/24hr", "quote_volume_usdt", "volume_24h_usdt", ["Rolling 24h quote volume", "Объём котируемой валюты за 24ч"], "USDT"),
    fact(admitted, "derived", "top_book_imbalance", "top5_book_imbalance", ["Top-5 book imbalance", "Дисбаланс top-5 книги"], "ratio", "DERIVED"),
  ].filter((item): item is BtcBinancePublicFact => item !== null);

  if (mode !== "METHOD_AND_PROOF" && facts.length === 0) {
    return {
      schema_version: BTC_BINANCE_PUBLIC_BINDING_SCHEMA,
      status: "LIVE_VENUE_UNAVAILABLE",
      mode,
      preview_only: true,
      production_enabled: false,
      provider: "Binance",
      venue: "Binance Spot",
      market: "spot",
      symbol: "BTCUSDT",
      observed_at: null,
      retrieved_at: input.result.snapshot.retrieved_at,
      freshness_state: "UNAVAILABLE",
      facts: [],
      proof: proof(admitted),
      source_comparison: null,
      failure: { code: "BINANCE_BINDING_NO_ADMISSIBLE_VALUES", message: "No admissible fresh Binance venue values are available for this route." },
      boundary: BOUNDARY,
    };
  }

  return {
    schema_version: BTC_BINANCE_PUBLIC_BINDING_SCHEMA,
    status: "READY",
    mode,
    preview_only: true,
    production_enabled: false,
    provider: "Binance",
    venue: "Binance Spot",
    market: "spot",
    symbol: "BTCUSDT",
    observed_at: latestObservation(admitted),
    retrieved_at: input.result.snapshot.retrieved_at,
    freshness_state: "FRESH",
    facts,
    proof: proof(admitted),
    source_comparison: mode === "METHOD_AND_PROOF" ? null : staticComparison(admitted, input.staticPeer ?? null),
    failure: null,
    boundary: BOUNDARY,
  };
}
