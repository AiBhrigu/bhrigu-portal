import type { BtcMarketEnvelope } from "./btc-market-envelope";
import type { BtcPublicSnapshot } from "./btc-public-output-contract";
import type { BtcPublicLocale } from "./btc-public-language-contract";
import {
  buildBtcQuestionSpecificAnswer,
  type BtcQuestionSpecificAnswerState,
} from "./btc-executive-question-language";
import {
  buildAstroBtcBridgeBoundary,
  buildBtcAstroAnswer,
} from "./btc-public-astro-evidence";
import {
  buildBtcProtocolAnswer,
  type BtcCosmographerAnswerProjection,
} from "./btc-protocol-evidence";
import type { BtcCosmographerRoute } from "./btc-cosmographer-route-graph";

const MODULE_LABELS: Record<BtcPublicLocale, Record<string, string>> = {
  en: {
    market_structure: "Market Structure",
    liquidity_membrane: "Liquidity Membrane",
    change_event_memory: "Change / Event Memory",
    temporal_context: "Temporal Context",
    cosmographer_review: "Cosmographer Review",
  },
  ru: {
    market_structure: "Структура рынка",
    liquidity_membrane: "Мембрана ликвидности",
    change_event_memory: "Память изменений",
    temporal_context: "Временной контекст",
    cosmographer_review: "Обзор Космографа",
  },
};

function publicMarketText(locale: BtcPublicLocale, value: string): string {
  let output = value;
  for (const [id, label] of Object.entries(MODULE_LABELS[locale])) {
    output = output.replaceAll(id, label);
  }
  return output
    .replaceAll(":BOUNDED", locale === "ru" ? " — ограничено" : " — bounded")
    .replaceAll(":UP", locale === "ru" ? " — усиливается" : " — strengthening")
    .replaceAll(":DOWN", locale === "ru" ? " — ослабевает" : " — weakening")
    .replaceAll(":UNCHANGED", locale === "ru" ? " — без изменения" : " — unchanged")
    .replaceAll(":UNAVAILABLE", locale === " — недоступно" : " — unavailable");
}

function marketAnswer(
  locale: BtcPublicLocale,
  route: BtcCosmographerRoute,
  snapshot: BtcPublicSnapshot,
  envelope: BtcMarketEnvelope,
): BtcCosmographerAnswerProjection {
  const raw = buildBtcQuestionSpecificAnswer(
    locale,
    route.normalized_question,
    envelope,
    snapshot.temporal_context.observation_date,
  );
  const state = raw.answer_state as BtcQuestionSpecificAnswerState;
  const evidenceLabel = route.intents.includes("change")
    ? (locale === "ru" ? "Что изменилось" : "What changed")
    : route.intents.includes("watch")
      ? (locale === "ru" ? "Что сейчас важно" : "What matters now")
      : (locale === "ru" ? "Релевантные показатели" : "Relevant indicators");
  return {
    answer_state: state,
    answer_mode: "MARKET_DIAGNOSIS",
    headline: raw.headline,
    direct_answer: raw.direct_answer,
    sections: [
      {
        id: "market_evidence",
        label: evidenceLabel,
        bullets: raw.evidence_lines.map((line: string) => publicMarketText(locale, line)),
      },
      {
        id: "market_limit",
        label: locale === "ru" ? "Согласие и расхождение" : "Agreement and divergence",
        paragraph: publicMarketText(locale, raw.contradiction_or_limit),
      },
      {
        id: "market_watch",
        label: locale === "ru" ? "Следующее условие" : "Next condition",
        paragraph: raw.what_would_change_the_read,
      },
    ],
    source_boundary: locale === "ru"
      ? "Рыночные числа заново построены из принятого Snapshot и Delta. Прошлый разговор определяет навигацию, но не подменяет текущие данные. Это не прогноз, ценовая цель или торговый сигнал."
      : "Market values are rebuilt from the accepted Snapshot and Delta. Prior dialogue guides navigation but does not replace current data. This is not a forecast, price target or trading signal.",
    proof_label: locale === "ru" ? "Market proof доступен" : "Market proof available",
  };
}
