import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { BTC_CLEAN_CHAT_SCHEMA } from "../lib/btc-clean-chat-v1";
import { BTC_CLEAN_CHAT_MODEL_ID, BTC_CLEAN_CHAT_PROVIDER } from "../lib/btc-clean-chat-model-runtime";
import {
  BTC_ASTRO_CANONICAL_ENGINE,
  BTC_ASTRO_FIELD_SCHEMA,
  BTC_ASTRO_CHUNK_DAYS,
  BTC_ASTRO_RANGE_CONCURRENCY,
  BTC_PROSPECTIVE_HORIZON_DATE,
  BTC_TEMPORAL_ORIGIN_DATE,
  BTC_TEMPORAL_ORIGIN_UTC,
  buildBtcAstroWindows,
  validateBtcTemporalRange,
} from "../lib/btc-astro-field-client";
import { BTC_POLYMARKET_EXPECTATION_SCHEMA } from "../lib/btc-polymarket-expectation";

assert.equal(BTC_CLEAN_CHAT_SCHEMA, "bhrigu_btc_clean_chat_v1");
assert.equal(BTC_CLEAN_CHAT_MODEL_ID, "gpt-5.6-sol");
assert.equal(BTC_CLEAN_CHAT_PROVIDER, "DIRECT_OPENAI_API");
assert.equal(BTC_ASTRO_FIELD_SCHEMA, "bhrigu_public_astro_field_v0_1");
assert.equal(BTC_ASTRO_CANONICAL_ENGINE, "orion_native_swisseph_canonical_v0_1");
assert.equal(BTC_TEMPORAL_ORIGIN_UTC, "2009-01-03T18:15:05Z");
assert.equal(BTC_TEMPORAL_ORIGIN_DATE, "2009-01-03");
assert.equal(BTC_PROSPECTIVE_HORIZON_DATE, "2028-12-31");
assert.equal(BTC_ASTRO_CHUNK_DAYS, 369);
assert.equal(BTC_ASTRO_RANGE_CONCURRENCY, 5);
const genesisToNowWindows = buildBtcAstroWindows("2009-01-03", "2026-08-21");
assert.equal(genesisToNowWindows[0].startDate, "2009-01-03");
assert.equal(genesisToNowWindows.at(-1)?.endDate, "2026-08-21");
assert.ok(genesisToNowWindows.length > 1 && genesisToNowWindows.length <= 20);
const fullV1TemporalWindows = buildBtcAstroWindows(BTC_TEMPORAL_ORIGIN_DATE, BTC_PROSPECTIVE_HORIZON_DATE);
assert.equal(fullV1TemporalWindows.length, 20);
assert.equal(fullV1TemporalWindows[0].startDate, BTC_TEMPORAL_ORIGIN_DATE);
assert.equal(fullV1TemporalWindows.at(-1)?.endDate, BTC_PROSPECTIVE_HORIZON_DATE);
const prospectiveWindows = buildBtcAstroWindows("2027-01-01", "2028-12-31");
assert.equal(prospectiveWindows.length, 2);
assert.equal(prospectiveWindows[0].startDate, "2027-01-01");
assert.equal(prospectiveWindows.at(-1)?.endDate, "2028-12-31");
assert.throws(() => validateBtcTemporalRange("2008-12-31", "2009-01-03"), /BTC_TEMPORAL_BEFORE_GENESIS/);
assert.throws(() => validateBtcTemporalRange("2028-12-31", "2029-01-01"), /BTC_TEMPORAL_AFTER_V1_HORIZON/);
assert.equal(BTC_POLYMARKET_EXPECTATION_SCHEMA, "bhrigu_btc_polymarket_expectation_v1");

const root = path.resolve(process.cwd());
const component = fs.readFileSync(path.join(root, "ui/btc/BtcCleanChatV1.tsx"), "utf8");
const api = fs.readFileSync(path.join(root, "pages/api/btc/clean-chat-v1.ts"), "utf8");
const protocolEvidence = fs.readFileSync(path.join(root, "lib/btc-protocol-evidence.ts"), "utf8");
const shared = fs.readFileSync(path.join(root, "lib/btc-clean-chat-v1.ts"), "utf8");
const runtime = fs.readFileSync(path.join(root, "lib/btc-clean-chat-model-runtime.ts"), "utf8");
const astroClient = fs.readFileSync(path.join(root, "lib/btc-astro-field-client.ts"), "utf8");
const polymarket = fs.readFileSync(path.join(root, "lib/btc-polymarket-expectation.ts"), "utf8");

for (const forbidden of ["Next precise question", "Active subject", "Prepared questions", "Capability registry", "Route label"]) {
  assert.equal(component.includes(forbidden), false, `visible chat leaked legacy machinery: ${forbidden}`);
}
assert.match(component, /<details className="cleanSources">/);
assert.match(component, /cleanComposer/);
assert.match(component, /cleanUser/);
assert.match(component, /cleanAssistant/);
assert.match(component, /FieldAnchorGlyph/);
assert.match(component, /cleanSemanticVisual/);
assert.match(component, /data-semantic-state/);
assert.match(component, /cleanCopyAction/);
assert.match(component, /navigator\.clipboard\.writeText/);
assert.match(component, /MAX_CONTEXT_TURNS = 12/);
assert.doesNotMatch(component, /BHRIGU_ASTRO_FIELD_BYPASS_SECRET|x-vercel-protection-bypass/);
assert.match(component, /slice\(-MAX_CONTEXT_TURNS\)/);
assert.doesNotMatch(component, /examples\.map|MODULE_CARDS|module card/i);

assert.match(api, /runBtcCleanChatModel/);
assert.match(api, /MAX_PRIOR_TURNS = 12/);
assert.doesNotMatch(api, /classifyBtcCleanIntent|canonicalQuestion|runBtcCleanChat\(/);
assert.doesNotMatch(shared, /classifyBtcCleanIntent|canonicalQuestion|function fieldChange|function expectationNow|runBtcCleanChat\(/);
assert.match(shared, /semantic_visual/);

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
  "loadBtcAstroField",
  "buildBtcProtocolAnswer",
  "protocol_subject: { enum: [...Array.from(PROTOCOL_VALUES), null] }",
  "PROTOCOL_VALUES.has(protocolSubjectRaw)",
  "protocol_subject=satoshi_history",
  "bitcoin-history-${index + 1}",
  "sourceSection?.bullets",
  "boundedModelValue",
  'type: "json_schema"',
  'type: "web_search"',
  "MAX_MODEL_ATTEMPTS = 2",
  "attemptBody",
  "MAX_AUX_RETRY_OUTPUT_TOKENS = 720",
  "MAX_FINAL_RETRY_OUTPUT_TOKENS = 2_000",
  "currentCap === MAX_FINAL_OUTPUT_TOKENS",
  "MAX_CONTEXT_TURNS = 12",
  "safeEvidence",
  "evidence_unavailable",
  "PRIMARY_PRODUCT_AXIS",
  "Public first-party BHRIGU project context",
  "product_runtime",
  "MAX_FINAL_OUTPUT_TOKENS = 500",
  'reasoning: { effort: "low" }',
  "DIRECT_OPENAI_PREVIEW_ONLY",
  "uses_same_computed_astro_field",
  "astronomy_not_btc_causality",
  "fact_inference_future_unknown_separated",
  '"out_of_scope"',
  "Bitcoin remains the primary axis",
  "crypto ecosystem is supporting context",
  "A one-token follow-up like ETH or TRX",
  "Prefer the accepted BHRIGU snapshot",
  "missing from the accepted snapshot",
  "do not expand into general altcoin coverage",
  "if plan.request_type is out_of_scope",
  "buildSemanticVisual",
  "visual_focus",
  "BTC_TEMPORAL_ORIGIN_DATE",
  "BTC_PROSPECTIVE_HORIZON_DATE",
  "Long ranges are valid",
  "Historical reconstruction is not retroactive BHRIGU point-in-time memory",
  "Prospective 2027-2028 astronomy is computable",
  "window_summaries",
]) {
  assert.ok(runtime.includes(required), `direct model runtime missing ${required}`);
}
assert.doesNotMatch(runtime, /ai-gateway\.vercel\.sh|AI_GATEWAY_API_KEY|VERCEL_OIDC_TOKEN/);
assert.doesNotMatch(runtime, /Current UTC date is 2026-08-20/);
assert.match(runtime, /new Date\(\)\.toISOString\(\)\.slice\(0, 10\)/);
assert.doesNotMatch(runtime, /classifyBtcCleanIntent|canonicalQuestion|createOrder|postOrder|cancelOrder|withdraw|private key/i);
assert.doesNotMatch(runtime, /buildBtcAstroAnswer|buildMultiBodyAstroYearAnswer|BTC_PUBLIC_ASTRO_EVIDENCE_META/);

for (const required of [
  "BHRIGU_ASTRO_FIELD_URL",
  "BHRIGU_ASTRO_FIELD_BYPASS_SECRET",
  "x-vercel-protection-bypass",
  "ASTRO_FIELD_PREVIEW_ONLY",
  "orion_native_swisseph_canonical_v0_1",
  "2009-01-03T18:15:05Z",
  "2012-11-28T15:24:38Z",
  "2016-07-09T16:46:13Z",
  "2020-05-11T19:23:43Z",
  "2024-04-20T00:09:27Z",
  "BTC_TEMPORAL_ORIGIN_UTC",
  "BTC_PROSPECTIVE_HORIZON_DATE",
  "BTC_ASTRO_CHUNK_DAYS",
  "BTC_ASTRO_RANGE_CONCURRENCY",
  "mapWithConcurrency",
  "buildBtcAstroWindows",
  "interval_series",
  "compacted_for_model_cost",
  "historical_reconstruction_not_point_in_time_bhrigu_memory",
  "future_not_established_fact",
]) assert.ok(astroClient.includes(required), `astro_field client missing ${required}`);
const astroClientWithoutCanonicalEngine = astroClient.replaceAll("orion_native_swisseph_canonical_v0_1", "");
assert.doesNotMatch(astroClientWithoutCanonicalEngine, /astronomy-engine|skyfield|swisseph|prepared/i);

assert.match(protocolEvidence, /2009-01-08/);
assert.match(protocolEvidence, /2009-January\/014994\.html/);
assert.doesNotMatch(protocolEvidence, /2009-01-10|2009-January\/015004\.html/);

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
console.log("ASTRONOMY_PRIMARY_RUNTIME=CANONICAL_ASTRO_FIELD");
console.log("ASTRO_X_BTC_SAME_FIELD=PASS");
console.log("MODEL_BOUNDED_RETRY=PASS");
console.log("BITCOIN_PROTOCOL_EVIDENCE=PASS");
console.log("NATIVE_WEB_SEARCH_BOUNDED=PASS");
console.log("GENERAL_WEB_ASSISTANT=FORBIDDEN");
console.log("BITCOIN_PRIMARY_AXIS=PASS");
console.log("CRYPTO_ECOSYSTEM_SUPPORTING_CONTEXT=PASS");
console.log("SEMANTIC_VISUAL_LANGUAGE=EXISTING_GLYPH_REUSE");
console.log("BITCOIN_CORRIDOR_BOUNDARY=PASS");
console.log("TRADING_AUTHORITY=ZERO");
console.log("BTC_TEMPORAL_ORIGIN=GENESIS_BLOCK");
console.log("BTC_TEMPORAL_GENESIS_TO_NOW_AUTO_CHUNK=PASS");
console.log("BTC_TEMPORAL_2027_2028_PROSPECTIVE=PASS");
console.log("BTC_TEMPORAL_FUTURE_AS_FACT=ZERO");
