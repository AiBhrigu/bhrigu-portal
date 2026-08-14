import { neon } from "@neondatabase/serverless";

import type {
  BtcDirectActivationRecord,
  BtcDirectPaymentRecord,
  BtcDirectPaymentStore,
  BtcDirectQuoteRecord,
  BtcDirectQuoteState,
} from "./btc-direct-payment";

export function createNeonBtcDirectPaymentStore(databaseUrl: string): BtcDirectPaymentStore {
  const sql = neon(databaseUrl);

  return {
    async findQuoteByIdempotencyKey(key) {
      const rows = await sql`
        SELECT * FROM btc_direct_payment_quotes
        WHERE idempotency_key = ${key}
        LIMIT 1
      `;
      return rows[0] ? mapQuote(rows[0]) : null;
    },

    async isAcceptedApplication(applicationId) {
      const rows = await sql`
        SELECT 1
        FROM access_intake_requests
        WHERE request_id = ${applicationId}
          AND status = 'accepted'
        LIMIT 1
      `;
      return rows.length === 1;
    },

    async reserveQuote(input) {
      const rows = await sql`
        WITH candidate AS (
          SELECT receiver_address_id, receive_address
          FROM btc_direct_receiver_addresses
          WHERE state = 'available'
          ORDER BY created_at, receiver_address_id
          FOR UPDATE SKIP LOCKED
          LIMIT 1
        ), inserted AS (
          INSERT INTO btc_direct_payment_quotes (
            quote_id, application_id, idempotency_key, idempotency_payload_hash,
            usd_price_cents, fx_source, fx_rate_decimal, fx_timestamp,
            quote_expires_at, sat_amount_integer, receiver_address_id,
            receive_address, quote_state, created_at, updated_at
          )
          SELECT
            ${input.quoteId}, ${input.applicationId}, ${input.idempotencyKey},
            ${input.idempotencyPayloadHash}, ${input.usdPriceCents}, ${input.fxSource},
            ${input.fxRateDecimal}, ${input.fxTimestamp}, ${input.quoteExpiresAt},
            ${input.satAmountInteger}, candidate.receiver_address_id,
            candidate.receive_address, 'quote_created', ${input.createdAt}, ${input.updatedAt}
          FROM candidate
          ON CONFLICT (idempotency_key) DO NOTHING
          RETURNING *
        ), reserved AS (
          UPDATE btc_direct_receiver_addresses AS address
          SET state = 'reserved', reserved_quote_id = inserted.quote_id
          FROM inserted
          WHERE address.receiver_address_id = inserted.receiver_address_id
            AND address.state = 'available'
          RETURNING address.receiver_address_id
        )
        SELECT inserted.*
        FROM inserted
        JOIN reserved USING (receiver_address_id)
      `;
      if (rows[0]) {
        return { disposition: "created" as const, quote: mapQuote(rows[0]) };
      }

      const existingRows = await sql`
        SELECT * FROM btc_direct_payment_quotes
        WHERE idempotency_key = ${input.idempotencyKey}
        LIMIT 1
      `;
      if (existingRows[0]) {
        const existing = mapQuote(existingRows[0]);
        return {
          disposition:
            existing.idempotencyPayloadHash === input.idempotencyPayloadHash
              ? ("replay" as const)
              : ("conflict" as const),
          quote: existing,
        };
      }
      return { disposition: "address_unavailable" as const, quote: null };
    },

    async markQuotePending(quoteId, at) {
      const rows = await sql`
        UPDATE btc_direct_payment_quotes
        SET quote_state = 'payment_pending', updated_at = ${at}
        WHERE quote_id = ${quoteId}
          AND quote_state = 'quote_created'
        RETURNING *
      `;
      if (rows[0]) return mapQuote(rows[0]);
      const current = await sql`
        SELECT * FROM btc_direct_payment_quotes WHERE quote_id = ${quoteId} LIMIT 1
      `;
      if (!current[0]) throw new Error("quote_missing");
      return mapQuote(current[0]);
    },

    async expireQuote(quoteId, at) {
      const rows = await sql`
        WITH expired AS (
          UPDATE btc_direct_payment_quotes
          SET quote_state = 'expired', updated_at = ${at}
          WHERE quote_id = ${quoteId}
            AND quote_state IN ('quote_created', 'payment_pending')
          RETURNING *
        ), retired AS (
          UPDATE btc_direct_receiver_addresses AS address
          SET state = 'retired', retired_at = ${at}
          FROM expired
          WHERE address.receiver_address_id = expired.receiver_address_id
          RETURNING address.receiver_address_id
        )
        SELECT expired.* FROM expired
      `;
      if (rows[0]) return mapQuote(rows[0]);
      const current = await sql`
        SELECT * FROM btc_direct_payment_quotes WHERE quote_id = ${quoteId} LIMIT 1
      `;
      if (!current[0]) throw new Error("quote_missing");
      return mapQuote(current[0]);
    },

    async findQuoteByReceiverAddressId(receiverAddressId) {
      const rows = await sql`
        SELECT * FROM btc_direct_payment_quotes
        WHERE receiver_address_id = ${receiverAddressId}
        LIMIT 1
      `;
      return rows[0] ? mapQuote(rows[0]) : null;
    },

    async markQuoteState(quoteId, state: BtcDirectQuoteState, at) {
      await sql`
        UPDATE btc_direct_payment_quotes
        SET quote_state = ${state}, updated_at = ${at}
        WHERE quote_id = ${quoteId}
      `;
    },

    async findPaymentByOutput(txid, txVout) {
      const rows = await sql`
        SELECT * FROM btc_direct_payment_receipts
        WHERE txid = ${txid} AND tx_vout = ${txVout}
        LIMIT 1
      `;
      return rows[0] ? mapPayment(rows[0]) : null;
    },

    async upsertPayment(input) {
      const rows = await sql`
        INSERT INTO btc_direct_payment_receipts (
          payment_id, quote_id, txid, tx_vout, observed_sats, block_height,
          block_hash, confirmations, payment_state, first_seen_at,
          confirmed_at, updated_at
        ) VALUES (
          ${input.paymentId}, ${input.quoteId}, ${input.txid}, ${input.txVout},
          ${input.observedSats}, ${input.blockHeight}, ${input.blockHash},
          ${input.confirmations}, ${input.paymentState}, ${input.firstSeenAt},
          ${input.confirmedAt}, ${input.updatedAt}
        )
        ON CONFLICT (txid, tx_vout) DO UPDATE SET
          block_height = EXCLUDED.block_height,
          block_hash = EXCLUDED.block_hash,
          confirmations = EXCLUDED.confirmations,
          payment_state = CASE
            WHEN btc_direct_payment_receipts.payment_state = 'manual_review' THEN 'manual_review'
            WHEN btc_direct_payment_receipts.payment_state = 'reorg_review' THEN 'reorg_review'
            WHEN btc_direct_payment_receipts.payment_state = 'paid_confirmed'
              THEN CASE WHEN EXCLUDED.payment_state = 'reorg_review' THEN 'reorg_review' ELSE 'paid_confirmed' END
            ELSE EXCLUDED.payment_state
          END,
          confirmed_at = COALESCE(btc_direct_payment_receipts.confirmed_at, EXCLUDED.confirmed_at),
          updated_at = EXCLUDED.updated_at
        WHERE btc_direct_payment_receipts.quote_id = EXCLUDED.quote_id
          AND btc_direct_payment_receipts.observed_sats = EXCLUDED.observed_sats
        RETURNING *
      `;
      if (!rows[0]) throw new Error("payment_output_integrity_conflict");
      return mapPayment(rows[0]);
    },

    async findActivationByApplicationId(applicationId) {
      const rows = await sql`
        SELECT * FROM btc_direct_payment_activations
        WHERE application_id = ${applicationId}
        LIMIT 1
      `;
      return rows[0] ? mapActivation(rows[0]) : null;
    },

    async reserveActivation(input) {
      await sql`
        INSERT INTO btc_direct_payment_activations (
          activation_id, application_id, payment_id, activation_key, state,
          service_start, service_end, created_at, updated_at
        ) VALUES (
          ${input.activationId}, ${input.applicationId}, ${input.paymentId},
          ${input.activationKey}, 'pending', NULL, NULL,
          ${input.createdAt}, ${input.updatedAt}
        )
        ON CONFLICT DO NOTHING
      `;
      const rows = await sql`
        SELECT * FROM btc_direct_payment_activations
        WHERE application_id = ${input.applicationId}
        LIMIT 1
      `;
      if (!rows[0]) throw new Error("activation_reservation_missing");
      return mapActivation(rows[0]);
    },

    async claimActivation(activationId, claimToken, at, staleBefore) {
      const rows = await sql`
        UPDATE btc_direct_payment_activations
        SET state = 'activating', claim_token = ${claimToken}, claimed_at = ${at}, updated_at = ${at}
        WHERE activation_id = ${activationId}
          AND (
            state IN ('pending', 'retryable')
            OR (state = 'activating' AND claimed_at < ${staleBefore})
          )
        RETURNING *
      `;
      if (rows[0]) return { claimed: true, activation: mapActivation(rows[0]) };
      const current = await sql`
        SELECT * FROM btc_direct_payment_activations
        WHERE activation_id = ${activationId}
        LIMIT 1
      `;
      if (!current[0]) throw new Error("activation_missing");
      return { claimed: false, activation: mapActivation(current[0]) };
    },

    async completeActivation(activationId, serviceStart, serviceEnd, at, claimToken) {
      const rows = await sql`
        UPDATE btc_direct_payment_activations
        SET state = 'active', service_start = ${serviceStart},
            service_end = ${serviceEnd}, claim_token = NULL, claimed_at = NULL, updated_at = ${at}
        WHERE activation_id = ${activationId}
          AND state = 'activating'
          AND claim_token = ${claimToken}
        RETURNING *
      `;
      if (rows[0]) return mapActivation(rows[0]);
      const current = await sql`
        SELECT * FROM btc_direct_payment_activations
        WHERE activation_id = ${activationId}
        LIMIT 1
      `;
      if (!current[0]) throw new Error("activation_missing");
      return mapActivation(current[0]);
    },

    async failActivation(activationId, at, claimToken) {
      const rows = await sql`
        UPDATE btc_direct_payment_activations
        SET state = 'retryable', service_start = NULL, service_end = NULL,
            claim_token = NULL, claimed_at = NULL, updated_at = ${at}
        WHERE activation_id = ${activationId}
          AND state = 'activating'
          AND claim_token = ${claimToken}
        RETURNING *
      `;
      if (rows[0]) return mapActivation(rows[0]);
      const current = await sql`
        SELECT * FROM btc_direct_payment_activations
        WHERE activation_id = ${activationId}
        LIMIT 1
      `;
      if (!current[0]) throw new Error("activation_missing");
      return mapActivation(current[0]);
    },
  };
}

function mapQuote(row: any): BtcDirectQuoteRecord {
  return {
    quoteId: String(row.quote_id),
    applicationId: String(row.application_id),
    idempotencyKey: String(row.idempotency_key),
    idempotencyPayloadHash: String(row.idempotency_payload_hash),
    usdPriceCents: Number(row.usd_price_cents),
    fxSource: String(row.fx_source) as BtcDirectQuoteRecord["fxSource"],
    fxRateDecimal: String(row.fx_rate_decimal),
    fxTimestamp: iso(row.fx_timestamp),
    quoteExpiresAt: iso(row.quote_expires_at),
    satAmountInteger: String(row.sat_amount_integer),
    receiverAddressId: String(row.receiver_address_id),
    receiveAddress: String(row.receive_address),
    quoteState: String(row.quote_state) as BtcDirectQuoteRecord["quoteState"],
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
  };
}

function mapPayment(row: any): BtcDirectPaymentRecord {
  return {
    paymentId: String(row.payment_id),
    quoteId: String(row.quote_id),
    txid: String(row.txid),
    txVout: Number(row.tx_vout),
    observedSats: String(row.observed_sats),
    blockHeight: row.block_height == null ? null : String(row.block_height),
    blockHash: row.block_hash == null ? null : String(row.block_hash),
    confirmations: Number(row.confirmations),
    paymentState: String(row.payment_state) as BtcDirectPaymentRecord["paymentState"],
    firstSeenAt: iso(row.first_seen_at),
    confirmedAt: row.confirmed_at == null ? null : iso(row.confirmed_at),
    updatedAt: iso(row.updated_at),
  };
}

function mapActivation(row: any): BtcDirectActivationRecord {
  return {
    activationId: String(row.activation_id),
    applicationId: String(row.application_id),
    paymentId: String(row.payment_id),
    activationKey: String(row.activation_key),
    state: String(row.state) as BtcDirectActivationRecord["state"],
    serviceStart: row.service_start == null ? null : iso(row.service_start),
    serviceEnd: row.service_end == null ? null : iso(row.service_end),
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
    claimToken: row.claim_token == null ? null : String(row.claim_token),
    claimedAt: row.claimed_at == null ? null : iso(row.claimed_at),
  };
}

function iso(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  return new Date(String(value)).toISOString();
}
