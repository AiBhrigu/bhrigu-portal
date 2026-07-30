import type { BtcEnvelopeQuestionClass } from "./btc-market-envelope";
import type { BtcQuestionFacet, BtcQuestionSpecificAnswerState } from "./btc-executive-question-language";
import type { BtcPublicLocale } from "./btc-public-language-contract";

export const BTC_FOLLOW_UP_CONTEXT_SCHEMA = "btc_follow_up_context_v0_1" as const;

export type BtcFollowUpContextPacket = {
  version: typeof BTC_FOLLOW_UP_CONTEXT_SCHEMA;
  prior_question_class: BtcEnvelopeQuestionClass;
  prior_question_facets: BtcQuestionFacet[];
  prior_answer_state: BtcQuestionSpecificAnswerState;
  prior_observation_date: string | null;
  prior_snapshot_generated_at_utc: string | null;
};

export type BtcContextRelation =
  | "EXPLAIN_PRIOR"
  | "PRIORITY_WITHIN_PRIOR"
  | "CONFIRM_WITH_MODULE"
  | "COMPARE_MEMORY"
  | "CHANGE_CONDITION"
  | "EXPAND_RELATED_CLASS"
  | "EXPLAIN_CONTRADICTION";

export type BtcFollowUpClarificationReason =
  | "NO_PRIOR_CONTEXT"
  | "AMBIGUOUS_REFERENT"
  | "UNSUPPORTED_CONTEXT"
  | "CONTEXT_STALE"
  | "LOCALE_MISMATCH";

export type BtcResolvedFollowUp =
  | {
      status: "RESOLVED";
      raw_question: string;
      effective_question: string;
      inherited_question_class: BtcEnvelopeQuestionClass;
      resolved_facets: BtcQuestionFacet[];
      context_relation: BtcContextRelation;
    }
  | {
      status: "CLARIFICATION_REQUIRED";
      raw_question: string;
      reason: BtcFollowUpClarificationReason;
      clarification_prompt: string;
    };

export type BtcFollowUpPacketParse =
  | { present: false; packet: null; malformed: false }
  | { present: true; packet: BtcFollowUpContextPacket; malformed: false }
  | { present: true; packet: null; malformed: true };

const CLASSES: BtcEnvelopeQuestionClass[] = [
  "btc_gravity",
  "market_structure",
  "liquidity",
  "market_participation_rotation",
  "change_memory",
  "temporal_pressure",
  "general_btc_field",
];

const FACETS: BtcQuestionFacet[] = [
  "change",
  "reason",
  "confirmation",
  "watch",
  "comparison",
  "temporal_context",
];

const STATES: BtcQuestionSpecificAnswerState[] = ["CONFIRMED", "SPLIT", "LIMITED"];

const SUBJECT: Record<BtcPublicLocale, Record<BtcEnvelopeQuestionClass, string>> = {
  en: {
    btc_gravity: "BTC dominance, leadership and wider market gravity",
    market_structure: "market structure, regime, Market Field Score and market capitalization",
    liquidity: "stablecoin liquidity, DeFi TVL and DEX activity",
    market_participation_rotation: "altcoin breadth, ETH rotation and wider market participation",
    change_memory: "accepted Snapshot Memory and the previous compatible checkpoint",
    temporal_pressure: "the selected observation date, temporal pressure and cycle context",
    general_btc_field: "the current BTC field across gravity, structure, liquidity and participation",
  },
  ru: {
    btc_gravity: "доминирование BTC, его лидерство и гравитация широкого рынка",
    market_structure: "структура рынка, режим, Market Field Score и капитализация",
    liquidity: "ликвидность стейблкоинов, DeFi TVL и активность DEX",
    market_participation_rotation: "ширина альткоинов, ротация ETH и участие рынка",
    change_memory: "принятая Snapshot Memory и предыдущая совместимая контрольная точка",
    temporal_pressure: "выбранная дата наблюдения, временное давление и контекст цикла",
    general_btc_field: "текущее поле BTC: гравитация, структура, ликвидность и участие",
  },
};

function first(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function validDate(value: string): boolean {
  return !value || /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function validTimestamp(value: string): boolean {
  return !value || (
    value.length <= 40 &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value) &&
    Number.isFinite(new Date(value).getTime())
  );
}

export function parseBtcFollowUpContext(
  query: Record<string, string | string[] | undefined>,
): BtcFollowUpPacketParse {
  const fields = ["fc", "pc", "pf", "ps", "pd", "pt"];
  const present = fields.some((name) => first(query[name]).length > 0);
  if (!present) return { present: false, packet: null, malformed: false };

  const version = first(query.fc);
  const questionClass = first(query.pc);
  const facets = first(query.pf).split(",").filter(Boolean);
  const state = first(query.ps);
  const observationDate = first(query.pd);
  const timestamp = first(query.pt);

  if (
    version !== BTC_FOLLOW_UP_CONTEXT_SCHEMA ||
    !CLASSES.includes(questionClass as BtcEnvelopeQuestionClass) ||
    facets.length > FACETS.length ||
    facets.some((facet) => !FACETS.includes(facet as BtcQuestionFacet)) ||
    !STATES.includes(state as BtcQuestionSpecificAnswerState) ||
    !validDate(observationDate) ||
    !validTimestamp(timestamp)
  ) {
    return { present: true, packet: null, malformed: true };
  }

  return {
    present: true,
    malformed: false,
    packet: {
      version: BTC_FOLLOW_UP_CONTEXT_SCHEMA,
      prior_question_class: questionClass as BtcEnvelopeQuestionClass,
      prior_question_facets: Array.from(new Set(facets)) as BtcQuestionFacet[],
      prior_answer_state: state as BtcQuestionSpecificAnswerState,
      prior_observation_date: observationDate || null,
      prior_snapshot_generated_at_utc: timestamp || null,
    },
  };
}

const UNSAFE = /(?:\bbuy\b|\bsell\b|\blong\b|\bshort\b|\bleverage\b|\bentry\b|\bexit\b|price target|trade signal|wallet|seed phrase|private key|forecast|predict|prediction|купить|продать|лонг|шорт|плеч|точк\w*\s+(?:вход|выход)|ценов\w*\s+цел|кошел[её]к|сид[- ]?фраз|приватн\w*\s+ключ|прогноз|предскаж)/i;
const EXPLAIN = /^(?:so\s+)?(?:why|why\?|why does (?:that|this|it) matter|how should i read (?:that|this|it)|почему|почему\?|почему это важно|как это читать)[\s?.!]*$/i;
const PRIORITY = /what (?:matters|is) most|which (?:signal|part|factor) is stronger|что (?:здесь|из этого)?\s*важнее|какой сигнал сильнее/i;
const CHANGE_CONDITION = /what would change (?:this|that|the read|this read)|what should i watch next|when would (?:this|that) no longer hold|что изменит (?:это|этот вывод|чтение)|за чем наблюдать дальше|когда вывод перестанет/i;
const MEMORY_COMPARE = /compare (?:it |this |that )?(?:with|to) (?:the )?previous snapshot|previous checkpoint|what changed since (?:then|the previous)|сравни .*предыдущ|предыдущ(?:им|ей) сним|контрольн\w+ точк|что изменилось с тех пор/i;
const CONTRADICTION = /why (?:is|does) (?:that|this|the) contradiction|why does (?:that|this) limit matter|почему .*противореч|почему .*границ.*важ/i;
const CONFIRM = /does .*confirm (?:it|this|that)|does .*support (?:it|this|that)|подтвержда.*(?:это|вывод)|(?:это|вывод).*подтвержда|поддержива.*(?:это|вывод)|(?:это|вывод).*поддержива/i;
const EXPAND = /^(?:and|what about|how about|а|что насч[её]т)\b/i;
const AMBIGUOUS_ONLY = /^(?:it|this|that|them|there|это|этот|эта|они|там)[\s?.!]*$/i;
const STALE_REFERENT = /\bthen\b|since then|back then|тогда|с тех пор/i;

export function isBtcContextualFollowUp(question: string): boolean {
  const normalized = question.trim();
  if (!normalized) return false;
  const hasReferent = /\b(?:it|this|that)\b|(?:это|этот|эта|прошл\w+\s+ответ)/i.test(normalized);
  const hasExplicitSubject = /btc\s+(?:dominance|gravity|leadership|field)|altcoin\s+(?:breadth|rotation|participation)|eth\s+rotation|stablecoin|defi\s+tvl|dex|market\s+field\s+score|market\s+cap|accepted\s+snapshot\s+memory|selected\s+date|доминир\w*\s+btc|гравитац\w*\s+btc|лидерств\w*\s+btc|ширин\w*\s+альткоин|ротац\w*\s+(?:альткоин|eth)|ликвидн|стейблкоин|капитализац|принят\w*\s+(?:snapshot\s+memory|памят\w*)|выбранн\w*\s+дат/i.test(normalized);
  if (hasExplicitSubject && !hasReferent && !EXPAND.test(normalized)) return false;
  if (normalized.length <= 96 && (
    EXPLAIN.test(normalized) ||
    PRIORITY.test(normalized) ||
    CHANGE_CONDITION.test(normalized) ||
    MEMORY_COMPARE.test(normalized) ||
    CONTRADICTION.test(normalized) ||
    CONFIRM.test(normalized) ||
    EXPAND.test(normalized) ||
    AMBIGUOUS_ONLY.test(normalized)
  )) return true;
  return hasReferent;
}

function explicitClass(question: string): BtcEnvelopeQuestionClass | null {
  const q = question.toLowerCase();
  if (/dominance|gravity|leadership|доминир|доминац|гравитац|лидерств/.test(q)) return "btc_gravity";
  if (/liquid|tvl|stablecoin|dex|ликвид|стейблкоин/.test(q)) return "liquidity";
  if (/breadth|rotation|altcoin|participation|eth|ширин|ротац|альткоин|участи/.test(q)) return "market_participation_rotation";
  if (/structure|regime|field score|market cap|структур|режим|капитализац/.test(q)) return "market_structure";
  if (/snapshot|memory|previous checkpoint|delta|снимок|памят|предыдущ|дельт/.test(q)) return "change_memory";
  if (/temporal|pressure|date|phase|tension|timing|cycle|временн|давлен|дата|фаз|напряж|цикл/.test(q)) return "temporal_pressure";
  if (/btc field|market field|поле btc|общее поле/.test(q)) return "general_btc_field";
  return null;
}

function facetsFor(relation: BtcContextRelation, packet: BtcFollowUpContextPacket): BtcQuestionFacet[] {
  const facets = [...packet.prior_question_facets];
  const add = (facet: BtcQuestionFacet) => {
    if (!facets.includes(facet)) facets.push(facet);
  };
  if (relation === "EXPLAIN_PRIOR" || relation === "PRIORITY_WITHIN_PRIOR" || relation === "EXPLAIN_CONTRADICTION") add("reason");
  if (relation === "CONFIRM_WITH_MODULE") add("confirmation");
  if (relation === "COMPARE_MEMORY") {
    add("comparison");
    add("change");
  }
  if (relation === "CHANGE_CONDITION") add("watch");
  return facets;
}

function clarification(
  locale: BtcPublicLocale,
  rawQuestion: string,
  reason: BtcFollowUpClarificationReason,
  packet: BtcFollowUpContextPacket | null,
): BtcResolvedFollowUp {
  const subjects = packet
    ? [SUBJECT[locale][packet.prior_question_class], locale === "ru" ? "противоречие или граница" : "the contradiction or limit", locale === "ru" ? "условие изменения вывода" : "what would change the read"]
    : [locale === "ru" ? "гравитация BTC" : "BTC gravity", locale === "ru" ? "ликвидность" : "liquidity", locale === "ru" ? "структура рынка" : "market structure"];

  const prompt = reason === "UNSUPPORTED_CONTEXT"
    ? (locale === "ru"
      ? "Этот бесплатный исследовательский диалог не даёт прогнозов, торговых сигналов, ценовых целей или советов по кошельку. Сформулируйте вопрос о текущем проверенном поле BTC."
      : "This free research dialogue does not provide forecasts, trading signals, price targets or wallet advice. Ask about the current verified BTC field.")
    : (locale === "ru"
      ? `Уточните, к какой части прошлого ответа относится вопрос: ${subjects.slice(0, 3).join("; ")}.`
      : `Clarify which part of the previous answer you mean: ${subjects.slice(0, 3).join("; ")}.`);

  return {
    status: "CLARIFICATION_REQUIRED",
    raw_question: rawQuestion,
    reason,
    clarification_prompt: prompt,
  };
}

function effective(
  locale: BtcPublicLocale,
  relation: BtcContextRelation,
  prior: BtcEnvelopeQuestionClass,
  target: BtcEnvelopeQuestionClass,
): string {
  const priorSubject = SUBJECT[locale][prior];
  const targetSubject = SUBJECT[locale][target];

  if (locale === "ru") {
    switch (relation) {
      case "EXPLAIN_PRIOR":
        return `${priorSubject}. Почему это важно для текущего поля BTC?`;
      case "PRIORITY_WITHIN_PRIOR":
        return `${priorSubject}. Что здесь важнее и почему, без прогноза?`;
      case "CONFIRM_WITH_MODULE":
        return `${targetSubject}. Подтверждает ли это предыдущее чтение про ${priorSubject} или ослабляет его?`;
      case "COMPARE_MEMORY":
        return "Что изменилось в принятой Snapshot Memory по сравнению с предыдущим совместимым снимком?";
      case "CHANGE_CONDITION":
        return `${priorSubject}. За чем наблюдать дальше и что изменит этот вывод?`;
      case "EXPAND_RELATED_CLASS":
        return `${targetSubject}. Что это показывает относительно прошлого чтения про ${priorSubject}?`;
      case "EXPLAIN_CONTRADICTION":
        return `${priorSubject}. Почему противоречие или граница прошлого чтения важны?`;
    }
  }

  switch (relation) {
    case "EXPLAIN_PRIOR":
      return `${priorSubject}. Why does this matter in the current BTC field?`;
    case "PRIORITY_WITHIN_PRIOR":
      return `${priorSubject}. Which accepted signal matters most and why, without a forecast?`;
    case "CONFIRM_WITH_MODULE":
      return `${targetSubject}. Does this confirm or weaken the previous read about ${priorSubject}?`;
    case "COMPARE_MEMORY":
      return "What changed in accepted Snapshot Memory compared with the previous compatible snapshot?";
    case "CHANGE_CONDITION":
      return `${priorSubject}. What should I watch next and what would change this read?`;
    case "EXPAND_RELATED_CLASS":
      return `${targetSubject}. What does this show relative to the previous read about ${priorSubject}?`;
    case "EXPLAIN_CONTRADICTION":
      return `${priorSubject}. Why does the contradiction or limit in the previous read matter?`;
  }
}

export function resolveBtcFollowUp(
  locale: BtcPublicLocale,
  rawQuestion: string,
  packet: BtcFollowUpContextPacket | null,
  currentSnapshotTimestamp: string | null,
): BtcResolvedFollowUp {
  const question = rawQuestion.trim();
  if (UNSAFE.test(question)) return clarification(locale, question, "UNSUPPORTED_CONTEXT", packet);
  if (!packet) return clarification(locale, question, "NO_PRIOR_CONTEXT", null);

  if (
    STALE_REFERENT.test(question) &&
    packet.prior_snapshot_generated_at_utc &&
    currentSnapshotTimestamp &&
    packet.prior_snapshot_generated_at_utc !== currentSnapshotTimestamp
  ) {
    return clarification(locale, question, "CONTEXT_STALE", packet);
  }

  if (AMBIGUOUS_ONLY.test(question)) {
    return clarification(locale, question, "AMBIGUOUS_REFERENT", packet);
  }

  const named = explicitClass(question);
  let relation: BtcContextRelation;
  let target = packet.prior_question_class;

  if (MEMORY_COMPARE.test(question)) {
    relation = "COMPARE_MEMORY";
    target = "change_memory";
  } else if (CHANGE_CONDITION.test(question)) {
    relation = "CHANGE_CONDITION";
  } else if (CONTRADICTION.test(question)) {
    if (packet.prior_answer_state !== "SPLIT") {
      return clarification(locale, question, "AMBIGUOUS_REFERENT", packet);
    }
    relation = "EXPLAIN_CONTRADICTION";
  } else if (PRIORITY.test(question)) {
    relation = "PRIORITY_WITHIN_PRIOR";
  } else if (CONFIRM.test(question) && named) {
    relation = "CONFIRM_WITH_MODULE";
    target = named;
  } else if ((EXPAND.test(question) || named) && named) {
    relation = "EXPAND_RELATED_CLASS";
    target = named;
  } else if (EXPLAIN.test(question)) {
    relation = "EXPLAIN_PRIOR";
  } else {
    return clarification(locale, question, "AMBIGUOUS_REFERENT", packet);
  }

  return {
    status: "RESOLVED",
    raw_question: question,
    effective_question: effective(locale, relation, packet.prior_question_class, target),
    inherited_question_class: target,
    resolved_facets: facetsFor(relation, packet),
    context_relation: relation,
  };
}
