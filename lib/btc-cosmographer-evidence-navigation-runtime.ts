import type { BtcPublicLocale } from "./btc-public-language-contract";
import type {
  BtcCosmographerAnswerState,
  BtcCosmographerContextPacket,
  BtcCosmographerDomain,
  BtcCosmographerIntent,
  BtcCosmographerRoute,
} from "./btc-cosmographer-route-graph";
import type { BtcCosmographerAnswerProjection } from "./btc-protocol-evidence";

export const BTC_EVIDENCE_NAVIGATION_RUNTIME_SCHEMA =
  "btc_cosmographer_evidence_navigation_runtime_v0_1" as const;

export type BtcEvidenceLevel = "L0" | "L1" | "L2" | "L3" | "L4" | "L5";
export type BtcRouteDisposition = "CONTINUE" | "CLARIFY" | "STOP";
export type BtcClarificationTarget = "SUBJECT" | "PERIOD" | "RELATION_OBJECT" | "ASSET";
export type BtcStopReason =
  | "ANSWER_COMPLETE"
  | "MISSING_EVIDENCE"
  | "OUT_OF_SCOPE"
  | "REPEATED_ROUTE"
  | "MODE_TRANSITION_NOT_EXPLICIT";
export type BtcNextQuestionType = "FACT" | "CONTRADICTION" | "TIME" | "EXPLICIT_BRIDGE" | "PROOF";
export type BtcSideStateType = "MARKET" | "SNAPSHOT" | "PROTOCOL";
export type BtcBridgeResult =
  | "MARKET_CONFIRMED"
  | "TEMPORAL_CONCURRENCE_ONLY"
  | "DIVERGENCE"
  | "INSUFFICIENT_DUAL_EVIDENCE";
export type BtcRelationResolution =
  | "SINGLE_DOMAIN"
  | "TWO_DOMAINS_RESOLVED"
  | "SECOND_DOMAIN_UNRESOLVED";

export type BtcRelationIntentResolution<T extends BtcCosmographerRoute = BtcCosmographerRoute> = {
  route: T;
  relation_resolution: BtcRelationResolution;
  btc_side_state_type: BtcSideStateType | null;
};

export type BtcEvidenceNavigationRuntimeDecision = {
  schema: typeof BTC_EVIDENCE_NAVIGATION_RUNTIME_SCHEMA;
  route_disposition: BtcRouteDisposition;
  primary_authority: string;
  evidence_levels: BtcEvidenceLevel[];
  btc_side_state_type: BtcSideStateType | null;
  bridge_result: BtcBridgeResult | null;
  relation_resolution: BtcRelationResolution;
  clarification_target: BtcClarificationTarget | null;
  clarification_text: string | null;
  clarification_fingerprint: string | null;
  show_clarification: boolean;
  next_question_type: BtcNextQuestionType | null;
  next_question_text: string | null;
  next_question_fingerprint: string | null;
  show_next_question: boolean;
  render_gate: {
    direct_answer_relevant: boolean;
    user_intent_resolved: boolean;
    new_information_gain: boolean;
    mode_transition_safe: boolean;
    evidence_available: boolean;
    semantic_repeat: boolean;
  };
  anti_loop_blocked: boolean;
  valid_route_stop: boolean;
  stop_reason: BtcStopReason | null;
  context_safe_composer: boolean;
};

type SourceContext = {
  state: string;
  generated_at_utc: string | null;
  proof_available: boolean;
};

export type BtcRetainedAstroRelationMemory = {
  domain: "astromodule";
  subject: string;
  start: string;
  end: string;
};

const AUTHORITY_BY_DOMAIN: Record<BtcCosmographerDomain, { authority: string; levels: BtcEvidenceLevel[] }> = {
  bitcoin_protocol: {
    authority: "AUTHORITATIVE_PROTOCOL_SOURCE_OR_ACCEPTED_CHAIN_STATE",
    levels: ["L1", "L2", "L3"],
  },
  btc_market: {
    authority: "ACCEPTED_MARKET_RECORD_AND_VERIFIED_MARKET_DERIVATIONS",
    levels: ["L1", "L2", "L3"],
  },
  snapshot_memory: {
    authority: "CURRENT_AND_PREVIOUS_ACCEPTED_MARKET_SNAPSHOTS",
    levels: ["L1", "L2", "L3"],
  },
  astromodule: {
    authority: "EPHEMERIS_SOURCE_AND_VERIFIED_ASTRONOMICAL_DERIVATIONS",
    levels: ["L1", "L2", "L3"],
  },
  astro_btc_bridge: {
    authority: "BTC_SIDE_STATE_PLUS_ASTRO_WINDOW_WITHOUT_CAUSAL_AUTHORITY",
    levels: ["L1", "L2", "L3", "L4"],
  },
  methodology: {
    authority: "VERSIONED_SOURCE_RECORDS_VALIDATION_LEDGER_AND_METHOD_STATUS",
    levels: ["L1", "L2", "L5"],
  },
  navigation: {
    authority: "EXPLICIT_USER_INTENT_AND_ACTIVE_STATE_PACKET",
    levels: ["L0"],
  },
  unsupported: {
    authority: "EXPLICIT_USER_INTENT_AND_ACTIVE_STATE_PACKET",
    levels: ["L0"],
  },
};

const BODY_REFERENCE = /\b(?:sun|moon|mercury|venus|mars|jupiter|saturn|uranus|neptune|pluto|planetary aspects?)\b|солнц|лун|меркур|венер|марс|юпитер|сатурн|уран|нептун|плутон|планетарн.*аспект/i;
const BTC_REFERENCE = /\bbtc\b|\bbitcoin\b|бит(?:коин|койн|окин|окйн|коина|койна)/i;
const SNAPSHOT_REFERENCE = /snapshot|снимок|памят|previous checkpoint|delta|дельт/i;
const PROTOCOL_REFERENCE = /halving|халвинг|protocol|протокол|block height|высот.*блок|supply|эмисси|consensus|консенсус/i;
const MARKET_REFERENCE = /market|рынок|liquid|ликвид|structure|структур|regime|режим|dominance|доминир|volatil|волатиль/i;
const RELATION_OPERATOR = /impact|influence|affect|correlat|coincid|relat(?:e|ed|es|ing|ion)?|compare|versus|\bvs\b|повлиял|влияни|связ|совпал|корреляц|сравн|между|подтверж/i;
const UNRESOLVED_PRONOUN = /^(?:it|this|that|them|what about it|and this|это|этот|эта|они|а это|и это|там)\b/i;
const RELATION_OBJECT_PRONOUN = /\b(?:it|this|that|them|это|этот|эта|они|там)\b/i;
const TEMPORAL_LANGUAGE = /when|period|window|date|day|month|year|когда|период|окно|дата|день|месяц|год/i;
const OUT_OF_SCOPE_TRADING = /buy|sell|long|short|leverage|position size|stop[- ]?loss|take[- ]?profit|allocate|portfolio|купить|продать|лонг|шорт|плечо|стоп[- ]?лосс|тейк[- ]?профит|дол[юя].*портфел/i;
const UNSUPPORTED_ASSET = /\beth\b|ethereum|эфириум|\bsol\b|solana|солан/i;

function unique<T>(values: T[]): T[] {
  return Array.from(new Set(values));
}

function hasAstroObject(
  route: BtcCosmographerRoute,
  question: string,
  packet: BtcCosmographerContextPacket | null,
  retainedAstroMemory: BtcRetainedAstroRelationMemory | null,
): boolean {
  return route.domain === "astromodule" ||
    route.domain === "astro_btc_bridge" ||
    BODY_REFERENCE.test(question) ||
    packet?.prior_domain === "astromodule" ||
    packet?.prior_domain === "astro_btc_bridge" ||
    retainedAstroMemory?.domain === "astromodule";
}

function btcSideTypeFromDomain(domain: BtcCosmographerDomain): BtcSideStateType | null {
  if (domain === "snapshot_memory") return "SNAPSHOT";
  if (domain === "bitcoin_protocol") return "PROTOCOL";
  if (domain === "btc_market" || domain === "astro_btc_bridge") return "MARKET";
  return null;
}

function explicitBtcSideType(route: BtcCosmographerRoute, question: string): BtcSideStateType | null {
  if (SNAPSHOT_REFERENCE.test(question) || route.domain === "snapshot_memory") return "SNAPSHOT";
  if (PROTOCOL_REFERENCE.test(question) || route.domain === "bitcoin_protocol") return "PROTOCOL";
  if (BTC_REFERENCE.test(question) || MARKET_REFERENCE.test(question) || route.domain === "btc_market" || route.domain === "astro_btc_bridge") return "MARKET";
  return null;
}

function priorBtcSideType(packet: BtcCosmographerContextPacket | null): BtcSideStateType | null {
  return packet ? btcSideTypeFromDomain(packet.prior_domain) : null;
}

function resolvedAstroSubject(
  route: BtcCosmographerRoute,
  packet: BtcCosmographerContextPacket | null,
  retainedAstroMemory: BtcRetainedAstroRelationMemory | null,
): string | null {
  if (route.domain === "astromodule" || route.domain === "astro_btc_bridge") return route.subject;
  if (packet?.prior_domain === "astromodule" || packet?.prior_domain === "astro_btc_bridge") return packet.prior_subject;
  if (retainedAstroMemory?.domain === "astromodule") return retainedAstroMemory.subject;
  const explicitBody = route.explicit_entities.find((value) => !value.startsWith("btc_") && value !== route.market_question_class);
  return explicitBody ?? null;
}

export function applyBtcRelationIntentPrecedence<T extends BtcCosmographerRoute>(
  route: T,
  rawQuestion: string,
  packet: BtcCosmographerContextPacket | null,
  retainedAstroMemory: BtcRetainedAstroRelationMemory | null = null,
): BtcRelationIntentResolution<T> {
  const question = rawQuestion.trim();
  if (!RELATION_OPERATOR.test(question)) {
    return {
      route,
      relation_resolution: "SINGLE_DOMAIN",
      btc_side_state_type: route.domain === "astro_btc_bridge"
        ? explicitBtcSideType(route, question) ?? priorBtcSideType(packet) ?? "MARKET"
        : null,
    };
  }

  const astroResolved = hasAstroObject(route, question, packet, retainedAstroMemory);
  const explicitBtcSide = explicitBtcSideType(route, question);
  const inheritedBtcSide = route.context_relation === "FOLLOW_UP" || route.context_relation === "CROSS_MODULE_BRIDGE"
    ? priorBtcSideType(packet)
    : null;
  const btcSide = explicitBtcSide ?? inheritedBtcSide;
  if (!astroResolved) {
    return {
      route,
      relation_resolution: "SECOND_DOMAIN_UNRESOLVED",
      btc_side_state_type: btcSide,
    };
  }
  if (!btcSide) {
    if (RELATION_OBJECT_PRONOUN.test(question)) {
      return {
        route,
        relation_resolution: "SECOND_DOMAIN_UNRESOLVED",
        btc_side_state_type: null,
      };
    }
    return {
      route,
      relation_resolution: "SINGLE_DOMAIN",
      btc_side_state_type: null,
    };
  }

  const subject = resolvedAstroSubject(route, packet, retainedAstroMemory) ?? route.subject;
  const marketQuestionClass = route.market_question_class ?? packet?.prior_market_question_class ?? "general_btc_field";
  const retainedTimeRange = retainedAstroMemory
    ? {
        start: retainedAstroMemory.start,
        end: retainedAstroMemory.end,
        label: `${retainedAstroMemory.start}–${retainedAstroMemory.end}`,
        source: "CONTEXT" as const,
      }
    : null;
  const bridgeRoute = {
    ...route,
    domain: "astro_btc_bridge",
    subject,
    intents: unique<BtcCosmographerIntent>([...route.intents, "bridge"]),
    context_relation: "CROSS_MODULE_BRIDGE",
    time_range: route.time_range ?? retainedTimeRange,
    market_question_class: marketQuestionClass,
    capability_id: `astro_btc_bridge.${subject}`,
    confidence: "HIGH",
    explicit_entities: unique([...route.explicit_entities, subject, `btc_side:${btcSide.toLowerCase()}`]),
  } as T;

  return {
    route: bridgeRoute,
    relation_resolution: "TWO_DOMAINS_RESOLVED",
    btc_side_state_type: btcSide,
  };
}

function clarificationTarget(route: BtcCosmographerRoute, relationResolution: BtcRelationResolution): BtcClarificationTarget {
  const question = route.normalized_question;
  if (UNSUPPORTED_ASSET.test(question) && !BTC_REFERENCE.test(question)) return "ASSET";
  if (relationResolution === "SECOND_DOMAIN_UNRESOLVED" || RELATION_OPERATOR.test(question)) return "RELATION_OBJECT";
  if (TEMPORAL_LANGUAGE.test(question) && !route.time_range) return "PERIOD";
  return "SUBJECT";
}

function clarificationText(locale: BtcPublicLocale, target: BtcClarificationTarget): string {
  const ru = locale === "ru";
  const values: Record<BtcClarificationTarget, [string, string]> = {
    SUBJECT: ["Уточните точный предмет: планета, рынок BTC, Snapshot, протокол Bitcoin или метод.", "Name the exact subject: a planet, BTC market, Snapshot, Bitcoin protocol, or method."],
    PERIOD: ["Уточните период или дату UTC, к которой относится вопрос.", "Specify the period or UTC date for the question."],
    RELATION_OBJECT: ["Назовите второй объект сопоставления: что именно нужно связать с первым доменом?", "Name the second comparison object: what exactly should be related to the first domain?"],
    ASSET: ["Этот коридор работает только с BTC. Уточните, что вопрос относится к Bitcoin или BTC.", "This corridor is BTC-only. Confirm that the question concerns Bitcoin or BTC."],
  };
  return ru ? values[target][0] : values[target][1];
}

function evidenceAvailable(route: BtcCosmographerRoute, answer: BtcCosmographerAnswerProjection, source: SourceContext): boolean {
  if (route.domain === "btc_market" || route.domain === "snapshot_memory") return source.proof_available;
  if (route.domain === "astro_btc_bridge") {
    const astroAvailable = !/unavailable|not yet accepted|недоступ|не принят/i.test(`${answer.proof_label} ${answer.source_boundary}`);
    return source.proof_available && astroAvailable;
  }
  if (route.domain === "unsupported") return false;
  return !/unavailable|not yet accepted|недоступ|не принят/i.test(`${answer.proof_label} ${answer.source_boundary}`);
}

function bridgeResult(
  route: BtcCosmographerRoute,
  answer: BtcCosmographerAnswerProjection,
  source: SourceContext,
): BtcBridgeResult | null {
  if (route.domain !== "astro_btc_bridge") return null;
  if (!evidenceAvailable(route, answer, source)) return "INSUFFICIENT_DUAL_EVIDENCE";
  if (answer.answer_state === "SPLIT") return "DIVERGENCE";
  if (answer.answer_state === "CONFIRMED" && route.intents.includes("confirmation")) return "MARKET_CONFIRMED";
  return "TEMPORAL_CONCURRENCE_ONLY";
}

function nextQuestion(
  locale: BtcPublicLocale,
  route: BtcCosmographerRoute,
  answer: BtcCosmographerAnswerProjection,
): { type: BtcNextQuestionType; text: string; targetMode: string; intent: string; evidenceFamily: string } {
  const ru = locale === "ru";
  if (answer.answer_state === "SPLIT") {
    return {
      type: "CONTRADICTION",
      text: ru ? "Какие факты создают расхождение и что его снимет?" : "Which facts create the divergence, and what would resolve it?",
      targetMode: route.domain,
      intent: "resolve_contradiction",
      evidenceFamily: route.domain === "astro_btc_bridge" ? "DUAL_PROOF" : "PRIMARY_AUTHORITY",
    };
  }
  if ((route.domain === "astromodule" || route.domain === "astro_btc_bridge") && !route.time_range) {
    return {
      type: "TIME",
      text: ru ? "Какой точный период нужно проверить?" : "Which exact period should be checked?",
      targetMode: route.domain,
      intent: "resolve_time",
      evidenceFamily: "ASTRO_EVIDENCE",
    };
  }
  if (route.domain === "astromodule") {
    return {
      type: "EXPLICIT_BRIDGE",
      text: ru ? "Сопоставить это окно с независимым состоянием BTC?" : "Compare this window with the independent BTC state?",
      targetMode: "astro_btc_bridge",
      intent: "explicit_bridge",
      evidenceFamily: "DUAL_PROOF",
    };
  }
  if (route.domain === "btc_market" || route.domain === "snapshot_memory") {
    return {
      type: "FACT",
      text: ru ? "Какое наблюдаемое условие изменит текущее чтение?" : "Which observable condition would change the current read?",
      targetMode: route.domain,
      intent: "conditions",
      evidenceFamily: "MARKET_EVIDENCE",
    };
  }
  return {
    type: "PROOF",
    text: ru ? "Какие источники, версия и граница подтверждают ответ?" : "Which sources, version, and boundary support the answer?",
    targetMode: "methodology",
    intent: "proof",
    evidenceFamily: "METHOD_PROOF",
  };
}

function fingerprint(parts: Array<string | null | undefined>): string {
  return parts
    .map((value) => (value ?? "").trim().toLowerCase().replace(/\s+/g, " "))
    .join("\u241f");
}

export function buildBtcEvidenceNavigationRuntimeDecision(
  locale: BtcPublicLocale,
  route: BtcCosmographerRoute,
  answer: BtcCosmographerAnswerProjection,
  source: SourceContext,
  relationResolution: BtcRelationResolution,
  btcSideStateType: BtcSideStateType | null,
): BtcEvidenceNavigationRuntimeDecision {
  const authority = AUTHORITY_BY_DOMAIN[route.domain];
  const bridge = bridgeResult(route, answer, source);
  const outOfScope = OUT_OF_SCOPE_TRADING.test(route.normalized_question);
  const genuinelyAmbiguous = route.context_relation === "GENUINELY_AMBIGUOUS" ||
    route.domain === "unsupported" ||
    route.confidence === "LOW" ||
    UNRESOLVED_PRONOUN.test(route.normalized_question);

  let routeDisposition: BtcRouteDisposition = "CONTINUE";
  let stopReason: BtcStopReason | null = null;
  let target: BtcClarificationTarget | null = null;

  if (outOfScope) {
    routeDisposition = "STOP";
    stopReason = "OUT_OF_SCOPE";
  } else if (relationResolution === "SECOND_DOMAIN_UNRESOLVED" || answer.answer_state === "CLARIFICATION" || genuinelyAmbiguous) {
    routeDisposition = "CLARIFY";
    target = clarificationTarget(route, relationResolution);
  } else if (answer.answer_state === "FAILURE" || bridge === "INSUFFICIENT_DUAL_EVIDENCE") {
    routeDisposition = "STOP";
    stopReason = "MISSING_EVIDENCE";
  }

  const available = evidenceAvailable(route, answer, source);
  const candidate = routeDisposition === "CONTINUE" ? nextQuestion(locale, route, answer) : null;
  const directAnswerRelevant = routeDisposition === "CONTINUE" && Boolean(answer.direct_answer.trim());
  const userIntentResolved = routeDisposition !== "CLARIFY";
  const newInformationGain = Boolean(candidate);
  const modeTransitionSafe = candidate?.type !== "EXPLICIT_BRIDGE" || route.domain === "astromodule";
  const candidateEvidenceAvailable = candidate?.type === "EXPLICIT_BRIDGE"
    ? source.proof_available
    : available;
  const semanticRepeat = false;
  const showNextQuestion = Boolean(
    candidate &&
    directAnswerRelevant &&
    userIntentResolved &&
    newInformationGain &&
    modeTransitionSafe &&
    candidateEvidenceAvailable &&
    !semanticRepeat,
  );
  const period = route.time_range ? `${route.time_range.start}:${route.time_range.end}` : "";
  const nextFingerprint = candidate
    ? fingerprint([candidate.type, candidate.targetMode, route.subject, candidate.intent, period, candidate.evidenceFamily])
    : null;
  const clarification = target ? clarificationText(locale, target) : null;
  const clarificationFingerprint = target
    ? fingerprint(["CLARIFY", target, route.subject, period])
    : null;

  return {
    schema: BTC_EVIDENCE_NAVIGATION_RUNTIME_SCHEMA,
    route_disposition: routeDisposition,
    primary_authority: authority.authority,
    evidence_levels: authority.levels,
    btc_side_state_type: route.domain === "astro_btc_bridge"
      ? btcSideStateType ?? "MARKET"
      : null,
    bridge_result: bridge,
    relation_resolution: relationResolution,
    clarification_target: target,
    clarification_text: clarification,
    clarification_fingerprint: clarificationFingerprint,
    show_clarification: routeDisposition === "CLARIFY" && Boolean(clarification),
    next_question_type: showNextQuestion ? candidate?.type ?? null : null,
    next_question_text: showNextQuestion ? candidate?.text ?? null : null,
    next_question_fingerprint: showNextQuestion ? nextFingerprint : null,
    show_next_question: showNextQuestion,
    render_gate: {
      direct_answer_relevant: directAnswerRelevant,
      user_intent_resolved: userIntentResolved,
      new_information_gain: newInformationGain,
      mode_transition_safe: modeTransitionSafe,
      evidence_available: candidateEvidenceAvailable,
      semantic_repeat: semanticRepeat,
    },
    anti_loop_blocked: false,
    valid_route_stop: true,
    stop_reason: stopReason,
    context_safe_composer: routeDisposition === "CONTINUE" && route.context_relation !== "GENUINELY_AMBIGUOUS",
  };
}

export function applyBtcRuntimeAntiLoop(
  decision: BtcEvidenceNavigationRuntimeDecision,
  priorNextFingerprints: string[],
  priorClarificationFingerprints: string[],
): BtcEvidenceNavigationRuntimeDecision {
  const repeatedNext = Boolean(
    decision.next_question_fingerprint &&
    priorNextFingerprints.includes(decision.next_question_fingerprint),
  );
  const repeatedClarification = Boolean(
    decision.clarification_fingerprint &&
    priorClarificationFingerprints.includes(decision.clarification_fingerprint),
  );
  if (!repeatedNext && !repeatedClarification) return decision;

  return {
    ...decision,
    route_disposition: "STOP",
    show_next_question: false,
    next_question_type: null,
    next_question_text: null,
    next_question_fingerprint: null,
    show_clarification: false,
    clarification_text: null,
    clarification_fingerprint: null,
    anti_loop_blocked: true,
    valid_route_stop: true,
    stop_reason: "REPEATED_ROUTE",
    context_safe_composer: repeatedNext && !repeatedClarification
      ? decision.context_safe_composer
      : false,
    render_gate: {
      ...decision.render_gate,
      semantic_repeat: true,
    },
  };
}

export function answerStateAllowsContext(answerState: BtcCosmographerAnswerState, disposition: BtcRouteDisposition): boolean {
  return disposition === "CONTINUE" && answerState !== "FAILURE" && answerState !== "CLARIFICATION";
}
