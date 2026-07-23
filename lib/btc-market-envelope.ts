export const PHI_CONSTANT = 1.61803398875 as const;
export const PHI_PRIMARY_FIELD_PCT = 61.803398875 as const;
export const PHI_SUPPORT_FIELD_PCT = 38.196601125 as const;
export const BTC_MARKET_ENVELOPE_SCHEMA = "bhrigu_btc_market_envelope_v0_1" as const;

export const BTC_MARKET_ENVELOPE_URLS = {
  snapshot:
    "https://aibhrigu.github.io/phi-cosmography-open/crypto-astro/data/crypto_astro_snapshot.public.json",
  proof:
    "https://aibhrigu.github.io/phi-cosmography-open/crypto-astro/data/crypto_astro_snapshot_proof.public.json",
  marketField:
    "https://aibhrigu.github.io/phi-cosmography-open/crypto-astro/data/market_field_snapshot.public.v0_1.json",
  bindings:
    "https://aibhrigu.github.io/phi-cosmography-open/crypto-astro/data/crypto_astro_module_bindings.public.json",
  registry:
    "https://aibhrigu.github.io/phi-cosmography-open/crypto-astro/data/crypto_astro_snapshot_registry.public.json",
  delta:
    "https://aibhrigu.github.io/phi-cosmography-open/crypto-astro/data/crypto_astro_snapshot_delta.public.json",
} as const;

const MEMORY_METRIC_IDS = [
  "btc_gravity_pct",
  "stablecoin_share_pct",
  "alt_breadth_24h_pct",
  "alt_breadth_7d_pct",
  "market_field_score",
  "regime_label",
  "defi_tvl_usd",
  "liquidity_context_state",
] as const;

export const BTC_GOLDEN_MODULE_IDS = [
  "market_structure",
  "liquidity_membrane",
  "change_event_memory",
  "temporal_context",
  "cosmographer_review",
] as const;

export type BtcGoldenModuleId = (typeof BTC_GOLDEN_MODULE_IDS)[number];
export type BtcEnvelopeQuestionClass =
  | "btc_gravity"
  | "market_structure"
  | "liquidity"
  | "market_participation_rotation"
  | "change_memory"
  | "temporal_pressure"
  | "general_btc_field";
export type BtcSignalDirection =
  | "UP"
  | "DOWN"
  | "UNCHANGED"
  | "BOUNDED"
  | "UNAVAILABLE";
export type BtcSynthesisState =
  | "CONFIRMATION"
  | "DIVERGENCE"
  | "INSUFFICIENT_EVIDENCE";

export type BtcEnvelopeTemporalInput = {
  state: "available_bounded" | "static_state_only" | "unavailable";
  label: string;
  harmonic_tension: number | null;
};

export type BtcMarketEnvelopeDocuments = {
  snapshot: unknown;
  proof: unknown;
  marketField: unknown;
  bindings: unknown;
  registry: unknown;
  delta: unknown;
  previousSnapshot?: unknown;
};

export type BtcMarketEnvelopeFailure = {
  ok: false;
  code:
    | "source_missing"
    | "source_timeout"
    | "source_schema_invalid"
    | "source_incompatible"
    | "snapshot_too_old"
    | "memory_incompatible";
  message: string;
  last_verified_at_utc?: string;
};

export type BtcMetricDelta = {
  metric_id: string;
  type: "NUMERIC" | "CATEGORICAL";
  status: "COMPARABLE";
  current_value: string;
  previous_value: string;
  direction: BtcSignalDirection;
  display_delta: string | null;
  transition: string | null;
  unit: string;
  methodology_id: string;
  proof_sources: string[];
};

type Checkpoint = {
  role: "previous" | "current";
  accepted_at_utc: string;
  commit_sha: string;
  snapshot_id: string;
  btc_price_usd: number;
  btc_dominance_pct: number;
  alt_breadth_24h_pct: number;
  alt_breadth_7d_pct: number;
  stablecoin_share_pct: number;
  market_field_score: number;
  regime: string;
};

type GoldenNode = {
  id: BtcGoldenModuleId;
  index: "01" | "02" | "03" | "04" | "05";
  label: string;
  role: "primary" | "supporting" | "unavailable";
  state: BtcSignalDirection;
  evidence: string[];
};

export type BtcMarketEnvelope = {
  schema_version: typeof BTC_MARKET_ENVELOPE_SCHEMA;
  generated_at_utc: string;
  question_class: BtcEnvelopeQuestionClass;
  phi_geometry: {
    phi_constant: typeof PHI_CONSTANT;
    primary_field_pct: typeof PHI_PRIMARY_FIELD_PCT;
    support_field_pct: typeof PHI_SUPPORT_FIELD_PCT;
    nodes: GoldenNode[];
  };
  route: {
    route_version: "btc_module_applicability_route_v0_1";
    primary_modules: readonly [BtcGoldenModuleId, BtcGoldenModuleId];
    supporting_modules: BtcGoldenModuleId[];
    unavailable_modules: BtcGoldenModuleId[];
    watch_profile: string;
    narrative_profile: string;
    safety_boundary: "PUBLIC_RESEARCH_CONTEXT_ONLY";
  };
  current: {
    price_usd: number;
    change_24h_pct: number;
    change_7d_pct: number;
    change_30d_pct: number;
    btc_dominance_pct: number;
    total_market_cap_usd: number;
    total_market_volume_24h_usd: number;
    market_cap_change_24h_pct: number;
    stablecoin_cap_usd: number;
    stablecoin_share_pct: number;
    market_field_score: number;
    regime: string;
    direction_bias: string;
    alt_breadth_24h_pct: number;
    alt_breadth_7d_pct: number;
    eth_rotation_anchor_pct: number;
    top_10_flow_concentration_pct: number;
    defi_tvl_usd: number;
    dex_volume_24h_usd: number;
    liquidity_context_state: string;
    continuation_field: {
      base_path_pct: number;
      expansion_path_pct: number;
      compression_reversal_pct: number;
      window_label: string;
      boundary: string;
    };
    source_freshness: "FRESH" | "STALE_LIMITED";
    source_generated_at_utc: string;
    bounded_temporal_context: BtcEnvelopeTemporalInput;
  };
  memory: {
    comparison_status: string;
    current_snapshot_id: string;
    previous_snapshot_id: string;
    current_commit_sha: string;
    previous_commit_sha: string;
    comparable_metric_count: number;
    unavailable_metrics: string[];
    methodology_compatible: boolean;
    metrics: BtcMetricDelta[];
    transition_interpretation: string;
  };
  synthesis: {
    state: BtcSynthesisState;
    what_changed: string[];
    remained_stable: string[];
    confirming_modules: string[];
    contradicting_or_weakening_modules: string[];
    why_this_matters: string;
    watch_next: string[];
    uncertainty: string[];
  };
  verified_history: {
    available: boolean;
    observation_window: string;
    checkpoints: Checkpoint[];
    methodology_repair_disclosure: string;
  };
  source_proof: {
    source_mode: "static_public_snapshot";
    proof_source_count: number;
    current_snapshot_sha256: string;
    previous_snapshot_sha256: string;
    current_proof_sha256: string;
    previous_proof_sha256: string;
    current_bindings_sha256: string;
    previous_bindings_sha256: string;
    registry_url: string;
    delta_url: string;
    previous_snapshot_url: string;
  };
  inactive_modules: string[];
  boundary: {
    read_only: true;
    no_live_provider_call_during_request: true;
    no_trading_signal: true;
    no_forecast: true;
    no_price_target: true;
    no_personal_memory_claim: true;
    no_orion_exposure: true;
  };
};

export type BtcMarketEnvelopeResult =
  | { ok: true; value: BtcMarketEnvelope }
  | BtcMarketEnvelopeFailure;

const MODULE_LABELS: Record<BtcGoldenModuleId, string> = {
  market_structure: "MARKET STRUCTURE",
  liquidity_membrane: "LIQUIDITY MEMBRANE",
  change_event_memory: "CHANGE / EVENT MEMORY",
  temporal_context: "TEMPORAL CONTEXT",
  cosmographer_review: "COSMOGRAPHER REVIEW",
};

const MODULE_INDEX: Record<
  BtcGoldenModuleId,
  "01" | "02" | "03" | "04" | "05"
> = {
  market_structure: "01",
  liquidity_membrane: "02",
  change_event_memory: "03",
  temporal_context: "04",
  cosmographer_review: "05",
};

const PRIMARY_MODULES: Record<
  BtcEnvelopeQuestionClass,
  readonly [BtcGoldenModuleId, BtcGoldenModuleId]
> = {
  btc_gravity: ["market_structure", "change_event_memory"],
  market_structure: ["market_structure", "liquidity_membrane"],
  liquidity: ["liquidity_membrane", "market_structure"],
  market_participation_rotation: ["market_structure", "change_event_memory"],
  change_memory: ["change_event_memory", "market_structure"],
  temporal_pressure: ["temporal_context", "change_event_memory"],
  general_btc_field: ["market_structure", "change_event_memory"],
};

const METRIC_LABELS: Record<string, string> = {
  btc_gravity_pct: "BTC dominance",
  stablecoin_share_pct: "Stablecoin share",
  alt_breadth_24h_pct: "Alt breadth 24h",
  alt_breadth_7d_pct: "Alt breadth 7d",
  market_field_score: "Market Field Score",
  regime_label: "Regime",
  defi_tvl_usd: "DeFi TVL",
  liquidity_context_state: "Liquidity context",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isText(value: unknown, maxLength = 4096): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0 &&
    value.length <= maxLength
  );
}

function isUtcTimestamp(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value) &&
    Number.isFinite(new Date(value).getTime())
  );
}

function isSha(value: unknown, size: 40 | 64): value is string {
  return (
    typeof value === "string" &&
    new RegExp(`^[a-f0-9]{${size}}$`).test(value)
  );
}

function getPath(value: unknown, path: string): unknown {
  let cursor: unknown = value;
  for (const key of path.split(".")) {
    if (!isRecord(cursor) || !(key in cursor)) return undefined;
    cursor = cursor[key];
  }
  return cursor;
}

function getNumber(value: unknown, path: string): number | null {
  const resolved = getPath(value, path);
  return isFiniteNumber(resolved) ? resolved : null;
}

function getText(value: unknown, path: string): string | null {
  const resolved = getPath(value, path);
  return isText(resolved) ? resolved : null;
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values));
}

export function classifyBtcEnvelopeQuestion(
  question: string,
): BtcEnvelopeQuestionClass {
  const normalized = question.toLowerCase();
  if (/dominance|gravity|leadership/.test(normalized)) return "btc_gravity";
  if (/liquid|tvl|stablecoin|dex/.test(normalized)) return "liquidity";
  if (/breadth|rotation|altcoin|participation|eth/.test(normalized)) {
    return "market_participation_rotation";
  }
  if (/changed|change|memory|previous|delta|since/.test(normalized)) {
    return "change_memory";
  }
  if (/temporal|pressure|date|phase|tension/.test(normalized)) {
    return "temporal_pressure";
  }
  if (/structure|regime|field score|market cap/.test(normalized)) {
    return "market_structure";
  }
  return "general_btc_field";
}

function parseMetric(metricId: string, value: unknown): BtcMetricDelta | null {
  if (
    !isRecord(value) ||
    value.status !== "COMPARABLE" ||
    !isText(value.current_value) ||
    !isText(value.previous_value) ||
    !isText(value.methodology_id) ||
    !isText(value.unit) ||
    !Array.isArray(value.proof_sources)
  ) {
    return null;
  }

  const type =
    value.type === "NUMERIC"
      ? "NUMERIC"
      : value.type === "CATEGORICAL"
        ? "CATEGORICAL"
        : null;
  if (!type) return null;

  let direction: BtcSignalDirection = "BOUNDED";
  if (
    type === "NUMERIC" &&
    ["UP", "DOWN", "UNCHANGED"].includes(String(value.direction))
  ) {
    direction = value.direction as BtcSignalDirection;
  } else if (type === "CATEGORICAL" && value.transition === "UNCHANGED") {
    direction = "UNCHANGED";
  }

  return {
    metric_id: metricId,
    type,
    status: "COMPARABLE",
    current_value: value.current_value,
    previous_value: value.previous_value,
    direction,
    display_delta: isText(value.display_delta) ? value.display_delta : null,
    transition: isText(value.transition) ? value.transition : null,
    unit: value.unit,
    methodology_id: value.methodology_id,
    proof_sources: value.proof_sources.filter(isText),
  };
}

function buildCheckpoint(
  snapshot: unknown,
  entry: Record<string, unknown>,
  role: "previous" | "current",
): Checkpoint | null {
  const price = getNumber(snapshot, "public_samples.assets.BTC.price_usd");
  const dominance = getNumber(snapshot, "market_reality.btc_dominance_pct");
  const breadth24 = getNumber(
    snapshot,
    "altcoin_rotation.alt_breadth_24h_pct",
  );
  const breadth7 = getNumber(
    snapshot,
    "altcoin_rotation.alt_breadth_7d_pct",
  );
  const stableShare = getNumber(
    snapshot,
    "market_reality.stablecoin_share_pct",
  );
  const fieldScore = getNumber(snapshot, "field_output.market_field_score");
  const regime = getText(snapshot, "field_output.regime_label");

  if (
    price === null ||
    dominance === null ||
    breadth24 === null ||
    breadth7 === null ||
    stableShare === null ||
    fieldScore === null ||
    !regime ||
    !isUtcTimestamp(entry.generated_at_utc) ||
    getPath(snapshot, "generated_at_utc") !== entry.generated_at_utc ||
    !isSha(entry.commit_sha, 40) ||
    !isText(entry.snapshot_id)
  ) {
    return null;
  }

  return {
    role,
    accepted_at_utc: entry.generated_at_utc,
    commit_sha: entry.commit_sha,
    snapshot_id: entry.snapshot_id,
    btc_price_usd: price,
    btc_dominance_pct: dominance,
    alt_breadth_24h_pct: breadth24,
    alt_breadth_7d_pct: breadth7,
    stablecoin_share_pct: stableShare,
    market_field_score: fieldScore,
    regime,
  };
}

function formatMetricDelta(metric: BtcMetricDelta): string {
  const label =
    METRIC_LABELS[metric.metric_id] ?? metric.metric_id.replace(/_/g, " ");
  const change = metric.display_delta
    ? ` (${metric.display_delta} ${metric.unit})`
    : metric.transition
      ? ` (${metric.transition})`
      : "";
  return `${label}: ${metric.previous_value} → ${metric.current_value}${change}.`;
}

function fail(
  code: BtcMarketEnvelopeFailure["code"],
  message: string,
  lastVerified?: string,
): BtcMarketEnvelopeFailure {
  return {
    ok: false,
    code,
    message,
    ...(lastVerified ? { last_verified_at_utc: lastVerified } : {}),
  };
}

export function buildBtcMarketEnvelopeFromDocuments(
  question: string,
  documents: BtcMarketEnvelopeDocuments,
  options: { now?: Date; temporal?: BtcEnvelopeTemporalInput } = {},
): BtcMarketEnvelopeResult {
  const now = options.now ?? new Date();
  const temporal: BtcEnvelopeTemporalInput = options.temporal ?? {
    state: "unavailable",
    label: "bounded_cosmographic_metric",
    harmonic_tension: null,
  };

  const { snapshot, proof, marketField, bindings, registry, delta } =
    documents;
  if (
    ![snapshot, proof, marketField, bindings, registry, delta].every(isRecord)
  ) {
    return fail(
      "source_schema_invalid",
      "Market envelope artifacts must be JSON objects.",
    );
  }

  const snapshotRecord = snapshot as Record<string, unknown>;
  const proofRecord = proof as Record<string, unknown>;
  const fieldRecord = marketField as Record<string, unknown>;
  const bindingsRecord = bindings as Record<string, unknown>;
  const registryRecord = registry as Record<string, unknown>;
  const deltaRecord = delta as Record<string, unknown>;

  if (
    snapshotRecord.schema_version !== "crypto_astro_snapshot_public_v0_1" ||
    proofRecord.schema_version !==
      "crypto_astro_snapshot_proof_public_v0_1" ||
    fieldRecord.schema_version !== "crypto_astro_market_field_public_v0_2" ||
    bindingsRecord.schema_version !==
      "crypto_astro_public_module_bindings_v0_1" ||
    registryRecord.schema_version !==
      "crypto_astro_snapshot_registry_public_v0_2" ||
    deltaRecord.schema_version !== "crypto_astro_snapshot_delta_public_v0_2"
  ) {
    return fail(
      "source_schema_invalid",
      "One or more market envelope schemas are incompatible.",
    );
  }

  const currentRegistry = isRecord(registryRecord.current)
    ? registryRecord.current
    : null;
  const previousRegistry = isRecord(registryRecord.previous)
    ? registryRecord.previous
    : null;
  if (
    !currentRegistry ||
    !previousRegistry ||
    currentRegistry.acceptance_status !== "ACCEPTED" ||
    previousRegistry.acceptance_status !== "ACCEPTED" ||
    registryRecord.selection_policy !== "EXPLICIT_ACCEPTED_PAIR"
  ) {
    return fail(
      "memory_incompatible",
      "Snapshot Registry does not contain an explicit accepted pair.",
    );
  }

  const generatedAt = snapshotRecord.generated_at_utc;
  const synchronizedTimestamps = [
    generatedAt,
    proofRecord.generated_at_utc,
    fieldRecord.updated_at_utc,
    bindingsRecord.generated_at_utc,
    currentRegistry.generated_at_utc,
    deltaRecord.generated_at_utc,
  ];
  if (
    !synchronizedTimestamps.every(isUtcTimestamp) ||
    new Set(synchronizedTimestamps).size !== 1
  ) {
    return fail(
      "source_incompatible",
      "Current artifacts are not timestamp-compatible.",
      isUtcTimestamp(generatedAt) ? generatedAt : undefined,
    );
  }

  const ageHours =
    (now.getTime() - new Date(generatedAt as string).getTime()) / 3_600_000;
  if (!Number.isFinite(ageHours) || ageHours < -0.084) {
    return fail(
      "source_incompatible",
      "Accepted timestamp is invalid or in the future.",
      generatedAt as string,
    );
  }
  if (ageHours > 168) {
    return fail(
      "snapshot_too_old",
      "Accepted snapshot is outside the seven-day boundary.",
      generatedAt as string,
    );
  }

  if (
    getPath(snapshot, "liquidity_tvl.defi_tvl_methodology_id") !==
      "defillama_historical_chain_tvl_ex_double_count_v0_1" ||
    getPath(snapshot, "liquidity_tvl.defi_tvl_excludes_double_counted") !==
      true ||
    getPath(snapshot, "liquidity_tvl.defi_tvl_excludes_liquid_staking") !==
      true
  ) {
    return fail(
      "source_incompatible",
      "DeFi TVL methodology is not the accepted non-double-counted contract.",
    );
  }

  const proofSources = Array.isArray(proofRecord.sources)
    ? proofRecord.sources
    : [];
  if (
    proofSources.length < 7 ||
    !proofSources.every(
      (source) =>
        isRecord(source) &&
        source.status === "PASS" &&
        isText(source.label) &&
        isText(source.url),
    )
  ) {
    return fail("source_schema_invalid", "Source proof is incomplete.");
  }

  if (
    !isText(deltaRecord.current_snapshot_id) ||
    !isText(deltaRecord.previous_snapshot_id) ||
    deltaRecord.current_snapshot_id !== currentRegistry.snapshot_id ||
    deltaRecord.previous_snapshot_id !== previousRegistry.snapshot_id
  ) {
    return fail(
      "memory_incompatible",
      "Snapshot Delta is not bound to the accepted Registry pair.",
    );
  }

  const methodologies = isRecord(registryRecord.metric_methodologies)
    ? registryRecord.metric_methodologies
    : {};
  const deltaMetrics = isRecord(deltaRecord.metrics) ? deltaRecord.metrics : {};
  const unavailableMetrics = isRecord(deltaRecord.unavailable_metrics)
    ? Object.keys(deltaRecord.unavailable_metrics)
    : [];
  const comparableMetrics: BtcMetricDelta[] = [];

  for (const metricId of MEMORY_METRIC_IDS) {
    const methodology = isRecord(methodologies[metricId])
      ? methodologies[metricId]
      : null;
    if (
      !methodology ||
      methodology.comparable !== true ||
      methodology.current_methodology_id !==
        methodology.previous_methodology_id
    ) {
      unavailableMetrics.push(metricId);
      continue;
    }
    const parsed = parseMetric(metricId, deltaMetrics[metricId]);
    if (parsed) comparableMetrics.push(parsed);
    else unavailableMetrics.push(metricId);
  }

  const numericPaths = [
    "public_samples.assets.BTC.price_usd",
    "public_samples.assets.BTC.market_24h_change_pct",
    "public_samples.assets.BTC.market_7d_change_pct",
    "public_samples.assets.BTC.market_30d_change_pct",
    "market_reality.btc_dominance_pct",
    "market_reality.total_market_cap_usd",
    "market_reality.volume_24h_usd",
    "market_reality.market_cap_change_24h_pct",
    "market_reality.stablecoin_cap_usd",
    "market_reality.stablecoin_share_pct",
    "field_output.market_field_score",
    "altcoin_rotation.alt_breadth_24h_pct",
    "altcoin_rotation.alt_breadth_7d_pct",
    "altcoin_rotation.eth_rotation_anchor_pct",
    "altcoin_rotation.top_10_flow_concentration_pct",
    "liquidity_tvl.defi_tvl_usd",
    "liquidity_tvl.dex_volume_24h_usd",
    "probability_continuation.base_path_pct",
    "probability_continuation.expansion_path_pct",
    "probability_continuation.compression_reversal_pct",
  ];
  const numericValues = numericPaths.map((path) => getNumber(snapshot, path));
  if (numericValues.some((value) => value === null)) {
    return fail(
      "source_schema_invalid",
      "Required BTC market-envelope metrics are missing.",
    );
  }

  const regime = getText(snapshot, "field_output.regime_label");
  const directionBias = getText(snapshot, "field_output.direction_bias");
  const liquidityState = getText(
    snapshot,
    "liquidity_tvl.liquidity_context_state",
  );
  const windowLabel = getText(
    snapshot,
    "probability_continuation.window_label",
  );
  const continuationBoundary = getText(
    snapshot,
    "probability_continuation.boundary",
  );
  if (
    !regime ||
    !directionBias ||
    !liquidityState ||
    !windowLabel ||
    !continuationBoundary
  ) {
    return fail(
      "source_schema_invalid",
      "Required market-envelope labels are missing.",
    );
  }

  const valueAt = (index: number): number => numericValues[index] as number;
  const current: BtcMarketEnvelope["current"] = {
    price_usd: valueAt(0),
    change_24h_pct: valueAt(1),
    change_7d_pct: valueAt(2),
    change_30d_pct: valueAt(3),
    btc_dominance_pct: valueAt(4),
    total_market_cap_usd: valueAt(5),
    total_market_volume_24h_usd: valueAt(6),
    market_cap_change_24h_pct: valueAt(7),
    stablecoin_cap_usd: valueAt(8),
    stablecoin_share_pct: valueAt(9),
    market_field_score: valueAt(10),
    regime,
    direction_bias: directionBias,
    alt_breadth_24h_pct: valueAt(11),
    alt_breadth_7d_pct: valueAt(12),
    eth_rotation_anchor_pct: valueAt(13),
    top_10_flow_concentration_pct: valueAt(14),
    defi_tvl_usd: valueAt(15),
    dex_volume_24h_usd: valueAt(16),
    liquidity_context_state: liquidityState,
    continuation_field: {
      base_path_pct: valueAt(17),
      expansion_path_pct: valueAt(18),
      compression_reversal_pct: valueAt(19),
      window_label: windowLabel,
      boundary: continuationBoundary,
    },
    source_freshness: ageHours <= 72 ? "FRESH" : "STALE_LIMITED",
    source_generated_at_utc: generatedAt as string,
    bounded_temporal_context: temporal,
  };

  const questionClass = classifyBtcEnvelopeQuestion(question);
  const primaryModules = PRIMARY_MODULES[questionClass];
  const temporalUnavailable = temporal.state === "unavailable";
  const memoryUnavailable = comparableMetrics.length === 0;
  const unavailableModules: BtcGoldenModuleId[] = [];
  if (temporalUnavailable) unavailableModules.push("temporal_context");
  if (memoryUnavailable) unavailableModules.push("change_event_memory");
  const supportingModules = BTC_GOLDEN_MODULE_IDS.filter(
    (moduleId) =>
      !primaryModules.includes(moduleId) &&
      !unavailableModules.includes(moduleId),
  );

  const route: BtcMarketEnvelope["route"] = {
    route_version: "btc_module_applicability_route_v0_1",
    primary_modules: primaryModules,
    supporting_modules: supportingModules,
    unavailable_modules: unavailableModules,
    watch_profile: `${questionClass}_watch`,
    narrative_profile: `${questionClass}_read`,
    safety_boundary: "PUBLIC_RESEARCH_CONTEXT_ONLY",
  };

  const metricById = new Map(
    comparableMetrics.map((metric) => [metric.metric_id, metric] as const),
  );
  const structureSignals = [
    metricById.get("btc_gravity_pct")?.direction,
    metricById.get("alt_breadth_24h_pct")?.direction,
    metricById.get("alt_breadth_7d_pct")?.direction,
    metricById.get("market_field_score")?.direction,
  ].filter(Boolean) as BtcSignalDirection[];
  const numericMetrics = comparableMetrics.filter(
    (metric) => metric.type === "NUMERIC",
  );
  const upwardCount = numericMetrics.filter(
    (metric) => metric.direction === "UP",
  ).length;
  const downwardCount = numericMetrics.filter(
    (metric) => metric.direction === "DOWN",
  ).length;

  const marketStructureState: BtcSignalDirection =
    structureSignals.includes("UP") && structureSignals.includes("DOWN")
      ? "BOUNDED"
      : structureSignals.includes("DOWN")
        ? "DOWN"
        : structureSignals.includes("UP")
          ? "UP"
          : "UNCHANGED";
  const changeMemoryState: BtcSignalDirection = memoryUnavailable
    ? "UNAVAILABLE"
    : upwardCount && downwardCount
      ? "BOUNDED"
      : upwardCount
        ? "UP"
        : downwardCount
          ? "DOWN"
          : "UNCHANGED";

  const moduleState: Record<BtcGoldenModuleId, BtcSignalDirection> = {
    market_structure: marketStructureState,
    liquidity_membrane:
      metricById.get("defi_tvl_usd")?.direction ?? "UNAVAILABLE",
    change_event_memory: changeMemoryState,
    temporal_context: temporalUnavailable ? "UNAVAILABLE" : "BOUNDED",
    cosmographer_review: "BOUNDED",
  };

  const evidence: Record<BtcGoldenModuleId, string[]> = {
    market_structure: [
      `Market Field Score ${current.market_field_score.toFixed(1)} · ${current.regime}`,
      `BTC dominance ${current.btc_dominance_pct.toFixed(2)}%`,
      `Alt breadth ${current.alt_breadth_24h_pct.toFixed(1)}% / ${current.alt_breadth_7d_pct.toFixed(1)}%`,
    ],
    liquidity_membrane: [
      `DeFi TVL ${current.defi_tvl_usd.toFixed(0)}`,
      `DEX volume 24h ${current.dex_volume_24h_usd.toFixed(0)}`,
      `Stablecoin share ${current.stablecoin_share_pct.toFixed(2)}% · ${current.liquidity_context_state}`,
    ],
    change_event_memory: comparableMetrics
      .slice(0, 4)
      .map(formatMetricDelta),
    temporal_context: [
      temporalUnavailable
        ? "Temporal evidence unavailable"
        : temporal.state === "available_bounded"
          ? `Bounded temporal evidence${
              temporal.harmonic_tension === null
                ? ""
                : ` · tension ${temporal.harmonic_tension.toFixed(4)}`
            }`
          : "Static bounded temporal state only",
    ],
    cosmographer_review: [
      "Deterministic two-primary module route",
      "No trading, forecast, target, or execution output",
    ],
  };

  let synthesisState: BtcSynthesisState = "INSUFFICIENT_EVIDENCE";
  const selectedModules = primaryModules.concat(supportingModules);
  if (
    current.source_freshness === "FRESH" &&
    !primaryModules.some(
      (moduleId) => moduleState[moduleId] === "UNAVAILABLE",
    )
  ) {
    const containsMixedStructuralModule = selectedModules.some(
      (moduleId) =>
        [
          "market_structure",
          "liquidity_membrane",
          "change_event_memory",
        ].includes(moduleId) && moduleState[moduleId] === "BOUNDED",
    );
    const directionalSignals = selectedModules
      .map((moduleId) => moduleState[moduleId])
      .filter((state) => state === "UP" || state === "DOWN");
    synthesisState =
      containsMixedStructuralModule || new Set(directionalSignals).size > 1
        ? "DIVERGENCE"
        : directionalSignals.length >= 2
          ? "CONFIRMATION"
          : "INSUFFICIENT_EVIDENCE";
  }

  const previousCheckpoint =
    documents.previousSnapshot && isRecord(documents.previousSnapshot)
      ? buildCheckpoint(
          documents.previousSnapshot,
          previousRegistry,
          "previous",
        )
      : null;
  const currentCheckpoint = buildCheckpoint(
    snapshot,
    currentRegistry,
    "current",
  );
  const historyAvailable = Boolean(previousCheckpoint && currentCheckpoint);

  const proofHashes = [
    currentRegistry.snapshot_sha256,
    previousRegistry.snapshot_sha256,
    currentRegistry.proof_sha256,
    previousRegistry.proof_sha256,
    currentRegistry.bindings_sha256,
    previousRegistry.bindings_sha256,
  ];
  if (
    !proofHashes.every((value) => isSha(value, 64)) ||
    !isSha(currentRegistry.commit_sha, 40) ||
    !isSha(previousRegistry.commit_sha, 40)
  ) {
    return fail(
      "memory_incompatible",
      "Registry artifact anchors are malformed.",
    );
  }

  const nodes: GoldenNode[] = BTC_GOLDEN_MODULE_IDS.map((moduleId) => ({
    id: moduleId,
    index: MODULE_INDEX[moduleId],
    label: MODULE_LABELS[moduleId],
    role: unavailableModules.includes(moduleId)
      ? "unavailable"
      : primaryModules.includes(moduleId)
        ? "primary"
        : "supporting",
    state: moduleState[moduleId],
    evidence: evidence[moduleId],
  }));

  const confirmingModules =
    synthesisState === "CONFIRMATION"
      ? primaryModules.map(
          (moduleId) =>
            `${MODULE_LABELS[moduleId]}: ${evidence[moduleId][0]}`,
        )
      : selectedModules
          .filter((moduleId) => moduleState[moduleId] !== "UNAVAILABLE")
          .slice(0, 2)
          .map(
            (moduleId) =>
              `${MODULE_LABELS[moduleId]}: ${evidence[moduleId][0]}`,
          );

  const contradictions =
    synthesisState === "DIVERGENCE"
      ? [
          "Selected market modules contain opposing or internally mixed evidence.",
          "Accepted Snapshot Delta is preserved without collapsing it into one directional signal.",
        ]
      : synthesisState === "INSUFFICIENT_EVIDENCE"
        ? [
            "A primary module is stale, unavailable, neutral, or methodologically suppressed.",
          ]
        : [];

  const uniqueUnavailableMetrics = unique(unavailableMetrics);
  const previousSnapshotUrl =
    `https://raw.githubusercontent.com/AiBhrigu/phi-cosmography-open/` +
    `${previousRegistry.commit_sha}/site/crypto-astro/data/crypto_astro_snapshot.public.json`;

  const value: BtcMarketEnvelope = {
    schema_version: BTC_MARKET_ENVELOPE_SCHEMA,
    generated_at_utc: now.toISOString(),
    question_class: questionClass,
    phi_geometry: {
      phi_constant: PHI_CONSTANT,
      primary_field_pct: PHI_PRIMARY_FIELD_PCT,
      support_field_pct: PHI_SUPPORT_FIELD_PCT,
      nodes,
    },
    route,
    current,
    memory: {
      comparison_status: isText(deltaRecord.comparison_status)
        ? deltaRecord.comparison_status
        : "PARTIAL_COMPARABLE",
      current_snapshot_id: deltaRecord.current_snapshot_id as string,
      previous_snapshot_id: deltaRecord.previous_snapshot_id as string,
      current_commit_sha: currentRegistry.commit_sha,
      previous_commit_sha: previousRegistry.commit_sha,
      comparable_metric_count: comparableMetrics.length,
      unavailable_metrics: uniqueUnavailableMetrics,
      methodology_compatible: uniqueUnavailableMetrics.length === 0,
      metrics: comparableMetrics,
      transition_interpretation:
        synthesisState === "CONFIRMATION"
          ? "Accepted memory and routed modules support one bounded structural interpretation."
          : synthesisState === "DIVERGENCE"
            ? "Accepted memory contains opposing module movements; the BTC field is structurally mixed."
            : "The accepted pair cannot support a strong transition interpretation without additional compatible evidence.",
    },
    synthesis: {
      state: synthesisState,
      what_changed: comparableMetrics.map(formatMetricDelta),
      remained_stable: comparableMetrics
        .filter((metric) => metric.direction === "UNCHANGED")
        .map(formatMetricDelta),
      confirming_modules: confirmingModules,
      contradicting_or_weakening_modules: contradictions,
      why_this_matters:
        synthesisState === "CONFIRMATION"
          ? "Question-selected modules reinforce the same bounded structure without creating a trading claim."
          : synthesisState === "DIVERGENCE"
            ? "BTC gravity, participation, liquidity, or accepted memory are not moving as one field; the split is the analytical fact."
            : "The evidence boundary is more important than a forced conclusion.",
      watch_next: [
        `Watch the next accepted Snapshot Delta after ${current.source_generated_at_utc}.`,
        "Watch source freshness before strengthening current-state language.",
        questionClass === "liquidity"
          ? "Watch non-double-counted DeFi TVL, DEX volume and stablecoin share together."
          : "Watch BTC dominance against 24h/7d breadth for confirmation or divergence.",
      ],
      uncertainty: [
        current.source_freshness === "FRESH"
          ? "Accepted source is within the 72-hour product window."
          : "Accepted source is older than 72 hours; strong current-state language is suppressed.",
        uniqueUnavailableMetrics.length
          ? `Unavailable or incompatible memory metrics: ${uniqueUnavailableMetrics.join(", ")}.`
          : "All eight Snapshot Memory metrics are methodologically comparable.",
        temporalUnavailable
          ? "Temporal context is unavailable for this request."
          : "Temporal evidence is bounded and non-predictive.",
        historyAvailable
          ? "Verified history uses two immutable accepted checkpoints."
          : "Previous immutable checkpoint could not be rendered; history is suppressed.",
      ],
    },
    verified_history: {
      available: historyAvailable,
      observation_window: historyAvailable
        ? `${previousCheckpoint!.accepted_at_utc} → ${currentCheckpoint!.accepted_at_utc}`
        : "UNAVAILABLE",
      checkpoints: historyAvailable
        ? [previousCheckpoint!, currentCheckpoint!]
        : [],
      methodology_repair_disclosure:
        getText(snapshot, "liquidity_tvl.defi_tvl_methodology") ??
        "DeFi TVL uses the accepted non-double-counted historicalChainTvl methodology.",
    },
    source_proof: {
      source_mode: "static_public_snapshot",
      proof_source_count: proofSources.length,
      current_snapshot_sha256: proofHashes[0] as string,
      previous_snapshot_sha256: proofHashes[1] as string,
      current_proof_sha256: proofHashes[2] as string,
      previous_proof_sha256: proofHashes[3] as string,
      current_bindings_sha256: proofHashes[4] as string,
      previous_bindings_sha256: proofHashes[5] as string,
      registry_url: BTC_MARKET_ENVELOPE_URLS.registry,
      delta_url: BTC_MARKET_ENVELOPE_URLS.delta,
      previous_snapshot_url: previousSnapshotUrl,
    },
    inactive_modules: [
      "Polymarket live detector",
      "A/E activation",
      "X4 public mechanism",
      "Wallet data and trade execution",
      "Price targets and predictive forecasts",
    ],
    boundary: {
      read_only: true,
      no_live_provider_call_during_request: true,
      no_trading_signal: true,
      no_forecast: true,
      no_price_target: true,
      no_personal_memory_claim: true,
      no_orion_exposure: true,
    },
  };

  return { ok: true, value };
}

async function fetchJson(
  url: string,
  fetchImpl: typeof fetch,
  timeoutMs: number,
): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(url, {
      signal: controller.signal,
      headers: { accept: "application/json" },
      cache: "no-store",
    });
    if (!response.ok) throw new Error(`HTTP_${response.status}`);
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}

export async function loadBtcMarketEnvelope(
  question: string,
  options: {
    fetchImpl?: typeof fetch;
    now?: Date;
    temporal?: BtcEnvelopeTemporalInput;
    timeoutMs?: number;
  } = {},
): Promise<BtcMarketEnvelopeResult> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const timeoutMs = options.timeoutMs ?? 5000;
  let artifacts: unknown[];
  try {
    artifacts = await Promise.all(
      Object.values(BTC_MARKET_ENVELOPE_URLS).map((url) =>
        fetchJson(url, fetchImpl, timeoutMs),
      ),
    );
  } catch (error) {
    const timedOut =
      error instanceof Error &&
      (error.name === "AbortError" || /abort/i.test(error.message));
    return fail(
      timedOut ? "source_timeout" : "source_missing",
      timedOut
        ? "BTC market envelope source request timed out."
        : "BTC market envelope source artifact is unavailable.",
    );
  }

  const registry = artifacts[4];
  const previousCommit =
    isRecord(registry) &&
    isRecord(registry.previous) &&
    isSha(registry.previous.commit_sha, 40)
      ? registry.previous.commit_sha
      : null;

  let previousSnapshot: unknown;
  if (previousCommit) {
    try {
      previousSnapshot = await fetchJson(
        `https://raw.githubusercontent.com/AiBhrigu/phi-cosmography-open/${previousCommit}/site/crypto-astro/data/crypto_astro_snapshot.public.json`,
        fetchImpl,
        timeoutMs,
      );
    } catch {
      previousSnapshot = undefined;
    }
  }

  return buildBtcMarketEnvelopeFromDocuments(
    question,
    {
      snapshot: artifacts[0],
      proof: artifacts[1],
      marketField: artifacts[2],
      bindings: artifacts[3],
      registry: artifacts[4],
      delta: artifacts[5],
      previousSnapshot,
    },
    { now: options.now, temporal: options.temporal },
  );
}
