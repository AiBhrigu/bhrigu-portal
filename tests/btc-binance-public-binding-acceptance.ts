import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  BTC_BINANCE_PUBLIC_BINDING_SCHEMA,
  buildBtcBinancePublicBinding,
  decideBtcBinancePublicBinding,
  formatBtcBinancePublicFactDisplayValue,
} from "../lib/btc-binance-public-binding";
import { makeBtcBinancePublicMarketSnapshot } from "./fixtures/btc-binance-public-market-fixture";
import { routeBtcCosmographerQuestion } from "../lib/btc-cosmographer-route-graph";

async function main() {
  const checks: Record<string, boolean> = {};

  const enNow = routeBtcCosmographerQuestion("en", "What is happening with BTC now?", null);
  const enCurrentPrice = routeBtcCosmographerQuestion("en", "What is the current BTC price?", null);
  const enCurrentVolume = routeBtcCosmographerQuestion("en", "What is the current BTC volume?", null);
  const enCurrentSpread = routeBtcCosmographerQuestion("en", "What is the current BTC spread?", null);
  const enCurrentBook = routeBtcCosmographerQuestion("en", "What is the current BTC order-book depth?", null);
  const enMarketData = routeBtcCosmographerQuestion("en", "What is the current BTC market data?", null);
  const enWhyDrop = routeBtcCosmographerQuestion("en", "Why did BTC drop today?", null);
  const enChanged = routeBtcCosmographerQuestion("en", "How has BTC changed today?", null);
  const ruNow = routeBtcCosmographerQuestion("ru", "Что происходит с BTC сейчас?", null);
  const ruCurrentPrice = routeBtcCosmographerQuestion("ru", "Какая сейчас цена BTC?", null);
  const ruWhyDrop = routeBtcCosmographerQuestion("ru", "Почему BTC падает сейчас?", null);
  const ruMarketData = routeBtcCosmographerQuestion("ru", "Покажи текущие данные рынка BTC", null);
  const method = routeBtcCosmographerQuestion("en", "Which sources and method does Cosmographer use?", null);
  const protocol = routeBtcCosmographerQuestion("en", "What is the Bitcoin protocol?", null);
  const astro = routeBtcCosmographerQuestion("en", "Where is Jupiter now?", null);
  const trading = routeBtcCosmographerQuestion("en", "Should I buy BTC now?", null);
  const sellDecision = routeBtcCosmographerQuestion("en", "Should I sell BTC now?", null);
  const entryDecision = routeBtcCosmographerQuestion("en", "Give me a BTC entry now", null);
  const exitDecision = routeBtcCosmographerQuestion("en", "Where should I exit BTC?", null);
  const positionDecision = routeBtcCosmographerQuestion("en", "Should I increase my BTC position?", null);
  const leverageDecision = routeBtcCosmographerQuestion("en", "Should I use leverage on BTC now?", null);
  const stopDecision = routeBtcCosmographerQuestion("en", "Where should I set a stop loss for BTC?", null);
  const ruBuyDecision = routeBtcCosmographerQuestion("ru", "Стоит ли купить BTC сейчас?", null);
  const ruSellDecision = routeBtcCosmographerQuestion("ru", "Мне продать BTC сейчас?", null);
  const ruEntryDecision = routeBtcCosmographerQuestion("ru", "Дай точку входа в BTC", null);
  const ruPositionDecision = routeBtcCosmographerQuestion("ru", "Стоит ли увеличить позицию BTC?", null);
  const ruStopDecision = routeBtcCosmographerQuestion("ru", "Где поставить стоп по BTC?", null);
  const historicalBuy = routeBtcCosmographerQuestion("en", "At what price did Satoshi buy BTC?", null);
  const historicalSell = routeBtcCosmographerQuestion("en", "When did early miners sell BTC?", null);
  const explanatoryEntry = routeBtcCosmographerQuestion("en", "What is a BTC entry point?", null);
  const explanatoryPosition = routeBtcCosmographerQuestion("en", "What is a BTC position?", null);
  const ruHistoricalBuy = routeBtcCosmographerQuestion("ru", "По какой цене Сатоши покупал BTC?", null);

  const previewRoutes = [enNow, enCurrentPrice, enCurrentVolume, enCurrentSpread, enCurrentBook, enMarketData, enWhyDrop, enChanged, ruNow, ruCurrentPrice, ruWhyDrop, ruMarketData];
  checks.preview_market_routes_are_eligible = previewRoutes.every((route) => decideBtcBinancePublicBinding({ route, vercelEnv: "preview" }).eligible);
  checks.preview_market_routes_fetch = previewRoutes.every((route) => decideBtcBinancePublicBinding({ route, vercelEnv: "preview" }).fetch);
  checks.preview_market_routes_mode = previewRoutes.every((route) => decideBtcBinancePublicBinding({ route, vercelEnv: "preview" }).mode === "BTC_FIELD_NOW");

  const methodDecision = decideBtcBinancePublicBinding({ route: method, vercelEnv: "preview" });
  checks.method_proof_mode = methodDecision.eligible && methodDecision.fetch && methodDecision.mode === "METHOD_AND_PROOF";

  checks.protocol_ineligible = !decideBtcBinancePublicBinding({ route: protocol, vercelEnv: "preview" }).eligible;
  checks.astro_ineligible = !decideBtcBinancePublicBinding({ route: astro, vercelEnv: "preview" }).eligible;
  checks.trading_ineligible = !decideBtcBinancePublicBinding({ route: trading, vercelEnv: "preview" }).eligible;
  checks.sell_ineligible = !decideBtcBinancePublicBinding({ route: sellDecision, vercelEnv: "preview" }).eligible;
  checks.entry_ineligible = !decideBtcBinancePublicBinding({ route: entryDecision, vercelEnv: "preview" }).eligible;
  checks.exit_ineligible = !decideBtcBinancePublicBinding({ route: exitDecision, vercelEnv: "preview" }).eligible;
  checks.position_ineligible = !decideBtcBinancePublicBinding({ route: positionDecision, vercelEnv: "preview" }).eligible;
  checks.leverage_ineligible = !decideBtcBinancePublicBinding({ route: leverageDecision, vercelEnv: "preview" }).eligible;
  checks.stop_ineligible = !decideBtcBinancePublicBinding({ route: stopDecision, vercelEnv: "preview" }).eligible;
  checks.ru_buy_ineligible = !decideBtcBinancePublicBinding({ route: ruBuyDecision, vercelEnv: "preview" }).eligible;
  checks.ru_sell_ineligible = !decideBtcBinancePublicBinding({ route: ruSellDecision, vercelEnv: "preview" }).eligible;
  checks.ru_entry_ineligible = !decideBtcBinancePublicBinding({ route: ruEntryDecision, vercelEnv: "preview" }).eligible;
  checks.ru_position_ineligible = !decideBtcBinancePublicBinding({ route: ruPositionDecision, vercelEnv: "preview" }).eligible;
  checks.ru_stop_ineligible = !decideBtcBinancePublicBinding({ route: ruStopDecision, vercelEnv: "preview" }).eligible;
  checks.historical_buy_informational = decideBtcBinancePublicBinding({ route: historicalBuy, vercelEnv: "preview" }).gate_state === "INELIGIBLE_INFORMATIONAL_PROOF";
  checks.historical_sell_informational = decideBtcBinancePublicBinding({ route: historicalSell, vercelEnv: "preview" }).gate_state === "INELIGIBLE_INFORMATIONAL_PROOF";
  checks.explanatory_entry_informational = decideBtcBinancePublicBinding({ route: explanatoryEntry, vercelEnv: "preview" }).gate_state === "INELIGIBLE_INFORMATIONAL_PROOF";
  checks.explanatory_position_informational = decideBtcBinancePublicBinding({ route: explanatoryPosition, vercelEnv: "preview" }).gate_state === "INELIGIBLE_INFORMATIONAL_PROOF";
  checks.ru_historical_buy_informational = decideBtcBinancePublicBinding({ route: ruHistoricalBuy, vercelEnv: "preview" }).gate_state === "INELIGIBLE_INFORMATIONAL_PROOF";

  const preview = decideBtcBinancePublicBinding({ route: enNow, vercelEnv: "preview" });
  checks.preview_enabled = preview.fetch && preview.preview_only && preview.gate_state === "ENABLED_PREVIEW";
  const productionDefault = decideBtcBinancePublicBinding({ route: enNow, vercelEnv: "production" });
  checks.production_default_off = productionDefault.eligible && !productionDefault.fetch && productionDefault.gate_state === "DISABLED_PRODUCTION";
  const productionEnabled = decideBtcBinancePublicBinding({ route: enNow, vercelEnv: "production", productionEnabled: true });
  checks.production_explicit_on = productionEnabled.fetch && !productionEnabled.preview_only && productionEnabled.gate_state === "ENABLED_PRODUCTION";
  const killed = decideBtcBinancePublicBinding({ route: enNow, vercelEnv: "preview", disabled: true });
  checks.kill_switch = !killed.fetch && killed.gate_state === "DISABLED_KILL_SWITCH";

  const decision = decideBtcBinancePublicBinding({ route: enNow, vercelEnv: "preview" });
  const snapshot = makeBtcBinancePublicMarketSnapshot();
  const packet = buildBtcBinancePublicBinding({
    decision,
    result: { ok: true, snapshot },
    staticPeer: { price_usd: 59000, observed_at: "2026-08-16T10:00:00.000Z", freshness: "FRESH" },
  });
  assert.ok(packet);
  checks.packet_schema = packet.schema_version === BTC_BINANCE_PUBLIC_BINDING_SCHEMA;
  checks.packet_ready = packet.status === "READY" && packet.mode === "BTC_FIELD_NOW";
  checks.public_whitelist_has_values = packet.facts.some((item) => item.id === "last_price") && packet.facts.some((item) => item.id === "top5_book_imbalance");
  const spreadFact = packet.facts.find((item) => item.id === "spread");
  const spreadBpsFact = packet.facts.find((item) => item.id === "spread_bps");
  const imbalanceFact = packet.facts.find((item) => item.id === "top5_book_imbalance");
  const rawPriceFact = packet.facts.find((item) => item.id === "last_price");
  checks.derived_evidence_precision_preserved = spreadFact?.value === "0.010000000002037268" && spreadBpsFact?.value === "0.0015856179382284902" && imbalanceFact?.value === "0.44645775973333757";
  checks.derived_display_precision_bounded = Boolean(spreadFact && spreadBpsFact && imbalanceFact && formatBtcBinancePublicFactDisplayValue(spreadFact) === "0.01" && formatBtcBinancePublicFactDisplayValue(spreadBpsFact) === "0.0016" && formatBtcBinancePublicFactDisplayValue(imbalanceFact) === "0.446");
  checks.raw_display_precision_unchanged = Boolean(rawPriceFact && formatBtcBinancePublicFactDisplayValue(rawPriceFact) === "60200.12000000");
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
  const corridorAdapter = await readFile("lib/btc-binance-public-corridor-live.ts", "utf8");
  const dialogue = await readFile("components/btc/BtcCosmographerDialogue.tsx", "utf8");
  const cosmographerAnswer = await readFile("lib/btc-cosmographer-answer.ts", "utf8");
  const session = await readFile("lib/btc-live-dialogue-session.ts", "utf8");
  const makeTurn = dialogue.slice(dialogue.indexOf("function makeTurn"), dialogue.indexOf("function AstroWindowSection"));
  checks.live_dialogue_direct_binding_preserved = livePage.includes("btc-binance-public-binding");
  checks.public_corridor_uses_bounded_adapter = staticPage.includes("btc-binance-public-corridor-live") && corridorAdapter.includes("btc-binance-public-binding") && corridorAdapter.includes("loadBtcBinanceProductionGuarded");
  checks.preview_gate_server_side = livePage.includes('process.env.VERCEL_ENV') && livePage.includes('BHRIGU_BINANCE_PUBLIC_BINDING_DISABLE') && livePage.includes('BHRIGU_BINANCE_PUBLIC_PRODUCTION_ENABLE') && !livePage.includes("query.binance");
  checks.live_values_not_in_make_turn = !makeTurn.includes("binanceLiveBinding");
  checks.session_schema_untouched_by_binding = !session.includes("btc_binance_public_binding_v0_1") && !session.includes("binanceLiveBinding");
  const answerBuilder = livePage.slice(livePage.indexOf("const answer ="), livePage.indexOf("const evidenceNavigation"));
  checks.base_answer_not_bound_to_binance = !answerBuilder.toLowerCase().includes("binance");
  checks.primary_hero_explicit_why_it_matters_projection = cosmographerAnswer.includes('id: "market_why_it_matters"') && cosmographerAnswer.includes("formatBtcTransitionLead");
  checks.no_private_or_trade_authority = ![livePage, staticPage, corridorAdapter, dialogue, await readFile("lib/btc-binance-public-binding.ts", "utf8")].join("\n").match(/\/sapi\/|X-MBX-APIKEY|apiSecret|placeOrder|cancelOrder|withdrawApply|withdrawRequest|universalTransfer|internalTransfer/i);

  for (const [name, passed] of Object.entries(checks)) assert.equal(passed, true, name);
  console.log(JSON.stringify({ schema_version: "btc_binance_public_binding_acceptance_v0_1", status: "PASS", checks, decision: { preview_only: false, production_capable_default_off: true, production_activation: false, account_access: false, trading: false, withdrawal: false, transfer: false } }, null, 2));
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
