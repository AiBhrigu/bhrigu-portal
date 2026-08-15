BEGIN;

CREATE TABLE IF NOT EXISTS btc_donation_sessions (
  session_id TEXT PRIMARY KEY,
  receiver_address_id TEXT NOT NULL UNIQUE
    REFERENCES btc_donation_receiver_addresses(receiver_address_id) ON DELETE RESTRICT,
  session_state TEXT NOT NULL CHECK (session_state IN ('awaiting_payment','retired')),
  created_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  retired_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL,
  CHECK (expires_at > created_at),
  CHECK (
    (session_state='awaiting_payment' AND retired_at IS NULL)
    OR (session_state='retired' AND retired_at IS NOT NULL)
  )
);

CREATE OR REPLACE FUNCTION btc_donation_session_transition_guard()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.session_id <> OLD.session_id OR NEW.receiver_address_id <> OLD.receiver_address_id THEN
    RAISE EXCEPTION 'donation_session_identity_immutable';
  END IF;
  IF OLD.session_state = NEW.session_state THEN RETURN NEW; END IF;
  IF OLD.session_state='awaiting_payment' AND NEW.session_state='retired' THEN RETURN NEW; END IF;
  RAISE EXCEPTION 'donation_session_state_regression';
END;
$$;

DROP TRIGGER IF EXISTS btc_donation_session_transition_guard_trigger ON btc_donation_sessions;
CREATE TRIGGER btc_donation_session_transition_guard_trigger
BEFORE UPDATE ON btc_donation_sessions
FOR EACH ROW EXECUTE FUNCTION btc_donation_session_transition_guard();

CREATE INDEX IF NOT EXISTS btc_donation_sessions_state_expiry_idx
  ON btc_donation_sessions(session_state,expires_at);

COMMIT;
