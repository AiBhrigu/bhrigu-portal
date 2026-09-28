import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  BTC_AGENT_EVIDENCE_REQUEST_SCHEMA,
} from "../lib/btc-agent-evidence-answer-v0";
import { runBtcDeclaredMachineEvidence } from "../lib/btc-clean-chat-model-runtime";
import {
  BTC_AGENT_X402_BASE_SEPOLIA_AMOUNT_ATOMIC,
  BTC_AGENT_X402_BASE_SEPOLIA_ASSET,
  BTC_AGENT_X402_BASE_SEPOLIA_ENABLE_ENV,
  BTC_AGENT_X402_BASE_SEPOLIA_NETWORK,
  BTC_AGENT_X402_BASE_SEPOLIA_PAYER_ADDRESS,
  BTC_AGENT_X402_BASE_SEPOLIA_RECEIVER_ADDRESS,
  BTC_AGENT_X402_BASE_SEPOLIA_RECEIVER_ADDRESS_ENV,
  BTC_AGENT_X402_BASE_SEPOLIA_RECEIVER_NAME,
  BTC_AGENT_X402_BASE_SEPOLIA_RECEIVER_NAME_ENV,
  btcAgentX402BaseSepoliaPaymentRequired,
  btcAgentX402BaseSepoliaPaymentRequirements,
} from "../lib/btc-agent-x402-base-sepolia-testnet-v0";
import {
  BTC_AGENT_X402_BASE_SEPOLIA_EVIDENCE_RESPONSE_SCHEMA,
  BTC_AGENT_X402_BASE_SEPOLIA_RECEIPT_SCHEMA,
  handleBtcAgentX402BaseSepoliaRuntime,
  type BtcAgentX402BaseSepoliaAdapter,
} from "../lib/btc-agent-x402-base-sepolia-runtime-v0";
import {
  cdpX402CliArgs,
} from "../lib/server/btc-agent-x402-cdp-cli-adapter-v0";
import { btcAgentX402PreviewBoundary } from "../lib/btc-agent-x402-preview-v0";

const transaction = "0x" + "ab".repeat(32);
const resourceUrl = "http://127.0.0.1:4020/btc-evidence-answer-v0";
const enabledEnv = {
  VERCEL_ENV: "preview",
  [BTC_AGENT_X402_BASE_SEPOLIA_ENABLE_ENV]: "true",
  [BTC_AGENT_X402_BASE_SEPOLIA_RECEIVER_NAME_ENV]: BTC_AGENT_X402_BASE_SEPOLIA_RECEIVER_NAME,
  [BTC_AGENT_X402_BASE_SEPOLIA_RECEIVER_ADDRESS_ENV]: BTC_AGENT_X402_BASE_SEPOLIA_RECEIVER_ADDRESS,
};
const request = {
  schema_version: BTC_AGENT_EVIDENCE_REQUEST_SCHEMA,
  query_class: "BITCOIN_PROTOCOL" as const,
  locale: "en" as const,
  question: "What is Bitcoin's supply model?",
  protocol_subject: "supply" as const,
};

function bodyCode(response: { body: Record<string, unknown> }): unknown {
  return response.body.code;
}

function signedHeader(overrides: {
  from?: string;
  to?: string;
  value?: string;
  accepted?: Record<string, unknown>;
} = {}) {
  const required = btcAgentX402BaseSepoliaPaymentRequired(resourceUrl, enabledEnv);
  const requirements = btcAgentX402BaseSepoliaPaymentRequirements(enabledEnv);
  const payload = {
    x402Version: 2,
    payload: {
      signature: "0x" + "11".repeat(65),
      authorization: {
        from: overrides.from ?? BTC_AGENT_X402_BASE_SEPOLIA_PAYER_ADDRESS,
        to: overrides.to ?? BTC_AGENT_X402_BASE_SEPOLIA_RECEIVER_ADDRESS,
        value: overrides.value ?? BTC_AGENT_X402_BASE_SEPOLIA_AMOUNT_ATOMIC,
        validAfter: "0",
        validBefore: "9999999999",
        nonce: "0x" + "22".repeat(32),
      },
    },
    accepted: overrides.accepted ?? requirements,
    resource: required.resource,
  };
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64");
}

function adapterFixture(options: {
  verify?: { isValid: boolean; payer?: string };
  settle?: {
    success: boolean;
    payer?: string;
    transaction?: string;
    network?: string;
    amount?: string;
  };
}) {
  let verifyCalls = 0;
  let settleCalls = 0;
  let verifyRequest: unknown;
  let settleRequest: unknown;
  const adapter: BtcAgentX402BaseSepoliaAdapter = {
    async verify(input) {
      verifyCalls += 1;
      verifyRequest = input;
      return options.verify ?? {
        isValid: true,
        payer: BTC_AGENT_X402_BASE_SEPOLIA_PAYER_ADDRESS,
      };
    },
    async settle(input) {
      settleCalls += 1;
      settleRequest = input;
      return options.settle ?? {
        success: true,
        payer: BTC_AGENT_X402_BASE_SEPOLIA_PAYER_ADDRESS,
        transaction,
        network: BTC_AGENT_X402_BASE_SEPOLIA_NETWORK,
        amount: BTC_AGENT_X402_BASE_SEPOLIA_AMOUNT_ATOMIC,
      };
    },
  };
  return {
    adapter,
    counts: () => ({ verifyCalls, settleCalls }),
    requests: () => ({ verifyRequest, settleRequest }),
  };
}

function countedEvidenceRuntime(counter: { value: number }) {
  return async (input: Parameters<typeof runBtcDeclaredMachineEvidence>[0]) => {
    counter.value += 1;
    return await runBtcDeclaredMachineEvidence(input);
  };
}

async function main() {
// 1. Unpaid request -> exact real V2 PaymentRequired; zero evidence / zero CDP calls.
{
  const fixture = adapterFixture({});
  const evidenceCalls = { value: 0 };
  const response = await handleBtcAgentX402BaseSepoliaRuntime(
    { body: request, resourceUrl, env: enabledEnv },
    { adapter: fixture.adapter, evidenceRuntime: countedEvidenceRuntime(evidenceCalls) },
  );
  assert.equal(response.status, 402);
  assert.equal(bodyCode(response), "PAYMENT_REQUIRED");
  assert.equal(evidenceCalls.value, 0);
  assert.deepEqual(fixture.counts(), { verifyCalls: 0, settleCalls: 0 });
  const header = response.headers["PAYMENT-REQUIRED"];
  assert.ok(header);
  const decoded = JSON.parse(Buffer.from(header, "base64").toString("utf8"));
  assert.equal(decoded.x402Version, 2);
  assert.equal(decoded.accepts[0].scheme, "exact");
  assert.equal(decoded.accepts[0].network, BTC_AGENT_X402_BASE_SEPOLIA_NETWORK);
  assert.equal(decoded.accepts[0].asset, BTC_AGENT_X402_BASE_SEPOLIA_ASSET);
  assert.equal(decoded.accepts[0].amount, BTC_AGENT_X402_BASE_SEPOLIA_AMOUNT_ATOMIC);
  assert.equal(decoded.accepts[0].payTo, BTC_AGENT_X402_BASE_SEPOLIA_RECEIVER_ADDRESS);
}

// 2. A valid-shaped signed fixture reaches verify adapter; verify failure blocks settle/evidence.
{
  const fixture = adapterFixture({
    verify: { isValid: false, payer: BTC_AGENT_X402_BASE_SEPOLIA_PAYER_ADDRESS },
  });
  const evidenceCalls = { value: 0 };
  const response = await handleBtcAgentX402BaseSepoliaRuntime(
    { body: request, paymentSignatureHeader: signedHeader(), resourceUrl, env: enabledEnv },
    { adapter: fixture.adapter, evidenceRuntime: countedEvidenceRuntime(evidenceCalls) },
  );
  assert.equal(response.status, 402);
  assert.equal(bodyCode(response), "VERIFY_FAILED");
  assert.deepEqual(fixture.counts(), { verifyCalls: 1, settleCalls: 0 });
  assert.equal(evidenceCalls.value, 0);
  const captured = fixture.requests().verifyRequest as {
    x402Version: number;
    paymentRequirements: { payTo: string; network: string; asset: string; amount: string };
  };
  assert.equal(captured.x402Version, 2);
  assert.equal(captured.paymentRequirements.payTo, BTC_AGENT_X402_BASE_SEPOLIA_RECEIVER_ADDRESS);
  assert.equal(captured.paymentRequirements.network, BTC_AGENT_X402_BASE_SEPOLIA_NETWORK);
  assert.equal(captured.paymentRequirements.asset, BTC_AGENT_X402_BASE_SEPOLIA_ASSET);
  assert.equal(captured.paymentRequirements.amount, BTC_AGENT_X402_BASE_SEPOLIA_AMOUNT_ATOMIC);
}

// 3. Settle failure blocks deterministic evidence.
{
  const fixture = adapterFixture({
    settle: {
      success: false,
      payer: BTC_AGENT_X402_BASE_SEPOLIA_PAYER_ADDRESS,
      network: BTC_AGENT_X402_BASE_SEPOLIA_NETWORK,
      amount: BTC_AGENT_X402_BASE_SEPOLIA_AMOUNT_ATOMIC,
    },
  });
  const evidenceCalls = { value: 0 };
  const response = await handleBtcAgentX402BaseSepoliaRuntime(
    { body: request, paymentSignatureHeader: signedHeader(), resourceUrl, env: enabledEnv },
    { adapter: fixture.adapter, evidenceRuntime: countedEvidenceRuntime(evidenceCalls) },
  );
  assert.equal(response.status, 402);
  assert.equal(bodyCode(response), "SETTLEMENT_FAILED");
  assert.deepEqual(fixture.counts(), { verifyCalls: 1, settleCalls: 1 });
  assert.equal(evidenceCalls.value, 0);
}

// 4. Successful mocked settle fixture gates real deterministic evidence and binds exact receipt.
{
  const fixture = adapterFixture({});
  const evidenceCalls = { value: 0 };
  const response = await handleBtcAgentX402BaseSepoliaRuntime(
    { body: request, paymentSignatureHeader: signedHeader(), resourceUrl, env: enabledEnv },
    { adapter: fixture.adapter, evidenceRuntime: countedEvidenceRuntime(evidenceCalls) },
  );
  assert.equal(response.status, 200);
  assert.equal(evidenceCalls.value, 1);
  assert.deepEqual(fixture.counts(), { verifyCalls: 1, settleCalls: 1 });
  const result = response.body.result as {
    schema_version: string;
    payment: Record<string, unknown>;
    usage: Record<string, unknown>;
    result_hash: string;
  };
  assert.equal(result.schema_version, BTC_AGENT_X402_BASE_SEPOLIA_EVIDENCE_RESPONSE_SCHEMA);
  assert.equal(result.payment.schema_version, BTC_AGENT_X402_BASE_SEPOLIA_RECEIPT_SCHEMA);
  assert.equal(result.payment.protocol, "x402");
  assert.equal(result.payment.network, BTC_AGENT_X402_BASE_SEPOLIA_NETWORK);
  assert.equal(result.payment.asset, BTC_AGENT_X402_BASE_SEPOLIA_ASSET);
  assert.equal(result.payment.amount_atomic, BTC_AGENT_X402_BASE_SEPOLIA_AMOUNT_ATOMIC);
  assert.equal(result.payment.payer, BTC_AGENT_X402_BASE_SEPOLIA_PAYER_ADDRESS);
  assert.equal(result.payment.receiver, BTC_AGENT_X402_BASE_SEPOLIA_RECEIVER_ADDRESS);
  assert.equal(result.payment.transaction, transaction);
  assert.equal(result.usage.provider, "NONE");
  assert.equal(result.usage.model, "DETERMINISTIC_EVIDENCE_V0");
  assert.match(result.result_hash, /^sha256:[0-9a-f]{64}$/);
  assert.equal(response.headers["X-BHRIGU-x402-Testnet-Transaction"], transaction);
}

// 5. Duplicate settlement execution within one request path is impossible.
{
  const fixture = adapterFixture({});
  const response = await handleBtcAgentX402BaseSepoliaRuntime(
    { body: request, paymentSignatureHeader: signedHeader(), resourceUrl, env: enabledEnv },
    { adapter: fixture.adapter },
  );
  assert.equal(response.status, 200);
  assert.equal(fixture.counts().settleCalls, 1);
}

// 6. Wrong payer fails before verify.
{
  const fixture = adapterFixture({});
  const response = await handleBtcAgentX402BaseSepoliaRuntime(
    {
      body: request,
      paymentSignatureHeader: signedHeader({ from: "0x2222222222222222222222222222222222222222" }),
      resourceUrl,
      env: enabledEnv,
    },
    { adapter: fixture.adapter },
  );
  assert.equal(response.status, 402);
  assert.equal(bodyCode(response), "PAYMENT_PAYER_MISMATCH");
  assert.deepEqual(fixture.counts(), { verifyCalls: 0, settleCalls: 0 });
}

// 7. Wrong accepted amount fails exact membrane matching before verify.
{
  const fixture = adapterFixture({});
  const requirements = btcAgentX402BaseSepoliaPaymentRequirements(enabledEnv);
  const response = await handleBtcAgentX402BaseSepoliaRuntime(
    {
      body: request,
      paymentSignatureHeader: signedHeader({ accepted: { ...requirements, amount: "500001" } }),
      resourceUrl,
      env: enabledEnv,
    },
    { adapter: fixture.adapter },
  );
  assert.equal(response.status, 402);
  assert.equal(bodyCode(response), "PAYMENT_REQUIREMENTS_MISMATCH");
  assert.deepEqual(fixture.counts(), { verifyCalls: 0, settleCalls: 0 });
}

// 8. Settlement receipt mismatch blocks evidence.
{
  const fixture = adapterFixture({
    settle: {
      success: true,
      payer: BTC_AGENT_X402_BASE_SEPOLIA_PAYER_ADDRESS,
      transaction,
      network: "eip155:8453",
      amount: BTC_AGENT_X402_BASE_SEPOLIA_AMOUNT_ATOMIC,
    },
  });
  const evidenceCalls = { value: 0 };
  const response = await handleBtcAgentX402BaseSepoliaRuntime(
    { body: request, paymentSignatureHeader: signedHeader(), resourceUrl, env: enabledEnv },
    { adapter: fixture.adapter, evidenceRuntime: countedEvidenceRuntime(evidenceCalls) },
  );
  assert.equal(response.status, 502);
  assert.equal(bodyCode(response), "SETTLEMENT_NETWORK_MISMATCH");
  assert.equal(evidenceCalls.value, 0);
}

// 9. Production environment fails closed before adapter/evidence.
{
  const fixture = adapterFixture({});
  const evidenceCalls = { value: 0 };
  const response = await handleBtcAgentX402BaseSepoliaRuntime(
    {
      body: request,
      paymentSignatureHeader: signedHeader(),
      resourceUrl,
      env: { ...enabledEnv, VERCEL_ENV: "production" },
    },
    { adapter: fixture.adapter, evidenceRuntime: countedEvidenceRuntime(evidenceCalls) },
  );
  assert.equal(response.status, 503);
  assert.equal(bodyCode(response), "PRODUCTION_ENV_FORBIDDEN");
  assert.deepEqual(fixture.counts(), { verifyCalls: 0, settleCalls: 0 });
  assert.equal(evidenceCalls.value, 0);
}

// 10. Public preview mock token cannot act as testnet payment authority.
{
  const fixture = adapterFixture({});
  const response = await handleBtcAgentX402BaseSepoliaRuntime(
    { body: request, paymentSignatureHeader: "mock-authorized-v0", resourceUrl, env: enabledEnv },
    { adapter: fixture.adapter },
  );
  assert.equal(response.status, 402);
  assert.equal(bodyCode(response), "PAYMENT_SIGNATURE_INVALID");
  assert.deepEqual(fixture.counts(), { verifyCalls: 0, settleCalls: 0 });
}

// 11. Official CLI adapter emits direct x402 verify/settle field shapes, without a shell.
{
  const requirements = btcAgentX402BaseSepoliaPaymentRequirements(enabledEnv);
  const paymentPayload = JSON.parse(Buffer.from(signedHeader(), "base64").toString("utf8"));
  const verifyArgs = cdpX402CliArgs("verify", {
    x402Version: 2,
    paymentPayload,
    paymentRequirements: requirements,
  });
  const settleArgs = cdpX402CliArgs("settle", {
    x402Version: 2,
    paymentPayload,
    paymentRequirements: requirements,
  });
  assert.deepEqual(verifyArgs.slice(0, 2), ["x402", "verify"]);
  assert.deepEqual(settleArgs.slice(0, 2), ["x402", "settle"]);
  assert.match(verifyArgs[2], /^paymentPayload:=/);
  assert.match(verifyArgs[3], /^paymentRequirements:=/);
  assert.equal(verifyArgs[4], "x402Version=2");
  const adapterSource = readFileSync("lib/server/btc-agent-x402-cdp-cli-adapter-v0.ts", "utf8");
  assert.match(adapterSource, /execFileAsync/);
  assert.doesNotMatch(adapterSource, /exec\(/);
  assert.doesNotMatch(adapterSource, /cdp_api_key\.json|cdp_wallet_secret\.txt/);
}

// 12. Accepted public/production contract remains unchanged semantically.
{
  const publicBoundary = btcAgentX402PreviewBoundary();
  assert.equal(publicBoundary.network, "eip155:8453");
  assert.equal(publicBoundary.pay_to, null);
  assert.equal(publicBoundary.settlement_enabled, false);
  assert.equal(publicBoundary.production_payment_enabled, false);
  const descriptor = JSON.parse(readFileSync("public/.well-known/bhrigu-agent-commerce.json", "utf8"));
  assert.equal(descriptor.production_payment_enabled, false);
  assert.equal(descriptor.pay_to_bound, false);
  assert.equal(descriptor.x402.network, "eip155:8453");
  assert.equal(descriptor.x402.pay_to, null);
  assert.equal(descriptor.x402.settlement_enabled, false);
  assert.equal(descriptor.bazaar.external_registration, false);
}

console.log(JSON.stringify({
  ok: true,
  schema: "btc_agent_x402_base_sepolia_receipt_bound_runtime_acceptance_v0",
  checks: {
    unpaid_payment_required_v2: true,
    evidence_before_settlement_zero: true,
    signed_fixture_reaches_verify_adapter: true,
    verify_failure_blocks_settle_and_evidence: true,
    settle_failure_blocks_evidence: true,
    successful_mock_settle_receipt_bound_evidence: true,
    settlement_once_per_request: true,
    payer_exact: BTC_AGENT_X402_BASE_SEPOLIA_PAYER_ADDRESS,
    receiver_exact: BTC_AGENT_X402_BASE_SEPOLIA_RECEIVER_ADDRESS,
    network_exact: BTC_AGENT_X402_BASE_SEPOLIA_NETWORK,
    asset_exact: BTC_AGENT_X402_BASE_SEPOLIA_ASSET,
    amount_atomic_exact: BTC_AGENT_X402_BASE_SEPOLIA_AMOUNT_ATOMIC,
    production_fail_closed: true,
    preview_mock_rejected: true,
    cli_adapter_official_shapes: true,
    public_production_contract_preserved: true,
    live_signature: false,
    live_verify: false,
    live_settle: false,
    blockchain_transactions: 0,
    paid_attempt: "0/1",
  },
}, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
