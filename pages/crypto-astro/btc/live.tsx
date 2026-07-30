import Head from "next/head";
import type { GetServerSideProps } from "next";
import {
  BtcCosmographerDialogue,
  type BtcCosmographerSourceContext,
} from "../../../components/btc/BtcCosmographerDialogue";
import {
  parseBtcCosmographerContext,
  routeBtcCosmographerQuestion,
  type BtcCosmographerRoute,
} from "../../../lib/btc-cosmographer-route-graph";
import { buildBtcCosmographerAnswer } from "../../../lib/btc-cosmographer-answer";
import type { BtcCosmographerAnswerProjection } from "../../../lib/btc-protocol-evidence";
import { loadBtcMarketEnvelope, type BtcMarketEnvelope } from "../../../lib/btc-market-envelope";
import { canonicalizeBtcQuestionForRouter } from "../../../lib/btc-public-question-bridge";
import { composeBtcPublicSnapshot } from "../../../lib/btc-public-snapshot-composer";
import { loadBtcStaticSource } from "../../../lib/btc-public-static-source";
import type { BtcPublicSnapshot } from "../../../lib/btc-public-output-contract";
import { resolveBtcPublicLocale, type BtcPublicLocale } from "../../../lib/btc-public-language-contract";
import { BTC_BILINGUAL_SURFACE_CSS } from "../../../lib/btc-bilingual-surface-style";
import { BTC_LIVE_DIALOGUE_CSS } from "../../../lib/btc-live-dialogue-style";
import { BTC_PRODUCT_REBALANCE_CSS } from "../../../lib/btc-product-rebalance-style";

const first = (value: string | string[] | undefined): string => Array.isArray(value) ? value[0] ?? "" : value ?? "";

function validObservationDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day;
}

type Props = {
  locale: BtcPublicLocale;
  initialQuestion: string;
  initialDate: string;
  route: BtcCosmographerRoute | null;
  answer: BtcCosmographerAnswerProjection | null;
  sourceContext: BtcCosmographerSourceContext;
  deploymentSourceSha: string | null;
  sourceBindingChanged: boolean;
  inputError: string | null;
};

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

export const getServerSideProps: GetServerSideProps<Props> = async ({ query }) => {
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
    sourceContext,
    deploymentSourceSha: deploymentSourceSha(),
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
  const packet = parsed.malformed ? null : parsed.packet;
  const route = routeBtcCosmographerQuestion(resolvedLocale.locale, initialQuestion, packet, initialDate || undefined);
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

  const answer = buildBtcCosmographerAnswer(resolvedLocale.locale, route, { snapshot, envelope });
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
      sourceBindingChanged,
    },
  };
};

export default function BtcLivePage(props: Props) {
  const title = props.locale === "ru"
    ? "BTC Космограф · Bitcoin Corridor"
    : "BTC Cosmographer · Bitcoin Corridor";
  const description = props.locale === "ru"
    ? "Навигационный диалог по протоколу Bitcoin, BTC Market, Snapshot Memory и Astromodule."
    : "A navigational dialogue across Bitcoin Protocol, BTC Market, Snapshot Memory and Astromodule.";
  return <>
    <Head>
      <title>{title}</title>
      <meta name="description" content={description}/>
      <meta name="btc-live-dialogue" content="semantic-route-graph-v0-1"/>
      <meta name="btc-deployment-source-sha" content={props.deploymentSourceSha ?? ""}/>
    </Head>
    <style dangerouslySetInnerHTML={{ __html: BTC_BILINGUAL_SURFACE_CSS }}/>
    <style dangerouslySetInnerHTML={{ __html: BTC_PRODUCT_REBALANCE_CSS }}/>
    <style dangerouslySetInnerHTML={{ __html: BTC_LIVE_DIALOGUE_CSS }}/>
    <BtcCosmographerDialogue {...props}/>
  </>;
}
