import { randomUUID } from "node:crypto";
import type { NextApiRequest, NextApiResponse } from "next";
import { authenticatedField, privateHeaders } from "./_auth";
import { runBtcCleanChatModel } from "../../../../../lib/btc-clean-chat-model-runtime";
import type { BtcCleanPriorTurn } from "../../../../../lib/btc-clean-chat-v1";
import {
  buildBtcResearchFieldModelContext,
  hashBtcResearchFieldTurnResult,
  BTC_RESEARCH_FIELD_MAX_TURNS,
  isBtcResearchFieldActive,
} from "../../../../../lib/btc-research-field-v1";

const MAX_PRIOR_TURNS = 12;
function priorTurns(value: unknown): BtcCleanPriorTurn[] {
  if (!Array.isArray(value)) return [];
  return value.slice(-MAX_PRIOR_TURNS).flatMap((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item) || typeof (item as any).user !== "string") return [];
    const user = String((item as any).user).trim().slice(0, 500);
    if (!user) return [];
    return [{
      user,
      assistant: typeof (item as any).assistant === "string" ? (item as any).assistant.trim().slice(0, 1600) : undefined,
      topic: typeof (item as any).topic === "string" ? (item as any).topic.trim().slice(0, 80) : undefined,
    }];
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  privateHeaders(res);
  if (req.method !== "POST") return res.status(405).json({ ok: false });
  const auth = await authenticatedField(req, res);
  if (!auth) return;
  if (!isBtcResearchFieldActive(auth.field)) {
    return res.status(409).json({ ok: false, code: "FIELD_NOT_ACTIVE" });
  }
  const question = typeof req.body?.question === "string" ? req.body.question.trim() : "";
  if (question.length < 2 || question.length > 500) {
    return res.status(400).json({ ok: false, code: "QUESTION_INVALID" });
  }
  const turnId = `btcrft_${randomUUID()}`;
  if (!(await auth.store.claimTurn(auth.field.fieldId, turnId))) {
    return res.status(429).json({ ok: false, code: "FIELD_TURN_UNAVAILABLE" });
  }
  try {
    const checkpoints = await auth.store.checkpoints(auth.field.fieldId);
    const baseline = checkpoints.find((item) => item.role === "BASELINE") ?? null;
    const latest = checkpoints.at(-1) ?? null;
    const result = await runBtcCleanChatModel({
      locale: auth.field.locale,
      question,
      priorTurns: priorTurns(req.body?.priorTurns),
      fieldContext: buildBtcResearchFieldModelContext(auth.field, baseline, latest),
    });
    const resultHash = hashBtcResearchFieldTurnResult(question, result);
    const completed = await auth.store.completeTurn(auth.field.fieldId, turnId, result.usage, resultHash);
    return res.status(200).json({
      ...result,
      research_field: {
        turn_id: turnId,
        completed_turns: completed,
        remaining_turns: Math.max(0, BTC_RESEARCH_FIELD_MAX_TURNS - completed),
      },
    });
  } catch (error) {
    await auth.store.failTurn(auth.field.fieldId, turnId);
    console.error("BTC_RESEARCH_FIELD_CHAT_FAILURE", error instanceof Error ? error.message : "unknown");
    return res.status(503).json({ ok: false, code: "RESEARCH_FIELD_RUNTIME_UNAVAILABLE" });
  }
}
