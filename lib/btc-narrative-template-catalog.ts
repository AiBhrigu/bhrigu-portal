import type { BtcNarrativeProfile, BtcSectionId } from "./btc-question-geometry";
import type { BtcNarrativeSectionFactPayload } from "./btc-deterministic-narrative-router";

export const BTC_NARRATIVE_TEMPLATE_IDS = [
  "gravity_center_read_v0_1",
  "gravity_distribution_read_v0_1",
  "structure_regime_read_v0_1",
  "structure_participation_read_v0_1",
  "pressure_interaction_read_v0_1",
  "pressure_temporal_boundary_read_v0_1",
  "temporal_state_read_v0_1",
  "temporal_pressure_read_v0_1",
  "overview_change_read_v0_1",
  "overview_significance_read_v0_1",
  "market_change_support_v0_1",
  "gravity_support_v0_1",
  "structure_support_v0_1",
  "pressure_support_v0_1",
  "relative_field_support_v0_1",
  "temporal_boundary_support_v0_1",
] as const;

export type BtcReadTemplateId = (typeof BTC_NARRATIVE_TEMPLATE_IDS)[number];

const PRIMARY_TEMPLATE_CATALOG: Record<BtcNarrativeProfile, Partial<Record<BtcSectionId, BtcReadTemplateId>>> = {
  gravity_read: {
    why_it_matters: "gravity_center_read_v0_1",
    relative_market_field: "gravity_distribution_read_v0_1",
  },
  structure_read: {
    current_structure: "structure_regime_read_v0_1",
    relative_market_field: "structure_participation_read_v0_1",
  },
  pressure_read: {
    dominant_pressures: "pressure_interaction_read_v0_1",
    temporal_context: "pressure_temporal_boundary_read_v0_1",
  },
  temporal_read: {
    temporal_context: "temporal_state_read_v0_1",
    dominant_pressures: "temporal_pressure_read_v0_1",
  },
  overview_read: {
    what_changed: "overview_change_read_v0_1",
    why_it_matters: "overview_significance_read_v0_1",
  },
};

const SUPPORTING_TEMPLATE_CATALOG: Record<BtcSectionId, BtcReadTemplateId> = {
  what_changed: "market_change_support_v0_1",
  why_it_matters: "gravity_support_v0_1",
  current_structure: "structure_support_v0_1",
  dominant_pressures: "pressure_support_v0_1",
  relative_market_field: "relative_field_support_v0_1",
  temporal_context: "temporal_boundary_support_v0_1",
};

export function selectBtcReadTemplateId(
  profile: BtcNarrativeProfile,
  sectionId: BtcSectionId,
  role: "primary" | "supporting",
): BtcReadTemplateId | null {
  return role === "primary"
    ? PRIMARY_TEMPLATE_CATALOG[profile][sectionId] ?? null
    : SUPPORTING_TEMPLATE_CATALOG[sectionId] ?? null;
}

function movementSummary(payload: Extract<BtcNarrativeSectionFactPayload, { section_id: "what_changed" }>): string {
  const values = [payload.change_24h_pct, payload.change_7d_pct, payload.change_30d_pct];
  if (values.every((value) => value > 0)) return "Price direction is aligned across the published 24-hour, 7-day, and 30-day horizons.";
  if (values.every((value) => value < 0)) return "Downward pressure is aligned across the published 24-hour, 7-day, and 30-day horizons.";
  return "The published horizons are mixed, so the BTC field is not moving as one uniform momentum block.";
}

function gravitySummary(payload: Extract<BtcNarrativeSectionFactPayload, { section_id: "why_it_matters" }>): string {
  if (payload.dominance_band === "high") return "BTC is the dominant gravity center in the current public market field.";
  if (payload.dominance_band === "lower") return "BTC gravity is lower relative to the broader public market field, so participation outside BTC carries more structural weight.";
  return "BTC leadership and broader market participation are in a balanced gravity relationship.";
}

function pressureSummary(payload: Extract<BtcNarrativeSectionFactPayload, { section_id: "dominant_pressures" }>): string {
  if (payload.harmonic_tension === null || payload.pressure_band === null) {
    return "No numeric aspect value is published; pressure remains bounded to the validated static temporal state and market context.";
  }
  return `The bounded temporal pressure band is ${payload.pressure_band}, with harmonic tension ${payload.harmonic_tension.toFixed(4)}.`;
}

export function renderBtcNarrativeRead(
  templateId: BtcReadTemplateId,
  payload: BtcNarrativeSectionFactPayload,
): string {
  switch (templateId) {
    case "overview_change_read_v0_1":
      if (payload.section_id !== "what_changed") break;
      return movementSummary(payload);
    case "overview_significance_read_v0_1":
      if (payload.section_id !== "why_it_matters") break;
      return `${gravitySummary(payload)} This determines how strongly the wider field should be read through BTC leadership rather than isolated asset moves.`;
    case "gravity_center_read_v0_1":
      if (payload.section_id !== "why_it_matters") break;
      return `${gravitySummary(payload)} Dominance at ${payload.dominance_pct.toFixed(2)}% and market rank #${payload.market_cap_rank} define the current center of market gravity.`;
    case "gravity_distribution_read_v0_1":
      if (payload.section_id !== "relative_market_field") break;
      return `BTC dominance at ${payload.dominance_pct.toFixed(2)}% shows where gravity is concentrated, while alt breadth at ${payload.alt_breadth_24h_pct.toFixed(1)}% shows how widely participation is distributed around that center.`;
    case "structure_regime_read_v0_1":
      if (payload.section_id !== "current_structure") break;
      return `The ${payload.regime_label} regime and ${payload.direction_bias} direction bias define the current structure; liquidity state ${payload.liquidity_state} limits how broadly it can be expressed.`;
    case "structure_participation_read_v0_1":
      if (payload.section_id !== "relative_market_field") break;
      return `Alt breadth at ${payload.alt_breadth_24h_pct.toFixed(1)}% and stablecoin share at ${payload.stablecoin_share_pct.toFixed(2)}% describe the width and reserve posture of current participation.`;
    case "pressure_interaction_read_v0_1":
      if (payload.section_id !== "dominant_pressures") break;
      return `${pressureSummary(payload)} The read remains contextual and is not converted into an entry, exit, target, or trading instruction.`;
    case "pressure_temporal_boundary_read_v0_1":
      if (payload.section_id !== "temporal_context") break;
      return `${payload.temporal_limitation} The temporal lane is used only to bound pressure context.`;
    case "temporal_state_read_v0_1":
      if (payload.section_id !== "temporal_context") break;
      return `For ${payload.observation_date}, the temporal state is ${payload.temporal_state}. ${payload.temporal_limitation}`;
    case "temporal_pressure_read_v0_1":
      if (payload.section_id !== "dominant_pressures") break;
      return `${pressureSummary(payload)} It is interpreted only as bounded context for the selected temporal date.`;
    case "market_change_support_v0_1":
      if (payload.section_id !== "what_changed") break;
      return movementSummary(payload);
    case "gravity_support_v0_1":
      if (payload.section_id !== "why_it_matters") break;
      return gravitySummary(payload);
    case "structure_support_v0_1":
      if (payload.section_id !== "current_structure") break;
      return "The published regime, direction bias, and liquidity state provide the structural frame supporting this question.";
    case "pressure_support_v0_1":
      if (payload.section_id !== "dominant_pressures") break;
      return pressureSummary(payload);
    case "relative_field_support_v0_1":
      if (payload.section_id !== "relative_market_field") break;
      return "BTC dominance, alt breadth, and stablecoin share provide the relative-field context supporting the primary read.";
    case "temporal_boundary_support_v0_1":
      if (payload.section_id !== "temporal_context") break;
      return payload.temporal_limitation;
  }
  return "Routed public-safe read unavailable.";
}
