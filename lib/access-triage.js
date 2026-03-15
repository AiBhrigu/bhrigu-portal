import { decodeFreyAccessBridgeCtx } from "./frey-access-bridge.js";

const TRIAGE_VERSION = "ACCESS_TRIAGE_V0_1";
export const ACCESS_TRIAGE_V0_1 = TRIAGE_VERSION;

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

export function sanitizeFreyCtxInput(value) {
  const normalized = normalizeText(value);
  return normalized ? normalized.slice(0, 4096) : null;
}

function clampScore(value) {
  if (value < 0) return 0;
  if (value > 100) return 100;
  return Math.round(value);
}

function detectContextIntegrity(rawCtx, decodedCtx) {
  if (!rawCtx) return "missing";
  if (!decodedCtx) return "broken";
  const hasCore = Boolean(decodedCtx.signal_class || decodedCtx.operational_vector || decodedCtx.primary_date);
  return hasCore ? "valid" : "broken";
}

function computePriorityBand(score) {
  if (score >= 75) return "critical";
  if (score >= 50) return "high";
  if (score >= 25) return "normal";
  return "low";
}

function computeRouteHint(input) {
  if (input.has_compare && input.has_secondary_date) return "comparative_review";
  if (input.has_timeline) return "timing_review";
  if (input.signal_class === "decision_pressure" && input.intake_score >= 50) return "priority_review";
  if (input.signal_class === "transition") return "transition_review";
  return "standard_review";
}

export function buildAccessTriageV01(input) {
  const freyCtx = sanitizeFreyCtxInput(input?.freyCtx);
  const decoded = freyCtx ? decodeFreyAccessBridgeCtx(freyCtx) : null;

  const signalClass = normalizeText(decoded?.signal_class);
  const operationalVector = normalizeText(decoded?.operational_vector);
  const deltaMode = normalizeText(decoded?.delta_mode);
  const timelineMode = normalizeText(decoded?.timeline_mode);
  const secondaryDate = normalizeText(decoded?.secondary_date);

  const visibleRequestLength = normalizeText(input?.request?.mainQuestion).length;
  const visibleGoalLength = normalizeText(input?.request?.shortDescription).length;
  const contextIntegrity = detectContextIntegrity(freyCtx, decoded);

  const hasCompare = Boolean(signalClass === "compare" || deltaMode || secondaryDate);
  const hasTimeline = timelineMode === "active";
  const hasSecondaryDate = Boolean(secondaryDate);

  let intakeScore = 0;

  if (signalClass === "decision_pressure") intakeScore += 20;
  else if (signalClass === "compare") intakeScore += 12;
  else if (signalClass === "transition") intakeScore += 10;

  if (hasTimeline) intakeScore += 8;
  if (hasSecondaryDate) intakeScore += 10;
  if (visibleRequestLength >= 48) intakeScore += 10;
  if (visibleGoalLength >= 160) intakeScore += 10;
  if (visibleRequestLength >= 24 && visibleGoalLength >= 80) intakeScore += 10;
  if (contextIntegrity === "broken") intakeScore -= 20;
  if (visibleRequestLength < 8 && visibleGoalLength < 24) intakeScore -= 20;

  intakeScore = clampScore(intakeScore);
  const priorityBand = computePriorityBand(intakeScore);
  const routeHint = computeRouteHint({
    signal_class: signalClass,
    has_compare: hasCompare,
    has_secondary_date: hasSecondaryDate,
    has_timeline: hasTimeline,
    intake_score: intakeScore,
  });

  return {
    version: TRIAGE_VERSION,
    source: freyCtx ? "frey_ctx" : "access_only",
    signal_class: signalClass || "",
    operational_vector: operationalVector || "",
    has_compare: hasCompare,
    has_timeline: hasTimeline,
    has_secondary_date: hasSecondaryDate,
    visible_request_length: visibleRequestLength,
    visible_goal_length: visibleGoalLength,
    context_integrity: contextIntegrity,
    intake_score: intakeScore,
    priority_band: priorityBand,
    route_hint: routeHint,
  };
}

