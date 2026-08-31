import eclipseReferenceJson from "../data/public_eclipse_reference_2025_2027_v0_1.json";
import { loadBtcAstroField } from "./btc-astro-field-client";
import { buildPublicEphemeridesMonth, preferredPublishedMonth, type PublicAstroLocale } from "./public-ephemerides-v1";

const BODY_EN: Record<string,string>={sun:"Sun",moon:"Moon",mercury:"Mercury",venus:"Venus",mars:"Mars",jupiter:"Jupiter",saturn:"Saturn",uranus:"Uranus",neptune:"Neptune",pluto:"Pluto"};
const BODY_RU: Record<string,string>={sun:"Солнце",moon:"Луна",mercury:"Меркурий",venus:"Венера",mars:"Марс",jupiter:"Юпитер",saturn:"Сатурн",uranus:"Уран",neptune:"Нептун",pluto:"Плутон"};
const SIGNS_EN=["Aries","Taurus","Gemini","Cancer","Leo","Virgo","Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"];
const SIGNS_RU=["Овен","Телец","Близнецы","Рак","Лев","Дева","Весы","Скорпион","Стрелец","Козерог","Водолей","Рыбы"];
const ASPECT_RU:Record<string,string>={conjunction:"Соединение",sextile:"Секстиль",square:"Квадрат",trine:"Трин",opposition:"Оппозиция"};
const PHASE_RU:Record<string,string>={APPLYING:"Сходящийся",SEPARATING:"Расходящийся",STATIONARY:"Стационарный"};
const LUNAR_EN=["New Moon band","Waxing crescent","First quarter band","Waxing gibbous","Full Moon band","Waning gibbous","Last quarter band","Waning crescent"];
const LUNAR_RU=["Зона новолуния","Растущий серп","Зона первой четверти","Растущая выпуклая","Зона полнолуния","Убывающая выпуклая","Зона последней четверти","Убывающий серп"];

type RawPacket=Record<string,any>;
type RefEvent={maximum_time_utc:string;event_type:"solar"|"lunar";kind:string};
const eclipseReference=eclipseReferenceJson as {schema:string;source:Record<string,string>;events:RefEvent[]};
function norm(v:number){return ((v%360)+360)%360;}
function bodyName(key:string,locale:PublicAstroLocale){return (locale==="ru"?BODY_RU:BODY_EN)[key]??key;}
function sign(longitude:number,locale:PublicAstroLocale){const x=norm(longitude),i=Math.floor(x/30);return {sign:(locale==="ru"?SIGNS_RU:SIGNS_EN)[i],degree:Number((x%30).toFixed(2))};}
function aspectName(value:string,locale:PublicAstroLocale){const key=value.toLowerCase();return locale==="ru"?(ASPECT_RU[key]??value):key.charAt(0).toUpperCase()+key.slice(1);}
function phaseName(value:string,locale:PublicAstroLocale){return locale==="ru"?(PHASE_RU[value]??value):value.charAt(0)+value.slice(1).toLowerCase();}
function eclipseName(e:RefEvent,locale:PublicAstroLocale){if(locale==="en")return `${e.event_type==="solar"?"Solar":"Lunar"} · ${e.kind}`;const kind:Record<string,string>={total:"полное",partial:"частичное",annular:"кольцеобразное",penumbral:"полутеневое"};return `${e.event_type==="solar"?"Солнечное":"Лунное"} · ${kind[e.kind]??e.kind}`;}
function nearestEclipses(now:Date,locale:PublicAstroLocale){const rows=eclipseReference.events.map(e=>({...e,ms:Date.parse(e.maximum_time_utc)})).filter(e=>Number.isFinite(e.ms)).sort((a,b)=>a.ms-b.ms);const t=now.getTime();const previous=[...rows].reverse().find(e=>e.ms<=t)??null;const next=rows.find(e=>e.ms>t)??null;const map=(e:typeof previous)=>e?{...e,label:eclipseName(e,locale),days:Number((Math.abs(t-e.ms)/86400000).toFixed(2))}:null;return {previous:map(previous),next:map(next),schema:eclipseReference.schema,source:eclipseReference.source};}
function lunarPhase(bodies:any[],locale:PublicAstroLocale){const sun=bodies.find(b=>b.key==="sun"),moon=bodies.find(b=>b.key==="moon");if(!sun||!moon)return null;const elong=norm(moon.longitude-sun.longitude);const index=Math.round(elong/45)%8;return {elongation_deg:Number(elong.toFixed(2)),label:(locale==="ru"?LUNAR_RU:LUNAR_EN)[index],derivation:"SUN_MOON_ELONGATION_8_PHASE_BAND"};}

export function buildPublicEphemeridesTodayFromPacket(locale:PublicAstroLocale,packet:RawPacket,now:Date){
  const snapshot=packet?.snapshot;if(!snapshot||typeof snapshot!=="object"||!snapshot.bodies||typeof snapshot.bodies!=="object")throw new Error("PUBLIC_ASTRO_SNAPSHOT_INVALID");
  const bodies=Object.entries(snapshot.bodies).map(([name,state]:[string,any])=>{const key=name.toLowerCase(),longitude=Number(state.longitude_deg),speed=Number(state.longitude_speed_deg_per_day),z=sign(longitude,locale);return {key,name:bodyName(key,locale),longitude:Number(longitude.toFixed(4)),speed:Number(speed.toFixed(5)),retrograde:Boolean(state.retrograde),...z};});
  const aspects=Array.isArray(snapshot.aspects)?snapshot.aspects.map((a:any)=>({a:a.body_a,b:a.body_b,aName:bodyName(String(a.body_a).toLowerCase(),locale),bName:bodyName(String(a.body_b).toLowerCase(),locale),aspectName:aspectName(String(a.aspect),locale),orb:Number(Number(a.orb_deg).toFixed(3)),phase:String(a.phase),phaseLabel:phaseName(String(a.phase),locale)})):[];
  return {schema:String(packet.schema_version||"bhrigu_public_astro_field_v0_1"),live:true,observationTime:String(snapshot.observation_time_utc||now.toISOString()),source:{engine:String(packet?.provenance?.engine_id||"orion_native_swisseph_canonical_v0_1"),mode:"MOSEPH_PINNED",coordinate:"geocentric tropical ecliptic",authority:"CANONICAL_PUBLIC_SAFE"},bodies,aspects,lunarPhase:lunarPhase(bodies,locale),eclipses:nearestEclipses(now,locale)};
}

export async function loadPublicEphemeridesToday(locale:PublicAstroLocale,now=new Date()){
  try{
    const result=await loadBtcAstroField({timestampUtc:now.toISOString(),phenomena:["positions","aspects"],timeoutMs:8_000});
    return buildPublicEphemeridesTodayFromPacket(locale,result.packet,now);
  }catch{
    return {live:false,error:"CANONICAL_SOURCE_UNAVAILABLE",fallback:buildPublicEphemeridesMonth(locale,preferredPublishedMonth(now)),eclipses:nearestEclipses(now,locale)};
  }
}
