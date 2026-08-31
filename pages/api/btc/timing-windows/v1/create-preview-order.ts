import type { NextApiRequest, NextApiResponse } from "next";
import {
  createPreviewPhiBtcTimingWindowsOrder,
  getPhiBtcTimingWindowsPreviewConfig,
} from "../../../../../lib/phi-btc-timing-windows-preview-neon";
import { PHI_BTC_TIMING_WINDOWS_CONTRACT } from "../../../../../lib/phi-btc-timing-windows-v1";
import { timingWindowsPrivateHeaders } from "./_auth";

function requestOrigin(req: NextApiRequest): string {
  const proto = String(req.headers["x-forwarded-proto"] || "https").split(",")[0].trim();
  const host = String(req.headers["x-forwarded-host"] || req.headers.host || "localhost:3000").split(",")[0].trim();
  return `${proto}://${host}`;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  timingWindowsPrivateHeaders(res);
  if (req.method !== "POST") return res.status(405).json({ ok: false });
  const config = getPhiBtcTimingWindowsPreviewConfig();
  if (!config.enabled) return res.status(404).json({ ok: false });
  const locale = req.body?.locale === "ru" ? "ru" : "en";
  try {
    const created = await createPreviewPhiBtcTimingWindowsOrder(config.databaseUrl, locale);
    const r = created.record;
    return res.status(201).json({
      ok: true,
      product_id: r.product_id,
      product_order_id: r.product_order_id,
      research_object_id: r.research_object_id,
      price_usd_cents: PHI_BTC_TIMING_WINDOWS_CONTRACT.priceCents,
      duration_days: PHI_BTC_TIMING_WINDOWS_CONTRACT.durationDays,
      payment_rail: PHI_BTC_TIMING_WINDOWS_CONTRACT.paymentRail,
      private_link: `${requestOrigin(req)}/crypto-astro/btc/timing-windows-preview/${r.research_object_id}#${created.secret}`,
      payment_state: "PREVIEW_NOT_CHARGED",
      real_btc: false,
    });
  } catch (error) {
    console.error("PHI_BTC_TIMING_WINDOWS_PREVIEW_ORDER_FAILURE", error instanceof Error ? error.message : "unknown");
    return res.status(503).json({ ok: false, code: "PREVIEW_ORDER_UNAVAILABLE" });
  }
}
