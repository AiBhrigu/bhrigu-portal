import type { BtcMarketEnvelope } from "../../lib/btc-market-envelope";
import type { BtcPublicSnapshot } from "../../lib/btc-public-output-contract";
import {
  formatBtcInactiveModule,
  formatBtcPlain,
  formatBtcProofSource,
  formatBtcProofStatus,
  formatBtcUncertainty,
  formatBtcUtcTimestamp,
  formatBtcWatchCondition,
  getBtcPublicCopy,
  type BtcPublicLocale,
} from "../../lib/btc-public-language-contract";
import { compact, factLine, money, narrativeLine, pct, sectionTitle } from "../../lib/btc-public-surface-format";
import { SealedBoundaryGlyph } from "./BtcSurfaceGlyphs";

export function BtcEvidenceZone({locale,envelope,result}:{locale:BtcPublicLocale;envelope:BtcMarketEnvelope;result:BtcPublicSnapshot}){
 const c=getBtcPublicCopy(locale);
 return <section id="evidence" className="readingZone zoneEvidence" aria-labelledby="evidence-title"><header className="zoneHeading"><div><p className="eyebrow">{c.evidenceEyebrow}</p><h2 id="evidence-title">{c.evidenceTitle}</h2></div><p>{c.evidenceIntro}</p></header><div className="evidenceStack">
  <details><summary>{c.detailedEvidence}</summary><ol className="moduleEvidenceList">{result.cosmographer_read.sections.map(s=><li key={s.section_id}><header><span>{String(s.order).padStart(2,"0")}</span><h3>{sectionTitle(locale,s.section_id)}</h3><em>{s.role==="primary"?c.primary:c.supporting}</em></header><p><b>{c.facts}</b> {factLine(locale,s.fact_payload)}</p><p><b>{c.cosmographerRead}</b> {narrativeLine(locale,s.read_template_id,s.fact_payload)}</p></li>)}</ol><div className="watchEvidence"><section><h3>{c.watchConditions}</h3><ol>{result.watch_conditions.map(item=><li key={item}>{formatBtcWatchCondition(locale,item)}</li>)}</ol></section><section><h3>{c.uncertainty}</h3><p>{formatBtcUncertainty(locale,result.uncertainty.freshness)}</p><p>{formatBtcUncertainty(locale,result.uncertainty.question_limit)}</p><p>{formatBtcUncertainty(locale,result.uncertainty.temporal_limit)}</p><p>{formatBtcUncertainty(locale,result.uncertainty.source_limit)}</p></section></div></details>
  <details><summary>{c.verifiedHistory}</summary>{envelope.verified_history.available?<><p>{envelope.verified_history.observation_window}</p><div className="historyTableWrap"><table><thead><tr><th>{c.checkpoint}</th><th>BTC</th><th>{c.dominance}</th><th>{c.breadth}</th><th>{c.stableShare}</th><th>{c.fieldRegime}</th><th>{c.commit}</th></tr></thead><tbody>{envelope.verified_history.checkpoints.map(x=><tr key={x.snapshot_id}><th>{formatBtcPlain(locale,x.role)}<small>{formatBtcUtcTimestamp(locale,x.accepted_at_utc)}</small></th><td>{money(x.btc_price_usd)}</td><td>{pct(x.btc_dominance_pct,2,false)}</td><td>{pct(x.alt_breadth_24h_pct,1,false)} / {pct(x.alt_breadth_7d_pct,1,false)}</td><td>{pct(x.stablecoin_share_pct,2,false)}</td><td>{compact(x.market_field_score,1)}<small>{formatBtcPlain(locale,x.regime)}</small></td><td><code>{x.commit_sha.slice(0,12)}</code></td></tr>)}</tbody></table></div><p className="methodNote">{locale==="ru"?c.methodologyDisclosure:envelope.verified_history.methodology_repair_disclosure}</p></>:<p>{c.historySuppressed}</p>}</details>
  <details className="sourceProof" data-current-snapshot-sha={envelope.source_proof.current_snapshot_sha256}><summary>{c.sourceProof}</summary><p><a href={envelope.source_proof.registry_url}>Snapshot Registry</a> · <a href={envelope.source_proof.delta_url}>Snapshot Delta</a> · <a href={envelope.source_proof.previous_snapshot_url}>{c.previousImmutable}</a></p>
   <section><h3>{c.reviewedSources}</h3><ul className="sourceRows">{result.source_proof.sources.map(source=><li key={source.label}><b>{formatBtcProofSource(source.label)}</b><span>{formatBtcProofStatus(locale,source.status)} · {formatBtcUtcTimestamp(locale,source.fetched_at_utc)}</span><a href={source.url}>{c.openSource}</a><code>{source.sha256}</code></li>)}</ul></section>
   <section><h3>{c.exactMemory}</h3><div className="exactMemoryTableWrap"><table><thead><tr><th>{c.metric}</th><th>{c.previousExact}</th><th>{c.currentExact}</th><th>{c.methodology}</th><th>{c.sources}</th></tr></thead><tbody>{envelope.memory.metrics.map(m=><tr key={m.metric_id}><th>{m.metric_id}</th><td><code>{m.previous_value}</code></td><td><code>{m.current_value}</code></td><td><code>{m.methodology_id}</code></td><td><code>{m.proof_sources.join(",")}</code></td></tr>)}</tbody></table></div></section>
   <section><h3>{c.immutableHashes}</h3><div className="hashList"><code>{c.currentSnapshot} · {envelope.source_proof.current_snapshot_sha256}</code><code>{c.previousSnapshot} · {envelope.source_proof.previous_snapshot_sha256}</code><code>{c.currentProof} · {envelope.source_proof.current_proof_sha256}</code><code>{c.previousProof} · {envelope.source_proof.previous_proof_sha256}</code><code>{c.currentBindings} · {envelope.source_proof.current_bindings_sha256}</code><code>{c.previousBindings} · {envelope.source_proof.previous_bindings_sha256}</code></div></section>
   <section className="closingBoundary"><h3>{c.publicBoundary}</h3><p>{c.boundaryText}</p><p><b>{c.inactive}:</b> {envelope.inactive_modules.map(x=>formatBtcInactiveModule(locale,x)).join(" · ")}</p></section>
  </details>
 </div><div className="proofClosure"><SealedBoundaryGlyph/><p>{c.closureText}</p></div></section>;
}
