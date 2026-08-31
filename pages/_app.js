import "../styles/globals.css";
import "../styles/public-site-repair.css";
import Head from "next/head";
import { useRouter } from "next/router";
import PrevNextBlock from "../components/PrevNextBlock";
import BhriguPhiHeader from "../components/BhriguPhiHeader";
import BtcFreeCorridorSurfaceAdapter from "../components/btc/BtcFreeCorridorSurfaceAdapter";

const BASE = "https://www.bhrigu.io";
const META = {
  "/": { en:["Market Cosmographer · AI Market Intelligence | BHRIGU","Evidence-linked Bitcoin intelligence: verified change, why it matters, and explicit conditions."], ru:["Market Cosmographer · AI-анализ рынков | BHRIGU","Bitcoin-аналитика со связанными доказательствами: проверенное изменение, его значение и явные условия."] },
  "/start": { en:["Start · BHRIGU","Start with the working BHRIGU system: BTC Field, Frey, public proof and clear boundaries."], ru:["Старт · BHRIGU","Начните с работающей системы BHRIGU: BTC Field, Frey, публичные доказательства и ясные границы."] },
  "/frey": { en:["Frey · Temporal Reading | BHRIGU","Frey is BHRIGU's active temporal reading and dialogue service."], ru:["Frey · Темпоральное чтение | BHRIGU","Frey — действующий сервис темпорального чтения и диалога BHRIGU."] },
  "/reading": { en:["Reading · BHRIGU","Temporal reading surface with explicit structural context and boundaries."], ru:["Чтение · BHRIGU","Поверхность темпорального чтения с явным структурным контекстом и границами."] },
  "/cosmographer": { en:["Cosmographer · BHRIGU","Interpretation and navigation across bounded evidence, with BTC Cosmographer as the current Bitcoin application."], ru:["Космограф · BHRIGU","Интерпретация и навигация в пределах доказательств; BTC Cosmographer — текущее Bitcoin-приложение."] },
  "/investors": { en:["System Context · BHRIGU","Factual orientation to BHRIGU's current product, evidence architecture and research surfaces."], ru:["Контекст системы · BHRIGU","Фактическая ориентация по текущему продукту BHRIGU, архитектуре доказательств и исследовательским поверхностям."] },
  "/map": { en:["System Map · BHRIGU","Public relationship map across Market Cosmographer, BTC Field, Frey, Cosmographer and ORION."], ru:["Карта системы · BHRIGU","Публичная карта связей Market Cosmographer, BTC Field, Frey, Космографа и ORION."] },
  "/faq": { en:["FAQ · BHRIGU","Current public answers about BHRIGU, BTC Field, Frey, proof, access and boundaries."], ru:["FAQ · BHRIGU","Актуальные ответы о BHRIGU, BTC Field, Frey, доказательствах, доступе и границах."] },
  "/services": { en:["Public Capabilities · BHRIGU","Current public capabilities: Bitcoin research intelligence, Frey temporal reading and public evidence surfaces."], ru:["Публичные возможности · BHRIGU","Текущие публичные возможности: Bitcoin research intelligence, Frey и поверхности доказательств."] },
  "/dao": { en:["DAO · Future Boundary | BHRIGU","A future peripheral economic coordination layer; not current product authority."], ru:["DAO · Будущая граница | BHRIGU","Будущий периферийный слой экономической координации; не текущая продуктовая authority."] },
  "/orion": { en:["ORION · Protected Research Depth | BHRIGU","Public boundary for BHRIGU's protected research depth."], ru:["ORION · Защищённая исследовательская глубина | BHRIGU","Публичная граница защищённой исследовательской глубины BHRIGU."] },
  "/signal": { en:["Signal · Historical Artifact | BHRIGU","Historical signal artifact preserved as archive, not a current runtime state."], ru:["Signal · Исторический артефакт | BHRIGU","Исторический signal-артефакт: архив, а не текущее состояние runtime."] },
  "/archive": { en:["Archive · BHRIGU","Historical public artifacts and preserved snapshots."], ru:["Архив · BHRIGU","Исторические публичные артефакты и сохранённые снимки."] },
  "/chronicle": { en:["Chronicle · Historical Ledger | BHRIGU","Dated historical milestones; not a statement of current system state."], ru:["Хроника · Исторический реестр | BHRIGU","Датированные исторические вехи; не описание текущего состояния системы."] },
  "/cosmography": { en:["Cosmography · BHRIGU","Research language for structure, cycles and relations, with protected mechanism boundaries."], ru:["Космография · BHRIGU","Исследовательский язык структуры, циклов и связей с защищёнными границами механизма."] },
  "/astro": { en:["Astro Research Atlas · BHRIGU","Public map of BHRIGU ephemerides, aspects, stations, eclipses, Semenko, cosmography and Bitcoin research layers."], ru:["Атлас астро-исследований · BHRIGU","Публичная карта эфемерид, аспектов, станций, затмений, Семенко, космографии и Bitcoin-исследований BHRIGU."] },
  "/ephemerides": { en:["Planetary Ephemerides Today · BHRIGU","Fresh canonical planetary positions, aspect phase and lunar context, with source-bound 2026 archive pages."], ru:["Планетные эфемериды сегодня · BHRIGU","Свежие canonical положения планет, фазы аспектов и лунный контекст с source-bound архивом 2026."] },
  "/access": { en:["Access · BHRIGU","Reviewed private intake is temporarily closed; public orientation remains available."], ru:["Доступ · BHRIGU","Reviewed private intake временно закрыт; публичная ориентация остаётся доступной."] },
  "/support": { en:["Support · BHRIGU","Voluntary Bitcoin support for public research continuity; no access, priority or ownership rights."], ru:["Поддержка · BHRIGU","Добровольная Bitcoin-поддержка публичных исследований без прав доступа, приоритета или владения."] },
  "/github": { en:["GitHub · BHRIGU","Public code, research artifacts and evidence references."], ru:["GitHub · BHRIGU","Публичный код, исследовательские артефакты и ссылки на доказательства."] },
  "/guide/frey": { en:["Frey Guide · Read, Compare & AI Export | BHRIGU","Complete public guide to Frey: one-date reading, two-date Δ comparison, timeline, AI Reading Packet, approved PDFs and method boundaries."], ru:["Гид Frey · Чтение, сравнение и AI Export | BHRIGU","Полный публичный гид Frey: одна дата, сравнение двух дат и Δ, таймлайн, AI Reading Packet, approved PDF и границы метода."] },
  "/crypto-astro/btc": { en:["BTC Field · Evidence-Linked Bitcoin Intelligence | BHRIGU","Current Bitcoin state, change memory, sources and explicit conditions."], ru:["BTC Field · Bitcoin intelligence с доказательствами | BHRIGU","Текущее состояние Bitcoin, память изменений, источники и явные условия."] },
  "/crypto-astro/btc/live": { en:["BTC Field Dialogue · BHRIGU","Bounded legacy public evidence dialogue."], ru:["Диалог BTC Field · BHRIGU","Ограниченный legacy-маршрут публичных доказательств."] },
  "/crypto-astro/btc/clean-chat": { en:["BTC Cosmographer · Dialogue","Live Bitcoin dialogue with current data, sources and explicit limits."], ru:["BTC Cosmographer · Диалог","Живой Bitcoin-диалог с текущими данными, источниками и явными границами."] },
};
const LOCALIZED = new Set(Object.keys(META));
const NOINDEX = new Set(["/dao","/crypto-astro/btc/live","/crypto-astro/btc/clean-chat"]);
const PAGE_OWNS_METADATA = new Set(["/crypto-astro/btc","/crypto-astro/btc/clean-chat"]);

function pathOnly(v){return String(v||"/").split("#")[0].split("?")[0]||"/";}
function localizedUrl(path, lang){return `${BASE}${path}?lang=${lang}`;}
function siteNode(){return {"@type":"WebSite","@id":`${BASE}/#website`,name:"BHRIGU",url:`${BASE}/`};}
function freyNode(lang){
  return {
    "@type":"SoftwareApplication",
    "@id":`${BASE}/frey#frey`,
    name:"Frey",
    applicationCategory:"ResearchApplication",
    operatingSystem:"Web",
    url:localizedUrl("/frey",lang),
    description:lang==="ru"?"Детерминированный сервис темпорального чтения BHRIGU.":"BHRIGU deterministic temporal reading service.",
  };
}
function buildMachineGraph(path, lang, pageMode=null, liveAvailable=false){
  const ru=lang==="ru";
  const pageUrl=localizedUrl(path,lang);
  const guideUrl=localizedUrl("/guide/frey",lang);
  const readingUrl=localizedUrl("/reading",lang);
  const freyUrl=localizedUrl("/frey",lang);
  const site=siteNode();
  const frey=freyNode(lang);
  if(path==="/start") return {
    "@context":"https://schema.org",
    "@type":"CollectionPage",
    "@id":`${pageUrl}#page`,
    url:pageUrl,
    name:ru?"Старт BHRIGU":"BHRIGU Start",
    inLanguage:lang,
    isPartOf:site,
    mainEntity:{
      "@type":"ItemList",
      name:ru?"Основные публичные входы BHRIGU":"Primary BHRIGU public entry surfaces",
      itemListElement:[
        {"@type":"ListItem",position:1,name:"BTC Field",url:localizedUrl("/crypto-astro/btc",lang)},
        {"@type":"ListItem",position:2,name:"Frey",url:freyUrl},
        {"@type":"ListItem",position:3,name:ru?"Публичные доказательства":"Public proof",url:"https://aibhrigu.github.io/phi-cosmography-open/crypto-astro/index.html"},
        {"@type":"ListItem",position:4,name:ru?"Карта системы":"System Map",url:localizedUrl("/map",lang)},
      ],
    },
  };
  if(path==="/map") return {
    "@context":"https://schema.org",
    "@type":"CollectionPage",
    "@id":`${pageUrl}#page`,
    url:pageUrl,
    name:ru?"Карта системы BHRIGU":"BHRIGU System Map",
    description:ru?"Карта отношений между основными публичными ролями и поверхностями BHRIGU.":"Relationship map across BHRIGU public roles and surfaces.",
    inLanguage:lang,
    isPartOf:site,
    mainEntity:{
      "@type":"ItemList",
      itemListElement:[
        {"@type":"ListItem",position:1,name:"Market Cosmographer",url:"https://aibhrigu.github.io/phi-cosmography-open/crypto-astro/index#surface"},
        {"@type":"ListItem",position:2,name:"BTC Field",url:localizedUrl("/crypto-astro/btc",lang)},
        {"@type":"ListItem",position:3,name:"Frey",url:freyUrl},
        {"@type":"ListItem",position:4,name:"Reading",url:readingUrl},
        {"@type":"ListItem",position:5,name:ru?"Гид Frey":"Frey Guide",url:guideUrl},
        {"@type":"ListItem",position:6,name:ru?"Космограф":"Cosmographer",url:localizedUrl("/cosmographer",lang)},
        {"@type":"ListItem",position:7,name:"ORION",url:localizedUrl("/orion",lang)},
      ],
    },
  };
  if(path==="/frey") return {
    "@context":"https://schema.org",
    "@type":"WebPage",
    "@id":`${pageUrl}#page`,
    url:pageUrl,
    name:ru?"Frey · Темпоральное чтение":"Frey · Temporal Reading",
    inLanguage:lang,
    isPartOf:site,
    about:frey,
    subjectOf:{"@type":"TechArticle","@id":`${guideUrl}#guide`,name:ru?"Гид Frey":"Frey Guide",url:guideUrl},
    hasPart:{
      "@type":"CreativeWork",
      "@id":`${pageUrl}#ai-reading-packet`,
      name:"Frey AI Reading Packet",
      description:ru?"Переносимый prompt-contract с исходными метриками, интерпретацией Frey и явными границами для стороннего ИИ.":"Portable prompt-contract with raw metrics, Frey interpretation and explicit boundaries for an external AI.",
      isPartOf:{"@id":`${pageUrl}#page`},
    },
  };
  if(path==="/reading") return {
    "@context":"https://schema.org",
    "@type":"WebPage",
    "@id":`${pageUrl}#page`,
    url:pageUrl,
    name:ru?"Темпоральное чтение Frey":"Frey Temporal Reading",
    inLanguage:lang,
    isPartOf:site,
    about:frey,
    subjectOf:{"@type":"TechArticle","@id":`${guideUrl}#guide`,name:ru?"Гид Frey":"Frey Guide",url:guideUrl},
    relatedLink:[freyUrl,guideUrl],
  };
  if(path==="/guide/frey") return {
    "@context":"https://schema.org",
    "@type":"TechArticle",
    "@id":`${pageUrl}#guide`,
    url:pageUrl,
    name:ru?"Гид Frey · Чтение, сравнение и AI Export":"Frey Guide · Read, Compare & AI Export",
    description:ru?"Методический слой Frey для чтения одной даты, сравнения двух дат, Δ, Timeline и AI Reading Packet.":"Frey method layer for one-date reading, two-date comparison, Delta, Timeline and the AI Reading Packet.",
    inLanguage:lang,
    isPartOf:site,
    about:frey,
    hasPart:[
      {"@type":"DigitalDocument",name:"Frey RU v2 Aligned Text",contentUrl:`${BASE}/publications/frey/bhrigu-frey-ru-v2-aligned.pdf`},
      {"@type":"DigitalDocument",name:"Frey EN Full Article v4",contentUrl:`${BASE}/publications/frey/bhrigu-frey-en-full-article-v4.pdf`},
      {"@type":"DigitalDocument",name:"Frey EN Approved Poster Pack v5",contentUrl:`${BASE}/publications/frey/bhrigu-frey-en-approved-poster-pack-v5-visual-guide.pdf`},
      {"@type":"DigitalDocument",name:"Frey RU Approved Poster Pack v1",contentUrl:`${BASE}/publications/frey/bhrigu-frey-ru-approved-poster-pack-v1-visual-guide.pdf`},
    ],
    mentions:{"@type":"CreativeWork",name:"Frey AI Reading Packet",url:`${freyUrl}#ai-reading-packet`},
  };
  if(path==="/astro") return {
    "@context":"https://schema.org",
    "@type":"CollectionPage",
    "@id":`${pageUrl}#page`,
    url:pageUrl,
    name:ru?"Атлас астро-исследований BHRIGU":"BHRIGU Astro Research Atlas",
    inLanguage:lang,
    isPartOf:site,
    mainEntity:{"@type":"ItemList",itemListElement:[
      {"@type":"ListItem",position:1,name:ru?"Эфемериды":"Ephemerides",url:localizedUrl("/ephemerides",lang)},
      {"@type":"ListItem",position:2,name:ru?"Космография":"Cosmography",url:localizedUrl("/cosmography",lang)},
      {"@type":"ListItem",position:3,name:"BTC × Astro",url:localizedUrl("/crypto-astro/btc",lang)},
      {"@type":"ListItem",position:4,name:"ORION",url:localizedUrl("/orion",lang)},
    ]},
  };
  if(path==="/ephemerides"&&pageMode==="today"&&liveAvailable) return {
    "@context":"https://schema.org","@type":"WebPage","@id":`${pageUrl}#page`,url:pageUrl,name:ru?"Планетные эфемериды сегодня BHRIGU":"BHRIGU Planetary Ephemerides Today",inLanguage:lang,isPartOf:site,mainEntity:{"@type":"Dataset",name:"BHRIGU Canonical Public-Safe Astro Field · Today",variableMeasured:["planetary longitude","longitude speed","retrograde/direct state","major aspect orb","applying/separating phase","Sun-Moon elongation"],isPartOf:{"@id":`${localizedUrl("/astro",lang)}#page`}}};
  if(path==="/ephemerides"||path.startsWith("/ephemerides/")) return {
    "@context":"https://schema.org",
    "@type":"WebPage",
    "@id":`${pageUrl}#page`,
    url:pageUrl,
    name:ru?"Планетные эфемериды BHRIGU":"BHRIGU Planetary Ephemerides",
    inLanguage:lang,
    isPartOf:site,
    mainEntity:{
      "@type":"Dataset",
      name:"BHRIGU Public Astro Evidence 2026",
      temporalCoverage:"2026-01-01/2026-12-31",
      variableMeasured:["planetary longitude","longitude speed","major aspect windows","stations","ingresses"],
      isPartOf:{"@id":`${localizedUrl("/astro",lang)}#page`},
    },
  };
  return null;
}

export default function App({ Component, pageProps }) {
  const router=useRouter();
  const routePath=pathOnly(router.pathname || router.asPath || "/");
  const raw=Array.isArray(router.query?.lang)?router.query.lang[0]:router.query?.lang;
  const lang=raw==="ru"?"ru":"en";
  const ephemeridesRoute=routePath==="/ephemerides"||routePath.startsWith("/ephemerides/");
  const path=ephemeridesRoute&&typeof pageProps?.canonicalPath==="string"?pageProps.canonicalPath:routePath;
  const ephemeridesPath=path==="/ephemerides"||path.startsWith("/ephemerides/");
  const pair=META[path]?.[lang]||META[path]?.en||(ephemeridesPath?META["/ephemerides"]?.[lang]:null)||["BHRIGU","BHRIGU public product and research surfaces."];
  const canonicalPath=path==="/crypto-astro/btc/live"?"/crypto-astro/btc":path;
  const localized=LOCALIZED.has(path)||ephemeridesPath;
  const canonical=`${BASE}${canonicalPath}${localized?`?lang=${lang}`:""}`;
  const pageOwnsMetadata=PAGE_OWNS_METADATA.has(path);
  const machineGraph=buildMachineGraph(path,lang,pageProps?.mode??null,pageProps?.data?.live===true);
  return <>
    <Head>
      {!pageOwnsMetadata&&<>
        <title>{pair[0]}</title><meta name="description" content={pair[1]} key="description" />
        <link rel="canonical" href={canonical} key="canonical" />
        {localized&&!NOINDEX.has(path)&&<link rel="alternate" hrefLang="en" href={`${BASE}${canonicalPath}?lang=en`} key="alt-en" />}
        {localized&&!NOINDEX.has(path)&&<link rel="alternate" hrefLang="ru" href={`${BASE}${canonicalPath}?lang=ru`} key="alt-ru" />}
        {localized&&!NOINDEX.has(path)&&<link rel="alternate" hrefLang="x-default" href={`${BASE}${canonicalPath}?lang=en`} key="alt-default" />}
        {NOINDEX.has(path)&&<meta name="robots" content="noindex,follow" key="robots" />}
        <meta property="og:type" content="website" key="og-type"/><meta property="og:title" content={pair[0]} key="og-title"/><meta property="og:description" content={pair[1]} key="og-description"/><meta property="og:url" content={canonical} key="og-url"/>
        <meta name="twitter:card" content="summary_large_image" key="twitter-card"/><meta name="twitter:title" content={pair[0]} key="twitter-title"/><meta name="twitter:description" content={pair[1]} key="twitter-description"/>
      </>}
      {machineGraph&&<script type="application/ld+json" data-bhrigu-machine-graph="OSI_PHI_PUBLIC_RELATIONS_V0_1" dangerouslySetInnerHTML={{__html:JSON.stringify(machineGraph).replace(/</g,"\\u003c")}} />}
    </Head>
    <BhriguPhiHeader routeOverride={ephemeridesPath?`${path}?lang=${lang}`:null} />
    <Component {...pageProps} />
    <BtcFreeCorridorSurfaceAdapter />
    {path!=="/"?<PrevNextBlock route={router.asPath} localeHint={raw}/>:null}
    <style jsx global>{`
      @media (min-width: 841px) {
        main[data-primary-product="market-cosmographer"] [data-btc-field-canvas][data-home-system-map] {
          min-height: 368px !important;
        }
      }
      @media (max-width: 620px) {
        [data-btc-state-kicker] {
          font-size: 10.5px !important;
          line-height: 1.3 !important;
        }
        [data-btc-accepted-state] small,
        [data-home-btc-proof-object] small {
          font-size: 10.5px !important;
          line-height: 1.3 !important;
        }
        [data-btc-accepted-state] strong,
        [data-home-btc-proof-object] strong {
          font-size: 12px !important;
          line-height: 1.3 !important;
        }
        [data-btc-accepted-state] i,
        [data-home-btc-proof-object] i {
          font-size: 10.5px !important;
          line-height: 1.35 !important;
          white-space: normal !important;
        }
      }
    `}</style>
  </>;
}