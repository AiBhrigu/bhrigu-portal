import type { NextApiRequest, NextApiResponse } from "next";
import {
  BtcAgentEvidenceError,
  BTC_AGENT_MAX_REQUEST_BODY_BYTES,
  executeBtcAgentEvidenceAnswerV0,
  parseBtcAgentEvidenceRequestV0,
} from "../../../../../lib/btc-agent-evidence-answer-v0";
import {
  authorizeBtcAgentPreview,
  btcAgentX402PreviewBoundary,
} from "../../../../../lib/btc-agent-x402-preview-v0";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "4kb",
    },
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Cache-Control", "private, no-store, max-age=0, must-revalidate");
  res.setHeader("X-Robots-Tag", "noindex, nofollow");
  res.setHeader("X-BHRIGU-Agent-Commerce", "btc-evidence-answer-v0-preview");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, code: "METHOD_NOT_ALLOWED" });
  }

  const contentLength = Number(req.headers["content-length"] ?? 0);
  if (Number.isFinite(contentLength) && contentLength > BTC_AGENT_MAX_REQUEST_BODY_BYTES) {
    return res.status(413).json({ ok: false, code: "REQUEST_TOO_LARGE" });
  }

  let request;
  try {
    request = parseBtcAgentEvidenceRequestV0(req.body);
  } catch (error) {
    if (error instanceof BtcAgentEvidenceError) {
      return res.status(error.status).json({ ok: false, code: error.code });
    }
    return res.status(422).json({ ok: false, code: "REQUEST_INVALID" });
  }

  const authorization = authorizeBtcAgentPreview(req.headers["x-bhrigu-x402-preview"]);
  if (!authorization.ok) {
    return res.status(authorization.status).json({
      ok: false,
      code: authorization.code,
      preview_boundary: btcAgentX402PreviewBoundary(),
    });
  }

  try {
    const result = await executeBtcAgentEvidenceAnswerV0(request, authorization.receipt);
    res.setHeader("X-BHRIGU-x402-Preview", "mock-authorized-no-settlement");
    return res.status(200).json(result);
  } catch (error) {
    if (error instanceof BtcAgentEvidenceError) {
      return res.status(error.status).json({ ok: false, code: error.code });
    }
    console.error("BHRIGU_BTC_AGENT_EVIDENCE_V0_FAILURE", error instanceof Error ? error.message : "unknown");
    return res.status(503).json({ ok: false, code: "MACHINE_SERVICE_FAILURE" });
  }
}
