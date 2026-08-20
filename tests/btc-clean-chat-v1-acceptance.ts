import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  BTC_CLEAN_CHAT_SCHEMA,
  classifyBtcCleanIntent,
} from "../lib/btc-clean-chat-v1";
import { BTC_POLYMARKET_EXPECTATION_SCHEMA } from "../lib/btc-polymarket-expectation";

assert.equal(BTC_CLEAN_CHAT_SCHEMA, "bhrigu_btc_clean_chat_v1");
assert.equal(BTC_POLYMARKET_EXPECTATION_SCHEMA, "bhrigu_btc_polymarket_expectation_v1");

const sequence = [
  ["What is changing in BTC right now?", "FIELD_CHANGE"],
  ["Why does that matter?", "WHY_IT_MATTERS"],
  ["What are you watching next?", "WATCH_NEXT"],
  ["What is the market expecting?", "EXPECTATION_NOW"],
  ["What changed in those expectations?", "EXPECTATION_DELTA"],
  ["Go back to the liquidity point.", "RETURN_LIQUIDITY"],
] as const;

const prior: Array<{ user: string; topic?: string }> = [];
for (const [question, expected] of sequence) {
  assert.equal(classifyBtcCleanIntent(question, prior), expected, question);
  prior.push({ user: question, topic: expected.toLowerCase() });
}

assert.equal(classifyBtcCleanIntent("Что меняется в BTC прямо сейчас?"), "FIELD_CHANGE");
assert.equal(classifyBtcCleanIntent("Почему это важно?"), "WHY_IT_MATTERS");
assert.equal(classifyBtcCleanIntent("Что сейчас ожидает рынок?"), "EXPECTATION_NOW");
assert.equal(classifyBtcCleanIntent("Что изменилось в этих ожиданиях?"), "EXPECTATION_DELTA");
assert.equal(classifyBtcCleanIntent("Вернись к точке ликвидности."), "RETURN_LIQUIDITY");
assert.equal(classifyBtcCleanIntent("Should I buy BTC now?"), "TRADING_BOUNDARY");
assert.equal(classifyBtcCleanIntent("Стоит ли купить BTC сейчас?"), "TRADING_BOUNDARY");

const root = path.resolve(process.cwd());
const component = fs.readFileSync(path.join(root, "ui/btc/BtcCleanChatV1.tsx"), "utf8");
const polymarket = fs.readFileSync(path.join(root, "lib/btc-polymarket-expectation.ts"), "utf8");
const runtime = fs.readFileSync(path.join(root, "lib/btc-clean-chat-v1.ts"), "utf8");

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

assert.match(polymarket, /\/tags\/slug\/bitcoin/);
assert.doesNotMatch(polymarket, /tag(?:_|\s*)id\s*=\s*["']?235/i);
assert.match(polymarket, /endDate/);
assert.match(polymarket, /\/book\?token_id=/);
assert.match(polymarket, /\/prices-history\?/);
assert.match(polymarket, /event_complete: true/);
assert.match(polymarket, /global_btc_probability: false/);
assert.match(polymarket, /trading_signal: false/);
assert.doesNotMatch(polymarket, /createOrder|postOrder|cancelOrder|private key|api key/i);

for (const required of [
  "loadBtcMarketEnvelope",
  "loadBtcBinancePublicMarketShadow",
  "loadBtcPolymarketExpectationField",
  "no_fake_causality",
  "no_trading_signal",
  "future_not_established_fact",
  "polymarket_not_bhrigu_prediction",
]) {
  assert.match(runtime, new RegExp(required));
}

console.log("PASS_BTC_CLEAN_CHAT_V1_ACCEPTANCE");
console.log("FIRST_ACCEPTANCE_SEQUENCE=6/6");
console.log("RU_INTENT_PARITY=PASS");
console.log("VISIBLE_CHAT_BOUNDARY=PASS");
console.log("POLYMARKET_DYNAMIC_RUNTIME_CONTRACT=PASS");
console.log("TRADING_AUTHORITY=ZERO");
