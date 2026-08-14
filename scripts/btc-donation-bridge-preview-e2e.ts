import assert from "node:assert/strict";
import { generateKeyPairSync, randomUUID, sign, createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { neon } from "@neondatabase/serverless";
import {
  DONATION_BRIDGE_PROTOCOL_VERSION, donationBridgeSigningBytes, donationPayloadHash,
  parseDonationAddressProvisionPayload, parseDonationObservationPayload, verifyDonationBridgeEnvelope,
  type DonationBridgeEnvelope,
} from "../lib/btc-donation-bridge";
import { createNeonBtcDonationBridgeStore } from "../lib/btc-donation-bridge-neon";

const TARGET_BRANCH = "agent/bhrigu-donation-watch-only-bridge-v0-1";
const PROVISION_PATH = "/api/donation/bridge/provision";
const OBSERVE_PATH = "/api/donation/bridge/observe";

async function run() {
  if (process.env.VERCEL_ENV !== "preview" || process.env.VERCEL_GIT_COMMIT_REF !== TARGET_BRANCH) {
    console.log("BTC_DONATION_BRIDGE_PREVIEW_E2E=SKIP_NON_TARGET"); return;
  }
  const databaseUrl = process.env.DATABASE_URL?.trim(); assert(databaseUrl, "DATABASE_URL required");
  const sql = neon(databaseUrl);
  await sql.query(await readFile("migrations/20260815_btc_donation_bridge_v1.sql", "utf8"));
  const store = createNeonBtcDonationBridgeStore(databaseUrl);
  const runId = randomUUID().replace(/-/g, "").slice(0, 16);
  const prefix = `preview_don_${runId}`;
  const previewAddressAlphabet = "qpzry9x8";
  const fakeAddress = (i:number) => `bc1q${"q".repeat(37)}${previewAddressAlphabet[i % previewAddressAlphabet.length]}`;
  const tx = (label:string) => createHash("sha256").update(`${runId}:${label}`).digest("hex");
  const { privateKey, publicKey } = generateKeyPairSync("ed25519");
  const config = { enabled:true as const, databaseUrl, keyId:`preview-${runId}`, verifyPublicKeyPem:publicKey.export({type:"spki",format:"pem"}).toString() };
  const now = () => new Date();
  function env(kind:"address_provision"|"receipt_observation",path:string,payload:any,id:string):DonationBridgeEnvelope {
    return {protocolVersion:DONATION_BRIDGE_PROTOCOL_VERSION,keyId:config.keyId,messageId:id,messageKind:kind,createdAt:now().toISOString(),httpMethod:"POST",requestPath:path,payloadHash:donationPayloadHash(payload),payload};
  }
  function auth(e:DonationBridgeEnvelope){return sign(null,donationBridgeSigningBytes(e),privateKey).toString("base64");}
  try {
    const N=8;
    for(let i=0;i<N;i++){
      const payload=parseDonationAddressProvisionPayload({receiverAddressId:`${prefix}_addr_${i}`,receiveAddress:fakeAddress(i),createdAt:now().toISOString()});
      const e=env("address_provision",PROVISION_PATH,payload,`${prefix}_msg_provision_${i}`);
      const validSignature=auth(e);
      verifyDonationBridgeEnvelope({envelope:e,signatureBase64:validSignature,suppliedKeyId:config.keyId,expectedMethod:"POST",expectedPath:PROVISION_PATH,expectedKind:"address_provision",config,now});
      assert.throws(()=>verifyDonationBridgeEnvelope({envelope:e,signatureBase64:Buffer.alloc(64).toString("base64"),suppliedKeyId:config.keyId,expectedMethod:"POST",expectedPath:PROVISION_PATH,expectedKind:"address_provision",config,now}),/invalid_signature/);
      assert.throws(()=>verifyDonationBridgeEnvelope({envelope:{...e,payload:{...payload,receiveAddress:fakeAddress((i+1)%N)}},signatureBase64:validSignature,suppliedKeyId:config.keyId,expectedMethod:"POST",expectedPath:PROVISION_PATH,expectedKind:"address_provision",config,now}),/tampered_payload/);
      assert(!/seed|private.?key|wallet.?password|master.?public|xpub|zpub/i.test(JSON.stringify(e)));
      assert.equal(await store.recordMessage(e),"accepted"); assert.equal(await store.provisionAddress(payload),"created"); await store.markMessageProcessed(e.messageId,now().toISOString());
      assert.equal(await store.recordMessage(e),"replay"); assert.equal(await store.provisionAddress(payload),"replay");
    }
    const provisioned=await sql`SELECT count(*)::int n,count(DISTINCT receive_address)::int u FROM btc_donation_receiver_addresses WHERE receiver_address_id LIKE ${`${prefix}%`}`;
    assert.equal(provisioned[0].n,N); assert.equal(provisioned[0].u,N);
    const conflictPayload={receiverAddressId:`${prefix}_conflict`,receiveAddress:fakeAddress(0),createdAt:now().toISOString()};
    assert.equal(await store.provisionAddress(conflictPayload),"conflict");
    const issued=await store.issueAddress(`${prefix}_session_1`,now().toISOString()); assert(issued); const issuedId=String(issued.receiver_address_id);
    const mempoolPayload=parseDonationObservationPayload({receiverAddressId:issuedId,txid:tx("one"),txVout:0,observedSats:"12345",confirmations:0,blockHeight:null,blockHash:null,observedAt:now().toISOString(),spvVerified:false});
    let e=env("receipt_observation",OBSERVE_PATH,mempoolPayload,`${prefix}_msg_obs_1`); verifyDonationBridgeEnvelope({envelope:e,signatureBase64:auth(e),suppliedKeyId:config.keyId,expectedMethod:"POST",expectedPath:OBSERVE_PATH,expectedKind:"receipt_observation",config,now});
    assert.equal(await store.recordMessage(e),"accepted"); let r=await store.observe(mempoolPayload); assert.equal(r.receipt_state,"mempool_seen"); assert.equal(Boolean(r.quarantined),false); await store.markMessageProcessed(e.messageId,now().toISOString());
    const confirmedPayload=parseDonationObservationPayload({...mempoolPayload,confirmations:1,blockHeight:"900001",blockHash:tx("block"),observedAt:now().toISOString(),spvVerified:true});
    e=env("receipt_observation",OBSERVE_PATH,confirmedPayload,`${prefix}_msg_obs_2`); assert.equal(await store.recordMessage(e),"accepted"); r=await store.observe(confirmedPayload); assert.equal(r.receipt_state,"confirmed"); await store.markMessageProcessed(e.messageId,now().toISOString());
    await assert.rejects(store.observe({...confirmedPayload,observedSats:"12346",observedAt:now().toISOString()}),/economic_output_conflict/);
    const lostPayload=parseDonationObservationPayload({...mempoolPayload,observedAt:now().toISOString()});
    e=env("receipt_observation",OBSERVE_PATH,lostPayload,`${prefix}_msg_obs_3`); assert.equal(await store.recordMessage(e),"accepted"); r=await store.observe(lostPayload); assert.equal(r.receipt_state,"confirmation_lost"); await store.markMessageProcessed(e.messageId,now().toISOString());
    const unissuedRows=await sql`SELECT receiver_address_id FROM btc_donation_receiver_addresses WHERE receiver_address_id LIKE ${`${prefix}%`} AND state='available' ORDER BY receiver_address_id LIMIT 1`; assert(unissuedRows[0]); const unissuedId=String(unissuedRows[0].receiver_address_id);
    const quarantinePayload=parseDonationObservationPayload({receiverAddressId:unissuedId,txid:tx("unissued"),txVout:1,observedSats:"2222",confirmations:0,blockHeight:null,blockHash:null,observedAt:now().toISOString(),spvVerified:false});
    e=env("receipt_observation",OBSERVE_PATH,quarantinePayload,`${prefix}_msg_obs_4`); assert.equal(await store.recordMessage(e),"accepted"); r=await store.observe(quarantinePayload); assert.equal(Boolean(r.quarantined),true); await store.markMessageProcessed(e.messageId,now().toISOString());
    const retired=await sql`SELECT state FROM btc_donation_receiver_addresses WHERE receiver_address_id=${unissuedId}`; assert.equal(retired[0].state,"retired");
    const sessions=Array.from({length:4},(_,i)=>`${prefix}_session_race_${i}`); const race=await Promise.all(sessions.map(s=>store.issueAddress(s,now().toISOString()))); assert.equal(race.filter(Boolean).length,4); assert.equal(new Set(race.map(x=>x?.receiver_address_id)).size,4);
    const addressIds=race.map(x=>String(x!.receiver_address_id));
    for(let i=0;i<addressIds.length;i++){
      const p=parseDonationObservationPayload({receiverAddressId:addressIds[i],txid:tx(`race-${i}`),txVout:0,observedSats:String(3000+i),confirmations:0,blockHeight:null,blockHash:null,observedAt:now().toISOString(),spvVerified:false});
      await store.observe(p);
    }
    let stateRegressionBlocked=false; try{await sql.query("UPDATE btc_donation_receiver_addresses SET state='available',issued_session_id=NULL,issued_at=NULL WHERE receiver_address_id=$1",[issuedId]);}catch{stateRegressionBlocked=true;} assert.equal(stateRegressionBlocked,true);
    console.log("BTC_DONATION_BRIDGE_PREVIEW_E2E=PASS");
    console.log("ledger=signed_provision,signature_verify,replay,unique_addresses,atomic_pool,mempool,spv_confirm,economic_immutability,confirmation_loss,unissued_quarantine,address_no_reuse,cleanup_pending");
  } finally {
    await sql`DELETE FROM btc_donation_receipts WHERE receiver_address_id LIKE ${`${prefix}%`}`;
    await sql`DELETE FROM btc_donation_receiver_addresses WHERE receiver_address_id LIKE ${`${prefix}%`}`;
    await sql`DELETE FROM btc_donation_bridge_messages WHERE message_id LIKE ${`${prefix}%`}`;
    const residue=await sql`SELECT
      (SELECT count(*)::int FROM btc_donation_receipts WHERE receiver_address_id LIKE ${`${prefix}%`}) receipts,
      (SELECT count(*)::int FROM btc_donation_receiver_addresses WHERE receiver_address_id LIKE ${`${prefix}%`}) addresses,
      (SELECT count(*)::int FROM btc_donation_bridge_messages WHERE message_id LIKE ${`${prefix}%`}) messages`;
    assert.equal(residue[0].receipts,0); assert.equal(residue[0].addresses,0); assert.equal(residue[0].messages,0);
    console.log("BTC_DONATION_BRIDGE_PREVIEW_SYNTHETIC_RESIDUE=ZERO");
  }
}
run().catch(error=>{console.error("BTC_DONATION_BRIDGE_PREVIEW_E2E=FAIL");console.error(error instanceof Error?error.message:"unknown_error");process.exitCode=1;});
