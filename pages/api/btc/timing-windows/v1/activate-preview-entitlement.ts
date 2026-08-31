import type { NextApiRequest, NextApiResponse } from "next";
import { activatePreviewPhiBtcTimingWindowsEntitlement } from "../../../../../lib/phi-btc-timing-windows-preview-neon";
import { phiBtcTimingWindowsCookie } from "../../../../../lib/phi-btc-timing-windows-v1";
import { authenticatedTimingWindows, timingWindowsPrivateHeaders } from "./_auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  timingWindowsPrivateHeaders(res);
  if (req.method !== "POST") return res.status(405).json({ ok: false });
  const auth = await authenticatedTimingWindows(req, res);
  if (!auth) return;
  if (auth.record.entitlement_state !== "PENDING_PAYMENT") {
    return res.status(409).json({ ok: false, code: "ENTITLEMENT_NOT_PENDING_PAYMENT" });
  }
  const activated = await activatePreviewPhiBtcTimingWindowsEntitlement(
    auth.config.databaseUrl, auth.record.research_object_id,
  );
  if (!activated?.service_end) return res.status(409).json({ ok: false, code: "PRODUCT_ENTITLEMENT_CONFLICT" });
  res.setHeader("Set-Cookie", phiBtcTimingWindowsCookie(
    activated.research_object_id, auth.bearer.secret, activated.service_end,
  ));
  return res.status(200).json({
    ok: true,
    product_order_id: activated.product_order_id,
    research_object_id: activated.research_object_id,
    entitlement_state: activated.entitlement_state,
    service_start: activated.service_start,
    service_end: activated.service_end,
    payment_simulation: "PAID_CONFIRMED_PREVIEW_ONLY",
    real_btc: false,
  });
}
