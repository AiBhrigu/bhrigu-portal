import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import type { BtcCosmographerRoute } from "../lib/btc-cosmographer-route-graph";
import { buildBinanceEvidence, type BtcBinanceShadowSnapshot } from "../lib/btc-binance-public-market-evidence";
import {
  buildBtcBinancePublicBinding,
  decideBtcBinancePublicBinding,
} from "../lib/btc-binance-public-binding";

const NOW = 1_786_861_000_000;
function route(domain: BtcCosmographerRoute["domain"], marketClass: BtcCosmographerRoute["market_question_class"], raw = "What is happening with BTC now?"): BtcCosmographerRoute {
  return {
    schema: "btc_cosmographer_semantic_route_graph_v0_1",
    locale: "en",
    raw_question: raw,
    normalized_question: raw,
    domain,
    subject: marketClass ?? domain,
    intents: domain === "snapshot_memory" ? ["change"] : ["fact"],
    context_relation: "NEW_TOPIC",
    time_range: null,
    market_question_class: marketClass,
    capability_id: `${domain}.${marketClass ?? domain}`,
    confidence: "HIGH",
    explicit_entities: marketClass ? [marketClass] : [],
  };
}

function evidence(endpoint: "/api/v3/ticker/price" | "/api/v3/ticker/24hr" | "/api/v3/ticker/bookTicker" | "derived", normalizedValue: unknown, inputs: string[] = []) {
  return buildBinanceEvidence({
    endpoint,
    dataSource: endpoint === "derived" ? "BHRIGU" : "Memory",
    retrievalTimeMs: NOW - 500,
    eventTimeMs: endpoint === "/api/v3/ticker/24hr" ? NOW - 1_000 : null,
    freshnessKind: endpoint === "/api/v3/ticker/24hr" ? "TICKER_24H" : "PRICE_BOOK_TRADE",
    rawValue: { secret_raw_fixture: endpoint },
    normalizedValue,
    parameters: { symbol: "BTCUSDT", endpoint },
    derivationVersion: endpoint === "derived" ? "fixture_v0_1" : null,
    inputEvidenceIds: inputs,
    nowMs: NOW,
  });
}

const price = evidence("/api/v3/ticker/price", { price_usdt: "60200.12000000" });
const ticker = evidence("/api/v3/ticker/24hr", {
  price_change_usdt: "-120.50000000",
  price_change_percent: "-0.200",
  high_price_usdt: "61000.00000000",
  low_price_usdt: "59000.00000000",
  volume_btc: "1234.50000000",
  quote_volume_usdt: "74000000.00000000",
});
const book = evidence("/api/v3/ticker/bookTicker", { bid_price_usdt: "60199.00000000", ask_price_usdt: "60201.00000000" });
const derived = evidence("derived", { spread_usdt: 2, spread_bps: 0.33222, top_book_imbalance: -0.12 }, [book.evidence_id]);
const snapshot: BtcBinanceShadowSnapshot = {
  schema_version: "btc_binance_public_market_shadow_snapshot_v0_1",
  status: "READY_SHADOW",
  public_enabled: false,
  provider: "Binance",
  venue: "Binance Spot",
  symbol: "BTCUSDT",
  retrieved_at: new Date(NOW).toISOString(),
  clock_drift_ms: 10,
  request_weight_budget: 42,
  evidence: [price, ticker, book, derived],
  derived: { mid_price_usdt: 60200, spread_usdt: 2, spread_bps: 0.33222, top_book_imbalance: -0.12 },
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

async function main() {
  const checks: Record<string, boolean> = {};
  const general = route("btc_market", "general_btc_field");
  const structure = route("btc_market", "market_structure", "What is the current BTC market structure?");
  const memory = route("snapshot_memory", "change_memory", "What changed since the previous Snapshot?");
  const method = route("methodology", null, "Which live Binance source is used?");
  const protocol = route("bitcoin_protocol", null, "What is the Bitcoin halving?");
  const astro = route("astromodule", null, "Where is Jupiter now?");
  const bridge = route("astro_btc_bridge", "general_btc_field", "Compare Jupiter with BTC");
  const liquidity = route("btc_market", "liquidity", "What is BTC liquidity?");

  checks.preview_general_fetch = decideBtcBinancePublicBinding({ route: general, vercelEnv: "preview" }).fetch;
  checks.preview_structure_fetch = decideBtcBinancePublicBinding({ route: structure, vercelEnv: "preview" }).fetch;
  checks.preview_memory_fetch = decideBtcBinancePublicBinding({ route: memory, vercelEnv: "preview" }).fetch;
  checks.preview_explicit_method_fetch = decideBtcBinancePublicBinding({ route: method, vercelEnv: "preview" }).fetch;
  checks.production_hard_off = !decideBtcBinancePublicBinding({ route: general, vercelEnv: "production" }).fetch;
  checks.kill_switch_wins = !decideBtcBinancePublicBinding({ route: general, vercelEnv: "preview", disabled: true }).fetch;
  checks.ineligible_routes_no_fetch = [protocol, astro, bridge, liquidity].every((item) => !decideBtcBinancePublicBinding({ route: item, vercelEnv: "preview" }).fetch);

  const decision = decideBtcBinancePublicBinding({ route: general, vercelEnv: "preview" });
  const packet = buildBtcBinancePublicBinding({
    decision,
    result: { ok: true, snapshot },
    staticPeer: { price_usd: 60300, observed_at: new Date(NOW - 86_400_000).toISOString(), freshness: "FRESH" },
  });
  assert(packet && packet.status === "READY");
  checks.public_whitelist_has_values = packet.facts.some((item) => item.id === "last_price") && packet.facts.some((item) => item.id === "top5_book_imbalance");
  checks.raw_payload_absent = !JSON.stringify(packet).includes("secret_raw_fixture") && !JSON.stringify(packet).includes("raw_value");
  checks.usdt_vs_usd_not_comparable = packet.source_comparison?.status === "NOT_COMPARABLE" && packet.source_comparison.reasons.includes("QUOTE_BASIS_MISMATCH") && packet.source_comparison.winner === null;
  checks.authority_boundary = packet.boundary.accepted_snapshot_remains_primary && !packet.boundary.base_answer_rewrite && !packet.boundary.global_btc_price_claim;
  checks.zero_financial_authority = !packet.boundary.trading_authority && !packet.boundary.withdrawal_authority && !packet.boundary.transfer_authority;
  checks.no_session_value_persistence_contract = packet.boundary.session_live_value_persistence === false;

  const methodPacket = buildBtcBinancePublicBinding({ decision: decideBtcBinancePublicBinding({ route: method, vercelEnv: "preview" }), result: { ok: true, snapshot } });
  checks.method_hides_values = Boolean(methodPacket && methodPacket.status === "READY" && methodPacket.facts.length === 0 && methodPacket.proof.length > 0);

  const failurePacket = buildBtcBinancePublicBinding({
    decision,
    result: { ok: false, code: "BINANCE_TIMEOUT", message: "timeout" },
  });
  checks.failure_fail_closed = Boolean(failurePacket && failurePacket.status === "LIVE_VENUE_UNAVAILABLE" && failurePacket.facts.length === 0 && failurePacket.freshness_state === "UNAVAILABLE");

  const livePage = await readFile("pages/crypto-astro/btc/live.tsx", "utf8");
  const staticPage = await readFile("pages/crypto-astro/btc.tsx", "utf8");
  const dialogue = await readFile("components/btc/BtcCosmographerDialogue.tsx", "utf8");
  const session = await readFile("lib/btc-live-dialogue-session.ts", "utf8");
  const makeTurn = dialogue.slice(dialogue.indexOf("function makeTurn"), dialogue.indexOf("function AstroWindowSection"));
  checks.live_only_wiring = livePage.includes("btc-binance-public-binding") && !staticPage.includes("btc-binance-public-binding");
  checks.preview_gate_server_side = livePage.includes('process.env.VERCEL_ENV') && livePage.includes('BHRIGU_BINANCE_PUBLIC_BINDING_DISABLE') && !livePage.includes("query.binance");
  checks.live_values_not_in_make_turn = !makeTurn.includes("binanceLiveBinding");
  checks.session_schema_untouched_by_binding = !session.includes("btc_binance_public_binding_v0_1") && !session.includes("binanceLiveBinding");
  const answerBuilder = livePage.slice(livePage.indexOf("const answer ="), livePage.indexOf("const evidenceNavigation"));
  checks.base_answer_not_bound_to_binance = !answerBuilder.toLowerCase().includes("binance");
  checks.no_private_or_trade_authority = ![livePage, dialogue, await readFile("lib/btc-binance-public-binding.ts", "utf8")].join("\n").match(/\/sapi\/|X-MBX-APIKEY|apiSecret|placeOrder|cancelOrder|withdrawApply|withdrawRequest|universalTransfer|internalTransfer/i);

  for (const [name, passed] of Object.entries(checks)) assert.equal(passed, true, name);
  console.log(JSON.stringify({ schema_version: "btc_binance_public_binding_acceptance_v0_1", status: "PASS", checks, decision: { preview_only: true, production_activation: false, account_access: false, trading: false, withdrawal: false, transfer: false } }, null, 2));
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
