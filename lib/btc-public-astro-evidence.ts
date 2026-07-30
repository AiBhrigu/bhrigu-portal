import astroEvidence from "../data/btc_public_astro_evidence_v0_1.json";
import type { BtcCosmographerRoute } from "./btc-cosmographer-route-graph";
import type { BtcCosmographerAnswerProjection } from "./btc-protocol-evidence";
import type { BtcPublicLocale } from "./btc-public-language-contract";

type BodyState = [number, number];
type Anchor = {
  date: string;
  b: Record<string, BodyState>;
};
type Ingress = {
  date: string;
  body: string;
  sign: string;
};
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

const data = astroEvidence as PublicAstroEvidence;

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

const BODY_LABELS: Record<BtcPublicLocale, Record<string, string>> = {
  en: {
    sun: "Sun",
    moon: "Moon",
    mercury: "Mercury",
    venus: "Venus",
    mars: "Mars",
    jupiter: "Jupiter",
    saturn: "Saturn",
    uranus: "Uranus",
    neptune: "Neptune",
    pluto: "Pluto",
  },
  ru: {
    sun: "Солнце",
    moon: "Луна",
    mercury: "Меркурий",
    venus: "Венера",
    mars: "Марс",
    jupiter: "Юпитер",
    saturn: "Сатурн",
    uranus: "Уран",
    neptune: "Нептун",
    pluto: "Плутон",
  },
};

const ASPECT_LABELS: Record<BtcPublicLocale, Record<number, string>> = {
  en: {
    0: "conjunction",
    60: "sextile",
    90: "square",
    120: "trine",
    180: "opposition",
  },
  ru: {
    0: "соединение",
    60: "секстиль",
    90: "квадрат",
    120: "трин",
    180: "оппозиция",
  },
};

const SIGN_KEYS = [
  "aries", "taurus", "gemini", "cancer", "leo", "virgo",
  "libra", "scorpio", "sagittarius", "capricorn", "aquarius", "pisces",
];

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

function positionText(
  locale: BtcPublicLocale,
  state: BodyState,
): string {
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

function eventLines(
  locale: BtcPublicLocale,
  body: string,
  start: string,
  end: string,
): string[] {
  const lines: string[] = [];
  for (const station of data.stations) {
    if (station.body !== body || !inRange(station.date, start, end)) continue;
    const movement = station.motion === "direct"
      ? (locale === "ru" ? "переход к директному движению" : "station direct")
      : (locale === "ru" ? "переход к ретроградному движению" : "station retrograde");
    lines.push(`${station.date}: ${movement}.`);
  }
  for (const ingress of data.ingresses) {
    if (ingress.body !== body || !inRange(ingress.date, start, end)) continue;
    const signIndex = SIGN_KEYS.indexOf(ingress.sign);
    const sign = signIndex >= 0 ? SIGNS[locale][signIndex] : ingress.sign;
    lines.push(locale === "ru"
      ? `${ingress.date}: вход в ${sign}.`
      : `${ingress.date}: ingress into ${sign}.`);
  }
  return lines;
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
    .map((event) => {
      const other = event.a === body ? event.b : event.a;
      const aspect = ASPECT_LABELS[locale][event.angle] ?? `${event.angle}°`;
      return locale === "ru"
        ? `${event.peak}: ${aspect} с ${bodyLabel(locale, other)}; окно ${event.start}–${event.end}, минимальный дневной orb ${event.orb.toFixed(3)}°.`
        : `${event.peak}: ${aspect} to ${bodyLabel(locale, other)}; window ${event.start}–${event.end}, minimum daily orb ${event.orb.toFixed(3)}°.`;
    });
}

function unavailableAnswer(
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
      ? "Astromodule отвечает только по опубликованному checksum-bound evidence index и не заменяет отсутствующие данные догадкой."
      : "Astromodule answers only from the published checksum-bound evidence index and does not replace missing data with a guess.",
    proof_label: locale === "ru" ? "Astro proof ограничен" : "Astro proof limited",
  };
}

export function buildBtcAstroAnswer(
  locale: BtcPublicLocale,
  route: BtcCosmographerRoute,
): BtcCosmographerAnswerProjection {
  const body = data.bodies.includes(route.subject) ? route.subject : "jupiter";
  const label = bodyLabel(locale, body);
  const requested = route.time_range ?? {
    start: data.range.start,
    end: data.range.end,
    label: `${data.range.start} — ${data.range.end}`,
    source: "QUESTION" as const,
  };

  if (requested.end < data.range.start || requested.start > data.range.end) {
    return unavailableAnswer(
      locale,
      locale === "ru"
        ? "Запрошенный период пока вне публичного Astro Evidence"
        : "Requested period is outside public Astro Evidence",
      locale === "ru"
        ? `Публичный индекс сейчас покрывает ${data.range.start}–${data.range.end}. Я не буду заменять отсутствующие эфемеридные данные догадкой.`
        : `The public index currently covers ${data.range.start}–${data.range.end}. Missing ephemeris evidence will not be replaced with a guess.`,
    );
  }

  const start = requested.start < data.range.start
    ? data.range.start
    : requested.start;
  const end = requested.end > data.range.end
    ? data.range.end
    : requested.end;
  const startAnchor = closestAnchor(start, body);
  const endAnchor = closestAnchor(end, body);

  if (!startAnchor || !endAnchor) {
    return unavailableAnswer(
      locale,
      locale === "ru"
        ? "Astro Evidence для тела недоступен"
        : "Astro Evidence is unavailable for this body",
      locale === "ru"
        ? "Положение не будет восстановлено из предположений."
        : "The position will not be reconstructed from assumptions.",
    );
  }

  const events = eventLines(locale, body, start, end);
  const aspects = aspectLines(locale, body, start, end);
  const startText = positionText(locale, startAnchor.b[body]);
  const endText = positionText(locale, endAnchor.b[body]);
  const interval = start !== end || route.intents.includes("interval_analysis");

  const direct = locale === "ru"
    ? `${label} проходит от ближайшего принятого якоря ${startAnchor.date} (${startText}) к ${endAnchor.date} (${endText}). ${events.length ? "Внутри периода есть подтверждённые переходы движения или знака." : "Отдельный переход движения или знака в этом диапазоне не зафиксирован."}`
    : `${label} moves from the nearest accepted anchor ${startAnchor.date} (${startText}) to ${endAnchor.date} (${endText}). ${events.length ? "The interval contains accepted motion or sign transitions." : "No separate motion or sign transition is recorded in this interval."}`;

  const sections: BtcCosmographerAnswerProjection["sections"] = [
    {
      id: "timeline",
      label: locale === "ru" ? "Временная линия" : "Timeline",
      bullets: [
        locale === "ru"
          ? `Начальный якорь: ${startAnchor.date} · ${startText}.`
          : `Opening anchor: ${startAnchor.date} · ${startText}.`,
        ...events,
        locale === "ru"
          ? `Конечный якорь: ${endAnchor.date} · ${endText}.`
          : `Closing anchor: ${endAnchor.date} · ${endText}.`,
      ],
    },
  ];

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
      ? "Это описание наблюдаемой конфигурации и её переходов. Слово «влияние» здесь не превращается в причинное утверждение о цене BTC."
      : "This describes the observed configuration and its transitions. The word “influence” does not turn it into a causal claim about BTC price.",
  });

  return {
    answer_state: "CONFIRMED",
    answer_mode: interval ? "ASTRO_INTERVAL" : "ASTRO_STATE",
    headline: locale === "ru"
      ? (interval
          ? `${label}: движение в периоде ${requested.label}`
          : `${label}: состояние на выбранную дату`)
      : (interval
          ? `${label}: movement across ${requested.label}`
          : `${label}: state at the selected date`),
    direct_answer: direct,
    sections,
    source_boundary: locale === "ru"
      ? `Источник: Public Astromodule Evidence ${data.schema}; ${data.source.mode}, ${data.source.coordinate}; месячные якоря и дневные окна событий. Публичный диапазон ${data.range.start}–${data.range.end}.`
      : `Source: Public Astromodule Evidence ${data.schema}; ${data.source.mode}, ${data.source.coordinate}; monthly anchors and daily event windows. Public range ${data.range.start}–${data.range.end}.`,
    proof_label: locale === "ru" ? "Astro proof доступен" : "Astro proof available",
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
      ? "Astromodule и BTC нужно читать как два независимых слоя"
      : "Astromodule and BTC must be read as two independent layers",
    direct_answer: locale === "ru"
      ? `${astro.direct_answer} Рыночная часть должна быть проверена отдельным Snapshot; совпадение по времени не доказывает влияние.`
      : `${astro.direct_answer} The market side must be checked against a separate Snapshot; timing coincidence does not prove influence.`,
    sections: [
      ...astro.sections,
      {
        id: "bridge_boundary",
        label: locale === "ru" ? "Граница моста Astro × BTC" : "Astro × BTC bridge boundary",
        paragraph: locale === "ru"
          ? "Разрешено сравнивать даты, состояния и расхождения. Запрещено превращать совпадение в причинность, прогноз или торговый сигнал."
          : "Dates, states and divergences may be compared. Coincidence may not be converted into causality, a forecast or a trading signal.",
      },
    ],
  };
}
