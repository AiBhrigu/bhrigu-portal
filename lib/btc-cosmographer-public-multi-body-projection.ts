import type { BtcPublicLocale } from "./btc-public-language-contract";
import type { BtcCosmographerAnswerProjection } from "./btc-protocol-evidence";
import type { BtcCosmographerRoute } from "./btc-cosmographer-route-graph";
import { specializeBridgeAnswer } from "./btc-cosmographer-specialized-answer";
import {
  buildMultiBodyAstroYearAnswer,
  combineMultiBodyAstroMarketAnswer,
  type BtcMultiBodyAstroRcAnswer,
  type BtcMultiBodyAstroRcRoute,
} from "./btc-cosmographer-multi-body-astro-rc";

type Section = BtcMultiBodyAstroRcAnswer["sections"][number];

function byId(answer: BtcMultiBodyAstroRcAnswer, id: string): Section | null {
  return answer.sections.find((section) => section.id === id) ?? null;
}

function asksForMostIntenseWindow(question: string): boolean {
  return /volatil|волатиль|напряж[её]нн|most\s+intense|highest\s+tension|strongest\s+(?:dates?|windows?)|сильн[а-яё]*\s+(?:дат|дн|окон)/i.test(question);
}

function asksForRankedWindows(question: string): boolean {
  return asksForMostIntenseWindow(question) || /annual\s+priority|top\s*(?:3|three)|три\s+(?:окн|дат)|сам[а-яё]*\s+сильн|ранж|ranked|priority\s+labels/i.test(question);
}

function asksChronologicalWindows(question: string): boolean {
  return /chronolog|calendar|хронолог|календар|сначала\s+(?:назови|перечисли|даты)|dates?\s+first/i.test(question);
}

function rankedWindows(answer: BtcMultiBodyAstroRcAnswer, locale: BtcPublicLocale, count = 5): Section | null {
  const windows = byId(answer, "main_windows");
  if (!windows?.bullets?.length) return null;
  const marker = locale === "ru" ? /^Ранг\s+(\d+)/ : /^Rank\s+(\d+)/;
  const bullets = [...windows.bullets].sort((a, b) => {
    const ar = Number(a.match(marker)?.[1] ?? 999);
    const br = Number(b.match(marker)?.[1] ?? 999);
    return ar - br;
  }).slice(0, count);
  return { ...windows, id: "main_windows", label: locale === "ru" ? "Главные даты и окна — по рейтингу" : "Top dates and windows — ranked", bullets };
}

function rankOneWindow(answer: BtcMultiBodyAstroRcAnswer, locale: BtcPublicLocale): Section | null {
  const windows = byId(answer, "main_windows");
  if (!windows?.bullets?.length) return null;
  const marker = locale === "ru" ? "Ранг 1 ·" : "Rank 1 ·";
  const top = windows.bullets.find((line) => line.startsWith(marker));
  return top ? { ...windows, bullets: [top] } : null;
}

export function projectPublicMultiBodyAnswer(
  locale: BtcPublicLocale,
  route: BtcMultiBodyAstroRcRoute,
  answer: BtcMultiBodyAstroRcAnswer,
): BtcMultiBodyAstroRcAnswer {
  const ru = locale === "ru";
  if (
    route.context_relation === "FOLLOW_UP" &&
    answer.answer_mode === "ASTRO_YEAR_OVERVIEW" &&
    asksForMostIntenseWindow(route.raw_question)
  ) {
    const top = rankOneWindow(answer, locale);
    return {
      ...answer,
      headline: ru ? "Наиболее напряжённое окно 2026" : "The most intense 2026 window",
      direct_answer: ru
        ? "По принятому рейтингу максимальная концентрация точных аспектов приходится на 20–21 июля. Это астрономическая напряжённость внутри метода, а не автоматически рыночная волатильность BTC."
        : "By the accepted ranking, the highest concentration of exact aspects falls on July 20–21. This is astronomical intensity within the method, not automatically BTC market volatility.",
      sections: [top, byId(answer, "interpretation_boundary")].filter((section): section is Section => Boolean(section)),
    };
  }
  if (answer.answer_mode === "ASTRO_YEAR_OVERVIEW" && asksForRankedWindows(route.raw_question)) {
    const top = rankedWindows(answer, locale, /top\s*(?:3|three)|три\s+(?:окн|дат)|какие\s+три|which\s+three/i.test(route.raw_question) ? 3 : 5);
    if (top) return {
      ...answer,
      headline: ru ? "Главные окна 2026 — по принятому рейтингу" : "Primary 2026 windows — accepted ranking",
      direct_answer: ru
        ? `Сначала даты по рейтингу: ${(top.bullets ?? []).slice(0, 3).join(" ")}`
        : `Ranked dates first: ${(top.bullets ?? []).slice(0, 3).join(" ")}`,
      sections: [top, byId(answer, "salience_method"), byId(answer, "interpretation_boundary")].filter((section): section is Section => Boolean(section)),
    };
  }
  if (answer.answer_mode === "ASTRO_YEAR_OVERVIEW" && /stations?|станци/i.test(route.raw_question)) {
    const stations = byId(answer, "fast_triggers");
    return { ...answer, headline: ru ? "Станции внутри главных окон 2026" : "Stations inside the primary 2026 windows", direct_answer: ru ? "Сначала опубликованные станции и переходы внутри годовой структуры." : "Published stations and transitions inside the annual structure come first.", sections: [stations, byId(answer, "main_windows"), byId(answer, "interpretation_boundary")].filter((section): section is Section => Boolean(section)) };
  }
  if (answer.answer_mode === "ASTRO_YEAR_OVERVIEW" && /long[-\s]?term\s+cycles?|долгосрочн[а-яё]*\s+цикл/i.test(route.raw_question)) {
    const slow = byId(answer, "slow_context");
    return { ...answer, headline: ru ? "Долгосрочный фон главных окон" : "Long-term background of the primary windows", direct_answer: slow?.paragraph ?? answer.direct_answer, sections: [slow, byId(answer, "main_windows"), byId(answer, "interpretation_boundary")].filter((section): section is Section => Boolean(section)) };
  }
  if (answer.answer_mode === "ASTRO_YEAR_OVERVIEW" && asksChronologicalWindows(route.raw_question)) {
    const windows = byId(answer, "main_windows");
    return { ...answer, headline: ru ? "Окна 2026 — хронологически" : "2026 windows — chronological", direct_answer: ru ? "Сначала хронология дат; annual priority остаётся отдельной меткой каждого окна." : "Chronology comes first; annual priority remains a separate label for each window.", sections: [windows, byId(answer, "interpretation_boundary")].filter((section): section is Section => Boolean(section)) };
  }
  if (route.context_relation === "FOLLOW_UP" && answer.answer_mode === "ASTRO_YEAR_OVERVIEW") {
    return { ...answer, headline: ru ? "Почему именно эти окна важны" : "Why these windows matter", direct_answer: ru ? "Значимость возникает из масштаба медленного цикла, точности, длительности, кластерности и близких станций/ингрессий; эти основания показаны отдельно от рыночной трактовки." : "Significance comes from slow-cycle scale, exactness, duration, clustering, and nearby stations/ingresses; those grounds remain separate from market interpretation.", sections: ["main_windows", "salience_method", "slow_context", "interpretation_boundary"].map((id) => byId(answer, id)).filter((section): section is Section => Boolean(section)) };
  }
  if (route.context_relation === "RETURN_TO_PREVIOUS_TOPIC" && answer.answer_mode === "ASTRO_YEAR_OVERVIEW") {
    const windows = byId(answer, "main_windows");
    return {
      ...answer,
      headline: ru ? "Контекст аспектов 2026 восстановлен" : "The 2026 aspect context is restored",
      direct_answer: ru
        ? "Возвращаемся к сохранённому годовому обзору. Ниже — краткий обзор главных временных окон; полный список переходов не повторяется."
        : "Returning to the saved annual overview. Below is a concise recap of the main windows; the complete transition list is not repeated.",
      sections: windows ? [{ ...windows, bullets: windows.bullets?.slice(0, 3) }] : [],
    };
  }
  if (answer.answer_mode === "ASTRO_BTC_BRIDGE") {
    const adequacyInput: BtcCosmographerAnswerProjection = {
      ...answer,
      answer_mode: "ASTRO_BTC_BRIDGE",
      sections: answer.sections.map((section) =>
        section.id === "market_layer"
          ? { ...section, id: "btc_side_state" }
          : section.id === "main_windows"
            ? { ...section, id: "astro_window" }
            : section,
      ),
    };
    const adequacy = specializeBridgeAnswer(locale, route, adequacyInput);
    if (
      adequacy.answer_state === "LIMITED" &&
      adequacy.answer_mode === "ASTRO_BTC_BRIDGE" &&
      adequacy.sections.some((section) => section.id === "window_comparison_evidence_gap")
    ) {
      const bridgeBoundary = byId(answer, "bridge_boundary");
      return {
        ...answer,
        ...adequacy,
        sections: [
          ...adequacy.sections,
          ...(bridgeBoundary && !adequacy.sections.some((section) => section.id === "bridge_boundary")
            ? [bridgeBoundary]
            : []),
        ],
      };
    }

    const text = route.raw_question.toLowerCase();
    const historical = /historical|историческ|за\s+те\s+же\s+дат|same\s+dates/.test(text);
    const missingMarketPeriod = /market[^?!.]{0,40}(?:snapshot|state)[^?!.]{0,40}(?:missing|unavailable)|рыночн[а-яё]*[^?!.]{0,40}(?:снимок|snapshot)[^?!.]{0,40}(?:нет|недоступ)/.test(text);
    const causal = /cause|caused|вызвал|обрушил|причин/.test(text);
    const nonConfirmation = /does\s+not\s+confirm|не\s+подтверж|diverg|расхожд/.test(text);
    let direct = ru ? "Ограниченный вывод: астрономический и BTC-слои сопоставимы только как независимые evidence lanes; причинность и торговый сигнал из совпадения не следуют." : "Bounded conclusion: the astronomical and BTC layers are comparable only as independent evidence lanes; coincidence does not establish causality or a trading signal.";
    if (causal) direct = ru ? "Нет: принятое evidence не доказывает, что планетарная конфигурация вызвала движение BTC. Можно проверять только временное совпадение или расхождение независимых слоёв." : "No: accepted evidence does not show that a planetary configuration caused a BTC move. Only temporal concurrence or divergence between independent lanes can be tested.";
    else if (historical) direct = ru ? "Историческая связь не подтверждена текущим Snapshot: для сопоставления за те же даты нужен принятый BTC evidence именно за этот период; текущий снимок его не заменяет." : "The historical relation is not established by the current Snapshot: same-date comparison requires accepted BTC evidence for that historical period; the current Snapshot cannot substitute for it.";
    else if (nonConfirmation) direct = ru ? "Неподтверждение — это результат: рыночный слой не подтверждает заявленную связь, поэтому вывод остаётся раздельным и непричинным." : "Non-confirmation is a result: the market lane does not confirm the proposed relation, so the conclusion remains split and non-causal.";
    if (missingMarketPeriod) direct = ru ? "Без принятого рыночного Snapshot за запрошенный период dual-evidence сопоставление не строится; астрономический слой можно показать отдельно, но рыночный результат не симулируется." : "Without an accepted market Snapshot for the requested period, no dual-evidence comparison is built; the astronomical lane may be shown separately, but the market result is not simulated.";
    return { ...answer, answer_state: (historical || missingMarketPeriod) ? "LIMITED" : answer.answer_state, answer_mode: missingMarketPeriod ? "CLARIFICATION" : answer.answer_mode, direct_answer: direct, sections: ["market_layer", "main_windows", "relation", "confirmation_or_divergence", "conditions", "dual_proof", "non_causal_boundary", "non_trading_boundary", "bridge_boundary"].map((id) => byId(answer, id)).filter((section): section is Section => Boolean(section)) };
  }
  return answer;
}

export function buildPublicMultiBodyAnswer(
  locale: BtcPublicLocale,
  route: BtcMultiBodyAstroRcRoute,
  market: BtcCosmographerAnswerProjection | null,
): BtcMultiBodyAstroRcAnswer {
  const annual = buildMultiBodyAstroYearAnswer(locale, route);
  const combined = route.domain === "astro_btc_bridge"
    ? combineMultiBodyAstroMarketAnswer(locale, annual, market)
    : annual;
  return projectPublicMultiBodyAnswer(locale, route, combined);
}

export function isPublicMultiBodyRoute(route: BtcCosmographerRoute): route is BtcMultiBodyAstroRcRoute {
  return (route.subject === "planetary_aspects" || route.subject === "planetary_stations") &&
    (route.domain === "astromodule" || route.domain === "astro_btc_bridge");
}
