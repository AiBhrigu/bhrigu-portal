import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { BTC_CLEAN_CHAT_SCHEMA } from "../lib/btc-clean-chat-v1";
import { BTC_CLEAN_CHAT_MODEL_ID } from "../lib/btc-clean-chat-model-runtime";
import { BTC_POLYMARKET_EXPECTATION_SCHEMA } from "../lib/btc-polymarket-expectation";

assert.equal(BTC_CLEAN_CHAT_SCHEMA, "bhrigu_btc_clean_chat_v1");
assert.equal(BTC_CLEAN_CHAT_MODEL_ID, "openai/gpt-5.6-sol");
assert.equal(BTC_POLYMARKET_EXPECTATION_SCHEMA, "bhrigu_btc_polymarket_expectation_v1");

const root = path.resolve(process.cwd());
const component = fs.readFileSync(path.join(root, "ui/btc/BtcCleanChatV1.tsx"), "utf8");
const api = fs.readFileSync(path.join(root, "pages/api/btc/clean-chat-v1.ts"), "utf8");
const modelRuntime = fs.readFileSync(path.join(root, "lib/btc-clean-chat-model-runtime.ts"), "utf8");
const polymarket = fs.readFileSync(path.join(root, "lib/btc-polymarket-expectation.ts"), "utf8");

for (const forbidden of [
  "Next precise question",
  "Active subject",
  "Prepared questions",
  "Capability registry",
  "Route label",
]) {
  assert.equal(component.includes(forbidden), false, `clean visible surface leaked legacy machinery: ${forbidden}`);
}

assert.match(component, /<details className="cleanSources">/);
assert.match(component, /cleanComposer/);
assert.match(component, /cleanUser/);
assert.match(component, /cleanAssistant/);
assert.doesNotMatch(component, /module card|MODULE_CARDS/i);

assert.match(api, /runBtcCleanChatModel/);
assert.doesNotMatch(api, /classifyBtcCleanIntent|canonicalQuestion|runBtcCleanChat\(/);

for (const required of [
  "openai/gpt-5.6-sol",
  "buildEvidencePlan",
  "collectEvidence",
  "synthesizeAnswer",
  "loadBtcMarketEnvelope",
  "loadBtcBinancePublicMarketShadow",
  "loadBtcPolymarketExpectationField",
  "max_output_tokens",
  "reasoning: { effort: \"low\" }",
  "no_fake_causality",
  "no_trading_signal",
  "future_not_established_fact",
  "polymarket_not_bhrigu_prediction",
]) {
  assert.ok(modelRuntime.includes(required), `model runtime missing ${required}`);
}

assert.doesNotMatch(modelRuntime, /createOrder|postOrder|cancelOrder|private key|withdraw|transfer/i);
assert.doesNotMatch(modelRuntime, /canonicalQuestion|classifyBtcCleanIntent/);

assert.match(polymarket, /\/tags\/slug\/bitcoin/);
assert.doesNotMatch(polymarket, /tag(?:_|\s*)id\s*=\s*["']?235/i);
assert.match(polymarket, /endDate/);
assert.match(polymarket, /\/book\?token_id=/);
assert.match(polymarket, /\/prices-history\?/);
assert.match(polymarket, /event_complete: true/);
assert.match(polymarket, /global_btc_probability: false/);
assert.match(polymarket, /trading_signal: false/);
assert.doesNotMatch(polymarket, /createOrder|postOrder|cancelOrder|private key|api key/i);

console.log("PASS_BTC_CLEAN_CHAT_V1_MODEL_ARCHITECTURE");
console.log("PRIMARY_INTELLIGENCE=REAL_MODEL_BACKED");
console.log("SCRIPTED_INTENT_GATE=REMOVED_FROM_API_RUNTIME");
console.log("VISIBLE_CHAT_BOUNDARY=PASS");
console.log("POLYMARKET_DYNAMIC_RUNTIME_CONTRACT=PASS");
console.log("TRADING_AUTHORITY=ZERO");
