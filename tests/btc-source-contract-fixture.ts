import type { BtcPublicBoundary } from "../lib/btc-public-output-contract";
import {
  BTC_SOURCE_URLS,
  REQUIRED_PROOF_LABELS,
  loadBtcStaticSource,
  validateMarketField,
  type CanonicalSnapshot,
  type PublicMarketFieldSnapshot,
  type SnapshotProof,
} from "../lib/btc-public-static-source";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

const boundary: BtcPublicBoundary = {
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
};

const generated = "2026-07-19T18:26:56Z";

const snapshot: CanonicalSnapshot = {
  schema_version: "crypto_astro_snapshot_public_v0_1",
  generated_at_utc: generated,
  source_mode: "static_public_snapshot",
  market_reality: {
    total_market_cap_usd: 2287417777937.722,
    volume_24h_usd: 40712299730.51023,
    market_cap_change_24h_pct: -0.0231,
    btc_dominance_pct: 56.5001,
    stablecoin_share_pct: 13.5004,
  },
  field_output: {
    market_field_score: 61,
    regime_label: "Balanced Expansion",
    direction_bias: "Neutral to Bullish",
  },
  liquidity_tvl: { liquidity_context_state: "context fresh" },
  altcoin_rotation: { alt_breadth_24h_pct: 34.5 },
  public_samples: {
    assets: {
      BTC: {
        price_usd: 117000,
        market_cap_rank: 1,
        market_24h_change_pct: 0.4,
        market_7d_change_pct: 2.1,
        market_30d_change_pct: 4.8,
        market_context_label: "low_movement",
        score: 61,
      },
    },
  },
  boundary,
};

const proof: SnapshotProof = {
  schema_version: "crypto_astro_snapshot_proof_public_v0_1",
  generated_at_utc: generated,
  source_mode: "static_public_snapshot",
  sources: REQUIRED_PROOF_LABELS.map((label, index) => ({
    label,
    url: `https://example.com/source-${index}`,
    status: "PASS" as const,
    fetched_at_utc: generated,
    sha256: "a".repeat(64),
    bytes: index + 1,
  })),
  boundary,
};

const marketField: PublicMarketFieldSnapshot = {
  schema_version: "crypto_astro_market_field_public_v0_2",
  snapshot_mode: "public_safe_market_field",
  updated_at_utc: generated,
  source_mode: "static_public_snapshot",
  derived_from: "site/crypto-astro/data/crypto_astro_snapshot.public.json",
  derived_status: "DERIVED_FROM_CANONICAL_SNAPSHOT",
  vectors: {
    A_membrane: { state: "prepared_inactive", public_input: false, disclosure: "status_only" },
    E_membrane: { state: "prepared_inactive", public_input: false, disclosure: "status_only" },
    M_market: { state: "market_vector_active", liquidity_health: "context fresh" },
    CT_context: {
      state: "bounded",
      observation_window: "public_context",
      phase_context: "public_context",
      provenance: "source_bound",
      pipeline: "sealed",
    },
  },
  field_output: {
    market_field_score: 61,
    regime_label: "Balanced Expansion",
    direction_bias: "Neutral to Bullish",
  },
  cosmographer_read: { state: "Balanced Expansion" },
  boundary,
};

assert(validateMarketField(marketField), "Valid public v0.2 market-field packet was rejected");

const oldSchema = clone(marketField) as unknown as Record<string, unknown>;
oldSchema.schema_version = "crypto_astro_market_field_public_v0_1";
assert(!validateMarketField(oldSchema), "Legacy v0.1 packet was accepted");

const unsealed = clone(marketField);
unsealed.vectors.CT_context.pipeline = "open" as "sealed";
assert(!validateMarketField(unsealed), "Unsealed CT context was accepted");

const leakedLegacyKey = clone(marketField) as unknown as { vectors: Record<string, unknown> };
leakedLegacyKey.vectors.CT_temporal = { state: "legacy" };
assert(!validateMarketField(leakedLegacyKey), "Legacy CT_temporal key was accepted from the public packet");

const wrongMembrane = clone(marketField);
wrongMembrane.vectors.A_membrane.state = "active" as "prepared_inactive";
assert(!validateMarketField(wrongMembrane), "Active public A membrane was accepted");

const payloads = new Map<string, unknown>([
  [BTC_SOURCE_URLS.snapshot, snapshot],
  [BTC_SOURCE_URLS.proof, proof],
  [BTC_SOURCE_URLS.marketField, marketField],
]);

const fetchImpl = (async (input: unknown) => {
  const url = String(input);
  const value = payloads.get(url);
  if (!value) return { ok: false, status: 404, json: async () => ({}) } as Response;
  return { ok: true, status: 200, json: async () => clone(value) } as Response;
}) as typeof fetch;

async function run(): Promise<void> {
  const loaded = await loadBtcStaticSource({ fetchImpl, now: new Date("2026-07-20T00:00:00Z") });
  assert(loaded.ok, "Valid v0.2 source bundle failed to load");
  assert(loaded.marketField.schema_version === "crypto_astro_market_field_public_v0_2", "Loaded schema drifted");
  assert(loaded.marketField.vectors.CT_context.pipeline === "sealed", "Sealed context was lost");
  assert(loaded.marketField.vectors.CT_temporal.state === "bounded", "Internal temporal compatibility alias was not synthesized");
  assert(!Object.prototype.hasOwnProperty.call(marketField.vectors, "CT_temporal"), "Public fixture was mutated with a legacy key");

  const incompatiblePayloads = new Map(payloads);
  incompatiblePayloads.set(BTC_SOURCE_URLS.marketField, { ...marketField, updated_at_utc: "2026-07-19T17:00:00Z" });
  const incompatibleFetch = (async (input: unknown) => ({
    ok: true,
    status: 200,
    json: async () => clone(incompatiblePayloads.get(String(input))),
  })) as typeof fetch;
  const incompatible = await loadBtcStaticSource({ incompatibleFetch, now: new Date("2026-07-20T00:00:00Z") } as never);
  assert(incompatible.ok === false && incompatible.code === "snapshot_incompatible", "Timestamp incompatibility did not fail closed");

  process.stdout.write("BTC_SOURCE_CONTRACT_V0_2_FIXTURE=PASS\n");
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
