import astroEvidence from "../data/btc_public_astro_evidence_v0_1.json";
import {
  routeBtcCosmographerQuestion,
  type BtcCosmographerContextPacket,
  type BtcCosmographerRoute,
} from "./btc-cosmographer-route-graph";
import type { BtcCosmographerAnswerProjection } from "./btc-protocol-evidence";
import type { BtcPublicLocale } from "./btc-public-language-contract";

type Station = { date: string; body: string; motion: "direct" | "retrograde" };
type Ingress = { date: string; body: string; sign: string };
type AspectWindow = {
  start: string;
  end: string;
  peak: string;
  a: string;
  b: string;
  angle: number;
  orb: number;
};
type PublicAstroEvidence = {
  schema: string;
  source: {
    engine: string;
    version: string;
    mode: string;
    coordinate: string;
    sample: string;
    research_orb_deg: number;
  };
  range: { start: string; end: string };
  stations: Station[];
  ingresses: Ingress[];
  aspects: AspectWindow[];
};

const data = astroEvidence as unknown as PublicAstroEvidence;

export const BTC_MULTI_BODY_ASTRO_RC_SCHEMA =
  "btc_cosmographer_multi_body_astro_local_rc_v0_1" as const;

export type BtcMultiBodyAstroRcIntent =
  | "YEAR_OVERVIEW"
  | "RANK"
  | "EXPLAIN_SIGNIFICANCE";

export type BtcMultiBodyAstroRcRoute = BtcCosmographerRoute & {
  rc_schema: typeof BTC_MULTI_BODY_ASTRO_RC_SCHEMA;
  rc_scope: "SINGLE_BODY" | "MULTI_BODY";
  rc_intents: BtcMultiBodyAstroRcIntent[];
};

type AnswerSection = {
  id: string;
  label: string;
  bullets?: string[];
  paragraph?: string;
};

export type BtcMultiBodyAstroRcAnswer = Omit<
  BtcCosmographerAnswerProjection,
  "answer_mode" | "sections"
> & {
  answer_mode: BtcCosmographerAnswerProjection["answer_mode"] | "ASTRO_YEAR_OVERVIEW";
  sections: AnswerSection[];
};

export type BtcMultiBodyAstroMemory = {
  domain: "astromodule";
  subject: "planetary_aspects";
  start: string;
  end: string;
};

type ScoredAspect = AspectWindow & {
  slowScale: number;
  exactness: number;
  durationDays: number;
  overlapCount: number;
  baseScore: number;
};

type AspectCluster = {
  start: string;
  end: string;
  peak: string;
  events: ScoredAspect[];
  score: number;
  rank: number;
};

const BODY_LABELS: Record<BtcPublicLocale, Record<string, string>> = {
  en: {
    sun: "Sun", moon: "Moon", mercury: "Mercury", venus: "Venus",
    mars: "Mars", jupiter: "Jupiter", saturn: "Saturn", uranus: "Uranus",
    neptune: "Neptune", pluto: "Pluto",
  },
  ru: {
    sun: "Солнце", moon: "Луна", mercury: "Меркурий", venus: "Венера",
    mars: "Марс", jupiter: "Юпитер", saturn: "Сатурн", uranus: "Уран",
    neptune: "Нептун", pluto: "Плутон",
  },
};

const ASPECT_LABELS: Record<BtcPublicLocale, Record<number, string>> = {
  en: { 0: "conjunction", 60: "sextile", 90: "square", 120: "trine", 180: "opposition" },
  ru: { 0: "соединение", 60: "секстиль", 90: "квадрат", 120: "трин", 180: "оппозиция" },
};

const BODY_SCALE: Record<string, number> = {
  sun: 1,
  moon: 1,
  mercury: 1,
  venus: 1,
  mars: 2,
  jupiter: 3,
  saturn: 4,
  uranus: 5,
  neptune: 6,
  pluto: 6,
};

const SIGN_LABELS: Record<BtcPublicLocale, Record<string, string>> = {
  en: { aries: "Aries", taurus: "Taurus", gemini: "Gemini", cancer: "Cancer", leo: "Leo", virgo: "Virgo", libra: "Libra", scorpio: "Scorpio", sagittarius: "Sagittarius", capricorn: "Capricorn", aquarius: "Aquarius", pisces: "Pisces" },
  ru: { aries: "Овен", taurus: "Телец", gemini: "Близнецы", cancer: "Рак", leo: "Лев", virgo: "Дева", libra: "Весы", scorpio: "Скорпион", sagittarius: "Стрелец", capricorn: "Козерог", aquarius: "Водолей", pisces: "Рыбы" },
};

const MULTI_BODY_PATTERN =
  /(?:planetary\s+aspects?|aspects?\s+(?:between|of)\s+planets?|аспект\w*\s+планет|планет\w*\s+аспект)/i;
const RETURN_ASTRO_PATTERN =
  /(?:back|return)\s+to\s+(?:the\s+)?(?:aspects?|astro)|верн[её]мся\s+к\s+аспект|вернуться\s+к\s+аспект|снова\s+к\s+аспект/i;

function dayNumber(value: string): number {
  return Math.floor(new Date(`${value}T00:00:00Z`).getTime() / 86_400_000);
}

function daysInclusive(start: string, end: string): number {
  return Math.max(1, dayNumber(end) - dayNumber(start) + 1);
}

function bodyLabel(locale: BtcPublicLocale, body: string): string {
  return BODY_LABELS[locale][body] ?? body;
}

function aspectLabel(locale: BtcPublicLocale, angle: number): string {
  return ASPECT_LABELS[locale][angle] ?? `${angle}°`;
}

function isAnnual2026(route: BtcCosmographerRoute): boolean {
  return route.time_range?.start === "2026-01-01" && route.time_range?.end === "2026-12-31";
}

export function isMultiBodyAspectQuestion(question: string): boolean {
  return MULTI_BODY_PATTERN.test(question);
}

export function routeBtcCosmographerLocalRc(
  locale: BtcPublicLocale,
  rawQuestion: string,
  packet: BtcCosmographerContextPacket | null,
  selectedDate?: string,
  astroMemory?: BtcMultiBodyAstroMemory | null,
): BtcMultiBodyAstroRcRoute {
  const base = routeBtcCosmographerQuestion(locale, rawQuestion, packet, selectedDate);
  const q = rawQuestion.trim();
  const explicitMultiBody = isMultiBodyAspectQuestion(q);
  const restoreAstro = Boolean(astroMemory && RETURN_ASTRO_PATTERN.test(q));
  const inheritedMultiBody =
    base.subject === "planetary_aspects" &&
    (base.domain === "astromodule" || base.domain === "astro_btc_bridge");

  if (explicitMultiBody) {
    return {
      ...base,
      domain: "astromodule",
      subject: "planetary_aspects",
      intents: ["interval_analysis", "reason", "explain"],
      context_relation: "NEW_TOPIC",
      time_range: base.time_range ?? {
        start: "2026-01-01",
        end: "2026-12-31",
        label: "2026",
        source: "QUESTION",
      },
      market_question_class: null,
      capability_id: "astromodule.planetary_aspects.year_overview",
      confidence: "HIGH",
      explicit_entities: ["planetary_aspects"],
      rc_schema: BTC_MULTI_BODY_ASTRO_RC_SCHEMA,
      rc_scope: "MULTI_BODY",
      rc_intents: ["YEAR_OVERVIEW", "RANK", "EXPLAIN_SIGNIFICANCE"],
    };
  }

  if (restoreAstro && astroMemory) {
    return {
      ...base,
      domain: "astromodule",
      subject: "planetary_aspects",
      intents: ["interval_analysis", "reason", "explain"],
      context_relation: "RETURN_TO_PREVIOUS_TOPIC",
      time_range: {
        start: astroMemory.start,
        end: astroMemory.end,
        label: astroMemory.start.slice(0, 4),
        source: "CONTEXT",
      },
      market_question_class: null,
      capability_id: "astromodule.planetary_aspects.year_overview",
      confidence: "HIGH",
      explicit_entities: ["planetary_aspects"],
      rc_schema: BTC_MULTI_BODY_ASTRO_RC_SCHEMA,
      rc_scope: "MULTI_BODY",
      rc_intents: ["YEAR_OVERVIEW", "RANK", "EXPLAIN_SIGNIFICANCE"],
    };
  }

  if (inheritedMultiBody || (packet?.prior_subject === "planetary_aspects" && base.domain === "astro_btc_bridge")) {
    return {
      ...base,
      subject: "planetary_aspects",
      capability_id: `${base.domain}.planetary_aspects`,
      rc_schema: BTC_MULTI_BODY_ASTRO_RC_SCHEMA,
      rc_scope: "MULTI_BODY",
      rc_intents: ["YEAR_OVERVIEW", "RANK", "EXPLAIN_SIGNIFICANCE"],
    };
  }

  return {
    ...base,
    rc_schema: BTC_MULTI_BODY_ASTRO_RC_SCHEMA,
    rc_scope: "SINGLE_BODY",
    rc_intents: [],
  };
}

function exactnessScore(orb: number): number {
  if (orb <= 0.01) return 5;
  if (orb <= 0.05) return 4;
  if (orb <= 0.15) return 3;
  if (orb <= 0.5) return 2;
  return 1;
}

function relatedTransitions(event: AspectWindow): Array<Station | Ingress> {
  const start = dayNumber(event.start) - 7;
  const end = dayNumber(event.end) + 7;
  const bodies = new Set([event.a, event.b]);
  return [...data.stations, ...data.ingresses].filter((item) => {
    const day = dayNumber(item.date);
    return bodies.has(item.body) && day >= start && day <= end;
  });
}

function scoreAspect(event: AspectWindow): ScoredAspect {
  const slowScale = (BODY_SCALE[event.a] ?? 0) + (BODY_SCALE[event.b] ?? 0);
  const exactness = exactnessScore(event.orb);
  const durationDays = daysInclusive(event.start, event.end);
  const durationScore = durationDays >= 180 ? 4 : durationDays >= 75 ? 3 : durationDays >= 30 ? 2 : 1;
  const overlapCount = relatedTransitions(event).length;
  return {
    ...event,
    slowScale,
    exactness,
    durationDays,
    overlapCount,
    baseScore: slowScale * 2 + exactness * 3 + durationScore * 2 + Math.min(3, overlapCount),
  };
}

function buildClusters(events: AspectWindow[]): AspectCluster[] {
  const scored = events.map(scoreAspect).sort((a, b) => a.peak.localeCompare(b.peak));
  const groups: ScoredAspect[][] = [];
  for (const event of scored) {
    const group = groups.at(-1);
    if (!group) {
      groups.push([event]);
      continue;
    }
    const priorPeak = dayNumber(group.at(-1)?.peak ?? event.peak);
    if (Math.abs(dayNumber(event.peak) - priorPeak) <= 2) group.push(event);
    else groups.push([event]);
  }

  const clusters = groups.map((group) => ({
    start: group.map((item) => item.start).sort()[0],
    end: group.map((item) => item.end).sort().at(-1) ?? group[0].end,
    peak: group.map((item) => item.peak).sort()[Math.floor((group.length - 1) / 2)],
    events: group,
    score: Math.max(...group.map((item) => item.baseScore)) + (group.length - 1) * 5,
    rank: 0,
  }));
  const ranked = [...clusters].sort((a, b) => b.score - a.score || a.peak.localeCompare(b.peak));
  ranked.forEach((cluster, index) => {
    cluster.rank = index + 1;
  });
  return clusters;
}

function eventTitle(locale: BtcPublicLocale, event: ScoredAspect): string {
  return locale === "ru"
    ? `${aspectLabel(locale, event.angle)} ${bodyLabel(locale, event.a)}—${bodyLabel(locale, event.b)}`
    : `${bodyLabel(locale, event.a)}–${bodyLabel(locale, event.b)} ${aspectLabel(locale, event.angle)}`;
}

function clusterTitle(locale: BtcPublicLocale, cluster: AspectCluster): string {
  if (cluster.events.length === 1) return eventTitle(locale, cluster.events[0]);
  const bodies = Array.from(new Set(cluster.events.flatMap((item) => [item.a, item.b])));
  return locale === "ru"
    ? `кластер ${bodies.map((body) => bodyLabel(locale, body)).join("—")}`
    : `${bodies.map((body) => bodyLabel(locale, body)).join("–")} cluster`;
}

function clusterReasons(locale: BtcPublicLocale, cluster: AspectCluster): string {
  const maxSlow = Math.max(...cluster.events.map((item) => item.slowScale));
  const minOrb = Math.min(...cluster.events.map((item) => item.orb));
  const maxDuration = Math.max(...cluster.events.map((item) => item.durationDays));
  const transitions = cluster.events.reduce((sum, item) => sum + item.overlapCount, 0);
  if (locale === "ru") {
    return [
      `масштаб медленного цикла ${maxSlow}`,
      `минимальный дневной orb ${minOrb.toFixed(3)}°`,
      `окно до ${maxDuration} дн.`,
      cluster.events.length > 1 ? `${cluster.events.length} точных аспекта в одном кластере` : "один точный аспект",
      transitions ? `${transitions} пересечений со станциями/ингрессиями` : "без отдельного перехода движения или знака",
    ].join("; ");
  }
  return [
    `slow-cycle scale ${maxSlow}`,
    `minimum daily orb ${minOrb.toFixed(3)}°`,
    `window up to ${maxDuration} days`,
    cluster.events.length > 1 ? `${cluster.events.length} exact aspects in one cluster` : "one exact aspect",
    transitions ? `${transitions} station/ingress overlaps` : "no separate station or ingress overlap",
  ].join("; ");
}

function clusterBullet(locale: BtcPublicLocale, cluster: AspectCluster): string {
  const peaks = Array.from(new Set(cluster.events.map((item) => item.peak))).join(" / ");
  return locale === "ru"
    ? `Ранг ${cluster.rank} · ${cluster.start}–${cluster.end} · пик ${peaks}: ${clusterTitle(locale, cluster)}. Основания: ${clusterReasons(locale, cluster)}.`
    : `Rank ${cluster.rank} · ${cluster.start}–${cluster.end} · peak ${peaks}: ${clusterTitle(locale, cluster)}. Basis: ${clusterReasons(locale, cluster)}.`;
}

function transitionBullets(locale: BtcPublicLocale, selected: AspectCluster[]): string[] {
  const start = Math.min(...selected.map((item) => dayNumber(item.start))) - 7;
  const end = Math.max(...selected.map((item) => dayNumber(item.end))) + 7;
  const bodies = new Set(selected.flatMap((cluster) => cluster.events.flatMap((event) => [event.a, event.b])));
  const transitions = [...data.stations, ...data.ingresses]
    .filter((item) => {
      const day = dayNumber(item.date);
      return bodies.has(item.body) && day >= start && day <= end;
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  return transitions.map((item) => {
    if ("motion" in item) {
      const motion = item.motion === "direct"
        ? (locale === "ru" ? "переход к директному движению" : "station direct")
        : (locale === "ru" ? "переход к ретроградному движению" : "station retrograde");
      return `${item.date}: ${bodyLabel(locale, item.body)} — ${motion}.`;
    }
    const sign = SIGN_LABELS[locale][item.sign] ?? item.sign;
    return locale === "ru"
      ? `${item.date}: ${bodyLabel(locale, item.body)} входит в знак ${sign}.`
      : `${item.date}: ${bodyLabel(locale, item.body)} enters ${sign}.`;
  });
}

export function buildMultiBodyAstroYearAnswer(
  locale: BtcPublicLocale,
  route: BtcMultiBodyAstroRcRoute,
): BtcMultiBodyAstroRcAnswer {
  const requested = route.time_range ?? {
    start: data.range.start,
    end: data.range.end,
    label: "2026",
    source: "QUESTION" as const,
  };
  if (!isAnnual2026(route) || requested.start < data.range.start || requested.end > data.range.end) {
    return {
      answer_state: "LIMITED",
      answer_mode: "ASTRO_YEAR_OVERVIEW",
      headline: locale === "ru"
        ? "Годовой обзор ограничен опубликованным диапазоном 2026"
        : "The annual overview is limited to the published 2026 range",
      direct_answer: locale === "ru"
        ? `Этот локальный кандидат использует только ${data.range.start}–${data.range.end}; отсутствующие годы не заменяются догадкой.`
        : `This local candidate uses only ${data.range.start}–${data.range.end}; missing years are not replaced with a guess.`,
      sections: [],
      source_boundary: locale === "ru"
        ? "Локальный RC не расширяет публичный evidence index."
        : "The local RC does not extend the public evidence index.",
      proof_label: locale === "ru" ? "Astro proof ограничен" : "Astro proof limited",
    };
  }

  const clusters = buildClusters(
    data.aspects.filter((event) => event.end >= requested.start && event.start <= requested.end),
  );
  const top = [...clusters]
    .sort((a, b) => a.rank - b.rank)
    .slice(0, 5)
    .sort((a, b) => a.start.localeCompare(b.start));
  const transitions = transitionBullets(locale, top);

  const direct = locale === "ru"
    ? "В 2026 году важность определяется не одной планетой, а сочетанием масштаба медленного цикла, точности, длительности окна, кластерности и пересечений со станциями или ингрессиями. Самая плотная тактическая связка приходится на 20–21 июля; многомесячный несущий слой формируют Нептун—Плутон и Уран—Плутон."
    : "In 2026, importance is determined by slow-cycle scale, exactness, window duration, clustering, and station or ingress overlap—not by one default planet. The densest tactical cluster falls on July 20–21, while Neptune–Pluto and Uranus–Pluto form the multi-month carrier layer.";

  return {
    answer_state: "CONFIRMED",
    answer_mode: "ASTRO_YEAR_OVERVIEW",
    headline: locale === "ru"
      ? "Планетарные аспекты 2026: пять главных окон"
      : "Planetary aspects in 2026: five primary windows",
    direct_answer: direct,
    sections: [
      {
        id: "main_windows",
        label: locale === "ru" ? "Главные окна — по времени" : "Primary windows — chronological",
        bullets: top.map((cluster) => clusterBullet(locale, cluster)),
      },
      {
        id: "fast_triggers",
        label: locale === "ru" ? "Станции и ингрессии внутри структуры" : "Stations and ingresses inside the structure",
        bullets: transitions.slice(0, 12),
      },
      {
        id: "slow_context",
        label: locale === "ru" ? "Медленный несущий контекст" : "Slow carrier context",
        paragraph: locale === "ru"
          ? "Внутренний анализ идёт от медленных пар к быстрым активаторам. Пользовательский ответ идёт от ближайших окон к многомесячному слою. Быстрый триггер уточняет момент, но не заменяет родительский цикл."
          : "Internal analysis runs from slow pairs to fast activators. The public answer runs from nearer windows to the multi-month layer. A fast trigger refines timing but does not replace its parent cycle.",
      },
      {
        id: "salience_method",
        label: locale === "ru" ? "Почему выбраны именно эти окна" : "Why these windows were selected",
        bullets: locale === "ru"
          ? [
              "масштаб и медленность участвующих планет",
              "минимальный дневной orb и точная дата пика",
              "продолжительность окна",
              "несколько точных аспектов в одном временном кластере",
              "станции и ингрессии рядом с окном",
            ]
          : [
              "scale and slowness of the participating bodies",
              "minimum daily orb and exact peak date",
              "window duration",
              "multiple exact aspects in one time cluster",
              "stations and ingresses near the window",
            ],
      },
      {
        id: "interpretation_boundary",
        label: locale === "ru" ? "Граница трактовки" : "Interpretation boundary",
        paragraph: locale === "ru"
          ? "Это ранжирование астрономических конфигураций внутри принятого исследовательского метода. Оно не доказывает причинное влияние на BTC, не является ценовым прогнозом и не создаёт торговый сигнал."
          : "This ranks astronomical configurations within the accepted research method. It does not prove a causal effect on BTC, predict price, or create a trading signal.",
      },
    ],
    source_boundary: locale === "ru"
      ? `Источник: ${data.schema}; ${data.source.engine} ${data.source.version}; ${data.source.mode}; ${data.source.coordinate}; диапазон ${data.range.start}–${data.range.end}.`
      : `Source: ${data.schema}; ${data.source.engine} ${data.source.version}; ${data.source.mode}; ${data.source.coordinate}; range ${data.range.start}–${data.range.end}.`,
    proof_label: locale === "ru" ? "Multi-body Astro proof доступен" : "Multi-body Astro proof available",
  };
}

export function combineMultiBodyAstroMarketAnswer(
  locale: BtcPublicLocale,
  astro: BtcMultiBodyAstroRcAnswer,
  market: BtcCosmographerAnswerProjection | null,
): BtcMultiBodyAstroRcAnswer {
  const marketLines = market
    ? market.sections.flatMap((section) => section.bullets ?? (section.paragraph ? [section.paragraph] : [])).slice(0, 5)
    : [];
  return {
    ...astro,
    answer_state: "SPLIT",
    answer_mode: "ASTRO_BTC_BRIDGE",
    headline: locale === "ru"
      ? "Астрономическое окно и ликвидность проверены как независимые слои"
      : "The astronomy window and liquidity were checked as independent layers",
    direct_answer: locale === "ru"
      ? `${astro.direct_answer} Рыночное подтверждение рассматривается отдельно и не меняет астрономический факт.`
      : `${astro.direct_answer} Market confirmation is evaluated separately and does not alter the astronomical fact.`,
    sections: [
      ...astro.sections.slice(0, 2),
      {
        id: "market_layer",
        label: locale === "ru" ? "Независимый слой ликвидности" : "Independent liquidity layer",
        bullets: marketLines.length
          ? marketLines
          : [locale === "ru"
              ? "Принятый Market Snapshot недоступен; подтверждение не симулируется."
              : "The accepted Market Snapshot is unavailable; confirmation is not simulated."],
      },
      {
        id: "bridge_boundary",
        label: locale === "ru" ? "Граница моста Astro × BTC" : "Astro × BTC bridge boundary",
        paragraph: locale === "ru"
          ? "Разрешено сравнивать даты, состояния и расхождения. Совпадение не превращается в причинность, прогноз или торговый сигнал."
          : "Dates, states, and divergences may be compared. Coincidence does not become causality, a forecast, or a trading signal.",
      },
    ],
    source_boundary: market
      ? `${astro.source_boundary} ${market.source_boundary}`
      : astro.source_boundary,
    proof_label: locale === "ru" ? "Astro proof + Market proof" : "Astro proof + Market proof",
  };
}
