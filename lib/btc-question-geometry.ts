import type { BtcQuestionLens } from "./btc-public-output-contract";

export const BTC_SECTION_IDS = [
  "what_changed",
  "why_it_matters",
  "current_structure",
  "dominant_pressures",
  "relative_market_field",
  "temporal_context",
] as const;

export const BTC_GEOMETRY_FOCUS_AXES = ["gravity", "structure", "pressure", "temporal", "overview"] as const;
export const BTC_WATCH_PROFILES = ["gravity_watch", "structure_watch", "pressure_watch", "temporal_watch", "overview_watch"] as const;
export const BTC_NARRATIVE_PROFILES = ["gravity_read", "structure_read", "pressure_read", "temporal_read", "overview_read"] as const;
export const BTC_SAFETY_OVERLAYS = ["standard_public_context", "observable_context_only"] as const;

export type BtcSectionId = (typeof BTC_SECTION_IDS)[number];
export type BtcGeometryFocusAxis = (typeof BTC_GEOMETRY_FOCUS_AXES)[number];
export type BtcWatchProfile = (typeof BTC_WATCH_PROFILES)[number];
export type BtcNarrativeProfile = (typeof BTC_NARRATIVE_PROFILES)[number];
export type BtcSafetyOverlay = (typeof BTC_SAFETY_OVERLAYS)[number];

export type BtcQuestionGeometry = {
  schema_version: "btc_question_geometry_v0_1";
  lens: BtcQuestionLens;
  focus_axis: BtcGeometryFocusAxis;
  primary_sections: readonly [BtcSectionId, BtcSectionId];
  supporting_sections: readonly BtcSectionId[];
  suppressed_sections: readonly BtcSectionId[];
  watch_profile: BtcWatchProfile;
  narrative_profile: BtcNarrativeProfile;
  safety_overlay: BtcSafetyOverlay;
  route_version: "btc_question_geometry_route_v0_1";
};

type GeometryCore = Omit<BtcQuestionGeometry, "schema_version" | "lens" | "safety_overlay" | "route_version">;

const ROUTE_CATALOG: Record<BtcQuestionLens, GeometryCore> = {
  market_gravity: {
    focus_axis: "gravity",
    primary_sections: ["why_it_matters", "relative_market_field"],
    supporting_sections: ["what_changed", "current_structure"],
    suppressed_sections: ["dominant_pressures", "temporal_context"],
    watch_profile: "gravity_watch",
    narrative_profile: "gravity_read",
  },
  market_structure: {
    focus_axis: "structure",
    primary_sections: ["current_structure", "relative_market_field"],
    supporting_sections: ["what_changed", "why_it_matters"],
    suppressed_sections: ["dominant_pressures", "temporal_context"],
    watch_profile: "structure_watch",
    narrative_profile: "structure_read",
  },
  pressure_context: {
    focus_axis: "pressure",
    primary_sections: ["dominant_pressures", "temporal_context"],
    supporting_sections: ["current_structure", "what_changed"],
    suppressed_sections: ["why_it_matters", "relative_market_field"],
    watch_profile: "pressure_watch",
    narrative_profile: "pressure_read",
  },
  temporal_context: {
    focus_axis: "temporal",
    primary_sections: ["temporal_context", "dominant_pressures"],
    supporting_sections: ["what_changed", "current_structure"],
    suppressed_sections: ["why_it_matters", "relative_market_field"],
    watch_profile: "temporal_watch",
    narrative_profile: "temporal_read",
  },
  general: {
    focus_axis: "overview",
    primary_sections: ["what_changed", "why_it_matters"],
    supporting_sections: ["current_structure", "dominant_pressures", "relative_market_field", "temporal_context"],
    suppressed_sections: [],
    watch_profile: "overview_watch",
    narrative_profile: "overview_read",
  },
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function hasExactKeys(value: Record<string, unknown>, expected: readonly string[]): boolean {
  const keys = Object.keys(value);
  return keys.length === expected.length && expected.every((key) => Object.prototype.hasOwnProperty.call(value, key));
}

function sameArray(a: readonly unknown[], b: readonly unknown[]): boolean {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

export function deriveBtcQuestionGeometry(lens: BtcQuestionLens, safeReframed: boolean): BtcQuestionGeometry {
  const route = ROUTE_CATALOG[lens];
  return {
    schema_version: "btc_question_geometry_v0_1",
    lens,
    focus_axis: route.focus_axis,
    primary_sections: [...route.primary_sections],
    supporting_sections: [...route.supporting_sections],
    suppressed_sections: [...route.suppressed_sections],
    watch_profile: route.watch_profile,
    narrative_profile: route.narrative_profile,
    safety_overlay: safeReframed ? "observable_context_only" : "standard_public_context",
    route_version: "btc_question_geometry_route_v0_1",
  };
}

export function guardBtcQuestionGeometry(value: unknown): value is BtcQuestionGeometry {
  if (!isRecord(value) || !hasExactKeys(value, [
    "schema_version",
    "lens",
    "focus_axis",
    "primary_sections",
    "supporting_sections",
    "suppressed_sections",
    "watch_profile",
    "narrative_profile",
    "safety_overlay",
    "route_version",
  ])) return false;

  if (value.schema_version !== "btc_question_geometry_v0_1" || value.route_version !== "btc_question_geometry_route_v0_1") return false;
  if (!Object.prototype.hasOwnProperty.call(ROUTE_CATALOG, value.lens as string)) return false;
  if (!BTC_GEOMETRY_FOCUS_AXES.includes(value.focus_axis as BtcGeometryFocusAxis)) return false;
  if (!BTC_WATCH_PROFILES.includes(value.watch_profile as BtcWatchProfile)) return false;
  if (!BTC_NARRATIVE_PROFILES.includes(value.narrative_profile as BtcNarrativeProfile)) return false;
  if (!BTC_SAFETY_OVERLAYS.includes(value.safety_overlay as BtcSafetyOverlay)) return false;
  if (!Array.isArray(value.primary_sections) || value.primary_sections.length !== 2) return false;
  if (!Array.isArray(value.supporting_sections) || !Array.isArray(value.suppressed_sections)) return false;

  const partition = [...value.primary_sections, ...value.supporting_sections, ...value.suppressed_sections];
  if (partition.length !== BTC_SECTION_IDS.length) return false;
  if (new Set(partition).size !== BTC_SECTION_IDS.length) return false;
  if (partition.some((item) => !BTC_SECTION_IDS.includes(item as BtcSectionId))) return false;

  const expected = deriveBtcQuestionGeometry(
    value.lens as BtcQuestionLens,
    value.safety_overlay === "observable_context_only",
  );

  return value.focus_axis === expected.focus_axis
    && sameArray(value.primary_sections, expected.primary_sections)
    && sameArray(value.supporting_sections, expected.supporting_sections)
    && sameArray(value.suppressed_sections, expected.suppressed_sections)
    && value.watch_profile === expected.watch_profile
    && value.narrative_profile === expected.narrative_profile
    && value.safety_overlay === expected.safety_overlay;
}
