import type { NextApiRequest, NextApiResponse } from "next";
import { createNeonBtcResearchFieldStore } from "../../../../../lib/btc-research-field-neon";
import { getBtcResearchFieldConfig } from "../../../../../lib/btc-research-field-config";
import { normalizeBtcResearchFieldConfig } from "../../../../../lib/btc-research-field-v1";
import { privateHeaders } from "./_auth";

function requestOrigin(req: NextApiRequest): string {
  const protoRaw = req.headers["x-forwarded-proto"];
  const hostRaw = req.headers["x-forwarded-host"];
  const proto = (Array.isArray(protoRaw) ? protoRaw[0] : protoRaw) || "https";
  const host = (Array.isArray(hostRaw) ? hostRaw[0] : hostRaw) || req.headers.host || "localhost:3000";
  return `${proto}://${host}`;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  privateHeaders(res);
  if (req.method !== "POST") return res.status(405).json({ ok: false });
  const runtime = getBtcResearchFieldConfig();
  if (!runtime.enabled) return res.status(404).json({ ok: false });
  const config = normalizeBtcResearchFieldConfig(req.body);
  if (!config) return res.status(400).json({ ok: false, code: "FIELD_CONFIG_INVALID" });
  try {
    const created = await createNeonBtcResearchFieldStore(runtime.databaseUrl).createPendingField(config);
    return res.status(201).json({
      ok: true,
      field_id: created.field.fieldId,
      status: created.field.status,
      private_link: `${requestOrigin(req)}/crypto-astro/btc/field/${created.field.fieldId}#${created.secret}`,
      payment: "FAKE_PREVIEW_ONLY",
      real_btc: false,
    });
  } catch (error) {
    console.error("BTC_RESEARCH_FIELD_CREATE_FAILURE", error instanceof Error ? error.message : "unknown");
    return res.status(503).json({ ok: false, code: "FIELD_CREATE_UNAVAILABLE" });
  }
}
