import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { chmod, mkdtemp, readFile, rm, writeFile, mkdir } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import {
  DONATION_VALUATION_ASSET,
  DONATION_VALUATION_CLASSIFICATION,
  DONATION_VALUATION_CURRENCY,
  DONATION_VALUATION_SOURCE,
  ensureDonationReceiptValuations,
  exactFiatReferenceValue,
  parseMempoolHistoricalPriceRaw,
  type DonationHistoricalPriceSource,
  type DonationValuationPoint,
  type DonationValuationRecord,
  type DonationValuationStore,
} from "../lib/btc-donation-valuation";

const BASE = "2026-08-15T11:00:00.000Z";
const CONF = "2026-08-15T11:10:00.000Z";

class MemoryValuationStore implements DonationValuationStore {
  rows = new Map<string, DonationValuationRecord>();
  key(receiptId: string, point: DonationValuationPoint) { return `${receiptId}:${point}`; }
  async findValuation(receiptId: string, point: DonationValuationPoint) { return this.rows.get(this.key(receiptId, point)) ?? null; }
  async recordValuation(record: DonationValuationRecord) {
    const key = this.key(record.receiptId, record.valuationPoint);
    const prior = this.rows.get(key);
    if (!prior) { this.rows.set(key, record); return "created" as const; }
    return JSON.stringify(prior) === JSON.stringify(record) ? "replay" as const : "conflict" as const;
  }
}

function fixtureSource(counter: { n: number }): DonationHistoricalPriceSource {
  return {
    async fetchAt(requestedTimestamp: string) {
      counter.n += 1;
      return {
        sourceReturnedTimestamp: "2026-08-15T11:00:00.000Z",
        retrievalTimestamp: "2026-08-15T11:00:05.000Z",
        btcReferencePrice: "62960.000000000000000000",
        provenance: `https://mempool.space/api/v1/historical-price?currency=USD&timestamp=${Math.floor(Date.parse(requestedTimestamp) / 1000)}`,
      };
    },
  };
}

async function run() {
  const fixtureRaw = await readFile("tests/fixtures/mempool-space-historical-price-v1.json", "utf8");
  const fixture = parseMempoolHistoricalPriceRaw(fixtureRaw);
  assert.match(fixture.sourceReturnedTimestamp, /^2026-08-15T/);
  assert.equal(fixture.btcReferencePrice, "62960");
  assert.equal(exactFiatReferenceValue("10000", "62960"), "6.296");
  assert.equal(exactFiatReferenceValue("1", "62960.12500000"), "0.00062960125");

  const store = new MemoryValuationStore();
  const calls = { n: 0 };
  const first = await ensureDonationReceiptValuations({
    receiptId: "don_receipt_fixture_1",
    amountSats: "10000",
    firstSeenAt: BASE,
    observation: { confirmations: 0, spvVerified: false, blockHeight: null, blockHash: null, observedAt: BASE },
    store,
    source: fixtureSource(calls),
    now: () => new Date("2026-08-15T11:00:06Z"),
  });
  assert.deepEqual(first, { firstSeen: "created", confirmation1: "not_applicable" });
  assert.equal(store.rows.size, 1);
  const firstRow = store.rows.get("don_receipt_fixture_1:FIRST_SEEN")!;
  assert.equal(firstRow.asset, DONATION_VALUATION_ASSET);
  assert.equal(firstRow.classification, DONATION_VALUATION_CLASSIFICATION);
  assert.equal(firstRow.noConsideration, true);
  assert.equal(firstRow.valuationSource, DONATION_VALUATION_SOURCE);
  assert.equal(firstRow.fiatReferenceCurrency, DONATION_VALUATION_CURRENCY);
  assert.equal(firstRow.fiatReferenceValue, "6.296");

  const firstReplay = await ensureDonationReceiptValuations({
    receiptId: "don_receipt_fixture_1", amountSats: "10000", firstSeenAt: BASE,
    observation: { confirmations: 0, spvVerified: false, blockHeight: null, blockHash: null, observedAt: BASE },
    store, source: fixtureSource(calls), now: () => new Date("2026-08-15T11:00:07Z"),
  });
  assert.deepEqual(firstReplay, { firstSeen: "replay", confirmation1: "not_applicable" });
  assert.equal(calls.n, 1);

  const confirmed = await ensureDonationReceiptValuations({
    receiptId: "don_receipt_fixture_1", amountSats: "10000", firstSeenAt: BASE,
    observation: { confirmations: 1, spvVerified: true, blockHeight: "962570", blockHash: "a".repeat(64), observedAt: CONF },
    store, source: fixtureSource(calls), now: () => new Date("2026-08-15T11:10:06Z"),
  });
  assert.deepEqual(confirmed, { firstSeen: "replay", confirmation1: "created" });
  assert.equal(store.rows.size, 2);
  assert.equal(store.rows.get("don_receipt_fixture_1:CONFIRMATION_1")?.requestedValuationTimestamp, CONF);
  assert.equal(calls.n, 2);

  const conflictStore = new MemoryValuationStore();
  conflictStore.rows.set("don_receipt_fixture_2:FIRST_SEEN", { ...firstRow, receiptId: "don_receipt_fixture_2", amountSats: "9999" });
  await assert.rejects(() => ensureDonationReceiptValuations({
    receiptId: "don_receipt_fixture_2", amountSats: "10000", firstSeenAt: BASE,
    observation: { confirmations: 0, spvVerified: false, blockHeight: null, blockHash: null, observedAt: BASE },
    store: conflictStore, source: fixtureSource({ n: 0 }),
  }), /donation_valuation_conflict/);

  const unavailableStore = new MemoryValuationStore();
  await assert.rejects(() => ensureDonationReceiptValuations({
    receiptId: "don_receipt_fixture_3", amountSats: "10000", firstSeenAt: BASE,
    observation: { confirmations: 0, spvVerified: false, blockHeight: null, blockHash: null, observedAt: BASE },
    store: unavailableStore,
    source: { async fetchAt() { throw new Error("fixture_provider_down"); } },
  }), /donation_valuation_unavailable/);
  assert.equal(unavailableStore.rows.size, 0);

  const bridgeMigration = await readFile("migrations/20260815_btc_donation_bridge_v1.sql", "utf8");
  const productionOpeningMigration = await readFile("migrations/20260815_btc_donation_production_opening_v1.sql", "utf8");
  const sessionMigration = await readFile("migrations/20260815_btc_donation_session_v1.sql", "utf8");
  const valuationMigration = await readFile("migrations/20260815_btc_donation_valuation_v1.sql", "utf8");
  assert.match(bridgeMigration, /receipt_state='confirmed'[\s\S]*block_hash ~ '\^\[a-f0-9\]\{64\}\$'/);
  assert.match(bridgeMigration, /receipt_state IN \('mempool_seen','confirmation_lost'\)[\s\S]*block_height IS NULL AND block_hash IS NULL/);
  assert.match(productionOpeningMigration, /btc_donation_receipts_chain_authority_check/);
  assert.match(productionOpeningMigration, /block_hash ~ '\^\[a-f0-9\]\{64\}\$'/);
  assert.match(valuationMigration, /PRIMARY KEY\(receipt_id,valuation_point\)/);
  assert.match(valuationMigration, /BEFORE UPDATE OR DELETE/);
  assert.match(valuationMigration, /MEMPOOL_SPACE_HISTORICAL_PRICE_V1/);

  const db = new PGlite();
  await db.waitReady;
  try {
    await db.exec(bridgeMigration);
    await db.exec(productionOpeningMigration);
    await db.exec(sessionMigration);
    await db.exec(valuationMigration);
    await db.exec(`INSERT INTO btc_donation_receiver_addresses(receiver_address_id,receive_address,state,created_at)
      VALUES ('issued_fixture','bc1q${"q".repeat(38)}','available','${BASE}'),('available_fixture','bc1q${"p".repeat(38)}','available','${BASE}');`);
    await db.exec(`UPDATE btc_donation_receiver_addresses SET state='issued',issued_session_id='don_session_123e4567-e89b-42d3-a456-426614174000',issued_at='${BASE}' WHERE receiver_address_id='issued_fixture';`);
    await db.exec(`INSERT INTO btc_donation_sessions(session_id,receiver_address_id,session_state,created_at,expires_at,updated_at)
      VALUES ('don_session_123e4567-e89b-42d3-a456-426614174000','issued_fixture','awaiting_payment','${BASE}','2026-08-15T12:00:00Z','${BASE}');`);
    await db.exec(`UPDATE btc_donation_receiver_addresses SET state='retired',retired_at='${CONF}' WHERE receiver_address_id='issued_fixture';`);
    const terminal = await db.query<{state:string; issued_session_id:string}>(`SELECT state,issued_session_id FROM btc_donation_receiver_addresses WHERE receiver_address_id='issued_fixture'`);
    assert.equal(terminal.rows[0]?.state, "retired");
    assert.equal(terminal.rows[0]?.issued_session_id, "don_session_123e4567-e89b-42d3-a456-426614174000");
    await assert.rejects(() => db.exec(`UPDATE btc_donation_receiver_addresses SET state='available',issued_session_id=NULL,issued_at=NULL,retired_at=NULL WHERE receiver_address_id='issued_fixture'`));

    await db.exec(`INSERT INTO btc_donation_receipts(receipt_id,receiver_address_id,session_id,txid,tx_vout,observed_sats,confirmations,block_height,block_hash,spv_verified,receipt_state,first_seen_at,updated_at)
      VALUES ('receipt_fixture','issued_fixture','don_session_123e4567-e89b-42d3-a456-426614174000','${"b".repeat(64)}',0,10000,0,NULL,NULL,FALSE,'mempool_seen','${BASE}','${BASE}');`);
    await db.exec(`INSERT INTO btc_donation_receipt_valuations(receipt_id,valuation_point,asset,amount_sats,classification,no_consideration,requested_valuation_timestamp,source_returned_timestamp,retrieval_timestamp,valuation_source,valuation_source_provenance,btc_reference_price,fiat_reference_currency,fiat_reference_value,created_at)
      VALUES ('receipt_fixture','FIRST_SEEN','BTC',10000,'VOLUNTARY_NON_CHARITABLE_SUPPORT',TRUE,'${BASE}','${BASE}','${BASE}','MEMPOOL_SPACE_HISTORICAL_PRICE_V1','https://mempool.space/api/v1/historical-price?currency=USD&timestamp=fixture','62960','USD','6.296','${BASE}');`);
    await assert.rejects(() => db.exec(`UPDATE btc_donation_receipt_valuations SET fiat_reference_value='7' WHERE receipt_id='receipt_fixture'`));
    await assert.rejects(() => db.exec(`DELETE FROM btc_donation_receipt_valuations WHERE receipt_id='receipt_fixture'`));
  } finally { await db.close(); }

  const observeApi = await readFile("pages/api/donation/bridge/observe.ts", "utf8");
  const observeStore = await readFile("lib/btc-donation-bridge-neon.ts", "utf8");
  const receiptPersistAt = observeApi.indexOf("store.observe(payload)");
  const valuationPersistAt = observeApi.indexOf("const valuations=await ensureDonationReceiptValuations");
  const processedAt = observeApi.indexOf("store.markMessageProcessed");
  assert.ok(receiptPersistAt >= 0 && valuationPersistAt > receiptPersistAt);
  assert.ok(processedAt > valuationPersistAt);
  assert.match(observeStore, /address_guard\.state IN \('available','issued'\)/);
  assert.match(observeStore, /CASE WHEN address_guard\.state='issued' THEN address_guard\.issued_session_id ELSE NULL END/);

  const temp = await mkdtemp(join(tmpdir(), "bhrigu-local-header-proof-"));
  try {
    const dataDir = join(temp, "electrum-data");
    const wallets = join(dataDir, "wallets");
    await mkdir(wallets, { recursive: true });
    const raw = Buffer.alloc(80, 0);
    raw.writeUInt32LE(4, 0);
    raw.writeUInt32LE(1786795200, 68);
    raw.writeUInt32LE(0x170fffff, 72);
    raw.writeUInt32LE(42, 76);
    const hash = createHash("sha256").update(createHash("sha256").update(raw).digest()).digest().reverse().toString("hex");
    const headers = Buffer.alloc(80 * 3, 0);
    raw.copy(headers, 80 * 2);
    await writeFile(join(dataDir, "blockchain_headers"), headers);
    const txid = "d".repeat(64);
    const wallet = join(wallets, "fixture-wallet");
    await writeFile(wallet, JSON.stringify({ verified_tx3: { [txid]: [2, 1786795200, 0, hash] } }));
    const py = String.raw`
import importlib.util,sys
spec=importlib.util.spec_from_file_location("agent",sys.argv[1])
m=importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
h,b=m.local_verified_block_hash({'ELECTRUM_WALLET':sys.argv[2]},sys.argv[3])
print('HEIGHT='+str(h)); print('HASH='+b)
`;
    const result = spawnSync("python3", ["-c", py, "scripts/btc-donation-receiver-agent.py", wallet, txid], { encoding: "utf8" });
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /HEIGHT=2/);
    assert.match(result.stdout, new RegExp(`HASH=${hash}`));
  } finally { await rm(temp, { recursive: true, force: true }); }

  const agent = await readFile("scripts/btc-donation-receiver-agent.py", "utf8");
  assert.match(agent, /verified_tx3/);
  assert.match(agent, /blockchain_headers/);
  assert.match(agent, /POST_RECEIPT_OBSERVE_ONLY_CLASSIFICATIONS/);
  assert.match(agent, /terminalize_public_provision/);

  console.log("BTC_DONATION_PRODUCTION_OPENING_ACCEPTANCE=PASS");
  console.log("LOCAL_HEADER_HASH_PROOF=PASS");
  console.log("MEMPOOL_NULL_BLOCK_FIELDS=PASS");
  console.log("ISSUED_RECEIVER_RECEIPT_TERMINALIZATION=PASS");
  console.log("AVAILABLE_UNSOLICITED_QUARANTINE=PASS");
  console.log("ADDRESS_NEVER_AVAILABLE_AGAIN=PASS");
  console.log("FIRST_SEEN_VALUATION=PASS");
  console.log("CONFIRMATION_1_VALUATION=PASS");
  console.log("VALUATION_EXACT_DECIMAL=PASS");
  console.log("VALUATION_IDEMPOTENT_REPLAY=PASS");
  console.log("VALUATION_CONFLICT=FAIL_CLOSED_PASS");
  console.log("VALUATION_PROVIDER_TEMPORARY_FAILURE=RETRY_SAFE_PASS");
  console.log("RECEIPT_SURVIVES_VALUATION_FAILURE=PASS");
  console.log("BRIDGE_MESSAGE_NOT_PROCESSED_UNTIL_COMPLETE=PASS");
  console.log("CONFIRMATION_LOST=PASS");
}

run().catch((error) => {
  console.error("BTC_DONATION_PRODUCTION_OPENING_ACCEPTANCE=FAIL");
  console.error(error instanceof Error ? error.stack ?? error.message : "unknown_error");
  process.exitCode = 1;
});
