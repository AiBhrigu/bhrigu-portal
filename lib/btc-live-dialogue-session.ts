import type { BtcEnvelopeQuestionClass } from "./btc-market-envelope";
import type { BtcQuestionFacet, BtcQuestionSpecificAnswerState } from "./btc-executive-question-language";
import type { BtcPublicLocale } from "./btc-public-language-contract";

export const BTC_DIALOGUE_SESSION_SCHEMA = "btc_free_dialogue_session_v0_1" as const;
export const BTC_DIALOGUE_SESSION_KEY = "bhrigu:btc-free-dialogue:session:v0_1" as const;
export const BTC_DIALOGUE_SESSION_MAX_TURNS = 20;
export const BTC_DIALOGUE_SESSION_MIN_RETAINED_TURNS = 6;
export const BTC_DIALOGUE_SESSION_MAX_BYTES = 64 * 1024;

export type BtcDialogueTurnState =
  | BtcQuestionSpecificAnswerState
  | "FAILURE"
  | "BOUNDED"
  | "CLARIFICATION";

export type BtcDialogueTurn = {
  turn_id: string;
  created_at_utc: string;
  locale: BtcPublicLocale;
  user_text: string;
  effective_question: string;
  observation_date: string | null;
  question_class: BtcEnvelopeQuestionClass | null;
  question_facets: BtcQuestionFacet[];
  answer_state: BtcDialogueTurnState;
  headline: string | null;
  direct_answer: string | null;
  evidence_lines: string[];
  contradiction_or_limit: string | null;
  what_would_change_the_read: string | null;
  source_boundary: string | null;
  source_snapshot_generated_at_utc: string | null;
  proof_available: boolean;
  context_relation: string | null;
  source_binding_changed: boolean;
};

export type BtcDialogueSession = {
  schema: typeof BTC_DIALOGUE_SESSION_SCHEMA;
  session_id: string;
  locale: BtcPublicLocale;
  created_at_utc: string;
  updated_at_utc: string;
  turn_count: number;
  compacted: boolean;
  source_binding: {
    deployment_sha: string | null;
    snapshot_generated_at_utc: string | null;
    observation_date: string | null;
  };
  turns: BtcDialogueTurn[];
};

const QUESTION_CLASSES: BtcEnvelopeQuestionClass[] = [
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

const TURN_STATES: BtcDialogueTurnState[] = [
  "CONFIRMED",
  "SPLIT",
  "LIMITED",
  "FAILURE",
  "BOUNDED",
  "CLARIFICATION",
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function validText(value: unknown, maxLength: number): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= maxLength;
}

function nullableText(value: unknown, maxLength: number): value is string | null {
  return value === null || validText(value, maxLength);
}

function validIso(value: unknown): value is string {
  return typeof value === "string" && Number.isFinite(new Date(value).getTime());
}

function validLocale(value: unknown): value is BtcPublicLocale {
  return value === "en" || value === "ru";
}

function validQuestionClass(value: unknown): value is BtcEnvelopeQuestionClass | null {
  return value === null || QUESTION_CLASSES.includes(value as BtcEnvelopeQuestionClass);
}

function validFacetList(value: unknown): value is BtcQuestionFacet[] {
  return Array.isArray(value) && value.length <= FACETS.length && value.every((facet) => FACETS.includes(facet as BtcQuestionFacet));
}

function validTurnState(value: unknown): value is BtcDialogueTurnState {
  return TURN_STATES.includes(value as BtcDialogueTurnState);
}

function sanitizeTurn(value: unknown): BtcDialogueTurn | null {
  if (!isRecord(value)) return null;
  if (!validText(value.turn_id, 160) || !validIso(value.created_at_utc) || !validLocale(value.locale)) return null;
  if (!validText(value.user_text, 280) || !validText(value.effective_question, 560)) return null;
  if (!nullableText(value.observation_date, 10) || !validQuestionClass(value.question_class)) return null;
  if (!validFacetList(value.question_facets) || !validTurnState(value.answer_state)) return null;
  if (!nullableText(value.headline, 320) || !nullableText(value.direct_answer, 2400)) return null;
  if (!Array.isArray(value.evidence_lines)) return null;
  const evidence = value.evidence_lines.filter((line) => validText(line, 800)).slice(0, 3);
  if (!nullableText(value.contradiction_or_limit, 1800)) return null;
  if (!nullableText(value.what_would_change_the_read, 1800)) return null;
  if (!nullableText(value.source_boundary, 1600)) return null;
  if (!nullableText(value.source_snapshot_generated_at_utc, 40)) return null;
  if (typeof value.proof_available !== "boolean") return null;
  if (!nullableText(value.context_relation, 64)) return null;
  if (typeof value.source_binding_changed !== "boolean") return null;

  return {
    turn_id: value.turn_id,
    created_at_utc: value.created_at_utc,
    locale: value.locale,
    user_text: value.user_text,
    effective_question: value.effective_question,
    observation_date: value.observation_date,
    question_class: value.question_class,
    question_facets: value.question_facets,
    answer_state: value.answer_state,
    headline: value.headline,
    direct_answer: value.direct_answer,
    evidence_lines: evidence,
    contradiction_or_limit: value.contradiction_or_limit,
    what_would_change_the_read: value.what_would_change_the_read,
    source_boundary: value.source_boundary,
    source_snapshot_generated_at_utc: value.source_snapshot_generated_at_utc,
    proof_available: value.proof_available,
    context_relation: value.context_relation,
    source_binding_changed: value.source_binding_changed,
  };
}

function storageAvailable(): boolean {
  return typeof window !== "undefined" && Boolean(window.sessionStorage);
}

function uuid(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return `btc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

export function createBtcDialogueSession(
  locale: BtcPublicLocale,
  deploymentSha: string | null,
): BtcDialogueSession {
  const now = new Date().toISOString();
  return {
    schema: BTC_DIALOGUE_SESSION_SCHEMA,
    session_id: uuid(),
    locale,
    created_at_utc: now,
    updated_at_utc: now,
    turn_count: 0,
    compacted: false,
    source_binding: {
      deployment_sha: deploymentSha,
      snapshot_generated_at_utc: null,
      observation_date: null,
    },
    turns: [],
  };
}

export function parseBtcDialogueSession(value: unknown): BtcDialogueSession | null {
  if (!isRecord(value) || value.schema !== BTC_DIALOGUE_SESSION_SCHEMA) return null;
  if (!validText(value.session_id, 160) || !validLocale(value.locale)) return null;
  if (!validIso(value.created_at_utc) || !validIso(value.updated_at_utc)) return null;
  if (!isRecord(value.source_binding) || !Array.isArray(value.turns)) return null;
  if (!nullableText(value.source_binding.deployment_sha, 40)) return null;
  if (!nullableText(value.source_binding.snapshot_generated_at_utc, 40)) return null;
  if (!nullableText(value.source_binding.observation_date, 10)) return null;

  const turns = value.turns.map(sanitizeTurn).filter((turn): turn is BtcDialogueTurn => Boolean(turn));
  if (turns.length !== value.turns.length) return null;

  return compactBtcDialogueSession({
    schema: BTC_DIALOGUE_SESSION_SCHEMA,
    session_id: value.session_id,
    locale: value.locale,
    created_at_utc: value.created_at_utc,
    updated_at_utc: value.updated_at_utc,
    turn_count: turns.length,
    compacted: value.compacted === true,
    source_binding: {
      deployment_sha: value.source_binding.deployment_sha,
      snapshot_generated_at_utc: value.source_binding.snapshot_generated_at_utc,
      observation_date: value.source_binding.observation_date,
    },
    turns,
  });
}

export function readBtcDialogueSession(
  locale: BtcPublicLocale,
  deploymentSha: string | null,
): BtcDialogueSession {
  if (!storageAvailable()) return createBtcDialogueSession(locale, deploymentSha);
  const raw = window.sessionStorage.getItem(BTC_DIALOGUE_SESSION_KEY);
  if (!raw) return createBtcDialogueSession(locale, deploymentSha);

  try {
    const parsed = parseBtcDialogueSession(JSON.parse(raw));
    if (!parsed) throw new Error("invalid session");
    const normalized = {
      ...parsed,
      locale,
      source_binding: {
        ...parsed.source_binding,
        deployment_sha: deploymentSha ?? parsed.source_binding.deployment_sha,
      },
    };
    const serialized = JSON.stringify(normalized);
    if (serialized !== raw) window.sessionStorage.setItem(BTC_DIALOGUE_SESSION_KEY, serialized);
    return normalized;
  } catch {
    window.sessionStorage.removeItem(BTC_DIALOGUE_SESSION_KEY);
    return createBtcDialogueSession(locale, deploymentSha);
  }
}

function serializedBytes(session: BtcDialogueSession): number {
  return new TextEncoder().encode(JSON.stringify(session)).length;
}

export function compactBtcDialogueSession(session: BtcDialogueSession): BtcDialogueSession {
  let turns = session.turns.slice(-BTC_DIALOGUE_SESSION_MAX_TURNS);
  let compacted = session.compacted || turns.length !== session.turns.length;
  let candidate = { ...session, turns, turn_count: turns.length, compacted };

  while (turns.length > BTC_DIALOGUE_SESSION_MIN_RETAINED_TURNS && serializedBytes(candidate) > BTC_DIALOGUE_SESSION_MAX_BYTES) {
    turns = turns.slice(1);
    compacted = true;
    candidate = { ...candidate, turns, turn_count: turns.length, compacted };
  }

  if (serializedBytes(candidate) > BTC_DIALOGUE_SESSION_MAX_BYTES) {
    turns = turns.map((turn) => ({
      ...turn,
      direct_answer: turn.direct_answer?.slice(0, 900) ?? null,
      evidence_lines: turn.evidence_lines.map((line) => line.slice(0, 360)),
      contradiction_or_limit: turn.contradiction_or_limit?.slice(0, 600) ?? null,
      what_would_change_the_read: turn.what_would_change_the_read?.slice(0, 600) ?? null,
      source_boundary: turn.source_boundary?.slice(0, 400) ?? null,
    }));
    compacted = true;
    candidate = { ...candidate, turns, turn_count: turns.length, compacted };
  }

  return candidate;
}

export function writeBtcDialogueSession(session: BtcDialogueSession): BtcDialogueSession {
  const compacted = compactBtcDialogueSession({
    ...session,
    updated_at_utc: new Date().toISOString(),
    turn_count: session.turns.length,
  });
  if (storageAvailable()) {
    window.sessionStorage.setItem(BTC_DIALOGUE_SESSION_KEY, JSON.stringify(compacted));
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
      observation_date: turn.observation_date,
    },
    turns,
  });
}

export function clearBtcDialogueSession(): void {
  if (storageAvailable()) window.sessionStorage.removeItem(BTC_DIALOGUE_SESSION_KEY);
}

export function latestContextTurn(turns: BtcDialogueTurn[]): BtcDialogueTurn | null {
  for (let index = turns.length - 1; index >= 0; index -= 1) {
    const turn = turns[index];
    if (
      turn.question_class &&
      ["CONFIRMED", "SPLIT", "LIMITED"].includes(turn.answer_state) &&
      turn.source_snapshot_generated_at_utc
    ) {
      return turn;
    }
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

export function makeBtcDialogueTurnId(parts: {
  userText: string;
  effectiveQuestion: string;
  observationDate: string | null;
  snapshotTimestamp: string | null;
  answerState: BtcDialogueTurnState;
  headline: string | null;
}): string {
  return `btc-turn-${hashText([
    parts.userText,
    parts.effectiveQuestion,
    parts.observationDate ?? "",
    parts.snapshotTimestamp ?? "",
    parts.answerState,
    parts.headline ?? "",
  ].join("\u241f"))}`;
}
