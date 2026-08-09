import { createHash } from "node:crypto";

import type { StoredAccessSubmissionV1 } from "./access-models";
import {
  buildStoredAccessSubmissionRecord,
  generateAccessRequestId,
  validateAccessSubmitPayload,
} from "./access-submit-validation";

export type AccessDeliveryKind = "operator_notification" | "client_confirmation";
export type AccessDeliveryState = "pending" | "sending" | "delivered" | "failed";

export interface AccessIntakeReservation {
  disposition: "created" | "replay" | "conflict";
  record: StoredAccessSubmissionV1;
}

export interface AccessIntakeStore {
  reserve(input: {
    idempotencyKey: string;
    payloadHash: string;
    record: StoredAccessSubmissionV1;
    deliveryKeys: Record<AccessDeliveryKind, string>;
  }): Promise<AccessIntakeReservation>;
  claimDelivery(input: {
    requestId: string;
    kind: AccessDeliveryKind;
    claimedAt: string;
  }): Promise<{
    claimed: boolean;
    idempotencyKey: string | null;
    state: AccessDeliveryState | null;
  }>;
  completeDelivery(input: {
    requestId: string;
    kind: AccessDeliveryKind;
    providerMessageId: string;
    deliveredAt: string;
  }): Promise<void>;
  failDelivery(input: {
    requestId: string;
    kind: AccessDeliveryKind;
    errorCode: string;
    failedAt: string;
  }): Promise<void>;
}

export interface AccessIntakeDelivery {
  send(input: {
    kind: AccessDeliveryKind;
    record: StoredAccessSubmissionV1;
    idempotencyKey: string;
  }): Promise<{ providerMessageId: string }>;
}

export type AccessIntakeResult =
  | {
      ok: true;
      statusCode: 200 | 201 | 202;
      disposition: "created" | "replay";
      requestId: string;
      submittedAt: string;
      deliveryStatus: "delivered" | "pending_retry";
    }
  | {
      ok: false;
      statusCode: 400 | 409 | 503;
      errorCode:
        | "invalid_idempotency_key"
        | "idempotency_conflict"
        | "storage_unavailable"
        | "invalid_payload"
        | "missing_required_field"
        | "verification_required"
        | "critical_date_missing"
        | "ambiguous_date_unresolved"
        | "invalid_email"
        | "invalid_subject_type";
      errorMessage: string;
    };

const DELIVERY_KINDS: AccessDeliveryKind[] = [
  "operator_notification",
  "client_confirmation",
];

export async function processAccessIntake(input: {
  payload: unknown;
  idempotencyKey: string | string[] | undefined;
  store: AccessIntakeStore;
  delivery: AccessIntakeDelivery;
  now?: () => Date;
  requestId?: () => string;
}): Promise<AccessIntakeResult> {
  const idempotencyKey = normalizeIdempotencyKey(input.idempotencyKey);
  if (!idempotencyKey) {
    return {
      ok: false,
      statusCode: 400,
      errorCode: "invalid_idempotency_key",
      errorMessage: "A valid Idempotency-Key header is required.",
    };
  }

  const validation = validateAccessSubmitPayload(input.payload);
  if (validation.ok === false) {
    return {
      ok: false,
      statusCode: 400,
      errorCode: validation.errorCode,
      errorMessage: validation.errorMessage,
    };
  }

  const now = input.now ?? (() => new Date());
  const submittedAt = now().toISOString();
  const requestId = input.requestId?.() ?? generateAccessRequestId(now());
  const payloadHash = hashCanonicalPayload(validation.data);
  const record = buildStoredAccessSubmissionRecord(
    requestId,
    submittedAt,
    validation.data
  );
  const deliveryKeys = buildDeliveryKeys(requestId);

  let reservation: AccessIntakeReservation;
  try {
    reservation = await input.store.reserve({
      idempotencyKey,
      payloadHash,
      record,
      deliveryKeys,
    });
  } catch {
    return {
      ok: false,
      statusCode: 503,
      errorCode: "storage_unavailable",
      errorMessage: "Secure intake storage is unavailable.",
    };
  }

  if (reservation.disposition === "conflict") {
    return {
      ok: false,
      statusCode: 409,
      errorCode: "idempotency_conflict",
      errorMessage: "This Idempotency-Key was already used for a different request.",
    };
  }

  let hasPendingDelivery = false;
  for (const kind of DELIVERY_KINDS) {
    const claimedAt = now().toISOString();
    let claim: Awaited<ReturnType<AccessIntakeStore["claimDelivery"]>>;

    try {
      claim = await input.store.claimDelivery({
        requestId: reservation.record.requestId,
        kind,
        claimedAt,
      });
    } catch {
      hasPendingDelivery = true;
      continue;
    }

    if (!claim.claimed || !claim.idempotencyKey) {
      if (claim.state !== "delivered") hasPendingDelivery = true;
      continue;
    }

    try {
      const delivered = await input.delivery.send({
        kind,
        record: reservation.record,
        idempotencyKey: claim.idempotencyKey,
      });
      await input.store.completeDelivery({
        requestId: reservation.record.requestId,
        kind,
        providerMessageId: delivered.providerMessageId,
        deliveredAt: now().toISOString(),
      });
    } catch (error) {
      hasPendingDelivery = true;
      try {
        await input.store.failDelivery({
          requestId: reservation.record.requestId,
          kind,
          errorCode: normalizeDeliveryError(error),
          failedAt: now().toISOString(),
        });
      } catch {
        // The durable request remains canonical even if delivery bookkeeping is interrupted.
      }
    }
  }

  return {
    ok: true,
    statusCode: hasPendingDelivery
      ? 202
      : reservation.disposition === "created"
      ? 201
      : 200,
    disposition: reservation.disposition,
    requestId: reservation.record.requestId,
    submittedAt: reservation.record.createdAt,
    deliveryStatus: hasPendingDelivery ? "pending_retry" : "delivered",
  };
}

export function normalizeIdempotencyKey(
  value: string | string[] | undefined
): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  if (normalized.length < 16 || normalized.length > 128) return null;
  return /^[A-Za-z0-9._:-]+$/.test(normalized) ? normalized : null;
}

export function hashCanonicalPayload(payload: unknown): string {
  return createHash("sha256").update(stableJson(payload)).digest("hex");
}

export function buildDeliveryKeys(
  requestId: string
): Record<AccessDeliveryKind, string> {
  return {
    operator_notification: `access-${requestId}-operator-v1`,
    client_confirmation: `access-${requestId}-client-v1`,
  };
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableJson).join(",")}]`;
  }

  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, child]) => `${JSON.stringify(key)}:${stableJson(child)}`);
    return `{${entries.join(",")}}`;
  }

  return JSON.stringify(value);
}

function normalizeDeliveryError(error: unknown): string {
  if (error instanceof Error && error.name) {
    return error.name.slice(0, 80);
  }
  return "delivery_failed";
}
