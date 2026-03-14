import {
  SIGNAL_PRIORITY,
  SIGNAL_TRIGGER_MAP,
  SIGNAL_BIAS_MAP,
  SIGNAL_VECTOR_MAP,
} from "./frey-signal-rules.js";

const DATE_RX = /\b\d{4}-\d{2}-\d{2}\b/;

export function normalizeSignalInput(input) {
  if (typeof input !== "string") return "";
  return input.toLowerCase().trim().replace(/\s+/g, " ");
}

export function tokenizeSignalInput(input) {
  return normalizeSignalInput(input).split(/[^a-z0-9_-]+/).filter(Boolean);
}

export function countSignalHits(tokens, raw) {
  const text = normalizeSignalInput(raw);
  const counts = {
    stabilize: 0,
    clarify: 0,
    compare: 0,
    time_horizon: 0,
    decision_pressure: 0,
    transition: 0,
  };

  for (const [key, markers] of Object.entries(SIGNAL_TRIGGER_MAP)) {
    for (const marker of markers) {
      if (marker.length === 1) {
        if (text.includes(marker)) counts[key] += 1;
      } else if (marker.includes(" ")) {
        if (text.includes(marker)) counts[key] += 1;
      } else {
        if (tokens.includes(marker)) counts[key] += 1;
      }
    }
  }

  if (DATE_RX.test(text)) counts.time_horizon += 1;
  return counts;
}

export function resolveSignalClass(raw) {
  const normalized = normalizeSignalInput(raw);
  const tokens = tokenizeSignalInput(normalized);
  const counts = countSignalHits(tokens, normalized);
  let bestKey = "stabilize";
  let bestVal = counts.stabilize;

  for (const key of Object.keys(counts)) {
    if (counts[key] > bestVal) {
      bestKey = key;
      bestVal = counts[key];
    }
  }

  if (bestVal <= 0) return "stabilize";

  const tied = Object.keys(counts).filter((key) => counts[key] === bestVal);
  if (tied.length === 1) return tied[0];
  for (const key of SIGNAL_PRIORITY) {
    if (tied.includes(key)) return key;
  }
  return "stabilize";
}

export function computeSignalStrength(hitCount) {
  const bucket = Math.min(4, Math.max(1, hitCount));
  return [0.25, 0.5, 0.75, 1][bucket - 1] ?? 0.25;
}

export function bindFreySignal(input) {
  const raw = typeof input === "string" ? input : "";
  const normalized = normalizeSignalInput(raw);
  const tokens = tokenizeSignalInput(normalized);
  const counts = countSignalHits(tokens, normalized);
  const signalClass = resolveSignalClass(normalized);
  const hitCount = counts[signalClass] || 0;
  const structuralBias = SIGNAL_BIAS_MAP[signalClass];
  const operationalVectorShift = SIGNAL_VECTOR_MAP[signalClass];
  const compareValue = operationalVectorShift.compare_enabled ? "1" : "0";

  return {
    raw_query: raw,
    normalized_query: normalized,
    signal_class: signalClass,
    signal_strength: computeSignalStrength(hitCount),
    structural_bias: structuralBias,
    operational_vector_shift: operationalVectorShift,
    url_state: {
      q: raw,
      mode: operationalVectorShift.primary_mode,
      bias: structuralBias,
      compare: compareValue,
      t: operationalVectorShift.timeline_enabled ? "active" : "",
    },
    marker: "__FREY_SIGNAL_BIND_CLEAN_REAPPLY_V0_1__:" + signalClass + ":" + operationalVectorShift.primary_mode,
  };
}
