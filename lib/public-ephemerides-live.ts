import eclipseReferenceJson from "../data/public_eclipse_reference_2025_2027_v0_1.json";
import dailyEphemeridesJson from "../data/public_daily_ephemerides_2026_v0_1.json";
import { buildPublicEphemeridesMonth, preferredPublishedMonth, type PublicAstroLocale } from "./public-ephemerides-v1";

const BODY_EN:Record<string,string>={sun:"Sun",moon:"Moon",mercury:"Mercury",venus:"Venus",mars:"Mars",jupiter:"Jupiter",saturn:"Saturn",uranus:"Uranus",neptune:"Neptune",pluto:"Pluto"};
const BODY_RU:Record<string,string>={sun:"Солнце",moon:"Луна",mercury:"Меркурий",venus:"Венера",mars:"Марс",jupiter:"Юпитер",saturn:"Сатурн",uranus:"Уран",neptune:"Нептун",pluto:"Плутон"};
const SIGNS_EN=["Aries","Taurus","Gemini","Cancer","Leo","Virgo","Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"];
const SIGNS_RU=["Овен","Телец","Близнецы","Рак","Лев","Дева","Весы","Скорпион","Стрелец","Козерог","Водолей","Рыбы"];
const ASPECT_RU:Record<string,string>={conjunction:"Соединение",sextile:"Секстиль",square:"Квадрат",trine:"Трин",opposition:"Оппозиция"};
const PHASE_RU:Record<string,string>={APPLYING:"Сходящийся",SEPARATING:"Расходящийся",STATIONARY:"Стационарный"};
const LUNAR_EN=["New Moon band","Waxing crescent","First quarter band","Waxing gibbous","Full Moon band","Waning gibbous","Last quarter band","Waning crescent"];
const LUNAR_RU=["Зона новолуния","Растущий серп","Зона первой четверти","Растущая выпуклая","Зона полнолуния","Убывающая выпуклая","Зона последней четверти","Убывающий серп"];

type RefEvent={maximum_time_utc:string;event_type:"solar"|"lunar";kind:string};
type DailyRow={date:string;observation_time_utc:string;bodies:Record<string,{longitude_deg:number;longitude_speed_deg_per_day:number;retrograde:boolean}>;aspects:Array<{body_a:string;body_b:string;aspect:string;orb_deg:number;phase:string}>;sun_moon_elongation_deg:number};
const eclipseReference=eclipseReferenceJson as {schema:string;source:Record<string,string>;events:RefEvent[]};
const daily=dailyEphemeridesJson as unknown as {schema:string;dataset_sha256:string;source:Record<string,string>;rows:DailyRow[]};
function norm(v:number){return ((v%360)+360)%360;}
function bodyName(key:string,locale:PublicAstroLocale){return (locale==="ru"?BODY_RU:BODY_EN)[key]??key;}
function sign(longitude:number,locale:PublicAstroLocale){const x=norm(longitude),i=Math.floor(x/30);return {sign:(locale==="ru"?SIGNS_RU:SIGNS_EN)[i],degree:Number((x%30).toFixed(2))};}
function aspectName(value:string,locale:PublicAstroLocale){const key=value.toLowerCase();return locale==="ru"?(ASPECT_RU[key]??value):key.charAt(0).toUpperCase()+key.slice(1);}
function phaseName(value:string,locale:PublicAstroLocale){return locale==="ru"?(PHASE_RU[value]??value):value.charAt(0)+value.slice(1).toLowerCase();}
function eclipseName(e:RefEvent,locale:PublicAstroLocale){if(locale==="en")return `${e.event_type==="solar"?"Solar":"Lunar"} · ${e.kind}`;const kind:Record<string,string>={total:"полное",partial:"частичное",annular:"кольцеобразное",penumbral:"полутеневое"};return `${e.event_type==="solar"?"Солнечное":"Лунное"} · ${kind[e.kind]??e.kind}`;}
function nearestEclipses(now:Date,locale:PublicAstroLocale){const rows=eclipseReference.events.map(e=>({...e,ms:Date.parse(e.maximum_time_utc)})).filter(e=>Number.isFinite(e.ms)).sort((a,b)=>a.ms-b.ms);const t=now.getTime();const previous=[...rows].reverse().find(e=>e.ms<=t)??null;const next=rows.find(e=>e.ms>t)??null;const map=(e:typeof previous)=>e?{...e,label:eclipseName(e,locale),days:Number((Math.abs(t-e.ms)/86400000).toFixed(2))}:null;return {previous:map(previous),next:map(next),schema:eclipseReference.schema,source:eclipseReference.source};}
function lunarPhase(elongation:number,locale:PublicAstroLocale){const elong=norm(elongation),index=Math.round(elong/45)%8;return {elongation_deg:Number(elong.toFixed(2)),label:(locale==="ru"?LUNAR_RU:LUNAR_EN)[index],derivation:"CANONICAL_DAILY_SUN_MOON_ELONGATION_8_PHASE_BAND"};}

function projectDailyRow(locale:PublicAstroLocale,row:DailyRow,now:Date){
  const bodies=Object.entries(row.bodies).map(([name,state])=>{const key=name.toLowerCase(),longitude=Number(state.longitude_deg),speed=Number(state.longitude_speed_deg_per_day),z=sign(longitude,locale);return {key,name:bodyName(key,locale),longitude:Number(longitude.toFixed(4)),speed:Number(speed.toFixed(5)),retrograde:Boolean(state.retrograde),...z};});
  const aspects=row.aspects.map((a)=>({a:a.body_a,b:a.body_b,aName:bodyName(a.body_a.toLowerCase(),locale),bName:bodyName(a.body_b.toLowerCase(),locale),aspectName:aspectName(a.aspect,locale),orb:Number(Number(a.orb_deg).toFixed(3)),phase:a.phase,phaseLabel:phaseName(a.phase,locale)}));
  return {schema:daily.schema,live:true,observationTime:row.observation_time_utc,source:{repository:daily.source.repository,commit:daily.source.commit,engine:daily.source.engine_id,mode:daily.source.mode,coordinate:daily.source.coordinate,authority:"CANONICAL_PUBLIC_SAFE_DAILY_EXPORT",sample:daily.source.sample,dataset_sha256:daily.dataset_sha256},bodies,aspects,lunarPhase:lunarPhase(row.sun_moon_elongation_deg,locale),eclipses:nearestEclipses(now,locale)};
}

export function loadPublicEphemeridesToday(locale:PublicAstroLocale,now=new Date()){
  const utcDate=now.toISOString().slice(0,10);
  const row=daily.rows.find((item)=>item.date===utcDate);
  if(row)return projectDailyRow(locale,row,now);
  return {live:false,error:"CANONICAL_DAILY_ROW_UNAVAILABLE",fallback:buildPublicEphemeridesMonth(locale,preferredPublishedMonth(now)),eclipses:nearestEclipses(now,locale)};
}
