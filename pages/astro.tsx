import Link from "next/link";

type Locale="en"|"ru";
type Module={name:string;role:string;state:string;href:string;tone:"live"|"accepted"|"research"|"candidate"};
const COPY={
  en:{ey:"ASTRO RESEARCH ATLAS",title:"One sky. Distinct research modules.",lead:"A public map of BHRIGU's astronomical and astrological research surfaces. It exposes authority, status and use without exposing protected ORION internals.",groups:[
    ["Sky & time",[
      {name:"Ephemerides",role:"2026 source-bound planetary positions, motion and event windows",state:"PUBLIC V1",href:"/ephemerides",tone:"live"},
      {name:"Aspect phases",role:"Canonical major-aspect geometry and applying/separating research semantics",state:"ACCEPTED ENGINE",href:"/cosmography",tone:"accepted"},
      {name:"Stations & ingresses",role:"Turning points carried by the published 2026 Astro evidence",state:"PUBLIC IN EPHEMERIDES",href:"/ephemerides",tone:"live"},
      {name:"Eclipses",role:"Canonical solar/lunar event geometry; public event table not inferred from incomplete exports",state:"ACCEPTED / PARTIAL PUBLIC",href:"/cosmography",tone:"accepted"},
    ]],
    ["Research engines",[
      {name:"Semenko",role:"Weighted planetary geometry used as research ordering, not intrinsic bullish/bearish polarity",state:"RESEARCH",href:"/cosmography",tone:"research"},
      {name:"Φ / Butusov",role:"Golden-ratio and dynamical research lineage with source/provenance boundaries",state:"RESEARCH",href:"/cosmography",tone:"research"},
      {name:"Cosmography",role:"Public language for structure, cycles and relations",state:"PUBLIC LANGUAGE",href:"/cosmography",tone:"accepted"},
      {name:"ORION",role:"Protected research depth; existence does not imply public product authority",state:"PROTECTED",href:"/orion",tone:"candidate"},
    ]],
    ["Bitcoin research lab",[
      {name:"BTC × Astro",role:"Bitcoin market evidence joined with accepted Astro context for bounded research",state:"ACTIVE RESEARCH",href:"/crypto-astro/btc",tone:"live"},
      {name:"Experiment memory",role:"Failures and passes are preserved; no post-event rewriting",state:"METHOD LAW",href:"/map",tone:"accepted"},
      {name:"Forecast ledger",role:"Prospective forecasts are locked before outcomes and scored later",state:"LIVE RESEARCH",href:"/crypto-astro/btc",tone:"live"},
    ]],
  ]},
  ru:{ey:"АТЛАС АСТРО-ИССЛЕДОВАНИЙ",title:"Одно небо. Разные исследовательские модули.",lead:"Публичная карта астрономических и астрологических поверхностей BHRIGU. Показывает authority, статус и применение, не раскрывая защищённые механизмы ORION.",groups:[
    ["Небо и время",[
      {name:"Эфемериды",role:"Source-bound положения планет, движение и event windows за 2026",state:"PUBLIC V1",href:"/ephemerides",tone:"live"},
      {name:"Фазы аспектов",role:"Canonical геометрия главных аспектов и applying/separating research semantics",state:"ACCEPTED ENGINE",href:"/cosmography",tone:"accepted"},
      {name:"Станции и ингрессии",role:"Поворотные точки из опубликованного Astro evidence 2026",state:"PUBLIC IN EPHEMERIDES",href:"/ephemerides",tone:"live"},
      {name:"Затмения",role:"Canonical геометрия солнечных/лунных событий; public event table не симулируется из неполного export",state:"ACCEPTED / PARTIAL PUBLIC",href:"/cosmography",tone:"accepted"},
    ]],
    ["Исследовательские движки",[
      {name:"Семенко",role:"Взвешенная планетарная геометрия как research ordering, без встроенной bullish/bearish полярности",state:"RESEARCH",href:"/cosmography",tone:"research"},
      {name:"Φ / Бутусов",role:"Линия золотого сечения и динамических исследований с source/provenance границами",state:"RESEARCH",href:"/cosmography",tone:"research"},
      {name:"Космография",role:"Публичный язык структуры, циклов и связей",state:"PUBLIC LANGUAGE",href:"/cosmography",tone:"accepted"},
      {name:"ORION",role:"Защищённая исследовательская глубина; существование не означает public product authority",state:"PROTECTED",href:"/orion",tone:"candidate"},
    ]],
    ["Bitcoin research lab",[
      {name:"BTC × Astro",role:"Bitcoin market evidence, соединённый с accepted Astro context для bounded research",state:"ACTIVE RESEARCH",href:"/crypto-astro/btc",tone:"live"},
      {name:"Память экспериментов",role:"FAIL и PASS сохраняются; post-event rewriting запрещён",state:"METHOD LAW",href:"/map",tone:"accepted"},
      {name:"Forecast ledger",role:"Prospective прогноз фиксируется до outcome и оценивается после",state:"LIVE RESEARCH",href:"/crypto-astro/btc",tone:"live"},
    ]],
  ]}
} as const;

export async function getServerSideProps({query}:any){return{props:{locale:query.lang==="ru"?"ru":"en"}}}
export default function AstroAtlas({locale}:{locale:Locale}){
  const c=COPY[locale];
  return <main className="wrap" lang={locale} data-astro-atlas="BHRIGU_PUBLIC_ASTRO_ATLAS_V1">
    <p className="ey">{c.ey}</p><h1>{c.title}</h1><p className="lead">{c.lead}</p>
    {c.groups.map(([group,items],i)=><section key={group}><div className="groupHead"><span>0{i+1}</span><h2>{group}</h2></div><div className="grid">{(items as readonly Module[]).map(m=><Link key={m.name} href={`${m.href}?lang=${locale}`} className="card" data-tone={m.tone}><div><strong>{m.name}</strong><em>{m.state}</em></div><p>{m.role}</p><b aria-hidden="true">→</b></Link>)}</div></section>)}
    <section className="law"><strong>{locale==="ru"?"Закон atlas":"Atlas law"}</strong><p>{locale==="ru"?"Accepted, reference, research и protected/candidate слои не смешиваются. Публичная карта показывает, что существует и где используется; она не превращает исследовательский механизм в доказанную рыночную причинность.":"Accepted, reference, research and protected/candidate layers remain distinct. The public map shows what exists and where it is used; it does not turn a research mechanism into proven market causality."}</p></section>
    <style jsx>{`.wrap{max-width:1080px;margin:auto;padding:70px 22px 120px}.ey{color:#d5b86d;letter-spacing:.16em;font-size:11px}.wrap h1{font:400 clamp(42px,6vw,70px)/1 Georgia,serif;margin:10px 0 16px}.lead{max-width:820px;color:rgba(255,255,255,.67);font-size:17px;line-height:1.7}.wrap section{margin-top:34px}.groupHead{display:flex;gap:12px;align-items:baseline;margin-bottom:12px}.groupHead span{color:#7eb7d8;font:10px ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.12em}.groupHead h2{margin:0;font-size:22px}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.grid :global(.card){position:relative;display:grid;gap:12px;min-height:138px;padding:20px;border:1px solid rgba(255,255,255,.085);border-radius:17px;background:rgba(255,255,255,.012);color:inherit;text-decoration:none}.grid :global(.card[data-tone="live"]){border-color:rgba(98,168,216,.28);background:radial-gradient(circle at 100% 0%,rgba(98,168,216,.09),transparent 38%),rgba(255,255,255,.01)}.grid :global(.card[data-tone="research"]){border-color:rgba(213,184,109,.22)}.grid :global(.card[data-tone="candidate"]){opacity:.72}.grid :global(.card>div){display:flex;justify-content:space-between;gap:12px;align-items:baseline}.grid :global(.card strong){font-size:18px}.grid :global(.card em){font-style:normal;color:#d5b86d;font-size:9px;letter-spacing:.09em;text-transform:uppercase;text-align:right}.grid :global(.card p){margin:0;max-width:520px;color:rgba(255,255,255,.6);line-height:1.55}.grid :global(.card b){position:absolute;right:18px;bottom:14px;color:rgba(126,183,216,.7)}.law{padding:20px;border-left:2px solid rgba(213,184,109,.46);background:rgba(213,184,109,.035)}.law p{max-width:820px;color:rgba(255,255,255,.62);line-height:1.65}@media(max-width:700px){.grid{grid-template-columns:1fr}.wrap{padding:52px 16px 110px}.grid :global(.card){min-height:128px}.grid :global(.card>div){display:grid}}`}</style>
  </main>;
}
