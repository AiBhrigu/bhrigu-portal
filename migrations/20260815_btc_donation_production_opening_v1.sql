BEGIN;

ALTER TABLE btc_donation_receipts
  DROP CONSTRAINT IF EXISTS btc_donation_receipts_check;

ALTER TABLE btc_donation_receipts
  DROP CONSTRAINT IF EXISTS btc_donation_receipts_chain_authority_check;

ALTER TABLE btc_donation_receipts
  ADD CONSTRAINT btc_donation_receipts_chain_authority_check
  CHECK (
    (receipt_state='confirmed' AND confirmations >= 1 AND spv_verified
      AND block_height IS NOT NULL AND block_hash ~ '^[a-f0-9]{64}$')
    OR
    (receipt_state IN ('mempool_seen','confirmation_lost') AND confirmations = 0 AND NOT spv_verified
      AND block_height IS NULL AND block_hash IS NULL)
  );

COMMIT;
