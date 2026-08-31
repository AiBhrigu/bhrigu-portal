import type { NextApiRequest, NextApiResponse } from "next";
import {
  findPreviewPhiBtcTimingWindowsByObject,
  getPhiBtcTimingWindowsPreviewConfig,
} from "../../../../../lib/phi-btc-timing-windows-preview-neon";
import {
  phiBtcTimingWindowsCookie,
  verifyPhiBtcTimingWindowsSecret,
} from "../../../../../lib/phi-btc-timing-windows-v1";
import { timingWindowsPrivateHeaders } from "./_auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  timingWindowsPrivateHeaders(res);
  if (req.method !== "POST") return res.status(405).json({ ok: false });
  const config = getPhiBtcTimingWindowsPreviewConfig();
  if (!config.enabled) return res.status(404).json({ ok: false });
  const researchObjectId = typeof req.body?.researchObjectId === "string" ? req.body.researchObjectId.trim() : "";
  const secret = typeof req.body?.secret === "string" ? req.body.secret.trim() : "";
  const record = await findPreviewPhiBtcTimingWindowsByObject(config.databaseUrl, researchObjectId);
  if (!record || !verifyPhiBtcTimingWindowsSecret(record, secret)) return res.status(404).json({ ok: false });
  res.setHeader("Set-Cookie", phiBtcTimingWindowsCookie(record.research_object_id, secret, record.service_end));
  return res.status(200).json({ ok: true, research_object_id: record.research_object_id });
}
