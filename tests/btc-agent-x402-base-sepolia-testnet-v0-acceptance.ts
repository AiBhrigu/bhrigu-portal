import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  BtcAgentX402BaseSepoliaBindingError,
  BTC_AGENT_X402_BASE_SEPOLIA_AMOUNT_ATOMIC,
  BTC_AGENT_X402_BASE_SEPOLIA_ASSET,
  BTC_AGENT_X402_BASE_SEPOLIA_ENABLE_ENV,
  BTC_AGENT_X402_BASE_SEPOLIA_NETWORK,
  BTC_AGENT_X402_BASE_SEPOLIA_RECEIVER_ADDRESS_ENV,
  BTC_AGENT_X402_BASE_SEPOLIA_RECEIVER_NAME,
  BTC_AGENT_X402_BASE_SEPOLIA_RECEIVER_NAME_ENV,
  assertBtcAgentX402PaymentMatches,
  btcAgentX402BaseSepoliaPaymentRequired,
  btcAgentX402BaseSepoliaPaymentRequirements,
  btcAgentX402CdpSettleRequest,
  btcAgentX402CdpVerifyRequest,
  decodeBtcAgentX402PaymentSignatureHeader,
  encodeBtcAgentX402PaymentRequiredHeader,
  resolveBtcAgentX402BaseSepoliaBinding,
} from "../lib/btc-agent-x402-base-sepolia-testnet-v0";
import { btcAgentX402PreviewBoundary } from "../lib/btc-agent-x402-preview-v0";

const fixturePayTo = "0x1111111111111111111111111111111111111111";
const enabledEnv = {
  VERCEL_ENV: "preview",
  [BTC_AGENT_X402_BASE_SEPOLIA_ENABLE_ENV]: "true",
  [BTC_AGENT_X402_BASE_SEPOLIA_RECEIVER_NAME_ENV]: BTC_AGENT_X402_BASE_SEPOLIA_RECEIVER_NAME,
  [BTC_AGENT_X402_BASE_SEPOLIA_RECEIVER_ADDRESS_ENV]: fixturePayTo,
};

function expectBindingError(fn: () => unknown, code: BtcAgentX402BaseSepoliaBindingError["code"]) {
  assert.throws(fn, (error: unknown) => (
    error instanceof BtcAgentX402BaseSepoliaBindingError && error.code === code
  ));
}

expectBindingError(() => resolveBtcAgentX402BaseSepoliaBinding({}), "TESTNET_BINDING_DISABLED");
expectBindingError(
  () => resolveBtcAgentX402BaseSepoliaBinding({ ...enabledEnv, VERCEL_ENV: "production" }),
  "PRODUCTION_ENV_FORBIDDEN",
);
expectBindingError(
  () => resolveBtcAgentX402BaseSepoliaBinding({
    ...enabledEnv,
    [BTC_AGENT_X402_BASE_SEPOLIA_RECEIVER_NAME_ENV]: "wrong-receiver",
  }),
  "RECEIVER_NAME_MISMATCH",
);
expectBindingError(
  () => resolveBtcAgentX402BaseSepoliaBinding({
    ...enabledEnv,
    [BTC_AGENT_X402_BASE_SEPOLIA_RECEIVER_ADDRESS_ENV]: "",
  }),
  "RECEIVER_ADDRESS_MISSING",
);

const requirements = btcAgentX402BaseSepoliaPaymentRequirements(enabledEnv);
assert.equal(requirements.scheme, "exact");
assert.equal(requirements.network, "eip155:84532");
assert.equal(requirements.asset, BTC_AGENT_X402_BASE_SEPOLIA_ASSET);
assert.equal(requirements.amount, "500000");
assert.equal(requirements.payTo, fixturePayTo);
assert.equal(requirements.maxTimeoutSeconds, 60);
assert.deepEqual(requirements.extra, { name: "USDC", version: "2" });

const required = btcAgentX402BaseSepoliaPaymentRequired(
  "http://127.0.0.1:4020/btc-evidence-answer-v0",
  enabledEnv,
);
assert.equal(required.x402Version, 2);
assert.equal(required.accepts.length, 1);
assert.deepEqual(required.accepts[0], requirements);
assert.equal(required.resource.mimeType, "application/json");

const requiredHeader = encodeBtcAgentX402PaymentRequiredHeader(required);
assert.deepEqual(JSON.parse(Buffer.from(requiredHeader, "base64").toString("utf8")), required);

const paymentPayload = {
  x402Version: 2,
  payload: {
    signature: "0x" + "00".repeat(65),
    authorization: {
      from: "0x2222222222222222222222222222222222222222",
      to: fixturePayTo,
      value: BTC_AGENT_X402_BASE_SEPOLIA_AMOUNT_ATOMIC,
      validAfter: "0",
      validBefore: "9999999999",
      nonce: "0x" + "00".repeat(32),
    },
  },
  accepted: requirements,
  resource: required.resource,
};

const paymentSignatureHeader = Buffer.from(JSON.stringify(paymentPayload), "utf8").toString("base64");
const decoded = decodeBtcAgentX402PaymentSignatureHeader(paymentSignatureHeader);
assert.doesNotThrow(() => assertBtcAgentX402PaymentMatches(decoded, requirements));

const verifyRequest = btcAgentX402CdpVerifyRequest(decoded, requirements);
assert.equal(verifyRequest.x402Version, 2);
assert.deepEqual(verifyRequest.paymentRequirements, requirements);
assert.deepEqual(verifyRequest.paymentPayload, decoded);

const settleRequest = btcAgentX402CdpSettleRequest(decoded, requirements);
assert.deepEqual(settleRequest, verifyRequest);

expectBindingError(
  () => assertBtcAgentX402PaymentMatches(
    { ...decoded, accepted: { ...requirements, amount: "500001" } },
    requirements,
  ),
  "PAYMENT_REQUIREMENTS_MISMATCH",
);

const publicBoundary = btcAgentX402PreviewBoundary();
assert.equal(publicBoundary.production_payment_enabled, false);
assert.equal(publicBoundary.payment_activation, false);
assert.equal(publicBoundary.settlement_enabled, false);
assert.equal(publicBoundary.pay_to, null);
assert.equal(publicBoundary.network, "eip155:8453");
assert.equal(publicBoundary.amount_atomic, "500000");

const descriptor = JSON.parse(readFileSync("public/.well-known/bhrigu-agent-commerce.json", "utf8"));
assert.equal(descriptor.production_payment_enabled, false);
assert.equal(descriptor.pay_to_bound, false);
assert.equal(descriptor.x402.network, "eip155:8453");
assert.equal(descriptor.x402.pay_to, null);
assert.equal(descriptor.x402.settlement_enabled, false);

const openapi = readFileSync("public/openapi/agent-commerce-v0.json", "utf8");
assert.match(openapi, /Production payment and settlement are disabled; PAY_TO is unbound/);
assert.match(openapi, /"const": "eip155:8453"/);

console.log(JSON.stringify({
  ok: true,
  schema: "btc_agent_x402_base_sepolia_testnet_binding_acceptance_v0",
  checks: {
    testnet_binding_fail_closed: true,
    production_environment_forbidden: true,
    receiver_name_bound: true,
    challenge_x402_v2: true,
    scheme_exact: true,
    network: BTC_AGENT_X402_BASE_SEPOLIA_NETWORK,
    asset: BTC_AGENT_X402_BASE_SEPOLIA_ASSET,
    amount_atomic: BTC_AGENT_X402_BASE_SEPOLIA_AMOUNT_ATOMIC,
    payment_required_header_roundtrip: true,
    payment_signature_decode: true,
    facilitator_verify_shape: true,
    facilitator_settle_shape: true,
    public_preview_contract_preserved: true,
    public_production_payment_disabled: true,
    signature_performed: false,
    settlement_performed: false,
    blockchain_transactions: 0,
  },
}, null, 2));
