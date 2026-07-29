import { hmacReference, TRUSTED } from './contract.mjs';

export class InMemoryEntitlementLedger {
  constructor(snapshot = null, options = {}) {
    this.available = options.available !== false;
    this.failFinalize = options.failFinalize === true;
    this.failEntitlement = options.failEntitlement === true;
    this.rows = new Map(snapshot?.rows || []);
    this.receipts = new Map(snapshot?.receipts || []);
    this.transactions = new Map(snapshot?.transactions || []);
    this.events = new Map(snapshot?.events || []);
    this.payloads = new Map(snapshot?.payloads || []);
    this.entitlements = new Map(snapshot?.entitlements || []);
    this.refunds = new Map(snapshot?.refunds || []);
    this.mutex = Promise.resolve();
  }

  async atomic(fn) {
    const previous = this.mutex;
    let release;
    this.mutex = new Promise((resolve) => { release = resolve(); });
    await previous;
    try { return await fn(); } finally { release(); }
  }

  assertAvailable() {
    if (!this.available) throw Object.assign(new Error('LEDGER_UNAVAILABLE'), { code: 'LEDGER_UNAVAILABLE' });
  }

  async reserve({ paymentIdentifier, fingerprint, payloadHash, now }) {
    return this.atomic(() => {
      this.assertAvailable();
      const existing = this.rows.get(paymentIdentifier);
      if (existing) {
        if (existing.fingerprint !== fingerprint) return { kind: 'conflict' };
        if (existing.status === 'completed') return { kind: 'replay', result: existing.result };
        if (existing.status === 'refunded') return { kind: 'replay', result: existing.result };
        return { kind: 'pending' };
      }
      const existingPayload = this.payloads.get(payloadHash);
      if (existingPayload) {
        const original = this.rows.get(existingPayload);
        if (original?.result) return { kind: 'replay', result: original.result };
        return { kind: 'pending' };
      }
      this.rows.set(paymentIdentifier, { fingerprint, payloadHash, status: 'reserved', reservedAt: now });
      this.payloads.set(payloadHash, paymentIdentifier);
      return { kind: 'new' };
    });
  }

  async cancelReservation(id, reason) { return this.patch(id, { status: 'cancelled', reason }); }
  async failReservation(id, reason) { return this.patch(id, { status: 'failed', reason }); }
  async markReconciliation(id, reason) { return this.patch(id, { status: 'reconciliation', reason }); }
  async markRefundRequired(id, reason) { return this.patch(id, { status: 'refund-required', reason }); }

  async patch(id, changes) {
    return this.atomic(() => {
      this.assertAvailable();
      const row = this.rows.get(id) || {};
      this.rows.set(id, { ...row, ...changes });
      return this.rows.get(id);
    });
  }

  async finalizeSettlement({ paymentIdentifier, normalized, receiptHash, transactionHash, eventHash }) {
    return this.atomic(() => {
      this.assertAvailable();
      if (this.failFinalize) return { kind: 'ledger-failure' };
      for (const index of [this.receipts, this.transactions, this.events]) {
        const key = index === this.receipts ? receiptHash : index === this.transactions ? transactionHash : eventHash;
        const existingId = index.get(key);
        if (existingId && existingId !== paymentIdentifier) {
          const existing = this.rows.get(existingId);
          return { kind: 'duplicate', result: existing?.result || { httpStatus: 202, state: 'PAYMENT_PENDING', entitlement: null } };
        }
      }
      const row = this.rows.get(paymentIdentifier);
      if (!row) return { kind: 'ledger-failure' };
      this.receipts.set(receiptHash, paymentIdentifier);
      this.transactions.set(transactionHash, paymentIdentifier);
      this.events.set(eventHash, paymentIdentifier);
      this.rows.set(paymentIdentifier, { ...row, status: 'settled', normalized });
      return { kind: 'settled' };
    });
  }

  async issueEntitlement({ paymentIdentifier, successfulTurns, activationWindowSeconds, activeLifetimeSeconds, now }) {
    return this.atomic(() => {
      this.assertAvailable();
      if (this.failEntitlement) return { issued: false };
      const existing = this.entitlements.get(paymentIdentifier);
      if (existing) return { issued: true, publicView: publicEntitlement(existing), replay: true };
      const row = this.rows.get(paymentIdentifier);
      if (row?.status !== 'settled') return { issued: false };
      const entitlement = {
        idHash: hmacReference(`entitlement:${paymentIdentifier}`),
        productId: TRUSTED.productId,
        resourceId: TRUSTED.resourceId,
        state: 'accepted',
        successfulTurns,
        remainingTurns: successfulTurns,
        issuedAtMs: now,
        activateByMs: now + activationWindowSeconds * 1000,
        activeLifetimeSeconds,
        activatedAtMs: null,
        expiresAtMs: null,
      };
      this.entitlements.set(paymentIdentifier, entitlement);
      return { issued: true, publicView: publicEntitlement(entitlement), replay: false };
    });
  }

  async complete(paymentIdentifier, result) {
    return this.atomic(() => {
      this.assertAvailable();
      const row = this.rows.get(paymentIdentifier);
      this.rows.set(paymentIdentifier, { ...row, status: 'completed', result });
      return result;
    });
  }

  async activate(paymentIdentifier, now) {
    return this.atomic(() => {
      this.assertAvailable();
      const entitlement = this.entitlements.get(paymentIdentifier);
      if (!entitlement) return { activated: false, code: 'ENTITLEMENT_NOT_FOUND' };
      if (entitlement.state === 'revoked') return { activated: false, code: 'ENTITLEMENT_REVOKED' };
      if (entitlement.state === 'fulfilled') return { activated: false, code: 'ENTITLEMENT_FULFILLED' };
      if (entitlement.state === 'active') return { activated: true, replay: true, publicView: publicEntitlement(entitlement) };
      if (now > entitlement.activateByMs) {
        const expired = { ...entitlement, state: 'expired', expiredAtMs: now };
        this.entitlements.set(paymentIdentifier, expired);
        return { activated: false, code: 'ACTIVATION_EXPIRED', publicView: publicEntitlement(expired) };
      }
      const active = {
        ...entitlement,
        state: 'active',
        activatedAtMs: now,
        expiresAtMs: now + entitlement.activeLifetimeSeconds * 1000,
      };
      this.entitlements.set(paymentIdentifier, active);
      return { activated: true, replay: false, publicView: publicEntitlement(active) };
    });
  }

  async consumeSuccessfulTurn(paymentIdentifier, now) {
    return this.atomic(() => {
      this.assertAvailable();
      const entitlement = this.entitlements.get(paymentIdentifier);
      if (!entitlement) return { consumed: false, code: 'ENTITLEMENT_NOT_FOUND' };
      if (entitlement.state === 'revoked') return { consumed: false, code: 'ENTITLEMENT_REVOKED' };
      if (entitlement.state === 'fulfilled' || entitlement.remainingTurns <= 0) return { consumed: false, code: 'ENTITLEMENT_FULFILLED' };
      if (entitlement.state !== 'active') return { consumed: false, code: 'ENTITLEMENT_NOT_ACTIVE' };
      if (now > entitlement.expiresAtMs) {
        const expired = { ...entitlement, state: 'expired', expiredAtMs: now };
        this.entitlements.set(paymentIdentifier, expired);
        return { consumed: false, code: 'SESSION_EXPIRED', publicView: publicEntitlement(expired) };
      }
      const remainingTurns = entitlement.remainingTurns - 1;
      const updated = {
        ...entitlement,
        remainingTurns,
        state: remainingTurns === 0 ? 'fulfilled' : 'active',
        fulfilledAtMs: remainingTurns === 0 ? now : null,
      };
      this.entitlements.set(paymentIdentifier, updated);
      return { consumed: true, remainingTurns, publicView: publicEntitlement(updated) };
    });
  }

  async reserveRefund(paymentIdentifier, now) {
    return this.atomic(() => {
      this.assertAvailable();
      const row = this.rows.get(paymentIdentifier);
      const entitlement = this.entitlements.get(paymentIdentifier);
      if (!row?.normalized || !entitlement) return { kind: 'missing' };
      const existing = this.refunds.get(paymentIdentifier);
      if (existing?.status === 'completed') return { kind: 'replay', result: existing.result };
      if (existing?.status === 'pending') return { kind: 'pending' };
      this.refunds.set(paymentIdentifier, { status: 'pending', requestedAt: now });
      return {
        kind: 'new',
        refundInput: {
          amountAtomic: row.normalized.amount_atomic,
          asset: row.normalized.currency_or_asset,
          originalTransactionReferenceHash: row.normalized.transaction_reference_hash,
          destinationReferenceHash: hmacReference(`payer:${paymentIdentifier}`),
        },
      };
    });
  }

  async completeRefund(paymentIdentifier, refund) {
    return this.atomic(() => {
      this.assertAvailable();
      const publicView = { state: 'refunded', transactionReferenceHash: refund.transactionReferenceHash, refundedAt: refund.refundedAt };
      const result = { httpStatus: 200, state: 'REFUNDED', refund: publicView, entitlement: null };
      this.refunds.set(paymentIdentifier, { status: 'completed', result });
      const row = this.rows.get(paymentIdentifier);
      this.rows.set(paymentIdentifier, { ...row, status: 'refunded', result });
      const entitlement = this.entitlements.get(paymentIdentifier);
      this.entitlements.set(paymentIdentifier, { ...entitlement, state: 'revoked', revokedAt: refund.refundedAt });
      return { publicView };
    });
  }

  async failRefund(paymentIdentifier, reason) {
    return this.atomic(() => {
      this.assertAvailable();
      this.refunds.set(paymentIdentifier, { status: 'review', reason });
    });
  }

  getEntitlement(paymentIdentifier) { return this.entitlements.get(paymentIdentifier) || null; }
  getRow(paymentIdentifier) { return this.rows.get(paymentIdentifier) || null; }
  snapshot() {
    return {
      rows: [...this.rows.entries()], receipts: [...this.receipts.entries()], transactions: [...this.transactions.entries()], events: [...this.events.entries()],
      payloads: [...this.payloads.entries()], entitlements: [...this.entitlements.entries()], refunds: [...this.refunds.entries()],
    };
  }
}

function publicEntitlement(value) {
  return {
    id: value.idHash,
    product_id: value.productId,
    resource_id: value.resourceId,
    state: value.state,
    successful_turn_limit: value.successfulTurns,
    remaining_successful_turns: value.remainingTurns,
    activation_deadline: new Date(value.activateByMs).toISOString(),
    active_lifetime_seconds: value.activeLifetimeSeconds,
    activated_at: value.activatedAtMs == null ? null : new Date(value.activatedAtMs).toISOString(),
    expires_at: value.expiresAtMs == null ? null : new Date(value.expiresAtMs).toISOString(),
  };
}
