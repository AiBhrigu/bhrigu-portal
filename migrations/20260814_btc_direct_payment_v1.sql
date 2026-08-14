BEGIN;

CREATE TABLE IF NOT EXISTS btc_direct_receiver_addresses (
  receiver_address_id TEXT PRIMARY KEY,
  receive_address TEXT NOT NULL UNIQUE,
  state TEXT NOT NULL CHECK (state IN ('available', 'reserved', 'retired')),
  reserved_quote_id TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  retired_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS btc_direct_payment_quotes (
  quote_id TEXT PRIMARY KEY,
  application_id TEXT NOT NULL REFERENCES access_intake_requests(request_id) ON DELETE RESTRICT,
  idempotency_key TEXT NOT NULL UNIQUE,
  idempotency_payload_hash TEXT NOT NULL,
  usd_price_cents INTEGER NOT NULL CHECK (usd_price_cents > 0),
  fx_source TEXT NOT NULL,
  fx_rate_decimal TEXT NOT NULL CHECK (
    fx_rate_decimal ~ '^(?:0|[1-9][0-9]{0,29})(?:\.[0-9]{1,40})?$'
    AND fx_rate_decimal !~ '^0(?:\.0+)?$'
  ),
  fx_timestamp TIMESTAMPTZ NOT NULL,
  quote_expires_at TIMESTAMPTZ NOT NULL,
  sat_amount_integer BIGINT NOT NULL CHECK (sat_amount_integer > 0),
  receiver_address_id TEXT NOT NULL UNIQUE REFERENCES btc_direct_receiver_addresses(receiver_address_id) ON DELETE RESTRICT,
  receive_address TEXT NOT NULL UNIQUE,
  quote_state TEXT NOT NULL CHECK (quote_state IN ('quote_created', 'payment_pending', 'expired', 'manual_review', 'paid_confirmed', 'activated')),
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  CHECK (idempotency_payload_hash ~ '^[a-f0-9]{64}$'),
  CHECK (quote_expires_at > created_at)
);

ALTER TABLE btc_direct_receiver_addresses
  DROP CONSTRAINT IF EXISTS btc_direct_receiver_addresses_reserved_quote_fk;
ALTER TABLE btc_direct_receiver_addresses
  ADD CONSTRAINT btc_direct_receiver_addresses_reserved_quote_fk
  FOREIGN KEY (reserved_quote_id)
  REFERENCES btc_direct_payment_quotes(quote_id)
  ON DELETE RESTRICT;

CREATE TABLE IF NOT EXISTS btc_direct_payment_receipts (
  payment_id TEXT PRIMARY KEY,
  quote_id TEXT NOT NULL REFERENCES btc_direct_payment_quotes(quote_id) ON DELETE RESTRICT,
  txid TEXT NOT NULL,
  tx_vout INTEGER NOT NULL CHECK (tx_vout >= 0),
  observed_sats BIGINT NOT NULL CHECK (observed_sats >= 0),
  block_height BIGINT,
  block_hash TEXT,
  confirmations INTEGER NOT NULL CHECK (confirmations >= 0),
  payment_state TEXT NOT NULL CHECK (payment_state IN ('mempool_seen', 'paid_confirmed', 'manual_review', 'reorg_review')),
  first_seen_at TIMESTAMPTZ NOT NULL,
  confirmed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL,
  UNIQUE (txid, tx_vout)
);

CREATE TABLE IF NOT EXISTS btc_direct_payment_activations (
  activation_id TEXT PRIMARY KEY,
  application_id TEXT NOT NULL UNIQUE REFERENCES access_intake_requests(request_id) ON DELETE RESTRICT,
  payment_id TEXT NOT NULL UNIQUE REFERENCES btc_direct_payment_receipts(payment_id) ON DELETE RESTRICT,
  activation_key TEXT NOT NULL UNIQUE,
  state TEXT NOT NULL CHECK (state IN ('pending', 'activating', 'retryable', 'active')),
  service_start TIMESTAMPTZ,
  service_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  claim_token TEXT,
  claimed_at TIMESTAMPTZ,
  CHECK (
    (state = 'active' AND service_start IS NOT NULL AND service_end IS NOT NULL)
    OR
    (state <> 'active' AND service_start IS NULL AND service_end IS NULL)
  ),
  CHECK (
    (state = 'activating' AND claim_token IS NOT NULL AND claimed_at IS NOT NULL)
    OR
    (state <> 'activating' AND claim_token IS NULL AND claimed_at IS NULL)
  )
);

CREATE INDEX IF NOT EXISTS btc_direct_quotes_application_idx
  ON btc_direct_payment_quotes (application_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS btc_direct_quotes_one_live_application_idx
  ON btc_direct_payment_quotes (application_id)
  WHERE quote_state <> 'expired';
CREATE INDEX IF NOT EXISTS btc_direct_quotes_state_expiry_idx
  ON btc_direct_payment_quotes (quote_state, quote_expires_at);
CREATE INDEX IF NOT EXISTS btc_direct_payments_quote_idx
  ON btc_direct_payment_receipts (quote_id, first_seen_at);
CREATE INDEX IF NOT EXISTS btc_direct_activations_state_idx
  ON btc_direct_payment_activations (state, updated_at);
CREATE INDEX IF NOT EXISTS btc_direct_activations_claim_idx
  ON btc_direct_payment_activations (state, claimed_at);

COMMIT;
