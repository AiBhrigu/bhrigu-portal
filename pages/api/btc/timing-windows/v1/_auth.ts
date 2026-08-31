import type { NextApiRequest, NextApiResponse } from "next";
import {
  findPreviewPhiBtcTimingWindowsByObject,
  getPhiBtcTimingWindowsPreviewConfig,
} from "../../../../../lib/phi-btc-timing-windows-preview-neon";
import {
  PHI_BTC_TIMING_WINDOWS_COOKIE,
  parsePhiBtcTimingWindowsCookie,
  verifyPhiBtcTimingWindowsSecret,
} from "../../../../../lib/phi-btc-timing-windows-v1";

export function timingWindowsPrivateHeaders(res: NextApiResponse) {
  res.setHeader("Cache-Control", "private, no-store, max-age=0");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("X-Robots-Tag", "noindex,nofollow,noarchive");
  res.setHeader("X-Content-Type-Options", "nosniff");
}

export async function authenticatedTimingWindows(req: NextApiRequest, res: NextApiResponse) {
  const config = getPhiBtcTimingWindowsPreviewConfig();
  if (!config.enabled) { res.status(404).json({ ok: false }); return null; }
  const bearer = parsePhiBtcTimingWindowsCookie(req.cookies?.[PHI_BTC_TIMING_WINDOWS_COOKIE]);
  if (!bearer) { res.status(404).json({ ok: false }); return null; }
  const record = await findPreviewPhiBtcTimingWindowsByObject(config.databaseUrl, bearer.researchObjectId);
  if (!record || !verifyPhiBtcTimingWindowsSecret(record, bearer.secret)) {
    res.status(404).json({ ok: false }); return null;
  }
  return { config, record, bearer };
}
