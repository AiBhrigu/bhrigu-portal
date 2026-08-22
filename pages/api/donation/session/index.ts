import type { NextApiRequest, NextApiResponse } from "next";
import { getDonationSessionRuntimeConfig, normalizeDonationSessionId } from "../../../../lib/btc-donation-session";
import { createNeonBtcDonationSessionStore } from "../../../../lib/btc-donation-session-neon";
import { createNeonBtcObservabilityStore } from "../../../../lib/btc-observability-neon";
import { ensureBtcObserver, getBtcObservabilityConfig, parseSupportObservability } from "../../../../lib/btc-observability-server";
import {
  BTC_DONATION_ADMISSION_COOKIE,
  donationAdmissionCookie,
  donationAdmissionKeys,
  getDonationAdmissionConfig,
  newDonationAdmissionClientToken,
  normalizeDonationAdmissionClientToken,
  normalizeVercelClientIp,
} from "../../../../lib/btc-donation-session-admission";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  privateHeaders(res);
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, errorCode: "method_not_allowed" });
  }
  const config = getDonationSessionRuntimeConfig();
  if (!config.enabled) return res.status(404).json({ ok: false, errorCode: "not_found" });
  const admissionConfig = getDonationAdmissionConfig();
  if (!admissionConfig.enabled) return res.status(503).json({ ok: false, errorCode: "donation_session_unavailable" });
  const sessionId = normalizeDonationSessionId(req.body?.sessionId);
  if (!sessionId) return res.status(400).json({ ok: false, errorCode: "invalid_session_id" });

  const existingToken = normalizeDonationAdmissionClientToken(req.cookies?.[BTC_DONATION_ADMISSION_COOKIE]);
  const clientToken = existingToken ?? newDonationAdmissionClientToken();
  if (!existingToken) res.setHeader("Set-Cookie", donationAdmissionCookie(clientToken));
  const clientIp = normalizeVercelClientIp(req.headers["x-forwarded-for"]);
  const { clientKey, ipKey } = donationAdmissionKeys(admissionConfig.secret, clientToken, clientIp);

  try {
    const store = createNeonBtcDonationSessionStore(config.databaseUrl);
    const result = await store.issueSessionAdmitted({ sessionId, at: new Date(), clientKey, ipKey });
    if (result.disposition === "rate_limited") {
      const retryAfterSeconds = Math.max(1, result.retryAfterSeconds);
      res.setHeader("Retry-After", String(retryAfterSeconds));
      return res.status(429).json({ ok: false, errorCode: "session_rate_limited", retryAfterSeconds });
    }
    if (result.disposition === "address_unavailable" || !result.session) {
      return res.status(503).json({ ok: false, errorCode: "address_unavailable" });
    }
    const telemetryConfig = getBtcObservabilityConfig();
    const telemetryContext = parseSupportObservability(req.body ?? {});
    if (telemetryConfig.enabled && telemetryContext) {
      const anonBrowserKey = ensureBtcObserver(req, res, telemetryConfig.secret);
      try {
        await createNeonBtcObservabilityStore(telemetryConfig.databaseUrl).recordEvent({
          eventType: "BTC_SUPPORT_SESSION_STARTED", anonBrowserKey, visitSessionId: telemetryContext.visitSessionId, locale: req.body?.locale === "ru" ? "ru" : "en", surface: "btc_support",
          chatTurnId: null, donationSessionId: result.session.sessionId, model: null, inputTokens: null, outputTokens: null, webSearchCalls: null, nominalCostMicros: null, pricePolicy: null, completionStatus: null, errorClass: null,
          trafficSource: telemetryContext.source, trafficMedium: telemetryContext.medium, trafficCampaign: telemetryContext.campaign,
        });
      } catch { /* Observability never blocks Support. */ }
    }
    return res.status(200).json({ ok: true, session: result.session });
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
