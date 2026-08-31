import type { NextApiRequest, NextApiResponse } from "next";
import { PHI_BTC_TIMING_WINDOWS_CONTRACT } from "../../../../../lib/phi-btc-timing-windows-v1";
import { authenticatedTimingWindows, timingWindowsPrivateHeaders } from "./_auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  timingWindowsPrivateHeaders(res);
  if (req.method !== "GET") return res.status(405).json({ ok: false });
  const auth = await authenticatedTimingWindows(req, res);
  if (!auth) return;
  const r = auth.record;
  return res.status(200).json({
    ok: true,
    product: {
      productId: r.product_id,
      productOrderId: r.product_order_id,
      researchObjectId: r.research_object_id,
      entitlementState: r.entitlement_state,
      serviceStart: r.service_start,
      serviceEnd: r.service_end,
      priceUsdCents: r.price_usd_cents,
      durationDays: r.duration_days,
      maxRuns: PHI_BTC_TIMING_WINDOWS_CONTRACT.maxRuns,
      maxRunCostMicros: PHI_BTC_TIMING_WINDOWS_CONTRACT.maxRunCostMicros,
      maxTotalCostMicros: PHI_BTC_TIMING_WINDOWS_CONTRACT.maxTotalCostMicros,
      runSlots: PHI_BTC_TIMING_WINDOWS_CONTRACT.runSlots,
      executionEnabled: false,
      providerBearingRuns: 0,
      nominalCostMicros: 0,
    },
    payment_simulation: r.entitlement_state === "PENDING_PAYMENT" ? "PREVIEW_NOT_CHARGED" : "PAID_CONFIRMED_PREVIEW_ONLY",
    real_btc: false,
  });
}
