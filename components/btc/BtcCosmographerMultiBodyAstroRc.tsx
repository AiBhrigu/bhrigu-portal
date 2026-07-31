import astroEvidence from "../../data/btc_public_astro_evidence_v0_1.json";
import type { BtcPublicLocale } from "../../lib/btc-public-language-contract";
import type {
  BtcMultiBodyAstroMemory,
  BtcMultiBodyAstroRcAnswer,
  BtcMultiBodyAstroRcRoute,
} from "../../lib/btc-cosmographer-multi-body-astro-rc";
import { BTC_COSMOGRAPHER_CONTEXT_SCHEMA } from "../../lib/btc-cosmographer-route-graph";

type Props = {
  locale: BtcPublicLocale;
  initialQuestion: string;
  initialDate: string;
  route: BtcMultiBodyAstroRcRoute | null;
  answer: BtcMultiBodyAstroRcAnswer | null;
  astroMemory: BtcMultiBodyAstroMemory | null;
  deploymentSourceSha: string | null;
  sourceState: string;
  inputError: string | null;
};

type Station = { date: string; body: string; motion: "direct" | "retrograde" };
type Ingress = { date: string; body: string; sign: string };
type AspectWindow = {
  start: string;
  end: string;
  peak: string;
  a: string;
  b: string;
};
type AstroEvidence = {
  stations: Station[];
  ingresses: Ingress[];
  aspects: AspectWindow[];
};

const evidence = astroEvidence as unknown as AstroEvidence;

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

const SIGN_EN: Record<string, string> = {
  aries: "Aries", taurus: "Taurus", gemini: "Gemini", cancer: "Cancer",
  leo: "Leo", virgo: "Virgo", libra: "Libra", scorpio: "Scorpio",
  sagittarius: "Sagittarius", capricorn: "Capricorn", aquarius: "Aquarius",
  pisces: "Pisces",
};

const CSS = `
*{box-sizing:border-box}body{margin:0;background:#080a0e;color:#edf1f6;font-family:Inter,system-ui,sans-serif}
main{width:min(1000px,calc(100% - 28px));margin:auto;padding:26px 0 60px}h1{font-size:clamp(30px,5vw,54px);margin:26px 0 8px;letter-spacing:-.035em}.muted,p,li{color:#b8c2ce;line-height:1.65}.top{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;color:#8e9bad;font-size:12px;text-transform:uppercase;letter-spacing:.08em}.gate,.error{margin:20px 0;padding:12px 14px;border:1px solid #2b3542;border-radius:12px;background:#10151c}.error{border-color:#633b38;color:#f2c3be}.form{display:grid;grid-template-columns:1fr 150px auto;gap:10px;margin:22px 0}.form input,.form button{min-height:48px;border:1px solid #334050;border-radius:11px;font:inherit}.form input{padding:0 13px;background:#0e131a;color:#fff}.form button{padding:0 20px;font-weight:700}.answer{border:1px solid #293442;border-radius:16px;overflow:hidden;background:#0d1117}.head,.section,.proof{padding:21px 23px;border-bottom:1px solid #222b36}.proof{border:0;font-size:12px;color:#8f9baa}.kicker{font-size:11px;color:#83a5ce;letter-spacing:.09em}.route{display:flex;flex-wrap:wrap;gap:6px;margin-top:13px}.route span{border:1px solid #2d3948;border-radius:7px;padding:4px 7px;font-size:11px;color:#94a5b9}.section h3{margin-top:0}.section li+li{margin-top:8px}.chain{display:flex;flex-wrap:wrap;gap:7px;margin:0 0 20px}.chain span{border:1px solid #2c3745;border-radius:999px;padding:7px 10px;color:#9eabb9;font-size:12px}@media(max-width:700px){.form{grid-template-columns:1fr}.head,.section,.proof{padding:17px}}
`;

function dayNumber(value: string): number {
  return Math.floor(new Date(`${value}T00:00:00Z`).getTime() / 86_400_000);
}

function bodyLabel(locale: BtcPublicLocale, body: string): string {
  return BODY_LABELS[locale][body] ?? body;
}

function transitionKey(item: Station | Ingress): string {
  return "motion" in item
    ? `${item.date}|${item.body}|station|${item.motion}`
    : `${item.date}|${item.body}|ingress|${item.sign}`;
}

function uniqueTransitionCount(events: AspectWindow[]): number {
  const keys = new Set<string>();
  for (const event of events) {
    const start = dayNumber(event.start) - 7;
    const end = dayNumber(event.end) + 7;
    const bodies = new Set([event.a, event.b]);
    for (const item of [...evidence.stations, ...evidence.ingresses]) {
      const day = dayNumber(item.date);
      if (bodies.has(item.body) && day >= start && day <= end) {
        keys.add(transitionKey(item));
      }
    }
  }
  return keys.size;
}

function russianIntersectionPhrase(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  const noun = mod10 === 1 && mod100 !== 11
    ? "пересечение"
    : mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)
      ? "пересечения"
      : "пересечений";
  return `${count} ${noun} со станциями/ингрессиями`;
}

function repairWindowBullet(locale: BtcPublicLocale, bullet: string): string {
  const dates = Array.from(bullet.matchAll(/\d{4}-\d{2}-\d{2}/g), (match) => match[0]);
  const peakDates = new Set(dates.slice(2));
  const events = evidence.aspects.filter((event) => peakDates.has(event.peak));
  if (!events.length) return bullet;
  const count = uniqueTransitionCount(events);
  if (locale === "ru") {
    return bullet.replace(
      /\d+\s+пересечени(?:е|я|й)\s+со\s+станциями\/ингрессиями/,
      russianIntersectionPhrase(count),
    );
  }
  return bullet.replace(
    /\d+\s+station\/ingress overlaps/,
    `${count} station/ingress ${count === 1 ? "overlap" : "overlaps"}`,
  );
}

function completeTransitionBullets(locale: BtcPublicLocale): string[] {
  return [...evidence.stations, ...evidence.ingresses]
    .sort((a, b) => a.date.localeCompare(b.date) || transitionKey(a).localeCompare(transitionKey(b)))
    .map((item) => {
      if ("motion" in item) {
        const motion = item.motion === "direct"
          ? (locale === "ru" ? "переход к директному движению" : "station direct")
          : (locale === "ru" ? "переход к ретроградному движению" : "station retrograde");
        return `${item.date}: ${bodyLabel(locale, item.body)} — ${motion}.`;
      }
      if (locale === "ru") {
        const sign = SIGN_GENITIVE_RU[item.sign] ?? item.sign;
        return `${item.date}: ${bodyLabel(locale, item.body)} входит в знак ${sign}.`;
      }
      return `${item.date}: ${bodyLabel(locale, item.body)} enters ${SIGN_EN[item.sign] ?? item.sign}.`;
    });
}

function repairAnswer(
  locale: BtcPublicLocale,
  answer: BtcMultiBodyAstroRcAnswer,
): BtcMultiBodyAstroRcAnswer {
  if (answer.answer_mode !== "ASTRO_YEAR_OVERVIEW") return answer;
  return {
    ...answer,
    sections: answer.sections.map((section) => {
      if (section.id === "main_windows") {
        return {
          ...section,
          bullets: section.bullets?.map((bullet) => repairWindowBullet(locale, bullet)),
        };
      }
      if (section.id === "fast_triggers") {
        return {
          ...section,
          label: locale === "ru"
            ? "Станции и ингрессии внутри годовой структуры — без усечения"
            : "Stations and ingresses inside the annual structure — complete",
          bullets: completeTransitionBullets(locale),
        };
      }
      return section;
    }),
  };
}

function sourceStateLabel(props: Props, answer: BtcMultiBodyAstroRcAnswer | null): string {
  const used = props.route?.domain === "btc_market" ||
    props.route?.domain === "snapshot_memory" ||
    answer?.answer_mode === "ASTRO_BTC_BRIDGE";
  if (props.locale === "ru") {
    return used
      ? `Market Snapshot: ${props.sourceState}`
      : `Market Snapshot: ${props.sourceState} · не используется в этом ответе`;
  }
  return used
    ? `Market Snapshot: ${props.sourceState}`
    : `Market Snapshot: ${props.sourceState} · not used in this answer`;
}

function ContextFields({ route, answer }: { route: Props["route"]; answer: BtcMultiBodyAstroRcAnswer | null }) {
  if (!route || !answer) return null;
  return <>
    <input type="hidden" name="cc" value={BTC_COSMOGRAPHER_CONTEXT_SCHEMA}/>
    <input type="hidden" name="cd" value={route.domain}/>
    <input type="hidden" name="cs" value={route.subject}/>
    <input type="hidden" name="ci" value={route.intents.join(",")}/>
    <input type="hidden" name="ca" value={answer.answer_state}/>
    <input type="hidden" name="cm" value={route.market_question_class ?? ""}/>
    <input type="hidden" name="ct0" value={route.time_range?.start ?? ""}/>
    <input type="hidden" name="ct1" value={route.time_range?.end ?? ""}/>
    <input type="hidden" name="cb" value=""/>
  </>;
}

function MemoryFields({ memory }: { memory: Props["astroMemory"] }) {
  if (!memory) return null;
  return <>
    <input type="hidden" name="rad" value={memory.domain}/>
    <input type="hidden" name="ras" value={memory.subject}/>
    <input type="hidden" name="rat0" value={memory.start}/>
    <input type="hidden" name="rat1" value={memory.end}/>
  </>;
}

export function BtcCosmographerMultiBodyAstroRc(props: Props) {
  const ru = props.locale === "ru";
  const answer = props.answer ? repairAnswer(props.locale, props.answer) : null;
  return <>
    <style dangerouslySetInnerHTML={{ __html: CSS }}/>
    <main>
      <div className="top"><span>BTC Cosmographer · Local Linux RC</span><span>{sourceStateLabel(props, answer)}</span></div>
      <h1>{ru ? "Коридор смыслов: аспекты 2026" : "Meaning corridor: 2026 aspects"}</h1>
      <p className="muted">{ru ? "Изолированный кандидат: многопланетные окна, явная значимость, хронология и возврат к теме без изменения production runtime." : "Isolated candidate: multi-body windows, explicit significance, chronology, and return-to-topic memory without changing production runtime."}</p>
      <div className="gate">LOCAL ONLY · BTC_LOCAL_RC=1{props.deploymentSourceSha ? ` · SHA ${props.deploymentSourceSha}` : ""}</div>

      <form className="form" method="get" action="/crypto-astro/btc/local-rc">
        <input type="hidden" name="lang" value={props.locale}/>
        <ContextFields route={props.route} answer={answer}/><MemoryFields memory={props.astroMemory}/>
        <input name="q" defaultValue={props.initialQuestion} placeholder={ru ? "Какие аспекты планет важны в 2026 году?" : "Which planetary aspects matter in 2026?"} required/>
        <input name="d" type="date" defaultValue={props.initialDate}/><button type="submit">{ru ? "Спросить" : "Ask"}</button>
      </form>

      <div className="chain"><span>1 · {ru ? "Годовой обзор" : "Annual overview"}</span><span>2 · {ru ? "Почему это важно?" : "Why does this matter?"}</span><span>3 · {ru ? "Ликвидность подтверждает?" : "Does liquidity confirm it?"}</span><span>4 · {ru ? "Теперь о халвинге" : "Now about halving"}</span><span>5 · {ru ? "Вернёмся к аспектам" : "Return to aspects"}</span></div>
      {props.inputError ? <div className="error">{props.inputError}</div> : null}

      {props.route && answer ? <article className="answer"
        data-route-domain={props.route.domain} data-route-subject={props.route.subject}
        data-route-scope={props.route.rc_scope} data-context-relation={props.route.context_relation}
        data-answer-mode={answer.answer_mode} data-answer-state={answer.answer_state}
        data-rc-schema={props.route.rc_schema}>
        <header className="head"><div className="kicker">{answer.answer_mode}</div><h2>{answer.headline}</h2><p>{answer.direct_answer}</p>
          <div className="route"><span>{props.route.domain}</span><span>{props.route.subject}</span><span>{props.route.rc_scope}</span><span>{props.route.context_relation}</span>{props.route.rc_intents.map((item)=><span key={item}>{item}</span>)}</div>
        </header>
        {answer.sections.map((section)=><section className="section" data-answer-section={section.id} key={section.id}><h3>{section.label}</h3>{section.paragraph?<p>{section.paragraph}</p>:null}{section.bullets?.length?<ul>{section.bullets.map((item)=><li key={item}>{item}</li>)}</ul>:null}</section>)}
        <footer className="proof"><strong>{answer.proof_label}</strong><br/>{answer.source_boundary}</footer>
      </article> : null}
    </main>
  </>;
}
