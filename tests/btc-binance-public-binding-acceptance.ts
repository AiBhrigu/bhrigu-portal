import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { routeBtcCosmographerQuestion, type BtcCosmographerRoute } from "../lib/btc-cosmographer-route-graph";
import { buildBinanceEvidence, type BtcBinanceShadowSnapshot } from "../lib/btc-binance-public-market-evidence";
import {
  buildBtcBinancePublicBinding,
  decideBtcBinancePublicBinding,
  formatBtcBinancePublicFactDisplayValue,
  hasDirectBtcFinancialActionIntent,
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
const derived = evidence("derived", { spread_usdt: 0.010000000002037268, spread_bps: 0.0015856179382284902, top_book_imbalance: 0.44645775973333757 }, [book.evidence_id]);
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
  derived: { mid_price_usdt: 60200, spread_usdt: 0.010000000002037268, spread_bps: 0.0015856179382284902, top_book_imbalance: 0.44645775973333757 },
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

  const directFinancialQuestions = [
    ["en", "Should I buy BTC now based on the market?"],
    ["en", "Should I sell BTC now?"],
    ["en", "Should I go long BTC now?"],
    ["en", "Should I go short BTC now?"],
    ["en", "Should I use leverage on BTC now?"],
    ["en", "What entry point should I use for BTC?"],
    ["en", "What exit price should I use for BTC?"],
    ["en", "What position size should I use for BTC?"],
    ["en", "Give me a BTC price target for tomorrow."],
    ["en", "Give me a BTC trading signal now."],
    ["ru", "Стоит ли сейчас покупать BTC?"],
    ["ru", "Стоит ли сейчас продавать BTC?"],
    ["ru", "Стоит ли входить в лонг BTC?"],
    ["ru", "Стоит ли входить в шорт BTC?"],
    ["ru", "Стоит ли использовать плечо для BTC?"],
    ["ru", "Какая точка входа по BTC сейчас?"],
    ["ru", "Какая точка выхода по BTC сейчас?"],
    ["ru", "Какой размер позиции выбрать по BTC?"],
    ["ru", "Дай ценовую цель BTC на завтра."],
    ["ru", "Дай торговый сигнал по BTC сейчас."],
  ] as const;
  const naturalLanguageFinancialQuestions = [
    ["en", "Is BTC a buy right now?"],
    ["en", "Is BTC a sell right now?"],
    ["en", "What price should I buy BTC at?"],
    ["en", "How much BTC should I buy?"],
    ["en", "Should I increase my BTC position now?"],
    ["en", "Should I reduce my BTC position now?"],
    ["en", "Should I open a leveraged BTC position?"],
    ["en", "Where should I set my stop loss on BTC?"],
    ["en", "Where should I take profit on BTC?"],
    ["en", "Should I DCA into BTC now?"],
    ["ru", "BTC сейчас покупать?"],
    ["ru", "Биткоин сейчас продавать?"],
    ["ru", "По какой цене покупать BTC?"],
    ["ru", "Сколько BTC мне купить?"],
    ["ru", "Увеличить позицию по BTC сейчас?"],
    ["ru", "Сократить позицию по BTC сейчас?"],
    ["ru", "Где поставить стоп по BTC?"],
    ["ru", "Где фиксировать прибыль по BTC?"],
    ["ru", "Стоит ли усредняться в BTC сейчас?"],
    ["ru", "Покупать BTC сейчас или подождать?"],
  ] as const;
  const systemicCoverageFinancialQuestions = [
    ["en", "Would you buy BTC here?"],
    ["en", "Would you sell BTC here?"],
    ["en", "Buy BTC now or wait?"],
    ["en", "Should I hold or sell BTC?"],
    ["en", "Can I enter BTC now?"],
    ["en", "Is this a good entry for BTC?"],
    ["en", "Should I take a BTC position now?"],
    ["en", "Should I add to my BTC position?"],
    ["en", "Should I close my BTC position?"],
    ["en", "What stop should I use on BTC?"],
    ["en", "Should I take some profit on BTC?"],
    ["en", "Should I hedge my BTC position?"],
    ["ru", "Брать BTC сейчас?"],
    ["ru", "Продавать BTC или держать?"],
    ["ru", "Входить в BTC сейчас?"],
    ["ru", "Можно сейчас покупать BTC?"],
    ["ru", "Закрыть позицию по BTC сейчас?"],
    ["ru", "Добавить к позиции BTC сейчас?"],
    ["ru", "Какой стоп поставить по BTC?"],
    ["ru", "Фиксировать прибыль по BTC сейчас?"],
    ["ru", "Стоит ли держать или продавать BTC?"],
    ["ru", "Стоит ли хеджировать позицию BTC?"],
  ] as const;
  const paraphraseMutationFinancialQuestions = [
    ["en", "Is now a good time to buy Bitcoin?"],
    ["en", "Should we sell Bitcoin here?"],
    ["en", "Could I enter a BTC position today?"],
    ["en", "Do I close my Bitcoin position now?"],
    ["en", "Should I keep holding BTC or exit?"],
    ["en", "When should I enter Bitcoin?"],
    ["en", "Where should I exit BTC?"],
    ["en", "What level should I sell Bitcoin at?"],
    ["en", "How much Bitcoin should I sell?"],
    ["en", "Should I move my stop loss on BTC?"],
    ["en", "What take-profit level should I use for BTC?"],
    ["en", "Should I scale into Bitcoin here?"],
    ["en", "Should I scale out of Bitcoin now?"],
    ["en", "Should I average down on BTC?"],
    ["en", "Should I use margin on Bitcoin?"],
    ["en", "Would you hedge Bitcoin here?"],
    ["en", "Recommend me a BTC entry."],
    ["en", "Give me an exit level for Bitcoin."],
    ["en", "Should I trim my BTC position?"],
    ["en", "Can I increase my Bitcoin position now?"],
    ["ru", "Сейчас хорошее время покупать биткоин?"],
    ["ru", "Можно сегодня продавать биткоин?"],
    ["ru", "Стоит сейчас входить в BTC?"],
    ["ru", "Когда входить в биткоин?"],
    ["ru", "Где выходить из BTC?"],
    ["ru", "По какой цене продавать биткоин?"],
    ["ru", "Сколько биткоина мне продать?"],
    ["ru", "Стоит ли перенести стоп по BTC?"],
    ["ru", "Какой тейк-профит поставить по BTC?"],
    ["ru", "Стоит ли добавляться в BTC сейчас?"],
    ["ru", "Стоит ли частично фиксировать прибыль по BTC?"],
    ["ru", "Стоит ли использовать маржу по BTC?"],
    ["ru", "Посоветуй вход по BTC."],
    ["ru", "Дай уровень выхода по BTC."],
    ["ru", "Стоит ли уменьшить позицию по биткоину?"],
    ["ru", "Можно нарастить позицию по BTC сейчас?"],
    ["ru", "Хеджировать BTC сейчас?"],
    ["ru", "Держать BTC или выйти сейчас?"],
  ] as const;
  const paraphraseInformationalControls = [
    ["en", "Why are traders selling BTC today?"],
    ["en", "How does position sizing work?"],
    ["en", "What is a good entry signal?"],
    ["en", "What is a stop loss?"],
    ["en", "How does take profit work?"],
    ["en", "What does hedging mean?"],
    ["en", "How does margin trading work?"],
    ["en", "Why did BTC holders sell?"],
    ["en", "What is DCA?"],
    ["en", "How much Bitcoin exists?"],
    ["en", "When did traders exit BTC yesterday?"],
    ["en", "Where did traders enter BTC yesterday?"],
    ["ru", "Почему трейдеры продавали BTC сегодня?"],
    ["ru", "Как работает размер позиции?"],
    ["ru", "Что такое точка входа?"],
    ["ru", "Как работает стоп-лосс?"],
    ["ru", "Что такое тейк-профит?"],
    ["ru", "Что значит хеджирование?"],
    ["ru", "Как работает маржинальная торговля?"],
    ["ru", "Почему держатели продавали BTC?"],
    ["ru", "Что такое DCA?"],
    ["ru", "Сколько биткоинов существует?"],
    ["ru", "Когда трейдеры вышли из BTC?"],
    ["ru", "Где трейдеры входили в BTC вчера?"],
  ] as const;
  const blindHoldoutDirectActionQuestions = [
    ["en", "Should I cash out of BTC now?"],
    ["en", "Would it make sense to add more Bitcoin here?"],
    ["en", "Do I keep my BTC or get out now?"],
    ["en", "Should I cut my Bitcoin exposure today?"],
    ["en", "Would you rotate out of BTC here?"],
    ["en", "Should I put more money into Bitcoin now?"],
    ["en", "Do you think I should dump BTC?"],
    ["en", "Should I lighten my BTC position?"],
    ["en", "Would you take risk off BTC now?"],
    ["en", "Should I rebalance away from Bitcoin today?"],
    ["en", "Is now the moment to accumulate more BTC?"],
    ["en", "Would you initiate a Bitcoin position here?"],
    ["ru", "Скинуть биткоин сейчас?"],
    ["ru", "Мне уменьшить экспозицию к BTC?"],
    ["ru", "Добавить ещё биткоина сейчас?"],
    ["ru", "Нужно ли закрывать BTC позицию?"],
    ["ru", "Стоит ли переложиться из BTC сейчас?"],
    ["ru", "Зафиксировать часть позиции по биткоину?"],
    ["ru", "Мне нарастить долю BTC сегодня?"],
    ["ru", "Есть смысл докупать биткоин здесь?"],
    ["ru", "Стоит ли снять риск по BTC сейчас?"],
    ["ru", "Открывать позицию по биткоину сейчас?"],
  ] as const;
  const positiveInformationalMarketQuestions = [
    ["en", "What is BTC buy volume today?"],
    ["en", "What is BTC sell pressure today?"],
    ["en", "How much buy-side volume is visible in BTC today?"],
    ["en", "What is the current BTC price?"],
    ["en", "What is happening with BTC now?"],
    ["en", "What is the current BTC market structure?"],
    ["en", "What is the current BTC spread?"],
    ["en", "What is the BTC order-book depth?"],
    ["en", "Why did BTC sell off today?"],
    ["en", "How has BTC price changed today?"],
    ["ru", "Какая сейчас цена BTC?"],
    ["ru", "Какой сейчас объём BTC?"],
    ["ru", "Какая сейчас структура рынка BTC?"],
    ["ru", "Какой сейчас спред BTC?"],
    ["ru", "Что происходит с BTC сейчас?"],
    ["ru", "Почему биткоин падает сегодня?"],
    ["ru", "Как изменилась цена BTC сегодня?"],
    ["ru", "Покажи текущие данные рынка BTC."],
  ] as const;
  const safeMethodInformationalQuestions = [
    ["en", "Which live Binance source is used?"],
    ["en", "Which Binance endpoints are used?"],
    ["en", "What is the provenance of Binance live data?"],
    ["en", "How fresh is the Binance live data?"],
    ["en", "How is Binance live evidence verified?"],
    ["en", "What method is used for Binance live evidence?"],
    ["en", "How is Binance live data retrieved?"],
    ["ru", "Какой живой источник Binance используется?"],
    ["ru", "Какие эндпоинты Binance используются?"],
    ["ru", "Какова свежесть живых данных Binance?"],
    ["ru", "Как проверяются живые данные Binance?"],
    ["ru", "Откуда берутся живые данные Binance?"],
    ["ru", "Какой метод используется для живых данных Binance?"],
  ] as const;
  const methodWordOrderFalseNegatives = [
    ["en", "Which Binance live source is used?"],
    ["en", "What is the live Binance source?"],
    ["ru", "Какой источник Binance live используется?"],
    ["ru", "Какой Binance источник используется?"],
    ["ru", "Откуда берутся Binance live данные?"],
  ] as const;
  const generatedSafeMethodWordOrderQuestions = [
    ["en", "Which live Binance source is used?"],
    ["en", "Which Binance live source is used?"],
    ["en", "Which Binance endpoint is used?"],
    ["en", "Which Binance source is used for live data?"],
    ["en", "Which source is used for Binance live data?"],
    ["en", "What is the live Binance source?"],
    ["en", "What is the Binance live source?"],
    ["en", "What is the Binance endpoint?"],
    ["en", "What is Binance live provenance?"],
    ["en", "What is the freshness of Binance live data?"],
    ["en", "How are live Binance data verified?"],
    ["en", "How is Binance live evidence validated?"],
    ["en", "How fresh is Binance live data?"],
    ["ru", "Какой живой источник Binance используется?"],
    ["ru", "Какой источник Binance live используется?"],
    ["ru", "Какой Binance источник используется?"],
    ["ru", "Какой Binance эндпоинт используется?"],
    ["ru", "Какова свежесть Binance live данных?"],
    ["ru", "Какая свежесть Binance live данных?"],
    ["ru", "Как проверяются Binance live данные?"],
    ["ru", "Как валидируются Binance live данные?"],
    ["ru", "Откуда берутся Binance live данные?"],
  ] as const;
  const methodRelationFalseNegatives = [
    ["en", "Where does Binance live data come from?"],
    ["en", "Which source provides Binance live data?"],
    ["en", "What source provides the live Binance observation?"],
    ["en", "Where is Binance live data sourced from?"],
    ["ru", "Из какого источника приходят live данные Binance?"],
    ["ru", "Какой источник даёт live данные Binance?"],
    ["ru", "Откуда BHRIGU получает live данные Binance?"],
  ] as const;
  const generatedSafeMethodRelationQuestions = [
    ["en", "Where does Binance live evidence come from?"],
    ["en", "Where are Binance live observations sourced from?"],
    ["en", "Which source provides Binance live evidence?"],
    ["en", "What source supplies Binance live data?"],
    ["en", "Which source is used for Binance live observations?"],
    ["en", "How is Binance live data retrieved?"],
    ["ru", "Из какого источника поступают live данные Binance?"],
    ["ru", "Какой источник предоставляет live данные Binance?"],
    ["ru", "Какой источник даёт live наблюдения Binance?"],
    ["ru", "Откуда BHRIGU получает live наблюдения Binance?"],
    ["ru", "Какой источник используется для live наблюдений Binance?"],
    ["ru", "Как получаются live данные Binance?"],
  ] as const;
  const methodRelationUnsafePurposeQuestions = [
    ["en", "Which source provides Binance live data for scalping BTC?"],
    ["en", "Where does Binance live data come from for arbitrage?"],
    ["en", "What source provides live Binance observation for investment decisions?"],
    ["en", "Which source is used for Binance live data to trade BTC?"],
    ["ru", "Какой источник даёт live данные Binance для скальпинга BTC?"],
    ["ru", "Из какого источника приходят live данные Binance для арбитража?"],
    ["ru", "Откуда BHRIGU получает live данные Binance для инвестиционного решения?"],
    ["ru", "Какой источник используется для live данных Binance для торговли BTC?"],
  ] as const;
  const methodTradingPurposeQuestions = [
    ["en", "How do I trade BTC using the Binance live source?"],
    ["en", "Which Binance live source should I use to trade Bitcoin?"],
    ["en", "How can I trade BTC with Binance live data?"],
    ["en", "How should I speculate on BTC using Binance live data?"],
    ["en", "What Binance live data should I use for trading BTC?"],
    ["en", "Which Binance endpoint should I use for a BTC trading signal?"],
    ["ru", "Как мне торговать BTC используя живые данные Binance?"],
    ["ru", "Как торговать биткоином по данным Binance?"],
    ["ru", "Какие данные Binance использовать для торговли BTC?"],
    ["ru", "Как спекулировать BTC используя живые данные Binance?"],
    ["ru", "Какой источник Binance использовать для торгового сигнала BTC?"],
  ] as const;
  const freshMethodHoldoutQuestions = [
    ["en", "How is the Binance live observation validated?"],
    ["en", "What is the evidence boundary for Binance live data?"],
    ["en", "What is the Binance live data source?"],
    ["ru", "Как валидируются живые данные Binance?"],
    ["ru", "Каково происхождение живых данных Binance?"],
  ] as const;
  const freshMethodTradingHoldout = [
    ["en", "How do I speculate with the Binance live source?"],
    ["en", "What Binance endpoint should I use to buy BTC?"],
    ["en", "Which live Binance data should guide my BTC position?"],
    ["ru", "Как использовать живые данные Binance для покупки BTC?"],
    ["ru", "Какой эндпоинт Binance использовать для позиции BTC?"],
  ] as const;
  const generatedPositiveFetchQuestions: Array<["en" | "ru", string]> = [];
  for (const metric of ["price", "volume", "buy volume", "sell pressure", "spread", "order-book depth", "market structure"]) {
    generatedPositiveFetchQuestions.push(["en", `What is the current BTC ${metric}?`]);
  }
  generatedPositiveFetchQuestions.push(
    ["ru", "Какая сейчас цена BTC?"],
    ["ru", "Какой сейчас объём BTC?"],
    ["ru", "Какой сейчас спред BTC?"],
    ["ru", "Какая сейчас структура рынка BTC?"],
    ["ru", "Что происходит с биткоином сейчас?"],
  );
  const generatedDefaultDenyQuestions: Array<["en" | "ru", string]> = [
    ["en", "Should I cash out of BTC now?"],
    ["en", "Should I dump BTC now?"],
    ["en", "Would you rotate out of BTC here?"],
    ["en", "Should I add more Bitcoin here?"],
    ["en", "Should I reduce my Bitcoin exposure today?"],
    ["en", "Would you take risk off BTC now?"],
    ["en", "Should I rebalance away from Bitcoin today?"],
    ["en", "Is now the moment to accumulate more BTC?"],
    ["en", "Would you initiate a Bitcoin position here?"],
    ["ru", "Скинуть биткоин сейчас?"],
    ["ru", "Мне уменьшить экспозицию к BTC?"],
    ["ru", "Добавить ещё биткоина сейчас?"],
    ["ru", "Стоит ли переложиться из BTC сейчас?"],
    ["ru", "Стоит ли снять риск по BTC сейчас?"],
    ["ru", "Мне нарастить долю BTC сегодня?"],
    ["ru", "Есть смысл докупать биткоин здесь?"],
    ["ru", "Открывать позицию по биткоину сейчас?"],
  ];
  const generatedDirectActionQuestions: Array<["en" | "ru", string]> = [];
  for (const action of ["buy", "sell", "hold", "enter", "exit", "hedge"]) {
    generatedDirectActionQuestions.push(["en", `Should I ${action} BTC now?`], ["en", `Can I ${action} Bitcoin here?`], ["en", `Would you ${action} BTC here?`], ["en", `Should we ${action} Bitcoin today?`]);
  }
  for (const action of ["open", "close", "increase", "reduce", "decrease", "trim"]) generatedDirectActionQuestions.push(["en", `Should I ${action} my BTC position now?`]);
  generatedDirectActionQuestions.push(["en", "What stop should I use on Bitcoin?"], ["en", "Should I take profit on Bitcoin?"], ["en", "What price should I buy Bitcoin at?"], ["en", "Should I sell now?"]);
  for (const action of ["покупать", "продавать", "держать", "входить", "выходить", "хеджировать", "усредняться"]) generatedDirectActionQuestions.push(["ru", `Стоит ли ${action} BTC сейчас?`], ["ru", `Можно сейчас ${action} биткоин?`]);
  for (const action of ["Открыть", "Закрыть", "Увеличить", "Сократить", "Уменьшить", "Добавить"]) generatedDirectActionQuestions.push(["ru", `${action} позицию по BTC сейчас?`]);
  generatedDirectActionQuestions.push(["ru", "Какой стоп поставить по биткоину?"], ["ru", "По какой цене покупать биткоин?"], ["ru", "Стоит ли продавать сейчас?"], ["ru", "Закрыть позицию сейчас?"]);

  const generatedInformationalControls: Array<["en" | "ru", string]> = [];
  for (const action of ["sell", "enter", "exit"]) generatedInformationalControls.push(["en", `Why did traders ${action} BTC yesterday?`], ["en", `When did traders ${action} BTC yesterday?`], ["en", `Where did traders ${action} BTC yesterday?`]);
  for (const concept of ["position sizing", "stop loss", "take profit", "DCA", "margin trading", "hedging"]) generatedInformationalControls.push(["en", `How does ${concept} work?`], ["en", `What is ${concept}?`]);
  for (const action of ["продавали", "входили", "выходили"]) generatedInformationalControls.push(["ru", `Почему трейдеры ${action} BTC вчера?`], ["ru", `Когда трейдеры ${action} в BTC вчера?`], ["ru", `Где трейдеры ${action} в BTC вчера?`]);
  for (const concept of ["размер позиции", "стоп-лосс", "тейк-профит", "DCA", "маржинальная торговля", "хеджирование"]) generatedInformationalControls.push(["ru", `Как работает ${concept}?`], ["ru", `Что такое ${concept}?`]);
  const realFinancialRoutes = directFinancialQuestions.map(([locale, question]) => ({
    question,
    route: routeBtcCosmographerQuestion(locale, question, null),
  }));
  const naturalFinancialRoutes = naturalLanguageFinancialQuestions.map(([locale, question]) => ({
    question,
    route: routeBtcCosmographerQuestion(locale, question, null),
  }));
  const systemicFinancialRoutes = systemicCoverageFinancialQuestions.map(([locale, question]) => ({
    question,
    route: routeBtcCosmographerQuestion(locale, question, null),
  }));
  const paraphraseFinancialRoutes = paraphraseMutationFinancialQuestions.map(([locale, question]) => ({
    question,
    route: routeBtcCosmographerQuestion(locale, question, null),
  }));
  const generatedDirectActionRoutes = generatedDirectActionQuestions.map(([locale, question]) => ({
    question,
    route: routeBtcCosmographerQuestion(locale, question, null),
  }));
  const blindHoldoutDirectActionRoutes = blindHoldoutDirectActionQuestions.map(([locale, question]) => ({
    question,
    route: routeBtcCosmographerQuestion(locale, question, null),
  }));
  const positiveInformationalMarketRoutes = positiveInformationalMarketQuestions.map(([locale, question]) => ({
    question,
    route: routeBtcCosmographerQuestion(locale, question, null),
  }));
  const safeMethodSyntheticRoutes = safeMethodInformationalQuestions.map(([, question]) => route("methodology", null, question));
  const safeMethodRealRoutes = safeMethodInformationalQuestions.map(([locale, question]) => routeBtcCosmographerQuestion(locale, question, null));
  const methodWordOrderFalseNegativeSyntheticRoutes = methodWordOrderFalseNegatives.map(([, question]) => route("methodology", null, question));
  const methodWordOrderFalseNegativeRealRoutes = methodWordOrderFalseNegatives.map(([locale, question]) => routeBtcCosmographerQuestion(locale, question, null));
  const generatedSafeMethodWordOrderSyntheticRoutes = generatedSafeMethodWordOrderQuestions.map(([, question]) => route("methodology", null, question));
  const methodRelationFalseNegativeSyntheticRoutes = methodRelationFalseNegatives.map(([, question]) => route("methodology", null, question));
  const methodRelationFalseNegativeRealRoutes = methodRelationFalseNegatives.map(([locale, question]) => routeBtcCosmographerQuestion(locale, question, null));
  const generatedSafeMethodRelationSyntheticRoutes = generatedSafeMethodRelationQuestions.map(([, question]) => route("methodology", null, question));
  const methodRelationUnsafeSyntheticRoutes = methodRelationUnsafePurposeQuestions.map(([, question]) => route("methodology", null, question));
  const methodRelationUnsafeRealRoutes = methodRelationUnsafePurposeQuestions.map(([locale, question]) => routeBtcCosmographerQuestion(locale, question, null));
  const methodTradingPurposeRealRoutes = methodTradingPurposeQuestions.map(([locale, question]) => routeBtcCosmographerQuestion(locale, question, null));
  const methodTradingPurposeSyntheticRoutes = methodTradingPurposeQuestions.map(([, question]) => route("methodology", null, question));
  const freshMethodSyntheticRoutes = freshMethodHoldoutQuestions.map(([, question]) => route("methodology", null, question));
  const freshMethodTradingSyntheticRoutes = freshMethodTradingHoldout.map(([, question]) => route("methodology", null, question));
  const generatedPositiveFetchRoutes = generatedPositiveFetchQuestions.map(([locale, question]) => routeBtcCosmographerQuestion(locale, question, null));
  const generatedDefaultDenyRoutes = generatedDefaultDenyQuestions.map(([locale, question]) => routeBtcCosmographerQuestion(locale, question, null));
  checks.direct_financial_intent_detected = realFinancialRoutes.every(({ question }) => hasDirectBtcFinancialActionIntent(question));
  checks.real_router_trading_intent_zero_fetch = realFinancialRoutes.every(({ route: item }) => {
    const binding = decideBtcBinancePublicBinding({ route: item, vercelEnv: "preview" });
    return !binding.fetch && binding.gate_state === "INELIGIBLE_FINANCIAL_INTENT";
  });
  checks.natural_language_financial_intent_detected = naturalFinancialRoutes.every(({ question }) => hasDirectBtcFinancialActionIntent(question));
  checks.natural_language_router_zero_fetch = naturalFinancialRoutes.every(({ route: item }) => {
    const binding = decideBtcBinancePublicBinding({ route: item, vercelEnv: "preview" });
    return !binding.fetch && binding.gate_state === "INELIGIBLE_FINANCIAL_INTENT";
  });
  checks.systemic_coverage_financial_intent_detected = systemicFinancialRoutes.every(({ question }) => hasDirectBtcFinancialActionIntent(question));
  checks.systemic_coverage_router_zero_fetch = systemicFinancialRoutes.every(({ route: item }) => {
    const binding = decideBtcBinancePublicBinding({ route: item, vercelEnv: "preview" });
    return !binding.fetch && binding.gate_state === "INELIGIBLE_FINANCIAL_INTENT";
  });
  checks.paraphrase_mutation_financial_intent_detected = paraphraseFinancialRoutes.every(({ question }) => hasDirectBtcFinancialActionIntent(question));
  checks.paraphrase_mutation_router_zero_fetch = paraphraseFinancialRoutes.every(({ route: item }) => {
    const binding = decideBtcBinancePublicBinding({ route: item, vercelEnv: "preview" });
    return !binding.fetch && binding.gate_state === "INELIGIBLE_FINANCIAL_INTENT";
  });
  checks.paraphrase_informational_controls_allowed = paraphraseInformationalControls.every(([, question]) => !hasDirectBtcFinancialActionIntent(question));
  checks.generated_action_semantics_detected = generatedDirectActionRoutes.every(({ question }) => hasDirectBtcFinancialActionIntent(question));
  checks.generated_action_semantics_zero_fetch = generatedDirectActionRoutes.every(({ route: item }) => {
    const binding = decideBtcBinancePublicBinding({ route: item, vercelEnv: "preview" });
    return !binding.fetch && binding.gate_state === "INELIGIBLE_FINANCIAL_INTENT";
  });
  checks.generated_informational_controls_allowed = generatedInformationalControls.every(([, question]) => !hasDirectBtcFinancialActionIntent(question));
  checks.blind_holdout_direct_action_zero_fetch = blindHoldoutDirectActionRoutes.every(({ route: item }) => !decideBtcBinancePublicBinding({ route: item, vercelEnv: "preview" }).fetch);
  checks.positive_informational_market_fetch = positiveInformationalMarketRoutes.every(({ route: item }) => decideBtcBinancePublicBinding({ route: item, vercelEnv: "preview" }).fetch);
  checks.buy_volume_sell_pressure_informational_allowed = positiveInformationalMarketRoutes.slice(0, 3).every(({ route: item }) => decideBtcBinancePublicBinding({ route: item, vercelEnv: "preview" }).fetch);
  checks.generated_positive_fetch_eligibility = generatedPositiveFetchRoutes.every((item) => decideBtcBinancePublicBinding({ route: item, vercelEnv: "preview" }).fetch);
  checks.generated_default_deny_zero_fetch = generatedDefaultDenyRoutes.every((item) => !decideBtcBinancePublicBinding({ route: item, vercelEnv: "preview" }).fetch);
  const unknownGeneralRoute = route("btc_market", "general_btc_field", "BTC vibes please");
  const unknownGeneralDecision = decideBtcBinancePublicBinding({ route: unknownGeneralRoute, vercelEnv: "preview" });
  checks.general_route_alone_not_sufficient = !unknownGeneralDecision.fetch && unknownGeneralDecision.gate_state === "INELIGIBLE_INFORMATIONAL_PROOF";

  checks.safe_method_descriptive_synthetic_fetch = safeMethodSyntheticRoutes.every((item) => decideBtcBinancePublicBinding({ route: item, vercelEnv: "preview" }).fetch);
  const realMethodSafeRoutes = safeMethodRealRoutes.filter((item) => item.domain === "methodology");
  checks.safe_method_real_router_fetch = realMethodSafeRoutes.length >= 1 && realMethodSafeRoutes.every((item) => decideBtcBinancePublicBinding({ route: item, vercelEnv: "preview" }).fetch);
  checks.method_word_order_false_negatives_recovered = methodWordOrderFalseNegativeSyntheticRoutes.every((item) => decideBtcBinancePublicBinding({ route: item, vercelEnv: "preview" }).fetch);
  const realMethodWordOrderRoutes = methodWordOrderFalseNegativeRealRoutes.filter((item) => item.domain === "methodology");
  checks.method_word_order_real_router_recovered = realMethodWordOrderRoutes.length === methodWordOrderFalseNegatives.length && realMethodWordOrderRoutes.every((item) => decideBtcBinancePublicBinding({ route: item, vercelEnv: "preview" }).fetch);
  checks.generated_safe_method_word_order_fetch = generatedSafeMethodWordOrderSyntheticRoutes.every((item) => decideBtcBinancePublicBinding({ route: item, vercelEnv: "preview" }).fetch);
  checks.method_relation_false_negatives_recovered = methodRelationFalseNegativeSyntheticRoutes.every((item) => decideBtcBinancePublicBinding({ route: item, vercelEnv: "preview" }).fetch);
  const realMethodRelationRoutes = methodRelationFalseNegativeRealRoutes.filter((item) => item.domain === "methodology");
  checks.method_relation_real_router_recovered = realMethodRelationRoutes.length === methodRelationFalseNegatives.length && realMethodRelationRoutes.every((item) => decideBtcBinancePublicBinding({ route: item, vercelEnv: "preview" }).fetch);
  checks.generated_safe_method_relation_fetch = generatedSafeMethodRelationSyntheticRoutes.every((item) => decideBtcBinancePublicBinding({ route: item, vercelEnv: "preview" }).fetch);
  checks.method_relation_unsafe_purpose_synthetic_zero_fetch = methodRelationUnsafeSyntheticRoutes.every((item) => !decideBtcBinancePublicBinding({ route: item, vercelEnv: "preview" }).fetch);
  checks.method_relation_unsafe_purpose_real_router_zero_fetch = methodRelationUnsafeRealRoutes.every((item) => !decideBtcBinancePublicBinding({ route: item, vercelEnv: "preview" }).fetch);
  checks.method_trading_purpose_real_router_zero_fetch = methodTradingPurposeRealRoutes.every((item) => !decideBtcBinancePublicBinding({ route: item, vercelEnv: "preview" }).fetch);
  const realMethodTradingRoutes = methodTradingPurposeRealRoutes.filter((item) => item.domain === "methodology");
  checks.method_trading_purpose_real_methodology_zero_fetch = realMethodTradingRoutes.length >= 2 && realMethodTradingRoutes.every((item) => !decideBtcBinancePublicBinding({ route: item, vercelEnv: "preview" }).fetch);
  checks.method_trading_purpose_synthetic_zero_fetch = methodTradingPurposeSyntheticRoutes.every((item) => !decideBtcBinancePublicBinding({ route: item, vercelEnv: "preview" }).fetch);
  checks.fresh_method_descriptive_holdout_fetch = freshMethodSyntheticRoutes.every((item) => decideBtcBinancePublicBinding({ route: item, vercelEnv: "preview" }).fetch);
  checks.fresh_method_trading_holdout_zero_fetch = freshMethodTradingSyntheticRoutes.every((item) => !decideBtcBinancePublicBinding({ route: item, vercelEnv: "preview" }).fetch);
  const unknownMethodDecision = decideBtcBinancePublicBinding({ route: route("methodology", null, "Tell me about Binance live source usage."), vercelEnv: "preview" });
  checks.unknown_method_request_zero_fetch = !unknownMethodDecision.fetch && unknownMethodDecision.gate_state === "INELIGIBLE_INFORMATIONAL_PROOF";

  const realAllowedRoutes = [
    routeBtcCosmographerQuestion("en", "What is happening with BTC now?", null),
    routeBtcCosmographerQuestion("en", "What is the current BTC market structure?", null),
    routeBtcCosmographerQuestion("en", "What changed since the previous Snapshot?", null),
    routeBtcCosmographerQuestion("en", "Which live Binance source is used?", null),
  ];
  checks.real_router_allowed_routes_still_fetch = realAllowedRoutes.every((item) => decideBtcBinancePublicBinding({ route: item, vercelEnv: "preview" }).fetch);
  checks.informational_selloff_not_financial_intent = !hasDirectBtcFinancialActionIntent("Why did BTC sell off today?");
  const informationalNonActionQuestions = [
    "What is the current BTC price?",
    "How much BTC exists?",
    "What is a stop loss?",
    "How does DCA work in general?",
    "What is BTC's current market position?",
    "Что такое стоп-лосс?",
    "Как работает усреднение в целом?",
  ];
  checks.informational_market_language_not_financial_intent = informationalNonActionQuestions.every((question) => !hasDirectBtcFinancialActionIntent(question));

  const decision = decideBtcBinancePublicBinding({ route: general, vercelEnv: "preview" });
  const packet = buildBtcBinancePublicBinding({
    decision,
    result: { ok: true, snapshot },
    staticPeer: { price_usd: 60300, observed_at: new Date(NOW - 86_400_000).toISOString(), freshness: "FRESH" },
  });
  assert(packet && packet.status === "READY");
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
