import type { NextApiRequest, NextApiResponse } from "next";
import { listPreviewPhiBtcTimingWindowsRuns } from "../../../../../lib/phi-btc-timing-windows-preview-neon";
import {
  nextPhiTimingWindowsSlot,
  isPhiTimingWindowsPreviewExecutionConfigured,
  phiTimingWindowsScheduledAt,
  phiTimingWindowsUsageSummary,
  verifyPhiTimingWindowsHashChain,
} from "../../../../../lib/phi-btc-timing-windows-execution-v1";
import { PHI_BTC_TIMING_WINDOWS_CONTRACT } from "../../../../../lib/phi-btc-timing-windows-v1";
import { authenticatedTimingWindows, timingWindowsPrivateHeaders } from "./_auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  timingWindowsPrivateHeaders(res);
  if (req.method !== "GET") return res.status(405).json({ ok: false });
  const auth = await authenticatedTimingWindows(req, res);
  if (!auth) return;
  const r = auth.record;
  const runs = await listPreviewPhiBtcTimingWindowsRuns(auth.config.databaseUrl, r.product_order_id);
  const chainValid = verifyPhiTimingWindowsHashChain(runs);
  if (!chainValid) return res.status(409).json({ ok: false, code: "APPEND_ONLY_MEMORY_INVALID" });
  const usage = phiTimingWindowsUsageSummary(runs);
  const nextSlot = nextPhiTimingWindowsSlot(runs);
  const nextScheduledAt = nextSlot && r.service_start ? phiTimingWindowsScheduledAt(r.service_start, nextSlot) : null;
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
      closeoutGraceHours: PHI_BTC_TIMING_WINDOWS_CONTRACT.closeoutGraceHours,
      runSlots: PHI_BTC_TIMING_WINDOWS_CONTRACT.runSlots,
      executionEnabled: r.entitlement_state === "ACTIVE" && isPhiTimingWindowsPreviewExecutionConfigured(),
      providerBearingRuns: usage.providerBearingRuns,
      nominalCostMicros: usage.nominalCostMicros,
      nextSlot,
      nextScheduledAt,
      appendOnlyMemory: true,
      hashChainValid: chainValid,
    },
    runs,
    payment_simulation: r.entitlement_state === "PENDING_PAYMENT" ? "PREVIEW_NOT_CHARGED" : "PAID_CONFIRMED_PREVIEW_ONLY",
    real_btc: false,
  });
}
