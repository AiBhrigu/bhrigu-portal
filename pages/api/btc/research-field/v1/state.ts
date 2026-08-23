import type { NextApiRequest, NextApiResponse } from "next";
import { authenticatedField, privateHeaders } from "./_auth";
import { BTC_RESEARCH_FIELD_MAX_TURNS, isBtcResearchFieldActive } from "../../../../../lib/btc-research-field-v1";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  privateHeaders(res);
  if (req.method !== "GET") return res.status(405).json({ ok: false });
  const auth = await authenticatedField(req, res);
  if (!auth) return;
  const checkpoints = await auth.store.checkpoints(auth.field.fieldId);
  const baseline = checkpoints.find((item) => item.role === "BASELINE") ?? null;
  const latest = checkpoints.at(-1) ?? null;
  return res.status(200).json({
    ok: true,
    field: {
      fieldId: auth.field.fieldId,
      status: auth.field.status,
      title: auth.field.title,
      primaryQuestion: auth.field.primaryQuestion,
      timeHorizon: auth.field.timeHorizon,
      evidencePreferences: auth.field.evidencePreferences,
      watchConditions: auth.field.watchConditions,
      exactPolymarketContracts: auth.field.exactPolymarketContracts,
      serviceStart: auth.field.serviceStart,
      serviceEnd: auth.field.serviceEnd,
      completedTurns: auth.field.completedTurns,
      remainingTurns: Math.max(0, BTC_RESEARCH_FIELD_MAX_TURNS - auth.field.completedTurns),
      active: isBtcResearchFieldActive(auth.field),
    },
    baseline: baseline ? { acceptedAt: baseline.acceptedAt, topic: baseline.topic, asOf: baseline.asOf } : null,
    latest: latest ? { role: latest.role, acceptedAt: latest.acceptedAt, topic: latest.topic, asOf: latest.asOf } : null,
    payment: auth.field.status === "PENDING_PAYMENT" ? "FAKE_PREVIEW_ONLY" : null,
    real_btc: false,
  });
}
