import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { BTC_CLEAN_CHAT_SCHEMA } from "../lib/btc-clean-chat-v1";
import { BTC_CLEAN_CHAT_MODEL_ID, BTC_CLEAN_CHAT_PROVIDER } from "../lib/btc-clean-chat-model-runtime";
import { BTC_POLYMARKET_EXPECTATION_SCHEMA } from "../lib/btc-polymarket-expectation";

assert.equal(BTC_CLEAN_CHAT_SCHEMA, "bhrigu_btc_clean_chat_v1");
assert.equal(BTC_CLEAN_CHAT_MODEL_ID, "gpt-5.6-sol");
assert.equal(BTC_CLEAN_CHAT_PROVIDER, "DIRECT_OPENAI_API");
assert.equal(BTC_POLYMARKET_EXPECTATION_SCHEMA, "bhrigu_btc_polymarket_expectation_v1");

const root = path.resolve(process.cwd());
const component = fs.readFileSync(path.join(root, "ui/btc/BtcCleanChatV1.tsx"), "utf8");
const api = fs.readFileSync(path.join(root, "pages/api/btc/clean-chat-v1.ts"), "utf8");
const shared = fs.readFileSync(path.join(root, "lib/btc-clean-chat-v1.ts"), "utf8");
const runtime = fs.readFileSync(path.join(root, "lib/btc-clean-chat-model-runtime.ts"), "utf8");
const polymarket = fs.readFileSync(path.join(root, "lib/btc-polymarket-expectation.ts"), "utf8");

for (const forbidden of ["Next precise question", "Active subject", "Prepared questions", "Capability registry", "Route label"]) {
  assert.equal(component.includes(forbidden), false, `visible chat leaked legacy machinery: ${forbidden}`);
}
assert.match(component, /<details className="cleanSources">/);
assert.match(component, /cleanComposer/);
assert.match(component, /cleanUser/);
assert.match(component, /cleanAssistant/);
assert.doesNotMatch(component, /examples\.map|MODULE_CARDS|module card/i);

assert.match(api, /runBtcCleanChatModel/);
assert.doesNotMatch(api, /classifyBtcCleanIntent|canonicalQuestion|runBtcCleanChat\(/);
assert.doesNotMatch(shared, /classifyBtcCleanIntent|canonicalQuestion|function fieldChange|function expectationNow|runBtcCleanChat\(/);

for (const required of [
  "https://api.openai.com/v1/responses",
  "OPENAI_API_KEY",
  "gpt-5.6-sol",
  "buildEvidencePlan",
  "collectEvidence",
  "synthesizeAnswer",
  "loadBtcMarketEnvelope",
  "loadBtcBinancePublicMarketShadow",
  "loadBtcPolymarketExpectationField",
  "buildBtcAstroAnswer",
  "buildMultiBodyAstroYearAnswer",
  "buildAstroBtcBridgeBoundary",
  "buildBtcProtocolAnswer",
  'type: "web_search"',
  "MAX_FINAL_OUTPUT_TOKENS = 500",
  'reasoning: { effort: "low" }',
  "DIRECT_OPENAI_PREVIEW_ONLY",
  "astronomy_not_btc_causality",
  "fact_inference_future_unknown_separated",
]) {
  assert.ok(runtime.includes(required), `direct model runtime missing ${required}`);
}
assert.doesNotMatch(runtime, /ai-gateway\.vercel\.sh|AI_GATEWAY_API_KEY|VERCEL_OIDC_TOKEN/);
assert.doesNotMatch(runtime, /classifyBtcCleanIntent|canonicalQuestion|createOrder|postOrder|cancelOrder|withdraw|private key/i);

assert.match(polymarket, /\/tags\/slug\/bitcoin/);
assert.doesNotMatch(polymarket, /tag(?:_|\s*)id\s*=\s*["']?235/i);
assert.match(polymarket, /endDate/);
assert.match(polymarket, /\/book\?token_id=/);
assert.match(polymarket, /\/prices-history\?/);
assert.match(polymarket, /event_complete: true/);
assert.match(polymarket, /global_btc_probability: false/);
assert.match(polymarket, /trading_signal: false/);
assert.doesNotMatch(polymarket, /createOrder|postOrder|cancelOrder|private key|api key/i);

console.log("PASS_BTC_CLEAN_CHAT_V1_DIRECT_OPENAI_ARCHITECTURE");
console.log("PRIMARY_INTELLIGENCE=GPT_5_6_SOL_DIRECT_RESPONSES");
console.log("DETERMINISTIC_CHAT_ENGINE=REMOVED");
console.log("ASTRONOMY_FIRST_CLASS=PASS");
console.log("ASTRO_X_BTC_BOUNDARY=PASS");
console.log("BITCOIN_PROTOCOL_EVIDENCE=PASS");
console.log("NATIVE_WEB_SEARCH_BOUNDED=PASS");
console.log("TRADING_AUTHORITY=ZERO");
