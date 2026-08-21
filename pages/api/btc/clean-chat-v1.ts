import type { NextApiRequest, NextApiResponse } from "next";
import { runBtcCleanChatModel } from "../../../lib/btc-clean-chat-model-runtime";
import type {
  BtcCleanLocale,
  BtcCleanPriorTurn,
} from "../../../lib/btc-clean-chat-v1";

const MAX_BODY_BYTES = 24 * 1024;
const MAX_PRIOR_TURNS = 12;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function locale(value: unknown): BtcCleanLocale {
  return value === "ru" ? "ru" : "en";
}

function priorTurns(value: unknown): BtcCleanPriorTurn[] {
  if (!Array.isArray(value)) return [];
  return value.slice(-MAX_PRIOR_TURNS).flatMap((item) => {
    if (!isRecord(item) || typeof item.user !== "string") return [];
    const user = item.user.trim().slice(0, 500);
    if (!user) return [];
    return [{
      user,
      assistant: typeof item.assistant === "string" ? item.assistant.trim().slice(0, 1600) : undefined,
      topic: typeof item.topic === "string" ? item.topic.trim().slice(0, 80) : undefined,
    }];
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Cache-Control", "private, no-store, max-age=0, must-revalidate");
  res.setHeader("X-Robots-Tag", "noindex, nofollow");
  res.setHeader("X-BHRIGU-Clean-Chat", "btc-clean-chat-v1-model");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, code: "METHOD_NOT_ALLOWED" });
  }

  const length = Number(req.headers["content-length"] ?? 0);
  if (Number.isFinite(length) && length > MAX_BODY_BYTES) {
    return res.status(413).json({ ok: false, code: "REQUEST_TOO_LARGE" });
  }

  const body = isRecord(req.body) ? req.body : {};
  const question = typeof body.question === "string" ? body.question.trim() : "";
  if (question.length < 2 || question.length > 500) {
    return res.status(400).json({ ok: false, code: "QUESTION_INVALID" });
  }

  try {
    const result = await runBtcCleanChatModel({
      locale: locale(body.locale),
      question,
      priorTurns: priorTurns(body.priorTurns),
    });
    return res.status(200).json(result);
  } catch (error) {
    console.error("BTC_CLEAN_CHAT_MODEL_RUNTIME_FAILURE", error instanceof Error ? error.message : "unknown");
    return res.status(503).json({
      ok: false,
      code: "MODEL_EVIDENCE_RUNTIME_UNAVAILABLE",
      message: locale(body.locale) === "ru"
        ? "Модельный evidence runtime временно недоступен. Я не буду подменять его сохранённым ответом."
        : "The model-backed evidence runtime is temporarily unavailable. I will not replace it with a stored answer.",
    });
  }
}
