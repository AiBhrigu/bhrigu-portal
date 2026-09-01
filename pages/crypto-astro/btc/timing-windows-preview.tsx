import Head from "next/head";
import { useState } from "react";

const CREATE_API = "/api/btc/timing-windows/v1/create-preview-order";
const RUNS = ["BASELINE", "DAY 7", "DAY 14", "DAY 21", "DAY 28", "DAY 30 CLOSEOUT"];
type PreviewOrder = { product_order_id:string; research_object_id:string; private_link:string };

export async function getServerSideProps({ query }: any) {
  if (process.env.VERCEL_ENV !== "preview") return { notFound: true };
  return { props: { locale: query.lang === "ru" ? "ru" : "en" } };
}

export default function TimingWindowsPreview({ locale }: { locale: "en" | "ru" }) {
  const [busy,setBusy]=useState(false); const [order,setOrder]=useState<PreviewOrder|null>(null); const [error,setError]=useState("");
  const ru=locale==="ru";
  async function createOrder(){setBusy(true);setError("");try{
    const response=await fetch(CREATE_API,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({locale})});
    const payload=await response.json(); if(!response.ok)throw new Error(payload.code||"PREVIEW_ORDER_UNAVAILABLE"); setOrder(payload);
  }catch(cause){setError(cause instanceof Error?cause.message:"PREVIEW_ORDER_UNAVAILABLE");}finally{setBusy(false);}}
  return <><Head><title>Φ BTC Timing Windows · Founding · Preview</title><meta name="robots" content="noindex,nofollow,noarchive"/></Head>
    <main className="page"><section className="shell">
      <div className="eyebrow">Φ BTC TIMING WINDOWS · FOUNDING · PREVIEW ONLY</div>
      <h1>{ru?"30-дневный исследовательский объект Bitcoin":"A 30-day Bitcoin research object"}</h1>
      <p className="lead">{ru?"Один зафиксированный вопрос, baseline, четыре checkpoints и Day-30 closeout. Не платный чат и не торговый сигнал.":"One fixed question, a baseline, four checkpoints and Day-30 closeout. Not paid chat and not a trading signal."}</p>
      <div className="boundary">PREVIEW ONLY · NO REAL BTC · NO RECEIVER PROVISIONING · NO PRODUCTION CHECKOUT</div>
      <section className="contract">
        <div><small>Product</small><strong>PHI_BTC_TIMING_WINDOWS_FOUNDING_V1</strong></div>
        <div><small>{ru?"Совместимость цены":"Price compatibility"}</small><strong>$49 · BTC at quote time</strong></div>
        <div><small>{ru?"Срок":"Duration"}</small><strong>30 days</strong></div>
        <div><small>Provider cap</small><strong>$4.80 total</strong></div>
      </section>
      <section className="panel"><h2>{ru?"Исследовательский вопрос":"Research question"}</h2>
        <p>What are the most important Bitcoin timing windows, structural conditions, and invalidation points over the next 30 days?</p></section>
      <section className="panel"><h2>{ru?"Шесть допустимых research runs":"Six allowed research runs"}</h2>
        <div className="runs">{RUNS.map(run=><span key={run}>{run}</span>)}</div>
        <p className="muted">{ru?"Six-run execution доступен только внутри активированного private Preview object; каждый run ограничен $0.80, весь 30-дневный объект — $4.80.":"Six-run execution exists only inside an activated private Preview object; each run is capped at $0.80 and the full 30-day object at $4.80."}</p>
      </section>
      {!order&&<section className="panel action"><h2>Preview order</h2><p>{ru?"Создаёт synthetic PRODUCT_ORDER_ID и private RESEARCH_OBJECT_ID. Bitcoin quote, адрес и транзакция не создаются.":"Creates synthetic PRODUCT_ORDER_ID and private RESEARCH_OBJECT_ID. No Bitcoin quote, address or transaction is created."}</p>
        <button disabled={busy} onClick={createOrder}>{busy?"…":(ru?"Создать Preview order":"Create Preview order")}</button></section>}
      {error&&<div className="notice">{error}</div>}
      {order&&<section className="panel result"><h2>{ru?"Order создан":"Order created"}</h2><dl>
        <div><dt>PRODUCT_ORDER_ID</dt><dd>{order.product_order_id}</dd></div>
        <div><dt>RESEARCH_OBJECT_ID</dt><dd>{order.research_object_id}</dd></div>
        <div><dt>PAYMENT</dt><dd>PREVIEW_NOT_CHARGED</dd></div>
      </dl><a href={order.private_link}>{ru?"Открыть private research object":"Open private research object"} →</a></section>}
    </section><style jsx>{`
      .page{min-height:100vh;background:#07090c;color:#eef2f4;padding:56px 20px 80px;font-family:Inter,system-ui,sans-serif}.shell{max-width:920px;margin:auto}
      .eyebrow{color:#d5b86d;letter-spacing:.15em;font-size:11px}h1{font:400 clamp(42px,7vw,72px)/.98 Georgia,serif;margin:14px 0 18px}.lead{max-width:780px;color:#ffffffad;font-size:18px;line-height:1.65}
      .boundary,.panel,.contract,.notice{border:1px solid #ffffff1c;background:#ffffff06;border-radius:18px}.boundary{padding:12px 15px;margin:22px 0;color:#9bc7df;font-size:11px;letter-spacing:.08em}.contract{display:grid;grid-template-columns:repeat(4,1fr);overflow:hidden}
      .contract>div{padding:16px;border-right:1px solid #ffffff14;display:grid;gap:7px}small,dt{color:#ffffff70;font-size:10px;letter-spacing:.08em}.contract strong{font-size:13px;overflow-wrap:anywhere}
      .panel{padding:22px;margin-top:18px}.panel h2{margin:0 0 12px}.panel p{color:#ffffffa8;line-height:1.6}.runs{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:#ffffff14}.runs span{padding:13px;background:#0a0d11;color:#e3c879;font:12px ui-monospace,monospace}.muted{font-size:12px}
      button{border:1px solid #d5b86d8c;background:#171b22;color:#f0dca9;border-radius:12px;padding:11px 16px;font-weight:700}.notice{padding:13px;margin-top:18px;color:#e1c77d}.result dl{display:grid;gap:1px;background:#ffffff14}.result dl div{padding:12px;background:#0a0d11}.result dd{margin:5px 0 0;overflow-wrap:anywhere}.result a{display:inline-block;margin-top:18px;color:#e1c77d}@media(max-width:720px){.contract{grid-template-columns:1fr 1fr}.runs{grid-template-columns:1fr}}
    `}</style></main></>;
}
