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

function pp(value: number, digits = 1): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${(value * 100).toFixed(digits)} pp`;
}

function shorten(value: string, max = 210): string {
  const clean = compact(value);
  return clean.length <= max ? clean : `${clean.slice(0, max - 1).trim()}…`;
}

function arrayLine(values: string[], fallback: string, max = 2): string {
  return values.length ? values.slice(0, max).map((value) => shorten(value, 180)).join("; ") : fallback;
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

function relevantMemory(envelope: BtcMarketEnvelope, ids: string[]): string[] {
  return envelope.memory.metrics
    .filter((metric) => ids.includes(metric.metric_id))
    .map((metric) => {
      const delta = metric.display_delta ? ` (${metric.display_delta})` : "";
      const transition = metric.transition ? ` — ${metric.transition}` : "";
      return `${metric.metric_id.replaceAll("_", " ")}: ${metric.previous_value} → ${metric.current_value}${delta}${transition}`;
    });
}

function expectationMarkets(field: BtcPolymarketExpectationResult | null): BtcPolymarketExpectationMarket[] {
  if (!field || field.ok === false) return [];
  return field.markets.filter((market) => market.quality !== "Q1_WEAK").slice(0, 4);
}

function semanticLabel(locale: BtcCleanLocale, semantic: BtcPolymarketExpectationMarket["semantic"]): string {
  const ru: Record<string, string> = {
    TERMINAL_BIN: "диапазон к моменту экспирации",
    TERMINAL_THRESHOLD: "порог к моменту экспирации",
    PATH_THRESHOLD: "касание порога до экспирации",
    MILESTONE: "событие/рубеж до экспирации",
  };
  const en: Record<string, string> = {
    TERMINAL_BIN: "terminal range",
    TERMINAL_THRESHOLD: "terminal threshold",
    PATH_THRESHOLD: "path/touch threshold",
    MILESTONE: "milestone before expiry",
  };
  return (locale === "ru" ? ru : en)[semantic] ?? semantic.toLowerCase();
}

function expectationNow(locale: BtcCleanLocale, field: BtcPolymarketExpectationResult | null, binance: ReturnType<typeof binanceObservation>): string {
  const markets = expectationMarkets(field);
  if (!markets.length) {
    return locale === "ru"
      ? "Polymarket сейчас не дал достаточно качественного, event-complete набора будущих BTC-контрактов с пригодной двусторонней книгой. Я не заменяю это выборочным рынком и не строю из неполного набора общую вероятность BTC. Binance остаётся только текущим полем, а не заменой ожиданий."
      : "Polymarket did not return a sufficiently strong, event-complete set of future BTC contracts with usable two-sided books right now. I will not replace that with a cherry-picked market or turn an incomplete set into a global BTC probability. Binance remains the current field, not a substitute for expectations.";
  }
  const lines = markets.slice(0, 3).map((market) => {
    const expiry = market.expiry.slice(0, 10);
    return locale === "ru"
      ? `«${shorten(market.question, 120)}» — ${(market.probability * 100).toFixed(1)}%, ${semanticLabel(locale, market.semantic)}, экспирация ${expiry}, ${market.quality.replace("Q3_STRONG", "сильная книга").replace("Q2_USABLE", "пригодная книга")}.`
      : `“${shorten(market.question, 120)}” — ${(market.probability * 100).toFixed(1)}%, ${semanticLabel(locale, market.semantic)}, expiry ${expiry}, ${market.quality === "Q3_STRONG" ? "strong book" : "usable book"}.`;
  });
  const current = binance.price !== null
    ? (locale === "ru" ? `Для сравнения, Binance Spot показывает текущий BTCUSDT около $${money(binance.price, 0)}.` : `For contrast, Binance Spot has current BTCUSDT around $${money(binance.price, 0)}.`)
    : (locale === "ru" ? "Текущая Binance-цена в этом запросе недоступна." : "The current Binance price is unavailable in this request.");
  return locale === "ru"
    ? `Рынок не выражает одно общее «ожидание по BTC» — он оценивает отдельные будущие условия. Сейчас наиболее пригодные контракты в выборке: ${lines.join(" ")} ${current} Binance описывает реализованное состояние сейчас; Polymarket — цены конкретных будущих утверждений. Я не складываю разные экспирации и path/terminal-контракты в одну «вероятность BTC».`
    : `The market is not expressing one global “BTC expectation”; it is pricing separate future conditions. The strongest usable contracts in the current set are: ${lines.join(" ")} ${current} Binance describes the realized state now; Polymarket prices specific future propositions. I do not combine different expiries or path/terminal contracts into one “BTC probability.”`;
}

function expectationDelta(locale: BtcCleanLocale, field: BtcPolymarketExpectationResult | null): string {
  const markets = expectationMarkets(field)
    .filter((market) => market.delta_1d !== null)
    .sort((a, b) => Math.abs(b.delta_1d ?? 0) - Math.abs(a.delta_1d ?? 0));
  if (!markets.length) {
    return locale === "ru"
      ? "Для сопоставимых текущих BTC-контрактов Polymarket сейчас недостаточно однодневной истории, чтобы честно сказать, какие ожидания усилились или ослабли. Я не подменяю delta сравнением разных рынков или разных экспираций."
      : "The current comparable BTC contracts do not have enough usable one-day Polymarket history for a defensible strengthened/weakened read. I will not manufacture a delta by comparing different markets or expiries.";
  }
  const strengthened = markets.filter((market) => (market.delta_1d ?? 0) > 0).slice(0, 2);
  const weakened = markets.filter((market) => (market.delta_1d ?? 0) < 0).slice(0, 2);
  const format = (market: BtcPolymarketExpectationMarket) => `“${shorten(market.question, 105)}” ${pp(market.delta_1d ?? 0)}`;
  const up = strengthened.length ? strengthened.map(format).join("; ") : (locale === "ru" ? "явного усиления среди пригодных контрактов нет" : "no clear strengthening among usable contracts");
  const down = weakened.length ? weakened.map(format).join("; ") : (locale === "ru" ? "явного ослабления среди пригодных контрактов нет" : "no clear weakening among usable contracts");
  return locale === "ru"
    ? `За последние ~24 часа я сравниваю только тот же самый контракт с самим собой. Усилились: ${up}. Ослабли: ${down}. Это изменение рыночной цены конкретных утверждений, а не доказанная причина движения BTC и не прогноз BHRIGU. Неопределённость выше там, где книга шире или история тоньше — её нельзя путать с неопределённостью самого будущего.`
    : `Over roughly 24 hours I compare each contract only with itself. Strengthened: ${up}. Weakened: ${down}. These are changes in market prices for specific propositions, not a proven cause of BTC movement and not a BHRIGU forecast. Measurement uncertainty is higher where books are wider or history is thinner; that is separate from uncertainty about the future itself.`;
}

function fieldChange(locale: BtcCleanLocale, envelope: BtcMarketEnvelope | null, binance: ReturnType<typeof binanceObservation>): string {
  if (!envelope) return locale === "ru"
    ? "Принятый Snapshot/Memory сейчас недоступен, поэтому я не буду изображать полное чтение поля. Текущая venue-цена сама по себе не заменяет структуру и память изменений."
    : "The accepted Snapshot/Memory is unavailable right now, so I will not pretend to have a complete field read. A live venue price alone does not replace structure and change memory.";
  const live = binance.price !== null
    ? (locale === "ru" ? `На Binance Spot BTCUSDT сейчас около $${money(binance.price, 0)}, изменение за 24 часа ${binance.change24h === null ? "не подтверждено" : pct(binance.change24h)}.` : `On Binance Spot, BTCUSDT is around $${money(binance.price, 0)} now, with a 24h change of ${binance.change24h === null ? "unconfirmed" : pct(binance.change24h)}.`)
    : (locale === "ru" ? "Живой Binance-слой сейчас не прошёл получение, поэтому текущую venue-цену я не добавляю." : "The live Binance layer did not resolve, so I am not adding a current venue price.");
  const changed = arrayLine(envelope.synthesis.what_changed, locale === "ru" ? "между принятыми Snapshot нет подтверждённого существенного изменения" : "no material change is confirmed between accepted Snapshots");
  const strengthened = arrayLine(envelope.synthesis.confirming_modules, locale === "ru" ? "отдельного усиления подтверждающих слоёв нет" : "no separate confirming layer strengthened");
  const weakened = arrayLine(envelope.synthesis.contradicting_or_weakening_modules, locale === "ru" ? "явного ослабления нет" : "no clear weakening is identified");
  const unexplained = arrayLine(envelope.synthesis.uncertainty, locale === "ru" ? "причина движения не установлена этими данными" : "the cause of the move is not established by these data", 1);
  const watch = arrayLine(envelope.synthesis.watch_next, locale === "ru" ? "следующее принятое обновление структуры и ликвидности" : "the next accepted structure and liquidity update", 2);
  const liquidity = locale === "ru"
    ? `Ликвидностный контекст: stablecoin share ${envelope.current.stablecoin_share_pct.toFixed(2)}%, DeFi TVL $${money(envelope.current.defi_tvl_usd / 1e9, 1)}B, DEX volume 24h $${money(envelope.current.dex_volume_24h_usd / 1e9, 1)}B.`
    : `Liquidity context: stablecoin share ${envelope.current.stablecoin_share_pct.toFixed(2)}%, DeFi TVL $${money(envelope.current.defi_tvl_usd / 1e9, 1)}B, 24h DEX volume $${money(envelope.current.dex_volume_24h_usd / 1e9, 1)}B.`;
  return locale === "ru"
    ? `${live} По памяти принятых Snapshot изменилось: ${changed}. Сильнее выглядит: ${strengthened}. Слабее или противоречивее: ${weakened}. ${liquidity} Пока не объяснено: ${unexplained}. Дальше я смотрю на ${watch}. Это описание текущего поля, не торговый сигнал и не утверждение о будущем.`
    : `${live} Across accepted Snapshot Memory, what changed is: ${changed}. What looks stronger: ${strengthened}. What weakened or conflicts: ${weakened}. ${liquidity} Still unexplained: ${unexplained}. Next I am watching ${watch}. This is a read of the current field, not a trading signal or an established future outcome.`;
}

function whyItMatters(locale: BtcCleanLocale, envelope: BtcMarketEnvelope | null, binance: ReturnType<typeof binanceObservation>): string {
  if (!envelope) return locale === "ru" ? "Без принятого Snapshot/Memory я не могу честно усилить предыдущее чтение." : "Without the accepted Snapshot/Memory I cannot honestly strengthen the previous read.";
  const current = binance.price !== null ? (locale === "ru" ? `Живой Binance остаётся около $${money(binance.price, 0)}` : `Live Binance remains around $${money(binance.price, 0)}`) : "";
  const uncertainty = arrayLine(envelope.synthesis.uncertainty, locale === "ru" ? "причинность не установлена" : "causality is not established", 1);
  return locale === "ru"
    ? `Это важно потому, что изменение цены само по себе ещё не говорит, изменилось ли устройство поля. Принятая память показывает, какие структурные и ликвидностные слои подтвердили движение, а какие ему не соответствуют. ${envelope.synthesis.why_this_matters} ${current ? `${current}, но это только текущая venue-наблюдаемость.` : ""} Граница остаётся жёсткой: ${uncertainty}. Поэтому меняется уверенность в текущем чтении, а не возникает «доказанное будущее».`
    : `It matters because a price move alone does not tell us whether the field's structure changed. Accepted memory shows which structural and liquidity layers confirmed the move and which did not. ${envelope.synthesis.why_this_matters} ${current ? `${current}, but that is only a current venue observation.` : ""} The boundary stays strict: ${uncertainty}. So this changes confidence in the current read; it does not create an “established future.”`;
}

function watchNext(locale: BtcCleanLocale, envelope: BtcMarketEnvelope | null, binance: ReturnType<typeof binanceObservation>): string {
  if (!envelope) return locale === "ru" ? "Сначала нужен новый принятый Snapshot; без него watch-list был бы декоративным." : "A new accepted Snapshot is needed first; without it, a watch list would be decorative.";
  const watch = envelope.synthesis.watch_next.slice(0, 3);
  const live = binance.price !== null && binance.bid !== null && binance.ask !== null
    ? (locale === "ru" ? `На Binance дополнительно слежу, сохраняется ли текущая книга около $${money(binance.price, 0)} (bid $${money(binance.bid, 0)} / ask $${money(binance.ask, 0)}).` : `On Binance I also watch whether the current book around $${money(binance.price, 0)} holds (bid $${money(binance.bid, 0)} / ask $${money(binance.ask, 0)}).`)
    : "";
  return locale === "ru"
    ? `Следующий фокус — не угадать цену, а увидеть, подтверждается ли изменение несколькими независимыми слоями. Я смотрю на ${watch.length ? watch.map((item) => shorten(item, 150)).join("; ") : "структуру, ликвидность и следующую точку памяти"}. ${live} Если эти слои расходятся, неопределённость чтения растёт; если сходятся, текущая структура становится убедительнее. Ни один из этих условий сам по себе не является торговым сигналом.`
    : `The next focus is not guessing price; it is seeing whether the change is confirmed by independent layers. I am watching ${watch.length ? watch.map((item) => shorten(item, 150)).join("; ") : "structure, liquidity, and the next memory checkpoint"}. ${live} If those layers diverge, read uncertainty rises; if they converge, the current structure becomes more convincing. None of these conditions is a trading signal by itself.`;
}

function liquidity(locale: BtcCleanLocale, envelope: BtcMarketEnvelope | null, returning: boolean): string {
  if (!envelope) return locale === "ru" ? "Ликвидностный слой принятого Snapshot сейчас недоступен." : "The accepted Snapshot liquidity layer is unavailable right now.";
  const deltas = relevantMemory(envelope, ["stablecoin_share_pct", "defi_tvl_usd", "liquidity_context_state"]);
  const prefix = returning ? (locale === "ru" ? "Возвращаюсь к точке ликвидности." : "Back to the liquidity point.") : (locale === "ru" ? "По ликвидности сейчас:" : "On liquidity now:");
  return locale === "ru"
    ? `${prefix} Stablecoin share ${envelope.current.stablecoin_share_pct.toFixed(2)}%, DeFi TVL $${money(envelope.current.defi_tvl_usd / 1e9, 1)}B, DEX volume 24h $${money(envelope.current.dex_volume_24h_usd / 1e9, 1)}B; состояние — ${envelope.current.liquidity_context_state}. В памяти Snapshot: ${deltas.length ? deltas.map((item) => shorten(item, 170)).join("; ") : "сопоставимого отдельного сдвига нет"}. Это говорит о доступности и распределении ликвидности в принятом поле; оно не доказывает направление следующего движения BTC.`
    : `${prefix} Stablecoin share is ${envelope.current.stablecoin_share_pct.toFixed(2)}%, DeFi TVL $${money(envelope.current.defi_tvl_usd / 1e9, 1)}B, 24h DEX volume $${money(envelope.current.dex_volume_24h_usd / 1e9, 1)}B; state: ${envelope.current.liquidity_context_state}. In Snapshot Memory: ${deltas.length ? deltas.map((item) => shorten(item, 170)).join("; ") : "no separate comparable shift is available"}. This describes the availability and distribution of liquidity in the accepted field; it does not establish the direction of BTC's next move.`;
}

function generalField(locale: BtcCleanLocale, envelope: BtcMarketEnvelope | null, binance: ReturnType<typeof binanceObservation>): string {
  if (!envelope) return locale === "ru" ? "Принятый BTC Snapshot сейчас недоступен. Сформулируйте вопрос уже, и я отвечу только в пределах доступного evidence." : "The accepted BTC Snapshot is unavailable right now. Narrow the question and I will answer only within available evidence.";
  const live = binance.price !== null ? (locale === "ru" ? `Живой Binance Spot: ~$${money(binance.price, 0)}.` : `Live Binance Spot: ~$${money(binance.price, 0)}.`) : "";
  return locale === "ru"
    ? `${live} Принятое поле: regime ${envelope.current.regime}, Market Field Score ${envelope.current.market_field_score.toFixed(2)}, BTC dominance ${envelope.current.btc_dominance_pct.toFixed(2)}%. ${envelope.synthesis.why_this_matters} Если вы спросите про изменение, ликвидность или ожидания, я подключу соответствующую память или future-expectation evidence вместо повторения общего обзора.`
    : `${live} Accepted field: regime ${envelope.current.regime}, Market Field Score ${envelope.current.market_field_score.toFixed(2)}, BTC dominance ${envelope.current.btc_dominance_pct.toFixed(2)}%. ${envelope.synthesis.why_this_matters} Ask about change, liquidity, or expectations and I will bind the relevant memory or future-expectation evidence instead of repeating this overview.`;
}

function cleanSources(envelope: BtcMarketEnvelope | null, binance: BinancePublicMarketResult | null, polymarket: BtcPolymarketExpectationResult | null): BtcCleanSource[] {
  const sources: BtcCleanSource[] = [];
  if (envelope) {
    sources.push({ id: "accepted-snapshot", label: "Accepted Market Snapshot", href: BTC_MARKET_ENVELOPE_URLS.snapshot, as_of: envelope.current.source_generated_at_utc });
    sources.push({ id: "snapshot-memory", label: "Snapshot-to-Snapshot Delta", href: BTC_MARKET_ENVELOPE_URLS.delta, as_of: envelope.generated_at_utc });
  }
  if (binance && binance.ok) {
    sources.push({ id: "binance-current", label: "Binance Spot BTCUSDT public market data", href: "https://data-api.binance.vision/api/v3/ticker/24hr?symbol=BTCUSDT", as_of: binance.snapshot.retrieved_at });
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
      ? "Я могу разобрать текущее поле, ликвидность, изменения памяти и рыночные ожидания, но не выбираю вход, выход, позицию или торговое действие. Переформулируйте вопрос как «что сейчас меняется в BTC?» или «что рынок ожидает?» — и я отвечу по read-only evidence."
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
