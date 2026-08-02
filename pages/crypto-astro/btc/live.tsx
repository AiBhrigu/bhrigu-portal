import Head from "next/head";
import type { GetServerSideProps } from "next";
import {
  BtcCosmographerDialogue,
  type BtcCosmographerSourceContext,
} from "../../../components/btc/BtcCosmographerDialogue";
import {
  BTC_COSMOGRAPHER_CONTEXT_SCHEMA,
  parseBtcCosmographerContext,
  routeBtcCosmographerQuestion,
  type BtcCosmographerAnswerState,
  type BtcCosmographerContextPacket,
  type BtcCosmographerIntent,
  type BtcCosmographerRoute,
} from "../../../lib/btc-cosmographer-route-graph";
import { buildBtcCosmographerAnswer } from "../../../lib/btc-cosmographer-answer";
import {
  applyBtcRelationIntentPrecedence,
  BTC_EVIDENCE_NAVIGATION_RUNTIME_SCHEMA,
  buildBtcEvidenceNavigationRuntimeDecision,
  type BtcEvidenceNavigationRuntimeDecision,
} from "../../../lib/btc-cosmographer-evidence-navigation-runtime";
import {
  routeBtcCosmographerLocalRc,
  type BtcMultiBodyAstroMemory,
  type BtcMultiBodyAstroRcRoute,
} from "../../../lib/btc-cosmographer-multi-body-astro-rc";
import {
  buildPublicMultiBodyAnswer,
  isPublicMultiBodyRoute,
} from "../../../lib/btc-cosmographer-public-multi-body-projection";
import type { BtcCosmographerAnswerProjection } from "../../../lib/btc-protocol-evidence";
import {
  loadBtcMarketEnvelope,
  type BtcEnvelopeQuestionClass,
  type BtcMarketEnvelope,
} from "../../../lib/btc-market-envelope";
import { canonicalizeBtcQuestionForRouter } from "../../../lib/btc-public-question-bridge";
import { composeBtcPublicSnapshot } from "../../../lib/btc-public-snapshot-composer";
import { loadBtcStaticSource } from "../../../lib/btc-public-static-source";
import type { BtcPublicSnapshot } from "../../../lib/btc-public-output-contract";
import { resolveBtcPublicLocale, type BtcPublicLocale } from "../../../lib/btc-public-language-contract";
import { BTC_BILINGUAL_SURFACE_CSS } from "../../../lib/btc-bilingual-surface-style";
import { BTC_LIVE_DIALOGUE_CSS } from "../../../lib/btc-live-dialogue-style";
import { BTC_DIALOGUE_SESSION_SCHEMA } from "../../../lib/btc-live-dialogue-session";
import { BTC_PRODUCT_REBALANCE_CSS } from "../../../lib/btc-product-rebalance-style";

const first = (value: string | string[] | undefined): string => Array.isArray(value) ? value[0] ?? "" : value ?? "";

const MARKET_CLASSES = new Set<BtcEnvelopeQuestionClass>([
  "btc_gravity",
  "market_structure",
  "liquidity",
  "market_participation_rotation",
  "change_memory",
  "temporal_pressure",
  "general_btc_field",
]);

const CONTEXT_STATES = new Set<BtcCosmographerAnswerState>([
  "CONFIRMED",
  "SPLIT",
  "LIMITED",
  "CLARIFICATION",
  "FAILURE",
]);

const CONTEXT_INTENTS = new Set<BtcCosmographerIntent>([
  "fact",
  "explain",
  "interval_analysis",
  "compare",
  "change",
  "reason",
  "confirmation",
  "watch",
  "bridge",
  "navigate",
]);

function validObservationDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day;
}

function parseLegacyContext(
  query: Record<string, string | string[] | undefined>,
): BtcCosmographerContextPacket | null {
  if (first(query.fc) !== "btc_follow_up_context_v0_1") return null;
  const marketClass = first(query.pc) as BtcEnvelopeQuestionClass;
  if (!MARKET_CLASSES.has(marketClass)) return null;

  const rawState = first(query.ps);
  const state = (rawState === "BOUNDED" ? "LIMITED" : rawState) as BtcCosmographerAnswerState;
  if (!CONTEXT_STATES.has(state)) return null;

  const intents = first(query.pf)
    .split(",")
    .filter((value): value is BtcCosmographerIntent => CONTEXT_INTENTS.has(value as BtcCosmographerIntent));
  if (!intents.length) return null;

  const date = first(query.pd);
  if (date && !validObservationDate(date)) return null;
  const timestamp = first(query.pt);
  if (timestamp && !Number.isFinite(new Date(timestamp).getTime())) return null;

  return {
    schema: BTC_COSMOGRAPHER_CONTEXT_SCHEMA,
    prior_domain: marketClass === "change_memory" ? "snapshot_memory" : "btc_market",
    prior_subject: marketClass,
    prior_intents: intents,
    prior_answer_state: state,
    prior_market_question_class: marketClass,
    prior_time_start: date || null,
    prior_time_end: date || null,
    prior_snapshot_generated_at_utc: timestamp || null,
  };
}

type Props = {
  locale: BtcPublicLocale;
  initialQuestion: string;
  initialDate: string;
  route: BtcCosmographerRoute | null;
  answer: BtcCosmographerAnswerProjection | null;
  runtimeDecision: BtcEvidenceNavigationRuntimeDecision | null;
  sourceContext: BtcCosmographerSourceContext;
  deploymentSourceSha: string | null;
  sourceBindingChanged: boolean;
  inputError: string | null;
};

function deploymentSourceSha(): string | null {
  const value = process.env.VERCEL_GIT_COMMIT_SHA ??
    process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ??
    process.env.GITHUB_SHA ??
    null;
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
  if (freshness === "FRESH") return { ...envelope, current: { ...envelope.current, source_freshness: freshness } };
  return {
    ...envelope,
    current: { ...envelope.current, source_freshness: freshness },
    synthesis: {
      ...envelope.synthesis,
      state: "INSUFFICIENT_EVIDENCE",
      confirming_modules: [],
      contradicting_or_weakening_modules: ["Accepted Market Snapshot is older than 24 hours."],
      why_this_matters: "Freshness takes priority over a forced current-state conclusion.",
      uncertainty: ["Accepted Market Snapshot is older than 24 hours.", ...envelope.synthesis.uncertainty],
    },
  };
}

function needsMarket(route: BtcCosmographerRoute): boolean {
  return ["btc_market", "snapshot_memory", "astro_btc_bridge"].includes(route.domain);
}

function parseRetainedAstroMemory(
  query: Record<string, string | string[] | undefined>,
): BtcMultiBodyAstroMemory | null {
  const domain = first(query.rad);
  const subject = first(query.ras);
  const start = first(query.rat0);
  const end = first(query.rat1);
  if (
    domain !== "astromodule" ||
    subject !== "planetary_aspects" ||
    !validObservationDate(start) ||
    !validObservationDate(end) ||
    end < start
  ) return null;
  return { domain, subject, start, end };
}

function marketOnlyRoute(route: BtcMultiBodyAstroRcRoute): BtcCosmographerRoute {
  const marketClass = route.market_question_class ?? "liquidity";
  return {
    ...route,
    domain: "btc_market",
    subject: marketClass,
    market_question_class: marketClass,
    capability_id: `btc_market.${marketClass}`,
    explicit_entities: [marketClass],
  };
}

export const getServerSideProps: GetServerSideProps<Props> = async ({ query, res }) => {
  const servedDeploymentSha = deploymentSourceSha();
  res.setHeader("Cache-Control", "private, no-store, max-age=0, must-revalidate");
  res.setHeader("CDN-Cache-Control", "no-store");
  res.setHeader("Vercel-CDN-Cache-Control", "no-store");
  res.setHeader("X-BTC-Deployment-Source-Sha", servedDeploymentSha ?? "UNAVAILABLE");
  res.setHeader("X-BTC-Dialogue-Session-Schema", BTC_DIALOGUE_SESSION_SCHEMA);
  const initialQuestion = first(query.q);
  const initialDate = first(query.d);
  const resolvedLocale = resolveBtcPublicLocale(first(query.lang), initialQuestion);
  const source = await loadBtcStaticSource();
  const sourceTimestamp = source.ok === false ? source.last_verified_at_utc ?? null : source.snapshot.generated_at_utc;
  const sourceContext: BtcCosmographerSourceContext = source.ok === false
    ? {
        state: "UNAVAILABLE",
        generated_at_utc: sourceTimestamp,
        age_hours: failureAgeHours(sourceTimestamp),
        proof_available: false,
      }
    : {
        state: source.freshness,
        generated_at_utc: sourceTimestamp,
        age_hours: source.age_hours,
        proof_available: true,
      };

  const base: Props = {
    locale: resolvedLocale.locale,
    initialQuestion: "",
    initialDate,
    route: null,
    answer: null,
    runtimeDecision: null,
    sourceContext,
    deploymentSourceSha: servedDeploymentSha,
    sourceBindingChanged: false,
    inputError: null,
  };

  if (initialDate && !validObservationDate(initialDate)) {
    return {
      props: {
        ...base,
        initialQuestion,
        inputError: resolvedLocale.locale === "ru"
          ? "Укажите реальную дату UTC в формате YYYY-MM-DD."
          : "Enter a real UTC date in YYYY-MM-DD format.",
      },
    };
  }

  if (!initialQuestion) return { props: base };

  const parsed = parseBtcCosmographerContext(query);
  const packet = parsed.malformed
    ? null
    : parsed.packet ?? parseLegacyContext(query);
  const retainedAstroMemory = parseRetainedAstroMemory(query);
  const initialRoute = routeBtcCosmographerLocalRc(
    resolvedLocale.locale,
    initialQuestion,
    packet,
    initialDate || undefined,
    retainedAstroMemory,
  );
  const relationResolution = applyBtcRelationIntentPrecedence(
    initialRoute,
    initialQuestion,
    packet,
    retainedAstroMemory,
  );
  const route = relationResolution.route;
  let snapshot: BtcPublicSnapshot | null = null;
  let envelope: BtcMarketEnvelope | null = null;

  if (needsMarket(route) && source.ok !== false) {
    const marketQuestion = canonicalizeBtcQuestionForRouter(route.normalized_question);
    const composed = await composeBtcPublicSnapshot(source, {
      question: marketQuestion,
      date: initialDate || undefined,
    });
    if (composed.ok !== false) {
      snapshot = {
        ...composed.value,
        question: {
          ...composed.value.question,
          raw: initialQuestion,
          normalized: route.normalized_question,
        },
      };
      const market = await loadBtcMarketEnvelope(marketQuestion, {
        temporal: {
          state: snapshot.temporal_context.state,
          label: snapshot.temporal_context.label,
          harmonic_tension: snapshot.aspect_pressure.harmonic_tension,
        },
      });
      if (market.ok !== false) envelope = applyFreshnessTruth(market.value, source.freshness);
    }
  }

  const answer = isPublicMultiBodyRoute(route)
    ? buildPublicMultiBodyAnswer(
        resolvedLocale.locale,
        route,
        snapshot && envelope
          ? buildBtcCosmographerAnswer(
              resolvedLocale.locale,
              marketOnlyRoute(route),
              { snapshot, envelope },
            )
          : null,
      ) as unknown as BtcCosmographerAnswerProjection
    : buildBtcCosmographerAnswer(resolvedLocale.locale, route, { snapshot, envelope });
  const runtimeDecision = buildBtcEvidenceNavigationRuntimeDecision(
    resolvedLocale.locale,
    route,
    answer,
    sourceContext,
    relationResolution.relation_resolution,
    relationResolution.btc_side_state_type,
  );
  const sourceBindingChanged = Boolean(
    packet?.prior_snapshot_generated_at_utc &&
    sourceTimestamp &&
    packet.prior_snapshot_generated_at_utc !== sourceTimestamp,
  );

  return {
    props: {
      ...base,
      initialQuestion,
      route,
      answer,
      runtimeDecision,
      sourceBindingChanged,
    },
  };
};

export default function BtcLivePage(props: Props) {
  const title = props.locale === "ru"
    ? "Чтение поля BTC · Market Cosmographer"
    : "BTC Field Read · Market Cosmographer";
  const description = props.locale === "ru"
    ? "Аналитический диалог о протоколе Bitcoin, рынке BTC, памяти снимков и астрономических данных."
    : "Analytical dialogue about the Bitcoin protocol, the BTC market, snapshot memory, and astronomical data.";
  return <>
    <Head>
      <title>{title}</title>
      <meta name="description" content={description}/>
      <meta name="btc-live-dialogue" content="semantic-route-graph-v0-1"/>
      <meta name="btc-deployment-source-sha" content={props.deploymentSourceSha ?? ""}/>
      <meta name="btc-runtime-schema" content={BTC_EVIDENCE_NAVIGATION_RUNTIME_SCHEMA}/>
      <meta name="btc-dialogue-session-schema" content={BTC_DIALOGUE_SESSION_SCHEMA}/>
      <meta name="btc-preview-cache-policy" content="no-store"/>
    </Head>
    <style dangerouslySetInnerHTML={{ __html: BTC_BILINGUAL_SURFACE_CSS }}/>
    <style dangerouslySetInnerHTML={{ __html: BTC_PRODUCT_REBALANCE_CSS }}/>
    <style dangerouslySetInnerHTML={{ __html: BTC_LIVE_DIALOGUE_CSS }}/>
    <BtcCosmographerDialogue {...props}/>
  </>;
}
