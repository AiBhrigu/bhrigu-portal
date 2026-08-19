import assert from "node:assert/strict";
import {
  BTC_COSMOGRAPHER_CONTEXT_SCHEMA,
  routeBtcCosmographerQuestion,
  type BtcCosmographerContextPacket,
  type BtcCosmographerRoute,
} from "../lib/btc-cosmographer-route-graph";
import { specializeBridgeAnswer } from "../lib/btc-cosmographer-specialized-answer";
import { buildBtcEvidenceNavigationRuntimeDecision } from "../lib/btc-cosmographer-evidence-navigation-runtime";
import type { BtcCosmographerAnswerProjection } from "../lib/btc-protocol-evidence";

type Locale = "ru" | "en";
type Case = {
  id: string;
  locale: Locale;
  turn2: string;
  expectedMarketClass: string;
  expectedDirect: RegExp;
};

const RU_TURN_1 = "Планетарные аспекты 2026 — где самые сильные окна?";
const EN_TURN_1 = "Planetary aspects in 2026 — where are the strongest windows?";

const cases: Case[] = [
  { id: "RU_1", locale: "ru", turn2: "Где в этих окнах волатильность BTC самая высокая?", expectedMarketClass: "temporal_pressure", expectedDirect: /нет сопоставимых значений волатильности/ },
  { id: "RU_2", locale: "ru", turn2: "А в них где волатильность BTC выше?", expectedMarketClass: "temporal_pressure", expectedDirect: /нет сопоставимых значений волатильности/ },
  { id: "RU_3", locale: "ru", turn2: "Где в этих окнах ликвидность BTC выше?", expectedMarketClass: "liquidity", expectedDirect: /Snapshot показывает ликвидность сейчас.*не значения ликвидности для каждого/ },
  { id: "EN_1", locale: "en", turn2: "Where is BTC volatility highest in these windows?", expectedMarketClass: "temporal_pressure", expectedDirect: /does not contain comparable volatility values/ },
  { id: "EN_2", locale: "en", turn2: "Which of these windows has higher BTC liquidity?", expectedMarketClass: "liquidity", expectedDirect: /Snapshot describes liquidity now.*does not provide comparable liquidity values/ },
  { id: "EN_3", locale: "en", turn2: "How did BTC move in these windows?", expectedMarketClass: "change_memory", expectedDirect: /does not contain comparable BTC-movement values/ },
];

function contextFrom(route: BtcCosmographerRoute): BtcCosmographerContextPacket {
  return {
    schema: BTC_COSMOGRAPHER_CONTEXT_SCHEMA,
    prior_domain: route.domain,
    prior_subject: route.subject,
    prior_intents: route.intents,
    prior_answer_state: "CONFIRMED",
    prior_market_question_class: route.market_question_class,
    prior_time_start: route.time_range?.start ?? null,
    prior_time_end: route.time_range?.end ?? null,
    prior_snapshot_generated_at_utc: "2026-08-19T17:58:47Z",
  };
}

function firstTurn(locale: Locale): BtcCosmographerRoute {
  const route = routeBtcCosmographerQuestion(locale, locale === "ru" ? RU_TURN_1 : EN_TURN_1, null);
  assert.equal(route.domain, "astromodule");
  assert.equal(route.subject, "planetary_aspects");
  assert.equal(route.time_range?.start, "2026-01-01");
  assert.equal(route.time_range?.end, "2026-12-31");
  return route;
}

function currentSnapshotBridge(locale: Locale): BtcCosmographerAnswerProjection {
  return {
    answer_state: "LIMITED",
    answer_mode: "ASTRO_BTC_BRIDGE",
    headline: "legacy bridge",
    direct_answer: locale === "ru"
      ? "Сначала состояние BTC: текущий Snapshot $68,199. Затем астрономическое окно."
      : "BTC-side state first: current Snapshot $68,199. Then the astronomical window.",
    sections: [
      {
        id: "btc_side_state",
        label: locale === "ru" ? "1 · Состояние стороны BTC" : "1 · BTC-side state",
        bullets: locale === "ru"
          ? ["Принятая цена BTC: $68,199.", "Доля стейблкоинов: 13.2%."]
          : ["Accepted BTC price: $68,199.", "Stablecoin share: 13.2%."],
      },
      {
        id: "astro_window",
        label: locale === "ru" ? "2 · Астрономическое окно" : "2 · Astronomical window",
        bullets: ["Astro annual-priority window context."],
      },
      {
        id: "non_causal_boundary",
        label: locale === "ru" ? "Непричинная граница" : "Non-causal boundary",
        paragraph: locale === "ru" ? "Причинность не установлена." : "Causality is not established.",
      },
      {
        id: "non_trading_boundary",
        label: locale === "ru" ? "Нет торговой инструкции" : "No trading instruction",
        paragraph: locale === "ru" ? "Торговая инструкция не создаётся." : "No trading instruction is created.",
      },
    ],
    source_boundary: "Current accepted Snapshot and Delta only.",
    proof_label: "BTC and Astro evidence bound independently",
  };
}

for (const item of cases) {
  const first = firstTurn(item.locale);
  const route = routeBtcCosmographerQuestion(item.locale, item.turn2, contextFrom(first));

  assert.equal(route.domain, "astro_btc_bridge", `${item.id}: domain`);
  assert.equal(route.context_relation, "CROSS_MODULE_BRIDGE", `${item.id}: relation`);
  assert.equal(route.subject, "planetary_aspects", `${item.id}: subject retained`);
  assert.equal(route.time_range?.start, "2026-01-01", `${item.id}: period start`);
  assert.equal(route.time_range?.end, "2026-12-31", `${item.id}: period end`);
  assert.equal(route.time_range?.source, "CONTEXT", `${item.id}: period source`);
  assert.equal(route.market_question_class, item.expectedMarketClass, `${item.id}: market class`);
  assert.notEqual(route.context_relation, "GENUINELY_AMBIGUOUS", `${item.id}: no false clarification`);

  const answer = specializeBridgeAnswer(item.locale, route, currentSnapshotBridge(item.locale));
  assert.equal(answer.answer_state, "LIMITED", `${item.id}: inadequate window evidence must be LIMITED`);
  assert.equal(answer.answer_mode, "ASTRO_BTC_BRIDGE", `${item.id}: bridge answer mode preserved`);
  assert.match(answer.direct_answer, item.expectedDirect, `${item.id}: actual window predicate resolved first`);
  assert.match(answer.direct_answer, /2026/, `${item.id}: retained period visible in direct resolution`);
  assert.doesNotMatch(answer.direct_answer, /\$68,199|13\.2%/, `${item.id}: current Snapshot cannot substitute for window predicate`);
  assert.ok(answer.sections.some((section) => section.id === "window_comparison_evidence_gap"), `${item.id}: evidence adequacy section`);
  assert.ok(answer.sections.some((section) => section.id === "current_btc_context_secondary"), `${item.id}: current state only secondary`);
  assert.ok(answer.sections.some((section) => section.id === "astro_not_btc_metric_proxy"), `${item.id}: Astro intensity is not a BTC proxy`);
  assert.ok(answer.sections.some((section) => section.id === "non_causal_boundary"), `${item.id}: causal boundary preserved`);
  assert.ok(answer.sections.some((section) => section.id === "non_trading_boundary"), `${item.id}: trading boundary preserved`);
  assert.match(answer.source_boundary, /does not substitute|не заменяет/, `${item.id}: no current Snapshot substitution boundary`);
  assert.doesNotMatch(answer.direct_answer, /#\s*1|rank\s*1|ранг\s*1/, `${item.id}: no invented window ranking`);

  const nonSecondaryText = [answer.direct_answer, ...answer.sections
    .filter((section) => section.id !== "current_btc_context_secondary")
    .flatMap((section) => section.bullets ?? (section.paragraph ? [section.paragraph] : []))]
    .join(" ");
  assert.doesNotMatch(nonSecondaryText, /\$68,199|13\.2%/, `${item.id}: current Snapshot facts confined to secondary context`);

  const runtime = buildBtcEvidenceNavigationRuntimeDecision(
    item.locale,
    route,
    answer,
    { state: "ACCEPTED", generated_at_utc: "2026-08-19T17:58:47Z", proof_available: true },
    "TWO_DOMAINS_RESOLVED",
    "MARKET",
  );
  assert.equal(runtime.render_gate.user_intent_resolved, true, `${item.id}: existing field means no clarification, not full predicate proof`);
  assert.equal(runtime.route_disposition, "CONTINUE", `${item.id}: LIMITED direct answer remains a valid non-clarification answer`);
}

const ruContext = contextFrom(firstTurn("ru"));
const enContext = contextFrom(firstTurn("en"));

const pureAstro = routeBtcCosmographerQuestion("en", "Which of these windows is astronomically strongest?", enContext);
assert.equal(pureAstro.domain, "astromodule", "negative 1: Astro answer unchanged");

const currentVolatility = routeBtcCosmographerQuestion("ru", "Что сейчас с волатильностью BTC?", ruContext);
assert.equal(currentVolatility.domain, "btc_market", "negative 2: current BTC volatility stays market");
assert.notEqual(currentVolatility.context_relation, "CROSS_MODULE_BRIDGE", "negative 2: no Astro bridge required");

const currentLiquidity = routeBtcCosmographerQuestion("en", "Do current liquidity conditions support BTC?", enContext);
assert.equal(currentLiquidity.domain, "btc_market", "negative 3: current liquidity stays current Snapshot lane");
assert.notEqual(currentLiquidity.context_relation, "CROSS_MODULE_BRIDGE", "negative 3: no historical-window insufficiency path");

const halving = routeBtcCosmographerQuestion("ru", "Что происходило с халвингом Bitcoin в этих окнах?", ruContext);
assert.notEqual(halving.domain, "astro_btc_bridge", "negative 4: protocol wording is not market bridge");

const causal = routeBtcCosmographerQuestion("ru", "Вызывают ли эти аспекты рост волатильности BTC?", ruContext);
assert.equal(causal.domain, "astromodule", "negative 5: existing causal route preserved");
assert.equal(causal.subject, "planetary_aspects", "negative 5: causal subject preserved");
assert.equal(causal.context_relation, "FOLLOW_UP", "negative 5: causal relation preserved");

console.log("BTC_ASTRO_BTC_WINDOW_PREDICATE_FIDELITY=PASS");
console.log("EVIDENCE_ADEQUACY=INADEQUATE_FOR_WINDOW_BY_WINDOW_COMPARISON");
console.log("MANDATORY_RU=3/3_PASS");
console.log("MANDATORY_EN=3/3_PASS");
console.log("NEGATIVE_CONTROLS=5/5_PASS");
console.log("HUMAN_PREDICATE_RESOLUTION=PASS");
console.log("NO_CURRENT_SNAPSHOT_SUBSTITUTION=PASS");
console.log("NO_INVENTED_WINDOW_RANKING=PASS");
console.log("USER_INTENT_RESOLVED_CONTRACT=NAVIGATION_NON_CLARIFICATION_ONLY");
