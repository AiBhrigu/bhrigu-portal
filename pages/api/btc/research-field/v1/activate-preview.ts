import type { NextApiRequest, NextApiResponse } from "next";
import { authenticatedField, privateHeaders } from "./_auth";
import { btcResearchFieldCookie } from "../../../../../lib/btc-research-field-v1";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  privateHeaders(res);
  if (req.method !== "POST") return res.status(405).json({ ok: false });
  const auth = await authenticatedField(req, res);
  if (!auth) return;
  if (auth.field.status !== "PENDING_PAYMENT") {
    return res.status(409).json({ ok: false, code: "FIELD_NOT_PENDING_PAYMENT" });
  }
  const activated = await auth.store.activatePreview(auth.field.fieldId);
  if (!activated || !activated.serviceEnd) {
    return res.status(409).json({ ok: false, code: "FIELD_ACTIVATION_CONFLICT" });
  }
  res.setHeader("Set-Cookie", btcResearchFieldCookie(activated.fieldId, auth.bearer.secret, activated.serviceEnd));
  return res.status(200).json({
    ok: true,
    field_id: activated.fieldId,
    status: activated.status,
    service_start: activated.serviceStart,
    service_end: activated.serviceEnd,
    entitlement: "FAKE_PREVIEW_ONLY",
    real_btc: false,
  });
}
