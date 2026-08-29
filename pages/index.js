import Head from "next/head";
import Link from "next/link";
import {
  EMPTY_BTC_HOME_ACCEPTED_STATE,
  loadBtcHomeAcceptedState,
} from "../lib/btc-home-accepted-state";
import styles from "./index.module.css";
import PublicSupportRoute from "../components/btc/PublicSupportRoute";
import { FieldAnchorGlyph } from "../components/btc/BtcSurfaceGlyphs";

const PUBLIC_PROOF_URL =
  "https://aibhrigu.github.io/phi-cosmography-open/crypto-astro/index.html#what-changed";

const COPY = {
  en: {
    category: "AI MARKET INTELLIGENCE SYSTEM",
    h1Lead: "See what changed in Bitcoin —",
    h1Close: "and what would change the current read.",
    subheadline:
      "For self-directed Bitcoin investors: verified change, why it matters, and explicit conditions in one evidence-linked read.",
    openBtc: "Ask what changed in Bitcoin",
    viewProof: "View public proof",
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
  return {"@context":"https://schema.org","@graph":[{"@type":"Organization","@id":"https://www.bhrigu.io/#organization",name:"BHRIGU",url:"https://www.bhrigu.io/"},{"@type":"WebSite","@id":"https://www.bhrigu.io/#website",name:"BHRIGU",url:"https://www.bhrigu.io/",publisher:{"@id":"https://www.bhrigu.io/#organization"}},{"@type":"WebPage","@id":`${home}#webpage`,url:home,name:pageName,isPartOf:{"@id":"https://www.bhrigu.io/#website"},about:{"@id":product},inLanguage:locale},{"@type":"SoftwareApplication","@id":product,name:"Market Cosmographer",applicationCategory:"BusinessApplication",operatingSystem:"Web",url:home,description,inLanguage:locale},{"@type":"BreadcrumbList","@id":`${home}#breadcrumb`,itemListElement:[{"@type":"ListItem",position:1,name:"BHRIGU",item:home},{"@type":"ListItem",position:2,name:"Market Cosmographer",item:product},{"@type":"ListItem",position:3,name:"BTC Field",item:btc}]}]};
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
        <div className={styles.heroCopy}><p className={styles.product}>MARKET COSMOGRAPHER</p><p className={styles.category}>{copy.category}</p><h1 id="home-title"><span>{copy.h1Lead}</span><span>{copy.h1Close}</span></h1><p className={styles.subheadline}>{copy.subheadline}</p><div className={styles.heroActions}><Link className={styles.primaryCta} href={btcQuestionHref} data-primary-cta="btc-current-change-question">{copy.openBtc}<span aria-hidden="true">↗</span></Link><a className={styles.secondaryCta} href={PUBLIC_PROOF_URL} data-secondary-cta="public-proof">{copy.viewProof}</a></div></div>
        <div className={styles.heroVisual} aria-label={copy.systemMapAria} data-btc-status={btcAcceptedState.status} data-btc-freshness={btcAcceptedState.freshness} data-btc-synthesis={btcAcceptedState.synthesis_state} data-btc-delta={btcAcceptedState.delta_direction} data-btc-conditions={btcAcceptedState.conditions_state}>
          <nav className={styles.fieldCanvas} data-btc-field-canvas data-home-system-map aria-label={copy.systemMapLabel}>
            <FieldAnchorGlyph className={styles.homeFieldAnchorGlyph}/>
            <div className={styles.systemMapTopline}><span>{copy.systemMapLabel}</span></div>
            <div className={styles.systemRoot}><strong>BHRIGU</strong><small>{copy.systemMapRoot}</small></div>
            <div className={styles.systemBranches}>
              <Link className={`${styles.systemNode} ${styles.systemNodePrimary}`} href={btcEntryHref} data-system-node="btc">
                <span className={styles.systemNodeTitle}><strong>BTC COSMOGRAPHER</strong><small>01</small></span>
                <span className={styles.btcSystemLanes}>{copy.btcSystemLanes.map((lane)=><i key={lane}>{lane}</i>)}</span>
              </Link>
              <Link className={styles.systemNode} href={`/frey?lang=${locale}`} data-system-node="frey"><span className={styles.systemNodeTitle}><strong>FREY</strong><small>02</small></span><span>{copy.freyVisual}</span></Link>
              <Link className={styles.systemNode} href={`/cosmographer?lang=${locale}`} data-system-node="cosmographer"><span className={styles.systemNodeTitle}><strong>{locale === "ru" ? "КОСМОГРАФ" : "COSMOGRAPHER"}</strong><small>03</small></span><span>{copy.cosmographerVisual}</span></Link>
              <Link className={styles.systemNode} href={`/orion?lang=${locale}`} data-system-node="orion"><span className={styles.systemNodeTitle}><strong>ORION</strong><small>04</small></span><span>{copy.orionVisual}</span></Link>
            </div>
          </nav>
          <div className={styles.acceptedStateBand} data-btc-accepted-state data-home-btc-proof-object aria-label={acceptedState.aria}>
            <div className={styles.proofObjectHeader}><span className={styles.stateKicker} data-btc-state-kicker>{copy.proofObjectLabel}</span><strong>{acceptedState.synthesis}</strong></div>
            <div className={styles.proofStateGrid}>
              <span><small>{copy.currentStateLabel}</small><strong>{acceptedState.synthesis}</strong><i data-btc-state-meta>{acceptedState.meta || "—"}</i></span>
              <span><small>{copy.changeStateLabel}</small><strong>{acceptedState.delta}</strong><i>{btcAcceptedState.changed_metric_count} {copy.changedWord} · {btcAcceptedState.stable_metric_count} {copy.stableWord}</i></span>
              <span><small>{copy.evidenceStateLabel}</small><strong>{acceptedState.freshness}</strong><i>{acceptedState.snapshot || "—"}</i></span>
              <span><small>{copy.sourceProofLabel}</small><strong>{btcAcceptedState.evidence_source_count} {copy.sourcesWord}</strong><i data-btc-state-proof>{btcAcceptedState.comparable_metric_count} {copy.comparableWord} · {acceptedState.delta}</i></span>
            </div>
          </div>
        </div>
      </section>
      <section id="product" className={styles.editorialSection}><SectionHeading eyebrow={copy.productEyebrow} title={copy.productTitle} body={copy.productIntro}/><EditorialList items={copy.productLayers}/></section>
      <section id="outcomes" className={`${styles.editorialSection} ${styles.blueSection}`}><SectionHeading eyebrow={copy.outcomesEyebrow} title={copy.outcomesTitle} body={copy.outcomesIntro}/><EditorialList items={copy.outcomes}/></section>
      <section id="btc-field" className={`${styles.editorialSection} ${styles.btcSection}`}><div><SectionHeading eyebrow={copy.btcEyebrow} title={copy.btcTitle} body={copy.btcBody}/><p className={styles.sectionSupport}>{copy.btcDetail}</p><aside className={styles.polymarketLane} data-polymarket-public-reveal="bounded-expectation-layer" aria-labelledby="home-polymarket-title"><div><p className={styles.expectationEyebrow}>{copy.polymarketEyebrow}</p><h3 id="home-polymarket-title">{copy.polymarketTitle}</h3><p>{copy.polymarketBody}</p><small>{copy.polymarketBoundary}</small><Link href={`${btcEntryHref}#polymarket-expectations`}>{copy.polymarketCta} <span aria-hidden="true">→</span></Link></div></aside><Link className={styles.textCta} href={btcEntryHref}>{locale === "ru" ? "Открыть обзор BTC Field" : "Open BTC Field overview"} <span aria-hidden="true">→</span></Link></div><div className={styles.btcVisual} aria-label={copy.btcStatus} role="img"><span className={styles.btcOrbit}/><span className={styles.btcDisc}>₿</span><span className={styles.btcStatus}>{copy.btcStatus}</span></div></section>
      <section id="question-to-knowledge" className={styles.editorialSection}><SectionHeading eyebrow={copy.questionEyebrow} title={copy.questionTitle}/><EditorialList items={copy.questionSteps} numbered/></section>
      <section id="proof" className={`${styles.editorialSection} ${styles.proofSection}`}><SectionHeading eyebrow={copy.proofEyebrow} title={copy.proofTitle} body={copy.proofBody}/><div className={styles.proofRoute}><p>{copy.proofBoundary}</p><a href={PUBLIC_PROOF_URL} className={styles.textCta}>{copy.viewProof} <span aria-hidden="true">↗</span></a></div></section>
      <PublicSupportRoute locale={locale} surface="home" />
      <section id="method" className={`${styles.editorialSection} ${styles.violetSection}`}><SectionHeading eyebrow={copy.methodEyebrow} title={copy.methodTitle}/><EditorialList items={copy.methodItems}/></section>
      <section id="system-roles" className={styles.editorialSection}><SectionHeading eyebrow={copy.rolesEyebrow} title={copy.rolesTitle}/><dl className={styles.roleMap}>{copy.roles.map(([name,role])=><div key={name}><dt>{name}</dt><dd>{role}</dd></div>)}</dl><nav className={styles.quietRoutes} aria-label={locale === "ru" ? "Маршруты системы BHRIGU" : "BHRIGU system routes"}><Link href={`/frey?lang=${locale}`}>Frey</Link><Link href={`/cosmographer?lang=${locale}`}>{locale === "ru" ? "Космограф" : "Cosmographer"}</Link><Link href={`/orion?lang=${locale}`}>ORION</Link></nav></section>
      <section id="continuity" className={`${styles.editorialSection} ${styles.continuitySection}`}><SectionHeading eyebrow={copy.continuityEyebrow} title={copy.continuityTitle} body={copy.continuityBody}/><p className={styles.boundaryNote}>{copy.continuityBoundary}</p></section>
      <section id="markets" className={styles.editorialSection}><SectionHeading eyebrow={copy.marketsEyebrow} title={copy.marketsTitle} body={copy.marketsBody}/><div className={styles.marketState}><span>01</span><strong>BTC FIELD</strong><small>{copy.btcStatus}</small></div></section>
      <footer id="open-btc-field" className={styles.siteFooter}><strong>{copy.footerIdentity}</strong><a href={`https://www.bhrigu.io/?lang=${locale}`}>www.bhrigu.io</a></footer>
    </main>
  </>;
}
