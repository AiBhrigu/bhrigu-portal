import assert from "node:assert/strict";
import { generateKeyPairSync, sign } from "node:crypto";
import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { PGlite } from "@electric-sql/pglite";
import {
  DONATION_BRIDGE_PROTOCOL_VERSION,
  donationBridgeSigningBytes,
  donationPayloadHash,
  parseDonationCapacityPayload,
  verifyDonationBridgeEnvelope,
  type DonationBridgeEnvelope,
} from "../lib/btc-donation-bridge";

const labels: string[] = [];
function ok(n: number, label: string, fn: () => void) {
  fn(); labels.push(`${String(n).padStart(2, "0")} ${label}`);
}
const { privateKey, publicKey } = generateKeyPairSync("ed25519");
const publicPem = publicKey.export({ type: "spki", format: "pem" }).toString();
const config = { enabled: true as const, databaseUrl: "postgres://fixture", keyId: "orion-donation-bridge-v1", verifyPublicKeyPem: publicPem };
const createdAt = "2026-08-18T16:30:00.000Z";
function capacityEnvelope(payload: unknown = {}): DonationBridgeEnvelope {
  return { protocolVersion: DONATION_BRIDGE_PROTOCOL_VERSION, keyId: config.keyId, messageId: "don-capacity-fixture-000001",
    messageKind: "capacity_read", createdAt, httpMethod: "POST", requestPath: "/api/donation/bridge/capacity",
    payloadHash: donationPayloadHash(payload), payload };
}
function sig(e: DonationBridgeEnvelope) { return sign(null, donationBridgeSigningBytes(e), privateKey).toString("base64"); }
async function run() {
  const bridge = await readFile("lib/btc-donation-bridge.ts", "utf8");
  const neon = await readFile("lib/btc-donation-bridge-neon.ts", "utf8");
  const endpoint = await readFile("pages/api/donation/bridge/capacity.ts", "utf8");
  const agent = await readFile("scripts/btc-donation-receiver-agent.py", "utf8");
  const e = capacityEnvelope(); const s = sig(e);
  ok(1, "full canonical capacity envelope", () => assert.deepEqual(Object.keys(e).sort(), ["protocolVersion","keyId","messageId","messageKind","createdAt","httpMethod","requestPath","payloadHash","payload"].sort()));
  ok(2, "capacity_read kind accepted", () => assert.equal(verifyDonationBridgeEnvelope({ envelope:e, signatureBase64:s, suppliedKeyId:config.keyId, expectedMethod:"POST", expectedPath:e.requestPath, expectedKind:"capacity_read", config }).messageKind, "capacity_read"));
  ok(3, "old provision and observe kinds preserved", () => assert.match(bridge, /"address_provision" \| "receipt_observation" \| "capacity_read"/));
  ok(4, "missing envelope field rejected", () => { const { payloadHash:_, ...bad }=e; assert.throws(() => verifyDonationBridgeEnvelope({ envelope:bad, signatureBase64:s, suppliedKeyId:config.keyId, expectedMethod:"POST", expectedPath:e.requestPath, expectedKind:"capacity_read", config }), /invalid_envelope/); });
  ok(5, "extra envelope field rejected", () => assert.throws(() => verifyDonationBridgeEnvelope({ envelope:{...e,extra:true}, signatureBase64:s, suppliedKeyId:config.keyId, expectedMethod:"POST", expectedPath:e.requestPath, expectedKind:"capacity_read", config }), /invalid_envelope/));
  ok(6, "non-empty capacity payload rejected", () => assert.throws(() => parseDonationCapacityPayload({x:1}), /invalid_capacity_payload/));
  ok(7, "array capacity payload rejected", () => assert.throws(() => parseDonationCapacityPayload([]), /invalid_capacity_payload/));
  ok(8, "invalid request signature rejected", () => assert.throws(() => verifyDonationBridgeEnvelope({ envelope:e, signatureBase64:Buffer.alloc(64).toString("base64"), suppliedKeyId:config.keyId, expectedMethod:"POST", expectedPath:e.requestPath, expectedKind:"capacity_read", config }), /invalid_signature/));
  ok(9, "auth precedes capacity query", () => assert.ok(endpoint.indexOf("verifyDonationBridgeEnvelope") < endpoint.indexOf("getAvailableCapacity")));
  ok(10, "capacity endpoint has zero store mutation", () => assert.doesNotMatch(endpoint, /recordMessage|provisionAddress|issueAddress|observe\(|markMessageProcessed|INSERT|UPDATE|DELETE/i));
  const capacityDb = new PGlite(); await capacityDb.waitReady;
  let availableCount: unknown;
  try {
    await capacityDb.exec("CREATE TABLE btc_donation_receiver_addresses(receiver_address_id TEXT PRIMARY KEY,state TEXT NOT NULL)");
    await capacityDb.exec("INSERT INTO btc_donation_receiver_addresses VALUES ('a','available'),('i','issued'),('r','retired')");
    const rows = await capacityDb.query<{available_count:number}>("SELECT COUNT(*)::int AS available_count FROM btc_donation_receiver_addresses WHERE state='available'");
    availableCount = rows.rows[0]?.available_count;
  } finally { await capacityDb.close(); }
  ok(11, "issued excluded from capacity", () => { assert.match(neon, /WHERE state='available'/); assert.equal(availableCount,1); });
  ok(12, "retired excluded from capacity", () => assert.equal(availableCount,1));
  ok(13, "COUNT result is safe integer", () => { assert.match(neon, /COUNT\(\*\)::int/); assert.match(neon, /Number\.isSafeInteger/); assert.equal(typeof availableCount,"number"); assert.equal(Number.isSafeInteger(availableCount),true); });
  ok(14, "invalid count fails closed", () => assert.match(neon, /throw new Error\("donation_capacity_invalid"\)/));
  const py = String.raw`
import importlib.util,json,os,sqlite3,sys,tempfile
from datetime import datetime,timedelta,timezone
spec=importlib.util.spec_from_file_location("agent",sys.argv[1]); m=importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
r={}
def settings(**kw):
 d={'MIN_AVAILABLE':3,'TARGET_AVAILABLE':5,'MAX_AVAILABLE':10,'BATCH_SIZE_MAX':2,'DERIVATION_BUDGET_WINDOW':86400,'DERIVATION_BUDGET_MAX':20}; d.update(kw); return d
def db(path): return m.init_db(path)
def insert(d,ts,status='queued',idx=1):
 d.execute('INSERT INTO addresses VALUES(?,?,?,?,?,?)',(f'id{idx}',f'bc1q'+('q'*36)+str(idx%10), 'PUBLIC_SUPPORT_ELIGIBLE',ts,f'msg{idx}',status)); d.commit()
root=tempfile.mkdtemp(); cfg={'DONATION_BRIDGE_STATE_DB':root+'/state.sqlite3','DONATION_BRIDGE_KEY_ID':'fixture'}; d=db(cfg['DONATION_BRIDGE_STATE_DB'])
source=open(sys.argv[1],encoding='utf-8').read()
electrum_calls=[0]
def forbidden_electrum(*args,**kwargs):
 electrum_calls[0]+=1; raise RuntimeError('real_electrum_forbidden')
m.run_electrum=forbidden_electrum
r['15']=source.index('flush_queued(cfg,db)') < source.index('available=read_available_capacity(cfg)')
orig_flush=m.flush_queued; orig_q=m.queued_outbound_provision_count; orig_cap=m.read_available_capacity; orig_budget=m.rolling_derivation_budget_used; orig_prov=m.provision
m.flush_queued=lambda c,x: (_ for _ in ()).throw(RuntimeError('x')); out=m.supervise_locked(cfg,d,settings()); r['16']=out['derivation_attempts']==0 and out['reason']=='queued_flush_failed'
m.flush_queued=lambda c,x: None; m.queued_outbound_provision_count=lambda x:1; out=m.supervise_locked(cfg,d,settings()); r['17']=out['derivation_attempts']==0 and out['reason']=='queued_provision_remaining'
lock1=m.derivation_lock(cfg); lock1.__enter__()
try:
 try: m.derivation_lock(cfg).__enter__(); r['18']=False
 except RuntimeError as e: r['18']=str(e)=='derivation_lock_unavailable'
finally: lock1.__exit__(None,None,None)
manual_cfg={'DONATION_BRIDGE_STATE_DB':root+'/manual/state.sqlite3','DONATION_BRIDGE_KEY_ID':'fixture'}; manual_db=db(manual_cfg['DONATION_BRIDGE_STATE_DB']); manual_calls=[0]
orig_manual_next=m.next_fresh_address; orig_manual_flush=m.flush_queued
m.flush_queued=lambda c,x: None
def fake_manual_next(c,x): manual_calls[0]+=1; raise RuntimeError('ambiguous_derivation')
m.next_fresh_address=fake_manual_next
try:
 try:
  with m.derivation_lock(manual_cfg): m.provision(manual_cfg,manual_db,'PUBLIC_SUPPORT_ELIGIBLE',True)
  manual_hold=False
 except RuntimeError:
  manual_hold=m.derivation_ambiguity_present(manual_cfg)
finally:
 m.next_fresh_address=orig_manual_next; m.flush_queued=orig_manual_flush
r['19']='with derivation_lock(cfg):\n                provision(cfg,db,args.classification,args.deliver)' in source and manual_calls[0]==1 and manual_hold
pre_cfg={'DONATION_BRIDGE_STATE_DB':root+'/preflight/state.sqlite3','DONATION_BRIDGE_KEY_ID':'fixture'}; pre_db=db(pre_cfg['DONATION_BRIDGE_STATE_DB'])
orig_pre_flush=m.flush_queued
m.flush_queued=lambda c,x: (_ for _ in ()).throw(RuntimeError('preflight_flush_failed'))
try:
 try: m.provision(pre_cfg,pre_db,'PUBLIC_SUPPORT_ELIGIBLE',True); preflight_clear=False
 except RuntimeError: preflight_clear=not m.derivation_ambiguity_present(pre_cfg) and m.local_address_count(pre_db)==0
finally: m.flush_queued=orig_pre_flush
r['preflight_clear']=preflight_clear and source.index("mark_derivation_ambiguity(guard_cfg,'derivation_in_progress')") < source.index('address=next_fresh_address(cfg,db)')
lock1=m.derivation_lock(cfg); lock1.__enter__(); d.execute('CREATE TABLE IF NOT EXISTS lock_probe(x INTEGER)'); d.commit()
try:
 try: m.derivation_lock(cfg).__enter__(); r['20']=False
 except RuntimeError as e: r['20']=str(e)=='derivation_lock_unavailable'
finally: lock1.__exit__(None,None,None)
now=datetime(2026,8,18,16,0,0,tzinfo=timezone.utc)
d2=db(root+'/budget.sqlite3'); insert(d2,(now-timedelta(hours=1)).isoformat().replace('+00:00','Z'),'queued',2); insert(d2,(now-timedelta(hours=2)).isoformat().replace('+00:00','Z'),'delivered',3)
r['21']=m.rolling_derivation_budget_used(d2,settings(),now)==2
r['22']=m.rolling_derivation_budget_used(d2,settings(),now)==2
for key,value in [('23','not-a-time'),('24','2026-08-18T15:00:00'),('25','2026-08-18T20:30:00+05:30')]:
 dx=db(root+f'/{key}.sqlite3'); insert(dx,value,'queued',int(key))
 try: m.rolling_derivation_budget_used(dx,settings(),now); r[key]=False
 except RuntimeError: r[key]=True
boundary=db(root+'/boundary.sqlite3'); insert(boundary,(now-timedelta(days=1)).isoformat().replace('+00:00','Z'),'queued',26)
r['26']=m.rolling_derivation_budget_used(boundary,settings(),now)==0
persist=root+'/persist.sqlite3'; dp=db(persist); insert(dp,(now-timedelta(hours=1)).isoformat().replace('+00:00','Z'),'queued',27); dp.close(); dp=db(persist)
r['27']=m.rolling_derivation_budget_used(dp,settings(),now)==1
m.flush_queued=lambda c,x: None; m.queued_outbound_provision_count=lambda x:0
m.read_available_capacity=lambda c:0; m.rolling_derivation_budget_used=lambda x,s:20
out=m.supervise_locked(cfg,d,settings()); r['28']=out['derivation_attempts']==0 and out['reason']=='derivation_budget_exhausted'
counter=[100]
def scenario(available,budget,s,fail=None):
 dx=db(root+f'/s{counter[0]}.sqlite3'); calls=[0]
 m.read_available_capacity=lambda c:available; m.rolling_derivation_budget_used=lambda x,st:budget
 def fake_provision(c,x,classification,send):
  calls[0]+=1; counter[0]+=1
  if fail=='before':
   m.mark_derivation_ambiguity(c,'derivation_in_progress'); raise RuntimeError('before')
  insert(x,now.isoformat().replace('+00:00','Z'),'queued',counter[0])
  if fail=='after':
   m.mark_derivation_ambiguity(c,'resolved'); raise RuntimeError('after')
 m.provision=fake_provision
 return m.supervise_locked(cfg,dx,s),calls[0]
out,calls=scenario(4,0,settings()); r['29']=calls==0 and out['reason']=='capacity_healthy'
out,calls=scenario(3,0,settings()); r['30']=calls==0 and out['reason']=='capacity_healthy'
out,calls=scenario(2,0,settings()); r['31']=calls==2 and out['derive_count']==2
out,calls=scenario(1,0,settings(BATCH_SIZE_MAX=10)); r['32']=calls==4 and out['derive_count']==4
out,calls=scenario(0,0,settings(MAX_AVAILABLE=1,BATCH_SIZE_MAX=10)); r['33']=calls==1 and out['derive_count']==1
out,calls=scenario(0,0,settings(BATCH_SIZE_MAX=2)); r['34']=calls==2 and out['derive_count']==2
out,calls=scenario(0,19,settings(BATCH_SIZE_MAX=10)); r['35']=calls==1 and out['derive_count']==1
r['36']=source.count('next_fresh_address(cfg,db)')==2 and source.count("run_electrum(cfg,'createnewaddress')")==1 and 'provision(cfg,db,SUPERVISOR_CLASSIFICATION,True)' in source
out,calls=scenario(0,0,settings(BATCH_SIZE_MAX=3),fail='after'); r['38']=calls==1 and out['local_rows_created']==1 and out['action']=='derived_local_ambiguous_remote' and not m.derivation_ambiguity_present(cfg)
out,calls=scenario(0,0,settings(BATCH_SIZE_MAX=3),fail='before'); r['37']=calls==1 and out['stopped_by_failure'] and out['local_rows_created']==0 and out['action']=='derivation_state_ambiguous' and m.derivation_ambiguity_present(cfg)
hold=m.supervise_locked(cfg,d,settings()); r['39']=calls==1 and hold['derivation_attempts']==0 and hold['reason']=='derivation_ambiguity_hold'
r['40']=electrum_calls[0]==0
names=['BTC_DONATION_SUPERVISOR_MIN_AVAILABLE','BTC_DONATION_SUPERVISOR_TARGET_AVAILABLE','BTC_DONATION_SUPERVISOR_MAX_AVAILABLE','BTC_DONATION_SUPERVISOR_BATCH_SIZE_MAX','BTC_DONATION_SUPERVISOR_DERIVATION_BUDGET_WINDOW','BTC_DONATION_SUPERVISOR_DERIVATION_BUDGET_MAX']
saved={name:os.environ.get(name) for name in names}
for name in names: os.environ.pop(name,None)
try:
 try: m.supervisor_settings(); missing_failed=False
 except SystemExit as e: missing_failed=str(e)=='missing_supervisor_configuration'
 values=['3','5','10','2','86400','20']
 for name,value in zip(names,values): os.environ[name]=value
 parsed=m.supervisor_settings()
 r['explicit_config']=missing_failed and parsed=={'MIN_AVAILABLE':3,'TARGET_AVAILABLE':5,'MAX_AVAILABLE':10,'BATCH_SIZE_MAX':2,'DERIVATION_BUDGET_WINDOW':86400,'DERIVATION_BUDGET_MAX':20}
finally:
 for name in names: os.environ.pop(name,None)
 for name,value in saved.items():
  if value is not None: os.environ[name]=value
print(json.dumps(r,sort_keys=True))
`;
  const pyRun = spawnSync("python3", ["-c", py, "scripts/btc-donation-receiver-agent.py"], { encoding: "utf8" });
  assert.equal(pyRun.status, 0, pyRun.stderr);
  const pr = JSON.parse(pyRun.stdout.trim()) as Record<string, boolean>;
  assert.equal(pr.explicit_config, true, "production supervisor settings must be explicit");
  assert.equal(pr.preflight_clear, true, "pre-derivation failures must not create false ambiguity holds");
  for (let n=15;n<=40;n++) ok(n, `agent acceptance ${n}`, () => assert.equal(pr[String(n)], true, `case ${n}`));
  ok(41, "agent receives no Neon database credential", () => assert.doesNotMatch(agent, /DATABASE_URL|NEON_/));
  ok(42, "no derivation budget table added", () => { assert.doesNotMatch(agent, /CREATE TABLE IF NOT EXISTS derivation_budget/i); assert.equal((agent.match(/CREATE TABLE IF NOT EXISTS/g) ?? []).length, 2); });
  function unchanged(path: string) {
    const d=spawnSync("git", ["diff","--name-only","df27e06d49c2e4b326b9bb1d35099b1426bdee0d","HEAD","--",path], {encoding:"utf8"});
    assert.equal(d.status,0,d.stderr); assert.equal(d.stdout.trim(),"");
  }
  ok(43, "public session implementation unchanged", () => unchanged("lib/btc-donation-session.ts"));
  ok(44, "provision endpoint unchanged", () => unchanged("pages/api/donation/bridge/provision.ts"));
  ok(45, "observe endpoint unchanged", () => unchanged("pages/api/donation/bridge/observe.ts"));
  assert.equal(labels.length,45);
  for (const label of labels) console.log(`PASS ${label}`);
  console.log("BTC_DONATION_SUPERVISOR_ACCEPTANCE=45/45 PASS");
}
run().catch((error) => { console.error(error); process.exit(1); });
