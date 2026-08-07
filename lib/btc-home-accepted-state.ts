import { loadBtcMarketEnvelope } from "./btc-market-envelope";

export type BtcHomeAcceptedState = {
  status: "READY" | "LIMITED" | "UNAVAILABLE";
  freshness: "FRESH" | "STALE_LIMITED" | "UNAVAILABLE";
  snapshot_time_utc: string | null;
  evidence_source_count: number;
  comparable_metric_count: number;
  changed_metric_count: number;
  stable_metric_count: number;
  delta_direction: "MIXED" | "UP" | "DOWN" | "STABLE" | "BOUNDED" | "UNAVAILABLE";
  synthesis_state: "CONFIRMATION" | "DIVERGENCE" | "INSUFFICIENT_EVIDENCE" | "UNAVAILABLE";
  conditions_state: "WATCH_NEXT" | "LIMITED" | "UNAVAILABLE";
};

export const EMPTY_BTC_HOME_ACCEPTED_STATE: BtcHomeAcceptedState = {
  status: "UNAVAILABLE",
  freshness: "UNAVAILABLE",
  snapshot_time_utc: null,
  evidence_source_count: 0,
  comparable_metric_count: 0,
  changed_metric_count: 0,
  stable_metric_count: 0,
  delta_direction: "UNAVAILABLE",
  synthesis_state: "UNAVAILABLE",
  conditions_state: "UNAVAILABLE",
};

const HOME_ACCEPTED_STATE_QUESTION =
  "What changed in Bitcoin since the previous accepted Snapshot — and why does it matter?";

export async function loadBtcHomeAcceptedState(): Promise<BtcHomeAcceptedState> {
  const envelope = await loadBtcMarketEnvelope(HOME_ACCEPTED_STATE_QUESTION, {
    timeoutMs: 2200,
  });

  if (envelope.ok === false) return EMPTY_BTC_HOME_ACCEPTED_STATE;

  const metrics = envelope.value.memory.metrics;
  const directional = metrics
    .filter((metric) => metric.type === "NUMERIC")
    .map((metric) => metric.direction)
    .filter((direction) => direction === "UP" || direction === "DOWN");
  const hasUp = directional.includes("UP");
  const hasDown = directional.includes("DOWN");
  const changedMetricCount = metrics.filter((metric) => metric.direction !== "UNCHANGED").length;
  const stableMetricCount = metrics.filter((metric) => metric.direction === "UNCHANGED").length;

  const deltaDirection: BtcHomeAcceptedState["delta_direction"] =
    hasUp && hasDown
      ? "MIXED"
      : hasUp
        ? "UP"
        : hasDown
          ? "DOWN"
          : changedMetricCount === 0
            ? "STABLE"
            : "BOUNDED";

  const freshness = envelope.value.current.source_freshness;
  const status: BtcHomeAcceptedState["status"] =
    freshness === "FRESH" && envelope.value.source_proof.proof_source_count >= 7
      ? "READY"
      : "LIMITED";

  return {
    status,
    freshness,
    snapshot_time_utc: envelope.value.current.source_generated_at_utc,
    evidence_source_count: envelope.value.source_proof.proof_source_count,
    comparable_metric_count: envelope.value.memory.comparable_metric_count,
    changed_metric_count: changedMetricCount,
    stable_metric_count: stableMetricCount,
    delta_direction: deltaDirection,
    synthesis_state: envelope.value.synthesis.state,
    conditions_state: envelope.value.synthesis.watch_next.length > 0 ? "WATCH_NEXT" : "LIMITED",
  };
}
