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

const MONTHS: Array<[number, RegExp]> = [
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
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(new Date(`${value}T00:00:00Z`).getTime());
}

function validTimestamp(value: string): boolean {
  return !value || Number.isFinite(new Date(value).getTime());
}

function yearRange(year: number, firstHalf: boolean, secondHalf: boolean): BtcCosmographerTimeRange {
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
  const end = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return {
    start: `${year}-${String(month).padStart(2, "0")}-01`,
    end: `${year}-${String(month).padStart(2, "0")}-${String(end).padStart(2, "0")}`,
    label: `${year}-${String(month).padStart(2, "0")}`,
    source: "QUESTION",
  };
}

export function extractBtcCosmographerTimeRange(
  question: string,
  selectedDate?: string,
): BtcCosmographerTimeRange | null {
  const q = question.toLowerCase();
  const explicitDates = [...q.matchAll(/\b(20\d{2}-\d{2}-\d{2})\b/g)].map((match) => match[1]);
  if (explicitDates.length >= 2 && validDate(explicitDates[0]) && validDate(explicitDates[1])) {
    return {
      start: explicitDates[0],
      end: explicitDates[1],
      label: `${explicitDates[0]} — ${explicitDates[1]}`,
      source: "QUESTION",
    };
  }
  if (explicitDates.length === 1 && validDate(explicitDates[0])) {
    return {
      start: explicitDates[0],
      end: explicitDates[0],
      label: explicitDates[0],
      source: "QUESTION",
    };
  }

  const yearMatch = q.match(/\b(20\d{2})\b/);
  const year = yearMatch ? Number(yearMatch[1]) : null;
  if (year) {
    const firstHalf = /first\s+(?:six|6)\s+months|first\s+half|h1\b|первые?\s+(?:шесть|6)\s+месяц|перв(?:ая|ые)\s+половин|за\s+(?:шесть|6)\s+месяц/.test(q);
    const secondHalf = /last\s+(?:six|6)\s+months|second\s+half|h2\b|последн(?:ие|их)\s+(?:шесть|6)\s+месяц|втор(?:ая|ую)\s+половин/.test(q);
    const month = MONTHS.find(([, pattern]) => pattern.test(q))?.[0] ?? null;
    if (month) return monthRange(year, month);
    return yearRange(year, firstHalf, secondHalf);
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

function bodySubject(question: string): string | null {
  for (const [body, pattern] of BODY_PATTERNS) {
    if (pattern.test(question)) return body;
  }
  return null;
}

function protocolSubject(question: string): string | null {
  if (/halving|халвинг|сокращени[ея]\s+награ|уполовинив/i.test(question)) return "halving";
  if (/сколько.*(?:btc|биткоин|монет)|количеств.*(?:btc|биткоин|монет)|total\s+(?:btc|bitcoin)|max(?:imum)?\s+supply|circulating\s+supply|эмисси|предложени[ея]\s+btc|21\s*(?:m|million|млн)/i.test(question)) return "supply";
  if (/subsid|block reward|награда\s+за\s+блок|субсиди/i.test(question)) return "subsidy";
  if (/transaction fee|fees?\b|комисси/i.test(question)) return "fees";
  if (/difficulty|сложност/i.test(question)) return "difficulty";
  if (/mining|miner|майнинг|майнер/i.test(question)) return "mining";
  if (/utxo|unspent|неизрасходован/i.test(question)) return "utxo";
  if (/genesis|генезис|перв(?:ый|ого)\s+блок/i.test(question)) return "genesis";
  if (/consensus|proof.of.work|chainwork|консенсус|доказательств[ао]\s+работ/i.test(question)) return "consensus";
  if (/\bblock\b|height|chain tip|блок|высот/i.test(question)) return "blocks";
  if (/что такое\s+(?:btc|bitcoin|биткоин)|how\s+does\s+bitcoin\s+work|bitcoin\s+protocol|протокол\s+биткоин/i.test(question)) return "overview";
  return null;
}

function marketClass(question: string): BtcEnvelopeQuestionClass | null {
  const q = question.toLowerCase();
  if (/dominance|gravity|leadership|доминир|доминац|гравитац|лидерств/.test(q)) return "btc_gravity";
  if (/liquid|tvl|stablecoin|dex|ликвид|стейблкоин/.test(q)) return "liquidity";
  if (/breadth|rotation|altcoin|participation|eth|ширин|ротац|альткоин|участи/.test(q)) return "market_participation_rotation";
  if (/structure|regime|field score|market cap|структур|режим|капитализац/.test(q)) return "market_structure";
  if (/snapshot|memory|previous checkpoint|delta|снимок|памят|предыдущ|дельт|что изменилось/.test(q)) return "change_memory";
  if (/temporal pressure|market timing|market cycle|временн.*давлен|рыночн.*цикл/.test(q)) return "temporal_pressure";
  if (/btc field|market field|поле btc|общее поле|рынок btc|рынок биткоин/.test(q)) return "general_btc_field";
  return null;
}

function intents(question: string, domain: BtcCosmographerDomain, timeRange: BtcCosmographerTimeRange | null): BtcCosmographerIntent[] {
  const q = question.toLowerCase();
  const values: BtcCosmographerIntent[] = [];
  if (/сколько|какое количество|what is|how many|how much|maximum|максимальн/.test(q)) values.push("fact");
  if (/why|explain|how does|what should i know|почему|объясни|как устро|что нужно знать|что означает/.test(q)) values.push("explain");
  if (timeRange && (domain === "astromodule" || domain === "astro_btc_bridge")) values.push("interval_analysis");
  if (/compare|versus|vs\b|сравн|отличи|между/.test(q)) values.push("compare");
  if (/what changed|changed|change since|что измен|изменени/.test(q)) values.push("change");
  if (/why|matter|reason|important|почему|важно|причин/.test(q)) values.push("reason");
  if (/confirm|support|agree|подтверж|соглас/.test(q)) values.push("confirmation");
  if (/watch|next|condition|наблюд|дальше|услов/.test(q)) values.push("watch");
  if (/impact|influence|affect|correlat|coincid|relation|повлиял|влияни|связ|совпал|корреляц/.test(q)) values.push("bridge");
  if (domain === "navigation") values.push("navigate");
  if (!values.length) values.push(domain === "bitcoin_protocol" ? "explain" : "fact");
  return unique(values);
}

function explicitEntities(question: string): string[] {
  const entities: string[] = [];
  const body = bodySubject(question);
  if (body) entities.push(body);
  const protocol = protocolSubject(question);
  if (protocol) entities.push(protocol);
  const market = marketClass(question);
  if (market) entities.push(market);
  return unique(entities);
}

function isMethodology(question: string): boolean {
  return /source|proof|method|methodology|where.*data|источник|доказатель|методик|откуда.*данн/.test(question);
}

function isNavigation(question: string): boolean {
  return /what can you do|how can i ask|available routes|capabilit|что ты умеешь|какие вопросы|маршрут|возможност/.test(question);
}

function isReturn(question: string): boolean {
  return /back to|return to|верн[её]мся|вернуться|снова к/.test(question);
}

function isPureReferent(question: string): boolean {
  return /^(?:why|why\?|what about that|and this|it|this|that|them|почему|почему\?|а это|это|этот|эта|они|там)[\s?.!]*$/i.test(question.trim());
}

function isFollowUpPhrase(question: string): boolean {
  return /^(?:and|what about|how about|so|then|а\s|а$|и\s|тогда|почему|что важнее|какие показатели|что изменит)/i.test(question.trim());
}

function inferDomain(
  question: string,
  protocol: string | null,
  body: string | null,
  market: BtcEnvelopeQuestionClass | null,
): BtcCosmographerDomain {
  const hasBtc = /\bbtc\b|\bbitcoin\b|биткоин/i.test(question);
  if (body && (market || hasBtc)) return "astro_btc_bridge";
  if (body || /astromodule|астромодул|planet|планет|retrograd|ретроград|aspect|аспект|eclipse|затмени/.test(question)) return "astromodule";
  if (protocol) return "bitcoin_protocol";
  if (market === "change_memory") return "snapshot_memory";
  if (market) return "btc_market";
  if (isMethodology(question)) return "methodology";
  if (isNavigation(question)) return "navigation";
  if (hasBtc) return "bitcoin_protocol";
  return "unsupported";
}

function relationFor(
  question: string,
  domain: BtcCosmographerDomain,
  subject: string,
  packet: BtcCosmographerContextPacket | null,
  explicit: boolean,
): BtcCosmographerContextRelation {
  if (domain === "astro_btc_bridge") return "CROSS_MODULE_BRIDGE";
  if (isReturn(question)) return "RETURN_TO_PREVIOUS_TOPIC";
  if (!packet) return explicit ? "NEW_TOPIC" : "GENUINELY_AMBIGUOUS";
  if (explicit && (domain !== packet.prior_domain || subject !== packet.prior_subject)) return "NEW_TOPIC";
  if (explicit) return "FOLLOW_UP";
  if (isPureReferent(question) || isFollowUpPhrase(question)) return "FOLLOW_UP";
  return "GENUINELY_AMBIGUOUS";
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
  const body = bodySubject(q);
  const market = marketClass(q);
  const inferredDomain = inferDomain(q, protocol, body, market);
  const contextBridge = Boolean(
    packet &&
    market &&
    ["astromodule", "astro_btc_bridge"].includes(packet.prior_domain) &&
    /confirm|support|agree|coincid|relation|подтверж|соглас|совпал|связ/.test(q)
  );
  const domain: BtcCosmographerDomain = contextBridge ? "astro_btc_bridge" : inferredDomain;
  const timeRange = extractBtcCosmographerTimeRange(q, selectedDate);
  const subject =
    (contextBridge ? packet?.prior_subject ?? null : null) ??
    body ??
    protocol ??
    market ??
    (domain === "methodology" ? "source_and_method" :
      domain === "navigation" ? "capabilities" :
        domain === "bitcoin_protocol" ? "overview" :
          domain === "unsupported" ? "unknown" : "general");
  const entityList = explicitEntities(q);
  const explicit = entityList.length > 0 || domain === "methodology" || domain === "navigation";
  const contextRelation = relationFor(q, domain, subject, packet, explicit);
  const resolvedDomain =
    contextRelation === "FOLLOW_UP" && domain === "unsupported" && packet
      ? packet.prior_domain
      : domain;
  const resolvedSubject =
    contextRelation === "FOLLOW_UP" && subject === "unknown" && packet
      ? packet.prior_subject
      : subject;
  const resolvedMarket =
    resolvedDomain === "btc_market" || resolvedDomain === "snapshot_memory" || resolvedDomain === "astro_btc_bridge"
      ? market ?? packet?.prior_market_question_class ?? "general_btc_field"
      : null;
  const confidence =
    resolvedDomain === "unsupported" || contextRelation === "GENUINELY_AMBIGUOUS"
      ? "LOW"
      : explicit || contextRelation === "FOLLOW_UP"
        ? "HIGH"
        : "BOUNDED";
  return {
    schema: BTC_COSMOGRAPHER_ROUTE_SCHEMA,
    locale,
    raw_question: rawQuestion,
    normalized_question: normalized,
    domain: resolvedDomain,
    subject: resolvedSubject,
    intents: intents(q, resolvedDomain, timeRange),
    context_relation: contextRelation,
    time_range: timeRange ?? (
      ["FOLLOW_UP", "CROSS_MODULE_BRIDGE", "RETURN_TO_PREVIOUS_TOPIC"].includes(contextRelation) && packet?.prior_time_start && packet.prior_time_end
        ? {
            start: packet.prior_time_start,
            end: packet.prior_time_end,
            label: `${packet.prior_time_start} — ${packet.prior_time_end}`,
            source: "CONTEXT",
          }
        : null
    ),
    market_question_class: resolvedMarket,
    capability_id: `${resolvedDomain}.${resolvedSubject}`,
    confidence,
    explicit_entities: entityList,
  };
}

export function parseBtcCosmographerContext(query: QueryLike): BtcCosmographerParsedContext {
  const schema = first(query.cc);
  const fields = ["cd", "cs", "ci", "ca", "cm", "ct0", "ct1", "cb"];
  const present = Boolean(schema || fields.some((field) => first(query[field])));
  if (!present) return { present: false, malformed: false, packet: null };
  const domain = first(query.cd) as BtcCosmographerDomain;
  const subject = first(query.cs);
  const parsedIntents = first(query.ci).split(",").filter(Boolean) as BtcCosmographerIntent[];
  const state = first(query.ca) as BtcCosmographerAnswerState;
  const marketRaw = first(query.cm);
  const market = marketRaw ? marketRaw as BtcEnvelopeQuestionClass : null;
  const start = first(query.ct0) || null;
  const end = first(query.ct1) || null;
  const timestamp = first(query.cb) || null;
  if (
    schema !== BTC_COSMOGRAPHER_CONTEXT_SCHEMA ||
    !DOMAINS.includes(domain) ||
    !subject ||
    subject.length > 80 ||
    parsedIntents.some((intent) => !INTENTS.includes(intent)) ||
    !ANSWER_STATES.includes(state) ||
    (market !== null && !MARKET_CLASSES.includes(market)) ||
    (start !== null && !validDate(start)) ||
    (end !== null && !validDate(end)) ||
    !validTimestamp(timestamp ?? "")
  ) {
    return { present: true, malformed: true, packet: null };
  }
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
