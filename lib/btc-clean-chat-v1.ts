import {
  BTC_MARKET_ENVELOPE_URLS,
  loadBtcMarketEnvelope,
  type BtcMarketEnvelope,
} from "./btc-market-envelope";
import {
  loadBtcBinancePublicMarketShadow,
  type BinancePublicMarketResult,
} from "./btc-binance-public-market-source";
import { loadBtcBinanceProductionGuarded } from "./btc-binance-production-guard";
import {
  loadBtcPolymarketExpectationField,
  type BtcPolymarketExpectationMarket,
  type BtcPolymarketExpectationResult,
} from "./btc-polymarket-expectation";

export const BTC_CLEAN_CHAT_SCHEMA = "bhrigu_btc_clean_chat_v1" as const;

export type BtcCleanLocale = "ru" | "en";
export type BtcCleanIntent =
  | "FIELD_CHANGE"
  | "WHY_IT_MATTERS"
  | "WATCH_NEXT"
  | "EXPECTATION_NOW"
  | "EXPECTATION_DELTA"
  | "LIQUIDITY"
  | "RETURN_LIQUIDITY"
  | "GENERAL_FIELD"
  | "TRADING_BOUNDARY";

export type BtcCleanPriorTurn = {
  user: string;
  assistant?: string;
  topic?: string;
};

export type BtcCleanSource = {
  id: string;
  label: string;
  href: string;
  as_of: string | null;
};

export type BtcCleanChatResponse = {
  schema_version: typeof BTC_CLEAN_CHAT_SCHEMA;
  ok: true;
  intent: BtcCleanIntent;
  topic: string;
  answer: string;
  as_of: string;
  sources: BtcCleanSource[];
  evidence: {
    accepted_snapshot: "USED" | "UNAVAILABLE";
    snapshot_memory: "USED" | "UNAVAILABLE";
    binance_current_field: "USED" | "UNAVAILABLE" | "NOT_REQUIRED";
    polymarket_expectation_field: "USED" | "UNAVAILABLE" | "NOT_REQUIRED";
  };
  boundary: {
    no_fake_causality: true;
    no_trading_signal: true;
    future_not_established_fact: true;
    polymarket_not_bhrigu_prediction: true;
  };
};

function compact(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function lower(value: string): string {
  return compact(value).toLowerCase();
}

function hasTradingIntent(question: string): boolean {
  const q = lower(question);
  return /\b(?:should i|should we|buy|sell|entry|exit|long|short|leverage|stop loss|take profit|position size|trade signal)\b/.test(q)
    || /(?:стоит ли|купить|продать|войти|выйти|лонг|шорт|плечо|стоп[- ]?лосс|тейк[- ]?профит|торговый сигнал|размер позиции)/.test(q);
}

export function classifyBtcCleanIntent(question: string, priorTurns: BtcCleanPriorTurn[] = []): BtcCleanIntent {
  if (hasTradingIntent(question)) return "TRADING_BOUNDARY";
  const q = lower(question);
  if (/what changed in (?:those|these) expectations|what changed.*expectation|как изменил(?:ись|ась).*ожидан|что изменил(?:ось|ись).*ожидан/.test(q)) return "EXPECTATION_DELTA";
  if (/what (?:is|are) the market expecting|market expectation|what does the market expect|что (?:сейчас )?ожидает рынок|ожидани[яе] рынка/.test(q)) return "EXPECTATION_NOW";
  if (/go back to the liquidity|back to (?:that|the) liquidity|return to.*liquidity|вернись.*ликвид|верн[её]мся.*ликвид|назад.*ликвид/.test(q)) return "RETURN_LIQUIDITY";
  if (/\bliquidity\b|stablecoin|defi|dex|ликвид|стейблкоин|tvl/.test(q)) return "LIQUIDITY";
  if (/what are you watching next|what (?:do|should) we watch next|what to watch next|за чем.*наблюдать|что.*смотреть дальше|что отслеживаешь дальше/.test(q)) return "WATCH_NEXT";
  if (/why does that matter|why is that important|why does it matter|почему это важно|что это значит и почему/.test(q)) return "WHY_IT_MATTERS";
  if (/what is changing in (?:btc|bitcoin) right now|what(?:'s| is) changing.*(?:btc|bitcoin)|what changed.*(?:btc|bitcoin).*now|что (?:сейчас )?меняется.*(?:btc|bitcoin|биткоин)|что изменилось.*(?:btc|bitcoin|биткоин).*сейчас/.test(q)) return "FIELD_CHANGE";
  const recent = priorTurns.slice(-4).map((turn) => lower(`${turn.user} ${turn.topic ?? ""}`)).join(" ");
  if (/expect/.test(q) && /expectation|ожидан/.test(recent)) return "EXPECTATION_DELTA";
  return "GENERAL_FIELD";
}

function canonicalQuestion(intent: BtcCleanIntent): string {
  if (intent === "LIQUIDITY" || intent === "RETURN_LIQUIDITY") {
    return "What do stablecoin share, DeFi TVL and DEX volume show about current BTC liquidity?";
  }
  if (intent === "FIELD_CHANGE" || intent === "WHY_IT_MATTERS" || intent === "WATCH_NEXT") {
    return "What changed in accepted Snapshot Memory since the previous verified snapshot?";
  }
  return "What is the current BTC field overview and why does it matter?";
}

function money(value: number, digits = 0): string {
  if (!Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: digits, minimumFractionDigits: digits }).format(value);
}

function pct(value: number, digits = 2): string {
  if (!Number.isFinite(value)) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(digits)}%`;
}

function probabilityDelta(locale: BtcCleanLocale, value: number, digits = 1): string {
  const sign = value > 0 ? "+" : "";
  return locale === "ru" ? `${sign}${(value * 100).toFixed(digits)} п.п.` : `${sign}${(value * 100).toFixed(digits)} pp`;
}

function shorten(value: string, max = 210): string {
  const clean = compact(value);
  return clean.length <= max ? clean : `${clean.slice(0, max - 1).trim()}…`;
}

function humanToken(value: string): string {
  return compact(value.replace(/[_-]+/g, " ").toLowerCase());
}

function readNormalized(result: BinancePublicMarketResult | null, endpoint: string): Record<string, unknown> | null {
  if (!result || result.ok === false) return null;
  const row = result.snapshot.evidence.find((item) => item.endpoint_or_stream === endpoint);
  const value = row?.normalized_value;
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function numberField(record: Record<string, unknown> | null, key: string): number | null {
  if (!record) return null;
  const value = Number(record[key]);
  return Number.isFinite(value) ? value : null;
}

function binanceObservation(result: BinancePublicMarketResult | null): {
  price: number | null;
  change24h: number | null;
  bid: number | null;
  ask: number | null;
  asOf: string | null;
} {
  if (!result || result.ok === false) return { price: null, change24h: null, bid: null, ask: null, asOf: null };
  const ticker = readNormalized(result, "/api/v3/ticker/24hr");
  const book = readNormalized(result, "/api/v3/ticker/bookTicker");
  return {
    price: result.snapshot.derived.mid_price_usdt,
    change24h: numberField(ticker, "price_change_percent"),
    bid: numberField(book, "bid_price_usdt"),
    ask: numberField(book, "ask_price_usdt"),
    asOf: result.snapshot.retrieved_at,
  };
}

function metricLabel(locale: BtcCleanLocale, id: string): string {
  const en: Record<string, string> = {
    btc_gravity_pct: "BTC gravity",
    btc_dominance_pct: "BTC dominance",
    alt_breadth_24h_pct: "24h altcoin breadth",
    alt_breadth_7d_pct: "7d altcoin breadth",
    market_field_score: "market field score",
    stablecoin_share_pct: "stablecoin share",
    defi_tvl_usd: "DeFi TVL",
    liquidity_context_state: "liquidity context",
  };
  const ru: Record<string, string> = {
    btc_gravity_pct: "гравитация BTC",
    btc_dominance_pct: "доминация BTC",
    alt_breadth_24h_pct: "ширина альткоинов за 24ч",
    alt_breadth_7d_pct: "ширина альткоинов за 7д",
    market_field_score: "оценка рыночного поля",
    stablecoin_share_pct: "доля стейблкоинов",
    defi_tvl_usd: "DeFi TVL",
    liquidity_context_state: "ликвидностный контекст",
  };
  return (locale === "ru" ? ru : en)[id] ?? humanToken(id);
}

function metricValue(locale: BtcCleanLocale, id: string, value: string): string {
  const number = Number(value);
  if (id === "defi_tvl_usd" && Number.isFinite(number)) return `$${money(number / 1e9, 1)}B`;
  if (id.endsWith("_pct") && Number.isFinite(number)) return `${number.toFixed(2)}%`;
  if (id === "market_field_score" && Number.isFinite(number)) return number.toFixed(2);
  if (id === "liquidity_context_state") {
    const state = humanToken(value);
    if (locale === "ru") {
      if (state.includes("fresh")) return "свежий и согласованный";
      if (state.includes("stale")) return "устаревающий";
      if (state.includes("mixed")) return "смешанный";
    } else {
      if (state.includes("fresh")) return "fresh and aligned";
      if (state.includes("stale")) return "aging";
      if (state.includes("mixed")) return "mixed";
    }
    return state;
  }
  return value;
}

function metricDeltaText(locale: BtcCleanLocale, metric: BtcMarketEnvelope["memory"]["metrics"][number]): string {
  const label = metricLabel(locale, metric.metric_id);
  const before = metricValue(locale, metric.metric_id, metric.previous_value);
  const after = metricValue(locale, metric.metric_id, metric.current_value);
  if (metric.direction === "UNCHANGED") return locale === "ru" ? `${label} без изменения: ${after}` : `${label} held at ${after}`;
  return `${label}: ${before} → ${after}`;
}

function directionalMemory(locale: BtcCleanLocale, envelope: BtcMarketEnvelope, direction: "UP" | "DOWN", max = 2): string[] {
  return envelope.memory.metrics.filter((metric) => metric.direction === direction).slice(0, max).map((metric) => metricDeltaText(locale, metric));
}

function currentLiquidityState(locale: BtcCleanLocale, envelope: BtcMarketEnvelope): string {
  return metricValue(locale, "liquidity_context_state", envelope.current.liquidity_context_state);
}

function expectationMarkets(field: BtcPolymarketExpectationResult | null): BtcPolymarketExpectationMarket[] {
  if (!field || field.ok === false) return [];
  return field.markets.filter((market) => market.quality !== "Q1_WEAK").slice(0, 4);
}

function semanticLabel(locale: BtcCleanLocale, semantic: BtcPolymarketExpectationMarket["semantic"]): string {
  const ru: Record<string, string> = {
    TERMINAL_BIN: "диапазон на дату расчёта",
    TERMINAL_THRESHOLD: "порог на дату расчёта",
    PATH_THRESHOLD: "касание порога до даты расчёта",
    MILESTONE: "достижение рубежа до даты расчёта",
  };
  const en: Record<string, string> = {
    TERMINAL_BIN: "range at settlement",
    TERMINAL_THRESHOLD: "threshold at settlement",
    PATH_THRESHOLD: "touch threshold before settlement",
    MILESTONE: "milestone before settlement",
  };
  return (locale === "ru" ? ru : en)[semantic] ?? humanToken(semantic);
}

function qualityLabel(locale: BtcCleanLocale, quality: BtcPolymarketExpectationMarket["quality"]): string {
  if (quality === "Q3_STRONG") return locale === "ru" ? "книга сильная" : "strong book";
  return locale === "ru" ? "книга пригодная" : "usable book";
}

function expectationNow(locale: BtcCleanLocale, field: BtcPolymarketExpectationResult | null, binance: ReturnType<typeof binanceObservation>): string {
  const markets = expectationMarkets(field);
  if (!markets.length) {
    return locale === "ru"
      ? "Polymarket сейчас не дал достаточно качественного полного набора будущих BTC-контрактов с пригодной двусторонней книгой. Я не заменяю это одним удобным рынком и не превращаю неполный набор в общую вероятность по BTC. Binance остаётся текущим полем, а не заменой ожиданий."
      : "Polymarket did not return a sufficiently strong complete set of future BTC contracts with usable two-sided books right now. I will not replace that with one convenient market or turn an incomplete set into a global BTC probability. Binance remains the current field, not a substitute for expectations.";
  }
  const lines = markets.slice(0, 3).map((market) => {
    const expiry = market.expiry.slice(0, 10);
    return locale === "ru"
      ? `«${shorten(market.question, 118)}» — ${(market.probability * 100).toFixed(1)}%; ${semanticLabel(locale, market.semantic)}, расчёт ${expiry}, ${qualityLabel(locale, market.quality)}`
      : `“${shorten(market.question, 118)}” — ${(market.probability * 100).toFixed(1)}%; ${semanticLabel(locale, market.semantic)}, settlement ${expiry}, ${qualityLabel(locale, market.quality)}`;
  });
  const current = binance.price !== null
    ? (locale === "ru" ? `Для сравнения, Binance Spot показывает BTCUSDT около $${money(binance.price, 0)} сейчас.` : `For contrast, Binance Spot has BTCUSDT around $${money(binance.price, 0)} now.`)
    : (locale === "ru" ? "Текущая Binance-цена в этом запросе недоступна." : "The current Binance price is unavailable in this request.");
  return locale === "ru"
    ? `Polymarket не выражает одно общее «ожидание по BTC» — он оценивает отдельные будущие условия. Сейчас сильнее всего читаются: ${lines.join("; ")}. ${current} Binance описывает реализованное состояние сейчас; Polymarket — цену конкретных будущих утверждений. Разные даты и разные типы условий я в одну вероятность не складываю.`
    : `Polymarket is not expressing one global “BTC expectation”; it is pricing separate future conditions. The strongest readable contracts now are: ${lines.join("; ")}. ${current} Binance describes the realized state now; Polymarket prices specific future propositions. I do not combine different dates or different proposition types into one probability.`;
}

function expectationDelta(locale: BtcCleanLocale, field: BtcPolymarketExpectationResult | null): string {
  const markets = expectationMarkets(field)
    .filter((market) => market.delta_1d !== null)
    .sort((a, b) => Math.abs(b.delta_1d ?? 0) - Math.abs(a.delta_1d ?? 0));
  if (!markets.length) {
    return locale === "ru"
      ? "Для сопоставимых текущих BTC-контрактов Polymarket сейчас недостаточно однодневной истории, чтобы честно сказать, какие ожидания усилились или ослабли. Я не подменяю изменение сравнением разных рынков или разных дат."
      : "The current comparable BTC contracts do not have enough usable one-day Polymarket history for a defensible strengthened/weakened read. I will not manufacture a change by comparing different markets or dates.";
  }
  const strengthened = markets.filter((market) => (market.delta_1d ?? 0) > 0).slice(0, 2);
  const weakened = markets.filter((market) => (market.delta_1d ?? 0) < 0).slice(0, 2);
  const format = (market: BtcPolymarketExpectationMarket) => `“${shorten(market.question, 102)}” ${probabilityDelta(locale, market.delta_1d ?? 0)}`;
  const up = strengthened.length ? strengthened.map(format).join("; ") : (locale === "ru" ? "явного усиления нет" : "no clear strengthening");
  const down = weakened.length ? weakened.map(format).join("; ") : (locale === "ru" ? "явного ослабления нет" : "no clear weakening");
  return locale === "ru"
    ? `За последние примерно 24 часа я сравниваю каждый контракт только с ним самим. Усилились: ${up}. Ослабли: ${down}. Это изменение цены конкретных будущих утверждений, а не доказанная причина движения BTC и не прогноз BHRIGU. Отдельно учитываю качество измерения: широкая или тонкая книга делает само чтение менее надёжным.`
    : `Over roughly 24 hours I compare each contract only with itself. Strengthened: ${up}. Weakened: ${down}. These are changes in the prices of specific future propositions, not a proven cause of BTC movement and not a BHRIGU forecast. Measurement quality remains separate: a wide or thin book makes the read itself less reliable.`;
}

function fieldChange(locale: BtcCleanLocale, envelope: BtcMarketEnvelope | null, binance: ReturnType<typeof binanceObservation>): string {
  if (!envelope) return locale === "ru"
    ? "Принятый Snapshot и его память сейчас недоступны, поэтому я не буду изображать полное чтение поля. Живая цена одной площадки сама по себе не заменяет структуру и память изменений."
    : "The accepted Snapshot and its memory are unavailable right now, so I will not pretend to have a complete field read. A live venue price alone does not replace structure and change memory.";

  const live = binance.price !== null
    ? (locale === "ru" ? `На Binance Spot BTCUSDT сейчас около $${money(binance.price, 0)}; за 24 часа ${binance.change24h === null ? "изменение не подтверждено" : pct(binance.change24h)}.` : `On Binance Spot, BTCUSDT is around $${money(binance.price, 0)} now; the 24h change is ${binance.change24h === null ? "unconfirmed" : pct(binance.change24h)}.`)
    : (locale === "ru" ? "Живой Binance-слой сейчас не ответил, поэтому текущую цену площадки я не добавляю." : "The live Binance layer did not resolve, so I am not adding a current venue price.");

  const changed = envelope.memory.metrics.filter((metric) => metric.direction !== "UNCHANGED").slice(0, 3).map((metric) => metricDeltaText(locale, metric));
  const stronger = directionalMemory(locale, envelope, "UP");
  const weaker = directionalMemory(locale, envelope, "DOWN");
  const changeText = changed.length ? changed.join("; ") : (locale === "ru" ? "существенных сопоставимых сдвигов нет" : "no material comparable shifts");
  const strongerText = stronger.length ? stronger.join("; ") : (locale === "ru" ? "отдельного усиления не видно" : "no separate strengthening is visible");
  const weakerText = weaker.length ? weaker.join("; ") : (locale === "ru" ? "отдельного ослабления не видно" : "no separate weakening is visible");
  const liquidityText = locale === "ru"
    ? `Ликвидность: доля стейблкоинов ${envelope.current.stablecoin_share_pct.toFixed(2)}%, DeFi TVL $${money(envelope.current.defi_tvl_usd / 1e9, 1)}B, DEX-объём за 24ч $${money(envelope.current.dex_volume_24h_usd / 1e9, 1)}B.`
    : `Liquidity: stablecoin share ${envelope.current.stablecoin_share_pct.toFixed(2)}%, DeFi TVL $${money(envelope.current.defi_tvl_usd / 1e9, 1)}B, 24h DEX volume $${money(envelope.current.dex_volume_24h_usd / 1e9, 1)}B.`;

  return locale === "ru"
    ? `${live} Между двумя принятыми точками памяти изменилось: ${changeText}. Сильнее: ${strongerText}. Слабее: ${weakerText}. ${liquidityText} Не объяснено главное: эти данные не устанавливают причину движения цены. Дальше я смотрю, подтверждаются ли изменения доминации и ширины рынка ликвидностью в следующем принятом Snapshot. Это чтение текущего поля, не торговый сигнал и не установленный факт о будущем.`
    : `${live} Between the two accepted memory checkpoints, what changed is: ${changeText}. Stronger: ${strongerText}. Weaker: ${weakerText}. ${liquidityText} The main unresolved point is causality: these data do not establish why price moved. Next I am watching whether changes in dominance and market breadth are confirmed by liquidity in the next accepted Snapshot. This is a read of the current field, not a trading signal or an established fact about the future.`;
}

function whyItMatters(locale: BtcCleanLocale, envelope: BtcMarketEnvelope | null, binance: ReturnType<typeof binanceObservation>): string {
  if (!envelope) return locale === "ru" ? "Без принятого Snapshot и его памяти я не могу честно усилить предыдущее чтение." : "Without the accepted Snapshot and its memory I cannot honestly strengthen the previous read.";
  const live = binance.price !== null ? `$${money(binance.price, 0)}` : null;
  return locale === "ru"
    ? `Потому что цена и структура — не одно и то же. ${live ? `Binance показывает цену около ${live}, ` : ""}но память Snapshot показывает, меняются ли вместе доминация, ширина рынка и ликвидность. Когда эти слои расходятся, уверенность в простом объяснении падает; когда сходятся, текущее чтение становится устойчивее. Это меняет качество интерпретации настоящего, а не превращает будущее в известный факт.`
    : `Because price and structure are not the same thing. ${live ? `Binance shows price around ${live}, ` : ""}while Snapshot Memory shows whether dominance, market breadth, and liquidity are moving together. When those layers diverge, confidence in a simple explanation falls; when they converge, the current read becomes more robust. That changes the quality of the present interpretation, not the future into a known fact.`;
}

function watchNext(locale: BtcCleanLocale, envelope: BtcMarketEnvelope | null, binance: ReturnType<typeof binanceObservation>): string {
  if (!envelope) return locale === "ru" ? "Сначала нужен новый принятый Snapshot; без него список наблюдения был бы декоративным." : "A new accepted Snapshot is needed first; without it, a watch list would be decorative.";
  const live = binance.price !== null && binance.bid !== null && binance.ask !== null
    ? (locale === "ru" ? `На Binance текущая книга остаётся около $${money(binance.price, 0)} — bid $${money(binance.bid, 0)}, ask $${money(binance.ask, 0)}.` : `On Binance the current book remains around $${money(binance.price, 0)} — bid $${money(binance.bid, 0)}, ask $${money(binance.ask, 0)}.`)
    : "";
  return locale === "ru"
    ? `Дальше я смотрю на три вещи: сохраняется ли текущее движение цены; подтверждают ли его доминация BTC и ширина рынка; и поддерживает ли это ликвидность — доля стейблкоинов, DeFi TVL и DEX-объём. ${live} Если слои расходятся, неопределённость чтения растёт. Если сходятся, текущая структура становится убедительнее. Это условия наблюдения, не торговый сигнал.`
    : `Next I am watching three things: whether the current price move persists; whether BTC dominance and market breadth confirm it; and whether liquidity — stablecoin share, DeFi TVL, and DEX volume — supports the same read. ${live} If those layers diverge, read uncertainty rises. If they converge, the current structure becomes more convincing. These are observation conditions, not a trading signal.`;
}

function liquidity(locale: BtcCleanLocale, envelope: BtcMarketEnvelope | null, returning: boolean): string {
  if (!envelope) return locale === "ru" ? "Ликвидностный слой принятого Snapshot сейчас недоступен." : "The accepted Snapshot liquidity layer is unavailable right now.";
  const stable = envelope.memory.metrics.find((metric) => metric.metric_id === "stablecoin_share_pct");
  const tvl = envelope.memory.metrics.find((metric) => metric.metric_id === "defi_tvl_usd");
  const memory = [stable, tvl].filter((metric): metric is NonNullable<typeof metric> => Boolean(metric)).map((metric) => metricDeltaText(locale, metric));
  const prefix = returning ? (locale === "ru" ? "Возвращаюсь к ликвидности." : "Back to liquidity.") : (locale === "ru" ? "По ликвидности сейчас:" : "On liquidity now:");
  const state = currentLiquidityState(locale, envelope);
  return locale === "ru"
    ? `${prefix} Доля стейблкоинов ${envelope.current.stablecoin_share_pct.toFixed(2)}%, DeFi TVL $${money(envelope.current.defi_tvl_usd / 1e9, 1)}B, DEX-объём за 24ч $${money(envelope.current.dex_volume_24h_usd / 1e9, 1)}B; общий контекст ${state}. В памяти: ${memory.length ? memory.join("; ") : "отдельного сопоставимого сдвига нет"}. Это показывает доступность и распределение ликвидности в принятом поле; направление следующего движения BTC из этого не следует.`
    : `${prefix} Stablecoin share is ${envelope.current.stablecoin_share_pct.toFixed(2)}%, DeFi TVL $${money(envelope.current.defi_tvl_usd / 1e9, 1)}B, and 24h DEX volume $${money(envelope.current.dex_volume_24h_usd / 1e9, 1)}B; the overall context is ${state}. In memory: ${memory.length ? memory.join("; ") : "no separate comparable shift"}. This shows the availability and distribution of liquidity in the accepted field; it does not establish the direction of BTC's next move.`;
}

function generalField(locale: BtcCleanLocale, envelope: BtcMarketEnvelope | null, binance: ReturnType<typeof binanceObservation>): string {
  if (!envelope) return locale === "ru" ? "Принятый BTC Snapshot сейчас недоступен. Сформулируйте вопрос уже, и я отвечу только в пределах доступных данных." : "The accepted BTC Snapshot is unavailable right now. Narrow the question and I will answer only within available evidence.";
  const live = binance.price !== null ? (locale === "ru" ? `Binance Spot сейчас около $${money(binance.price, 0)}.` : `Binance Spot is around $${money(binance.price, 0)} now.`) : "";
  const regime = humanToken(envelope.current.regime);
  return locale === "ru"
    ? `${live} В принятом Snapshot текущее состояние поля — ${regime}; оценка поля ${envelope.current.market_field_score.toFixed(2)}, доминация BTC ${envelope.current.btc_dominance_pct.toFixed(2)}%. Спросите про изменение, ликвидность или ожидания — я подключу соответствующую память или живые будущие контракты вместо повторения общего обзора.`
    : `${live} In the accepted Snapshot, the current field is ${regime}; field score ${envelope.current.market_field_score.toFixed(2)}, BTC dominance ${envelope.current.btc_dominance_pct.toFixed(2)}%. Ask about change, liquidity, or expectations and I will bind the relevant memory or live future contracts instead of repeating a general overview.`;
}

function cleanSources(envelope: BtcMarketEnvelope | null, binance: BinancePublicMarketResult | null, polymarket: BtcPolymarketExpectationResult | null): BtcCleanSource[] {
  const sources: BtcCleanSource[] = [];
  if (envelope) {
    sources.push({ id: "accepted-snapshot", label: "Accepted Market Snapshot", href: BTC_MARKET_ENVELOPE_URLS.snapshot, as_of: envelope.current.source_generated_at_utc });
    sources.push({ id: "snapshot-memory", label: "Snapshot-to-Snapshot Delta", href: BTC_MARKET_ENVELOPE_URLS.delta, as_of: envelope.generated_at_utc });
  }
  if (binance && binance.ok) {
    sources.push({ id: "binance-current", label: "Binance Spot BTCUSDT", href: "https://data-api.binance.vision/api/v3/ticker/24hr?symbol=BTCUSDT", as_of: binance.snapshot.retrieved_at });
  }
  if (polymarket && polymarket.ok) {
    const seen = new Set<string>();
    for (const market of expectationMarkets(polymarket).slice(0, 4)) {
      if (seen.has(market.event_url)) continue;
      seen.add(market.event_url);
      sources.push({ id: `polymarket-${market.event_id}`, label: market.event_title, href: market.event_url, as_of: polymarket.as_of });
    }
  }
  return sources;
}

async function loadBinanceForCleanChat(): Promise<BinancePublicMarketResult | null> {
  if (process.env.VERCEL_ENV === "production") {
    if (process.env.BHRIGU_BINANCE_PUBLIC_PRODUCTION_ENABLE !== "1" || process.env.BHRIGU_BINANCE_PUBLIC_BINDING_DISABLE === "1") return null;
    return loadBtcBinanceProductionGuarded((signal) => loadBtcBinancePublicMarketShadow({ signal }));
  }
  return loadBtcBinancePublicMarketShadow();
}

export async function runBtcCleanChat(input: {
  locale: BtcCleanLocale;
  question: string;
  priorTurns?: BtcCleanPriorTurn[];
}): Promise<BtcCleanChatResponse> {
  const locale = input.locale;
  const question = compact(input.question).slice(0, 500);
  const priorTurns = (input.priorTurns ?? []).slice(-8);
  const intent = classifyBtcCleanIntent(question, priorTurns);
  const asOf = new Date().toISOString();

  if (intent === "TRADING_BOUNDARY") {
    const answer = locale === "ru"
      ? "Я могу разобрать текущее поле, ликвидность, изменения памяти и рыночные ожидания, но не выбираю вход, выход, позицию или торговое действие. Переформулируйте вопрос как «что сейчас меняется в BTC?» или «что рынок ожидает?» — и я отвечу по read-only данным."
      : "I can analyze the current field, liquidity, memory changes, and market expectations, but I do not choose entries, exits, positions, or trading actions. Reframe it as “what is changing in BTC now?” or “what is the market expecting?” and I will answer from read-only evidence.";
    return {
      schema_version: BTC_CLEAN_CHAT_SCHEMA, ok: true, intent, topic: "boundary", answer, as_of: asOf, sources: [],
      evidence: { accepted_snapshot: "UNAVAILABLE", snapshot_memory: "UNAVAILABLE", binance_current_field: "NOT_REQUIRED", polymarket_expectation_field: "NOT_REQUIRED" },
      boundary: { no_fake_causality: true, no_trading_signal: true, future_not_established_fact: true, polymarket_not_bhrigu_prediction: true },
    };
  }

  const needExpectation = intent === "EXPECTATION_NOW" || intent === "EXPECTATION_DELTA";
  const [envelopeResult, binance, polymarket] = await Promise.all([
    loadBtcMarketEnvelope(canonicalQuestion(intent)),
    loadBinanceForCleanChat(),
    needExpectation ? loadBtcPolymarketExpectationField({ includeHistory: intent === "EXPECTATION_DELTA" }) : Promise.resolve(null),
  ]);
  const envelope = envelopeResult.ok ? envelopeResult.value : null;
  const current = binanceObservation(binance);

  let answer: string;
  let topic: string;
  switch (intent) {
    case "FIELD_CHANGE": answer = fieldChange(locale, envelope, current); topic = "field-change"; break;
    case "WHY_IT_MATTERS": answer = whyItMatters(locale, envelope, current); topic = "field-change"; break;
    case "WATCH_NEXT": answer = watchNext(locale, envelope, current); topic = "field-change"; break;
    case "EXPECTATION_NOW": answer = expectationNow(locale, polymarket, current); topic = "expectations"; break;
    case "EXPECTATION_DELTA": answer = expectationDelta(locale, polymarket); topic = "expectations"; break;
    case "LIQUIDITY": answer = liquidity(locale, envelope, false); topic = "liquidity"; break;
    case "RETURN_LIQUIDITY": answer = liquidity(locale, envelope, true); topic = "liquidity"; break;
    default: answer = generalField(locale, envelope, current); topic = "field"; break;
  }

  return {
    schema_version: BTC_CLEAN_CHAT_SCHEMA,
    ok: true,
    intent,
    topic,
    answer,
    as_of: new Date().toISOString(),
    sources: cleanSources(envelope, binance, polymarket),
    evidence: {
      accepted_snapshot: envelope ? "USED" : "UNAVAILABLE",
      snapshot_memory: envelope ? "USED" : "UNAVAILABLE",
      binance_current_field: binance && binance.ok ? "USED" : "UNAVAILABLE",
      polymarket_expectation_field: needExpectation ? (polymarket && polymarket.ok ? "USED" : "UNAVAILABLE") : "NOT_REQUIRED",
    },
    boundary: {
      no_fake_causality: true,
      no_trading_signal: true,
      future_not_established_fact: true,
      polymarket_not_bhrigu_prediction: true,
    },
  };
}
