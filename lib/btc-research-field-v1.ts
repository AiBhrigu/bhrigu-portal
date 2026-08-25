import { createHash, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import type { BtcCleanChatResponse, BtcCleanLocale } from "./btc-clean-chat-v1";

export const BTC_RESEARCH_FIELD_MODE = "preview_v1" as const;
export const BTC_RESEARCH_FIELD_MAX_TURNS = 120;
export const BTC_RESEARCH_FIELD_SERVICE_MS = 30 * 24 * 60 * 60 * 1000;
export const BTC_RESEARCH_FIELD_TURN_CLAIM_MS = 5 * 60 * 1000;
export const BTC_RESEARCH_FIELD_COOKIE = "bhrigu_btc_research_field_v1";

export type BtcResearchFieldStatus =
  | "PENDING_PAYMENT"
  | "ACTIVE"
  | "EXPIRED"
  | "DELETED"
  | "PURGED"
  | "LOCKED";

export type BtcResearchFieldConfigInput = {
  locale: BtcCleanLocale;
  title: string;
  primaryQuestion: string;
  timeHorizon: string | null;
  evidencePreferences: string[];
  watchConditions: string[];
  exactPolymarketContracts: string[];
};

export type BtcResearchFieldRecord = BtcResearchFieldConfigInput & {
  fieldId: string;
  secretHash: string;
  status: BtcResearchFieldStatus;
  serviceStart: string | null;
  serviceEnd: string | null;
  completedTurns: number;
  activeTurnId: string | null;
  activeTurnClaimedAt: string | null;
};

export type BtcResearchFieldCheckpoint = {
  checkpointId: string;
  fieldId: string;
  role: "BASELINE" | "CHECKPOINT";
  acceptedAt: string;
  question: string;
  answer: string;
  topic: string;
  asOf: string;
  sources: BtcCleanChatResponse["sources"];
  evidenceState: BtcCleanChatResponse["evidence"];
  boundaryState: BtcCleanChatResponse["boundary"];
  continuityDigest: string;
};

export type BtcResearchFieldModelContext = {
  field_title: string;
  primary_question: string;
  time_horizon: string | null;
  evidence_preferences: string[];
  watch_conditions: string[];
  exact_polymarket_contracts: string[];
  baseline_digest: string | null;
  latest_checkpoint_digest: string | null;
  memory_boundary: string;
};

const FIELD_ID = /^btcrf_[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const SECRET = /^[A-Za-z0-9_-]{40,80}$/;
const ALLOWED_EVIDENCE = new Set(["snapshot", "market_structure", "binance", "polymarket", "protocol", "temporal", "astronomy"]);

export function newBtcResearchFieldIdentity() {
  const fieldId = `btcrf_${randomUUID()}`;
  const secret = randomBytes(32).toString("base64url");
  return { fieldId, secret, secretHash: hashBtcResearchFieldSecret(secret) };
}

export function hashBtcResearchFieldSecret(secret: string): string {
  return createHash("sha256")
    .update(`bhrigu-btc-research-field-v1:${secret}`, "utf8")
    .digest("hex");
}

export function normalizeBtcResearchFieldId(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return FIELD_ID.test(normalized) ? normalized : null;
}

export function normalizeBtcResearchFieldSecret(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return SECRET.test(normalized) ? normalized : null;
}

function text(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function textArray(value: unknown, maxItems: number, maxLength: number): string[] {
  if (!Array.isArray(value)) return [];
  return Array.from(new Set(value.flatMap((item) => {
    const normalized = text(item, maxLength);
    return normalized ? [normalized] : [];
  }))).slice(0, maxItems);
}

export function normalizeBtcResearchFieldConfig(value: unknown): BtcResearchFieldConfigInput | null {
  const item = value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
  const title = text(item.title, 100);
  const primaryQuestion = text(item.primaryQuestion, 500);
  if (title.length < 2 || primaryQuestion.length < 2) return null;
  const evidencePreferences = textArray(item.evidencePreferences, 7, 40).filter((entry) => ALLOWED_EVIDENCE.has(entry));
  return {
    locale: item.locale === "ru" ? "ru" : "en",
    title,
    primaryQuestion,
    timeHorizon: text(item.timeHorizon, 120) || null,
    evidencePreferences,
    watchConditions: textArray(item.watchConditions, 8, 180),
    exactPolymarketContracts: textArray(item.exactPolymarketContracts, 8, 180),
  };
}

export function verifyBtcResearchFieldSecret(field: BtcResearchFieldRecord, secret: string): boolean {
  const actual = Buffer.from(hashBtcResearchFieldSecret(secret), "hex");
  const expected = Buffer.from(field.secretHash, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function isBtcResearchFieldActive(field: BtcResearchFieldRecord, now = new Date()): boolean {
  if (field.status !== "ACTIVE" || !field.serviceStart || !field.serviceEnd) return false;
  return new Date(field.serviceStart) <= now
    && now < new Date(field.serviceEnd)
    && field.completedTurns < BTC_RESEARCH_FIELD_MAX_TURNS;
}

export function btcResearchFieldCookie(fieldId: string, secret: string, serviceEnd: string | null, now = new Date()): string {
  const defaultAge = 60 * 60;
  const serviceAge = serviceEnd ? Math.floor((new Date(serviceEnd).getTime() - now.getTime()) / 1000) : defaultAge;
  const maxAge = Math.max(0, Math.min(30 * 24 * 60 * 60, serviceAge));
  return `${BTC_RESEARCH_FIELD_COOKIE}=${fieldId}.${secret}; Path=/api/btc/research-field/v1; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Lax`;
}

export function parseBtcResearchFieldCookie(value: unknown): { fieldId: string; secret: string } | null {
  if (typeof value !== "string") return null;
  const separator = value.indexOf(".");
  if (separator < 1) return null;
  const fieldId = normalizeBtcResearchFieldId(value.slice(0, separator));
  const secret = normalizeBtcResearchFieldSecret(value.slice(separator + 1));
  return fieldId && secret ? { fieldId, secret } : null;
}

export function hashBtcResearchFieldTurnResult(question: string, result: BtcCleanChatResponse): string {
  const canonical = JSON.stringify({
    question: question.slice(0, 500),
    topic: result.topic,
    answer: result.answer,
    as_of: result.as_of,
    sources: result.sources,
    evidence: result.evidence,
    boundary: result.boundary,
  });
  return createHash("sha256")
    .update(`bhrigu-btc-research-field-turn-v1:${canonical}`, "utf8")
    .digest("hex");
}

export function buildBtcResearchContinuityDigest(input: { question: string; result: BtcCleanChatResponse }): string {
  return JSON.stringify({
    question: input.question.slice(0, 500),
    topic: input.result.topic,
    as_of: input.result.as_of,
    answer: input.result.answer.slice(0, 1200),
    sources: input.result.sources.slice(0, 8).map((source) => ({ id: source.id, label: source.label, as_of: source.as_of })),
    evidence: input.result.evidence,
    boundary: input.result.boundary,
  });
}

export function buildBtcResearchFieldModelContext(
  field: BtcResearchFieldRecord,
  baseline: BtcResearchFieldCheckpoint | null,
  latest: BtcResearchFieldCheckpoint | null,
): BtcResearchFieldModelContext {
  return {
    field_title: field.title,
    primary_question: field.primaryQuestion,
    time_horizon: field.timeHorizon,
    evidence_preferences: field.evidencePreferences,
    watch_conditions: field.watchConditions,
    exact_polymarket_contracts: field.exactPolymarketContracts,
    baseline_digest: baseline?.continuityDigest ?? null,
    latest_checkpoint_digest: latest?.continuityDigest ?? null,
    memory_boundary: "Persisted field memory is user-owned historical context only. It never overrides current evidence, source authority, expiry, resolution rules, or safety boundaries.",
  };
}
