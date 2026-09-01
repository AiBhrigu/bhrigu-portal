import Head from "next/head";
import { useEffect, useMemo, useState } from "react";

const API="/api/btc/timing-windows/v1";
export async function getServerSideProps({ params, query }: any){
  if(process.env.VERCEL_ENV!=="preview")return{notFound:true};
  return{props:{researchObjectId:String(params.researchObjectId||""),locale:query.lang==="ru"?"ru":"en"}};
}

type StatePayload={product:any;runs:any[];payment_simulation:string;real_btc:false};
export default function TimingWindowsPrivatePreview({researchObjectId,locale}:{researchObjectId:string;locale:"en"|"ru"}){
  const [state,setState]=useState<StatePayload|null>(null); const [status,setStatus]=useState("Opening private object…"); const [busy,setBusy]=useState(false); const ru=locale==="ru";
  async function load(){const r=await fetch(`${API}/state`,{credentials:"same-origin",cache:"no-store"});if(!r.ok)throw new Error("PRIVATE_OBJECT_UNAVAILABLE");const p=await r.json();setState(p);setStatus("");return p;}
  useEffect(()=>{let dead=false;(async()=>{try{
    const secret=location.hash.startsWith("#")?location.hash.slice(1):"";
    if(secret){const r=await fetch(`${API}/session`,{method:"POST",headers:{"Content-Type":"application/json"},credentials:"same-origin",body:JSON.stringify({researchObjectId,secret})});if(!r.ok)throw new Error("PRIVATE_OBJECT_UNAVAILABLE");history.replaceState(null,"",`${location.pathname}${location.search}`);}
    if(!dead)await load();
  }catch{if(!dead)setStatus("Private object unavailable. Open the original private link.");}})();return()=>{dead=true};},[researchObjectId]);
  async function activate(){setBusy(true);try{const r=await fetch(`${API}/activate-preview-entitlement`,{method:"POST",credentials:"same-origin"});if(!r.ok)throw new Error("ACTIVATION_FAILED");await load();}catch(e){setStatus(e instanceof Error?e.message:"ACTIVATION_FAILED");}finally{setBusy(false);}}
  async function runNext(){if(!state?.product?.nextSlot)return;setBusy(true);setStatus(ru?"Исследовательский run выполняется…":"Research run is executing…");try{const r=await fetch(`${API}/run-preview`,{method:"POST",headers:{"Content-Type":"application/json"},credentials:"same-origin",body:JSON.stringify({slot:state.product.nextSlot})});const payload=await r.json();if(!r.ok)throw new Error(payload.code||"RESEARCH_RUN_UNAVAILABLE");await load();}catch(e){setStatus(e instanceof Error?e.message:"RESEARCH_RUN_UNAVAILABLE");}finally{setBusy(false);}}
  const p=state?.product; const now=Date.now(); const nextDue=useMemo(()=>p?.nextScheduledAt?new Date(p.nextScheduledAt).getTime():null,[p?.nextScheduledAt]); const due=Boolean(p?.nextSlot&&nextDue!==null&&now>=nextDue);
  return <><Head><title>Φ BTC Timing Windows · Private Preview</title><meta name="robots" content="noindex,nofollow,noarchive"/></Head>
    <main className="page"><section className="shell"><div className="eyebrow">Φ BTC TIMING WINDOWS · PRIVATE PREVIEW</div>
      <h1>{ru?"30-дневный исследовательский объект":"30-day research object"}</h1>
      <div className="boundary">PREVIEW ONLY · NO REAL BTC · SIX-RUN EXECUTION · HARD COST GUARD · APPEND-ONLY MEMORY</div>
      {status&&<div className="notice">{status}</div>}
      {p&&<><section className="grid">
        <div><small>ENTITLEMENT</small><strong>{p.entitlementState}</strong></div>
        <div><small>RUNS</small><strong>{p.providerBearingRuns} / {p.maxRuns}</strong></div>
        <div><small>COST</small><strong>${(p.nominalCostMicros/1_000_000).toFixed(4)} / $4.80</strong></div>
        <div><small>MEMORY</small><strong>{p.hashChainValid?"HASH-CHAIN OK":"INVALID"}</strong></div>
      </section><section className="panel ids"><div><small>PRODUCT_ORDER_ID</small><p>{p.productOrderId}</p></div><div><small>RESEARCH_OBJECT_ID</small><p>{p.researchObjectId}</p></div></section>
      {p.entitlementState==="PENDING_PAYMENT"&&<section className="panel"><h2>Payment → entitlement simulation</h2><p>{ru?"Симулируется только подтверждение оплаты. Quote, адрес, транзакция и реальный BTC отсутствуют.":"Only paid confirmation is simulated. There is no quote, address, transaction or real BTC."}</p><button disabled={busy} onClick={activate}>{busy?"…":(ru?"Симулировать PAID_CONFIRMED → ACTIVE":"Simulate PAID_CONFIRMED → ACTIVE")}</button></section>}
      {p.entitlementState==="ACTIVE"&&<section className="panel"><h2>{ru?"Шесть фиксированных research runs":"Six fixed research runs"}</h2><div className="runs">{p.runSlots.map((x:string)=><span key={x} data-done={state?.runs.some(r=>r.slot===x)?"1":"0"}>{x}</span>)}</div>
        {p.nextSlot&&<div className="next"><small>NEXT RUN</small><strong>{p.nextSlot}</strong><span>{p.nextScheduledAt?new Date(p.nextScheduledAt).toLocaleString():"—"}</span><button disabled={busy||!due||!p.executionEnabled} onClick={runNext}>{busy?"…":!p.executionEnabled?(ru?"Preview provider не подключён":"Preview provider not bound"):due?(ru?"Выполнить research run":"Execute research run"):(ru?"Ещё не наступил":"Not due yet")}</button></div>}
        {!p.nextSlot&&<p className="complete">30-DAY OBJECT · COMPLETE</p>}
        <p className="muted">{ru?"Каждый принятый результат добавляется как отдельная неизменяемая запись. D30 имеет 24-часовой delivery grace; это не продление 30-дневного research window.":"Each accepted result is appended as a separate immutable entry. D30 has a 24-hour delivery grace; this does not extend the 30-day research window."}</p></section>}
      {state?.runs?.map((run:any)=><article className="ledger" key={run.run_id}><header><span>{run.slot}</span><time>{new Date(run.accepted_at).toLocaleString()}</time></header><p className="answer">{run.answer}</p><footer><span>COST ${(run.usage.nominal_cost_micros/1_000_000).toFixed(4)}</span><span>HASH {run.entry_hash.slice(0,12)}…</span></footer></article>)}
      </>}
    </section><style jsx>{`
      .page{min-height:100vh;background:#07111b;color:#edf3f7;padding:48px 18px 70px;font-family:Inter,system-ui,sans-serif}.shell{max-width:900px;margin:auto}.eyebrow,small{color:#d8ad62;font-size:11px;letter-spacing:.12em}h1{font:400 clamp(38px,6vw,62px)/1 Georgia,serif;margin:14px 0}.boundary,.notice,.panel,.grid,.ledger{border:1px solid #ffffff20;background:#ffffff08;border-radius:16px}.boundary,.notice{padding:12px 15px;margin:18px 0;color:#b8c5cf}.grid{display:grid;grid-template-columns:repeat(4,1fr);overflow:hidden}.grid>div{padding:15px;background:#0a1723;display:grid;gap:7px}.panel{padding:20px;margin-top:18px}.ids{display:grid;grid-template-columns:1fr 1fr;gap:18px}.ids p{overflow-wrap:anywhere}.panel p{color:#ffffffa8;line-height:1.55}.runs{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:#ffffff14}.runs span{padding:12px;background:#0a1723;color:#ffffff65;font:11px ui-monospace,monospace}.runs span[data-done="1"]{color:#d8ad62}.next{display:grid;grid-template-columns:auto 1fr auto auto;align-items:center;gap:12px;margin-top:18px;padding:14px;border:1px solid #ffffff16;border-radius:12px}.next strong{color:#e7cc8e}.next span{color:#ffffff80;font-size:12px}.muted{font-size:12px}.complete{color:#d8ad62!important;letter-spacing:.1em}.ledger{padding:20px;margin-top:18px}.ledger header,.ledger footer{display:flex;justify-content:space-between;gap:16px;color:#ffffff6d;font:11px ui-monospace,monospace}.ledger header span{color:#d8ad62}.answer{white-space:pre-wrap;line-height:1.65;color:#eef3f5}.ledger footer{border-top:1px solid #ffffff12;padding-top:12px}button{border:1px solid #d8ad6299;background:#172536;color:#f3dfb7;border-radius:12px;padding:11px 15px;font-weight:650}button:disabled{opacity:.45}@media(max-width:700px){.grid,.ids{grid-template-columns:1fr 1fr}.runs{grid-template-columns:1fr}.next{grid-template-columns:1fr}}@media(max-width:440px){.grid,.ids{grid-template-columns:1fr}}
    `}</style></main></>;
}
