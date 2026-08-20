import type { NextApiRequest, NextApiResponse } from "next";
import { runBtcCleanChatModel } from "../../../lib/btc-clean-chat-model-runtime";
import type { BtcCleanLocale, BtcCleanPriorTurn } from "../../../lib/btc-clean-chat-v1";

function locale(value: unknown): BtcCleanLocale {
  return value === "ru" ? "ru" : "en";
}

function prior(value: unknown): BtcCleanPriorTurn[] {
  if (typeof value !== "string" || !value.trim()) return [];
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed.slice(-8).flatMap((item) => {
      if (!item || typeof item !== "object" || typeof item.user !== "string") return [];
      return [{
        user: item.user.slice(0, 500),
        assistant: typeof item.assistant === "string" ? item.assistant.slice(0, 1600) : undefined,
        topic: typeof item.topic === "string" ? item.topic.slice(0, 80) : undefined,
      }];
    });
  } catch {
    return [];
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Cache-Control", "private, no-store, max-age=0, must-revalidate");
  res.setHeader("X-Robots-Tag", "noindex, nofollow");
  if (process.env.VERCEL_ENV !== "preview") return res.status(404).end();
  if (req.method !== "GET") return res.status(405).json({ ok: false });
  const question = typeof req.query.q === "string" ? req.query.q.trim() : "";
  if (question.length < 2 || question.length > 500) return res.status(400).json({ ok: false, code: "QUESTION_INVALID" });
  try {
    return res.status(200).json(await runBtcCleanChatModel({
      locale: locale(req.query.locale),
      question,
      priorTurns: prior(req.query.prior),
    }));
  } catch (error) {
    console.error("BTC_CLEAN_CHAT_PREVIEW_PROBE_FAILURE", error instanceof Error ? error.message : "unknown");
    return res.status(503).json({ ok: false, code: "MODEL_RUNTIME_UNAVAILABLE" });
  }
}
