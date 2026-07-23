import type { BtcNarrativeSectionFactPayload } from "./btc-deterministic-narrative-router";
import type { BtcMarketEnvelope, BtcMetricDelta } from "./btc-market-envelope";
import {
  formatBtcDominanceBand,
  formatBtcMarketContext,
  formatBtcMemoryLabel,
  formatBtcModuleLabel,
  formatBtcNarrativeReadLocalized,
  formatBtcObservationDate,
  formatBtcPlain,
  formatBtcRoleLabel,
  formatBtcStateLabel,
  formatBtcTemporalState,
  type BtcPublicLocale,
} from "./btc-public-language-contract";
import { renderBtcNarrativeRead } from "./btc-narrative-template-catalog";

export const compact = (value:number, decimals:number) => { const fixed=value.toFixed(decimals); return fixed.includes(".")?fixed.replace(/\.?0+$/,""):fixed; };
export const money = (value:number, signed=false) => { const a=Math.abs(value); const d=a>=1e12?1e12:a>=1e9?1e9:a>=1e6?1e6:a>=1e3?1e3:1; const s=d===1e12?"T":d===1e9?"B":d===1e6?"M":d===1e3?"K":""; const n=a/d; return `${value<0?"−":signed&&value>0?"+":""}$${compact(n,s?(n>=100?0:2):2)}${s}`; };
export const pct = (value:number, decimals=2, signed=true) => `${value<0?"−":signed&&value>0?"+":""}${compact(Math.abs(value),decimals)}%`;
export const stateClass = (value:string) => value==="CONFIRMATION"?"directionConfirmation":value==="DIVERGENCE"?"directionDivergence":"directionLimited";

export function memoryValue(locale:BtcPublicLocale, metric:BtcMetricDelta, value:string) {
  const n=Number(value); if(metric.type!=="NUMERIC"||!Number.isFinite(n)) return formatBtcPlain(locale,value);
  if(metric.unit==="usd") return money(n); if(metric.unit==="percent") return `${compact(n,metric.metric_id.includes("breadth")?1:2)}%`; if(metric.unit==="score_0_100") return compact(n,1); return compact(n,2);
}
export function memoryDelta(locale:BtcPublicLocale, metric:BtcMetricDelta) {
  if(metric.type!=="NUMERIC") return metric.transition==="UNCHANGED"?(locale==="ru"?"Без изменений":"No change"):formatBtcPlain(locale,metric.transition??metric.direction);
  const n=Number(metric.display_delta); if(!Number.isFinite(n)) return formatBtcStateLabel(locale,metric.direction); if(metric.unit==="usd") return money(n,true);
  const sign=n<0?"−":n>0?"+":""; const v=compact(Math.abs(n),metric.metric_id.includes("breadth")||metric.unit==="score_0_100"?1:2); const unit=metric.unit==="percent"?(locale==="ru"?" п.п.":" pp"):(locale==="ru"?" пт.":" pts"); return `${sign}${v}${unit}`;
}

const TITLES:Record<BtcPublicLocale,Record<BtcNarrativeSectionFactPayload["section_id"],string>>={
  en:{what_changed:"ROLLING MARKET CONTEXT",why_it_matters:"WHY IT MATTERS",current_structure:"CURRENT STRUCTURE",dominant_pressures:"DOMINANT PRESSURES",relative_market_field:"RELATIVE MARKET FIELD",temporal_context:"TEMPORAL CONTEXT"},
  ru:{what_changed:"ТЕКУЩИЙ РЫНОЧНЫЙ КОНТЕКСТ",why_it_matters:"ПОЧЕМУ ЭТО ВАЖНО",current_structure:"ТЕКУЩАЯ СТРУКТУРА",dominant_pressures:"ДОМИНИРУЮЩИЕ ДАВЛЕНИЯ",relative_market_field:"ОТНОСИТЕЛЬНОЕ РЫНОЧНОЕ ПОЛЕ",temporal_context:"ВРЕМЕННОЙ КОНТЕКСТ"},
};
export const sectionTitle=(locale:BtcPublicLocale,id:BtcNarrativeSectionFactPayload["section_id"])=>TITLES[locale][id];

export function factLine(locale:BtcPublicLocale,p:BtcNarrativeSectionFactPayload):string {
  switch(p.section_id){
    case"what_changed":return locale==="ru"?`BTC ${money(p.price_usd)} · 24ч ${pct(p.change_24h_pct)} · 7д ${pct(p.change_7d_pct)} · 30д ${pct(p.change_30d_pct)} · капитализация 24ч ${pct(p.market_cap_change_24h_pct)}.`:`BTC ${money(p.price_usd)} · 24h ${pct(p.change_24h_pct)} · 7d ${pct(p.change_7d_pct)} · 30d ${pct(p.change_30d_pct)} · total-cap 24h ${pct(p.market_cap_change_24h_pct)}.`;
    case"why_it_matters":return locale==="ru"?`Доминирование ${compact(p.dominance_pct,2)}% · ${formatBtcDominanceBand(locale,p.dominance_band)} · ранг №${p.market_cap_rank} · ${formatBtcMarketContext(locale,p.market_context_label)}.`:`Dominance ${compact(p.dominance_pct,2)}% · ${formatBtcDominanceBand(locale,p.dominance_band)} · rank #${p.market_cap_rank} · ${formatBtcMarketContext(locale,p.market_context_label)}.`;
    case"current_structure":return `${formatBtcPlain(locale,p.regime_label)} · ${locale==="ru"?"поле":"field"} ${compact(p.field_score,1)} · ${formatBtcPlain(locale,p.direction_bias)} · ${formatBtcPlain(locale,p.liquidity_state)}.`;
    case"dominant_pressures":return `${p.pressure_label} · ${formatBtcTemporalState(locale,p.temporal_state)} · ${p.harmonic_tension===null?(locale==="ru"?"числовое давление недоступно":"numeric pressure unavailable"):`${locale==="ru"?"напряжение":"tension"} ${compact(p.harmonic_tension,2)}`} · ${locale==="ru"?"доля стейблкоинов":"stablecoin share"} ${compact(p.stablecoin_share_pct,2)}%.`;
    case"relative_market_field":return `${locale==="ru"?"Доминирование BTC":"BTC dominance"} ${compact(p.dominance_pct,2)}% · ${locale==="ru"?"ширина альткоинов":"alt breadth"} ${compact(p.alt_breadth_24h_pct,1)}% · ${locale==="ru"?"доля стейблкоинов":"stablecoin share"} ${compact(p.stablecoin_share_pct,2)}%.`;
    case"temporal_context":return `${formatBtcTemporalState(locale,p.temporal_state)} · ${locale==="ru"?"наблюдение":"observation"} ${formatBtcObservationDate(locale,p.observation_date)}.`;
  }
}
export function narrativeLine(locale:BtcPublicLocale, templateId:Parameters<typeof renderBtcNarrativeRead>[0], payload:BtcNarrativeSectionFactPayload){ return locale==="ru"?formatBtcNarrativeReadLocalized(locale,templateId,payload):renderBtcNarrativeRead(templateId,payload); }

export function moduleSummary(locale:BtcPublicLocale,envelope:BtcMarketEnvelope,id:string){
  if(id==="market_structure")return `${locale==="ru"?"Поле":"Field"} ${compact(envelope.current.market_field_score,1)} · ${locale==="ru"?"доминирование":"dominance"} ${pct(envelope.current.btc_dominance_pct,2,false)} · ${formatBtcPlain(locale,envelope.current.regime)}`;
  if(id==="liquidity_membrane")return `DeFi TVL ${money(envelope.current.defi_tvl_usd)} · DEX 24h ${money(envelope.current.dex_volume_24h_usd)} · ${locale==="ru"?"доля стейблкоинов":"stable share"} ${pct(envelope.current.stablecoin_share_pct,2,false)}`;
  if(id==="change_event_memory")return `${envelope.memory.comparable_metric_count} ${locale==="ru"?"сопоставимых метрик":"comparable metrics"} · ${formatBtcStateLabel(locale,envelope.synthesis.state)}`;
  if(id==="temporal_context"){const t=envelope.current.bounded_temporal_context.harmonic_tension;return `${formatBtcTemporalState(locale,envelope.current.bounded_temporal_context.state)} · ${locale==="ru"?"напряжение":"tension"} ${t===null?(locale==="ru"?"недоступно":"unavailable"):compact(t,2)}`;}
  return `${formatBtcStateLabel(locale,envelope.synthesis.state)} · ${locale==="ru"?"детерминированное публичное закрытие":"deterministic public closure"}`;
}
export { formatBtcMemoryLabel, formatBtcModuleLabel, formatBtcRoleLabel, formatBtcStateLabel };
