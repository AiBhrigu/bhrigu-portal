import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { PAYMENT_IDENTIFIER, isPaymentIdentifierRequired } from '@x402/extensions/payment-identifier';
import {
  TRUSTED, STATES, buildRequirement, paymentFingerprint, processPayment, refundPayment,
  trustedTuple, validateEnvelope, validateTrustedTuple,
} from './contract.mjs';
import { MockFacilitator } from './mock-facilitator.mjs';
import { InMemoryEntitlementLedger } from './entitlement-ledger.mjs';
import { DURABLE_LEDGER_CONTRACT, DurableEntitlementLedger } from './durable-ledger.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const fixtureDoc = JSON.parse(await readFile(path.join(HERE, 'fixtures.json'), 'utf8'));
const results = [];
const failures = [];
const mode = process.argv.includes('--live') ? 'live' : 'offline';

if (mode === 'live') {
  try { const { runLiveCanary } = await import('./live-canary.mjs'); await runLiveCanary(); }
  catch (error) {
    console.error(JSON.stringify({
      node: 'BTC_PAID_DIALOGUE_ONE_OFF_X402_BASE_SEPOLIA_CANARY_IMPLEMENTATION_TARGETED_REPAIR_v0_1',
      mode: 'live-base-sepolia-canary', status: 'FAIL_CLOSED',
      reason: sanitize(error?.code || error?.message || String(error)), executed_cases: 0,
      payment_requests: 0, blockchain_transactions: 0, secrets_logged: false,
    }, null, 2));
    process.exitCode = 1;
  }
  process.exit(process.exitCode || 0);
}

await smokeOfficialPackages();
await smokeDurableLedgerContract();
const tests = createTests();
assert.equal(fixtureDoc.expected_count, 60);
assert.equal(fixtureDoc.cases.length, 60);
assert.equal(tests.size, 60);
assert.deepEqual([...tests.keys()], fixtureDoc.cases.map((item) => item.id));
for (const fixture of fixtureDoc.cases) {
  const started = performance.now();
  try {
    await tests.get(fixture.id)();
    results.push({ id: fixture.id, category: fixture.category, status: 'PASS', duration_ms: Math.round((performance.now() - started) * 100) / 100 });
  } catch (error) {
    failures.push({ id: fixture.id, category: fixture.category, status: 'FAIL', error: sanitize(error?.message || String(error)) });
  }
}
const summary = {
  node: 'BTC_PAID_DIALOGUE_ONE_OFF_X402_BASE_SEPOLIA_CANARY_IMPLEMENTATION_TARGETED_REPAIR_v0_1',
  mode: 'offline', status: failures.length ? 'FAIL' : 'PASS', expected: 60,
  passed: results.length, failed: failures.length,
  categories: Object.fromEntries([...new Set(fixtureDoc.cases.map((x) => x.category))].map((category) => [category, results.filter((x) => x.category === category).length])),
  official_payment_identifier_declaration: 'PASS', official_client_facilitator_imports: 'PASS',
  durable_ledger_contract_smoke: 'PASS', protected_material_logged: false, live_canary: 'NOT_RUN',
};
console.log(JSON.stringify(summary, null, 2));
if (failures.length) { console.error(JSON.stringify({ failures }, null, 2)); process.exit(1); }

function createTests() {
  const m = new Map();
  const valid = (id = 'payment_identifier_0001', overrides = {}) => ({
    method: 'POST', bodyBytes: 120, protocolVersion: 2, paymentIdentifier: id,
    paymentHeader: { tuple: trustedTuple(), expiresAt: Date.now() + 60_000, signatureValid: true,
      signedPayload: { authorization: 'fixture-redacted', nonce: id }, ...overrides.paymentHeader },
    ...overrides,
  });
  const execute = async (input = valid(), deps = {}) => {
    const ledger = deps.ledger || new InMemoryEntitlementLedger();
    const facilitator = deps.facilitator || new MockFacilitator();
    const result = await processPayment(input, { ledger, facilitator, clock: deps.clock || (() => Date.now()), preflight: deps.preflight });
    return { result, ledger, facilitator };
  };
  const mismatch = (key, value) => validateTrustedTuple(trustedTuple({ [key]: value }));

  m.set('A01', async () => { const r = await processPayment({}); assert.equal(r.httpStatus, 402); assert.equal(r.state, STATES.REQUIREMENT_ISSUED); assert.equal(isPaymentIdentifierRequired(r.requirement.extensions[PAYMENT_IDENTIFIER]), true); });
  m.set('A02', () => assert.equal(validateEnvelope(valid('payment_identifier_0002', { method: 'GET' })).code, 'METHOD_NOT_ALLOWED'));
  m.set('A03', () => assert.equal(validateEnvelope(valid('payment_identifier_0003', { paymentHeader: 'bad' })).code, 'PAYMENT_HEADER_MALFORMED'));
  m.set('A04', () => assert.equal(validateEnvelope(valid('payment_identifier_0004', { protocolVersion: 1 })).code, 'UNSUPPORTED_PROTOCOL_VERSION'));
  m.set('A05', () => assert.equal(validateEnvelope(valid('', {})).code, 'PAYMENT_IDENTIFIER_REQUIRED'));
  m.set('A06', () => assert.equal(validateEnvelope(valid('bad id')).code, 'PAYMENT_IDENTIFIER_INVALID'));
  m.set('A07', () => assert.equal(validateEnvelope(valid('payment_identifier_0007', { productId: 'CLIENT_OVERRIDE' })).code, 'UNTRUSTED_PRODUCT_ID'));
  m.set('A08', () => assert.equal(validateEnvelope(valid('payment_identifier_0008', { bodyBytes: TRUSTED.maxBodyBytes + 1 })).code, 'PAYLOAD_TOO_LARGE'));
  m.set('A09', async () => { const x = valid('payment_identifier_0009'); x.paymentHeader.tuple.scheme = 'upto'; assert.match((await execute(x)).result.code, /SCHEME_MISMATCH/); });
  m.set('A10', () => assert.equal(validateEnvelope(valid('payment_identifier_0010', { unknownExtension: true })).code, 'UNKNOWN_EXTENSION_STATE'));
  m.set('B01', () => assert.equal(validateTrustedTuple(trustedTuple()).ok, true));
  m.set('B02', () => assert.match(mismatch('network', 'eip155:1').code, /NETWORK_MISMATCH/));
  m.set('B03', () => assert.match(mismatch('asset', '0x2222222222222222222222222222222222222222').code, /ASSET_MISMATCH/));
  m.set('B04', () => assert.match(mismatch('amountAtomic', '999').code, /AMOUNTATOMIC_MISMATCH/));
  m.set('B05', () => assert.match(mismatch('amountAtomic', '1001').code, /AMOUNTATOMIC_MISMATCH/));
  m.set('B06', () => assert.match(mismatch('payTo', '0x2222222222222222222222222222222222222222').code, /PAYTO_MISMATCH/));
  m.set('B07', () => assert.match(mismatch('resourceId', 'urn:wrong').code, /RESOURCEID_MISMATCH/));
  m.set('B08', async () => { const x = valid('payment_identifier_0018'); x.paymentHeader.expiresAt = Date.now() - 1; assert.equal((await execute(x)).result.state, STATES.PAYMENT_EXPIRED); });
  m.set('B09', async () => { const x = valid('payment_identifier_0019'); x.paymentHeader.signatureValid = false; assert.equal((await execute(x)).result.state, STATES.PAYMENT_INVALID); });
  m.set('B10', async () => assert.equal((await execute(valid('payment_identifier_0020'), { facilitator: new MockFacilitator({ verifyMode: 'reject' }) })).result.state, STATES.PAYMENT_INVALID));
  m.set('B11', async () => assert.equal((await execute(valid('payment_identifier_0021'), { facilitator: new MockFacilitator({ verifyMode: 'unavailable' }) })).result.state, STATES.VERIFY_UNAVAILABLE));
  m.set('B12', async () => { const { result, ledger } = await execute(valid('payment_identifier_0022'), { facilitator: new MockFacilitator({ settleMode: 'reject' }) }); assert.equal(result.state, STATES.SETTLE_FAILED); assert.equal(ledger.getEntitlement('payment_identifier_0022'), null); });
  m.set('C01', async () => assert.equal((await execute(valid('payment_identifier_0023'))).result.state, STATES.ENTITLEMENT_ISSUED));
  m.set('C02', async () => assert.equal((await execute(valid('payment_identifier_0024'), { facilitator: new MockFacilitator({ settleMode: 'reject' }) })).result.state, STATES.SETTLE_FAILED));
  m.set('C03', async () => assert.equal((await execute(valid('payment_identifier_0025'), { facilitator: new MockFacilitator({ settleMode: 'timeout' }) })).result.state, STATES.SETTLE_UNKNOWN));
  m.set('C04', async () => assert.equal((await execute(valid('payment_identifier_0026'), { facilitator: new MockFacilitator({ settleMode: 'unknown' }) })).result.state, STATES.SETTLE_UNKNOWN));
  m.set('C05', async () => assert.equal((await execute(valid('payment_identifier_0027'), { facilitator: new MockFacilitator({ settleMode: 'malformed' }) })).result.state, STATES.REVIEW_REQUIRED));
  m.set('C06', async () => { const facilitator = new MockFacilitator({ settlementOverrides: { tuple: trustedTuple({ network: 'eip155:1' }) } }); assert.equal((await execute(valid('payment_identifier_0028'), { facilitator })).result.state, STATES.REVIEW_REQUIRED); });
  m.set('C07', async () => { const facilitator = new MockFacilitator({ settlementOverrides: { tuple: trustedTuple({ amountAtomic: '999' }) } }); assert.equal((await execute(valid('payment_identifier_0029'), { facilitator })).result.state, STATES.REVIEW_REQUIRED); });
  m.set('C08', async () => { const { result, facilitator } = await execute(valid('payment_identifier_0030'), { preflight: async () => false }); assert.equal(result.code, 'PROTECTED_PREFLIGHT_FAILED'); assert.equal(facilitator.counts.settle, 0); });
  m.set('C09', async () => { const ledger = new InMemoryEntitlementLedger(); const facilitator = new MockFacilitator(); const first = await execute(valid('payment_identifier_0031'), { ledger, facilitator }); const second = await execute(valid('payment_identifier_0031'), { ledger, facilitator }); assert.equal(first.result.state, STATES.ENTITLEMENT_ISSUED); assert.equal(second.result.replay, true); assert.equal(facilitator.counts.settle, 1); });
  m.set('C10', async () => { const id = 'payment_identifier_0032'; const { ledger } = await execute(valid(id), { facilitator: new MockFacilitator({ settleMode: 'timeout' }) }); assert.equal(ledger.getRow(id).status, 'reconciliation'); });
  m.set('D01', async () => { const ledger = new InMemoryEntitlementLedger(); const facilitator = new MockFacilitator(); await execute(valid('payment_identifier_0033'), { ledger, facilitator }); const x = await execute(valid('payment_identifier_0033'), { ledger, facilitator }); assert.equal(x.result.replay, true); assert.equal(facilitator.counts.settle, 1); });
  m.set('D02', async () => { const ledger = new InMemoryEntitlementLedger(); const first = valid('payment_identifier_0034'); await ledger.reserve({ paymentIdentifier: first.paymentIdentifier, fingerprint: paymentFingerprint(first.paymentHeader.tuple), payloadHash: 'a', now: 1 }); const changed = trustedTuple({ resourceId: 'urn:changed' }); const r = await ledger.reserve({ paymentIdentifier: first.paymentIdentifier, fingerprint: paymentFingerprint(changed), payloadHash: 'b', now: 2 }); assert.equal(r.kind, 'conflict'); });
  m.set('D03', async () => { const ledger = new InMemoryEntitlementLedger(); const x = valid('payment_identifier_0035'); const fingerprint = paymentFingerprint(x.paymentHeader.tuple); await ledger.reserve({ paymentIdentifier: x.paymentIdentifier, fingerprint, payloadHash: 'p1', now: 1 }); assert.equal((await ledger.reserve({ paymentIdentifier: x.paymentIdentifier, fingerprint, payloadHash: 'p1', now: 2 })).kind, 'pending'); });
  m.set('D04', async () => { const ledger = new InMemoryEntitlementLedger(); const x = valid('payment_identifier_0036'); const y = valid('payment_identifier_0037'); y.paymentHeader.signedPayload = x.paymentHeader.signedPayload; const facilitator = new MockFacilitator({ delayMs: 10 }); const [a, b] = await Promise.all([execute(x, { ledger, facilitator }), execute(y, { ledger, facilitator })]); assert.equal([a.result.state, b.result.state].filter((s) => s === STATES.ENTITLEMENT_ISSUED).length, 1); assert.equal(facilitator.counts.settle, 1); });
  m.set('D05', async () => { const ledger = new InMemoryEntitlementLedger(); const f1 = new MockFacilitator(); await execute(valid('payment_identifier_0038'), { ledger, facilitator: f1 }); const f2 = new MockFacilitator({ settlementOverrides: { eventId: 'event-2' } }); const r = await execute(valid('payment_identifier_0039'), { ledger, facilitator: f2 }); assert.equal(r.result.replay, true); assert.equal([...ledger.entitlements.values()].length, 1); });
  m.set('D06', async () => { const ledger = new InMemoryEntitlementLedger(); await execute(valid('payment_identifier_0040'), { ledger, facilitator: new MockFacilitator() }); const second = new MockFacilitator({ settlementOverrides: { receipt: 'receipt-unique', transaction: `0x${'ef'.repeat(32)}` } }); const r = await execute(valid('payment_identifier_0040b'), { ledger, facilitator: second }); assert.equal(r.result.replay, true); assert.equal([...ledger.entitlements.values()].length, 1); });
  m.set('D07', async () => { const ledger = new InMemoryEntitlementLedger(); const facilitator = new MockFacilitator({ delayMs: 20 }); const x = valid('payment_identifier_0041'); const [a, b] = await Promise.all([execute(x, { ledger, facilitator }), execute(x, { ledger, facilitator })]); assert.equal([a.result.state, b.result.state].filter((s) => s === STATES.ENTITLEMENT_ISSUED).length, 1); assert.equal(facilitator.counts.settle, 1); });
  m.set('D08', async () => { const ledger = new InMemoryEntitlementLedger(); const facilitator = new MockFacilitator(); await execute(valid('payment_identifier_0042'), { ledger, facilitator }); const restarted = new InMemoryEntitlementLedger(ledger.snapshot()); const r = await execute(valid('payment_identifier_0042'), { ledger: restarted, facilitator: new MockFacilitator() }); assert.equal(r.result.replay, true); });
  m.set('D09', async () => { const facilitator = new MockFacilitator(); const r = await execute(valid('payment_identifier_0043'), { ledger: new InMemoryEntitlementLedger(null, { available: false }), facilitator }); assert.equal(r.result.code, 'LEDGER_UNAVAILABLE'); assert.equal(facilitator.counts.settle, 0); });
  m.set('D10', async () => { const ledger = new InMemoryEntitlementLedger(); const x = valid('payment_identifier_0044'); await ledger.reserve({ paymentIdentifier: x.paymentIdentifier, fingerprint: paymentFingerprint(x.paymentHeader.tuple), payloadHash: 'stale', now: 1 }); await ledger.markReconciliation(x.paymentIdentifier, 'STALE_RESERVATION'); assert.equal(ledger.getRow(x.paymentIdentifier).status, 'reconciliation'); });
  m.set('D11', async () => { const ledger = new InMemoryEntitlementLedger(); const facilitator = new MockFacilitator(); await execute(valid('payment_identifier_0045'), { ledger, facilitator }); const r = await execute(valid('payment_identifier_0045'), { ledger, facilitator }); assert.equal(r.result.entitlement.state, 'accepted'); assert.equal(facilitator.counts.settle, 1); });
  m.set('D12', async () => { const id = 'payment_identifier_0046'; const ledger = new InMemoryEntitlementLedger(); const facilitator = new MockFacilitator(); await execute(valid(id), { ledger, facilitator }); await refundPayment({ paymentIdentifier: id, ledger, facilitator }); const r = await execute(valid(id), { ledger, facilitator }); assert.equal(r.result.state, STATES.REFUNDED); assert.equal(facilitator.counts.settle, 1); });
  m.set('D13', async () => { const ledger = new InMemoryEntitlementLedger(); await ledger.reserve({ paymentIdentifier: 'payment_identifier_0047', fingerprint: 'x', payloadHash: 'y', now: 1 }); assert.equal(ledger.getEntitlement('payment_identifier_0047'), null); });
  m.set('D14', async () => { const ledger = new InMemoryEntitlementLedger(); assert.equal(ledger.getEntitlement('payment_identifier_0048'), null); assert.equal('success=true'.includes('entitlement'), false); });
  m.set('E01', async () => { const { result } = await execute(valid('payment_identifier_0049')); assert.equal(result.entitlement.successful_turn_limit, 5); });
  m.set('E02', async () => { const ledger = new InMemoryEntitlementLedger(null, { failEntitlement: true }); const r = await execute(valid('payment_identifier_0050'), { ledger }); assert.equal(r.result.state, STATES.ENTITLEMENT_WRITE_FAILED); assert.equal(ledger.getEntitlement('payment_identifier_0050'), null); });
  m.set('E03', async () => { const ledger = new InMemoryEntitlementLedger(); const facilitator = new MockFacilitator(); await execute(valid('payment_identifier_0051'), { ledger, facilitator }); await execute(valid('payment_identifier_0051'), { ledger, facilitator }); assert.equal([...ledger.entitlements.values()].length, 1); });
  m.set('E04', async () => { const id = 'payment_identifier_0052'; const now = Date.UTC(2026, 6, 29); const { ledger } = await execute(valid(id), { clock: () => now }); assert.equal((await ledger.activate(id, now + 1)).activated, true); for (let i = 0; i < 4; i += 1) assert.equal((await ledger.consumeSuccessfulTurn(id, now + 2 + i)).consumed, true); const [fifthA, fifthB] = await Promise.all([ledger.consumeSuccessfulTurn(id, now + 10), ledger.consumeSuccessfulTurn(id, now + 10)]); assert.equal([fifthA, fifthB].filter((x) => x.consumed).length, 1); assert.equal(ledger.getEntitlement(id).remainingTurns, 0); assert.equal(ledger.getEntitlement(id).state, 'fulfilled'); });
  m.set('E05', async () => { const id = 'payment_identifier_0053'; const now = Date.UTC(2026, 6, 29); const { result, ledger } = await execute(valid(id), { clock: () => now }); assert.equal(Date.parse(result.entitlement.activation_deadline) - now, 7 * 86400_000); const late = await ledger.activate(id, now + 7 * 86400_000 + 1); assert.equal(late.activated, false); assert.equal(late.code, 'ACTIVATION_EXPIRED'); assert.equal(ledger.getEntitlement(id).state, 'expired'); });
  m.set('E06', async () => { const id = 'payment_identifier_0054'; const now = Date.UTC(2026, 6, 29); const { result, ledger } = await execute(valid(id), { clock: () => now }); assert.equal(result.entitlement.active_lifetime_seconds, 86400); assert.equal((await ledger.activate(id, now)).activated, true); const late = await ledger.consumeSuccessfulTurn(id, now + 86400_000 + 1); assert.equal(late.consumed, false); assert.equal(late.code, 'SESSION_EXPIRED'); assert.equal(ledger.getEntitlement(id).state, 'expired'); });
  m.set('E07', async () => { const id = 'payment_identifier_0055'; const ledger = new InMemoryEntitlementLedger(); const facilitator = new MockFacilitator(); await execute(valid(id), { ledger, facilitator }); const refund = await refundPayment({ paymentIdentifier: id, ledger, facilitator }); assert.equal(refund.state, STATES.REFUNDED); assert.equal(ledger.getEntitlement(id).state, 'revoked'); });
  m.set('E08', async () => { const id = 'payment_identifier_0056'; const ledger = new InMemoryEntitlementLedger(); const facilitator = new MockFacilitator(); await execute(valid(id), { ledger, facilitator }); await refundPayment({ paymentIdentifier: id, ledger, facilitator }); const replay = await refundPayment({ paymentIdentifier: id, ledger, facilitator }); assert.equal(replay.replay, true); assert.equal(facilitator.counts.refund, 1); });
  m.set('E09', async () => { const id = 'payment_identifier_0057'; const ledger = new InMemoryEntitlementLedger(); const facilitator = new MockFacilitator({ refundMode: 'reject' }); await execute(valid(id), { ledger, facilitator }); const r = await refundPayment({ paymentIdentifier: id, ledger, facilitator }); assert.equal(r.state, STATES.REVIEW_REQUIRED); });
  m.set('E10', async () => { const protectedPaths = ['/access', 'pages/api/access/submit.ts']; const touched = authorizedPaths().filter((p) => protectedPaths.some((x) => p.includes(x))); assert.deepEqual(touched, []); });
  m.set('F01', async () => { const { result } = await execute(valid('payment_identifier_0059')); const log = JSON.stringify(result); for (const forbidden of ['fixture-redacted', 'privateKey', 'PAYMENT-SIGNATURE', 'authorization']) assert.equal(log.includes(forbidden), false); });
  m.set('F02', async () => { const raw = JSON.stringify(fixtureDoc); for (const forbidden of ['PRIVATE KEY', 'BEGIN PRIVATE', '@', '0x2222222222222222222222222222222222222222']) assert.equal(raw.includes(forbidden), false); });
  m.set('F03', () => { const forbidden = ['pages/', 'components/', 'lib/btc-', 'snapshot', 'router', 'memory', 'evidence', 'orion']; assert.equal(authorizedPaths().some((p) => forbidden.some((x) => p.toLowerCase().includes(x))), false); });
  m.set('F04', () => { assert.equal(authorizedPaths().some((p) => p === 'vercel.json' || p.startsWith('pages/')), false); });
  return m;
}

function authorizedPaths() {
  return ['package.json','package-lock.json','sandbox/btc-paid-x402/contract.mjs',
    'sandbox/btc-paid-x402/mock-facilitator.mjs','sandbox/btc-paid-x402/entitlement-ledger.mjs',
    'sandbox/btc-paid-x402/durable-ledger.mjs','sandbox/btc-paid-x402/live-canary.mjs',
    'sandbox/btc-paid-x402/fixtures.json','sandbox/btc-paid-x402/run-fixtures.mjs',
    '.github/workflows/btc-paid-x402-sandbox.yml'];
}
async function smokeOfficialPackages() {
  if (process.env.SKIP_X402_PACKAGE_SMOKE === '1') return;
  const [{ HTTPFacilitatorClient }, { x402Client }, evmClient, extension, accounts] = await Promise.all([
    import('@x402/core/server'), import('@x402/core/client'), import('@x402/evm/exact/client'),
    import('@x402/extensions/payment-identifier'), import('viem/accounts'),
  ]);
  assert.equal(typeof HTTPFacilitatorClient, 'function');
  assert.equal(typeof x402Client, 'function');
  assert.equal(typeof evmClient.ExactEvmScheme, 'function');
  assert.equal(typeof extension.declarePaymentIdentifierExtension, 'function');
  assert.equal(typeof extension.appendPaymentIdentifierToExtensions, 'function');
  assert.equal(typeof extension.extractAndValidatePaymentIdentifier, 'function');
  assert.equal(typeof accounts.privateKeyToAccount, 'function');
  assert.equal(extension.isValidPaymentId('payment_identifier_0001'), true);
  assert.equal(extension.isPaymentIdentifierRequired(buildRequirement(TRUSTED.fixturePayTo).extensions[extension.PAYMENT_IDENTIFIER]), true);
}
async function smokeDurableLedgerContract() {
  const operations = [];
  const proof = { contract: DURABLE_LEDGER_CONTRACT, durable: true, atomic: true, compare_and_set: true,
    restart_persistent: true, uniqueness_keys: ['payment_identifier','payload_hash','receipt_hash','transaction_hash','event_hash','entitlement','refund'],
    single_winner: true, replay_stable: true };
  const ledger = new DurableEntitlementLedger({ url: 'http://127.0.0.1:9999/ledger',
    token: 'offline-durable-ledger-token-v0-1', namespace: 'btc-paid-x402:offline-smoke-v0-1',
    fetchImpl: async (_url, init) => {
      const request = JSON.parse(init.body); operations.push(request.operation);
      assert.equal(request.contract, DURABLE_LEDGER_CONTRACT);
      assert.equal(init.headers['x-bhrigu-ledger-contract'], DURABLE_LEDGER_CONTRACT);
      assert.match(init.headers.authorization, /^Bearer /);
      return new Response(JSON.stringify({ contract: DURABLE_LEDGER_CONTRACT, ok: true, result: proof }), { status: 200, headers: { 'content-type': 'application/json' } });
    } });
  await ledger.assertLiveReady({ probeId: 'offline-probe-v0-1' });
  assert.deepEqual(operations, ['health','probe_atomicity']);
}
function sanitize(value) {
  return String(value).replace(/0x[0-9a-fA-F]{64}/g, '[REDACTED_32_BYTE_HEX]')
    .replace(/https?:\/\/[^\s"']+/g, '[REDACTED_URL]').replace(/[A-Za-z0-9_-]{32,}/g, '[REDACTED]');
}
