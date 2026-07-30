import astroEvidence from "../data/btc_public_astro_evidence_v0_1.json";
import type { BtcPublicLocale } from "./btc-public-language-contract";
import type { BtcCosmographerRoute } from "./btc-cosmographer-route-graph";
import type { BtcCosmographerAnswerProjection } from "./btc-protocol-evidence";

type BodyState = [number, number];
type Anchor = {
  date: string;
  b: Record<string, BodyState>;
};
type Ingress = { date: string; body: string; sign: string };
type Station = { date: string; body: string; motion: "direct" | "retrograde" };
type AspectWindow = {
  start: string;
  end: string;
  peak: string;
  a: string;
  b: string;
  angle: number;
  orb: number;
};

const data = astroEvidence as unknown as {
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

const SIGNS: Record<BtcPublicLocale, string[]> = {
  en: ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"],
  ru: ["–û–≤–µ–µ", "–¢–µ–ª—å—Ü–µ", "–ë–ª–∏–∑–Ω–µ—Ü–∞—Ö", "–†–∞–∫–µ", "–õ—å–≤–µ", "–î–µ–≤–µ", "–í–µ—Å–∞—Ö", "–°–∫–æ—Ä–ø–∏–æ–Ω–µ", "–°—Ç—Ä–µ–ª—å—Ü–µ", "–ö–æ–∑–µ—Ä–æ–≥–µ", "–í–æ–¥–æ–ª–µ–µ", "–†—ã–±–∞—Ö"],
};

const BODY_LABEL: Record<BtcPublicLocale, Record<string, string>> = {
  en: {
    sun: "Sun", moon: "Moon", mercury: "Mercury", venus: "Venus", mars: "Mars",
    jupiter: "Jupiter", saturn: "Saturn", uranus: "Uranus", neptune: "Neptune", pluto: "Pluto",
  },
  ru: {
    sun: "–°–æ–ª–Ω—Ü–µ", moon: "–õ—É–Ω–∞", mercury: "–ú–µ—Ä–∫—É—Ä–∏–π", venus: "–í–µ–Ω–µ—Ä–∞", mars: "–ú–∞—Ä—Å",
    jupiter: "–Æ–ø–∏—Ç–µ—Ä", saturn: "–°–∞—Ç—É—Ä–Ω", uranus: "–£—Ä–∞–Ω", neptune: "–ù–µ–ø—Ç—É–Ω", pluto: "–ü–ª—É—Ç–æ–Ω",
  },
};

const ASPECT_LABEL: Record<BtcPublicLocale, Record<number, string>> = {
  en: { 0: "conjunction", 60: "sextile", 90: "square", 120: "trine", 180: "opposition" },
  ru: { 0: "—Å–æ–µ–¥–∏–Ω–µ–Ω–∏–µ", 60: "—Å–µ–∫—Å—Ç–∏–ª—å", 90: "–∫–≤–∞–¥—Ä–∞—Ç", 120: "—Ç—Ä–∏–Ω", 180: "–æ–ø–ø–æ–∑–∏—Ü–∏—è" },
};

function bodyLabel(locale: BtcPublicLocale, body: string): string {
  return BODY_LABEL[locale][body] ?? body;
}

function inRange(date: string, start: string, end: string): boolean {
  return date >= start && date <= end;
}

function closestAnchor(target: string, body: string): Anchor | null {
  const eligible = data.anchors.filter((anchor) => anchor.b[body]);
  if (!eligible.length) return null;
  const targetMs = new Date(`${target}T00:00:00Z`).getTime();
  return eligible.reduce((best, anchor) => {
    const distance = Math.abs(new Date(`${anchor.date}T00:00:00Z`).getTime() - targetMs);
    const bestDistance = Math.abs(new Date(`${best.date}T00:00:00Z`).getTime() - targetMs);
    return distance < bestDistance ? anchor : best;
  });
}

function positionText(locale: BtcPublicLocale, state: BodyState): string {
  const [longitude, speed] = state;
  const signIndex = Math.floor(((longitude % 360) + 360) % 360 / 30);
  const degree = longitude - signIndex * 30;
  const motion = speed < 0
    ? (locale === "ru" ? "—Ä–µ—Ç—Ä–æ–≥—Ä–∞–¥–Ω–æ" : "retrograde")
    : (locale === "ru" ? "–¥–∏—Ä–µ–∫—Ç–Ω–æ" : "direct");
  return locale === "ru"
    ? `${degree.toFixed(1)}¬∞ –≤ ${SIGNS.ru[signIndex]}, ${motion}`
    : `${degree.toFixed(1)}¬∞ ${SIGNS.en[signIndex]}, ${motion}`;
}

function eventLines(
  locale: BtcPublicLocale,
  body: string,
  start: string,
  end: string,
): string[] {
  const lines: string[] = [];
  for (const station of data.stations.filter((event) => event.body === body && inRange(event.date, start, end))) {
    const motion = station.motion === "direct"
      ? (locale === "ru" ? "–ø–µ—Ä–µ—Ö–æ–¥ –∫ –¥–∏—Ä–µ–∫—Ç–Ω–æ–º—É –¥–≤–∏–∂–µ–Ω–∏—é" : "station direct")
      : (locale === "ru" ? "–ø–µ—Ä–µ—Ö–æ–¥ –∫ —Ä–µ—Ç—Ä–æ–≥—Ä–∞–¥–Ω–æ–º—É –¥–≤–∏–∂–µ–Ω–∏—é" : "station retrograde");
    lines.push(`${station.date}: ${motion}.`);
  }
  for (const ingress of data.ingresses.filter((event) => event.body === body && inRange(event.date, start, end))) {
    const signIndex = ["aries","taurus","gemini","cancer","leo","virgo","libra","scorpio","sagittarius","capricorn","aquarius","pisces"].indexOf(ingress.sign);
    lines.push(locale === "ru"
      ? `${ingress.date}: –≤—Ö–æ–¥ –≤ ${SIGNS.ru[signIndex]}.`
      : `${ingress.date}: ingress into ${SIGNS.en[signIndex]}.`);
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
      const aspect = ASPECT_LABEL[locale][event.angle] ?? `${event.angle}¬∞`;
      return locale === "ru"
        ? `${event.peak}: ${aspect} —Å ${bodyLabel(locale, other)}; –æ–∫–Ω–æ ${event.start}‚Äì${event.end}, –º–∏–Ω–∏–º–∞–ª—å–Ω—ã–π –¥–Ω–µ–≤–Ω–æ–π orb ${event.orb.toFixed(3)}¬∞.`
        : `${event.peak}: ${aspect} to ${bodyLabel(locale, other)}; window ${event.start}‚Äì${event.end}, minimum daily orb ${event.orb.toFixed(3)}¬∞.`;
    });
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
    label: `${data.range.start} ‚Äî ${data.range.end}`,
    source: "QUESTION" as const,
  };
  const start = requested.start < data.range.start ? data.range.start : requested.start;
  const end = requested.end > data.range.end ? data.range.end : requested.end;
  const outside = requested.end < data.range.start || requested.start > data.range.end;
  if (outside) {
    return {
      answer_state: "LIMITED",
      answer_mode: "ASTRO_INTERVAL",
      headline: locale === "ru" ? "–ó–∞–ø—Ä–æ—à–µ–Ω–Ω—ã–π –ø–µ—Ä–∏–æ–¥ –ø–æ–∫–∞ –≤–Ω–µ –ø—É–±–ª–∏—á–Ω–æ–≥–æ Astro Evidence" : "Requested period is outside public Astro Evidence",
      direct_answer: locale === "ru"
        ? `–ü—É–±–ª–∏—á–Ω—ã–π –∏–Ω–¥–µ–∫—Å —Å–µ–π—á–∞—Å –ø–æ–∫—Ä—ã–≤–∞–µ—Ç ${data.range.start}‚Äì${data.range.end}. –Ø –Ω–µ –±—É–¥—É –∑–∞–º–µ–Ω—è—Ç—å –æ—Ç—Å—É—Ç—Å—Ç–≤—É—é—â–∏–µ —ç—Ä–µ–º–µ—Ä–∏–¥—ã –¥–æ–≥–∞–¥–∫–æ–π.`
        : `The public index currently covers ${data.range.start}‚Äì${data.range.end}. Missing ephemeris evidence will not be replaced with a guess.`,
      sections: [{
        id: "available_range",
        label: locale === "ru" ? "–î–æ—Å—Ç—É–ø–Ω—ã–π –¥–∏–∞–ø–∞–∑–æ–Ω" : "Available range",
        paragraph: `${data.range.start} ‚Äî ${data.range.end}`,
      }],
      source_boundary: locale === "ru"
        ? "Astromodule –æ—Ç–≤–µ—á–∞–µ—Ç —Ç–æ–ª—å–∫–æ –ø–æ –æ–ø—É–±–ª–∏–∫–æ–≤–∞–Ω–Ω–æ–º—É checksum-bound evidence index."
        : "Astromodule answers only from the published checksum-bound evidence index.",
      proof_label: locale === "ru" ? "Astro proof –æ–≥—Ä–∞–Ω–∏—á–µ–Ω –¥–∏–∞–ø–∞–∑–æ–Ω–æ–º" : "Astro proof is range-limited",
    };
  }

  const startAnchor = closestAnchor(start, body);
  const endAnchor = closestAnchor(end, body);
  if (!startAnchor || !endAnchor) {
    return {
      answer_state: "LIMITED",
      answer_mode: "ASTRO_STATE",
      headline: locale === "ru" ? "Astro Evidence –¥–ª—è —Ç–µ–ª–∞ –Ω–µ–¥–æ—Å—Ç—É–ø–µ–Ω" : "Astro Evidence is unavailable for this body",
      direct_answer: locale === "ru" ? "–ü–æ–ª–æ–∂–µ–Ω–∏–µ –Ω–µ –±—É–¥–µ—Ç –≤–æ—Å—Å—Ç–∞–Ω–æ–≤–ª–µ–Ω–æ –∏–∑ –ø—Ä–µ–¥–ø–æ–ª–æ–∂–µ–Ω–∏–π." : "The position will not be reconstructed from assumptions.",
      sections: [],
      source_boundary: locale === "ru" ? "–¢—Ä–µ–±—É–µ—Ç—Å—è –ø—Ä–∏–Ω—è—Ç—ã–π Astromodule packet." : "An accepted Astromodule packet is required.",
      proof_label: locale === "ru" ? "Astro proof –Ω–µ–¥–æ—Å—Ç—É–ø–µ–Ω" : "Astro proof unavailable",
    };
  }

  const eventEvidence = eventLines(locale, body, start, end);
  const aspects = aspectLines(locale, body, start, end);
  const startText = positionText(locale, startAnchor.b[body]);
  const endText = positionText(locale, endAnchor.b[body]);
  const isInterval = start !== end || route.intents.includes("interval_analysis");
  const headline = locale === "ru"
    ? (isInterval ? `${label}: –¥–≤–∏–∂–µ–Ω–∏–µ –≤ –ø–µ—Ä–∏–æ–¥–µ ${requested.label}` : `${label}: —Å–æ—Å—Ç–æ—è–Ω–∏–µ –Ω–∞ –≤—ã–±—Ä–∞–Ω–Ω—É—é –¥–∞—Ç—É`)
    : (isInterval ? `${label}: movement across ${requested.label}` : `${label}: state at the selected date`);
  const direct = locale === "ru"
    ? `${label} –ø—Ä–æ—Ö–æ–¥–∏—Ç –æ—Ç –±–ª–∏–∂–∞–π—à–µ–≥–æ –ø—Ä–∏–Ω—è—Ç–æ–≥–æ —è–∫–æ—Ä—è ${startAnchor.date} (${startText}) –∫ ${endAnchor.date} (${endText}). ${eventEvidence.length ? "–í–Ω—É—Ç—Ä–∏ –ø–µ—Ä–∏–æ–¥–∞ –µ—Å—Ç—å –ø–æ–¥—Ç–≤–µ—Ä–∂–¥—ë–Ω–Ω—ã–µ –ø–µ—Ä–µ—Ö–æ–¥—ã –¥–≤–∏–∂–µ–Ω–∏—è –∏–ª–∏ –∑–Ω–∞–∫–∞." : "–û—Ç–¥–µ–ª—å–Ω—ã–π –ø–µ—Ä–µ—Ö–æ–¥ –¥–≤–∏–∂–µ–Ω–∏—è –∏–ª–∏ –∑–Ω–∞–∫–∞ –≤ —ç—Ç–æ–º –¥–∏–∞–ø–∞–∑–æ–Ω–µ –Ω–µ –∑–∞—Ñ–∏–∫—Å–∏—Ä–æ–≤–∞–Ω."}`
    : `${label} moves from the nearest accepted anchor ${startAnchor.date} (${startText}) to ${endAnchor.date} (${endText}). ${eventEvidence.length ? "The interval contains accepted motion or sign transitions." : "No separate motion or sign transition is recorded in this interval."}`;

  const sections: BtcCosmographerAnswerProjection["sections"] = [
    {
      id: "timeline",
      label: locale === "ru" ? "–í—Ä–µ–º–µ–Ω–Ω–∞—è –ª–∏–Ω–∏—è" : "Timeline",
      bullets: [
        locale === "ru" ? `–ù–∞—á–∞–ª—å–Ω—ã–π —è–∫–æ—Ä—å: ${startAnchor.date} ¬∑ ${startText}.` : `Opening anchor: ${startAnchor.date} ¬∑ ${startText}.`,
        ...eventEvidence,
        locale === "ru" ? `–ö–æ–Ω–µ—á–Ω—ã–π —è–∫–æ—Ä—å: ${endAnchor.date} ¬∑ ${endText}.` : `Closing anchor: ${endAnchor.date} ¬∑ ${endText}.`,
      ],
    },
  ];
  if (aspects.length) {
    sections.push({
      id: "aspects",
      label: locale === "ru" ? "–°—Ç—Ä—É–∫—Ç—É—Ä–Ω—ã–µ –∞—Å–ø–µ–∫—Ç—ã" : "Structural aspects",
      bullets: aspects,
    });
  }
  sections.push({
    id: "interpretation",
    label: locale === "ru" ? "–ö–∞–∫ —á–∏—Ç–∞—Ç—å —Ä–µ–∑—É–ª—å—Ç–∞—Ç" : "How to read it",
    paragraph: locale === "ru"
      ? "–≠—Ç–æ –æ–ø–∏—Å–∞–Ω–∏–µ –Ω–∞–±–ª—é–¥–∞–µ–º–æ–π –∫–æ–Ω—Ñ–∏–≥—É—Ä–∞—Ü–∏–∏ –∏ –µ—ë –ø–µ—Ä–µ—Ö–æ–¥–æ–≤. –°–ª–æ–≤–æ ¬´–≤–ª–∏—è–Ω–∏–µ¬ª –∑–¥–µ—Å—å –Ω–µ –ø—Ä–µ–≤—Ä–∞—â–∞–µ—Ç—Å—è –≤ –ø—Ä–∏—á–∏–Ω–Ω–æ–µ —É—Ç–≤–µ—Ä–∂–¥–µ–Ω–∏–µ –æ —Ü–µ–Ω–µ BTC."
      : "This describes the observed configuration and its transitions. The word ‚Äúinfluence‚Äù does not turn it into a causal claim about BTC price.",
  });

  return {
    answer_state: "CONFIRMED",
    answer_mode: "ASTRO_INTERVAL",
    headline,
    direct_answer: direct,
    sections,
    source_boundary: locale === "ru"
      ? `–ò—Å—Ç–æ—á–Ω–∏–∫: Public Astromodule Evidence ${data.schema}; ${data.source.mode}, ${data.source.coordinate}; –º–µ—Å—è—á–Ω—ã–µ —è–∫–æ—Ä—è –∏ –¥–Ω–µ–≤–Ω—ã–µ –æ–∫–Ω–∞ —Å–æ–±—ã—Ç–∏–π. –ü—É–±–ª–∏—á–Ω—ã–π –¥–∏–∞–ø–∞–∑–æ–Ω ${data.range.start}‚Äì${data.range.end}.`
      : `Source: Public Astromodule Evidence ${data.schema}; ${data.source.mode}, ${data.source.coordinate}; monthly anchors and daily event windows. Public range ${data.range.start}‚Äì${data.range.end}.`,
    proof_label: locale === "ru" ? "Astro proof –¥–æ—Å—Ç—É–ø–µ–Ω" : "Astro proof available",
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
      ? "Astromodule –∏ BTC –Ω—É–∂–Ω–æ —á–∏—Ç–∞—Ç—å –∫–∞–∫ –¥–≤–∞ –Ω–µ–∑–∞–≤–∏—Å–∏–º—ã—Ö —Å–ª¬˚F<à(ÄÄÄÄÄÄËÄâÕ—…ΩµΩë’±îÅÖπêÅ	QÅµ’Õ–ÅâîÅ…ïÖêÅÖÃÅ—›ºÅ•πëï¡ïπëïπ–Å±ÖÂï…Ãà∞(ÄÄÄÅë•…ïç—}ÖπÕ›ï»ËÅ±ΩçÖ±îÄÙÙÙÄâ…‘à(ÄÄÄÄÄÄ¸ÅÄëÌÖÕ—…ºπë•…ïç—}ÖπÕ›ï…ÙÉBÉF/B˜B˚FB˜B√F<ÉFB√FFF0ÉB”B˚BÔB€B˜B¿ÉB«F/FF0ÉBˇFB˚BÀB◊FB◊B˜B¿ÉB˚FB”B◊BÔF3B˜F/BÅMπÖ¡Õ°Ω–ÏÉFB˚BÀBˇB√B”B◊B˜B„B‘ÉBˇB¯ÉBÀFB◊BÛB◊B˜B‡ÉB˜B‘ÉB”B˚BÎB√BﬂF/BÀB√B◊FÉBÀBÔB„F?B˜B„B‘πÄ(ÄÄÄÄÄÄËÅÄëÌÖÕ—…ºπë•…ïç—}ÖπÕ›ï…ÙÅQ°îÅµÖ…≠ï–ÅÕ•ëîÅµ’Õ–ÅâîÅç°ïç≠ïêÅÖùÖ•πÕ–ÅÑÅÕï¡Ö…Ö—îÅMπÖ¡Õ°Ω–ÏÅ—•µ•πúÅçΩ•πç•ëïπçîÅëΩïÃÅπΩ–Å¡…ΩŸîÅ•πô±’ïπçîπÄ∞(ÄÄÄÅÕïç—•ΩπÃËÅl(ÄÄÄÄÄÄ∏∏πÖÕ—…ºπÕïç—•ΩπÃ∞(ÄÄÄÄÄÅÏ(ÄÄÄÄÄÄÄÅ•êËÄââ…•ëùï}âΩ’πëÖ…‰à∞(ÄÄÄÄÄÄÄÅ±Öâï∞ËÅ±ΩçÖ±îÄÙÙÙÄâ…‘àÄ¸ÄãBOFB√B˜B„FB¿ÉBÛB˚FFB¿ÅÕ—…ºÉ\Å	QàÄËÄâÕ—…ºÉ\Å	QÅâ…•ëùîÅâΩ’πëÖ…‰à∞(ÄÄÄÄÄÄÄÅ¡Ö…Öù…Ö¡†ËÅ±ΩçÖ±îÄÙÙÙÄâ…‘à(ÄÄÄÄÄÄÄÄÄÄ¸ÄãBÉB√BﬂFB◊F#B◊B˜B¯ÉFFB√BÀB˜B„BÀB√FF0ÉB”B√FF,∞ÉFB˚FFB˚F?B˜B„F<ÉB‡ÉFB√FFB˚B€B”B◊B˜B„F<∏ÉB_B√BˇFB◊F'B◊B˜B¯ÉBˇFB◊BÀFB√F'B√FF0ÉB˚BÀBˇB√B”B◊B˜B„B‘ÉB»ÉBˇFB„FB„B˜B˜B˚FFF0∞ÉBˇFB˚BœB˜B˚B‹ÉB„BÔB‡ÉFB˚FBœB˚BÀF/B‰ÉFB„BœB˜B√BÏ∏à(ÄÄÄÄÄÄÄÄÄÄËÄâÖ—ïÃ∞ÅÕ—Ö—ïÃÅÖπêÅë•Ÿï…ùïπçïÃÅµÖ‰ÅâîÅçΩµ¡Ö…ïê∏ÅΩ•πç•ëïπçîÅµÖ‰ÅπΩ–ÅâîÅçΩπŸï…—ïêÅ•π—ºÅçÖ’ÕÖ±•—‰∞ÅÑÅôΩ…ïçÖÕ–ÅΩ»ÅÑÅ—…Öë•πúÅÕ•ùπÖ∞∏à∞(ÄÄÄÄÄÅÙ∞(ÄÄÄÅt∞(ÄÅÙÏ)Ù