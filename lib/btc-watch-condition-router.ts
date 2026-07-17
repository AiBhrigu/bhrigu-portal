import type { FreshnessState, TemporalState } from "./btc-public-output-contract";
import { BTC_WATCH_PROFILES, type BtcWatchProfile } from "./btc-question-geometry";

export type BtcWatchConditionRouterInput = {
  schema_version: "btc_watch_condition_router_input_v0_1";
  watch_profile: BtcWatchProfile;
  dominance_pct: number;
  dominance_band: "high" | "balanced" | "lower";
  market_cap_rank: number;
  regime_label: string;
  liquidity_state: string;
  stablecoin_share_pct: number;
  alt_breadth_24h_pct: number;
  pressure_label: string;
  harmonic_tension: number | null;
  temporal_state: TemporalState;
  observation_date: string;
  freshness: FreshnessState;
};

export type BtcWatchConditionRouterResult =
  | { ok: true; value: readonly string[] }
  | { ok: false; code: "invalid_watch_input" | "unsupported_watch_profile" | "watch_contract_failed"; message: string };

const INPUT_KEYS = [
  "schema_version",
  "watch_profile",
  "dominance_pct",
  "dominance_band",
  "market_cap_rank",
  "regime_label",
  "liquidity_state",
  "stablecoin_share_pct",
  "alt_breadth_24h_pct",
  "pressure_label",
  "harmonic_tension",
  "temporal_state",
  "observation_date",
  "freshness",
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function hasExactKeys(value: Record<string, unknown>, expected: readonly string[]): boolean {
  const keys = Object.keys(value);
  return keys.length === expected.length && expected.every((key) => Object.prototype.hasOwnProperty.call(value, key));
}

function isFiniteInRange(value: unknown, min: number, max: number): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= min && value <= max;
}

function isNonEmptyString(value: unknown, maxLength = 160): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.length <= maxLength;
}

export function guardBtcWatchConditionRouterInput(value: unknown): value is BtcWatchConditionRouterInput {
  if (!isRecord(value) || !hasExactKeys(value, INPUT_KEYS)) return false;
  if (value.schema_version !== "btc_watch_condition_router_input_v0_1") return false;
  if (!BTC_WATCH_PROFILES.includes(value.watch_profile as BtcWatchProfile)) return false;
  if (!isFiniteInRange(value.dominance_pct, 0, 100)) return false;
  if (!["high", "balanced", "lower"].includes(value.dominance_band as string)) return false;
  if (!Number.isInteger(value.market_cap_rank) || (value.market_cap_rank as number) < 1) return false;
  if (!isNonEmptyString(value.regime_label) || !isNonEmptyString(value.liquidity_state)) return false;
  if (!isFiniteInRange(value.stablecoin_share_pct, 0, 100) || !isFiniteInRange(value.alt_breadth_24h_pct, 0, 100)) return false;
  if (!isNonEmptyString(value.pressure_label)) return false;
  if (value.harmonic_tension !== null && !isFiniteInRange(value.harmonic_tension, 0, 1)) return false;
  if (!["available_bounded", "static_state_only", "unavailable"].includes(value.temporal_state as string)) return false;
  if (typeof value.observation_date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value.observation_date)) return false;
  return ["FRESH", "STALE_LIMITED"].includes(value.freshness as string);
}

function pressureLine(input: BtcWatchConditionRouterInput): string {
  return input.harmonic_tension === null
    ? `Observe ${input.pressure_label}; no numeric harmonic value is published.`
    : `Observe ${input.pressure_label} with harmonic tension ${input.harmonic_tension.toFixed(4)}.`;
}

export function routeBtcWatchConditions(input: BtcWatchConditionRouterInput): BtcWatchConditionRouterResult {
  if (!guardBtcWatchConditionRouterInput(input)) {
    return { ok: false, code: "invalid_watch_input", message: "Watch-condition input failed the typed contract." };
  }

  let value: readonly string[];
  switch (input.watch_profile) {
    case "gravity_watch":
      value = [
        `Watch BTC dominance at ${input.dominance_pct.toFixed(2)}% in the ${input.dominance_band} gravity band.`,
        `Track whether BTC remains market rank ${input.market_cap_rank} in the published sample.`,
        `Compare alt breadth at ${input.alt_breadth_24h_pct.toFixed(1)}% with BTC dominance to assess wider participation.`,
      ];
      break;
    case "structure_watch":
      value = [
        `Track the published ${input.regime_label} regime as the structural frame.`,
        `Read liquidity state ${input.liquidity_state} beside stablecoin share ${input.stablecoin_share_pct.toFixed(2)}%.`,
        `Track alt breadth at ${input.alt_breadth_24h_pct.toFixed(1)}% as the width of current participation.`,
      ];
      break;
    case "pressure_watch":
      value = [
        pressureLine(input),
        `Read stablecoin share ${input.stablecoin_share_pct.toFixed(2)}% as reserve posture around current pressure.`,
        `Temporal state ${input.temporal_state} limits the pressure context.`,
        "Pressure observations remain descriptive and non-predictive.",
      ];
      break;
    case "temporal_watch":
      value = [
        `Observe ${input.observation_date} as the bounded UTC temporal frame.`,
        `Temporal state ${input.temporal_state} remains the approved timing context.`,
        pressureLine(input),
        "Temporal context remains descriptive and does not imply future timing.",
      ];
      break;
    case "overview_watch":
      value = [
        `Watch BTC dominance at ${input.dominance_pct.toFixed(2)}%.`,
        `Watch liquidity state ${input.liquidity_state}.`,
        `Watch alt breadth at ${input.alt_breadth_24h_pct.toFixed(1)}%.`,
        `Watch source freshness state ${input.freshness}.`,
      ];
      break;
    default:
      return { ok: false, code: "unsupported_watch_profile", message: "Watch profile is unsupported." };
  }

  if (value.length < 2 || value.length > 4 || value.some((item) => !isNonEmptyString(item, 600))) {
    return { ok: false, code: "watch_contract_failed", message: "Watch output failed the bounded contract." };
  }
  return { ok: true, value };
}
