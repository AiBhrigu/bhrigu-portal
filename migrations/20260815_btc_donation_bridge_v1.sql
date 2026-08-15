BEGIN;

CREATE TABLE IF NOT EXISTS btc_donation_bridge_messages (
  message_id TEXT PRIMARY KEY,
  message_kind TEXT NOT NULL CHECK (message_kind IN ('address_provision','receipt_observation')),
  payload_hash TEXT NOT NULL CHECK (payload_hash ~ '^[a-f0-9]{64}$'),
  created_at TIMESTAMPTZ NOT NULL,
  processed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS btc_donation_receiver_addresses (
  receiver_address_id TEXT PRIMARY KEY,
  receive_address TEXT NOT NULL UNIQUE,
  state TEXT NOT NULL CHECK (state IN ('available','issued','retired')),
  issued_session_id TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL,
  issued_at TIMESTAMPTZ,
  retired_at TIMESTAMPTZ,
  CHECK (
    (state='available' AND issued_session_id IS NULL AND issued_at IS NULL AND retired_at IS NULL)
    OR (state='issued' AND issued_session_id IS NOT NULL AND issued_at IS NOT NULL AND retired_at IS NULL)
    OR (state='retired' AND retired_at IS NOT NULL)
  )
);

CREATE TABLE IF NOT EXISTS btc_donation_receipts (
  receipt_id TEXT PRIMARY KEY,
  receiver_address_id TEXT NOT NULL REFERENCES btc_donation_receiver_addresses(receiver_address_id) ON DELETE RESTRICT,
  session_id TEXT,
  txid TEXT NOT NULL,
  tx_vout INTEGER NOT NULL CHECK (tx_vout >= 0),
  observed_sats BIGINT NOT NULL CHECK (observed_sats > 0),
  confirmations INTEGER NOT NULL CHECK (confirmations >= 0),
  block_height BIGINT,
  block_hash TEXT,
  spv_verified BOOLEAN NOT NULL,
  receipt_state TEXT NOT NULL CHECK (receipt_state IN ('mempool_seen','confirmed','confirmation_lost')),
  first_seen_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  UNIQUE(txid,tx_vout),
  CHECK (
    (receipt_state='confirmed' AND confirmations >= 1 AND spv_verified AND block_height IS NOT NULL AND block_hash ~ '^[a-f0-9]{64}$')
    OR (receipt_state IN ('mempool_seen','confirmation_lost') AND confirmations = 0 AND NOT spv_verified AND block_height IS NULL AND block_hash IS NULL)
  )
);

CREATE OR REPLACE FUNCTION btc_donation_address_transition_guard()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.receiver_address_id <> OLD.receiver_address_id OR NEW.receive_address <> OLD.receive_address THEN
    RAISE EXCEPTION 'donation_address_identity_immutable';
  END IF;
  IF OLD.state = NEW.state THEN RETURN NEW; END IF;
  IF OLD.state='available' AND NEW.state IN ('issued','retired') THEN RETURN NEW; END IF;
  IF OLD.state='issued' AND NEW.state='retired' THEN RETURN NEW; END IF;
  RAISE EXCEPTION 'donation_address_state_regression';
END;
$$;

DROP TRIGGER IF EXISTS btc_donation_address_transition_guard_trigger ON btc_donation_receiver_addresses;
CREATE TRIGGER btc_donation_address_transition_guard_trigger
BEFORE UPDATE ON btc_donation_receiver_addresses
FOR EACH ROW EXECUTE FUNCTION btc_donation_address_transition_guard();

CREATE INDEX IF NOT EXISTS btc_donation_addresses_state_idx ON btc_donation_receiver_addresses(state,created_at);
CREATE INDEX IF NOT EXISTS btc_donation_receipts_receiver_idx ON btc_donation_receipts(receiver_address_id,first_seen_at);
CREATE INDEX IF NOT EXISTS btc_donation_bridge_processed_idx ON btc_donation_bridge_messages(processed_at,created_at);

COMMIT;
