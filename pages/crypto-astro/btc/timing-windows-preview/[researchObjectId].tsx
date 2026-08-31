import Head from "next/head";
import { useEffect, useState } from "react";

const API="/api/btc/timing-windows/v1";
export async function getServerSideProps({ params, query }: any){
  if(process.env.VERCEL_ENV!=="preview")return{notFound:true};
  return{props:{researchObjectId:String(params.researchObjectId||""),locale:query.lang==="ru"?"ru":"en"}};
}

export default function TimingWindowsPrivatePreview({researchObjectId,locale}:{researchObjectId:string;locale:"en"|"ru"}){
  const [state,setState]=useState<any>(null); const [status,setStatus]=useState("Opening private object…"); const [busy,setBusy]=useState(false); const ru=locale==="ru";
  async function load(){const r=await fetch(`${API}/state`,{credentials:"same-origin",cache:"no-store"});if(!r.ok)throw new Error("PRIVATE_OBJECT_UNAVAILABLE");const p=await r.json();setState(p);setStatus("");return p;}
  useEffect(()=>{let dead=false;(async()=>{try{
    const secret=location.hash.startsWith("#")?location.hash.slice(1):"";
    if(secret){const r=await fetch(`${API}/session`,{method:"POST",headers:{"Content-Type":"application/json"},credentials:"same-origin",body:JSON.stringify({researchObjectId,secret})});if(!r.ok)throw new Error("PRIVATE_OBJECT_UNAVAILABLE");history.replaceState(null,"",`${location.pathname}${location.search}`);}
    if(!dead)await load();
  }catch{if(!dead)setStatus("Private object unavailable. Open the original private link.");}})();return()=>{dead=true};},[researchObjectId]);
  async function activate(){setBusy(true);try{const r=await fetch(`${API}/activate-preview-entitlement`,{method:"POST",credentials:"same-origin"});if(!r.ok)throw new Error("ACTIVATION_FAILED");await load();}catch(e){setStatus(e instanceof Error?e.message:"ACTIVATION_FAILED");}finally{setBusy(false);}}
  const p=state?.product;
  return <><Head><title>Φ BTC Timing Windows · Private Preview</title><meta name="robots" content="noindex,nofollow,noarchive"/></Head>
    <main className="page"><section className="shell"><div className="eyebrow">Φ BTC TIMING WINDOWS · PRIVATE PREVIEW</div>
      <h1>{ru?"30-дневный исследовательский объект":"30-day research object"}</h1>
      <div className="boundary">PREVIEW ONLY · NO REAL BTC · MODEL EXECUTION DISABLED</div>
      {status&&<div className="notice">{status}</div>}
      {p&&<><section className="grid">
        <div><small>ENTITLEMENT</small><strong>{p.entitlementState}</strong></div>
        <div><small>RUNS</small><strong>{p.providerBearingRuns} / {p.maxRuns}</strong></div>
        <div><small>COST</small><strong>$0.0000 / $4.80</strong></div>
        <div><small>SERVICE END</small><strong>{p.serviceEnd?new Date(p.serviceEnd).toLocaleString():"after activation"}</strong></div>
      </section><section className="panel ids"><div><small>PRODUCT_ORDER_ID</small><p>{p.productOrderId}</p></div><div><small>RESEARCH_OBJECT_ID</small><p>{p.researchObjectId}</p></div></section>
      {p.entitlementState==="PENDING_PAYMENT"&&<section className="panel"><h2>{ru?"Payment → entitlement simulation":"Payment → entitlement simulation"}</h2><p>{ru?"Симулируется только подтверждение оплаты. Quote, адрес, транзакция и реальный BTC отсутствуют.":"Only paid confirmation is simulated. There is no quote, address, transaction or real BTC."}</p><button disabled={busy} onClick={activate}>{busy?"…":(ru?"Симулировать PAID_CONFIRMED → ACTIVE":"Simulate PAID_CONFIRMED → ACTIVE")}</button></section>}
      {p.entitlementState==="ACTIVE"&&<section className="panel"><h2>{ru?"Расписание объекта":"Object schedule"}</h2><div className="runs">{p.runSlots.map((x:string)=><span key={x}>{x}</span>)}</div><p className="muted">{ru?"Execution выключен. Ни один model/web run не может стартовать из этого Preview.":"Execution is disabled. No model/web run can start from this Preview."}</p></section>}</>}
    </section><style jsx>{`
      .page{min-height:100vh;background:#07111b;color:#edf3f7;padding:48px 18px 70px;font-family:Inter,system-ui,sans-serif}.shell{max-width:900px;margin:auto}.eyebrow,small{color:#d8ad62;font-size:11px;letter-spacing:.12em}h1{font:400 clamp(38px,6vw,62px)/1 Georgia,serif;margin:14px 0}.boundary,.notice,.panel,.grid{border:1px solid #ffffff20;background:#ffffff08;border-radius:16px}.boundary,.notice{padding:12px 15px;margin:18px 0;color:#b8c5cf}.grid{display:grid;grid-template-columns:repeat(4,1fr);overflow:hidden}.grid>div{padding:15px;background:#0a1723;display:grid;gap:7px}.panel{padding:20px;margin-top:18px}.ids{display:grid;grid-template-columns:1fr 1fr;gap:18px}.ids p{overflow-wrap:anywhere}.panel p{color:#ffffffa8;line-height:1.55}.runs{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:#ffffff14}.runs span{padding:12px;background:#0a1723;color:#d8ad62;font:11px ui-monospace,monospace}.muted{font-size:12px}button{border:1px solid #d8ad6299;background:#172536;color:#f3dfb7;border-radius:12px;padding:11px 15px;font-weight:650}@media(max-width:700px){.grid,.ids{grid-template-columns:1fr 1fr}.runs{grid-template-columns:1fr}}@media(max-width:440px){.grid,.ids{grid-template-columns:1fr}}
    `}</style></main></>;
}
