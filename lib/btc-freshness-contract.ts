export const BTC_MARKET_SNAPSHOT_FRESHNESS_CONTRACT_ID = "btc_market_snapshot_freshness_24h_168h_v0_1" as const;
export const BTC_MARKET_SNAPSHOT_FRESH_HOURS = 24 as const;
export const BTC_MARKET_SNAPSHOT_OPERATIONAL_BREACH_HOURS = 48 as const;
export const BTC_MARKET_SNAPSHOT_LEGACY_72H_PROBE_HOURS = 72 as const;
export const BTC_MARKET_SNAPSHOT_UNAVAILABLE_AFTER_HOURS = 168 as const;
export const BTC_MARKET_SNAPSHOT_FUTURE_TOLERANCE_SECONDS = 300 as const;

export type BtcMarketSnapshotFreshnessState = "FRESH" | "STALE_LIMITED" | "UNAVAILABLE";
export type BtcMarketSnapshotFreshnessReason = "OK" | "INVALID_TIMESTAMP" | "FUTURE_TIMESTAMP" | "TOO_OLD";

export type BtcMarketSnapshotFreshnessResult = {
  state: BtcMarketSnapshotFreshnessState;
  ageHours: number;
  reason: BtcMarketSnapshotFreshnessReason;
};

export function classifyBtcMarketSnapshotFreshness(
  generatedAt: string,
  now = new Date(),
): BtcMarketSnapshotFreshnessResult {
  const generatedMs = new Date(generatedAt).getTime();
  const ageMs = now.getTime() - generatedMs;
  if (!Number.isFinite(generatedMs) || !Number.isFinite(ageMs)) {
    return { state: "UNAVAILABLE", ageHours: Number.NaN, reason: "INVALID_TIMESTAMP" };
  }
  const rawAgeHours = ageMs / 3_600_000;
  if (ageMs < -BTC_MARKET_SNAPSHOT_FUTURE_TOLERANCE_SECONDS * 1000) {
    return { state: "UNAVAILABLE", ageHours: rawAgeHours, reason: "FUTURE_TIMESTAMP" };
  }
  const ageHours = Math.max(0, rawAgeHours);
  if (ageHours <= BTC_MARKET_SNAPSHOT_FRESH_HOURS) {
    return { state: "FRESH", ageHours, reason: "OK" };
  }
  if (ageHours <= BTC_MARKET_SNAPSHOT_UNAVAILABLE_AFTER_HOURS) {
    return { state: "STALE_LIMITED", ageHours, reason: "OK" };
  }
  return { state: "UNAVAILABLE", ageHours, reason: "TOO_OLD" };
}
