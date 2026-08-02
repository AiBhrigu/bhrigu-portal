import type { BtcEnvelopeQuestionClass } from "./btc-market-envelope";
import type { BtcPublicLocale } from "./btc-public-language-contract";
import type {
  BtcCosmographerAnswerState,
  BtcCosmographerContextRelation,
  BtcCosmographerDomain,
  BtcCosmographerIntent,
  BtcCosmographerRoute,
} from "./btc-cosmographer-route-graph";
import type {
  BtcBridgeResult,
  BtcClarificationTarget,
  BtcEvidenceLevel,
  BtcNextQuestionType,
  BtcRouteDisposition,
  BtcSideStateType,
  BtcStopReason,
} from "./btc-cosmographer-evidence-navigation-runtime";
import type {
  BtcCosmographerAnswerProjection,
  BtcCosmographerSection,
} from "./btc-protocol-evidence";

export const BTC_DIALOGUE_SESSION_SCHEMA =
  "btc_cosmographer_dialogue_session_v0_2" as const;
const BTC_DIALOGUE_LEGACY_SESSION_SCHEMA =
  "btc_free_dialogue_session_v0_1" as const;
export const BTC_DIALOGUE_SESSION_KEY =
  "bhrigu:btc-free-dialogue:session:v0_1" as const;
const BTC_DIALOGUE_PREVIOUS_SESSION_KEY =
  "bhrigu:btc-cosmographer:session:v0_2" as const;
export const BTC_DIALOGUE_SESSION_MAX_TURNS = 20;
export const BTC_DIALOGUE_SESSION_MIN_RETAINED_TURNS = 6;
export const BTC_DIALOGUE_SESSION_MAX_BYTES = 64 * 1024;

export type BtcDialogueAnswerState = BtcCosmographerAnswerState | "BOUNDED";

/**
 * Compatibility shell during the route-graph rebuild.
 * Legacy deterministic fields remain required so dormant source files compile;
 * route-graph fields are additive and are used by the new public component.
 */
export type BtcDialogueTurn = {
  turn_id: string;
  created_at_utc: string;
  locale: BtcPublicLocale;
  user_text: string;
  effective_question: string;
  observation_date: string | null;
  question_class: BtcEnvelopeQuestionClass | null;
  question_facets: string[];
  answer_state: BtcDialogueAnswerState;
  headline: string | null;
  direct_answer: string | null;
  evidence_lines: string[];
  contradiction_or_limit: string | null;
  what_would_change_the_read: string | null;
  source_boundary: string | null;
  source_snapshot_generated_at_utc: string | null;
  proof_available: boolean;
  context_relation: BtcCosmographerContextRelation | string | null;
  source_binding_changed: boolean;
  route_domain?: BtcCosmographerDomain;
  route_subject?: string;
  route_intents?: BtcCosmographerIntent[];
  market_question_class?: BtcCosmographerRoute["market_question_class"];
  time_start?: string | null;
  time_end?: string | null;
  answer_mode?: BtcCosmographerAnswerProjection["answer_mode"];
  sections?: BtcCosmographerSection[];
  proof_label?: string;
  route_disposition?: BtcRouteDisposition;
  primary_authority?: string;
  evidence_levels?: BtcEvidenceLevel[];
  btc_side_state_type?: BtcSideStateType | null;
  bridge_result?: BtcBridgeResult | null;
  show_next_question?: boolean;
  next_precise_question_type?: BtcNextQuestionType | null;
  next_precise_question_text?: string | null;
  next_precise_question_fingerprint?: string | null;
  show_clarification?: boolean;
  clarification_target?: BtcClarificationTarget | null;
  clarification_text?: string | null;
  clarification_fingerprint?: string | null;
  anti_loop_blocked?: boolean;
  valid_route_stop?: boolean;
  stop_reason?: BtcStopReason | null;
  context_safe_composer?: boolean;
};

export type BtcDialogueSession = {
  schema: typeof BTC_DIALOGUE_SESSION_SCHEMA;
  session_id: string;
  locale: BtcPublicLocale;
  created_at_utc: string;
  updated_at_utc: string;
  compacted: boolean;
  source_binding: {
    deployment_sha: string | null;
    snapshot_generated_at_utc: string | null;
  };
  turns: BtcDialogueTurn[];
};

function storageAvailable(): boolean {
  return typeof window !== "undefined" && Boolean(window.sessionStorage);
}

function sessionId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `btc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isText(value: unknown, max: number): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= max;
}

function nullableText(value: unknown, max: number): value is string | null {
  return value === null || isText(value, max);
}

function stringList(value: unknown, maxItems: number, maxLength: number): value is string[] {
  return Array.isArray(value) &&
    value.length <= maxItems &&
    value.every((item) => isText(item, maxLength));
}

function validSections(value: unknown): value is BtcCosmographerSection[] {
  if (!Array.isArray(value) || value.length > 8) return false;
  return value.every((item) => {
    if (!isRecord(item) || !isText(item.id, 64) || !isText(item.label, 160)) return false;
    if (item.paragraph !== undefined && !isText(item.paragraph, 2400)) return false;
    if (item.bullets !== undefined && !stringList(item.bullets, 24, 1200)) return false;
    return true;
  });
}

function validTurn(value: unknown): value is BtcDialogueTurn {
  if (!isRecord(value)) return false;
  if (!isText(value.turn_id, 160) || !isText(value.created_at_utc, 40)) return false;
  if (value.locale !== "ru" && value.locale !== "en") return false;
  if (!isText(value.user_text, 500) || !isText(value.effective_question, 500)) return false;
  if (!nullableText(value.observation_date, 10) || !nullableText(value.question_class, 64)) return false;
  if (!stringList(value.question_facets, 12, 48)) return false;
  if (!isText(value.answer_state, 32)) return false;
  if (!nullableText(value.headline, 400) || !nullableText(value.direct_answer, 5000)) return false;
  if (!stringList(value.evidence_lines, 12, 1200)) return false;
  if (!nullableText(value.contradiction_or_limit, 2400)) return false;
  if (!nullableText(value.what_would_change_the_read, 2400)) return false;
  if (!nullableText(value.source_boundary, 2600)) return false;
  if (!nullableText(value.source_snapshot_generated_at_utc, 40)) return false;
  if (typeof value.proof_available !== "boolean") return false;
  if (!nullableText(value.context_relation, 48)) return false;
  if (typeof value.source_binding_changed !== "boolean") return false;
  if (value.route_domain !== undefined && !isText(value.route_domain, 40)) return false;
  if (value.route_subject !== undefined && !isText(value.route_subject, 80)) return false;
  if (value.route_intents !== undefined && !stringList(value.route_intents, 10, 40)) return false;
  if (value.market_question_class !== undefined && !nullableText(value.market_question_class, 64)) return false;
  if (value.time_start !== undefined && !nullableText(value.time_start, 10)) return false;
  if (value.time_end !== undefined && !nullableText(value.time_end, 10)) return false;
  if (value.answer_mode !== undefined && !isText(value.answer_mode, 40)) return false;
  if (value.sections !== undefined && !validSections(value.sections)) return false;
  if (value.proof_label !== undefined && !isText(value.proof_label, 200)) return false;
  if (value.route_disposition !== undefined && !["CONTINUE", "CLARIFY", "STOP"].includes(String(value.route_disposition))) return false;
  if (value.primary_authority !== undefined && !isText(value.primary_authority, 160)) return false;
  if (value.evidence_levels !== undefined && !stringList(value.evidence_levels, 6, 4)) return false;
  if (value.btc_side_state_type !== undefined && value.btc_side_state_type !== null && !["MARKET", "SNAPSHOT", "PROTOCOL"].includes(String(value.btc_side_state_type))) return false;
  if (value.bridge_result !== undefined && value.bridge_result !== null && !["MARKET_CONFIRMED", "TEMPORAL_CONCURRENCE_ONLY", "DIVERGENCE", "INSUFFICIENT_DUAL_EVIDENCE"].includes(String(value.bridge_result))) return false;
  if (value.show_next_question !== undefined && typeof value.show_next_question !== "boolean") return false;
  if (value.next_precise_question_type !== undefined && value.next_precise_question_type !== null && !["FACT", "CONTRADICTION", "TIME", "EXPLICIT_BRIDGE", "PROOF"].includes(String(value.next_precise_question_type))) return false;
  if (value.next_precise_question_text !== undefined && !nullableText(value.next_precise_question_text, 500)) return false;
  if (value.next_precise_question_fingerprint !== undefined && !nullableText(value.next_precise_question_fingerprint, 800)) return false;
  if (value.show_clarification !== undefined && typeof value.show_clarification !== "boolean") return false;
  if (value.clarification_target !== undefined && value.clarification_target !== null && !["SUBJECT", "PERIOD", "RELATION_OBJECT", "ASSET"].includes(String(value.clarification_target))) return false;
  if (value.clarification_text !== undefined && !nullableText(value.clarification_text, 500)) return false;
  if (value.clarification_fingerprint !== undefined && !nullableText(value.clarification_fingerprint, 800)) return false;
  if (value.anti_loop_blocked !== undefined && typeof value.anti_loop_blocked !== "boolean") return false;
  if (value.valid_route_stop !== undefined && typeof value.valid_route_stop !== "boolean") return false;
  if (value.stop_reason !== undefined && value.stop_reason !== null && !["ANSWER_COMPLETE", "MISSING_EVIDENCE", "OUT_OF_SCOPE", "REPEATED_ROUTE", "MODE_TRANSITION_NOT_EXPLICIT"].includes(String(value.stop_reason))) return false;
  if (value.context_safe_composer !== undefined && typeof value.context_safe_composer !== "boolean") return false;
  return true;
}

export function createBtcDialogueSession(
  locale: BtcPublicLocale,
  deploymentSha: string | null,
): BtcDialogueSession {
  const now = new Date().toISOString();
  return {
    schema: BTC_DIALOGUE_SESSION_SCHEMA,
    session_id: sessionId(),
    locale,
    created_at_utc: now,
    updated_at_utc: now,
    compacted: false,
    source_binding: {
      deployment_sha: deploymentSha,
      snapshot_generated_at_utc: null,
    },
    turns: [],
  };
}

export function parseBtcDialogueSession(value: unknown): BtcDialogueSession | null {
  if (!isRecord(value)) return null;
  if (value.schema !== BTC_DIALOGUE_SESSION_SCHEMA && value.schema !== BTC_DIALOGUE_LEGACY_SESSION_SCHEMA) return null;
  if (!isText(value.session_id, 160)) return null;
  if (value.locale !== "ru" && value.locale !== "en") return null;
  if (!isText(value.created_at_utc, 40) || !isText(value.updated_at_utc, 40)) return null;
  if (!isRecord(value.source_binding)) return null;
  if (!nullableText(value.source_binding.deployment_sha, 40)) return null;
  if (!nullableText(value.source_binding.snapshot_generated_at_utc, 40)) return null;
  if (!Array.isArray(value.turns) || !value.turns.every(validTurn)) return null;
  return compactBtcDialogueSession({
    schema: BTC_DIALOGUE_SESSION_SCHEMA,
    session_id: value.session_id,
    locale: value.locale,
    created_at_utc: value.created_at_utc,
    updated_at_utc: value.updated_at_utc,
    compacted: value.compacted === true,
    source_binding: {
      deployment_sha: value.source_binding.deployment_sha,
      snapshot_generated_at_utc: value.source_binding.snapshot_generated_at_utc,
    },
    turns: value.turns,
  });
}

export function readBtcDialogueSession(
  locale: BtcPublicLocale,
  deploymentSha: string | null,
): BtcDialogueSession {
  if (!storageAvailable()) return createBtcDialogueSession(locale, deploymentSha);
  const raw = window.sessionStorage.getItem(BTC_DIALOGUE_SESSION_KEY) ??
    window.sessionStorage.getItem(BTC_DIALOGUE_PREVIOUS_SESSION_KEY);
  if (!raw) return createBtcDialogueSession(locale, deploymentSha);
  try {
    const parsed = parseBtcDialogueSession(JSON.parse(raw));
    if (!parsed) throw new Error("invalid session");
    const migrated = {
      ...parsed,
      locale,
      source_binding: {
        ...parsed.source_binding,
        deployment_sha: deploymentSha ?? parsed.source_binding.deployment_sha,
      },
    };
    window.sessionStorage.setItem(BTC_DIALOGUE_SESSION_KEY, JSON.stringify(migrated));
    window.sessionStorage.removeItem(BTC_DIALOGUE_PREVIOUS_SESSION_KEY);
    return migrated;
  } catch {
    window.sessionStorage.removeItem(BTC_DIALOGUE_SESSION_KEY);
    window.sessionStorage.removeItem(BTC_DIALOGUE_PREVIOUS_SESSION_KEY);
    return createBtcDialogueSession(locale, deploymentSha);
  }
}

function serializedBytes(session: BtcDialogueSession): number {
  return new TextEncoder().encode(JSON.stringify(session)).length;
}

export function compactBtcDialogueSession(
  session: BtcDialogueSession,
): BtcDialogueSession {
  let turns = session.turns.slice(-BTC_DIALOGUE_SESSION_MAX_TURNS);
  let compacted = session.compacted || turns.length !== session.turns.length;
  let candidate: BtcDialogueSession = { ...session, turns, compacted };
  while (
    turns.length > BTC_DIALOGUE_SESSION_MIN_RETAINED_TURNS &&
    serializedBytes(candidate) > BTC_DIALOGUE_SESSION_MAX_BYTES
  ) {
    turns = turns.slice(1);
    compacted = true;
    candidate = { ...candidate, turns, compacted };
  }
  if (serializedBytes(candidate) > BTC_DIALOGUE_SESSION_MAX_BYTES) {
    turns = turns.map((turn) => ({
      ...turn,
      direct_answer: turn.direct_answer?.slice(0, 1200) ?? null,
      evidence_lines: turn.evidence_lines.slice(0, 5).map((line) => line.slice(0, 300)),
      contradiction_or_limit: turn.contradiction_or_limit?.slice(0, 500) ?? null,
      what_would_change_the_read: turn.what_would_change_the_read?.slice(0, 500) ?? null,
      sections: turn.sections?.slice(0, 4).map((section) => ({
        ...section,
        paragraph: section.paragraph?.slice(0, 500),
        bullets: section.bullets?.slice(0, 5).map((line) => line.slice(0, 300)),
      })),
      source_boundary: turn.source_boundary?.slice(0, 500) ?? null,
    }));
    candidate = { ...candidate, turns, compacted: true };
  }
  return candidate;
}

export function writeBtcDialogueSession(
  session: BtcDialogueSession,
): BtcDialogueSession {
  const compacted = compactBtcDialogueSession({
    ...session,
    updated_at_utc: new Date().toISOString(),
  });
  if (storageAvailable()) {
    window.sessionStorage.setItem(BTC_DIALOGUE_SESSION_KEY, JSON.stringify(compacted));
    window.sessionStorage.removeItem(BTC_DIALOGUE_PREVIOUS_SESSION_KEY);
  }
  return compacted;
}

export function upsertBtcDialogueTurn(
  session: BtcDialogueSession,
  turn: BtcDialogueTurn,
): BtcDialogueSession {
  const existing = session.turns.findIndex((item) => item.turn_id === turn.turn_id);
  const turns = existing >= 0
    ? session.turns.map((item, index) => index === existing ? turn : item)
    : [...session.turns, turn];
  return writeBtcDialogueSession({
    ...session,
    locale: turn.locale,
    source_binding: {
      ...session.source_binding,
      snapshot_generated_at_utc: turn.source_snapshot_generated_at_utc,
    },
    turns,
  });
}

export function clearBtcDialogueSession(): void {
  if (!storageAvailable()) return;
  window.sessionStorage.removeItem(BTC_DIALOGUE_SESSION_KEY);
  window.sessionStorage.removeItem(BTC_DIALOGUE_PREVIOUS_SESSION_KEY);
}

export function latestContextTurn(
  turns: BtcDialogueTurn[],
): BtcDialogueTurn | null {
  for (let index = turns.length - 1; index >= 0; index -= 1) {
    const turn = turns[index];
    const dispositionAllowsContext = turn.route_disposition === undefined || turn.route_disposition === "CONTINUE";
    if (
      dispositionAllowsContext &&
      turn.context_safe_composer !== false &&
      !(["FAILURE", "CLARIFICATION"] as string[]).includes(turn.answer_state)
    ) return turn;
  }
  return null;
}

function hashText(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

type LegacyTurnIdInput = {
  userText: string;
  effectiveQuestion: string;
  observationDate: string | null;
  snapshotTimestamp: string | null;
  answerState: BtcDialogueAnswerState;
  headline: string | null;
};

type RouteTurnIdInput = {
  userText: string;
  route: BtcCosmographerRoute;
  answer: BtcCosmographerAnswerProjection;
  snapshotTimestamp: string | null;
};

export function makeBtcDialogueTurnId(
  parts: LegacyTurnIdInput | RouteTurnIdInput,
): string {
  const fields = "route" in parts
    ? [
        parts.userText,
        parts.route.domain,
        parts.route.subject,
        parts.route.intents.join(","),
        parts.route.context_relation,
        parts.route.time_range?.start ?? "",
        parts.route.time_range?.end ?? "",
        parts.answer.answer_state,
        parts.answer.answer_mode,
        parts.answer.headline,
        parts.snapshotTimestamp ?? "",
      ]
    : [
        parts.userText,
        parts.effectiveQuestion,
        parts.observationDate ?? "",
        parts.snapshotTimestamp ?? "",
        parts.answerState,
        parts.headline ?? "",
      ];
  return `btc-cosmographer-turn-${hashText(fields.join("\u241f"))}`;
}
