import { createHash, randomUUID } from "node:crypto";
import { BTC_DIRECT_SERVICE_MS, BTC_DIRECT_USD_PRICE_CENTS } from "./btc-direct-payment";
import type { BtcCleanLocale } from "./btc-clean-chat-v1";
import { hashBtcResearchFieldSecret, newBtcResearchFieldIdentity } from "./btc-research-field-v1";

export const PHI_BTC_TIMING_WINDOWS_PRODUCT_ID = "PHI_BTC_TIMING_WINDOWS_FOUNDING_V1" as const;
export const PHI_BTC_TIMING_WINDOWS_PRICE_CENTS = 4_900 as const;
export const PHI_BTC_TIMING_WINDOWS_SERVICE_MS = 30 * 24 * 60 * 60 * 1000;
export const PHI_BTC_TIMING_WINDOWS_MAX_RUNS = 6 as const;
export const PHI_BTC_TIMING_WINDOWS_MAX_RUN_COST_MICROS = 800_000 as const;
export const PHI_BTC_TIMING_WINDOWS_MAX_TOTAL_COST_MICROS = 4_800_000 as const;
export const PHI_BTC_TIMING_WINDOWS_CLOSEOUT_GRACE_MS = 24 * 60 * 60 * 1000;
export const PHI_BTC_TIMING_WINDOWS_COOKIE = "bhrigu_phi_btc_timing_windows_v1";

export const PHI_BTC_TIMING_WINDOWS_RUNS = [
  "BASELINE", "DAY_7", "DAY_14", "DAY_21", "DAY_28", "DAY_30_CLOSEOUT",
] as const;
export type PhiBtcTimingWindowsRun = typeof PHI_BTC_TIMING_WINDOWS_RUNS[number];
export type PhiBtcTimingWindowsEntitlementState = "PENDING_PAYMENT" | "ACTIVE";

export type PhiBtcTimingWindowsOrderRecord = {
  kind: "PHI_BTC_TIMING_WINDOWS_PRODUCT_ORDER";
  product_id: typeof PHI_BTC_TIMING_WINDOWS_PRODUCT_ID;
  product_order_id: string;
  research_object_id: string;
  secret_hash: string;
  locale: BtcCleanLocale;
  price_usd_cents: typeof PHI_BTC_TIMING_WINDOWS_PRICE_CENTS;
  duration_days: 30;
  payment_rail: "BTC_DIRECT_PAYMENT_V1";
  order_state: "PRODUCT_ORDER_ACCEPTED";
  entitlement_state: PhiBtcTimingWindowsEntitlementState;
  service_start: string | null;
  service_end: string | null;
  preview_only: true;
};

const ORDER_ID = /^ptwo_[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const OBJECT_ID = /^btcrf_[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

export function newPhiBtcTimingWindowsIdentity(locale: BtcCleanLocale) {
  const productOrderId = `ptwo_${randomUUID()}`;
  const fieldIdentity = newBtcResearchFieldIdentity();
  const record: PhiBtcTimingWindowsOrderRecord = {
    kind: "PHI_BTC_TIMING_WINDOWS_PRODUCT_ORDER",
    product_id: PHI_BTC_TIMING_WINDOWS_PRODUCT_ID,
    product_order_id: productOrderId,
    research_object_id: fieldIdentity.fieldId,
    secret_hash: fieldIdentity.secretHash,
    locale,
    price_usd_cents: PHI_BTC_TIMING_WINDOWS_PRICE_CENTS,
    duration_days: 30,
    payment_rail: "BTC_DIRECT_PAYMENT_V1",
    order_state: "PRODUCT_ORDER_ACCEPTED",
    entitlement_state: "PENDING_PAYMENT",
    service_start: null,
    service_end: null,
    preview_only: true,
  };
  return { record, secret: fieldIdentity.secret };
}

export function isPhiBtcTimingWindowsOrderRecord(value: unknown): value is PhiBtcTimingWindowsOrderRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const item = value as Record<string, unknown>;
  return item.kind === "PHI_BTC_TIMING_WINDOWS_PRODUCT_ORDER"
    && item.product_id === PHI_BTC_TIMING_WINDOWS_PRODUCT_ID
    && typeof item.product_order_id === "string" && ORDER_ID.test(item.product_order_id)
    && typeof item.research_object_id === "string" && OBJECT_ID.test(item.research_object_id)
    && typeof item.secret_hash === "string" && /^[a-f0-9]{64}$/.test(item.secret_hash)
    && (item.locale === "en" || item.locale === "ru")
    && item.price_usd_cents === PHI_BTC_TIMING_WINDOWS_PRICE_CENTS
    && item.duration_days === 30
    && item.payment_rail === "BTC_DIRECT_PAYMENT_V1"
    && item.order_state === "PRODUCT_ORDER_ACCEPTED"
    && (item.entitlement_state === "PENDING_PAYMENT" || item.entitlement_state === "ACTIVE")
    && (item.service_start === null || typeof item.service_start === "string")
    && (item.service_end === null || typeof item.service_end === "string")
    && item.preview_only === true;
}
export function phiBtcTimingWindowsOrderPayloadHash(record: PhiBtcTimingWindowsOrderRecord): string {
  return createHash("sha256").update(JSON.stringify(record), "utf8").digest("hex");
}

export function verifyPhiBtcTimingWindowsSecret(record: PhiBtcTimingWindowsOrderRecord, secret: string): boolean {
  return /^[A-Za-z0-9_-]{40,80}$/.test(secret) && hashBtcResearchFieldSecret(secret) === record.secret_hash;
}

export function activatePhiBtcTimingWindowsRecord(
  record: PhiBtcTimingWindowsOrderRecord,
  serviceStart: string,
  serviceEnd: string,
): PhiBtcTimingWindowsOrderRecord {
  const start = new Date(serviceStart);
  const end = new Date(serviceEnd);
  if (record.entitlement_state !== "PENDING_PAYMENT") throw new Error("timing_windows_not_pending_payment");
  if (!Number.isFinite(start.getTime()) || end.getTime() - start.getTime() !== PHI_BTC_TIMING_WINDOWS_SERVICE_MS) {
    throw new Error("timing_windows_payment_window_invalid");
  }
  return {
    ...record,
    entitlement_state: "ACTIVE",
    service_start: start.toISOString(),
    service_end: end.toISOString(),
  };
}

export function phiBtcTimingWindowsCookie(researchObjectId: string, secret: string, serviceEnd?: string | null): string {
  const defaultAge = 60 * 60;
  const serviceAge = serviceEnd ? Math.floor((new Date(serviceEnd).getTime() + PHI_BTC_TIMING_WINDOWS_CLOSEOUT_GRACE_MS - Date.now()) / 1000) : defaultAge;
  const maxAge = Math.max(0, Math.min(31 * 24 * 60 * 60, serviceAge));
  return `${PHI_BTC_TIMING_WINDOWS_COOKIE}=${researchObjectId}.${secret}; Path=/api/btc/timing-windows/v1; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Lax`;
}

export function parsePhiBtcTimingWindowsCookie(value: unknown): { researchObjectId: string; secret: string } | null {
  if (typeof value !== "string") return null;
  const i = value.indexOf(".");
  if (i < 1) return null;
  const researchObjectId = value.slice(0, i);
  const secret = value.slice(i + 1);
  return OBJECT_ID.test(researchObjectId) && /^[A-Za-z0-9_-]{40,80}$/.test(secret)
    ? { researchObjectId, secret }
    : null;
}

export type PhiBtcTimingWindowsUsageSummary = { providerBearingRuns: number; nominalCostMicros: number };
export function admitPhiBtcTimingWindowsRun(summary: PhiBtcTimingWindowsUsageSummary, hardCostMicros: number) {
  if (summary.providerBearingRuns >= PHI_BTC_TIMING_WINDOWS_MAX_RUNS) return { allowed: false as const, code: "RUN_LIMIT" as const };
  if (!Number.isFinite(hardCostMicros) || hardCostMicros < 0 || hardCostMicros > PHI_BTC_TIMING_WINDOWS_MAX_RUN_COST_MICROS) {
    return { allowed: false as const, code: "RUN_COST_LIMIT" as const };
  }
  if (summary.nominalCostMicros + hardCostMicros > PHI_BTC_TIMING_WINDOWS_MAX_TOTAL_COST_MICROS) {
    return { allowed: false as const, code: "TOTAL_COST_LIMIT" as const };
  }
  return { allowed: true as const };
}
export function assertPhiBtcTimingWindowsPaymentCompatibility(): void {
  if (BTC_DIRECT_USD_PRICE_CENTS !== PHI_BTC_TIMING_WINDOWS_PRICE_CENTS) throw new Error("timing_windows_price_mismatch");
  if (BTC_DIRECT_SERVICE_MS !== PHI_BTC_TIMING_WINDOWS_SERVICE_MS) throw new Error("timing_windows_service_window_mismatch");
}

export const PHI_BTC_TIMING_WINDOWS_CONTRACT = {
  productId: PHI_BTC_TIMING_WINDOWS_PRODUCT_ID,
  priceCents: PHI_BTC_TIMING_WINDOWS_PRICE_CENTS,
  durationDays: 30,
  maxRuns: PHI_BTC_TIMING_WINDOWS_MAX_RUNS,
  maxRunCostMicros: PHI_BTC_TIMING_WINDOWS_MAX_RUN_COST_MICROS,
  maxTotalCostMicros: PHI_BTC_TIMING_WINDOWS_MAX_TOTAL_COST_MICROS,
  runSlots: PHI_BTC_TIMING_WINDOWS_RUNS,
  paymentRail: "BTC_DIRECT_PAYMENT_V1",
  closeoutGraceHours: 24,
  productionActivation: false,
} as const;
