import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { routeBtcCosmographerQuestion } from "../lib/btc-cosmographer-route-graph";
import { buildBinanceEvidence, type BtcBinanceShadowSnapshot } from "../lib/btc-binance-public-market-evidence";
import { buildBtcBinancePublicBinding, decideBtcBinancePublicBinding } from "../lib/btc-binance-public-binding";
import { compareCompatibleMarketObservations } from "../lib/btc-market-evidence-consumer";
import type { BinancePublicMarketResult } from "../lib/btc-binance-public-market-source";
import {
  BTC_BINANCE_PRODUCTION_AUXILIARY_DEADLINE_MS,
  BTC_BINANCE_PRODUCTION_MAX_BUNDLES_PER_WINDOW,
  BTC_BINANCE_PRODUCTION_MAX_NOMINAL_WEIGHT_PER_WINDOW,
  getBtcBinanceProductionGuardState,
  loadBtcBinanceProductionGuarded,
  resetBtcBinanceProductionGuardForTests,
} from "../lib/btc-binance-production-guard";

type HeldoutCase = { id: string; locale: "en" | "ru"; question: string; expected_fetch: boolean; family: string };
type Heldout = { schema_version: string; semantic_cases: HeldoutCase[]; provider_overlays: string[] };
const NOW = 1_786_900_000_000;

function evidence(endpoint: "/api/v3/ticker/price" | "/api/v3/ticker/24hr" | "/api/v3/ticker/bookTicker" | "derived", normalizedValue: unknown, inputs: string[] = []) {
  return buildBinanceEvidence({
    endpoint,
    dataSource: endpoint === "derived" ? "BHRIGU" : "Memory",
    retrievalTimeMs: NOW - 400,
    eventTimeMs: endpoint === "/api/v3/ticker/24hr" ? NOW - 900 : null,
    freshnessKind: endpoint === "/api/v3/ticker/24hr" ? "TICKER_24H" : "PRICE_BOOK_TRADE",
    rawValue: { private_fixture_marker: endpoint },
    normalizedValue,
    parameters: { symbol: "BTCUSDT", endpoint },
    derivationVersion: endpoint === "derived" ? "fixture_v0_1" : null,
    inputEvidenceIds: inputs,
    nowMs: NOW,
  });
}

const price = evidence("/api/v3/ticker/price", { price_usdt: "60200.12000000" });
const ticker = evidence("/api/v3/ticker/24hr", {
  price_change_usdt: "120.50000000",
  price_change_percent: "0.200",
  high_price_usdt: "61000.00000000",
  low_price_usdt: "59000.00000000",
  volume_btc: "1234.50000000",
  quote_volume_usdt: "74000000.00000000",
});
const book = evidence("/api/v3/ticker/bookTicker", { bid_price_usdt: "60199.00000000", ask_price_usdt: "60201.00000000" });
const derived = evidence("derived", { spread_usdt: 2, spread_bps: 0.3322259136, top_book_imbalance: 0.12 }, [book.evidence_id]);
const snapshot: BtcBinanceShadowSnapshot = {
  schema_version: "btc_binance_public_market_shadow_snapshot_v0_1",
  status: "READY_SHADOW",
  public_enabled: false,
  provider: "Binance",
  venue: "Binance Spot",
  symbol: "BTCUSDT",
  retrieved_at: new Date(NOW).toISOString(),
  clock_drift_ms: 0,
  request_weight_budget: 42,
  evidence: [price, ticker, book, derived],
  derived: { mid_price_usdt: 60200, spread_usdt: 2, spread_bps: 0.3322259136, top_book_imbalance: 0.12 },
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
};

const successResult = (usedWeight: number | null = null): BinancePublicMarketResult => ({
  ok: true,
  snapshot,
  provider_used_weight_1m_max: usedWeight,
});

async function main() {
  const checks: Record<string, boolean> = {};
  const heldout = JSON.parse(await readFile("tests/fixtures/btc-binance-production-heldout-v0_1.json", "utf8")) as Heldout;
  checks.heldout_schema = heldout.schema_version === "btc_binance_production_heldout_v0_1";
  checks.heldout_24_semantic = heldout.semantic_cases.length === 24;
  checks.heldout_ru_en_balance = heldout.semantic_cases.filter((item) => item.locale === "en").length === 12 && heldout.semantic_cases.filter((item) => item.locale === "ru").length === 12;
  checks.provider_overlay_set = heldout.provider_overlays.length === 6 && ["FRESH", "STALE_LIMITED", "BINANCE_TIMEOUT", "HTTP_429", "HTTP_418", "SOURCE_CONFLICT"].every((item) => heldout.provider_overlays.includes(item));

  for (const item of heldout.semantic_cases) {
    const route = routeBtcCosmographerQuestion(item.locale, item.question, null);
    const preview = decideBtcBinancePublicBinding({ route, vercelEnv: "preview" });
    const productionDefault = decideBtcBinancePublicBinding({ route, vercelEnv: "production" });
    const productionOptIn = decideBtcBinancePublicBinding({ route, vercelEnv: "production", productionEnabled: true });
    const killed = decideBtcBinancePublicBinding({ route, vercelEnv: "production", productionEnabled: true, disabled: true });
    checks[`heldout_${item.id}`] = preview.fetch === item.expected_fetch
      && productionDefault.fetch === false
      && productionOptIn.fetch === item.expected_fetch
      && killed.fetch === false;
  }

  const supportedRoute = routeBtcCosmographerQuestion("en", "What is happening with BTC now?", null);
  const productionDecision = decideBtcBinancePublicBinding({ route: supportedRoute, vercelEnv: "production", productionEnabled: true });
  checks.production_positive_opt_in = productionDecision.fetch && productionDecision.gate_state === "ENABLED_PRODUCTION" && !productionDecision.preview_only && productionDecision.production_enabled;
  checks.production_default_off = !decideBtcBinancePublicBinding({ route: supportedRoute, vercelEnv: "production" }).fetch;
  checks.production_kill_switch_absolute = !decideBtcBinancePublicBinding({ route: supportedRoute, vercelEnv: "production", productionEnabled: true, disabled: true }).fetch;

  const freshPacket = buildBtcBinancePublicBinding({
    decision: productionDecision,
    result: successResult(),
    staticPeer: { price_usd: 60300, observed_at: new Date(NOW - 1_000).toISOString(), freshness: "FRESH" },
  });
  checks.fresh_packet = Boolean(freshPacket && freshPacket.status === "READY" && freshPacket.freshness_state === "FRESH" && freshPacket.facts.length > 0 && freshPacket.production_enabled && !freshPacket.preview_only);
  checks.fresh_no_raw_payload = Boolean(freshPacket && !JSON.stringify(freshPacket).includes("private_fixture_marker") && !JSON.stringify(freshPacket).includes("raw_value"));
  checks.usdt_usd_not_silently_equal = Boolean(freshPacket?.source_comparison?.status === "NOT_COMPARABLE" && freshPacket.source_comparison.reasons.includes("QUOTE_BASIS_MISMATCH") && freshPacket.source_comparison.winner === null);

  const stalePacket = buildBtcBinancePublicBinding({
    decision: productionDecision,
    result: { ok: false, code: "BINANCE_STALE_DATA", message: "stale", retrieved_at: new Date(NOW).toISOString() },
  });
  checks.stale_limited_packet = Boolean(stalePacket && stalePacket.status === "LIVE_VENUE_LIMITED" && stalePacket.freshness_state === "STALE_LIMITED" && stalePacket.facts.length === 0 && stalePacket.retrieved_at);

  const timeoutPacket = buildBtcBinancePublicBinding({
    decision: productionDecision,
    result: { ok: false, code: "BINANCE_TIMEOUT", message: "timeout" },
  });
  checks.timeout_unavailable_packet = Boolean(timeoutPacket && timeoutPacket.status === "LIVE_VENUE_UNAVAILABLE" && timeoutPacket.freshness_state === "UNAVAILABLE" && timeoutPacket.facts.length === 0);

  const conflict = compareCompatibleMarketObservations(
    { provider: "A", venue: "venue-a", symbol: "BTCUSDT", metric: "BTC_REFERENCE_PRICE", value: 60_000, unit: "QUOTE_PER_BTC", quote_basis: "USDT", observed_at: new Date(NOW).toISOString(), freshness: "FRESH" },
    { provider: "B", venue: "venue-b", symbol: "BTCUSDT", metric: "BTC_REFERENCE_PRICE", value: 60_500, unit: "QUOTE_PER_BTC", quote_basis: "USDT", observed_at: new Date(NOW + 1_000).toISOString(), freshness: "FRESH" },
  );
  checks.source_conflict_visible_no_winner = conflict.status === "DELTA_VISIBLE" && conflict.absolute_delta === 500 && conflict.winner === null && conflict.materiality === "UNCALIBRATED";

  resetBtcBinanceProductionGuardForTests();
  let providerCalls = 0;
  for (let i = 0; i < BTC_BINANCE_PRODUCTION_MAX_BUNDLES_PER_WINDOW; i += 1) {
    const result = await loadBtcBinanceProductionGuarded(async () => {
      providerCalls += 1;
      return successResult();
    }, { now: () => 10_000 });
    assert.equal(result.ok, true, `rate budget admission ${i}`);
  }
  const budgetDenied = await loadBtcBinanceProductionGuarded(async () => {
    providerCalls += 1;
    return successResult();
  }, { now: () => 10_000 });
  checks.rate_budget_10_per_minute = providerCalls === 10 && "code" in budgetDenied && budgetDenied.code === "BHRIGU_BINANCE_RATE_BUDGET";
  checks.nominal_weight_budget_420 = BTC_BINANCE_PRODUCTION_MAX_NOMINAL_WEIGHT_PER_WINDOW === 420;

  resetBtcBinanceProductionGuardForTests();
  let coalescedCalls = 0;
  let release: ((value: BinancePublicMarketResult) => void) | null = null;
  const coalescedFetcher = async (_signal: AbortSignal): Promise<BinancePublicMarketResult> => {
    coalescedCalls += 1;
    return await new Promise<BinancePublicMarketResult>((resolve) => { release = resolve; });
  };
  const first = loadBtcBinanceProductionGuarded(coalescedFetcher, { now: () => 20_000, deadlineMs: 500 });
  const second = loadBtcBinanceProductionGuarded(coalescedFetcher, { now: () => 20_000, deadlineMs: 500 });
  await Promise.resolve();
  assert(release, "coalesced fetch release missing");
  release(successResult());
  const [firstResult, secondResult] = await Promise.all([first, second]);
  checks.inflight_coalescing = coalescedCalls === 1 && firstResult.ok && secondResult.ok;

  resetBtcBinanceProductionGuardForTests();
  let rateLimitCalls = 0;
  const rateLimited = await loadBtcBinanceProductionGuarded(async () => {
    rateLimitCalls += 1;
    return { ok: false, code: "BINANCE_RATE_LIMIT_429", message: "429", retry_after_ms: 5_000 };
  }, { now: () => 30_000 });
  const circuitAfter429 = await loadBtcBinanceProductionGuarded(async () => {
    rateLimitCalls += 1;
    return successResult();
  }, { now: () => 31_000 });
  checks.http_429_opens_circuit = "code" in rateLimited && "code" in circuitAfter429 && circuitAfter429.code === "BHRIGU_BINANCE_CIRCUIT_OPEN" && rateLimitCalls === 1;

  resetBtcBinanceProductionGuardForTests();
  let banCalls = 0;
  await loadBtcBinanceProductionGuarded(async () => {
    banCalls += 1;
    return { ok: false, code: "BINANCE_IP_BAN_418", message: "418" };
  }, { now: () => 40_000 });
  const hardOpen = await loadBtcBinanceProductionGuarded(async () => {
    banCalls += 1;
    return successResult();
  }, { now: () => 100_000 });
  checks.http_418_without_retry_after_hard_opens = "code" in hardOpen && hardOpen.code === "BHRIGU_BINANCE_CIRCUIT_OPEN" && banCalls === 1 && getBtcBinanceProductionGuardState().hard_open;

  resetBtcBinanceProductionGuardForTests();
  let transientCalls = 0;
  for (let i = 0; i < 3; i += 1) {
    await loadBtcBinanceProductionGuarded(async () => {
      transientCalls += 1;
      return { ok: false, code: "BINANCE_TIMEOUT", message: "timeout" };
    }, { now: () => 50_000 + i });
  }
  const transientCircuit = await loadBtcBinanceProductionGuarded(async () => {
    transientCalls += 1;
    return successResult();
  }, { now: () => 50_010 });
  checks.three_transient_failures_open_30s_circuit = "code" in transientCircuit && transientCircuit.code === "BHRIGU_BINANCE_CIRCUIT_OPEN" && transientCalls === 3;

  resetBtcBinanceProductionGuardForTests();
  let weightCalls = 0;
  await loadBtcBinanceProductionGuarded(async () => {
    weightCalls += 1;
    return successResult(421);
  }, { now: () => 60_000 });
  const weightCircuit = await loadBtcBinanceProductionGuarded(async () => {
    weightCalls += 1;
    return successResult();
  }, { now: () => 60_001 });
  checks.provider_weight_ceiling_opens_circuit = "code" in weightCircuit && weightCircuit.code === "BHRIGU_BINANCE_CIRCUIT_OPEN" && weightCalls === 1;

  resetBtcBinanceProductionGuardForTests();
  const deadlineResult = await loadBtcBinanceProductionGuarded((signal) => new Promise<BinancePublicMarketResult>((resolve) => {
    signal.addEventListener("abort", () => resolve({ ok: false, code: "BINANCE_TIMEOUT", message: "deadline" }), { once: true });
  }), { now: Date.now, deadlineMs: 15 });
  checks.auxiliary_deadline_abort = "code" in deadlineResult && deadlineResult.code === "BINANCE_TIMEOUT" && BTC_BINANCE_PRODUCTION_AUXILIARY_DEADLINE_MS === 1_500;

  const livePage = await readFile("pages/crypto-astro/btc/live.tsx", "utf8");
  const staticPage = await readFile("pages/crypto-astro/btc.tsx", "utf8");
  const dialogue = await readFile("components/btc/BtcCosmographerDialogue.tsx", "utf8");
  const source = await readFile("lib/btc-binance-public-market-source.ts", "utf8");
  const liveCss = await readFile("lib/btc-live-dialogue-style.ts", "utf8");
  const answerBuilder = livePage.slice(livePage.indexOf("const answer ="), livePage.indexOf("const evidenceNavigation"));

  checks.positive_server_side_production_flag = livePage.includes('BHRIGU_BINANCE_PUBLIC_PRODUCTION_ENABLE === "1"') && !livePage.includes("query.BHRIGU_BINANCE_PUBLIC_PRODUCTION_ENABLE");
  checks.kill_switch_server_side = livePage.includes('BHRIGU_BINANCE_PUBLIC_BINDING_DISABLE === "1"');
  checks.production_uses_guard = livePage.includes("loadBtcBinanceProductionGuarded") && livePage.includes("loadBtcBinancePublicMarketShadow({ signal })");
  checks.external_abort_propagates_to_provider = source.includes("signal?: AbortSignal") && source.includes('addEventListener("abort", abortFromOuter') && source.includes('removeEventListener("abort", abortFromOuter');
  checks.no_same_request_retry = !source.match(/retry\s*\(|for\s*\([^)]*retry|while\s*\([^)]*retry/i);
  checks.base_answer_independent = !answerBuilder.toLowerCase().includes("binance") && livePage.indexOf("const answer =") < livePage.indexOf("const binanceResult = await binancePromise");
  checks.static_btc_surface_untouched = !staticPage.includes("btc-binance-production-guard") && !staticPage.includes("BHRIGU_BINANCE_PUBLIC_PRODUCTION_ENABLE");
  checks.internal_failure_code_not_rendered = !dialogue.includes("binding.failure?.code") && !dialogue.includes('binding.failure.code');
  checks.safe_unavailable_copy = dialogue.includes("Live Binance venue evidence is temporarily unavailable") && dialogue.includes("Текущее биржевое наблюдение Binance временно недоступно");
  checks.safe_stale_copy = dialogue.includes("outside the current-live freshness window") && dialogue.includes("вышли за допустимое окно текущей свежести");
  checks.provenance_fields_visible = ["Provider", "Venue", "Symbol", "Retrieved", "Freshness", "Провайдер", "Площадка", "Символ", "Получено", "Свежесть"].every((item) => dialogue.includes(item));
  checks.venue_boundary_visible = dialogue.includes("venue-specific observation") && dialogue.includes("наблюдение конкретной площадки");
  checks.mobile_responsive_contract = liveCss.includes("@media(max-width:760px)") && liveCss.includes(".answerEvidenceMeta{grid-template-columns:1fr}") && liveCss.includes(".turnBody{padding:20px 16px");
  checks.desktop_grid_contract = liveCss.includes(".answerEvidenceMeta{display:grid;grid-template-columns:repeat(3,minmax(0,1fr))");

  for (const [name, passed] of Object.entries(checks)) assert.equal(passed, true, name);
  console.log(JSON.stringify({
    schema_version: "btc_binance_production_activation_readiness_acceptance_v0_1",
    status: "PASS",
    semantic_cases: heldout.semantic_cases.length,
    provider_overlays: heldout.provider_overlays.length,
    checks,
    decision: {
      production_capable_code: true,
      production_default_off: true,
      production_enabled_in_environment: false,
      api_key: false,
      account_access: false,
      trading: false,
      withdrawal: false,
      transfer: false
    }
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
