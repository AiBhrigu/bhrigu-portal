import crypto from "node:crypto";

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
  ACCESS_SYNTHETIC_PROOF_HEADER,
  AccessPrivateIntakeError,
  buildAccessIdempotencySha256,
  buildAccessRequestId,
  buildPrivateAccessEnvelope,
  createAccessReviewToken,
  getPrivateAccessSubmission,
  isSyntheticAccessProof,
  provePrivateAccessStoreReadable,
  savePrivateAccessSubmission,
} from "../../../lib/access-private-intake";
import {
  AccessDeliveryError,
  deliverPrivateAccessSubmission,
  resolveAccessDeliveryConfig,
} from "../../../lib/access-submit-delivery-runtime";
import {
  buildAccessTriageV01,
  sanitizeFreyCtxInput,
} from "../../../lib/access-triage.js";

const MAX_BODY_BYTES = 256 * 1024;

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AccessSubmitApiResponse | Record<string, unknown>>
) {
  res.setHeader("Cache-Control", "no-store, private, max-age=0");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("X-Content-Type-Options", "nosniff");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({
      ok: false,
      errorCode: "method_not_allowed",
      errorMessage: "Method not allowed.",
    });
  }

  const proofHeader = firstHeader(req.headers["x-bhrigu-intake-proof"]);
  const proofSecret = firstHeader(
    req.headers["x-bhrigu-intake-proof-secret"]
  );
  const syntheticProofRequested =
    proofHeader === ACCESS_SYNTHETIC_PROOF_HEADER &&
    validProofSecret(proofSecret);

  // The emergency containment remains the default. A real request body is not
  // read until explicit public enablement, mandatory delivery configuration,
  // and private Blob readability have all been proven in this invocation.
  if (!syntheticProofRequested) {
    if (process.env.ACCESS_PRIVATE_INTAKE_PUBLIC_ENABLED !== "true") {
      return intakeClosed(res);
    }
    try {
      resolveAccessDeliveryConfig();
      await provePrivateAccessStoreReadable();
    } catch {
      return intakeClosed(res);
    }
  }

  let requestId: string | null = null;
  let submittedAt: string | null = null;
  let recordStored = false;

  try {
    const body = await readJsonBody(req);
    const validation = validateAccessSubmitPayload(body);
    if (!validation.ok) {
      const failedValidation = validation as Extract<
        typeof validation,
        { ok: false }
      >;
      return res.status(mapValidationStatus(failedValidation.errorCode)).json({
        ok: false,
        errorCode: failedValidation.errorCode,
        errorMessage: failedValidation.errorMessage,
      });
    }

    const syntheticProof = isSyntheticAccessProof(
      validation.data,
      proofHeader
    );
    if (syntheticProofRequested && !syntheticProof) {
      return res.status(403).json({
        ok: false,
        errorCode: "invalid_proof_payload",
        errorMessage: "Synthetic proof payload does not match the locked contract.",
      });
    }

    let deliveryConfigured = false;
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
      await provePrivateAccessStoreReadable();
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
      submittedAt = new Date().toISOString();
      const freyCtx = sanitizeFreyCtxInput(
        (body as { frey_ctx?: unknown })?.frey_ctx
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

    recordStored = true;
    submittedAt = envelope.record.createdAt;

    const delivery = await deliverPrivateAccessSubmission({
      record: envelope.record,
      reviewToken: envelope.review_token,
      idempotencySha256,
      syntheticProof,
    });

    const response: Record<string, unknown> = {
      ok: true,
      requestId: envelope.record.requestId,
      submittedAt: envelope.record.createdAt,
      status: "pending_manual_review",
      idempotentReplay: !created || delivery.idempotentReplay,
      storage: "vercel_private_blob",
      delivery: delivery.status,
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
      logAccessSubmitError(error.code, error, { requestId, recordStored });
      if (
        error.code === "delivery_reconciliation_required" &&
        requestId &&
        submittedAt
      ) {
        return res.status(503).json({
          ok: false,
          requestId,
          submittedAt,
          status: "delivery_reconciliation_required",
          errorCode: "delivery_reconciliation_required",
          errorMessage:
            "The request was stored privately, but delivery requires operator reconciliation. Do not resubmit this request.",
        });
      }
      return intakeClosed(res);
    }

    if (error instanceof AccessPrivateIntakeError) {
      logAccessSubmitError(error.code, error, { requestId, recordStored });
      if (recordStored && requestId && submittedAt) {
        return res.status(503).json({
          ok: false,
          requestId,
          submittedAt,
          status: "delivery_reconciliation_required",
          errorCode: "delivery_reconciliation_required",
          errorMessage:
            "The request was stored privately, but its delivery state could not be confirmed. Do not resubmit this request.",
        });
      }
      return res
        .status(error.code === "duplicate_conflict" ? 409 : 503)
        .json({
          ok: false,
          errorCode: "storage_failed",
          errorMessage:
            "Private intake storage is unavailable. The request has not been accepted.",
        });
    }

    if (error instanceof RequestBodyError) {
      return res.status(error.status).json({
        ok: false,
        errorCode: error.code,
        errorMessage: error.message,
      });
    }

    logAccessSubmitError("internal_error", error, { requestId, recordStored });
    return res.status(500).json({
      ok: false,
      errorCode: "internal_error",
      errorMessage: "The request could not be processed.",
    });
  }
}

class RequestBodyError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string
  ) {
    super(message);
    this.name = "RequestBodyError";
  }
}

async function readJsonBody(req: NextApiRequest): Promise<unknown> {
  const chunks: Buffer[] = [];
  let total = 0;
  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    total += buffer.length;
    if (total > MAX_BODY_BYTES) {
      throw new RequestBodyError(413, "payload_too_large", "Payload is too large.");
    }
    chunks.push(buffer);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new RequestBodyError(400, "invalid_json", "Request body must be valid JSON.");
  }
}


function validProofSecret(candidate: string): boolean {
  const expected = process.env.ACCESS_PRIVATE_INTAKE_PROOF_SECRET?.trim() || "";
  if (expected.length < 32 || candidate.length < 32) return false;
  const expectedHash = crypto.createHash("sha256").update(expected).digest();
  const candidateHash = crypto.createHash("sha256").update(candidate).digest();
  return crypto.timingSafeEqual(expectedHash, candidateHash);
}

function intakeClosed(
  res: NextApiResponse<AccessSubmitApiResponse | Record<string, unknown>>
) {
  return res.status(503).json({
    ok: false,
    errorCode: "intake_temporarily_closed",
    errorMessage:
      "Reviewed requests are temporarily closed while secure private intake is being verified.",
  });
}

function buildReviewUrl(
  req: NextApiRequest,
  requestId: string,
  reviewToken: string
): string {
  const forwardedProto = firstHeader(req.headers["x-forwarded-proto"]);
  const protocol =
    forwardedProto ||
    (process.env.NODE_ENV === "production" ? "https" : "http");
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
