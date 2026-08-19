import type { BtcMarketEnvelope } from "./btc-market-envelope";
import type { BtcPublicSnapshot } from "./btc-public-output-contract";
import {
  formatBtcTransitionLead,
  type BtcPublicLocale,
} from "./btc-public-language-contract";
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
import type { BtcCosmographerContextPacket, BtcCosmographerRoute } from "./btc-cosmographer-route-graph";
import {
  buildSpecializedMethodologyAnswer,
  buildSpecializedNavigationAnswer,
  specializeBridgeAnswer,
  specializeMarketAnswer,
} from "./btc-cosmographer-specialized-answer";

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
      ...(route.intents.includes("reason")
        ? [{
            id: "market_why_it_matters",
            label: locale === "ru" ? "Почему это важно" : "Why it matters",
            paragraph: formatBtcTransitionLead(locale, envelope.synthesis.state),
          }]
        : []),
      {
        id: "market_limit",
        label: locale === "ru" ? "Согласие и расхождение" : "Agreement and divergence",
        paragraph: publicMarketText(locale, raw.contradiction_or_limit),
      },
      {
        id: "market_watch",
        label: locale === "ru" ? "Что изменит чтение" : "What would change the read",
        paragraph: raw.what_would_change_the_read,
      },
    ],
    source_boundary: locale === "ru"
      ? "Рыночные значения заново построены из принятого Snapshot и Delta. Прошлый разговор направляет навигацию, но не подменяет текущие данные. Это не финансовый совет и не торговый сигнал. Прогнозные окна допустимы только при наличии валидированного метода, условий и доказательной границы."
      : "Market values are rebuilt from the accepted Snapshot and Delta. Prior dialogue guides navigation but does not replace current data. This is not financial advice or a trading signal. Forecast windows are allowed only when a validated method, conditions, and an evidence boundary are present.",
    proof_label: locale === "ru" ? "Рыночные доказательства доступны" : "Market evidence available",
  };
}

function methodologyAnswer(locale: BtcPublicLocale): BtcCosmographerAnswerProjection {
  return {
    answer_state: "CONFIRMED",
    answer_mode: "METHODOLOGY",
    headline: locale === "ru"
      ? "Космограф разделяет факт, метод, интерпретацию и прогнозное условие"
      : "Cosmographer separates fact, method, interpretation, and forecast condition",
    direct_answer: locale === "ru"
      ? "Каждый ответ сначала выбирает домен и доказательный источник, затем строит объяснение. Языковая форма не может добавлять числа или события, которых нет в evidence packet."
      : "Each answer first selects a domain and evidence source, then builds an explanation. The language layer may not add numbers or events absent from the evidence packet.",
    sections: [
      {
        id: "sources",
        label: locale === "ru" ? "Контуры источников" : "Evidence lanes",
        bullets: locale === "ru"
          ? [
              "Протокол Bitcoin: правила консенсуса, эмиссия, халвинг, блоки и комиссии.",
              "Рынок BTC: принятый Snapshot, Delta и память изменений.",
              "Астрономические данные: публичные эфемеридные якоря и события.",
              "Астрономия × BTC: сопоставление независимых слоёв.",
            ]
          : [
              "Bitcoin Protocol: consensus, issuance, halving, blocks, and fees.",
              "BTC Market: accepted Snapshot, Delta, and change memory.",
              "Astronomical data: public ephemeris anchors and events.",
              "Astronomy × BTC: comparison of independent layers.",
            ],
      },
      {
        id: "limits",
        label: locale === "ru" ? "Что система не должна делать" : "What the system must not do",
        paragraph: locale === "ru"
          ? "Она не должна превращать отсутствие данных в догадку, совпадение — в причинность, а исследовательское чтение — в торговый сигнал."
          : "It must not turn missing data into a guess, coincidence into causality, or a research read into a trading signal.",
      },
      {
        id: "forecast_boundary",
        label: locale === "ru" ? "Граница прогнозного слоя" : "Forecast-layer boundary",
        paragraph: locale === "ru"
          ? "Прогнозное окно публикуется только вместе с методом, горизонтом, условиями усиления или ослабления, признаками отмены и последующей проверкой."
          : "A forecast window is published only with its method, horizon, strengthening or weakening conditions, invalidation signals, and later verification.",
      },
    ],
    source_boundary: locale === "ru"
      ? "Методологическая граница является частью публичного ответа."
      : "The methodology boundary is part of the public answer.",
    proof_label: locale === "ru" ? "Доказательства метода доступны" : "Method evidence available",
  };
}

function unsupportedMarketRequestAnswer(locale: BtcPublicLocale): BtcCosmographerAnswerProjection {
  return {
    answer_state: "LIMITED",
    answer_mode: "NAVIGATION",
    headline: locale === "ru"
      ? "Гарантированная ценовая цель недоступна"
      : "A guaranteed price target is not available",
    direct_answer: locale === "ru"
      ? "Космограф не выдаёт гарантированную цену BTC, торговый сигнал или инструкцию на завтра. Он может показать принятое состояние рынка, доказательства и условия, которые изменят чтение."
      : "Cosmographer does not provide a guaranteed BTC price, trading signal, or instruction for tomorrow. It can show the accepted market state, evidence, and conditions that would change the read.",
    sections: [{
      id: "supported_alternative",
      label: locale === "ru" ? "Доступная альтернатива" : "Supported alternative",
      bullets: locale === "ru"
        ? ["Текущее состояние BTC", "Изменения с прошлого Snapshot", "Условия усиления или ослабления чтения"]
        : ["Current BTC state", "Changes since the previous Snapshot", "Conditions that strengthen or weaken the read"],
    }],
    source_boundary: locale === "ru"
      ? "Гарантия будущей цены не может быть доказана принятым evidence packet."
      : "A future-price guarantee cannot be supported by the accepted evidence packet.",
    proof_label: locale === "ru" ? "Граница поддержки подтверждена" : "Support boundary confirmed",
  };
}

function navigationAnswer(
  locale: BtcPublicLocale,
  unknownQuestion?: string,
): BtcCosmographerAnswerProjection {
  const visualRequest = Boolean(unknownQuestion && /visual|picture|image|картин|визуал|схем/i.test(unknownQuestion));
  return {
    answer_state: unknownQuestion ? "CLARIFICATION" : "LIMITED",
    answer_mode: unknownQuestion ? "CLARIFICATION" : "NAVIGATION",
    headline: visualRequest
      ? (locale === "ru" ? "Уточните, что нужно визуализировать" : "Specify what should be visualized")
      : unknownQuestion
        ? (locale === "ru"
            ? "Предмет вопроса нужно уточнить"
            : "The subject of the question needs clarification")
        : (locale === "ru"
            ? "Основные маршруты поля BTC"
            : "Main BTC field routes"),
    direct_answer: visualRequest
      ? (locale === "ru"
          ? "Назовите объект: текущее поле BTC, временную линию планеты, карту аспектов или сопоставление Астрономия × BTC. Космограф не выбирает визуальный предмет случайно."
          : "Name the object: current BTC field, a planetary timeline, an aspect map, or an Astronomy × BTC comparison. Cosmographer does not choose a visual subject at random.")
      : unknownQuestion
        ? (locale === "ru"
            ? "Космограф не будет подменять неизвестный предмет предыдущей планетой или случайным рыночным шаблоном."
            : "Cosmographer will not replace an unknown subject with the previous planet or a random market template.")
        : (locale === "ru"
            ? "Можно свободно переходить между протоколом Bitcoin, рынком, памятью Snapshot, астрономическими данными и сопоставлением Астрономия × BTC."
            : "You can move between Bitcoin protocol, market, Snapshot memory, astronomical data, and the Astronomy × BTC comparison."),
    sections: [
      {
        id: "routes",
        label: locale === "ru" ? "Что можно спросить" : "What you can ask",
        bullets: locale === "ru"
          ? [
              "Протокол: «Сколько всего BTC?», «Что нужно знать о халвинге?»",
              "Рынок: «Что происходит с BTC сегодня?»",
              "Память: «Что изменилось с прошлого Snapshot?»",
              "Астрономические данные: «Какие самые напряжённые окна аспектов в 2026 году?»",
              "Сопоставление: «Как конфигурация Юпитера совпадает со структурой BTC?»",
              "Метод: «Какие источники использованы и где граница вывода?»",
            ]
          : [
              "Protocol: “How many BTC can exist?” “What should I know about halving?”",
              "Market: “What is happening with BTC today?”",
              "Memory: “What changed since the previous Snapshot?”",
              "Astronomical data: “Which aspect windows are most intense in 2026?”",
              "Comparison: “How does Jupiter's configuration coincide with BTC structure?”",
              "Method: “Which sources are used and where is the inference boundary?”",
            ],
      },
    ],
    source_boundary: locale === "ru"
      ? "Уточнение используется только когда предмет действительно нельзя определить."
      : "Clarification is used only when the subject genuinely cannot be resolved.",
    proof_label: locale === "ru" ? "Реестр возможностей" : "Capability registry",
  };
}

function genesisChartClarification(locale: BtcPublicLocale): BtcCosmographerAnswerProjection {
  return {
    answer_state: "CLARIFICATION",
    answer_mode: "CLARIFICATION",
    headline: locale === "ru"
      ? "Нужна точная модель карты генезиса Bitcoin"
      : "A precise Bitcoin genesis-chart model is required",
    direct_answer: locale === "ru"
      ? "Текущий публичный evidence index не содержит принятого времени и координат для натальной карты Bitcoin. Поэтому Космограф не подменяет этот запрос движением Юпитера."
      : "The current public evidence index does not contain an accepted time and location for a Bitcoin natal chart. Cosmographer therefore does not replace this request with Jupiter's movement.",
    sections: [
      {
        id: "genesis_options",
        label: locale === "ru" ? "Что нужно определить" : "What must be defined",
        bullets: locale === "ru"
          ? [
              "событие-основание: публикация white paper или genesis block",
              "точное время UTC",
              "географическая модель или правило геоцентрической карты",
            ]
          : [
              "founding event: white-paper publication or genesis block",
              "exact UTC time",
              "geographic model or geocentric-chart rule",
            ],
      },
    ],
    source_boundary: locale === "ru"
      ? "До принятия этих параметров карта генезиса не публикуется как факт."
      : "Until these parameters are accepted, the genesis chart is not published as fact.",
    proof_label: locale === "ru" ? "Доказательства карты пока не приняты" : "Chart evidence not yet accepted",
  };
}


const PROTOCOL_BRIDGE_SUBJECTS = new Set([
  "overview", "supply", "halving", "subsidy", "fees", "difficulty",
  "mining", "utxo", "genesis", "consensus", "blocks",
  "satoshi_history", "bitcoin_origin", "genesis_history",
]);

function buildProtocolAstroBridgeAnswer(
  locale: BtcPublicLocale,
  route: BtcCosmographerRoute,
  astro: BtcCosmographerAnswerProjection,
): BtcCosmographerAnswerProjection {
  const protocolSubject = route.explicit_entities.find((value) => PROTOCOL_BRIDGE_SUBJECTS.has(value)) ?? "overview";
  const protocolRoute: BtcCosmographerRoute = {
    ...route,
    domain: "bitcoin_protocol",
    subject: protocolSubject,
    market_question_class: null,
    capability_id: `bitcoin_protocol.${protocolSubject}`,
    explicit_entities: [protocolSubject],
  };
  const protocol = buildBtcProtocolAnswer(locale, protocolRoute);
  const protocolLines = protocol.sections
    .flatMap((section) => section.bullets ?? (section.paragraph ? [section.paragraph] : []))
    .slice(0, 4);
  const astroLines = astro.sections
    .flatMap((section) => section.bullets ?? (section.paragraph ? [section.paragraph] : []))
    .slice(0, 4);
  return {
    answer_state: "LIMITED",
    answer_mode: "ASTRO_BTC_BRIDGE",
    headline: locale === "ru"
      ? "Протокол Bitcoin и астрономическое окно разделены как независимые слои"
      : "Bitcoin Protocol and the astronomical window remain independent evidence lanes",
    direct_answer: locale === "ru"
      ? `Сначала протокол Bitcoin: ${protocol.direct_answer} Затем астрономическое окно: ${astro.direct_answer}`
      : `Bitcoin Protocol first: ${protocol.direct_answer} Then the astronomical window: ${astro.direct_answer}`,
    sections: [
      {
        id: "btc_side_state",
        label: locale === "ru" ? "1 · Сторона Bitcoin Protocol" : "1 · Bitcoin Protocol side",
        bullets: protocolLines,
      },
      {
        id: "astro_window",
        label: locale === "ru" ? "2 · Астрономическое окно" : "2 · Astronomical window",
        bullets: astroLines,
      },
      {
        id: "relation",
        label: locale === "ru" ? "3 · Граница сопоставления" : "3 · Comparison boundary",
        paragraph: locale === "ru"
          ? "Протокольный факт и астрономическая конфигурация могут быть показаны рядом, но текущий evidence packet не устанавливает между ними причинную или рыночную связь."
          : "A protocol fact and an astronomical configuration may be shown together, but the current evidence packet establishes no causal or market relation between them.",
      },
      {
        id: "dual_proof",
        label: locale === "ru" ? "4 · Двойное доказательство" : "4 · Dual proof",
        bullets: [protocol.proof_label, astro.proof_label],
      },
      {
        id: "non_causal_boundary",
        label: locale === "ru" ? "5 · Непричинная граница" : "5 · Non-causal boundary",
        paragraph: locale === "ru"
          ? "Астрономическая конфигурация не представлена как причина правил, эмиссии или работы протокола Bitcoin."
          : "The astronomical configuration is not presented as a cause of Bitcoin's rules, issuance, or protocol operation.",
      },
    ],
    source_boundary: `${protocol.source_boundary} ${astro.source_boundary}`,
    proof_label: locale === "ru"
      ? "Протокольные и астрономические доказательства проверены отдельно"
      : "Protocol and astronomical evidence were checked independently",
  };
}

export function buildBtcCosmographerAnswer(
  locale: BtcPublicLocale,
  route: BtcCosmographerRoute,
  inputs: {
    snapshot: BtcPublicSnapshot | null;
    envelope: BtcMarketEnvelope | null;
    priorContext?: BtcCosmographerContextPacket | null;
  },
): BtcCosmographerAnswerProjection {
  switch (route.domain) {
    case "bitcoin_protocol": {
      const protocol = buildBtcProtocolAnswer(locale, route);
      const preserveGenesisHistoryExplain =
        inputs.priorContext?.prior_domain === "btc_market" &&
        inputs.priorContext.prior_subject === "general_btc_field" &&
        route.context_relation === "NEW_TOPIC" &&
        route.subject === "genesis_history" &&
        /что\s+известно.*genesis|what\s+is\s+known.*genesis/i.test(route.normalized_question);
      return preserveGenesisHistoryExplain ? { ...protocol, answer_mode: "PROTOCOL_EXPLAIN" } : protocol;
    }
    case "astromodule":
      return buildBtcAstroAnswer(locale, route);
    case "astro_btc_bridge": {
      const astro = buildBtcAstroAnswer(locale, route);
      if (route.explicit_entities.includes("btc_side:protocol")) {
        return buildProtocolAstroBridgeAnswer(locale, route, astro);
      }
      if (inputs.snapshot && inputs.envelope) {
        const market = marketAnswer(locale, route, inputs.snapshot, inputs.envelope);
        const marketLines = market.sections
          .flatMap((section) => section.bullets ?? (section.paragraph ? [section.paragraph] : []))
          .slice(0, 4);
        const astroLines = astro.sections
          .flatMap((section) => section.bullets ?? (section.paragraph ? [section.paragraph] : []))
          .slice(0, 4);
        const bridgeState = market.answer_state === "SPLIT"
          ? "SPLIT"
          : route.intents.includes("confirmation") && market.answer_state === "CONFIRMED"
            ? "CONFIRMED"
            : "LIMITED";
        const relationText = locale === "ru"
          ? "Сопоставление проверяет временную и структурную связь двух независимых доказательных слоёв."
          : "The comparison tests a temporal and structural relation between two independent evidence lanes.";
        const confirmationText = bridgeState === "SPLIT"
          ? (locale === "ru" ? "Рыночный слой расходится с заявленной связью или не подтверждает её." : "The market layer diverges from or does not confirm the proposed relation.")
          : bridgeState === "CONFIRMED"
            ? (locale === "ru" ? "Заранее объявленный рыночный критерий подтверждения выполнен." : "The predeclared market confirmation criterion is met.")
            : (locale === "ru" ? "Зафиксировано только временное совпадение; направленное подтверждение не установлено." : "Only temporal concurrence is established; directional confirmation is not established.");
        const bridgeAnswer: BtcCosmographerAnswerProjection = {
          answer_state: bridgeState,
          answer_mode: "ASTRO_BTC_BRIDGE",
          headline: locale === "ru"
            ? "Состояние BTC и астрономическое окно сопоставлены без причинного утверждения"
            : "BTC-side state and the astronomical window are compared without a causal claim",
          direct_answer: locale === "ru"
            ? `Сначала состояние BTC: ${market.direct_answer} Затем астрономическое окно: ${astro.direct_answer}`
            : `BTC-side state first: ${market.direct_answer} Then the astronomical window: ${astro.direct_answer}`,
          sections: [
            {
              id: "btc_side_state",
              label: locale === "ru" ? "1 · Состояние стороны BTC" : "1 · BTC-side state",
              bullets: marketLines,
            },
            {
              id: "astro_window",
              label: locale === "ru" ? "2 · Астрономическое окно" : "2 · Astronomical window",
              bullets: astroLines,
            },
            {
              id: "relation",
              label: locale === "ru" ? "3 · Проверяемая связь" : "3 · Relation under test",
              paragraph: relationText,
            },
            {
              id: "confirmation_or_divergence",
              label: locale === "ru" ? "4 · Подтверждение или расхождение" : "4 · Confirmation or divergence",
              paragraph: confirmationText,
            },
            {
              id: "conditions",
              label: locale === "ru" ? "5 · Условия усиления и ослабления" : "5 · Strengthening and weakening conditions",
              paragraph: market.sections.find((section) => section.id === "market_watch")?.paragraph ??
                (locale === "ru" ? "Условия должны быть наблюдаемыми и привязанными к рыночным данным." : "Conditions must be observable and bound to market evidence."),
            },
            {
              id: "dual_proof",
              label: locale === "ru" ? "6 · Двойное доказательство" : "6 · Dual proof",
              bullets: [astro.proof_label, market.proof_label],
            },
            {
              id: "non_causal_boundary",
              label: locale === "ru" ? "7 · Непричинная граница" : "7 · Non-causal boundary",
              paragraph: locale === "ru"
                ? "Совпадение или подтверждение не доказывает, что астрономическая конфигурация вызвала движение BTC."
                : "Concurrence or confirmation does not prove that an astronomical configuration caused BTC movement.",
            },
            {
              id: "non_trading_boundary",
              label: locale === "ru" ? "8 · Нет торговой инструкции" : "8 · No trading instruction",
              paragraph: locale === "ru"
                ? "Сопоставление не является рекомендацией купить, продать, использовать плечо или выбрать размер позиции."
                : "The comparison is not advice to buy, sell, use leverage, or choose a position size.",
            },
          ],
          source_boundary: `${market.source_boundary} ${astro.source_boundary}`,
          proof_label: locale === "ru"
            ? "Рыночные и астрономические доказательства проверены отдельно"
            : "Market and astronomical evidence were checked independently",
        };
        return specializeBridgeAnswer(locale, route, bridgeAnswer);
      }
      return specializeBridgeAnswer(locale, route, buildAstroBtcBridgeBoundary(locale, astro));
    }
    case "btc_market":
    case "snapshot_memory":
      if (inputs.snapshot && inputs.envelope) {
        return specializeMarketAnswer(locale, route, marketAnswer(locale, route, inputs.snapshot, inputs.envelope));
      }
      return {
        answer_state: "LIMITED",
        answer_mode: "MARKET_DIAGNOSIS",
        headline: locale === "ru"
          ? "Рыночные доказательства временно недоступны"
          : "Market evidence is temporarily unavailable",
        direct_answer: locale === "ru"
          ? "Предмет вопроса сохранён, но рыночный вывод не строится без принятого Snapshot."
          : "The subject was preserved, but no market conclusion is built without an accepted Snapshot.",
        sections: [],
        source_boundary: locale === "ru"
          ? "Требуется принятый Market Snapshot."
          : "An accepted Market Snapshot is required.",
        proof_label: locale === "ru" ? "Рыночные доказательства недоступны" : "Market evidence unavailable",
      };
    case "methodology":
      return buildSpecializedMethodologyAnswer(locale, route, inputs.priorContext);
    case "navigation":
      if (route.subject === "unsupported_asset") return navigationAnswer(locale, route.raw_question);
      return buildSpecializedNavigationAnswer(locale, route);
    case "unsupported":
      if (route.subject === "bitcoin_genesis_chart") return genesisChartClarification(locale);
      if (route.subject === "unsupported_market_request") return unsupportedMarketRequestAnswer(locale);
      return navigationAnswer(locale, route.raw_question);
    default:
      return navigationAnswer(locale, route.raw_question);
  }
}
