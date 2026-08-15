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
  assert.throws(() => parseDonationObservationPayload({ ...mempool, confirmations: 1, blockHeight: "900001", blockHash: null, spvVerified: true }), /spv_confirmation_required/);
  assert.throws(() => parseDonationObservationPayload({ ...mempool, confirmations: 1, blockHeight: "900001", spvVerified: false }), /spv_confirmation_required/);
  assert.throws(() => parseDonationObservationPayload({ ...mempool, spvVerified: true }), /invalid_mempool_authority/);
  const migration = await readFile("migrations/20260815_btc_donation_bridge_v1.sql", "utf8");
  assert.match(migration, /btc_donation_bridge_messages/);
  assert.match(migration, /btc_donation_receiver_addresses/);
  assert.match(migration, /btc_donation_receipts/);
  assert.match(migration, /donation_address_state_regression/);
  assert.match(migration, /UNIQUE\(txid,tx_vout\)/);
  assert.match(migration, /block_hash ~ '\^\[a-f0-9\]\{64\}\$'/);
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
  const agentEnvTemplate = await readFile("config/btc-donation-receiver-agent.env.example", "utf8");
  assert.match(agent, /getaddresshistory/);
  assert.match(agent, /get_tx_status/);
  assert.match(agent, /verified_tx3/);
  assert.match(agent, /blockchain_headers/);
  assert.match(agent, /electrum_local_header_hash_mismatch/);
  assert.match(agent, /PROVISIONED_RECEIPT_RETIRED_OBSERVE_ONLY/);
  assert.match(agent, /PUBLIC_SUPPORT_ELIGIBLE/);
  assert.match(agent, /PUBLIC_SUPPORT_RECEIPT_RETIRED_OBSERVE_ONLY/);
  assert.match(agent, /choices=\['PROVISIONED','INTEGRATION_PROVISIONED','PUBLIC_SUPPORT_ELIGIBLE','TEST_PROVISIONED'\]/);
  assert.match(agent, /--socks5-hostname/);
  assert(!/getseed|getmpk|getmasterprivate|getprivatekeys|dumpprivkeys/.test(agent));
  assert(!/BTC_DIRECT_PAYMENT_MODE/.test(agent));
  assert.ok((agent.match(/require_outbound_provision_classification\(/g) ?? []).length >= 4);
  assert.ok((agent.match(/require_observation_address\(/g) ?? []).length >= 4);
  assert(!agentEnvTemplate.includes("bhrigu_mainnet_watch_only_receiver"));
  assert.equal((agentEnvTemplate.match(/bhrigu_mainnet_watch_only_automation/g) ?? []).length, 1);
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
    await writeFile(fakeElectrum, `#!/usr/bin/env python3\nimport json,sys,pathlib\ncmd=sys.argv[3] if len(sys.argv)>3 else ''\nstate=pathlib.Path(sys.argv[0]+'.counter')\nif cmd=='createnewaddress':\n n=int(state.read_text()) if state.exists() else 0\n vals=[${JSON.stringify(fakeOne)},${JSON.stringify(fakeTwo)}]\n if n>=len(vals): sys.exit(2)\n print(json.dumps(vals[n])); state.write_text(str(n+1))\nelif cmd=='ismine': print('true')\nelse: sys.exit(2)\n`, { mode: 0o700 });
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
    assert.equal((await readFile(fakeElectrum + ".counter", "utf8")).trim(), "2");

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
 ("public","bc1qpublic00000000000000000000000000000000000","PUBLIC_SUPPORT_ELIGIBLE",base,"msg-public","queued"),
 ("public-retired","bc1qpublicretired0000000000000000000000000000","PUBLIC_SUPPORT_RECEIPT_RETIRED_OBSERVE_ONLY",base,"msg-public-retired","queued"),
 ("integration-retired","bc1qintegrationretired0000000000000000000000000000","INTEGRATION_TEST_RETIRED",base,"msg-integration-retired","queued"),
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
print("PUBLIC="+states["public"])
print("PUBLIC_RETIRED="+states["public-retired"])
print("INTEGRATION_RETIRED="+states["integration-retired"])
print("SCAN_COUNT="+str(len(seen)))
print("SCAN_INTEGRATION="+("YES" if rows[2][1] in seen else "NO"))
print("SCAN_PUBLIC="+("YES" if rows[3][1] in seen else "NO"))
print("SCAN_PUBLIC_RETIRED="+("YES" if rows[4][1] in seen else "NO"))
print("SCAN_RETIRED="+("YES" if rows[0][1] in seen else "NO"))
`;
    const eligibility = spawnSync("python3", ["-c", eligibilityPy, "scripts/btc-donation-receiver-agent.py", join(temp, "eligibility.sqlite3")], { encoding: "utf8" });
    assert.equal(eligibility.status, 0, eligibility.stderr);
    assert.match(eligibility.stdout, /SENT=integration,public/);
    assert.match(eligibility.stdout, /RETIRED=queued/);
    assert.match(eligibility.stdout, /TEST=queued/);
    assert.match(eligibility.stdout, /INTEGRATION=delivered/);
    assert.match(eligibility.stdout, /PUBLIC=delivered/);
    assert.match(eligibility.stdout, /PUBLIC_RETIRED=queued/);
    assert.match(eligibility.stdout, /INTEGRATION_RETIRED=queued/);
    assert.match(eligibility.stdout, /SCAN_COUNT=2/);
    assert.match(eligibility.stdout, /SCAN_INTEGRATION=YES/);
    assert.match(eligibility.stdout, /SCAN_PUBLIC=YES/);
    assert.match(eligibility.stdout, /SCAN_PUBLIC_RETIRED=NO/);
    assert.match(eligibility.stdout, /SCAN_RETIRED=NO/);

    const directGuardPy = String.raw`
import importlib.util,sys
spec=importlib.util.spec_from_file_location("agent",sys.argv[1])
m=importlib.util.module_from_spec(spec); spec.loader.exec_module(m)

def run_case(db_path,classification):
    db=m.init_db(db_path)
    calls={"flush":0,"derive":0,"deliver":0,"guard":0}
    payload_keys=[]
    original_guard=m.require_outbound_provision_classification
    def guard(value):
        calls["guard"]+=1
        return original_guard(value)
    m.require_outbound_provision_classification=guard
    m.flush_queued=lambda cfg,db: calls.__setitem__("flush",calls["flush"]+1)
    def derive(cfg,db):
        calls["derive"]+=1
        return "bc1q" + ("q"*37) + ("p" if classification=="PROVISIONED" else "z")
    m.next_fresh_address=derive
    m.sign_envelope=lambda cfg,envelope:"fixture-signature"
    def deliver(cfg,path,envelope,signature):
        calls["deliver"]+=1
        payload_keys.append(",".join(sorted(envelope["payload"].keys())))
        return {"ok":True}
    m.deliver=deliver
    rejected=False
    try:
        m.provision({"DONATION_BRIDGE_KEY_ID":"fixture-key"},db,classification,True)
    except RuntimeError as e:
        rejected=str(e)=="outbound_provision_classification_forbidden"
    rows=db.execute("select count(*) from addresses").fetchone()[0]
    delivered=db.execute("select count(*) from addresses where delivery_status='delivered'").fetchone()[0]
    db.close()
    m.require_outbound_provision_classification=original_guard
    print(classification+"_REJECTED="+("YES" if rejected else "NO"))
    print(classification+"_FLUSH="+str(calls["flush"]))
    print(classification+"_DERIVE="+str(calls["derive"]))
    print(classification+"_DELIVER="+str(calls["deliver"]))
    print(classification+"_GUARD="+str(calls["guard"]))
    print(classification+"_ROWS="+str(rows))
    print(classification+"_DELIVERED_ROWS="+str(delivered))
    print(classification+"_PAYLOAD_KEYS="+";".join(payload_keys))

run_case(sys.argv[2]+"-test.sqlite3","TEST_PROVISIONED")
run_case(sys.argv[2]+"-provisioned.sqlite3","PROVISIONED")
run_case(sys.argv[2]+"-integration.sqlite3","INTEGRATION_PROVISIONED")
run_case(sys.argv[2]+"-public.sqlite3","PUBLIC_SUPPORT_ELIGIBLE")
run_case(sys.argv[2]+"-public-retired.sqlite3","PUBLIC_SUPPORT_RECEIPT_RETIRED_OBSERVE_ONLY")
`;
    const directGuard = spawnSync("python3", ["-c", directGuardPy, "scripts/btc-donation-receiver-agent.py", join(temp, "direct-guard")], { encoding: "utf8" });
    assert.equal(directGuard.status, 0, directGuard.stderr);
    assert.match(directGuard.stdout, /TEST_PROVISIONED_REJECTED=YES/);
    assert.match(directGuard.stdout, /TEST_PROVISIONED_FLUSH=0/);
    assert.match(directGuard.stdout, /TEST_PROVISIONED_DERIVE=0/);
    assert.match(directGuard.stdout, /TEST_PROVISIONED_DELIVER=0/);
    assert.match(directGuard.stdout, /TEST_PROVISIONED_ROWS=0/);
    assert.match(directGuard.stdout, /PROVISIONED_DERIVE=1/);
    assert.match(directGuard.stdout, /PROVISIONED_DELIVER=1/);
    assert.match(directGuard.stdout, /PROVISIONED_GUARD=2/);
    assert.match(directGuard.stdout, /PROVISIONED_ROWS=1/);
    assert.match(directGuard.stdout, /PROVISIONED_DELIVERED_ROWS=1/);
    assert.match(directGuard.stdout, /INTEGRATION_PROVISIONED_DERIVE=1/);
    assert.match(directGuard.stdout, /INTEGRATION_PROVISIONED_DELIVER=1/);
    assert.match(directGuard.stdout, /INTEGRATION_PROVISIONED_GUARD=2/);
    assert.match(directGuard.stdout, /INTEGRATION_PROVISIONED_ROWS=1/);
    assert.match(directGuard.stdout, /INTEGRATION_PROVISIONED_DELIVERED_ROWS=1/);
    assert.match(directGuard.stdout, /PUBLIC_SUPPORT_ELIGIBLE_REJECTED=NO/);
    assert.match(directGuard.stdout, /PUBLIC_SUPPORT_ELIGIBLE_DERIVE=1/);
    assert.match(directGuard.stdout, /PUBLIC_SUPPORT_ELIGIBLE_DELIVER=1/);
    assert.match(directGuard.stdout, /PUBLIC_SUPPORT_ELIGIBLE_GUARD=2/);
    assert.match(directGuard.stdout, /PUBLIC_SUPPORT_ELIGIBLE_ROWS=1/);
    assert.match(directGuard.stdout, /PUBLIC_SUPPORT_ELIGIBLE_DELIVERED_ROWS=1/);
    assert.match(directGuard.stdout, /PUBLIC_SUPPORT_ELIGIBLE_PAYLOAD_KEYS=createdAt,receiveAddress,receiverAddressId/);
    assert.match(directGuard.stdout, /PUBLIC_SUPPORT_RECEIPT_RETIRED_OBSERVE_ONLY_REJECTED=YES/);
    assert.match(directGuard.stdout, /PUBLIC_SUPPORT_RECEIPT_RETIRED_OBSERVE_ONLY_FLUSH=0/);
    assert.match(directGuard.stdout, /PUBLIC_SUPPORT_RECEIPT_RETIRED_OBSERVE_ONLY_DERIVE=0/);
    assert.match(directGuard.stdout, /PUBLIC_SUPPORT_RECEIPT_RETIRED_OBSERVE_ONLY_DELIVER=0/);
    assert.match(directGuard.stdout, /PUBLIC_SUPPORT_RECEIPT_RETIRED_OBSERVE_ONLY_ROWS=0/);

    const observationAuthorityPy = String.raw`
import importlib.util,json,sys
spec=importlib.util.spec_from_file_location("agent",sys.argv[1])
m=importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
base="2026-08-15T00:00:00Z"

def run_case(db_path,label,classification=None):
    db=m.init_db(db_path)
    receiver_id="addr-"+label
    if classification is not None:
        db.execute("INSERT INTO addresses VALUES(?,?,?,?,?,?)",(receiver_id,"bc1q"+("q"*35)+label[-3:].replace('_','q'),classification,base,"msg-"+label,"delivered"))
    payload={"receiverAddressId":receiver_id,"txid":"a"*64,"txVout":0,"observedSats":"1000","confirmations":0,"blockHeight":None,"blockHash":None,"observedAt":base,"spvVerified":False}
    db.execute("INSERT INTO observations VALUES(?,?,?,?,?)",("evt-"+label,"obs-"+label,json.dumps(payload,separators=(',',':')),"queued",base)); db.commit()
    calls={"sign":0,"deliver":0}
    m.sign_envelope=lambda cfg,envelope:(calls.__setitem__("sign",calls["sign"]+1) or "fixture-signature")
    m.deliver=lambda cfg,path,envelope,signature:(calls.__setitem__("deliver",calls["deliver"]+1) or {"ok":True})
    rejected=False
    try: m.flush_queued({"DONATION_BRIDGE_KEY_ID":"fixture-key"},db)
    except RuntimeError: rejected=True
    status=db.execute("SELECT delivery_status FROM observations WHERE event_key=?",("evt-"+label,)).fetchone()[0]
    rows=db.execute("SELECT count(*) FROM observations WHERE event_key=?",("evt-"+label,)).fetchone()[0]
    classification_after=db.execute("SELECT classification FROM addresses WHERE receiver_address_id=?",(receiver_id,)).fetchone()
    classification_after=classification_after[0] if classification_after else "MISSING"
    db.close()
    print(label+"_REJECTED="+("YES" if rejected else "NO"))
    print(label+"_SIGN="+str(calls["sign"]))
    print(label+"_DELIVER="+str(calls["deliver"]))
    print(label+"_STATUS="+status)
    print(label+"_ROWS="+str(rows))
    print(label+"_CLASSIFICATION="+classification_after)

run_case(sys.argv[2]+"-test.sqlite3","TEST","TEST_PROVISIONED")
run_case(sys.argv[2]+"-retired.sqlite3","RETIRED","TEST_RETIRED_NEVER_DELIVER")
run_case(sys.argv[2]+"-integration-retired.sqlite3","INTEGRATION_RETIRED","INTEGRATION_TEST_RETIRED")
run_case(sys.argv[2]+"-orphan.sqlite3","ORPHAN",None)
run_case(sys.argv[2]+"-provisioned.sqlite3","PROVISIONED","PROVISIONED")
run_case(sys.argv[2]+"-integration.sqlite3","INTEGRATION","INTEGRATION_PROVISIONED")
run_case(sys.argv[2]+"-public.sqlite3","PUBLIC","PUBLIC_SUPPORT_ELIGIBLE")
run_case(sys.argv[2]+"-public-retired.sqlite3","PUBLIC_RETIRED","PUBLIC_SUPPORT_RECEIPT_RETIRED_OBSERVE_ONLY")
`;
    const observationAuthority = spawnSync("python3", ["-c", observationAuthorityPy, "scripts/btc-donation-receiver-agent.py", join(temp, "observation-authority")], { encoding: "utf8" });
    assert.equal(observationAuthority.status, 0, observationAuthority.stderr);
    for (const label of ["TEST","RETIRED","INTEGRATION_RETIRED","ORPHAN"]) {
      assert.match(observationAuthority.stdout, new RegExp(`${label}_REJECTED=YES`));
      assert.match(observationAuthority.stdout, new RegExp(`${label}_SIGN=0`));
      assert.match(observationAuthority.stdout, new RegExp(`${label}_DELIVER=0`));
      assert.match(observationAuthority.stdout, new RegExp(`${label}_STATUS=queued`));
      assert.match(observationAuthority.stdout, new RegExp(`${label}_ROWS=1`));
    }
    for (const label of ["PROVISIONED","INTEGRATION","PUBLIC","PUBLIC_RETIRED"]) {
      assert.match(observationAuthority.stdout, new RegExp(`${label}_REJECTED=NO`));
      assert.match(observationAuthority.stdout, new RegExp(`${label}_SIGN=1`));
      assert.match(observationAuthority.stdout, new RegExp(`${label}_DELIVER=1`));
      assert.match(observationAuthority.stdout, new RegExp(`${label}_STATUS=delivered`));
    }
    assert.match(observationAuthority.stdout, /PROVISIONED_CLASSIFICATION=PROVISIONED_RECEIPT_RETIRED_OBSERVE_ONLY/);
    assert.match(observationAuthority.stdout, /INTEGRATION_CLASSIFICATION=INTEGRATION_PROVISIONED_RECEIPT_RETIRED_OBSERVE_ONLY/);
    assert.match(observationAuthority.stdout, /PUBLIC_CLASSIFICATION=PUBLIC_SUPPORT_RECEIPT_RETIRED_OBSERVE_ONLY/);
    assert.match(observationAuthority.stdout, /PUBLIC_RETIRED_CLASSIFICATION=PUBLIC_SUPPORT_RECEIPT_RETIRED_OBSERVE_ONLY/);

    const scanRacePy = String.raw`
import importlib.util,sys
spec=importlib.util.spec_from_file_location("agent",sys.argv[1])
m=importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
db=m.init_db(sys.argv[2]); base="2026-08-15T00:00:00Z"; receiver_id="scan-race"; address="bc1q"+("q"*38)
db.execute("INSERT INTO addresses VALUES(?,?,?,?,?,?)",(receiver_id,address,"INTEGRATION_PROVISIONED",base,"msg-scan-race","delivered")); db.commit()

def fake_electrum(cfg,*args):
    if args[0]=="getaddresshistory": return [{"tx_hash":"b"*64,"height":0}]
    if args[0]=="get_tx_status": return {"confirmations":0}
    raise RuntimeError("unexpected_electrum_call")
m.run_electrum=fake_electrum
m.decode_tx_outputs=lambda cfg,txid:[{"address":address,"value_sats":1234}]
original_make=m.make_envelope
def retire_before_delivery(cfg,kind,path,payload,message_id=None,created_at=None):
    if kind=="receipt_observation":
        db.execute("UPDATE addresses SET classification='INTEGRATION_TEST_RETIRED' WHERE receiver_address_id=?",(receiver_id,)); db.commit()
    return original_make(cfg,kind,path,payload,message_id,created_at)
m.make_envelope=retire_before_delivery
calls={"sign":0,"deliver":0}
m.sign_envelope=lambda cfg,envelope:(calls.__setitem__("sign",calls["sign"]+1) or "fixture-signature")
m.deliver=lambda cfg,path,envelope,signature:(calls.__setitem__("deliver",calls["deliver"]+1) or {"ok":True})
rejected=False
try: m.scan({"DONATION_BRIDGE_KEY_ID":"fixture-key"},db,True)
except RuntimeError as e: rejected=str(e) in ("outbound_provision_classification_forbidden","observation_address_classification_forbidden")
obs=db.execute("SELECT count(*),sum(CASE WHEN delivery_status='queued' THEN 1 ELSE 0 END) FROM observations").fetchone()
classification=db.execute("SELECT classification FROM addresses WHERE receiver_address_id=?",(receiver_id,)).fetchone()[0]
print("SCAN_RACE_REJECTED="+("YES" if rejected else "NO"))
print("SCAN_RACE_SIGN="+str(calls["sign"]))
print("SCAN_RACE_DELIVER="+str(calls["deliver"]))
print("SCAN_RACE_OBSERVATIONS="+str(obs[0]))
print("SCAN_RACE_QUEUED="+str(obs[1]))
print("SCAN_RACE_CLASSIFICATION="+classification)
db.close()
`;
    const scanRace = spawnSync("python3", ["-c", scanRacePy, "scripts/btc-donation-receiver-agent.py", join(temp, "scan-race.sqlite3")], { encoding: "utf8" });
    assert.equal(scanRace.status, 0, scanRace.stderr);
    assert.match(scanRace.stdout, /SCAN_RACE_REJECTED=YES/);
    assert.match(scanRace.stdout, /SCAN_RACE_SIGN=0/);
    assert.match(scanRace.stdout, /SCAN_RACE_DELIVER=0/);
    assert.match(scanRace.stdout, /SCAN_RACE_OBSERVATIONS=1/);
    assert.match(scanRace.stdout, /SCAN_RACE_QUEUED=1/);
    assert.match(scanRace.stdout, /SCAN_RACE_CLASSIFICATION=INTEGRATION_TEST_RETIRED/);
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
  console.log("BTC_DONATION_BRIDGE_ACCEPTANCE=PASS");
  console.log("ledger=signature,tamper,path,kind,key,address_state,spv_contract,block_hash,secret_boundary,tor_agent");
  console.log("BLOCK_HASH_NULL_CONFIRMED_REJECTED=PASS");
  console.log("PUBLIC_SUPPORT_ELIGIBLE_OUTBOUND=PASS");
  console.log("PUBLIC_SUPPORT_POST_RECEIPT_TERMINAL=PASS");
  console.log("PUBLIC_SUPPORT_TERMINAL_NEVER_OUTBOUND=PASS");
  console.log("PUBLIC_SUPPORT_PROVISION_WIRE_PAYLOAD_UNCHANGED=PASS");
}
run().catch((error) => { console.error("BTC_DONATION_BRIDGE_ACCEPTANCE=FAIL"); console.error(error instanceof Error ? error.message : "unknown_error"); process.exitCode = 1; });
