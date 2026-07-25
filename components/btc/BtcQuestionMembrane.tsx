import type { BtcPublicSnapshot } from "../../lib/btc-public-output-contract";
import {
  formatBtcObservationDate,
  getBtcExampleRoutes,
  getBtcPublicCopy,
  type BtcPublicLocale,
} from "../../lib/btc-public-language-contract";
import { FieldAnchorGlyph, RelationGlyph } from "./BtcSurfaceGlyphs";

const href=(locale:BtcPublicLocale,question:string,date:string)=>{const p=[`lang=${locale}`,`q=${encodeURIComponent(question)}`];if(date)p.push(`d=${encodeURIComponent(date)}`);return`/crypto-astro/btc?${p.join("&")}`};

export function BtcFieldNavigation({locale}:{locale:BtcPublicLocale}){
  const c=getBtcPublicCopy(locale);
  return <nav className="fieldNav" aria-label={c.navAria}><FieldAnchorGlyph className="fieldNavGlyph"/><a href="#btc-question">{c.navQuestion}</a><a href="#btc-read">{c.navRead}</a><a href="#phi-field">{c.navPhi}</a><a href="#snapshot-memory">{c.navMemory}</a><a href="#evidence">{c.navEvidence}</a></nav>;
}

export function BtcQuestionMembrane({locale,initialQuestion,initialDate,result}:{locale:BtcPublicLocale;initialQuestion:string;initialDate:string;result:BtcPublicSnapshot|null}){
  const c=getBtcPublicCopy(locale);const routes=getBtcExampleRoutes(locale);
  const languageHref=(next:BtcPublicLocale)=>initialQuestion?href(next,initialQuestion,initialDate):`/crypto-astro/btc?lang=${next}`;
  return <section id="btc-question" className="questionPanel" aria-labelledby="btc-question-title"><div className="questionMembrane">
    <div className="questionCore"><header><div className="questionTitleLockup"><FieldAnchorGlyph className="questionGlyph"/><div><p className="eyebrow">{c.questionEyebrow}</p><h2 id="btc-question-title">{c.questionTitle}</h2></div></div>{result&&<div className="observation"><span>{c.observation}</span><b>{formatBtcObservationDate(locale,result.temporal_context.observation_date)}</b></div>}</header>
      <div className="languageSelector" aria-label={c.language}><span>{c.language}</span><a href={languageHref("en")} aria-current={locale==="en"?"true":undefined} data-locale-option="en">{c.languageEn}</a><a href={languageHref("ru")} aria-current={locale==="ru"?"true":undefined} data-locale-option="ru">{c.languageRu}</a></div>
      <form method="get" action="/crypto-astro/btc"><input type="hidden" name="lang" value={locale}/><label className="questionInput">{c.questionLabel}<textarea name="q" minLength={8} maxLength={280} required defaultValue={initialQuestion} placeholder={c.placeholder}/></label><label>{c.dateLabel}<input name="d" type="date" defaultValue={initialDate}/></label><button>{c.runButton}</button></form><p className="privacyNote">{c.privacy}</p>
    </div>
    <aside className="exampleRoutes" aria-labelledby="example-routes-title"><RelationGlyph className="exampleRelationGlyph"/><p className="eyebrow">{c.routesEyebrow}</p><h3 id="example-routes-title">{c.routesTitle}</h3><p>{c.routesIntro}</p><div className="exampleRouteList">{routes.map((route,index)=><a key={route.id} href={href(locale,route.question,initialDate)} data-example-route={route.id} data-expected-primary={route.expected_primary_modules.join(",")}><span>{String(index+1).padStart(2,"0")}</span><b>{route.label}</b><em>{route.question}</em><i aria-hidden="true">→</i></a>)}</div></aside>
  </div></section>;
}
