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
    if (existing && existing.quoteId !== input.quoteId) throw new Error("payment_output_conflict");
    const stored = {
      ...input,
      paymentId: existing?.paymentId ?? input.paymentId,
      firstSeenAt: existing?.firstSeenAt ?? input.firstSeenAt,
      confirmedAt: existing?.confirmedAt ?? input.confirmedAt,
    };
    this.payments.set(key, stored);
    return structuredClone(stored);
  }
  async findActivationByApplicationId(applicationId: string) {
    const activation = this.activations.get(applicationId);
    return activation ? structuredClone(activation) : null;
  }
  async reserveActivation(input: BtcDirectActivationRecord) {
    const existing = this.activations.get(input.applicationId);
    if (existing) return structuredClone(existing);
    this.activations.set(input.applicationId, structuredClone(input));
    return structuredClone(input);
  }
  async claimActivation(activationId: string, at: string) {
    const activation = Array.from(this.activations.values()).find((item) => item.activationId === activationId)!;
    if (["pending", "retryable"].includes(activation.state)) activation.state = "activating";
    activation.updatedAt = at;
    return structuredClone(activation);
  }
  async completeActivation(activationId: string, serviceStart: string, serviceEnd: string, at: string) {
    const activation = Array.from(this.activations.values()).find((item) => item.activationId === activationId)!;
    if (activation.state === "activating") {
      activation.state = "active";
      activation.serviceStart = serviceStart;
      activation.serviceEnd = serviceEnd;
    }
    activation.updatedAt = at;
    return structuredClone(activation);
  }
  async failActivation(activationId: string, at: string) {
    const activation = Array.from(this.activations.values()).find((item) => item.activationId === activationId)!;
    if (activation.state === "activating") activation.state = "retryable";
    activation.serviceStart = null;
    activation.serviceEnd = null;
    activation.updatedAt = at;
    return structuredClone(activation);
  }
}

const ADDRESS = (n: number) => `bc1qpreview${String(n).padStart(32, "0")}`;
const TX = (n: number) => n.toString(16).padStart(64, "0");
const BLOCK = (n: number) => (1000 + n).toString(16).padStart(64, "0");

async function expectCode(promise: Promise<unknown>, code: string) {
  await assert.rejects(promise, (error: unknown) => error instanceof BtcDirectPaymentError && error.code === code);
}

async function run() {
  assert.equal(ceilUsdCentsToSats(4900, "62965").toString(), "77822");
  assert.equal(buildBip321Uri(ADDRESS(1), "77822"), `bitcoin:${ADDRESS(1)}?amount=0.00077822`);

  const store = new MemoryStore();
  ["APP-ACCEPTED-0001", "APP-ACCEPTED-0002", "APP-ACCEPTED-0003", "APP-ACCEPTED-0004", "APP-ACCEPTED-0005"].forEach((id) => store.accepted.add(id));
  for (let i = 1; i <= 12; i += 1) store.addAddress(`addr_${i.toString().padStart(4, "0")}`, ADDRESS(i));

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
  assert.equal(q2.receiverAddressId, "addr_0002");

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

  const api = await readFile("pages/api/btc-payment/observe.ts", "utf8");
  assert(!/electrum/i.test(api));
  assert(!/wallet balance|full wallet history/i.test(api));

  console.log("BTC_DIRECT_PAYMENT_LOCAL_ACCEPTANCE=PASS");
  console.log("assertions=quote_decimal,replay,conflict,stale_fx,address_retirement,mempool,spv_confirmation,idempotent_activation,activation_retry,duplicate_payment,reorg,underpayment,late_payment,secret_boundary");
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
