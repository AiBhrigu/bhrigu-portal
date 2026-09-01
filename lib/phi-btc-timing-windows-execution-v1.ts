import { createHash, randomUUID } from "node:crypto";
import type { BtcCleanPriorTurn, BtcCleanChatResponse } from "./btc-clean-chat-v1";
import type { BtcResearchFieldModelContext } from "./btc-research-field-v1";
import {
  admitPhiBtcTimingWindowsRun,
  PHI_BTC_TIMING_WINDOWS_CLOSEOUT_GRACE_MS,
  PHI_BTC_TIMING_WINDOWS_MAX_RUN_COST_MICROS,
  PHI_BTC_TIMING_WINDOWS_MAX_TOTAL_COST_MICROS,
  PHI_BTC_TIMING_WINDOWS_RUNS,
  type PhiBtcTimingWindowsOrderRecord,
  type PhiBtcTimingWindowsRun,
  type PhiBtcTimingWindowsUsageSummary,
} from "./phi-btc-timing-windows-v1";

export const PHI_BTC_TIMING_WINDOWS_RUN_RESULT_KIND = "PHI_BTC_TIMING_WINDOWS_RUN_RESULT" as const;
export const PHI_BTC_TIMING_WINDOWS_RUN_CLAIM_MS = 5 * 60 * 1000;
const SLOT_OFFSET_DAYS: Record<PhiBtcTimingWindowsRun, number> = {
  BASELINE: 0, DAY_7: 7, DAY_14: 14, DAY_21: 21, DAY_28: 28, DAY_30_CLOSEOUT: 30,
};
const RUN_ID = /^ptwr_[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const HASH = /^[a-f0-9]{64}$/;

export type PhiBtcTimingWindowsRunUsage = {
  input_tokens: number;
  output_tokens: number;
  web_search_calls: number;
  nominal_cost_micros: number;
};
export type PhiBtcTimingWindowsRunResult = {
  kind: typeof PHI_BTC_TIMING_WINDOWS_RUN_RESULT_KIND;
  run_id: string;
  product_id: PhiBtcTimingWindowsOrderRecord["product_id"];
  product_order_id: string;
  research_object_id: string;
  slot: PhiBtcTimingWindowsRun;
  scheduled_at: string;
  accepted_at: string;
  question: string;
  answer: string;
  topic: string;
  as_of: string;
  sources: BtcCleanChatResponse["sources"];
  evidence: BtcCleanChatResponse["evidence"];
  boundary: BtcCleanChatResponse["boundary"];
  usage: PhiBtcTimingWindowsRunUsage;
  previous_entry_hash: string | null;
  entry_hash: string;
  preview_only: true;
};

function stable(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value as Record<string, unknown>).sort(([a],[b]) => a.localeCompare(b)).map(([k,v]) => [k, stable(v)]));
  return value;
}

export function isPhiTimingWindowsPreviewExecutionConfigured(env: Partial<NodeJS.ProcessEnv> = process.env): boolean {
  if (env.VERCEL_ENV !== "preview" || !env.BHRIGU_ASTRO_FIELD_URL?.trim()) return false;
  if (env.BTC_RESEARCH_FIELD_MODE === "preview_v1") {
    const endpoint = env.BTC_RESEARCH_FIELD_PREVIEW_RESPONSES_URL?.trim();
    return Boolean(endpoint?.startsWith("https://") && env.BTC_RESEARCH_FIELD_PREVIEW_MODEL_ID?.trim() && env.BTC_RESEARCH_FIELD_PREVIEW_BEARER?.trim());
  }
  return Boolean(env.OPENAI_API_KEY?.trim());
}

export function phiTimingWindowsCanonicalHash(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(stable(value)), "utf8").digest("hex");
}
export function phiTimingWindowsNominalCostMicros(usage: { input_tokens: number; output_tokens: number; web_search_calls: number }): number {
  return usage.input_tokens * 5 + usage.output_tokens * 30 + usage.web_search_calls * 10_000;
}
export function phiTimingWindowsUsageSummary(runs: PhiBtcTimingWindowsRunResult[]): PhiBtcTimingWindowsUsageSummary {
  return { providerBearingRuns: runs.length, nominalCostMicros: runs.reduce((sum, run) => sum + run.usage.nominal_cost_micros, 0) };
}
export function phiTimingWindowsScheduledAt(serviceStart: string, slot: PhiBtcTimingWindowsRun): string {
  const start = new Date(serviceStart);
  if (!Number.isFinite(start.getTime())) throw new Error("timing_windows_service_start_invalid");
  return new Date(start.getTime() + SLOT_OFFSET_DAYS[slot] * 86_400_000).toISOString();
}
export function nextPhiTimingWindowsSlot(runs: PhiBtcTimingWindowsRunResult[]): PhiBtcTimingWindowsRun | null {
  const seen = new Set(runs.map((run) => run.slot));
  return PHI_BTC_TIMING_WINDOWS_RUNS.find((slot) => !seen.has(slot)) ?? null;
}
export function assertPhiTimingWindowsRunDue(order: PhiBtcTimingWindowsOrderRecord, runs: PhiBtcTimingWindowsRunResult[], slot: PhiBtcTimingWindowsRun, now: Date): string {
  if (order.entitlement_state !== "ACTIVE" || !order.service_start || !order.service_end) throw new Error("timing_windows_entitlement_inactive");
  if (nextPhiTimingWindowsSlot(runs) !== slot) throw new Error("timing_windows_run_order_invalid");
  const scheduled = phiTimingWindowsScheduledAt(order.service_start, slot);
  if (now.getTime() < new Date(scheduled).getTime()) throw new Error("timing_windows_run_not_due");
  const end = new Date(order.service_end).getTime();
  if (slot !== "DAY_30_CLOSEOUT" && now.getTime() >= end) throw new Error("timing_windows_service_window_closed");
  if (slot === "DAY_30_CLOSEOUT" && now.getTime() > end + PHI_BTC_TIMING_WINDOWS_CLOSEOUT_GRACE_MS) throw new Error("timing_windows_closeout_grace_closed");
  return scheduled;
}

export function buildPhiTimingWindowsQuestion(slot: PhiBtcTimingWindowsRun): string {
  const common = "Primary axis: Bitcoin. Use current independent BTC market evidence and canonical astronomy/Astro×BTC only as supporting temporal context. Produce research, not trading advice. Separate observed fact, inference, forecast and unknown. Preserve every earlier forecast exactly; never rewrite a prior claim after seeing the outcome.";
  if (slot === "BASELINE") return `${common} BASELINE: lock the 30-day research baseline now. State the current BTC market state; 2-4 timing windows; key levels; directional and price-zone hypotheses; conditions that strengthen or weaken each scenario; explicit invalidation conditions; uncertainty and evidence provenance.`;
  if (slot === "DAY_30_CLOSEOUT") return `${common} DAY 30 CLOSEOUT: compare the full locked ledger with realized evidence. Mark important prior hypotheses as held, failed or unresolved without retroactive editing. Summarize which timing windows mattered, what did not, and the method lessons. Do not open a new 30-day forecast.`;
  return `${common} ${slot.replace("_", " ")}: append a checkpoint to the existing 30-day object. Compare current evidence with the locked baseline and all prior checkpoints; state what held, failed or remains unresolved. Update only prospective windows from this checkpoint forward, with key levels, conditional scenarios and invalidation conditions.`;
}

export function phiTimingWindowsPriorTurns(runs: PhiBtcTimingWindowsRunResult[]): BtcCleanPriorTurn[] {
  return runs.slice(-5).map((run) => ({ user: run.question, assistant: run.answer, topic: run.topic }));
}
export function phiTimingWindowsModelContext(order: PhiBtcTimingWindowsOrderRecord, runs: PhiBtcTimingWindowsRunResult[]): BtcResearchFieldModelContext {
  const baseline = runs.find((run) => run.slot === "BASELINE") ?? null;
  const latest = runs.at(-1) ?? null;
  return {
    field_title: "Φ BTC Timing Windows · Founding",
    primary_question: "What are the most important Bitcoin timing windows, structural conditions, and invalidation points over the next 30 days?",
    time_horizon: order.service_end,
    evidence_preferences: ["snapshot", "market_structure", "binance", "astronomy"],
    watch_conditions: ["timing windows", "key levels", "scenario invalidation", "failed forecast preservation"],
    exact_polymarket_contracts: [],
    baseline_digest: baseline?.entry_hash ?? null,
    latest_checkpoint_digest: latest?.entry_hash ?? null,
    memory_boundary: "Append-only forecast ledger. Earlier accepted claims are immutable historical memory. Current evidence may update only future-facing hypotheses; failed forecasts must remain visible.",
  };
}

export function createPhiTimingWindowsRunCostGuard(previous: PhiBtcTimingWindowsUsageSummary, persistence?: {
  reserve?: (projectedRunHardCostMicros: number) => Promise<void>;
  settle?: (actualRunCostMicros: number) => Promise<void>;
}) {
  let actualMicros = 0;
  let currentHardReservation = 0;
  return {
    async beforeProviderCall(hardCostMicros: number) {
      const projectedRun = actualMicros + hardCostMicros;
      const admission = admitPhiBtcTimingWindowsRun(
        { providerBearingRuns: previous.providerBearingRuns, nominalCostMicros: previous.nominalCostMicros },
        projectedRun,
      );
      if (!admission.allowed) throw new Error(`timing_windows_cost_guard_${admission.code.toLowerCase()}`);
      if (previous.nominalCostMicros + projectedRun > PHI_BTC_TIMING_WINDOWS_MAX_TOTAL_COST_MICROS) throw new Error("timing_windows_cost_guard_total_cost_limit");
      await persistence?.reserve?.(projectedRun);
      currentHardReservation = hardCostMicros;
    },
    async afterProviderCall(usage: { input_tokens: number; output_tokens: number; web_search_calls: number }) {
      const cost = phiTimingWindowsNominalCostMicros(usage);
      if (cost > currentHardReservation) throw new Error("timing_windows_provider_cost_exceeds_reservation");
      actualMicros += cost;
      currentHardReservation = 0;
      if (actualMicros > PHI_BTC_TIMING_WINDOWS_MAX_RUN_COST_MICROS) throw new Error("timing_windows_run_cost_limit");
      if (previous.nominalCostMicros + actualMicros > PHI_BTC_TIMING_WINDOWS_MAX_TOTAL_COST_MICROS) throw new Error("timing_windows_total_cost_limit");
      await persistence?.settle?.(actualMicros);
    },
    actualMicros: () => actualMicros,
  };
}

export function buildPhiTimingWindowsRunResult(input: {
  order: PhiBtcTimingWindowsOrderRecord;
  runs: PhiBtcTimingWindowsRunResult[];
  slot: PhiBtcTimingWindowsRun;
  scheduledAt: string;
  acceptedAt: string;
  question: string;
  result: BtcCleanChatResponse;
}): PhiBtcTimingWindowsRunResult {
  const usage: PhiBtcTimingWindowsRunUsage = {
    input_tokens: input.result.usage.input_tokens,
    output_tokens: input.result.usage.output_tokens,
    web_search_calls: input.result.usage.web_search_calls,
    nominal_cost_micros: phiTimingWindowsNominalCostMicros(input.result.usage),
  };
  const previous = input.runs.at(-1)?.entry_hash ?? null;
  const core = {
    kind: PHI_BTC_TIMING_WINDOWS_RUN_RESULT_KIND,
    run_id: `ptwr_${randomUUID()}`,
    product_id: input.order.product_id,
    product_order_id: input.order.product_order_id,
    research_object_id: input.order.research_object_id,
    slot: input.slot,
    scheduled_at: input.scheduledAt,
    accepted_at: input.acceptedAt,
    question: input.question,
    answer: input.result.answer,
    topic: input.result.topic,
    as_of: input.result.as_of,
    sources: input.result.sources,
    evidence: input.result.evidence,
    boundary: input.result.boundary,
    usage,
    previous_entry_hash: previous,
    preview_only: true as const,
  };
  return { ...core, entry_hash: phiTimingWindowsCanonicalHash(core) };
}

export function isPhiTimingWindowsRunResult(value: unknown): value is PhiBtcTimingWindowsRunResult {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const r = value as Record<string, any>;
  return r.kind === PHI_BTC_TIMING_WINDOWS_RUN_RESULT_KIND && RUN_ID.test(String(r.run_id || ""))
    && PHI_BTC_TIMING_WINDOWS_RUNS.includes(r.slot) && typeof r.answer === "string" && r.answer.length > 0
    && typeof r.question === "string" && typeof r.product_order_id === "string" && typeof r.research_object_id === "string"
    && (r.previous_entry_hash === null || HASH.test(String(r.previous_entry_hash))) && HASH.test(String(r.entry_hash))
    && r.preview_only === true && Number.isSafeInteger(r.usage?.nominal_cost_micros) && r.usage.nominal_cost_micros >= 0;
}
export function verifyPhiTimingWindowsHashChain(runs: PhiBtcTimingWindowsRunResult[]): boolean {
  for (let i=0;i<runs.length;i++) {
    const run = runs[i];
    if (run.previous_entry_hash !== (i ? runs[i-1].entry_hash : null)) return false;
    const { entry_hash, ...core } = run;
    if (phiTimingWindowsCanonicalHash(core) !== entry_hash) return false;
  }
  return true;
}
