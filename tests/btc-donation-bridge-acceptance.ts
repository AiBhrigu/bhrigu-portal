import assert from "node:assert/strict";
import { generateKeyPairSync, sign } from "node:crypto";
import { chmod, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { postgresMigrationTransactionStatements, splitPostgresStatements } from "../lib/postgres-migration-statements";
import {
  BTC_DONATION_BRIDGE_MODE,
  DONATION_BRIDGE_PROTOCOL_VERSION,
  canonicalJson,
  donationBridgeSigningBytes,
  donationPayloadHash,
  getDonationBridgeRuntimeConfig,
  parseDonationAddressProvisionPayload,
  parseDonationObservationPayload,
  proposedDonationReceiptState,
  verifyDonationBridgeEnvelope,
  type DonationBridgeEnvelope,
} from "../lib/btc-donation-bridge";

const now = new Date("2026-08-15T00:00:00Z");
const { privateKey, publicKey } = generateKeyPairSync("ed25519");
const publicPem = publicKey.export({ type: "spki", format: "pem" }).toString();
const config = { enabled: true as const, databaseUrl: "postgres://fixture", keyId: "orion-donation-bridge-v1", verifyPublicKeyPem: publicPem };
const fakeAddress = `bc1q${"q".repeat(38)}`;
const provisionPayload = { receiverAddressId: "don_addr_fixture_000001", receiveAddress: fakeAddress, createdAt: now.toISOString() };
function envelope(kind: "address_provision" | "receipt_observation", path: string, payload: unknown, id = "don-msg-fixture-000001"): DonationBridgeEnvelope {
  return { protocolVersion: DONATION_BRIDGE_PROTOCOL_VERSION, keyId: config.keyId, messageId: id, messageKind: kind, createdAt: now.toISOString(), httpMethod: "POST", requestPath: path, payloadHash: donationPayloadHash(payload), payload };
}
function signature(e: DonationBridgeEnvelope) { return sign(null, donationBridgeSigningBytes(e), privateKey).toString("base64"); }

async function run() {
  assert.equal(getDonationBridgeRuntimeConfig({ BTC_DONATION_BRIDGE_MODE, DATABASE_URL: "postgres://fixture", DONATION_BRIDGE_KEY_ID: config.keyId, DONATION_BRIDGE_VERIFY_PUBLIC_KEY: publicPem }).enabled, true);
  assert.equal(getDonationBridgeRuntimeConfig({ BTC_DONATION_BRIDGE_MODE: "off", DATABASE_URL: "postgres://fixture", DONATION_BRIDGE_KEY_ID: config.keyId, DONATION_BRIDGE_VERIFY_PUBLIC_KEY: publicPem }).enabled, false);
  const p = parseDonationAddressProvisionPayload(provisionPayload);
  const e = envelope("address_provision", "/api/donation/bridge/provision", p);
  const sig = signature(e);
  const verified = verifyDonationBridgeEnvelope({ envelope: e, signatureBase64: sig, suppliedKeyId: config.keyId, expectedMethod: "POST", expectedPath: e.requestPath, expectedKind: "address_provision", config, now: () => now });
  assert.equal(verified.messageId, e.messageId);
  assert.throws(() => verifyDonationBridgeEnvelope({ envelope: { ...e, payload: { ...p, receiveAddress: `bc1q${"p".repeat(38)}` } }, signatureBase64: sig, suppliedKeyId: config.keyId, expectedMethod: "POST", expectedPath: e.requestPath, expectedKind: "address_provision", config, now: () => now }), /tampered_payload/);
  assert.throws(() => verifyDonationBridgeEnvelope({ envelope: e, signatureBase64: Buffer.alloc(64).toString("base64"), suppliedKeyId: config.keyId, expectedMethod: "POST", expectedPath: e.requestPath, expectedKind: "address_provision", config, now: () => now }), /invalid_signature/);
  assert.throws(() => verifyDonationBridgeEnvelope({ envelope: e, signatureBase64: sig, suppliedKeyId: "unknown", expectedMethod: "POST", expectedPath: e.requestPath, expectedKind: "address_provision", config, now: () => now }), /unknown_key_id/);
  assert.throws(() => verifyDonationBridgeEnvelope({ envelope: e, signatureBase64: sig, suppliedKeyId: config.keyId, expectedMethod: "POST", expectedPath: "/wrong", expectedKind: "address_provision", config, now: () => now }), /wrong_request_binding/);
  assert.throws(() => verifyDonationBridgeEnvelope({ envelope: e, signatureBase64: sig, suppliedKeyId: config.keyId, expectedMethod: "POST", expectedPath: e.requestPath, expectedKind: "receipt_observation", config, now: () => now }), /wrong_message_kind/);
  const mempool = parseDonationObservationPayload({ receiverAddressId: p.receiverAddressId, txid: "a".repeat(64), txVout: 0, observedSats: "1000", confirmations: 0, blockHeight: null, blockHash: null, observedAt: now.toISOString(), spvVerified: false });
  assert.equal(proposedDonationReceiptState(mempool), "mempool_seen");
  const confirmed = parseDonationObservationPayload({ ...mempool, confirmations: 1, blockHeight: "900001", blockHash: "b".repeat(64), spvVerified: true });
  assert.equal(proposedDonationReceiptState(confirmed), "confirmed");
  assert.throws(() => parseDonationObservationPayload({ ...mempool, confirmations: 1, blockHeight: "900001", spvVerified: false }), /spv_confirmation_required/);
  assert.throws(() => parseDonationObservationPayload({ ...mempool, spvVerified: true }), /invalid_mempool_authority/);
  const migration = await readFile("migrations/20260815_btc_donation_bridge_v1.sql", "utf8");
  assert.match(migration, /btc_donation_bridge_messages/);
  assert.match(migration, /btc_donation_receiver_addresses/);
  assert.match(migration, /btc_donation_receipts/);
  assert.match(migration, /donation_address_state_regression/);
  assert.match(migration, /UNIQUE\(txid,tx_vout\)/);
  const split = splitPostgresStatements(migration);
  assert.equal(split[0]?.trim().toUpperCase(), "BEGIN");
  assert.equal(split.at(-1)?.trim().toUpperCase(), "COMMIT");
  const transactional = postgresMigrationTransactionStatements(migration);
  const functionStatements = transactional.filter((statement) => statement.includes("CREATE OR REPLACE FUNCTION btc_donation_address_transition_guard"));
  assert.equal(functionStatements.length, 1);
  assert.match(functionStatements[0], /RAISE EXCEPTION 'donation_address_state_regression';/);
  const splitDb = new PGlite();
  await splitDb.waitReady;
  try {
    await splitDb.exec("BEGIN");
    for (const statement of transactional) await splitDb.exec(`${statement};`);
    await splitDb.exec("COMMIT");
    const tables = await splitDb.query<{ table_name: string }>("SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name LIKE 'btc_donation_%' ORDER BY table_name");
    assert.deepEqual(tables.rows.map((row) => row.table_name), ["btc_donation_bridge_messages", "btc_donation_receipts", "btc_donation_receiver_addresses"]);
  } finally { await splitDb.close(); }
  const agent = await readFile("scripts/btc-donation-receiver-agent.py", "utf8");
  assert.match(agent, /getaddresshistory/);
  assert.match(agent, /get_tx_status/);
  assert.match(agent, /--socks5-hostname/);
  assert(!/getseed|getmpk|getmasterprivate|getprivatekeys|dumpprivkeys/.test(agent));
  assert(!/BTC_DIRECT_PAYMENT_MODE/.test(agent));
  const serialized = canonicalJson(e);
  assert(!/seed|privateKey|walletPassword|masterPublicKey|xpub|zpub/i.test(serialized));

  const temp = await mkdtemp(join(tmpdir(), "bhrigu-donation-bridge-"));
  try {
    const privatePem = privateKey.export({ type: "pkcs8", format: "pem" }).toString();
    const privatePath = join(temp, "transport-private.pem");
    await writeFile(privatePath, privatePem, { mode: 0o600 });
    await chmod(privatePath, 0o600);
    const py = String.raw`
import importlib.util,json,sys
spec=importlib.util.spec_from_file_location("agent",sys.argv[1])
m=importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
envelope=json.loads(sys.stdin.read())
print(m.canonical_json(envelope))
print(m.sign_envelope({'DONATION_BRIDGE_PRIVATE_KEY_FILE':sys.argv[2]},envelope))
`;
    const cross = spawnSync("python3", ["-c", py, "scripts/btc-donation-receiver-agent.py", privatePath], { input: JSON.stringify(e), encoding: "utf8" });
    assert.equal(cross.status, 0, cross.stderr);
    const [pythonCanonical, pythonSignature] = cross.stdout.trim().split("\n");
    assert.equal(pythonCanonical, canonicalJson(e));
    verifyDonationBridgeEnvelope({ envelope: e, signatureBase64: pythonSignature, suppliedKeyId: config.keyId, expectedMethod: "POST", expectedPath: e.requestPath, expectedKind: "address_provision", config, now: () => now });

    const fakeOne = `bc1q${"q".repeat(37)}p`;
    const fakeTwo = `bc1q${"q".repeat(37)}z`;
    const fakeElectrum = join(temp, "fake-electrum.py");
    await writeFile(fakeElectrum, `#!/usr/bin/env python3\nimport json,sys\ncmd=sys.argv[3] if len(sys.argv)>3 else ''\nif cmd=='listaddresses': print(json.dumps([${JSON.stringify(fakeOne)},${JSON.stringify(fakeTwo)}]))\nelif cmd=='ismine': print('true')\nelse: sys.exit(2)\n`, { mode: 0o700 });
    await chmod(fakeElectrum, 0o700);
    const fakeWallet = join(temp, "watch-only-wallet"); await writeFile(fakeWallet, "fixture");
    const stateDb = join(temp, "agent.sqlite3");
    const agentEnv = { ...process.env, ELECTRUM_CLI: fakeElectrum, ELECTRUM_WALLET: fakeWallet, DONATION_BRIDGE_BASE_URL: "https://preview.invalid", DONATION_BRIDGE_PRIVATE_KEY_FILE: privatePath, DONATION_BRIDGE_KEY_ID: "fixture-key", DONATION_BRIDGE_STATE_DB: stateDb, TOR_SOCKS: "127.0.0.1:19050" };
    const a1 = spawnSync("python3", ["scripts/btc-donation-receiver-agent.py", "provision", "--classification", "TEST_PROVISIONED"], { env: agentEnv, encoding: "utf8" });
    const a2 = spawnSync("python3", ["scripts/btc-donation-receiver-agent.py", "provision", "--classification", "TEST_PROVISIONED"], { env: agentEnv, encoding: "utf8" });
    assert.equal(a1.status, 0, a1.stderr); assert.equal(a2.status, 0, a2.stderr);
    assert(!a1.stdout.includes(fakeOne) && !a1.stdout.includes(fakeTwo) && !a2.stdout.includes(fakeOne) && !a2.stdout.includes(fakeTwo));
    const dbCheck = spawnSync("python3", ["-c", "import sqlite3,sys; d=sqlite3.connect(sys.argv[1]); print(*d.execute('select count(*),count(distinct receive_address) from addresses').fetchone())", stateDb], { encoding: "utf8" });
    assert.equal(dbCheck.status, 0, dbCheck.stderr);
    assert.equal(dbCheck.stdout.trim(), "2 2");

    const eligibilityPy = String.raw`
import importlib.util,sys
spec=importlib.util.spec_from_file_location("agent",sys.argv[1])
m=importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
db=m.init_db(sys.argv[2])
base="2026-08-15T00:00:00Z"
rows=[
 ("retired","bc1qretired000000000000000000000000000000000","TEST_RETIRED_NEVER_DELIVER",base,"msg-retired","queued"),
 ("test","bc1qtest00000000000000000000000000000000000","TEST_PROVISIONED",base,"msg-test","queued"),
 ("integration","bc1qintegration000000000000000000000000000000","INTEGRATION_PROVISIONED",base,"msg-integration","queued"),
]
db.executemany("INSERT INTO addresses VALUES(?,?,?,?,?,?)",rows); db.commit()
sent=[]
m.sign_envelope=lambda cfg,envelope:"fixture-signature"
m.deliver=lambda cfg,path,envelope,signature:(sent.append(envelope["payload"]["receiverAddressId"]) or {"ok":True})
m.flush_queued({"DONATION_BRIDGE_KEY_ID":"fixture-key"},db)
states=dict(db.execute("select receiver_address_id,delivery_status from addresses"))
seen=[]
def fake_electrum(cfg,*args):
    if args[0]=="getaddresshistory": seen.append(args[1]); return []
    raise RuntimeError("unexpected")
m.run_electrum=fake_electrum
m.scan({},db,False)
print("SENT="+",".join(sent))
print("RETIRED="+states["retired"])
print("TEST="+states["test"])
print("INTEGRATION="+states["integration"])
print("SCAN_COUNT="+str(len(seen)))
print("SCAN_INTEGRATION="+("YES" if rows[2][1] in seen else "NO"))
print("SCAN_RETIRED="+("YES" if rows[0][1] in seen else "NO"))
`;
    const eligibility = spawnSync("python3", ["-c", eligibilityPy, "scripts/btc-donation-receiver-agent.py", join(temp, "eligibility.sqlite3")], { encoding: "utf8" });
    assert.equal(eligibility.status, 0, eligibility.stderr);
    assert.match(eligibility.stdout, /SENT=integration/);
    assert.match(eligibility.stdout, /RETIRED=queued/);
    assert.match(eligibility.stdout, /TEST=queued/);
    assert.match(eligibility.stdout, /INTEGRATION=delivered/);
    assert.match(eligibility.stdout, /SCAN_COUNT=1/);
    assert.match(eligibility.stdout, /SCAN_INTEGRATION=YES/);
    assert.match(eligibility.stdout, /SCAN_RETIRED=NO/);
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
  console.log("BTC_DONATION_BRIDGE_ACCEPTANCE=PASS");
  console.log("ledger=signature,tamper,path,kind,key,address_state,spv_contract,secret_boundary,tor_agent");
}
run().catch((error) => { console.error("BTC_DONATION_BRIDGE_ACCEPTANCE=FAIL"); console.error(error instanceof Error ? error.message : "unknown_error"); process.exitCode = 1; });
