import type {
  BtcPublicBoundary,
  BtcQuestionLens,
  FreshnessState,
  TemporalState,
} from "./btc-public-output-contract";
import {
  BTC_GEOMETRY_FOCUS_AXES,
  BTC_NARRATIVE_PROFILES,
  BTC_SAFETY_OVERLAYS,
  BTC_SECTION_IDS,
  BTC_WATCH_PROFILES,
  deriveBtcQuestionGeometry,
  guardBtcQuestionGeometry,
  type BtcGeometryFocusAxis,
  type BtcNarrativeProfile,
  type BtcQuestionGeometry,
  type BtcSafetyOverlay,
  type BtcSectionId,
  type BtcWatchProfile,
} from "./btc-question-geometry";
import {
  BTC_NARRATIVE_TEMPLATE_IDS,
  selectBtcReadTemplateId,
  type BtcReadTemplateId,
} from "./btc-narrative-template-catalog";

export type BtcNarrativeFacts = {
  price_usd: number;
  change_24h_pct: number;
  change_7d_pct: number;
  change_30d_pct: number;
  market_cap_change_24h_pct: number;
  source_generated_at_utc: string;
  freshness: FreshnessState;
  dominance_pct: number;
  dominance_band: "high" | "balanced" | "lower";
  market_cap_rank: number;
  market_context_label: string;
  regime_label: string;
  field_score: number;
  direction_bias: string;
  liquidity_state: string;
  stablecoin_share_pct: number;
  alt_breadth_24h_pct: number;
  pressure_band: "elevated" | "moderate" | "low" | null;
  harmonic_tension: number | null;
  evidence_mode: "bounded_numeric_metric" | "no_numeric_aspect_claim";
  pressure_label: string;
  temporal_state: TemporalState;
  observation_date: string;
  temporal_limitation: string;
};

export type WhatChangedPayload = {
  section_id: "what_changed";
  price_usd: number;
  change_24h_pct: number;
  change_7d_pct: number;
  change_30d_pct: number;
  market_cap_change_24h_pct: number;
};

export type WhyItMattersPayload = {
  section_id: "why_it_matters";
  dominance_pct: number;
  dominance_band: "high" | "balanced" | "lower";
  market_cap_rank: number;
  market_context_label: string;
};

export type CurrentStructurePayload = {
  section_id: "current_structure";
  regime_label: string;
  field_score: number;
  direction_bias: string;
  liquidity_state: string;
};

export type DominantPressuresPayload = {
  section_id: "dominant_pressures";
  pressure_band: "elevated" | "moderate" | "low" | null;
  harmonic_tension: number | null;
  evidence_mode: "bounded_numeric_metric" | "no_numeric_aspect_claim";
  pressure_label: string;
  stablecoin_share_pct: number;
  temporal_state: TemporalState;
};

export type RelativeMarketFieldPayload = {
  section_id: "relative_market_field";
  dominance_pct: number;
  alt_breadth_24h_pct: number;
  stablecoin_share_pct: number;
};

export type TemporalContextPayload = {
  section_id: "temporal_context";
  temporal_state: TemporalState;
  observation_date: string;
  source_generated_at_utc: string;
  temporal_limitation: string;
};

export type BtcNarrativeSectionFactPayload =
  | WhatChangedPayload
  | WhyItMattersPayload
  | CurrentStructurePayload
  | DominantPressuresPayload
  | RelativeMarketFieldPayload
  | TemporalContextPayload;

export type BtcNarrativeSection = {
  section_id: BtcSectionId;
  role: "primary" | "supporting";
  order: number;
  fact_payload: BtcNarrativeSectionFactPayload;
  read_template_id: BtcReadTemplateId;
};

export type BtcNarrativeRouterInput = {
  schema_version: "btc_deterministic_narrative_router_input_v0_1";
  geometry: BtcQuestionGeometry;
  question_lens: BtcQuestionLens;
  safe_reframed: boolean;
  facts: BtcNarrativeFacts;
  public_boundary: BtcPublicBoundary;
  template_catalog_version: "btc_narrative_template_catalog_v0_1";
};

export type BtcNarrativeRouterOutput = {
  schema_version: "btc_deterministic_narrative_v0_1";
  route_version: "btc_question_geometry_route_v0_1";
  lens: BtcQuestionLens;
  focus_axis: BtcGeometryFocusAxis;
  narrative_profile: BtcNarrativeProfile;
  watch_profile: BtcWatchProfile;
  safety_overlay: BtcSafetyOverlay;
  sections: readonly BtcNarrativeSection[];
  suppressed_sections: readonly BtcSectionId[];
  template_catalog_version: "btc_narrative_template_catalog_v0_1";
};

export type BtcNarrativeRouterFailureCode =
  | "invalid_router_input"
  | "geometry_lens_mismatch"
  | "geometry_partition_invalid"
  | "public_boundary_invalid"
  | "unsupported_narrative_profile"
  | "unsupported_watch_profile"
  | "unsupported_section_id"
  | "unsupported_template_id"
  | "section_payload_mismatch"
  | "duplicate_section"
  | "section_order_invalid"
  | "fact_projection_mismatch"
  | "safety_overlay_invalid"
  | "narrative_contract_failed";

export type BtcNarrativeRouterResult =
  | { ok: true; value: BtcNarrativeRouterOutput }
  | { ok: false; code: BtcNarrativeRouterFailureCode; message: string };

const FACT_KEYS = [
  "price_usd",
  "change_24h_pct",
  "change_7d_pct",
  "change_30d_pct",
  "market_cap_change_24h_pct",
  "source_generated_at_utc",
  "freshness",
  "dominance_pct",
  "dominance_band",
  "market_cap_rank",
  "market_context_label",
  "regime_label",
  "field_score",
  "direction_bias",
  "liquidity_state",
  "stablecoin_share_pct",
  "alt_breadth_24h_pct",
  "pressure_band",
  "harmonic_tension",
  "evidence_mode",
  "pressure_label",
  "temporal_state",
  "observation_date",
  "temporal_limitation",
] as const;

const BOUNDARY_KEYS = [
  "read_only",
  "static_public_snapshot",
  "no_live_adapter_claim",
  "no_true_live_feed_claim",
  "no_trading_signal",
  "no_forecast",
  "no_price_target",
  "no_investment_recommendation",
  "backend_api_closed",
  "runtime_closed",
  "payment_closed",
  "orion_core_protected",
  "formula_weights_exposed",
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function hasExactKeys(value: Record<string, unknown>, expected: readonly string[]): boolean {
  const keys = Object.keys(value);
  return keys.length === expected.length && expected.every((key) => Object.prototype.hasOwnProperty.call(value, key));
}

function finite(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function inRange(value: unknown, min: number, max: number): value is number {
  return finite(value) && value >= min && value <= max;
}

function text(value: unknown, maxLength = 1200): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.length <= maxLength;
}

function utcTimestamp(value: unknown): value is string {
  return typeof value === "string"
    && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value)
    && Number.isFinite(new Date(value).getTime());
}

function utcDate(value: unknown): value is string {
  return typeof value === "string"
    && /^\d{4}-\d{2}-\d{2}$/.test(value)
    && Number.isFinite(new Date(`${value}T00:00:00.000Z`).getTime());
}

function guardBoundary(value: unknown): value is BtcPublicBoundary {
  if (!isRecord(value) || !hasExactKeys(value, BOUNDARY_KEYS)) return false;
  return value.read_only === true
    && value.static_public_snapshot === true
    && value.no_live_adapter_claim === true
    && value.no_true_live_feed_claim === true
    && value.no_trading_signal === true
    && value.no_forecast === true
    && value.no_price_target === true
    && value.no_investment_recommendation === true
    && value.backend_api_closed === true
    && value.runtime_closed === true
    && value.payment_closed === true
    && value.orion_core_protected === true
    && value.formula_weights_exposed === false;
}

function guardFacts(value: unknown): value is BtcNarrativeFacts {
  if (!isRecord(value) || !hasExactKeys(value, FACT_KEYS)) return false;
  if (!finite(value.price_usd) || value.price_usd < 0) return false;
  if (![value.change_24h_pct, value.change_7d_pct, value.change_30d_pct, value.market_cap_change_24h_pct, value.field_score].every(finite)) return false;
  if (!utcTimestamp(value.source_generated_at_utc) || !["FRESH", "STALE_LIMITED"].includes(value.freshness as string)) return false;
  if (!inRange(value.dominance_pct, 0, 100) || !["high", "balanced", "lower"].includes(value.dominance_band as string)) return false;
  if (!Number.isInteger(value.market_cap_rank) || (value.market_cap_rank as number) < 1) return false;
  if (![value.market_context_label, value.regime_label, value.direction_bias, value.liquidity_state, value.pressure_label].every((item) => text(item, 160))) return false;
  if (!inRange(value.stablecoin_share_pct, 0, 100) || !inRange(value.alt_breadth_24h_pct, 0, 100)) return false;
  if (value.pressure_band !== null && !["elevated", "moderate", "low"].includes(value.pressure_band as string)) return false;
  if (value.harmonic_tension !== null && !inRange(value.harmonic_tension, 0, 1)) return false;
  if (!["bounded_numeric_metric", "no_numeric_aspect_claim"].includes(value.evidence_mode as string)) return false;
  if ((value.pressure_band === null) !== (value.harmonic_tension === null)) return false;
  if ((value.pressure_band !== null) !== (value.evidence_mode === "bounded_numeric_metric")) return false;
  if (!["available_bounded", "static_state_only", "unavailable"].includes(value.temporal_state as string)) return false;
  if (!utcDate(value.observation_date) || !text(value.temporal_limitation)) return false;
  return true;
}

function projectPayload(sectionId: BtcSectionId, facts: BtcNarrativeFacts): BtcNarrativeSectionFactPayload | null {
  switch (sectionId) {
    case "what_changed":
      return {
        section_id: sectionId,
        price_usd: facts.price_usd,
        change_24h_pct: facts.change_24h_pct,
        change_7d_pct: facts.change_7d_pct,
        change_30d_pct: facts.change_30d_pct,
        market_cap_change_24h_pct: facts.market_cap_change_24h_pct,
      };
    case "why_it_matters":
      return {
        section_id: sectionId,
        dominance_pct: facts.dominance_pct,
        dominance_band: facts.dominance_band,
        market_cap_rank: facts.market_cap_rank,
        market_context_label: facts.market_context_label,
      };
    case "current_structure":
      return {
        section_id: sectionId,
        regime_label: facts.regime_label,
        field_score: facts.field_score,
        direction_bias: facts.direction_bias,
        liquidity_state: facts.liquidity_state,
      };
    case "dominant_pressures":
      return {
        section_id: sectionId,
        pressure_band: facts.pressure_band,
        harmonic_tension: facts.harmonic_tension,
        evidence_mode: facts.evidence_mode,
        pressure_label: facts.pressure_label,
        stablecoin_share_pct: facts.stablecoin_share_pct,
        temporal_state: facts.temporal_state,
      };
    case "relative_market_field":
      return {
        section_id: sectionId,
        dominance_pct: facts.dominance_pct,
        alt_breadth_24h_pct: facts.alt_breadth_24h_pct,
        stablecoin_share_pct: facts.stablecoin_share_pct,
      };
    case "temporal_context":
      return {
        section_id: sectionId,
        temporal_state: facts.temporal_state,
        observation_date: facts.observation_date,
        source_generated_at_utc: facts.source_generated_at_utc,
        temporal_limitation: facts.temporal_limitation,
      };
  }
}

function guardPayload(value: unknown, expectedSectionId?: BtcSectionId): value is BtcNarrativeSectionFactPayload {
  if (!isRecord(value) || !BTC_SECTION_IDS.includes(value.section_id as BtcSectionId)) return false;
  if (expectedSectionId && value.section_id !== expectedSectionId) return false;
  switch (value.section_id) {
    case "what_changed":
      return hasExactKeys(value, ["section_id", "price_usd", "change_24h_pct", "change_7d_pct", "change_30d_pct", "market_cap_change_24h_pct"])
        && finite(value.price_usd) && (value.price_usd as number) >= 0
        && [value.change_24h_pct, value.change_7d_pct, value.change_30d_pct, value.market_cap_change_24h_pct].every(finite);
    case "why_it_matters":
      return hasExactKeys(value, ["section_id", "dominance_pct", "dominance_band", "market_cap_rank", "market_context_label"])
        && inRange(value.dominance_pct, 0, 100)
        && ["high", "balanced", "lower"].includes(value.dominance_band as string)
        && Number.isInteger(value.market_cap_rank) && (value.market_cap_rank as number) > 0
        && text(value.market_context_label, 160);
    case "current_structure":
      return hasExactKeys(value, ["section_id", "regime_label", "field_score", "direction_bias", "liquidity_state"])
        && text(value.regime_label, 160) && finite(value.field_score)
        && text(value.direction_bias, 160) && text(value.liquidity_state, 160);
    case "dominant_pressures": {
      if (!hasExactKeys(value, ["section_id", "pressure_band", "harmonic_tension", "evidence_mode", "pressure_label", "stablecoin_share_pct", "temporal_state"])) return false;
      if (value.pressure_band !== null && !["elevated", "moderate", "low"].includes(value.pressure_band as string)) return false;
      if (value.harmonic_tension !== null && !inRange(value.harmonic_tension, 0, 1)) return false;
      return ["bounded_numeric_metric", "no_numeric_aspect_claim"].includes(value.evidence_mode as string)
        && text(value.pressure_label, 160)
        && inRange(value.stablecoin_share_pct, 0, 100)
        && ["available_bounded", "static_state_only", "unavailable"].includes(value.temporal_state as string)
        && ((value.pressure_band === null) === (value.harmonic_tension === null));
    }
    case "relative_market_field":
      return hasExactKeys(value, ["section_id", "dominance_pct", "alt_breadth_24h_pct", "stablecoin_share_pct"])
        && inRange(value.dominance_pct, 0, 100)
        && inRange(value.alt_breadth_24h_pct, 0, 100)
        && inRange(value.stablecoin_share_pct, 0, 100);
    case "temporal_context":
      return hasExactKeys(value, ["section_id", "temporal_state", "observation_date", "source_generated_at_utc", "temporal_limitation"])
        && ["available_bounded", "static_state_only", "unavailable"].includes(value.temporal_state as string)
        && utcDate(value.observation_date)
        && utcTimestamp(value.source_generated_at_utc)
        && text(value.temporal_limitation);
    default:
      return false;
  }
}

export function guardBtcNarrativeRouterInput(value: unknown): value is BtcNarrativeRouterInput {
  if (!isRecord(value) || !hasExactKeys(value, [
    "schema_version",
    "geometry",
    "question_lens",
    "safe_reframed",
    "facts",
    "public_boundary",
    "template_catalog_version",
  ])) return false;
  if (value.schema_version !== "btc_deterministic_narrative_router_input_v0_1") return false;
  if (value.template_catalog_version !== "btc_narrative_template_catalog_v0_1") return false;
  if (!guardBtcQuestionGeometry(value.geometry)) return false;
  if (typeof value.safe_reframed !== "boolean" || value.question_lens !== value.geometry.lens) return false;
  const expectedOverlay = value.safe_reframed ? "observable_context_only" : "standard_public_context";
  return value.geometry.safety_overlay === expectedOverlay && guardFacts(value.facts) && guardBoundary(value.public_boundary);
}

export function guardBtcNarrativeSection(value: unknown): value is BtcNarrativeSection {
  if (!isRecord(value) || !hasExactKeys(value, ["section_id", "role", "order", "fact_payload", "read_template_id"])) return false;
  if (!BTC_SECTION_IDS.includes(value.section_id as BtcSectionId)) return false;
  if (!["primary", "supporting"].includes(value.role as string)) return false;
  if (!Number.isInteger(value.order) || (value.order as number) < 1 || (value.order as number) > 6) return false;
  if (!BTC_NARRATIVE_TEMPLATE_IDS.includes(value.read_template_id as BtcReadTemplateId)) return false;
  return guardPayload(value.fact_payload, value.section_id as BtcSectionId);
}

export function guardBtcNarrativeRouterOutput(value: unknown): value is BtcNarrativeRouterOutput {
  if (!isRecord(value) || !hasExactKeys(value, [
    "schema_version",
    "route_version",
    "lens",
    "focus_axis",
    "narrative_profile",
    "watch_profile",
    "safety_overlay",
    "sections",
    "suppressed_sections",
    "template_catalog_version",
  ])) return false;
  if (value.schema_version !== "btc_deterministic_narrative_v0_1") return false;
  if (value.route_version !== "btc_question_geometry_route_v0_1") return false;
  if (value.template_catalog_version !== "btc_narrative_template_catalog_v0_1") return false;
  if (!BTC_GEOMETRY_FOCUS_AXES.includes(value.focus_axis as BtcGeometryFocusAxis)) return false;
  if (!BTC_NARRATIVE_PROFILES.includes(value.narrative_profile as BtcNarrativeProfile)) return false;
  if (!BTC_WATCH_PROFILES.includes(value.watch_profile as BtcWatchProfile)) return false;
  if (!BTC_SAFETY_OVERLAYS.includes(value.safety_overlay as BtcSafetyOverlay)) return false;
  if (!Array.isArray(value.sections) || !Array.isArray(value.suppressed_sections)) return false;
  if (!value.sections.every(guardBtcNarrativeSection)) return false;
  if (value.suppressed_sections.some((item) => !BTC_SECTION_IDS.includes(item as BtcSectionId))) return false;

  const geometry = deriveBtcQuestionGeometry(
    value.lens as BtcQuestionLens,
    value.safety_overlay === "observable_context_only",
  );
  if (value.focus_axis !== geometry.focus_axis
    || value.narrative_profile !== geometry.narrative_profile
    || value.watch_profile !== geometry.watch_profile) return false;
  if (value.suppressed_sections.length !== geometry.suppressed_sections.length
    || !value.suppressed_sections.every((item, index) => item === geometry.suppressed_sections[index])) return false;

  const expectedOrder = [...geometry.primary_sections, ...geometry.supporting_sections];
  if (value.sections.length !== expectedOrder.length) return false;
  if (new Set(value.sections.map((section) => section.section_id)).size !== value.sections.length) return false;

  return value.sections.every((section, index) => {
    const role = index < geometry.primary_sections.length ? "primary" : "supporting";
    const expectedTemplate = selectBtcReadTemplateId(geometry.narrative_profile, expectedOrder[index], role);
    return section.order === index + 1
      && section.section_id === expectedOrder[index]
      && section.role === role
      && section.read_template_id === expectedTemplate;
  });
}

export function routeBtcDeterministicNarrative(input: BtcNarrativeRouterInput): BtcNarrativeRouterResult {
  if (!guardBtcNarrativeRouterInput(input)) {
    return { ok: false, code: "invalid_router_input", message: "Narrative router input failed the locked typed contract." };
  }
  if (input.question_lens !== input.geometry.lens) {
    return { ok: false, code: "geometry_lens_mismatch", message: "Question lens and geometry lens do not match." };
  }
  if (!guardBoundary(input.public_boundary)) {
    return { ok: false, code: "public_boundary_invalid", message: "Public safety boundary is invalid." };
  }

  const sectionIds = [...input.geometry.primary_sections, ...input.geometry.supporting_sections];
  const sections: BtcNarrativeSection[] = [];
  for (const [index, sectionId] of sectionIds.entries()) {
    const role: "primary" | "supporting" = index < input.geometry.primary_sections.length ? "primary" : "supporting";
    const factPayload = projectPayload(sectionId, input.facts);
    if (!factPayload || !guardPayload(factPayload, sectionId)) {
      return { ok: false, code: "section_payload_mismatch", message: "Narrative fact projection failed." };
    }
    const templateId = selectBtcReadTemplateId(input.geometry.narrative_profile, sectionId, role);
    if (!templateId) {
      return { ok: false, code: "unsupported_template_id", message: "No closed template exists for the routed section." };
    }
    sections.push({
      section_id: sectionId,
      role,
      order: index + 1,
      fact_payload: factPayload,
      read_template_id: templateId,
    });
  }

  const output: BtcNarrativeRouterOutput = {
    schema_version: "btc_deterministic_narrative_v0_1",
    route_version: input.geometry.route_version,
    lens: input.question_lens,
    focus_axis: input.geometry.focus_axis,
    narrative_profile: input.geometry.narrative_profile,
    watch_profile: input.geometry.watch_profile,
    safety_overlay: input.geometry.safety_overlay,
    sections,
    suppressed_sections: [...input.geometry.suppressed_sections],
    template_catalog_version: input.template_catalog_version,
  };

  if (!guardBtcNarrativeRouterOutput(output)) {
    return { ok: false, code: "narrative_contract_failed", message: "Narrative router output failed the locked typed contract." };
  }
  return { ok: true, value: output };
}
