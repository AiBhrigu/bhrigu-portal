import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

export const TRUSTED = Object.freeze({
  provider: 'x402',
  protocolVersion: 2,
  environment: 'sandbox',
  scheme: 'exact',
  network: 'eip155:84532',
  asset: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
  assetSymbol: 'USDC',
  decimals: 6,
  amountAtomic: '1000',
  displayAmount: '0.001 test USDC',
  payTo: '0x1111111111111111111111111111111111111111',
  productId: 'BTC_DEEP_DIALOGUE_SESSION_PASS_V0_1',
  resourceId: 'urn:bhrigu:btc-deep-dialogue-session-pass:v0.1:sandbox',
  operation: 'issue_one_session_entitlement',
  method: 'POST',
  maxBodyBytes: 16_384,
  facilitatorUrl: 'https://x402.org/facilitator',
  activationWindowSeconds: 7 * 24 * 60 * 60,
  activeLifetimeSeconds: 24 * 60 * 60,
  successfulTurns: 5,
});

export const STATES = Object.freeze({
  REQUIREMENT_ISSUED: 'REQUIREMENT_ISSUED',
  REQUIREMENT_REJECTED: 'REQUIREMENT_REJECTED',
  PAYMENT_INVALID: 'PAYMENT_INVALID',
  PAYMENT_EXPIRED: 'PAYMENT_EXPIRED',
  PAYMENT_CONFLICT: 'PAYMENT_CONFLICT',
  PAYMENT_PENDING: 'PAYMENT_PENDING',
  VERIFY_UNAVAILABLE: 'VERIFY_UNAVAILABLE',
  PAYMENT_VERIFIED: 'PAYMENT_VERIFIED',
  SETTLE_FAILED: 'SETTLE_FAILED',
  SETTLE_UNKNOWN: 'SETTLE_UNKNOWN',
  PAYMENT_SETTLED: 'PAYMENT_SETTLED',
  ENTITLEMENT_WRITE_FAILED: 'ENTITLEMENT_WRITE_FAILED',
  ENTITLEMENT_ISSUED: 'ENTITLEMENT_ISSUED',
  REFUND_REQUIRED: 'REFUND_REQUIRED',
  REFUNDED: 'REFUNDED',
  REVIEW_REQUIRED: 'REVIEW_REQUIRED',
});

const PAYMENT_ID = /^[A-Za-z0-9_-]{16,128}$/;
const HEX_32 = /^0x[0-9a-fA-F]{64}$/;
const ADDRESS = /^0x[0-9a-fA-F]{40}$/;

export function sha256(value) {
  return createHash('sha256').update(String(value)).digest('hex');
}

export function hmacReference(value, key = 'offline-fixture-only-key') {
  return createHmac('sha256', key).update(String(value)).digest('hex');
}

export function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

export function paymentFingerprint(tuple = {}) {
  const normalized = {
    protocol_version: tuple.protocolVersion,
    scheme: tuple.scheme,
    network: tuple.network,
    asset: String(tuple.asset || '').toLowerCase(),
    amount_atomic: String(tuple.amountAtomic),
    pay_to_hash: sha256(String(tuple.payTo || '').toLowerCase()),
    resource_id: tuple.resourceId,
    product_id: tuple.productId,
    http_method: tuple.method,
    logical_operation: tuple.operation,
    environment: tuple.environment,
  };
  return sha256(canonical(normalized));
}

export function trustedTuple(overrides = {}) {
  return { ...TRUSTED, ...overrides };
}

export function buildRequirement(payTo = TRUSTED.payTo) {
  if (!ADDRESS.test(payTo)) throw new Error('INVALID_TRUSTED_PAY_TO');
  return {
    x402Version: TRUSTED.protocolVersion,
    resource: {
      url: TRUSTED.resourceId,
      description: 'One sandbox BTC Deep Dialogue entitlement',
      mimeType: 'application/json',
    },
    accepts: [{
      scheme: TRUSTED.scheme,
      network: TRUSTED.network,
      asset: TRUSTED.asset,
      amount: TRUSTED.amountAtomic,
      payTo,
      maxTimeoutSeconds: 60,
      extra: { name: TRUSTED.assetSymbol, version: '2' },
    }],
    extensions: {
      'payment-identifier': { required: true },
    },
  };
}

export function public402() {
  return {
    httpStatus: 402,
    state: STATES.REQUIREMENT_ISSUED,
    requirement: buildRequirement(),
  };
}

export function validateEnvelope(input = {}) {
  if (input.method !== TRUSTED.method) return reject(405, 'METHOD_NOT_ALLOWED');
  if (Number(input.bodyBytes || 0) > TRUSTED.maxBodyBytes) return reject(413, 'PAYLOAD_TOO_LARGE');
  if (input.protocolVersion !== TRUSTED.protocolVersion) return reject(400, 'UNSUPPORTED_PROTOCOL_VERSION');
  if (!input.paymentIdentifier) return reject(400, 'PAYMENT_IDENTIFIER_REQUIRED');
  if (!PAYMENT_ID.test(input.paymentIdentifier)) return reject(400, 'PAYMENT_IDENTIFIER_INVALID');
  if (!input.paymentHeader || typeof input.paymentHeader !== 'object') return reject(400, 'PAYMENT_HEADER_MALFORMED');
  if (input.unknownExtension) return reject(400, 'UNKNOWN_EXTENSION_STATE');
  if (input.productId && input.productId !== TRUSTED.productId) return reject(400, 'UNTRUSTED_PRODUCT_ID');
  return { ok: true };
}

export function validateTrustedTuple(tuple = {}) {
  const checks = [
    ['protocolVersion', TRUSTED.protocolVersion],
    ['scheme', TRUSTED.scheme],
    ['network', TRUSTED.network],
    ['asset', TRUSTED.asset],
    ['amountAtomic', TRUSTED.amountAtomic],
    ['payTo', TRUSTED.payTo],
    ['resourceId', TRUSTED.resourceId],
    ['productId', TRUSTED.productId],
    ['environment', TRUSTED.environment],
    ['operation', TRUSTED.operation],
    ['method', TRUSTED.method],
  ];
  for (const [key, expected] of checks) {
    const actual = tuple[key];
    const normalize = ['asset', 'payTo'].includes(key) ? (v) => String(v).toLowerCase() : (v) => String(v);
    if (normalize(actual) !== normalize(expected)) return reject(402, `TRUSTED_TUPLE_${key.toUpperCase()}_MISMATCH`);
  }
  return { ok: true };
}

export function normalizeSettlement({ paymentIdentifier, verification, settlement, now = new Date().toISOString() }) {
  if (!verification?.isValid) throw new Error('VERIFICATION_NOT_VALID');
  if (!settlement?.success) throw new Error('SETTLEMENT_NOT_SUCCESSFUL');
  const tupleCheck = validateTrustedTuple(settlement.tuple);
  if (!tupleCheck.ok) throw new Error(tupleCheck.code);
  if (!HEX_32.test(settlement.transaction)) throw new Error('MALFORMED_TRANSACTION_REFERENCE');
  return Object.freeze({
    provider: TRUSTED.provider,
    protocol_version: TRUSTED.protocolVersion,
    environment: TRUSTED.environment,
    scheme: TRUSTED.scheme,
    network: TRUSTED.network,
    event_id: hmacReference(settlement.eventId),
    payment_identifier_hash: hmacReference(paymentIdentifier),
    receipt_reference_hash: hmacReference(settlement.receipt),
    transaction_reference_hash: hmacReference(settlement.transaction.toLowerCase()),
    product_id: TRUSTED.productId,
    resource_id: TRUSTED.resourceId,
    amount_atomic: TRUSTED.amountAtomic,
    currency_or_asset: TRUSTED.asset,
    pay_to_hash: hmacReference(TRUSTED.payTo.toLowerCase()),
    status: 'settled',
    verified_at: verification.verifiedAt || now,
    settled_at: settlement.settledAt || now,
  });
}

export async function processPayment(input, { ledger, facilitator, clock = () => Date.now(), preflight = async () => true } = {}) {
  if (!input?.paymentHeader) return public402();
  const envelope = validateEnvelope(input);
  if (!envelope.ok) return envelope;
  const tupleCheck = validateTrustedTuple(input.paymentHeader.tuple);
  if (!tupleCheck.ok) return tupleCheck;
  if (Number(input.paymentHeader.expiresAt || 0) <= clock()) return reject(402, 'PAYMENT_EXPIRED', STATES.PAYMENT_EXPIRED);
  if (input.paymentHeader.signatureValid === false) return reject(402, 'PAYMENT_SIGNATURE_INVALID', STATES.PAYMENT_INVALID);
  if (!ledger) return reject(503, 'LEDGER_REQUIRED', STATES.REVIEW_REQUIRED);

  const fingerprint = paymentFingerprint(input.paymentHeader.tuple);
  const payloadHash = sha256(canonical(input.paymentHeader.signedPayload || input.paymentHeader));
  let reservation;
  try {
    reservation = await ledger.reserve({ paymentIdentifier: input.paymentIdentifier, fingerprint, payloadHash, now: clock() });
  } catch (error) {
    return reject(503, error.code || 'LEDGER_UNAVAILABLE', STATES.REVIEW_REQUIRED);
  }
  if (reservation.kind === 'conflict') return reject(409, 'PAYMENT_CONFLICT', STATES.PAYMENT_CONFLICT);
  if (reservation.kind === 'pending') return { httpStatus: 202, state: STATES.PAYMENT_PENDING, replay: true };
  if (reservation.kind === 'replay') return { ...reservation.result, replay: true };

  if (!(await preflight())) {
    await ledger.cancelReservation(input.paymentIdentifier, 'CANCEL_BEFORE_SETTLE');
    return reject(503, 'PROTECTED_PREFLIGHT_FAILED', STATES.REVIEW_REQUIRED);
  }

  let verification;
  try {
    verification = await facilitator.verify(input.paymentHeader, buildRequirement());
  } catch (error) {
    await ledger.failReservation(input.paymentIdentifier, 'VERIFY_UNAVAILABLE');
    return reject(503, 'VERIFY_UNAVAILABLE', STATES.VERIFY_UNAVAILABLE);
  }
  if (!verification?.isValid) {
    await ledger.failReservation(input.paymentIdentifier, 'PAYMENT_INVALID');
    return reject(402, verification?.invalidReason || 'PAYMENT_INVALID', STATES.PAYMENT_INVALID);
  }
  const verifiedTuple = validateTrustedTuple(verification.tuple || input.paymentHeader.tuple);
  if (!verifiedTuple.ok) {
    await ledger.failReservation(input.paymentIdentifier, verifiedTuple.code);
    return verifiedTuple;
  }

  let settlement;
  try {
    settlement = await facilitator.settle(input.paymentHeader, buildRequirement());
  } catch (error) {
    if (error.code === 'SETTLE_TIMEOUT' || error.code === 'SETTLE_UNKNOWN') {
      await ledger.markReconciliation(input.paymentIdentifier, error.code);
      return reject(202, error.code, STATES.SETTLE_UNKNOWN);
    }
    await ledger.failReservation(input.paymentIdentifier, 'SETTLE_FAILED');
    return reject(502, 'SETTLE_FAILED', STATES.SETTLE_FAILED);
  }
  if (!settlement?.success) {
    await ledger.failReservation(input.paymentIdentifier, settlement?.errorReason || 'SETTLE_FAILED');
    return reject(402, settlement?.errorReason || 'SETTLE_FAILED', STATES.SETTLE_FAILED);
  }

  let normalized;
  try {
    normalized = normalizeSettlement({ paymentIdentifier: input.paymentIdentifier, verification, settlement });
  } catch (error) {
    await ledger.markReconciliation(input.paymentIdentifier, error.message);
    return reject(202, error.message, STATES.REVIEW_REQUIRED);
  }

  let finalization;
  try {
    finalization = await ledger.finalizeSettlement({
      paymentIdentifier: input.paymentIdentifier,
      normalized,
      payloadHash,
      receiptHash: normalized.receipt_reference_hash,
      transactionHash: normalized.transaction_reference_hash,
      eventHash: normalized.event_id,
    });
  } catch {
    try { await ledger.markReconciliation(input.paymentIdentifier, 'SETTLED_LEDGER_FINALIZATION_FAILED'); } catch {}
    return reject(202, 'ENTITLEMENT_WRITE_FAILED', STATES.ENTITLEMENT_WRITE_FAILED);
  }
  if (finalization.kind === 'duplicate') return { ...finalization.result, replay: true };
  if (finalization.kind === 'ledger-failure') return reject(202, 'ENTITLEMENT_WRITE_FAILED', STATES.ENTITLEMENT_WRITE_FAILED);

  let entitlement;
  try {
    entitlement = await ledger.issueEntitlement({
      paymentIdentifier: input.paymentIdentifier,
      normalized,
      successfulTurns: TRUSTED.successfulTurns,
      activationWindowSeconds: TRUSTED.activationWindowSeconds,
      activeLifetimeSeconds: TRUSTED.activeLifetimeSeconds,
      now: clock(),
    });
  } catch {
    try { await ledger.markRefundRequired(input.paymentIdentifier, 'ENTITLEMENT_WRITE_FAILED'); } catch {}
    return reject(202, 'ENTITLEMENT_WRITE_FAILED', STATES.ENTITLEMENT_WRITE_FAILED);
  }
  if (!entitlement?.issued) {
    try { await ledger.markRefundRequired(input.paymentIdentifier, 'ENTITLEMENT_WRITE_FAILED'); } catch {}
    return reject(202, 'ENTITLEMENT_WRITE_FAILED', STATES.ENTITLEMENT_WRITE_FAILED);
  }

  const result = {
    httpStatus: 200,
    state: STATES.ENTITLEMENT_ISSUED,
    entitlement: entitlement.publicView,
    payment: normalized,
    replay: false,
  };
  await ledger.complete(input.paymentIdentifier, result);
  return result;
}

export async function refundPayment({ paymentIdentifier, ledger, facilitator, clock = () => Date.now() }) {
  if (!ledger || !facilitator) return reject(503, 'REFUND_DEPENDENCY_UNAVAILABLE', STATES.REVIEW_REQUIRED);
  const reservation = await ledger.reserveRefund(paymentIdentifier, clock());
  if (reservation.kind === 'missing') return reject(404, 'SETTLEMENT_NOT_FOUND', STATES.REVIEW_REQUIRED);
  if (reservation.kind === 'replay') return { ...reservation.result, replay: true };
  if (reservation.kind === 'pending') return { httpStatus: 202, state: STATES.REVIEW_REQUIRED, replay: true };
  try {
    const refund = await facilitator.refund(reservation.refundInput);
    if (!refund?.success || !HEX_32.test(refund.transaction)) throw Object.assign(new Error('REFUND_FAILED'), { code: 'REFUND_FAILED' });
    const result = await ledger.completeRefund(paymentIdentifier, {
      transactionReferenceHash: hmacReference(refund.transaction.toLowerCase()),
      refundedAt: new Date(clock()).toISOString(),
    });
    return { httpStatus: 200, state: STATES.REFUNDED, refund: result.publicView, replay: false };
  } catch (error) {
    await ledger.failRefund(paymentIdentifier, error.code || 'REFUND_FAILED');
    return reject(202, 'REFUND_REVIEW_REQUIRED', STATES.REVIEW_REQUIRED);
  }
}

export function safeEqual(a, b) {
  const aa = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  return aa.length === bb.length && timingSafeEqual(aa, bb);
}

function reject(httpStatus, code, state = STATES.REQUIREMENT_REJECTED) {
  return { ok: false, httpStatus, code, state, entitlement: null };
}
