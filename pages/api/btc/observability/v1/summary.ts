import { timingSafeEqual } from "node:crypto";
import type { NextApiRequest, NextApiResponse } from "next";
import { createNeonBtcObservabilityStore } from "../../../../../lib/btc-observability-neon";
import { getBtcObservabilityConfig } from "../../../../../lib/btc-observability-server";

function authorized(supplied: unknown, expected: string): boolean {
  if (typeof supplied !== "string") return false;
  const a = Buffer.from(supplied, "utf8");
  const b = Buffer.from(expected, "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Cache-Control", "private, no-store, max-age=0");
  res.setHeader("X-Robots-Tag", "noindex, nofollow, noarchive");
  if (req.method !== "GET") { res.setHeader("Allow", "GET"); return res.status(405).json({ ok: false }); }
  const config = getBtcObservabilityConfig();
  if (!config.enabled) return res.status(404).json({ ok: false });
  if (!authorized(req.headers["x-bhrigu-observability-read"], config.readSecret)) return res.status(404).json({ ok: false });
  const hoursRaw = Array.isArray(req.query.hours) ? req.query.hours[0] : req.query.hours;
  const hours = Math.min(24 * 30, Math.max(1, Number(hoursRaw ?? 24) || 24));
  const until = new Date();
  const since = new Date(until.getTime() - hours * 60 * 60 * 1000);
  try {
    const store = createNeonBtcObservabilityStore(config.databaseUrl);
    const [summary, sources] = await Promise.all([store.summary(since, until), store.sourceSummary(since, until)]);
    return res.status(200).json({
      ok: true,
      semantics: { humans: "NOT_CLAIMED", unique_unit: "ANONYMOUS_BROWSER", raw_question_storage: false, raw_answer_storage: false, raw_ip_storage: false, support_sessions: "OPERATIONAL_BTC_DONATION_SESSIONS", receipt_sessions: "OPERATIONAL_BTC_DONATION_RECEIPTS", source_support_sessions: "ATTRIBUTED_OPERATIONAL_SESSIONS_ONLY" },
      window: { since: since.toISOString(), until: until.toISOString() },
      summary,
      sources,
    });
  } catch {
    return res.status(503).json({ ok: false });
  }
}
