import { createHash, randomUUID } from "node:crypto";
import type { NextApiRequest, NextApiResponse } from "next";
import { neon } from "@neondatabase/serverless";
import { Resend } from "resend";

import { getAccessIntakeRuntimeConfig } from "../../../../lib/access-intake-config";

type Locale = "en" | "ru";
type DistributionSource = "binance_square" | "x" | "bitcointalk" | "direct" | "other";
type FoundingPayload = {
  locale: Locale;
  nameOrHandle: string;
  contact: string;
  trackingQuestion: string;
  currentBitcoinContext: string | null;
  willingToPayAfterScopeAcceptance: boolean;
  distributionSource?: DistributionSource;
  distributionCampaign?: string;
  distributionContent?: string;
};

const KIND = "PHI_BTC_TIMING_WINDOWS_FOUNDING_REQUEST";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  setPrivateNoStore(res);
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, errorCode: "method_not_allowed" });
  }
  if (!['preview', 'production'].includes(process.env.VERCEL_ENV ?? '')) {
    return res.status(404).json({ ok: false, errorCode: "preview_only" });
  }

  const runtime = getAccessIntakeRuntimeConfig();
  if (!runtime.enabled) {
    return res.status(503).json({ ok: false, errorCode: "founding_intake_unavailable" });
  }

  const idempotencyKey = normalizeIdempotencyKey(req.headers["idempotency-key"]);
  if (!idempotencyKey) {
    return res.status(400).json({ ok: false, errorCode: "invalid_idempotency_key" });
  }
  const payload = validatePayload(req.body);
  if (!payload) {
    return res.status(400).json({ ok: false, errorCode: "invalid_payload" });
  }

  const sql = neon(runtime.databaseUrl);
  const createdAt = new Date().toISOString();
  let requestId = `FND-${createdAt.slice(0, 10).replace(/-/g, "")}-${randomUUID()
    .replace(/-/g, "")
    .slice(0, 10)
    .toUpperCase()}`;
  const payloadHash = createHash("sha256")
    .update(JSON.stringify(payload))
    .digest("hex");
  const record = {
    kind: KIND,
    version: "v0_1",
    request_id: requestId,
    created_at: createdAt,
    status: "pending_manual_review",
    product: "PHI_BTC_TIMING_WINDOWS_FOUNDING",
    locale: payload.locale,
    name_or_handle: payload.nameOrHandle,
    contact: payload.contact,
    primary_interest: "BITCOIN_RESEARCH",
    tracking_question: payload.trackingQuestion,
    current_bitcoin_context: payload.currentBitcoinContext,
    willingness_to_pay_after_scope_acceptance:
      payload.willingToPayAfterScopeAcceptance,
    distribution: {
      source: payload.distributionSource ?? "direct",
      campaign: payload.distributionCampaign ?? null,
      content: payload.distributionContent ?? null,
    },
    boundaries: {
      request_is_payment: false,
      guaranteed_access: false,
      trading_signal: false,
      automated_trading: false,
      manual_review_required: true,
    },
  };

  let created = false;
  try {
    const [insertedRows] = await sql.transaction((tx) => [
      tx`
        INSERT INTO access_intake_requests (
          request_id,idempotency_key,payload_hash,record,status,created_at,updated_at
        ) VALUES (
          ${requestId},${idempotencyKey},${payloadHash},${JSON.stringify(record)}::jsonb,
          'pending_manual_review',${createdAt},${createdAt}
        )
        ON CONFLICT (idempotency_key) DO NOTHING
        RETURNING request_id
      `,
      tx`
        INSERT INTO access_intake_deliveries(request_id,kind,idempotency_key,state)
        SELECT request_id,'operator_notification',${`founding-${requestId}-operator-v1`},'pending'
        FROM access_intake_requests
        WHERE idempotency_key=${idempotencyKey}
          AND payload_hash=${payloadHash}
        ON CONFLICT (request_id,kind) DO NOTHING
      `,
    ]);
    created = Array.isArray(insertedRows) && insertedRows.length === 1;
    if (!created) {
      const existing = await sql`
        SELECT request_id,payload_hash,record->>'kind' AS kind
        FROM access_intake_requests
        WHERE idempotency_key=${idempotencyKey}
        LIMIT 1
      `;
      if (
        !existing[0] ||
        existing[0].payload_hash !== payloadHash ||
        existing[0].kind !== KIND
      ) {
        return res
          .status(409)
          .json({ ok: false, errorCode: "idempotency_conflict" });
      }
      requestId = String(existing[0].request_id);
    }
  } catch {
    return res.status(503).json({ ok: false, errorCode: "storage_unavailable" });
  }

  let operatorNotification = "pending";
  try {
    const claimed = await sql`
      UPDATE access_intake_deliveries
      SET state='sending',attempts=attempts+1,claimed_at=NOW(),updated_at=NOW(),last_error_code=NULL
      WHERE request_id=${requestId}
        AND kind='operator_notification'
        AND (
          state IN ('pending','failed')
          OR (state='sending' AND claimed_at < NOW() - INTERVAL '5 minutes')
        )
      RETURNING idempotency_key
    `;
    if (claimed[0]?.idempotency_key) {
      const resend = new Resend(runtime.resendApiKey);
      const { data, error } = await resend.emails.send(
        {
          from: runtime.fromEmail,
          to: runtime.operatorEmail,
          replyTo: runtime.replyToEmail,
          subject: `BHRIGU founding request · ${payload.nameOrHandle}`,
          text: buildOperatorText(requestId, createdAt, payload),
        },
        { idempotencyKey: String(claimed[0].idempotency_key) }
      );
      if (error || !data?.id) {
        throw new Error(error?.name || "resend_delivery_failed");
      }
      await sql`
        UPDATE access_intake_deliveries
        SET state='delivered',provider_message_id=${data.id},delivered_at=NOW(),updated_at=NOW(),last_error_code=NULL
        WHERE request_id=${requestId}
          AND kind='operator_notification'
          AND state='sending'
      `;
    }
    const stateRows = await sql`
      SELECT state FROM access_intake_deliveries
      WHERE request_id=${requestId} AND kind='operator_notification'
      LIMIT 1
    `;
    operatorNotification = String(stateRows[0]?.state ?? "pending");
  } catch (error) {
    operatorNotification = "failed";
    try {
      await sql`
        UPDATE access_intake_deliveries
        SET state='failed',last_error_code=${
          error instanceof Error ? error.name.slice(0, 80) : "delivery_failed"
        },updated_at=NOW()
        WHERE request_id=${requestId}
          AND kind='operator_notification'
          AND state='sending'
      `;
    } catch {
      // The founding request remains durable even if notification bookkeeping fails.
    }
  }

  return res.status(created ? 201 : 200).json({
    ok: true,
    requestId,
    status: "pending_manual_review",
    requestIsPayment: false,
    guaranteedAccess: false,
    operatorNotification,
    replayed: !created,
  });
}

function validatePayload(input: unknown): FoundingPayload | null {
  if (!input || typeof input !== "object") return null;
  const value = input as Record<string, unknown>;
  const locale: Locale = value.locale === "ru" ? "ru" : "en";
  const nameOrHandle = text(value.nameOrHandle, 120);
  const contact = text(value.contact, 240);
  const trackingQuestion = text(value.trackingQuestion, 1200);
  const context = text(value.currentBitcoinContext, 1200);
  const distributionSource = normalizeDistributionSource(value.distributionSource);
  const distributionCampaign = normalizeDistributionId(value.distributionCampaign);
  const distributionContent = normalizeDistributionId(value.distributionContent);
  if (
    nameOrHandle.length < 2 ||
    contact.length < 3 ||
    trackingQuestion.length < 10
  ) {
    return null;
  }
  return {
    locale,
    nameOrHandle,
    contact,
    trackingQuestion,
    currentBitcoinContext: context || null,
    willingToPayAfterScopeAcceptance:
      value.willingToPayAfterScopeAcceptance === true,
    ...(distributionSource ? { distributionSource } : {}),
    ...(distributionCampaign ? { distributionCampaign } : {}),
    ...(distributionContent ? { distributionContent } : {}),
  };
}

function text(value: unknown, max: number) {
  return typeof value === "string"
    ? value.trim().replace(/\s+/g, " ").slice(0, max)
    : "";
}

function normalizeDistributionSource(value: unknown): DistributionSource | undefined {
  if (typeof value !== "string" || !value.trim()) return undefined;
  const normalized = value.trim().toLowerCase();
  if (["binance_square", "binance-square", "binance"].includes(normalized)) return "binance_square";
  if (["x", "twitter"].includes(normalized)) return "x";
  if (normalized === "bitcointalk") return "bitcointalk";
  if (normalized === "direct") return "direct";
  return "other";
}

function normalizeDistributionId(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim();
  return /^[A-Za-z0-9._:-]{1,80}$/.test(normalized) ? normalized : undefined;
}

function normalizeIdempotencyKey(value: string | string[] | undefined) {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  if (normalized.length < 16 || normalized.length > 128) return null;
  return /^[A-Za-z0-9._:-]+$/.test(normalized) ? normalized : null;
}

function buildOperatorText(
  requestId: string,
  createdAt: string,
  payload: FoundingPayload
) {
  return [
    "BHRIGU · Φ BTC Timing Windows · Founding request",
    `Request: ${requestId}`,
    `Submitted: ${createdAt}`,
    `Name / handle: ${payload.nameOrHandle}`,
    `Contact: ${payload.contact}`,
    "Primary interest: BITCOIN_RESEARCH",
    `Track: ${payload.trackingQuestion}`,
    `Current Bitcoin context: ${payload.currentBitcoinContext ?? "—"}`,
    `Willing to pay after scope acceptance: ${
      payload.willingToPayAfterScopeAcceptance ? "YES" : "NO / NOT STATED"
    }`,
    `Distribution source: ${payload.distributionSource ?? "direct"}`,
    `Distribution campaign: ${payload.distributionCampaign ?? "—"}`,
    `Distribution content: ${payload.distributionContent ?? "—"}`,
    "Boundary: NON-PAYMENT · NO GUARANTEED ACCESS · NO TRADING SIGNAL · NO AUTOMATED TRADING · MANUAL REVIEW",
  ].join("\n");
}

function setPrivateNoStore(res: NextApiResponse) {
  res.setHeader("Cache-Control", "private, no-store, max-age=0");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("X-Content-Type-Options", "nosniff");
}
