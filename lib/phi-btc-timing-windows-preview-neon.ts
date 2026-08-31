import { neon } from "@neondatabase/serverless";
import type { BtcCleanLocale } from "./btc-clean-chat-v1";
import {
  activatePhiBtcTimingWindowsRecord,
  isPhiBtcTimingWindowsOrderRecord,
  newPhiBtcTimingWindowsIdentity,
  phiBtcTimingWindowsOrderPayloadHash,
  type PhiBtcTimingWindowsOrderRecord,
  PHI_BTC_TIMING_WINDOWS_MAX_RUN_COST_MICROS,
  PHI_BTC_TIMING_WINDOWS_MAX_TOTAL_COST_MICROS,
  type PhiBtcTimingWindowsRun,
} from "./phi-btc-timing-windows-v1";
import {
  isPhiTimingWindowsRunResult,
  phiTimingWindowsCanonicalHash,
  PHI_BTC_TIMING_WINDOWS_RUN_CLAIM_MS,
  type PhiBtcTimingWindowsRunResult,
} from "./phi-btc-timing-windows-execution-v1";

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


function parseRun(value: unknown): PhiBtcTimingWindowsRunResult | null {
  const candidate = typeof value === "string" ? safeJson(value) : value;
  return isPhiTimingWindowsRunResult(candidate) ? candidate : null;
}

export async function listPreviewPhiBtcTimingWindowsRuns(databaseUrl: string, productOrderId: string) {
  const sql = neon(databaseUrl);
  const rows = await sql`
    SELECT record FROM access_intake_requests
    WHERE record->>'kind'='PHI_BTC_TIMING_WINDOWS_RUN_RESULT'
      AND record->>'product_order_id'=${productOrderId}
    ORDER BY created_at ASC,request_id ASC
  `;
  return rows.flatMap((row) => { const parsed = parseRun(row.record); return parsed ? [parsed] : []; });
}

export async function claimPreviewPhiBtcTimingWindowsRun(
  databaseUrl: string,
  productOrderId: string,
  slot: PhiBtcTimingWindowsRun,
  claimId: string,
  now = new Date(),
) {
  const sql = neon(databaseUrl);
  const at = now.toISOString();
  const staleBefore = new Date(now.getTime() - PHI_BTC_TIMING_WINDOWS_RUN_CLAIM_MS).toISOString();
  const rows = await sql`
    UPDATE access_intake_requests
    SET record=jsonb_set(
      record,'{execution_claim}',
      jsonb_build_object('claim_id',${claimId},'slot',${slot},'claimed_at',${at}),true
    ),updated_at=${at}
    WHERE request_id=${productOrderId}
      AND record->>'kind'='PHI_BTC_TIMING_WINDOWS_PRODUCT_ORDER'
      AND record->>'entitlement_state'='ACTIVE'
      AND (
        record->'execution_claim' IS NULL
        OR (
          (record->'execution_claim'->>'claimed_at')::timestamptz < ${staleBefore}::timestamptz
          AND COALESCE((record->'execution_claim'->>'reserved_cost_micros')::bigint,0)=0
        )
      )
      AND NOT EXISTS (
        SELECT 1 FROM access_intake_requests r
        WHERE r.record->>'kind'='PHI_BTC_TIMING_WINDOWS_RUN_RESULT'
          AND r.record->>'product_order_id'=${productOrderId}
          AND r.record->>'slot'=${slot}
      )
    RETURNING record
  `;
  return rows[0] ? parseRecord(rows[0].record) : null;
}


export async function reservePreviewPhiBtcTimingWindowsRunCost(
  databaseUrl: string,
  productOrderId: string,
  claimId: string,
  projectedRunHardCostMicros: number,
) {
  const sql = neon(databaseUrl);
  const rows = await sql`
    WITH completed AS (
      SELECT COALESCE(SUM((r.record->'usage'->>'nominal_cost_micros')::bigint),0)::bigint AS micros
      FROM access_intake_requests r
      WHERE r.record->>'kind'='PHI_BTC_TIMING_WINDOWS_RUN_RESULT'
        AND r.record->>'product_order_id'=${productOrderId}
    )
    UPDATE access_intake_requests o
    SET record=jsonb_set(
      o.record,'{execution_claim,reserved_cost_micros}',to_jsonb(${projectedRunHardCostMicros}::bigint),true
    ),updated_at=NOW()
    FROM completed
    WHERE o.request_id=${productOrderId}
      AND o.record->'execution_claim'->>'claim_id'=${claimId}
      AND ${projectedRunHardCostMicros}::bigint BETWEEN 0 AND ${PHI_BTC_TIMING_WINDOWS_MAX_RUN_COST_MICROS}::bigint
      AND completed.micros + ${projectedRunHardCostMicros}::bigint <= ${PHI_BTC_TIMING_WINDOWS_MAX_TOTAL_COST_MICROS}::bigint
    RETURNING o.request_id
  `;
  if (rows.length !== 1) throw new Error("timing_windows_persistent_cost_reservation_rejected");
}

export async function settlePreviewPhiBtcTimingWindowsRunCost(
  databaseUrl: string,
  productOrderId: string,
  claimId: string,
  actualRunCostMicros: number,
) {
  const sql = neon(databaseUrl);
  const rows = await sql`
    UPDATE access_intake_requests
    SET record=jsonb_set(
      jsonb_set(record,'{execution_claim,actual_cost_micros}',to_jsonb(${actualRunCostMicros}::bigint),true),
      '{execution_claim,reserved_cost_micros}',to_jsonb(${actualRunCostMicros}::bigint),true
    ),updated_at=NOW()
    WHERE request_id=${productOrderId}
      AND record->'execution_claim'->>'claim_id'=${claimId}
      AND ${actualRunCostMicros}::bigint BETWEEN 0 AND COALESCE((record->'execution_claim'->>'reserved_cost_micros')::bigint,0)
    RETURNING request_id
  `;
  if (rows.length !== 1) throw new Error("timing_windows_persistent_cost_settlement_rejected");
}

export async function releasePreviewPhiBtcTimingWindowsRunClaim(databaseUrl: string, productOrderId: string, claimId: string) {
  const sql = neon(databaseUrl);
  await sql`
    UPDATE access_intake_requests
    SET record=record-'execution_claim',updated_at=NOW()
    WHERE request_id=${productOrderId}
      AND record->'execution_claim'->>'claim_id'=${claimId}
      AND COALESCE((record->'execution_claim'->>'reserved_cost_micros')::bigint,0)=0
  `;
}

export async function appendPreviewPhiBtcTimingWindowsRun(
  databaseUrl: string,
  result: PhiBtcTimingWindowsRunResult,
  claimId: string,
) {
  const sql = neon(databaseUrl);
  const payload = JSON.stringify(result);
  const payloadHash = phiTimingWindowsCanonicalHash(result);
  const idempotencyKey = `timing-windows-run-${result.product_order_id}-${result.slot}`;
  const at = result.accepted_at;
  const rows = await sql`
    WITH inserted AS (
      INSERT INTO access_intake_requests(
        request_id,idempotency_key,payload_hash,record,status,created_at,updated_at
      )
      SELECT ${result.run_id},${idempotencyKey},${payloadHash},${payload}::jsonb,'completed',${at},${at}
      WHERE EXISTS (
        SELECT 1 FROM access_intake_requests o
        WHERE o.request_id=${result.product_order_id}
          AND o.record->'execution_claim'->>'claim_id'=${claimId}
          AND o.record->'execution_claim'->>'slot'=${result.slot}
          AND COALESCE((o.record->'execution_claim'->>'actual_cost_micros')::bigint,-1)=${result.usage.nominal_cost_micros}::bigint
          AND COALESCE((o.record->'execution_claim'->>'reserved_cost_micros')::bigint,-1)=${result.usage.nominal_cost_micros}::bigint
      )
      ON CONFLICT (idempotency_key) DO NOTHING
      RETURNING record
    ), cleared AS (
      UPDATE access_intake_requests
      SET record=record-'execution_claim',updated_at=${at}
      WHERE request_id=${result.product_order_id}
        AND record->'execution_claim'->>'claim_id'=${claimId}
        AND EXISTS(SELECT 1 FROM inserted)
      RETURNING request_id
    )
    SELECT record FROM inserted
  `;
  return rows[0] ? parseRun(rows[0].record) : null;
}
