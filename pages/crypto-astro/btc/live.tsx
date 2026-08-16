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
  buildBtcBinancePublicBinding,
  decideBtcBinancePublicBinding,
  type BtcBinancePublicBindingPacket,
} from "../../../lib/btc-binance-public-binding";
import { loadBtcBinancePublicMarketShadow, type BinancePublicMarketResult } from "../../../lib/btc-binance-public-market-source";
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
import {
  BTC_DIALOGUE_SESSION_SCHEMA,
  type BtcEvidenceArtifactTarget,
} from "../../../lib/btc-live-dialogue-session";
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
  pendingClarificationOriginFingerprint: string | null;
  evidenceRevisionId: string | null;
  evidenceTargets: BtcEvidenceArtifactTarget[];
  binanceLiveBinding: BtcBinancePublicBindingPacket | null;
};

// Connector-authored deployment pulse: PR114 exact Preview identity v0.2.
function deploymentSourceSha(): string | null {
  const value = process.env.VERCEL_GIT_COMMIT_SHA ??
    process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ??
    process.env.GITHUB_SHA ??
    null;
  return value && /^[0-9a-f]{40}$/i.test(value) ? value : null;
}

function portalEvidenceUrl(sha: string, path: string): string {
  return `https://github.com/AiBhrigu/bhrigu-portal/blob/${sha}/${path}`;
}

function marketEvidenceUrl(sha: string, path: string): string {
  return `https://github.com/AiBhrigu/phi-cosmography-open/blob/${sha}/site/crypto-astro/data/${path}`;
}

function buildEvidenceNavigation(
  route: BtcCosmographerRoute,
  envelope: BtcMarketEnvelope | null,
  deploymentSha: string | null,
  snapshotTimestamp: string | null,
): { revisionId: string | null; targets: BtcEvidenceArtifactTarget[] } {
  const targets: BtcEvidenceArtifactTarget[] = [];
  const addPortal = (id: string, label: string, path: string) => {
    if (!deploymentSha) return;
    targets.push({ id, label, url: portalEvidenceUrl(deploymentSha, path), revision: deploymentSha });
  };
  const addMarket = (id: string, label: string, sha: string, path: string) => {
    targets.push({ id, label, url: marketEvidenceUrl(sha, path), revision: sha });
  };

  const protocolSide = route.domain === "astro_btc_bridge" && route.explicit_entities.includes("btc_side:protocol");
  const astroSide = route.domain === "astromodule" || route.domain === "astro_btc_bridge";
  const marketSide = route.domain === "btc_market" || route.domain === "snapshot_memory" || (route.domain === "astro_btc_bridge" && !protocolSide);

  if (route.domain === "bitcoin_protocol" || protocolSide) {
    addPortal("protocol_evidence", "Bitcoin Protocol evidence object", "lib/btc-protocol-evidence.ts");
  }
  if (astroSide) {
    addPortal("astro_evidence", "Astronomical evidence index", "data/btc_public_astro_evidence_v0_1.json");
  }
  if (marketSide && envelope) {
    const current = envelope.memory.current_commit_sha;
    addMarket("market_snapshot", "Accepted Market Snapshot", current, "crypto_astro_snapshot.public.json");
    addMarket("market_proof", "Market source proof", current, "crypto_astro_snapshot_proof.public.json");
    if (route.domain === "snapshot_memory") {
      const previous = envelope.memory.previous_commit_sha;
      addMarket("previous_snapshot", "Previous accepted Market Snapshot", previous, "crypto_astro_snapshot.public.json");
    }
  }

  const revisions = Array.from(new Set(targets.map((target) => target.revision)));
  const revisionId = marketSide && snapshotTimestamp
    ? `snapshot ${snapshotTimestamp}${revisions.length ? ` · ${revisions.join(" · ")}` : ""}`
    : revisions.join(" · ") || null;
  return { revisionId, targets };
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
  if (route.domain === "astro_btc_bridge" && route.explicit_entities.includes("btc_side:protocol")) return false;
  return ["btc_market", "snapshot_memory", "astro_btc_bridge"].includes(route.domain);
}

const MARKET_EVIDENCE_QUESTIONS: Record<BtcEnvelopeQuestionClass, string> = {
  btc_gravity: "What does BTC dominance mean for wider market gravity?",
  market_structure: "Do regime, Market Field Score and market cap confirm the current BTC structure?",
  liquidity: "What do stablecoin share, DeFi TVL and DEX volume show about current BTC liquidity?",
  market_participation_rotation: "What do altcoin breadth, ETH rotation and participation show around BTC?",
  change_memory: "What changed in accepted Snapshot Memory since the previous verified snapshot?",
  temporal_pressure: "How does the selected date change BTC temporal pressure?",
  general_btc_field: "What is the current BTC field overview and why does it matter?",
};

function marketEvidenceQuestion(route: BtcCosmographerRoute): string {
  return route.market_question_class
    ? MARKET_EVIDENCE_QUESTIONS[route.market_question_class]
    : canonicalizeBtcQuestionForRouter(route.normalized_question);
}

function isReturnRequest(question: string): boolean {
  return /back to|return to|go back|previous topic|prior topic|верн[её]мся|вернись|вернуться|снова к|предыдущ(?:ей|ему|ая|ий) тем/i.test(question);
}

function parseReturnContext(
  query: Record<string, string | string[] | undefined>,
): BtcCosmographerContextPacket | null {
  const parsed = parseBtcCosmographerContext({
    cc: query.rcc,
    cd: query.rcd,
    cs: query.rcs,
    ci: query.rci,
    ca: query.rca,
    cm: query.rcm,
    ct0: query.rct0,
    ct1: query.rct1,
    cb: query.rcb,
  });
  return parsed.malformed ? null : parsed.packet;
}

type PendingClarificationPacket = {
  origin_fingerprint: string;
  target: "SUBJECT" | "PERIOD" | "RELATION_OBJECT" | "ASSET";
  origin_domain: string;
  origin_subject: string;
  origin_time_start: string;
  origin_time_end: string;
};

function parsePendingClarification(
  query: Record<string, string | string[] | undefined>,
): PendingClarificationPacket | null {
  const originFingerprint = first(query.pof);
  const target = first(query.pct) as PendingClarificationPacket["target"];
  const originDomain = first(query.pcd);
  const originSubject = first(query.pcs);
  const originTimeStart = first(query.pct0);
  const originTimeEnd = first(query.pct1);
  if (!originFingerprint || originFingerprint.length > 1200) return null;
  if (!["SUBJECT", "PERIOD", "RELATION_OBJECT", "ASSET"].includes(target)) return null;
  if (!originDomain || originDomain.length > 80 || !originSubject || originSubject.length > 120) return null;
  if (originTimeStart && !validObservationDate(originTimeStart)) return null;
  if (originTimeEnd && !validObservationDate(originTimeEnd)) return null;
  return {
    origin_fingerprint: originFingerprint,
    target,
    origin_domain: originDomain,
    origin_subject: originSubject,
    origin_time_start: originTimeStart,
    origin_time_end: originTimeEnd,
  };
}

function resolvePendingClarificationQuestion(
  locale: BtcPublicLocale,
  rawQuestion: string,
  pending: PendingClarificationPacket | null,
): string {
  if (!pending) return rawQuestion;
  const normalized = rawQuestion.trim().toLowerCase().replace(/\s+/g, " ").replace(/[?!.]+$/g, "");
  if (/^(?:method|methodology|метод|методика)$/.test(normalized)) {
    return locale === "ru"
      ? "Какие источники и метод использует Космограф?"
      : "Which sources and method does Cosmographer use?";
  }
  if (/^(?:bitcoin protocol|btc protocol|protocol bitcoin|protocol btc|протокол bitcoin|протокол btc|протокол биткоин)$/.test(normalized)) {
    return locale === "ru" ? "Что такое протокол Bitcoin?" : "What is the Bitcoin protocol?";
  }
  if (/^(?:btc market|bitcoin market|market btc|рынок btc|рынок bitcoin|рынок биткоин)$/.test(normalized)) {
    return locale === "ru" ? "Что происходит с рынком BTC сейчас?" : "What is happening with the BTC market now?";
  }
  if (/^(?:snapshot|снимок|память snapshot)$/.test(normalized)) {
    return locale === "ru" ? "Что изменилось с прошлого Snapshot?" : "What changed since the previous Snapshot?";
  }
  if (/^(?:planet|planets|планета|планеты)$/.test(normalized)) {
    return locale === "ru" ? "Текущее положение планет?" : "What are the current planetary positions?";
  }
  return rawQuestion;
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
  res.setHeader("X-Robots-Tag", "noindex, follow");
  const initialQuestion = first(query.q);
  const initialDate = first(query.d);
  const resolvedLocale = resolveBtcPublicLocale(first(query.lang), initialQuestion);
  const sourcePromise = loadBtcStaticSource();

  const finishSource = async () => {
    const source = await sourcePromise;
    const sourceTimestamp = source.ok === false ? source.last_verified_at_utc ?? null : source.snapshot.generated_at_utc;
    const sourceContext: BtcCosmographerSourceContext = source.ok === false
      ? { state: "UNAVAILABLE", generated_at_utc: sourceTimestamp, age_hours: failureAgeHours(sourceTimestamp), proof_available: false }
      : { state: source.freshness, generated_at_utc: sourceTimestamp, age_hours: source.age_hours, proof_available: true };
    return { source, sourceTimestamp, sourceContext };
  };

  const emptyProps = (sourceContext: BtcCosmographerSourceContext): Props => ({
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
    pendingClarificationOriginFingerprint: null,
    evidenceRevisionId: null,
    evidenceTargets: [],
    binanceLiveBinding: null,
  });

  if (initialDate && !validObservationDate(initialDate)) {
    const { sourceContext } = await finishSource();
    return { props: { ...emptyProps(sourceContext), initialQuestion, inputError: resolvedLocale.locale === "ru" ? "Укажите реальную дату UTC в формате YYYY-MM-DD." : "Enter a real UTC date in YYYY-MM-DD format." } };
  }
  if (!initialQuestion) {
    const { sourceContext } = await finishSource();
    return { props: emptyProps(sourceContext) };
  }

  const parsed = parseBtcCosmographerContext(query);
  const packet = parsed.malformed ? null : parsed.packet ?? parseLegacyContext(query);
  const returnPacket = parseReturnContext(query);
  const pendingClarification = parsePendingClarification(query);
  const routingQuestion = resolvePendingClarificationQuestion(resolvedLocale.locale, initialQuestion, pendingClarification);
  const retainedAstroMemory = parseRetainedAstroMemory(query);
  const activePacket = isReturnRequest(routingQuestion) ? returnPacket ?? packet : packet;
  const initialRoute = routeBtcCosmographerLocalRc(resolvedLocale.locale, routingQuestion, activePacket, initialDate || undefined, retainedAstroMemory);
  const explicitReturn = Boolean(returnPacket && isReturnRequest(routingQuestion));
  const returnRoute = explicitReturn && returnPacket
    ? {
        ...initialRoute,
        domain: returnPacket.prior_domain,
        subject: returnPacket.prior_subject,
        intents: returnPacket.prior_intents,
        context_relation: "RETURN_TO_PREVIOUS_TOPIC" as const,
        time_range: returnPacket.prior_time_start && returnPacket.prior_time_end
          ? { start: returnPacket.prior_time_start, end: returnPacket.prior_time_end, label: returnPacket.prior_time_start === returnPacket.prior_time_end ? returnPacket.prior_time_start : `${returnPacket.prior_time_start} — ${returnPacket.prior_time_end}`, source: "CONTEXT" as const }
          : null,
        market_question_class: returnPacket.prior_market_question_class,
        capability_id: `${returnPacket.prior_domain}.${returnPacket.prior_subject}`,
        confidence: "HIGH" as const,
        explicit_entities: Array.from(new Set([...initialRoute.explicit_entities, returnPacket.prior_subject])),
      }
    : null;
  const relationResolution = returnRoute
    ? { route: returnRoute, relation_resolution: "SINGLE_DOMAIN" as const, btc_side_state_type: null }
    : applyBtcRelationIntentPrecedence(initialRoute, routingQuestion, activePacket, retainedAstroMemory);
  const route = relationResolution.route;

  const binanceDecision = decideBtcBinancePublicBinding({
    route,
    vercelEnv: process.env.VERCEL_ENV,
    disabled: process.env.BHRIGU_BINANCE_PUBLIC_BINDING_DISABLE === "1",
  });
  const binancePromise: Promise<BinancePublicMarketResult | null> = binanceDecision.fetch
    ? loadBtcBinancePublicMarketShadow()
    : Promise.resolve(null);

  const { source, sourceTimestamp, sourceContext } = await finishSource();
  const base = emptyProps(sourceContext);
  let snapshot: BtcPublicSnapshot | null = null;
  let envelope: BtcMarketEnvelope | null = null;

  if (needsMarket(route) && source.ok !== false) {
    const marketQuestion = marketEvidenceQuestion(route);
    const composed = await composeBtcPublicSnapshot(source, { question: marketQuestion, date: initialDate || undefined });
    if (composed.ok !== false) {
      snapshot = {
        ...composed.value,
        question: { ...composed.value.question, raw: initialQuestion, normalized: route.normalized_question },
      };
      const market = await loadBtcMarketEnvelope(marketQuestion, {
        temporal: { state: snapshot.temporal_context.state, label: snapshot.temporal_context.label, harmonic_tension: snapshot.aspect_pressure.harmonic_tension },
      });
      if (market.ok !== false) envelope = applyFreshnessTruth(market.value, source.freshness);
    }
  }

  const answer = isPublicMultiBodyRoute(route)
    ? buildPublicMultiBodyAnswer(
        resolvedLocale.locale,
        route,
        snapshot && envelope ? buildBtcCosmographerAnswer(resolvedLocale.locale, marketOnlyRoute(route), { snapshot, envelope }) : null,
      ) as unknown as BtcCosmographerAnswerProjection
    : buildBtcCosmographerAnswer(resolvedLocale.locale, route, { snapshot, envelope });
  const evidenceNavigation = buildEvidenceNavigation(route, envelope, servedDeploymentSha, sourceTimestamp);
  const runtimeDecision = buildBtcEvidenceNavigationRuntimeDecision(
    resolvedLocale.locale,
    route,
    answer,
    sourceContext,
    relationResolution.relation_resolution,
    relationResolution.btc_side_state_type,
    pendingClarification?.origin_fingerprint ?? null,
  );
  const sourceBindingChanged = Boolean(packet?.prior_snapshot_generated_at_utc && sourceTimestamp && packet.prior_snapshot_generated_at_utc !== sourceTimestamp);
  const binanceResult = await binancePromise;
  const binanceLiveBinding = binanceResult
    ? buildBtcBinancePublicBinding({
        decision: binanceDecision,
        result: binanceResult,
        staticPeer: source.ok === false ? null : {
          price_usd: source.snapshot.public_samples.assets.BTC.price_usd,
          observed_at: source.snapshot.generated_at_utc,
          freshness: source.freshness,
        },
      })
    : null;

  return {
    props: {
      ...base,
      initialQuestion,
      route,
      answer,
      runtimeDecision,
      sourceBindingChanged,
      pendingClarificationOriginFingerprint: pendingClarification?.origin_fingerprint ?? null,
      evidenceRevisionId: evidenceNavigation.revisionId,
      evidenceTargets: evidenceNavigation.targets,
      binanceLiveBinding,
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
      <meta name="robots" content="noindex,follow"/>
      <link rel="canonical" href={`https://www.bhrigu.io/crypto-astro/btc?lang=${props.locale}`}/>
      <link rel="alternate" hrefLang="en" href="https://www.bhrigu.io/crypto-astro/btc?lang=en"/>
      <link rel="alternate" hrefLang="ru" href="https://www.bhrigu.io/crypto-astro/btc?lang=ru"/>
      <link rel="alternate" hrefLang="x-default" href="https://www.bhrigu.io/crypto-astro/btc?lang=en"/>
      <meta property="og:title" content={title}/>
      <meta property="og:description" content={description}/>
      <meta property="og:url" content={`https://www.bhrigu.io/crypto-astro/btc?lang=${props.locale}`}/>
      <meta name="twitter:title" content={title}/>
      <meta name="twitter:description" content={description}/>
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
