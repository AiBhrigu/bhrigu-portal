import Head from "next/head";
import type { GetServerSideProps } from "next";
import {
  BtcLiveDialogue,
  type BtcLiveClarification,
  type BtcLiveEnvelopeFailure,
  type BtcLiveFailure,
  type BtcLiveSourceContext,
} from "../../../components/btc/BtcLiveDialogue";
import {
  isBtcContextualFollowUp,
  parseBtcFollowUpContext,
  resolveBtcFollowUp,
  type BtcContextRelation,
} from "../../../lib/btc-live-dialogue-follow-up";
import type {
  BtcQuestionFacet,
  BtcQuestionSpecificAnswerState,
} from "../../../lib/btc-executive-question-language";
import {
  loadBtcMarketEnvelope,
  type BtcEnvelopeQuestionClass,
  type BtcMarketEnvelope,
} from "../../../lib/btc-market-envelope";
import { BTC_BILINGUAL_SURFACE_CSS } from "../../../lib/btc-bilingual-surface-style";
import { BTC_LIVE_DIALOGUE_CSS } from "../../../lib/btc-live-dialogue-style";
import {
  normalizeBtcDisplayQuestion,
  resolveBtcPublicLocale,
  type BtcLocaleSource,
  type BtcPublicLocale,
} from "../../../lib/btc-public-language-contract";
import { canonicalizeBtcQuestionForRouter } from "../../../lib/btc-public-question-bridge";
import { composeBtcPublicSnapshot } from "../../../lib/btc-public-snapshot-composer";
import { loadBtcStaticSource } from "../../../lib/btc-public-static-source";
import type { BtcPublicSnapshot } from "../../../lib/btc-public-output-contract";
import { BTC_PRODUCT_REBALANCE_CSS } from "../../../lib/btc-product-rebalance-style";

type Props = {
  result: BtcPublicSnapshot | null;
  failure: BtcLiveFailure | null;
  envelope: BtcMarketEnvelope | null;
  envelopeFailure: BtcLiveEnvelopeFailure | null;
  clarification: BtcLiveClarification | null;
  sourceContext: BtcLiveSourceContext;
  initialQuestion: string;
  effectiveQuestion: string;
  initialDate: string;
  locale: BtcPublicLocale;
  localeSource: BtcLocaleSource;
  deploymentSourceSha: string | null;
  contextRelation: BtcContextRelation | null;
  priorQuestionClass: BtcEnvelopeQuestionClass | null;
  resolvedQuestionFacets: BtcQuestionFacet[];
  priorAnswerState: BtcQuestionSpecificAnswerState | null;
  priorSnapshotGeneratedAtUtc: string | null;
  sourceBindingChanged: boolean;
};

const first = (value: string | string[] | undefined): string => Array.isArray(value) ? value[0] ?? "" : value ?? "";

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
      uncertainty: [
        "Accepted source is older than 24 hours; strong current-state language is suppressed.",
        ...envelope.synthesis.uncertainty.slice(1),
      ],
    },
  };
}

export const getServerSideProps: GetServerSideProps<Props> = async ({ query }) => {
  const initialQuestion = first(query.q);
  const initialDate = first(query.d);
  const resolvedLocale = resolveBtcPublicLocale(first(query.lang), initialQuestion);
  const source = await loadBtcStaticSource();

  const sourceContext: BtcLiveSourceContext = source.ok === false
    ? {
        state: "UNAVAILABLE",
        generated_at_utc: source.last_verified_at_utc ?? null,
        age_hours: failureAgeHours(source.last_verified_at_utc ?? null),
        proof_available: false,
      }
    : {
        state: source.freshness,
        generated_at_utc: source.snapshot.generated_at_utc,
        age_hours: source.age_hours,
        proof_available: true,
      };

  const parsedContext = parseBtcFollowUpContext(query);
  const packet = parsedContext.packet;
  const currentSourceTimestamp = source.ok === false
    ? source.last_verified_at_utc ?? null
    : source.snapshot.generated_at_utc;

  let effectiveQuestion = initialQuestion;
  let contextRelation: BtcContextRelation | null = null;
  let resolvedQuestionFacets: BtcQuestionFacet[] = packet?.prior_question_facets ?? [];
  let clarification: BtcLiveClarification | null = null;

  if (initialQuestion && parsedContext.malformed) {
    clarification = {
      reason: "UNSUPPORTED_CONTEXT",
      prompt: resolvedLocale.locale === "ru"
        ? "Контекст прошлого хода повреждён. Уточните предмет вопроса: гравитация BTC, ликвидность или структура рынка."
        : "The previous-turn context is invalid. Clarify the subject: BTC gravity, liquidity or market structure.",
    };
  } else if (initialQuestion && (parsedContext.present || isBtcContextualFollowUp(initialQuestion))) {
    const followUp = resolveBtcFollowUp(
      resolvedLocale.locale,
      initialQuestion,
      packet,
      currentSourceTimestamp,
    );
    if (followUp.status === "CLARIFICATION_REQUIRED") {
      clarification = { reason: followUp.reason, prompt: followUp.clarification_prompt };
    } else {
      effectiveQuestion = followUp.effective_question;
      contextRelation = followUp.context_relation;
      resolvedQuestionFacets = followUp.resolved_facets;
    }
  }

  const sourceBindingChanged = Boolean(
    packet?.prior_snapshot_generated_at_utc &&
    currentSourceTimestamp &&
    packet.prior_snapshot_generated_at_utc !== currentSourceTimestamp,
  );

  const empty: Props = {
    result: null,
    failure: null,
    envelope: null,
    envelopeFailure: null,
    clarification,
    sourceContext,
    initialQuestion: "",
    effectiveQuestion: "",
    initialDate,
    locale: resolvedLocale.locale,
    localeSource: resolvedLocale.source,
    deploymentSourceSha: deploymentSourceSha(),
    contextRelation,
    priorQuestionClass: packet?.prior_question_class ?? null,
    resolvedQuestionFacets,
    priorAnswerState: packet?.prior_answer_state ?? null,
    priorSnapshotGeneratedAtUtc: packet?.prior_snapshot_generated_at_utc ?? null,
    sourceBindingChanged,
  };

  if (!initialQuestion) return { props: empty };
  if (clarification) {
    return { props: { ...empty, initialQuestion, effectiveQuestion: initialQuestion } };
  }

  if (source.ok === false) {
    return {
      props: {
        ...empty,
        initialQuestion,
        effectiveQuestion,
        failure: {
          code: source.code,
          message: source.message,
          last_verified_at_utc: source.last_verified_at_utc ?? null,
        },
      },
    };
  }

  const coreQuestion = canonicalizeBtcQuestionForRouter(effectiveQuestion);
  const composed = await composeBtcPublicSnapshot(source, {
    question: coreQuestion,
    date: initialDate || undefined,
  });
  if (composed.ok === false) {
    return {
      props: {
        ...empty,
        initialQuestion,
        effectiveQuestion,
        failure: { code: composed.code, message: composed.message, last_verified_at_utc: null },
      },
    };
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
        effectiveQuestion,
        envelopeFailure: {
          code: market.code,
          message: market.message,
          last_verified_at_utc: market.last_verified_at_utc ?? null,
        },
      },
    };
  }

  return {
    props: {
      ...empty,
      result,
      envelope: applyFreshnessTruth(market.value, source.freshness),
      initialQuestion,
      effectiveQuestion,
    },
  };
};

export default function BtcLivePage(props: Props) {
  const title = props.locale === "ru"
    ? "BTC Космограф · Бесплатный диалог"
    : "BTC Cosmographer · Free dialogue";
  const description = props.locale === "ru"
    ? "Бесплатный диалог с Market Cosmographer по текущему проверенному BTC snapshot."
    : "A free Market Cosmographer dialogue grounded in the current verified BTC snapshot.";

  return <>
    <Head>
      <title>{title}</title>
      <meta name="description" content={description}/>
      <meta name="btc-live-dialogue" content="free-question-v0-2-session-local"/>
      <meta name="btc-deployment-source-sha" content={props.deploymentSourceSha ?? ""}/>
    </Head>
    <style dangerouslySetInnerHTML={{__html: BTC_BILINGUAL_SURFACE_CSS}}/>
    <style dangerouslySetInnerHTML={{__html: BTC_PRODUCT_REBALANCE_CSS}}/>
    <style dangerouslySetInnerHTML={{__html: BTC_LIVE_DIALOGUE_CSS}}/>
    <BtcLiveDialogue {...props}/>
  </>;
}
