export const SIGNAL_PRIORITY = [
  "decision_pressure",
  "compare",
  "transition",
  "time_horizon",
  "clarify",
  "stabilize",
];

export const SIGNAL_TRIGGER_MAP = {
  stabilize: ["focus", "stabilize", "center", "ground", "align", "steady"],
  clarify: ["clarify", "what", "which", "how", "why", "?"],
  compare: ["compare", "vs", "versus", "difference", "better", "or"],
  time_horizon: ["today", "now", "week", "month", "year", "timing"],
  decision_pressure: ["urgent", "risk", "problem", "block", "stuck", "decision", "need now"],
  transition: ["change", "shift", "move", "leave", "enter", "transition", "next"],
};

export const SIGNAL_BIAS_MAP = {
  stabilize: "axis",
  clarify: "clarification",
  compare: "comparison",
  time_horizon: "horizon",
  decision_pressure: "pressure",
  transition: "transition",
};

export const SIGNAL_VECTOR_MAP = {
  stabilize: {
    primary_mode: "orient",
    secondary_mode: null,
    compare_enabled: false,
    timeline_enabled: false,
    urgency_band: "low",
  },
  clarify: {
    primary_mode: "clarify",
    secondary_mode: "orient",
    compare_enabled: false,
    timeline_enabled: false,
    urgency_band: "low",
  },
  compare: {
    primary_mode: "compare",
    secondary_mode: "orient",
    compare_enabled: true,
    timeline_enabled: false,
    urgency_band: "mid",
  },
  time_horizon: {
    primary_mode: "timeline",
    secondary_mode: "orient",
    compare_enabled: false,
    timeline_enabled: true,
    urgency_band: "low",
  },
  decision_pressure: {
    primary_mode: "decision",
    secondary_mode: "orient",
    compare_enabled: false,
    timeline_enabled: false,
    urgency_band: "high",
  },
  transition: {
    primary_mode: "shift",
    secondary_mode: "timeline",
    compare_enabled: false,
    timeline_enabled: true,
    urgency_band: "mid",
  },
};
