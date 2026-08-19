BEGIN;

CREATE TABLE IF NOT EXISTS btc_donation_session_admissions (
  session_id TEXT PRIMARY KEY REFERENCES btc_donation_sessions(session_id) ON DELETE RESTRICT,
  client_key TEXT NOT NULL CHECK (client_key ~ '^[a-f0-9]{64}$'),
  ip_key TEXT NOT NULL CHECK (ip_key ~ '^[a-f0-9]{64}$'),
  issued_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS btc_donation_session_admissions_client_time_idx
  ON btc_donation_session_admissions(client_key,issued_at);
CREATE INDEX IF NOT EXISTS btc_donation_session_admissions_ip_time_idx
  ON btc_donation_session_admissions(ip_key,issued_at);
CREATE INDEX IF NOT EXISTS btc_donation_session_admissions_time_idx
  ON btc_donation_session_admissions(issued_at);

CREATE OR REPLACE FUNCTION btc_donation_issue_session_admitted(
  p_session_id TEXT,
  p_client_key TEXT,
  p_ip_key TEXT,
  p_now TIMESTAMPTZ,
  p_expires_at TIMESTAMPTZ
) RETURNS TABLE(disposition TEXT,retry_after_seconds INTEGER)
LANGUAGE plpgsql AS $$
DECLARE
  v_count INTEGER;
  v_oldest TIMESTAMPTZ;
  v_retry INTEGER := 0;
  v_limited BOOLEAN := FALSE;
  v_receiver_address_id TEXT;
BEGIN
  IF p_session_id !~ '^don_session_[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
     OR p_client_key !~ '^[a-f0-9]{64}$'
     OR p_ip_key !~ '^[a-f0-9]{64}$'
     OR p_now IS NULL OR p_expires_at IS NULL OR p_expires_at <= p_now THEN
    RAISE EXCEPTION 'donation_session_admission_invalid';
  END IF;

  LOCK TABLE btc_donation_session_admissions IN SHARE ROW EXCLUSIVE MODE;

  IF EXISTS (SELECT 1 FROM btc_donation_sessions WHERE session_id=p_session_id) THEN
    disposition := 'replay'; retry_after_seconds := 0; RETURN NEXT; RETURN;
  END IF;

  SELECT COUNT(*)::int,MIN(issued_at) INTO v_count,v_oldest
    FROM btc_donation_session_admissions
    WHERE client_key=p_client_key AND issued_at > p_now-INTERVAL '30 minutes';
  IF v_count >= 2 THEN
    v_limited := TRUE;
    v_retry := GREATEST(v_retry,CEIL(EXTRACT(EPOCH FROM (v_oldest+INTERVAL '30 minutes'-p_now)))::int);
  END IF;

  SELECT COUNT(*)::int,MIN(issued_at) INTO v_count,v_oldest
    FROM btc_donation_session_admissions
    WHERE client_key=p_client_key AND issued_at > p_now-INTERVAL '24 hours';
  IF v_count >= 6 THEN
    v_limited := TRUE;
    v_retry := GREATEST(v_retry,CEIL(EXTRACT(EPOCH FROM (v_oldest+INTERVAL '24 hours'-p_now)))::int);
  END IF;

  SELECT COUNT(*)::int,MIN(issued_at) INTO v_count,v_oldest
    FROM btc_donation_session_admissions
    WHERE ip_key=p_ip_key AND issued_at > p_now-INTERVAL '30 minutes';
  IF v_count >= 6 THEN
    v_limited := TRUE;
    v_retry := GREATEST(v_retry,CEIL(EXTRACT(EPOCH FROM (v_oldest+INTERVAL '30 minutes'-p_now)))::int);
  END IF;

  SELECT COUNT(*)::int,MIN(issued_at) INTO v_count,v_oldest
    FROM btc_donation_session_admissions
    WHERE ip_key=p_ip_key AND issued_at > p_now-INTERVAL '24 hours';
  IF v_count >= 16 THEN
    v_limited := TRUE;
    v_retry := GREATEST(v_retry,CEIL(EXTRACT(EPOCH FROM (v_oldest+INTERVAL '24 hours'-p_now)))::int);
  END IF;

  SELECT COUNT(*)::int,MIN(issued_at) INTO v_count,v_oldest
    FROM btc_donation_session_admissions
    WHERE issued_at > p_now-INTERVAL '1 hour';
  IF v_count >= 12 THEN
    v_limited := TRUE;
    v_retry := GREATEST(v_retry,CEIL(EXTRACT(EPOCH FROM (v_oldest+INTERVAL '1 hour'-p_now)))::int);
  END IF;

  SELECT COUNT(*)::int,MIN(issued_at) INTO v_count,v_oldest
    FROM btc_donation_session_admissions
    WHERE issued_at > p_now-INTERVAL '24 hours';
  IF v_count >= 24 THEN
    v_limited := TRUE;
    v_retry := GREATEST(v_retry,CEIL(EXTRACT(EPOCH FROM (v_oldest+INTERVAL '24 hours'-p_now)))::int);
  END IF;

  IF v_limited THEN
    disposition := 'rate_limited'; retry_after_seconds := GREATEST(1,v_retry); RETURN NEXT; RETURN;
  END IF;

  SELECT receiver_address_id INTO v_receiver_address_id
    FROM btc_donation_receiver_addresses
    WHERE state='available'
    ORDER BY created_at,receiver_address_id
    FOR UPDATE SKIP LOCKED
    LIMIT 1;
  IF v_receiver_address_id IS NULL THEN
    disposition := 'address_unavailable'; retry_after_seconds := 0; RETURN NEXT; RETURN;
  END IF;

  UPDATE btc_donation_receiver_addresses
    SET state='issued',issued_session_id=p_session_id,issued_at=p_now
    WHERE receiver_address_id=v_receiver_address_id AND state='available';
  IF NOT FOUND THEN RAISE EXCEPTION 'donation_session_receiver_claim_lost'; END IF;

  INSERT INTO btc_donation_sessions(
    session_id,receiver_address_id,session_state,created_at,expires_at,retired_at,updated_at
  ) VALUES (
    p_session_id,v_receiver_address_id,'awaiting_payment',p_now,p_expires_at,NULL,p_now
  );
  INSERT INTO btc_donation_session_admissions(session_id,client_key,ip_key,issued_at)
    VALUES (p_session_id,p_client_key,p_ip_key,p_now);

  disposition := 'issued'; retry_after_seconds := 0; RETURN NEXT; RETURN;
END;
$$;

COMMIT;
