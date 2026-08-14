import type { NextApiRequest, NextApiResponse } from "next";

import { getBtcObservationRuntimeConfig, verifyObservationSecret } from "../../../lib/btc-direct-payment-config";
import { createNeonBtcDirectPaymentStore } from "../../../lib/btc-direct-payment-neon";
import { BtcDirectPaymentError, observeBtcDirectPayment } from "../../../lib/btc-direct-payment";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  setPrivateNoStore(res);
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, errorCode: "method_not_allowed" });
  }

  const runtime = getBtcObservationRuntimeConfig();
  if (!runtime.enabled) return res.status(404).json({ ok: false, errorCode: "not_found" });
  if (!verifyObservationSecret(req.headers["x-bhrigu-payment-observation-secret"], runtime.secret)) {
    return res.status(404).json({ ok: false, errorCode: "not_found" });
  }

  try {
    const result = await observeBtcDirectPayment({
      observation: req.body,
      store: createNeonBtcDirectPaymentStore(runtime.databaseUrl),
    });
    return res.status(200).json({
      ok: true,
      quoteId: result.quote.quoteId,
      paymentId: result.payment.paymentId,
      paymentState: result.payment.paymentState,
      activationId: result.activation?.activationId ?? null,
      activationState: result.activation?.state ?? null,
      serviceStart: result.activation?.serviceStart ?? null,
      serviceEnd: result.activation?.serviceEnd ?? null,
    });
  } catch (error) {
    if (error instanceof BtcDirectPaymentError) {
      return res.status(400).json({ ok: false, errorCode: error.code });
    }
    return res.status(503).json({ ok: false, errorCode: "payment_observation_unavailable" });
  }
}

function setPrivateNoStore(res: NextApiResponse) {
  res.setHeader("Cache-Control", "private, no-store, max-age=0");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Robots-Tag", "noindex, nofollow, noarchive");
}
