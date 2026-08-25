import type { NextApiRequest, NextApiResponse } from "next";
import { createNeonBtcResearchFieldStore } from "../../../../../lib/btc-research-field-neon";
import { getBtcResearchFieldConfig } from "../../../../../lib/btc-research-field-config";
import {
  BTC_RESEARCH_FIELD_COOKIE,
  parseBtcResearchFieldCookie,
  verifyBtcResearchFieldSecret,
} from "../../../../../lib/btc-research-field-v1";

export async function authenticatedField(req: NextApiRequest, res: NextApiResponse) {
  const config = getBtcResearchFieldConfig();
  if (!config.enabled) {
    res.status(404).json({ ok: false });
    return null;
  }
  const bearer = parseBtcResearchFieldCookie(req.cookies?.[BTC_RESEARCH_FIELD_COOKIE]);
  if (!bearer) {
    res.status(404).json({ ok: false });
    return null;
  }
  const store = createNeonBtcResearchFieldStore(config.databaseUrl);
  const field = await store.findField(bearer.fieldId);
  if (!field || field.status === "DELETED" || field.status === "PURGED" || field.status === "LOCKED" || !verifyBtcResearchFieldSecret(field, bearer.secret)) {
    res.status(404).json({ ok: false });
    return null;
  }
  return { config, store, field, bearer };
}

export function privateHeaders(res: NextApiResponse) {
  res.setHeader("Cache-Control", "private, no-store, max-age=0");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("X-Robots-Tag", "noindex,nofollow,noarchive");
  res.setHeader("X-Content-Type-Options", "nosniff");
}
