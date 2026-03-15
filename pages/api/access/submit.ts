import type { NextApiRequest, NextApiResponse } from "next";

import type {
  AccessSubmissionPersistenceAdapter,
  AccessSubmitApiResponse,
  AccessSubmitErrorResponseV1,
} from "../../../lib/access-models";
import {
  buildStoredAccessSubmissionRecord,
  generateAccessRequestId,
  validateAccessSubmitPayload,
} from "../../../lib/access-submit-validation";
import {
  fileAccessSubmissionPersistenceAdapter,
} from "../../../lib/access-submit-persistence";
import {
  buildAccessTriageV01,
  sanitizeFreyCtxInput,
} from "../../../lib/access-triage.js";

const persistenceAdapter: AccessSubmissionPersistenceAdapter =
  fileAccessSubmissionPersistenceAdapter;

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "256kb",
    },
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AccessSubmitApiResponse>
) {
  if (req.method !== "POST") {
    return res.status(405).json({
      ok: false,
      errorCode: "method_not_allowed",
      errorMessage: "Method not allowed.",
    });
  }

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

    const requestId = generateAccessRequestId(new Date());
    const submittedAt = new Date().toISOString();
    const freyCtx = sanitizeFreyCtxInput((req.body as { frey_ctx?: unknown })?.frey_ctx);
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
    };

    try {
      await persistenceAdapter.save(record);
    } catch (error) {
      logAccessSubmitError("storage_failed", error, { requestId, submittedAt });
      return res.status(500).json({
        ok: false,
        errorCode: "storage_failed",
        errorMessage: "The request could not be stored.",
      });
    }

    return res.status(201).json({
      ok: true,
      requestId,
      submittedAt,
      status: "pending_manual_review",
    });
  } catch (error) {
    logAccessSubmitError("internal_error", error);
    return res.status(500).json({
      ok: false,
      errorCode: "internal_error",
      errorMessage: "The request could not be processed.",
    });
  }
}

function mapValidationStatus(errorCode: AccessSubmitErrorResponseV1["errorCode"]): number {
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

function logAccessSubmitError(kind: string, error: unknown, meta?: Record<string, unknown>) {
  console.error("[access-submit]", {
    kind,
    meta: meta ?? null,
    error:
      error instanceof Error
        ? { name: error.name, message: error.message, stack: error.stack }
        : error,
  });
}

