import type { BtcPublicBoundary, BtcQuestionLens, FreshnessState, TemporalState } from "./btc-public-output-contract";
import {
  BTC_GEOMETRY_FOCUS_AXES, BTC_NARRATIVE_PROFILES, BTC_SAFETY_OVERLAYS, BTC_SECTION_IDS, BTC_WATCH_PROFILES,
  deriveBtcQuestionGeometry, guardBtcQuestionGeometry,
  type BtcGeometryFocusAxis, type BtcNarrativeProfile, type BtcQuestionGeometry,
  type BtcSafetyOverlay, type BtcSectionId, type BtcWatchProfile,
} from "./btc-question-geometry";
import {
  BTC_NARRATIVE_TEMPLATE_IDS, selectBtcReadTemplateId, type BtcReadTemplateId,
} from "./btc-narrative-template-catalog";

export type BtcNarrativeFacts = {
  price_usd: number; change_24h_pct: number; change_7d_pct: number; change_30d_pct: number;
  market_cap_change_24h_pct: number; source_generated_at_utc: string; freshness: FreshnessState;
  dominance_pct: number; dominance_band: "high" | "balanced" | "lower"; market_cap_rank: number; market_context_label: string;
  regime_label: string; field_score: number; direction_bias: string; liquidity_state: string;
  stablecoin_share_pct: number; alt_breadth_24h_pct: number;
  pressure_band: "elevated" | "moderate" | "low" | null; harmonic_tension: number | null;
  evidence_mode: "bounded_numeric_metric" | "no_numeric_aspect_claim"; pressure_label: string;
  temporal_state: TemporalState; observation_date: string; temporal_limitation: string;
};

export type WhatChangedPayload = { section_id: "what_changed"; price_usd: number; change_24h_pct: number; change_7d_pct: number; change_30d_pct: number; market_cap_change_24h_pct: number };
export type WhyItMattersPayload = { section_id: "why_it_matters"; dominance_pct: number; dominance_band: "high" | "balanced" | "lower"; market_cap_rank: number; market_context_label: string };
export type CurrentStructurePayload = { section_id: "current_structure"; regime_label: string; field_score: number; direction_bias: string; liquidity_state: string };
export type DominantPressuresPayload = { section_id: "dominant_pressures"; pressure_band: "elevated" | "moderate" | "low" | null; harmonic_tension: number | null; evidence_mode: "bounded_numeric_metric" | "no_numeric_aspect_claim"; pressure_label: string; stablecoin_share_pct: number; temporal_state: TemporalState };
export type RelativeMarketFieldPayload = { section_id: "relative_market_field"; dominance_pct: number; alt_breadth_24h_pct: number; stablecoin_share_pct: number };
export type TemporalContextPayload = { section_id: "temporal_context"; temporal_state: TemporalState; observation_date: string; source_generated_at_utc: string; temporal_limitation: string };
export type BtcNarrativeSectionFactPayload = WhatChangedPayload | WhyItMattersPayload | CurrentStructurePayload | DominantPressuresPayload | RelativeMarketFieldPayload | TemporalContextPayload;

export type BtcNarrativeSection = { section_id: BtcSectionId; role: "primary" | "supporting"; order: number; fact_payload: BtcNarrativeSectionFactPayload; read_template_id: BtcReadTemplateId };
export type BtcNarrativeRouterInput = {
  schema_version: "btc_deterministic_narrative_router_input_v0_1"; geometry: BtcQuestionGeometry;
  question_lens: BtcQuestionLens; safe_reframed: boolean; facts: BtcNarrativeFacts;
  public_boundary: BtcPublicBoundary; template_catalog_version: "btc_narrative_template_catalog_v0_1";
};
export type BtcNarrativeRouterOutput = {
  schema_version: "btc_deterministic_narrative_v0_1"; route_version: "btc_question_geometry_route_v0_1";
  lens: BtcQuestionLens; focus_axis: BtcGeometryFocusAxis; narrative_profile: BtcNarrativeProfile;
  watch_profile: BtcWatchProfile; safety_overlay: BtcSafetyOverlay; sections: readonly BtcNarrativeSection[];
  suppressed_sections: readonly BtcSectionId[]; template_catalog_version: "btc_narrative_template_catalog_v0_1";
};
export type BtcNarrativeRouterFailureCode = "invalid_router_input" | "geometry_lens_mismatch" | "geometry_partition_invalid" | "public_boundary_invalid" | "unsupported_narrative_profile" | "unsupported_watch_profile" | "unsupported_section_id" | "unsupported_template_id" | "section_payload_mismatch" | "duplicate_section" | "section_order_invalid" | "fact_projection_mismatch" | "safety_overlay_invalid" | "narrative_contract_failed";
export type BtcNarrativeRouterResult = { ok: true; value: BtcNarrativeRouterOutput } | { ok: false; code: BtcNarrativeRouterFailureCode; message: string };

const LENSES: readonly BtcQuestionLens[] = ["market_gravity", "market_structure", "pressure_context", "temporal_context", "general"];
const TEMPORAL: readonly TemporalState[] = ["available_bounded", "static_state_only", "unavailable"];
const BOUNDARY_KEYS = ["read_only", "static_public_snapshot", "no_live_adapter_claim", "no_true_live_feed_claim", "no_trading_signal", "no_forecast", "no_price_target", "no_investment_recommendation", "backend_api_closed", "runtime_closed", "payment_closed", "orion_core_protected", "formula_weights_exposed"] as const;
const FACT_KEYS = ["price_usd", "change_24h_pct", "change_7d_pct", "change_30d_pct", "market_cap_change_24h_pct", "source_generated_at_utc", "freshness", "dominance_pct", "dominance_band", "market_cap_rank", "market_context_label", "regime_label", "field_score", "direction_bias", "liquidity_state", "stablecoin_share_pct", "alt_breadth_24h_pct", "pressure_band", "harmonic_tension", "evidence_mode", "pressure_label", "temporal_state", "observation_date", "temporal_limitation"] as const;
const GEOMETRY_KEYS = ["schema_version", "lens", "focus_axis", "primary_sections", "supporting_sections", "suppressed_sections", "watch_profile", "narrative_profile", "safety_overlay", "route_version"] as const;
const INPUT_KEYS = ["schema_version", "geometry", "question_lens", "safe_reframed", "facts", "public_boundary", "template_catalog_version"] as const;

function rec(v: unknown): v is Record<string, unknown> { return Boolean(v) && typeof v === "object" && !Array.isArray(v); }
function exact(v: Record<string, unknown>, keys: readonly string[]): boolean { const actual = Object.keys(v); return actual.length === keys.length && keys.every((k) => Object.prototype.hasOwnProperty.call(v, k)); }
function finite(v: unknown): v is number { return typeof v === "number" && Number.isFinite(v); }
function range(v: unknown, min: number, max: number): v is number { return finite(v) && v >= min && v <= max; }
function text(v: unknown, max = 1200): v is string { return typeof v === "string" && v.trim().length > 0 && v.length <= max; }
function timestamp(v: unknown): v is string { return typeof v === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(v) && Number.isFinite(new Date(v).getTime()); }
function date(v: unknown): v is string { return typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) && Number.isFinite(new Date(`${v}T00:00:00.000Z`).getTime()); }

function guardBoundary(v: unknown): v is BtcPublicBoundary {
  if (!rec(v) || !exact(v, BOUNDARY_KEYS)) return false;
  return v.read_only === true && v.static_public_snapshot === true && v.no_live_adapter_claim === true
    && v.no_true_live_feed_claim === true && v.no_trading_signal === true && v.no_forecast === true
    && v.no_price_target === true && v.no_investment_recommendation === true && v.backend_api_closed === true
    && v.runtime_closed === true && v.payment_closed === true && v.orion_core_protected === true && v.formula_weights_exposed === false;
}

function guardFacts(v: unknown): v is BtcNarrativeFacts {
  if (!rec(v) || !exact(v, FACT_KEYS)) return false;
  if (!finite(v.price_usd) || v.price_usd < 0 || ![v.change_24h_pct, v.change_7d_pct, v.change_30d_pct, v.market_cap_change_24h_pct, v.field_score].every(finite)) return false;
  if (!timestamp(v.source_generated_at_utc) || !["FRESH", "STALE_LIMITED"].includes(v.freshness as string)) return false;
  if (!range(v.dominance_pct, 0, 100) || !["high", "balanced", "lower"].includes(v.dominance_band as string) || !Number.isInteger(v.market_cap_rank) || (v.market_cap_rank as number) < 1) return false;
  if (![v.market_context_label, v.regime_label, v.direction_bias, v.liquidity_state, v.pressure_label].every((x) => text(x, 160))) return false;
  if (!range(v.stablecoin_share_pct, 0, 100) || !range(v.alt_breadth_24h_pct, 0, 100)) return false;
  if (v.pressure_band !== null && !["elevated", "moderate", "low"].includes(v.pressure_band as string)) return false;
  if (v.harmonic_tension !== null && !range(v.harmonic_tension, 0, 1)) return false;
  if (!["bounded_numeric_metric", "no_numeric_aspect_claim"].includes(v.evidence_mode as string)) return false;
  if ((v.pressure_band === null) !== (v.harmonic_tension === null) || (v.pressure_band !== null) !== (v.evidence_mode === "bounded_numeric_metric")) return false;
  return TEMPORAL.includes(v.temporal_state as TemporalState) && date(v.observation_date) && text(v.temporal_limitation);
}

function guardGeometryPartition(v: unknown): v is BtcQuestionGeometry {
  if (!rec(v) || !exact(v, GEOMETRY_KEYS)) return false;
  if (v.schema_version !== "btc_question_geometry_v0_1" || v.route_version !== "btc_question_geometry_route_v0_1") return false;
  if (!Array.isArray(v.primary_sections) || v.primary_sections.length !== 2 || !Array.isArray(v.supporting_sections) || !Array.isArray(v.suppressed_sections)) return false;
  const partition = [...v.primary_sections, ...v.supporting_sections, ...v.suppressed_sections];
  return partition.length === BTC_SECTION_IDS.length
    && new Set(partition).size === BTC_SECTION_IDS.length
    && partition.every((item) => BTC_SECTION_IDS.includes(item as BtcSectionId));
}

function guardEnvelope(v: unknown): v is BtcNarrativeRouterInput {
  return rec(v) && exact(v, INPUT_KEYS)
    && v.schema_version === "btc_deterministic_narrative_router_input_v0_1"
    && v.template_catalog_version === "btc_narrative_template_catalog_v0_1"
    && typeof v.safe_reframed === "boolean";
}

function payload(id: BtcSectionId, f: BtcNarrativeFacts): BtcNarrativeSectionFactPayload {
  switch (id) {
    case "what_changed": return { section_id: id, price_usd: f.price_usd, change_24h_pct: f.change_24h_pct, change_7d_pct: f.change_7d_pct, change_30d_pct: f.change_30d_pct, market_cap_change_24h_pct: f.market_cap_change_24h_pct };
    case "why_it_matters": return { section_id: id, dominance_pct: f.dominance_pct, dominance_band: f.dominance_band, market_cap_rank: f.market_cap_rank, market_context_label: f.market_context_label };
    case "current_structure": return { section_id: id, regime_label: f.regime_label, field_score: f.field_score, direction_bias: f.direction_bias, liquidity_state: f.liquidity_state };
    case "dominant_pressures": return { section_id: id, pressure_band: f.pressure_band, harmonic_tension: f.harmonic_tension, evidence_mode: f.evidence_mode, pressure_label: f.pressure_label, stablecoin_share_pct: f.stablecoin_share_pct, temporal_state: f.temporal_state };
    case "relative_market_field": return { section_id: id, dominance_pct: f.dominance_pct, alt_breadth_24h_pct: f.alt_breadth_24h_pct, stablecoin_share_pct: f.stablecoin_share_pct };
    case "temporal_context": return { section_id: id, temporal_state: f.temporal_state, observation_date: f.observation_date, source_generated_at_utc: f.source_generated_at_utc, temporal_limitation: f.temporal_limitation };
  }
}

function guardPayload(v: unknown, id?: BtcSectionId): v is BtcNarrativeSectionFactPayload {
  if (!rec(v) || !BTC_SECTION_IDS.includes(v.section_id as BtcSectionId) || (id && v.section_id !== id)) return false;
  switch (v.section_id) {
    case "what_changed": return exact(v, ["section_id", "price_usd", "change_24h_pct", "change_7d_pct", "change_30d_pct", "market_cap_change_24h_pct"]) && finite(v.price_usd) && (v.price_usd as number) >= 0 && [v.change_24h_pct, v.change_7d_pct, v.change_30d_pct, v.market_cap_change_24h_pct].every(finite);
    case "why_it_matters": return exact(v, ["section_id", "dominance_pct", "dominance_band", "market_cap_rank", "market_context_label"]) && range(v.dominance_pct, 0, 100) && ["high", "balanced", "lower"].includes(v.dominance_band as string) && Number.isInteger(v.market_cap_rank) && (v.market_cap_rank as number) > 0 && text(v.market_context_label, 160);
    case "current_structure": return exact(v, ["section_id", "regime_label", "field_score", "direction_bias", "liquidity_state"]) && text(v.regime_label, 160) && finite(v.field_score) && text(v.direction_bias, 160) && text(v.liquidity_state, 160);
    case "dominant_pressures": {
      const hasPressure = v.pressure_band !== null;
      return exact(v, ["section_id", "pressure_band", "harmonic_tension", "evidence_mode", "pressure_label", "stablecoin_share_pct", "temporal_state"])
        && (v.pressure_band === null || ["elevated", "moderate", "low"].includes(v.pressure_band as string))
        && (v.harmonic_tension === null || range(v.harmonic_tension, 0, 1))
        && ["bounded_numeric_metric", "no_numeric_aspect_claim"].includes(v.evidence_mode as string)
        && text(v.pressure_label, 160) && range(v.stablecoin_share_pct, 0, 100)
        && TEMPORAL.includes(v.temporal_state as TemporalState)
        && hasPressure === (v.harmonic_tension !== null)
        && hasPressure === (v.evidence_mode === "bounded_numeric_metric");
    }
    case "relative_market_field": return exact(v, ["section_id", "dominance_pct", "alt_breadth_24h_pct", "stablecoin_share_pct"]) && range(v.dominance_pct, 0, 100) && range(v.alt_breadth_24h_pct, 0, 100) && range(v.stablecoin_share_pct, 0, 100);
    case "temporal_context": return exact(v, ["section_id", "temporal_state", "observation_date", "source_generated_at_utc", "temporal_limitation"]) && TEMPORAL.includes(v.temporal_state as TemporalState) && date(v.observation_date) && timestamp(v.source_generated_at_utc) && text(v.temporal_limitation);
    default: return false;
  }
}

export function guardBtcNarrativeRouterInput(v: unknown): v is BtcNarrativeRouterInput {
  if (!guardEnvelope(v)) return false;
  return guardBtcQuestionGeometry(v.geometry) && LENSES.includes(v.question_lens as BtcQuestionLens)
    && v.question_lens === v.geometry.lens
    && v.geometry.safety_overlay === (v.safe_reframed ? "observable_context_only" : "standard_public_context")
    && guardFacts(v.facts) && guardBoundary(v.public_boundary);
}

export function guardBtcNarrativeSection(v: unknown): v is BtcNarrativeSection {
  return rec(v) && exact(v, ["section_id", "role", "order", "fact_payload", "read_template_id"])
    && BTC_SECTION_IDS.includes(v.section_id as BtcSectionId) && ["primary", "supporting"].includes(v.role as string)
    && Number.isInteger(v.order) && (v.order as number) >= 1 && (v.order as number) <= 6
    && BTC_NARRATIVE_TEMPLATE_IDS.includes(v.read_template_id as BtcReadTemplateId)
    && guardPayload(v.fact_payload, v.section_id as BtcSectionId);
}

export function guardBtcNarrativeRouterOutput(v: unknown): v is BtcNarrativeRouterOutput {
  if (!rec(v) || !exact(v, ["schema_version", "route_version", "lens", "focus_axis", "narrative_profile", "watch_profile", "safety_overlay", "sections", "suppressed_sections", "template_catalog_version"])) return false;
  if (v.schema_version !== "btc_deterministic_narrative_v0_1" || v.route_version !== "btc_question_geometry_route_v0_1" || v.template_catalog_version !== "btc_narrative_template_catalog_v0_1") return false;
  if (!LENSES.includes(v.lens as BtcQuestionLens) || !BTC_GEOMETRY_FOCUS_AXES.includes(v.focus_axis as BtcGeometryFocusAxis) || !BTC_NARRATIVE_PROFILES.includes(v.narrative_profile as BtcNarrativeProfile) || !BTC_WATCH_PROFILES.includes(v.watch_profile as BtcWatchProfile) || !BTC_SAFETY_OVERLAYS.includes(v.safety_overlay as BtcSafetyOverlay)) return false;
  if (!Array.isArray(v.sections) || !v.sections.every(guardBtcNarrativeSection) || !Array.isArray(v.suppressed_sections) || v.suppressed_sections.some((x) => !BTC_SECTION_IDS.includes(x as BtcSectionId))) return false;
  const g = deriveBtcQuestionGeometry(v.lens as BtcQuestionLens, v.safety_overlay === "observable_context_only");
  if (v.focus_axis !== g.focus_axis || v.narrative_profile !== g.narrative_profile || v.watch_profile !== g.watch_profile || v.suppressed_sections.length !== g.suppressed_sections.length || !v.suppressed_sections.every((x, i) => x === g.suppressed_sections[i])) return false;
  const order = [...g.primary_sections, ...g.supporting_sections];
  if (v.sections.length !== order.length || new Set(v.sections.map((s) => s.section_id)).size !== v.sections.length) return false;
  return v.sections.every((s, i) => {
    const role = i < g.primary_sections.length ? "primary" : "supporting";
    return s.order === i + 1 && s.section_id === order[i] && s.role === role && s.read_template_id === selectBtcReadTemplateId(g.narrative_profile, order[i], role);
  });
}

export function routeBtcDeterministicNarrative(input: BtcNarrativeRouterInput): BtcNarrativeRouterResult {
  if (!guardEnvelope(input)) return { ok: false, code: "invalid_router_input", message: "Narrative router envelope failed." };
  if (!guardGeometryPartition(input.geometry)) return { ok: false, code: "geometry_partition_invalid", message: "Question geometry partition is invalid." };
  if (!LENSES.includes(input.question_lens as BtcQuestionLens) || !LENSES.includes(input.geometry.lens as BtcQuestionLens)) return { ok: false, code: "invalid_router_input", message: "Question lens is unsupported." };
  if (input.question_lens !== input.geometry.lens) return { ok: false, code: "geometry_lens_mismatch", message: "Question lens and geometry lens do not match." };
  if (!BTC_SAFETY_OVERLAYS.includes(input.geometry.safety_overlay as BtcSafetyOverlay) || input.geometry.safety_overlay !== (input.safe_reframed ? "observable_context_only" : "standard_public_context")) return { ok: false, code: "safety_overlay_invalid", message: "Safety overlay does not match the reframe state." };
  if (!BTC_GEOMETRY_FOCUS_AXES.includes(input.geometry.focus_axis as BtcGeometryFocusAxis)) return { ok: false, code: "geometry_partition_invalid", message: "Focus axis is unsupported." };
  if (!BTC_NARRATIVE_PROFILES.includes(input.geometry.narrative_profile as BtcNarrativeProfile)) return { ok: false, code: "unsupported_narrative_profile", message: "Narrative profile is unsupported." };
  if (!BTC_WATCH_PROFILES.includes(input.geometry.watch_profile as BtcWatchProfile)) return { ok: false, code: "unsupported_watch_profile", message: "Watch profile is unsupported." };
  if (!guardFacts(input.facts)) return { ok: false, code: "fact_projection_mismatch", message: "Narrative facts failed the typed projection contract." };
  if (!guardBoundary(input.public_boundary)) return { ok: false, code: "public_boundary_invalid", message: "Public safety boundary is invalid." };

  const ids = [...input.geometry.primary_sections, ...input.geometry.supporting_sections];
  const sections: BtcNarrativeSection[] = [];
  for (let i = 0; i < ids.length; i += 1) {
    const id = ids[i];
    if (!BTC_SECTION_IDS.includes(id)) return { ok: false, code: "unsupported_section_id", message: "Section id is unsupported." };
    const role: "primary" | "supporting" = i < input.geometry.primary_sections.length ? "primary" : "supporting";
    const fact_payload = payload(id, input.facts);
    if (!guardPayload(fact_payload, id)) return { ok: false, code: "section_payload_mismatch", message: "Narrative fact projection failed." };
    const read_template_id = selectBtcReadTemplateId(input.geometry.narrative_profile, id, role);
    if (!read_template_id) return { ok: false, code: "unsupported_template_id", message: "No closed template exists for the routed section." };
    sections.push({ section_id: id, role, order: i + 1, fact_payload, read_template_id });
  }

  const value: BtcNarrativeRouterOutput = {
    schema_version: "btc_deterministic_narrative_v0_1", route_version: input.geometry.route_version,
    lens: input.question_lens, focus_axis: input.geometry.focus_axis, narrative_profile: input.geometry.narrative_profile,
    watch_profile: input.geometry.watch_profile, safety_overlay: input.geometry.safety_overlay,
    sections, suppressed_sections: [...input.geometry.suppressed_sections], template_catalog_version: input.template_catalog_version,
  };
  return guardBtcNarrativeRouterOutput(value)
    ? { ok: true, value }
    : { ok: false, code: "narrative_contract_failed", message: "Narrative router output failed the locked typed contract." };
}
