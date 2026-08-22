import type { NextApiRequest, NextApiResponse } from "next";
import { createNeonBtcObservabilityStore } from "../../../../../lib/btc-observability-neon";
import {
  ensureBtcObserver,
  getBtcObservabilityConfig,
  parseClientObservabilityEvent,
} from "../../../../../lib/btc-observability-server";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Cache-Control", "private, no-store, max-age=0");
  res.setHeader("X-Robots-Tag", "noindex, nofollow, noarchive");
  if (req.method !== "POST") { res.setHeader("Allow", "POST"); return res.status(405).json({ ok: false }); }
  const config = getBtcObservabilityConfig();
  if (!config.enabled) return res.status(404).json({ ok: false });
  const event = parseClientObservabilityEvent(req.body);
  if (!event) return res.status(400).json({ ok: false });
  const anonBrowserKey = ensureBtcObserver(req, res, config.secret);
  try {
    await createNeonBtcObservabilityStore(config.databaseUrl).recordEvent({ ...event, anonBrowserKey });
    return res.status(202).json({ ok: true });
  } catch {
    return res.status(503).json({ ok: false });
  }
}
