BEGIN;

CREATE TABLE IF NOT EXISTS access_intake_requests (
  request_id TEXT PRIMARY KEY,
  idempotency_key TEXT NOT NULL UNIQUE,
  payload_hash TEXT NOT NULL,
  record JSONB NOT NULL,
  status TEXT NOT NULL CHECK (status IN (
    'pending_manual_review',
    'correction_requested',
    'accepted',
    'declined',
    'in_processing',
    'completed'
  )),
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  CHECK (length(idempotency_key) BETWEEN 16 AND 128),
  CHECK (payload_hash ~ '^[a-f0-9]{64}$')
);

CREATE TABLE IF NOT EXISTS access_intake_deliveries (
  request_id TEXT NOT NULL REFERENCES access_intake_requests(request_id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('operator_notification', 'client_confirmation')),
  idempotency_key TEXT NOT NULL UNIQUE,
  state TEXT NOT NULL CHECK (state IN ('pending', 'sending', 'delivered', 'failed')),
  attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  claimed_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  provider_message_id TEXT,
  last_error_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (request_id, kind)
);

CREATE INDEX IF NOT EXISTS access_intake_requests_created_at_idx
  ON access_intake_requests (created_at DESC);

CREATE INDEX IF NOT EXISTS access_intake_deliveries_retry_idx
  ON access_intake_deliveries (state, updated_at)
  WHERE state IN ('pending', 'failed', 'sending');

COMMIT;
