import type { NextApiRequest, NextApiResponse } from "next";
import { getDonationSessionRuntimeConfig, normalizeDonationSessionId } from "../../../../../lib/btc-donation-session";
import { createNeonBtcDonationSessionStore } from "../../../../../lib/btc-donation-session-neon";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  privateHeaders(res);
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, errorCode: "method_not_allowed" });
  }
  const config = getDonationSessionRuntimeConfig();
  if (!config.enabled) return res.status(404).json({ ok: false, errorCode: "not_found" });
  const sessionId = normalizeDonationSessionId(Array.isArray(req.query.sessionId) ? req.query.sessionId[0] : req.query.sessionId);
  if (!sessionId) return res.status(404).json({ ok: false, errorCode: "not_found" });
  try {
    const store = createNeonBtcDonationSessionStore(config.databaseUrl);
    const session = await store.retireSession(sessionId, new Date().toISOString());
    if (!session) return res.status(404).json({ ok: false, errorCode: "not_found" });
    if (session.state !== "retired") {
      return res.status(409).json({ ok: false, errorCode: "receipt_already_observed", session });
    }
    return res.status(200).json({ ok: true, session });
  } catch {
    return res.status(503).json({ ok: false, errorCode: "donation_session_unavailable" });
  }
}

function privateHeaders(res: NextApiResponse) {
  res.setHeader("Cache-Control", "private, no-store, max-age=0");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("X-Robots-Tag", "noindex, nofollow, noarchive");
  res.setHeader("X-Content-Type-Options", "nosniff");
}
