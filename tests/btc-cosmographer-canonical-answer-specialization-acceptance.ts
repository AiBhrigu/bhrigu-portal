import assert from "node:assert/strict";
import { buildBtcProtocolAnswer } from "../lib/btc-protocol-evidence";
import { buildBtcCosmographerAnswer } from "../lib/btc-cosmographer-answer";
import { buildBtcAstroAnswer } from "../lib/btc-public-astro-evidence";
import { buildPublicMultiBodyAnswer, isPublicMultiBodyRoute } from "../lib/btc-cosmographer-public-multi-body-projection";
import { routeBtcCosmographerLocalRc } from "../lib/btc-cosmographer-multi-body-astro-rc";
import {
  boundedClarification,
  buildSpecializedMethodologyAnswer,
  buildSpecializedNavigationAnswer,
  specializeMarketAnswer,
} from "../lib/btc-cosmographer-specialized-answer";
import type { BtcCosmographerRoute } from "../lib/btc-cosmographer-route-graph";
import type { BtcCosmographerAnswerProjection } from "../lib/btc-protocol-evidence";

const route = (question: string, domain: any, subject: string, intents: any[] = ["explain"]): BtcCosmographerRoute => ({
  schema: "btc_cosmographer_semantic_route_graph_v0_1", locale: "ru", raw_question: question,
  normalized_question: question.toLowerCase(), domain, subject, intents,
  context_relation: "NEW_TOPIC", time_range: null, market_question_class: null,
  capability_id: `${domain}.${subject}`, confidence: "HIGH", explicit_entities: [subject],
});
const supply = buildBtcProtocolAnswer("ru", route("Как устроен предел эмиссии Bitcoin?", "bitcoin_protocol", "supply", ["explain"]));
assert.equal(supply.answer_mode, "PROTOCOL_FACT");
assert.match(supply.direct_answer, /21 млн|20 999 999/);
const reward = buildBtcProtocolAnswer("ru", route("Чем block subsidy отличается от общей награды майнера?", "bitcoin_protocol", "subsidy", ["explain"]));
assert.match(reward.direct_answer, /subsidy.*новые BTC.*наград.*subsidy.*комисси/i);
const futureHeight = buildBtcProtocolAnswer("ru", route("Какой будет точный block height 1 января 2030?", "bitcoin_protocol", "blocks", ["explain"]));
assert.match(futureHeight.direct_answer, /заранее неизвестна|предположен/i);
const chainState = buildBtcProtocolAnswer("en", route("What is the latest accepted block state available to this system?", "bitcoin_protocol", "blocks", ["fact"]));
assert.equal(chainState.answer_mode, "PROTOCOL_FACT");
assert.match(chainState.direct_answer, /cannot be stated without.*dynamic chain-state snapshot/i);
const genesisChart = buildBtcProtocolAnswer("ru", route("Покажи карту генезиса Bitcoin.", "bitcoin_protocol", "genesis", ["explain"]));
assert.equal(genesisChart.answer_mode, "CLARIFICATION");
const genesisHistoryRoute = route("Что известно о genesis block Bitcoin?", "bitcoin_protocol", "genesis_history", ["explain"]);
const cleanGenesisHistory = buildBtcCosmographerAnswer("ru", genesisHistoryRoute, { snapshot: null, envelope: null });
assert.equal(cleanGenesisHistory.answer_mode, "PROTOCOL_FACT");
const contextualGenesisHistory = buildBtcCosmographerAnswer("ru", genesisHistoryRoute, {
  snapshot: null, envelope: null,
  priorContext: {
    schema: "btc_cosmographer_context_v0_1", prior_domain: "btc_market", prior_subject: "general_btc_field",
    prior_intents: ["watch"], prior_answer_state: "SPLIT", prior_market_question_class: "general_btc_field",
    prior_time_start: null, prior_time_end: null, prior_snapshot_generated_at_utc: null,
  },
});
assert.equal(contextualGenesisHistory.answer_mode, "PROTOCOL_EXPLAIN");

const typo = buildBtcAstroAnswer("ru", { ...route("Что показывает Юпитир в 2026?", "astromodule", "jupiter", ["interval_analysis"]), time_range: { start: "2026-01-01", end: "2026-12-31", label: "2026", source: "QUESTION" } });
assert.equal(typo.answer_mode, "CLARIFICATION");
const outOfRange = buildBtcAstroAnswer("ru", { ...route("Покажи окна на 2035 год.", "astromodule", "jupiter", ["interval_analysis"]), time_range: { start: "2035-01-01", end: "2035-12-31", label: "2035", source: "QUESTION" } });
assert.equal(outOfRange.answer_mode, "CLARIFICATION");
const historicalOutOfRange = buildBtcAstroAnswer("ru", { ...route("Что показывает Меркурий с 2025-03-10 по 2025-03-20?", "astromodule", "mercury", ["interval_analysis"]), time_range: { start: "2025-03-10", end: "2025-03-20", label: "2025-03-10 — 2025-03-20", source: "QUESTION" } });
assert.equal(historicalOutOfRange.answer_state, "LIMITED");
assert.equal(historicalOutOfRange.answer_mode, "ASTRO_INTERVAL");
const multi = buildBtcAstroAnswer("ru", { ...route("Сравни Юпитер и Сатурн в 2026 без привязки к BTC.", "astromodule", "multiple_planetary_objects", ["interval_analysis", "compare"]), time_range: { start: "2026-01-01", end: "2026-12-31", label: "2026", source: "QUESTION" } });
assert.equal(multi.answer_mode, "ASTRO_INTERVAL");
assert.match(multi.headline, /Юпитер.*Сатурн/);
assert.match(multi.direct_answer, /Юпитер:[\s\S]*Сатурн:/);

for (const question of ["Какие дни наиболее напряжённые?", "Какие три даты наиболее напряжённые в активном периоде?", "Сначала назови даты, потом дай годовой контекст."]) {
  const routed = routeBtcCosmographerLocalRc("ru", question, {
    schema: "btc_cosmographer_context_v0_1", prior_domain: "astromodule", prior_subject: "planetary_aspects",
    prior_intents: ["interval_analysis"], prior_answer_state: "CONFIRMED", prior_market_question_class: null,
    prior_time_start: "2026-01-01", prior_time_end: "2026-12-31", prior_snapshot_generated_at_utc: null,
  });
  assert.ok(isPublicMultiBodyRoute(routed));
  const answer = buildPublicMultiBodyAnswer("ru", routed as any, null);
  assert.ok(answer.sections.some((s) => ["main_windows", "top_dates_or_windows"].includes(s.id)), question);
  assert.match(answer.direct_answer, /Ранг|хронолог|дат|20–21 июля/i, question);
}
const methodCases: Array<[string, RegExp]> = [
  ["Какая эфемерида и система координат использованы?", /pyswisseph.*MOSEPH_PINNED.*геоцентр/i],
  ["Как рассчитывается annual priority и local concentration?", /Annual priority.*local concentration.*market concurrence/i],
  ["Это память браузера или логика системы?", /не скрытая личная память|сериализованное состояние/i],
  ["Где здесь данные, а где интерпретация?", /Данные.*derivation.*интерпретация/i],
  ["К каким активам, периодам и режимам применим этот метод?", /BTC-коридор.*не универсальный/i],
];
for (const [question, expected] of methodCases) {
  const answer = buildSpecializedMethodologyAnswer("ru", route(question, "methodology", "source_and_method", ["fact"]));
  assert.equal(answer.answer_mode, "METHODOLOGY");
  assert.match(answer.direct_answer, expected, question);
}
const certainty = buildSpecializedMethodologyAnswer("ru", route("Дай прогноз со 100% уверенностью.", "methodology", "source_and_method", ["fact"]));
assert.equal(certainty.answer_mode, "CLARIFICATION");

for (const [question, expected] of [
  ["Как сменить предмет, не создавая новую беседу?", /новый предмет.*не нужна/i],
  ["Как очистить контекст и начать новую беседу?", /новую беседу.*не равен очистке/i],
  ["Чем Astro Field отличается от Astro × BTC?", /Astro Field.*Astro × BTC.*независим/i],
  ["Это новый предмет или новая беседа?", /Новая тема.*новая беседа/i],
] as const) {
  const answer = buildSpecializedNavigationAnswer("ru", route(question, "navigation", "capabilities", ["navigate"]));
  assert.match(answer.direct_answer, expected, question);
}
const marketBase: BtcCosmographerAnswerProjection = {
  answer_state: "SPLIT", answer_mode: "MARKET_DIAGNOSIS", headline: "mixed", direct_answer: "generic",
  sections: [
    { id: "market_evidence", label: "e", bullets: ["metric_a: 1 → 2 (+1).", "metric_b: 4 → 3 (-1)."] },
    { id: "market_watch", label: "w", paragraph: "Watch the next accepted Snapshot Delta." },
  ], source_boundary: "snapshot", proof_label: "proof",
};
const change = specializeMarketAnswer("en", route("What changed between the current and previous accepted BTC snapshots?", "snapshot_memory", "change_memory", ["change"]), marketBase);
assert.match(change.direct_answer, /^Changes first:/);
const conditions = specializeMarketAnswer("en", route("What conditions would weaken the current BTC field read?", "btc_market", "general_btc_field", ["watch"]), marketBase);
assert.match(conditions.direct_answer, /^Conditions that would change the read:/);
for (const question of ["Когда покупать?", "Продай мне сигнал.", "Какую долю капитала мне вложить в BTC сегодня?"]) {
  const answer = specializeMarketAnswer("ru", route(question, "btc_market", "general_btc_field", ["watch"]), marketBase);
  assert.equal(answer.answer_mode, "CLARIFICATION", question);
  assert.match(answer.direct_answer, /не превращаю.*сигнал|размер позиции/i, question);
}
assert.equal(boundedClarification("en", "h", "d", "b").answer_mode, "CLARIFICATION");
console.log("BTC_COSMOGRAPHER_CANONICAL_ANSWER_SPECIALIZATION=PASS");
