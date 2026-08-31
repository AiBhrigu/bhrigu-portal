import { neon } from "@neondatabase/serverless";
import type { BtcCleanLocale } from "./btc-clean-chat-v1";
import {
  activatePhiBtcTimingWindowsRecord,
  isPhiBtcTimingWindowsOrderRecord,
  newPhiBtcTimingWindowsIdentity,
  phiBtcTimingWindowsOrderPayloadHash,
  type PhiBtcTimingWindowsOrderRecord,
} from "./phi-btc-timing-windows-v1";

export type PhiBtcTimingWindowsPreviewConfig = { enabled: true; databaseUrl: string } | { enabled: false };
export function getPhiBtcTimingWindowsPreviewConfig(env: Partial<NodeJS.ProcessEnv> = process.env): PhiBtcTimingWindowsPreviewConfig {
  const databaseUrl = env.DATABASE_URL?.trim();
  if (env.VERCEL_ENV !== "preview" || !databaseUrl) return { enabled: false };
  return { enabled: true, databaseUrl };
}

function parseRecord(value: unknown): PhiBtcTimingWindowsOrderRecord | null {
  const candidate = typeof value === "string" ? safeJson(value) : value;
  return isPhiBtcTimingWindowsOrderRecord(candidate) ? candidate : null;
}
function safeJson(value: string): unknown { try { return JSON.parse(value); } catch { return null; } }

export async function createPreviewPhiBtcTimingWindowsOrder(databaseUrl: string, locale: BtcCleanLocale) {
  const sql = neon(databaseUrl);
  const identity = newPhiBtcTimingWindowsIdentity(locale);
  const record = identity.record;
  const payloadHash = phiBtcTimingWindowsOrderPayloadHash(record);
  const idempotencyKey = `timing-windows-preview-${record.product_order_id}`;
  const at = new Date().toISOString();
  const rows = await sql`
    INSERT INTO access_intake_requests (
      request_id,idempotency_key,payload_hash,record,status,created_at,updated_at
    ) VALUES (
      ${record.product_order_id},${idempotencyKey},${payloadHash},${JSON.stringify(record)}::jsonb,
      'accepted',${at},${at}
    ) RETURNING record
  `;
  const stored = parseRecord(rows[0]?.record);
  if (!stored) throw new Error("timing_windows_preview_order_create_failed");
  return { record: stored, secret: identity.secret };
}

export async function findPreviewPhiBtcTimingWindowsByObject(databaseUrl: string, researchObjectId: string) {
  const sql = neon(databaseUrl);
  const rows = await sql`
    SELECT record FROM access_intake_requests
    WHERE record->>'kind'='PHI_BTC_TIMING_WINDOWS_PRODUCT_ORDER'
      AND record->>'research_object_id'=${researchObjectId}
    LIMIT 1
  `;
  return rows[0] ? parseRecord(rows[0].record) : null;
}
export async function findPreviewPhiBtcTimingWindowsByOrder(databaseUrl: string, productOrderId: string) {
  const sql = neon(databaseUrl);
  const rows = await sql`
    SELECT record FROM access_intake_requests
    WHERE request_id=${productOrderId}
      AND record->>'kind'='PHI_BTC_TIMING_WINDOWS_PRODUCT_ORDER'
    LIMIT 1
  `;
  return rows[0] ? parseRecord(rows[0].record) : null;
}

export async function activatePhiBtcTimingWindowsEntitlementFromPaymentWindow(
  databaseUrl: string,
  productOrderId: string,
  serviceStart: string,
  serviceEnd: string,
) {
  const current = await findPreviewPhiBtcTimingWindowsByOrder(databaseUrl, productOrderId);
  if (!current) return null;
  const next = activatePhiBtcTimingWindowsRecord(current, serviceStart, serviceEnd);
  const sql = neon(databaseUrl);
  const at = new Date().toISOString();
  const rows = await sql`
    UPDATE access_intake_requests
    SET record=${JSON.stringify(next)}::jsonb,status='in_processing',updated_at=${at}
    WHERE request_id=${productOrderId}
      AND record->>'entitlement_state'='PENDING_PAYMENT'
    RETURNING record
  `;
  const stored = parseRecord(rows[0]?.record);
  return stored ?? null;
}

export async function activatePreviewPhiBtcTimingWindowsEntitlement(
  databaseUrl: string,
  researchObjectId: string,
  now = new Date(),
) {
  const current = await findPreviewPhiBtcTimingWindowsByObject(databaseUrl, researchObjectId);
  if (!current) return null;
  const start = now.toISOString();
  const end = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
  return activatePhiBtcTimingWindowsEntitlementFromPaymentWindow(
    databaseUrl, current.product_order_id, start, end,
  );
}
