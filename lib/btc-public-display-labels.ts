import type { BtcQuestionLens, FreshnessState, TemporalState } from "./btc-public-output-contract";
import type { BtcGeometryFocusAxis, BtcSafetyOverlay } from "./btc-question-geometry";

export const BTC_PUBLIC_DISPLAY_LABELS_SCHEMA = "btc_public_display_labels_v0_1" as const;
export const BTC_PUBLIC_DISPLAY_FALLBACK = "Unavailable public label" as const;

export const BTC_QUESTION_LENS_LABELS: Record<BtcQuestionLens, string> = {
  market_gravity: "Market gravity",
  market_structure: "Market structure",
  pressure_context: "Pressure context",
  temporal_context: "Temporal context",
  general: "Field overview",
};

export const BTC_FOCUS_AXIS_LABELS: Record<BtcGeometryFocusAxis, string> = {
  gravity: "Gravity",
  structure: "Structure",
  pressure: "Pressure",
  temporal: "Temporal",
  overview: "Overview",
};

export const BTC_FRESHNESS_LABELS: Record<FreshnessState, string> = {
  FRESH: "Verified current snapshot",
  STALE_LIMITED: "Older verified snapshot · limited current-state claims",
  UNAVAILABLE: "Verification status unavailable",
};

export const BTC_TEMPORAL_STATE_LABELS: Record<TemporalState, string> = {
  available_bounded: "Bounded temporal metrics available",
  static_state_only: "Static temporal context only",
  unavailable: "Temporal context unavailable",
};

export const BTC_DOMINANCE_BAND_LABELS = {
  high: "High BTC concentration",
  balanced: "Balanced BTC leadership",
  lower: "Lower BTC concentration",
} as const;

export const BTC_SAFETY_OVERLAY_LABELS: Record<BtcSafetyOverlay, string> = {
  standard_public_context: "Public contextual read",
  observable_context_only: "Observable context only",
};

export const BTC_PROOF_SOURCE_LABELS: Record<string, string> = {
  coingecko_global: "CoinGecko · Global market",
  coingecko_asset_markets_btc_eth_sol_ton_icp: "CoinGecko · Asset market sample",
  coingecko_top250_markets: "CoinGecko · Top-250 market universe",
  coingecko_stablecoin_sample: "CoinGecko · Stablecoin sample",
  defillama_protocols: "DefiLlama · Protocol liquidity",
  defillama_dex_overview: "DefiLlama · DEX overview",
  defillama_stablecoins: "DefiLlama · Stablecoin market",
};

const BTC_MARKET_CONTEXT_LABELS: Record<string, string> = {
  low_movement: "Low movement",
  moderate_movement: "Moderate movement",
  high_movement: "High movement",
  mixed_movement: "Mixed movement",
};

export type BtcReadRolePresentation = {
  dataRole: "primary" | "supporting";
  className: "readSectionPrimary" | "readSectionSupporting";
  badge: "PRIMARY READ" | "SUPPORTING CONTEXT";
};

export const BTC_READ_ROLE_PRESENTATION: Record<"primary" | "supporting", BtcReadRolePresentation> = {
  primary: { dataRole: "primary", className: "readSectionPrimary", badge: "PRIMARY READ" },
  supporting: { dataRole: "supporting", className: "readSectionSupporting", badge: "SUPPORTING CONTEXT" },
};

function lookupLabel(map: Readonly<Record<string, string>>, value: unknown): string {
  return typeof value === "string" && Object.prototype.hasOwnProperty.call(map, value)
    ? map[value]
    : BTC_PUBLIC_DISPLAY_FALLBACK;
}

export function formatBtcQuestionLensLabel(value: unknown): string {
  return lookupLabel(BTC_QUESTION_LENS_LABELS, value);
}

export function formatBtcFocusAxisLabel(value: unknown): string {
  return lookupLabel(BTC_FOCUS_AXIS_LABELS, value);
}

export function formatBtcFreshnessLabel(value: unknown): string {
  return lookupLabel(BTC_FRESHNESS_LABELS, value);
}

export function formatBtcTemporalStateLabel(value: unknown): string {
  return lookupLabel(BTC_TEMPORAL_STATE_LABELS, value);
}

export function formatBtcDominanceBandLabel(value: unknown): string {
  return lookupLabel(BTC_DOMINANCE_BAND_LABELS, value);
}

export function formatBtcSafetyOverlayLabel(value: unknown): string {
  return lookupLabel(BTC_SAFETY_OVERLAY_LABELS, value);
}

export function formatBtcProofSourceLabel(value: unknown): string {
  return lookupLabel(BTC_PROOF_SOURCE_LABELS, value);
}

export function formatBtcMarketContextLabel(value: unknown): string {
  if (typeof value !== "string") return BTC_PUBLIC_DISPLAY_FALLBACK;
  if (Object.prototype.hasOwnProperty.call(BTC_MARKET_CONTEXT_LABELS, value)) return BTC_MARKET_CONTEXT_LABELS[value];
  if (/^[A-Za-z][A-Za-z0-9 .+→-]{0,79}$/.test(value) && !value.includes("_")) return value;
  return BTC_PUBLIC_DISPLAY_FALLBACK;
}

export function formatBtcProofStatusLabel(value: unknown): string {
  return value === "PASS" ? "Verified" : BTC_PUBLIC_DISPLAY_FALLBACK;
}

export function getBtcReadRolePresentation(value: unknown): BtcReadRolePresentation {
  return value === "primary" ? BTC_READ_ROLE_PRESENTATION.primary : BTC_READ_ROLE_PRESENTATION.supporting;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;

export function formatBtcObservationDate(value: unknown): string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return BTC_PUBLIC_DISPLAY_FALLBACK;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (!Number.isFinite(parsed.getTime())) return BTC_PUBLIC_DISPLAY_FALLBACK;
  return `${String(parsed.getUTCDate()).padStart(2, "0")} ${MONTHS[parsed.getUTCMonth()]} ${parsed.getUTCFullYear()}`;
}

export function formatBtcUtcTimestamp(value: unknown): string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value)) return BTC_PUBLIC_DISPLAY_FALLBACK;
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime())) return BTC_PUBLIC_DISPLAY_FALLBACK;
  const date = `${String(parsed.getUTCDate()).padStart(2, "0")} ${MONTHS[parsed.getUTCMonth()]} ${parsed.getUTCFullYear()}`;
  const time = `${String(parsed.getUTCHours()).padStart(2, "0")}:${String(parsed.getUTCMinutes()).padStart(2, "0")}`;
  return `${date} · ${time} UTC`;
}

export function formatBtcWatchConditionForDisplay(value: unknown): string {
  if (typeof value !== "string" || value.trim().length === 0 || value.length > 600) return BTC_PUBLIC_DISPLAY_FALLBACK;
  const replacements: ReadonlyArray<readonly [string, string]> = [
    ["static_state_only", BTC_TEMPORAL_STATE_LABELS.static_state_only],
    ["available_bounded", BTC_TEMPORAL_STATE_LABELS.available_bounded],
    ["unavailable", BTC_TEMPORAL_STATE_LABELS.unavailable],
    ["STALE_LIMITED", "Older verified snapshot"],
    ["FRESH", BTC_FRESHNESS_LABELS.FRESH],
    ["reserve posture", "available reserve context"],
    ["published sample", "verified public sample"],
    ["source freshness state", "source verification status"],
  ];
  let formatted = value;
  for (const [raw, label] of replacements) formatted = formatted.split(raw).join(label);
  return /\b[a-z]+(?:_[a-z0-9]+)+\b/.test(formatted) ? BTC_PUBLIC_DISPLAY_FALLBACK : formatted;
}
