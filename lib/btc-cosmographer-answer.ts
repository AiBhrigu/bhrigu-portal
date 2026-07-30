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
    .replaceAll(":UNAVAILABLE", locale === "ru" ? " — недоступно" : " — unavailable");
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

function methodologyAnswer(locale: BtcPublicLocale): BtcCosmographerAnswerProjection {
  return {
    answer_state: "CONFIRMED",
    answer_mode: "METHODOLOGY",
    headline: locale === "ru"
      ? "Космограф разделяет факт, метод и интерпретацию"
      : "Cosmographer separates fact, method and interpretation",
    direct_answer: locale === "ru"
      ? "Каждый ответ сначала выбирает домен и доказательный источник, затем строит объяснение. Языковая форма не может добавлять числа или события, которых нет в evidence packet."
      : "Each answer first selects a domain and evidence source, then builds an explanation. The language layer may not add numbers or events absent from the evidence packet.",
    sections: [
      {
        id: "sources",
        label: locale === "ru" ? "Контуры источников" : "Evidence lanes",
        bullets: locale === "ru"
          ? [
              "Bitcoin Protocol: правила консенсуса, эмиссия, халвинг, блоки и комиссии.",
              "BTC Market: принятый Snapshot, Delta и память изменений.",
              "Astromodule: публичные эфемеридные якоря и события.",
              "Astro × BTC: только сопоставление независимых слоёв.",
            ]
          : [
              "Bitcoin Protocol: consensus, issuance, halving, blocks and fees.",
              "BTC Market: accepted Snapshot, Delta and change memory.",
              "Astromodule: public ephemeris anchors and events.",
              "Astro × BTC: comparison of independent layers only.",
            ],
      },
      {
        id: "limits",
        label: locale === "ru" ? "Что система не должна делать" : "What the system must not do",
        paragraph: locale === "ru"
          ? "Она не должна превращать отсутствие данных в догадку, совпадение — в причинность, а исследовательское чтение — в торговый сигнал."
          : "It must not turn missing data into a guess, coincidence into causality, or a research read into a trading signal.",
      },
    ],
    source_boundary: locale === "ru"
      ? "Методологическая граница является частью публичного ответа."
      : "The methodology boundary is part of the public answer.",
    proof_label: locale === "ru" ? "Method proof доступен" : "Method proof available",
  };
}

function navigationAnswer(
  locale: BtcPublicLocale,
  unknownQuestion?: string,
): BtcCosmographerAnswerProjection {
  return {
    answer_state: "LIMITED",
    answer_mode: "NAVIGATION",
    headline: unknownQuestion
      ? (locale === "ru"
          ? "Я не буду подменять неизвестный предмет рыночным шаблоном"
          : "I will not replace an unknown subject with a market template")
      : (locale === "ru"
          ? "Основные маршруты Bitcoin Corridor"
          : "Main Bitcoin Corridor routes"),
    direct_answer: unknownQuestion
      ? (locale === "ru"
          ? "Вопрос не распознан как поддерживаемый домен. Вместо случайного ответа Космограф показывает доступные направления."
          : "The question was not recognized as a supported domain. Instead of a random answer, Cosmographer shows the available directions.")
      : (locale === "ru"
          ? "Можно свободно переходить между протоколом Bitcoin, рынком, памятью Snapshot, Astromodule и мостом Astro × BTC."
          : "You can move freely between Bitcoin protocol, market, Snapshot memory, Astromodule and the Astro × BTC bridge."),
    sections: [
      {
        id: "routes",
        label: locale === "ru" ? "Что можно спросить" : "What you can ask",
        bullets: locale === "ru"
          ? [
              "Протокол: «Сколько всего BTC?», «Что нужно знать о халвинге?»",
              "Рынок: «Что сейчас происходит с ликвидностью и доминированием?»",
              "Память: «Что изменилось с прошлого Snapshot?»",
              "Astromodule: «Как двигался Юпитер в первой половине 2026 года?»",
              "Мост: «Как конфигурация Юпитера совпала со структурой BTC?»",
              "Метод: «Какие источники использованы и где граница вывода?»",
            ]
          : [
              "Protocol: “How many BTC can exist?” “What should I know about halving?”",
              "Market: “What is happening with liquidity and dominance?”",
              "Memory: “What changed since the previous Snapshot?”",
              "Astromodule: “How did Jupiter move in the first half of 2026?”",
              "Bridge: “How did Jupiter's configuration coincide with BTC structure?”",
              "Method: “Which sources are used and where is the inference boundary?”",
            ],
      },
    ],
    source_boundary: locale === "ru"
      ? "Уточнение используется только когда предмет действительно нельзя определить."
      : "Clarification is used only when the subject genuinely cannot be resolved.",
    proof_label: "Capability registry",
  };
}

export function buildBtcCosmographerAnswer(
  locale: BtcPublicLocale,
  route: BtcCosmographerRoute,
  inputs: {
    snapshot: BtcPublicSnapshot | null;
    envelope: BtcMarketEnvelope | null;
  },
): BtcCosmographerAnswerProjection {
  switch (route.domain) {
    case "bitcoin_protocol":
      return buildBtcProtocolAnswer(locale, route);
    case "astromodule":
      return buildBtcAstroAnswer(locale, route);
    case "astro_btc_bridge": {
      const astro = buildBtcAstroAnswer(locale, route);
      if (inputs.snapshot && inputs.envelope) {
        const market = marketAnswer(locale, route, inputs.snapshot, inputs.envelope);
        return {
          answer_state: "SPLIT",
          answer_mode: "ASTRO_BTC_BRIDGE",
          headline: locale === "ru"
            ? "Astromodule и BTC сопоставлены без причинного утверждения"
            : "Astromodule and BTC are compared without a causal claim",
          direct_answer: locale === "ru"
            ? `${astro.direct_answer} Рыночный слой отвечает отдельно: ${market.direct_answer}`
            : `${astro.direct_answer} The market layer answers separately: ${market.direct_answer}`,
          sections: [
            ...astro.sections.slice(0, 2),
            {
              id: "market_layer",
              label: locale === "ru" ? "Независимый рыночный слой" : "Independent market layer",
              bullets: market.sections
                .flatMap((section) => section.bullets ?? (section.paragraph ? [section.paragraph] : []))
                .slice(0, 4),
            },
            {
              id: "bridge_boundary",
              label: locale === "ru" ? "Что можно и нельзя заключать" : "What can and cannot be concluded",
              paragraph: locale === "ru"
                ? "Можно описать совпадение дат, состояний и расхождений. Нельзя называть это доказанным влиянием, прогнозом или торговым сигналом."
                : "Dates, states and divergences may be compared. This may not be called proven influence, a forecast or a trading signal.",
            },
          ],
          source_boundary: `${astro.source_boundary} ${market.source_boundary}`,
          proof_label: locale === "ru" ? "Astro proof + Market proof" : "Astro proof + Market proof",
        };
      }
      return buildAstroBtcBridgeBoundary(locale, astro);
    }
    case "btc_market":
    case "snapshot_memory":
      if (inputs.snapshot && inputs.envelope) {
        return marketAnswer(locale, route, inputs.snapshot, inputs.envelope);
      }
      return {
        answer_state: "LIMITED",
        answer_mode: "MARKET_DIAGNOSIS",
        headline: locale === "ru"
          ? "Рыночный evidence временно недоступен"
          : "Market evidence is temporarily unavailable",
        direct_answer: locale === "ru"
          ? "Я сохранил предмет вопроса, но не буду строить рыночный вывод без принятого Snapshot."
          : "The subject was preserved, but no market conclusion will be built without an accepted Snapshot.",
        sections: [],
        source_boundary: locale === "ru"
          ? "Требуется принятый Market Snapshot."
          : "An accepted Market Snapshot is required.",
        proof_label: locale === "ru" ? "Market proof недоступен" : "Market proof unavailable",
      };
    case "methodology":
      return methodologyAnswer(locale);
    case "navigation":
      return navigationAnswer(locale);
    case "unsupported":
    default:
      return navigationAnswer(locale, route.raw_question);
  }
}
