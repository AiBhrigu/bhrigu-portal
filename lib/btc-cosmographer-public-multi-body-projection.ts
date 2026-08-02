import type { BtcPublicLocale } from "./btc-public-language-contract";
import type { BtcCosmographerAnswerProjection } from "./btc-protocol-evidence";
import type { BtcCosmographerRoute } from "./btc-cosmographer-route-graph";
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
  return /volatil|волатиль|напряж[её]нн[а-яё]*\s+(?:день|дни|дата|период)|most\s+intense|highest\s+tension/i.test(question);
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
      sections: [top, byId(answer, "interpretation_boundary")]
        .filter((section): section is Section => Boolean(section)),
    };
  }
  if (route.context_relation === "FOLLOW_UP" && answer.answer_mode === "ASTRO_YEAR_OVERVIEW") {
    return {
      ...answer,
      headline: ru ? "Почему именно эти окна важны" : "Why these windows matter",
      direct_answer: ru
        ? "Значимость возникает из сочетания масштаба медленного цикла, точности, длительности, кластерности и близких станций или ингрессий. Ни один отдельный показатель не используется как универсальный ответ."
        : "Significance comes from slow-cycle scale, exactness, duration, clustering, and nearby stations or ingresses. No single metric is used as a universal answer.",
      sections: ["salience_method", "slow_context", "interpretation_boundary"]
        .map((id) => byId(answer, id))
        .filter((section): section is Section => Boolean(section)),
    };
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
    return {
      ...answer,
      sections: ["market_layer", "main_windows", "bridge_boundary"]
        .map((id) => byId(answer, id))
        .filter((section): section is Section => Boolean(section)),
    };
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
  return route.subject === "planetary_aspects" &&
    (route.domain === "astromodule" || route.domain === "astro_btc_bridge");
}
