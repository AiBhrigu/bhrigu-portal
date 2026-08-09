import type { NextApiRequest, NextApiResponse } from "next";

import { getAccessIntakeRuntimeConfig } from "../../../lib/access-intake-config";
import { createNeonAccessIntakeStore } from "../../../lib/access-intake-neon";
import { createResendAccessIntakeDelivery } from "../../../lib/access-intake-resend";
import { processAccessIntake } from "../../../lib/access-intake-runtime";

const MAX_BODY_BYTES = 128 * 1024;

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  setPrivateNoStore(res);

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({
      ok: false,
      errorCode: "method_not_allowed",
      errorMessage: "Method not allowed.",
    });
  }

  const runtime = getAccessIntakeRuntimeConfig();
  if (!runtime.enabled) {
    // Fail closed before reading or parsing a potentially private request body.
    return res.status(503).json({
      ok: false,
      errorCode: "intake_temporarily_closed",
      errorMessage:
        "Reviewed requests are temporarily closed while secure private intake is being upgraded.",
    });
  }

  let payload: unknown;
  try {
    payload = await readJsonBody(req, MAX_BODY_BYTES);
  } catch {
    return res.status(400).json({
      ok: false,
      errorCode: "invalid_payload",
      errorMessage: "Invalid request payload.",
    });
  }

  const result = await processAccessIntake({
    payload,
    idempotencyKey: req.headers["idempotency-key"],
    store: createNeonAccessIntakeStore(runtime.databaseUrl),
    delivery: createResendAccessIntakeDelivery({
      apiKey: runtime.resendApiKey,
      fromEmail: runtime.fromEmail,
      operatorEmail: runtime.operatorEmail,
      replyToEmail: runtime.replyToEmail,
      siteName: runtime.siteName,
      siteUrl: runtime.siteUrl,
    }),
  });

  if (result.ok === false) {
    return res.status(result.statusCode).json({
      ok: false,
      errorCode: result.errorCode,
      errorMessage: result.errorMessage,
    });
  }

  return res.status(result.statusCode).json({
    ok: true,
    requestId: result.requestId,
    submittedAt: result.submittedAt,
    status: "pending_manual_review",
    deliveryStatus: result.deliveryStatus,
    replayed: result.disposition === "replay",
  });
}

async function readJsonBody(
  req: NextApiRequest,
  maxBytes: number
): Promise<unknown> {
  let size = 0;
  const chunks: Buffer[] = [];

  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.length;
    if (size > maxBytes) throw new Error("payload_too_large");
    chunks.push(buffer);
  }

  if (chunks.length === 0) throw new Error("empty_payload");
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function setPrivateNoStore(res: NextApiResponse) {
  res.setHeader("Cache-Control", "private, no-store, max-age=0");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("X-Content-Type-Options", "nosniff");
}
