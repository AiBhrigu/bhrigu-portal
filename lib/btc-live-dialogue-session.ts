import type { BtcPublicLocale } from "./btc-public-language-contract";
import type {
  BtcCosmographerAnswerState,
  BtcCosmographerContextRelation,
  BtcCosmographerDomain,
  BtcCosmographerIntent,
  BtcCosmographerRoute,
} from "./btc-cosmographer-route-graph";
import type { BtcCosmographerAnswerProjection, BtcCosmographerSection } from "./btc-protocol-evidence";

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
  turn_count: number;
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

function uuid(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `btc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

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

function sanitizeSections(value: unknown): BtcCosmographerSection[] | null {
  if (!Array.isArray(value) || value.length > 8) return null;
  const output: BtcCosmographerSection[] = [];
  for (const item of value) {
    if (!isRecord(item) || !validText(item.id, 64) || !validText(item.label, 160)) return null;
    const paragraph = item.paragraph === undefined ? undefined : item.paragraph;
    const bullets = item.bullets === undefined ? undefined : item.bullets;
    if (paragraph !== undefined && !validText(paragraph, 2400)) return null;
    if (bullets !== undefined && (!Array.isArray(bullets) || bullets.length > 12 || !bullets.every((line) => validText(line, 1200)))) return null;
    output.push({
      id: item.id,
      label: item.label,
      ...(paragraph ? { paragraph } : {}),
      ...(bullets ? { bullets: bullets as string[] } : {}),
    });
  }
  return output;
}

function sanitizeTurn(value: unknown): BtcDialogueTurn | null {
  if (!isRecord(value)) return null;
  if (!validText(value.turn_id, 160) || !validIso(value.created_at_utc)) return null;
  if (value.locale !== "ru" && value.locale !== "en") return null;
  if (!validText(value.user_text, 500) || !validText(value.route_domain, 40) || !validText(value.route_subject, 80)) return null;
  if (!Array.isArray(value.route_intents) || value.route_intents.length > 10 || !value.route_intents.every((item) => validText(item, 40))) return null;
  if (!validText(value.context_relation, 40) || !nullableText(value.market_question_class, 64)) return null;
  if (!nullableText(value.time_start, 10) || !nullableText(value.time_end, 10)) return null;
  if (!validText(value.answer_state, 32) || !validText(value.answer_mode, 40)) return null;
  if (!validText(value.headline, 400) || !validText(value.direct_answer, 5000)) return null;
  const sections = sanitizeSections(value.sections);
  if (!sections) return null;
  if (!validText(value.source_boundary, 2600) || !validText(value.proof_label, 200)) return null;
  if (!nullableText(value.source_snapshot_generated_at_utc, 40)) return null;
  if (typeof value.source_binding_changed !== "boolean") return null;
  return {
    turn_id: value.turn_id,
    created_at_utc: value.created_at_utc,
    locale: value.locale,
    user_text: value.user_text,
    route_domain: value.route_domain as BtcCosmographerDomain,
    route_subject: value.route_subject,
    route_intents: value.route_intents as BtcCosmographerIntent[],
    context_relation: value.context_relation as BtcCosmographerContextRelation,
    market_question_class: value.market_question_class as BtcCosmographerRoute["market_question_class"],
    time_start: value.time_start,
    time_end: value.time_end,
    answer_state: value.answer_state,
    answer_mode: value.answer_mode,
    headline: value.headline,
    direct_answer: value.direct_answer,
    sections,
    source_boundary: value.source_boundary,
    proof_label: value.proof_label,
    source_snapshot_generated_at_utc: value.source_snapshot_generated_at_utc,
    source_binding_changed: value.source_binding_changed,
  };
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
    },
    turns: [],
  };
}

export function parseBtcDialogueSession(value: unknown): BtcDialogueSession | null {
  if (!isRecord(value) || value.schema !== BTC_DIALOGUE_SESSION_SCHEMA) return null;
  if (!validText(value.session_id, 160) || (value.locale !== "ru" && value.locale !== "en")) return null;
  if (!validIso(value.created_at_utc) || !validIso(value.updated_at_utc)) return null;
  if (!isRecord(value.source_binding) || !nullableText(value.source_binding.deployment_sha, 40)) return null;
  if (!nullableText(value.source_binding.snapshot_generated_at_utc, 40) || !Array.isArray(value.turns)) return null;
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

export function compactBtcDialogueSession(session: BtcDialogueSession): BtcDialogueSession {
  let turns = session.turns.slice(-BTC_DIALOGUE_SESSION_MAX_TURNS);
  let compacted = session.compacted || turns.length !== session.turns.length;
  let candidate = { ...session, turns, turn_count: turns.length, compacted };
  while (
    turns.length > BTC_DIALOGUE_SESSION_MIN_RETAINED_TURNS &&
    serializedBytes(candidate) > BTC_DIALOGUE_SESSION_MAX_BYTES
  ) {
    turns = turns.slice(1);
    compacted = true;
    candidate = { ...candidate, turns, turn_count: turns.length, compacted };
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
    if (!["FAILURE", "CLARIFICATION"].includes(turn.answer_state)) return turn;
  }
  return null;
}

function hashText(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hashxôÙ…±Õ”¹¡…É½‘•Ð¡¥¹‘•à¤ì(€€€¡…Í¢ÒÖF‚æ–×VÂ††6‚Âcsssc’“°¢Ð¢&WGW&â††6‚ããâ’çFõ7G&–ærƒb’çE7F'Bƒ‚Â#"“°§Ð ¦W‡÷'BgVæ7F–öâÖ¶T'F4F–ÆöwVUGW&ä–B‡'G3¢°¢W6W%FW‡C¢7G&–æs°¢&÷WFS¢'F46÷6Ööw&†W%&÷WFS°¢ç7vW#¢'F46÷6Ööw&†W$ç7vW%&ö¦V7F–öã°¢6æ6†÷EF–ÖW7F×¢7G&–ærÂçVÆÃ°§Ò“¢7G&–ær°¢&WGW&â'F2Ö6÷6Ööw&†W"×GW&âÒG¶†6…FW‡B…°¢'G2çW6W%FW‡BÀ¢'G2ç&÷WFRæFöÖ–âÀ¢'G2ç&÷WFRç7V&¦V7BÀ¢'G2ç&÷WFRæ–çFVçG2æ¦ö–â‚"Â"’À¢'G2ç&÷WFRæ6öçFW‡E÷&VÆF–öâÀ¢'G2ç&÷WFRçF–ÖU÷&ævSòç7F'Bóò""À¢'G2ç&÷WFRçF–ÖU÷&ævSòæVæBóò""À¢'G2æç7vW"æç7vW%÷7FFRÀ¢'G2æç7vW"æ†VFÆ–æRÀ¢'G2ç6æ6†÷EF–ÖW7F×óò""À¢Òæ¦ö–â‚%ÇS#Cb"’—Ö°§Ð 