import Head from "next/head";
import type { GetServerSideProps } from "next";
import { BtcBinanceFreeObservationPanel } from "../../components/btc/BtcBinanceFreeObservation";
import { BtcEvidenceZone } from "../../components/btc/BtcEvidence";
import { BtcObservationZone, BtcPhiZone } from "../../components/btc/BtcExecutivePhi";
import { BtcHeroQuestionLaunch } from "../../components/btc/BtcHeroQuestionLaunch";
import { BtcQuestionMembrane } from "../../components/btc/BtcQuestionMembrane";
import { loadBtcBinanceFreeObservationBridge } from "../../lib/btc-binance-free-observation-bridge";
import type { BtcBinanceFreeObservation } from "../../lib/btc-binance-free-observation-contract";
import { BTC_BINANCE_FREE_OBSERVATION_CSS } from "../../lib/btc-binance-free-observation-style";
import { loadBtcMarketEnvelope, type BtcMarketEnvelope, type BtcMarketEnvelopeFailure } from "../../lib/btc-market-envelope";
import { BTC_BILINGUAL_SURFACE_CSS } from "../../lib/btc-bilingual-surface-style";
import { MARKET_COSMOGRAPHER_EXISTING_GLYPH_CANON_SHA256 } from "../../lib/btc-existing-glyph-canon";
import {
  formatBtcFailureMessage,
  formatBtcNarrativeReadLocalized,
  formatBtcUtcTimestamp,
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
  const source = await loadBtcStaticSource();
  const observationBridge = await loadBtcBinanceFreeObservationBridge();
  const binanceObservation = observationBridge.status === "READY_PUBLIC" ? observationBridge.packet : null;
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

export default function Page(props: Props) {
  const copy = getBtcPublicCopy(props.locale);
  const ru = props.locale === "ru";
  const inputFailure = props.failure?.code === "invalid_input";
  const truth = formatBtcSnapshotTruth(
    props.locale,
    props.sourceContext.state,
    props.sourceContext.generated_at_utc,
    props.sourceContext.age_hours,
    props.sourceContext.proof_available,
  );
  const pageTitle = ru ? "BTC Field Read · Market Cosmographer" : "BTC Field Read · Market Cosmographer";
  const metaDescription = ru
    ? "Проверяемое чтение поля Bitcoin: текущие изменения, рыночная структура, память Snapshot, временные окна и условия."
    : "A verifiable Bitcoin field read covering current changes, market structure, Snapshot memory, temporal windows, and conditions.";
  return <>
    <Head>
      <title>{pageTitle}</title>
      <meta name="description" content={metaDescription}/>
      <meta name="btc-glyph-canon-sha256" content={MARKET_COSMOGRAPHER_EXISTING_GLYPH_CANON_SHA256}/>
      <meta name="btc-deployment-source-sha" content={props.deploymentSourceSha ?? ""}/>
    </Head>
    <style dangerouslySetInnerHTML={{ __html: BTC_BILINGUAL_SURFACE_CSS }}/>
    <style dangerouslySetInnerHTML={{ __html: BTC_PRODUCT_REBALANCE_CSS }}/>
    <style dangerouslySetInnerHTML={{ __html: BTC_BINANCE_FREE_OBSERVATION_CSS }}/>
    <style dangerouslySetInnerHTML={{ __html: "html{scroll-behavior:auto!important}" }}/>
    <main
      lang={props.locale}
      data-btc-static-proof="true"
      data-locale={props.locale}
      data-locale-source={props.localeSource}
      data-deployment-source-sha={props.deploymentSourceSha ?? ""}
    >
      <section className="hero heroProductEntry">
        <div className="heroProductCopy">
          <p className="eyebrow">{ru ? "Market Cosmographer · первый живой коридор" : "Market Cosmographer · first live corridor"}</p>
          <h1>BTC Field Read</h1>
          <p>{ru
            ? "Поймите, что меняется в поле Bitcoin, почему это важно, что может произойти дальше и какие условия изменят чтение."
            : "Understand what is changing in the Bitcoin field, why it matters, what may happen next, and which conditions would change the read."}</p>
        </div>
        <BtcHeroQuestionLaunch locale={props.locale} initialDate={props.initialDate}/>
      </section>

      <section
        className="snapshotTruthStrip"
        data-freshness-state={props.sourceContext.state}
        data-source-generated-at={props.sourceContext.generated_at_utc ?? ""}
        aria-label={truth.stateLabel}
      >
        <strong>{truth.stateLabel}</strong>
        <p>{truth.snapshotLine}</p>
        {truth.ageLine && <p>{truth.ageLine}</p>}
        <p>{truth.proofLine}</p>
        {props.deploymentSourceSha && <p>{ru ? "Источник публикации" : "Deployment source"} · <code>{props.deploymentSourceSha.slice(0, 12)}</code></p>}
      </section>

      <BtcQuestionMembrane
        locale={props.locale}
        initialQuestion={props.initialQuestion}
        initialDate={props.initialDate}
        result={props.result}
      />

      {props.binanceObservation && <BtcBinanceFreeObservationPanel locale={props.locale} observation={props.binanceObservation}/>} 
      {props.failure && <section className="failure" role="alert">
        <p className="eyebrow">{inputFailure ? copy.questionCheck : copy.sourceFailure}</p>
        <h2>{inputFailure ? copy.adjustQuestion : copy.fieldUnavailable}</h2>
        <p>{formatBtcFailureMessage(props.locale, props.failure.code, props.failure.message)}</p>
        {props.failure.last_verified_at_utc && <p>{copy.lastVerified}: {formatBtcUtcTimestamp(props.locale, props.failure.last_verified_at_utc)}</p>}
        <details><summary>{copy.technicalDetails}</summary><code>{props.failure.code}</code></details>
      </section>}
      {props.result && <section className="reading" aria-label={ru ? "Чтение Космографа BTC" : "BTC Cosmographer reading"}>
        {props.envelope
          ? <>
              <BtcObservationZone locale={props.locale} envelope={props.envelope} result={props.result}/>
              <BtcPhiZone locale={props.locale} envelope={props.envelope}/>
              <BtcEvidenceZone locale={props.locale} envelope={props.envelope} result={props.result}/>
            </>
          : <BoundedFallback locale={props.locale} result={props.result} envelopeFailure={props.envelopeFailure}/>} 
      </section>}
      <div className="closingField" aria-hidden="true"><span/></div>
    </main>
  </>;
}
