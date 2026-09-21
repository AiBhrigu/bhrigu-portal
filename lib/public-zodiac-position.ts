export type ZodiacLocale = "en" | "ru";

const SIGNS: Record<ZodiacLocale, readonly string[]> = {
  en: ["Aries","Taurus","Gemini","Cancer","Leo","Virgo","Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"],
  ru: ["Овен","Телец","Близнецы","Рак","Лев","Дева","Весы","Скорпион","Стрелец","Козерог","Водолей","Рыбы"],
};

const ARCSECONDS_PER_DEGREE = 3600;
const ARCSECONDS_PER_SIGN = 30 * ARCSECONDS_PER_DEGREE;
const ARCSECONDS_PER_CIRCLE = 360 * ARCSECONDS_PER_DEGREE;

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

export function normalizeZodiacLongitude(value: number): number {
  if (!Number.isFinite(value)) throw new RangeError("longitude must be finite");
  const normalized = ((value % 360) + 360) % 360;
  return Object.is(normalized, -0) ? 0 : normalized;
}

export function projectZodiacPosition(value: number) {
  const normalized = normalizeZodiacLongitude(value);
  const roundedArcseconds = Math.round(normalized * ARCSECONDS_PER_DEGREE + 1e-9);
  const totalArcseconds = ((roundedArcseconds % ARCSECONDS_PER_CIRCLE) + ARCSECONDS_PER_CIRCLE) % ARCSECONDS_PER_CIRCLE;
  const signIndex = Math.floor(totalArcseconds / ARCSECONDS_PER_SIGN);
  const withinSign = totalArcseconds - signIndex * ARCSECONDS_PER_SIGN;
  const degree = Math.floor(withinSign / ARCSECONDS_PER_DEGREE);
  const minute = Math.floor((withinSign % ARCSECONDS_PER_DEGREE) / 60);
  const second = withinSign % 60;
  return { normalized, totalArcseconds, signIndex, degree, minute, second };
}

export function formatSexagesimalPosition(value: number): string {
  const { degree, minute, second } = projectZodiacPosition(value);
  return `${degree}°${pad2(minute)}′${pad2(second)}″`;
}

export function formatZodiacPosition(value: number, locale: ZodiacLocale): string {
  const projected = projectZodiacPosition(value);
  return `${SIGNS[locale][projected.signIndex]} ${formatSexagesimalPosition(value)}`;
}

export function zodiacSignName(value: number, locale: ZodiacLocale): string {
  const { signIndex } = projectZodiacPosition(value);
  return SIGNS[locale][signIndex];
}
