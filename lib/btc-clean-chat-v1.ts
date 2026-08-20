export const BTC_CLEAN_CHAT_SCHEMA = "bhrigu_btc_clean_chat_v1" as const;

export type BtcCleanLocale = "ru" | "en";
export type BtcCleanIntent = "MODEL_ORCHESTRATED";

export type BtcCleanPriorTurn = {
  user: string;
  assistant?: string;
  topic?: string;
};

export type BtcCleanSource = {
  id: string;
  label: string;
  href: string;
  as_of: string | null;
};

export type BtcCleanEvidenceState = "USED" | "UNAVAILABLE" | "NOT_REQUIRED";

export type BtcCleanChatResponse = {
  schema_version: typeof BTC_CLEAN_CHAT_SCHEMA;
  ok: true;
  intent: BtcCleanIntent;
  topic: string;
  answer: string;
  as_of: string;
  sources: BtcCleanSource[];
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
