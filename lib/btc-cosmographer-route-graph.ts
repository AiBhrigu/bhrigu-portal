import type { BtcEnvelopeQuestionClass } from "./btc-market-envelope";
import type { BtcPublicLocale } from "./btc-public-language-contract";

export const BTC_COSMOGRAPHER_ROUTE_SCHEMA =
  "btc_cosmographer_semantic_route_graph_v0_1" as const;

export type BtcCosmographerDomain =
  | "bitcoin_protocol"
  | "btc_market"
  | "snapshot_memory"
  | "astromodule"
  | "astro_btc_bridge"
  | "methodology"
  | "navigation"
  | "unsupported";

export type BtcCosmographerIntent =
  | "fact"
  | "explain"
  | "interval_analysis"
  | "compare"
  | "change"
  | "reason"
  | "confirmation"
  | "watch"
  | "bridge"
  | "navigate";

export type BtcCosmographerContextRelation =
  | "NEW_TOPIC"
  | "FOLLOW_UP"
  | "CROSS_MODULE_BRIDGE"
  | "RETURN_TO_PREVIOUS_TOPIC"
  | "GENUINELY_AMBIGUOUS";

export type BtcCosmographerAnswerState =
  | "CONFIRMED"
  | "SPLIT"
  | "LIMITED"
  | "CLARIFICATION"
  | "FAILURE";

export type BtcCosmographerTimeRange = {
  start: string;
  end: string;
  label: string;
  source: "QUESTION" | "DATE_CONTROL" | "CONTEXT";
};

export type BtcCosmographerRoute = {
  schema: typeof BTC_COSMOGRAPHER_ROUTE_SCHEMA;
  locale: BtcPublicLocale;
  raw_question: string;
  normalized_question: string;
  domain: BtcCosmographerDomain;
  subject: string;
  intents: BtcCosmographerIntent[];
  context_relation: BtcCosmographerContextRelation;
  time_range: BtcCosmographerTimeRange | null;
  market_question_class: BtcEnvelopeQuestionClass | null;
  capability_id: string;
  confidence: "HIGH" | "BOUNDED" | "LOW";
  explicit_entities: string[];
};

export const BTC_COSMOGRAPHER_CONTEXT_SCHEMA =
  "btc_cosmographer_context_v0_1" as const;

export type BtcCosmographerContextPacket = {
  schema: typeof BTC_COSMOGRAPHER_CONTEXT_SCHEMA;
  prior_domain: BtcCosmographerDomain;
  prior_subject: string;
  prior_intents: BtcCosmographerIntent[];
  prior_answer_state: BtcCosmographerAnswerState;
  prior_market_question_class: BtcEnvelopeQuestionClass | null;
  prior_time_start: string | null;
  prior_time_end: string | null;
  prior_snapshot_generated_at_utc: string | null;
};

export type BtcCosmographerParsedContext = {
  present: boolean;
  malformed: boolean;
  packet: BtcCosmographerContextPacket | null;
};

type QueryValue = string | string[] | undefined;
type QueryLike = Record<string, QueryValue>;

const DOMAINS: BtcCosmographerDomain[] = [
  "bitcoin_protocol",
  "btc_market",
  "snapshot_memory",
  "astromodule",
  "astro_btc_bridge",
  "methodology",
  "navigation",
  "unsupported",
];

const INTENTS: BtcCosmographerIntent[] = [
  "fact",
  "explain",
  "interval_analysis",
  "compare",
  "change",
  "reason",
  "confirmation",
  "watch",
  "bridge",
  "navigate",
];

const ANSWER_STATES: BtcCosmographerAnswerState[] = [
  "CONFIRMED",
  "SPLIT",
  "LIMITED",
  "CLARIFICATION",
  "FAILURE",
];

const MARKET_CLASSES: BtcEnvelopeQuestionClass[] = [
  "btc_gravity",
  "market_structure",
  "liquidity",
  "market_participation_rotation",
  "change_memory",
  "temporal_pressure",
  "general_btc_field",
];

const BODY_PATTERNS: Array<[string, RegExp]> = [
  ["sun", /\b(?:sun|solar)\b|солнц/i],
  ["moon", /\b(?:moon|lunar)\b|лун/i],
  ["mercury", /\bmercury\b|меркур/i],
  ["venus", /\bvenus\b|венер/i],
  ["mars", /\bmars\b|марс/i],
  ["jupiter", /\bjupiter\b|юпитер/i],
  ["saturn", /\bsaturn\b|сатурн/i],
  ["uranus", /\buranus\b|уран/i],
  ["neptune", /\bneptune\b|нептун/i],
  ["pluto", /\bpluto\b|плутон/i],
];

const MONTH_PATTERNS: Array<[number, RegExp]> = [
  [1, /\bjanuary\b|январ/i],
  [2, /\bfebruary\b|феврал/i],
  [3, /\bmarch\b|март/i],
  [4, /\bapril\b|апрел/i],
  [5, /\bmay\b|май|мая/i],
  [6, /\bjune\b|июн/i],
  [7, /\bjuly\b|июл/i],
  [8, /\baugust\b|август/i],
  [9, /\bseptember\b|сентябр/i],
  [10, /\boctober\b|октябр/i],
  [11, /\bnovember\b|ноябр/i],
  [12, /\bdecember\b|декабр/i],
];

const first = (value: QueryValue): string =>
  Array.isArray(value) ? value[0] ?? "" : value ?? "";

function unique<T>(values: T[]): T[] {
  return Array.from(new Set(values));
}

function validDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    Number.isFinite(new Date(`${value}T00:00:00Z`).getTime());
}

function validTimestamp(value: string): boolean {
  return value.length === 0 || Number.isFinite(new Date(value).getTime());
}

function hasBtcReference(question: string): boolean {
  return /\bbtc\b|\bbitcoin\b|бит(?:коин|койн|окин|окйн|коина|койна)/i.test(question);
}

function isMultiBodyLanguage(question: string): boolean {
  return /(?:planetary\s+aspects?|aspects?\s+(?:between|of)\s+planets?|аспект[а-яё]*\s+планет[а-яё]*|планет[а-яё]*\s+аспект[а-яё]*|напряж[её]нн[а-яё]*\s+(?:дн|дат|период)[а-яё]*.*(?:планет|аспект)|(?:планет|аспект).*напряж[её]нн[а-яё]*\s+(?:дн|дат|период)[а-яё]*)/i.test(question);
}

function isBitcoinGenesisChartQuestion(question: string): boolean {
  return hasBtcReference(question) &&
    /(?:genesis|генезис|рождени[ея]|натальн|карта)/i.test(question) &&
    /(?:planet|планет|astro|астро|where.*stand|где\s+сто)/i.test(question);
}

function isVolatilityQuestion(question: string): boolean {
  return /volatil|волатиль|(?:most|highest)\s+(?:intense|tense|high-pressure)\s+(?:dates?|days?|windows?|periods?)|(?:dates?|days?|windows?|periods?)\s+(?:are\s+)?(?:the\s+)?(?:(?:most|highest)\s+)?(?:intense|tense|high-pressure)|напряж[её]нн[а-яё]*\s+(?:день|дн[а-яё]*|дат[а-яё]*|период[а-яё]*|окн[а-яё]*)|(?:день|дн[а-яё]*|дат[а-яё]*|период[а-яё]*|окн[а-яё]*)\s+(?:сам[а-яё]*\s+|наиболее\s+)?напряж[её]нн[а-яё]*|сам(?:ый|ая|ые)\s+резк/i.test(question);
}

function yearRange(
  year: number,
  firstHalf: boolean,
  secondHalf: boolean,
): BtcCosmographerTimeRange {
  if (firstHalf) {
    return {
      start: `${year}-01-01`,
      end: `${year}-06-30`,
      label: `${year} H1`,
      source: "QUESTION",
    };
  }
  if (secondHalf) {
    return {
      start: `${year}-07-01`,
      end: `${year}-12-31`,
      label: `${year} H2`,
      source: "QUESTION",
    };
  }
  return {
    start: `${year}-01-01`,
    end: `${year}-12-31`,
    label: String(year),
    source: "QUESTION",
  };
}

function monthRange(year: number, month: number): BtcCosmographerTimeRange {
  const finalDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const monthText = String(month).padStart(2, "0");
  return {
    start: `${year}-${monthText}-01`,
    end: `${year}-${monthText}-${String(finalDay).padStart(2, "0")}`,
    label: `${year}-${monthText}`,
    source: "QUESTION",
  };
}

function explicitDates(question: string): string[] {
  const dates: string[] = [];
  const pattern = /\b(20\d{2}-\d{2}-\d{2})\b/g;
  let match: RegExpExecArray | null = pattern.exec(question);
  while (match) {
    dates.push(match[1]);
    match = pattern.exec(question);
  }
  return dates;
}

const NAMED_MONTHS: Record<string, number> = {
  january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
  july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
  января: 1, февраля: 2, марта: 3, апреля: 4, мая: 5, июня: 6,
  июля: 7, августа: 8, сентября: 9, октября: 10, ноября: 11, декабря: 12,
};

function namedCalendarDate(question: string): string | null {
  const ru = question.match(/\b([0-3]?\d)\s+(января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря)\s+(20\d{2})\b/i);
  const en = question.match(/\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+([0-3]?\d)(?:st|nd|rd|th)?[,]?\s+(20\d{2})\b/i);
  const day = Number(ru?.[1] ?? en?.[2] ?? 0);
  const monthName = (ru?.[2] ?? en?.[1] ?? "").toLowerCase();
  const year = Number(ru?.[3] ?? en?.[3] ?? 0);
  const month = NAMED_MONTHS[monthName];
  if (!day || !month || !year) return null;
  const value = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  return validDate(value) ? value : null;
}

export function extractBtcCosmographerTimeRange(
  question: string,
  selectedDate?: string,
): BtcCosmographerTimeRange | null {
  const q = question.toLowerCase();
  const dates = explicitDates(q);
  if (dates.length >= 2 && validDate(dates[0]) && validDate(dates[1])) {
    return {
      start: dates[0],
      end: dates[1],
      label: `${dates[0]} — ${dates[1]}`,
      source: "QUESTION",
    };
  }
  if (dates.length === 1 && validDate(dates[0])) {
    return {
      start: dates[0],
      end: dates[0],
      label: dates[0],
      source: "QUESTION",
    };
  }

  const namedDate = namedCalendarDate(q);
  if (namedDate) {
    return {
      start: namedDate,
      end: namedDate,
      label: namedDate,
      source: "QUESTION",
    };
  }

  const yearMatch = q.match(/\b(20\d{2})\b/);
  if (yearMatch) {
    const year = Number(yearMatch[1]);
    const firstHalf = /first\s+(?:six|6)\s+months|first\s+half|\bh1\b|первые?\s+(?:шесть|6)\s+месяц|перв(?:ая|ые)\s+половин|за\s+(?:шесть|6)\s+месяц/.test(q);
    const secondHalf = /last\s+(?:six|6)\s+months|second\s+half|\bh2\b|последн(?:ие|их)\s+(?:шесть|6)\s+месяц|втор(?:ая|ую)\s+половин/.test(q);
    const month = MONTH_PATTERNS.find(([, pattern]) => pattern.test(q))?.[0];
    return month ? monthRange(year, month) : yearRange(year, firstHalf, secondHalf);
  }

  if (selectedDate && validDate(selectedDate)) {
    return {
      start: selectedDate,
      end: selectedDate,
      label: selectedDate,
      source: "DATE_CONTROL",
    };
  }
  return null;
}

function bodySubjects(question: string): string[] {
  return BODY_PATTERNS
    .filter(([, pattern]) => pattern.test(question))
    .map(([body]) => body);
}


function isUnsupportedAssetOnly(question: string): boolean {
  return !hasBtcReference(question) && /\beth\b|ethereum|эфириум|\bsol\b|solana|солан/i.test(question);
}

function protocolSubject(question: string): string | null {
  if (/halving|халвинг|сокращени[ея]\s+награ|уполовинив/i.test(question)) return "halving";
  if (/сколько.*(?:btc|биткоин|монет)|количеств.*(?:btc|биткоин|монет)|how\s+many\s+(?:btc|bitcoin)(?:\s+coins?)?(?:\s+can\s+(?:exist|there\s+be))?|total\s+(?:btc|bitcoin)|max(?:imum)?\s+supply|circulating\s+supply|эмисси|предложени[ея]\s+btc|21\s*(?:m|million|млн)/i.test(question)) return "supply";
  if (/subsid|block reward|награда\s+за\s+блок|субсиди|how\s+(?:are|do)\s+new\s+(?:btc|bitcoin|bitcoins?)\s+(?:issued|created)|new\s+(?:btc|bitcoin|bitcoins?)\s+(?:issuance|creation)|как\s+(?:выпускаются|создаются|появляются)\s+новые\s+(?:btc|биткоин[а-яё]*)/i.test(question)) return "subsidy";
  if (/transaction fee|fees?\b|комисси/i.test(question)) return "fees";
  if (/difficulty|сложност/i.test(question)) return "difficulty";
  if (/mining|miner|майнинг|майнер/i.test(question)) return "mining";
  if (/utxo|unspent|неизрасходован/i.test(question)) return "utxo";
  if (/satoshi|накамото|кто\s+(?:такой|такая)\s+сатоши|кто\s+создал\s+(?:bitcoin|биткоин)|why\s+did\s+satoshi|what\s+is\s+known\s+(?:for\s+certain(?:\s+about\s+satoshi)?|about\s+satoshi)|what\s+do\s+we\s+know\s+about\s+satoshi|что\s+известно\s+точно/i.test(question)) return "satoshi_history";
  if (/origin(?:s)?\s+of\s+bitcoin|how\s+did\s+bitcoin\s+(?:begin|start|emerge)|from\s+the\s+white\s+paper|происхождени[ея]\s+(?:bitcoin|биткоин)|как\s+(?:появился|возник)\s+(?:bitcoin|биткоин)|от\s+(?:white\s+paper|белой\s+книг)/i.test(question)) return "bitcoin_origin";
  if (/genesis[-\s]?block|genesis[-\s]?блок|генезис[-\s]?блок|первые?\s+дн[яей]\s+(?:bitcoin|биткоин)|first\s+days?.*(?:bitcoin|genesis)|times\s+message|the\s+times|сообщени[ея].*times/i.test(question)) return "genesis_history";
  if (/genesis|генезис|перв(?:ый|ого)\s+блок/i.test(question)) return "genesis";
  if (/consensus|proof.of.work|chainwork|консенсус|доказательств[ао]\s+работ/i.test(question)) return "consensus";
  if (/\bblock\b|height|chain tip|блок|высот/i.test(question)) return "blocks";
  if (/что такое\s+(?:btc|bitcoin|биткоин)|how\s+does\s+bitcoin\s+work|(?:btc|bitcoin)\s+protocol|протокол[ауе]?\s+(?:btc|bitcoin|биткоин)/i.test(question)) return "overview";
  return null;
}

function marketClass(question: string): BtcEnvelopeQuestionClass | null {
  if (/dominance|gravity|leadership|доминир|доминац|гравитац|лидерств/i.test(question)) return "btc_gravity";
  if (/liquid|tvl|stablecoin|dex|ликвид|стейблкоин/i.test(question)) return "liquidity";
  if (/breadth|rotation|altcoin|participation|eth|ширин|ротац|альткоин|участи/i.test(question)) return "market_participation_rotation";
  if (/structure|regime|field score|market cap|структур|режим|капитализац/i.test(question)) return "market_structure";
  if (/snapshot|memory|previous checkpoint|delta|снимок|памят|предыдущ|дельт|что изменилось/i.test(question)) return "change_memory";
  if (/temporal pressure|market timing|market cycle|volatil|временн.*давлен|рыночн.*цикл|волатиль/i.test(question)) return "temporal_pressure";
  if (/btc field|market field|поле btc|общее поле|рынок btc|рынок биткоин|btc\s+today|bitcoin\s+today|btc\s+now|bitcoin\s+now|what(?:'s|\s+is)\s+happening\s+(?:with|to)\s+(?:btc|bitcoin)|what\s+is\s+going\s+on\s+(?:with|in)\s+(?:btc|bitcoin)|биткоин\s+(?:сегодня|сейчас)|что\s+(?:сейчас\s+)?происходит\s+(?:с|в)\s+(?:btc|bitcoin|биткоин[а-яё]*)|что\s+сейчас\s+(?:с|у)\s+(?:btc|бит)/i.test(question)) return "general_btc_field";
  return null;
}

function isMethodology(question: string): boolean {
  return /source|proof|method|methodology|where.*data|inference\s+boundary|evidence\s+boundary|source\s+boundary|источник|доказатель|методик|(?:^|\s)метод(?:\s|$|[?!.])|откуда.*данн|границ[а-яё]*\s+(?:вывод|доказатель|источник)/i.test(question);
}

function isNavigation(question: string): boolean {
  return /what can you do|how can i ask|available routes|capabilit|what can i ask|что ты умеешь|какие вопросы|маршрут|возможност/i.test(question);
}

function isUnsupportedMarketRequest(question: string): boolean {
  return /guaranteed\s+(?:btc|bitcoin)?\s*price|guaranteed\s+(?:price\s+)?target|exact\s+(?:btc|bitcoin)?\s*price\s+(?:tomorrow|next)|price\s+target\s+(?:for\s+)?tomorrow|гарантированн[а-яё]*\s+(?:цел[ьи]|цен[ау])|точн[а-яё]*\s+цен[ау]\s+(?:btc|bitcoin|биткоин[а-яё]*)?\s*(?:на\s+)?завтра|ценов[а-яё]*\s+цел[ьи]\s+(?:btc|bitcoin|биткоин[а-яё]*)/i.test(question);
}

function isReturn(question: string): boolean {
  return /back to|return to|go back|previous topic|prior topic|верн[её]мся|вернуться|вернись|предыдущ[а-яё]*\s+тем|снова к/i.test(question);
}

function isReferential(question: string): boolean {
  return /^(?:why|why\?|what about that|and this|it|this|that|them|so|then|what changed most|what creates (?:the )?divergence|which facts create (?:the )?divergence|what would resolve it|what aspect is most relevant|which aspect matters most|why is that (?:aspect|change|signal) relevant|почему|почему\?|а это|это|этот|эта|они|там|а\s|и\s|тогда|что важнее|какие показатели|что изменит|что изменилось сильнее|что созда[её]т расхождение|какие факты создают расхождение|что снимет расхождение|какой аспект (?:самый )?важн|какой аспект наиболее значим|почему этот (?:аспект|сигнал|переход) важен|какой день|какие дни)/i.test(question.trim());
}

function inferDomain(
  question: string,
  protocol: string | null,
  body: string | null,
  market: BtcEnvelopeQuestionClass | null,
): BtcCosmographerDomain {
  const hasBtc = hasBtcReference(question);
  if (isBitcoinGenesisChartQuestion(question)) return "unsupported";
  if (isUnsupportedMarketRequest(question)) return "unsupported";
  if (isUnsupportedAssetOnly(question)) return "unsupported";
  if (body && hasBtc) return "astro_btc_bridge";
  if (body && market) return "astro_btc_bridge";
  if (isMultiBodyLanguage(question) && hasBtc) return "astro_btc_bridge";
  if (isMultiBodyLanguage(question)) return "astromodule";
  if (body || /astromodule|астромодул|planet|планет|retrograd|ретроград|aspect|аспект|eclipse|затмени/i.test(question)) return "astromodule";
  if (isMethodology(question)) return "methodology";
  if (protocol) return "bitcoin_protocol";
  if (market === "change_memory") return "snapshot_memory";
  if (market) return "btc_market";
  if (isNavigation(question)) return "navigation";
  if (hasBtc) return "btc_market";
  return "unsupported";
}

function classifyIntents(
  question: string,
  domain: BtcCosmographerDomain,
  timeRange: BtcCosmographerTimeRange | null,
): BtcCosmographerIntent[] {
  const values: BtcCosmographerIntent[] = [];
  if (/сколько|какое количество|what is|how many|how much|maximum|максимальн/i.test(question)) values.push("fact");
  if (/why|explain|how does|what should i know|почему|объясни|как устро|что нужно знать|что означает/i.test(question)) values.push("explain");
  if (timeRange && (domain === "astromodule" || domain === "astro_btc_bridge")) values.push("interval_analysis");
  if (/compare|versus|\bvs\b|сравн|отличи|между/i.test(question)) values.push("compare");
  if (/what changed|changed|change since|что измен|изменени/i.test(question)) values.push("change");
  if (/why|matter|reason|important|почему|важно|причин|напряж|volatil|волатиль/i.test(question)) values.push("reason");
  if (/confirm|support|agree|подтверж|соглас/i.test(question)) values.push("confirmation");
  if (/watch|next|condition|наблюд|дальше|услов|today|now|сегодня|сейчас/i.test(question)) values.push("watch");
  if (/impact|influence|affect|correlat|coincid|relation|повлиял|влияни|связ|совпал|корреляц|показател.*(?:btc|бит)/i.test(question)) values.push("bridge");
  if (domain === "navigation") values.push("navigate");
  if (!values.length) values.push(domain === "bitcoin_protocol" ? "explain" : "fact");
  return unique(values);
}

function explicitEntities(
  body: string | null,
  protocol: string | null,
  market: BtcEnvelopeQuestionClass | null,
  multiBody: boolean,
): string[] {
  return unique([
    body,
    protocol,
    market,
    multiBody ? "planetary_aspects" : null,
  ].filter((value): value is string => Boolean(value)));
}

export function routeBtcCosmographerQuestion(
  locale: BtcPublicLocale,
  rawQuestion: string,
  packet: BtcCosmographerContextPacket | null,
  selectedDate?: string,
): BtcCosmographerRoute {
  const normalized = rawQuestion.trim().replace(/\s+/g, " ");
  const q = normalized.toLowerCase();
  const protocol = protocolSubject(q);
  const bodies = bodySubjects(q);
  const body = bodies[0] ?? null;
  const multipleExplicitBodies = bodies.length > 1;
  const multiBody = isMultiBodyLanguage(q);
  const market = marketClass(q);
  const genesisChart = isBitcoinGenesisChartQuestion(q);
  const unsupportedMarketRequest = isUnsupportedMarketRequest(q);
  let inferredDomain = multipleExplicitBodies
    ? "unsupported"
    : inferDomain(q, protocol, body, market);
  let forcedSubject: string | null = multipleExplicitBodies
    ? "multiple_planetary_objects"
    : genesisChart
      ? "bitcoin_genesis_chart"
      : unsupportedMarketRequest
        ? "unsupported_market_request"
        : multiBody
          ? "planetary_aspects"
          : null;

  if (isVolatilityQuestion(q) && !body && !multiBody && (market === null || market === "temporal_pressure") && packet) {
    if (packet.prior_domain === "astromodule" || packet.prior_domain === "astro_btc_bridge") {
      inferredDomain = packet.prior_domain === "astro_btc_bridge"
        ? "astro_btc_bridge"
        : "astromodule";
      forcedSubject = packet.prior_subject;
    } else if (packet.prior_domain === "btc_market" || packet.prior_domain === "snapshot_memory") {
      inferredDomain = "btc_market";
      forcedSubject = "temporal_pressure";
    }
  }

  const contextBridge = Boolean(
    packet &&
    market &&
    (packet.prior_domain === "astromodule" || packet.prior_domain === "astro_btc_bridge") &&
    /confirm|support|agree|coincid|relation|подтверж|соглас|совпал|связ/i.test(q),
  );
  const domain: BtcCosmographerDomain = contextBridge
    ? "astro_btc_bridge"
    : inferredDomain;
  const timeRange = extractBtcCosmographerTimeRange(q, selectedDate);
  const subject =
    forcedSubject ??
    (contextBridge ? packet?.prior_subject ?? null : null) ??
    (domain === "methodology" ? "source_and_method" : null) ??
    (domain === "navigation" ? "capabilities" : null) ??
    body ??
    protocol ??
    market ??
    (domain === "bitcoin_protocol" ? "overview" :
      domain === "btc_market" ? "general_btc_field" :
        domain === "unsupported" ? "unknown" : "general");
  const entities = explicitEntities(body, protocol, market, multiBody);
  for (const explicitBody of bodies) entities.push(explicitBody);
  if (genesisChart) entities.push("bitcoin_genesis_chart");
  if (multipleExplicitBodies) entities.push("multiple_planetary_objects");
  const explicit = entities.length > 0 || domain === "methodology" || domain === "navigation" || genesisChart;
  const referential = isReferential(q);

  let relation: BtcCosmographerContextRelation;
  if (contextBridge) relation = "CROSS_MODULE_BRIDGE";
  else if (isReturn(q)) relation = "RETURN_TO_PREVIOUS_TOPIC";
  else if (!packet) relation = explicit ? "NEW_TOPIC" : "GENUINELY_AMBIGUOUS";
  else if (referential) relation = "FOLLOW_UP";
  else if (explicit && (domain !== packet.prior_domain || subject !== packet.prior_subject)) relation = "NEW_TOPIC";
  else if (explicit || (isVolatilityQuestion(q) && Boolean(forcedSubject))) relation = "FOLLOW_UP";
  else relation = "GENUINELY_AMBIGUOUS";

  const inheritsContext =
  relation === "FOLLOW_UP" || relation === "RETURN_TO_PREVIOUS_TOPIC";
  const resolvedDomain =
  inheritsContext && !explicit && packet
    ? packet.prior_domain
    : domain;
  const resolvedSubject =
  inheritsContext && !explicit && packet
    ? packet.prior_subject
    : subject;
  const inheritedTime =
    !timeRange &&
    packet?.prior_time_start &&
    packet.prior_time_end &&
    (relation === "FOLLOW_UP" || relation === "CROSS_MODULE_BRIDGE" || relation === "RETURN_TO_PREVIOUS_TOPIC")
      ? {
          start: packet.prior_time_start,
          end: packet.prior_time_end,
          label: `${packet.prior_time_start} — ${packet.prior_time_end}`,
          source: "CONTEXT" as const,
        }
      : null;
  const resolvedMarket =
    resolvedDomain === "btc_market" ||
    resolvedDomain === "snapshot_memory" ||
    resolvedDomain === "astro_btc_bridge"
      ? referential && packet
        ? packet.prior_market_question_class ?? "general_btc_field"
        : market ?? packet?.prior_market_question_class ?? "general_btc_field"
      : null;
  const confidence =
    resolvedDomain === "unsupported" || relation === "GENUINELY_AMBIGUOUS"
      ? "LOW"
      : explicit || relation === "FOLLOW_UP" || relation === "RETURN_TO_PREVIOUS_TOPIC"
        ? "HIGH"
        : "BOUNDED";

  return {
    schema: BTC_COSMOGRAPHER_ROUTE_SCHEMA,
    locale,
    raw_question: rawQuestion,
    normalized_question: normalized,
    domain: resolvedDomain,
    subject: resolvedSubject,
    intents: classifyIntents(q, resolvedDomain, timeRange ?? inheritedTime),
    context_relation: relation,
    time_range: timeRange ?? inheritedTime,
    market_question_class: resolvedMarket,
    capability_id: `${resolvedDomain}.${resolvedSubject}`,
    confidence,
    explicit_entities: unique(entities),
  };
}

export function parseBtcCosmographerContext(
  query: QueryLike,
): BtcCosmographerParsedContext {
  const schema = first(query.cc);
  const fields = ["cd", "cs", "ci", "ca", "cm", "ct0", "ct1", "cb"];
  const present = Boolean(schema || fields.some((field) => first(query[field])));
  if (!present) return { present: false, malformed: false, packet: null };

  const domain = first(query.cd) as BtcCosmographerDomain;
  const subject = first(query.cs);
  const parsedIntents = first(query.ci)
    .split(",")
    .filter(Boolean) as BtcCosmographerIntent[];
  const state = first(query.ca) as BtcCosmographerAnswerState;
  const marketRaw = first(query.cm);
  const market = marketRaw ? marketRaw as BtcEnvelopeQuestionClass : null;
  const start = first(query.ct0) || null;
  const end = first(query.ct1) || null;
  const timestamp = first(query.cb) || null;

  const malformed =
    first(query.cc) !== BTC_COSMOGRAPHER_CONTEXT_SCHEMA ||
    !DOMAINS.includes(domain) ||
    !subject ||
    subject.length > 80 ||
    parsedIntents.length === 0 ||
    parsedIntents.some((intent) => !INTENTS.includes(intent)) ||
    !ANSWER_STATES.includes(state) ||
    (market !== null && !MARKET_CLASSES.includes(market)) ||
    ((start === null) !== (end === null)) ||
    (start !== null && !validDate(start)) ||
    (end !== null && !validDate(end)) ||
    (timestamp !== null && !validTimestamp(timestamp));

  if (malformed) return { present: true, malformed: true, packet: null };

  return {
    present: true,
    malformed: false,
    packet: {
      schema: BTC_COSMOGRAPHER_CONTEXT_SCHEMA,
      prior_domain: domain,
      prior_subject: subject,
      prior_intents: unique(parsedIntents),
      prior_answer_state: state,
      prior_market_question_class: market,
      prior_time_start: start,
      prior_time_end: end,
      prior_snapshot_generated_at_utc: timestamp,
    },
  };
}

export function serializeBtcCosmographerContext(
  route: BtcCosmographerRoute,
  answerState: BtcCosmographerAnswerState,
  snapshotTimestamp: string | null,
): Record<string, string> {
  return {
    cc: BTC_COSMOGRAPHER_CONTEXT_SCHEMA,
    cd: route.domain,
    cs: route.subject,
    ci: route.intents.join(","),
    ca: answerState,
    cm: route.market_question_class ?? "",
    ct0: route.time_range?.start ?? "",
    ct1: route.time_range?.end ?? "",
    cb: snapshotTimestamp ?? "",
  };
}
