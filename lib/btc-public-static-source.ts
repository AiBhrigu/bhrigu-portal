import type {
  BtcFailureCode,
  BtcPublicBoundary,
  FreshnessState,
  SourceProofItem,
} from "./btc-public-output-contract";

export const BTC_SOURCE_BASE = "https://aibhrigu.github.io/phi-cosmography-open/crypto-astro/data";
export const BTC_SOURCE_URLS = {
  snapshot: `${BTC_SOURCE_BASE}/crypto_astro_snapshot.public.json`,
  proof: `${BTC_SOURCE_BASE}/crypto_astro_snapshot_proof.public.json`,
  marketField: `${BTC_SOURCE_BASE}/market_field_snapshot.public.v0_1.json`,
} as const;

export const REQUIRED_PROOF_LABELS = [
  "coingecko_global",
  "coingecko_asset_markets_btc_eth_sol_ton_icp",
  "coingecko_top250_markets",
  "coingecko_stablecoin_sample",
  "defillama_protocols",
  "defillama_dex_overview",
  "defillama_stablecoins",
] as const;

const MAX_FETCH_MS = 4000;
const MAX_COMPATIBILITY_SECONDS = 300;
const FUTURE_TOLERANCE_SECONDS = 300;
const FRESH_HOURS = 72;
const STALE_LIMITED_HOURS = 24 * 7;

export type CanonicalSnapshot = {
  schema_version: "crypto_astro_snapshot_public_v0_1";
  generated_at_utc: string;
  source_mode: "static_public_snapshot";
  market_reality: {
    total_market_cap_usd: number;
    volume_24h_usd: number;
    market_cap_change_24h_pct: number;
    btc_dominance_pct: number;
    stablecoin_share_pct: number;
  };
  field_output: {
    market_field_score: number;
    regime_label: string;
    direction_bias: string;
  };
  liquidity_tvl: {
    liquidity_context_state: string;
  };
  altcoin_rotation: {
    alt_breadth_24h_pct: number;
  };
  public_samples: {
    assets: {
      BTC: {
        price_usd: number;
        market_cap_rank: number;
        market_24h_change_pct: number;
        market_7d_change_pct: number;
        market_30d_change_pct: number;
        market_context_label: string;
        score: number;
      };
    };
  };
  boundary: BtcPublicBoundary;
};

export type SnapshotProof = {
  schema_version: "crypto_astro_snapshot_proof_public_v0_1";
  generated_at_utc: string;
  source_mode: "static_public_snapshot";
  sources: SourceProofItem[];
  boundary: BtcPublicBoundary;
};

export type MarketFieldSnapshot = {
  schema_version: "crypto_astro_market_field_public_v0_1";
  updated_at_utc: string;
  source_mode: "static_public_snapshot";
  derived_from: "site/crypto-astro/data/crypto_astro_snapshot.public.json";
  derived_status: "DERIVED_FROM_CANONICAL_SNAPSHOT";
  vectors: {
    M_market: {
      liquidity_health?: string;
    };
    CT_temporal: {
      state: string;
    };
  };
  field_output: {
    market_field_score: number;
    regime_label: string;
    direction_bias: string;
  };
  cosmographer_read: Record<string, unknown>;
  boundary: BtcPublicBoundary;
};

export type BtcSourceBundle = {
  ok: true;
  snapshot: CanonicalSnapshot;
  proof: SnapshotProof;
  marketField: MarketFieldSnapshot;
  freshness: FreshnessState;
  age_hours: number;
};

export type BtcSourceFailure = {
  ok: false;
  code: BtcFailureCode;
  message: string;
  last_verified_at_utc?: string;
};

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

function finiteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function finiteInRange(value: unknown, min: number, max: number): value is number {
  return finiteNumber(value) && value >= min && value <= max;
}

function nonEmptyString(value: unknown, maxLength = 512): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.length <= maxLength;
}

function utcTimestamp(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value)) return false;
  return Number.isFinite(new Date(value).getTime());
}

function httpsUrl(value: unknown): value is string {
  if (typeof value !== "string" || value.length > 2048) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && Boolean(url.hostname) && !url.username && !url.password;
  } catch {
    return false;
  }
}

function hasBoundary(boundary: unknown): boundary is BtcPublicBoundary {
  if (!isRecord(boundary) || !hasExactKeys(boundary, BOUNDARY_KEYS)) return false;
  return boundary.read_only === true
    && boundary.static_public_snapshot === true
    && boundary.no_live_adapter_claim === true
    && boundary.no_true_live_feed_claim === true
    && boundary.no_trading_signal === true
    && boundary.no_forecast === true
    && boundary.no_price_target === true
    && boundary.no_investment_recommendation === true
    && boundary.backend_api_closed === true
    && boundary.runtime_closed === true
    && boundary.payment_closed === true
    && boundary.orion_core_protected === true
    && boundary.formula_weights_exposed === false;
}

function validProofItem(value: unknown): value is SourceProofItem {
  if (!isRecord(value) || !hasExactKeys(value, ["label", "url", "status", "fetched_at_utc", "sha256", "bytes"])) return false;
  return nonEmptyString(value.label, 120)
    && httpsUrl(value.url)
    && value.status === "PASS"
    && utcTimestamp(value.fetched_at_utc)
    && typeof value.sha256 === "string"
    && /^[a-f0-9]{64}$/.test(value.sha256)
    && Number.isInteger(value.bytes)
    && (value.bytes as number) > 0;
}

export function validateCanonicalSnapshot(value: unknown): value is CanonicalSnapshot {
  if (!isRecord(value)) return false;
  if (value.schema_version !== "crypto_astro_snapshot_public_v0_1" || value.source_mode !== "static_public_snapshot") return false;
  if (!utcTimestamp(value.generated_at_utc)) return false;

  if (!isRecord(value.market_reality)) return false;
  const market = value.market_reality;
  if (!finiteNumber(market.total_market_cap_usd) || market.total_market_cap_usd < 0) return false;
  if (!finiteNumber(market.volume_24h_usd) || market.volume_24h_usd < 0) return false;
  if (!finiteNumber(market.market_cap_change_24h_pct)) return false;
  if (!finiteInRange(market.btc_dominance_pct, 0, 100)) return false;
  if (!finiteInRange(market.stablecoin_share_pct, 0, 100)) return false;

  if (!isRecord(value.field_output)) return false;
  if (!finiteNumber(value.field_output.market_field_score)) return false;
  if (!nonEmptyString(value.field_output.regime_label, 160) || !nonEmptyString(value.field_output.direction_bias, 160)) return false;

  if (!isRecord(value.liquidity_tvl) || !nonEmptyString(value.liquidity_tvl.liquidity_context_state, 160)) return false;
  if (!isRecord(value.altcoin_rotation) || !finiteInRange(value.altcoin_rotation.alt_breadth_24h_pct, 0, 100)) return false;

  if (!isRecord(value.public_samples) || !isRecord(value.public_samples.assets) || !isRecord(value.public_samples.assets.BTC)) return false;
  const btc = value.public_samples.assets.BTC;
  if (!finiteNumber(btc.price_usd) || btc.price_usd < 0) return false;
  if (!Number.isInteger(btc.market_cap_rank) || (btc.market_cap_rank as number) < 1) return false;
  if (!finiteNumber(btc.market_24h_change_pct) || !finiteNumber(btc.market_7d_change_pct) || !finiteNumber(btc.market_30d_change_pct)) return false;
  if (!nonEmptyString(btc.market_context_label, 160) || !finiteNumber(btc.score)) return false;

  return hasBoundary(value.boundary);
}

export function validateSnapshotProof(value: unknown): value is SnapshotProof {
  if (!isRecord(value)) return false;
  if (value.schema_version !== "crypto_astro_snapshot_proof_public_v0_1" || value.source_mode !== "static_public_snapshot") return false;
  if (!utcTimestamp(value.generated_at_utc) || !Array.isArray(value.sources) || value.sources.length !== REQUIRED_PROOF_LABELS.length) return false;
  if (!value.sources.every(validProofItem)) return false;
  const labels = new Set(value.sources.map((item) => item.label));
  if (labels.size !== REQUIRED_PROOF_LABELS.length || REQUIRED_PROOF_LABELS.some((label) => !labels.has(label))) return false;
  return hasBoundary(value.boundary);
}

export function validateMarketField(value: unknown): value is MarketFieldSnapshot {
  if (!isRecord(value)) return false;
  if (value.schema_version !== "crypto_astro_market_field_public_v0_1" || value.source_mode !== "static_public_snapshot") return false;
  if (value.derived_from !== "site/crypto-astro/data/crypto_astro_snapshot.public.json" || value.derived_status !== "DERIVED_FROM_CANONICAL_SNAPSHOT") return false;
  if (!utcTimestamp(value.updated_at_utc)) return false;

  if (!isRecord(value.vectors) || !isRecord(value.vectors.M_market) || !isRecord(value.vectors.CT_temporal)) return false;
  const marketVector = value.vectors.M_market;
  if (Object.prototype.hasOwnProperty.call(marketVector, "liquidity_health") && !nonEmptyString(marketVector.liquidity_health, 160)) return false;
  if (!nonEmptyString(value.vectors.CT_temporal.state, 160)) return false;

  if (!isRecord(value.field_output)) return false;
  if (!finiteNumber(value.field_output.market_field_score)) return false;
  if (!nonEmptyString(value.field_output.regime_label, 160) || !nonEmptyString(value.field_output.direction_bias, 160)) return false;
  if (!isRecord(value.cosmographer_read)) return false;
  return hasBoundary(value.boundary);
}

function compatible(a: string, b: string): boolean {
  const aMs = new Date(a).getTime();
  const bMs = new Date(b).getTime();
  return Number.isFinite(aMs) && Number.isFinite(bMs) && Math.abs(aMs - bMs) <= MAX_COMPATIBILITY_SECONDS * 1000;
}

export function determineFreshness(generatedAt: string, now = new Date()): { state: FreshnessState; ageHours: number } {
  const generatedMs = new Date(generatedAt).getTime();
  const ageMs = now.getTime() - generatedMs;
  if (!Number.isFinite(generatedMs) || !Number.isFinite(ageMs) || ageMs < -FUTURE_TOLERANCE_SECONDS * 1000) {
    return { state: "UNAVAILABLE", ageHours: Number.NaN };
  }
  const ageHours = Math.max(0, ageMs / 3600000);
  if (ageHours <= FRESH_HOURS) return { state: "FRESH", ageHours };
  if (ageHours <= STALE_LIMITED_HOURS) return { state: "STALE_LIMITED", ageHours };
  return { state: "UNAVAILABLE", ageHours };
}

async function fetchJson(url: string, fetchImpl: typeof fetch): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), MAX_FETCH_MS);
  try {
    const response = await fetchImpl(url, {
      signal: controller.signal,
      headers: { accept: "application/json" },
      cache: "no-store",
    });
    if (!response.ok) throw Object.assign(new Error(`HTTP_${response.status}`), { code: "source_missing" });
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}

export async function loadBtcStaticSource(options: { fetchImpl?: typeof fetch; now?: Date } = {}): Promise<BtcSourceBundle | BtcSourceFailure> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const now = options.now ?? new Date();
  let values: unknown[];
  try {
    values = await Promise.all([
      fetchJson(BTC_SOURCE_URLS.snapshot, fetchImpl),
      fetchJson(BTC_SOURCE_URLS.proof, fetchImpl),
      fetchJson(BTC_SOURCE_URLS.marketField, fetchImpl),
    ]);
  } catch (error) {
    const timeout = error instanceof Error && (error.name === "AbortError" || /abort/i.test(error.message));
    return {
      ok: false,
      code: timeout ? "source_timeout" : "source_missing",
      message: timeout ? "Published snapshot request timed out." : "Published snapshot artifact is unavailable.",
    };
  }

  const [snapshot, proof, marketField] = values;
  if (!validateCanonicalSnapshot(snapshot) || !validateMarketField(marketField)) {
    return { ok: false, code: "source_schema_invalid", message: "Published market artifacts failed the locked public schema." };
  }
  if (!validateSnapshotProof(proof)) {
    return {
      ok: false,
      code: "proof_failed",
      message: "Source proof is missing, incomplete, malformed, or not PASS.",
      last_verified_at_utc: isRecord(proof) && utcTimestamp(proof.generated_at_utc) ? proof.generated_at_utc : undefined,
    };
  }
  if (!compatible(snapshot.generated_at_utc, proof.generated_at_utc) || !compatible(snapshot.generated_at_utc, marketField.updated_at_utc)) {
    return {
      ok: false,
      code: "snapshot_incompatible",
      message: "Published artifacts are not timestamp-compatible.",
      last_verified_at_utc: snapshot.generated_at_utc,
    };
  }

  const freshness = determineFreshness(snapshot.generated_at_utc, now);
  if (freshness.state === "UNAVAILABLE") {
    return {
      ok: false,
      code: "snapshot_too_old",
      message: "The latest verified public snapshot is outside the seven-day or future-tolerance product boundary.",
      last_verified_at_utc: snapshot.generated_at_utc,
    };
  }
  return {
    ok: true,
    snapshot,
    proof,
    marketField,
    freshness: freshness.state,
    age_hours: freshness.ageHours,
  };
}
