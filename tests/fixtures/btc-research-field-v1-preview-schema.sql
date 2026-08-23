BEGIN;

CREATE TABLE IF NOT EXISTS btc_research_fields (
  field_id TEXT PRIMARY KEY,
  secret_hash TEXT NOT NULL CHECK (secret_hash ~ '^[a-f0-9]{64}$'),
  status TEXT NOT NULL CHECK (status IN ('PENDING_PAYMENT','ACTIVE','EXPIRED','DELETED','PURGED','LOCKED')),
  locale TEXT NOT NULL CHECK (locale IN ('en','ru')),
  title TEXT NOT NULL,
  primary_question TEXT NOT NULL,
  time_horizon TEXT,
  evidence_preferences JSONB NOT NULL DEFAULT '[]'::jsonb,
  watch_conditions JSONB NOT NULL DEFAULT '[]'::jsonb,
  exact_polymarket_contracts JSONB NOT NULL DEFAULT '[]'::jsonb,
  service_start TIMESTAMPTZ,
  service_end TIMESTAMPTZ,
  completed_turns INTEGER NOT NULL DEFAULT 0 CHECK (completed_turns BETWEEN 0 AND 120),
  active_turn_id TEXT,
  active_turn_claimed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  CHECK ((active_turn_id IS NULL) = (active_turn_claimed_at IS NULL)),
  CHECK ((status='PENDING_PAYMENT' AND service_start IS NULL AND service_end IS NULL) OR status<>'PENDING_PAYMENT'),
  CHECK (service_start IS NULL OR (service_end IS NOT NULL AND service_end > service_start))
);

CREATE TABLE IF NOT EXISTS btc_research_field_checkpoints (
  checkpoint_id TEXT PRIMARY KEY,
  field_id TEXT NOT NULL REFERENCES btc_research_fields(field_id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('BASELINE','CHECKPOINT')),
  accepted_at TIMESTAMPTZ NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  topic TEXT NOT NULL,
  as_of TIMESTAMPTZ NOT NULL,
  sources JSONB NOT NULL,
  evidence_state JSONB NOT NULL,
  boundary_state JSONB NOT NULL,
  continuity_digest TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS btc_research_field_one_baseline_idx
  ON btc_research_field_checkpoints(field_id) WHERE role='BASELINE';
CREATE INDEX IF NOT EXISTS btc_research_field_checkpoint_time_idx
  ON btc_research_field_checkpoints(field_id,accepted_at DESC);

CREATE TABLE IF NOT EXISTS btc_research_field_usage (
  turn_id TEXT PRIMARY KEY,
  field_id TEXT NOT NULL REFERENCES btc_research_fields(field_id) ON DELETE CASCADE,
  state TEXT NOT NULL CHECK (state IN ('STARTED','COMPLETED','FAILED')),
  claimed_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  input_tokens INTEGER,
  output_tokens INTEGER,
  web_search_calls INTEGER,
  nominal_cost_micros BIGINT CHECK (nominal_cost_micros IS NULL OR nominal_cost_micros >= 0),
  result_hash TEXT CHECK (result_hash IS NULL OR result_hash ~ '^[a-f0-9]{64}$'),
  CHECK (input_tokens IS NULL OR input_tokens >= 0),
  CHECK (output_tokens IS NULL OR output_tokens >= 0),
  CHECK (web_search_calls IS NULL OR web_search_calls >= 0),
  CHECK ((state='COMPLETED') = (completed_at IS NOT NULL)),
  CHECK (state<>'COMPLETED' OR result_hash IS NOT NULL)
);
CREATE UNIQUE INDEX IF NOT EXISTS btc_research_field_one_started_turn_idx
  ON btc_research_field_usage(field_id) WHERE state='STARTED';
CREATE INDEX IF NOT EXISTS btc_research_field_usage_time_idx
  ON btc_research_field_usage(field_id,claimed_at DESC);

COMMIT;
