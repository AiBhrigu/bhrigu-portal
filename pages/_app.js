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
  "/access": { en:["Access · BHRIGU","Reviewed private intake is temporarily closed; public orientation remains available."], ru:["Доступ · BHRIGU","Reviewed private intake временно закрыт; публичная ориентация остаётся доступной."] },
  "/support": { en:["Support · BHRIGU","Voluntary Bitcoin support for public research continuity; no access, priority or ownership rights."], ru:["Поддержка · BHRIGU","Добровольная Bitcoin-поддержка публичных исследований без прав доступа, приоритета или владения."] },
  "/github": { en:["GitHub · BHRIGU","Public code, research artifacts and evidence references."], ru:["GitHub · BHRIGU","Публичный код, исследовательские артефакты и ссылки на доказательства."] },
  "/guide/frey": { en:["Frey Guide · BHRIGU","Guide to Frey, Reading and the currently closed reviewed-access boundary."], ru:["Гид Frey · BHRIGU","Гид по Frey, Reading и текущей закрытой границе reviewed access."] },
  "/crypto-astro/btc": { en:["BTC Field · Evidence-Linked Bitcoin Intelligence | BHRIGU","Current Bitcoin state, change memory, sources and explicit conditions."], ru:["BTC Field · Bitcoin intelligence с доказательствами | BHRIGU","Текущее состояние Bitcoin, память изменений, источники и явные условия."] },
  "/crypto-astro/btc/live": { en:["BTC Field Dialogue · BHRIGU","Bounded legacy public evidence dialogue."], ru:["Диалог BTC Field · BHRIGU","Ограниченный legacy-маршрут публичных доказательств."] },
  "/crypto-astro/btc/clean-chat": { en:["BTC Cosmographer · Dialogue","Live Bitcoin dialogue with current data, sources and explicit limits."], ru:["BTC Cosmographer · Диалог","Живой Bitcoin-диалог с текущими данными, источниками и явными границами."] },
};
const LOCALIZED = new Set(Object.keys(META));
const NOINDEX = new Set(["/dao","/crypto-astro/btc/live","/crypto-astro/btc/clean-chat"]);
function pathOnly(v){return String(v||"/").split("#")[0].split("?")[0]||"/";}
export default function App({ Component, pageProps }) {
  const router=useRouter();
  const path=pathOnly(router.pathname || router.asPath || "/");
  const raw=Array.isArray(router.query?.lang)?router.query.lang[0]:router.query?.lang;
  const lang=raw==="ru"?"ru":"en";
  const pair=META[path]?.[lang]||META[path]?.en||["BHRIGU","BHRIGU public product and research surfaces."];
  const canonicalPath=path==="/crypto-astro/btc/live"?"/crypto-astro/btc":path;
  const localized=LOCALIZED.has(path);
  const canonical=`${BASE}${canonicalPath}${localized?`?lang=${lang}`:""}`;
  return <>
    <Head>
      <title>{pair[0]}</title><meta name="description" content={pair[1]} key="description" />
      <link rel="canonical" href={canonical} key="canonical" />
      {localized&&!NOINDEX.has(path)&&<link rel="alternate" hrefLang="en" href={`${BASE}${canonicalPath}?lang=en`} key="alt-en" />}
      {localized&&!NOINDEX.has(path)&&<link rel="alternate" hrefLang="ru" href={`${BASE}${canonicalPath}?lang=ru`} key="alt-ru" />}
      {localized&&!NOINDEX.has(path)&&<link rel="alternate" hrefLang="x-default" href={`${BASE}${canonicalPath}?lang=en`} key="alt-default" />}
      {NOINDEX.has(path)&&<meta name="robots" content="noindex,follow" key="robots" />}
      <meta property="og:type" content="website" key="og-type"/><meta property="og:title" content={pair[0]} key="og-title"/><meta property="og:description" content={pair[1]} key="og-description"/><meta property="og:url" content={canonical} key="og-url"/>
      <meta name="twitter:card" content="summary_large_image" key="twitter-card"/><meta name="twitter:title" content={pair[0]} key="twitter-title"/><meta name="twitter:description" content={pair[1]} key="twitter-description"/>
    </Head>
    <BhriguPhiHeader />
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
