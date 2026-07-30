import type { BtcPublicLocale } from "./btc-public-language-contract";
import type {
  BtcCosmographerAnswerState,
  BtcCosmographerContextRelation,
  BtcCosmographerDomain,
  BtcCosmographerIntent,
  BtcCosmographerRoute,
} from "./btc-cosmographer-route-graph";
import type {
  BtcCosmographerAnswerProjection,
  BtcCosmographerSection,
} from "./btc-protocol-evidence";

export const BTC_DIALOGUE_SESSION_SCHEMA =
  "btc_cosmographer_dialogue_session_v0_2" as const;
export const BTC_DIALOGUE_SESSION_KEY =
  "bhrigu:btc-cosmographer:session:v0_2" as const;
export const BTC_DIALOGUE_SESSION_MAX_TURNS = 20;
export const BTC_DIALOGUE_SESSION_MIN_RETAINED_TURNS = 6;
export const BTC_DIALOGUE_SESSION_MAX_BYTES = 96 * 1024;

export type BtcDialogueTurn = {
  turn_id: string;
  created_at_utc: string;
  locale: BtcPublicLocale;
  user_text: string;
  route_domain: BtcCosmographerDomain;
  route_subject: string;
  route_intents: BtcCosmographerIntent[];
  context_relation: BtcCosmographerContextRelation;
  market_question_class: BtcCosmographerRoute["market_question_class"];
  time_start: string | null;
  time_end: string | null;
  answer_state: BtcCosmographerAnswerState;
  answer_mode: BtcCosmographerAnswerProjection["answer_mode"];
  headline: string;
  direct_answer: string;
  sections: BtcCosmographerSection[];
  source_boundary: string;
  proof_label: string;
  source_snapshot_generated_at_utc: string | null;
  source_binding_changed: boolean;
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

function isNullableText(value: unknown, max: number): value is string | null {
  return value === null || isText(value, max);
}

function validSections(value: unknown): value is BtcCosmographerSection[] {
  if (!Array.isArray(value) || value.length > 8) return false;
  return value.every((item) => {
    if (!isRecord(item) || !isText(item.id, 64) || !isText(item.label, 160)) return false;
    if (item.paragraph !== undefined && !isText(item.paragraph, 2400)) return false;
    if (item.bullets !== undefined) {
      if (!Array.isArray(item.bullets) || item.bullets.length > 12) return false;
      if (!item.bullets.every((line) => isText(line, 1200))) return false;
    }
    return true;
  });
}

function validTurn(value: unknown): value is BtcDialogueTurn {
  if (!isRecord(value)) return false;
  return (
    isText(value.turn_id, 160) &&
    isText(value.created_at_utc, 40) &&
    (value.locale === "ru" || value.locale === "en") &&
    isText(value.user_text, 500) &&
    isText(value.route_domain, 40) &&
    isText(value.route_subject, 80) &&
    Array.isArray(value.route_intents) &&
    value.route_intents.length <= 10 &&
    value.route_intents.every((intent) => isText(intent, 40)) &&
    isText(value.context_relation, 40) &&
    isNullableText(value.market_question_class, 64) &&
    isNullableText(value.time_start, 10) &&
    isNullableText(value.time_end, 10) &&
    isText(value.answer_state, 32) &&
    isText(value.answer_mode, 40) &&
    isText(value.headline, 400) &&
    isText(value.direct_answer, 5000) &&
    validSections(value.sections) &&
    isText(value.source_boundary, 2600) &&
    isText(value.proof_label, 200) &&
    isNullableText(value.source_snapshot_generated_at_utc, 40) &&
    typeof value.source_binding_changed === "boolean"
  );
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
  if (!isRecord(value) || value.schema !== BTC_DIALOGUE_SESSION_SCHEMA) return null;
  if (!isText(value.session_id, 160)) return null;
  if (value.locale !== "ru" && value.locale !== "en") return null;
  if (!isText(value.created_at_utc, 40) || !isText(value.updated_at_utc, 40)) return null;
  if (!isRecord(value.source_binding)) return null;
  if (!isNullableText(value.source_binding.deployment_sha, 40)) return null;
  if (!isNullableText(value.source_binding.snapshot_generated_at_utc, 40)) return null;
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
  const raw = window.sessionStorage.getItem(BTC_DIALOGUE_SESSION_KEY);
  if (!raw) return createBtcDialogueSession(locale, deploymentSha);
  try {
    const parsed = parseBtcDialogueSession(JSON.parse(raw));
    if (!parsed) throw new Error("invalid session");
    return {
      ...parsed,
      locale,
      source_binding: {
        ...parsed.source_binding,
        deployment_sha: deploymentSha ?? parsed.source_binding.deployment_sha,
      },
    };
  } catch {
    window.sessionStorage.removeItem(BTC_DIALOGUE_SESSION_KEY);
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
      direct_answer: turn.direct_answer.slice(0, 1800),
      sections: turn.sections.slice(0, 4).map((section) => ({
        ...section,
        paragraph: section.paragraph?.slice(0, 700),
        bullets: section.bullets?.slice(0, 5).map((line) => line.slice(0, 500)),
      })),
      source_boundary: turn.source_boundary.slice(0, 700),
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
    window.sessionStorage.setItem(
      BTC_DIALOGUE_SESSION_KEY,
      JSON.stringify(compacted),
    );
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
  if (storageAvailable()) {
    window.sessionStorage.removeItem(BTC_DIALOGUE_SESSION_KEY);
  }
}

export function latestContextTurn(
  turns: BtcDialogueTurn[],
): BtcDialogueTurn | null {
  for (let index = turns.length - 1; index >= 0; index -= 1) {
    const turn = turns[index];
    if (!(["FAILURE", "CLARIFICATION"] as string[]).includes(turn.answer_state)) {
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
  route: BtcCosmographerRoute;
  answer: BtcCosmographerAnswerProjection;
  snapshotTimestamp: string | null;
}): string {
  return `btc-cosmographer-turn-${hashText([
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
  ].join("\u241f"))}`;
}
