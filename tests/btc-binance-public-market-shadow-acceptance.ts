import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  BTC_BINANCE_LIVE_FRESHNESS_CONTRACT_ID,
  classifyBinanceEvidenceFreshness,
  compareMarketSources,
  normalizeDecimal,
  normalizeSignedDecimal,
} from "../lib/btc-binance-public-market-evidence";
import {
  BTC_BINANCE_PUBLIC_MARKET_BASE_URL,
  BTC_BINANCE_PUBLIC_REST_TOTAL_WEIGHT,
  buildBinancePublicMarketUrl,
  loadBtcBinancePublicMarketShadow,
} from "../lib/btc-binance-public-market-source";

const NOW = 1_786_829_900_000;

function response(payload: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(payload), { status, headers: { "content-type": "application/json", ...headers } });
}

function exchangeInfo(status = "TRADING") {
  return {
    timezone: "UTC",
    serverTime: NOW,
    rateLimits: [],
    symbols: [{
      symbol: "BTCUSDT",
      status,
      baseAsset: "BTC",
      quoteAsset: "USDT",
      isSpotTradingAllowed: status === "TRADING",
    }],
  };
}

function kline(interval: string) {
  const closeFuture = interval === "1m" ? NOW + 30_000 : interval === "1h" ? NOW + 30 * 60_000 : NOW + 12 * 60 * 60_000;
  const open = interval === "1m" ? NOW - 30_000 : interval === "1h" ? NOW - 30 * 60_000 : NOW - 12 * 60 * 60_000;
  return [
    [open - 60_000, "59900.00000000", "60100.00000000", "59800.00000000", "60000.00000000", "10.00000000", open - 1, "600000.00000000", 120, "5.00000000", "300000.00000000", "0"],
    [open, "60000.00000000", "60300.00000000", "59950.00000000", "60200.00000000", "12.50000000", closeFuture, "752500.00000000", 150, "6.25000000", "376250.00000000", "0"],
  ];
}

function successfulFetch(log: Array<{ url: string; method?: string; headers: HeadersInit | undefined }>): typeof fetch {
  return (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input));
    log.push({ url: url.toString(), method: init?.method, headers: init?.headers });
    const headers = { "x-mbx-used-weight-1m": "42" };
    if (url.pathname === "/api/v3/exchangeInfo") return response(exchangeInfo(), 200, headers);
    if (url.pathname === "/api/v3/time") return response({ serverTime: NOW }, 200, headers);
    if (url.pathname === "/api/v3/ticker/price") return response({ symbol: "BTCUSDT", price: "60200.12345678" }, 200, headers);
    if (url.pathname === "/api/v3/ticker/24hr") return response({
      symbol: "BTCUSDT",
      priceChange: "-1200.12345678",
      priceChangePercent: "-2.03400000",
      lastPrice: "60200.12345678",
      highPrice: "61000.00000000",
      lowPrice: "58000.00000000",
      volume: "12345.67890000",
      quoteVolume: "740000000.12345678",
      openTime: NOW - 24 * 60 * 60_000,
      closeTime: NOW - 1_000,
      count: 543210,
    }, 200, headers);
    if (url.pathname === "/api/v3/ticker/bookTicker") return response({
      symbol: "BTCUSDT",
      bidPrice: "60200.12000000",
      bidQty: "1.25000000",
      askPrice: "60200.13000000",
      askQty: "1.10000000",
    }, 200, headers);
    if (url.pathname === "/api/v3/depth") return response({
      lastUpdateId: 987654321,
      bids: [["60200.12000000", "1.25000000"], ["60200.11000000", "2.00000000"], ["60200.10000000", "3.00000000"]],
      asks: [["60200.13000000", "1.10000000"], ["60200.14000000", "2.10000000"], ["60200.15000000", "2.90000000"]],
    }, 200, headers);
    if (url.pathname === "/api/v3/aggTrades") return response([
      { a: 1001, p: "60200.12000000", q: "0.01000000", f: 2001, l: 2001, T: NOW - 2_000, m: false, M: true },
      { a: 1002, p: "60200.13000000", q: "0.02000000", f: 2002, l: 2002, T: NOW - 1_000, m: true, M: true },
    ], 200, headers);
    if (url.pathname === "/api/v3/klines") return response(kline(url.searchParams.get("interval") ?? "1m"), 200, headers);
    throw new Error(`unexpected:${url.toString()}`);
  }) as typeof fetch;
}

async function main() {
  const checks: Record<string, boolean> = {};

  checks.market_only_host = BTC_BINANCE_PUBLIC_MARKET_BASE_URL === "https://data-api.binance.vision";
  checks.weight_budget = BTC_BINANCE_PUBLIC_REST_TOTAL_WEIGHT === 42;
  checks.decimal_precision = normalizeDecimal("60200.123456780000") === "60200.123456780000";
  checks.signed_change_precision = normalizeSignedDecimal("-1200.123456780000") === "-1200.123456780000";
  assert.throws(() => normalizeDecimal("-1.00000000"), /BINANCE_DECIMAL_INVALID/);
  checks.non_negative_price_guard = true;

  const priceUrl = new URL(buildBinancePublicMarketUrl("/api/v3/ticker/price", { symbol: "BTCUSDT" }));
  checks.exact_host = priceUrl.origin === "https://data-api.binance.vision";
  checks.exact_symbol = priceUrl.searchParams.get("symbol") === "BTCUSDT";
  assert.throws(() => buildBinancePublicMarketUrl("/api/v3/account" as never, {}), /FORBIDDEN/);
  checks.private_path_rejected = true;

  const calls: Array<{ url: string; method?: string; headers: HeadersInit | undefined }> = [];
  const success = await loadBtcBinancePublicMarketShadow({ fetchImpl: successfulFetch(calls), now: () => NOW });
  assert.equal(success.ok, true);
  checks.shadow_only = success.snapshot.status === "READY_SHADOW" && success.snapshot.public_enabled === false;
  checks.request_count = calls.length === 10;
  checks.get_only = calls.every((call) => call.method === "GET");
  checks.no_auth_headers = calls.every((call) => !JSON.stringify(call.headers ?? {}).match(/api.?key|authorization|signature/i));
  checks.no_private_urls = calls.every((call) => !/\/sapi\/|\/api\/v3\/(?:account|order|myTrades|allOrders)/.test(call.url));
  checks.boundary_zero_authority = success.snapshot.boundary.api_key_required === false
    && success.snapshot.boundary.authentication_used === false
    && success.snapshot.boundary.trading_authority === false
    && success.snapshot.boundary.withdrawal_authority === false
    && success.snapshot.boundary.transfer_authority === false
    && success.snapshot.boundary.private_account_data === false
    && success.snapshot.boundary.existing_static_corridor_replaced === false;
  checks.evidence_count = success.snapshot.evidence.length === 11;
  checks.all_none_security = success.snapshot.evidence.every((item) => item.security_type === "NONE" && item.source_type === "REST");
  checks.venue_specific = success.snapshot.evidence.every((item) => item.provider === "Binance" && item.venue === "Binance Spot" && item.symbol === "BTCUSDT");
  const priceEvidence = success.snapshot.evidence.find((item) => item.endpoint_or_stream === "/api/v3/ticker/price");
  checks.raw_decimal_preserved = (priceEvidence?.normalized_value as { price_usdt?: string })?.price_usdt === "60200.12345678";
  const derivedEvidence = success.snapshot.evidence.find((item) => item.authority_layer === "DERIVED");
  checks.raw_derived_separated = Boolean(derivedEvidence && derivedEvidence.derivation_version === "btc_binance_microstructure_v0_1" && derivedEvidence.input_evidence_ids.length === 2);
  checks.provenance_hashes = success.snapshot.evidence.every((item) => /^[a-f0-9]{64}$/.test(item.provenance.parameters_hash) && /^[a-f0-9]{64}$/.test(item.provenance.observation_hash));
  checks.live_freshness_contract = success.snapshot.evidence.every((item) => item.freshness.contract_id === BTC_BINANCE_LIVE_FRESHNESS_CONTRACT_ID);
  checks.clock_drift = success.snapshot.clock_drift_ms === 0;

  const fresh5 = classifyBinanceEvidenceFreshness({ kind: "PRICE_BOOK_TRADE", eventTimeMs: null, retrievalTimeMs: NOW, nowMs: NOW + 5_000 });
  const stale5 = classifyBinanceEvidenceFreshness({ kind: "PRICE_BOOK_TRADE", eventTimeMs: null, retrievalTimeMs: NOW, nowMs: NOW + 5_001 });
  const stale30 = classifyBinanceEvidenceFreshness({ kind: "PRICE_BOOK_TRADE", eventTimeMs: null, retrievalTimeMs: NOW, nowMs: NOW + 30_000 });
  const unavailable30 = classifyBinanceEvidenceFreshness({ kind: "PRICE_BOOK_TRADE", eventTimeMs: null, retrievalTimeMs: NOW, nowMs: NOW + 30_001 });
  checks.freshness_boundaries = fresh5.state === "FRESH" && stale5.state === "STALE_LIMITED" && stale30.state === "STALE_LIMITED" && unavailable30.state === "UNAVAILABLE";
  const closed = classifyBinanceEvidenceFreshness({ kind: "CLOSED_KLINE", eventTimeMs: NOW - 86_400_000, retrievalTimeMs: NOW, nowMs: NOW });
  checks.closed_candle_not_stale = closed.state === "CLOSED_AS_OF";
  const future = classifyBinanceEvidenceFreshness({ kind: "TICKER_24H", eventTimeMs: NOW + 5_001, retrievalTimeMs: NOW, nowMs: NOW });
  checks.future_event_fails_closed = future.state === "UNAVAILABLE" && future.reason === "FUTURE_EVENT";
  const clockCorrected = classifyBinanceEvidenceFreshness({ kind: "PRICE_BOOK_TRADE", eventTimeMs: NOW + 400, retrievalTimeMs: NOW, nowMs: NOW, providerClockOffsetMs: 450 });
  checks.provider_clock_correction = clockCorrected.state === "FRESH" && clockCorrected.event_age_ms === 50 && clockCorrected.retrieval_age_ms === 0;

  const disagreement = compareMarketSources(
    { provider: "Binance", venue: "Binance Spot", symbol: "BTCUSDT", value: 60200, event_time: new Date(NOW).toISOString() },
    { provider: "CoinGecko", venue: "aggregated", symbol: "BTCUSD", value: 60300, event_time: new Date(NOW).toISOString() },
  );
  checks.source_disagreement_visible = disagreement.resolution === "VISIBLE_NO_SILENT_REPLACEMENT" && disagreement.absolute_delta === 100 && disagreement.source_a.provider !== disagreement.source_b.provider;

  let rateCalls = 0;
  const rateLimited = await loadBtcBinancePublicMarketShadow({
    now: () => NOW,
    fetchImpl: (async () => { rateCalls += 1; return response({ code: -1003, msg: "Too many requests" }, 429, { "retry-after": "2" }); }) as typeof fetch,
  });
  checks.rate_limit_fail_closed = "code" in rateLimited && rateLimited.code === "BINANCE_RATE_LIMIT_429" && rateLimited.retry_after_ms === 2_000 && rateCalls === 1;

  const banned = await loadBtcBinancePublicMarketShadow({
    now: () => NOW,
    fetchImpl: (async () => response({ code: -1003, msg: "IP banned" }, 418, { "retry-after": "60" })) as typeof fetch,
  });
  checks.ip_ban_circuit = "code" in banned && banned.code === "BINANCE_IP_BAN_418" && banned.retry_after_ms === 60_000;

  const haltedCalls: Array<{ url: string; method?: string; headers: HeadersInit | undefined }> = [];
  const haltedFetch = successfulFetch(haltedCalls);
  const halted = await loadBtcBinancePublicMarketShadow({
    now: () => NOW,
    fetchImpl: (async (input, init) => {
      const url = new URL(String(input));
      if (url.pathname === "/api/v3/exchangeInfo") return response(exchangeInfo("HALT"));
      return haltedFetch(input, init);
    }) as typeof fetch,
  });
  checks.halted_market_fail_closed = "code" in halted && halted.code === "BINANCE_MARKET_HALTED" && halted.market_status === "HALT";

  const driftFetch = successfulFetch([]);
  const drift = await loadBtcBinancePublicMarketShadow({
    now: () => NOW,
    fetchImpl: (async (input, init) => {
      const url = new URL(String(input));
      if (url.pathname === "/api/v3/time") return response({ serverTime: NOW + 6_000 });
      return driftFetch(input, init);
    }) as typeof fetch,
  });
  checks.clock_drift_fail_closed = "code" in drift && drift.code === "BINANCE_CLOCK_DRIFT";

  const timeoutFetch = (async (_input: RequestInfo | URL, init?: RequestInit) => new Promise<Response>((_resolve, reject) => {
    init?.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")), { once: true });
  })) as typeof fetch;
  const timeout = await loadBtcBinancePublicMarketShadow({ now: () => NOW, fetchImpl: timeoutFetch, timeoutMs: 5 });
  checks.timeout_fail_closed = "code" in timeout && timeout.code === "BINANCE_TIMEOUT";

  const source = await readFile("lib/btc-binance-public-market-source.ts", "utf8");
  const evidenceSource = await readFile("lib/btc-binance-public-market-evidence.ts", "utf8");
  const publicPage = await readFile("pages/crypto-astro/btc.tsx", "utf8");
  const livePage = await readFile("pages/crypto-astro/btc/live.tsx", "utf8");
  const staticSource = await readFile("lib/btc-public-static-source.ts", "utf8");
  checks.source_has_no_private_endpoint = !source.match(/\/sapi\/|\/api\/v3\/(?:account|order|myTrades|allOrders)/);
  checks.source_has_no_secret_header = !source.match(/X-MBX-APIKEY|authorization|apiSecret|secretKey/i);
  checks.source_get_only = source.includes('method: "GET"') && !source.match(/method:\s*"(?:POST|PUT|DELETE|PATCH)"/);
  checks.no_public_activation = !publicPage.includes("btc-binance-public-market-source") && livePage.includes("btc-binance-public-market-source") && livePage.includes("process.env.VERCEL_ENV") && livePage.includes("BHRIGU_BINANCE_PUBLIC_BINDING_DISABLE");
  checks.static_corridor_untouched = !staticSource.includes("btc-binance-public-market-source");
  checks.provider_neutral_disagreement = evidenceSource.includes("btc_market_source_disagreement_v0_1") && evidenceSource.includes("VISIBLE_NO_SILENT_REPLACEMENT");

  for (const [name, passed] of Object.entries(checks)) assert.equal(passed, true, name);

  console.log(JSON.stringify({
    schema_version: "btc_binance_public_market_shadow_acceptance_v0_1",
    status: "PASS",
    base_url: BTC_BINANCE_PUBLIC_MARKET_BASE_URL,
    symbol: "BTCUSDT",
    request_weight_budget: BTC_BINANCE_PUBLIC_REST_TOTAL_WEIGHT,
    checks,
    decision: {
      public_activation: false,
      api_key: false,
      account_access: false,
      trading: false,
      withdrawal: false,
      transfer: false,
      existing_static_corridor_replaced: false,
    },
  }));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
