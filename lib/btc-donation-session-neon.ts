import { neon } from "@neondatabase/serverless";
import {
  buildDonationBip321Uri,
  donationSessionExpiresAt,
  type DonationSessionPresentationState,
  type DonationSessionView,
} from "./btc-donation-session";

type SessionRow = {
  session_id: string;
  session_state: "awaiting_payment" | "retired";
  created_at: string | Date;
  expires_at: string | Date;
  retired_at: string | Date | null;
  receive_address: string;
  receipt_state: "mempool_seen" | "confirmed" | "confirmation_lost" | null;
  observed_sats: string | number | bigint | null;
  confirmations: number | null;
};

function iso(value: string | Date | null): string | null {
  if (value === null) return null;
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function toView(row: SessionRow): DonationSessionView {
  const state: DonationSessionPresentationState =
    row.session_state === "retired" ? "retired" : row.receipt_state ?? "awaiting_payment";
  const receiveAddress = state === "retired" ? null : row.receive_address;
  return {
    sessionId: row.session_id,
    state,
    createdAt: iso(row.created_at)!,
    expiresAt: iso(row.expires_at)!,
    retiredAt: iso(row.retired_at),
    receiveAddress,
    bip321Uri: receiveAddress ? buildDonationBip321Uri(receiveAddress) : null,
    observedSats: row.observed_sats === null ? null : String(row.observed_sats),
    confirmations: row.confirmations === null ? null : Number(row.confirmations),
  };
}

export function createNeonBtcDonationSessionStore(databaseUrl: string) {
  const sql = neon(databaseUrl);

  async function findSession(sessionId: string): Promise<DonationSessionView | null> {
    const rows = await sql`
      SELECT s.session_id,s.session_state,s.created_at,s.expires_at,s.retired_at,a.receive_address,
        r.receipt_state,r.observed_sats,r.confirmations
      FROM btc_donation_sessions AS s
      JOIN btc_donation_receiver_addresses AS a ON a.receiver_address_id=s.receiver_address_id
      LEFT JOIN LATERAL (
        SELECT receipt_state,observed_sats,confirmations
        FROM btc_donation_receipts
        WHERE session_id=s.session_id
        ORDER BY updated_at DESC,receipt_id DESC
        LIMIT 1
      ) AS r ON TRUE
      WHERE s.session_id=${sessionId}
      LIMIT 1
    `;
    return rows[0] ? toView(rows[0] as unknown as SessionRow) : null;
  }

  async function retireExpiredSessions(at: string): Promise<number> {
    const rows = await sql`
      WITH expired AS MATERIALIZED (
        SELECT s.session_id,s.receiver_address_id
        FROM btc_donation_sessions AS s
        WHERE s.session_state='awaiting_payment'
          AND s.expires_at <= ${at}
          AND NOT EXISTS (SELECT 1 FROM btc_donation_receipts r WHERE r.session_id=s.session_id)
        FOR UPDATE
      ), retired_addresses AS (
        UPDATE btc_donation_receiver_addresses AS a
        SET state='retired',retired_at=COALESCE(a.retired_at,${at})
        FROM expired
        WHERE a.receiver_address_id=expired.receiver_address_id AND a.state='issued'
        RETURNING a.receiver_address_id
      )
      UPDATE btc_donation_sessions AS s
      SET session_state='retired',retired_at=COALESCE(s.retired_at,${at}),updated_at=${at}
      FROM expired
      WHERE s.session_id=expired.session_id AND s.session_state='awaiting_payment'
      RETURNING s.session_id
    `;
    return rows.length;
  }

  async function issueSession(sessionId: string, at: Date): Promise<DonationSessionView | null> {
    const atIso = at.toISOString();
    await retireExpiredSessions(atIso);
    const existing = await findSession(sessionId);
    if (existing) return existing;
    const expiresAt = donationSessionExpiresAt(at);
    try {
      const created = await sql`
        WITH candidate AS MATERIALIZED (
          SELECT receiver_address_id
          FROM btc_donation_receiver_addresses
          WHERE state='available'
          ORDER BY created_at,receiver_address_id
          FOR UPDATE SKIP LOCKED
          LIMIT 1
        ), issued AS (
          UPDATE btc_donation_receiver_addresses AS a
          SET state='issued',issued_session_id=${sessionId},issued_at=${atIso}
          FROM candidate
          WHERE a.receiver_address_id=candidate.receiver_address_id AND a.state='available'
          RETURNING a.receiver_address_id
        )
        INSERT INTO btc_donation_sessions(
          session_id,receiver_address_id,session_state,created_at,expires_at,retired_at,updated_at
        )
        SELECT ${sessionId},issued.receiver_address_id,'awaiting_payment',${atIso},${expiresAt},NULL,${atIso}
        FROM issued
        RETURNING session_id
      `;
      if (!created[0]) return null;
    } catch (error) {
      const replay = await findSession(sessionId);
      if (replay) return replay;
      throw error;
    }
    return findSession(sessionId);
  }

  async function retireSession(sessionId: string, at: string): Promise<DonationSessionView | null> {
    await retireExpiredSessions(at);
    const rows = await sql`
      WITH target AS MATERIALIZED (
        SELECT s.session_id,s.receiver_address_id
        FROM btc_donation_sessions AS s
        WHERE s.session_id=${sessionId} AND s.session_state='awaiting_payment'
          AND NOT EXISTS (SELECT 1 FROM btc_donation_receipts r WHERE r.session_id=s.session_id)
        FOR UPDATE
      ), retired_address AS (
        UPDATE btc_donation_receiver_addresses AS a
        SET state='retired',retired_at=COALESCE(a.retired_at,${at})
        FROM target
        WHERE a.receiver_address_id=target.receiver_address_id AND a.state='issued'
        RETURNING a.receiver_address_id
      )
      UPDATE btc_donation_sessions AS s
      SET session_state='retired',retired_at=COALESCE(s.retired_at,${at}),updated_at=${at}
      FROM target
      WHERE s.session_id=target.session_id
      RETURNING s.session_id
    `;
    if (!rows[0]) return findSession(sessionId);
    return findSession(sessionId);
  }

  return { findSession, issueSession, retireSession, retireExpiredSessions };
}
