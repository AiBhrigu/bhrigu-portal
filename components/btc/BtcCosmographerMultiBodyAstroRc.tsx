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

type AnswerSection = BtcMultiBodyAstroRcAnswer["sections"][number];
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
type WindowProjection = {
  rank: string;
  range: string;
  peak: string;
  title: string;
  basis: string;
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
  aries: "Овна", taurus: "Тельца", gemini: "Близнецов", cancer: "Рака",
  leo: "Льва", virgo: "Девы", libra: "Весов", scorpio: "Скорпиона",
  sagittarius: "Стрельца", capricorn: "Козерога", aquarius: "Водолея", pisces: "Рыб",
};

const SIGN_EN: Record<string, string> = {
  aries: "Aries", taurus: "Taurus", gemini: "Gemini", cancer: "Cancer",
  leo: "Leo", virgo: "Virgo", libra: "Libra", scorpio: "Scorpio",
  sagittarius: "Sagittarius", capricorn: "Capricorn", aquarius: "Aquarius", pisces: "Pisces",
};

const CSS = `
:root{color-scheme:dark;--bg:#080a0e;--panel:#0d1117;--panel2:#101720;--line:#293442;--text:#edf1f6;--muted:#aeb9c7;--soft:#8291a5;--accent:#a8c7f0;--focus:#cce2ff;--major:61.803%;--minor:38.197%}
*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:radial-gradient(circle at 78% -10%,#182333 0,transparent 34%),var(--bg);color:var(--text);font-family:Inter,system-ui,sans-serif}
main{width:min(1080px,calc(100% - 28px));margin:auto;padding:22px 0 64px}p,li{color:var(--muted);line-height:1.62}.top{display:flex;justify-content:space-between;gap:12px;align-items:center;color:var(--soft);font-size:12px;letter-spacing:.06em}.sourcePill{border:1px solid #314155;border-radius:999px;padding:7px 10px;text-transform:none;letter-spacing:0}.hero{display:grid;grid-template-columns:var(--major) var(--minor);gap:22px;align-items:end;margin:26px 0 18px}.hero h1{font-size:clamp(30px,5vw,54px);line-height:1.02;margin:0 0 10px;letter-spacing:-.038em}.hero p{margin:0;max-width:68ch}.stateCard{border:1px solid #304055;border-radius:16px;background:linear-gradient(145deg,#121a25,#0c1118);padding:16px}.stateLabel,.kicker{font-size:11px;color:var(--accent);letter-spacing:.09em;text-transform:uppercase}.stateCard strong{display:block;margin-top:7px;font-size:17px}.form{display:grid;grid-template-columns:minmax(0,1fr) 168px auto;gap:10px;padding:14px;border:1px solid var(--line);border-radius:16px;background:rgba(13,17,23,.94);margin:18px 0 12px}.field{display:grid;gap:6px}.field label{font-size:12px;color:#d9e3ef;font-weight:650}.field small{color:var(--soft);font-size:11px;line-height:1.35}.form input,.form button{min-height:48px;border:1px solid #36475b;border-radius:11px;font:inherit}.form input{width:100%;padding:0 13px;background:#0b1016;color:#fff}.form input:focus,.form button:focus,summary:focus{outline:2px solid var(--focus);outline-offset:2px}.form button{align-self:end;padding:0 20px;background:#e8eef7;color:#09101a;font-weight:800;cursor:pointer}.journey{display:flex;gap:7px;overflow:auto;padding:2px 0 12px;margin:0;list-style:none;scrollbar-width:thin}.journey li{white-space:nowrap;border:1px solid #2c3745;border-radius:999px;padding:7px 10px;color:#8290a1;font-size:12px}.journey li[aria-current='step']{color:#f4f8fd;border-color:#6c86a8;background:#172334}.error{margin:14px 0;padding:12px 14px;border:1px solid #633b38;border-radius:12px;background:#1a1112;color:#f2c3be}.answer{scroll-margin-top:18px;border:1px solid var(--line);border-radius:18px;overflow:hidden;background:var(--panel);box-shadow:0 24px 80px rgba(0,0,0,.22)}.head{display:grid;grid-template-columns:var(--major) var(--minor);gap:22px;padding:24px;border-bottom:1px solid #222b36}.head h2{font-size:clamp(25px,3.5vw,38px);line-height:1.08;margin:8px 0 12px;letter-spacing:-.025em}.direct{font-size:17px;margin:0}.answerState{align-self:start;border:1px solid #304055;border-radius:14px;padding:14px;background:#111923}.answerState span{display:block;color:var(--soft);font-size:11px;text-transform:uppercase;letter-spacing:.08em}.answerState strong{display:block;margin-top:6px}.section{padding:22px 24px;border-bottom:1px solid #222b36}.section h3{margin:0 0 12px;font-size:19px}.section ul{padding-left:20px;margin:0}.section li+li{margin-top:8px}.windowGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.windowCard{display:grid;grid-template-columns:auto 1fr;gap:12px;border:1px solid #2a3748;border-radius:14px;padding:15px;background:var(--panel2)}.rank{display:grid;place-items:center;width:42px;height:42px;border:1px solid #49617f;border-radius:50%;color:#d7e8ff;font-weight:800}.windowMeta{color:#8fa1b7;font-size:12px}.windowCard h4{margin:5px 0 8px;font-size:16px}.windowCard p{font-size:13px;margin:0}.disclosure{border:1px solid #2b394a;border-radius:14px;background:#0e141c;padding:0 15px}.disclosure summary{cursor:pointer;padding:14px 0;color:#dce7f3;font-weight:700}.disclosure[open] summary{border-bottom:1px solid #273344}.disclosure ul{padding:13px 0 15px 20px}.continuation{margin-top:16px}.continuation h3{margin:0 0 8px}.proof{padding:18px 24px;font-size:12px;color:#8f9baa}.diagnostics{margin-top:12px;border-top:1px solid #222b36}.diagnostics summary{cursor:pointer;padding:14px 24px;color:#7f8da0;font-size:12px}.route{display:flex;flex-wrap:wrap;gap:6px;padding:0 24px 18px}.route span{border:1px solid #2d3948;border-radius:7px;padding:4px 7px;font-size:11px;color:#94a5b9}.empty{border:1px dashed #334257;border-radius:16px;padding:24px;color:var(--muted)}
@media(max-width:760px){main{width:min(100% - 20px,680px);padding-top:14px}.top{align-items:flex-start}.hero,.head{grid-template-columns:1fr;gap:12px}.hero{margin-top:18px}.stateCard{padding:12px}.form{grid-template-columns:1fr;padding:12px}.form button{width:100%}.journey{margin-inline:-2px}.head,.section,.proof{padding:17px}.head h2{font-size:27px}.direct{font-size:15px}.windowGrid{grid-template-columns:1fr}.windowCard{padding:13px}.diagnostics summary{padding:13px 17px}.route{padding:0 17px 16px}.hasAnswer .form[data-question-form='primary']{display:none}.hasAnswer .hero{margin:12px 0 8px}.hasAnswer .hero p,.hasAnswer .stateCard{display:none}}
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
      if (bodies.has(item.body) && day >= start && day <= end) keys.add(transitionKey(item));
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

function repairAnswer(locale: BtcPublicLocale, answer: BtcMultiBodyAstroRcAnswer): BtcMultiBodyAstroRcAnswer {
  return {
    ...answer,
    sections: answer.sections.map((section) => {
      if (section.id === "main_windows") {
        return { ...section, bullets: section.bullets?.map((bullet) => repairWindowBullet(locale, bullet)) };
      }
      if (section.id === "fast_triggers") {
        return {
          ...section,
          label: locale === "ru"
            ? "Полная хронология станций и ингрессий"
            : "Complete station and ingress chronology",
          bullets: completeTransitionBullets(locale),
        };
      }
      return section;
    }),
  };
}

function sectionById(answer: BtcMultiBodyAstroRcAnswer, id: string): AnswerSection | null {
  return answer.sections.find((section) => section.id === id) ?? null;
}

function projectAnswer(locale: BtcPublicLocale, route: BtcMultiBodyAstroRcRoute, answer: BtcMultiBodyAstroRcAnswer): BtcMultiBodyAstroRcAnswer {
  const ru = locale === "ru";
  if (route.context_relation === "FOLLOW_UP" && answer.answer_mode === "ASTRO_YEAR_OVERVIEW") {
    return {
      ...answer,
      headline: ru ? "Почему именно эти окна важны" : "Why these windows matter",
      direct_answer: ru
        ? "Значимость возникает из сочетания масштаба медленного цикла, точности, длительности, кластерности и близких станций или ингрессий. Ни один отдельный показатель не используется как универсальный ответ."
        : "Significance comes from slow-cycle scale, exactness, duration, clustering, and nearby stations or ingresses. No single metric is used as a universal answer.",
      sections: ["salience_method", "slow_context", "interpretation_boundary"]
        .map((id) => sectionById(answer, id))
        .filter((section): section is AnswerSection => Boolean(section)),
    };
  }
  if (route.context_relation === "RETURN_TO_PREVIOUS_TOPIC" && answer.answer_mode === "ASTRO_YEAR_OVERVIEW") {
    const windows = sectionById(answer, "main_windows");
    return {
      ...answer,
      headline: ru ? "Контекст аспектов 2026 восстановлен" : "The 2026 aspect context is restored",
      direct_answer: ru
        ? "Возвращаемся к сохранённому годовому коридору. Ниже — краткий recap главных временных окон; полный список переходов не повторяется."
        : "Returning to the saved annual corridor. Below is a concise recap of the main windows; the complete transition list is not repeated.",
      sections: windows
        ? [{ ...windows, bullets: windows.bullets?.slice(0, 3) }]
        : [],
    };
  }
  if (answer.answer_mode === "ASTRO_BTC_BRIDGE") {
    return {
      ...answer,
      sections: ["market_layer", "main_windows", "bridge_boundary"]
        .map((id) => sectionById(answer, id))
        .filter((section): section is AnswerSection => Boolean(section)),
    };
  }
  return answer;
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

function shellCopy(locale: BtcPublicLocale, route: Props["route"]) {
  const ru = locale === "ru";
  if (!route) {
    return {
      title: ru ? "Спросите BTC Космограф" : "Ask the BTC Cosmographer",
      subtitle: ru ? "Один вопрос — один проверяемый маршрут и явная граница доказательства." : "One question, one verifiable route, and an explicit evidence boundary.",
      state: ru ? "Новый вопрос" : "New question",
    };
  }
  if (route.domain === "bitcoin_protocol") {
    return {
      title: ru ? "Bitcoin Protocol: халвинг" : "Bitcoin Protocol: halving",
      subtitle: ru ? "Тема переключена явно: протокольный ответ отделён от астрономического контекста." : "The topic switched explicitly: the protocol answer is separated from the astronomy context.",
      state: ru ? "Смена темы" : "Topic switch",
    };
  }
  if (route.domain === "astro_btc_bridge") {
    return {
      title: ru ? "Astro × BTC: независимые слои" : "Astro × BTC: independent layers",
      subtitle: ru ? "Сначала ответ по ликвидности, затем астрономический контекст и граница сравнения." : "Liquidity answer first, followed by the astronomy context and comparison boundary.",
      state: ru ? "Сравнение слоёв" : "Layer comparison",
    };
  }
  if (route.context_relation === "FOLLOW_UP") {
    return {
      title: ru ? "Почему эти окна важны" : "Why these windows matter",
      subtitle: ru ? "Краткое объяснение значимости без повторения полного годового отчёта." : "A focused significance explanation without repeating the full annual report.",
      state: ru ? "Продолжение" : "Follow-up",
    };
  }
  if (route.context_relation === "RETURN_TO_PREVIOUS_TOPIC") {
    return {
      title: ru ? "Возврат к аспектам 2026" : "Return to 2026 aspects",
      subtitle: ru ? "Сохранённый контекст восстановлен и показан как краткий recap." : "The saved context is restored and shown as a concise recap.",
      state: ru ? "Возврат к теме" : "Return to topic",
    };
  }
  return {
    title: ru ? "Планетарные аспекты 2026" : "Planetary aspects in 2026",
    subtitle: ru ? "Главные окна по времени, отдельный ранг значимости и прозрачная граница метода." : "Primary windows in time order, a separate significance rank, and a transparent method boundary.",
    state: ru ? "Годовой обзор" : "Annual overview",
  };
}

function modeLabel(locale: BtcPublicLocale, answer: BtcMultiBodyAstroRcAnswer): string {
  const ru = locale === "ru";
  if (answer.answer_mode === "ASTRO_BTC_BRIDGE") return ru ? "Astro × BTC · независимая проверка" : "Astro × BTC · independent check";
  if (answer.answer_mode === "ASTRO_YEAR_OVERVIEW") return ru ? "Астрономический годовой обзор" : "Astronomy annual overview";
  if (answer.answer_mode === "PROTOCOL_EXPLAIN") return ru ? "Протокольное объяснение" : "Protocol explanation";
  return answer.answer_mode;
}

function relationLabel(locale: BtcPublicLocale, route: BtcMultiBodyAstroRcRoute): string {
  const ru = locale === "ru";
  const labels: Record<string, [string, string]> = {
    NEW_TOPIC: ["Новая тема", "New topic"],
    FOLLOW_UP: ["Продолжение", "Follow-up"],
    CROSS_MODULE_BRIDGE: ["Сравнение независимых слоёв", "Independent-layer comparison"],
    RETURN_TO_PREVIOUS_TOPIC: ["Возврат к сохранённой теме", "Return to saved topic"],
  };
  const pair = labels[route.context_relation];
  return pair ? pair[ru ? 0 : 1] : route.context_relation;
}

function activeJourneyStep(route: Props["route"]): number {
  if (!route) return 0;
  if (route.context_relation === "RETURN_TO_PREVIOUS_TOPIC") return 5;
  if (route.domain === "bitcoin_protocol") return 4;
  if (route.domain === "astro_btc_bridge") return 3;
  if (route.context_relation === "FOLLOW_UP") return 2;
  return 1;
}

function parseWindowBullet(locale: BtcPublicLocale, bullet: string): WindowProjection | null {
  const parts = bullet.split(" · ");
  if (parts.length < 3) return null;
  const rank = parts[0].replace(locale === "ru" ? "Ранг " : "Rank ", "").trim();
  const range = parts[1].trim();
  const remainder = parts.slice(2).join(" · ");
  const colon = remainder.indexOf(": ");
  if (colon < 0) return null;
  const peak = remainder.slice(0, colon).replace(locale === "ru" ? "пик " : "peak ", "").trim();
  const body = remainder.slice(colon + 2);
  const marker = locale === "ru" ? ". Основания: " : ". Basis: ";
  const markerIndex = body.indexOf(marker);
  if (markerIndex < 0) return null;
  return {
    rank,
    range,
    peak,
    title: body.slice(0, markerIndex).trim(),
    basis: body.slice(markerIndex + marker.length).replace(/\.$/, "").trim(),
  };
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

function QuestionForm(props: Props & { answer: BtcMultiBodyAstroRcAnswer | null; continuation?: boolean }) {
  const ru = props.locale === "ru";
  const suffix = props.continuation ? "-continue" : "";
  return <form className={`form${props.continuation ? " continuation" : ""}`} method="get" action="/crypto-astro/btc/local-rc#answer" data-question-form={props.continuation ? "continuation" : "primary"}>
    <input type="hidden" name="lang" value={props.locale}/>
    <ContextFields route={props.route} answer={props.answer}/><MemoryFields memory={props.astroMemory}/>
    <div className="field">
      <label htmlFor={`btc-question${suffix}`}>{props.continuation ? (ru ? "Продолжить диалог" : "Continue the dialogue") : (ru ? "Ваш вопрос" : "Your question")}</label>
      <input id={`btc-question${suffix}`} name="q" defaultValue={props.continuation ? "" : props.initialQuestion} placeholder={ru ? "Например: почему это важно?" : "For example: why does this matter?"} required aria-describedby={`btc-question-help${suffix}`}/>
      <small id={`btc-question-help${suffix}`}>{ru ? "Контекст текущей темы сохраняется внутри этого перехода." : "The current topic context is preserved in this transition."}</small>
    </div>
    <div className="field">
      <label htmlFor={`btc-date${suffix}`}>{ru ? "Дата наблюдения" : "Observation date"}</label>
      <input id={`btc-date${suffix}`} name="d" type="date" defaultValue={props.initialDate} aria-describedby={`btc-date-help${suffix}`}/>
      <small id={`btc-date-help${suffix}`}>{ru ? "Необязательно; используется только для временного контекста." : "Optional; used only for temporal context."}</small>
    </div>
    <button type="submit">{props.continuation ? (ru ? "Продолжить" : "Continue") : (ru ? "Спросить" : "Ask")}</button>
  </form>;
}

function WindowSection({ locale, section }: { locale: BtcPublicLocale; section: AnswerSection }) {
  const parsed = (section.bullets ?? []).map((item) => parseWindowBullet(locale, item));
  if (parsed.some((item) => !item)) {
    return <section className="section" data-answer-section={section.id}><h3>{section.label}</h3><ul>{section.bullets?.map((item)=><li key={item}>{item}</li>)}</ul></section>;
  }
  return <section className="section" data-answer-section={section.id}>
    <h3>{section.label}</h3>
    <div className="windowGrid">{(parsed as WindowProjection[]).map((item) => <article className="windowCard" data-window-rank={item.rank} key={`${item.range}-${item.peak}`}>
      <div className="rank" aria-label={`${locale === "ru" ? "Ранг" : "Rank"} ${item.rank}`}>{item.rank}</div>
      <div><div className="windowMeta">{item.range} · {locale === "ru" ? "пик" : "peak"} {item.peak}</div><h4>{item.title}</h4><p>{item.basis}</p></div>
    </article>)}</div>
  </section>;
}

function AnswerSectionView({ section, locale }: { section: AnswerSection; locale: BtcPublicLocale }) {
  if (section.id === "main_windows" && section.bullets?.length) return <WindowSection locale={locale} section={section}/>;
  if (section.id === "fast_triggers" && section.bullets?.length) {
    return <section className="section" data-answer-section={section.id}>
      <details className="disclosure" data-complete-transitions="collapsed">
        <summary>{section.label} · {section.bullets.length}</summary>
        <ul>{section.bullets.map((item)=><li key={item}>{item}</li>)}</ul>
      </details>
    </section>;
  }
  return <section className="section" data-answer-section={section.id}><h3>{section.label}</h3>{section.paragraph?<p>{section.paragraph}</p>:null}{section.bullets?.length?<ul>{section.bullets.map((item)=><li key={item}>{item}</li>)}</ul>:null}</section>;
}

export function BtcCosmographerMultiBodyAstroRc(props: Props) {
  const ru = props.locale === "ru";
  const repaired = props.answer ? repairAnswer(props.locale, props.answer) : null;
  const answer = props.route && repaired ? projectAnswer(props.locale, props.route, repaired) : repaired;
  const shell = shellCopy(props.locale, props.route);
  const journeyStep = activeJourneyStep(props.route);
  const journey = ru
    ? ["Годовой обзор", "Почему важно", "Ликвидность", "Халвинг", "Возврат"]
    : ["Annual overview", "Why it matters", "Liquidity", "Halving", "Return"];
  return <>
    <style dangerouslySetInnerHTML={{ __html: CSS }}/>
    <main className={answer ? "hasAnswer" : undefined}>
      <div className="top"><span>BTC Cosmographer · Local acceptance surface</span><span className="sourcePill">{sourceStateLabel(props, answer)}</span></div>
      <header className="hero">
        <div><h1>{shell.title}</h1><p>{shell.subtitle}</p></div>
        <div className="stateCard"><span className="stateLabel">{ru ? "Текущее состояние" : "Current state"}</span><strong>{shell.state}</strong></div>
      </header>

      <QuestionForm {...props} answer={answer}/>
      <ol className="journey" aria-label={ru ? "Путь диалога" : "Dialogue path"}>{journey.map((item, index)=><li key={item} aria-current={journeyStep === index + 1 ? "step" : undefined}>{index + 1} · {item}</li>)}</ol>
      {props.inputError ? <div className="error" role="alert">{props.inputError}</div> : null}

      {props.route && answer ? <>
        <article id="answer" className="answer" tabIndex={-1} aria-live="polite"
          data-route-domain={props.route.domain} data-route-subject={props.route.subject}
          data-route-scope={props.route.rc_scope} data-context-relation={props.route.context_relation}
          data-answer-mode={answer.answer_mode} data-answer-state={answer.answer_state}
          data-rc-schema={props.route.rc_schema}>
          <header className="head">
            <div><div className="kicker">{modeLabel(props.locale, answer)}</div><h2>{answer.headline}</h2><p className="direct" data-answer-direct="true">{answer.direct_answer}</p></div>
            <aside className="answerState"><span>{ru ? "Связь с контекстом" : "Context relation"}</span><strong>{relationLabel(props.locale, props.route)}</strong></aside>
          </header>
          {answer.sections.map((section)=><AnswerSectionView section={section} locale={props.locale} key={section.id}/>)}
          <footer className="proof"><strong>{answer.proof_label}</strong><br/>{answer.source_boundary}</footer>
          <details className="diagnostics"><summary>{ru ? "Диагностика маршрута и сборки" : "Route and build diagnostics"}</summary>
            <div className="route"><span>{props.route.domain}</span><span>{props.route.subject}</span><span>{props.route.rc_scope}</span><span>{props.route.context_relation}</span>{props.route.rc_intents.map((item)=><span key={item}>{item}</span>)}{props.deploymentSourceSha?<span>SHA {props.deploymentSourceSha}</span>:null}</div>
          </details>
        </article>
        <section className="continuation" aria-labelledby="continue-heading"><h3 id="continue-heading">{ru ? "Следующий вопрос" : "Next question"}</h3><QuestionForm {...props} answer={answer} continuation/></section>
      </> : <div className="empty">{ru ? "Введите вопрос, чтобы открыть проверяемый маршрут ответа." : "Enter a question to open a verifiable answer route."}</div>}
    </main>
  </>;
}
