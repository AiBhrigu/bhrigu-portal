import type { NextApiRequest, NextApiResponse } from "next";
import { classifyBtcCleanChatRuntimeError, runBtcCleanChatModel } from "../../../lib/btc-clean-chat-model-runtime";
import { createNeonBtcObservabilityStore } from "../../../lib/btc-observability-neon";
import {
  BTC_OBSERVABILITY_PRICE_POLICY,
  ensureBtcObserver,
  getBtcObservabilityConfig,
  nominalOpenAiCostMicros,
  parseChatObservability,
  type BtcObservabilityRecord,
} from "../../../lib/btc-observability-server";
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

async function safeRecord(databaseUrl: string, event: BtcObservabilityRecord) {
  try { await createNeonBtcObservabilityStore(databaseUrl).recordEvent(event); } catch { /* Observability never blocks chat. */ }
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

  const telemetryConfig = getBtcObservabilityConfig();
  const telemetryContext = parseChatObservability(body);
  const anonBrowserKey = telemetryConfig.enabled && telemetryContext ? ensureBtcObserver(req, res, telemetryConfig.secret) : null;
  const telemetryBase = telemetryConfig.enabled && telemetryContext && anonBrowserKey ? {
    anonBrowserKey, visitSessionId: telemetryContext.visitSessionId, locale: locale(body.locale), surface: "btc_clean_chat" as const,
    chatTurnId: telemetryContext.chatTurnId, donationSessionId: null,
    trafficSource: telemetryContext.source, trafficMedium: telemetryContext.medium, trafficCampaign: telemetryContext.campaign,
  } : null;
  if (telemetryConfig.enabled && telemetryBase) {
    await safeRecord(telemetryConfig.databaseUrl, {
      ...telemetryBase, eventType: "BTC_CHAT_QUESTION_SENT", model: null, inputTokens: null, outputTokens: null,
      webSearchCalls: null, nominalCostMicros: null, pricePolicy: null, completionStatus: null, errorClass: null,
    });
  }

  try {
    const result = await runBtcCleanChatModel({
      locale: locale(body.locale),
      question,
      priorTurns: priorTurns(body.priorTurns),
    });
    if (telemetryConfig.enabled && telemetryBase) {
      await safeRecord(telemetryConfig.databaseUrl, {
        ...telemetryBase, eventType: "BTC_CHAT_ANSWER_COMPLETED", model: result.usage.model,
        inputTokens: result.usage.input_tokens, outputTokens: result.usage.output_tokens, webSearchCalls: result.usage.web_search_calls,
        nominalCostMicros: nominalOpenAiCostMicros(result.usage.input_tokens, result.usage.output_tokens, result.usage.web_search_calls),
        pricePolicy: BTC_OBSERVABILITY_PRICE_POLICY, completionStatus: "completed", errorClass: null,
      });
    }
    return res.status(200).json(result);
  } catch (error) {
    const failure = classifyBtcCleanChatRuntimeError(error);
    if (telemetryConfig.enabled && telemetryBase) {
      await safeRecord(telemetryConfig.databaseUrl, {
        ...telemetryBase, eventType: "BTC_CHAT_ANSWER_FAILED", model: null, inputTokens: null, outputTokens: null,
        webSearchCalls: null, nominalCostMicros: null, pricePolicy: null, completionStatus: "failed", errorClass: "model_runtime_failure",
      });
    }
    console.error("BTC_CLEAN_CHAT_MODEL_RUNTIME_FAILURE", failure.code);
    const ru = locale(body.locale) === "ru";
    const message = failure.retryable
      ? (ru ? "Сервис временно недоступен. Попробуйте позже." : "The service is temporarily unavailable. Please try later.")
      : (ru ? "Модельный evidence runtime не завершил ответ. Повторять тот же вопрос не нужно." : "The model-backed evidence runtime did not complete the answer. Repeating the same question is not needed.");
    return res.status(503).json({
      ok: false,
      code: failure.code,
      retryable: failure.retryable,
      message,
    });
  }
}
