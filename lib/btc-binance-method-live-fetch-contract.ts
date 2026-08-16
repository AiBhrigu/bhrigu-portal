import type { BtcCosmographerRoute } from "./btc-cosmographer-route-graph";
import {
  decideBtcBinancePublicBinding,
  hasDirectBtcFinancialActionIntent,
  hasPositiveBtcBinanceInformationalEligibility,
  type BtcBinancePublicBindingGateState,
} from "./btc-binance-public-binding";

export const BTC_BINANCE_METHOD_LIVE_FETCH_CONTRACT = {
  schema_version: "btc_binance_method_live_fetch_supported_grammar_v0_10",
  mode: "METHOD_AND_PROOF",
  supported_grammar: "CLOSED_BOUNDED_ALLOWLIST",
  safe_fallback_disposition: "SAFE_FALLBACK_UNSUPPORTED_GRAMMAR",
  safe_fallback_fetch: false,
  base_answer_preserved_on_fallback: true,
  unknown_method_fetch: false,
  unsafe_purpose_fetch: false,
  production_enabled: false,
  account_access: false,
  trading_authority: false,
  withdrawal_authority: false,
  transfer_authority: false,
} as const;

export type BtcBinanceMethodLiveFetchDisposition =
  | "SUPPORTED_LIVE_FETCH"
  | "SAFE_FALLBACK_UNSUPPORTED_GRAMMAR"
  | "UNSAFE_PURPOSE_DENY"
  | "NOT_METHOD_ROUTE";

export type BtcBinanceMethodLiveFetchContractDecision = {
  schema_version: typeof BTC_BINANCE_METHOD_LIVE_FETCH_CONTRACT.schema_version;
  disposition: BtcBinanceMethodLiveFetchDisposition;
  fetch: boolean;
  binding_gate_state: BtcBinancePublicBindingGateState;
  base_answer_preserved: true;
  preview_only: true;
  production_enabled: false;
};

const METHOD_UNSAFE_PURPOSE_CONTEXT: readonly RegExp[] = [
  /\bfor\s+(?:an?\s+)?(?:trade|trading|day\s+trading|scalp|scalping|arbitrage|speculation|investment|investment\s+decision|buying|selling)\b/i,
  /\bto\s+(?:trade|scalp|speculate|invest|buy|sell|enter|exit|long|short)\b/i,
  /\b(?:guide|inform|drive)\s+(?:my|a|the)?\s*(?:btc\s+)?(?:trade|position|entry|exit|signal|target|investment|decision)\b/i,
  /\b(?:for|toward)\s+(?:my\s+)?(?:btc\s+)?(?:position|entry|exit|trading\s+signal)\b/i,
  /(?:для\s+(?:торгов|скальп|арбитраж|спекул|инвест|покуп|продаж|торгового\s+сигнал)\w*|использовать[^?!.]*(?:торгов|покуп|продаж|инвест|позици|сигнал)\w*)/i,
];

function hasMethodUnsafePurposeContext(question: string): boolean {
  return METHOD_UNSAFE_PURPOSE_CONTEXT.some((pattern) => pattern.test(question));
}

export function classifyBtcBinanceMethodLiveFetchContract(
  route: BtcCosmographerRoute,
): BtcBinanceMethodLiveFetchDisposition {
  if (route.domain !== "methodology") return "NOT_METHOD_ROUTE";
  const question = route.raw_question.trim().replace(/\s+/g, " ");
  if (hasDirectBtcFinancialActionIntent(question) || hasMethodUnsafePurposeContext(question)) {
    return "UNSAFE_PURPOSE_DENY";
  }
  if (hasPositiveBtcBinanceInformationalEligibility(route, "METHOD_AND_PROOF")) {
    return "SUPPORTED_LIVE_FETCH";
  }
  return "SAFE_FALLBACK_UNSUPPORTED_GRAMMAR";
}

export function decideBtcBinanceMethodLiveFetchContract(input: {
  route: BtcCosmographerRoute;
  vercelEnv: string | undefined;
  disabled?: boolean;
}): BtcBinanceMethodLiveFetchContractDecision {
  const disposition = classifyBtcBinanceMethodLiveFetchContract(input.route);
  const binding = decideBtcBinancePublicBinding(input);
  return {
    schema_version: BTC_BINANCE_METHOD_LIVE_FETCH_CONTRACT.schema_version,
    disposition,
    fetch: binding.fetch,
    binding_gate_state: binding.gate_state,
    base_answer_preserved: true,
    preview_only: true,
    production_enabled: false,
  };
}
