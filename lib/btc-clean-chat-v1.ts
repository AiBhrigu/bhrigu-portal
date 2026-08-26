export const BTC_CLEAN_CHAT_SCHEMA = "bhrigu_btc_clean_chat_v1" as const;

export type BtcCleanLocale = "ru" | "en";
export type BtcCleanIntent = "MODEL_ORCHESTRATED";

export type BtcCleanAstroWindow = {
  state: "BOUNDED" | "OPEN_START" | "OPEN_END" | "UNRESOLVED";
  start_utc: string | null;
  peak_utc: string | null;
  end_utc: string | null;
};

export type BtcCleanAstroRelationRow = {
  relation_id: string;
  transit_body: string;
  genesis_body: string;
  aspect: string;
  target_deg: number;
  separation_deg: number;
  orb_deg: number;
  orb_limit_deg: number;
  normalized_closeness: number;
  window: BtcCleanAstroWindow;
};

export type BtcCleanAstroContinuity = {
  semantic_kind: "ASTRO_BTC";
  astro_relation: "CURRENT_TO_GENESIS";
  reference_event: "genesis";
  primary_relation_id: string | null;
  primary_relation_signature: {
    transit_body: string;
    genesis_body: string;
    aspect: string;
  } | null;
  temporal_window: BtcCleanAstroWindow | null;
};

export type BtcCleanPriorTurn = {
  user: string;
  assistant?: string;
  topic?: string;
  continuity?: BtcCleanAstroContinuity;
};

export type BtcCleanSource = {
  id: string;
  label: string;
  href: string;
  as_of: string | null;
};

export type BtcCleanEvidenceState = "USED" | "UNAVAILABLE" | "NOT_REQUIRED";

export type BtcCleanSemanticNative = {
  type: "CURRENT_TO_GENESIS_MATRIX";
  status: "COMPUTED" | "INSUFFICIENT_EVIDENCE";
  current_timestamp_utc: string | null;
  reference_timestamp_utc: string;
  reference_event: "genesis";
  total_relations: number;
  displayed_relations: number;
  primary_relation_id: string | null;
  rows: BtcCleanAstroRelationRow[];
  boundary: {
    normalized_closeness_display_order_only: true;
    market_causality: false;
    predictive_power: false;
    btc_price_effect: false;
    sealed_research_boundary: true;
  };
};

export type BtcCleanSemanticVisual = {
  kind: "BTC_FIELD" | "EXPECTATION" | "ASTRO_FIELD" | "ASTRO_BTC";
  state: "CONFIRMATION" | "DIVERGENCE" | "LIMITED" | "TEMPORAL" | "EXPECTATION";
  axis_label: string;
  context_label: string | null;
  metrics: Array<{ label: string; value: string }>;
  freshness: "FRESH" | "LIMITED" | "UNKNOWN";
  native?: BtcCleanSemanticNative;
};

export type BtcCleanChatResponse = {
  schema_version: typeof BTC_CLEAN_CHAT_SCHEMA;
  ok: true;
  intent: BtcCleanIntent;
  completion_state: "COMPLETE" | "VISUAL_ONLY_MODEL_OUTPUT_LIMIT";
  topic: string;
  answer: string;
  as_of: string;
  sources: BtcCleanSource[];
  semantic_visual: BtcCleanSemanticVisual | null;
  evidence: {
    accepted_snapshot: BtcCleanEvidenceState;
    snapshot_memory: BtcCleanEvidenceState;
    binance_current_field: BtcCleanEvidenceState;
    polymarket_expectation_field: BtcCleanEvidenceState;
    astronomy_field: BtcCleanEvidenceState;
    astro_btc_bridge: BtcCleanEvidenceState;
    bitcoin_protocol: BtcCleanEvidenceState;
    web_research: BtcCleanEvidenceState;
  };
  boundary: {
    no_fake_causality: true;
    no_trading_signal: true;
    future_not_established_fact: true;
    polymarket_not_bhrigu_prediction: true;
    astronomy_not_btc_causality: true;
    fact_inference_future_unknown_separated: true;
  };
  usage: {
    provider: "DIRECT_OPENAI_API";
    model: "gpt-5.6-sol";
    input_tokens: number;
    output_tokens: number;
    web_search_calls: number;
  };
};
