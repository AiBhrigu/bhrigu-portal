import { createHmac, randomBytes } from "node:crypto";
import { isIP } from "node:net";

export const BTC_DONATION_ADMISSION_COOKIE = "bhrigu_btc_support_client_v1";
export const BTC_DONATION_ADMISSION_COOKIE_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;
export const BTC_DONATION_ADMISSION_SECRET_ENV = "BTC_DONATION_ADMISSION_SECRET";
const CLIENT_TOKEN = /^[A-Za-z0-9_-]{32,128}$/;

export type DonationAdmissionConfig =
  | { enabled: false }
  | { enabled: true; secret: string };

export function getDonationAdmissionConfig(env: Partial<NodeJS.ProcessEnv> = process.env): DonationAdmissionConfig {
  const secret = env[BTC_DONATION_ADMISSION_SECRET_ENV]?.trim() ?? "";
  if (secret.length < 32 || secret.length > 512) return { enabled: false };
  return { enabled: true, secret };
}

export function newDonationAdmissionClientToken(): string {
  return randomBytes(24).toString("base64url");
}

export function normalizeDonationAdmissionClientToken(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const token = value.trim();
  return CLIENT_TOKEN.test(token) ? token : null;
}

export function normalizeVercelClientIp(value: string | string[] | undefined): string {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return "unavailable";
  const first = raw.split(",", 1)[0]?.trim() ?? "";
  return isIP(first) ? first : "unavailable";
}

function keyed(secret: string, namespace: string, value: string): string {
  return createHmac("sha256", secret).update(`${namespace}:${value}`, "utf8").digest("hex");
}

export function donationAdmissionKeys(secret: string, clientToken: string, clientIp: string) {
  const token = normalizeDonationAdmissionClientToken(clientToken);
  if (!token) throw new Error("invalid_donation_admission_client_token");
  return {
    clientKey: keyed(secret, "client", token),
    ipKey: keyed(secret, "ip", clientIp),
  };
}

export function donationAdmissionCookie(token: string): string {
  const normalized = normalizeDonationAdmissionClientToken(token);
  if (!normalized) throw new Error("invalid_donation_admission_client_token");
  return `${BTC_DONATION_ADMISSION_COOKIE}=${normalized}; Path=/; Max-Age=${BTC_DONATION_ADMISSION_COOKIE_MAX_AGE_SECONDS}; HttpOnly; Secure; SameSite=Lax`;
}
