import assert from "node:assert/strict";
import {
  BtcAgentEvidenceError,
  BTC_AGENT_EVIDENCE_REQUEST_SCHEMA,
  BTC_AGENT_MAX_PROVIDER_HARD_COST_MICROS,
  BTC_AGENT_MAX_PROVIDER_REQUEST_BYTES,
  assertBtcAgentProviderBounds,
  executeBtcAgentEvidenceAnswerV0,
  parseBtcAgentEvidenceRequestV0,
  type BtcAgentEvidenceRequestV0,
  type BtcAgentPaymentReceiptV0,
} from "../lib/btc-agent-evidence-answer-v0";
import {
  authorizeBtcAgentPreview,
  btcAgentX402PreviewBoundary,
} from "../lib/btc-agent-x402-preview-v0";
import { btcDeclaredMachineTools } from "../lib/btc-clean-chat-model-runtime";

function validRequest(overrides: Partial<BtcAgentEvidenceRequestV0> = {}): BtcAgentEvidenceRequestV0 {
  return {
    schema_version: BTC_AGENT_EVIDENCE_REQUEST_SCHEMA,
    query_class: "BTC_FIELD_NOW",
    locale: "en",
    question: "Give the current BTC field and evidence.",
    protocol_subject: null,
    ...overrides,
  };
}

function expectEvidenceError(
  fn: () => unknown,
  code: BtcAgentEvidenceError["code"],
) {
  assert.throws(fn, (error: unknown) => (
    error instanceof BtcAgentEvidenceError && error.code === code
  ));
}

async function main() {
assert.deepEqual(btcDeclaredMachineTools("BTC_FIELD_NOW"), ["snapshot", "binance"]);
assert.deepEqual(btcDeclaredMachineTools("BTC_CHANGE_MEMORY"), ["snapshot"]);
assert.deepEqual(btcDeclaredMachineTools("BITCOIN_PROTOCOL"), ["bitcoin_protocol"]);
for (const queryClass of ["BTC_FIELD_NOW", "BTC_CHANGE_MEMORY", "BITCOIN_PROTOCOL"] as const) {
  const tools = btcDeclaredMachineTools(queryClass);
  assert.equal(tools.includes("web" as never), false);
  assert.equal(tools.includes("polymarket" as never), false);
  assert.equal(tools.includes("astronomy" as never), false);
  assert.equal(tools.includes("astro_btc_bridge" as never), false);
}

const parsed = parseBtcAgentEvidenceRequestV0(validRequest());
assert.equal(parsed.question, "Give the current BTC field and evidence.");

expectEvidenceError(
  () => parseBtcAgentEvidenceRequestV0({ ...validRequest(), priorTurns: [] }),
  "REQUEST_INVALID",
);
expectEvidenceError(
  () => parseBtcAgentEvidenceRequestV0(validRequest({ question: "x".repeat(281) })),
  "REQUEST_INVALID",
);
expectEvidenceError(
  () => parseBtcAgentEvidenceRequestV0(validRequest({ question: "Buy BTC now." })),
  "TRADING_INSTRUCTION_FORBIDDEN",
);
expectEvidenceError(
  () => parseBtcAgentEvidenceRequestV0(validRequest({ query_class: "BTC_FIELD_NOW", protocol_subject: "halving" })),
  "REQUEST_INVALID",
);

assert.doesNotThrow(() => assertBtcAgentProviderBounds({
  serializedBytes: BTC_AGENT_MAX_PROVIDER_REQUEST_BYTES,
  hardCostMicros: BTC_AGENT_MAX_PROVIDER_HARD_COST_MICROS,
}));
expectEvidenceError(
  () => assertBtcAgentProviderBounds({
    serializedBytes: BTC_AGENT_MAX_PROVIDER_REQUEST_BYTES + 1,
    hardCostMicros: BTC_AGENT_MAX_PROVIDER_HARD_COST_MICROS,
  }),
  "MACHINE_QUERY_COST_BOUND_EXCEEDED",
);
expectEvidenceError(
  () => assertBtcAgentProviderBounds({
    serializedBytes: BTC_AGENT_MAX_PROVIDER_REQUEST_BYTES,
    hardCostMicros: BTC_AGENT_MAX_PROVIDER_HARD_COST_MICROS + 1,
  }),
  "MACHINE_QUERY_COST_BOUND_EXCEEDED",
);

const boundary = btcAgentX402PreviewBoundary();
assert.equal(boundary.preview_only, true);
assert.equal(boundary.production_payment_enabled, false);
assert.equal(boundary.payment_activation, false);
assert.equal(boundary.settlement_enabled, false);
assert.equal(boundary.pay_to, null);
assert.equal(boundary.x402_version, 2);
assert.equal(boundary.scheme, "exact");
assert.equal(boundary.network, "eip155:8453");
assert.equal(boundary.asset, "USDC");
assert.equal(boundary.amount_atomic, "500000");

const prodAuth = authorizeBtcAgentPreview("mock-authorized-v0", { VERCEL_ENV: "production" });
assert.deepEqual(prodAuth, { ok: false, code: "PAYMENT_NOT_ACTIVATED", status: 503 });
const noPreviewAuth = authorizeBtcAgentPreview(undefined, { VERCEL_ENV: "preview" });
assert.deepEqual(noPreviewAuth, { ok: false, code: "PREVIEW_AUTHORIZATION_REQUIRED", status: 402 });
const previewAuth = authorizeBtcAgentPreview("mock-authorized-v0", { VERCEL_ENV: "preview" });
if (previewAuth.ok === false) throw new Error("preview authorization unexpectedly unavailable");
assert.equal(previewAuth.ok, true);

const payment: BtcAgentPaymentReceiptV0 = previewAuth.receipt;
let providerBoundObserved = false;
const fakeRuntime = async (input: Parameters<typeof import("../lib/btc-clean-chat-model-runtime").runBtcDeclaredMachineEvidence>[0]) => {
  assert.equal(input.queryClass, "BTC_FIELD_NOW");
  assert.equal(input.protocolSubject, null);
  await input.guard?.beforeProviderRequest?.({
    serializedBytes: BTC_AGENT_MAX_PROVIDER_REQUEST_BYTES,
    hardCostMicros: BTC_AGENT_MAX_PROVIDER_HARD_COST_MICROS,
  });
  providerBoundObserved = true;
  return {
    topic: "btc_market",
    answer: "BTC field remains bounded.\nSnapshot evidence is accepted.\nBinance is current.\nNo trading signal.",
    as_of: "2026-09-21T12:00:00.000Z",
    sources: [
      { id: "snapshot-current", label: "Accepted Snapshot", href: "https://example.com/snapshot", as_of: "2026-09-21T12:00:00.000Z" },
      { id: "binance", label: "Binance BTCUSDT", href: "https://data-api.binance.vision/api/v3/ticker/24hr?symbol=BTCUSDT", as_of: "2026-09-21T12:00:00.000Z" },
    ],
    evidence: {
      accepted_snapshot: "USED" as const,
      snapshot_memory: "NOT_REQUIRED" as const,
      binance_current_field: "USED" as const,
      bitcoin_protocol: "NOT_REQUIRED" as const,
    },
    usage: {
      provider: "DIRECT_OPENAI_API" as const,
      model: "gpt-5.6-sol" as const,
      input_tokens: 100,
      output_tokens: 120,
      web_search_calls: 0,
    },
  };
};

const responseA = await executeBtcAgentEvidenceAnswerV0(parsed, payment, { runtime: fakeRuntime });
const responseB = await executeBtcAgentEvidenceAnswerV0(parsed, payment, { runtime: fakeRuntime });
assert.equal(providerBoundObserved, true);
assert.equal(responseA.request_hash, responseB.request_hash);
assert.equal(responseA.request_id, responseB.request_id);
assert.equal(responseA.result_hash, responseB.result_hash);
assert.equal(responseA.answer.split("\n").length <= 5, true);
assert.equal(responseA.sources.length <= 12, true);
assert.equal(responseA.usage.output_tokens <= 480, true);
assert.equal(responseA.usage.web_search_calls, 0);
assert.equal(responseA.boundary.research_state_not_trade, true);
assert.equal(responseA.boundary.no_trading_signal, true);
assert.equal(responseA.boundary.no_financial_advice, true);
assert.equal(responseA.payment.protocol, "x402");
assert.equal(responseA.payment.network, "eip155:8453");
assert.equal(responseA.payment.asset, "USDC");
assert.equal(responseA.payment.amount_atomic, "500000");
assert.equal(responseA.payment.transaction, "PREVIEW_NO_SETTLEMENT");

console.log(JSON.stringify({
  ok: true,
  schema: "btc_agent_evidence_answer_v0_acceptance",
  checks: {
    deterministic_source_family: true,
    forbidden_tool_family_absent: true,
    no_prior_turns: true,
    question_limit: true,
    trading_boundary: true,
    provider_request_byte_ceiling: true,
    provider_hard_cost_ceiling: true,
    five_line_output: true,
    output_token_ceiling: true,
    web_calls_zero: true,
    deterministic_hashes: true,
    x402_v2_price_contract: true,
    pay_to_unbound: true,
    settlement_disabled: true,
    production_payment_disabled: true,
  },
}, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
