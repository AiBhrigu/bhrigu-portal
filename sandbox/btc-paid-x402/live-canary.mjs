import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import { x402Client } from '@x402/core/client';
import { HTTPFacilitatorClient } from '@x402/core/server';
import { ExactEvmScheme } from '@x402/evm/exact/client';
import {
  PAYMENT_IDENTIFIER, appendPaymentIdentifierToExtensions, extractAndValidatePaymentIdentifier,
  isPaymentIdentifierRequired, validatePaymentIdentifierRequirement,
} from '@x402/extensions/payment-identifier';
import { createPublicClient, createWalletClient, http, parseAbi } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { baseSepolia } from 'viem/chains';
import {
  OFFLINE_FIXTURE_EVIDENCE_KEY, STATES, TRUSTED, buildRequirement, canonical, hmacReference,
  paymentFingerprint, processPayment, refundPayment, sha256, trustedTuple,
  validateOfficialPaymentPayload,
} from './contract.mjs';
import { DurableEntitlementLedger } from './durable-ledger.mjs';

const ABI = parseAbi([
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function transfer(address to, uint256 value) returns (bool)',
]);
const ZERO = '0x0000000000000000000000000000000000000000';
const REQUIRED = [
  'X402_SANDBOX_PAYER_PRIVATE_KEY','X402_SANDBOX_RECEIVER_PRIVATE_KEY',
  'X402_SANDBOX_PAYER_ADDRESS','X402_SANDBOX_RECEIVER_ADDRESS',
  'X402_SANDBOX_BASE_SEPOLIA_RPC_URL','X402_SANDBOX_DURABLE_LEDGER_URL',
  'X402_SANDBOX_DURABLE_LEDGER_TOKEN','X402_SANDBOX_EVIDENCE_HMAC_KEY',
  'X402_SANDBOX_FACILITATOR_URL','X402_SANDBOX_REVIEWED_HEAD_SHA',
  'X402_SANDBOX_LIVE_EXECUTION_ACK','X402_SANDBOX_MAX_GROSS_USDC_ATOMIC','GITHUB_SHA',
];
const runtime = {
  executed_cases: 0, payment_requests: 0, blockchain_transactions: 0,
  settlement_transaction: null, refund_transaction: null,
};

export async function runLiveCanary(env = process.env) {
  const missing = REQUIRED.filter((name) => !env[name]);
  if (missing.length) return hold('DEDICATED_TESTNET_INPUTS_ABSENT', { missing_inputs: missing });
  try { return await execute(env); }
  catch (error) {
    const report = {
      node: 'BTC_PAID_DIALOGUE_ONE_OFF_X402_BASE_SEPOLIA_CANARY_IMPLEMENTATION_TARGETED_REPAIR_v0_1',
      mode: 'live-base-sepolia-canary',
      status: runtime.blockchain_transactions ? 'FAIL_CLOSED_RECONCILIATION_REQUIRED' : 'FAIL_CLOSED',
      reason: safeCode(error?.code || error?.message || error),
      reviewed_head_sha: env.X402_SANDBOX_REVIEWED_HEAD_SHA,
      workflow_run_id: env.GITHUB_RUN_ID || 'protected-local',
      ...runtime, secrets_logged: false, raw_payment_payload_logged: false,
    };
    await retain(report);
    console.error(JSON.stringify(report, bigintJson, 2));
    process.exitCode = 1;
    return report;
  }
}

async function execute(env) {
  const ctx = await preflight(env);
  const cases = [];
  const pass = (id, proof = {}) => { cases.push({ id, status: 'PASS', ...proof }); runtime.executed_cases = cases.length; };

  const required = buildRequirement(ctx.receiver.address);
  assert.equal(required.x402Version, 2);
  assert.deepEqual(select(required.accepts[0]), {
    scheme: TRUSTED.scheme, network: TRUSTED.network, asset: TRUSTED.asset,
    amount: TRUSTED.amountAtomic, payTo: ctx.receiver.address,
  });
  assert.equal(isPaymentIdentifierRequired(required.extensions[PAYMENT_IDENTIFIER]), true);
  pass('01_REQUIREMENT_TRUTH', { payment_identifier_required: true });

  const paymentIdentifier = `bhrigu_${randomUUID().replaceAll('-', '')}`;
  const clientRequired = structuredClone(required);
  appendPaymentIdentifierToExtensions(clientRequired.extensions, paymentIdentifier);
  const client = new x402Client((version, accepts) => {
    assert.equal(version, TRUSTED.protocolVersion);
    const match = accepts.find((x) => x.scheme === TRUSTED.scheme && x.network === TRUSTED.network
      && x.asset.toLowerCase() === TRUSTED.asset.toLowerCase() && x.amount === TRUSTED.amountAtomic
      && x.payTo.toLowerCase() === ctx.receiver.address.toLowerCase());
    if (!match) throw new Error('IMMUTABLE_PAYMENT_REQUIREMENT_NOT_FOUND');
    return match;
  }).register(TRUSTED.network, new ExactEvmScheme(ctx.payer));
  const payload = await client.createPaymentPayload(clientRequired);
  runtime.payment_requests = 1;
  assert.equal(validateOfficialPaymentPayload(payload, ctx.receiver.address).ok, true);
  const extracted = extractAndValidatePaymentIdentifier(payload);
  assert.equal(extracted.validation.valid, true);
  assert.equal(extracted.id, paymentIdentifier);
  assert.equal(validatePaymentIdentifierRequirement(payload, true).valid, true);
  pass('02_OFFICIAL_BUYER_PAYLOAD', {
    payment_identifier_hash: hmacReference(paymentIdentifier, ctx.evidenceKey), payment_payload_logged: false,
  });

  const accepted = payload.accepted;
  const verified = await ctx.facilitator.verify(payload, accepted);
  assert.equal(verified.isValid, true);
  assert.equal(await ctx.ledger.getEntitlement(paymentIdentifier), null);
  pass('03_FACILITATOR_VERIFY', {
    payer_hash: hmacReference(verified.payer || ctx.payer.address, ctx.evidenceKey), entitlement_before_settlement: false,
  });

  const receiverBefore = await balance(ctx.publicClient, ctx.receiver.address);
  const adapter = facilitatorAdapter(ctx, payload, accepted);
  const tuple = trustedTuple({}, ctx.receiver.address);
  const input = {
    method: TRUSTED.method, bodyBytes: Buffer.byteLength(canonical(payload)),
    protocolVersion: TRUSTED.protocolVersion, paymentIdentifier,
    paymentHeader: { tuple, expiresAt: Date.now() + 60_000, signatureValid: true, signedPayload: payload, officialPayload: payload },
  };
  const deps = { ledger: ctx.ledger, facilitator: adapter, expectedPayTo: ctx.receiver.address,
    evidenceKey: ctx.evidenceKey, requirement: required, preflight: async () => true };
  const [a, b] = await Promise.all([processPayment(input, deps), processPayment(input, deps)]);
  const issued = [a, b].filter((x) => x.state === STATES.ENTITLEMENT_ISSUED);
  assert.equal(issued.length, 1);
  assert.equal(adapter.counts.settle, 1);
  const canonicalResult = issued[0];
  const settleTx = adapter.transactions.settlement;
  assert.match(settleTx, /^0x[0-9a-fA-F]{64}$/);
  runtime.settlement_transaction = settleTx;
  runtime.blockchain_transactions = 1;
  const settleReceipt = await ctx.publicClient.waitForTransactionReceipt({ hash: settleTx, confirmations: 1 });
  assert.equal(settleReceipt.status, 'success');
  assert.equal((await balance(ctx.publicClient, ctx.receiver.address)) - receiverBefore, BigInt(TRUSTED.amountAtomic));
  pass('04_ONCHAIN_SETTLEMENT_AND_RECEIVER_DELTA', {
    settlement_transaction: settleTx, settlement_block: settleReceipt.blockNumber.toString(), receiver_delta_atomic: TRUSTED.amountAtomic,
  });

  const replay = await processPayment(input, deps);
  assert.equal(replay.replay, true);
  assert.equal(replay.entitlement.id, canonicalResult.entitlement.id);
  assert.equal(adapter.counts.settle, 1);
  pass('05_PAYMENT_ID_REPLAY', { settle_calls_after_replay: 1 });
  pass('06_CONCURRENT_SINGLE_SETTLEMENT', { settle_calls: 1, entitlement_count: 1 });

  const duplicateId = `bhrigu_${randomUUID().replaceAll('-', '')}`;
  const duplicatePayloadHash = sha256('duplicate-evidence-canary-v0-1');
  assert.equal((await ctx.ledger.reserve({ paymentIdentifier: duplicateId, fingerprint: paymentFingerprint(tuple), payloadHash: duplicatePayloadHash, now: Date.now() })).kind, 'new');
  const duplicate = await ctx.ledger.finalizeSettlement({
    paymentIdentifier: duplicateId, normalized: canonicalResult.payment, payloadHash: duplicatePayloadHash,
    receiptHash: canonicalResult.payment.receipt_reference_hash,
    transactionHash: canonicalResult.payment.transaction_reference_hash, eventHash: canonicalResult.payment.event_id,
  });
  assert.equal(duplicate.kind, 'duplicate');
  assert.equal(await ctx.ledger.getEntitlement(duplicateId), null);
  pass('07_DUPLICATE_RECEIPT_TX_EVENT', { second_entitlement: false });

  const restarted = new DurableEntitlementLedger({ url: env.X402_SANDBOX_DURABLE_LEDGER_URL,
    token: env.X402_SANDBOX_DURABLE_LEDGER_TOKEN, namespace: ctx.namespace });
  const restartedReplay = await restarted.reserve({ paymentIdentifier, fingerprint: paymentFingerprint(tuple),
    payloadHash: sha256(canonical(payload)), now: Date.now() });
  assert.equal(restartedReplay.kind, 'replay');
  assert.equal(restartedReplay.result.entitlement.id, canonicalResult.entitlement.id);
  pass('08_DURABLE_RESTART_REPLAY', { restart_persistent: true });

  assert.equal((await restarted.activate(paymentIdentifier, Date.now())).activated, true);
  for (let i = 0; i < 4; i += 1) assert.equal((await restarted.consumeSuccessfulTurn(paymentIdentifier, Date.now())).consumed, true);
  const fifth = await Promise.all([
    restarted.consumeSuccessfulTurn(paymentIdentifier, Date.now()),
    restarted.consumeSuccessfulTurn(paymentIdentifier, Date.now()),
  ]);
  assert.equal(fifth.filter((x) => x.consumed).length, 1);
  const fulfilled = await restarted.getEntitlement(paymentIdentifier);
  assert.equal(fulfilled.state, 'fulfilled');
  assert.equal(fulfilled.remainingTurns, 0);
  pass('09_FIVE_TURN_ENTITLEMENT_ATOMICITY', { fifth_turn_winners: 1, final_state: 'fulfilled' });

  const payerBeforeRefund = await balance(ctx.publicClient, ctx.payer.address);
  assert.equal((await refundPayment({ paymentIdentifier, ledger: restarted, facilitator: adapter })).state, STATES.REFUNDED);
  const refundTx = adapter.transactions.refund;
  assert.match(refundTx, /^0x[0-9a-fA-F]{64}$/);
  runtime.refund_transaction = refundTx;
  runtime.blockchain_transactions = 2;
  const refundReceipt = await ctx.publicClient.waitForTransactionReceipt({ hash: refundTx, confirmations: 1 });
  assert.equal(refundReceipt.status, 'success');
  assert.equal((await balance(ctx.publicClient, ctx.payer.address)) - payerBeforeRefund, BigInt(TRUSTED.amountAtomic));
  assert.equal((await refundPayment({ paymentIdentifier, ledger: restarted, facilitator: adapter })).replay, true);
  assert.equal(adapter.counts.refund, 1);
  assert.equal((await restarted.getEntitlement(paymentIdentifier)).state, 'revoked');
  pass('10_REAL_REVERSE_TRANSFER_REFUND', {
    refund_transaction: refundTx, refund_block: refundReceipt.blockNumber.toString(), payer_delta_atomic: TRUSTED.amountAtomic,
    refund_calls: 1, entitlement_state: 'revoked',
  });

  assert.equal(cases.length, 10);
  const report = {
    node: 'BTC_PAID_DIALOGUE_ONE_OFF_X402_BASE_SEPOLIA_CANARY_IMPLEMENTATION_TARGETED_REPAIR_v0_1',
    mode: 'live-base-sepolia-canary', status: 'PASS', reviewed_head_sha: env.X402_SANDBOX_REVIEWED_HEAD_SHA,
    workflow_run_id: env.GITHUB_RUN_ID || 'protected-local', network: TRUSTED.network, asset: TRUSTED.asset,
    amount_atomic: TRUSTED.amountAtomic, expected_cases: 10, executed_cases: 10, passed_cases: 10,
    payment_requests: 1, blockchain_transactions: 2, gross_test_usdc_atomic: '2000',
    payer_address_hash: hmacReference(ctx.payer.address.toLowerCase(), ctx.evidenceKey),
    receiver_address_hash: hmacReference(ctx.receiver.address.toLowerCase(), ctx.evidenceKey),
    namespace_hash: hmacReference(ctx.namespace, ctx.evidenceKey),
    cases: [...cases].sort((x, y) => Number(x.id.slice(0,2)) - Number(y.id.slice(0,2))),
    secrets_logged: false, raw_payment_payload_logged: false,
  };
  await retain(report);
  console.log(JSON.stringify(report, bigintJson, 2));
  return report;
}

async function preflight(env) {
  exact(env.GITHUB_SHA, env.X402_SANDBOX_REVIEWED_HEAD_SHA, 'EXACT_HEAD_REVIEW_REQUIRED');
  exact(env.X402_SANDBOX_LIVE_EXECUTION_ACK, 'BASE_SEPOLIA_TEST_USDC_ONLY', 'LIVE_EXECUTION_ACK_INVALID');
  exact(env.X402_SANDBOX_FACILITATOR_URL, TRUSTED.facilitatorUrl, 'FACILITATOR_URL_MISMATCH');
  exact(env.X402_SANDBOX_MAX_GROSS_USDC_ATOMIC, '2000', 'GROSS_USDC_BUDGET_MISMATCH');
  if (Buffer.byteLength(env.X402_SANDBOX_EVIDENCE_HMAC_KEY) < 32) throw new Error('EVIDENCE_HMAC_KEY_REQUIRED');
  if (env.X402_SANDBOX_EVIDENCE_HMAC_KEY === OFFLINE_FIXTURE_EVIDENCE_KEY) throw new Error('OFFLINE_EVIDENCE_KEY_FORBIDDEN_IN_LIVE_MODE');
  const payer = privateKeyToAccount(privateKey(env.X402_SANDBOX_PAYER_PRIVATE_KEY));
  const receiver = privateKeyToAccount(privateKey(env.X402_SANDBOX_RECEIVER_PRIVATE_KEY));
  addressEqual(payer.address, env.X402_SANDBOX_PAYER_ADDRESS, 'PAYER_ADDRESS_KEY_MISMATCH');
  addressEqual(receiver.address, env.X402_SANDBOX_RECEIVER_ADDRESS, 'RECEIVER_ADDRESS_KEY_MISMATCH');
  for (const [name, value] of [['PAYER', payer.address], ['RECEIVER', receiver.address]]) {
    if ([ZERO, TRUSTED.fixturePayTo].includes(value.toLowerCase())) throw new Error(`${name}_PLACEHOLDER_FORBIDDEN`);
  }
  if (payer.address.toLowerCase() === receiver.address.toLowerCase()) throw new Error('PAYER_RECEIVER_MUST_BE_DISTINCT');
  const transport = http(env.X402_SANDBOX_BASE_SEPOLIA_RPC_URL, { retryCount: 2, timeout: 10_000 });
  const publicClient = createPublicClient({ chain: baseSepolia, transport });
  const receiverWallet = createWalletClient({ account: receiver, chain: baseSepolia, transport });
  assert.equal(await publicClient.getChainId(), 84532);
  assert.equal(Number(await publicClient.readContract({ address: TRUSTED.asset, abi: ABI, functionName: 'decimals' })), TRUSTED.decimals);
  if (await balance(publicClient, payer.address) < BigInt(TRUSTED.amountAtomic)) throw new Error('PAYER_TEST_USDC_INSUFFICIENT');
  const receiverEth = await publicClient.getBalance({ address: receiver.address });
  if (receiverEth < 120_000n * await publicClient.getGasPrice() * 2n) throw new Error('RECEIVER_TEST_ETH_INSUFFICIENT');
  const facilitator = new HTTPFacilitatorClient({ url: TRUSTED.facilitatorUrl });
  const supported = await facilitator.getSupported();
  if (!supported.kinds.some((x) => x.x402Version === 2 && x.scheme === TRUSTED.scheme && x.network === TRUSTED.network)) throw new Error('FACILITATOR_IMMUTABLE_TUPLE_UNSUPPORTED');
  const namespace = `btc-paid-x402:${env.X402_SANDBOX_REVIEWED_HEAD_SHA}:${env.GITHUB_RUN_ID || 'protected-local'}`;
  const ledger = new DurableEntitlementLedger({ url: env.X402_SANDBOX_DURABLE_LEDGER_URL,
    token: env.X402_SANDBOX_DURABLE_LEDGER_TOKEN, namespace });
  await ledger.assertLiveReady({ probeId: `preflight-${env.X402_SANDBOX_REVIEWED_HEAD_SHA.slice(0,16)}` });
  return { payer, receiver, publicClient, receiverWallet, facilitator, ledger, namespace,
    evidenceKey: env.X402_SANDBOX_EVIDENCE_HMAC_KEY };
}

function facilitatorAdapter(ctx, payload, accepted) {
  const adapter = {
    evidenceKey: ctx.evidenceKey, counts: { verify: 0, settle: 0, refund: 0 },
    transactions: { settlement: null, refund: null },
    async verify(header) {
      assert.equal(header.officialPayload, payload);
      adapter.counts.verify += 1;
      const result = await ctx.facilitator.verify(payload, accepted);
      return { ...result, tuple: trustedTuple({}, accepted.payTo), verifiedAt: new Date().toISOString() };
    },
    async settle(header) {
      assert.equal(header.officialPayload, payload);
      adapter.counts.settle += 1;
      if (adapter.counts.settle > 1) throw codeError('SETTLEMENT_BUDGET_EXCEEDED');
      const result = await ctx.facilitator.settle(payload, accepted);
      if (!result?.success) return result;
      adapter.transactions.settlement = result.transaction;
      return { ...result, eventId: `x402-settle:${result.network}:${result.transaction}`,
        receipt: `x402-receipt:${result.transaction}`, tuple: trustedTuple({}, accepted.payTo), settledAt: new Date().toISOString() };
    },
    async refund(input) {
      adapter.counts.refund += 1;
      if (adapter.counts.refund > 1) throw codeError('REFUND_BUDGET_EXCEEDED');
      exact(String(input.amountAtomic), TRUSTED.amountAtomic, 'REFUND_AMOUNT_MISMATCH');
      addressEqual(input.asset, TRUSTED.asset, 'REFUND_ASSET_MISMATCH');
      const hash = await ctx.receiverWallet.writeContract({ address: TRUSTED.asset, abi: ABI,
        functionName: 'transfer', args: [ctx.payer.address, BigInt(TRUSTED.amountAtomic)] });
      adapter.transactions.refund = hash;
      const receipt = await ctx.publicClient.waitForTransactionReceipt({ hash, confirmations: 1 });
      if (receipt.status !== 'success') throw codeError('REFUND_TRANSACTION_REVERTED');
      return { success: true, transaction: hash };
    },
  };
  return adapter;
}

async function balance(client, address) { return client.readContract({ address: TRUSTED.asset, abi: ABI, functionName: 'balanceOf', args: [address] }); }
function select(x) { return { scheme: x.scheme, network: x.network, asset: x.asset, amount: x.amount, payTo: x.payTo }; }
function exact(actual, expected, code) { if (String(actual) !== String(expected)) throw new Error(code); }
function addressEqual(a, b, code) { if (String(a).toLowerCase() !== String(b).toLowerCase()) throw new Error(code); }
function privateKey(value) { if (!/^0x[0-9a-fA-F]{64}$/.test(String(value))) throw new Error('PRIVATE_KEY_FORMAT_INVALID'); return value; }
function codeError(code) { return Object.assign(new Error(code), { code }); }
function safeCode(value) { return String(value || 'UNKNOWN_LIVE_FAILURE').toUpperCase().replace(/[^A-Z0-9_:-]/g, '_').slice(0,160); }
function bigintJson(_key, value) { return typeof value === 'bigint' ? value.toString() : value; }
async function retain(report) { await writeFile('btc-paid-x402-live-evidence.json', `${JSON.stringify(report, bigintJson, 2)}\n`, { mode: 0o600 }); }
function hold(reason, extra = {}) {
  const report = { node: 'BTC_PAID_DIALOGUE_ONE_OFF_X402_BASE_SEPOLIA_CANARY_IMPLEMENTATION_TARGETED_REPAIR_v0_1',
    mode: 'live-base-sepolia-canary', status: 'HOLD_INPUT_REQUIRED', reason, required_cases: 10,
    executed_cases: 0, payment_requests: 0, blockchain_transactions: 0, secrets_logged: false, ...extra };
  console.log(JSON.stringify(report, null, 2)); process.exitCode = 2; return report;
}
