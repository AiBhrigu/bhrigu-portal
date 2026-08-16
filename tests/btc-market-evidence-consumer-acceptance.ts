import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { buildBinanceEvidence } from "../lib/btc-binance-public-market-evidence";
import {
  compareCompatibleMarketObservations,
  consumeBtcMarketEvidence,
  type ComparableMarketObservation,
} from "../lib/btc-market-evidence-consumer";

const NOW = 1_786_829_900_000;

function raw(idSeed: string, freshnessOffsetMs: number) {
  const item = buildBinanceEvidence({
    endpoint: "/api/v3/ticker/price",
    dataSource: "Memory",
    retrievalTimeMs: NOW - freshnessOffsetMs,
    eventTimeMs: null,
    freshnessKind: "PRICE_BOOK_TRADE",
    rawValue: { secret_raw_fixture: idSeed },
    normalizedValue: { price_usdt: "60200.12000000" },
    parameters: { symbol: "BTCUSDT", idSeed },
    nowMs: NOW,
  });
  return item;
}

function closedCandle() {
  return buildBinanceEvidence({
    endpoint: "/api/v3/klines",
    dataSource: "Database",
    retrievalTimeMs: NOW,
    eventTimeMs: NOW - 86_400_000,
    freshnessKind: "CLOSED_KLINE",
    rawValue: { hidden: true },
    normalizedValue: { interval: "1d", close_usdt: "60000.00000000" },
    parameters: { symbol: "BTCUSDT", interval: "1d" },
    nowMs: NOW,
    closed: true,
  });
}

async function main() {
  const checks: Record<string, boolean> = {};
  const fresh = raw("fresh", 1_000);
  const stale = raw("stale", 10_000);
  const closed = closedCandle();
  const derived = buildBinanceEvidence({
    endpoint: "derived",
    dataSource: "BHRIGU",
    retrievalTimeMs: NOW,
    eventTimeMs: null,
    freshnessKind: "PRICE_BOOK_TRADE",
    rawValue: null,
    normalizedValue: { delta: 1 },
    parameters: { metric: "test" },
    derivationVersion: "consumer_fixture_v0_1",
    inputEvidenceIds: [fresh.evidence_id, stale.evidence_id],
    nowMs: NOW,
  });
  const evidence = [fresh, stale, closed, derived];

  const nowView = consumeBtcMarketEvidence("BTC_FIELD_NOW", evidence);
  checks.now_fresh_only = nowView.admitted.some((item) => item.evidence_id === fresh.evidence_id)
    && !nowView.admitted.some((item) => item.evidence_id === stale.evidence_id)
    && !nowView.admitted.some((item) => item.evidence_id === closed.evidence_id);
  checks.now_stale_suppressed = nowView.suppressed.some((item) => item.evidence_id === stale.evidence_id && item.reason === "STALE_NOT_CURRENT");
  checks.now_closed_suppressed = nowView.suppressed.some((item) => item.evidence_id === closed.evidence_id && item.reason === "CLOSED_NOT_CURRENT");
  checks.derived_inherits_inputs = nowView.suppressed.some((item) => item.evidence_id === derived.evidence_id && item.reason === "DERIVED_INPUT_NOT_ADMISSIBLE");

  const memoryView = consumeBtcMarketEvidence("BTC_CHANGE_MEMORY", evidence);
  checks.closed_allowed_for_memory = memoryView.admitted.some((item) => item.evidence_id === closed.evidence_id);
  checks.stale_not_promoted_in_memory = memoryView.suppressed.some((item) => item.evidence_id === stale.evidence_id);

  const proofView = consumeBtcMarketEvidence("METHOD_AND_PROOF", evidence);
  checks.proof_retains_state = proofView.admitted.length === evidence.length;
  checks.proof_hides_values = proofView.admitted.every((item) => item.normalized_value === null);
  checks.no_raw_payload = !JSON.stringify(nowView).includes("secret_raw_fixture") && !JSON.stringify(proofView).includes("raw_value");
  checks.shadow_default_off = nowView.shadow_only === true && nowView.public_enabled === false;
  checks.zero_financial_authority = Object.values(nowView.boundary).every((value) => value === false);

  const observation = (overrides: Partial<ComparableMarketObservation> = {}): ComparableMarketObservation => ({
    provider: "Binance",
    venue: "Binance Spot",
    symbol: "BTCUSDT",
    metric: "LAST_PRICE",
    value: 60200,
    unit: "USD_EQUIVALENT",
    quote_basis: "USD_STABLECOIN_EQUIVALENT",
    observed_at: new Date(NOW).toISOString(),
    freshness: "FRESH",
    ...overrides,
  });

  const compatible = compareCompatibleMarketObservations(
    observation(),
    observation({ provider: "IndependentLive", venue: "aggregate", symbol: "BTCUSD", value: 60300, observed_at: new Date(NOW + 5_000).toISOString() }),
  );
  checks.compatible_delta_visible = compatible.status === "DELTA_VISIBLE" && compatible.absolute_delta === 100 && compatible.relative_delta_bps !== null;
  checks.no_silent_winner = compatible.winner === null && compatible.materiality === "UNCALIBRATED";

  const quoteMismatch = compareCompatibleMarketObservations(observation(), observation({ quote_basis: "EUR", value: 60300 }));
  checks.quote_mismatch_not_comparable = quoteMismatch.status === "NOT_COMPARABLE" && quoteMismatch.reasons.includes("QUOTE_BASIS_MISMATCH") && quoteMismatch.absolute_delta === null;

  const stalePeer = compareCompatibleMarketObservations(observation(), observation({ freshness: "STALE_LIMITED", value: 60300 }));
  checks.stale_peer_unavailable = stalePeer.status === "SOURCE_UNAVAILABLE" && stalePeer.reasons.includes("SOURCE_NOT_FRESH");

  const skewed = compareCompatibleMarketObservations(observation(), observation({ observed_at: new Date(NOW + 31_000).toISOString(), value: 60300 }));
  checks.time_skew_not_comparable = skewed.status === "NOT_COMPARABLE" && skewed.reasons.includes("TIME_WINDOW_MISMATCH");

  const consumerSource = await readFile("lib/btc-market-evidence-consumer.ts", "utf8");
  const publicPage = await readFile("pages/crypto-astro/btc.tsx", "utf8");
  const livePage = await readFile("pages/crypto-astro/btc/live.tsx", "utf8");
  const staticSource = await readFile("lib/btc-public-static-source.ts", "utf8");
  checks.no_public_wiring = !publicPage.includes("btc-market-evidence-consumer") && !livePage.includes("btc-market-evidence-consumer") && !staticSource.includes("btc-market-evidence-consumer");
  checks.no_threshold_materiality = !consumerSource.match(/50\s*(?:bps|basis)/i) && consumerSource.includes('materiality: "UNCALIBRATED"');
  checks.no_trade_or_private_authority = !consumerSource.match(/\/sapi\/|X-MBX-APIKEY|apiSecret|placeOrder|withdraw|universalTransfer/i);

  for (const [name, passed] of Object.entries(checks)) assert.equal(passed, true, name);

  console.log(JSON.stringify({
    schema_version: "btc_market_evidence_consumer_acceptance_v0_1",
    status: "PASS",
    checks,
    decision: {
      shadow_only: true,
      public_activation: false,
      source_materiality_calibrated: false,
      trading: false,
      withdrawal: false,
      transfer: false,
    },
  }));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
