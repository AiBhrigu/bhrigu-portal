import Head from "next/head";
import type { GetServerSideProps } from "next";
import { BtcCosmographerMultiBodyAstroRc } from "../../../components/btc/BtcCosmographerMultiBodyAstroRc";
import {
  buildMultiBodyAstroYearAnswer,
  combineMultiBodyAstroMarketAnswer,
  routeBtcCosmographerLocalRc,
  type BtcMultiBodyAstroMemory,
  type BtcMultiBodyAstroRcAnswer,
  type BtcMultiBodyAstroRcRoute,
} from "../../../lib/btc-cosmographer-multi-body-astro-rc";
import { buildBtcCosmographerAnswer } from "../../../lib/btc-cosmographer-answer";
import {
  parseBtcCosmographerContext,
  type BtcCosmographerRoute,
} from "../../../lib/btc-cosmographer-route-graph";
import {
  loadBtcMarketEnvelope,
  type BtcMarketEnvelope,
} from "../../../lib/btc-market-envelope";
import { canonicalizeBtcQuestionForRouter } from "../../../lib/btc-public-question-bridge";
import { composeBtcPublicSnapshot } from "../../../lib/btc-public-snapshot-composer";
import { loadBtcStaticSource } from "../../../lib/btc-public-static-source";
import type { BtcPublicSnapshot } from "../../../lib/btc-public-output-contract";
import {
  resolveBtcPublicLocale,
  type BtcPublicLocale,
} from "../../../lib/btc-public-language-contract";

const first = (value: string | string[] | undefined): string =>
  Array.isArray(value) ? value[0] ?? "" : value ?? "";

function validObservationDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day;
}

function deploymentSourceSha(): string | null {
  const value = process.env.GITHUB_SHA ?? process.env.VERCEL_GIT_COMMIT_SHA ?? null;
  return value && /^[0-9a-f]{40}$/i.test(value) ? value : null;
}

function parseAstroMemory(
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

function latestAstroMemory(
  route: BtcMultiBodyAstroRcRoute | null,
  prior: BtcMultiBodyAstroMemory | null,
): BtcMultiBodyAstroMemory | null {
  if (
    route?.subject === "planetary_aspects" &&
    route.time_range &&
    (route.domain === "astromodule" || route.domain === "astro_btc_bridge")
  ) {
    return {
      domain: "astromodule",
      subject: "planetary_aspects",
      start: route.time_range.start,
      end: route.time_range.end,
    };
  }
  return prior;
}

function needsMarket(route: BtcMultiBodyAstroRcRoute): boolean {
  return ["btc_market", "snapshot_memory", "astro_btc_bridge"].includes(route.domain);
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

type Props = {
  locale: BtcPublicLocale;
  initialQuestion: string;
  initialDate: string;
  route: BtcMultiBodyAstroRcRoute | null;
  answer: BtcMultiBodyAstroRcAnswer | null;
  astroMemory: BtcMultiBodyAstroMemory | null;
  deploymentSourceSha: string | null;
  sourceState: string;
  inputError: string | null;
};

export const getServerSideProps: GetServerSideProps<Props> = async ({ query }) => {
  if (process.env.BTC_LOCAL_RC !== "1") return { notFound: true };

  const initialQuestion = first(query.q);
  const initialDate = first(query.d);
  const locale = resolveBtcPublicLocale(first(query.lang), initialQuestion).locale;
  const source = await loadBtcStaticSource();
  const sourceState = source.ok === false ? "UNAVAILABLE" : source.freshness;
  const priorAstroMemory = parseAstroMemory(query);

  const base: Props = {
    locale,
    initialQuestion: "",
    initialDate,
    route: null,
    answer: null,
    astroMemory: priorAstroMemory,
    deploymentSourceSha: deploymentSourceSha(),
    sourceState,
    inputError: null,
  };

  if (initialDate && !validObservationDate(initialDate)) {
    return {
      props: {
        ...base,
        initialQuestion,
        inputError: locale === "ru"
          ? "Укажите реальную дату UTC в формате YYYY-MM-DD."
          : "Enter a real UTC date in YYYY-MM-DD format.",
      },
    };
  }
  if (!initialQuestion) return { props: base };

  const parsed = parseBtcCosmographerContext(query);
  const packet = parsed.malformed ? null : parsed.packet;
  const route = routeBtcCosmographerLocalRc(
    locale,
    initialQuestion,
    packet,
    initialDate || undefined,
    priorAstroMemory,
  );

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
      if (market.ok !== false) envelope = market.value;
    }
  }

  let answer: BtcMultiBodyAstroRcAnswer;
  if (route.subject === "planetary_aspects" && route.domain === "astromodule") {
    answer = buildMultiBodyAstroYearAnswer(locale, route);
  } else if (route.subject === "planetary_aspects" && route.domain === "astro_btc_bridge") {
    const astro = buildMultiBodyAstroYearAnswer(locale, route);
    const market = snapshot && envelope
      ? buildBtcCosmographerAnswer(locale, marketOnlyRoute(route), { snapshot, envelope })
      : null;
    answer = combineMultiBodyAstroMarketAnswer(locale, astro, market);
  } else {
    answer = buildBtcCosmographerAnswer(locale, route, { snapshot, envelope });
  }

  return {
    props: {
      ...base,
      initialQuestion,
      route,
      answer,
      astroMemory: latestAstroMemory(route, priorAstroMemory),
    },
  };
};

export default function BtcCosmographerLocalRcPage(props: Props) {
  const ru = props.locale === "ru";
  return <>
    <Head>
      <title>{ru ? "BTC Космограф · Local RC" : "BTC Cosmographer · Local RC"}</title>
      <meta name="robots" content="noindex,nofollow,noarchive"/>
      <meta name="btc-local-rc" content="multi-body-astro-corridor-v0-1"/>
      <meta name="btc-deployment-source-sha" content={props.deploymentSourceSha ?? ""}/>
    </Head>
    <BtcCosmographerMultiBodyAstroRc {...props}/>
  </>;
}
