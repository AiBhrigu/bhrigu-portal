import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import { neon } from "@neondatabase/serverless";

import {
  BTC_DIRECT_SERVICE_MS,
  ceilUsdCentsToSats,
  createBtcDirectQuote,
  expireBtcDirectQuote,
  observeBtcDirectPayment,
  type BtcDirectPaymentStore,
} from "../lib/btc-direct-payment";
import { createNeonBtcDirectPaymentStore } from "../lib/btc-direct-payment-neon";
import {
  createCoinGeckoBtcUsdSource,
  parseCoinGeckoSimplePriceRaw,
} from "../lib/btc-direct-payment-source";

const TARGET_BRANCH = "agent/bhrigu-direct-bitcoin-payment-preview-e2e-v0-1";

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

async function run() {
  if (process.env.VERCEL_ENV !== "preview" || process.env.VERCEL_GIT_COMMIT_REF !== TARGET_BRANCH) {
    console.log("BTC_DIRECT_PAYMENT_PREVIEW_E2E=SKIP_NON_TARGET");
    return;
  }
  const databaseUrl = process.env.DATABASE_URL?.trim();
  assert(databaseUrl, "DATABASE_URL is required in protected Preview");

  const sql = neon(databaseUrl);
  const store = createNeonBtcDirectPaymentStore(databaseUrl);
  const previewQuoteRate = "62965.1234567890123456789012345";
  const source = createCoinGeckoBtcUsdSource({
    fetchImpl: (async () => ({
      ok: true,
      status: 200,
      text: async () =>
        `{"bitcoin":{"usd":${previewQuoteRate},"last_updated_at":${Math.floor(Date.now() / 1000)}}}`,
    })) as any,
  });
  const runId = randomUUID().replace(/-/g, "").slice(0, 16);
  const apps = Array.from({ length: 12 }, (_, i) => `BRG-BTC-PREVIEW-${runId}-${i + 1}`);
  const addressIds = Array.from({ length: 30 }, (_, i) => `preview_addr_${runId}_${i + 1}`);
  const addresses = addressIds.map((_, i) => `bc1qpreview${runId}${String(i + 1).padStart(24, "0")}`);
  const tx = (label: string) => createHash("sha256").update(`${runId}:${label}`).digest("hex");
  const now = () => new Date();

  try {
    const adversarialRate = "12345.6789012345678912345";
    assert.notEqual(String(Number(adversarialRate)), adversarialRate);
    const parsedRaw = parseCoinGeckoSimplePriceRaw(
      `{"bitcoin":{"usd":${adversarialRate},"last_updated_at":1786701600}}`
    );
    assert.equal(parsedRaw.rateDecimal, adversarialRate);
    assert.equal(ceilUsdCentsToSats(4900, parsedRaw.rateDecimal).toString(), "396901");
    for (const badRaw of [
      `{"wrapper":{"bitcoin":{"usd":${adversarialRate},"last_updated_at":1786701600}}}`,
      `{"bitcoin":{"usd":${adversarialRate},"last_updated_at":1786701600}} trailing`,
      `{"bitcoin":{"usd":1,"usd":2,"last_updated_at":1786701600}}`,
    ]) {
      assert.throws(() => parseCoinGeckoSimplePriceRaw(badRaw));
    }

    for (let index = 0; index < apps.length; index += 1) {
      const applicationId = apps[index];
      await sql`
        INSERT INTO access_intake_requests (
          request_id, idempotency_key, payload_hash, record, status, created_at, updated_at
        ) VALUES (
          ${applicationId}, ${`preview-access-${runId}-${index + 1}`},
          ${createHash("sha256").update(applicationId).digest("hex")},
          ${JSON.stringify({ requestId: applicationId, status: "accepted", synthetic: true })}::jsonb,
          'accepted', NOW(), NOW()
        )
      `;
    }
    for (let i = 0; i < addressIds.length; i += 1) {
      await sql`
        INSERT INTO btc_direct_receiver_addresses (
          receiver_address_id, receive_address, state, created_at
        ) VALUES (${addressIds[i]}, ${addresses[i]}, 'available', NOW())
      `;
    }

    const q1 = await createBtcDirectQuote({
      applicationId: apps[0], idempotencyKey: `preview-quote-${runId}-1`, store, source, now,
    });
    assert.equal(q1.quoteState, "payment_pending");
    assert(q1.bip321Uri.startsWith("bitcoin:"));
    assert(BigInt(q1.satAmountInteger) > BigInt(0));

    const replay = await createBtcDirectQuote({
      applicationId: apps[0], idempotencyKey: `preview-quote-${runId}-1`, store, source, now,
    });
    assert.equal(replay.quoteId, q1.quoteId);
    assert.equal(replay.satAmountInteger, q1.satAmountInteger);
    assert.equal(replay.receiverAddressId, q1.receiverAddressId);

    await assert.rejects(
      createBtcDirectQuote({
        applicationId: apps[1], idempotencyKey: `preview-quote-${runId}-1`, store, source, now,
      }),
      (error: any) => error?.code === "idempotency_conflict"
    );

    const quoteRace = await Promise.allSettled([
      createBtcDirectQuote({ applicationId: apps[1], idempotencyKey: `preview-race-${runId}-a`, store, source, now }),
      createBtcDirectQuote({ applicationId: apps[1], idempotencyKey: `preview-race-${runId}-b`, store, source, now }),
    ]);
    assert.equal(quoteRace.filter((x) => x.status === "fulfilled").length, 1);
    assert.equal(quoteRace.filter((x) => x.status === "rejected" && (x as PromiseRejectedResult).reason?.code === "application_quote_exists").length, 1);
    const raceRows = await sql`SELECT count(*)::int AS count FROM btc_direct_payment_quotes WHERE application_id = ${apps[1]} AND quote_state <> 'expired'`;
    assert.equal(raceRows[0].count, 1);
    const raceAddressRows = await sql`SELECT count(*)::int AS count FROM btc_direct_receiver_addresses WHERE reserved_quote_id IN (SELECT quote_id FROM btc_direct_payment_quotes WHERE application_id = ${apps[1]})`;
    assert.equal(raceAddressRows[0].count, 1);

    const expired = await expireBtcDirectQuote({
      quote: q1,
      store,
      now: () => new Date(new Date(q1.quoteExpiresAt).getTime() + 1),
    });
    assert.equal(expired.quoteState, "expired");
    const q2 = await createBtcDirectQuote({
      applicationId: apps[0], idempotencyKey: `preview-quote-${runId}-2`, store, source, now,
    });
    assert.notEqual(q2.receiverAddressId, q1.receiverAddressId);

    const mempool = await observeBtcDirectPayment({
      observation: {
        receiverAddressId: q2.receiverAddressId,
        txid: tx("payment-1"), txVout: 0, observedSats: q2.satAmountInteger,
        confirmations: 0, blockHeight: null, blockHash: null,
        observedAt: now().toISOString(), spvVerified: true,
      }, store, now,
    });
    assert.equal(mempool.payment.paymentState, "mempool_seen");
    assert.equal(mempool.activation, null);

    const confirmed = await observeBtcDirectPayment({
      observation: {
        receiverAddressId: q2.receiverAddressId,
        txid: tx("payment-1"), txVout: 0, observedSats: q2.satAmountInteger,
        confirmations: 1, blockHeight: "962408", blockHash: tx("block-1"),
        observedAt: now().toISOString(), spvVerified: true,
      }, store, now,
    });
    assert.equal(confirmed.payment.paymentState, "paid_confirmed");
    assert.equal(confirmed.activation?.state, "active");
    assert.equal(
      new Date(confirmed.activation!.serviceEnd!).getTime() - new Date(confirmed.activation!.serviceStart!).getTime(),
      BTC_DIRECT_SERVICE_MS
    );

    const activationReplay = await observeBtcDirectPayment({
      observation: {
        receiverAddressId: q2.receiverAddressId,
        txid: tx("payment-1"), txVout: 0, observedSats: q2.satAmountInteger,
        confirmations: 2, blockHeight: "962409", blockHash: tx("block-2"),
        observedAt: now().toISOString(), spvVerified: true,
      }, store, now,
    });
    assert.equal(activationReplay.activation?.activationId, confirmed.activation?.activationId);
    assert.equal(activationReplay.activation?.serviceEnd, confirmed.activation?.serviceEnd);

    const duplicate = await observeBtcDirectPayment({
      observation: {
        receiverAddressId: q2.receiverAddressId,
        txid: tx("payment-duplicate"), txVout: 1, observedSats: q2.satAmountInteger,
        confirmations: 1, blockHeight: "962409", blockHash: tx("block-2"),
        observedAt: now().toISOString(), spvVerified: true,
      }, store, now,
    });
    assert.equal(duplicate.payment.paymentState, "manual_review");
    assert.equal(duplicate.activation?.activationId, confirmed.activation?.activationId);

    const q3 = await createBtcDirectQuote({
      applicationId: apps[2], idempotencyKey: `preview-quote-${runId}-3`, store, source, now,
    });
    let failOnce = true;
    const failed = await observeBtcDirectPayment({
      observation: {
        receiverAddressId: q3.receiverAddressId,
        txid: tx("payment-failure"), txVout: 0, observedSats: q3.satAmountInteger,
        confirmations: 1, blockHeight: "962409", blockHash: tx("block-3"),
        observedAt: now().toISOString(), spvVerified: true,
      }, store, now,
      activationEffect: async () => {
        if (failOnce) { failOnce = false; throw new Error("preview_activation_failure"); }
      },
    });
    assert.equal(failed.payment.paymentState, "paid_confirmed");
    assert.equal(failed.activation?.state, "retryable");
    const recovered = await observeBtcDirectPayment({
      observation: {
        receiverAddressId: q3.receiverAddressId,
        txid: tx("payment-failure"), txVout: 0, observedSats: q3.satAmountInteger,
        confirmations: 1, blockHeight: "962409", blockHash: tx("block-3"),
        observedAt: now().toISOString(), spvVerified: true,
      }, store, now, activationEffect: async () => {},
    });
    assert.equal(recovered.activation?.state, "active");
    assert.equal(recovered.activation?.activationId, failed.activation?.activationId);

    const reorg = await observeBtcDirectPayment({
      observation: {
        receiverAddressId: q3.receiverAddressId,
        txid: tx("payment-failure"), txVout: 0, observedSats: q3.satAmountInteger,
        confirmations: 0, blockHeight: null, blockHash: null,
        observedAt: now().toISOString(), spvVerified: false,
      }, store, now,
    });
    assert.equal(reorg.payment.paymentState, "reorg_review");
    assert.equal(reorg.activation?.activationId, recovered.activation?.activationId);
    const reorgSticky = await observeBtcDirectPayment({
      observation: {
        receiverAddressId: q3.receiverAddressId,
        txid: tx("payment-failure"), txVout: 0, observedSats: q3.satAmountInteger,
        confirmations: 2, blockHeight: "962410", blockHash: tx("block-4"),
        observedAt: now().toISOString(), spvVerified: true,
      }, store, now,
    });
    assert.equal(reorgSticky.payment.paymentState, "reorg_review");
    assert.equal(reorgSticky.activation?.activationId, recovered.activation?.activationId);

    const q4 = await createBtcDirectQuote({
      applicationId: apps[3], idempotencyKey: `preview-quote-${runId}-4`, store, source, now,
    });
    const under = await observeBtcDirectPayment({
      observation: {
        receiverAddressId: q4.receiverAddressId, txid: tx("under"), txVout: 0,
        observedSats: String(BigInt(q4.satAmountInteger) - BigInt(1)),
        confirmations: 1, blockHeight: "962410", blockHash: tx("block-under"),
        observedAt: now().toISOString(), spvVerified: true,
      }, store, now,
    });
    assert.equal(under.payment.paymentState, "manual_review");
    await assert.rejects(observeBtcDirectPayment({
      observation: {
        receiverAddressId: q4.receiverAddressId, txid: tx("under"), txVout: 0,
        observedSats: q4.satAmountInteger, confirmations: 2,
        blockHeight: "962411", blockHash: tx("block-under-2"),
        observedAt: now().toISOString(), spvVerified: true,
      }, store, now,
    }), (error: any) => error?.code === "output_integrity_conflict");

    const reviewLatched = await observeBtcDirectPayment({
      observation: {
        receiverAddressId: q4.receiverAddressId, txid: tx("under-exact-new-output"), txVout: 1,
        observedSats: q4.satAmountInteger, confirmations: 1,
        blockHeight: "962411", blockHash: tx("block-under-exact-new"),
        observedAt: now().toISOString(), spvVerified: true,
      }, store, now,
    });
    assert.equal(reviewLatched.payment.paymentState, "manual_review");
    assert.equal(reviewLatched.activation, null);
    const reviewQuoteRows = await sql`SELECT quote_state FROM btc_direct_payment_quotes WHERE quote_id = ${q4.quoteId}`;
    assert.equal(reviewQuoteRows[0].quote_state, "manual_review");

    const q5 = await createBtcDirectQuote({
      applicationId: apps[4], idempotencyKey: `preview-quote-${runId}-5`, store, source, now,
    });
    let activationEffectCalls = 0;
    const concurrentObservation = {
      receiverAddressId: q5.receiverAddressId, txid: tx("concurrent"), txVout: 0,
      observedSats: q5.satAmountInteger, confirmations: 1,
      blockHeight: "962412", blockHash: tx("block-concurrent"),
      observedAt: now().toISOString(), spvVerified: true,
    };
    const concurrent = await Promise.all(Array.from({ length: 4 }, () => observeBtcDirectPayment({
      observation: concurrentObservation, store, now,
      activationEffect: async () => {
        activationEffectCalls += 1;
        await new Promise((resolve) => setTimeout(resolve, 75));
      },
    })));
    assert.equal(activationEffectCalls, 1);
    const activationIds = new Set(concurrent.map((x) => x.activation?.activationId).filter(Boolean));
    assert.equal(activationIds.size, 1);
    const activeRows = concurrent.filter((x) => x.activation?.state === "active");
    assert(activeRows.length >= 1);

    // Controlled interleaving: review wins before activation authorization.
    const qReviewWins = await createBtcDirectQuote({
      applicationId: apps[6], idempotencyKey: `preview-quote-${runId}-review-wins`, store, source, now,
    });
    const exactReachedFence = deferred();
    const resumeExactFence = deferred();
    let reviewWinsEffectCalls = 0;
    const reviewWinsStore = withAuthorizationHook(store, async (input) => {
      exactReachedFence.resolve();
      await resumeExactFence.promise;
      return store.authorizeActivation(input);
    });
    const exactAfterReview = observeBtcDirectPayment({
      observation: {
        receiverAddressId: qReviewWins.receiverAddressId, txid: tx("review-wins-exact"), txVout: 0,
        observedSats: qReviewWins.satAmountInteger, confirmations: 1,
        blockHeight: "962413", blockHash: tx("block-review-wins-exact"),
        observedAt: now().toISOString(), spvVerified: true,
      },
      store: reviewWinsStore, now, activationEffect: async () => { reviewWinsEffectCalls += 1; },
    });
    await exactReachedFence.promise;
    const reviewWinner = await observeBtcDirectPayment({
      observation: {
        receiverAddressId: qReviewWins.receiverAddressId, txid: tx("review-wins-under"), txVout: 1,
        observedSats: String(BigInt(qReviewWins.satAmountInteger) - BigInt(1)), confirmations: 1,
        blockHeight: "962413", blockHash: tx("block-review-wins-under"),
        observedAt: now().toISOString(), spvVerified: true,
      }, store, now,
    });
    assert.equal(reviewWinner.payment.paymentState, "manual_review");
    resumeExactFence.resolve();
    const deniedExact = await exactAfterReview;
    assert.equal(deniedExact.activation, null);
    assert.equal(reviewWinsEffectCalls, 0);
    const reviewWinsRows = await sql`
      SELECT
        (SELECT quote_state FROM btc_direct_payment_quotes WHERE quote_id = ${qReviewWins.quoteId}) AS quote_state,
        (SELECT count(*)::int FROM btc_direct_payment_activations WHERE application_id = ${apps[6]}) AS activation_count
    `;
    assert.equal(reviewWinsRows[0].quote_state, "manual_review");
    assert.equal(reviewWinsRows[0].activation_count, 0);

    const reviewManyEffects = { count: 0 };
    const reviewMany = await Promise.all(Array.from({ length: 4 }, (_, index) => observeBtcDirectPayment({
      observation: {
        receiverAddressId: qReviewWins.receiverAddressId, txid: tx(`review-many-${index}`), txVout: index + 2,
        observedSats: qReviewWins.satAmountInteger, confirmations: 1,
        blockHeight: "962414", blockHash: tx(`block-review-many-${index}`),
        observedAt: now().toISOString(), spvVerified: true,
      }, store, now, activationEffect: async () => { reviewManyEffects.count += 1; },
    })));
    assert(reviewMany.every((item) => item.payment.paymentState === "manual_review" && item.activation === null));
    assert.equal(reviewManyEffects.count, 0);

    // Controlled interleaving: durable activation fence wins before later review evidence.
    const qFenceWins = await createBtcDirectQuote({
      applicationId: apps[7], idempotencyKey: `preview-quote-${runId}-fence-wins`, store, source, now,
    });
    const fenceAcquired = deferred();
    const resumeFenceWinner = deferred();
    let fenceWinsEffectCalls = 0;
    const fenceWinsStore = withAuthorizationHook(store, async (input) => {
      const result = await store.authorizeActivation(input);
      if (result.authorized) {
        fenceAcquired.resolve();
        await resumeFenceWinner.promise;
      }
      return result;
    });
    const exactFenceWinner = observeBtcDirectPayment({
      observation: {
        receiverAddressId: qFenceWins.receiverAddressId, txid: tx("fence-wins-exact"), txVout: 0,
        observedSats: qFenceWins.satAmountInteger, confirmations: 1,
        blockHeight: "962415", blockHash: tx("block-fence-wins-exact"),
        observedAt: now().toISOString(), spvVerified: true,
      },
      store: fenceWinsStore, now, activationEffect: async () => { fenceWinsEffectCalls += 1; },
    });
    await fenceAcquired.promise;
    const fenceUnderpayment = await observeBtcDirectPayment({
      observation: {
        receiverAddressId: qFenceWins.receiverAddressId, txid: tx("fence-wins-under"), txVout: 1,
        observedSats: String(BigInt(qFenceWins.satAmountInteger) - BigInt(1)), confirmations: 1,
        blockHeight: "962415", blockHash: tx("block-fence-wins-under"),
        observedAt: now().toISOString(), spvVerified: true,
      }, store, now,
    });
    assert.equal(fenceUnderpayment.payment.paymentState, "manual_review");
    const fencedBeforeResume = await sql`
      SELECT
        (SELECT quote_state FROM btc_direct_payment_quotes WHERE quote_id = ${qFenceWins.quoteId}) AS quote_state,
        (SELECT count(*)::int FROM btc_direct_payment_activations WHERE application_id = ${apps[7]}) AS activation_count
    `;
    assert.equal(fencedBeforeResume[0].quote_state, "paid_confirmed");
    assert.equal(fencedBeforeResume[0].activation_count, 1);
    resumeFenceWinner.resolve();
    const fenceWinnerResult = await exactFenceWinner;
    assert.equal(fenceWinnerResult.activation?.state, "active");
    assert.equal(fenceWinsEffectCalls, 1);
    const firstServiceStart = fenceWinnerResult.activation?.serviceStart;
    const firstServiceEnd = fenceWinnerResult.activation?.serviceEnd;
    const fencedReplay = await observeBtcDirectPayment({
      observation: {
        receiverAddressId: qFenceWins.receiverAddressId, txid: tx("fence-wins-exact"), txVout: 0,
        observedSats: qFenceWins.satAmountInteger, confirmations: 2,
        blockHeight: "962416", blockHash: tx("block-fence-wins-replay"),
        observedAt: now().toISOString(), spvVerified: true,
      }, store, now, activationEffect: async () => { fenceWinsEffectCalls += 1; },
    });
    assert.equal(fencedReplay.activation?.state, "active");
    assert.equal(fencedReplay.activation?.serviceStart, firstServiceStart);
    assert.equal(fencedReplay.activation?.serviceEnd, firstServiceEnd);
    assert.equal(fenceWinsEffectCalls, 1);
    const fenceWinsRows = await sql`
      SELECT
        (SELECT quote_state FROM btc_direct_payment_quotes WHERE quote_id = ${qFenceWins.quoteId}) AS quote_state,
        (SELECT count(*)::int FROM btc_direct_payment_activations WHERE application_id = ${apps[7]}) AS activation_count,
        (SELECT payment_state FROM btc_direct_payment_receipts WHERE txid = ${tx("fence-wins-under")} AND tx_vout = 1) AS under_state
    `;
    assert.equal(fenceWinsRows[0].quote_state, "activated");
    assert.equal(fenceWinsRows[0].activation_count, 1);
    assert.equal(fenceWinsRows[0].under_state, "manual_review");

    const postFenceAmounts = [
      String(BigInt(qFenceWins.satAmountInteger) - BigInt(1)),
      String(BigInt(qFenceWins.satAmountInteger) + BigInt(1)),
      qFenceWins.satAmountInteger,
      qFenceWins.satAmountInteger,
    ];
    const postFenceExceptions = await Promise.all(postFenceAmounts.map((observedSats, index) => observeBtcDirectPayment({
      observation: {
        receiverAddressId: qFenceWins.receiverAddressId, txid: tx(`post-fence-exception-${index}`), txVout: index + 2,
        observedSats, confirmations: 1, blockHeight: "962417",
        blockHash: tx(`block-post-fence-exception-${index}`), observedAt: now().toISOString(), spvVerified: true,
      }, store, now, activationEffect: async () => { fenceWinsEffectCalls += 1; },
    })));
    assert(postFenceExceptions.every((item) => item.payment.paymentState === "manual_review"));
    assert(postFenceExceptions.every((item) => item.activation?.activationId === fenceWinnerResult.activation?.activationId));
    assert.equal(fenceWinsEffectCalls, 1);
    const postFenceRows = await sql`
      SELECT
        (SELECT quote_state FROM btc_direct_payment_quotes WHERE quote_id = ${qFenceWins.quoteId}) AS quote_state,
        (SELECT count(*)::int FROM btc_direct_payment_activations WHERE application_id = ${apps[7]}) AS activation_count,
        (SELECT service_start FROM btc_direct_payment_activations WHERE application_id = ${apps[7]}) AS service_start,
        (SELECT service_end FROM btc_direct_payment_activations WHERE application_id = ${apps[7]}) AS service_end
    `;
    assert.equal(postFenceRows[0].quote_state, "activated");
    assert.equal(postFenceRows[0].activation_count, 1);
    assert.equal(new Date(postFenceRows[0].service_start).toISOString(), firstServiceStart);
    assert.equal(new Date(postFenceRows[0].service_end).toISOString(), firstServiceEnd);

    let forbiddenWorlds = 0;
    let repeatedFenceEffects = 0;
    for (let iteration = 0; iteration < 4; iteration += 1) {
      const applicationId = apps[8 + iteration];
      const qWorld = await createBtcDirectQuote({
        applicationId, idempotencyKey: `preview-world-${runId}-${iteration}`, store, source, now,
      });
      if (iteration % 2 === 0) {
        const reached = deferred();
        const resume = deferred();
        const hooked = withAuthorizationHook(store, async (input) => {
          reached.resolve();
          await resume.promise;
          return store.authorizeActivation(input);
        });
        const exact = observeBtcDirectPayment({
          observation: {
            receiverAddressId: qWorld.receiverAddressId, txid: tx(`world-${iteration}-exact`), txVout: 0,
            observedSats: qWorld.satAmountInteger, confirmations: 1, blockHeight: "962418",
            blockHash: tx(`world-${iteration}-block-exact`), observedAt: now().toISOString(), spvVerified: true,
          }, store: hooked, now, activationEffect: async () => { repeatedFenceEffects += 1; },
        });
        await reached.promise;
        await observeBtcDirectPayment({
          observation: {
            receiverAddressId: qWorld.receiverAddressId, txid: tx(`world-${iteration}-under`), txVout: 1,
            observedSats: String(BigInt(qWorld.satAmountInteger) - BigInt(1)), confirmations: 1, blockHeight: "962418",
            blockHash: tx(`world-${iteration}-block-under`), observedAt: now().toISOString(), spvVerified: true,
          }, store, now,
        });
        resume.resolve();
        const result = await exact;
        assert.equal(result.activation, null);
        const world = await sql`SELECT
          (SELECT quote_state FROM btc_direct_payment_quotes WHERE quote_id = ${qWorld.quoteId}) AS quote_state,
          (SELECT count(*)::int FROM btc_direct_payment_activations WHERE application_id = ${applicationId}) AS activation_count`;
        assert.equal(world[0].quote_state, "manual_review");
        assert.equal(world[0].activation_count, 0);
        if (world[0].quote_state === "manual_review" && world[0].activation_count > 0) forbiddenWorlds += 1;
      } else {
        const acquired = deferred();
        const resume = deferred();
        const hooked = withAuthorizationHook(store, async (input) => {
          const result = await store.authorizeActivation(input);
          if (result.authorized) { acquired.resolve(); await resume.promise; }
          return result;
        });
        const exact = observeBtcDirectPayment({
          observation: {
            receiverAddressId: qWorld.receiverAddressId, txid: tx(`world-${iteration}-exact`), txVout: 0,
            observedSats: qWorld.satAmountInteger, confirmations: 1, blockHeight: "962419",
            blockHash: tx(`world-${iteration}-block-exact`), observedAt: now().toISOString(), spvVerified: true,
          }, store: hooked, now, activationEffect: async () => { repeatedFenceEffects += 1; },
        });
        await acquired.promise;
        await observeBtcDirectPayment({
          observation: {
            receiverAddressId: qWorld.receiverAddressId, txid: tx(`world-${iteration}-under`), txVout: 1,
            observedSats: String(BigInt(qWorld.satAmountInteger) - BigInt(1)), confirmations: 1, blockHeight: "962419",
            blockHash: tx(`world-${iteration}-block-under`), observedAt: now().toISOString(), spvVerified: true,
          }, store, now,
        });
        const preResume = await sql`SELECT
          (SELECT quote_state FROM btc_direct_payment_quotes WHERE quote_id = ${qWorld.quoteId}) AS quote_state,
          (SELECT count(*)::int FROM btc_direct_payment_activations WHERE application_id = ${applicationId}) AS activation_count`;
        assert.equal(preResume[0].quote_state, "paid_confirmed");
        assert.equal(preResume[0].activation_count, 1);
        resume.resolve();
        const result = await exact;
        assert.equal(result.activation?.state, "active");
        const world = await sql`SELECT
          (SELECT quote_state FROM btc_direct_payment_quotes WHERE quote_id = ${qWorld.quoteId}) AS quote_state,
          (SELECT count(*)::int FROM btc_direct_payment_activations WHERE application_id = ${applicationId}) AS activation_count,
          (SELECT state FROM btc_direct_payment_activations WHERE application_id = ${applicationId}) AS activation_state`;
        if (world[0].quote_state === "manual_review" && world[0].activation_state === "active") forbiddenWorlds += 1;
        assert.equal(world[0].quote_state, "activated");
        assert.equal(world[0].activation_count, 1);
        assert.equal(world[0].activation_state, "active");
      }
    }
    assert.equal(forbiddenWorlds, 0);
    assert.equal(repeatedFenceEffects, 2);

    const q6 = await createBtcDirectQuote({
      applicationId: apps[5], idempotencyKey: `preview-quote-${runId}-6`, store, source, now,
    });
    const leasePayment = await observeBtcDirectPayment({
      observation: {
        receiverAddressId: q6.receiverAddressId, txid: tx("lease"), txVout: 0,
        observedSats: q6.satAmountInteger, confirmations: 0,
        blockHeight: null, blockHash: null, observedAt: now().toISOString(), spvVerified: true,
      }, store, now,
    });
    const leaseActivationId = `btca_lease_${runId}`;
    await sql`
      INSERT INTO btc_direct_payment_activations (
        activation_id, application_id, payment_id, activation_key, state,
        service_start, service_end, created_at, updated_at
      ) VALUES (
        ${leaseActivationId}, ${apps[5]}, ${leasePayment.payment.paymentId}, ${`${apps[5]}:${tx("lease")}`},
        'pending', NULL, NULL, ${now().toISOString()}, ${now().toISOString()}
      )
    `;
    const t0 = new Date(now().getTime() - 10 * 60 * 1000);
    const firstClaim = await store.claimActivation(leaseActivationId, "lease-token-a", t0.toISOString(), new Date(t0.getTime() - 5 * 60 * 1000).toISOString());
    assert.equal(firstClaim.claimed, true);
    const blockedClaim = await store.claimActivation(leaseActivationId, "lease-token-b", new Date(t0.getTime() + 60_000).toISOString(), new Date(t0.getTime() - 4 * 60_000).toISOString());
    assert.equal(blockedClaim.claimed, false);
    const staleClaim = await store.claimActivation(leaseActivationId, "lease-token-c", new Date(t0.getTime() + 6 * 60_000).toISOString(), new Date(t0.getTime() + 60_000).toISOString());
    assert.equal(staleClaim.claimed, true);
    const staleOwnerComplete = await store.completeActivation(leaseActivationId, new Date().toISOString(), new Date(Date.now() + BTC_DIRECT_SERVICE_MS).toISOString(), new Date().toISOString(), "lease-token-a");
    assert.equal(staleOwnerComplete.state, "activating");
    assert.equal(staleOwnerComplete.claimToken, "lease-token-c");
    const release = await store.failActivation(leaseActivationId, new Date().toISOString(), "lease-token-c");
    assert.equal(release.state, "retryable");

  } finally {
    const appPrefix = `BRG-BTC-PREVIEW-${runId}-%`;
    const addressPrefix = `preview_addr_${runId}_%`;
    await sql`UPDATE btc_direct_receiver_addresses SET reserved_quote_id = NULL WHERE receiver_address_id LIKE ${addressPrefix}`;
    await sql`DELETE FROM btc_direct_payment_activations WHERE application_id LIKE ${appPrefix}`;
    await sql`DELETE FROM btc_direct_payment_receipts WHERE quote_id IN (SELECT quote_id FROM btc_direct_payment_quotes WHERE application_id LIKE ${appPrefix})`;
    await sql`DELETE FROM btc_direct_payment_quotes WHERE application_id LIKE ${appPrefix}`;
    await sql`DELETE FROM btc_direct_receiver_addresses WHERE receiver_address_id LIKE ${addressPrefix}`;
    await sql`DELETE FROM access_intake_requests WHERE request_id LIKE ${appPrefix}`;

    const residue = await sql`
      SELECT
        (SELECT count(*)::int FROM btc_direct_payment_activations WHERE application_id LIKE ${appPrefix}) AS activations,
        (SELECT count(*)::int FROM btc_direct_payment_quotes WHERE application_id LIKE ${appPrefix}) AS quotes,
        (SELECT count(*)::int FROM btc_direct_receiver_addresses WHERE receiver_address_id LIKE ${addressPrefix}) AS addresses,
        (SELECT count(*)::int FROM access_intake_requests WHERE request_id LIKE ${appPrefix}) AS applications
    `;
    assert.deepEqual(residue[0], { activations: 0, quotes: 0, addresses: 0, applications: 0 });
  }

  console.log("BTC_DIRECT_PAYMENT_PREVIEW_E2E=PASS");
  console.log("ledger=root_json_authority,lossless_decimal,quote,replay,conflict,one_live_quote,concurrent_quote_reservation,address_retirement,output_immutability,quote_review_latch,manual_review_sticky,mempool,spv_confirm,activation,replay,failure_retry,duplicate,reorg_sticky,concurrent_activation_single_winner,stale_claim_recovery,review_wins_activation_fence,activation_fence_wins_linearization,review_many_exact_no_activation,post_fence_exception_evidence_only,post_fence_quote_not_demoted,active_then_exception_no_demote,forbidden_manual_review_plus_active_zero,cleanup_zero");
  console.log("real_btc_moved=ZERO");
  console.log("customer_qr_sent=NO");
}

run().catch((error) => {
  console.error("BTC_DIRECT_PAYMENT_PREVIEW_E2E=FAIL");
  console.error(error instanceof Error ? error.message : "unknown_error");
  process.exitCode = 1;
});
