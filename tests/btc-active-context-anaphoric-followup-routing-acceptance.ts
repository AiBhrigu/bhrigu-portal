import assert from "node:assert/strict";
import fs from "node:fs";
import {
  routeBtcCosmographerQuestion,
  type BtcCosmographerContextPacket,
} from "../lib/btc-cosmographer-route-graph";
import {
  buildSpecializedMethodologyAnswer,
  specializeMarketAnswer,
} from "../lib/btc-cosmographer-specialized-answer";
import type { BtcCosmographerAnswerProjection } from "../lib/btc-protocol-evidence";

function marketAnswer(locale: "ru" | "en"): BtcCosmographerAnswerProjection {
  const ru = locale === "ru";
  return {
    answer_state: "SPLIT",
    answer_mode: "MARKET_DIAGNOSIS",
    headline: ru ? "Принятая память фиксирует противоположные переходы" : "Accepted memory records opposing transitions",
    direct_answer: ru ? "Базовый ответ." : "Base answer.",
    sections: [
      {
        id: "market_evidence",
        label: ru ? "Что изменилось" : "What changed",
        bullets: ru
? [
    "Доминирование BTC: 56.54% → 56.64% (+0.1 pp).",
    "Доля стейблкоинов: 13.5% → 13.41% (−0.1 pp).",
    "Ширина альткоинов · 24ч: 38.7% → 26.5% (−12.2 pp).",
  ]
: [
    "BTC dominance: 56.54% → 56.64% (+0.1 pp).",
    "Stablecoin share: 13.5% → 13.41% (−0.1 pp).",
    "Altcoin breadth · 24h: 38.7% → 26.5% (−12.2 pp).",
  ],
      },
      {
        id: "market_limit",
        label: ru ? "Согласие и расхождение" : "Agreement and divergence",
        paragraph: ru ? "Принятая память содержит противоположные движения модулей." : "Accepted memory contains opposing module moves.",
      },
      {
        id: "market_watch",
        label: ru ? "Что изменит чтение" : "What would change the read",
        paragraph: ru
? "Наблюдайте за следующими принятыми изменениями гравитации BTC, ликвидности и участия."
: "Watch the next accepted changes in BTC gravity, liquidity, and participation.",
      },
    ],
    source_boundary: ru
      ? "Рыночные значения строятся только из принятого Snapshot и Delta; это не торговый сигнал."
      : "Market values are built only from the accepted Snapshot and Delta; this is not a trading signal.",
    proof_label: ru ? "Рыночные доказательства доступны" : "Market evidence available",
  };
}

const snapshotPacket: BtcCosmographerContextPacket = {
  schema: "btc_cosmographer_context_v0_1",
  prior_domain: "snapshot_memory",
  prior_subject: "change_memory",
  prior_intents: ["change"],
  prior_answer_state: "SPLIT",
  prior_market_question_class: "change_memory",
  prior_time_start: null,
  prior_time_end: null,
  prior_snapshot_generated_at_utc: "2026-08-18T23:35:39Z",
};

const marketPacket: BtcCosmographerContextPacket = {
  schema: "btc_cosmographer_context_v0_1",
  prior_domain: "btc_market",
  prior_subject: "general_btc_field",
  prior_intents: ["watch"],
  prior_answer_state: "SPLIT",
  prior_market_question_class: "general_btc_field",
  prior_time_start: "2026-08-18",
  prior_time_end: "2026-08-18",
  prior_snapshot_generated_at_utc: "2026-08-18T23:35:39Z",
};

for (const [locale, question] of [
  ["ru", "Что именно создаёт расхождение?"],
  ["en", "What exactly creates the divergence?"],
] as const) {
  const route = routeBtcCosmographerQuestion(locale, question, snapshotPacket);
  assert.equal(route.context_relation, "FOLLOW_UP", `${locale} divergence must be a follow-up`);
  assert.equal(route.domain, "snapshot_memory", `${locale} divergence must retain Snapshot Memory`);
  assert.equal(route.subject, "change_memory", `${locale} divergence must retain the active subject`);
  assert.ok(route.intents.includes("reason"), `${locale} divergence must carry reason intent`);
  const answer = specializeMarketAnswer(locale, route, marketAnswer(locale));
  assert.match(answer.direct_answer, locale === "ru" ? /^Расхождение создают/ : /^The divergence comes from/);
  assert.equal(answer.source_boundary, marketAnswer(locale).source_boundary, "boundary must remain unchanged");
}

for (const [locale, question] of [
  ["ru", "Что должно произойти, чтобы чтение изменилось?"],
  ["en", "What has to happen for the read to change?"],
] as const) {
  const route = routeBtcCosmographerQuestion(locale, question, snapshotPacket);
  assert.equal(route.context_relation, "FOLLOW_UP", `${locale} invalidation must be a follow-up`);
  assert.equal(route.domain, "snapshot_memory", `${locale} invalidation must retain Snapshot Memory`);
  assert.equal(route.subject, "change_memory", `${locale} invalidation must retain the active subject`);
  assert.ok(route.intents.includes("change"), `${locale} invalidation must carry change intent`);
  assert.ok(route.intents.includes("watch"), `${locale} invalidation must carry watch intent`);
  const answer = specializeMarketAnswer(locale, route, marketAnswer(locale));
  assert.match(answer.direct_answer, locale === "ru" ? /^Условия изменения чтения:/ : /^Conditions that would change the read:/);
}

const proofCases = [
  ["ru", "Откуда ты это знаешь?", /Источник активного ответа/, /Контекст вкладки/],
  ["en", "How do you know that?", /Source of the active answer/, /Tab context/],
  ["ru", "Какие данные ты использовал?", /Данные активного ответа/, /Market Snapshot/],
  ["en", "What data did you use?", /Data used by the active answer/, /Market Snapshot/],
  ["ru", "Насколько свежие данные?", /Свежесть данных активного ответа/, /2026-08-18T23:35:39Z/],
  ["en", "How fresh are the data?", /Freshness of the active answer/, /2026-08-18T23:35:39Z/],
] as const;

for (const [locale, question, headlinePattern, directPattern] of proofCases) {
  const route = routeBtcCosmographerQuestion(locale, question, marketPacket);
  assert.equal(route.context_relation, "FOLLOW_UP", `${locale} proof question must be a follow-up`);
  assert.equal(route.domain, "methodology", `${locale} proof question must transition to Method & Proof`);
  assert.equal(route.subject, "source_and_method", `${locale} proof question must use methodology subject`);
  assert.ok(route.explicit_entities.includes("active_answer_reference"), `${locale} proof route must reference active answer`);
  assert.equal(route.time_range?.start, "2026-08-18", `${locale} proof route must preserve relevant period`);
  assert.equal(route.time_range?.source, "CONTEXT", `${locale} proof period must be context-bound`);
  const answer = buildSpecializedMethodologyAnswer(locale, route, marketPacket);
  assert.match(answer.headline, headlinePattern);
  assert.match(answer.direct_answer, directPattern);
  assert.match(answer.direct_answer, /Market Snapshot/);
  assert.equal(answer.answer_mode, "METHODOLOGY");
  assert.match(answer.source_boundary, /evidence|доказ|Методолог/i);
}

const live = fs.readFileSync("pages/crypto-astro/btc/live.tsx", "utf8");
assert.match(live, /active_answer_reference/, "live route must preserve active-answer proof binding");
assert.match(live, /priorContext\.prior_market_question_class/, "active market evidence must be re-bound from prior context");
assert.match(live, /buildEvidenceNavigation\(route, envelope, servedDeploymentSha, sourceTimestamp, activePacket\)/, "evidence navigation must receive active context");

console.log("BTC_ACTIVE_CONTEXT_ANAPHORIC_FOLLOWUP_ROUTING_ACCEPTANCE=PASS");
