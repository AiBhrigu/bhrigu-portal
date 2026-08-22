import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { PGlite } from "@electric-sql/pglite";

const EXPECTED_MIGRATIONS = [
  "20260809_access_private_intake_v1.sql",
  "20260814_btc_direct_payment_v1.sql",
  "20260815_btc_donation_bridge_v1.sql",
  "20260815_btc_donation_production_opening_v1.sql",
  "20260815_btc_donation_session_v1.sql",
  "20260815_btc_donation_valuation_v1.sql",
  "20260819_btc_donation_session_admission_v1.sql",
  "20260822_btc_observability_v1.sql",
];

async function run() {
  const migrationDir = join(process.cwd(), "migrations");
  const migrations = (await readdir(migrationDir))
    .filter((name) => name.endsWith(".sql"))
    .sort();
  assert.deepEqual(migrations, EXPECTED_MIGRATIONS);

  const db = new PGlite();
  await db.waitReady;
  try {
    for (const name of migrations) {
      await db.exec(await readFile(join(migrationDir, name), "utf8"));
    }
    const tables = await db.query<{ table_name: string }>(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema='public' AND table_name LIKE 'btc_direct_%'
      ORDER BY table_name
    `);
    assert.deepEqual(tables.rows.map((row) => row.table_name), [
      "btc_direct_payment_activations",
      "btc_direct_payment_quotes",
      "btc_direct_payment_receipts",
      "btc_direct_receiver_addresses",
    ]);

    const donationTables = await db.query<{ table_name: string }>(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema='public' AND table_name LIKE 'btc_donation_%'
      ORDER BY table_name
    `);
    assert.deepEqual(donationTables.rows.map((row) => row.table_name), [
      "btc_donation_bridge_messages",
      "btc_donation_receipt_valuations",
      "btc_donation_receipts",
      "btc_donation_receiver_addresses",
      "btc_donation_session_admissions",
      "btc_donation_sessions",
    ]);

    const fx = await db.query<{ data_type: string }>(`
      SELECT data_type FROM information_schema.columns
      WHERE table_name='btc_direct_payment_quotes' AND column_name='fx_rate_decimal'
    `);
    assert.equal(fx.rows[0]?.data_type, "text");

    const claimColumns = await db.query<{ column_name: string }>(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name='btc_direct_payment_activations'
        AND column_name IN ('claim_token','claimed_at') ORDER BY column_name
    `);
    assert.deepEqual(claimColumns.rows.map((row) => row.column_name), ["claim_token", "claimed_at"]);
    const liveIndex = await db.query<{ indexdef: string }>(`
      SELECT indexdef FROM pg_indexes
      WHERE schemaname='public' AND indexname='btc_direct_quotes_one_live_application_idx'
    `);
    assert.match(liveIndex.rows[0]?.indexdef ?? "", /UNIQUE INDEX/);
    assert.match(liveIndex.rows[0]?.indexdef ?? "", /quote_state.*expired/i);

    await db.exec(`
      INSERT INTO access_intake_requests
        (request_id,idempotency_key,payload_hash,record,status,created_at,updated_at)
      VALUES
        ('APP-FRESH-0001','fresh-migration-key-0001','${"a".repeat(64)}','{}','accepted',NOW(),NOW());
      INSERT INTO btc_direct_receiver_addresses(receiver_address_id,receive_address,state)
      VALUES ('addr_fresh_1','bc1qfresh000000000000000000000000001','available'),
             ('addr_fresh_2','bc1qfresh000000000000000000000000002','available');
      INSERT INTO btc_direct_payment_quotes
        (quote_id,application_id,idempotency_key,idempotency_payload_hash,usd_price_cents,fx_source,
         fx_rate_decimal,fx_timestamp,quote_expires_at,sat_amount_integer,receiver_address_id,
         receive_address,quote_state,created_at,updated_at)
      VALUES
        ('quote_fresh_1','APP-FRESH-0001','fresh-quote-key-0001','${"b".repeat(64)}',4900,
         'coingecko_simple_price_btc_usd','63000.123456789012345678',NOW(),NOW()+INTERVAL '15 minutes',
         77778,'addr_fresh_1','bc1qfresh000000000000000000000000001','payment_pending',NOW(),NOW());
    `);
    let secondLiveBlocked = false;
    try {
      await db.exec(`
        INSERT INTO btc_direct_payment_quotes
          (quote_id,application_id,idempotency_key,idempotency_payload_hash,usd_price_cents,fx_source,
           fx_rate_decimal,fx_timestamp,quote_expires_at,sat_amount_integer,receiver_address_id,
           receive_address,quote_state,created_at,updated_at)
        VALUES
          ('quote_fresh_2','APP-FRESH-0001','fresh-quote-key-0002','${"c".repeat(64)}',4900,
           'coingecko_simple_price_btc_usd','63000.123456789012345678',NOW(),NOW()+INTERVAL '15 minutes',
           77778,'addr_fresh_2','bc1qfresh000000000000000000000000002','payment_pending',NOW(),NOW());
      `);
    } catch {
      secondLiveBlocked = true;
    }
    assert.equal(secondLiveBlocked, true);

    await db.exec(`UPDATE btc_direct_payment_quotes SET quote_state='expired' WHERE quote_id='quote_fresh_1'`);
    await db.exec(`
      INSERT INTO btc_direct_payment_quotes
        (quote_id,application_id,idempotency_key,idempotency_payload_hash,usd_price_cents,fx_source,
         fx_rate_decimal,fx_timestamp,quote_expires_at,sat_amount_integer,receiver_address_id,
         receive_address,quote_state,created_at,updated_at)
      VALUES
        ('quote_fresh_2','APP-FRESH-0001','fresh-quote-key-0002','${"c".repeat(64)}',4900,
         'coingecko_simple_price_btc_usd','63000.123456789012345678',NOW(),NOW()+INTERVAL '15 minutes',
         77778,'addr_fresh_2','bc1qfresh000000000000000000000000002','payment_pending',NOW(),NOW());
    `);
    const liveCount = await db.query<{ n: number }>(`
      SELECT count(*)::int AS n FROM btc_direct_payment_quotes
      WHERE application_id='APP-FRESH-0001' AND quote_state <> 'expired'
    `);
    assert.equal(liveCount.rows[0]?.n, 1);
    await db.exec(`
      INSERT INTO btc_donation_receiver_addresses(receiver_address_id,receive_address,state,created_at)
      VALUES ('don_fresh_1','bc1q${"q".repeat(38)}','available',NOW()),
             ('don_fresh_2','bc1q${"p".repeat(38)}','available',NOW());
      UPDATE btc_donation_receiver_addresses
      SET state='issued',issued_session_id='fresh_session_1',issued_at=NOW()
      WHERE receiver_address_id='don_fresh_1';
    `);
    let donationRegressionBlocked = false;
    try {
      await db.exec(`UPDATE btc_donation_receiver_addresses SET state='available',issued_session_id=NULL,issued_at=NULL WHERE receiver_address_id='don_fresh_1'`);
    } catch { donationRegressionBlocked = true; }
    assert.equal(donationRegressionBlocked, true);
    const donationIndex = await db.query<{ indexdef: string }>(`
      SELECT indexdef FROM pg_indexes WHERE schemaname='public' AND indexname='btc_donation_addresses_state_idx'
    `);
    assert.match(donationIndex.rows[0]?.indexdef ?? "", /btc_donation_receiver_addresses/);
    const sessionIndex = await db.query<{ indexdef: string }>(`
      SELECT indexdef FROM pg_indexes WHERE schemaname='public' AND indexname='btc_donation_sessions_state_expiry_idx'
    `);
    assert.match(sessionIndex.rows[0]?.indexdef ?? "", /btc_donation_sessions/);
    const observabilityTables = await db.query<{ table_name: string }>(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema='public' AND table_name='btc_observability_events'
    `);
    assert.deepEqual(observabilityTables.rows.map((row) => row.table_name), ["btc_observability_events"]);
    const observabilityColumns = await db.query<{ column_name: string }>(`
      SELECT column_name FROM information_schema.columns WHERE table_name='btc_observability_events'
    `);
    for (const forbidden of ["question","answer","raw_ip","ip","user_agent","referrer_url","wallet_address","cookie_token"]) {
      assert(!observabilityColumns.rows.some((row) => row.column_name === forbidden), `forbidden observability column: ${forbidden}`);
    }
  } finally {
    await db.close();
  }

  console.log("BTC_DIRECT_PAYMENT_FRESH_DB_MIGRATION=PASS");
  console.log(`migration_order=${EXPECTED_MIGRATIONS.join("->")}`);
  console.log("fresh_database=YES");
  console.log("machine_applied_migrations=YES");
  console.log("BTC_DONATION_BRIDGE_FRESH_DB_MIGRATION=PASS");
}

run().catch((error) => {
  console.error("BTC_DIRECT_PAYMENT_FRESH_DB_MIGRATION=FAIL");
  console.error(error instanceof Error ? error.message : "unknown_error");
  process.exitCode = 1;
});
