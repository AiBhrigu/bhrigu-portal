import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import { neon } from "@neondatabase/serverless";

import {
  BTC_DIRECT_SERVICE_MS,
  createBtcDirectQuote,
  expireBtcDirectQuote,
  observeBtcDirectPayment,
} from "../lib/btc-direct-payment";
import { createNeonBtcDirectPaymentStore } from "../lib/btc-direct-payment-neon";
import { createCoinGeckoBtcUsdSource } from "../lib/btc-direct-payment-source";

const TARGET_BRANCH = "agent/bhrigu-direct-bitcoin-payment-preview-e2e-v0-1";

async function run() {
  if (process.env.VERCEL_ENV !== "preview" || process.env.VERCEL_GIT_COMMIT_REF !== TARGET_BRANCH) {
    console.log("BTC_DIRECT_PAYMENT_PREVIEW_E2E=SKIP_NON_TARGET");
    return;
  }
  const databaseUrl = process.env.DATABASE_URL?.trim();
  assert(databaseUrl, "DATABASE_URL is required in protected Preview");

  const sql = neon(databaseUrl);
  const store = createNeonBtcDirectPaymentStore(databaseUrl);
  const source = createCoinGeckoBtcUsdSource({
    demoApiKey: process.env.COINGECKO_DEMO_API_KEY?.trim() || null,
  });
  const runId = randomUUID().replace(/-/g, "").slice(0, 16);
  const apps = Array.from({ length: 4 }, (_, i) => `BRG-BTC-PREVIEW-${runId}-${i + 1}`);
  const addressIds = Array.from({ length: 10 }, (_, i) => `preview_addr_${runId}_${i + 1}`);
  const addresses = addressIds.map((_, i) => `bc1qpreview${runId}${String(i + 1).padStart(24, "0")}`);
  const tx = (label: string) => createHash("sha256").update(`${runId}:${label}`).digest("hex");
  const now = () => new Date();

  try {
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
  console.log("ledger=quote,replay,conflict,address_retirement,mempool,spv_confirm,activation,replay,failure_retry,duplicate,reorg,cleanup_zero");
  console.log("real_btc_moved=ZERO");
  console.log("customer_qr_sent=NO");
}

run().catch((error) => {
  console.error("BTC_DIRECT_PAYMENT_PREVIEW_E2E=FAIL");
  console.error(error instanceof Error ? error.message : "unknown_error");
  process.exitCode = 1;
});
