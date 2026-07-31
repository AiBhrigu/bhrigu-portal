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

const CSS = `
*{box-sizing:border-box}body{margin:0;background:#080a0e;color:#edf1f6;font-family:Inter,system-ui,sans-serif}
main{width:min(1000px,calc(100% - 28px));margin:auto;padding:26px 0 60px}h1{font-size:clamp(30px,5vw,54px);margin:26px 0 8px;letter-spacing:-.035em}.muted,p,li{color:#b8c2ce;line-height:1.65}.top{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;color:#8e9bad;font-size:12px;text-transform:uppercase;letter-spacing:.08em}.gate,.error{margin:20px 0;padding:12px 14px;border:1px solid #2b3542;border-radius:12px;background:#10151c}.error{border-color:#633b38;color:#f2c3be}.form{display:grid;grid-template-columns:1fr 150px auto;gap:10px;margin:22px 0}.form input,.form button{min-height:48px;border:1px solid #334050;border-radius:11px;font:inherit}.form input{padding:0 13px;background:#0e131a;color:#fff}.form button{padding:0 20px;font-weight:700}.answer{border:1px solid #293442;border-radius:16px;overflow:hidden;background:#0d1117}.head,.section,.proof{padding:21px 23px;border-bottom:1px solid #222b36}.proof{border:0;font-size:12px;color:#8f9baa}.kicker{font-size:11px;color:#83a5ce;letter-spacing:.09em}.route{display:flex;flex-wrap:wrap;gap:6px;margin-top:13px}.route span{border:1px solid #2d3948;border-radius:7px;padding:4px 7px;font-size:11px;color:#94a5b9}.section h3{margin-top:0}.section li+li{margin-top:8px}.chain{display:flex;flex-wrap:wrap;gap:7px;margin:0 0 20px}.chain span{border:1px solid #2c3745;border-radius:999px;padding:7px 10px;color:#9eabb9;font-size:12px}@media(max-width:700px){.form{grid-template-columns:1fr}.head,.section,.proof{padding:17px}}
`;

function ContextFields({ route, answer }: { route: Props["route"]; answer: Props["answer"] }) {
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
  return <>
    <style dangerouslySetInnerHTML={{ __html: CSS }}/>
    <main>
      <div className="top"><span>BTC Cosmographer · Local Linux RC</span><span>Source: {props.sourceState}</span></div>
      <h1>{ru ? "Коридор смыслов: аспекты 2026" : "Meaning corridor: 2026 aspects"}</h1>
      <p className="muted">{ru ? "Изолированный кандидат: многопланетные окна, явная значимость, хронология и возврат к теме без изменения production runtime." : "Isolated candidate: multi-body windows, explicit significance, chronology, and return-to-topic memory without changing production runtime."}</p>
      <div className="gate">LOCAL ONLY · BTC_LOCAL_RC=1{props.deploymentSourceSha ? ` · SHA ${props.deploymentSourceSha}` : ""}</div>

      <form className="form" method="get" action="/crypto-astro/btc/local-rc">
        <input type="hidden" name="lang" value={props.locale}/>
        <ContextFields route={props.route} answer={props.answer}/><MemoryFields memory={props.astroMemory}/>
        <input name="q" defaultValue={props.initialQuestion} placeholder={ru ? "Какие аспекты планет важны в 2026 году?" : "Which planetary aspects matter in 2026?"} required/>
        <input name="d" type="date" defaultValue={props.initialDate}/><button type="submit">{ru ? "Спросить" : "Ask"}</button>
      </form>

      <div className="chain"><span>1 · {ru ? "Годовой обзор" : "Annual overview"}</span><span>2 · {ru ? "Почему это важно?" : "Why does this matter?"}</span><span>3 · {ru ? "Ликвидность подтверждает?" : "Does liquidity confirm it?"}</span><span>4 · {ru ? "Теперь о халвинге" : "Now about halving"}</span><span>5 · {ru ? "Вернёмся к аспектам" : "Return to aspects"}</span></div>
      {props.inputError ? <div className="error">{props.inputError}</div> : null}

      {props.route && props.answer ? <article className="answer"
        data-route-domain={props.route.domain} data-route-subject={props.route.subject}
        data-route-scope={props.route.rc_scope} data-context-relation={props.route.context_relation}
        data-answer-mode={props.answer.answer_mode} data-answer-state={props.answer.answer_state}
        data-rc-schema={props.route.rc_schema}>
        <header className="head"><div className="kicker">{props.answer.answer_mode}</div><h2>{props.answer.headline}</h2><p>{props.answer.direct_answer}</p>
          <div className="route"><span>{props.route.domain}</span><span>{props.route.subject}</span><span>{props.route.rc_scope}</span><span>{props.route.context_relation}</span>{props.route.rc_intents.map((item)=><span key={item}>{item}</span>)}</div>
        </header>
        {props.answer.sections.map((section)=><section className="section" data-answer-section={section.id} key={section.id}><h3>{section.label}</h3>{section.paragraph?<p>{section.paragraph}</p>:null}{section.bullets?.length?<ul>{section.bullets.map((item)=><li key={item}>{item}</li>)}</ul>:null}</section>)}
        <footer className="proof"><strong>{props.answer.proof_label}</strong><br/>{props.answer.source_boundary}</footer>
      </article> : null}
    </main>
  </>;
}
