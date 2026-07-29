import type { BtcPublicSnapshot } from "../../lib/btc-public-output-contract";
import {
  getBtcExampleRoutes,
  getBtcPublicCopy,
  type BtcPublicLocale,
} from "../../lib/btc-public-language-contract";
import { FieldAnchorGlyph, RelationGlyph } from "./BtcSurfaceGlyphs";

const LIVE_PATH = "/crypto-astro/btc/live";
const href=(locale:BtcPublicLocale,question:string,date:string)=>{const p=[`lang=${locale}`,`q=${encodeURIComponent(question)}`];if(date)p.push(`d=${encodeURIComponent(date)}`);return`${LIVE_PATH}?${p.join("&")}`};

export function BtcFieldNavigation({locale}:{locale:BtcPublicLocale}){
  const c=getBtcPublicCopy(locale);
  return <nav className="fieldNav" aria-label={c.navAria}><FieldAnchorGlyph className="fieldNavGlyph"/><a href="#btc-question">{c.navQuestion}</a><a href="#btc-read">{c.navRead}</a><a href="#phi-field">{c.navPhi}</a><a href="#snapshot-memory">{c.navMemory}</a><a href="#evidence">{c.navEvidence}</a></nav>;
}

export function BtcQuestionMembrane({locale,initialDate}:{locale:BtcPublicLocale;initialQuestion:string;initialDate:string;result:BtcPublicSnapshot|null}){
  const c=getBtcPublicCopy(locale);
  const routes=getBtcExampleRoutes(locale);
  const ru=locale==="ru";
  return <section id="btc-question" className="questionPanel staticRouteProof" aria-labelledby="btc-question-title">
    <div className="questionMembrane proofRouteMembrane">
      <header className="staticProofHeader">
        <div className="questionTitleLockup"><FieldAnchorGlyph className="questionGlyph"/><div><p className="eyebrow">{ru?"Статическое доказательство":"Static proof"}</p><h2 id="btc-question-title">{ru?"Пять проверенных маршрутов":"Five verified routes"}</h2></div></div>
        <p>{ru
          ? "Статика сохраняет карту возможностей. Каждый маршрут открывает один чистый бесплатный диалог."
          : "The static surface preserves the capability map. Each route opens one clean free dialogue."}</p>
        <div className="languageSelector" aria-label={c.language}><span>{c.language}</span><a href="/crypto-astro/btc?lang=en" aria-current={locale==="en"?"true":undefined} data-locale-option="en">{c.languageEn}</a><a href="/crypto-astro/btc?lang=ru" aria-current={locale==="ru"?"true":undefined} data-locale-option="ru">{c.languageRu}</a></div>
      </header>
      <aside className="exampleRoutes staticExampleRoutes" aria-labelledby="example-routes-title"><RelationGlyph className="exampleRelationGlyph"/><p className="eyebrow">{c.routesEyebrow}</p><h3 id="example-routes-title">{c.routesTitle}</h3><p>{c.routesIntro}</p><div className="exampleRouteList">{routes.map((route,index)=><a key={route.id} href={href(locale,route.question,initialDate)} data-example-route={route.id} data-expected-primary={route.expected_primary_modules.join(",")}><span>{String(index+1).padStart(2,"0")}</span><b>{route.label}</b><em>{route.question}</em><i aria-hidden="true">→</i></a>)}</div></aside>
    </div>
  </section>;
}
