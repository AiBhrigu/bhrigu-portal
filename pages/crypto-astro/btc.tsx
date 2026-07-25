import Head from "next/head";
import type { GetServerSideProps } from "next";
import { BtcEvidenceZone } from "../../components/btc/BtcEvidence";
import { BtcObservationZone, BtcPhiZone } from "../../components/btc/BtcExecutivePhi";
import { BtcFieldNavigation, BtcQuestionMembrane } from "../../components/btc/BtcQuestionMembrane";
import { loadBtcMarketEnvelope, type BtcMarketEnvelope, type BtcMarketEnvelopeFailure } from "../../lib/btc-market-envelope";
import { BTC_BILINGUAL_SURFACE_CSS } from "../../lib/btc-bilingual-surface-style";
import { MARKET_COSMOGRAPHER_EXISTING_GLYPH_CANON_SHA256 } from "../../lib/btc-existing-glyph-canon";
import {
  formatBtcFailureMessage,
  formatBtcNarrativeReadLocalized,
  formatBtcUtcTimestamp,
  getBtcPublicCopy,
  normalizeBtcDisplayQuestion,
  resolveBtcPublicLocale,
  type BtcLocaleSource,
  type BtcPublicLocale,
} from "../../lib/btc-public-language-contract";
import { canonicalizeBtcQuestionForRouter } from "../../lib/btc-public-question-bridge";
import { composeBtcPublicSnapshot } from "../../lib/btc-public-snapshot-composer";
import { loadBtcStaticSource } from "../../lib/btc-public-static-source";
import { renderBtcNarrativeRead } from "../../lib/btc-narrative-template-catalog";
import type { BtcFailureCode, BtcPublicSnapshot, FreshnessState } from "../../lib/btc-public-output-contract";
import { factLine, formatBtcSnapshotTruth, sectionTitle } from "../../lib/btc-public-surface-format";

type Failure={code:BtcFailureCode;message:string;last_verified_at_utc:string|null};
type EnvelopeFailure={code:BtcMarketEnvelopeFailure["code"];message:string;last_verified_at_utc:string|null};
type SourceContext={state:FreshnessState;generated_at_utc:string|null;age_hours:number|null;proof_available:boolean};
type Props={result:BtcPublicSnapshot|null;failure:Failure|null;envelope:BtcMarketEnvelope|null;envelopeFailure:EnvelopeFailure|null;sourceContext:SourceContext;initialQuestion:string;initialDate:string;locale:BtcPublicLocale;localeSource:BtcLocaleSource};
const first=(v:string|string[]|undefined)=>Array.isArray(v)?v[0]??"":v??"";

function failureAgeHours(value:string|null):number|null{
 if(!value)return null;const generated=new Date(value).getTime(),now=Date.now();if(!Number.isFinite(generated)||generated>now)return null;return (now-generated)/3600000;
}

function applyFreshnessTruth(envelope:BtcMarketEnvelope,freshness:"FRESH"|"STALE_LIMITED"):BtcMarketEnvelope{
 const current={...envelope.current,source_freshness:freshness};
 if(freshness==="FRESH")return{...envelope,current};
 return{...envelope,current,synthesis:{...envelope.synthesis,state:"INSUFFICIENT_EVIDENCE",confirming_modules:[],contradicting_or_weakening_modules:["Accepted source is older than 24 hours; strong current-state language is suppressed."],why_this_matters:"The 24-hour freshness boundary is more important than a forced current-state conclusion.",uncertainty:["Accepted source is older than 24 hours; strong current-state language is suppressed.",...envelope.synthesis.uncertainty.slice(1)]}};
}

export const getServerSideProps:GetServerSideProps<Props>=async({query})=>{
 const initialQuestion=first(query.q),initialDate=first(query.d),resolved=resolveBtcPublicLocale(first(query.lang),initialQuestion);
 const source=await loadBtcStaticSource();
 const sourceContext:SourceContext=source.ok
  ?{state:source.freshness,generated_at_utc:source.snapshot.generated_at_utc,age_hours:source.age_hours,proof_available:true}
  :{state:"UNAVAILABLE",generated_at_utc:source.last_verified_at_utc??null,age_hours:failureAgeHours(source.last_verified_at_utc??null),proof_available:false};
 const empty:Props={result:null,failure:null,envelope:null,envelopeFailure:null,sourceContext,initialQuestion:"",initialDate,locale:resolved.locale,localeSource:resolved.source};
 if(!initialQuestion)return{props:empty};
 if(source.ok===false)return{props:{...empty,initialQuestion,failure:{code:source.code,message:source.message,last_verified_at_utc:source.last_verified_at_utc??null}}};
 const coreQuestion=canonicalizeBtcQuestionForRouter(initialQuestion);const composed=await composeBtcPublicSnapshot(source,{question:coreQuestion,date:initialDate||undefined});
 if(composed.ok===false)return{props:{...empty,initialQuestion,failure:{code:composed.code,message:composed.message,last_verified_at_utc:null}}};
 const result:BtcPublicSnapshot={...composed.value,question:{...composed.value.question,raw:initialQuestion,normalized:normalizeBtcDisplayQuestion(initialQuestion)}};
 const market=await loadBtcMarketEnvelope(coreQuestion,{temporal:{state:result.temporal_context.state,label:result.temporal_context.label,harmonic_tension:result.aspect_pressure.harmonic_tension}});
 if(market.ok===false){
  return{props:{result,failure:null,envelope:null,envelopeFailure:{code:market.code,message:market.message,last_verified_at_utc:market.last_verified_at_utc??null},sourceContext,initialQuestion,initialDate,locale:resolved.locale,localeSource:resolved.source}};
 }
 return{props:{result,failure:null,envelope:applyFreshnessTruth(market.value,source.freshness),envelopeFailure:null,sourceContext,initialQuestion,initialDate,locale:resolved.locale,localeSource:resolved.source}};
};

function BoundedFallback({locale,result,envelopeFailure}:{locale:BtcPublicLocale;result:BtcPublicSnapshot;envelopeFailure:EnvelopeFailure|null}){
 const c=getBtcPublicCopy(locale);return<><section id="btc-read" className="readingZone failure"><p className="eyebrow">{c.envelopeFail}</p><h2>{c.envelopeUnavailable}</h2><p>{formatBtcFailureMessage(locale,envelopeFailure?.code??"",envelopeFailure?.message??c.envelopeCouldNotVerify)}</p><p>{c.envelopeFallback}</p></section><section id="phi-field" className="readingZone failure"><h2>{c.boundedEvidence}</h2>{result.cosmographer_read.sections.map(s=><article key={s.section_id}><h3>{sectionTitle(locale,s.section_id)}</h3><p>{factLine(locale,s.fact_payload)}</p><p>{locale==="ru"?formatBtcNarrativeReadLocalized(locale,s.read_template_id,s.fact_payload):renderBtcNarrativeRead(s.read_template_id,s.fact_payload)}</p></article>)}</section><section id="evidence" className="readingZone failure"><h2>{c.publicBoundary}</h2><p>{c.boundaryText}</p></section></>;
}

export default function Page(p:Props){
 const c=getBtcPublicCopy(p.locale),inputFailure=p.failure?.code==="invalid_input";
 const truth=formatBtcSnapshotTruth(p.locale,p.sourceContext.state,p.sourceContext.generated_at_utc,p.sourceContext.age_hours,p.sourceContext.proof_available);
 return<><Head><title>{c.pageTitle}</title><meta name="description" content={c.metaDescription}/><meta name="btc-glyph-canon-sha256" content={MARKET_COSMOGRAPHER_EXISTING_GLYPH_CANON_SHA256}/></Head><style dangerouslySetInnerHTML={{__html:BTC_BILINGUAL_SURFACE_CSS}}/><style dangerouslySetInnerHTML={{__html:"html{scroll-behavior:auto!important}"}}/><main lang={p.locale} data-locale={p.locale} data-locale-source={p.localeSource}><section className="hero"><p className="eyebrow">{c.heroEyebrow}</p><h1>{c.heroTitle}</h1><p>{c.heroLead}</p></section><BtcFieldNavigation locale={p.locale}/><section className="snapshotTruthStrip" data-freshness-state={p.sourceContext.state} data-source-generated-at={p.sourceContext.generated_at_utc??""} aria-label={truth.stateLabel}><strong>{truth.stateLabel}</strong><p>{truth.snapshotLine}</p>{truth.ageLine&&<p>{truth.ageLine}</p>}<p>{truth.proofLine}</p></section><BtcQuestionMembrane locale={p.locale} initialQuestion={p.initialQuestion} initialDate={p.initialDate} result={p.result}/>
 {p.failure&&<section className="failure" role="alert"><p className="eyebrow">{inputFailure?c.questionCheck:c.sourceFailure}</p><h2>{inputFailure?c.adjustQuestion:c.fieldUnavailable}</h2><p>{formatBtcFailureMessage(p.locale,p.failure.code,p.failure.message)}</p>{p.failure.last_verified_at_utc&&<p>{c.lastVerified}: {formatBtcUtcTimestamp(p.locale,p.failure.last_verified_at_utc)}</p>}<details><summary>{c.technicalDetails}</summary><code>{p.failure.code}</code></details></section>}
 {p.result&&<section className="reading" aria-label={p.locale==="ru"?"Чтение Космографа BTC":"BTC Cosmographer reading"}>{p.envelope?<><BtcObservationZone locale={p.locale} envelope={p.envelope} result={p.result}/><BtcPhiZone locale={p.locale} envelope={p.envelope}/><BtcEvidenceZone locale={p.locale} envelope={p.envelope} result={p.result}/></>:<BoundedFallback locale={p.locale} result={p.result} envelopeFailure={p.envelopeFailure}/>}</section>}<div className="closingField" aria-hidden="true"><span/></div></main></>;
}
