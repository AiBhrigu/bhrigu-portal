import type { NextApiRequest, NextApiResponse } from "next";

import { ACCESS_OPERATOR_EMAIL } from "../../../lib/access-intake-config";
import { getAccessReviewAuth0Client, isAuthorizedAccessOperator } from "../../../lib/access-review-auth0";
import { getBtcDirectPaymentRuntimeConfig } from "../../../lib/btc-direct-payment-config";
import { createNeonBtcDirectPaymentStore } from "../../../lib/btc-direct-payment-neon";
import { createCoinGeckoBtcUsdSource } from "../../../lib/btc-direct-payment-source";
import { BtcDirectPaymentError, createBtcDirectQuote } from "../../../lib/btc-direct-payment";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  setPrivateNoStore(res);
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, errorCode: "method_not_allowed" });
  }

  const runtime = getBtcDirectPaymentRuntimeConfig();
  if (!runtime.enabled) return res.status(404).json({ ok: false, errorCode: "not_found" });

  try {
    const session = await getAccessReviewAuth0Client().getSession(req as any);
    if (!isAuthorizedAccessOperator(session, ACCESS_OPERATOR_EMAIL)) {
      return res.status(404).json({ ok: false, errorCode: "not_found" });
    }

    const applicationId = typeof req.body?.applicationId === "string" ? req.body.applicationId : "";
    const idempotencyHeader = req.headers["idempotency-key"];
    const idempotencyKey = typeof idempotencyHeader === "string" ? idempotencyHeader : "";
    const quote = await createBtcDirectQuote({
      applicationId,
      idempotencyKey,
      store: createNeonBtcDirectPaymentStore(runtime.databaseUrl),
      source: createCoinGeckoBtcUsdSource({ demoApiKey: runtime.coinGeckoDemoApiKey }),
    });

    return res.status(201).json({
      ok: true,
      quoteId: quote.quoteId,
      usdPriceCents: quote.usdPriceCents,
      fxRateDecimal: quote.fxRateDecimal,
      fxTimestamp: quote.fxTimestamp,
      quoteExpiresAt: quote.quoteExpiresAt,
      satAmountInteger: quote.satAmountInteger,
      receiverAddressId: quote.receiverAddressId,
      receiveAddress: quote.receiveAddress,
      bip321Uri: quote.bip321Uri,
      state: quote.quoteState,
    });
  } catch (error) {
    if (error instanceof BtcDirectPaymentError) {
      const status = error.code === "idempotency_conflict" ? 409 : error.code === "application_not_accepted" ? 403 : 503;
      return res.status(status).json({ ok: false, errorCode: error.code });
    }
    return res.status(503).json({ ok: false, errorCode: "payment_quote_unavailable" });
  }
}

function setPrivateNoStore(res: NextApiResponse) {
  res.setHeader("Cache-Control", "private, no-store, max-age=0");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Robots-Tag", "noindex, nofollow, noarchive");
}
