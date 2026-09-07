import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  BHRIGU_BINANCE_AGENT_OS_TRACK_A_SCHEMA,
  BHRIGU_TRACK_A_MEMORY_LAW,
  buildBhriguBinanceAgentOsTrackARecord,
} from "../lib/btc-binance-agent-os-track-a";
import type { BinancePublicMarketResult } from "../lib/btc-binance-public-market-source";

const NOW = Date.parse("2026-09-07T16:30:00.000Z");
const retrieval = new Date(NOW).toISOString();

function evidence(endpoint: "/api/v3/ticker/price" | "/api/v3/ticker/24hr", id: string, normalized_value: unknown) {
  return {
    schema_version: "btc_binance_public_market_evidence_v0_1",
    evidence_id: id,
    authority_layer: "RAW",
    provider: "Binance", venue: "Binance Spot", market: "spot", symbol: "BTCUSDT",
    event_time: retrieval, retrieval_time: retrieval, source_type: "REST",
    endpoint_or_stream: endpoint, security_type: "NONE", data_source: "Memory",
    raw_value: {}, normalized_value,
    freshness: { contract_id: "btc_binance_live_freshness_v0_1", state: "FRESH", event_age_ms: 0, retrieval_age_ms: 0, reason: "OK" },
    provenance: { provider: "Binance", venue: "Binance Spot", endpoint_or_stream: endpoint, parameters_hash: "a", event_or_update_id: null, observation_hash: "b" },
    derivation_version: null, input_evidence_ids: [], uncertainty: [],
  };
}
function restSuccess(): BinancePublicMarketResult {
  return {
    ok: true,
    provider_used_weight_1m_max: 42,
    snapshot: {
      schema_version: "btc_binance_public_market_shadow_snapshot_v0_1",
      status: "READY_SHADOW", public_enabled: false,
      provider: "Binance", venue: "Binance Spot", symbol: "BTCUSDT",
      retrieved_at: retrieval, clock_drift_ms: 0, request_weight_budget: 42,
      evidence: [
        evidence("/api/v3/ticker/price", "price_evidence", { price_usdt: "111111.11000000" }),
        evidence("/api/v3/ticker/24hr", "ticker_evidence", {
          last_price_usdt: "111111.11000000", price_change_percent: "1.25000000",
          high_price_usdt: "112000.00000000", low_price_usdt: "108000.00000000",
          volume_btc: "12345.00000000",
        }),
      ],
      derived: { mid_price_usdt: 111111.11, spread_usdt: 0.01, spread_bps: 0.001, top_book_imbalance: 0 },
      boundary: {
        api_key_required: false, authentication_used: false, trading_authority: false,
        withdrawal_authority: false, transfer_authority: false, private_account_data: false,
        raw_provider_payload_exposed: false, global_btc_price_claim: false,
        existing_static_corridor_replaced: false,
      },
    },
  } as unknown as BinancePublicMarketResult;
}
async function main() {
  const checks: Record<string, boolean> = {};
  const cli = await buildBhriguBinanceAgentOsTrackARecord({
    now: () => NOW,
    cliRunner: async () => JSON.stringify({
      symbol: "BTCUSDT", lastPrice: "110000.00000000",
      priceChangePercent: "0.50000000", highPrice: "111000.00000000",
      lowPrice: "107000.00000000", volume: "9000.00000000",
    }),
    restLoader: async () => { throw new Error("rest_must_not_run"); },
  });
  checks.cli_primary = cli.source_path === "binance_cli" && cli.market_time.last_price_usdt === "110000.00000000";

  const fallback = await buildBhriguBinanceAgentOsTrackARecord({
    now: () => NOW,
    cliRunner: async () => { throw new Error("cli_timeout"); },
    restLoader: async () => restSuccess(),
  });
  checks.visible_fallback = fallback.source_path === "bhrigu_public_rest_fallback" && /fail-safe/.test(fallback.source_note);
  checks.existing_rest_evidence = fallback.market_time.evidence_ids.join(",") === "price_evidence,ticker_evidence";
  checks.protocol_time = fallback.protocol_time.halving_epoch === 4
    && fallback.protocol_time.epoch_start_height === 840000
    && fallback.protocol_time.next_epoch_height === 1050000
    && fallback.protocol_time.block_subsidy_btc === 3.125;
  checks.precommitted_window = fallback.prospective_window.id === "SEP_10_2026"
    && fallback.prospective_window.date_utc === "2026-09-10"
    && fallback.prospective_window.retroactive_rewrite === "forbidden";
  checks.memory = fallback.memory.law === BHRIGU_TRACK_A_MEMORY_LAW
    && fallback.memory.next_step === "compare_precommitted_record_with_reality";
  checks.no_prediction_claim = fallback.prospective_window.price_target === false
    && fallback.prospective_window.trading_signal === false
    && fallback.phi_coordinate.causal_claim === false;
  checks.zero_financial_authority = Object.values(fallback.authority).every((value) => value === false);
  checks.schema = fallback.schema_version === BHRIGU_BINANCE_AGENT_OS_TRACK_A_SCHEMA
    && fallback.mode === "research_only"
    && fallback.boundary === "RESEARCH_STATE_NOT_TRADE";

  await assert.rejects(
    () => buildBhriguBinanceAgentOsTrackARecord({
      source: "cli", cliRunner: async () => "not-json", restLoader: async () => restSuccess(),
    }),
    /BINANCE_CLI_UNAVAILABLE/,
  );
  checks.cli_only_fails_closed = true;

  const finalFallback = await buildBhriguBinanceAgentOsTrackARecord({
    now: () => NOW,
    cliRunner: async () => { throw new Error("cli_timeout"); },
    restLoader: async () => ({ ok: false, code: "BINANCE_TIMEOUT", message: "timeout" }),
    publicApiLoader: async () => ({
      provider: "Binance", venue: "Binance Spot", symbol: "BTCUSDT",
      last_price_usdt: "109500.00000000", price_change_percent_24h: "-0.250",
      high_price_usdt_24h: "111000.00000000", low_price_usdt_24h: "108500.00000000",
      volume_btc_24h: "8000.00000000", observed_at: retrieval,
      freshness_state: "FRESH_AT_RETRIEVAL", evidence_ids: ["public_api_stub"],
    }),
  });
  checks.final_public_api_fallback = finalFallback.source_path === "binance_public_api_fallback"
    && finalFallback.market_time.evidence_ids[0] === "public_api_stub";

  const source = await readFile("lib/btc-binance-agent-os-track-a.ts", "utf8");
  checks.no_private_binance_endpoint = !/\/sapi\/|\/api\/v3\/(?:account|order|myTrades|allOrders)/.test(source);
  checks.cli_env_is_sanitized = source.includes('BINANCE_SPOT_BASE_PATH: "https://api.binance.com"');
  for (const [name, passed] of Object.entries(checks)) assert.equal(passed, true, name);
  console.log(JSON.stringify({
    schema_version: "bhrigu_binance_agent_os_track_a_acceptance_v0_1",
    status: "PASS",
    checks,
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
