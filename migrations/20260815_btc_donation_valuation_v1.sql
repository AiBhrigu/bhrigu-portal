BEGIN;

CREATE TABLE IF NOT EXISTS btc_donation_receipt_valuations (
  receipt_id TEXT NOT NULL REFERENCES btc_donation_receipts(receipt_id) ON DELETE RESTRICT,
  valuation_point TEXT NOT NULL CHECK (valuation_point IN ('FIRST_SEEN','CONFIRMATION_1')),
  asset TEXT NOT NULL CHECK (asset='BTC'),
  amount_sats BIGINT NOT NULL CHECK (amount_sats > 0),
  classification TEXT NOT NULL CHECK (classification='VOLUNTARY_NON_CHARITABLE_SUPPORT'),
  no_consideration BOOLEAN NOT NULL CHECK (no_consideration),
  requested_valuation_timestamp TIMESTAMPTZ NOT NULL,
  source_returned_timestamp TIMESTAMPTZ NOT NULL,
  retrieval_timestamp TIMESTAMPTZ NOT NULL,
  valuation_source TEXT NOT NULL CHECK (valuation_source='MEMPOOL_SPACE_HISTORICAL_PRICE_V1'),
  valuation_source_provenance TEXT NOT NULL,
  btc_reference_price TEXT NOT NULL CHECK (btc_reference_price ~ '^(0|[1-9][0-9]{0,29})(\.[0-9]{1,40})?$'),
  fiat_reference_currency TEXT NOT NULL CHECK (fiat_reference_currency='USD'),
  fiat_reference_value TEXT NOT NULL CHECK (fiat_reference_value ~ '^(0|[1-9][0-9]{0,29})(\.[0-9]{1,48})?$'),
  created_at TIMESTAMPTZ NOT NULL,
  PRIMARY KEY(receipt_id,valuation_point)
);

CREATE OR REPLACE FUNCTION btc_donation_valuation_append_only_guard()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'donation_valuation_append_only';
END;
$$;

DROP TRIGGER IF EXISTS btc_donation_valuation_append_only_guard_trigger ON btc_donation_receipt_valuations;
CREATE TRIGGER btc_donation_valuation_append_only_guard_trigger
BEFORE UPDATE OR DELETE ON btc_donation_receipt_valuations
FOR EACH ROW EXECUTE FUNCTION btc_donation_valuation_append_only_guard();

CREATE INDEX IF NOT EXISTS btc_donation_valuations_created_idx
  ON btc_donation_receipt_valuations(created_at,receipt_id);

COMMIT;
