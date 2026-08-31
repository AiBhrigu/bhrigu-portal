import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import {
  BTC_DIRECT_SERVICE_MS, BTC_DIRECT_USD_PRICE_CENTS, createBtcDirectQuote,
  type BtcDirectQuoteRecord,
} from "../lib/btc-direct-payment";
import {
  activatePhiBtcTimingWindowsRecord, admitPhiBtcTimingWindowsRun,
  assertPhiBtcTimingWindowsPaymentCompatibility, isPhiBtcTimingWindowsOrderRecord,
  newPhiBtcTimingWindowsIdentity, parsePhiBtcTimingWindowsCookie,
  PHI_BTC_TIMING_WINDOWS_CLOSEOUT_GRACE_MS, PHI_BTC_TIMING_WINDOWS_CONTRACT,
  PHI_BTC_TIMING_WINDOWS_MAX_RUN_COST_MICROS, PHI_BTC_TIMING_WINDOWS_MAX_TOTAL_COST_MICROS,
  PHI_BTC_TIMING_WINDOWS_RUNS, PHI_BTC_TIMING_WINDOWS_SERVICE_MS,
  phiBtcTimingWindowsCookie, verifyPhiBtcTimingWindowsSecret,
} from "../lib/phi-btc-timing-windows-v1";
import {
  assertPhiTimingWindowsRunDue, buildPhiTimingWindowsQuestion, buildPhiTimingWindowsRunResult,
  createPhiTimingWindowsRunCostGuard, isPhiTimingWindowsPreviewExecutionConfigured, nextPhiTimingWindowsSlot, phiTimingWindowsScheduledAt,
  phiTimingWindowsUsageSummary, verifyPhiTimingWindowsHashChain,
} from "../lib/phi-btc-timing-windows-execution-v1";
import { getPhiBtcTimingWindowsPreviewConfig } from "../lib/phi-btc-timing-windows-preview-neon";

function fakeResult(slot:string,asOf:string,answer=`Locked result for ${slot}`):any{return{
  schema_version:"btc_clean_chat_v1",ok:true,intent:"MODEL_ORCHESTRATED",completion_state:"COMPLETE",topic:"Bitcoin timing windows",
  answer,as_of:asOf,sources:[],semantic_visual:null,
  evidence:{accepted_snapshot:"USED",snapshot_memory:"USED",binance_current_field:"USED",polymarket_expectation_field:"NOT_REQUESTED",astronomy_field:"USED",astro_btc_bridge:"NOT_REQUESTED",bitcoin_protocol:"NOT_REQUESTED",web_research:"NOT_REQUESTED"},
  boundary:{no_fake_causality:true,no_trading_signal:true,future_not_established_fact:true,polymarket_not_bhrigu_prediction:true,astronomy_not_btc_causality:true,fact_inference_future_unknown_separated:true},
  usage:{provider:"DIRECT_OPENAI_API",model:"gpt-5.6-sol",input_tokens:1000,output_tokens:1000,web_search_calls:0},
};}

async function main(){
  assertPhiBtcTimingWindowsPaymentCompatibility();
  assert.equal(BTC_DIRECT_USD_PRICE_CENTS,4_900); assert.equal(BTC_DIRECT_SERVICE_MS,PHI_BTC_TIMING_WINDOWS_SERVICE_MS);
  assert.equal(PHI_BTC_TIMING_WINDOWS_CONTRACT.maxRuns,6); assert.equal(PHI_BTC_TIMING_WINDOWS_CONTRACT.maxRunCostMicros,800_000);
  assert.equal(PHI_BTC_TIMING_WINDOWS_CONTRACT.maxTotalCostMicros,4_800_000); assert.equal(PHI_BTC_TIMING_WINDOWS_CONTRACT.closeoutGraceHours,24);
  assert.equal(PHI_BTC_TIMING_WINDOWS_CONTRACT.productionActivation,false);
  assert.deepEqual(getPhiBtcTimingWindowsPreviewConfig({VERCEL_ENV:"production",DATABASE_URL:"postgres://x"}),{enabled:false});
  assert.deepEqual(getPhiBtcTimingWindowsPreviewConfig({VERCEL_ENV:"preview"}),{enabled:false});
  assert.equal(getPhiBtcTimingWindowsPreviewConfig({VERCEL_ENV:"preview",DATABASE_URL:"postgres://x"}).enabled,true);
  assert.equal(isPhiTimingWindowsPreviewExecutionConfigured({VERCEL_ENV:"preview",DATABASE_URL:"postgres://x"}),false);
  assert.equal(isPhiTimingWindowsPreviewExecutionConfigured({VERCEL_ENV:"preview",OPENAI_API_KEY:"key"}),false);
  assert.equal(isPhiTimingWindowsPreviewExecutionConfigured({VERCEL_ENV:"preview",OPENAI_API_KEY:"key",BHRIGU_ASTRO_FIELD_URL:"https://astro.example"}),true);
  assert.equal(isPhiTimingWindowsPreviewExecutionConfigured({VERCEL_ENV:"production",OPENAI_API_KEY:"key",BHRIGU_ASTRO_FIELD_URL:"https://astro.example"}),false);

  const identity=newPhiBtcTimingWindowsIdentity("ru"); const pending=identity.record;
  assert.equal(isPhiBtcTimingWindowsOrderRecord(pending),true); assert.equal(pending.product_id,"PHI_BTC_TIMING_WINDOWS_FOUNDING_V1");
  assert.equal(pending.price_usd_cents,4_900); assert.equal(pending.entitlement_state,"PENDING_PAYMENT");
  assert.equal(verifyPhiBtcTimingWindowsSecret(pending,identity.secret),true); assert.equal(verifyPhiBtcTimingWindowsSecret(pending,"wrong-secret"),false);
  const start="2026-09-01T00:00:00.000Z"; const end=new Date(new Date(start).getTime()+PHI_BTC_TIMING_WINDOWS_SERVICE_MS).toISOString();
  const active=activatePhiBtcTimingWindowsRecord(pending,start,end); assert.equal(active.entitlement_state,"ACTIVE");
  assert.throws(()=>activatePhiBtcTimingWindowsRecord(pending,start,new Date(new Date(end).getTime()+1).toISOString()),/payment_window_invalid/);
  const cookie=phiBtcTimingWindowsCookie(active.research_object_id,identity.secret,active.service_end); const rawCookie=cookie.split(";")[0].split("=").slice(1).join("=");
  assert.deepEqual(parsePhiBtcTimingWindowsCookie(rawCookie),{researchObjectId:active.research_object_id,secret:identity.secret});

  const runs:any[]=[];
  for(const slot of PHI_BTC_TIMING_WINDOWS_RUNS){
    assert.equal(nextPhiTimingWindowsSlot(runs),slot);
    const scheduled=phiTimingWindowsScheduledAt(start,slot); const at=new Date(scheduled);
    assert.equal(assertPhiTimingWindowsRunDue(active,runs,slot,at),scheduled);
    const question=buildPhiTimingWindowsQuestion(slot); assert.match(question,/Bitcoin/); assert.match(question,/never rewrite|retroactive/i);
    runs.push(buildPhiTimingWindowsRunResult({order:active,runs,slot,scheduledAt:scheduled,acceptedAt:scheduled,question,result:fakeResult(slot,scheduled)}));
    assert.equal(verifyPhiTimingWindowsHashChain(runs),true);
  }
  assert.equal(nextPhiTimingWindowsSlot(runs),null); assert.equal(runs.length,6); assert.equal(phiTimingWindowsUsageSummary(runs).providerBearingRuns,6);
  const tampered=runs.map(x=>({...x})); tampered[2].answer="rewritten after outcome"; assert.equal(verifyPhiTimingWindowsHashChain(tampered),false);
  const preCloseout=runs.slice(0,5); assert.throws(()=>assertPhiTimingWindowsRunDue(active,preCloseout,"DAY_30_CLOSEOUT",new Date(new Date(end).getTime()-1)),/not_due/);
  assert.doesNotThrow(()=>assertPhiTimingWindowsRunDue(active,preCloseout,"DAY_30_CLOSEOUT",new Date(new Date(end).getTime()+PHI_BTC_TIMING_WINDOWS_CLOSEOUT_GRACE_MS)));
  assert.throws(()=>assertPhiTimingWindowsRunDue(active,preCloseout,"DAY_30_CLOSEOUT",new Date(new Date(end).getTime()+PHI_BTC_TIMING_WINDOWS_CLOSEOUT_GRACE_MS+1)),/grace_closed/);

  assert.deepEqual(admitPhiBtcTimingWindowsRun({providerBearingRuns:0,nominalCostMicros:0},800_000),{allowed:true});
  assert.deepEqual(admitPhiBtcTimingWindowsRun({providerBearingRuns:6,nominalCostMicros:0},1),{allowed:false,code:"RUN_LIMIT"});
  assert.deepEqual(admitPhiBtcTimingWindowsRun({providerBearingRuns:0,nominalCostMicros:0},800_001),{allowed:false,code:"RUN_COST_LIMIT"});
  assert.deepEqual(admitPhiBtcTimingWindowsRun({providerBearingRuns:5,nominalCostMicros:4_100_001},700_000),{allowed:false,code:"TOTAL_COST_LIMIT"});
  assert.equal(PHI_BTC_TIMING_WINDOWS_MAX_RUN_COST_MICROS*6,PHI_BTC_TIMING_WINDOWS_MAX_TOTAL_COST_MICROS);
  const reservations:number[]=[], settlements:number[]=[];
  const guard=createPhiTimingWindowsRunCostGuard({providerBearingRuns:0,nominalCostMicros:0},{reserve:async n=>{reservations.push(n)},settle:async n=>{settlements.push(n)}});
  await guard.beforeProviderCall(200_000); await guard.afterProviderCall({input_tokens:1000,output_tokens:1000,web_search_calls:0});
  assert.equal(guard.actualMicros(),35_000); assert.deepEqual(reservations,[200_000]); assert.deepEqual(settlements,[35_000]);
  await assert.rejects(()=>guard.beforeProviderCall(800_000),/run_cost_limit/); assert.deepEqual(reservations,[200_000]);

  let stored:BtcDirectQuoteRecord|null=null; const fakeStore:any={
    async findQuoteByIdempotencyKey(){return null;},async isAcceptedApplication(id:string){return id===pending.product_order_id;},
    async reserveQuote(input:BtcDirectQuoteRecord){stored={...input,receiverAddressId:"preview_receiver_0001",receiveAddress:"bc1qpreview0000000000000000000000000000000"};return{disposition:"created",quote:stored};},
    async markQuotePending(){if(!stored)throw new Error("missing_quote");stored={...stored,quoteState:"payment_pending"};return stored;},
  };
  const quote=await createBtcDirectQuote({applicationId:pending.product_order_id,idempotencyKey:"timing-windows-preview-quote-0001",store:fakeStore,source:{async fetch(){return{rateDecimal:"100000",sourceTimestamp:start};}},now:()=>new Date(start),quoteId:()=>"btcq_timing_windows_preview_0001"});
  assert.equal(quote.usdPriceCents,4_900); assert.equal(quote.satAmountInteger,"49000"); assert.match(quote.bip321Uri,/^bitcoin:bc1qpreview/);

  const preview=await readFile("pages/crypto-astro/btc/timing-windows-preview.tsx","utf8");
  const privatePage=await readFile("pages/crypto-astro/btc/timing-windows-preview/[researchObjectId].tsx","utf8");
  const storeSource=await readFile("lib/phi-btc-timing-windows-preview-neon.ts","utf8");
  const runApi=await readFile("pages/api/btc/timing-windows/v1/run-preview.ts","utf8");
  assert.match(preview,/VERCEL_ENV\s*!==\s*"preview"/); assert.match(preview,/NO REAL BTC/); assert.match(preview,/\$4\.80/);
  assert.match(privatePage,/SIX-RUN EXECUTION/); assert.match(privatePage,/APPEND-ONLY MEMORY/); assert.match(privatePage,/run-preview/);
  assert.match(storeSource,/PHI_BTC_TIMING_WINDOWS_RUN_RESULT/); assert.match(storeSource,/INSERT INTO access_intake_requests/); assert.match(storeSource,/record=record-'execution_claim'/); assert.match(storeSource,/reserved_cost_micros/); assert.match(storeSource,/persistent_cost_reservation_rejected/);
  assert.match(runApi,/PREVIEW_EXECUTION_NOT_CONFIGURED/); assert.ok(runApi.indexOf("PREVIEW_EXECUTION_NOT_CONFIGURED") < runApi.indexOf("claimPreviewPhiBtcTimingWindowsRun("));
  assert.match(runApi,/runBtcCleanChatModel/); assert.match(runApi,/createPhiTimingWindowsRunCostGuard/); assert.match(runApi,/reservePreviewPhiBtcTimingWindowsRunCost/); assert.match(runApi,/settlePreviewPhiBtcTimingWindowsRunCost/); assert.doesNotMatch(runApi,/previewNow|preview_now|time.?travel/i);
  const productionObserver=await readFile("pages/api/btc-payment/observe.ts","utf8"); assert.doesNotMatch(productionObserver,/phi-btc-timing-windows|PHI_BTC_TIMING_WINDOWS/);
  let chatExists=true; try{await access("pages/api/btc/timing-windows/v1/chat.ts");}catch{chatExists=false;} assert.equal(chatExists,false);
  console.log("PHI_BTC_TIMING_WINDOWS_FOUNDING_V1_ACCEPTANCE=PASS");
}
main().catch(error=>{console.error(error);process.exit(1);});
