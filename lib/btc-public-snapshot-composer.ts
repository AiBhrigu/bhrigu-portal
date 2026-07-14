import freyTemporalHandler from "../pages/api/frey-temporal.js";
import { buildFreyAccessCtxPacket, buildFreyAccessHref } from "./frey-access-bridge.js";
import {
  BTC_ASSET,
  TEMPORAL_ANALYSIS_KEYS,
  TEMPORAL_METRIC_KEYS,
  guardBtcPublicSnapshot,
  type BtcPublicSnapshot,
  type BtcQuestionLens,
  type TemporalAnalysis,
  type TemporalMetrics,
  type TemporalState,
} from "./btc-public-output-contract";
import type { BtcSourceBundle } from "./btc-public-static-source";

const ACTIONABLE_TRADING_PATTERNS: readonly RegExp[] = [
  /\bshould\s+i\s+(?:buy|sell|hold|trade)\b/i,
  /\bshould\s+i\s+(?:go|open)\s+(?:long|short)\b/i,
  /\b(?:tell|advise|recommend)\s+me\s+(?:when|whether)\s+(?:to\s+)?(?:buy|sell|hold|enter|exit|trade)\b/i,
  /\b(?:give|provide)\s+(?:me\s+)?(?:an?\s+)?(?:entry(?:\s+and\s+exit)?|exit|trade|price\s*target|trading\s+strategy)\b/i,
  /\bwhat\s+leverage\s+should\s+i\s+use\b/i,
  /\b(?:guaranteed?|risk[-\s]?free)\s+(?:profit|return|strategy)\b/i,
  /\bwhat\s+price\s*target\s+should\s+i\s+trade\b/i,
  /\btell\s+me\s+exactly\s+what\s+trade\s+to\s+make\b/i,
  /^(?:please\s+)?(?:buy|sell|hold)\b/i,
  /^(?:please\s+)?(?:go|open)\s+(?:long|short)\b/i,
  /\b(?:best|exact)\s+(?:entry|exit|trade)\b/i,
  /\b(?:entry|exit)\s+(?:point|level|price)\b/i,
];

export function requiresTradingReframe(question: string): boolean {
  return ACTIONABLE_TRADING_PATTERNS.some((pattern) => pattern.test(question));
}
const LENS_RULES: Array<[BtcQuestionLens, RegExp]> = [
  ["market_gravity", /\b(dominance|gravity|bitcoin\s+share|btc\s+share|market\s+cap\s+rank)\b/i],
  ["market_structure", /\b(structure|regime|liquidity|breadth|rotation|stablecoin|tvl|volume)\b/i],
  ["pressure_context", /\b(pressure|tension|volatility|stress|compression|expansion)\b/i],
  ["temporal_context", /\b(time|timing|cycle|date|phase|temporal|window)\b/i],
];

export type ComposeInput = {
  question: string;
  date?: string;
  now?: Date;
  temporalRunner?: (date: string) => Promise<unknown>;
};

export type ComposeResult =
  | { ok: true; value: BtcPublicSnapshot }
  | { ok: false; code: "invalid_input" | "internal_composition_error"; message: string };

type TemporalContextResult = {
  state: TemporalState;
  metrics: TemporalMetrics | null;
  analysis: TemporalAnalysis | null;
  limitation: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function finiteInRange(value: unknown, min: number, max: number): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= min && value <= max;
}

export function normalizeQuestion(raw: string): string {
  return raw.trim().replace(/\s+/g, " ");
}

export function classifyQuestionLens(question: string): BtcQuestionLens {
  for (const [lens, pattern] of LENS_RULES) if (pattern.test(question)) return lens;
  return "general";
}

export function normalizeObservationDate(input: string | undefined, now = new Date()): string | null {
  const raw = input?.trim();
  if (!raw) return now.toISOString().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null;
  const date = new Date(`${raw}T00:00:00.000Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== raw) return null;
  return raw;
}

function dominanceBand(value: number): "high" | "balanced" | "lower" {
  if (value >= 58) return "high";
  if (value >= 50) return "balanced";
  return "lower";
}

function pressureBand(value: number | null): "elevated" | "moderate" | "low" | null {
  if (value === null || !Number.isFinite(value)) return null;
  if (value >= 0.72) return "elevated";
  if (value >= 0.42) return "moderate";
  return "low";
}

async function runExistingTemporalHandler(date: string): Promise<unknown> {
  return await new Promise((resolve, reject) => {
    let statusCode = 200;
    const req = { query: { date } } as any;
    const res = {
      status(code: number) {
        statusCode = code;
        return this;
      },
      json(payload: unknown) {
        if (statusCode >= 400) {
          const message = isRecord(payload) && typeof payload.error === "string" ? payload.error : `TEMPORAL_${statusCode}`;
          reject(new Error(message));
        } else {
          resolve(payload);
        }
        return this;
      },
    } as any;
    try {
      freyTemporalHandler(req, res);
    } catch (error) {
      reject(error);
    }
  });
}

function temporalFromStatic(bundle: BtcSourceBundle): TemporalContextResult {
  const state = bundle.marketField.vectors.CT_temporal.state;
  return {
    state: state.trim().length > 0 ? "static_state_only" : "unavailable",
    metrics: null,
    analysis: null,
    limitation: state.trim().length > 0
      ? "Approved bounded static temporal state from the published snapshot; numeric temporal metrics are unavailable for this request."
      : "Bounded temporal context is unavailable for this request.",
  };
}

export function sanitizeTemporalResult(value: unknown): TemporalContextResult | null {
  if (!isRecord(value)) return null;

  const metrics: Partial<TemporalMetrics> = {};
  for (const key of TEMPORAL_METRIC_KEYS) {
    const metric = value[key];
    if (!finiteInRange(metric, 0, 1)) return null;
    metrics[key] = metric;
  }

  let analysis: TemporalAnalysis | null = null;
  if (value.analysis !== undefined && value.analysis !== null) {
    if (!isRecord(value.analysis)) return null;
    const filtered: TemporalAnalysis = {};
    for (const key of TEMPORAL_ANALYSIS_KEYS) {
      if (!Object.prototype.hasOwnProperty.call(value.analysis, key)) continue;
      const metric = value.analysis[key];
      const valid = key === "phase_bias"
        ? finiteInRange(metric, -1, 1)
        : finiteInRange(metric, 0, 1);
      if (!valid) return null;
      filtered[key] = metric as number;
    }
    analysis = Object.keys(filtered).length > 0 ? filtered : null;
  }

  return {
    state: "available_bounded",
    metrics: metrics as TemporalMetrics,
    analysis,
    limitation: "Approved bounded static temporal context; no live ephemerides feed and no predictive timing claim.",
  };
}

function buildWatchConditions(lens: BtcQuestionLens, bundle: BtcSourceBundle): string[] {
  const snapshot = bundle.snapshot;
  const market = bundle.marketField.vectors.M_market;
  const dominance = snapshot.market_reality.btc_dominance_pct;
  const watches = [
    `Watch BTC dominance at ${dominance.toFixed(2)}% (${dominanceBand(dominance)} gravity band); movement away from this band would change the market-gravity read.`,
    `Watch liquidity state ${snapshot.liquidity_tvl.liquidity_context_state} beside stablecoin share ${snapshot.market_reality.stablecoin_share_pct.toFixed(2)}%; together they frame available market participation.`,
  ];
  if (lens === "market_structure" || lens === "general") {
    watches.push(`Watch alt breadth at ${snapshot.altcoin_rotation.alt_breadth_24h_pct.toFixed(1)}% across the stated top-250 universe as the relative participation condition.`);
  }
  if (lens === "market_gravity") {
    watches.push(`Watch whether BTC remains market rank ${snapshot.public_samples.assets.BTC.market_cap_rank} in the published sample.`);
  }
  if (lens === "pressure_context" || lens === "temporal_context") {
    watches.push("Keep bounded temporal pressure separate from trading timing, entries, exits, and price instructions.");
  }
  if (market.liquidity_health && watches.length < 4) {
    watches.push(`Watch the published market-vector liquidity health state: ${market.liquidity_health}.`);
  }
  return watches.slice(0, 4);
}

export async function composeBtcPublicSnapshot(bundle: BtcSourceBundle, input: ComposeInput): Promise<ComposeResult> {
  const raw = typeof input.question === "string" ? input.question : "";
  const compact = normalizeQuestion(raw);
  if (compact.length < 8 || compact.length > 280) {
    return { ok: false, code: "invalid_input", message: "Question must contain 8–280 characters." };
  }

  const now = input.now ?? new Date();
  if (!Number.isFinite(now.getTime())) {
    return { ok: false, code: "invalid_input", message: "Current time is invalid." };
  }
  const observationDate = normalizeObservationDate(input.date, now);
  if (!observationDate) {
    return { ok: false, code: "invalid_input", message: "Date must be a real UTC date in YYYY-MM-DD format." };
  }

  const safeReframed = requiresTradingReframe(compact);
  const normalized = safeReframed
    ? "Explain what changed in the BTC field, why it matters, and what conditions to watch, without trading instructions."
    : compact;
  const lens = classifyQuestionLens(compact);

  let temporal = temporalFromStatic(bundle);
  try {
    const rawTemporal = await (input.temporalRunner ?? runExistingTemporalHandler)(observationDate);
    temporal = sanitizeTemporalResult(rawTemporal) ?? temporalFromStatic(bundle);
  } catch {
    temporal = temporalFromStatic(bundle);
  }

  const snapshot = bundle.snapshot;
  const proof = bundle.proof;
  const marketField = bundle.marketField;
  const btc = snapshot.public_samples.assets.BTC;
  const harmonic = temporal.metrics?.harmonic_tension ?? null;
  const band = pressureBand(harmonic);
  const requestId = `btc_pub_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
  const accessPacket = buildFreyAccessCtxPacket({
    primary_date: observationDate,
    secondary_date: "",
    signal_class: "btc_public_snapshot",
    structural_state: `BTC ${marketField.field_output.regime_label}`,
    operational_vector: `BTC question: ${normalized}`,
    delta_mode: "",
    timeline_mode: "",
  });

  const value: BtcPublicSnapshot = {
    request_id: requestId,
    asset: BTC_ASSET,
    question: { raw, normalized, lens, safe_reframed: safeReframed },
    observation_time_utc: `${observationDate}T00:00:00.000Z`,
    market_snapshot: {
      price_usd: btc.price_usd,
      change_24h_pct: btc.market_24h_change_pct,
      change_7d_pct: btc.market_7d_change_pct,
      change_30d_pct: btc.market_30d_change_pct,
      total_market_cap_usd: snapshot.market_reality.total_market_cap_usd,
      volume_24h_usd: snapshot.market_reality.volume_24h_usd,
      market_cap_change_24h_pct: snapshot.market_reality.market_cap_change_24h_pct,
      source_generated_at_utc: snapshot.generated_at_utc,
      freshness: bundle.freshness,
    },
    btc_gravity: {
      dominance_pct: snapshot.market_reality.btc_dominance_pct,
      dominance_band: dominanceBand(snapshot.market_reality.btc_dominance_pct),
      market_cap_rank: btc.market_cap_rank,
      market_context_label: btc.market_context_label,
      score: btc.score,
    },
    market_structure: {
      regime_label: marketField.field_output.regime_label,
      field_score: marketField.field_output.market_field_score,
      direction_bias: marketField.field_output.direction_bias,
      liquidity_state: snapshot.liquidity_tvl.liquidity_context_state,
      stablecoin_share_pct: snapshot.market_reality.stablecoin_share_pct,
      alt_breadth_24h_pct: snapshot.altcoin_rotation.alt_breadth_24h_pct,
      context_only: true,
    },
    aspect_pressure: {
      state: temporal.state,
      pressure_band: band,
      harmonic_tension: harmonic,
      evidence_mode: band ? "bounded_numeric_metric" : "no_numeric_aspect_claim",
      label: band ? `${band} bounded pressure` : "No numeric aspect claim",
    },
    temporal_context: {
      state: temporal.state,
      label: "bounded_cosmographic_metric",
      observation_date: observationDate,
      metrics: temporal.metrics,
      analysis: temporal.analysis,
      limitation: temporal.limitation,
    },
    watch_conditions: buildWatchConditions(lens, bundle),
    source_proof: {
      schema_version: proof.schema_version,
      source_mode: proof.source_mode,
      generated_at_utc: proof.generated_at_utc,
      sources: proof.sources,
    },
    uncertainty: {
      freshness: bundle.freshness === "STALE_LIMITED"
        ? "The verified source is older than 72 hours; strong current-state language is suppressed."
        : "The verified source is within the 72-hour product window.",
      question_limit: safeReframed
        ? "The original question requested actionable trading or outcome guidance and was converted to observable context."
        : "The field read is limited to the selected deterministic question lens.",
      temporal_limit: temporal.limitation,
      source_limit: "Static reviewed public artifacts only; no live adapter and no provider call during the user request.",
    },
    boundary: {
      read_only: true,
      static_public_snapshot: true,
      no_live_adapter_claim: true,
      no_true_live_feed_claim: true,
      no_trading_signal: true,
      no_forecast: true,
      no_price_target: true,
      no_investment_recommendation: true,
      backend_api_closed: true,
      runtime_closed: true,
      payment_closed: true,
      orion_core_protected: true,
      formula_weights_exposed: false,
    },
    generated_at_utc: now.toISOString(),
    deeper_access_route: buildFreyAccessHref(accessPacket) || "/access",
  };

  if (!guardBtcPublicSnapshot(value)) {
    return { ok: false, code: "internal_composition_error", message: "Composed output failed the public contract guard." };
  }
  return { ok: true, value };
}
