export const PHI_CONSTANT = 1.61803398875 as const;
export const PHI_PRIMARY_FIELD_PCT = 61.803398875 as const;
export const PHI_SUPPORT_FIELD_PCT = 38.196601125 as const;
export const BTC_MARKET_ENVELOPE_SCHEMA = "bhrigu_btc_market_envelope_v0_1" as const;

export const BTC_MARKET_ENVELOPE_URLS = {
  snapshot: "https://aibhrigu.github.io/phi-cosmography-open/crypto-astro/data/crypto_astro_snapshot.public.json",
  proof: "https://aibhrigu.github.io/phi-cosmography-open/crypto-astro/data/crypto_astro_snapshot_proof.public.json",
  marketField: "https://aibhrigu.github.io/phi-cosmography-open/crypto-astro/data/market_field_snapshot.public.v0_1.json",
  bindings: "https://aibhrigu.github.io/phi-cosmography-open/crypto-astro/data/crypto_astro_module_bindings.public.json",
  registry: "https://aibhrigu.github.io/phi-cosmography-open/crypto-astro/data/crypto_astro_snapshot_registry.public.json",
  delta: "https://aibhrigu.github.io/phi-cosmography-open/crypto-astro/data/crypto_astro_snapshot_delta.public.json",
} as const;

const METRICS = ["btc_gravity_pct", "stablecoin_share_pct", "alt_breadth_24h_pct", "alt_breadth_7d_pct", "market_field_score", "regime_label", "defi_tvl_usd", "liquidity_context_state"] as const;
export const BTC_GOLDEN_MODULE_IDS = ["market_structure", "liquidity_membrane", "change_event_memory", "temporal_context", "cosmographer_review"] as const;
export type BtcGoldenModuleId = typeof BTC_GOLDEN_MODULE_IDS[number];
export type BtcEnvelopeQuestionClass = "btc_gravity" | "market_structure" | "liquidity" | "market_participation_rotation" | "change_memory" | "temporal_pressure" | "general_btc_field";
export type BtcSignalDirection = "UP" | "DOWN" | "UNCHANGED" | "BOUNDED" | "UNAVAILABLE";
export type BtcSynthesisState = "CONFIRMATION" | "DIVERGENCE" | "INSUFFICIENT_EVIDENCE";
export type BtcEnvelopeTemporalInput = { state: "available_bounded" | "static_state_only" | "unavailable"; label: string; harmonic_tension: number | null };
export type BtcMarketEnvelopeDocuments = { snapshot: unknown; proof: unknown; marketField: unknown; bindings: unknown; registry: unknown; delta: unknown; previousSnapshot?: unknown };
export type BtcMarketEnvelopeFailure = { ok: false; code: "source_missing" | "source_timeout" | "source_schema_invalid" | "source_incompatible" | "snapshot_too_old" | "memory_incompatible"; message: string; last_verified_at_utc?: string };
export type BtcMetricDelta = { metric_id: string; type: "NUMERIC" | "CATEGORICAL"; status: "COMPARABLE"; current_value: string; previous_value: string; direction: BtcSignalDirection; display_delta: string | null; transition: string | null; unit: string; methodology_id: string; proof_sources: string[] };

type Checkpoint = { role: "previous" | "current"; accepted_at_utc: string; commit_sha: string; snapshot_id: string; btc_price_usd: number; btc_dominance_pct: number; alt_breadth_24h_pct: number; alt_breadth_7d_pct: number; stablecoin_share_pct: number; market_field_score: number; regime: string };
export type BtcMarketEnvelope = {
  schema_version: typeof BTC_MARKET_ENVELOPE_SCHEMA; generated_at_utc: string; question_class: BtcEnvelopeQuestionClass;
  phi_geometry: { phi_constant: typeof PHI_CONSTANT; primary_field_pct: typeof PHI_PRIMARY_FIELD_PCT; support_field_pct: typeof PHI_SUPPORT_FIELD_PCT; nodes: Array<{ id: BtcGoldenModuleId; index: "01" | "02" | "03" | "04" | "05"; label: string; role: "primary" | "supporting" | "unavailable"; state: BtcSignalDirection; evidence: string[] }> };
  route: { route_version: "btc_module_applicability_route_v0_1"; primary_modules: readonly [BtcGoldenModuleId, BtcGoldenModuleId]; supporting_modules: BtcGoldenModuleId[]; unavailable_modules: BtcGoldenModuleId[]; watch_profile: string; narrative_profile: string; safety_boundary: "PUBLIC_RESEARCH_CONTEXT_ONLY" };
  current: { price_usd: number; change_24h_pct: number; change_7d_pct: number; change_30d_pct: number; btc_dominance_pct: number; total_market_cap_usd: number; total_market_volume_24h_usd: number; market_cap_change_24h_pct: number; stablecoin_cap_usd: number; stablecoin_share_pct: number; market_field_score: number; regime: string; direction_bias: string; alt_breadth_24h_pct: number; alt_breadth_7d_pct: number; eth_rotation_anchor_pct: number; top_10_flow_concentration_pct: number; defi_tvl_usd: number; dex_volume_24h_usd: number; liquidity_context_state: string; continuation_field: { base_path_pct: number; expansion_path_pct: number; compression_reversal_pct: number; window_label: string; boundary: string }; source_freshness: "FRESH" | "STALE_LIMITED"; source_generated_at_utc: string; bounded_temporal_context: BtcEnvelopeTemporalInput };
  memory: { comparison_status: string; current_snapshot_id: string; previous_snapshot_id: string; current_commit_sha: string; previous_commit_sha: string; comparable_metric_count: number; unavailable_metrics: string[]; methodology_compatible: boolean; metrics: BtcMetricDelta[]; transition_interpretation: string };
  synthesis: { state: BtcSynthesisState; what_changed: string[]; remained_stable: string[]; confirming_modules: string[]; contradicting_or_weakening_modules: string[]; why_this_matters: string; watch_next: string[]; uncertainty: string[] };
  verified_history: { available: boolean; observation_window: string; checkpoints: Checkpoint[]; methodology_repair_disclosure: string };
  source_proof: { source_mode: "static_public_snapshot"; proof_source_count: number; current_snapshot_sha256: string; previous_snapshot_sha256: string; current_proof_sha256: string; previous_proof_sha256: string; current_bindings_sha256: string; previous_bindings_sha256: string; registry_url: string; delta_url: string; previous_snapshot_url: string };
  inactive_modules: string[]; boundary: { read_only: true; no_live_provider_call_during_request: true; no_trading_signal: true; no_forecast: true; no_price_target: true; no_personal_memory_claim: true; no_orion_exposure: true };
};
export type BtcMarketEnvelopeResult = { ok: true; value: BtcMarketEnvelope } | BtcMarketEnvelopeFailure;

const LABEL: Record<BtcGoldenModuleId, string> = { market_structure: "MARKET STRUCTURE", liquidity_membrane: "LIQUIDITY MEMBRANE", change_event_memory: "CHANGE / EVENT MEMORY", temporal_context: "TEMPORAL CONTEXT", cosmographer_review: "COSMOGRAPHER REVIEW" };
const INDEX: Record<BtcGoldenModuleId, "01" | "02" | "03" | "04" | "05"> = { market_structure: "01", liquidity_membrane: "02", change_event_memory: "03", temporal_context: "04", cosmographer_review: "05" };
const PRIMARY: Record<BtcEnvelopeQuestionClass, readonly [BtcGoldenModuleId, BtcGoldenModuleId]> = {
  btc_gravity: ["market_structure", "change_event_memory"], market_structure: ["market_structure", "liquidity_membrane"], liquidity: ["liquidity_membrane", "market_structure"], market_participation_rotation: ["market_structure", "change_event_memory"], change_memory: ["change_event_memory", "market_structure"], temporal_pressure: ["temporal_context", "change_event_memory"], general_btc_field: ["market_structure", "change_event_memory"],
};

const rec = (v: unknown): v is Record<string, unknown> => Boolean(v) && typeof v === "object" && !Array.isArray(v);
const finite = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
const text = (v: unknown, max = 4096): v is string => typeof v === "string" && v.trim().length > 0 && v.length <= max;
const time = (v: unknown): v is string => typeof v === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(v) && Number.isFinite(new Date(v).getTime());
const sha = (v: unknown, size: 40 | 64): v is string => typeof v === "string" && new RegExp(`^[a-f0-9]{${size}}$`).test(v);
function at(v: unknown, path: string): unknown { let c = v; for (const key of path.split(".")) { if (!rec(c) || !(key in c)) return undefined; c = c[key]; } return c; }
const n = (v: unknown, path: string) => finite(at(v, path)) ? at(v, path) as number : null;
const s = (v: unknown, path: string) => text(at(v, path)) ? at(v, path) as string : null;

export function classifyBtcEnvelopeQuestion(q: string): BtcEnvelopeQuestionClass {
  const x = q.toLowerCase();
  if (/dominance|gravity|leadership/.test(x)) return "btc_gravity";
  if (/liquid|tvl|stablecoin|dex/.test(x)) return "liquidity";
  if (/breadth|rotation|altcoin|participation|eth/.test(x)) return "market_participation_rotation";
  if (/changed|change|memory|previous|delta|since/.test(x)) return "change_memory";
  if (/temporal|pressure|date|phase|tension/.test(x)) return "temporal_pressure";
  if (/structure|regime|field score|market cap/.test(x)) return "market_structure";
  return "general_btc_field";
}

function parseMetric(id: string, v: unknown): BtcMetricDelta | null {
  if (!rec(v) || v.status !== "COMPARABLE" || !text(v.current_value) || !text(v.previous_value) || !text(v.methodology_id) || !text(v.unit) || !Array.isArray(v.proof_sources)) return null;
  const type = v.type === "NUMERIC" ? "NUMERIC" : v.type === "CATEGORICAL" ? "CATEGORICAL" : null;
  if (!type) return null;
  const direction: BtcSignalDirection = type === "NUMERIC" && ["UP", "DOWN", "UNCHANGED"].includes(String(v.direction)) ? v.direction as BtcSignalDirection : type === "CATEGORICAL" && v.transition === "UNCHANGED" ? "UNCHANGED" : "BOUNDED";
  return { metric_id: id, type, status: "COMPARABLE", current_value: v.current_value, previous_value: v.previous_value, direction, display_delta: text(v.display_delta) ? v.display_delta : null, transition: text(v.transition) ? v.transition : null, unit: v.unit, methodology_id: v.methodology_id, proof_sources: v.proof_sources.filter(text) };
}

function checkpoint(snapshot: unknown, entry: Record<string, unknown>, role: "previous" | "current"): Checkpoint | null {
  const values = [n(snapshot,"public_samples.assets.BTC.price_usd"), n(snapshot,"market_reality.btc_dominance_pct"), n(snapshot,"altcoin_rotation.alt_breadth_24h_pct"), n(snapshot,"altcoin_rotation.alt_breadth_7d_pct"), n(snapshot,"market_reality.stablecoin_share_pct"), n(snapshot,"field_output.market_field_score")];
  const regime = s(snapshot,"field_output.regime_label");
  if (values.some(v => v === null) || !regime || !time(entry.generated_at_utc) || at(snapshot,"generated_at_utc") !== entry.generated_at_utc || !sha(entry.commit_sha,40) || !text(entry.snapshot_id)) return null;
  return { role, accepted_at_utc: entry.generated_at_utc, commit_sha: entry.commit_sha, snapshot_id: entry.snapshot_id, btc_price_usd: values[0]!, btc_dominance_pct: values[1]!, alt_breadth_24h_pct: values[2]!, alt_breadth_7d_pct: values[3]!, stablecoin_share_pct: values[4]!, market_field_score: values[5]!, regime };
}

const METRIC_LABEL: Record<string,string> = { btc_gravity_pct:"BTC dominance", stablecoin_share_pct:"Stablecoin share", alt_breadth_24h_pct:"Alt breadth 24h", alt_breadth_7d_pct:"Alt breadth 7d", market_field_score:"Market Field Score", regime_label:"Regime", defi_tvl_usd:"DeFi TVL", liquidity_context_state:"Liquidity context" };
const deltaLine = (m: BtcMetricDelta) => `${METRIC_LABEL[m.metric_id] ?? m.metric_id.replace(/_/g," ")}: ${m.previous_value} → ${m.current_value}${m.display_delta ? ` (${m.display_delta} ${m.unit})` : m.transition ? ` (${m.transition})` : ""}.`;

export function buildBtcMarketEnvelopeFromDocuments(question: string, docs: BtcMarketEnvelopeDocuments, options: { now?: Date; temporal?: BtcEnvelopeTemporalInput } = {}): BtcMarketEnvelopeResult {
  const now = options.now ?? new Date();
  const temporal = options.temporal ?? { state:"unavailable", label:"bounded_cosmographic_metric", harmonic_tension:null };
  const { snapshot, proof, marketField, bindings, registry, delta, previousSnapshot } = docs;
  if (![snapshot,proof,marketField,bindings,registry,delta].every(rec)) return { ok:false, code:"source_schema_invalid", message:"Market envelope artifacts must be JSON objects." };
  const S=snapshot as Record<string,unknown>, P=proof as Record<string,unknown>, F=marketField as Record<string,unknown>, B=bindings as Record<string,unknown>, R=registry as Record<string,unknown>, D=delta as Record<string,unknown>;
  if (S.schema_version!=="crypto_astro_snapshot_public_v0_1" || P.schema_version!=="crypto_astro_snapshot_proof_public_v0_1" || F.schema_version!=="crypto_astro_market_field_public_v0_2" || B.schema_version!=="crypto_astro_public_module_bindings_v0_1" || R.schema_version!=="crypto_astro_snapshot_registry_public_v0_2" || D.schema_version!=="crypto_astro_snapshot_delta_public_v0_2") return { ok:false, code:"source_schema_invalid", message:"One or more market envelope schemas are incompatible." };
  const currentRegistry=rec(R.current)?R.current:null, previousRegistry=rec(R.previous)?R.previous:null;
  if (!currentRegistry || !previousRegistry || currentRegistry.acceptance_status!=="ACCEPTED" || previousRegistry.acceptance_status!=="ACCEPTED" || R.selection_policy!=="EXPLICIT_ACCEPTED_PAIR") return { ok:false, code:"memory_incompatible", message:"Snapshot Registry does not contain an explicit accepted pair." };
  const generated=S.generated_at_utc;
  const timestamps=[generated,P.generated_at_utc,F.updated_at_utc,B.generated_at_utc,currentRegistry.generated_at_utc,D.generated_at_utc];
  if (!timestamps.every(time) || new Set(timestamps).size!==1) return { ok:false, code:"source_incompatible", message:"Current artifacts are not timestamp-compatible.", last_verified_at_utc:time(generated)?generated:undefined };
  const age=(now.getTime()-new Date(generated as string).getTime())/36e5;
  if (!Number.isFinite(age) || age<-.084) return { ok:false, code:"source_incompatible", message:"Accepted timestamp is invalid or in the future.", last_verified_at_utc:generated as string };
  if (age>168) return { ok:false, code:"snapshot_too_old", message:"Accepted snapshot is outside the seven-day boundary.", last_verified_at_utc:generated as string };
  if (at(snapshot,"liquidity_tvl.defi_tvl_methodology_id")!=="defillama_historical_chain_tvl_ex_double_count_v0_1" || at(snapshot,"liquidity_tvl.defi_tvl_excludes_double_counted")!==true || at(snapshot,"liquidity_tvl.defi_tvl_excludes_liquid_staking")!==true) return { ok:false, code:"source_incompatible", message:"DeFi TVL methodology is not the accepted non-double-counted contract." };
  const proofSources=Array.isArray(P.sources)?P.sources:[];
  if (proofSources.length<7 || !proofSources.every(item=>rec(item)&&item.status==="PASS"&&text(item.label)&&text(item.url))) return { ok:false, code:"source_schema_invalid", message:"Source proof is incomplete." };
  if (!text(D.current_snapshot_id) || !text(D.previous_snapshot_id) || D.current_snapshot_id!==currentRegistry.snapshot_id || D.previous_snapshot_id!==previousRegistry.snapshot_id) return { ok:false, code:"memory_incompatible", message:"Snapshot Delta is not bound to the accepted Registry pair." };

  const methodologies=rec(R.metric_methodologies)?R.metric_methodologies:{}, deltaMetrics=rec(D.metrics)?D.metrics:{}, unavailable:string[]=rec(D.unavailable_metrics)?Object.keys(D.unavailable_metrics):[], metrics:BtcMetricDelta[]=[];
  for (const id of METRICS) { const method=rec(methodologies[id])?methodologies[id]:null; if (!method || method.comparable!==true || method.current_methodology_id!==method.previous_methodology_id) { unavailable.push(id); continue; } const parsed=parseMetric(id,deltaMetrics[id]); parsed?metrics.push(parsed):unavailable.push(id); }

  const paths=["public_samples.assets.BTC.price_usd","public_samples.assets.BTC.market_24h_change_pct","public_samples.assets.BTC.market_7d_change_pct","public_samples.assets.BTC.market_30d_change_pct","market_reality.btc_dominance_pct","market_reality.total_market_cap_usd","market_reality.volume_24h_usd","market_reality.market_cap_change_24h_pct","market_reality.stablecoin_cap_usd","market_reality.stablecoin_share_pct","field_output.market_field_score","altcoin_rotation.alt_breadth_24h_pct","altcoin_rotation.alt_breadth_7d_pct","altcoin_rotation.eth_rotation_anchor_pct","altcoin_rotation.top_10_flow_concentration_pct","liquidity_tvl.defi_tvl_usd","liquidity_tvl.dex_volume_24h_usd","probability_continuation.base_path_pct","probability_continuation.expansion_path_pct","probability_continuation.compression_reversal_pct"];
  const values=paths.map(path=>n(snapshot,path));
  if (values.some(value=>value===null)) return { ok:false, code:"source_schema_invalid", message:"Required BTC market-envelope metrics are missing." };
  const regime=s(snapshot,"field_output.regime_label"), bias=s(snapshot,"field_output.direction_bias"), liquidity=s(snapshot,"liquidity_tvl.liquidity_context_state"), windowLabel=s(snapshot,"probability_continuation.window_label"), continuationBoundary=s(snapshot,"probability_continuation.boundary");
  if (!regime || !bias || !liquidity || !windowLabel || !continuationBoundary) return { ok:false, code:"source_schema_invalid", message:"Required market-envelope labels are missing." };
  const current:BtcMarketEnvelope["current"]={ price_usd:values[0]!, change_24h_pct:values[1]!, change_7d_pct:values[2]!, change_30d_pct:values[3]!, btc_dominance_pct:values[4]!, total_market_cap_usd:values[5]!, total_market_volume_24h_usd:values[6]!, market_cap_change_24h_pct:values[7]!, stablecoin_cap_usd:values[8]!, stablecoin_share_pct:values[9]!, market_field_score:values[10]!, regime, direction_bias:bias, alt_breadth_24h_pct:values[11]!, alt_breadth_7d_pct:values[12]!, eth_rotation_anchor_pct:values[13]!, top_10_flow_concentration_pct:values[14]!, defi_tvl_usd:values[15]!, dex_volume_24h_usd:values[16]!, liquidity_context_state:liquidity, continuation_field:{base_path_pct:values[17]!,expansion_path_pct:values[18]!,compression_reversal_pct:values[19]!,window_label:windowLabel,boundary:continuationBoundary}, source_freshness:age<=72?"FRESH":"STALE_LIMITED", source_generated_at_utc:generated as string, bounded_temporal_context:temporal };

  const questionClass=classifyBtcEnvelopeQuestion(question), primary=PRIMARY[questionClass], all=BTC_GOLDEN_MODULE_IDS, temporalUnavailable=temporal.state==="unavailable", memoryUnavailable=metrics.length===0;
  const unavailableModules:BtcGoldenModuleId[]=[...(temporalUnavailable?["temporal_context" as const]:[]),...(memoryUnavailable?["change_event_memory" as const]:[])];
  const supporting=all.filter(id=>!primary.includes(id)&&!unavailableModules.includes(id));
  const route={route_version:"btc_module_applicability_route_v0_1" as const,primary_modules:primary,supporting_modules:supporting,unavailable_modules:unavailableModules,watch_profile:`${questionClass}_watch`,narrative_profile:`${questionClass}_read`,safety_boundary:"PUBLIC_RESEARCH_CONTEXT_ONLY" as const};
  const byId=new Map(metrics.map(metric=>[metric.metric_id,metric]));
  const structureSignals=[byId.get("btc_gravity_pct")?.direction,byId.get("alt_breadth_24h_pct")?.direction,byId.get("alt_breadth_7d_pct")?.direction,byId.get("market_field_score")?.direction].filter(Boolean) as BtcSignalDirection[];
  const numeric=metrics.filter(metric=>metric.type==="NUMERIC"), ups=numeric.filter(metric=>metric.direction==="UP").length, downs=numeric.filter(metric=>metric.direction==="DOWN").length;
  const moduleState:Record<BtcGoldenModuleId,BtcSignalDirection>={ market_structure:structureSignals.includes("UP")&&structureSignals.includes("DOWN")?"BOUNDED":structureSignals.includes("DOWN")?"DOWN":structureSignals.includes("UP")?"UP":"UNCHANGED", liquidity_membrane:byId.get("defi_tvl_usd")?.direction??"UNAVAILABLE", change_event_memory:memoryUnavailable?"UNAVAILABLE":ups&&downs?"BOUNDED":ups?"UP":downs?"DOWN":"UNCHANGED", temporal_context:temporalUnavailable?"UNAVAILABLE":"BOUNDED", cosmographer_review:"BOUNDED" };
  let state:BtcSynthesisState="INSUFFICIENT_EVIDENCE";
  const selected=[...primary,...supporting];
  if (current.source_freshness==="FRESH" && !primary.some(id=>moduleState[id]==="UNAVAILABLE")) { const structural=selected.some(id=>["market_structure","liquidity_membrane","change_event_memory"].includes(id)&&moduleState[id]==="BOUNDED"); const directions=selected.map(id=>moduleState[id]).filter(value=>value==="UP"||value==="DOWN"); state=structural||new Set(directions).size>1?"DIVERGENCE":directions.length>=2?"CONFIRMATION":"INSUFFICIENT_EVIDENCE"; }

  const previousCheckpoint=previousSnapshot&&rec(previousSnapshot)?checkpoint(previousSnapshot,previousRegistry,"previous"):null, currentCheckpoint=checkpoint(snapshot,currentRegistry,"current"), historyAvailable=Boolean(previousCheckpoint&&currentCheckpoint);
  const hashes=[currentRegistry.snapshot_sha256,previousRegistry.snapshot_sha256,currentRegistry.proof_sha256,previousRegistry.proof_sha256,currentRegistry.bindings_sha256,previousRegistry.bindings_sha256];
  if (!hashes.every(value=>sha(value,64)) || !sha(currentRegistry.commit_sha,40) || !sha(previousRegistry.commit_sha,40)) return { ok:false, code:"memory_incompatible", message:"Registry artifact anchors are malformed." };
  const nodes=all.map(id=>({id,index:INDEX[id],label:LABEL[id],role:unavailableModules.includes(id)?"unavailable" as const:primary.includes(id)?"primary" as const:"supporting" as const,state:moduleState[id],evidence:evidence[id]}));
  const confirming=state==="CONFIRMATION"?primary.map(id=>`${LABEL[id]}: ${evidence[id][0]}`):selected.filter(id=>moduleState[id]!=="UNAVAILABLE").slice(0,2).map(id=>`${LABEL[id]}: ${evidence[id][0]}`);
  const contradictions=state==="DIVERGENCE"?["Selected market modules contain opposing or internally mixed evidence.","Accepted Snapshot Delta is preserved without collapsing it into one directional signal."]:state==="INSUFFICIENT_EVIDENCE"?["A primary module is stale, unavailable, neutral, or methodologically suppressed."]:[];
  const previousUrl=`https://raw.githubusercontent.com/AiBhrigu/phi-cosmography-open/${previousRegistry.commit_sha}/site/crypto-astro/data/crypto_astro_snapshot.public.json`;
  const uniqueUnavailable=Array.from(new Set(unavailable));

  const value:BtcMarketEnvelope={ schema_version:BTC_MARKET_ENVELOPE_SCHEMA, generated_at_utc:now.toISOString(), question_class:questionClass, phi_geometry:{phi_constant:PHI_CONSTANT,primary_field_pct:PHI_PRIMARY_FIELD_PCT,support_field_pct:PHI_SUPPORT_FIELD_PCT,nodes}, route, current, memory:{comparison_status:text(D.comparison_status)?D.comparison_status:"PARTIAL_COMPARABLE",current_snapshot_id:D.current_snapshot_id as string,previous_snapshot_id:D.previous_snapshot_id as string,current_commit_sha:currentRegistry.commit_sha,previous_commit_sha:previousRegistry.commit_sha,comparable_metric_count:metrics.length,unavailable_metrics:uniqueUnavailable,methodology_compatible:unavailable.length===0,metrics,transition_interpretation:state==="CONFIRMATION"?"Accepted memory and routed modules support one bounded structural interpretation.":state==="DIVERGENCE"?"Accepted memory contains opposing module movements; the BTC field is structurally mixed.":"The accepted pair cannot support a strong transition interpretation without additional compatible evidence."}, synthesis:{state,what_changed:metrics.map(deltaLine),remained_stable:metrics.filter(metric=>metric.direction==="UNCHANGED").map(deltaLine),confirming_modules:confirming,contradicting_or_weakening_modules:contradictions,why_this_matters:state==="CONFIRMATION"?"Question-selected modules reinforce the same bounded structure without creating a trading claim.":state==="DIVERGENCE"?"BTC gravity, participation, liquidity, or accepted memory are not moving as one field; the split is the analytical fact.":"The evidence boundary is more important than a forced conclusion.",watch_next:[`Watch the next accepted Snapshot Delta after ${current.source_generated_at_utc}.`,`Watch source freshness before strengthening current-state language.`,questionClass==="liquidity"?"Watch non-double-counted DeFi TVL, DEX volume and stablecoin share together.":"Watch BTC dominance against 24h/7d breadth for confirmation or divergence."],uncertainty:[current.source_freshness==="FRESH"?"Accepted source is within the 72-hour product window.":"Accepted source is older than 72 hours; strong current-state language is suppressed.",uniqueUnavailable.length?`Unavailable or incompatible memory metrics: ${uniqueUnavailable.join(", ")}.`:"All eight Snapshot Memory metrics are methodologically comparable.",temporalUnavailable?"Temporal context is unavailable for this request.":"Temporal evidence is bounded and non-predictive.",historyAvailable?"Verified history uses two immutable accepted checkpoints.":"Previous immutable checkpoint could not be rendered; history is suppressed."]}, verified_history:{available:historyAvailable,observation_window:historyAvailable?`${previousCheckpoint!.accepted_at_utc} → ${currentCheckpoint!.accepted_at_utc}`:"UNAVAILABLE",checkpoints:historyAvailable?[previousCheckpoint!,currentCheckpoint!]:[],methodology_repair_disclosure:s(snapshot,"liquidity_tvl.defi_tvl_methodology")??"DeFi TVL uses the accepted non-double-counted historicalChainTvl methodology."}, source_proof:{source_mode:"static_public_snapshot",proof_source_count:proofSources.length,current_snapshot_sha256:hashes[0] as string,previous_snapshot_sha256:hashes[1] as string,current_proof_sha256:hashes[2] as string,previous_proof_sha256:hashes[3] as string,current_bindings_sha256:hashes[4] as string,previous_bindings_sha256:hashes[5] as string,registry_url:BTC_MARKET_ENVELOPE_URLS.registry,delta_url:BTC_MARKET_ENVELOPE_URLS.delta,previous_snapshot_url:previousUrl}, inactive_modules:["Polymarket live detector","A/E activation","X4 public mechanism","Wallet data and trade execution","Price targets and predictive forecasts"], boundary:{read_only:true,no_live_provider_call_during_request:true,no_trading_signal:true,no_forecast:true,no_price_target:true,no_personal_memory_claim:true,no_orion_exposure:true} };
  return {ok:true,value};
}

async function fetchJson(url:string,fetchImpl:typeof fetch,timeoutMs:number){const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeoutMs);try{const response=await fetchImpl(url,{signal:controller.signal,headers:{accept:"application/json"},cache:"no-store"});if(!response.ok)throw new Error(`HTTP_${response.status}`);return await response.json();}finally{clearTimeout(timer);}}

export async function loadBtcMarketEnvelope(question:string,options:{fetchImpl?:typeof fetch;now?:Date;temporal?:BtcEnvelopeTemporalInput;timeoutMs?:number}={}):Promise<BtcMarketEnvelopeResult>{const fetchImpl=options.fetchImpl??fetch,timeout=options.timeoutMs??5000;let base:unknown[];try{base=await Promise.all(Object.values(BTC_MARKET_ENVELOPE_URLS).map(url=>fetchJson(url,fetchImpl,timeout)));}catch(error){const timed=error instanceof Error&&(error.name==="AbortError"||/abort/i.test(error.message));return{ok:false,code:timed?"source_timeout":"source_missing",message:timed?"BTC market envelope source request timed out.":"BTC market envelope source artifact is unavailable."};}const registry=base[4],commit=rec(registry)&&rec(registry.previous)&&sha(registry.previous.commit_sha,40)?registry.previous.commit_sha:null;let previousSnapshot:unknown;if(commit)try{previousSnapshot=await fetchJson(`https://raw.githubusercontent.com/AiBhrigu/phi-cosmography-open/${commit}/site/crypto-astro/data/crypto_astro_snapshot.public.json`,fetchImpl,timeout);}catch{previousSnapshot=undefined;}return buildBtcMarketEnvelopeFromDocuments(question,{snapshot:base[0],proof:base[1],marketField:base[2],bindings:base[3],registry:base[4],delta:base[5],previousSnapshot},{now:options.now,temporal:options.temporal});}
