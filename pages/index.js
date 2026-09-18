import Head from "next/head";
import Link from "next/link";
import {
  EMPTY_BTC_HOME_ACCEPTED_STATE,
  loadBtcHomeAcceptedState,
} from "../lib/btc-home-accepted-state";
import styles from "./index.module.css";
import PublicSupportRoute from "../components/btc/PublicSupportRoute";
import { FieldAnchorGlyph, RelationGlyph } from "../components/btc/BtcSurfaceGlyphs";

const PUBLIC_PROOF_URL =
  "https://aibhrigu.github.io/phi-cosmography-open/crypto-astro/index.html#what-changed";
const X_PROFILE_URL = "https://x.com/bhrigu_io";
const BINANCE_SQUARE_PROFILE_URL = {
  en: "https://www.binance.com/en/square/profile/square-creator-634982873",
  ru: "https://www.binance.com/ru/square/profile/square-creator-634982873",
};

const PUBLIC_EVIDENCE_COPY = {
  en: {
    signal: ["PROVEN IN THE OPEN", "BINANCE TRACK A", "X-AGENT ×2", "ENTROPY32 UPSTREAM"],
    eyebrow: "PROVEN IN THE OPEN",
    title: "Real systems leave public evidence.",
    intro:
      "BHRIGU is tested outside its own surfaces: by frozen time, public agent submissions, and an upstream change adopted in an independent Bitcoin hardware project.",
    boundary:
      "Every object below links to an external or immutable source. Pending review stays labeled pending.",
    cases: [
      {
        id: "binance-temporal",
        kicker: "TEMPORAL EVIDENCE · BINANCE",
        title: "A claim existed before the outcome.",
        body:
          "Track A was frozen before the Sep 10 boundary. The first post-boundary cycle was preserved; Sep 17 was precommitted seven days before its boundary. The second durable append is still being bound.",
        status: "FROZEN ORIGIN · APPEND-ONLY",
        links: [
          ["Frozen submission", "https://github.com/AiBhrigu/bhrigu-binance-agent-os-track-a"],
          ["Research state", "https://github.com/AiBhrigu/bhrigu-bitcoin-research-state-api"],
        ],
      },
      {
        id: "xagent-two-submissions",
        kicker: "AGENT / MCP · X-AGENT ×2",
        title: "Two distinct entries are on the external review surface.",
        body:
          "X-Agent officially received Bitcoin Temporal Evidence v2 (PR48) and the OlaXBT Strategy Evidence Agent (PR55). Receipts exist; technical review and judging are still pending.",
        status: "OFFICIAL RECEIPTS · JUDGING PENDING",
        links: [
          ["PR48 · Temporal Evidence", "https://github.com/xagentAI/xagt-plugin/pull/48"],
          ["PR55 · OlaXBT Evidence", "https://github.com/xagentAI/xagt-plugin/pull/55"],
        ],
      },
      {
        id: "entropy32-upstream",
        kicker: "EXTERNAL SYSTEM · ENTROPY32 PLUS",
        title: "Finding adopted upstream.",
        body:
          "BHRIGU identified an overlapping-comparison entropy defect. The maintainer changed the firmware to non-overlapping interval pairs and publicly credited Cosmographer / BHRIGU in both the README and firmware source.",
        status: "OPEN-SOURCE RESEARCH COLLABORATION · NOT CLIENT WORK",
        links: [
          ["README credit", "https://github.com/captainchapster/Entropy32-Plus/blob/a69f95c0098d25b762845d3b2b4751ef412b00a0/README.md"],
          ["Firmware credit", "https://github.com/captainchapster/Entropy32-Plus/blob/a69f95c0098d25b762845d3b2b4751ef412b00a0/entropy32_plus.ino"],
        ],
      },
    ],
  },
  ru: {
    signal: ["ДОКАЗАНО В ОТКРЫТОМ ПОЛЕ", "BINANCE TRACK A", "X-AGENT ×2", "ENTROPY32 UPSTREAM"],
    eyebrow: "ДОКАЗАНО В ОТКРЫТОМ ПОЛЕ",
    title: "Реальные системы оставляют публичные доказательства.",
    intro:
      "BHRIGU проверяется не только на собственных поверхностях: замороженным временем, внешними agent/MCP-заявками и изменением, принятым upstream в независимом Bitcoin hardware-проекте.",
    boundary:
      "Каждый объект ниже ведёт к внешнему или неизменяемому первоисточнику. То, что ещё находится на review, так и обозначено.",
    cases: [
      {
        id: "binance-temporal",
        kicker: "TEMPORAL EVIDENCE · BINANCE",
        title: "Утверждение существовало до результата.",
        body:
          "Track A был заморожен до границы 10 сентября. Первый post-boundary цикл сохранён; окно 17 сентября было precommit за семь дней до границы. Второй durable append ещё связывается с публичным evidence.",
        status: "FROZEN ORIGIN · APPEND-ONLY",
        links: [
          ["Замороженная заявка", "https://github.com/AiBhrigu/bhrigu-binance-agent-os-track-a"],
          ["Research state", "https://github.com/AiBhrigu/bhrigu-bitcoin-research-state-api"],
        ],
      },
      {
        id: "xagent-two-submissions",
        kicker: "AGENT / MCP · X-AGENT ×2",
        title: "Две независимые заявки находятся на внешнем review.",
        body:
          "X-Agent официально получил Bitcoin Temporal Evidence v2 (PR48) и OlaXBT Strategy Evidence Agent (PR55). Receipts существуют; technical review и judging ещё не завершены.",
        status: "OFFICIAL RECEIPTS · JUDGING PENDING",
        links: [
          ["PR48 · Temporal Evidence", "https://github.com/xagentAI/xagt-plugin/pull/48"],
          ["PR55 · OlaXBT Evidence", "https://github.com/xagentAI/xagt-plugin/pull/55"],
        ],
      },
      {
        id: "entropy32-upstream",
        kicker: "EXTERNAL SYSTEM · ENTROPY32 PLUS",
        title: "Finding принят upstream.",
        body:
          "В Entropy32 Plus BHRIGU обнаружил дефект overlapping comparison. Maintainer изменил firmware на non-overlapping interval pairs и публично указал Cosmographer / BHRIGU и в README, и в исходном коде.",
        status: "OPEN-SOURCE RESEARCH COLLABORATION · NOT CLIENT WORK",
        links: [
          ["README credit", "https://github.com/captainchapster/Entropy32-Plus/blob/a69f95c0098d25b762845d3b2b4751ef412b00a0/README.md"],
          ["Firmware credit", "https://github.com/captainchapster/Entropy32-Plus/blob/a69f95c0098d25b762845d3b2b4751ef412b00a0/entropy32_plus.ino"],
        ],
      },
    ],
  },
};

const PUBLIC_CHANNEL_COPY = {
  en: { eyebrow: "FOLLOW THE FIELD", x: "X · @bhrigu_io", square: "Binance Square · live research" },
  ru: { eyebrow: "СЛЕДИТЬ ЗА ПОЛЕМ", x: "X · @bhrigu_io", square: "Binance Square · живые исследования" },
};

const COPY = {
  en: {
    category: "AI MARKET INTELLIGENCE SYSTEM",
    h1Lead: "See what changed in Bitcoin —",
    h1Close: "and what would change the current read.",
    subheadline:
      "For self-directed Bitcoin investors: verified change, why it matters, and explicit conditions in one evidence-linked read.",
    openBtc: "Ask what changed in Bitcoin",
    viewProof: "View public proof",
    viewSquare: "Live research on Binance Square",
    workRecon: "External systems recon · USD 300",
    passportAccess: "Cosmographic Passport · USD 79",
    foundingField: "AI Founding Field",
    foundingFieldMeta: "32 founding coordinates · USD 99 one-time",
    systemMapLabel: "SYSTEM MAP",
    systemMapRoot: "public home",
    systemMapAria: "BHRIGU system map: BTC Cosmographer is the current Bitcoin product, with Frey, Cosmographer, and ORION as distinct related surfaces.",
    btcSystemLanes: ["Market evidence", "Change / Snapshot", "Expectations", "Astro field", "Sources / Proof"],
    freyVisual: "active temporal reading / dialogue",
    cosmographerVisual: "interpretation / navigation",
    orionVisual: "protected research depth",
    proofObjectLabel: "BTC FIELD · ACCEPTED STATE",
    currentStateLabel: "CURRENT STATE",
    changeStateLabel: "WHAT CHANGED",
    evidenceStateLabel: "EVIDENCE STATUS",
    sourceProofLabel: "SOURCE / PROOF",
    changedWord: "changed",
    stableWord: "stable",
    sourcesWord: "sources",
    comparableWord: "comparable",
    productEyebrow: "THE PRODUCT",
    productTitle: "One read. Three connected layers.",
    productIntro:
      "Market Cosmographer turns a market question into a bounded reading: what the evidence says now, how the field fits together, and which conditions matter next.",
    productLayers: [
      ["Market evidence", "Accepted source data establishes the observable state."],
      ["Field context", "Related signals are read together without forcing agreement."],
      ["Forward conditions", "The read states what would strengthen, weaken or invalidate the current interpretation."],
    ],
    outcomesEyebrow: "OUTCOMES",
    outcomesTitle: "Read the change before you read the noise.",
    outcomesIntro:
      "The system is designed to separate a real field change from an isolated number, a repeated narrative or an unsupported prediction.",
    outcomes: [
      ["What changed", "A verified delta against an accepted evidence state."],
      ["Why it matters", "The relationship between structure, participation, liquidity, time and memory."],
      ["What to watch", "Explicit conditions that would confirm, contradict or limit the current read."],
    ],
    btcEyebrow: "FIRST PROVEN LIVE CORRIDOR",
    btcTitle: "BTC Field",
    btcBody:
      "Bitcoin is the first public corridor where Market Cosmographer joins a verified Snapshot, market structure, field memory, temporal context and question-led reading.",
    btcDetail:
      "Open the current field, inspect its evidence boundary, then ask a bounded follow-up in the live dialogue.",
    btcStatus: "LIVE PUBLIC CORRIDOR",
    polymarketEyebrow: "EXPECTATION EVIDENCE",
    polymarketTitle: "Polymarket expectations",
    polymarketBody:
      "BTC Field can read selected Polymarket contracts as a bounded expectation layer. Each market-implied value belongs to a specific proposition, expiry and resolution rule.",
    polymarketBoundary:
      "Separate from the verified Snapshot · Not a BHRIGU price forecast · No trading signal",
    polymarketCta: "See how expectation evidence is bounded",
    questionEyebrow: "QUESTION → KNOWLEDGE",
    questionTitle: "A question becomes a traceable read.",
    questionSteps: [
      ["Ask", "Start with the change, market structure, a named field subject or a defined time window."],
      ["Route", "The question selects the relevant evidence lane and preserves its boundary."],
      ["Read", "Cosmographer composes the answer, conditions and limits in a visible order."],
      ["Verify", "Sources, observation period and available proof remain attached to the result."],
    ],
    proofEyebrow: "PUBLIC PROOF",
    proofTitle: "Evidence is part of the product surface.",
    proofBody:
      "The analytical mirror exposes the accepted market Snapshot, provenance, field structure, methodology and change record used to evaluate the public corridor.",
    proofBoundary:
      "Evidence supports an inspectable research reading. It does not create trading advice or prediction certainty.",
    methodEyebrow: "METHOD",
    methodTitle: "Observe. Relate. Condition.",
    methodItems: [
      ["Observe", "Bind the read to accepted data and its stated revision."],
      ["Relate", "Compare modules as one field while preserving divergence."],
      ["Condition", "Name the forward conditions and the point where the interpretation stops holding."],
    ],
    rolesEyebrow: "SYSTEM ROLES",
    rolesTitle: "Several public surfaces. Distinct roles.",
    roles: [
      ["BHRIGU", "is the public home for working services, research surfaces, and products"],
      ["Frey", "is an active temporal reading and dialogue service"],
      ["Cosmographer", "handles interpretation and navigation across bounded evidence"],
      ["ORION", "remains protected research depth"],
    ],
    continuityEyebrow: "FIELD CONTINUITY",
    continuityTitle: "Keep the analytical frame coherent.",
    continuityBody:
      "Field Continuity preserves the subject, evidence boundary and accepted starting state inside a defined reading, so a follow-up can be compared without silently changing the question.",
    continuityBoundary:
      "It is a reading value, not a promise of account history, cross-device memory, alerts, monitoring or automatic delivery.",
    marketsEyebrow: "MARKETS",
    marketsTitle: "Bitcoin first. Expansion only after proof.",
    marketsBody:
      "The method can be applied to additional market fields, but BTC Field is the first and only proven public live corridor today. New corridors remain outside the public claim until their data, method and acceptance are verified.",
    footerCommerceEyebrow: "THREE LIVE OBJECTS",
    footerCommerceTitle: "Three different kinds of work.",
    footerCommerceBody:
      "Inspect one bounded system. Read one subject across a meaningful horizon. Claim one durable coordinate in a finite public field.",
    footerReconLine: "One bounded system. Three findings. Evidence. Exact repair blueprint.",
    footerFreyLine: "One subject. One temporal horizon. One complete reading you can keep.",
    footerFieldLine: "One durable public coordinate for an agent, model, project or product.",
    footerIdentity: "BTC FIELD · MARKET COSMOGRAPHER",
  },
  ru: {
    category: "СИСТЕМА AI-АНАЛИТИКИ РЫНКОВ",
    h1Lead: "Что изменилось в Bitcoin —",
    h1Close: "и что изменит текущее чтение.",
    subheadline:
      "Для самостоятельных Bitcoin-инвесторов: проверенное изменение, его значение и явные условия в одном чтении со связанными доказательствами.",
    openBtc: "Спросить, что изменилось в Bitcoin",
    viewProof: "Посмотреть публичные доказательства",
    viewSquare: "Живые исследования в Binance Square",
    workRecon: "Внешний системный recon · USD 300",
    passportAccess: "Космографический паспорт · USD 79",
    foundingField: "AI Founding Field",
    foundingFieldMeta: "32 founding-координаты · USD 99 один раз",
    systemMapLabel: "КАРТА СИСТЕМЫ",
    systemMapRoot: "публичный дом",
    systemMapAria: "Карта системы BHRIGU: BTC Cosmographer — текущий Bitcoin-продукт; Frey, Космограф и ORION — отдельные связанные поверхности.",
    btcSystemLanes: ["Рыночные данные", "Изменение / Snapshot", "Ожидания", "Астро-поле", "Источники / Proof"],
    freyVisual: "действующее темпоральное чтение / диалог",
    cosmographerVisual: "интерпретация / навигация",
    orionVisual: "защищённая исследовательская глубина",
    proofObjectLabel: "BTC FIELD · ПРИНЯТОЕ СОСТОЯНИЕ",
    currentStateLabel: "ТЕКУЩЕЕ СОСТОЯНИЕ",
    changeStateLabel: "ЧТО ИЗМЕНИЛОСЬ",
    evidenceStateLabel: "СТАТУС ДОКАЗАТЕЛЬСТВ",
    sourceProofLabel: "ИСТОЧНИКИ / PROOF",
    changedWord: "изменено",
    stableWord: "стабильно",
    sourcesWord: "источников",
    comparableWord: "сопоставимых",
    productEyebrow: "ПРОДУКТ",
    productTitle: "Одно чтение. Три связанных слоя.",
    productIntro:
      "Market Cosmographer превращает вопрос о рынке в ограниченное чтение: что показывают доказательства сейчас, как связано поле и какие условия важны дальше.",
    productLayers: [
      ["Рыночные доказательства", "Принятые данные источников устанавливают наблюдаемое состояние."],
      ["Контекст поля", "Связанные сигналы читаются вместе без принудительного согласования."],
      ["Будущие условия", "Чтение показывает, что усилит, ослабит или отменит текущую интерпретацию."],
    ],
    outcomesEyebrow: "РЕЗУЛЬТАТ",
    outcomesTitle: "Сначала изменение. Потом шум.",
    outcomesIntro:
      "Система отделяет реальное изменение поля от отдельной цифры, повторяемого нарратива или неподтверждённого прогноза.",
    outcomes: [
      ["Что изменилось", "Проверенная дельта относительно принятого состояния доказательств."],
      ["Почему это важно", "Связь структуры, участия, ликвидности, времени и памяти."],
      ["Что отслеживать", "Явные условия, которые подтвердят, опровергнут или ограничат текущее чтение."],
    ],
    btcEyebrow: "ПЕРВЫЙ ДОКАЗАННЫЙ ЖИВОЙ КОРИДОР",
    btcTitle: "BTC Field",
    btcBody:
      "Bitcoin — первый публичный коридор, где Market Cosmographer объединяет проверенный Snapshot, структуру рынка, память поля, временной контекст и чтение по вопросу.",
    btcDetail:
      "Откройте текущее поле, проверьте границу доказательств и задайте ограниченный уточняющий вопрос в живом диалоге.",
    btcStatus: "ЖИВОЙ ПУБЛИЧНЫЙ КОРИДОР",
    polymarketEyebrow: "ДОКАЗАТЕЛЬСТВА ОЖИДАНИЙ",
    polymarketTitle: "Ожидания Polymarket",
    polymarketBody:
      "BTC Field может читать отдельные контракты Polymarket как ограниченный слой рыночных ожиданий. Каждая market-implied оценка относится к конкретному условию, сроку и правилам разрешения.",
    polymarketBoundary:
      "Отдельно от проверенного Snapshot · Не прогноз цены BHRIGU · Без торговых сигналов",
    polymarketCta: "Как ограничены evidence ожиданий",
    questionEyebrow: "ВОПРОС → ЗНАНИЕ",
    questionTitle: "Вопрос становится проверяемым чтением.",
    questionSteps: [
      ["Вопрос", "Начните с изменения, структуры рынка, предмета поля или заданного временного окна."],
      ["Маршрут", "Вопрос выбирает нужную линию доказательств и сохраняет её границу."],
      ["Чтение", "Космограф собирает ответ, условия и ограничения в видимом порядке."],
      ["Проверка", "Источники, период наблюдения и доступные доказательства остаются связаны с результатом."],
    ],
    proofEyebrow: "ПУБЛИЧНЫЕ ДОКАЗАТЕЛЬСТВА",
    proofTitle: "Доказательства встроены в продукт.",
    proofBody:
      "Аналитическое зеркало показывает принятый рыночный Snapshot, происхождение данных, структуру поля, метод и историю изменений, по которым проверяется публичный коридор.",
    proofBoundary:
      "Доказательства поддерживают проверяемое исследовательское чтение. Они не создают торговый совет или уверенность в предсказании.",
    methodEyebrow: "МЕТОД",
    methodTitle: "Наблюдать. Связывать. Формулировать условия.",
    methodItems: [
      ["Наблюдать", "Привязать чтение к принятым данным и заявленной ревизии."],
      ["Связывать", "Сопоставить модули как одно поле, сохраняя расхождения."],
      ["Условия", "Назвать будущие условия и точку, где интерпретация перестаёт действовать."],
    ],
    rolesEyebrow: "РОЛИ СИСТЕМЫ",
    rolesTitle: "Несколько публичных поверхностей. Разные роли.",
    roles: [
      ["BHRIGU", "публичный дом работающих сервисов, исследовательских поверхностей и продуктов"],
      ["Frey", "действующий сервис темпорального чтения и диалога"],
      ["Космограф", "интерпретация и навигация в пределах проверяемых данных"],
      ["ORION", "защищённая исследовательская глубина"],
    ],
    continuityEyebrow: "НЕПРЕРЫВНОСТЬ ПОЛЯ",
    continuityTitle: "Сохраняйте целостность аналитической рамки.",
    continuityBody:
      "Field Continuity сохраняет предмет, границу доказательств и принятое исходное состояние внутри определённого чтения, чтобы уточнение не меняло вопрос незаметно.",
    continuityBoundary:
      "Это ценность чтения, а не обещание истории аккаунта, межустройственной памяти, уведомлений, мониторинга или автоматической доставки.",
    marketsEyebrow: "РЫНКИ",
    marketsTitle: "Сначала Bitcoin. Расширение — только после доказательств.",
    marketsBody:
      "Метод применим к другим рыночным полям, но сегодня BTC Field — первый и единственный доказанный публичный живой коридор. Новые коридоры не входят в публичное обещание до проверки данных, метода и приёмки.",
    footerCommerceEyebrow: "ТРИ ЖИВЫХ ОБЪЕКТА",
    footerCommerceTitle: "Три разных типа работы.",
    footerCommerceBody:
      "Исследовать одну ограниченную систему. Прочитать один объект в значимом временном горизонте. Занять одну долговечную координату в конечном публичном поле.",
    footerReconLine: "Одна ограниченная система. Три ключевых finding. Evidence. Точный repair blueprint.",
    footerFreyLine: "Один объект. Один временной горизонт. Одно полное чтение, которое остаётся у вас.",
    footerFieldLine: "Одна долговечная публичная координата для агента, модели, проекта или продукта.",
    footerIdentity: "BTC FIELD · MARKET COSMOGRAPHER",
  },
};

function EditorialList({ items, numbered = false }) {
  return (
    <ol className={styles.editorialList} data-numbered={numbered ? "true" : "false"}>
      {items.map(([title, body], index) => (
        <li key={title}>
          <span className={styles.index}>{String(index + 1).padStart(2, "0")}</span>
          <div><h3>{title}</h3><p>{body}</p></div>
        </li>
      ))}
    </ol>
  );
}

function SectionHeading({ eyebrow, title, body }) {
  return <div className={styles.sectionHeading}><p className={styles.eyebrow}>{eyebrow}</p><h2>{title}</h2>{body ? <p className={styles.sectionLead}>{body}</p> : null}</div>;
}

function buildJsonLd(locale) {
  const ru = locale === "ru";
  const home = `https://www.bhrigu.io/?lang=${locale}`;
  const product = `${home}#market-cosmographer`;
  const btc = `https://www.bhrigu.io/crypto-astro/btc?lang=${locale}`;
  const pageName = ru ? "Market Cosmographer · AI-анализ рынков | BHRIGU" : "Market Cosmographer · AI Market Intelligence | BHRIGU";
  const description = ru
    ? "Система AI-аналитики рынков, объединяющая проверенные рыночные данные, контекст поля и явные условия в чтении со связанными доказательствами."
    : "An AI market intelligence system combining verified market data, field context and explicit conditions in an evidence-linked read.";
  return {"@context":"https://schema.org","@graph":[{"@type":"Organization","@id":"https://www.bhrigu.io/#organization",name:"BHRIGU",url:"https://www.bhrigu.io/",sameAs:[X_PROFILE_URL,BINANCE_SQUARE_PROFILE_URL[locale] || BINANCE_SQUARE_PROFILE_URL.en]},{"@type":"WebSite","@id":"https://www.bhrigu.io/#website",name:"BHRIGU",url:"https://www.bhrigu.io/",publisher:{"@id":"https://www.bhrigu.io/#organization"}},{"@type":"WebPage","@id":`${home}#webpage`,url:home,name:pageName,isPartOf:{"@id":"https://www.bhrigu.io/#website"},about:{"@id":product},inLanguage:locale},{"@type":"SoftwareApplication","@id":product,name:"Market Cosmographer",applicationCategory:"BusinessApplication",operatingSystem:"Web",url:home,description,inLanguage:locale},{"@type":"BreadcrumbList","@id":`${home}#breadcrumb`,itemListElement:[{"@type":"ListItem",position:1,name:"BHRIGU",item:home},{"@type":"ListItem",position:2,name:"Market Cosmographer",item:product},{"@type":"ListItem",position:3,name:"BTC Field",item:btc}]}]};
}

function formatAcceptedSnapshotTime(value) { if (!value) return null; const date = new Date(value); if (!Number.isFinite(date.getTime())) return null; return `${date.toISOString().slice(0,16).replace("T"," ")} UTC`; }
function acceptedStateView(locale, state) {
  const ru = locale === "ru";
  const synthesis = {CONFIRMATION:ru?"ПОДТВЕРЖДЕНИЕ":"CONFIRMATION",DIVERGENCE:ru?"РАСХОЖДЕНИЕ":"DIVERGENCE",INSUFFICIENT_EVIDENCE:ru?"ГРАНИЦА ДОКАЗАТЕЛЬСТВ":"EVIDENCE BOUNDARY",UNAVAILABLE:ru?"ПРОВЕРКА НЕДОСТУПНА":"VERIFICATION UNAVAILABLE"}[state.synthesis_state] || (ru?"ПРОВЕРКА НЕДОСТУПНА":"VERIFICATION UNAVAILABLE");
  const freshness = state.freshness === "FRESH" ? (ru?"СВЕЖИЙ SNAPSHOT":"FRESH SNAPSHOT") : state.freshness === "STALE_LIMITED" ? (ru?"ОГРАНИЧЕННАЯ СВЕЖЕСТЬ":"STALE · LIMITED") : (ru?"ИСТОЧНИК НЕДОСТУПЕН":"SOURCE UNAVAILABLE");
  const delta = {MIXED:ru?"СМЕШАННАЯ ДЕЛЬТА":"MIXED DELTA",UP:ru?"ДЕЛЬТА ВВЕРХ":"UP DELTA",DOWN:ru?"ДЕЛЬТА ВНИЗ":"DOWN DELTA",STABLE:ru?"СТАБИЛЬНАЯ ДЕЛЬТА":"STABLE DELTA",BOUNDED:ru?"ОГРАНИЧЕННАЯ ДЕЛЬТА":"BOUNDED DELTA",UNAVAILABLE:ru?"ДЕЛЬТА НЕДОСТУПНА":"DELTA UNAVAILABLE"}[state.delta_direction] || (ru?"ДЕЛЬТА НЕДОСТУПНА":"DELTA UNAVAILABLE");
  const snapshot = formatAcceptedSnapshotTime(state.snapshot_time_utc);
  const proof = state.status === "UNAVAILABLE" ? (ru?"СТАТИЧЕСКОЕ ПОЛЕ · ОЖИДАЕТ ПРОВЕРКИ":"STATIC FIELD · VERIFICATION PENDING") : `${state.evidence_source_count} ${ru?"ИСТОЧНИКОВ":"SOURCES"} · ${state.comparable_metric_count} ${ru?"СОПОСТАВИМЫХ":"COMPARABLE"} · ${delta}`;
  const meta = [freshness,snapshot].filter(Boolean).join(" · ");
  const kicker = ru?"ПРИНЯТОЕ СОСТОЯНИЕ BTC":"ACCEPTED BTC STATE";
  const aria = ru ? `Принятое состояние BTC Field: ${synthesis}. ${meta}. ${proof}. Доступ AI-агента обозначен только как будущее.` : `BTC Field accepted state: ${synthesis}. ${meta}. ${proof}. AI-agent access is marked as future only.`;
  return {synthesis,freshness,delta,snapshot,proof,meta,kicker,aria};
}

export async function getServerSideProps({ query, res }) {
  res?.setHeader?.("Cache-Control", "public, s-maxage=300, stale-while-revalidate=900");
  let btcAcceptedState = EMPTY_BTC_HOME_ACCEPTED_STATE;
  try { btcAcceptedState = await loadBtcHomeAcceptedState(); } catch { btcAcceptedState = EMPTY_BTC_HOME_ACCEPTED_STATE; }
  return { props: { locale: query.lang === "ru" ? "ru" : "en", btcAcceptedState } };
}

export default function Home({ locale, btcAcceptedState = EMPTY_BTC_HOME_ACCEPTED_STATE }) {
  const copy = COPY[locale] || COPY.en;
  const publicEvidence = PUBLIC_EVIDENCE_COPY[locale] || PUBLIC_EVIDENCE_COPY.en;
  const publicChannels = PUBLIC_CHANNEL_COPY[locale] || PUBLIC_CHANNEL_COPY.en;
  const acceptedState = acceptedStateView(locale, btcAcceptedState);
  const btcEntryHref = `/crypto-astro/btc?lang=${locale}`;
  const primaryQuestion = locale === "ru" ? "Что изменилось в Bitcoin с предыдущего принятого Snapshot — и почему это важно?" : "What changed in Bitcoin since the previous accepted Snapshot — and why does it matter?";
  const btcQuestionHref = `/crypto-astro/btc/clean-chat?lang=${locale}&q=${encodeURIComponent(primaryQuestion)}`;
  const jsonLd = buildJsonLd(locale);
  return <>
    <Head><meta name="phi-surface" content="MARKET_COSMOGRAPHER_PRIMARY_PRODUCT_V0_1"/></Head>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(jsonLd)}}/>
    <main id="market-cosmographer" className={styles.page} lang={locale} data-primary-product="market-cosmographer" data-home-contract="BHRIGU_HOME_CANONICAL_VISUAL_GEOMETRY_AND_FIRST_FOLD_FINAL_REPAIR_v0_1">
      <section className={styles.hero} aria-labelledby="home-title">
        <div className={styles.heroCopy}><p className={styles.product}>MARKET COSMOGRAPHER</p><p className={styles.category}>{copy.category}</p><h1 id="home-title"><span>{copy.h1Lead}</span><span>{copy.h1Close}</span></h1><p className={styles.subheadline}>{copy.subheadline}</p><div className={styles.heroActions}><Link className={styles.primaryCta} href={btcQuestionHref} data-primary-cta="btc-current-change-question">{copy.openBtc}<span aria-hidden="true">↗</span></Link><a className={styles.secondaryCta} href="#public-evidence" data-secondary-cta="public-proof">{copy.viewProof}</a><a className={styles.heroProofSignal} href="#public-evidence" data-hero-public-evidence>{publicEvidence.signal.map((item)=><span key={item}>{item}</span>)}</a><div className={styles.commercialActions} aria-label={locale === "ru" ? "Коммерческие маршруты" : "Commercial routes"}><Link className={styles.secondaryCta} href={`/access?lang=${locale}`} data-commercial-cta="external-systems-recon">{copy.workRecon}</Link><Link className={styles.secondaryCta} href={`/access?offer=frey-personal&lang=${locale}`} data-commercial-cta="cosmographic-passport-usd79">{copy.passportAccess}</Link><Link className={styles.secondaryCta} href={`/field?lang=${locale}`} data-commercial-cta="ai-founding-field"><span>{copy.foundingField}</span><small> · {copy.foundingFieldMeta}</small></Link></div></div></div>
        <div className={styles.heroVisual} aria-label={copy.systemMapAria} data-btc-status={btcAcceptedState.status} data-btc-freshness={btcAcceptedState.freshness} data-btc-synthesis={btcAcceptedState.synthesis_state} data-btc-delta={btcAcceptedState.delta_direction} data-btc-conditions={btcAcceptedState.conditions_state}>
          <nav className={styles.fieldCanvas} data-btc-field-canvas data-home-system-map aria-label={copy.systemMapLabel}>
            <FieldAnchorGlyph className={styles.homeFieldAnchorGlyph}/>
            <div className={styles.systemMapTopline}><Link className={styles.systemMapLink} href={`/map?lang=${locale}`} data-home-system-map-link>{copy.systemMapLabel} <span aria-hidden="true">↗</span></Link></div>
            <div className={styles.systemRoot} data-system-role="boundary"><strong>BHRIGU</strong><small>{copy.systemMapRoot}</small></div>
            <div className={styles.systemBranches} data-system-relations="true">
              <RelationGlyph className={styles.homeRelationGlyph}/>
              <Link className={`${styles.systemNode} ${styles.systemNodePrimary}`} href={btcEntryHref} data-system-node="btc" data-system-role="primary">
                <span className={styles.systemNodeTitle}><strong>BTC COSMOGRAPHER</strong><small>01</small></span>
                <span className={styles.btcSystemLanes}>{copy.btcSystemLanes.map((lane)=><i key={lane}>{lane}</i>)}</span>
              </Link>
              <Link className={`${styles.systemNode} ${styles.systemNodeFrey}`} href={`/frey?lang=${locale}`} data-system-node="frey" data-system-role="temporal"><span className={styles.systemNodeTitle}><strong>FREY</strong><small>02</small></span><span>{copy.freyVisual}</span></Link>
              <Link className={`${styles.systemNode} ${styles.systemNodeCosmographer}`} href={`/cosmographer?lang=${locale}`} data-system-node="cosmographer" data-system-role="membrane"><span className={styles.systemNodeTitle}><strong>{locale === "ru" ? "КОСМОГРАФ" : "COSMOGRAPHER"}</strong><small>03</small></span><span>{copy.cosmographerVisual}</span></Link>
              <Link className={`${styles.systemNode} ${styles.systemNodeOrion}`} href={`/orion?lang=${locale}`} data-system-node="orion" data-system-role="depth"><span className={styles.systemNodeTitle}><strong>ORION</strong><small>04</small></span><span>{copy.orionVisual}</span></Link>
            </div>
          </nav>
          <div className={styles.acceptedStateBand} data-btc-accepted-state data-home-btc-proof-object aria-label={acceptedState.aria}>
            <div className={styles.proofObjectHeader}><span className={styles.stateKicker} data-btc-state-kicker>{copy.proofObjectLabel}</span><strong>{acceptedState.synthesis}</strong></div>
            <div className={styles.proofStateGrid}>
              <span><small>{copy.currentStateLabel}</small><strong>{acceptedState.synthesis}</strong><i data-btc-state-meta>{acceptedState.meta || "—"}</i></span>
              <span><small>{copy.changeStateLabel}</small><strong>{acceptedState.delta}</strong><i>{btcAcceptedState.changed_metric_count} {copy.changedWord} · {btcAcceptedState.stable_metric_count} {copy.stableWord}</i></span>
              <span><small>{copy.sourceProofLabel}</small><strong>{btcAcceptedState.evidence_source_count} {copy.sourcesWord}</strong><i data-btc-state-proof>{btcAcceptedState.comparable_metric_count} {copy.comparableWord} · {acceptedState.delta}</i></span>
            </div>
          </div>
        </div>
      </section>
      <section id="public-evidence" className={`${styles.editorialSection} ${styles.externalEvidenceSection}`} data-public-evidence-rail>
        <SectionHeading eyebrow={publicEvidence.eyebrow} title={publicEvidence.title} body={publicEvidence.intro}/>
        <div className={styles.externalProofRail}>
          {publicEvidence.cases.map((item)=><article className={styles.externalProofObject} key={item.id} data-evidence-object={item.id}>
            <p className={styles.externalProofKicker}>{item.kicker}</p><h3>{item.title}</h3><p>{item.body}</p><small>{item.status}</small>
            <nav aria-label={`${item.title} proof links`}>{item.links.map(([label,href])=><a key={href} href={href} target="_blank" rel="noopener noreferrer">{label} <span aria-hidden="true">↗</span></a>)}</nav>
          </article>)}
          <p className={styles.externalEvidenceBoundary}>{publicEvidence.boundary}</p>
          <nav className={styles.publicChannelRail} data-public-channel-rail aria-label={publicChannels.eyebrow}>
            <span>{publicChannels.eyebrow}</span>
            <a href={X_PROFILE_URL} target="_blank" rel="noopener noreferrer">{publicChannels.x} <i aria-hidden="true">↗</i></a>
            <a href={BINANCE_SQUARE_PROFILE_URL[locale] || BINANCE_SQUARE_PROFILE_URL.en} target="_blank" rel="noopener noreferrer">{publicChannels.square} <i aria-hidden="true">↗</i></a>
          </nav>
        </div>
      </section>
      <section id="product" className={styles.editorialSection}><SectionHeading eyebrow={copy.productEyebrow} title={copy.productTitle} body={copy.productIntro}/><EditorialList items={copy.productLayers}/></section>
      <section id="outcomes" className={`${styles.editorialSection} ${styles.blueSection}`}><SectionHeading eyebrow={copy.outcomesEyebrow} title={copy.outcomesTitle} body={copy.outcomesIntro}/><EditorialList items={copy.outcomes}/></section>
      <section id="btc-field" className={`${styles.editorialSection} ${styles.btcSection}`}><div><SectionHeading eyebrow={copy.btcEyebrow} title={copy.btcTitle} body={copy.btcBody}/><p className={styles.sectionSupport}>{copy.btcDetail}</p><aside className={styles.polymarketLane} data-polymarket-public-reveal="bounded-expectation-layer" aria-labelledby="home-polymarket-title"><div><p className={styles.expectationEyebrow}>{copy.polymarketEyebrow}</p><h3 id="home-polymarket-title">{copy.polymarketTitle}</h3><p>{copy.polymarketBody}</p><small>{copy.polymarketBoundary}</small><Link href={`${btcEntryHref}#polymarket-expectations`}>{copy.polymarketCta} <span aria-hidden="true">→</span></Link></div></aside><Link className={styles.textCta} href={btcEntryHref}>{locale === "ru" ? "Открыть обзор BTC Field" : "Open BTC Field overview"} <span aria-hidden="true">→</span></Link></div><div className={styles.btcVisual} aria-label={copy.btcStatus} role="img"><span className={styles.btcOrbit}/><span className={styles.btcDisc}>₿</span><span className={styles.btcStatus}>{copy.btcStatus}</span></div></section>
      <section id="question-to-knowledge" className={styles.editorialSection}><SectionHeading eyebrow={copy.questionEyebrow} title={copy.questionTitle}/><EditorialList items={copy.questionSteps} numbered/></section>
      <section id="proof" className={`${styles.editorialSection} ${styles.proofSection}`}><SectionHeading eyebrow={copy.proofEyebrow} title={copy.proofTitle} body={copy.proofBody}/><div className={styles.proofRoute}><p>{copy.proofBoundary}</p><div><a href={PUBLIC_PROOF_URL} className={styles.textCta}>{copy.viewProof} <span aria-hidden="true">↗</span></a></div></div></section>
      <PublicSupportRoute locale={locale} surface="home" />
      <section id="method" className={`${styles.editorialSection} ${styles.violetSection}`}><SectionHeading eyebrow={copy.methodEyebrow} title={copy.methodTitle}/><EditorialList items={copy.methodItems}/></section>
      <section id="system-roles" className={styles.editorialSection}><SectionHeading eyebrow={copy.rolesEyebrow} title={copy.rolesTitle}/><dl className={styles.roleMap}>{copy.roles.map(([name,role])=><div key={name}><dt>{name}</dt><dd>{role}</dd></div>)}</dl><nav className={styles.quietRoutes} aria-label={locale === "ru" ? "Маршруты системы BHRIGU" : "BHRIGU system routes"}><Link href={`/frey?lang=${locale}`}>Frey</Link><Link href={`/cosmographer?lang=${locale}`}>{locale === "ru" ? "Космограф" : "Cosmographer"}</Link><Link href={`/orion?lang=${locale}`}>ORION</Link></nav></section>
      <section id="continuity" className={`${styles.editorialSection} ${styles.continuitySection}`}><SectionHeading eyebrow={copy.continuityEyebrow} title={copy.continuityTitle} body={copy.continuityBody}/><p className={styles.boundaryNote}>{copy.continuityBoundary}</p></section>
      <section id="markets" className={styles.editorialSection}><SectionHeading eyebrow={copy.marketsEyebrow} title={copy.marketsTitle} body={copy.marketsBody}/><div className={styles.marketState}><span>01</span><strong>BTC FIELD</strong><small>{copy.btcStatus}</small></div></section>
      <section id="footer-offers" className={styles.footerCommerce}>
        <div className={styles.footerCommerceIntro}>
          <span className={styles.eyebrow}>{copy.footerCommerceEyebrow}</span>
          <h2>{copy.footerCommerceTitle}</h2>
          <p>{copy.footerCommerceBody}</p>
        </div>

        <div className={styles.footerOfferGrid} aria-label={locale === "ru" ? "Три коммерческих объекта BHRIGU" : "Three BHRIGU commercial objects"}>
          <article className={`${styles.footerOffer} ${styles.footerRecon}`} data-footer-offer="external-systems-recon">
            <div className={`${styles.footerVisual} ${styles.reconVisual}`} aria-hidden="true">
              <div className={styles.reconBoundary}>
                <span className={styles.reconNodeA} />
                <span className={styles.reconNodeB} />
                <span className={styles.reconNodeC} />
                <span className={styles.reconNodeD} />
                <span className={styles.reconFlowA} />
                <span className={styles.reconFlowB} />
                <span className={styles.reconFlowC} />
              </div>
              <div className={styles.reconEvidenceRail}><span>01</span><span>02</span><span>03</span></div>
            </div>
            <div className={styles.footerOfferBody}>
              <span className={styles.footerOfferIndex}>01 · SYSTEM TOPOLOGY</span>
              <h3><span aria-hidden="true">{"\u03A6"}</span> External Systems Recon</h3>
              <p>{copy.footerReconLine}</p>
              <div className={styles.footerOfferMeta}><strong>USD 300</strong><span>READ-ONLY</span></div>
              <Link className={styles.footerOfferCta} href={`/access?lang=${locale}`} data-commercial-cta="footer-external-systems-recon">Open Access <span aria-hidden="true">↗</span></Link>
            </div>
          </article>

          <article className={`${styles.footerOffer} ${styles.footerFrey}`} data-footer-offer="frey-personal">
            <div className={`${styles.footerVisual} ${styles.passportVisual}`} aria-hidden="true">
              <div className={styles.passportHorizon}><span /><span /><span /></div>
              <div className={styles.passportStack}>
                {Array.from({ length: 7 }, (_, index) => <span key={index} style={{ "--passport-layer": index }} />)}
              </div>
              <div className={styles.passportFocus} />
            </div>
            <div className={styles.footerOfferBody}>
              <span className={styles.footerOfferIndex}>02 · COSMOGRAPHIC PASSPORT</span>
              <h3>Frey Personal</h3>
              <small>Cosmographic Reading · Cosmographic Passport</small>
              <p>{copy.footerFreyLine}</p>
              <div className={styles.footerOfferMeta}><strong>USD 79</strong><span>ONE READING</span></div>
              <Link className={styles.footerOfferCta} href={`/access?offer=frey-personal&lang=${locale}`} data-commercial-cta="footer-frey-personal">Explore Frey <span aria-hidden="true">↗</span></Link>
            </div>
          </article>

          <article className={`${styles.footerOffer} ${styles.footerField}`} data-footer-offer="ai-founding-field">
            <div className={`${styles.footerVisual} ${styles.registryVisual}`} aria-hidden="true">
              <span className={styles.registryOrigin}>F-000</span>
              <div className={styles.registryGrid}>
                {Array.from({ length: 32 }, (_, index) => <span key={index} className={index === 6 ? styles.registryClaimed : undefined} />)}
              </div>
              <span className={styles.registryMachineLine}>PUBLIC · TIMESTAMPED · MACHINE-READABLE</span>
            </div>
            <div className={styles.footerOfferBody}>
              <span className={styles.footerOfferIndex}>03 · FINITE PUBLIC REGISTRY</span>
              <h3>AI Founding Field</h3>
              <small>32 Founding Coordinates</small>
              <p>{copy.footerFieldLine}</p>
              <div className={styles.footerOfferMeta}><strong>USD 99</strong><span>ONE-TIME</span></div>
              <Link className={styles.footerOfferCta} href={`/field?lang=${locale}`} data-commercial-cta="footer-ai-founding-field">Enter the Field <span aria-hidden="true">↗</span></Link>
            </div>
          </article>
        </div>

      </section>
      <footer id="open-btc-field" className={styles.siteFooter}>
        <strong>{copy.footerIdentity}</strong>
        <a href={`https://www.bhrigu.io/?lang=${locale}`}>www.bhrigu.io</a>
      </footer>
    </main>
  </>;
}