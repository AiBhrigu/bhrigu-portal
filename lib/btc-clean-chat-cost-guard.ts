import { createHmac, randomBytes, randomUUID } from "node:crypto";
import { isIP } from "node:net";
import type { NextApiRequest, NextApiResponse } from "next";

export const BTC_CLEAN_CHAT_GUARD_COOKIE = "bhrigu_btc_chat_guard_v1";
export const BTC_CLEAN_CHAT_GUARD_COOKIE_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;
export const BTC_CLEAN_CHAT_GUARD_SECRET_ENV = "BTC_CLEAN_CHAT_ADMISSION_SECRET";
export const BTC_CLEAN_CHAT_GUARD_DATABASE_ENV = "BTC_CLEAN_CHAT_GUARD_DATABASE_URL";
export const BTC_CLEAN_CHAT_GUARD_MODE_ENV = "BHRIGU_BTC_CLEAN_CHAT_GUARD_MODE";
export const BTC_CLEAN_CHAT_CAPACITY_MODE_ENV = "BHRIGU_BTC_CLEAN_CHAT_CAPACITY_MODE";

// Legacy V1 reserve remains accepted during zero-downtime rollout. V2 admission starts at zero cost.
export const BTC_CLEAN_CHAT_BASE_RESERVATION_MICROS = 120_000 as const;
export const BTC_CLEAN_CHAT_INITIAL_RESERVATION_MICROS = 0 as const;
export const BTC_CLEAN_CHAT_GLOBAL_HOUR_CAP_MICROS = 250_000 as const;
export const BTC_CLEAN_CHAT_GLOBAL_DAY_CAP_MICROS = 750_000 as const;
export const BTC_CLEAN_CHAT_GLOBAL_MONTH_CAP_MICROS = 4_000_000 as const;

const CLIENT_TOKEN = /^[A-Za-z0-9_-]{32,128}$/;
const TURN_ID = /^[A-Za-z0-9._:-]{8,160}$/;

export type BtcCleanChatGuardConfig =
  | { required: boolean; enabled: false }
  | { required: boolean; enabled: true; databaseUrl: string; secret: string };

function envValue(env: Partial<NodeJS.ProcessEnv>, key: string): string {
  return env[key]?.trim() ?? "";
}

export type BtcCleanChatCapacityMode = "open" | "hold";

export function getBtcCleanChatCapacityMode(env: Partial<NodeJS.ProcessEnv> = process.env): BtcCleanChatCapacityMode {
  const mode = envValue(env, BTC_CLEAN_CHAT_CAPACITY_MODE_ENV).toLowerCase();
  return !mode || mode === "open" ? "open" : "hold";
}

export function getBtcCleanChatGuardConfig(env: Partial<NodeJS.ProcessEnv> = process.env): BtcCleanChatGuardConfig {
  const mode = envValue(env, BTC_CLEAN_CHAT_GUARD_MODE_ENV);
  const productionRequested = env.VERCEL_ENV === "production"
    && env.BHRIGU_BTC_CLEAN_CHAT_PRODUCTION_ENABLE === "1"
    && mode === "production";
  const previewRequested = env.VERCEL_ENV === "preview" && mode === "preview";
  const required = productionRequested;
  if (!productionRequested && !previewRequested) return { required: false, enabled: false };

  const secret = envValue(env, BTC_CLEAN_CHAT_GUARD_SECRET_ENV);
  const databaseUrl = envValue(env, BTC_CLEAN_CHAT_GUARD_DATABASE_ENV) || envValue(env, "BTC_OBSERVABILITY_DATABASE_URL");
  if (secret.length < 32 || secret.length > 512 || !databaseUrl) return { required, enabled: false };
  return { required, enabled: true, databaseUrl, secret };
}

export function newBtcCleanChatGuardClientToken(): string {
  return randomBytes(24).toString("base64url");
}

export function newBtcCleanChatGuardTurnId(): string {
  return `server:${randomUUID()}`;
}

export function normalizeBtcCleanChatGuardClientToken(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const token = value.trim();
  return CLIENT_TOKEN.test(token) ? token : null;
}

export function normalizeBtcCleanChatGuardTurnId(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const turnId = value.trim();
  return TURN_ID.test(turnId) ? turnId : null;
}

export function normalizeBtcCleanChatClientIp(value: string | string[] | undefined): string {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return "unavailable";
  const first = raw.split(",", 1)[0]?.trim() ?? "";
  return isIP(first) ? first : "unavailable";
}

function keyed(secret: string, namespace: string, value: string): string {
  return createHmac("sha256", secret).update(`${namespace}:${value}`, "utf8").digest("hex");
}

export function btcCleanChatGuardKeys(secret: string, clientToken: string, clientIp: string, turnId: string) {
  const token = normalizeBtcCleanChatGuardClientToken(clientToken);
  const normalizedTurnId = normalizeBtcCleanChatGuardTurnId(turnId);
  if (!token || !normalizedTurnId) throw new Error("btc_clean_chat_guard_identity_invalid");
  return {
    clientKey: keyed(secret, "client", token),
    ipKey: keyed(secret, "ip", clientIp),
    admissionKey: keyed(secret, "turn", normalizedTurnId),
  };
}

function appendCookie(res: NextApiResponse, cookie: string) {
  const prior = res.getHeader("Set-Cookie");
  const values = Array.isArray(prior) ? prior.map(String) : prior ? [String(prior)] : [];
  res.setHeader("Set-Cookie", [...values, cookie]);
}

export function ensureBtcCleanChatGuardClient(req: NextApiRequest, res: NextApiResponse, secret: string) {
  const existing = req.cookies?.[BTC_CLEAN_CHAT_GUARD_COOKIE]?.trim() ?? "";
  const token = CLIENT_TOKEN.test(existing) ? existing : newBtcCleanChatGuardClientToken();
  if (!CLIENT_TOKEN.test(existing)) {
    appendCookie(res, `${BTC_CLEAN_CHAT_GUARD_COOKIE}=${token}; Path=/; Max-Age=${BTC_CLEAN_CHAT_GUARD_COOKIE_MAX_AGE_SECONDS}; HttpOnly; Secure; SameSite=Lax`);
  }
  const clientIp = normalizeBtcCleanChatClientIp(req.headers["x-forwarded-for"]);
  return { token, clientIp, secret };
}
