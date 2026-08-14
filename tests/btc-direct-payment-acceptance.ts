import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  BTC_DIRECT_PAYMENT_MODE,
  getBtcDirectPaymentRuntimeConfig,
  getBtcObservationRuntimeConfig,
  verifyObservationSecret,
} from "../lib/btc-direct-payment-config";
import {
  BtcDirectPaymentError,
  BTC_DIRECT_ACTIVATION_CLAIM_TTL_MS,
  BTC_DIRECT_SERVICE_MS,
  buildBip321Uri,
  ceilUsdCentsToSats,
  createBtcDirectQuote,
  expireBtcDirectQuote,
  observeBtcDirectPayment,
  type BtcDirectActivationRecord,
  type BtcDirectPaymentRecord,
  type BtcDirectPaymentStore,
  type BtcDirectQuoteRecord,
  type BtcDirectQuoteState,
} from "../lib/btc-direct-payment";
import { createCoinGeckoBtcUsdSource, parseCoinGeckoSimplePriceRaw } from "../lib/btc-direct-payment-source";

type Address = { id: string; address: string; state: "available" | "reserved" | "retired"; quoteId: string | null };

class MemoryStore implements BtcDirectPaymentStore {
  accepted = new Set<string>();
  addresses: Address[] = [];
  quotesById = new Map<string, BtcDirectQuoteRecord>();
  quoteByKey = new Map<string, string>();
  payments = new Map<string, BtcDirectPaymentRecord>();
  activations = new Map<string, BtcDirectActivationRecord>();

  addAddress(id: string, address: string) {
    this.addresses.push({ id, address, state: "available", quoteId: null });
  }
  async findQuoteByIdempotencyKey(key: string) {
    const id = this.quoteByKey.get(key);
    return id ? structuredClone(this.quotesById.get(id)!) : null;
  }
  async isAcceptedApplication(applicationId: string) {
    return this.accepted.has(applicationId);
  }
  async reserveQuote(input: BtcDirectQuoteRecord) {
    const existingId = this.quoteByKey.get(input.idempotencyKey);
    if (existingId) {
      const existing = this.quotesById.get(existingId)!;
      return {
        disposition: existing.idempotencyPayloadHash === input.idempotencyPayloadHash ? ("replay" as const) : ("conflict" as const),
        quote: structuredClone(existing),
      };
    }
    const live = Array.from(this.quotesById.values()).find(
      (item) => item.applicationId === input.applicationId && item.quoteState !== "expired"
    );
    if (live) return { disposition: "application_quote_exists" as const, quote: structuredClone(live) };
    const address = this.addresses.find((item) => item.state === "available");
    if (!address) return { disposition: "address_unavailable" as const, quote: null };
    address.state = "reserved";
    address.quoteId = input.quoteId;
    const quote = { ...input, receiverAddressId: address.id, receiveAddress: address.address };
    this.quotesById.set(quote.quoteId, quote);
    this.quoteByKey.set(quote.idempotencyKey, quote.quoteId);
    return { disposition: "created" as const, quote: structuredClone(quote) };
  }
  async markQuotePending(quoteId: string, at: string) {
    const quote = this.quotesById.get(quoteId)!;
    if (quote.quoteState === "quote_created") quote.quoteState = "payment_pending";
    quote.updatedAt = at;
    return structuredClone(quote);
  }
  async expireQuote(quoteId: string, at: string) {
    const quote = this.quotesById.get(quoteId)!;
    if (["quote_created", "payment_pending"].includes(quote.quoteState)) {
      quote.quoteState = "expired";
      quote.updatedAt = at;
      const address = this.addresses.find((item) => item.id === quote.receiverAddressId)!;
      address.state = "retired";
    }
    return structuredClone(quote);
  }
  async findQuoteByReceiverAddressId(receiverAddressId: string) {
    const quote = Array.from(this.quotesById.values()).find((item) => item.receiverAddressId === receiverAddressId);
    return quote ? structuredClone(quote) : null;
  }
  async markQuoteState(quoteId: string, state: BtcDirectQuoteState, at: string) {
    const quote = this.quotesById.get(quoteId)!;
    const fenced = this.activations.has(quote.applicationId);
    if (quote.quoteState === "manual_review") {
      quote.updatedAt = at;
      return;
    }
    if (quote.quoteState === "activated") {
      quote.updatedAt = at;
      return;
    }
    if (state === "manual_review" && (quote.quoteState === "paid_confirmed" || fenced)) {
      quote.updatedAt = at;
      return;
    }
    quote.quoteState = state;
    quote.updatedAt = at;
  }
  async findPaymentByOutput(txid: string, txVout: number) {
    const payment = this.payments.get(`${txid}:${txVout}`);
    return payment ? structuredClone(payment) : null;
  }
  async upsertPayment(input: BtcDirectPaymentRecord) {
    const key = `${input.txid}:${input.txVout}`;
    const existing = this.payments.get(key);
    if (existing && (existing.quoteId !== input.quoteId || existing.observedSats !== input.observedSats)) {
      throw new Error("payment_output_integrity_conflict");
    }
    const quote = this.quotesById.get(input.quoteId)!;
    const canonicalReorg = existing?.paymentState === "paid_confirmed" && input.paymentState === "reorg_review";
    const fencedAuthoritativePayment = existing?.paymentState === "paid_confirmed"
      && Array.from(this.activations.values()).some((activation) => activation.paymentId === existing.paymentId);
    const fencedApplication = this.activations.has(quote.applicationId);
    const proposed = quote.quoteState === "manual_review" && !canonicalReorg && !fencedAuthoritativePayment
      ? "manual_review"
      : input.paymentState;
    if (
      proposed === "manual_review"
      && !fencedApplication
      && !["paid_confirmed", "activated"].includes(quote.quoteState)
    ) {
      quote.quoteState = "manual_review";
    }
    const paymentState = existing ? memoryPaymentTransition(existing.paymentState, proposed) : proposed;
    const stored = {
      ...input,
      paymentId: existing?.paymentId ?? input.paymentId,
      observedSats: existing?.observedSats ?? input.observedSats,
      firstSeenAt: existing?.firstSeenAt ?? input.firstSeenAt,
      confirmedAt: existing?.confirmedAt ?? input.confirmedAt,
      paymentState,
    };
    this.payments.set(key, stored);
    return structuredClone(stored);
  }
  async findActivationByApplicationId(applicationId: string) {
    const activation = this.activations.get(applicationId);
    return activation ? structuredClone(activation) : null;
  }
  async authorizeActivation(input: { quoteId: string; applicationId: string; paymentId: string; activation: BtcDirectActivationRecord; at: string }) {
    const quote = this.quotesById.get(input.quoteId);
    const payment = Array.from(this.payments.values()).find(
      (item) => item.paymentId === input.paymentId && item.quoteId === input.quoteId && item.paymentState === "paid_confirmed"
    );
    if (!quote || !payment || quote.applicationId !== input.applicationId || quote.quoteState === "expired") {
      return { authorized: false, activation: null };
    }
    const existing = this.activations.get(input.applicationId);
    if (existing) {
      if (existing.paymentId !== input.paymentId) return { authorized: false, activation: null };
      return { authorized: true, activation: structuredClone(existing) };
    }
    if (!["quote_created", "payment_pending", "paid_confirmed"].includes(quote.quoteState)) {
      return { authorized: false, activation: null };
    }
    this.activations.set(input.applicationId, structuredClone(input.activation));
    quote.quoteState = "paid_confirmed";
    quote.updatedAt = input.at;
    return { authorized: true, activation: structuredClone(input.activation) };
  }
  async claimActivation(activationId: string, claimToken: string, at: string, staleBefore: string) {
    const activation = Array.from(this.activations.values()).find((item) => item.activationId === activationId)!;
    const stale = activation.state === "activating" && !!activation.claimedAt && activation.claimedAt < staleBefore;
    if (["pending", "retryable"].includes(activation.state) || stale) {
      activation.state = "activating";
      activation.claimToken = claimToken;
      activation.claimedAt = at;
      activation.updatedAt = at;
      return { claimed: true, activation: structuredClone(activation) };
    }
    return { claimed: false, activation: structuredClone(activation) };
  }
  async completeActivation(activationId: string, serviceStart: string, serviceEnd: string, at: string, claimToken: string) {
    const activation = Array.from(this.activations.values()).find((item) => item.activationId === activationId)!;
    if (activation.state === "activating" && activation.claimToken === claimToken) {
      activation.state = "active";
      activation.serviceStart = serviceStart;
      activation.serviceEnd = serviceEnd;
      activation.claimToken = null;
      activation.claimedAt = null;
      activation.updatedAt = at;
    }
    return structuredClone(activation);
  }
  async failActivation(activationId: string, at: string, claimToken: string) {
    const activation = Array.from(this.activations.values()).find((item) => item.activationId === activationId)!;
    if (activation.state === "activating" && activation.claimToken === claimToken) {
      activation.state = "retryable";
      activation.serviceStart = null;
      activation.serviceEnd = null;
      activation.claimToken = null;
      activation.claimedAt = null;
      activation.updatedAt = at;
    }
    return structuredClone(activation);
  }

}

function memoryPaymentTransition(existing: BtcDirectPaymentRecord["paymentState"], proposed: BtcDirectPaymentRecord["paymentState"]) {
  if (existing === "manual_review") return "manual_review" as const;
  if (existing === "reorg_review") return "reorg_review" as const;
  if (existing === "paid_confirmed") return proposed === "reorg_review" ? ("reorg_review" as const) : ("paid_confirmed" as const);
  return proposed;
}

const ADDRESS = (n: number) => `bc1qpreview${String(n).padStart(32, "0")}`;
const TX = (n: number) => n.toString(16).padStart(64, "0");
const BLOCK = (n: number) => (1000 + n).toString(16).padStart(64, "0");

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => { resolve = done; });
  return { promise, resolve };
}

function withAuthorizationHook(
  store: BtcDirectPaymentStore,
  hook: BtcDirectPaymentStore["authorizeActivation"]
): BtcDirectPaymentStore {
  return new Proxy(store, {
    get(target, property) {
      if (property === "authorizeActivation") return hook;
      const value = Reflect.get(target as object, property);
      return typeof value === "function" ? value.bind(target) : value;
    },
  });
}

async function expectCode(promise: Promise<unknown>, code: string) {
  await assert.rejects(promise, (error: unknown) => error instanceof BtcDirectPaymentError && error.code === code);
}

async function run() {
  assert.equal(ceilUsdCentsToSats(4900, "62965").toString(), "77822");
  assert.equal(buildBip321Uri(ADDRESS(1), "77822"), `bitcoin:${ADDRESS(1)}?amount=0.00077822`);

  const rawRate = "12345.6789012345678912345";
  assert.notEqual(String(Number(rawRate)), rawRate);
  const rawParsed = parseCoinGeckoSimplePriceRaw(`{"bitcoin":{"usd":${rawRate},"last_updated_at":1786701600}}`);
  assert.equal(rawParsed.rateDecimal, rawRate);
  assert.equal(ceilUsdCentsToSats(4900, rawParsed.rateDecimal).toString(), "396901");
  let jsonCalled = false;
  const losslessSource = createCoinGeckoBtcUsdSource({ fetchImpl: (async () => ({
    ok: true,
    status: 200,
    text: async () => `{"bitcoin":{"usd":${rawRate},"last_updated_at":1786701600}}`,
    json: async () => { jsonCalled = true; throw new Error("json_forbidden"); },
  })) as any });
  assert.equal((await losslessSource.fetch()).rateDecimal, rawRate);
  assert.equal(jsonCalled, false);
  assert.equal(parseCoinGeckoSimplePriceRaw('{"bitcoin":{"usd":62965,"last_updated_at":1786701600}}').rateDecimal, "62965");
  assert.equal(parseCoinGeckoSimplePriceRaw('{"bitcoin":{"usd":62965.123456789012345678,"last_updated_at":1786701600}}').rateDecimal, "62965.123456789012345678");
  assert.equal(ceilUsdCentsToSats(4900, "62965.123456789012345678").toString(), "77821");
  assert.equal(parseCoinGeckoSimplePriceRaw('{"bitcoin":{"usd":999999999999999999999999.123456789012345678,"last_updated_at":1786701600}}').rateDecimal, "999999999999999999999999.123456789012345678");
  assert.equal(ceilUsdCentsToSats(4900, "999999999999999999999999.123456789012345678").toString(), "1");
  for (const bad of [
    '{"wrapper":{"bitcoin":{"usd":62965,"last_updated_at":1786701600}}}',
    '{"bitcoin":{"usd":62965,"last_updated_at":1786701600}} trailing',
    '{"bitcoin":{"usd":62965,"last_updated_at":1786701600}',
    '{"bitcoin":{"usd":62965,"last_updated_at":1786701600},"bitcoin":{"usd":62966,"last_updated_at":1786701600}}',
    '{"bitcoin":{"usd":62965,"usd":62966,"last_updated_at":1786701600}}',
    '{"bitcoin":62965}',
    '{"bitcoin":{"usd":1e5,"last_updated_at":1786701600}}',
    '{"bitcoin":{"usd":0,"last_updated_at":1786701600}}',
    '{"bitcoin":{"usd":-1,"last_updated_at":1786701600}}',
    '{"bitcoin":{"last_updated_at":1786701600}}',
  ]) assert.throws(() => parseCoinGeckoSimplePriceRaw(bad));

  const store = new MemoryStore();
  ["APP-ACCEPTED-0001", "APP-ACCEPTED-0002", "APP-ACCEPTED-0003", "APP-ACCEPTED-0004", "APP-ACCEPTED-0005", "APP-ACCEPTED-0006", "APP-ACCEPTED-0007", "APP-ACCEPTED-0008", "APP-ACCEPTED-0009", "APP-ACCEPTED-0010"].forEach((id) => store.accepted.add(id));
  for (let i = 1; i <= 24; i += 1) store.addAddress(`addr_${i.toString().padStart(4, "0")}`, ADDRESS(i));

  let clock = new Date("2026-08-14T10:00:00.000Z");
  const now = () => new Date(clock);
  const source = { fetch: async () => ({ rateDecimal: "62965", sourceTimestamp: now().toISOString() }) };

  const q1 = await createBtcDirectQuote({
    applicationId: "APP-ACCEPTED-0001",
    idempotencyKey: "quote-key-accepted-0001",
    store, source, now, quoteId: () => "quote_0001",
  });
  assert.equal(q1.quoteState, "payment_pending");
  assert.equal(q1.satAmountInteger, "77822");
  assert.equal(q1.receiverAddressId, "addr_0001");

  const replay = await createBtcDirectQuote({
    applicationId: "APP-ACCEPTED-0001",
    idempotencyKey: "quote-key-accepted-0001",
    store, source, now, quoteId: () => "quote_should_not_exist",
  });
  assert.equal(replay.quoteId, q1.quoteId);
  assert.equal(replay.satAmountInteger, q1.satAmountInteger);
  assert.equal(replay.receiveAddress, q1.receiveAddress);

  await expectCode(createBtcDirectQuote({
    applicationId: "APP-ACCEPTED-0002",
    idempotencyKey: "quote-key-accepted-0001",
    store, source, now,
  }), "idempotency_conflict");


  const quoteRace = await Promise.allSettled([
    createBtcDirectQuote({ applicationId: "APP-ACCEPTED-0008", idempotencyKey: "quote-race-key-0001", store, source, now, quoteId: () => "quote_race_a" }),
    createBtcDirectQuote({ applicationId: "APP-ACCEPTED-0008", idempotencyKey: "quote-race-key-0002", store, source, now, quoteId: () => "quote_race_b" }),
  ]);
  assert.equal(quoteRace.filter((x) => x.status === "fulfilled").length, 1);
  assert.equal(quoteRace.filter((x) => x.status === "rejected" && x.reason instanceof BtcDirectPaymentError && x.reason.code === "application_quote_exists").length, 1);
  const app8Live = Array.from(store.quotesById.values()).filter((q) => q.applicationId === "APP-ACCEPTED-0008" && q.quoteState !== "expired");
  assert.equal(app8Live.length, 1);
  assert.equal(store.addresses.filter((a) => a.quoteId === app8Live[0].quoteId && a.state === "reserved").length, 1);

  await expectCode(createBtcDirectQuote({
    applicationId: "APP-NOT-ACCEPTED",
    idempotencyKey: "quote-key-not-accepted-0001",
    store, source, now,
  }), "application_not_accepted");

  const staleSource = { fetch: async () => ({ rateDecimal: "62965", sourceTimestamp: new Date(now().getTime() - 121_000).toISOString() }) };
  await expectCode(createBtcDirectQuote({
    applicationId: "APP-ACCEPTED-0002",
    idempotencyKey: "quote-key-stale-source-0001",
    store, source: staleSource, now,
  }), "fx_stale");

  clock = new Date("2026-08-14T10:16:00.000Z");
  const expired = await expireBtcDirectQuote({ quote: q1, store, now });
  assert.equal(expired.quoteState, "expired");
  assert.equal(store.addresses[0].state, "retired");

  const q2 = await createBtcDirectQuote({
    applicationId: "APP-ACCEPTED-0001",
    idempotencyKey: "quote-key-accepted-0002",
    store, source, now, quoteId: () => "quote_0002",
  });
  assert.notEqual(q2.receiveAddress, q1.receiveAddress);
  assert.notEqual(q2.receiverAddressId, q1.receiverAddressId);

  const mempool = await observeBtcDirectPayment({
    observation: {
      receiverAddressId: q2.receiverAddressId, txid: TX(1), txVout: 0,
      observedSats: q2.satAmountInteger, confirmations: 0,
      blockHeight: null, blockHash: null, observedAt: now().toISOString(), spvVerified: true,
    },
    store, now, paymentId: () => "payment_0001", activationId: () => "activation_0001",
  });
  assert.equal(mempool.payment.paymentState, "mempool_seen");
  assert.equal(mempool.activation, null);

  clock = new Date("2026-08-14T10:17:00.000Z");
  const confirmed = await observeBtcDirectPayment({
    observation: {
      receiverAddressId: q2.receiverAddressId, txid: TX(1), txVout: 0,
      observedSats: q2.satAmountInteger, confirmations: 1,
      blockHeight: "962408", blockHash: BLOCK(1), observedAt: now().toISOString(), spvVerified: true,
    },
    store, now, paymentId: () => "ignored", activationId: () => "activation_0001",
  });
  assert.equal(confirmed.payment.paymentState, "paid_confirmed");
  assert.equal(confirmed.activation?.state, "active");
  assert.equal(confirmed.activation?.activationId, "activation_0001");
  assert.equal(
    new Date(confirmed.activation!.serviceEnd!).getTime() - new Date(confirmed.activation!.serviceStart!).getTime(),
    BTC_DIRECT_SERVICE_MS
  );

  const activationReplay = await observeBtcDirectPayment({
    observation: {
      receiverAddressId: q2.receiverAddressId, txid: TX(1), txVout: 0,
      observedSats: q2.satAmountInteger, confirmations: 2,
      blockHeight: "962409", blockHash: BLOCK(2), observedAt: now().toISOString(), spvVerified: true,
    },
    store, now,
  });
  assert.equal(activationReplay.activation?.activationId, confirmed.activation?.activationId);
  assert.equal(activationReplay.activation?.serviceEnd, confirmed.activation?.serviceEnd);

  const duplicatePayment = await observeBtcDirectPayment({
    observation: {
      receiverAddressId: q2.receiverAddressId, txid: TX(2), txVout: 1,
      observedSats: q2.satAmountInteger, confirmations: 1,
      blockHeight: "962409", blockHash: BLOCK(2), observedAt: now().toISOString(), spvVerified: true,
    },
    store, now,
  });
  assert.equal(duplicatePayment.payment.paymentState, "manual_review");
  assert.equal(duplicatePayment.activation?.activationId, confirmed.activation?.activationId);

  const reorg = await observeBtcDirectPayment({
    observation: {
      receiverAddressId: q2.receiverAddressId, txid: TX(1), txVout: 0,
      observedSats: q2.satAmountInteger, confirmations: 0,
      blockHeight: null, blockHash: null, observedAt: now().toISOString(), spvVerified: false,
    },
    store, now,
  });
  assert.equal(reorg.payment.paymentState, "reorg_review");
  assert.equal(store.activations.get("APP-ACCEPTED-0001")?.activationId, "activation_0001");
  const reorgReplay = await observeBtcDirectPayment({
    observation: {
      receiverAddressId: q2.receiverAddressId, txid: TX(1), txVout: 0,
      observedSats: q2.satAmountInteger, confirmations: 2,
      blockHeight: "962411", blockHash: BLOCK(6), observedAt: now().toISOString(), spvVerified: true,
    }, store, now,
  });
  assert.equal(reorgReplay.payment.paymentState, "reorg_review");
  assert.equal(reorgReplay.activation?.activationId, "activation_0001");

  const q3 = await createBtcDirectQuote({
    applicationId: "APP-ACCEPTED-0003", idempotencyKey: "quote-key-failure-0001",
    store, source, now, quoteId: () => "quote_0003",
  });
  let failOnce = true;
  const failedActivation = await observeBtcDirectPayment({
    observation: {
      receiverAddressId: q3.receiverAddressId, txid: TX(3), txVout: 0,
      observedSats: q3.satAmountInteger, confirmations: 1,
      blockHeight: "962409", blockHash: BLOCK(3), observedAt: now().toISOString(), spvVerified: true,
    },
    store, now, paymentId: () => "payment_0003", activationId: () => "activation_0003",
    activationEffect: async () => { if (failOnce) { failOnce = false; throw new Error("fixture_activation_failure"); } },
  });
  assert.equal(failedActivation.payment.paymentState, "paid_confirmed");
  assert.equal(failedActivation.activation?.state, "retryable");
  const retryActivation = await observeBtcDirectPayment({
    observation: {
      receiverAddressId: q3.receiverAddressId, txid: TX(3), txVout: 0,
      observedSats: q3.satAmountInteger, confirmations: 1,
      blockHeight: "962409", blockHash: BLOCK(3), observedAt: now().toISOString(), spvVerified: true,
    },
    store, now, activationEffect: async () => {},
  });
  assert.equal(retryActivation.activation?.state, "active");
  assert.equal(retryActivation.activation?.activationId, "activation_0003");

  const q4 = await createBtcDirectQuote({
    applicationId: "APP-ACCEPTED-0004", idempotencyKey: "quote-key-underpay-0001",
    store, source, now, quoteId: () => "quote_0004",
  });
  const underpay = await observeBtcDirectPayment({
    observation: {
      receiverAddressId: q4.receiverAddressId, txid: TX(4), txVout: 0,
      observedSats: String(BigInt(q4.satAmountInteger) - BigInt(1)), confirmations: 1,
      blockHeight: "962409", blockHash: BLOCK(4), observedAt: now().toISOString(), spvVerified: true,
    }, store, now,
  });
  assert.equal(underpay.payment.paymentState, "manual_review");
  assert.equal(underpay.activation, null);
  await expectCode(observeBtcDirectPayment({
    observation: {
      receiverAddressId: q4.receiverAddressId, txid: TX(4), txVout: 0,
      observedSats: q4.satAmountInteger, confirmations: 2,
      blockHeight: "962410", blockHash: BLOCK(4), observedAt: now().toISOString(), spvVerified: true,
    }, store, now,
  }), "output_integrity_conflict");
  const preservedUnderpay = await store.findPaymentByOutput(TX(4), 0);
  assert.equal(preservedUnderpay?.paymentState, "manual_review");
  assert.equal(preservedUnderpay?.observedSats, String(BigInt(q4.satAmountInteger) - BigInt(1)));
  assert.equal(await store.findActivationByApplicationId(q4.applicationId), null);
  const exactAfterReview = await observeBtcDirectPayment({
    observation: { receiverAddressId: q4.receiverAddressId, txid: TX(14), txVout: 0, observedSats: q4.satAmountInteger, confirmations: 1, blockHeight: "962410", blockHash: BLOCK(14), observedAt: now().toISOString(), spvVerified: true },
    store, now,
  });
  assert.equal(exactAfterReview.payment.paymentState, "manual_review");
  assert.equal(exactAfterReview.activation, null);
  assert.equal((await store.findQuoteByReceiverAddressId(q4.receiverAddressId))?.quoteState, "manual_review");
  const concurrentReview = await Promise.all([15, 16].map((n) => observeBtcDirectPayment({
    observation: { receiverAddressId: q4.receiverAddressId, txid: TX(n), txVout: 0, observedSats: q4.satAmountInteger, confirmations: 2, blockHeight: "962411", blockHash: BLOCK(n), observedAt: now().toISOString(), spvVerified: true },
    store, now,
  })));
  assert(concurrentReview.every((x) => x.payment.paymentState === "manual_review" && x.activation === null));

  const q5 = await createBtcDirectQuote({
    applicationId: "APP-ACCEPTED-0005", idempotencyKey: "quote-key-late-0001",
    store, source, now, quoteId: () => "quote_0005",
  });
  clock = new Date(new Date(q5.quoteExpiresAt).getTime() + 1_000);
  const late = await observeBtcDirectPayment({
    observation: {
      receiverAddressId: q5.receiverAddressId, txid: TX(5), txVout: 0,
      observedSats: q5.satAmountInteger, confirmations: 1,
      blockHeight: "962410", blockHash: BLOCK(5), observedAt: now().toISOString(), spvVerified: true,
    }, store, now,
  });
  assert.equal(late.payment.paymentState, "manual_review");

  const q6 = await createBtcDirectQuote({
    applicationId: "APP-ACCEPTED-0006", idempotencyKey: "quote-key-overpay-0001",
    store, source, now, quoteId: () => "quote_0006",
  });
  const overpay = await observeBtcDirectPayment({
    observation: {
      receiverAddressId: q6.receiverAddressId, txid: TX(6), txVout: 0,
      observedSats: String(BigInt(q6.satAmountInteger) + BigInt(1)), confirmations: 1,
      blockHeight: "962411", blockHash: BLOCK(6), observedAt: now().toISOString(), spvVerified: true,
    }, store, now,
  });
  assert.equal(overpay.payment.paymentState, "manual_review");
  await expectCode(observeBtcDirectPayment({
    observation: {
      receiverAddressId: q6.receiverAddressId, txid: TX(6), txVout: 0,
      observedSats: q6.satAmountInteger, confirmations: 2,
      blockHeight: "962412", blockHash: BLOCK(7), observedAt: now().toISOString(), spvVerified: true,
    }, store, now,
  }), "output_integrity_conflict");
  assert.equal((await store.findPaymentByOutput(TX(6), 0))?.paymentState, "manual_review");
  assert.equal(await store.findActivationByApplicationId(q6.applicationId), null);

  await expectCode(observeBtcDirectPayment({
    observation: {
      receiverAddressId: q6.receiverAddressId, txid: TX(4), txVout: 0,
      observedSats: q6.satAmountInteger, confirmations: 1,
      blockHeight: "962412", blockHash: BLOCK(7), observedAt: now().toISOString(), spvVerified: true,
    }, store, now,
  }), "output_integrity_conflict");

  const q7 = await createBtcDirectQuote({
    applicationId: "APP-ACCEPTED-0007", idempotencyKey: "quote-key-concurrent-0001",
    store, source, now, quoteId: () => "quote_0007",
  });
  let activationEffectCalls = 0;
  const concurrentObservation = {
    receiverAddressId: q7.receiverAddressId, txid: TX(7), txVout: 0,
    observedSats: q7.satAmountInteger, confirmations: 1,
    blockHeight: "962413", blockHash: BLOCK(8), observedAt: now().toISOString(), spvVerified: true,
  };
  const concurrentResults = await Promise.all([
    observeBtcDirectPayment({ observation: concurrentObservation, store, now, activationId: () => "activation_concurrent_a", activationEffect: async () => { activationEffectCalls += 1; await new Promise((resolve) => setTimeout(resolve, 25)); } }),
    observeBtcDirectPayment({ observation: concurrentObservation, store, now, activationId: () => "activation_concurrent_b", activationEffect: async () => { activationEffectCalls += 1; await new Promise((resolve) => setTimeout(resolve, 25)); } }),
  ]);
  assert.equal(activationEffectCalls, 1);
  assert.equal(new Set(concurrentResults.map((item) => item.activation?.activationId).filter(Boolean)).size, 1);
  const concurrentReplay = await observeBtcDirectPayment({
    observation: { ...concurrentObservation, confirmations: 2, blockHeight: "962414", blockHash: BLOCK(9), observedAt: now().toISOString() },
    store, now, activationEffect: async () => { activationEffectCalls += 1; },
  });
  assert.equal(activationEffectCalls, 1);
  assert.equal(concurrentReplay.activation?.state, "active");

  const qReviewFence = await createBtcDirectQuote({
    applicationId: "APP-ACCEPTED-0009", idempotencyKey: "quote-key-review-fence-0001",
    store, source, now, quoteId: () => "quote_review_fence",
  });
  const reviewFenceReached = deferred();
  const reviewFenceResume = deferred();
  let reviewFenceEffectCalls = 0;
  const reviewFenceStore = withAuthorizationHook(store, async (input) => {
    reviewFenceReached.resolve();
    await reviewFenceResume.promise;
    return store.authorizeActivation(input);
  });
  const exactReviewFence = observeBtcDirectPayment({
    observation: {
      receiverAddressId: qReviewFence.receiverAddressId, txid: TX(90), txVout: 0,
      observedSats: qReviewFence.satAmountInteger, confirmations: 1, blockHeight: "962420",
      blockHash: BLOCK(20), observedAt: now().toISOString(), spvVerified: true,
    }, store: reviewFenceStore, now, activationEffect: async () => { reviewFenceEffectCalls += 1; },
  });
  await reviewFenceReached.promise;
  const reviewFenceUnder = await observeBtcDirectPayment({
    observation: {
      receiverAddressId: qReviewFence.receiverAddressId, txid: TX(91), txVout: 1,
      observedSats: String(BigInt(qReviewFence.satAmountInteger) - BigInt(1)), confirmations: 1,
      blockHeight: "962420", blockHash: BLOCK(21), observedAt: now().toISOString(), spvVerified: true,
    }, store, now,
  });
  assert.equal(reviewFenceUnder.payment.paymentState, "manual_review");
  reviewFenceResume.resolve();
  const reviewFenceDenied = await exactReviewFence;
  assert.equal(reviewFenceDenied.activation, null);
  assert.equal(reviewFenceEffectCalls, 0);
  assert.equal(store.quotesById.get(qReviewFence.quoteId)?.quoteState, "manual_review");
  assert.equal(await store.findActivationByApplicationId(qReviewFence.applicationId), null);
  const reviewMany = await Promise.all(Array.from({ length: 4 }, (_, index) => observeBtcDirectPayment({
    observation: {
      receiverAddressId: qReviewFence.receiverAddressId, txid: TX(92 + index), txVout: index + 2,
      observedSats: qReviewFence.satAmountInteger, confirmations: 1, blockHeight: "962421",
      blockHash: BLOCK(22 + index), observedAt: now().toISOString(), spvVerified: true,
    }, store, now, activationEffect: async () => { reviewFenceEffectCalls += 1; },
  })));
  assert(reviewMany.every((item) => item.payment.paymentState === "manual_review" && item.activation === null));
  assert.equal(reviewFenceEffectCalls, 0);

  const qFenceWinner = await createBtcDirectQuote({
    applicationId: "APP-ACCEPTED-0010", idempotencyKey: "quote-key-fence-winner-0001",
    store, source, now, quoteId: () => "quote_fence_winner",
  });
  const fenceWinnerAcquired = deferred();
  const fenceWinnerResume = deferred();
  let fenceWinnerEffects = 0;
  const fenceWinnerStore = withAuthorizationHook(store, async (input) => {
    const result = await store.authorizeActivation(input);
    if (result.authorized) {
      fenceWinnerAcquired.resolve();
      await fenceWinnerResume.promise;
    }
    return result;
  });
  const fenceWinnerExact = observeBtcDirectPayment({
    observation: {
      receiverAddressId: qFenceWinner.receiverAddressId, txid: TX(100), txVout: 0,
      observedSats: qFenceWinner.satAmountInteger, confirmations: 1, blockHeight: "962422",
      blockHash: BLOCK(30), observedAt: now().toISOString(), spvVerified: true,
    }, store: fenceWinnerStore, now, activationId: () => "activation_fence_winner",
    activationEffect: async () => { fenceWinnerEffects += 1; },
  });
  await fenceWinnerAcquired.promise;
  const fenceWinnerUnder = await observeBtcDirectPayment({
    observation: {
      receiverAddressId: qFenceWinner.receiverAddressId, txid: TX(101), txVout: 1,
      observedSats: String(BigInt(qFenceWinner.satAmountInteger) - BigInt(1)), confirmations: 1,
      blockHeight: "962422", blockHash: BLOCK(31), observedAt: now().toISOString(), spvVerified: true,
    }, store, now,
  });
  assert.equal(fenceWinnerUnder.payment.paymentState, "manual_review");
  assert.equal((await store.findActivationByApplicationId(qFenceWinner.applicationId))?.state, "pending");
  assert.equal(store.quotesById.get(qFenceWinner.quoteId)?.quoteState, "paid_confirmed");
  fenceWinnerResume.resolve();
  const fenceWinnerActive = await fenceWinnerExact;
  assert.equal(fenceWinnerActive.activation?.state, "active");
  assert.equal(fenceWinnerEffects, 1);
  assert.equal(store.quotesById.get(qFenceWinner.quoteId)?.quoteState, "activated");
  const fenceWinnerStart = fenceWinnerActive.activation?.serviceStart;
  const fenceWinnerEnd = fenceWinnerActive.activation?.serviceEnd;
  const fenceWinnerReplay = await observeBtcDirectPayment({
    observation: {
      receiverAddressId: qFenceWinner.receiverAddressId, txid: TX(100), txVout: 0,
      observedSats: qFenceWinner.satAmountInteger, confirmations: 2, blockHeight: "962423",
      blockHash: BLOCK(32), observedAt: now().toISOString(), spvVerified: true,
    }, store, now, activationEffect: async () => { fenceWinnerEffects += 1; },
  });
  assert.equal(fenceWinnerReplay.activation?.state, "active");
  assert.equal(fenceWinnerReplay.activation?.serviceStart, fenceWinnerStart);
  assert.equal(fenceWinnerReplay.activation?.serviceEnd, fenceWinnerEnd);
  assert.equal(fenceWinnerEffects, 1);
  assert.equal(store.quotesById.get(qFenceWinner.quoteId)?.quoteState, "activated");

  const postFenceAmounts = [
    String(BigInt(qFenceWinner.satAmountInteger) - BigInt(1)),
    String(BigInt(qFenceWinner.satAmountInteger) + BigInt(1)),
    qFenceWinner.satAmountInteger,
    qFenceWinner.satAmountInteger,
  ];
  const postFenceExceptions = await Promise.all(postFenceAmounts.map((observedSats, index) => observeBtcDirectPayment({
    observation: {
      receiverAddressId: qFenceWinner.receiverAddressId, txid: TX(110 + index), txVout: index + 2,
      observedSats, confirmations: 1, blockHeight: "962424",
      blockHash: BLOCK(40 + index), observedAt: now().toISOString(), spvVerified: true,
    }, store, now, activationEffect: async () => { fenceWinnerEffects += 1; },
  })));
  assert(postFenceExceptions.every((item) => item.payment.paymentState === "manual_review"));
  assert(postFenceExceptions.every((item) => item.activation?.activationId === fenceWinnerActive.activation?.activationId));
  assert.equal(fenceWinnerEffects, 1);
  assert.equal(store.quotesById.get(qFenceWinner.quoteId)?.quoteState, "activated");
  const postFenceActivation = await store.findActivationByApplicationId(qFenceWinner.applicationId);
  assert.equal(postFenceActivation?.state, "active");
  assert.equal(postFenceActivation?.serviceStart, fenceWinnerStart);
  assert.equal(postFenceActivation?.serviceEnd, fenceWinnerEnd);
  const forbiddenWorlds = Number(
    store.quotesById.get(qReviewFence.quoteId)?.quoteState === "manual_review"
      && (await store.findActivationByApplicationId(qReviewFence.applicationId)) !== null
  ) + Number(
    store.quotesById.get(qFenceWinner.quoteId)?.quoteState === "manual_review"
      && (await store.findActivationByApplicationId(qFenceWinner.applicationId))?.state === "active"
  );
  assert.equal(forbiddenWorlds, 0);

  const staleBase = new Date("2026-08-14T12:00:00.000Z");
  store.activations.set("APP-STALE-CLAIM-0001", {
    activationId: "activation_stale_0001", applicationId: "APP-STALE-CLAIM-0001",
    paymentId: "payment_stale_0001", activationKey: "APP-STALE-CLAIM-0001:stale",
    state: "pending", serviceStart: null, serviceEnd: null,
    createdAt: staleBase.toISOString(), updatedAt: staleBase.toISOString(), claimToken: null, claimedAt: null,
  });
  const firstClaim = await store.claimActivation("activation_stale_0001", "claim-token-old", staleBase.toISOString(), new Date(staleBase.getTime() - BTC_DIRECT_ACTIVATION_CLAIM_TTL_MS).toISOString());
  assert.equal(firstClaim.claimed, true);
  const earlyLoser = await store.claimActivation("activation_stale_0001", "claim-token-early", new Date(staleBase.getTime() + 1_000).toISOString(), new Date(staleBase.getTime() - BTC_DIRECT_ACTIVATION_CLAIM_TTL_MS + 1_000).toISOString());
  assert.equal(earlyLoser.claimed, false);
  const reclaimAt = new Date(staleBase.getTime() + BTC_DIRECT_ACTIVATION_CLAIM_TTL_MS + 1_000);
  const reclaimed = await store.claimActivation("activation_stale_0001", "claim-token-new", reclaimAt.toISOString(), new Date(reclaimAt.getTime() - BTC_DIRECT_ACTIVATION_CLAIM_TTL_MS).toISOString());
  assert.equal(reclaimed.claimed, true);
  await store.completeActivation("activation_stale_0001", reclaimAt.toISOString(), new Date(reclaimAt.getTime() + BTC_DIRECT_SERVICE_MS).toISOString(), reclaimAt.toISOString(), "claim-token-old");
  assert.equal(store.activations.get("APP-STALE-CLAIM-0001")?.state, "activating");
  const staleCompleted = await store.completeActivation("activation_stale_0001", reclaimAt.toISOString(), new Date(reclaimAt.getTime() + BTC_DIRECT_SERVICE_MS).toISOString(), reclaimAt.toISOString(), "claim-token-new");
  assert.equal(staleCompleted.state, "active");

  assert.equal(getBtcDirectPaymentRuntimeConfig({}).enabled, false);
  assert.equal(getBtcObservationRuntimeConfig({}).enabled, false);
  const reviewEnv = {
    BTC_DIRECT_PAYMENT_MODE,
    DATABASE_URL: "postgresql://fixture",
    ACCESS_PRIVATE_REVIEW_MODE: "auth0_neon_v1",
    AUTH0_DOMAIN: "tenant.example.auth0.com",
    AUTH0_CLIENT_ID: "fixture",
    AUTH0_CLIENT_SECRET: "fixture",
    AUTH0_SECRET: "00".repeat(32),
    APP_BASE_URL: "https://preview.example",
  };
  assert.equal(getBtcDirectPaymentRuntimeConfig(reviewEnv).enabled, true);
  assert.equal(getBtcObservationRuntimeConfig({
    BTC_DIRECT_PAYMENT_MODE, DATABASE_URL: "postgresql://fixture", BTC_PAYMENT_OBSERVATION_SECRET: "x".repeat(32),
  }).enabled, true);
  assert.equal(verifyObservationSecret("x".repeat(32), "x".repeat(32)), true);
  assert.equal(verifyObservationSecret("y".repeat(32), "x".repeat(32)), false);

  const migration = await readFile("migrations/20260814_btc_direct_payment_v1.sql", "utf8");
  assert.match(migration, /UNIQUE \(txid, tx_vout\)/);
  assert.match(migration, /activation_key TEXT NOT NULL UNIQUE/);
  assert.match(migration, /application_id TEXT NOT NULL UNIQUE/);
  assert.match(migration, /receive_address TEXT NOT NULL UNIQUE/);
  assert(!/seed|private_key|wallet_password|master_public_key/i.test(migration));

  assert.match(migration, /fx_rate_decimal TEXT NOT NULL/);
  assert.match(migration, /claim_token TEXT/);
  assert.match(migration, /claimed_at TIMESTAMPTZ/);
  assert.match(migration, /btc_direct_quotes_one_live_application_idx/);
  assert.match(migration, /WHERE quote_state <> 'expired'/);

  const api = await readFile("pages/api/btc-payment/observe.ts", "utf8");
  assert(!/electrum/i.test(api));
  assert(!/wallet balance|full wallet history/i.test(api));

  console.log("BTC_DIRECT_PAYMENT_LOCAL_ACCEPTANCE=PASS");
  console.log("assertions=root_json_authority,lossless_decimal,replay,conflict,one_live_quote,concurrent_quote_reservation,stale_fx,address_retirement,output_immutability,quote_review_latch,manual_review_sticky,reorg_review_sticky,mempool,spv_confirmation,exclusive_activation_claim,activation_retry,stale_claim_recovery,review_wins_activation_fence,activation_fence_wins_linearization,review_many_exact_no_activation,post_fence_exception_evidence_only,post_fence_quote_not_demoted,active_then_exception_no_demote,forbidden_manual_review_plus_active_zero,duplicate_payment,secret_boundary");
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
