import { createHmac, randomBytes } from "node:crypto";
import type { NextApiRequest, NextApiResponse } from "next";
import {
  BTC_OBSERVABILITY_COOKIE,
  BTC_OBSERVABILITY_CLIENT_EVENTS,
  BTC_OBSERVABILITY_EVENT_TYPES,
  normalizeAttribution,
  normalizeObservabilityId,
  type BtcObservabilityEventType,
  type BtcObservabilityLocale,
  type BtcObservabilitySurface,
} from "./btc-observability-contract";

const COOKIE_TOKEN = /^[A-Za-z0-9_-]{32,128}$/;
const EVENT_TYPES = new Set<string>(BTC_OBSERVABILITY_EVENT_TYPES);
const SURFACES = new Set<BtcObservabilitySurface>(["btc_clean_chat", "btc_support"]);
const FORBIDDEN_CLIENT_FIELDS = new Set(["question","answer","priorTurns","rawIp","ip","userAgent","referrerUrl","walletAddress"]);
const COOKIE_AGE_SECONDS = 30 * 24 * 60 * 60;
export const BTC_OBSERVABILITY_PRICE_POLICY = "openai-gpt-5.6-sol-2026-08-22-v1" as const;

export type BtcObservabilityConfig = {
  enabled: true;
  databaseUrl: string;
  secret: string;
  readSecret: string;
} | { enabled: false };

export type BtcObservabilityRecord = {
  eventType: BtcObservabilityEventType;
  anonBrowserKey: string;
  visitSessionId: string;
  locale: BtcObservabilityLocale;
  surface: BtcObservabilitySurface;
  chatTurnId: string | null;
  donationSessionId: string | null;
  model: string | null;
  inputTokens: number | null;
  outputTokens: number | null;
  webSearchCalls: number | null;
  nominalCostMicros: number | null;
  pricePolicy: string | null;
  completionStatus: "completed" | "failed" | null;
  errorClass: string | null;
  trafficSource: string;
  trafficMedium: string;
  trafficCampaign: string | null;
};

function envValue(env: Partial<NodeJS.ProcessEnv>, key: string): string {
  return env[key]?.trim() ?? "";
}

export function getBtcObservabilityConfig(env: Partial<NodeJS.ProcessEnv> = process.env): BtcObservabilityConfig {
  const mode = envValue(env, "BHRIGU_BTC_OBSERVABILITY_MODE");
  const allowed = (env.VERCEL_ENV === "preview" && mode === "preview") || (env.VERCEL_ENV === "production" && mode === "production");
  const databaseUrl = envValue(env, "BTC_OBSERVABILITY_DATABASE_URL");
  const secret = envValue(env, "BTC_OBSERVABILITY_SECRET");
  const readSecret = envValue(env, "BTC_OBSERVABILITY_READ_SECRET");
  if (!allowed || !databaseUrl || secret.length < 32 || readSecret.length < 32) return { enabled: false };
  return { enabled: true, databaseUrl, secret, readSecret };
}

function browserKey(secret: string, token: string): string {
  return createHmac("sha256", secret).update(`browser:${token}`, "utf8").digest("hex");
}

export function ensureBtcObserver(req: NextApiRequest, res: NextApiResponse, secret: string): string {
  const existing = req.cookies?.[BTC_OBSERVABILITY_COOKIE]?.trim() ?? "";
  const token = COOKIE_TOKEN.test(existing) ? existing : randomBytes(24).toString("base64url");
  if (!COOKIE_TOKEN.test(existing)) {
    const cookie = `${BTC_OBSERVABILITY_COOKIE}=${token}; Path=/; Max-Age=${COOKIE_AGE_SECONDS}; HttpOnly; Secure; SameSite=Lax`;
    const prior = res.getHeader("Set-Cookie");
    const values = Array.isArray(prior) ? prior.map(String) : prior ? [String(prior)] : [];
    res.setHeader("Set-Cookie", [...values, cookie]);
  }
  return browserKey(secret, token);
}

function locale(value: unknown): BtcObservabilityLocale { return value === "ru" ? "ru" : "en"; }
function surface(value: unknown): BtcObservabilitySurface | null {
  return typeof value === "string" && SURFACES.has(value as BtcObservabilitySurface) ? value as BtcObservabilitySurface : null;
}

export function parseClientObservabilityEvent(body: unknown): Omit<BtcObservabilityRecord, "anonBrowserKey"> | null {
  const item = body && typeof body === "object" && !Array.isArray(body) ? body as Record<string, unknown> : {};
  if (Object.keys(item).some((key) => FORBIDDEN_CLIENT_FIELDS.has(key))) return null;
  const eventType = typeof item.eventType === "string" && EVENT_TYPES.has(item.eventType) ? item.eventType as BtcObservabilityEventType : null;
  if (!eventType || !BTC_OBSERVABILITY_CLIENT_EVENTS.has(eventType)) return null;
  const targetSurface = surface(item.surface);
  const obs = item.observability && typeof item.observability === "object" && !Array.isArray(item.observability) ? item.observability as Record<string, unknown> : {};
  const visitSessionId = normalizeObservabilityId(obs.visitSessionId);
  if (!targetSurface || !visitSessionId) return null;
  const attribution = normalizeAttribution(obs);
  const chatTurnId = normalizeObservabilityId(item.chatTurnId);
  const donationSessionId = normalizeObservabilityId(item.donationSessionId);
  if (eventType === "BTC_SUPPORT_SESSION_STARTED" || eventType === "BTC_SUPPORT_RECEIPT_OBSERVED") {
    if (!donationSessionId) return null;
  }
  return {
    eventType,
    visitSessionId,
    locale: locale(item.locale),
    surface: targetSurface,
    chatTurnId,
    donationSessionId,
    model: null,
    inputTokens: null,
    outputTokens: null,
    webSearchCalls: null,
    nominalCostMicros: null,
    pricePolicy: null,
    completionStatus: null,
    errorClass: null,
    trafficSource: attribution.source,
    trafficMedium: attribution.medium,
    trafficCampaign: attribution.campaign,
  };
}

export function nominalOpenAiCostMicros(inputTokens: number, outputTokens: number, webSearchCalls: number): number {
  for (const value of [inputTokens, outputTokens, webSearchCalls]) {
    if (!Number.isSafeInteger(value) || value < 0) throw new Error("observability_usage_invalid");
  }
  return inputTokens * 5 + outputTokens * 30 + webSearchCalls * 10_000;
}

export function parseChatObservability(body: Record<string, unknown>) {
  const obs = body.observability && typeof body.observability === "object" && !Array.isArray(body.observability) ? body.observability as Record<string, unknown> : {};
  const visitSessionId = normalizeObservabilityId(obs.visitSessionId);
  const chatTurnId = normalizeObservabilityId(obs.chatTurnId);
  if (!visitSessionId || !chatTurnId) return null;
  return { visitSessionId, chatTurnId, ...normalizeAttribution(obs) };
}
