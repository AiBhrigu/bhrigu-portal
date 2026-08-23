import type { NextApiRequest, NextApiResponse } from "next";
import { createNeonBtcResearchFieldStore } from "../../../../../lib/btc-research-field-neon";
import { getBtcResearchFieldConfig } from "../../../../../lib/btc-research-field-config";
import {
  btcResearchFieldCookie,
  normalizeBtcResearchFieldId,
  normalizeBtcResearchFieldSecret,
  verifyBtcResearchFieldSecret,
} from "../../../../../lib/btc-research-field-v1";
import { privateHeaders } from "./_auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  privateHeaders(res);
  if (req.method !== "POST") return res.status(405).json({ ok: false });
  const config = getBtcResearchFieldConfig();
  if (!config.enabled) return res.status(404).json({ ok: false });
  const fieldId = normalizeBtcResearchFieldId(req.body?.fieldId);
  const secret = normalizeBtcResearchFieldSecret(req.body?.secret);
  if (!fieldId || !secret) return res.status(404).json({ ok: false });
  const field = await createNeonBtcResearchFieldStore(config.databaseUrl).findField(fieldId);
  if (!field || field.status === "DELETED" || field.status === "PURGED" || field.status === "LOCKED" || !verifyBtcResearchFieldSecret(field, secret)) {
    return res.status(404).json({ ok: false });
  }
  res.setHeader("Set-Cookie", btcResearchFieldCookie(fieldId, secret, field.serviceEnd));
  return res.status(200).json({ ok: true, fieldId, status: field.status, serviceEnd: field.serviceEnd });
}
