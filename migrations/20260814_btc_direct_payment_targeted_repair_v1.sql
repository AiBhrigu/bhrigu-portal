BEGIN;

ALTER TABLE btc_direct_payment_quotes
  DROP CONSTRAINT IF EXISTS btc_direct_payment_quotes_fx_rate_decimal_check;

ALTER TABLE btc_direct_payment_quotes
  ALTER COLUMN fx_rate_decimal TYPE TEXT USING fx_rate_decimal::text;

ALTER TABLE btc_direct_payment_quotes
  ADD CONSTRAINT btc_direct_payment_quotes_fx_rate_decimal_check CHECK (
    fx_rate_decimal ~ '^(?:0|[1-9][0-9]{0,29})(?:\.[0-9]{1,40})?$'
    AND fx_rate_decimal !~ '^0(?:\.0+)?$'
  );

ALTER TABLE btc_direct_payment_activations
  ADD COLUMN IF NOT EXISTS claim_token TEXT,
  ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMPTZ;
ALTER TABLE btc_direct_payment_activations
  DROP CONSTRAINT IF EXISTS btc_direct_payment_activations_claim_state_check;
ALTER TABLE btc_direct_payment_activations
  ADD CONSTRAINT btc_direct_payment_activations_claim_state_check CHECK (
    (state = 'activating' AND claim_token IS NOT NULL AND claimed_at IS NOT NULL)
    OR
    (state <> 'activating' AND claim_token IS NULL AND claimed_at IS NULL)
  );

CREATE INDEX IF NOT EXISTS btc_direct_activations_claim_idx
  ON btc_direct_payment_activations (state, claimed_at);

COMMIT;
