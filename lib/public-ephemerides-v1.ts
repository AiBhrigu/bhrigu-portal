import evidenceJson from "../data/btc_public_astro_evidence_v0_1.json";

export type PublicAstroLocale = "en" | "ru";
export const PUBLIC_EPHEMERIDES_YEAR = 2026;

const evidence = evidenceJson as unknown as {
  schema: string;
  source: { engine: string; version: string; mode: string; coordinate: string; sample: string; research_orb_deg: number };
  range: { start: string; end: string };
  anchors: Array<{ date: string; b: Record<string, [number, number]> }>;
  stations: Array<{ date: string; body: string; motion: string }>;
  ingresses: Array<{ date: string; body: string; sign: string }>;
  aspects: Array<{ start: string; end: string; peak: string; a: string; b: string; angle: number; orb: number }>;
};

const SIGNS_EN = ["Aries","Taurus","Gemini","Cancer","Leo","Virgo","Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"];
const SIGNS_RU = ["Овен","Телец","Близнецы","Рак","Лев","Дева","Весы","Скорпион","Стрелец","Козерог","Водолей","Рыбы"];
const BODY_EN: Record<string,string> = {sun:"Sun",moon:"Moon",mercury:"Mercury",venus:"Venus",mars:"Mars",jupiter:"Jupiter",saturn:"Saturn",uranus:"Uranus",neptune:"Neptune",pluto:"Pluto"};
const BODY_RU: Record<string,string> = {sun:"Солнце",moon:"Луна",mercury:"Меркурий",venus:"Венера",mars:"Марс",jupiter:"Юпитер",saturn:"Сатурн",uranus:"Уран",neptune:"Нептун",pluto:"Плутон"};
const ASPECT_EN: Record<number,string> = {0:"Conjunction",60:"Sextile",90:"Square",120:"Trine",180:"Opposition"};
const ASPECT_RU: Record<number,string> = {0:"Соединение",60:"Секстиль",90:"Квадрат",120:"Трин",180:"Оппозиция"};

function pad(n:number){ return String(n).padStart(2,"0"); }
function bodyName(body:string, locale:PublicAstroLocale){ return (locale === "ru" ? BODY_RU : BODY_EN)[body] ?? body; }
function signName(index:number, locale:PublicAstroLocale){ return (locale === "ru" ? SIGNS_RU : SIGNS_EN)[index] ?? ""; }
function signFromKey(value:string, locale:PublicAstroLocale){ const index=SIGNS_EN.findIndex(x=>x.toLowerCase()===value.toLowerCase()); return index>=0?signName(index,locale):value; }
function motionLabel(value:string, locale:PublicAstroLocale){ if(locale!=="ru") return value; return value==="retrograde"?"ретроградная":value==="direct"?"директная":value; }
function monthBounds(month:number){
  const start = `${PUBLIC_EPHEMERIDES_YEAR}-${pad(month)}-01`;
  const endDate = new Date(Date.UTC(PUBLIC_EPHEMERIDES_YEAR, month, 0));
  const end = `${PUBLIC_EPHEMERIDES_YEAR}-${pad(month)}-${pad(endDate.getUTCDate())}`;
  return { start, end };
}

export function normalizeEphemeridesMonth(value: unknown): number | null {
  const n = Number(Array.isArray(value) ? value[0] : value);
  return Number.isInteger(n) && n >= 1 && n <= 12 ? n : null;
}

export function preferredPublishedMonth(now = new Date()): number {
  if (now.getUTCFullYear() < PUBLIC_EPHEMERIDES_YEAR) return 1;
  if (now.getUTCFullYear() > PUBLIC_EPHEMERIDES_YEAR) return 12;
  return now.getUTCMonth() + 1;
}

export function buildPublicEphemeridesMonth(locale: PublicAstroLocale, month: number) {
  const date = `${PUBLIC_EPHEMERIDES_YEAR}-${pad(month)}-01`;
  const anchor = evidence.anchors.find((item) => item.date === date) ?? evidence.anchors[0];
  const bodies = Object.entries(anchor.b).map(([body, pair]) => {
    const longitude = Number(pair[0]);
    const speed = Number(pair[1]);
    const signIndex = Math.floor(((longitude % 360) + 360) % 360 / 30);
    const degree = ((longitude % 30) + 30) % 30;
    return {
      key: body,
      name: bodyName(body, locale),
      longitude: Number(longitude.toFixed(4)),
      speed: Number(speed.toFixed(5)),
      retrograde: speed < 0,
      sign: signName(signIndex, locale),
      degree: Number(degree.toFixed(2)),
    };
  });
  const { start, end } = monthBounds(month);
  const stations = evidence.stations.filter((x) => x.date >= start && x.date <= end).map((x) => ({...x, name: bodyName(x.body, locale), motionLabel: motionLabel(x.motion, locale)}));
  const ingresses = evidence.ingresses.filter((x) => x.date >= start && x.date <= end).map((x) => ({...x, name: bodyName(x.body, locale), signLabel: signFromKey(x.sign, locale)}));
  const aspects = evidence.aspects.filter((x) => x.end >= start && x.start <= end).map((x) => ({
    ...x,
    aName: bodyName(x.a, locale),
    bName: bodyName(x.b, locale),
    aspectName: (locale === "ru" ? ASPECT_RU : ASPECT_EN)[x.angle] ?? `${x.angle}°`,
  }));
  return {
    schema: evidence.schema,
    source: evidence.source,
    range: evidence.range,
    anchorDate: anchor.date,
    month,
    bodies,
    stations,
    ingresses,
    aspects,
  };
}

export function publicEphemeridesMonths(locale: PublicAstroLocale) {
  const formatter = new Intl.DateTimeFormat(locale === "ru" ? "ru-RU" : "en-US", { month: "long", timeZone: "UTC" });
  return Array.from({length:12}, (_,i) => ({month:i+1, label: formatter.format(new Date(Date.UTC(PUBLIC_EPHEMERIDES_YEAR,i,1)))}));
}

export function publicEphemeridesSourceSummary(){ return evidence.source; }
