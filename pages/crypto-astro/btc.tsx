import Head from "next/head";
import type { GetServerSideProps } from "next";
import { BtcBinanceCurrentVenuePanel } from "../../components/btc/BtcBinanceCurrentVenue";
import { BtcBinanceFreeObservationPanel } from "../../components/btc/BtcBinanceFreeObservation";
import { BtcEvidenceZone } from "../../components/btc/BtcEvidence";
import { BtcObservationZone, BtcPhiZone } from "../../components/btc/BtcExecutivePhi";
import { BtcHeroQuestionLaunch } from "../../components/btc/BtcHeroQuestionLaunch";
import { BtcQuestionMembrane } from "../../components/btc/BtcQuestionMembrane";
import PublicSupportRoute from "../../components/btc/PublicSupportRoute";
import { loadBtcBinanceFreeObservationBridge } from "../../lib/btc-binance-free-observation-bridge";
import type { BtcBinanceFreeObservation } from "../../lib/btc-binance-free-observation-contract";
import { BTC_BINANCE_FREE_OBSERVATION_CSS } from "../../lib/btc-binance-free-observation-style";
import { loadBtcBinancePublicCorridorLive, type BtcBinancePublicCorridorLiveBinding } from "../../lib/btc-binance-public-corridor-live";
import { loadBtcMarketEnvelope, type BtcMarketEnvelope, type BtcMarketEnvelopeFailure } from "../../lib/btc-market-envelope";
import { BTC_BILINGUAL_SURFACE_CSS } from "../../lib/btc-bilingual-surface-style";
import { MARKET_COSMOGRAPHER_EXISTING_GLYPH_CANON_SHA256 } from "../../lib/btc-existing-glyph-canon";
import {
  formatBtcFailureMessage,
  formatBtcNarrativeReadLocalized,
  formatBtcUtcTimestamp,
  getBtcExampleRoutes,
  getBtcPublicCopy,
  normalizeBtcDisplayQuestion,
  resolveBtcPublicLocale,
  type BtcLocaleSource,
  type BtcPublicLocale,
} from "../../lib/btc-public-language-contract";
import { canonicalizeBtcQuestionForRouter } from "../../lib/btc-public-question-bridge";
import { composeBtcPublicSnapshot } from "../../lib/btc-public-snapshot-composer";
import { loadBtcStaticSource } from "../../lib/btc-public-static-source";
import { renderBtcNarrativeRead } from "../../lib/btc-narrative-template-catalog";
import type { BtcFailureCode, BtcPublicSnapshot, FreshnessState } from "../../lib/btc-public-output-contract";
import { factLine, formatBtcSnapshotTruth, sectionTitle } from "../../lib/btc-public-surface-format";
import { BTC_PRODUCT_REBALANCE_CSS } from "../../lib/btc-product-rebalance-style";

const BTC_ACCEPTED_PUBLIC_KNOWLEDGE: Record<BtcPublicLocale, Array<{ question: string; answer: string }>> = {
  en: [
    { question: "What is Market Cosmographer?", answer: "Market Cosmographer is BHRIGU's evidence-linked market intelligence product. BTC Field is its first public corridor." },
    { question: "Who is BTC Field for?", answer: "BTC Field is designed for self-directed Bitcoin investors who need evidence-linked current state, accepted change memory, verified sources, and explicit conditions without price targets or trading signals." },
    { question: "What does the current BTC read use?", answer: "It uses the accepted Market Snapshot, verified derivations, and the latest compatible Snapshot Delta." },
    { question: "Does BTC Field provide price forecasts or trading signals?", answer: "Not in the current public corridor. It provides evidence-linked current state, accepted changes, sources, and explicit conditions; it does not provide price targets, trading signals, leverage instructions, or position sizing." },
    { question: "How are protocol and market answers separated?", answer: "Protocol answers use pinned Bitcoin sources; market answers use accepted market records. One evidence lane does not replace another." },
    { question: "How does BTC Field use Polymarket?", answer: "As a bounded expectation-evidence layer for specific future propositions. Each market-implied value belongs only to the contract wording, expiry and resolution rules; it is not a global probability for Bitcoin, a BHRIGU price forecast or a trading signal." },
    { question: "How is astronomy compared with BTC?", answer: "Astronomical evidence and BTC state are checked independently. Temporal concurrence is not presented as causality." },
  ],
  ru: [
    { question: "Что такое Market Cosmographer?", answer: "Market Cosmographer — продукт BHRIGU для доказательно связанной рыночной аналитики. BTC Field — его первый публичный коридор." },
    { question: "Для кого создан BTC Field?", answer: "BTC Field создан для самостоятельных Bitcoin-инвесторов, которым нужны доказательно связанное текущее состояние, принятая память изменений, проверенные источники и явные условия без ценовых целей и торговых сигналов." },
    { question: "На чём основано текущее чтение BTC?", answer: "Оно использует принятый Market Snapshot, проверенные производные и последнюю совместимую Snapshot Delta." },
    { question: "Даёт ли BTC Field прогноз цены или торговые сигналы?", answer: "Не в текущем публичном коридоре. Он даёт доказательно связанное текущее состояние, принятые изменения, источники и явные условия; он не выдаёт ценовые цели, торговые сигналы, инструкции по плечу или размеру позиции." },
    { question: "Как разделены ответы о протоколе и рынке?", answer: "Ответы о протоколе используют закреплённые источники Bitcoin; рыночные ответы используют принятые рыночные записи. Один доказательный слой не подменяет другой." },
    { question: "Как BTC Field использует Polymarket?", answer: "Как ограниченный evidence layer для конкретных будущих условий. Каждая market-implied оценка относится только к точной формулировке контракта, его expiry и правилам разрешения; это не общая вероятность будущей цены Bitcoin, не прогноз BHRIGU и не торговый сигнал." },
    { question: "Как астрономия сопоставляется с BTC?", answer: "Астрономические данные и состояние BTC проверяются независимо. Временное совпадение не представляется как причинность." },
  ],
};

type Failure = { code: BtcFailureCode; message: string; last_verified_at_utc: string | null };
type EnvelopeFailure = { code: BtcMarketEnvelopeFailure["code"]; message: string; last_verified_at_utc: string | null };
type SourceContext = { state: FreshnessState; generated_at_utc: string | null; age_hours: number | null; proof_available: boolean };
type Props = {
  result: BtcPublicSnapshot | null;
  failure: Failure | null;
  envelope: BtcMarketEnvelope | null;
  envelopeFailure: EnvelopeFailure | null;
  sourceContext: SourceContext;
  initialQuestion: string;
  initialDate: string;
  locale: BtcPublicLocale;
  localeSource: BtcLocaleSource;
  deploymentSourceSha: string | null;
  binanceObservation: BtcBinanceFreeObservation | null;
  binanceLiveBinding: BtcBinancePublicCorridorLiveBinding | null;
};

const first = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] ?? "" : value ?? "";

function deploymentSourceSha(): string | null {
  const value = process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.GITHUB_SHA ?? null;
  return value && /^[0-9a-f]{40}$/i.test(value) ? value : null;
}

function failureAgeHours(value: string | null): number | null {
  if (!value) return null;
  const generated = new Date(value).getTime();
  const now = Date.now();
  if (!Number.isFinite(generated) || generated > now) return null;
  return (now - generated) / 3_600_000;
}

function applyFreshnessTruth(envelope: BtcMarketEnvelope, freshness: "FRESH" | "STALE_LIMITED"): BtcMarketEnvelope {
  const current = { ...envelope.current, source_freshness: freshness };
  if (freshness === "FRESH") return { ...envelope, current };
  return {
    ...envelope,
    current,
    synthesis: {
      ...envelope.synthesis,
      state: "INSUFFICIENT_EVIDENCE",
      confirming_modules: [],
      contradicting_or_weakening_modules: ["Accepted source is older than 24 hours; strong current-state language is suppressed."],
      why_this_matters: "The 24-hour freshness boundary is more important than a forced current-state conclusion.",
      uncertainty: ["Accepted source is older than 24 hours; strong current-state language is suppressed.", ...envelope.synthesis.uncertainty.slice(1)],
    },
  };
}

export const getServerSideProps: GetServerSideProps<Props> = async ({ query }) => {
  const initialQuestion = first(query.q);
  const initialDate = first(query.d);
  const resolved = resolveBtcPublicLocale(first(query.lang), initialQuestion);
  const source=await loadBtcStaticSource();
  const observationBridge = await loadBtcBinanceFreeObservationBridge();
  const binanceObservation = observationBridge.status === "READY_PUBLIC" ? observationBridge.packet : null;
  const binanceLiveBinding = await loadBtcBinancePublicCorridorLive({
    locale: resolved.locale,
    staticPeer: source.ok === false ? null : {
      price_usd: source.snapshot.public_samples.assets.BTC.price_usd,
      observed_at: source.snapshot.generated_at_utc,
      freshness: source.freshness,
    },
  });
  let sourceContext: SourceContext;
  if (source.ok === false) {
    const lastVerified = source.last_verified_at_utc ?? null;
    sourceContext = {
      state: "UNAVAILABLE",
      generated_at_utc: lastVerified,
      age_hours: failureAgeHours(lastVerified),
      proof_available: false,
    };
  } else {
    sourceContext = {
      state: source.freshness,
      generated_at_utc: source.snapshot.generated_at_utc,
      age_hours: source.age_hours,
      proof_available: true,
    };
  }
  const empty: Props = {
    result: null,
    failure: null,
    envelope: null,
    envelopeFailure: null,
    sourceContext,
    initialQuestion: "",
    initialDate,
    locale: resolved.locale,
    localeSource: resolved.source,
    deploymentSourceSha: deploymentSourceSha(),
    binanceObservation,
    binanceLiveBinding,
  };
  if (!initialQuestion) return { props: empty };
  if (source.ok === false) {
    return { props: { ...empty, initialQuestion, failure: { code: source.code, message: source.message, last_verified_at_utc: source.last_verified_at_utc ?? null } } };
  }
  const coreQuestion = canonicalizeBtcQuestionForRouter(initialQuestion);
  const composed = await composeBtcPublicSnapshot(source, { question: coreQuestion, date: initialDate || undefined });
  if (composed.ok === false) {
    return { props: { ...empty, initialQuestion, failure: { code: composed.code, message: composed.message, last_verified_at_utc: null } } };
  }
  const result: BtcPublicSnapshot = {
    ...composed.value,
    question: {
      ...composed.value.question,
      raw: initialQuestion,
      normalized: normalizeBtcDisplayQuestion(initialQuestion),
    },
  };
  const market = await loadBtcMarketEnvelope(coreQuestion, {
    temporal: {
      state: result.temporal_context.state,
      label: result.temporal_context.label,
      harmonic_tension: result.aspect_pressure.harmonic_tension,
    },
  });
  if (market.ok === false) {
    return {
      props: {
        ...empty,
        result,
        initialQuestion,
        envelopeFailure: { code: market.code, message: market.message, last_verified_at_utc: market.last_verified_at_utc ?? null },
      },
    };
  }
  return { props: { ...empty, result, envelope: applyFreshnessTruth(market.value, source.freshness), initialQuestion } };
};

function BoundedFallback({ locale, result, envelopeFailure }: { locale: BtcPublicLocale; result: BtcPublicSnapshot; envelopeFailure: EnvelopeFailure | null }) {
  const copy = getBtcPublicCopy(locale);
  return <>
    <section id="btc-read" className="readingZone failure">
      <p className="eyebrow">{copy.envelopeFail}</p>
      <h2>{copy.envelopeUnavailable}</h2>
      <p>{formatBtcFailureMessage(locale, envelopeFailure?.code ?? "", envelopeFailure?.message ?? copy.envelopeCouldNotVerify)}</p>
      <p>{copy.envelopeFallback}</p>
    </section>
    <section id="phi-field" className="readingZone failure">
      <h2>{copy.boundedEvidence}</h2>
      {result.cosmographer_read.sections.map((section) => <article key={section.section_id}>
        <h3>{sectionTitle(locale, section.section_id)}</h3>
        <p>{factLine(locale, section.fact_payload)}</p>
        <p>{locale === "ru" ? formatBtcNarrativeReadLocalized(locale, section.read_template_id, section.fact_payload) : renderBtcNarrativeRead(section.read_template_id, section.fact_payload)}</p>
      </article>)}
    </section>
    <section id="evidence" className="readingZone failure">
      <h2>{copy.publicBoundary}</h2>
      <p>{copy.boundaryText}</p>
    </section>
  </>;
}

export default function Page(p: Props) {
  const copy = getBtcPublicCopy(p.locale);
  const ru = p.locale === "ru";
  const inputFailure = p.failure?.code === "invalid_input";
  const truth = formatBtcSnapshotTruth(
    p.locale,
    p.sourceContext.state,
    p.sourceContext.generated_at_utc,
    p.sourceContext.age_hours,
    p.sourceContext.proof_available,
  );
  const pageTitle = ru ? "BTC Field Read · Market Cosmographer" : "BTC Field Read · Market Cosmographer";
  const metaDescription = ru
    ? "Доказательно связанная аналитика Bitcoin: что изменилось, почему это важно, Snapshot Memory, проверенные источники и явные условия, которые изменят текущее чтение."
    : "Evidence-linked Bitcoin intelligence: what changed, why it matters, Snapshot Memory, verified sources, and explicit conditions that would change the current read.";
  const canonical = `https://www.bhrigu.io/crypto-astro/btc?lang=${p.locale}`;
  const acceptedKnowledge = BTC_ACCEPTED_PUBLIC_KNOWLEDGE[p.locale];
  const exampleRoutes = getBtcExampleRoutes(p.locale);
  const generalRoute = exampleRoutes.find((route) => route.id === "general_change") ?? exampleRoutes[0];
  const memoryRoute = exampleRoutes.find((route) => route.id === "accepted_memory") ?? exampleRoutes[0];
  const routedHref = (question: string, anchor: string) => `/crypto-astro/btc?lang=${p.locale}&q=${encodeURIComponent(question)}#${anchor}`;
  const cleanChatHref = `/crypto-astro/btc/clean-chat?lang=${p.locale}`;
  const originsQuestion = ru
    ? "Кто такой Сатоши Накамото и когда он объявил Bitcoin v0.1?"
    : "Who is Satoshi Nakamoto and when was Bitcoin v0.1 announced?";
  const originsHref = `${cleanChatHref}&q=${encodeURIComponent(originsQuestion)}`;
  const visualLayers = ru
    ? [
        ["01", "CURRENT", "ТЕКУЩЕЕ", truth.stateLabel],
        ["02", "CHANGE", "ИЗМЕНЕНИЕ", "Принятый Snapshot + Snapshot Memory"],
        ["03", "EXPECTATION", "ОЖИДАНИЯ", "Polymarket · точное условие · expiry · rules"],
        ["04", "ASTRO", "АСТРО", "Независимый evidence layer · совпадение ≠ причинность"],
        ["05", "SOURCES / PROOF", "ИСТОЧНИКИ / PROOF", truth.proofLine],
      ]
    : [
        ["01", "CURRENT", "CURRENT", truth.stateLabel],
        ["02", "CHANGE", "CHANGE", "Accepted Snapshot + Snapshot Memory"],
        ["03", "EXPECTATION", "EXPECTATION", "Polymarket · exact proposition · expiry · rules"],
        ["04", "ASTRO", "ASTRO", "Independent evidence lane · concurrence ≠ causality"],
        ["05", "SOURCES / PROOF", "SOURCES / PROOF", truth.proofLine],
      ];
  const evidenceFlow = ru
    ? [
        ["01", "ВОПРОС", "Намерение пользователя"],
        ["02", "ПЛАН ДОКАЗАТЕЛЬСТВ", "Только нужные evidence lanes"],
        ["03", "ИСТОЧНИКИ", "Принятые · закреплённые · ограниченные"],
        ["04", "СИНТЕЗ", "Согласие · расхождение · неопределённость"],
        ["05", "ОТВЕТ", "Смысл · условия · границы"],
      ]
    : [
        ["01", "QUESTION", "User intent"],
        ["02", "EVIDENCE PLAN", "Only the required evidence lanes"],
        ["03", "SOURCES", "Accepted · pinned · bounded"],
        ["04", "SYNTHESIS", "Agreement · divergence · uncertainty"],
        ["05", "ANSWER", "Meaning · conditions · limits"],
      ];
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": canonical,
        url: canonical,
        name: pageTitle,
        description: metaDescription,
        inLanguage: p.locale,
        isPartOf: { "@type": "WebSite", name: "BHRIGU", url: "https://www.bhrigu.io/" },
        about: { "@type": "Thing", name: "Bitcoin market intelligence" },
        audience: { "@type": "Audience", audienceType: "Self-directed Bitcoin investors seeking evidence-linked current-state analysis" },
      },
      {
        "@type": "WebApplication",
        name: "Market Cosmographer · BTC Field",
        applicationCategory: "FinanceApplication",
        operatingSystem: "Web",
        description: metaDescription,
        url: canonical,
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      },
      {
        "@type": "FAQPage",
        mainEntity: acceptedKnowledge.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: { "@type": "Answer", text: item.answer },
        })),
      },
    ],
  };
  return <>
    <Head>
      <title>{pageTitle}</title>
      <meta name="description" content={metaDescription}/>
      <meta name="robots" content="index,follow"/>
      <link rel="canonical" href={canonical}/>
      <link rel="alternate" hrefLang="en" href="https://www.bhrigu.io/crypto-astro/btc?lang=en"/>
      <link rel="alternate" hrefLang="ru" href="https://www.bhrigu.io/crypto-astro/btc?lang=ru"/>
      <link rel="alternate" hrefLang="x-default" href="https://www.bhrigu.io/crypto-astro/btc?lang=en"/>
      <meta property="og:type" content="website"/>
      <meta property="og:title" content={pageTitle}/>
      <meta property="og:description" content={metaDescription}/>
      <meta property="og:url" content={canonical}/>
      <meta name="twitter:card" content="summary_large_image"/>
      <meta name="twitter:title" content={pageTitle}/>
      <meta name="twitter:description" content={metaDescription}/>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}/>
      <meta name="btc-glyph-canon-sha256" content={MARKET_COSMOGRAPHER_EXISTING_GLYPH_CANON_SHA256}/>
      <meta name="btc-deployment-source-sha" content={p.deploymentSourceSha ?? ""}/>
    </Head>
    <style dangerouslySetInnerHTML={{ __html: BTC_BILINGUAL_SURFACE_CSS }}/>
    <style dangerouslySetInnerHTML={{ __html: BTC_PRODUCT_REBALANCE_CSS }}/>
    <style dangerouslySetInnerHTML={{ __html: BTC_BINANCE_FREE_OBSERVATION_CSS }}/>
    <style dangerouslySetInnerHTML={{ __html: "html{scroll-behavior:auto!important}" }}/>
    <main
      lang={p.locale}
      data-btc-static-proof="true"
      data-locale={p.locale}
      data-locale-source={p.localeSource}
      data-deployment-source-sha={p.deploymentSourceSha ?? ""}
    >
      <section className="hero heroProductEntry">
        <div className="heroProductCopy">
          <p className="eyebrow heroProductIdentity">
            <span>Market Cosmographer</span>
            <small>{ru ? "AI-аналитика рынков" : "AI market intelligence"}</small>
          </p>
          <h1>BTC Field Read</h1>
          <p>{ru
        ? "Доказательно связанная аналитика Bitcoin: что изменилось, почему это важно и какие условия изменят текущее чтение."
        : "Evidence-linked Bitcoin intelligence: what changed, why it matters, and which conditions would change the current read."}</p>
        </div>
        <BtcHeroQuestionLaunch locale={p.locale} initialDate={p.initialDate}/>
      </section>

      <section className="btcSystemCompression" data-btc-visual-hierarchy="current-change-expectation-astro-proof" aria-labelledby="btc-system-compression-title">
        <header className="btcCompressionHead">
          <p className="eyebrow">{ru ? "Карта чтения" : "Read map"}</p>
          <h2 id="btc-system-compression-title">{ru ? "Сначала структура. Затем детали." : "Structure first. Detail second."}</h2>
          <p>{ru ? "Пять доказательных слоёв показывают, из чего складывается текущий BTC read." : "Five evidence layers show what the current BTC read is made of."}</p>
        </header>
        <div className="btcLayerRail" role="list" aria-label={ru ? "Слои BTC Cosmographer" : "BTC Cosmographer layers"}>
          {visualLayers.map(([index, axis, title, detail]) => <article key={index} role="listitem" data-btc-visual-layer={index}>
            <span>{index}</span><small>{axis}</small><strong>{title}</strong><p>{detail}</p>
          </article>)}
        </div>
        <div className="btcEvidenceFlow" data-btc-evidence-flow="question-plan-sources-synthesis-answer">
          <p className="btcFlowLabel">{ru ? "КАК РАБОТАЕТ КОСМОГРАФ" : "HOW COSMOGRAPHER WORKS"}</p>
          <div className="btcFlowRail" role="list" aria-label={ru ? "Вопрос к ответу" : "Question to answer"}>
            {evidenceFlow.map(([index, title, detail]) => <article key={index} role="listitem"><span>{index}</span><strong>{title}</strong><small>{detail}</small></article>)}
          </div>
        </div>
      </section>

      <section
        id="snapshot-authority"
        className="snapshotTruthStrip"
        data-freshness-state={p.sourceContext.state}
        data-source-generated-at={p.sourceContext.generated_at_utc ?? ""}
        aria-label={truth.stateLabel}
      >
        <strong>{truth.stateLabel}</strong>
        <p>{truth.snapshotLine}</p>
        {truth.ageLine && <p>{truth.ageLine}</p>}
        <p>{truth.proofLine}</p>
      </section>

      {p.binanceLiveBinding && <BtcBinanceCurrentVenuePanel locale={p.locale} binding={p.binanceLiveBinding}/>} 

      <BtcQuestionMembrane
        locale={p.locale}
        initialQuestion={p.initialQuestion}
        initialDate={p.initialDate}
        result={p.result}
      />

      <section id="btc-accepted-knowledge" className="readingZone acceptedKnowledge" aria-labelledby="btc-accepted-knowledge-title" data-accepted-public-knowledge="true">
        <header className="zoneHeading">
          <div>
            <p className="eyebrow">{ru ? "Факты о продукте" : "Product facts"}</p>
            <h2 id="btc-accepted-knowledge-title">{ru ? "Что делает BTC Field — и где его граница" : "What BTC Field does — and where it stops"}</h2>
          </div>
          <p>{ru ? "Канонические факты о продукте, его доказательствах и ограничениях." : "Canonical facts about the product, its evidence, and its limits."}</p>
        </header>
        <div className="evidenceStack">
          {acceptedKnowledge.map((item) => <details key={item.question}>
            <summary>{item.question}</summary>
            <p>{item.answer}</p>
          </details>)}
        </div>
      </section>

      <section id="polymarket-expectations" className="readingZone polymarketExpectationZone" data-polymarket-public-reveal="bounded-expectation-layer" aria-labelledby="polymarket-expectations-title">
        <header className="zoneHeading polymarketExpectationHead">
          <div>
            <p className="eyebrow">{ru ? "Доказательства ожиданий" : "Expectation evidence"}</p>
            <h2 id="polymarket-expectations-title">{ru ? "Polymarket — отдельный слой ожиданий" : "Polymarket — a separate expectation layer"}</h2>
          </div>
          <p>{ru ? "Рыночная оценка читается только внутри точного условия контракта — со своим сроком и правилами разрешения." : "A market-implied value is read only inside the exact contract proposition, with its own expiry and resolution rules."}</p>
        </header>
        <div className="polymarketExpectationArc" aria-label={ru ? "Семантическая цепочка evidence Polymarket" : "Polymarket evidence semantic chain"}>
          <article><span>01</span><strong>{ru ? "Конкретное условие" : "Specific proposition"}</strong><p>{ru ? "Не общий вопрос о направлении Bitcoin." : "Not a general claim about Bitcoin direction."}</p></article>
          <i aria-hidden="true">→</i>
          <article><span>02</span><strong>{ru ? "Expiry + правила" : "Expiry + rules"}</strong><p>{ru ? "Срок и условия разрешения сохраняют смысл рынка." : "Expiry and resolution conditions preserve market meaning."}</p></article>
          <i aria-hidden="true">→</i>
          <article><span>03</span><strong>{ru ? "Market-implied price" : "Market-implied price"}</strong><p>{ru ? "Текущая оценка конкретного контракта, а не вероятность BTC от BHRIGU." : "The current price of that contract, not a BHRIGU probability for BTC."}</p></article>
        </div>
        <div className="polymarketExpectationBoundary">
          <span>{ru ? "Не глобальная вероятность BTC" : "Not a global BTC probability"}</span>
          <span>{ru ? "Не прогноз BHRIGU" : "Not a BHRIGU forecast"}</span>
          <span>{ru ? "Без торгового сигнала" : "No trading signal"}</span>
        </div>
        <a className="polymarketExpectationCta" href={`/crypto-astro/btc/clean-chat?lang=${p.locale}&q=${encodeURIComponent(ru ? "Что сейчас показывает Polymarket о Bitcoin? Используй только точные формулировки контрактов, сроки и правила разрешения." : "What is Polymarket currently implying about Bitcoin? Use only exact contract propositions, expiries and resolution rules.")}`}>{ru ? "Спросить Космографа о текущих ожиданиях" : "Ask Cosmographer about current expectations"} <span aria-hidden="true">→</span></a>
      </section>

      {p.binanceObservation&&<BtcBinanceFreeObservationPanel locale={p.locale} observation={p.binanceObservation}/>} 
      {p.failure && <section className="failure" role="alert">
        <p className="eyebrow">{inputFailure ? copy.questionCheck : copy.sourceFailure}</p>
        <h2>{inputFailure ? copy.adjustQuestion : copy.fieldUnavailable}</h2>
        <p>{formatBtcFailureMessage(p.locale, p.failure.code, p.failure.message)}</p>
        {p.failure.last_verified_at_utc && <p>{copy.lastVerified}: {formatBtcUtcTimestamp(p.locale, p.failure.last_verified_at_utc)}</p>}
        <details><summary>{copy.technicalDetails}</summary><code>{p.failure.code}</code></details>
      </section>}
      {p.result && <section className="reading" aria-label={ru ? "Чтение Космографа BTC" : "BTC Cosmographer reading"}>
        {p.envelope
          ? <>
              <BtcObservationZone locale={p.locale} envelope={p.envelope} result={p.result}/>
              <BtcPhiZone locale={p.locale} envelope={p.envelope}/>
              <BtcEvidenceZone locale={p.locale} envelope={p.envelope} result={p.result}/>
            </>
          : <BoundedFallback locale={p.locale} result={p.result} envelopeFailure={p.envelopeFailure}/>} 
      </section>}
      <PublicSupportRoute locale={p.locale} surface="btc" />
      <footer className="btcAuthorityFooter" aria-label={ru ? "BTC Cosmographer — навигация и границы" : "BTC Cosmographer — navigation and limits"}>
        <div className="btcAuthorityFooterIntro">
          <div className="btcAuthorityFooterIdentity">
            <strong>BTC COSMOGRAPHER</strong>
            <p>{ru ? "Помогает понять, что происходит с Bitcoin, на основе проверяемых данных и источников." : "Helps explain what is happening with Bitcoin using verifiable data and sources."}</p>
          </div>
          <p className="btcAuthorityFooterStatement">{ru
            ? "Наблюдаемые данные отделены от интерпретации, а ограничения показаны прямо в чтении."
            : "Observed data is kept separate from interpretation, and the limits are shown directly in the read."}</p>
        </div>

        <nav className="btcAuthorityFooterNav" aria-label={ru ? "Навигация BTC" : "BTC navigation"}>
          <section>
            <h3>{ru ? "ПРОДУКТ" : "PRODUCT"}</h3>
            <a href={`/crypto-astro/btc?lang=${p.locale}`}>BTC Field</a>
            <a href={cleanChatHref}>{ru ? "Задать вопрос" : "Ask a question"}</a>
            <a href={routedHref(memoryRoute.question, "snapshot-memory")}>{ru ? "История изменений" : "Change history"}</a>
            <a href={originsHref}>{ru ? "Происхождение Bitcoin / Сатоши" : "Bitcoin Origins / Satoshi"}</a>
          </section>
          <section>
            <h3>{ru ? "ПРОВЕРКА" : "VERIFY"}</h3>
            <a href="#snapshot-authority">{ru ? "Текущие данные" : "Current data"}</a>
            <a href={routedHref(generalRoute.question, "evidence")}>{ru ? "Источники" : "Sources"}</a>
            <a href="#btc-accepted-knowledge">{ru ? "Что данные не доказывают" : "What the data does not prove"}</a>
          </section>
          <section data-footer-boundaries="declarative">
            <h3>{ru ? "ГРАНИЦЫ" : "LIMITS"}</h3>
            <span className="btcBoundaryStatement">{ru ? "Без прогнозов цены" : "No price forecasts"}</span>
            <span className="btcBoundaryStatement">{ru ? "Без сигналов купить или продать" : "No buy or sell signals"}</span>
            <span className="btcBoundaryStatement">{ru ? "Астрономические совпадения не выдаются за причину движения Bitcoin" : "Astronomical concurrence is not presented as a cause of Bitcoin movement"}</span>
          </section>
          <section>
            <h3>{ru ? "ДАЛЬШЕ" : "NEXT"}</h3>
            <a href={cleanChatHref}>{ru ? "Задать вопрос" : "Ask a question"}</a>
            <a href={`/access?lang=${p.locale}&intent=btc-continuity-status`}>{ru ? "Исследовательский доступ" : "Research access"}</a>
            <a href={`/support?lang=${p.locale}`}>{ru ? "Поддержать BHRIGU" : "Support BHRIGU"}</a>
            <a href="/">{ru ? "О BHRIGU" : "About BHRIGU"}</a>
          </section>
        </nav>

        <div className="btcFooterTrustStrip" data-freshness-state={p.sourceContext.state}>
          <strong>{truth.stateLabel}</strong>
          {p.sourceContext.generated_at_utc && <time dateTime={p.sourceContext.generated_at_utc}>{formatBtcUtcTimestamp(p.locale, p.sourceContext.generated_at_utc)}</time>}
          <span>{truth.proofLine}</span>
        </div>
        <div className="btcFooterBottom">
          <strong>BHRIGU × COSMOGRAPHER</strong>
          <span>{ru ? "Источник → наблюдение → интерпретация → граница" : "Source → observation → interpretation → boundary"}</span>
        </div>
      </footer>
    </main>
  </>;
}
