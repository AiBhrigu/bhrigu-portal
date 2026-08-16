import {
  BTC_BINANCE_PRIMARY_SYMBOL,
  BTC_BINANCE_PUBLIC_MARKET_SNAPSHOT_SCHEMA,
  buildBinanceEvidence,
  finiteNumber,
  normalizeDecimal,
  normalizeSignedDecimal,
  type BtcBinancePublicMarketEvidence,
  type BtcBinanceShadowSnapshot,
  type BinanceEvidenceDataSource,
  type BinanceEvidenceEndpoint,
  type BinanceEvidenceFreshnessKind,
} from "./btc-binance-public-market-evidence";

export const BTC_BINANCE_PUBLIC_MARKET_BASE_URL = "https://data-api.binance.vision" as const;
export const BTC_BINANCE_PUBLIC_MARKET_TIMEOUT_MS = 4_000 as const;
export const BTC_BINANCE_CLOCK_DRIFT_LIMIT_MS = 5_000 as const;

export const BTC_BINANCE_PUBLIC_REST_REQUESTS = {
  exchangeInfo: { path: "/api/v3/exchangeInfo", weight: 20, dataSource: "Memory" },
  time: { path: "/api/v3/time", weight: 1, dataSource: "Memory" },
  price: { path: "/api/v3/ticker/price", weight: 2, dataSource: "Memory" },
  ticker24h: { path: "/api/v3/ticker/24hr", weight: 2, dataSource: "Memory" },
  bookTicker: { path: "/api/v3/ticker/bookTicker", weight: 2, dataSource: "Memory" },
  depth100: { path: "/api/v3/depth", weight: 5, dataSource: "Memory" },
  aggTrades: { path: "/api/v3/aggTrades", weight: 4, dataSource: "Database" },
  klines1m: { path: "/api/v3/klines", weight: 2, dataSource: "Database" },
  klines1h: { path: "/api/v3/klines", weight: 2, dataSource: "Database" },
  klines1d: { path: "/api/v3/klines", weight: 2, dataSource: "Database" },
} as const;

export const BTC_BINANCE_PUBLIC_REST_TOTAL_WEIGHT = Object.values(BTC_BINANCE_PUBLIC_REST_REQUESTS).reduce((sum, item) => sum + item.weight, 0);

const ALLOWED_PATHS = new Set<BinanceEvidenceEndpoint>([
  "/api/v3/exchangeInfo",
  "/api/v3/time",
  "/api/v3/ticker/price",
  "/api/v3/ticker/24hr",
  "/api/v3/ticker/bookTicker",
  "/api/v3/depth",
  "/api/v3/aggTrades",
  "/api/v3/klines",
]);

export type BinancePublicMarketFailureCode =
  | "BINANCE_TIMEOUT"
  | "BINANCE_RATE_LIMIT_429"
  | "BINANCE_IP_BAN_418"
  | "BINANCE_HTTP_ERROR"
  | "BINANCE_SCHEMA_INVALID"
  | "BINANCE_CLOCK_DRIFT"
  | "BINANCE_SYMBOL_UNAVAILABLE"
  | "BINANCE_MARKET_HALTED"
  | "BINANCE_STALE_DATA"
  | "BHRIGU_BINANCE_RATE_BUDGET"
  | "BHRIGU_BINANCE_CIRCUIT_OPEN";

export type BinancePublicMarketFailure = {
  ok: false;
  code: BinancePublicMarketFailureCode;
  message: string;
  endpoint?: string;
  http_status?: number;
  retry_after_ms?: number;
  market_status?: string;
  retrieved_at?: string;
};

export type BinancePublicMarketSuccess = {
  ok: true;
  snapshot: BtcBinanceShadowSnapshot;
  provider_used_weight_1m_max?: number | null;
};
export type BinancePublicMarketResult = BinancePublicMarketSuccess | BinancePublicMarketFailure;

type FetchLike = typeof fetch;
type FetchRecord = { value: unknown; startedAtMs: number; receivedAtMs: number; usedWeight: number | null };

export type BinancePublicMarketFetchOptions = {
  fetchImpl?: FetchLike;
  now?: () => number;
  timeoutMs?: number;
  signal?: AbortSignal;
};

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("BINANCE_OBJECT_INVALID");
  return value as Record<string, unknown>;
}

function asArray(value: unknown): unknown[] {
  if (!Array.isArray(value)) throw new Error("BINANCE_ARRAY_INVALID");
  return value;
}

function integer(value: unknown): number {
  const number = finiteNumber(value);
  if (!Number.isInteger(number)) throw new Error("BINANCE_INTEGER_INVALID");
  return number;
}

function parseRetryAfterMs(value: string | null): number | undefined {
  if (!value) return undefined;
  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds >= 0) return Math.ceil(seconds * 1_000);
  const dateMs = new Date(value).getTime();
  if (!Number.isFinite(dateMs)) return undefined;
  return Math.max(0, dateMs - Date.now());
}

export function buildBinancePublicMarketUrl(path: BinanceEvidenceEndpoint, params: Record<string, string | number> = {}): string {
  if (!ALLOWED_PATHS.has(path)) throw new Error("BINANCE_PUBLIC_PATH_FORBIDDEN");
  const url = new URL(path, BTC_BINANCE_PUBLIC_MARKET_BASE_URL);
  for (const [key, value] of Object.entries(params).sort(([a], [b]) => a.localeCompare(b))) url.searchParams.set(key, String(value));
  if (url.origin !== BTC_BINANCE_PUBLIC_MARKET_BASE_URL || url.protocol !== "https:") throw new Error("BINANCE_PUBLIC_HOST_FORBIDDEN");
  return url.toString();
}

async function fetchPublicJson(path: BinanceEvidenceEndpoint, params: Record<string, string | number>, options: BinancePublicMarketFetchOptions): Promise<FetchRecord | BinancePublicMarketFailure> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const now = options.now ?? Date.now;
  const controller = new AbortController();
  const timeoutMs = options.timeoutMs ?? BTC_BINANCE_PUBLIC_MARKET_TIMEOUT_MS;
  const startedAtMs = now();
  const abortFromOuter = () => controller.abort();
  if (options.signal?.aborted) controller.abort();
  else options.signal?.addEventListener("abort", abortFromOuter, { once: true });
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(buildBinancePublicMarketUrl(path, params), {
      method: "GET",
      headers: { accept: "application/json" },
      cache: "no-store",
      signal: controller.signal,
    });
    const receivedAtMs = now();
    if (response.status === 429 || response.status === 418) {
      return {
        ok: false,
        code: response.status === 429 ? "BINANCE_RATE_LIMIT_429" : "BINANCE_IP_BAN_418",
        message: response.status === 429 ? "Binance public market request rate-limited; caller must back off before retry." : "Binance public market IP ban active; circuit must remain open until Retry-After.",
        endpoint: path,
        http_status: response.status,
        retry_after_ms: parseRetryAfterMs(response.headers.get("retry-after")),
      };
    }
    if (!response.ok) return { ok: false, code: "BINANCE_HTTP_ERROR", message: `Binance public market request failed with HTTP ${response.status}.`, endpoint: path, http_status: response.status };
    const value = await response.json();
    const usedWeightRaw = response.headers.get("x-mbx-used-weight-1m") ?? response.headers.get("x-mbx-used-weight");
    const usedWeight = usedWeightRaw === null ? null : Number(usedWeightRaw);
    return { value, startedAtMs, receivedAtMs, usedWeight: Number.isFinite(usedWeight) ? usedWeight : null };
  } catch (error) {
    const timeout = error instanceof Error && (error.name === "AbortError" || /abort/i.test(error.message));
    return { ok: false, code: timeout ? "BINANCE_TIMEOUT" : "BINANCE_HTTP_ERROR", message: timeout ? "Binance public market request timed out." : "Binance public market request failed.", endpoint: path };
  } finally {
    clearTimeout(timer);
    options.signal?.removeEventListener("abort", abortFromOuter);
  }
}

function normalizeExchangeInfo(value: unknown) {
  const root = asRecord(value);
  const symbols = asArray(root.symbols);
  const selected = symbols.map(asRecord).find((item) => item.symbol === BTC_BINANCE_PRIMARY_SYMBOL);
  if (!selected) throw new Error("BINANCE_SYMBOL_MISSING");
  return {
    symbol: String(selected.symbol),
    status: String(selected.status),
    base_asset: String(selected.baseAsset),
    quote_asset: String(selected.quoteAsset),
    spot_trading_allowed: selected.isSpotTradingAllowed === true,
  };
}

function normalizeTime(value: unknown) {
  return { server_time_ms: integer(asRecord(value).serverTime) };
}

function normalizePrice(value: unknown) {
  const row = asRecord(value);
  if (row.symbol !== BTC_BINANCE_PRIMARY_SYMBOL) throw new Error("BINANCE_SYMBOL_MISMATCH");
  return { price_usdt: normalizeDecimal(row.price) };
}

function normalizeTicker24h(value: unknown) {
  const row = asRecord(value);
  if (row.symbol !== BTC_BINANCE_PRIMARY_SYMBOL) throw new Error("BINANCE_SYMBOL_MISMATCH");
  return {
    price_change_usdt: normalizeSignedDecimal(row.priceChange),
    price_change_percent: normalizeSignedDecimal(row.priceChangePercent),
    last_price_usdt: normalizeDecimal(row.lastPrice),
    high_price_usdt: normalizeDecimal(row.highPrice),
    low_price_usdt: normalizeDecimal(row.lowPrice),
    volume_btc: normalizeDecimal(row.volume),
    quote_volume_usdt: normalizeDecimal(row.quoteVolume),
    open_time_ms: integer(row.openTime),
    close_time_ms: integer(row.closeTime),
    trade_count: integer(row.count),
  };
}

function normalizeBookTicker(value: unknown) {
  const row = asRecord(value);
  if (row.symbol !== BTC_BINANCE_PRIMARY_SYMBOL) throw new Error("BINANCE_SYMBOL_MISMATCH");
  return {
    bid_price_usdt: normalizeDecimal(row.bidPrice),
    bid_qty_btc: normalizeDecimal(row.bidQty),
    ask_price_usdt: normalizeDecimal(row.askPrice),
    ask_qty_btc: normalizeDecimal(row.askQty),
  };
}

function normalizeDepth(value: unknown) {
  const row = asRecord(value);
  const normalizeLevel = (level: unknown) => {
    const pair = asArray(level);
    if (pair.length < 2) throw new Error("BINANCE_DEPTH_LEVEL_INVALID");
    return [normalizeDecimal(pair[0]), normalizeDecimal(pair[1])] as [string, string];
  };
  return {
    last_update_id: integer(row.lastUpdateId),
    bids: asArray(row.bids).slice(0, 20).map(normalizeLevel),
    asks: asArray(row.asks).slice(0, 20).map(normalizeLevel),
  };
}

function normalizeAggTrades(value: unknown) {
  return asArray(value).slice(-20).map((item) => {
    const row = asRecord(item);
    return {
      aggregate_trade_id: integer(row.a),
      price_usdt: normalizeDecimal(row.p),
      qty_btc: normalizeDecimal(row.q),
      first_trade_id: integer(row.f),
      last_trade_id: integer(row.l),
      trade_time_ms: integer(row.T),
      buyer_was_maker: row.m === true,
    };
  });
}

function normalizeKlines(value: unknown) {
  return asArray(value).slice(-2).map((item) => {
    const row = asArray(item);
    if (row.length < 11) throw new Error("BINANCE_KLINE_INVALID");
    return {
      open_time_ms: integer(row[0]),
      open_usdt: normalizeDecimal(row[1]),
      high_usdt: normalizeDecimal(row[2]),
      low_usdt: normalizeDecimal(row[3]),
      close_usdt: normalizeDecimal(row[4]),
      volume_btc: normalizeDecimal(row[5]),
      close_time_ms: integer(row[6]),
      quote_volume_usdt: normalizeDecimal(row[7]),
      trade_count: integer(row[8]),
      taker_buy_base_btc: normalizeDecimal(row[9]),
      taker_buy_quote_usdt: normalizeDecimal(row[10]),
    };
  });
}

function evidence<T>(input: {
  key: keyof typeof BTC_BINANCE_PUBLIC_REST_REQUESTS;
  record: FetchRecord;
  params: Record<string, string | number>;
  normalized: T;
  raw: unknown;
  eventTimeMs: number | null;
  freshnessKind: BinanceEvidenceFreshnessKind;
  eventOrUpdateId?: string | number | null;
  closed?: boolean;
  nowMs: number;
  providerClockOffsetMs: number;
  uncertainty?: string[];
}): BtcBinancePublicMarketEvidence<T> {
  const meta = BTC_BINANCE_PUBLIC_REST_REQUESTS[input.key];
  return buildBinanceEvidence({
    endpoint: meta.path,
    dataSource: meta.dataSource as BinanceEvidenceDataSource,
    retrievalTimeMs: input.record.receivedAtMs,
    eventTimeMs: input.eventTimeMs,
    freshnessKind: input.freshnessKind,
    rawValue: input.raw,
    normalizedValue: input.normalized,
    parameters: input.params,
    eventOrUpdateId: input.eventOrUpdateId,
    nowMs: input.nowMs,
    providerClockOffsetMs: input.providerClockOffsetMs,
    closed: input.closed,
    uncertainty: input.uncertainty,
  });
}

function isFailure(value: FetchRecord | BinancePublicMarketFailure): value is BinancePublicMarketFailure {
  return "ok" in value && value.ok === false;
}

export async function loadBtcBinancePublicMarketShadow(options: BinancePublicMarketFetchOptions = {}): Promise<BinancePublicMarketResult> {
  const now = options.now ?? Date.now;
  const symbolParams = { symbol: BTC_BINANCE_PRIMARY_SYMBOL };
  const exchangeRecord = await fetchPublicJson("/api/v3/exchangeInfo", symbolParams, options);
  if (isFailure(exchangeRecord)) return exchangeRecord;
  const timeRecord = await fetchPublicJson("/api/v3/time", {}, options);
  if (isFailure(timeRecord)) return timeRecord;

  let exchangeInfo: ReturnType<typeof normalizeExchangeInfo>;
  let serverTime: ReturnType<typeof normalizeTime>;
  try {
    exchangeInfo = normalizeExchangeInfo(exchangeRecord.value);
    serverTime = normalizeTime(timeRecord.value);
  } catch {
    return { ok: false, code: "BINANCE_SCHEMA_INVALID", message: "Binance exchangeInfo/time payload failed the public shadow schema." };
  }
  if (exchangeInfo.base_asset !== "BTC" || exchangeInfo.quote_asset !== "USDT") return { ok: false, code: "BINANCE_SYMBOL_UNAVAILABLE", message: "BTCUSDT did not resolve to BTC/USDT on Binance Spot." };
  if (exchangeInfo.status !== "TRADING" || !exchangeInfo.spot_trading_allowed) return { ok: false, code: "BINANCE_MARKET_HALTED", message: "BTCUSDT is not currently in Binance Spot TRADING state.", market_status: exchangeInfo.status };

  const serverMidpointMs = (timeRecord.startedAtMs + timeRecord.receivedAtMs) / 2;
  const clockDriftMs = Math.round(serverTime.server_time_ms - serverMidpointMs);
  if (Math.abs(clockDriftMs) > BTC_BINANCE_CLOCK_DRIFT_LIMIT_MS) return { ok: false, code: "BINANCE_CLOCK_DRIFT", message: "Binance server clock differs from the local observation clock beyond the allowed shadow threshold." };

  const requests = await Promise.all([
    fetchPublicJson("/api/v3/ticker/price", symbolParams, options),
    fetchPublicJson("/api/v3/ticker/24hr", symbolParams, options),
    fetchPublicJson("/api/v3/ticker/bookTicker", symbolParams, options),
    fetchPublicJson("/api/v3/depth", { symbol: BTC_BINANCE_PRIMARY_SYMBOL, limit: 100 }, options),
    fetchPublicJson("/api/v3/aggTrades", { symbol: BTC_BINANCE_PRIMARY_SYMBOL, limit: 100 }, options),
    fetchPublicJson("/api/v3/klines", { symbol: BTC_BINANCE_PRIMARY_SYMBOL, interval: "1m", limit: 2 }, options),
    fetchPublicJson("/api/v3/klines", { symbol: BTC_BINANCE_PRIMARY_SYMBOL, interval: "1h", limit: 2 }, options),
    fetchPublicJson("/api/v3/klines", { symbol: BTC_BINANCE_PRIMARY_SYMBOL, interval: "1d", limit: 2 }, options),
  ]);
  const failed = requests.find(isFailure);
  if (failed && isFailure(failed)) return failed;
  const [priceRecord, tickerRecord, bookRecord, depthRecord, aggRecord, k1mRecord, k1hRecord, k1dRecord] = requests as FetchRecord[];
  const providerUsedWeights = [exchangeRecord, timeRecord, priceRecord, tickerRecord, bookRecord, depthRecord, aggRecord, k1mRecord, k1hRecord, k1dRecord]
    .map((record) => record.usedWeight)
    .filter((value): value is number => value !== null);
  const providerUsedWeight1mMax = providerUsedWeights.length ? Math.max(...providerUsedWeights) : null;

  try {
    const price = normalizePrice(priceRecord.value);
    const ticker24h = normalizeTicker24h(tickerRecord.value);
    const book = normalizeBookTicker(bookRecord.value);
    const depth = normalizeDepth(depthRecord.value);
    const aggTrades = normalizeAggTrades(aggRecord.value);
    const k1m = normalizeKlines(k1mRecord.value);
    const k1h = normalizeKlines(k1hRecord.value);
    const k1d = normalizeKlines(k1dRecord.value);
    if (aggTrades.length === 0 || k1m.length === 0 || k1h.length === 0 || k1d.length === 0 || depth.bids.length === 0 || depth.asks.length === 0) throw new Error("BINANCE_REQUIRED_ROWS_MISSING");

    const nowMs = now();
    const exchangeEvidence = evidence({ key: "exchangeInfo", record: exchangeRecord, params: symbolParams, normalized: exchangeInfo, raw: exchangeInfo, eventTimeMs: null, freshnessKind: "EXCHANGE_INFO", nowMs, providerClockOffsetMs: clockDriftMs, uncertainty: ["Binance exchangeInfo REST payload has no provider event timestamp; freshness is bounded to retrieval time."] });
    const timeEvidence = evidence({ key: "time", record: timeRecord, params: {}, normalized: serverTime, raw: serverTime, eventTimeMs: serverTime.server_time_ms, freshnessKind: "SERVER_TIME", nowMs, providerClockOffsetMs: clockDriftMs });
    const priceEvidence = evidence({ key: "price", record: priceRecord, params: symbolParams, normalized: price, raw: price, eventTimeMs: null, freshnessKind: "PRICE_BOOK_TRADE", nowMs, providerClockOffsetMs: clockDriftMs, uncertainty: ["Binance ticker/price REST payload has no provider event timestamp; freshness is bounded to retrieval time."] });
    const tickerEvidence = evidence({ key: "ticker24h", record: tickerRecord, params: symbolParams, normalized: ticker24h, raw: ticker24h, eventTimeMs: ticker24h.close_time_ms, freshnessKind: "TICKER_24H", eventOrUpdateId: ticker24h.trade_count, nowMs, providerClockOffsetMs: clockDriftMs });
    const bookEvidence = evidence({ key: "bookTicker", record: bookRecord, params: symbolParams, normalized: book, raw: book, eventTimeMs: null, freshnessKind: "PRICE_BOOK_TRADE", nowMs, providerClockOffsetMs: clockDriftMs, uncertainty: ["Binance bookTicker REST payload has no provider event timestamp; freshness is bounded to retrieval time."] });
    const depthEvidence = evidence({ key: "depth100", record: depthRecord, params: { symbol: BTC_BINANCE_PRIMARY_SYMBOL, limit: 100 }, normalized: depth, raw: depth, eventTimeMs: null, freshnessKind: "DEPTH", eventOrUpdateId: depth.last_update_id, nowMs, providerClockOffsetMs: clockDriftMs, uncertainty: ["Binance depth REST snapshot has an update ID but no provider event timestamp; freshness is bounded to retrieval time."] });
    const latestAgg = aggTrades[aggTrades.length - 1];
    const aggEvidence = evidence({ key: "aggTrades", record: aggRecord, params: { symbol: BTC_BINANCE_PRIMARY_SYMBOL, limit: 100 }, normalized: aggTrades, raw: aggTrades, eventTimeMs: latestAgg.trade_time_ms, freshnessKind: "PRICE_BOOK_TRADE", eventOrUpdateId: latestAgg.aggregate_trade_id, nowMs, providerClockOffsetMs: clockDriftMs });

    const klineEvidence = ([
      ["klines1m", k1mRecord, "1m", k1m],
      ["klines1h", k1hRecord, "1h", k1h],
      ["klines1d", k1dRecord, "1d", k1d],
    ] as const).map(([key, record, interval, rows]) => {
      const latest = rows[rows.length - 1];
      const closed = latest.close_time_ms < record.receivedAtMs;
      return evidence({
        key,
        record,
        params: { symbol: BTC_BINANCE_PRIMARY_SYMBOL, interval, limit: 2 },
        normalized: rows,
        raw: rows,
        eventTimeMs: closed ? latest.close_time_ms : null,
        freshnessKind: closed ? "CLOSED_KLINE" : "OPEN_KLINE",
        eventOrUpdateId: latest.open_time_ms,
        closed,
        nowMs,
        providerClockOffsetMs: clockDriftMs,
        uncertainty: closed ? [] : ["The latest REST kline is still open and has no provider event timestamp; live freshness is bounded to retrieval time."],
      });
    });

    const bid = Number(book.bid_price_usdt);
    const ask = Number(book.ask_price_usdt);
    const mid = (bid + ask) / 2;
    const spread = ask - bid;
    const bidQty = depth.bids.slice(0, 5).reduce((sum, level) => sum + Number(level[1]), 0);
    const askQty = depth.asks.slice(0, 5).reduce((sum, level) => sum + Number(level[1]), 0);
    const imbalance = bidQty + askQty === 0 ? 0 : (bidQty - askQty) / (bidQty + askQty);
    const derived = { mid_price_usdt: mid, spread_usdt: spread, spread_bps: mid === 0 ? 0 : (spread / mid) * 10_000, top_book_imbalance: imbalance };
    const derivedEvidence = buildBinanceEvidence({
      endpoint: "derived",
      dataSource: "BHRIGU",
      retrievalTimeMs: bookRecord.receivedAtMs,
      eventTimeMs: null,
      freshnessKind: "PRICE_BOOK_TRADE",
      rawValue: { input_evidence_ids: [bookEvidence.evidence_id, depthEvidence.evidence_id] },
      normalizedValue: derived,
      parameters: { method: "top5_book_microstructure" },
      derivationVersion: "btc_binance_microstructure_v0_1",
      inputEvidenceIds: [bookEvidence.evidence_id, depthEvidence.evidence_id],
      uncertainty: ["Derived by BHRIGU from venue-specific Binance Spot BTCUSDT book evidence; not a global BTC market measure."],
      nowMs,
    });

    const allEvidence = [exchangeEvidence, timeEvidence, priceEvidence, tickerEvidence, bookEvidence, depthEvidence, aggEvidence, ...klineEvidence, derivedEvidence];
    const requiredCurrent = [priceEvidence, tickerEvidence, bookEvidence, depthEvidence, aggEvidence, derivedEvidence];
    if (requiredCurrent.some((item) => item.freshness.state === "UNAVAILABLE")) return {
      ok: false,
      code: "BINANCE_STALE_DATA",
      message: "One or more required current Binance BTCUSDT observations are outside the live freshness contract.",
      retrieved_at: new Date(nowMs).toISOString(),
    };

    return {
      ok: true,
      snapshot: {
        schema_version: BTC_BINANCE_PUBLIC_MARKET_SNAPSHOT_SCHEMA,
        status: "READY_SHADOW",
        public_enabled: false,
        provider: "Binance",
        venue: "Binance Spot",
        symbol: BTC_BINANCE_PRIMARY_SYMBOL,
        retrieved_at: new Date(nowMs).toISOString(),
        clock_drift_ms: clockDriftMs,
        request_weight_budget: BTC_BINANCE_PUBLIC_REST_TOTAL_WEIGHT,
        evidence: allEvidence,
        derived,
        boundary: {
          api_key_required: false,
          authentication_used: false,
          trading_authority: false,
          withdrawal_authority: false,
          transfer_authority: false,
          private_account_data: false,
          raw_provider_payload_exposed: false,
          global_btc_price_claim: false,
          existing_static_corridor_replaced: false,
        },
      },
      provider_used_weight_1m_max: providerUsedWeight1mMax,
    };
  } catch {
    return { ok: false, code: "BINANCE_SCHEMA_INVALID", message: "Binance public market payload failed the locked BTCUSDT shadow schema." };
  }
}
