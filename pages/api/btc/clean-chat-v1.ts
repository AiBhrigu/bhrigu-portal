import type { NextApiRequest, NextApiResponse } from "next";
import { classifyBtcCleanChatRuntimeError, runBtcCleanChatModel } from "../../../lib/btc-clean-chat-model-runtime";
import { createNeonBtcCleanChatCostGuardStore } from "../../../lib/btc-clean-chat-cost-guard-neon";
import {
  BTC_CLEAN_CHAT_BASE_RESERVATION_MICROS,
  BTC_CLEAN_CHAT_GLOBAL_HOUR_CAP_MICROS,
  btcCleanChatGuardKeys,
  ensureBtcCleanChatGuardClient,
  getBtcCleanChatGuardConfig,
  newBtcCleanChatGuardTurnId,
  normalizeBtcCleanChatGuardTurnId,
} from "../../../lib/btc-clean-chat-cost-guard";
import { createNeonBtcObservabilityStore } from "../../../lib/btc-observability-neon";
import {
  BTC_OBSERVABILITY_PRICE_POLICY,
  ensureBtcObserver,
  getBtcObservabilityConfig,
  nominalOpenAiCostMicros,
  parseChatObservability,
  type BtcObservabilityRecord,
} from "../../../lib/btc-observability-server";
import type { BtcCleanLocale, BtcCleanPriorTurn } from "../../../lib/btc-clean-chat-v1";

const MAX_BODY_BYTES = 24 * 1024;
const MAX_PRIOR_TURNS = 12;

class BtcCleanChatGuardBlocked extends Error {
  constructor(readonly disposition: string, readonly retryAfterSeconds: number) {
    super(disposition);
    this.name = "BtcCleanChatGuardBlocked";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function locale(value: unknown): BtcCleanLocale {
  return value === "ru" ? "ru" : "en";
}

function boundedString(value: unknown, max: number): string | null {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, max) : null;
}

function continuity(value: unknown): BtcCleanPriorTurn["continuity"] | undefined {
  if (!isRecord(value) || value.semantic_kind !== "ASTRO_BTC" || value.astro_relation !== "CURRENT_TO_GENESIS" || value.reference_event !== "genesis") return undefined;
  const rawSignature = isRecord(value.primary_relation_signature) ? value.primary_relation_signature : null;
  const transitBody = rawSignature ? boundedString(rawSignature.transit_body, 24) : null;
  const genesisBody = rawSignature ? boundedString(rawSignature.genesis_body, 24) : null;
  const aspect = rawSignature ? boundedString(rawSignature.aspect, 32) : null;
  const rawWindow = isRecord(value.temporal_window) ? value.temporal_window : null;
  const windowState = rawWindow && ["BOUNDED", "OPEN_START", "OPEN_END", "UNRESOLVED"].includes(String(rawWindow.state)) ? rawWindow.state as "BOUNDED" | "OPEN_START" | "OPEN_END" | "UNRESOLVED" : null;
  return {
    semantic_kind: "ASTRO_BTC", astro_relation: "CURRENT_TO_GENESIS", reference_event: "genesis",
    primary_relation_id: boundedString(value.primary_relation_id, 160),
    primary_relation_signature: transitBody && genesisBody && aspect ? { transit_body: transitBody, genesis_body: genesisBody, aspect } : null,
    temporal_window: rawWindow && windowState ? { state: windowState, start_utc: boundedString(rawWindow.start_utc, 40), peak_utc: boundedString(rawWindow.peak_utc, 40), end_utc: boundedString(rawWindow.end_utc, 40) } : null,
  };
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
      continuity: continuity(item.continuity),
    }];
  });
}

async function safeRecord(databaseUrl: string, event: BtcObservabilityRecord) {
  try { await createNeonBtcObservabilityStore(databaseUrl).recordEvent(event); } catch { /* Observability never blocks chat. */ }
}

function guardUnavailable(res: NextApiResponse, ru: boolean) {
  return res.status(503).json({
    ok: false,
    code: "COST_GUARD_UNAVAILABLE",
    retryable: true,
    message: ru ? "Защитный контур временно недоступен. Попробуйте позже." : "The protective access layer is temporarily unavailable. Please try later.",
  });
}

function guardLimited(res: NextApiResponse, ru: boolean, disposition: string, retryAfterSeconds: number) {
  if (retryAfterSeconds > 0) res.setHeader("Retry-After", String(Math.max(1, Math.ceil(retryAfterSeconds))));
  if (disposition === "replay") {
    return res.status(409).json({
      ok: false, code: "COST_GUARD_REPLAY", retryable: false,
      message: ru ? "Этот ход уже был принят. Отправьте новый вопрос только при необходимости." : "This turn was already admitted. Send a new question only if needed.",
    });
  }
  return res.status(429).json({
    ok: false, code: "COST_GUARD_LIMITED", retryable: true,
    message: ru ? "Публичный доступ временно ограничен защитным контуром. Попробуйте позже." : "Public access is temporarily limited by the protective guard. Please try later.",
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
  if (Number.isFinite(length) && length > MAX_BODY_BYTES) return res.status(413).json({ ok: false, code: "REQUEST_TOO_LARGE" });

  const body = isRecord(req.body) ? req.body : {};
  const question = typeof body.question === "string" ? body.question.trim() : "";
  if (question.length < 2 || question.length > 500) return res.status(400).json({ ok: false, code: "QUESTION_INVALID" });

  const ru = locale(body.locale) === "ru";
  const telemetryConfig = getBtcObservabilityConfig();
  const telemetryContext = parseChatObservability(body);
  const guardConfig = getBtcCleanChatGuardConfig();
  if (guardConfig.required && !guardConfig.enabled) return guardUnavailable(res, ru);

  let guardStore: ReturnType<typeof createNeonBtcCleanChatCostGuardStore> | null = null;
  let guardAdmissionKey: string | null = null;
  let guardReservedMicros = 0;
  let guardProviderHardBoundMicros = 0;
  if (guardConfig.enabled) {
    try {
      const identity = ensureBtcCleanChatGuardClient(req, res, guardConfig.secret);
      const turnId = normalizeBtcCleanChatGuardTurnId(telemetryContext?.chatTurnId) ?? newBtcCleanChatGuardTurnId();
      const keys = btcCleanChatGuardKeys(guardConfig.secret, identity.token, identity.clientIp, turnId);
      guardStore = createNeonBtcCleanChatCostGuardStore(guardConfig.databaseUrl);
      const decision = await guardStore.reserve({
        admissionKey: keys.admissionKey,
        clientKey: keys.clientKey,
        ipKey: keys.ipKey,
        now: new Date(),
        reservationMicros: BTC_CLEAN_CHAT_BASE_RESERVATION_MICROS,
      });
      if (decision.disposition !== "admitted") return guardLimited(res, ru, decision.disposition, decision.retryAfterSeconds);
      guardAdmissionKey = keys.admissionKey;
      guardReservedMicros = BTC_CLEAN_CHAT_BASE_RESERVATION_MICROS;
    } catch (error) {
      console.error("BTC_CLEAN_CHAT_COST_GUARD_ADMISSION_FAILURE", error instanceof Error ? error.message : "unknown");
      return guardUnavailable(res, ru);
    }
  }

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
      guard: guardStore && guardAdmissionKey ? {
        beforeProviderCall: async (hardCostMicros: number) => {
          if (!Number.isSafeInteger(hardCostMicros) || hardCostMicros <= 0) throw new Error("btc_clean_chat_guard_provider_bound_invalid");
          guardProviderHardBoundMicros += hardCostMicros;
          if (guardProviderHardBoundMicros > BTC_CLEAN_CHAT_GLOBAL_HOUR_CAP_MICROS) {
            throw new BtcCleanChatGuardBlocked("budget_limited", 3600);
          }
          const targetReservationMicros = Math.max(BTC_CLEAN_CHAT_BASE_RESERVATION_MICROS, guardProviderHardBoundMicros);
          if (targetReservationMicros <= guardReservedMicros) return;
          const decision = await guardStore!.upgrade({
            admissionKey: guardAdmissionKey!, now: new Date(), reservationMicros: targetReservationMicros,
          });
          if (decision.disposition !== "admitted") throw new BtcCleanChatGuardBlocked(decision.disposition, decision.retryAfterSeconds);
          guardReservedMicros = targetReservationMicros;
        },
      } : undefined,
    });

    const actualCostMicros = nominalOpenAiCostMicros(result.usage.input_tokens, result.usage.output_tokens, result.usage.web_search_calls);
    if (guardStore && guardAdmissionKey) {
      if (actualCostMicros > guardReservedMicros) {
        console.error("BTC_CLEAN_CHAT_COST_GUARD_HARD_BOUND_BREACH", { actualCostMicros, guardReservedMicros });
        return guardUnavailable(res, ru);
      }
      try {
        await guardStore.settle({ admissionKey: guardAdmissionKey, now: new Date(), actualMicros: actualCostMicros, state: "completed" });
      } catch (error) {
        console.error("BTC_CLEAN_CHAT_COST_GUARD_SETTLEMENT_FAILURE", error instanceof Error ? error.message : "unknown");
        return guardUnavailable(res, ru);
      }
    }

    if (telemetryConfig.enabled && telemetryBase) {
      await safeRecord(telemetryConfig.databaseUrl, {
        ...telemetryBase, eventType: "BTC_CHAT_ANSWER_COMPLETED", model: result.usage.model,
        inputTokens: result.usage.input_tokens, outputTokens: result.usage.output_tokens, webSearchCalls: result.usage.web_search_calls,
        nominalCostMicros: actualCostMicros, pricePolicy: BTC_OBSERVABILITY_PRICE_POLICY, completionStatus: "completed", errorClass: null,
      });
    }
    return res.status(200).json(result);
  } catch (error) {
    if (guardStore && guardAdmissionKey) {
      try { await guardStore.settle({ admissionKey: guardAdmissionKey, now: new Date(), actualMicros: null, state: "failed" }); }
      catch (settleError) { console.error("BTC_CLEAN_CHAT_COST_GUARD_FAILURE_SETTLEMENT", settleError instanceof Error ? settleError.message : "unknown"); }
    }
    if (error instanceof BtcCleanChatGuardBlocked) return guardLimited(res, ru, error.disposition, error.retryAfterSeconds);

    const failure = classifyBtcCleanChatRuntimeError(error);
    if (telemetryConfig.enabled && telemetryBase) {
      await safeRecord(telemetryConfig.databaseUrl, {
        ...telemetryBase, eventType: "BTC_CHAT_ANSWER_FAILED", model: null, inputTokens: null, outputTokens: null,
        webSearchCalls: null, nominalCostMicros: null, pricePolicy: null, completionStatus: "failed", errorClass: "model_runtime_failure",
      });
    }
    console.error("BTC_CLEAN_CHAT_MODEL_RUNTIME_FAILURE", failure.code);
    const message = failure.retryable
      ? (ru ? "Сервис временно недоступен. Попробуйте позже." : "The service is temporarily unavailable. Please try later.")
      : (ru ? "Модельный evidence runtime не завершил ответ. Повторять тот же вопрос не нужно." : "The model-backed evidence runtime did not complete the answer. Repeating the same question is not needed.");
    return res.status(503).json({ ok: false, code: failure.code, retryable: failure.retryable, message });
  }
}
