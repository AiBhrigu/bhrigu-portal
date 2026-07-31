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

export function projectPublicMultiBodyAnswer(
  locale: BtcPublicLocale,
  route: BtcMultiBodyAstroRcRoute,
  answer: BtcMultiBodyAstroRcAnswer,
): BtcMultiBodyAstroRcAnswer {
  const ru = locale === "ru";
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
        ? "Возвращаемся к сохранённому годовому коридору. Ниже — краткий обзор главных временных окон; полный список переходов не повторяется."
        : "Returning to the saved annual corridor. Below is a concise recap of the main windows; the complete transition list is not repeated.",
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
