import astroEvidence from "../data/btc_public_astro_evidence_v0_1.json";
import type { BtcCosmographerRoute } from "./btc-cosmographer-route-graph";
import type { BtcCosmographerAnswerProjection } from "./btc-protocol-evidence";
import type { BtcPublicLocale } from "./btc-public-language-contract";

type BodyState = [number, number];
type Anchor = { date: string; b: Record<string, BodyState> };
type Ingress = { date: string; body: string; sign: string };
type Station = {
  date: string;
  body: string;
  motion: "direct" | "retrograde";
};
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
  bodies: string[];
  anchors: Anchor[];
  ingresses: Ingress[];
  stations: Station[];
  aspects: AspectWindow[];
};

type TimelineItem = {
  date: string;
  order: number;
  text: string;
};

const data = astroEvidence as unknown as PublicAstroEvidence;

export const BTC_PUBLIC_ASTRO_EVIDENCE_META = {
  coverage_start: data.range.start,
  coverage_end: data.range.end,
  revision_or_generated_at_utc: null,
} as const;

const SIGN_KEYS = [
  "aries", "taurus", "gemini", "cancer", "leo", "virgo",
  "libra", "scorpio", "sagittarius", "capricorn", "aquarius", "pisces",
];

const SIGNS: Record<BtcPublicLocale, string[]> = {
  en: [
    "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
    "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
  ],
  ru: [
    "Овне", "Тельце", "Близнецах", "Раке", "Льве", "Деве",
    "Весах", "Скорпионе", "Стрельце", "Козероге", "Водолее", "Рыбах",
  ],
};

const SIGN_GENITIVE_RU: Record<string, string> = {
  aries: "Овна",
  taurus: "Тельца",
  gemini: "Близнецов",
  cancer: "Рака",
  leo: "Льва",
  virgo: "Девы",
  libra: "Весов",
  scorpio: "Скорпиона",
  sagittarius: "Стрельца",
  capricorn: "Козерога",
  aquarius: "Водолея",
  pisces: "Рыб",
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
  en: {
    0: "conjunction", 60: "sextile", 90: "square",
    120: "trine", 180: "opposition",
  },
  ru: {
    0: "соединение", 60: "секстиль", 90: "квадрат",
    120: "трин", 180: "оппозиция",
  },
};

const FAST_BODIES = new Set(["sun", "moon", "mercury", "venus", "mars"]);

function bodyLabel(locale: BtcPublicLocale, body: string): string {
  return BODY_LABELS[locale][body] ?? body;
}

function inRange(date: string, start: string, end: string): boolean {
  return date >= start && date <= end;
}

function closestAnchor(target: string, body: string): Anchor | null {
  const eligible = data.anchors.filter((anchor) => anchor.b[body]);
  if (!eligible.length) return null;
  const targetTime = new Date(`${target}T00:00:00Z`).getTime();
  return eligible.reduce((best, anchor) => {
    const distance = Math.abs(
      new Date(`${anchor.date}T00:00:00Z`).getTime() - targetTime,
    );
    const bestDistance = Math.abs(
      new Date(`${best.date}T00:00:00Z`).getTime() - targetTime,
    );
    return distance < bestDistance ? anchor : best;
  });
}

function positionText(locale: BtcPublicLocale, state: BodyState): string {
  const [longitude, speed] = state;
  const normalized = ((longitude % 360) + 360) % 360;
  const signIndex = Math.floor(normalized / 30);
  const degree = normalized - signIndex * 30;
  const motion = speed < 0
    ? (locale === "ru" ? "ретроградно" : "retrograde")
    : (locale === "ru" ? "директно" : "direct");
  return locale === "ru"
    ? `${degree.toFixed(1)}° в ${SIGNS.ru[signIndex]}, ${motion}`
    : `${degree.toFixed(1)}° ${SIGNS.en[signIndex]}, ${motion}`;
}

function exactEventItems(
  locale: BtcPublicLocale,
  body: string,
  start: string,
  end: string,
): TimelineItem[] {
  const items: TimelineItem[] = [];
  for (const station of data.stations) {
    if (station.body !== body || !inRange(station.date, start, end)) continue;
    const movement = station.motion === "direct"
      ? (locale === "ru" ? "переход к директному движению" : "station direct")
      : (locale === "ru" ? "переход к ретроградному движению" : "station retrograde");
    items.push({ date: station.date, order: 1, text: `${station.date}: ${movement}.` });
  }
  for (const ingress of data.ingresses) {
    if (ingress.body !== body || !inRange(ingress.date, start, end)) continue;
    const signIndex = SIGN_KEYS.indexOf(ingress.sign);
    const sign = locale === "ru"
      ? (SIGN_GENITIVE_RU[ingress.sign] ?? ingress.sign)
      : (signIndex >= 0 ? SIGNS.en[signIndex] : ingress.sign);
    items.push({
      date: ingress.date,
      order: 2,
      text: locale === "ru"
        ? `${ingress.date}: вход в знак ${sign}.`
        : `${ingress.date}: ingress into ${sign}.`,
    });
  }
  return items.sort((a, b) => a.date.localeCompare(b.date) || a.order - b.order);
}

function aspectLines(
  locale: BtcPublicLocale,
  body: string,
  start: string,
  end: string,
): string[] {
  return data.aspects
    .filter((event) =>
      (event.a === body || event.b === body) &&
      event.end >= start &&
      event.start <= end)
    .sort((a, b) => a.peak.localeCompare(b.peak) || a.start.localeCompare(b.start))
    .map((event) => {
      const other = event.a === body ? event.b : event.a;
      const aspect = ASPECT_LABELS[locale][event.angle] ?? `${event.angle}°`;
      return locale === "ru"
        ? `${event.peak}: ${aspect} с ${bodyLabel(locale, other)}; окно ${event.start}–${event.end}, минимальный дневной orb ${event.orb.toFixed(3)}°.`
        : `${event.peak}: ${aspect} to ${bodyLabel(locale, other)}; window ${event.start}–${event.end}, minimum daily orb ${event.orb.toFixed(3)}°.`;
    });
}

function asksForRankedIntensity(question: string): boolean {
  return /(?:most|highest|ranked|top)\s+(?:intense|tension|dates?|days?|windows?)|(?:intense|tension)\s+(?:dates?|days?|windows?)|сам(?:ые|ая|ый)\s+напряж[её]нн|наиболее\s+напряж[её]нн|рейтинг[а-яё]*\s+(?:дат|дн|окон)|напряж[её]нн[а-яё]*\s+(?:дат|дн|окон|период)/i.test(question);
}

function rankedBodyAspectLine(
  locale: BtcPublicLocale,
  body: string,
  event: AspectWindow,
  rank: number,
): string {
  const other = event.a === body ? event.b : event.a;
  const aspect = ASPECT_LABELS[locale][event.angle] ?? `${event.angle}°`;
  return locale === "ru"
    ? `Ранг ${rank} · пик ${event.peak} · окно ${event.start}–${event.end}: ${aspect} с ${bodyLabel(locale, other)}; минимальный дневной orb ${event.orb.toFixed(3)}°.`
    : `Rank ${rank} · peak ${event.peak} · window ${event.start}–${event.end}: ${aspect} to ${bodyLabel(locale, other)}; minimum daily orb ${event.orb.toFixed(3)}°.`;
}

function rankedBodyIntensityAnswer(
  locale: BtcPublicLocale,
  body: string,
  start: string,
  end: string,
): BtcCosmographerAnswerProjection | null {
  const ranked = data.aspects
    .filter((event) =>
      (event.a === body || event.b === body) &&
      event.end >= start &&
      event.start <= end)
    .sort((a, b) => a.orb - b.orb || a.peak.localeCompare(b.peak));
  if (!ranked.length) return null;

  const label = bodyLabel(locale, body);
  const top = ranked.slice(0, 5);
  const first = top[0];
  const firstOther = first.a === body ? first.b : first.a;
  const firstAspect = ASPECT_LABELS[locale][first.angle] ?? `${first.angle}°`;
  return {
    answer_state: "CONFIRMED",
    answer_mode: "ASTRO_INTERVAL",
    headline: locale === "ru"
      ? `${label}: ранжированные напряжённые даты`
      : `${label}: ranked high-intensity dates`,
    direct_answer: locale === "ru"
      ? `По точности опубликованных аспектов ранг 1 занимает ${first.peak}: ${firstAspect} с ${bodyLabel(locale, firstOther)}, минимальный дневной orb ${first.orb.toFixed(3)}°; доказательное окно ${first.start}–${first.end}.`
      : `By exactness of the published aspects, rank 1 is ${first.peak}: ${firstAspect} to ${bodyLabel(locale, firstOther)}, minimum daily orb ${first.orb.toFixed(3)}°; evidence window ${first.start}–${first.end}.`,
    sections: [
      {
        id: "top_dates_or_windows",
        label: locale === "ru" ? "Главные даты и окна — по рейтингу" : "Top dates and windows — ranked",
        bullets: top.map((event, index) => rankedBodyAspectLine(locale, body, event, index + 1)),
      },
      {
        id: "significance",
        label: locale === "ru" ? "Почему они значимы" : "Why they are significant",
        paragraph: locale === "ru"
          ? "Рейтинг отвечает только на вопрос о точности внутри опубликованного набора: меньший минимальный дневной orb получает более высокий ранг; при равенстве раньше идёт более ранний пик. Близкие пики читаются как временная концентрация, но не как причинный механизм."
          : "The ranking answers exactness only within the published set: a smaller minimum daily orb receives the higher rank; ties are ordered by the earlier peak. Nearby peaks are read as a timing concentration, not as a causal mechanism.",
      },
      {
        id: "conditions_and_limits",
        label: locale === "ru" ? "Условия и границы" : "Conditions and limits",
        paragraph: locale === "ru"
          ? `Учтены только опубликованные окна ${label} внутри ${start}–${end}. Рейтинг не измеряет волатильность BTC, не доказывает влияние на цену, не является прогнозом или торговым сигналом.`
          : `Only published ${label} windows within ${start}–${end} are included. The ranking does not measure BTC volatility, prove an effect on price, constitute a forecast, or create a trading signal.`,
      },
    ],
    source_boundary: locale === "ru"
      ? `Источник: публичный астрономический индекс ${data.schema}; ${data.source.engine} ${data.source.version}; ${data.source.mode}; ${data.source.coordinate}; evidence coverage ${data.range.start}–${data.range.end}.`
      : `Source: public astronomical index ${data.schema}; ${data.source.engine} ${data.source.version}; ${data.source.mode}; ${data.source.coordinate}; evidence coverage ${data.range.start}–${data.range.end}.`,
    proof_label: locale === "ru" ? "Астрономические доказательства доступны" : "Astronomical evidence available",
  };
}

function monthlyAnchorLines(
  locale: BtcPublicLocale,
  body: string,
  start: string,
  end: string,
): string[] {
  return data.anchors
    .filter((anchor) => anchor.b[body] && inRange(anchor.date, start, end))
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((anchor) => `${anchor.date}: ${positionText(locale, anchor.b[body])}.`);
}

function motionChangeBrackets(
  locale: BtcPublicLocale,
  body: string,
  start: string,
  end: string,
): string[] {
  const anchors = data.anchors
    .filter((anchor) => anchor.b[body] && anchor.date >= start && anchor.date <= end)
    .sort((a, b) => a.date.localeCompare(b.date));
  const lines: string[] = [];
  for (let index = 1; index < anchors.length; index += 1) {
    const previous = anchors[index - 1];
    const current = anchors[index];
    const previousMotion = previous.b[body][1] < 0 ? "retrograde" : "direct";
    const currentMotion = current.b[body][1] < 0 ? "retrograde" : "direct";
    if (previousMotion === currentMotion) continue;
    const movement = currentMotion === "direct"
      ? (locale === "ru" ? "переход к директному движению" : "a change to direct motion")
      : (locale === "ru" ? "переход к ретроградному движению" : "a change to retrograde motion");
    lines.push(locale === "ru"
      ? `${previous.date}–${current.date}: месячные якоря ограничивают ${movement}; точная дата в публичном индексе не опубликована.`
      : `${previous.date}–${current.date}: monthly anchors bracket ${movement}; the exact date is not published in the public index.`);
  }
  return lines;
}

function limitedAnswer(
  locale: BtcPublicLocale,
  headline: string,
  direct: string,
): BtcCosmographerAnswerProjection {
  return {
    answer_state: "LIMITED",
    answer_mode: "ASTRO_INTERVAL",
    headline,
    direct_answer: direct,
    sections: [],
    source_boundary: locale === "ru"
      ? "Астрономический ответ строится только по опубликованному evidence index и не заменяет отсутствующие данные догадкой."
      : "The astronomical answer uses only the published evidence index and does not replace missing data with a guess.",
    proof_label: locale === "ru" ? "Астрономические доказательства ограничены" : "Astronomical evidence limited",
  };
}

export function buildBtcAstroAnswer(
  locale: BtcPublicLocale,
  route: BtcCosmographerRoute,
): BtcCosmographerAnswerProjection {
  if (!data.bodies.includes(route.subject)) {
    return limitedAnswer(
      locale,
      locale === "ru"
        ? "Для указанного предмета нет принятого астрономического evidence"
        : "No accepted astronomical evidence exists for this subject",
      locale === "ru"
        ? "Космограф не подменяет неизвестный предмет Юпитером или другой планетой. Уточните тело или используйте годовой обзор аспектов планет."
        : "Cosmographer does not replace an unknown subject with Jupiter or another body. Name the body or use the annual planetary-aspect overview.",
    );
  }

  const body = route.subject;
  const label = bodyLabel(locale, body);
  const requested = route.time_range ?? {
    start: data.range.start,
    end: data.range.end,
    label: `${data.range.start} — ${data.range.end}`,
    source: "QUESTION" as const,
  };

  if (requested.end < data.range.start || requested.start > data.range.end) {
    return limitedAnswer(
      locale,
      locale === "ru"
        ? "Запрошенный период пока вне публичного астрономического evidence"
        : "Requested period is outside public astronomical evidence",
      locale === "ru"
        ? `Публичный индекс сейчас покрывает ${data.range.start}–${data.range.end}. Отсутствующие эфемеридные данные не заменяются догадкой.`
        : `The public index currently covers ${data.range.start}–${data.range.end}. Missing ephemeris evidence is not replaced with a guess.`,
    );
  }

  const start = requested.start < data.range.start ? data.range.start : requested.start;
  const end = requested.end > data.range.end ? data.range.end : requested.end;
  if (route.context_relation === "FOLLOW_UP" && asksForRankedIntensity(route.raw_question)) {
    const ranked = rankedBodyIntensityAnswer(locale, body, start, end);
    if (ranked) return ranked;
  }
  const startAnchor = closestAnchor(start, body);
  const endAnchor = closestAnchor(end, body);
  if (!startAnchor || !endAnchor) {
    return limitedAnswer(
      locale,
      locale === "ru" ? "Астрономические данные для тела недоступны" : "Astronomical evidence is unavailable for this body",
      locale === "ru" ? "Положение не будет восстановлено из предположений." : "The position will not be reconstructed from assumptions.",
    );
  }

  const exactEvents = exactEventItems(locale, body, start, end);
  const aspects = aspectLines(locale, body, start, end);
  const anchors = monthlyAnchorLines(locale, body, start, end);
  const brackets = motionChangeBrackets(locale, body, start, end);
  const startText = positionText(locale, startAnchor.b[body]);
  const endText = positionText(locale, endAnchor.b[body]);
  const interval = start !== end || route.intents.includes("interval_analysis");
  const fastBodyLimited = interval && FAST_BODIES.has(body) && exactEvents.length === 0;

  const timeline: TimelineItem[] = [
    {
      date: startAnchor.date,
      order: 0,
      text: locale === "ru"
        ? `Ближайший принятый якорь к началу: ${startAnchor.date} · ${startText}.`
        : `Nearest accepted opening anchor: ${startAnchor.date} · ${startText}.`,
    },
    ...exactEvents,
    {
      date: endAnchor.date,
      order: 3,
      text: locale === "ru"
        ? `Последний доступный месячный якорь к концу периода: ${endAnchor.date} · ${endText}.`
        : `Last available monthly anchor near the period end: ${endAnchor.date} · ${endText}.`,
    },
  ].sort((a, b) => a.date.localeCompare(b.date) || a.order - b.order);

  const direct = locale === "ru"
    ? fastBodyLimited
      ? `${label}: публичный индекс содержит месячные якоря положения, но не публикует точные дневные станции и ингрессии для этого быстрого тела. Поэтому ниже показана доказательная месячная траектория и интервалы смены направления без выдумывания точных дат.`
      : `${label} проходит от ближайшего принятого якоря ${startAnchor.date} (${startText}) к последнему доступному месячному якорю ${endAnchor.date} (${endText}). ${exactEvents.length ? "Точные опубликованные переходы включены в общую хронологию." : "Отдельные дневные переходы в опубликованном индексе не зафиксированы."}`
    : fastBodyLimited
      ? `${label}: the public index contains monthly position anchors but does not publish exact daily stations and ingresses for this fast body. The answer therefore shows the evidence-bound monthly trajectory and motion-change brackets without inventing exact dates.`
      : `${label} moves from the nearest accepted anchor ${startAnchor.date} (${startText}) to the last available monthly anchor ${endAnchor.date} (${endText}). ${exactEvents.length ? "Published exact transitions are included in one chronology." : "No separate daily transition is recorded in the published index."}`;

  const sections: BtcCosmographerAnswerProjection["sections"] = [
    {
      id: "timeline",
      label: locale === "ru" ? "Единая хронология" : "Single chronology",
      bullets: timeline.map((item) => item.text),
    },
  ];

  if (fastBodyLimited && anchors.length) {
    sections.push({
      id: "monthly_anchors",
      label: locale === "ru" ? "Месячные доказательные якоря" : "Monthly evidence anchors",
      bullets: anchors,
    });
  }
  if (brackets.length) {
    sections.push({
      id: "motion_brackets",
      label: locale === "ru" ? "Интервалы смены направления" : "Motion-change brackets",
      bullets: brackets,
    });
  }
  if (aspects.length) {
    sections.push({
      id: "aspects",
      label: locale === "ru" ? "Структурные аспекты" : "Structural aspects",
      bullets: aspects,
    });
  }

  sections.push({
    id: "interpretation",
    label: locale === "ru" ? "Как читать результат" : "How to read it",
    paragraph: locale === "ru"
      ? "Это описание наблюдаемой конфигурации и её переходов. Совпадение с рынком не является доказательством причинного влияния на цену BTC."
      : "This describes the observed configuration and its transitions. A market coincidence is not proof of a causal effect on BTC price.",
  });

  return {
    answer_state: fastBodyLimited ? "LIMITED" : "CONFIRMED",
    answer_mode: interval ? "ASTRO_INTERVAL" : "ASTRO_STATE",
    headline: locale === "ru"
      ? (interval ? `${label}: движение в периоде ${requested.label}` : `${label}: состояние на выбранную дату`)
      : (interval ? `${label}: movement across ${requested.label}` : `${label}: state at the selected date`),
    direct_answer: direct,
    sections,
    source_boundary: locale === "ru"
      ? `Источник: публичный астрономический индекс ${data.schema}; ${data.source.mode}, ${data.source.coordinate}; месячные якоря и опубликованные дневные окна событий. Диапазон ${data.range.start}–${data.range.end}.`
      : `Source: public astronomical index ${data.schema}; ${data.source.mode}, ${data.source.coordinate}; monthly anchors and published daily event windows. Range ${data.range.start}–${data.range.end}.`,
    proof_label: locale === "ru" ? "Астрономические доказательства доступны" : "Astronomical evidence available",
  };
}

export function buildAstroBtcBridgeBoundary(
  locale: BtcPublicLocale,
  astro: BtcCosmographerAnswerProjection,
): BtcCosmographerAnswerProjection {
  return {
    ...astro,
    answer_state: "SPLIT",
    answer_mode: "ASTRO_BTC_BRIDGE",
    headline: locale === "ru"
      ? "Астрономические данные и BTC читаются как независимые слои"
      : "Astronomical data and BTC are read as independent layers",
    direct_answer: locale === "ru"
      ? `${astro.direct_answer} Рыночная часть должна быть проверена отдельным Snapshot; временное совпадение не доказывает влияние.`
      : `${astro.direct_answer} The market side must be checked against a separate Snapshot; timing coincidence does not prove influence.`,
    sections: [
      ...astro.sections,
      {
        id: "bridge_boundary",
        label: locale === "ru" ? "Граница сопоставления" : "Comparison boundary",
        paragraph: locale === "ru"
          ? "Разрешено сравнивать даты, состояния и расхождения. Это сопоставление само по себе не создаёт причинного вывода или торгового сигнала."
          : "Dates, states, and divergences may be compared. The comparison itself does not create a causal conclusion or trading signal.",
      },
    ],
  };
}
