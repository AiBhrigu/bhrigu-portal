import { randomUUID } from 'node:crypto';

export const DURABLE_LEDGER_CONTRACT = 'BTC_PAID_DIALOGUE_DURABLE_LEDGER_V0_1';
const NAMESPACE = /^[A-Za-z0-9:_-]{16,160}$/;

/**
 * Fail-closed client for a shared ledger service. The service owns all atomic
 * compare-and-set and uniqueness guarantees; this client never emulates them
 * locally in a live run.
 */
export class DurableEntitlementLedger {
  constructor({ url, token, namespace, fetchImpl = globalThis.fetch, timeoutMs = 10_000 } = {}) {
    if (typeof fetchImpl !== 'function') throw contractError('DURABLE_LEDGER_FETCH_REQUIRED');
    this.url = normalizeUrl(url);
    if (typeof token !== 'string' || token.length < 24) throw contractError('DURABLE_LEDGER_TOKEN_REQUIRED');
    if (!NAMESPACE.test(String(namespace || ''))) throw contractError('DURABLE_LEDGER_NAMESPACE_INVALID');
    if (!Number.isInteger(timeoutMs) || timeoutMs < 1_000 || timeoutMs > 30_000) {
      throw contractError('DURABLE_LEDGER_TIMEOUT_INVALID');
    }
    this.token = token;
    this.namespace = namespace;
    this.fetchImpl = fetchImpl;
    this.timeoutMs = timeoutMs;
  }

  async health() { return this.command('health', {}); }
  async probeAtomicity(payload = {}) { return this.command('probe_atomicity', payload); }
  async reserve(payload) { return this.command('reserve_payment', payload); }
  async cancelReservation(paymentIdentifier, reason) { return this.command('cancel_reservation', { paymentIdentifier, reason }); }
  async failReservation(paymentIdentifier, reason) { return this.command('fail_reservation', { paymentIdentifier, reason }); }
  async markReconciliation(paymentIdentifier, reason) { return this.command('mark_reconciliation', { paymentIdentifier, reason }); }
  async markRefundRequired(paymentIdentifier, reason) { return this.command('mark_refund_required', { paymentIdentifier, reason }); }
  async finalizeSettlement(payload) { return this.command('finalize_settlement', payload); }
  async issueEntitlement(payload) { return this.command('issue_entitlement', payload); }
  async complete(paymentIdentifier, result) { return this.command('complete_payment', { paymentIdentifier, result }); }
  async activate(paymentIdentifier, now) { return this.command('activate_entitlement', { paymentIdentifier, now }); }
  async consumeSuccessfulTurn(paymentIdentifier, now) { return this.command('consume_successful_turn', { paymentIdentifier, now }); }
  async reserveRefund(paymentIdentifier, now) { return this.command('reserve_refund', { paymentIdentifier, now }); }
  async completeRefund(paymentIdentifier, refund) { return this.command('complete_refund', { paymentIdentifier, refund }); }
  async failRefund(paymentIdentifier, reason) { return this.command('fail_refund', { paymentIdentifier, reason }); }
  async getEntitlement(paymentIdentifier) { return this.command('get_entitlement', { paymentIdentifier }); }
  async getRow(paymentIdentifier) { return this.command('get_payment', { paymentIdentifier }); }
  async snapshot() { return this.command('snapshot_proof', {}); }

  async assertLiveReady({ probeId = randomUUID() } = {}) {
    const health = await this.health();
    const probe = await this.probeAtomicity({ probeId });
    const expected = {
      contract: DURABLE_LEDGER_CONTRACT,
      durable: true,
      atomic: true,
      compare_and_set: true,
      restart_persistent: true,
      uniqueness_keys: [
        'payment_identifier', 'payload_hash', 'receipt_hash', 'transaction_hash',
        'event_hash', 'entitlement', 'refund',
      ],
    };
    for (const source of [health, probe]) {
      if (!source || source.contract !== expected.contract) throw contractError('DURABLE_LEDGER_CONTRACT_MISMATCH');
      for (const key of ['durable', 'atomic', 'compare_and_set', 'restart_persistent']) {
        if (source[key] !== true) throw contractError(`DURABLE_LEDGER_${key.toUpperCase()}_REQUIRED`);
      }
      const keys = new Set(source.uniqueness_keys || []);
      for (const key of expected.uniqueness_keys) {
        if (!keys.has(key)) throw contractError(`DURABLE_LEDGER_UNIQUENESS_${key.toUpperCase()}_REQUIRED`);
      }
    }
    if (probe.single_winner !== true || probe.replay_stable !== true) {
      throw contractError('DURABLE_LEDGER_ATOMIC_PROBE_FAILED');
    }
    return { health, probe };
  }

  async command(operation, payload) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    let response;
    try {
      response = await this.fetchImpl(this.url, {
        method: 'POST',
        redirect: 'error',
        signal: controller.signal,
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${this.token}`,
          'x-bhrigu-ledger-contract': DURABLE_LEDGER_CONTRACT,
        },
        body: JSON.stringify({
          contract: DURABLE_LEDGER_CONTRACT,
          namespace: this.namespace,
          request_id: randomUUID(),
          operation,
          payload,
        }),
      });
    } catch (error) {
      throw contractError(error?.name === 'AbortError' ? 'DURABLE_LEDGER_TIMEOUT' : 'DURABLE_LEDGER_UNAVAILABLE');
    } finally {
      clearTimeout(timer);
    }

    if (!response?.ok) throw contractError(`DURABLE_LEDGER_HTTP_${Number(response?.status || 0)}`);
    let body;
    try { body = await response.json(); } catch { throw contractError('DURABLE_LEDGER_RESPONSE_INVALID'); }
    if (!body || body.contract !== DURABLE_LEDGER_CONTRACT || body.ok !== true || !Object.hasOwn(body, 'result')) {
      throw contractError('DURABLE_LEDGER_RESPONSE_INVALID');
    }
    return body.result;
  }
}

function normalizeUrl(value) {
  let parsed;
  try { parsed = new URL(String(value || '')); } catch { throw contractError('DURABLE_LEDGER_URL_INVALID'); }
  const local = ['localhost', '127.0.0.1', '::1'].includes(parsed.hostname);
  if (parsed.protocol !== 'https:' && !(local && parsed.protocol === 'http:')) {
    throw contractError('DURABLE_LEDGER_HTTPS_REQUIRED');
  }
  if (parsed.username || parsed.password || parsed.search || parsed.hash) {
    throw contractError('DURABLE_LEDGER_URL_INVALID');
  }
  return parsed.toString().replace(/\/$/, '');
}

function contractError(code) {
  return Object.assign(new Error(code), { code });
}
