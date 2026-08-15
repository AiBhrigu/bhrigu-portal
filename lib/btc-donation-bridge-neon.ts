import { neon } from "@neondatabase/serverless";
import type { DonationAddressProvisionPayload, DonationBridgeEnvelope, DonationObservationPayload } from "./btc-donation-bridge";
import { donationReceiptId, proposedDonationReceiptState } from "./btc-donation-bridge";

export type BridgeMessageDisposition = "accepted" | "replay" | "conflict";

export function createNeonBtcDonationBridgeStore(databaseUrl: string) {
  const sql = neon(databaseUrl);
  return {
    async recordMessage(envelope: DonationBridgeEnvelope): Promise<BridgeMessageDisposition> {
      const inserted = await sql`
        INSERT INTO btc_donation_bridge_messages(message_id,message_kind,payload_hash,created_at,processed_at)
        VALUES (${envelope.messageId},${envelope.messageKind},${envelope.payloadHash},${envelope.createdAt},NULL)
        ON CONFLICT (message_id) DO NOTHING
        RETURNING message_id
      `;
      if (inserted[0]) return "accepted";
      const rows = await sql`
        SELECT message_kind,payload_hash FROM btc_donation_bridge_messages WHERE message_id=${envelope.messageId} LIMIT 1
      `;
      if (!rows[0]) throw new Error("bridge_message_missing_after_conflict");
      return rows[0].message_kind === envelope.messageKind && rows[0].payload_hash === envelope.payloadHash ? "replay" : "conflict";
    },

    async markMessageProcessed(messageId: string, at: string) {
      await sql`UPDATE btc_donation_bridge_messages SET processed_at=COALESCE(processed_at,${at}) WHERE message_id=${messageId}`;
    },

    async provisionAddress(payload: DonationAddressProvisionPayload): Promise<"created" | "replay" | "conflict"> {
      const inserted = await sql`
        INSERT INTO btc_donation_receiver_addresses(receiver_address_id,receive_address,state,issued_session_id,created_at,issued_at,retired_at)
        VALUES (${payload.receiverAddressId},${payload.receiveAddress},'available',NULL,${payload.createdAt},NULL,NULL)
        ON CONFLICT DO NOTHING
        RETURNING receiver_address_id
      `;
      if (inserted[0]) return "created";
      const rows = await sql`
        SELECT receiver_address_id,receive_address FROM btc_donation_receiver_addresses
        WHERE receiver_address_id=${payload.receiverAddressId} OR receive_address=${payload.receiveAddress}
      `;
      return rows.length === 1 && rows[0].receiver_address_id === payload.receiverAddressId && rows[0].receive_address === payload.receiveAddress
        ? "replay" : "conflict";
    },

    async issueAddress(sessionId: string, at: string) {
      const rows = await sql`
        WITH candidate AS MATERIALIZED (
          SELECT receiver_address_id FROM btc_donation_receiver_addresses
          WHERE state='available'
          ORDER BY created_at,receiver_address_id
          FOR UPDATE SKIP LOCKED
          LIMIT 1
        )
        UPDATE btc_donation_receiver_addresses AS a
        SET state='issued',issued_session_id=${sessionId},issued_at=${at}
        FROM candidate
        WHERE a.receiver_address_id=candidate.receiver_address_id AND a.state='available'
        RETURNING a.receiver_address_id,a.receive_address,a.state,a.issued_session_id
      `;
      return rows[0] ?? null;
    },

    async observe(payload: DonationObservationPayload) {
      const receiptId = donationReceiptId(payload.receiverAddressId,payload.txid,payload.txVout);
      const proposed = proposedDonationReceiptState(payload);
      const rows = await sql`
        WITH address_guard AS MATERIALIZED (
          SELECT receiver_address_id,state,issued_session_id
          FROM btc_donation_receiver_addresses
          WHERE receiver_address_id=${payload.receiverAddressId}
          FOR UPDATE
        ), retired AS (
          UPDATE btc_donation_receiver_addresses AS a
          SET state='retired',retired_at=COALESCE(a.retired_at,${payload.observedAt})
          FROM address_guard
          WHERE a.receiver_address_id=address_guard.receiver_address_id AND address_guard.state='available'
          RETURNING a.receiver_address_id
        ), upserted AS (
          INSERT INTO btc_donation_receipts(
            receipt_id,receiver_address_id,session_id,txid,tx_vout,observed_sats,confirmations,
            block_height,block_hash,spv_verified,receipt_state,first_seen_at,updated_at
          )
          SELECT ${receiptId},address_guard.receiver_address_id,
            CASE WHEN address_guard.state='issued' THEN address_guard.issued_session_id ELSE NULL END,
            ${payload.txid},${payload.txVout},${payload.observedSats},${payload.confirmations},
            ${payload.blockHeight},${payload.blockHash},${payload.spvVerified},${proposed},${payload.observedAt},${payload.observedAt}
          FROM address_guard
          ON CONFLICT (txid,tx_vout) DO UPDATE SET
            confirmations=EXCLUDED.confirmations,
            block_height=EXCLUDED.block_height,
            block_hash=EXCLUDED.block_hash,
            spv_verified=EXCLUDED.spv_verified,
            receipt_state=CASE
              WHEN btc_donation_receipts.receipt_state='confirmed' AND EXCLUDED.receipt_state<>'confirmed' THEN 'confirmation_lost'
              ELSE EXCLUDED.receipt_state
            END,
            updated_at=EXCLUDED.updated_at
          WHERE btc_donation_receipts.receiver_address_id=EXCLUDED.receiver_address_id
            AND btc_donation_receipts.observed_sats=EXCLUDED.observed_sats
          RETURNING *, EXISTS(SELECT 1 FROM retired) AS quarantined
        )
        SELECT * FROM upserted
      `;
      if (rows[0]) return rows[0];
      const address = await sql`SELECT 1 FROM btc_donation_receiver_addresses WHERE receiver_address_id=${payload.receiverAddressId} LIMIT 1`;
      if (!address[0]) throw new Error("donation_address_unknown");
      const existing = await sql`SELECT receiver_address_id,observed_sats FROM btc_donation_receipts WHERE txid=${payload.txid} AND tx_vout=${payload.txVout} LIMIT 1`;
      if (existing[0]) throw new Error("economic_output_conflict");
      throw new Error("donation_observation_failed");
    },
  };
}
