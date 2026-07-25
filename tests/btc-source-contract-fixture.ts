declare const process: { stdout: { write(value: string): void }; exit(code: number): never };

import type { BtcPublicBoundary } from "../lib/btc-public-output-contract";
import { BTC_BILINGUAL_EXAMPLE_ROUTES } from "../lib/btc-public-language-contract";
import { formatBtcSnapshotTruth } from "../lib/btc-public-surface-format";
import {
  BTC_SOURCE_URLS,
  REQUIRED_PROOF_LABELS,
  determineFreshness,
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

const fetchCaches: Array<RequestCache | undefined> = [];
const fetchImpl = (async (input: unknown, init?: RequestInit) => {
  fetchCaches.push(init?.cache);
  const url = String(input);
  const value = payloads.get(url);
  if (!value) return { ok: false, status: 404, json: async () => ({}) } as Response;
  return { ok: true, status: 200, json: async () => clone(value) } as Response;
}) as typeof fetch;

function freshnessAt(ageSeconds: number) {
  const base = new Date("2026-07-25T00:00:00Z");
  const observed = new Date(base.getTime() + ageSeconds * 1000);
  return determineFreshness(base.toISOString(), observed).state;
}

async function run(): Promise<void> {
  assert(freshnessAt(23 * 3600 + 59 * 60 + 59) === "FRESH", "23:59:59 must be FRESH");
  assert(freshnessAt(24 * 3600) === "FRESH", "24h exact must be FRESH");
  assert(freshnessAt(24 * 3600 + 1) === "STALE_LIMITED", "24h plus 1s must be STALE_LIMITED");
  assert(freshnessAt(72 * 3600) === "STALE_LIMITED", "72h must be STALE_LIMITED");
  assert(freshnessAt(168 * 3600) === "STALE_LIMITED", "168h exact must be STALE_LIMITED");
  assert(freshnessAt(168 * 3600 + 1) === "UNAVAILABLE", "168h plus 1s must be UNAVAILABLE");
  assert(determineFreshness("2026-07-25T00:10:01Z", new Date("2026-07-25T00:00:00Z")).state === "UNAVAILABLE", "Future timestamp over tolerance must be UNAVAILABLE");

  const loaded = await loadBtcStaticSource({ fetchImpl, now: new Date("2026-07-20T00:00:00Z") });
  assert(loaded.ok, "Valid v0.2 source bundle failed to load");
  assert(loaded.marketField.schema_version === "crypto_astro_market_field_public_v0_2", "Loaded schema drifted");
  assert(loaded.marketField.vectors.CT_context.pipeline === "sealed", "Sealed context was lost");
  assert(loaded.marketField.vectors.CT_temporal.state === "bounded", "Internal temporal compatibility alias was not synthesized");
  assert(!Object.prototype.hasOwnProperty.call(marketField.vectors, "CT_temporal"), "Public fixture was mutated with a legacy key");
  assert(fetchCaches.length === 3 && fetchCaches.every((value) => value === "no-store"), "Producer packet fetches must preserve cache no-store");

  const staleGenerated = "2026-07-17T00:00:00Z";
  const selfDeclaredFresh = { ...clone(snapshot), generated_at_utc: staleGenerated, freshness_status: "FRESH" } as CanonicalSnapshot & { freshness_status: string };
  const staleProof = { ...clone(proof), generated_at_utc: staleGenerated, sources: proof.sources.map((item) => ({ ...item, fetched_at_utc: staleGenerated })) };
  const staleField = { ...clone(marketField), updated_at_utc: staleGenerated };
  const stalePayloads = new Map<string, unknown>([
    [BTC_SOURCE_URLS.snapshot, selfDeclaredFresh],
    [BTC_SOURCE_URLS.proof, staleProof],
    [BTC_SOURCE_URLS.marketField, staleField],
  ]);
  const staleFetch = (async (input: unknown) => ({ ok: true, status: 200, json: async () => clone(stalePayloads.get(String(input))) })) as typeof fetch;
  const computedStale = await loadBtcStaticSource({ fetchImpl: staleFetch, now: new Date("2026-07-20T00:00:00Z") });
  assert(computedStale.ok && computedStale.freshness === "STALE_LIMITED", "Producer freshness_status overrode computed age");

  const enFresh = formatBtcSnapshotTruth("en", "FRESH", "2026-07-25T05:23:18Z", 2, true);
  assert(enFresh.stateLabel === "Current verified snapshot", "English FRESH label drifted");
  assert(enFresh.snapshotLine === "Snapshot · 25 Jul 2026 · 05:23 UTC", "Exact English timestamp is not visible");
  assert(enFresh.ageLine === null, "Fresh English snapshot exposed a stale age line");
  assert(enFresh.proofLine === "Source proof available", "English source-proof label drifted");

  const ruFresh = formatBtcSnapshotTruth("ru", "FRESH", "2026-07-25T05:23:18Z", 2, true);
  assert(ruFresh.stateLabel === "Актуальный проверенный снимок", "Russian FRESH label drifted");
  assert(ruFresh.snapshotLine === "Снимок · 25 июл 2026 · 05:23 UTC", "Exact Russian timestamp is not visible");
  assert(ruFresh.proofLine === "Подтверждение источников доступно", "Russian source-proof label drifted");

  const enStale = formatBtcSnapshotTruth("en", "STALE_LIMITED", "2026-07-23T00:00:00Z", 72, true);
  assert(enStale.stateLabel === "Stale verified snapshot" && enStale.ageLine === "Age · 72 hours", "English stale state or age is incorrect");
  assert(!/\bcurrent\b|\bfresh\b/i.test(enStale.stateLabel), "English stale label claims current/fresh");
  const ruStale = formatBtcSnapshotTruth("ru", "STALE_LIMITED", "2026-07-23T00:00:00Z", 72, true);
  assert(ruStale.stateLabel === "Устаревший проверенный снимок" && ruStale.ageLine === "Возраст данных · 72 ч", "Russian stale state or age is incorrect");
  assert(!/актуальн|свеж/i.test(ruStale.stateLabel), "Russian stale label claims актуальный/свежий");

  assert(BTC_BILINGUAL_EXAMPLE_ROUTES.en.length === 5 && BTC_BILINGUAL_EXAMPLE_ROUTES.ru.length === 5, "EN/RU route examples were not preserved");
  assert(BTC_BILINGUAL_EXAMPLE_ROUTES.en.map((item) => item.id).join(",") === BTC_BILINGUAL_EXAMPLE_ROUTES.ru.map((item) => item.id).join(","), "EN/RU route identifiers diverged");

  const incompatiblePayloads = new Map(payloads);
  incompatiblePayloads.set(BTC_SOURCE_URLS.marketField, { ...marketField, updated_at_utc: "2026-07-19T17:00:00Z" });
  const incompatibleFetch = (async (input: unknown) => ({
    ok: true,
    status: 200,
    json: async () => clone(incompatiblePayloads.get(String(input))),
  })) as typeof fetch;
  const incompatible = await loadBtcStaticSource({ fetchImpl: incompatibleFetch, now: new Date("2026-07-20T00:00:00Z") });
  assert(incompatible.ok === false && incompatible.code === "snapshot_incompatible", "Timestamp incompatibility did not fail closed");

  process.stdout.write("BTC_SOURCE_CONTRACT_V0_2_FIXTURE=PASS\n");
  process.stdout.write("BTC_FRESHNESS_TRUTH_CONTRACT_V0_1=PASS\n");
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
