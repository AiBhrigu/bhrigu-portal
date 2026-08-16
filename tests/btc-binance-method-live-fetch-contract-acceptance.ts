import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { routeBtcCosmographerQuestion } from "../lib/btc-cosmographer-route-graph";
import { decideBtcBinancePublicBinding } from "../lib/btc-binance-public-binding";
import {
  BTC_BINANCE_METHOD_LIVE_FETCH_CONTRACT,
  decideBtcBinanceMethodLiveFetchContract,
} from "../lib/btc-binance-method-live-fetch-contract";

const supported = [
  ["en", "Which live Binance source is used?"],
  ["en", "What source is Binance live data from?"],
  ["en", "Which source does Binance use for live data?"],
  ["en", "What method is used for Binance live evidence?"],
  ["ru", "Какой живой источник Binance используется?"],
  ["ru", "Откуда данные Binance live?"],
  ["ru", "Какой источник BHRIGU использует для live данных Binance?"],
  ["ru", "Какой метод используется для живых данных Binance?"],
] as const;

const safeUnsupported = [
  ["en", "What source feeds Binance live data?"],
  ["en", "Which source feeds Binance live data?"],
  ["en", "What source does Binance rely on for live data?"],
  ["en", "Which source does BHRIGU rely on for Binance live data?"],
  ["en", "What source is behind Binance live data?"],
  ["en", "Which source backs Binance live data?"],
  ["en", "Where does Binance pull live data from?"],
  ["en", "What source does Binance pull live data from?"],
  ["en", "Where does Binance obtain live data from?"],
  ["en", "Which source does Binance obtain live data from?"],
  ["ru", "Из какого источника Binance берёт live данные?"],
  ["ru", "Откуда Binance берёт live данные?"],
  ["ru", "Из какого источника BHRIGU забирает live данные Binance?"],
  ["ru", "На какой источник опирается Binance для live данных?"],
  ["ru", "Какой источник лежит в основе live данных Binance?"],
] as const;

const unsafePurpose = [
  ["en", "What source feeds Binance live data for trading BTC?"],
  ["en", "Which source does Binance rely on for scalping BTC?"],
  ["en", "Where does Binance pull live data from for arbitrage?"],
  ["en", "Which source does Binance obtain live data from for an investment decision?"],
  ["ru", "Из какого источника Binance берёт live данные для торговли BTC?"],
  ["ru", "Откуда Binance берёт live данные для скальпинга?"],
  ["ru", "Из какого источника BHRIGU забирает live данные Binance для арбитража?"],
  ["ru", "На какой источник опирается Binance для инвестиционного решения?"],
] as const;

function realRoute(locale: "en" | "ru", question: string) {
  return routeBtcCosmographerQuestion(locale, question, null);
}

async function main() {
  const checks: Record<string, boolean> = {};

  checks.contract_schema = BTC_BINANCE_METHOD_LIVE_FETCH_CONTRACT.schema_version === "btc_binance_method_live_fetch_supported_grammar_v0_10";
  checks.closed_supported_grammar = BTC_BINANCE_METHOD_LIVE_FETCH_CONTRACT.supported_grammar === "CLOSED_BOUNDED_ALLOWLIST";
  checks.safe_fallback_contract = BTC_BINANCE_METHOD_LIVE_FETCH_CONTRACT.safe_fallback_fetch === false
    && BTC_BINANCE_METHOD_LIVE_FETCH_CONTRACT.base_answer_preserved_on_fallback === true;
  checks.zero_financial_authority = BTC_BINANCE_METHOD_LIVE_FETCH_CONTRACT.account_access === false
    && BTC_BINANCE_METHOD_LIVE_FETCH_CONTRACT.trading_authority === false
    && BTC_BINANCE_METHOD_LIVE_FETCH_CONTRACT.withdrawal_authority === false
    && BTC_BINANCE_METHOD_LIVE_FETCH_CONTRACT.transfer_authority === false;

  const supportedRoutes = supported.map(([locale, q]) => realRoute(locale, q));
  checks.supported_real_router_methodology = supportedRoutes.every((route) => route.domain === "methodology");
  checks.supported_preview_live_fetch = supportedRoutes.every((route) => {
    const decision = decideBtcBinanceMethodLiveFetchContract({ route, vercelEnv: "preview" });
    return decision.disposition === "SUPPORTED_LIVE_FETCH"
      && decision.fetch
      && decision.binding_gate_state === "ENABLED_PREVIEW";
  });

  const fallbackRoutes = safeUnsupported.map(([locale, q]) => realRoute(locale, q));
  checks.safe_unsupported_real_router_methodology = fallbackRoutes.every((route) => route.domain === "methodology");
  checks.safe_unsupported_fallback_zero_fetch = fallbackRoutes.every((route) => {
    const decision = decideBtcBinanceMethodLiveFetchContract({ route, vercelEnv: "preview" });
    return decision.disposition === "SAFE_FALLBACK_UNSUPPORTED_GRAMMAR"
      && !decision.fetch
      && decision.base_answer_preserved;
  });

  const unsafeRoutes = unsafePurpose.map(([locale, q]) => realRoute(locale, q));
  checks.unsafe_real_router_methodology = unsafeRoutes.every((route) => route.domain === "methodology");
  checks.unsafe_purpose_zero_fetch = unsafeRoutes.every((route) => {
    const decision = decideBtcBinanceMethodLiveFetchContract({ route, vercelEnv: "preview" });
    return decision.disposition === "UNSAFE_PURPOSE_DENY" && !decision.fetch;
  });

  const supportedRoute = supportedRoutes[0];
  const production = decideBtcBinanceMethodLiveFetchContract({ route: supportedRoute, vercelEnv: "production" });
  checks.production_hard_off = !production.fetch && production.binding_gate_state === "DISABLED_PRODUCTION";
  const killed = decideBtcBinanceMethodLiveFetchContract({ route: supportedRoute, vercelEnv: "preview", disabled: true });
  checks.kill_switch_wins = !killed.fetch && killed.binding_gate_state === "DISABLED_KILL_SWITCH";

  const general = realRoute("en", "What is happening with BTC now?");
  checks.market_positive_gate_unchanged = decideBtcBinancePublicBinding({ route: general, vercelEnv: "preview" }).fetch;

  const livePage = await readFile(new URL("../pages/crypto-astro/btc/live.tsx", import.meta.url), "utf8");
  checks.consumer_fetch_gate_preserved = /binanceDecision\.fetch\s*\?\s*loadBtcBinancePublicMarketShadow\(\)\s*:\s*Promise\.resolve\(null\)/.test(livePage);
  checks.base_answer_independent_of_binance_fetch = /const answer\s*=/.test(livePage)
    && /const binanceResult\s*=\s*await binancePromise/.test(livePage)
    && /const binanceLiveBinding\s*=\s*binanceResult\s*\?/.test(livePage);

  for (const [name, ok] of Object.entries(checks)) assert.equal(ok, true, name);

  console.log(JSON.stringify({
    schema_version: "btc_binance_method_live_fetch_contract_acceptance_v0_10",
    status: "PASS",
    supported_cases: supported.length,
    safe_fallback_cases: safeUnsupported.length,
    unsafe_cases: unsafePurpose.length,
    checks,
  }));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
