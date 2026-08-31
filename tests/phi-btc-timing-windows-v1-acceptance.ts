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
  PHI_BTC_TIMING_WINDOWS_CONTRACT, PHI_BTC_TIMING_WINDOWS_MAX_RUN_COST_MICROS,
  PHI_BTC_TIMING_WINDOWS_MAX_TOTAL_COST_MICROS, PHI_BTC_TIMING_WINDOWS_SERVICE_MS,
  phiBtcTimingWindowsCookie, verifyPhiBtcTimingWindowsSecret,
} from "../lib/phi-btc-timing-windows-v1";
import { getPhiBtcTimingWindowsPreviewConfig } from "../lib/phi-btc-timing-windows-preview-neon";

async function main(){
  assertPhiBtcTimingWindowsPaymentCompatibility();
  assert.equal(BTC_DIRECT_USD_PRICE_CENTS,4_900);
  assert.equal(BTC_DIRECT_SERVICE_MS,PHI_BTC_TIMING_WINDOWS_SERVICE_MS);
  assert.equal(PHI_BTC_TIMING_WINDOWS_CONTRACT.maxRuns,6);
  assert.equal(PHI_BTC_TIMING_WINDOWS_CONTRACT.productionActivation,false);
  assert.deepEqual(getPhiBtcTimingWindowsPreviewConfig({VERCEL_ENV:"production",DATABASE_URL:"postgres://x"}),{enabled:false});
  assert.deepEqual(getPhiBtcTimingWindowsPreviewConfig({VERCEL_ENV:"preview"}),{enabled:false});
  assert.equal(getPhiBtcTimingWindowsPreviewConfig({VERCEL_ENV:"preview",DATABASE_URL:"postgres://x"}).enabled,true);
  const identity=newPhiBtcTimingWindowsIdentity("ru"); const record=identity.record;
  assert.equal(isPhiBtcTimingWindowsOrderRecord(record),true);
  assert.equal(record.product_id,"PHI_BTC_TIMING_WINDOWS_FOUNDING_V1");
  assert.equal(record.price_usd_cents,4_900); assert.equal(record.entitlement_state,"PENDING_PAYMENT");
  assert.equal(verifyPhiBtcTimingWindowsSecret(record,identity.secret),true);
  assert.equal(verifyPhiBtcTimingWindowsSecret(record,"wrong-secret"),false);
  const cookie=phiBtcTimingWindowsCookie(record.research_object_id,identity.secret,null);
  const rawCookie=cookie.split(";")[0].split("=").slice(1).join("=");
  assert.deepEqual(parsePhiBtcTimingWindowsCookie(rawCookie),{researchObjectId:record.research_object_id,secret:identity.secret});
  const start="2026-09-01T00:00:00.000Z";
  const end=new Date(new Date(start).getTime()+PHI_BTC_TIMING_WINDOWS_SERVICE_MS).toISOString();
  const active=activatePhiBtcTimingWindowsRecord(record,start,end);
  assert.equal(active.entitlement_state,"ACTIVE"); assert.equal(active.service_start,start); assert.equal(active.service_end,end);
  assert.throws(()=>activatePhiBtcTimingWindowsRecord(record,start,new Date(new Date(end).getTime()+1).toISOString()),/payment_window_invalid/);

  assert.deepEqual(admitPhiBtcTimingWindowsRun({providerBearingRuns:0,nominalCostMicros:0},800_000),{allowed:true});
  assert.deepEqual(admitPhiBtcTimingWindowsRun({providerBearingRuns:6,nominalCostMicros:0},1),{allowed:false,code:"RUN_LIMIT"});
  assert.deepEqual(admitPhiBtcTimingWindowsRun({providerBearingRuns:0,nominalCostMicros:0},800_001),{allowed:false,code:"RUN_COST_LIMIT"});
  assert.deepEqual(admitPhiBtcTimingWindowsRun({providerBearingRuns:5,nominalCostMicros:4_100_001},700_000),{allowed:false,code:"TOTAL_COST_LIMIT"});
  assert.equal(PHI_BTC_TIMING_WINDOWS_MAX_RUN_COST_MICROS*6,PHI_BTC_TIMING_WINDOWS_MAX_TOTAL_COST_MICROS);
  let stored:BtcDirectQuoteRecord|null=null;
  const fakeStore:any={
    async findQuoteByIdempotencyKey(){return null;},
    async isAcceptedApplication(id:string){return id===record.product_order_id;},
    async reserveQuote(input:BtcDirectQuoteRecord){stored={...input,receiverAddressId:"preview_receiver_0001",receiveAddress:"bc1qpreview0000000000000000000000000000000"};return{disposition:"created",quote:stored};},
    async markQuotePending(){if(!stored)throw new Error("missing_quote");stored={...stored,quoteState:"payment_pending"};return stored;},
  };
  const quote=await createBtcDirectQuote({
    applicationId:record.product_order_id,idempotencyKey:"timing-windows-preview-quote-0001",store:fakeStore,
    source:{async fetch(){return{rateDecimal:"100000",sourceTimestamp:start};}},now:()=>new Date(start),quoteId:()=>"btcq_timing_windows_preview_0001",
  });
  assert.equal(quote.usdPriceCents,4_900); assert.equal(quote.satAmountInteger,"49000");
  assert.equal(quote.quoteState,"payment_pending"); assert.match(quote.bip321Uri,/^bitcoin:bc1qpreview/);

  const preview=await readFile("pages/crypto-astro/btc/timing-windows-preview.tsx","utf8");
  const privatePage=await readFile("pages/crypto-astro/btc/timing-windows-preview/[researchObjectId].tsx","utf8");
  const storeSource=await readFile("lib/phi-btc-timing-windows-preview-neon.ts","utf8");
  const createApi=await readFile("pages/api/btc/timing-windows/v1/create-preview-order.ts","utf8");
  const activateApi=await readFile("pages/api/btc/timing-windows/v1/activate-preview-entitlement.ts","utf8");
  assert.match(preview,/VERCEL_ENV\s*!==\s*"preview"/); assert.match(preview,/noindex,nofollow,noarchive/); assert.match(preview,/NO REAL BTC/);
  assert.match(privatePage,/MODEL EXECUTION DISABLED/); assert.match(privatePage,/noindex,nofollow,noarchive/);
  assert.match(storeSource,/env\.VERCEL_ENV !== "preview"/); assert.match(storeSource,/env\.DATABASE_URL/);
  assert.match(storeSource,/access_intake_requests/); assert.doesNotMatch(storeSource,/btc_research_fields|btc_research_field_usage|btc_research_field_checkpoints/);
  assert.match(createApi,/PREVIEW_NOT_CHARGED/); assert.match(createApi,/real_btc: false/);
  assert.match(activateApi,/PAID_CONFIRMED_PREVIEW_ONLY/); assert.match(activateApi,/real_btc: false/);
  const productionObserver=await readFile("pages/api/btc-payment/observe.ts","utf8");
  assert.doesNotMatch(productionObserver,/phi-btc-timing-windows|PHI_BTC_TIMING_WINDOWS/);
  const migration=await readFile("migrations/20260809_access_private_intake_v1.sql","utf8"); assert.match(migration,/CREATE TABLE IF NOT EXISTS access_intake_requests/);
  let chatExists=true; try{await access("pages/api/btc/timing-windows/v1/chat.ts");}catch{chatExists=false;} assert.equal(chatExists,false);
  console.log("PHI_BTC_TIMING_WINDOWS_FOUNDING_V1_ACCEPTANCE=PASS");
}
main().catch(error=>{console.error(error);process.exit(1);});
