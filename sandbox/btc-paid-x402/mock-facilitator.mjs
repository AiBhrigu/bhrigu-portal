import { TRUSTED, trustedTuple } from './contract.mjs';

const TX = `0x${'ab'.repeat(32)}`;
const REFUND_TX = `0x${'cd'.repeat(32)}`;

export class MockFacilitator {
  constructor({ verifyMode = 'success', settleMode = 'success', refundMode = 'success', delayMs = 0, settlementOverrides = {}, verificationOverrides = {} } = {}) {
    this.verifyMode = verifyMode;
    this.settleMode = settleMode;
    this.refundMode = refundMode;
    this.delayMs = delayMs;
    this.settlementOverrides = settlementOverrides;
    this.verificationOverrides = verificationOverrides;
    this.counts = { verify: 0, settle: 0, refund: 0 };
  }

  async verify(paymentHeader) {
    this.counts.verify += 1;
    await delay(this.delayMs);
    if (this.verifyMode === 'unavailable') throw Object.assign(new Error('VERIFY_UNAVAILABLE'), { code: 'VERIFY_UNAVAILABLE' });
    if (this.verifyMode === 'reject') return { isValid: false, invalidReason: 'FACILITATOR_REJECTED' };
    return {
      isValid: true,
      payer: '0x2222222222222222222222222222222222222222',
      tuple: trustedTuple(),
      verifiedAt: '2026-07-29T10:00:00.000Z',
      ...this.verificationOverrides,
    };
  }

  async settle() {
    this.counts.settle += 1;
    await delay(this.delayMs);
    if (this.settleMode === 'reject') return { success: false, errorReason: 'FACILITATOR_SETTLEMENT_REJECTED' };
    if (this.settleMode === 'timeout') throw Object.assign(new Error('SETTLE_TIMEOUT'), { code: 'SETTLE_TIMEOUT' });
    if (this.settleMode === 'unknown') throw Object.assign(new Error('SETTLE_UNKNOWN'), { code: 'SETTLE_UNKNOWN' });
    if (this.settleMode === 'throw') throw Object.assign(new Error('SETTLE_FAILED'), { code: 'SETTLE_FAILED' });
    if (this.settleMode === 'malformed') return { success: true, eventId: 'event', receipt: 'receipt', transaction: 'bad', tuple: trustedTuple() };
    return {
      success: true,
      eventId: 'event-001',
      receipt: 'receipt-001',
      transaction: TX,
      tuple: trustedTuple(),
      network: TRUSTED.network,
      settledAt: '2026-07-29T10:00:01.000Z',
      ...this.settlementOverrides,
    };
  }

  async refund() {
    this.counts.refund += 1;
    await delay(this.delayMs);
    if (this.refundMode === 'reject') return { success: false, errorReason: 'REFUND_REJECTED' };
    if (this.refundMode === 'throw') throw Object.assign(new Error('REFUND_FAILED'), { code: 'REFUND_FAILED' });
    return { success: true, transaction: REFUND_TX };
  }
}

async function delay(ms) {
  if (ms > 0) await new Promise((resolve) => setTimeout(resolve, ms));
}
