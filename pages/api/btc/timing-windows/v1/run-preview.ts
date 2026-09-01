import { randomUUID } from "node:crypto";
import type { NextApiRequest, NextApiResponse } from "next";
import { runBtcCleanChatModel } from "../../../../../lib/btc-clean-chat-model-runtime";
import {
  appendPreviewPhiBtcTimingWindowsRun,
  claimPreviewPhiBtcTimingWindowsRun,
  listPreviewPhiBtcTimingWindowsRuns,
  releasePreviewPhiBtcTimingWindowsRunClaim,
  reservePreviewPhiBtcTimingWindowsRunCost,
  settlePreviewPhiBtcTimingWindowsRunCost,
} from "../../../../../lib/phi-btc-timing-windows-preview-neon";
import {
  assertPhiTimingWindowsRunDue,
  buildPhiTimingWindowsQuestion,
  buildPhiTimingWindowsRunResult,
  createPhiTimingWindowsRunCostGuard,
  nextPhiTimingWindowsSlot,
  isPhiTimingWindowsPreviewExecutionConfigured,
  phiTimingWindowsModelContext,
  phiTimingWindowsPriorTurns,
  phiTimingWindowsUsageSummary,
  verifyPhiTimingWindowsHashChain,
} from "../../../../../lib/phi-btc-timing-windows-execution-v1";
import { PHI_BTC_TIMING_WINDOWS_CONTRACT, PHI_BTC_TIMING_WINDOWS_RUNS, type PhiBtcTimingWindowsRun } from "../../../../../lib/phi-btc-timing-windows-v1";
import { authenticatedTimingWindows, timingWindowsPrivateHeaders } from "./_auth";

function requestedSlot(value: unknown): PhiBtcTimingWindowsRun | null {
  return typeof value === "string" && PHI_BTC_TIMING_WINDOWS_RUNS.includes(value as PhiBtcTimingWindowsRun)
    ? value as PhiBtcTimingWindowsRun : null;
}
function failureCode(error: unknown): { status: number; code: string } {
  const message = error instanceof Error ? error.message : "";
  if (message.includes("not_due")) return { status: 409, code: "RUN_NOT_DUE" };
  if (message.includes("run_order_invalid")) return { status: 409, code: "RUN_ORDER_INVALID" };
  if (message.includes("service_window_closed") || message.includes("closeout_grace_closed")) return { status: 409, code: "RUN_WINDOW_CLOSED" };
  if (message.includes("entitlement_inactive")) return { status: 409, code: "ENTITLEMENT_INACTIVE" };
  if (message.includes("cost_guard") || message.includes("cost_limit") || message.includes("reservation")) return { status: 429, code: "PRODUCT_COST_LIMIT" };
  return { status: 503, code: "RESEARCH_RUN_UNAVAILABLE" };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  timingWindowsPrivateHeaders(res);
  if (req.method !== "POST") return res.status(405).json({ ok: false });
  const auth = await authenticatedTimingWindows(req, res);
  if (!auth) return;
  if (!isPhiTimingWindowsPreviewExecutionConfigured()) return res.status(503).json({ ok: false, code: "PREVIEW_EXECUTION_NOT_CONFIGURED" });
  const slot = requestedSlot(req.body?.slot);
  if (!slot) return res.status(400).json({ ok: false, code: "RUN_SLOT_INVALID" });

  let claimId: string | null = null;
  try {
    const runs = await listPreviewPhiBtcTimingWindowsRuns(auth.config.databaseUrl, auth.record.product_order_id);
    if (!verifyPhiTimingWindowsHashChain(runs)) return res.status(409).json({ ok: false, code: "APPEND_ONLY_MEMORY_INVALID" });
    if (nextPhiTimingWindowsSlot(runs) !== slot) return res.status(409).json({ ok: false, code: "RUN_ORDER_INVALID" });
    const now = new Date();
    const scheduledAt = assertPhiTimingWindowsRunDue(auth.record, runs, slot, now);
    claimId = `ptwc_${randomUUID()}`;
    const claimed = await claimPreviewPhiBtcTimingWindowsRun(
      auth.config.databaseUrl, auth.record.product_order_id, slot, claimId, now,
    );
    if (!claimed) return res.status(409).json({ ok: false, code: "RUN_ALREADY_CLAIMED_OR_COMPLETE" });

    const summary = phiTimingWindowsUsageSummary(runs);
    const costGuard = createPhiTimingWindowsRunCostGuard(summary, {
      reserve: (projectedRunHardCostMicros) => reservePreviewPhiBtcTimingWindowsRunCost(
        auth.config.databaseUrl, auth.record.product_order_id, claimId!, projectedRunHardCostMicros,
      ),
      settle: (actualRunCostMicros) => settlePreviewPhiBtcTimingWindowsRunCost(
        auth.config.databaseUrl, auth.record.product_order_id, claimId!, actualRunCostMicros,
      ),
    });
    const question = buildPhiTimingWindowsQuestion(slot);
    const result = await runBtcCleanChatModel({
      locale: auth.record.locale,
      question,
      priorTurns: phiTimingWindowsPriorTurns(runs),
      fieldContext: phiTimingWindowsModelContext(auth.record, runs),
      guard: costGuard,
    });
    const acceptedAt = new Date().toISOString();
    const entry = buildPhiTimingWindowsRunResult({
      order: auth.record, runs, slot, scheduledAt, acceptedAt, question, result,
    });
    if (entry.usage.nominal_cost_micros !== costGuard.actualMicros()) throw new Error("timing_windows_provider_cost_accounting_mismatch");
    const stored = await appendPreviewPhiBtcTimingWindowsRun(auth.config.databaseUrl, entry, claimId);
    if (!stored) throw new Error("timing_windows_append_conflict");
    claimId = null;
    const updatedSummary = phiTimingWindowsUsageSummary([...runs, stored]);
    return res.status(200).json({
      ok: true,
      run: stored,
      usage: {
        completed_runs: updatedSummary.providerBearingRuns,
        max_runs: PHI_BTC_TIMING_WINDOWS_CONTRACT.maxRuns,
        nominal_cost_micros: updatedSummary.nominalCostMicros,
        max_total_cost_micros: PHI_BTC_TIMING_WINDOWS_CONTRACT.maxTotalCostMicros,
      },
      append_only_memory: true,
      real_btc: false,
      preview_only: true,
    });
  } catch (error) {
    if (claimId) await releasePreviewPhiBtcTimingWindowsRunClaim(auth.config.databaseUrl, auth.record.product_order_id, claimId).catch(() => undefined);
    const failure = failureCode(error);
    console.error("PHI_BTC_TIMING_WINDOWS_RUN_FAILURE", failure.code);
    return res.status(failure.status).json({ ok: false, code: failure.code });
  }
}
