import type { BtcCosmographerRoute } from "./btc-cosmographer-route-graph";
import {
  compareCompatibleMarketObservations,
  consumeBtcMarketEvidence,
  type MarketEvidenceSummary,
} from "./btc-market-evidence-consumer";
import type { BinancePublicMarketResult } from "./btc-binance-public-market-source";

export const BTC_BINANCE_PUBLIC_BINDING_SCHEMA = "btc_binance_public_binding_v0_1" as const;
export type BtcBinancePublicBindingMode = "BTC_FIELD_NOW" | "BTC_CHANGE_MEMORY" | "METHOD_AND_PROOF";
export type BtcBinancePublicBindingGateState =
  | "ENABLED_PREVIEW"
  | "DISABLED_PRODUCTION"
  | "DISABLED_KILL_SWITCH"
  | "INELIGIBLE_FINANCIAL_INTENT"
  | "INELIGIBLE_INFORMATIONAL_PROOF"
  | "INELIGIBLE_ROUTE";

export type BtcBinancePublicBindingDecision = {
  eligible: boolean;
  fetch: boolean;
  mode: BtcBinancePublicBindingMode | null;
  gate_state: BtcBinancePublicBindingGateState;
  preview_only: true;
  production_enabled: false;
};

export type BtcBinancePublicFact = {
  id: string;
  label_en: string;
  label_ru: string;
  value: string;
  unit: string;
  authority_layer: "RAW" | "DERIVED";
};

const DERIVED_DISPLAY_DECIMALS: Readonly<Record<string, number>> = {
  spread: 4,
  spread_bps: 4,
  top5_book_imbalance: 3,
};

export function formatBtcBinancePublicFactDisplayValue(item: BtcBinancePublicFact): string {
  if (item.authority_layer !== "DERIVED") return item.value;
  const decimals = DERIVED_DISPLAY_DECIMALS[item.id];
  if (decimals === undefined) return item.value;
  const numeric = Number(item.value);
  if (!Number.isFinite(numeric)) return item.value;
  const bounded = numeric.toFixed(decimals).replace(/\.?0+$/, "");
  return bounded === "-0" ? "0" : bounded;
}

export type BtcBinancePublicProof = {
  evidence_id: string;
  authority_layer: "RAW" | "DERIVED";
  endpoint_or_stream: string;
  event_time: string | null;
  retrieval_time: string;
  freshness_state: string;
  freshness_reason: string;
  observation_hash: string;
  parameters_hash: string;
  derivation_version: string | null;
  uncertainty: string[];
};

export type BtcBinanceAcceptedStaticPeer = {
  price_usd: number;
  observed_at: string;
  freshness: "FRESH" | "STALE_LIMITED" | "UNAVAILABLE";
};

export type BtcBinancePublicBindingPacket = {
  schema_version: typeof BTC_BINANCE_PUBLIC_BINDING_SCHEMA;
  status: "READY" | "LIVE_VENUE_UNAVAILABLE";
  mode: BtcBinancePublicBindingMode;
  preview_only: true;
  production_enabled: false;
  provider: "Binance";
  venue: "Binance Spot";
  market: "spot";
  symbol: "BTCUSDT";
  observed_at: string | null;
  retrieved_at: string | null;
  freshness_state: "FRESH" | "UNAVAILABLE";
  facts: BtcBinancePublicFact[];
  proof: BtcBinancePublicProof[];
  source_comparison: {
    status: "NOT_COMPARABLE" | "SOURCE_UNAVAILABLE" | "DELTA_VISIBLE";
    reasons: string[];
    materiality: "UNCALIBRATED";
    winner: null;
  } | null;
  failure: { code: string; message: string } | null;
  boundary: {
    venue_specific_observation: true;
    accepted_snapshot_remains_primary: true;
    base_answer_rewrite: false;
    global_btc_price_claim: false;
    raw_provider_payload_exposed: false;
    session_live_value_persistence: false;
    trading_authority: false;
    withdrawal_authority: false;
    transfer_authority: false;
  };
};

const INFORMATIONAL_QUESTION_PREFIX = /^(?:what\s+(?:is|are|was|were|does)|how\s+(?:does|do|did|is|are)|why\s+(?:did|does|is|are|was|were)|(?:when|where)\s+did|explain\b|define\b|что\s+такое\b|как\s+(?:работает|работают|устроен[а-яё]*)\b|почему\b|объясни\b|(?:когда|где)\s+[^?!.]{0,80}(?:входил[а-яё]*|вошл[а-яё]*|выходил[а-яё]*|вышл[а-яё]*|покупал[а-яё]*|купил[а-яё]*|продавал[а-яё]*|продал[а-яё]*))/i;
const EN_DECISION_MARKER = /\b(?:(?:should|shall|can|could|do)\s+(?:i|we)|would\s+you|give\s+me|recommend(?:\s+me)?|is\s+(?:this|it|btc|bitcoin)\s+(?:a\s+)?(?:good\s+)?(?:buy|sell|entry|exit)|(?:good|best)\s+(?:time\s+to\s+)?(?:buy|sell|enter|exit))\b/i;
const RU_DECISION_MARKER = /(?:стоит\s+ли|следует\s+ли|можно(?:\s+ли)?|лучше\s+ли|дай|посоветуй|мне\s+(?:купить|продать|войти|выйти|держать|закрыть|открыть|добавить|сократить|хеджировать))/i;
const EN_SELECTION_MARKER = /^(?:what|which|where|when|how\s+much|how\s+many)\b|\bwhat\s+(?:price|level|size|amount|stop)\b/i;
const RU_SELECTION_MARKER = /^(?:какой|какую|какое|где|когда|сколько|по\s+какой\s+цене)(?:\s|$)/i;
const EN_EXECUTION_ACTION = /\b(?:buy|sell|hold|enter|entry|exit|long|short|hedge|dca|average(?:\s+down)?|scale\s+(?:in(?:to)?|out(?:\s+of)?)|use\s+(?:leverage|margin))\b/i;
const RU_EXECUTION_ACTION = /(?:купить|покупать|продать|продавать|брать|держать|войти|входить|выйти|выходить|вход|выход|лонг|шорт|хеджировать|усредняться|усреднить|добавляться|использовать\s+плеч[оа]|использовать\s+марж[а-яё]*)/i;
const EN_POSITION_ACTION = /\b(?:take|open|close|increase|reduce|decrease|trim|add\s+to|size)\b[^?!.]{0,40}\bposition\b|\bposition\b[^?!.]{0,40}\b(?:open|close|increase|reduce|decrease|trim|add|size)\b/i;
const RU_POSITION_ACTION = /(?:открыть|закрыть|увеличить|сократить|уменьшить|нарастить|добавить|размер)[^?!.]{0,40}позици[а-яё]*|позици[а-яё]*[^?!.]{0,40}(?:открыть|закрыть|увеличить|сократить|уменьшить|нарастить|добавить|размер)/i;
const EN_RISK_ACTION = /\b(?:set|place|use|move)\b[^?!.]{0,30}\bstop(?:[- ]loss)?\b|\b(?:take|lock|secure)\b[^?!.]{0,20}\bprofit\b|\b(?:stop(?:[- ]loss)?|take[- ]?profit)\b[^?!.]{0,30}\b(?:set|place|use|level|price)\b/i;
const RU_RISK_ACTION = /(?:поставить|разместить|использовать|перенести)[^?!.]{0,30}(?:стоп|стоп[- ]лосс|тейк[- ]?профит)|(?:фиксировать|зафиксировать)[^?!.]{0,20}прибыл|(?:стоп|стоп[- ]лосс|тейк[- ]?профит)[^?!.]{0,30}(?:поставить|разместить|использовать|уров|цен)/i;
const EN_SIZE_PRICE_ACTION = /\b(?:price\s+target|trading\s+signal|entry\s+(?:point|level|price)|exit\s+(?:point|level|price)|position\s+(?:size|sizing))\b|\b(?:price|level|amount)\b[^?!.]{0,40}\b(?:buy|sell|enter|exit)\b|\bhow\s+much\b[^?!.]{0,40}\b(?:buy|sell)\b/i;
const RU_SIZE_PRICE_ACTION = /(?:ценов[а-яё]*\s+цел|торгов[а-яё]*\s+сигнал|(?:точк[а-яё]*|уров[а-яё]*)\s+(?:вход|выход)|размер[а-яё]*\s+позици|по\s+какой\s+цен[еы][^?!.]{0,30}(?:покупать|продавать|купить|продать)|сколько[^?!.]{0,40}(?:купить|покупать|продать|продавать))/i;
const BTC_OR_TRADE_CONTEXT = /\b(?:btc|bitcoin|position|trade|trading|entry|exit|stop|profit|leverage|margin|long|short|dca)\b|(?:биткоин|позици|сделк|торгов|вход|выход|стоп|тейк[- ]?профит|прибыл|плеч|марж|лонг|шорт|усредн)/i;
const EN_IMPERATIVE_START = /^(?:buy|sell|hold|enter|exit|open|close|increase|reduce|decrease|trim|hedge|dca|average|take\s+profit|set\s+(?:a\s+)?stop)\b/i;
const RU_IMPERATIVE_OR_INFINITIVE_START = /^(?:купить|покупать|продать|продавать|брать|держать|войти|входить|выйти|выходить|открыть|закрыть|увеличить|сократить|уменьшить|нарастить|добавить|хеджировать|усредняться|усреднить|фиксировать)\b/i;
const CHOICE_OR_TIMING_MARKER = /\b(?:now|today|here|or\s+(?:wait|hold|sell|buy|exit|enter))\b|(?:сейчас|сегодня|или\s+(?:подождать|держать|продавать|покупать|выйти|войти))/i;
const EN_POSITIVE_MARKET_INFORMATIONAL_PATTERNS: readonly RegExp[] = [
  /^what\s+is\s+happening\s+with\s+(?:btc|bitcoin)(?:\s+(?:now|today))?[?!.]*$/i,
  /^what\s+(?:is|are)\s+(?:the\s+)?(?:current\s+)?(?:btc|bitcoin)\s+(?:price|volume|buy\s+volume|sell\s+volume|buy\s+pressure|sell\s+pressure|spread|order[- ]?book(?:\s+depth)?|depth|imbalance|market\s+structure|market\s+data|quote|bid|ask)(?:\s+(?:today|now))?[?!.]*$/i,
  /^what\s+(?:is|are)\s+(?:the\s+)?(?:current\s+)?(?:price|volume|spread|market\s+structure|market\s+data|quote|bid|ask)\s+(?:of\s+)?(?:btc|bitcoin)(?:\s+(?:today|now))?[?!.]*$/i,
  /^how\s+much\s+(?:buy[- ]side|sell[- ]side|spot)?\s*volume\s+(?:is\s+)?(?:visible\s+)?(?:in|on|for)\s+(?:btc|bitcoin)(?:\s+(?:today|now))?[?!.]*$/i,
  /^why\s+did\s+(?:btc|bitcoin)\s+(?:sell\s+off|rally|drop|rise)(?:\s+(?:today|yesterday|now))?[?!.]*$/i,
  /^how\s+has\s+(?:btc|bitcoin)(?:\s+(?:price|market))?\s+changed(?:\s+(?:today|since\s+the\s+previous\s+snapshot))?[?!.]*$/i,
];
const RU_POSITIVE_MARKET_INFORMATIONAL_PATTERNS: readonly RegExp[] = [
  /^что\s+происходит\s+с\s+(?:btc|bitcoin|биткоин[а-яё]*)(?:\s+(?:сейчас|сегодня))?[?!.]*$/i,
  /^как(?:ая|ой|ое|ие)\s+(?:сейчас|текущ[а-яё]*)\s+(?:цена|объ[её]м|спред|структура\s+рынка|данн[а-яё]*\s+рынка|котировк[а-яё]*|спрос|предложен[а-яё]*)\s+(?:btc|bitcoin|биткоин[а-яё]*)(?:\s+(?:сейчас|сегодня))?[?!.]*$/i,
  /^почему\s+(?:btc|bitcoin|биткоин[а-яё]*)\s+(?:падает|раст[её]т)(?:\s+(?:сейчас|сегодня))?[?!.]*$/i,
  /^как\s+изменил(?:ась|ся|ось)\s+(?:цена|рынок|структура\s+рынка)\s+(?:btc|bitcoin|биткоин[а-яё]*)(?:\s+(?:сегодня|сейчас))?[?!.]*$/i,
  /^покажи\s+текущ[а-яё]*\s+данн[а-яё]*\s+рынка\s+(?:btc|bitcoin|биткоин[а-яё]*)[?!.]*$/i,
];

function hasPositiveMarketObservationForm(question: string): boolean {
  return EN_POSITIVE_MARKET_INFORMATIONAL_PATTERNS.some((pattern) => pattern.test(question))
    || RU_POSITIVE_MARKET_INFORMATIONAL_PATTERNS.some((pattern) => pattern.test(question));
}

function hasActionSemantics(question: string): boolean {
  const action = EN_EXECUTION_ACTION.test(question) || RU_EXECUTION_ACTION.test(question) || EN_POSITION_ACTION.test(question) || RU_POSITION_ACTION.test(question) || EN_RISK_ACTION.test(question) || RU_RISK_ACTION.test(question) || EN_SIZE_PRICE_ACTION.test(question) || RU_SIZE_PRICE_ACTION.test(question);
  if (!action) return false;

  const explicitDecision = EN_DECISION_MARKER.test(question) || RU_DECISION_MARKER.test(question);
  const selection = EN_SELECTION_MARKER.test(question) || RU_SELECTION_MARKER.test(question);
  const imperative = EN_IMPERATIVE_START.test(question) || RU_IMPERATIVE_OR_INFINITIVE_START.test(question);
  const choiceOrTiming = CHOICE_OR_TIMING_MARKER.test(question);
  const tradeContext = BTC_OR_TRADE_CONTEXT.test(question);

  if (explicitDecision) return true;
  if (imperative && (tradeContext || choiceOrTiming)) return true;
  if (selection && tradeContext) return true;
  if (tradeContext && choiceOrTiming) return true;
  return false;
}

export function hasDirectBtcFinancialActionIntent(question: string): boolean {
  const normalized = question.trim().replace(/\s+/g, " ");
  if (!normalized) return false;
  const informational = INFORMATIONAL_QUESTION_PREFIX.test(normalized);
  if (hasPositiveMarketObservationForm(normalized)) return false;
  if (informational && !EN_DECISION_MARKER.test(normalized) && !RU_DECISION_MARKER.test(normalized)) return false;
  return hasActionSemantics(normalized);
}

const METHOD_TRADING_PURPOSE = /\b(?:trade|trading|speculate|speculation|buy|sell|long|short|entry|exit|position|leverage|margin|signal|target)\b|(?:торгов|спекул|покуп|купить|прода|лонг|шорт|вход|выход|позици|плеч|марж|сигнал|цел)/i;
const EN_POSITIVE_METHOD_INFORMATIONAL_PATTERNS: readonly RegExp[] = [
  /^which\s+(?:live\s+)?binance\s+(?:source|endpoint|endpoints)\s+(?:is|are)\s+used[?!.]*$/i,
  /^what\s+(?:is|are)\s+(?:the\s+)?(?:binance\s+)?(?:live\s+)?(?:source|endpoint|endpoints|data\s+source|provenance|freshness|method|verification|evidence\s+boundary)(?:\s+(?:of|for)\s+(?:the\s+)?(?:binance\s+)?(?:live\s+)?(?:data|evidence|observation|source))?[?!.]*$/i,
  /^what\s+(?:source|provenance|freshness|method|verification|evidence\s+boundary)\s+(?:is|are)\s+used\s+for\s+(?:the\s+)?(?:binance\s+)?(?:live\s+)?(?:data|evidence|observation)[?!.]*$/i,
  /^how\s+(?:is|are)\s+(?:the\s+)?(?:binance\s+)?(?:live\s+)?(?:data|evidence|observation|source)\s+(?:sourced|retrieved|verified|validated|observed|timestamped)[?!.]*$/i,
  /^how\s+fresh\s+(?:is|are)\s+(?:the\s+)?(?:binance\s+)?(?:live\s+)?(?:data|evidence|observation)[?!.]*$/i,
];
const RU_POSITIVE_METHOD_INFORMATIONAL_PATTERNS: readonly RegExp[] = [
  /^(?:какой|какая|какие)\s+(?:жив[а-яё]*\s+)?(?:источник|источники|эндпоинт|эндпоинты|метод)\s+binance\s+использу[а-яё]*[?!.]*$/i,
  /^(?:какова|каково|какой|какая|какие)\s+(?:свежесть|метод|проверка|верификация|происхождение)\s+(?:жив[а-яё]*\s+)?(?:данн[а-яё]*|источник[а-яё]*|наблюдени[а-яё]*)\s+binance[?!.]*$/i,
  /^как\s+(?:проверяются|верифицируются|валидируются|получаются|извлекаются|наблюдаются)\s+(?:жив[а-яё]*\s+)?данн[а-яё]*\s+binance[?!.]*$/i,
  /^откуда\s+(?:берутся|получаются)\s+(?:жив[а-яё]*\s+)?данн[а-яё]*\s+binance[?!.]*$/i,
  /^какой\s+метод\s+используется\s+для\s+(?:жив[а-яё]*\s+)?данн[а-яё]*\s+binance[?!.]*$/i,
];

const EN_METHOD_SAFE_WORDS = new Set([
  "which", "what", "how", "is", "are", "the", "live", "binance", "source", "sources", "endpoint", "endpoints",
  "data", "provenance", "freshness", "method", "verification", "evidence", "boundary", "observation", "observations", "used", "sourced",
  "retrieved", "verified", "validated", "observed", "timestamped", "fresh", "of", "for", "where", "does", "come", "comes", "from",
  "provide", "provides", "provided", "supply", "supplies", "supplied", "get", "gets", "receive", "receives", "bhrigu",
]);
const RU_METHOD_SAFE_WORD = /^(?:какой|какая|какие|какова|каково|какого|как|откуда|из|binance|bhrigu|live|для|жив[а-яё]*|источник[а-яё]*|эндпоинт[а-яё]*|метод[а-яё]*|использу[а-яё]*|свежест[а-яё]*|проверк[а-яё]*|верификац[а-яё]*|происхожд[а-яё]*|данн[а-яё]*|наблюдени[а-яё]*|валидиру[а-яё]*|получа[а-яё]*|извлека[а-яё]*|берутся|приход[а-яё]*|поступа[а-яё]*|да[её]т|предоставля[а-яё]*|проверя[а-яё]*|верифициру[а-яё]*)$/i;

function normalizedMethodTokens(question: string): string[] {
  return question.toLowerCase().replace(/[?!.:,;()]/g, " ").trim().split(/\s+/).filter(Boolean);
}

function hasPositiveEnglishMethodWordOrder(question: string): boolean {
  const tokens = normalizedMethodTokens(question);
  if (!tokens.includes("binance") || !tokens.every((token) => EN_METHOD_SAFE_WORDS.has(token))) return false;
  const joined = tokens.join(" ");
  const hasSource = tokens.some((token) => token === "source" || token === "sources" || token === "endpoint" || token === "endpoints");
  const hasConcept = hasSource || tokens.some((token) => ["provenance", "freshness", "method", "verification"].includes(token)) || joined.includes("evidence boundary");
  if (/^which\b/.test(joined) && hasSource && /\b(?:source|sources|endpoint|endpoints) (?:is|are) used\b/.test(joined)) return true;
  if (/^what (?:is|are)\b/.test(joined) && hasConcept) return true;
  if (/^how (?:is|are)\b/.test(joined) && /\b(?:sourced|retrieved|verified|validated|observed|timestamped)$/.test(joined)) return true;
  if (/^how fresh (?:is|are)\b/.test(joined) && tokens.some((token) => ["data", "evidence", "observation", "observations"].includes(token))) return true;
  return false;
}

function hasPositiveRussianMethodWordOrder(question: string): boolean {
  const tokens = normalizedMethodTokens(question);
  if (!tokens.includes("binance") || !tokens.every((token) => RU_METHOD_SAFE_WORD.test(token))) return false;
  const joined = tokens.join(" ");
  const hasSource = tokens.some((token) => /^(?:источник|источники|эндпоинт|эндпоинты|метод)$/i.test(token));
  const hasConcept = hasSource || tokens.some((token) => /^(?:свежест[а-яё]*|проверк[а-яё]*|верификац[а-яё]*|происхожд[а-яё]*)$/i.test(token));
  if (/^(?:какой|какая|какие)(?:\s|$)/i.test(joined) && hasSource && /использу[а-яё]*$/i.test(joined)) return true;
  if (/^(?:какова|каково|какой|какая|какие)(?:\s|$)/i.test(joined) && hasConcept) return true;
  if (/^как(?:\s|$)/i.test(joined) && tokens.some((token) => /^(?:проверя[а-яё]*|верифициру[а-яё]*|валидиру[а-яё]*|получа[а-яё]*|извлека[а-яё]*|наблюда[а-яё]*)$/i.test(token))) return true;
  if (/^откуда(?:\s|$)/i.test(joined) && /(?:берутся|получа[а-яё]*)/i.test(joined) && tokens.some((token) => /^данн[а-яё]*$/i.test(token))) return true;
  return false;
}

type SafeMethodRelation = "SOURCE_ORIGIN" | "SOURCE_PROVISION" | "SOURCE_RETRIEVAL" | "SOURCE_USAGE";

function classifyPositiveEnglishMethodRelation(question: string): SafeMethodRelation | null {
  const tokens = normalizedMethodTokens(question);
  if (!tokens.includes("binance") || !tokens.every((token) => EN_METHOD_SAFE_WORDS.has(token))) return null;
  const joined = tokens.join(" ");
  const hasSource = tokens.some((token) => ["source", "sources", "endpoint", "endpoints"].includes(token));
  const hasPayload = tokens.some((token) => ["data", "evidence", "observation", "observations"].includes(token));
  const hasProvider = tokens.some((token) => ["provide", "provides", "provided", "supply", "supplies", "supplied"].includes(token));
  const hasRetrieval = tokens.some((token) => ["retrieved", "get", "gets", "receive", "receives"].includes(token));

  if (/^where\b/.test(joined) && hasPayload && ((tokens.includes("from") && (tokens.includes("come") || tokens.includes("comes") || tokens.includes("sourced"))) || hasRetrieval)) return "SOURCE_ORIGIN";
  if (/^(?:which|what)\b/.test(joined) && hasSource && hasPayload && hasProvider) return "SOURCE_PROVISION";
  if (/^(?:where|how)\b/.test(joined) && hasPayload && hasRetrieval) return "SOURCE_RETRIEVAL";
  if (/^(?:which|what)\b/.test(joined) && hasSource && tokens.includes("used")) return "SOURCE_USAGE";
  return null;
}

function classifyPositiveRussianMethodRelation(question: string): SafeMethodRelation | null {
  const tokens = normalizedMethodTokens(question);
  if (!tokens.includes("binance") || !tokens.every((token) => RU_METHOD_SAFE_WORD.test(token))) return null;
  const joined = tokens.join(" ");
  const hasSource = tokens.some((token) => /^источник[а-яё]*$|^эндпоинт[а-яё]*$/i.test(token));
  const hasPayload = tokens.some((token) => /^данн[а-яё]*$|^наблюдени[а-яё]*$/i.test(token));
  const hasOrigin = tokens.some((token) => /^(?:приход[а-яё]*|поступа[а-яё]*|берутся)$/i.test(token));
  const hasProvider = tokens.some((token) => /^(?:да[её]т|предоставля[а-яё]*)$/i.test(token));
  const hasRetrieval = tokens.some((token) => /^получа[а-яё]*$|^извлека[а-яё]*$/i.test(token));

  if ((/^из какого(?:\s|$)/i.test(joined) && hasSource && hasOrigin) || (/^откуда(?:\s|$)/i.test(joined) && hasPayload && (hasOrigin || hasRetrieval))) return "SOURCE_ORIGIN";
  if (/^(?:какой|какая|какие)(?:\s|$)/i.test(joined) && hasSource && hasPayload && hasProvider) return "SOURCE_PROVISION";
  if ((tokens.includes("bhrigu") || /^как(?:\s|$)/i.test(joined)) && hasPayload && hasRetrieval) return "SOURCE_RETRIEVAL";
  if (/^(?:какой|какая|какие)(?:\s|$)/i.test(joined) && hasSource && tokens.some((token) => /^использу[а-яё]*$/i.test(token))) return "SOURCE_USAGE";
  return null;
}

function hasPositiveMethodAndProofForm(question: string): boolean {
  if (METHOD_TRADING_PURPOSE.test(question)) return false;
  return EN_POSITIVE_METHOD_INFORMATIONAL_PATTERNS.some((pattern) => pattern.test(question))
    || RU_POSITIVE_METHOD_INFORMATIONAL_PATTERNS.some((pattern) => pattern.test(question))
    || hasPositiveEnglishMethodWordOrder(question)
    || hasPositiveRussianMethodWordOrder(question)
    || classifyPositiveEnglishMethodRelation(question) !== null
    || classifyPositiveRussianMethodRelation(question) !== null;
}

export function hasPositiveBtcBinanceInformationalEligibility(route: BtcCosmographerRoute, mode: BtcBinancePublicBindingMode): boolean {
  const normalized = route.raw_question.trim().replace(/\s+/g, " ");
  if (!normalized) return false;
  if (mode === "BTC_FIELD_NOW") return hasPositiveMarketObservationForm(normalized);
  if (mode === "BTC_CHANGE_MEMORY") {
    return /^(?:what\s+(?:changed|has\s+changed)(?:\s+since\s+(?:the\s+)?previous\s+snapshot|\s+(?:in|with|for)\s+(?:btc|bitcoin|the\s+btc\s+market|the\s+market)(?:\s+(?:today|now))?)|что\s+изменилось(?:\s+с\s+(?:предыдущего|последнего)\s+снимк[а-яё]*|\s+(?:на\s+рынке|в\s+рынке|в)\s+(?:btc|bitcoin|биткоин[а-яё]*)(?:\s+(?:сегодня|сейчас))?))[?!.]*$/i.test(normalized);
  }
  return hasPositiveMethodAndProofForm(normalized);
}

function eligibleMode(route: BtcCosmographerRoute): BtcBinancePublicBindingMode | null {
  if (route.domain === "btc_market") {
    if (route.market_question_class === "general_btc_field" || route.market_question_class === "market_structure") {
      return "BTC_FIELD_NOW";
    }
    return null;
  }
  if (route.domain === "snapshot_memory" && route.market_question_class === "change_memory") {
    return "BTC_CHANGE_MEMORY";
  }
  if (route.domain === "methodology" && /\bbinance\b|live\s+(?:source|market|venue|data)|venue\s+observation|жив[а-яё]*\s+(?:источник|рынок|данн)|бирж[а-яё]*\s+(?:источник|данн)/i.test(route.raw_question)) {
    return "METHOD_AND_PROOF";
  }
  return null;
}

export function decideBtcBinancePublicBinding(input: {
  route: BtcCosmographerRoute;
  vercelEnv: string | undefined;
  disabled?: boolean;
}): BtcBinancePublicBindingDecision {
  if (hasDirectBtcFinancialActionIntent(input.route.raw_question)) {
    return { eligible: false, fetch: false, mode: null, gate_state: "INELIGIBLE_FINANCIAL_INTENT", preview_only: true, production_enabled: false };
  }
  const mode = eligibleMode(input.route);
  if (!mode) return { eligible: false, fetch: false, mode: null, gate_state: "INELIGIBLE_ROUTE", preview_only: true, production_enabled: false };
  if (!hasPositiveBtcBinanceInformationalEligibility(input.route, mode)) {
    return { eligible: false, fetch: false, mode: null, gate_state: "INELIGIBLE_INFORMATIONAL_PROOF", preview_only: true, production_enabled: false };
  }
  if (input.disabled) return { eligible: true, fetch: false, mode, gate_state: "DISABLED_KILL_SWITCH", preview_only: true, production_enabled: false };
  if (input.vercelEnv !== "preview") return { eligible: true, fetch: false, mode, gate_state: "DISABLED_PRODUCTION", preview_only: true, production_enabled: false };
  return { eligible: true, fetch: true, mode, gate_state: "ENABLED_PREVIEW", preview_only: true, production_enabled: false };
}

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function summaryByEndpoint(items: readonly MarketEvidenceSummary[], endpoint: string, authority?: "RAW" | "DERIVED") {
  return items.find((item) => item.endpoint_or_stream === endpoint && (!authority || item.authority_layer === authority)) ?? null;
}

function valueOf(item: MarketEvidenceSummary | null, key: string): string | null {
  const normalized = record(item?.normalized_value ?? null);
  const value = normalized?.[key];
  if (typeof value === "string" && value.length > 0) return value;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return null;
}

function fact(
  items: readonly MarketEvidenceSummary[],
  endpoint: string,
  key: string,
  id: string,
  labels: [string, string],
  unit: string,
  authority: "RAW" | "DERIVED" = "RAW",
): BtcBinancePublicFact | null {
  const item = summaryByEndpoint(items, endpoint, authority);
  const value = valueOf(item, key);
  return value === null ? null : { id, label_en: labels[0], label_ru: labels[1], value, unit, authority_layer: authority };
}

function proof(items: readonly MarketEvidenceSummary[]): BtcBinancePublicProof[] {
  return items.map((item) => ({
    evidence_id: item.evidence_id,
    authority_layer: item.authority_layer,
    endpoint_or_stream: item.endpoint_or_stream,
    event_time: item.event_time,
    retrieval_time: item.retrieval_time,
    freshness_state: item.freshness.state,
    freshness_reason: item.freshness.reason,
    observation_hash: item.provenance.observation_hash,
    parameters_hash: item.provenance.parameters_hash,
    derivation_version: item.derivation_version,
    uncertainty: [...item.uncertainty],
  }));
}

function latestObservation(items: readonly MarketEvidenceSummary[]): string | null {
  const values = items.flatMap((item) => [item.event_time, item.retrieval_time]).filter((value): value is string => Boolean(value));
  if (!values.length) return null;
  return values.sort((a, b) => Date.parse(b) - Date.parse(a))[0] ?? null;
}

function staticComparison(items: readonly MarketEvidenceSummary[], peer: BtcBinanceAcceptedStaticPeer | null) {
  if (!peer) return null;
  const price = summaryByEndpoint(items, "/api/v3/ticker/price", "RAW");
  const liveValue = Number(valueOf(price, "price_usdt"));
  const observedAt = price?.event_time ?? price?.retrieval_time ?? "";
  if (!Number.isFinite(liveValue) || !observedAt) return null;
  const result = compareCompatibleMarketObservations(
    {
      provider: "Binance",
      venue: "Binance Spot",
      symbol: "BTCUSDT",
      metric: "BTC_REFERENCE_PRICE",
      value: liveValue,
      unit: "QUOTE_PER_BTC",
      quote_basis: "USDT",
      observed_at: observedAt,
      freshness: price!.freshness.state,
    },
    {
      provider: "BHRIGU accepted aggregate snapshot",
      venue: "aggregate",
      symbol: "BTCUSD",
      metric: "BTC_REFERENCE_PRICE",
      value: peer.price_usd,
      unit: "QUOTE_PER_BTC",
      quote_basis: "USD",
      observed_at: peer.observed_at,
      freshness: peer.freshness,
    },
  );
  return { status: result.status, reasons: [...result.reasons], materiality: result.materiality, winner: result.winner };
}

const BOUNDARY: BtcBinancePublicBindingPacket["boundary"] = {
  venue_specific_observation: true,
  accepted_snapshot_remains_primary: true,
  base_answer_rewrite: false,
  global_btc_price_claim: false,
  raw_provider_payload_exposed: false,
  session_live_value_persistence: false,
  trading_authority: false,
  withdrawal_authority: false,
  transfer_authority: false,
};

export function buildBtcBinancePublicBinding(input: {
  decision: BtcBinancePublicBindingDecision;
  result: BinancePublicMarketResult;
  staticPeer?: BtcBinanceAcceptedStaticPeer | null;
}): BtcBinancePublicBindingPacket | null {
  if (!input.decision.fetch || !input.decision.mode) return null;
  const mode = input.decision.mode;
  if (input.result.ok === false) {
    return {
      schema_version: BTC_BINANCE_PUBLIC_BINDING_SCHEMA,
      status: "LIVE_VENUE_UNAVAILABLE",
      mode,
      preview_only: true,
      production_enabled: false,
      provider: "Binance",
      venue: "Binance Spot",
      market: "spot",
      symbol: "BTCUSDT",
      observed_at: null,
      retrieved_at: null,
      freshness_state: "UNAVAILABLE",
      facts: [],
      proof: [],
      source_comparison: null,
      failure: { code: input.result.code, message: input.result.message },
      boundary: BOUNDARY,
    };
  }

  const view = consumeBtcMarketEvidence(mode, input.result.snapshot.evidence);
  const admitted = view.admitted;
  const facts = mode === "METHOD_AND_PROOF" ? [] : [
    fact(admitted, "/api/v3/ticker/price", "price_usdt", "last_price", ["Last price", "Последняя цена"], "USDT/BTC"),
    fact(admitted, "/api/v3/ticker/bookTicker", "bid_price_usdt", "best_bid", ["Best bid", "Лучшая цена покупки"], "USDT/BTC"),
    fact(admitted, "/api/v3/ticker/bookTicker", "ask_price_usdt", "best_ask", ["Best ask", "Лучшая цена продажи"], "USDT/BTC"),
    fact(admitted, "derived", "spread_usdt", "spread", ["Bid/ask spread", "Спред bid/ask"], "USDT", "DERIVED"),
    fact(admitted, "derived", "spread_bps", "spread_bps", ["Spread", "Спред"], "bps", "DERIVED"),
    fact(admitted, "/api/v3/ticker/24hr", "price_change_usdt", "change_24h", ["Rolling 24h change", "Изменение за скользящие 24ч"], "USDT"),
    fact(admitted, "/api/v3/ticker/24hr", "price_change_percent", "change_24h_pct", ["Rolling 24h change", "Изменение за скользящие 24ч"], "%"),
    fact(admitted, "/api/v3/ticker/24hr", "high_price_usdt", "high_24h", ["Rolling 24h high", "Максимум за скользящие 24ч"], "USDT/BTC"),
    fact(admitted, "/api/v3/ticker/24hr", "low_price_usdt", "low_24h", ["Rolling 24h low", "Минимум за скользящие 24ч"], "USDT/BTC"),
    fact(admitted, "/api/v3/ticker/24hr", "volume_btc", "volume_24h_btc", ["Rolling 24h volume", "Объём за скользящие 24ч"], "BTC"),
    fact(admitted, "/api/v3/ticker/24hr", "quote_volume_usdt", "volume_24h_usdt", ["Rolling 24h quote volume", "Объём котируемой валюты за 24ч"], "USDT"),
    fact(admitted, "derived", "top_book_imbalance", "top5_book_imbalance", ["Top-5 book imbalance", "Дисбаланс top-5 книги"], "ratio", "DERIVED"),
  ].filter((item): item is BtcBinancePublicFact => item !== null);

  if (mode !== "METHOD_AND_PROOF" && facts.length === 0) {
    return {
      schema_version: BTC_BINANCE_PUBLIC_BINDING_SCHEMA,
      status: "LIVE_VENUE_UNAVAILABLE",
      mode,
      preview_only: true,
      production_enabled: false,
      provider: "Binance",
      venue: "Binance Spot",
      market: "spot",
      symbol: "BTCUSDT",
      observed_at: null,
      retrieved_at: input.result.snapshot.retrieved_at,
      freshness_state: "UNAVAILABLE",
      facts: [],
      proof: proof(admitted),
      source_comparison: null,
      failure: { code: "BINANCE_BINDING_NO_ADMISSIBLE_VALUES", message: "No admissible fresh Binance venue values are available for this route." },
      boundary: BOUNDARY,
    };
  }

  return {
    schema_version: BTC_BINANCE_PUBLIC_BINDING_SCHEMA,
    status: "READY",
    mode,
    preview_only: true,
    production_enabled: false,
    provider: "Binance",
    venue: "Binance Spot",
    market: "spot",
    symbol: "BTCUSDT",
    observed_at: latestObservation(admitted),
    retrieved_at: input.result.snapshot.retrieved_at,
    freshness_state: "FRESH",
    facts,
    proof: proof(admitted),
    source_comparison: mode === "METHOD_AND_PROOF" ? null : staticComparison(admitted, input.staticPeer ?? null),
    failure: null,
    boundary: BOUNDARY,
  };
}
