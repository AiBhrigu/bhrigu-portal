import type { NextApiRequest, NextApiResponse } from "next";

import type {
  AccessSubmitApiResponse,
  AccessSubmitErrorResponseV1,
} from "../../../lib/access-models";
import {
  buildStoredAccessSubmissionRecord,
  validateAccessSubmitPayload,
} from "../../../lib/access-submit-validation";
import {
  buildAccessIdempotencySha256,
  buildAccessRequestId,
  buildPrivateAccessEnvelope,
  createAccessReviewToken,
  getPrivateAccessSubmission,
  isSyntheticAccessProof,
  savePrivateAccessSubmission,
  AccessPrivateIntakeError,
} from "../../../lib/access-private-intake";
import {
  deliverPrivateAccessSubmission,
  resolveAccessDeliveryConfig,
  AccessDeliveryError,
} from "../../../lib/access-submit-delivery-runtime";
import {
  buildAccessTriageV01,
  sanitizeFreyCtxInput,
} from "../../../lib/access-triage.js";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "256kb",
    },
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AccessSubmitApiResponse | Record<string, unknown>>
) {
  res.setHeader("Cache-Control", "no-store, private");
  res.setHeader("X-Content-Type-Options", "nosniff");

  if (req.method !== "POST") {
    return res.status(405).json({
      ok: false,
      errorCode: "method_not_allowed",
      errorMessage: "Method not allowed.",
    });
  }

  let requestId: string | null = null;

  try {
    const validation = validateAccessSubmitPayload(req.body);
    if (!validation.ok) {
      const failedValidation = validation as Extract<typeof validation, { ok: false }>;
      return res.status(mapValidationStatus(failedValidation.errorCode)).json({
        ok: false,
        errorCode: failedValidation.errorCode,
        errorMessage: failedValidation.errorMessage,
      });
    }

    const proofHeader = req.headers["x-bhrigu-intake-proof"];
    const syntheticProof = isSyntheticAccessProof(validation.data, proofHeader);
    let deliveryConfigured = false;

    // A real client request must never be accepted before both mandatory
    // delivery destinations are configured. Synthetic proof deliberately skips
    // external email while reporting only a non-secret readiness boolean.
    if (syntheticProof) {
      try {
        resolveAccessDeliveryConfig();
        deliveryConfigured = true;
      } catch (error) {
        if (
          !(error instanceof AccessDeliveryError) ||
          error.code !== "delivery_not_configured"
        ) {
          throw error;
        }
      }
    } else {
      resolveAccessDeliveryConfig();
      deliveryConfigured = true;
    }

    const idempotencySha256 = buildAccessIdempotencySha256(validation.data);
    requestId = buildAccessRequestId(validation.data, idempotencySha256);

    let envelope = await getPrivateAccessSubmission(requestId);
    let created = false;

    if (envelope) {
      if (envelope.idempotency_sha256 !== idempotencySha256) {
        throw new AccessPrivateIntakeError(
          "duplicate_conflict",
          "The immutable request identifier is already bound to different content."
        );
      }
    } else {
      const submittedAt = new Date().toISOString();
      const freyCtx = sanitizeFreyCtxInput(
        (req.body as { frey_ctx?: unknown })?.frey_ctx
      );
      const triage = buildAccessTriageV01({
        freyCtx,
        request: validation.data.request,
        normalizedDates: validation.data.normalizedDates,
      });
      const baseRecord = buildStoredAccessSubmissionRecord(
        requestId,
        submittedAt,
        validation.data
      );
      const record = {
        ...baseRecord,
        freyCtx,
        triage,
        priority_band: triage.priority_band,
        route_hint: triage.route_hint,
        operatorPacket: {
          ...baseRecord.operatorPacket,
          triage,
          priority_band: triage.priority_band,
          route_hint: triage.route_hint,
        },
      } as typeof baseRecord;
      const reviewToken = createAccessReviewToken(
        idempotencySha256,
        syntheticProof
      );
      const saveResult = await savePrivateAccessSubmission(
        buildPrivateAccessEnvelope({
          record,
          idempotencySha256,
          reviewToken,
        })
      );
      envelope = saveResult.envelope;
      created = saveResult.created;
    }

    await deliverPrivateAccessSubmission({
      record: envelope.record,
      reviewToken: envelope.review_token,
      syntheticProof,
    });

    const response: Record<string, unknown> = {
      ok: true,
      requestId: envelope.record.requestId,
      submittedAt: envelope.record.createdAt,
      status: "pending_manual_review",
      idempotentReplay: !created,
      storage: "vercel_private_blob",
    };

    if (syntheticProof) {
      response.proofReviewToken = envelope.review_token;
      response.proofReviewUrl = buildReviewUrl(
        req,
        envelope.record.requestId,
        envelope.review_token
      );
      response.proofRecordSha256 = envelope.record_sha256;
      response.proofDeliveryConfigured = deliveryConfigured;
    }

    return res.status(created ? 201 : 200).json(response);
  } catch (error) {
    if (error instanceof AccessDeliveryError) {
      logAccessSubmitError(error.code, error, { requestId });
      return res.status(503).json({
        ok: false,
        errorCode: "email_failed",
        errorMessage:
          "The request was not acknowledged. No submission confirmation has been issued.",
      });
    }

    if (error instanceof AccessPrivateIntakeError) {
      logAccessSubmitError(error.code, error, { requestId });
      return res.status(error.code === "duplicate_conflict" ? 409 : 503).json({
        ok: false,
        errorCode: "storage_failed",
        errorMessage:
          "Private intake storage is unavailable. The request has not been accepted.",
      });
    }

    logAccessSubmitError("internal_error", error, { requestId });
    return res.status(500).json({
      ok: false,
      errorCode: "internal_error",
      errorMessage: "The request could not be processed.",
    });
  }
}

function buildReviewUrl(
  req: NextApiRequest,
  requestId: string,
  reviewToken: string
): string {
  const forwardedProto = firstHeader(req.headers["x-forwarded-proto"]);
  const protocol =
    forwardedProto || (process.env.NODE_ENV === "production" ? "https" : "http");
  const host =
    firstHeader(req.headers["x-forwarded-host"]) ||
    req.headers.host ||
    "localhost:3000";
  return `${protocol}://${host}/access-review?id=${encodeURIComponent(
    requestId
  )}&token=${encodeURIComponent(reviewToken)}`;
}

function firstHeader(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function mapValidationStatus(
  errorCode: AccessSubmitErrorResponseV1["errorCode"]
): number {
  switch (errorCode) {
    case "invalid_payload":
    case "missing_required_field":
    case "verification_required":
    case "critical_date_missing":
    case "ambiguous_date_unresolved":
    case "invalid_email":
    case "invalid_subject_type":
      return 422;
    case "method_not_allowed":
      return 405;
    default:
      return 400;
  }
}

function logAccessSubmitError(
  kind: string,
  error: unknown,
  meta?: Record<string, unknown>
) {
  console.error("[access-submit]", {
    kind,
    meta: meta ?? null,
    error:
      error instanceof Error
        ? { name: error.name, message: error.message }
        : "unknown_error",
  });
}
