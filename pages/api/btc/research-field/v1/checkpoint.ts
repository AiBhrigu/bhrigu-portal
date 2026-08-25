import { randomUUID } from "node:crypto";
import type { NextApiRequest, NextApiResponse } from "next";
import { authenticatedField, privateHeaders } from "./_auth";
import {
  buildBtcResearchContinuityDigest,
  hashBtcResearchFieldTurnResult,
  isBtcResearchFieldActive,
} from "../../../../../lib/btc-research-field-v1";

function validResult(value: any) {
  return value
    && value.ok === true
    && typeof value.answer === "string"
    && typeof value.topic === "string"
    && typeof value.as_of === "string"
    && Array.isArray(value.sources)
    && value.evidence
    && value.boundary
    && typeof value.research_field?.turn_id === "string";
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  privateHeaders(res);
  if (req.method !== "POST") return res.status(405).json({ ok: false });
  const auth = await authenticatedField(req, res);
  if (!auth) return;
  if (!isBtcResearchFieldActive(auth.field)) {
    return res.status(409).json({ ok: false, code: "FIELD_NOT_ACTIVE" });
  }
  const role = req.body?.role === "BASELINE" ? "BASELINE" : req.body?.role === "CHECKPOINT" ? "CHECKPOINT" : null;
  const result = req.body?.result;
  const question = typeof req.body?.question === "string" ? req.body.question.trim().slice(0, 500) : "";
  if (!role || !validResult(result) || !question) {
    return res.status(400).json({ ok: false, code: "CHECKPOINT_INVALID" });
  }
  const resultHash = hashBtcResearchFieldTurnResult(question, result);
  if (!(await auth.store.completedTurnMatches(auth.field.fieldId, result.research_field.turn_id, resultHash))) {
    return res.status(409).json({ ok: false, code: "TURN_NOT_COMPLETED_IN_FIELD" });
  }
  const checkpoints = await auth.store.checkpoints(auth.field.fieldId);
  const hasBaseline = checkpoints.some((item) => item.role === "BASELINE");
  if (role === "BASELINE" && hasBaseline) {
    return res.status(409).json({ ok: false, code: "BASELINE_EXISTS" });
  }
  if (role === "CHECKPOINT" && !hasBaseline) {
    return res.status(409).json({ ok: false, code: "BASELINE_REQUIRED" });
  }
  try {
    const checkpoint = await auth.store.insertCheckpoint({
      checkpointId: `btcrfc_${randomUUID()}`,
      fieldId: auth.field.fieldId,
      role,
      acceptedAt: new Date().toISOString(),
      question,
      answer: result.answer.slice(0, 12000),
      topic: result.topic.slice(0, 80),
      asOf: result.as_of,
      sources: result.sources,
      evidenceState: result.evidence,
      boundaryState: result.boundary,
      continuityDigest: buildBtcResearchContinuityDigest({ question, result }),
    });
    return res.status(201).json({
      ok: true,
      checkpoint: {
        role: checkpoint.role,
        acceptedAt: checkpoint.acceptedAt,
        topic: checkpoint.topic,
        asOf: checkpoint.asOf,
      },
    });
  } catch {
    return res.status(409).json({ ok: false, code: "CHECKPOINT_CONFLICT" });
  }
}
