BEGIN;

CREATE OR REPLACE FUNCTION btc_clean_chat_guard_reserve_v2(
  p_admission_key TEXT,
  p_client_key TEXT,
  p_ip_key TEXT,
  p_now TIMESTAMPTZ,
  p_reservation_micros BIGINT
) RETURNS TABLE(disposition TEXT,retry_after_seconds INTEGER)
LANGUAGE plpgsql AS $$
DECLARE
  v_count INTEGER;
  v_oldest TIMESTAMPTZ;
  v_cost BIGINT;
  v_retry INTEGER := 0;
  v_rate_limited BOOLEAN := FALSE;
  v_concurrency_limited BOOLEAN := FALSE;
  v_budget_limited BOOLEAN := FALSE;
BEGIN
  IF p_admission_key !~ '^[a-f0-9]{64}$'
     OR p_client_key !~ '^[a-f0-9]{64}$'
     OR p_ip_key !~ '^[a-f0-9]{64}$'
     OR p_now IS NULL
     OR p_reservation_micros <> 0 THEN
    RAISE EXCEPTION 'btc_clean_chat_guard_reserve_invalid';
  END IF;

  LOCK TABLE btc_clean_chat_cost_admissions IN SHARE ROW EXCLUSIVE MODE;

  IF EXISTS (SELECT 1 FROM btc_clean_chat_cost_admissions WHERE admission_key=p_admission_key) THEN
    disposition := 'replay'; retry_after_seconds := 0; RETURN NEXT; RETURN;
  END IF;

  SELECT COUNT(*)::int INTO v_count FROM btc_clean_chat_cost_admissions
    WHERE state='in_flight' AND updated_at > p_now-INTERVAL '2 minutes' AND client_key=p_client_key;
  IF v_count >= 1 THEN v_concurrency_limited := TRUE; v_retry := GREATEST(v_retry,30); END IF;

  SELECT COUNT(*)::int INTO v_count FROM btc_clean_chat_cost_admissions
    WHERE state='in_flight' AND updated_at > p_now-INTERVAL '2 minutes' AND ip_key=p_ip_key;
  IF v_count >= 3 THEN v_concurrency_limited := TRUE; v_retry := GREATEST(v_retry,30); END IF;

  SELECT COUNT(*)::int INTO v_count FROM btc_clean_chat_cost_admissions
    WHERE state='in_flight' AND updated_at > p_now-INTERVAL '2 minutes';
  IF v_count >= 6 THEN v_concurrency_limited := TRUE; v_retry := GREATEST(v_retry,30); END IF;

  SELECT COUNT(*)::int,MIN(started_at) INTO v_count,v_oldest FROM btc_clean_chat_cost_admissions
    WHERE client_key=p_client_key AND started_at > p_now-INTERVAL '10 minutes';
  IF v_count >= 10 THEN v_rate_limited := TRUE; v_retry := GREATEST(v_retry,CEIL(EXTRACT(EPOCH FROM (v_oldest+INTERVAL '10 minutes'-p_now)))::int); END IF;

  SELECT COUNT(*)::int,MIN(started_at) INTO v_count,v_oldest FROM btc_clean_chat_cost_admissions
    WHERE client_key=p_client_key AND started_at > p_now-INTERVAL '1 hour';
  IF v_count >= 12 THEN v_rate_limited := TRUE; v_retry := GREATEST(v_retry,CEIL(EXTRACT(EPOCH FROM (v_oldest+INTERVAL '1 hour'-p_now)))::int); END IF;

  SELECT COUNT(*)::int,MIN(started_at) INTO v_count,v_oldest FROM btc_clean_chat_cost_admissions
    WHERE client_key=p_client_key AND started_at > p_now-INTERVAL '24 hours';
  IF v_count >= 24 THEN v_rate_limited := TRUE; v_retry := GREATEST(v_retry,CEIL(EXTRACT(EPOCH FROM (v_oldest+INTERVAL '24 hours'-p_now)))::int); END IF;

  SELECT COUNT(*)::int,MIN(started_at) INTO v_count,v_oldest FROM btc_clean_chat_cost_admissions
    WHERE ip_key=p_ip_key AND started_at > p_now-INTERVAL '10 minutes';
  IF v_count >= 18 THEN v_rate_limited := TRUE; v_retry := GREATEST(v_retry,CEIL(EXTRACT(EPOCH FROM (v_oldest+INTERVAL '10 minutes'-p_now)))::int); END IF;

  SELECT COUNT(*)::int,MIN(started_at) INTO v_count,v_oldest FROM btc_clean_chat_cost_admissions
    WHERE ip_key=p_ip_key AND started_at > p_now-INTERVAL '1 hour';
  IF v_count >= 48 THEN v_rate_limited := TRUE; v_retry := GREATEST(v_retry,CEIL(EXTRACT(EPOCH FROM (v_oldest+INTERVAL '1 hour'-p_now)))::int); END IF;

  SELECT COUNT(*)::int,MIN(started_at) INTO v_count,v_oldest FROM btc_clean_chat_cost_admissions
    WHERE ip_key=p_ip_key AND started_at > p_now-INTERVAL '24 hours';
  IF v_count >= 96 THEN v_rate_limited := TRUE; v_retry := GREATEST(v_retry,CEIL(EXTRACT(EPOCH FROM (v_oldest+INTERVAL '24 hours'-p_now)))::int); END IF;

  SELECT COUNT(*)::int,MIN(started_at) INTO v_count,v_oldest FROM btc_clean_chat_cost_admissions
    WHERE started_at > p_now-INTERVAL '10 minutes';
  IF v_count >= 30 THEN v_rate_limited := TRUE; v_retry := GREATEST(v_retry,CEIL(EXTRACT(EPOCH FROM (v_oldest+INTERVAL '10 minutes'-p_now)))::int); END IF;

  SELECT COUNT(*)::int,MIN(started_at) INTO v_count,v_oldest FROM btc_clean_chat_cost_admissions
    WHERE started_at > p_now-INTERVAL '1 hour';
  IF v_count >= 60 THEN v_rate_limited := TRUE; v_retry := GREATEST(v_retry,CEIL(EXTRACT(EPOCH FROM (v_oldest+INTERVAL '1 hour'-p_now)))::int); END IF;

  SELECT COUNT(*)::int,MIN(started_at) INTO v_count,v_oldest FROM btc_clean_chat_cost_admissions
    WHERE started_at > p_now-INTERVAL '24 hours';
  IF v_count >= 150 THEN v_rate_limited := TRUE; v_retry := GREATEST(v_retry,CEIL(EXTRACT(EPOCH FROM (v_oldest+INTERVAL '24 hours'-p_now)))::int); END IF;

  SELECT COALESCE(SUM(btc_clean_chat_guard_effective_cost(state,reservation_micros,settled_micros)),0)::bigint,MIN(started_at)
    INTO v_cost,v_oldest FROM btc_clean_chat_cost_admissions WHERE started_at > p_now-INTERVAL '1 hour';
  IF v_cost+p_reservation_micros > 250000 THEN
    v_budget_limited := TRUE;
    IF v_oldest IS NOT NULL THEN v_retry := GREATEST(v_retry,CEIL(EXTRACT(EPOCH FROM (v_oldest+INTERVAL '1 hour'-p_now)))::int); END IF;
  END IF;

  SELECT COALESCE(SUM(btc_clean_chat_guard_effective_cost(state,reservation_micros,settled_micros)),0)::bigint,MIN(started_at)
    INTO v_cost,v_oldest FROM btc_clean_chat_cost_admissions WHERE started_at > p_now-INTERVAL '24 hours';
  IF v_cost+p_reservation_micros > 750000 THEN
    v_budget_limited := TRUE;
    IF v_oldest IS NOT NULL THEN v_retry := GREATEST(v_retry,CEIL(EXTRACT(EPOCH FROM (v_oldest+INTERVAL '24 hours'-p_now)))::int); END IF;
  END IF;

  SELECT COALESCE(SUM(btc_clean_chat_guard_effective_cost(state,reservation_micros,settled_micros)),0)::bigint
    INTO v_cost FROM btc_clean_chat_cost_admissions
    WHERE started_at >= date_trunc('month',p_now) AND started_at < date_trunc('month',p_now)+INTERVAL '1 month';
  IF v_cost+p_reservation_micros > 4000000 THEN
    v_budget_limited := TRUE;
    v_retry := GREATEST(v_retry,CEIL(EXTRACT(EPOCH FROM (date_trunc('month',p_now)+INTERVAL '1 month'-p_now)))::int);
  END IF;

  IF v_budget_limited THEN disposition := 'budget_limited'; retry_after_seconds := GREATEST(1,v_retry); RETURN NEXT; RETURN; END IF;
  IF v_concurrency_limited THEN disposition := 'concurrency_limited'; retry_after_seconds := GREATEST(1,v_retry); RETURN NEXT; RETURN; END IF;
  IF v_rate_limited THEN disposition := 'rate_limited'; retry_after_seconds := GREATEST(1,v_retry); RETURN NEXT; RETURN; END IF;

  INSERT INTO btc_clean_chat_cost_admissions(
    admission_key,client_key,ip_key,started_at,updated_at,state,reservation_micros,settled_micros
  ) VALUES (
    p_admission_key,p_client_key,p_ip_key,p_now,p_now,'in_flight',p_reservation_micros,NULL
  );

  disposition := 'admitted'; retry_after_seconds := 0; RETURN NEXT; RETURN;
END;
$$;

CREATE OR REPLACE FUNCTION btc_clean_chat_guard_adjust(
  p_admission_key TEXT,
  p_now TIMESTAMPTZ,
  p_reservation_micros BIGINT
) RETURNS TABLE(disposition TEXT,retry_after_seconds INTEGER)
LANGUAGE plpgsql AS $$
DECLARE
  v_current BIGINT;
  v_delta BIGINT;
  v_cost BIGINT;
  v_oldest TIMESTAMPTZ;
  v_retry INTEGER := 0;
  v_budget_limited BOOLEAN := FALSE;
BEGIN
  IF p_admission_key !~ '^[a-f0-9]{64}$'
     OR p_now IS NULL
     OR p_reservation_micros < 0
     OR p_reservation_micros > 2000000 THEN
    RAISE EXCEPTION 'btc_clean_chat_guard_adjust_invalid';
  END IF;

  LOCK TABLE btc_clean_chat_cost_admissions IN SHARE ROW EXCLUSIVE MODE;
  SELECT reservation_micros INTO v_current FROM btc_clean_chat_cost_admissions
    WHERE admission_key=p_admission_key AND state='in_flight';
  IF v_current IS NULL THEN disposition := 'replay'; retry_after_seconds := 0; RETURN NEXT; RETURN; END IF;
  IF v_current = p_reservation_micros THEN disposition := 'admitted'; retry_after_seconds := 0; RETURN NEXT; RETURN; END IF;

  IF p_reservation_micros < v_current THEN
    UPDATE btc_clean_chat_cost_admissions SET reservation_micros=p_reservation_micros,updated_at=p_now
      WHERE admission_key=p_admission_key AND state='in_flight';
    disposition := 'admitted'; retry_after_seconds := 0; RETURN NEXT; RETURN;
  END IF;

  v_delta := p_reservation_micros-v_current;

  SELECT COALESCE(SUM(btc_clean_chat_guard_effective_cost(state,reservation_micros,settled_micros)),0)::bigint,MIN(started_at)
    INTO v_cost,v_oldest FROM btc_clean_chat_cost_admissions WHERE started_at > p_now-INTERVAL '1 hour';
  IF v_cost+v_delta > 250000 THEN v_budget_limited := TRUE; IF v_oldest IS NOT NULL THEN v_retry := GREATEST(v_retry,CEIL(EXTRACT(EPOCH FROM (v_oldest+INTERVAL '1 hour'-p_now)))::int); END IF; END IF;

  SELECT COALESCE(SUM(btc_clean_chat_guard_effective_cost(state,reservation_micros,settled_micros)),0)::bigint,MIN(started_at)
    INTO v_cost,v_oldest FROM btc_clean_chat_cost_admissions WHERE started_at > p_now-INTERVAL '24 hours';
  IF v_cost+v_delta > 750000 THEN v_budget_limited := TRUE; IF v_oldest IS NOT NULL THEN v_retry := GREATEST(v_retry,CEIL(EXTRACT(EPOCH FROM (v_oldest+INTERVAL '24 hours'-p_now)))::int); END IF; END IF;

  SELECT COALESCE(SUM(btc_clean_chat_guard_effective_cost(state,reservation_micros,settled_micros)),0)::bigint
    INTO v_cost FROM btc_clean_chat_cost_admissions
    WHERE started_at >= date_trunc('month',p_now) AND started_at < date_trunc('month',p_now)+INTERVAL '1 month';
  IF v_cost+v_delta > 4000000 THEN v_budget_limited := TRUE; v_retry := GREATEST(v_retry,CEIL(EXTRACT(EPOCH FROM (date_trunc('month',p_now)+INTERVAL '1 month'-p_now)))::int); END IF;

  IF v_budget_limited THEN disposition := 'budget_limited'; retry_after_seconds := GREATEST(1,v_retry); RETURN NEXT; RETURN; END IF;

  UPDATE btc_clean_chat_cost_admissions SET reservation_micros=p_reservation_micros,updated_at=p_now
    WHERE admission_key=p_admission_key AND state='in_flight';
  disposition := 'admitted'; retry_after_seconds := 0; RETURN NEXT; RETURN;
END;
$$;

COMMIT;
