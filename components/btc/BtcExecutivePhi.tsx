import type { BtcMarketEnvelope } from "../../lib/btc-market-envelope";
import type { BtcPublicSnapshot } from "../../lib/btc-public-output-contract";
import {
  formatBtcEnvelopeUncertainty,
  formatBtcEnvelopeWatchNext,
  formatBtcFocusAxis,
  formatBtcMemoryLabel,
  formatBtcModuleLabel,
  formatBtcObservationDate,
  formatBtcPlain,
  formatBtcQuestionLens,
  formatBtcRoleLabel,
  formatBtcSafetyOverlay,
  formatBtcStateLabel,
  formatBtcTransitionInterpretation,
  formatBtcTransitionLead,
  formatBtcUtcTimestamp,
  formatBtcWeakening,
  getBtcPublicCopy,
  type BtcPublicLocale,
} from "../../lib/btc-public-language-contract";
import { compact, memoryDelta, memoryValue, moduleSummary, money, pct, stateClass } from "../../lib/btc-public-surface-format";
import { FieldAnchorGlyph, RelationGlyph } from "./BtcSurfaceGlyphs";

type Node=BtcMarketEnvelope["phi_geometry"]["nodes"][number];
function Module({locale,envelope,node,primary=false}:{locale:BtcPublicLocale;envelope:BtcMarketEnvelope;node:Node;primary?:boolean}){
  return <article className={`phiModule ${primary?"primaryModule":"supportModule"} module-${node.id} ${node.role==="unavailable"?"supportUnavailable":""}`} data-role={node.role} data-module-id={node.id}><header><span className="moduleIndex">{node.index}</span><em>{formatBtcRoleLabel(locale,node.role)}</em></header><h3>{formatBtcModuleLabel(locale,node.id)}</h3><strong>{formatBtcStateLabel(locale,node.state)}</strong><p>{moduleSummary(locale,envelope,node.id)}</p></article>;
}

export function BtcObservationZone({locale,envelope,result}:{locale:BtcPublicLocale;envelope:BtcMarketEnvelope;result:BtcPublicSnapshot}){
 const c=getBtcPublicCopy(locale);const changed=envelope.memory.metrics.filter(m=>m.direction!=="UNCHANGED"||m.transition!=="UNCHANGED").slice(0,2).map(m=>`${formatBtcMemoryLabel(locale,m.metric_id)} ${memoryValue(locale,m,m.previous_value)} → ${memoryValue(locale,m,m.current_value)} (${memoryDelta(locale,m)})`);const confirms=envelope.synthesis.confirming_modules[0]?.split(":")[0];const weakens=formatBtcWeakening(locale,envelope.synthesis.state);
 return <section id="btc-read" className="readingZone zoneObservation" aria-labelledby="executive-read-title"><header className="readingHeader"><div><span>{c.question}</span><h2>{result.question.normalized}</h2></div><dl><div><dt>{c.observation}</dt><dd>{formatBtcObservationDate(locale,result.temporal_context.observation_date)}</dd></div><div><dt>{c.lens}</dt><dd>{formatBtcQuestionLens(locale,result.question.lens)}</dd></div><div><dt>{c.focus}</dt><dd>{formatBtcFocusAxis(locale,result.question.geometry.focus_axis)}</dd></div></dl></header>
 {result.question.safe_reframed&&<p className="reframe"><b>{formatBtcSafetyOverlay(locale,result.question.geometry.safety_overlay)}.</b> {c.directTradingRemoved}</p>}
 <section className="metricRibbon" aria-labelledby="current-metrics-title" data-source-generated-at={envelope.current.source_generated_at_utc}><header><p className="eyebrow">{c.currentMetrics}</p><h3 id="current-metrics-title">{c.metricsTitle}</h3><time>{formatBtcUtcTimestamp(locale,envelope.current.source_generated_at_utc)}</time></header><dl>
  <div><dt>BTC</dt><dd>{money(envelope.current.price_usd)}</dd><small>24h {pct(envelope.current.change_24h_pct)} · 7d {pct(envelope.current.change_7d_pct)} · 30d {pct(envelope.current.change_30d_pct)}</small></div>
  <div><dt>{c.dominance}</dt><dd>{pct(envelope.current.btc_dominance_pct,2,false)}</dd><small>{c.totalCap} {money(envelope.current.total_market_cap_usd)}</small></div>
  <div><dt>{c.marketField}</dt><dd>{compact(envelope.current.market_field_score,1)}</dd><small>{formatBtcPlain(locale,envelope.current.regime)} · {formatBtcPlain(locale,envelope.current.direction_bias)}</small></div>
  <div><dt>{c.liquidity}</dt><dd>{money(envelope.current.defi_tvl_usd)}</dd><small>DEX 24h {money(envelope.current.dex_volume_24h_usd)}</small></div>
  <div><dt>{c.participation}</dt><dd>{pct(envelope.current.alt_breadth_24h_pct,1,false)}</dd><small>7d {pct(envelope.current.alt_breadth_7d_pct,1,false)} · ETH {pct(envelope.current.eth_rotation_anchor_pct,2,false)}</small></div>
  <div><dt>{c.stablecoins}</dt><dd>{pct(envelope.current.stablecoin_share_pct,2,false)}</dd><small>{money(envelope.current.stablecoin_cap_usd)}</small></div>
 </dl></section>
 <section className="executiveField"><div className="executivePrimary"><p className="eyebrow">{c.executiveRead}</p><h3 id="executive-read-title">{formatBtcStateLabel(locale,envelope.synthesis.state)}</h3><p className="executiveLead">{formatBtcTransitionLead(locale,envelope.synthesis.state)}</p><dl><div><dt>{c.whatChanged}</dt><dd>{changed[0]??c.noTransition}</dd></div><div><dt>{c.whatChangedNext}</dt><dd>{changed[1]??c.noSecondTransition}</dd></div></dl></div><aside className="executiveContext"><dl><div><dt>{c.whatConfirms}</dt><dd>{confirms?(locale==="ru"?`${confirms} согласуется с маршрутизированной структурой.`:`${confirms} aligns with the routed structure.`):c.noConfirmation}</dd></div><div><dt>{c.whatWeakens}</dt><dd>{weakens??c.noContradiction}</dd></div><div><dt>{c.watchNext}</dt><dd>{formatBtcEnvelopeWatchNext(locale,envelope.current.source_generated_at_utc)}</dd></div><div><dt>{c.uncertaintyBoundary}</dt><dd>{formatBtcEnvelopeUncertainty(locale,envelope.current.source_freshness)}</dd></div></dl></aside></section></section>;
}

export function BtcPhiZone({locale,envelope}:{locale:BtcPublicLocale;envelope:BtcMarketEnvelope}){
 const c=getBtcPublicCopy(locale);const primary=envelope.phi_geometry.nodes.filter(n=>n.role==="primary");const support=envelope.phi_geometry.nodes.filter(n=>n.role!=="primary");
 return <section id="phi-field" className="readingZone zonePhi" aria-labelledby="phi-field-title"><header className="zoneHeading"><div><p className="eyebrow">{c.unifiedField}</p><h2 id="phi-field-title">{c.fiveModuleField}</h2></div><p>{c.twoLead}</p></header><div className="phiPlane"><RelationGlyph className="phiRouteGlyph"/><div className="primaryField"><Module locale={locale} envelope={envelope} node={primary[0]} primary/><div className="btcAxis"><FieldAnchorGlyph className="btcAxisGlyph"/><span>BTC</span><b>{c.centralGravity}</b><small>{formatBtcPlain(locale,envelope.question_class)}</small></div><Module locale={locale} envelope={envelope} node={primary[1]} primary/></div><div className="supportBand">{support.map(node=><Module key={node.id} locale={locale} envelope={envelope} node={node}/>)}</div></div>
 <div className={`fieldDirection ${stateClass(envelope.synthesis.state)}`} data-glyph-state={envelope.synthesis.state}><span>{formatBtcStateLabel(locale,envelope.synthesis.state)}</span><i aria-hidden="true"/><p>{formatBtcTransitionInterpretation(locale,envelope.synthesis.state)}</p></div>
 <section id="snapshot-memory" className="memoryAxis" aria-labelledby="memory-title"><header><div><p className="eyebrow">{c.acceptedMemory}</p><h3 id="memory-title">{c.previousCurrent}</h3></div><p>{envelope.memory.comparable_metric_count} {c.comparable} · {envelope.memory.unavailable_metrics.length} {c.unavailable}</p></header><div className="memoryScale" data-glyph-class="MEMORY_TRANSITION" aria-hidden="true"><span>{c.previousAccepted}</span><i/><span>{c.currentAccepted}</span></div><div className="memoryTableWrap"><table><thead><tr><th>{c.metric}</th><th>{c.previous}</th><th>{c.change}</th><th>{c.current}</th></tr></thead><tbody>{envelope.memory.metrics.map(m=><tr key={m.metric_id}><th>{formatBtcMemoryLabel(locale,m.metric_id)}</th><td>{memoryValue(locale,m,m.previous_value)}</td><td>{memoryDelta(locale,m)}</td><td>{memoryValue(locale,m,m.current_value)}</td></tr>)}</tbody></table></div></section></section>;
}
