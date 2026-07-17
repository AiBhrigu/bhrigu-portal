declare const process: { env: Record<string, string | undefined> };
import { BTC_ASSET, guardBtcPublicSnapshot, type BtcPublicBoundary, type BtcPublicSnapshot, type BtcQuestionLens } from '../lib/btc-public-output-contract';
import { deriveBtcQuestionGeometry, type BtcQuestionGeometry } from '../lib/btc-question-geometry';
import { guardBtcNarrativeSection, routeBtcDeterministicNarrative, type BtcNarrativeFacts, type BtcNarrativeRouterInput } from '../lib/btc-deterministic-narrative-router';
import { routeBtcWatchConditions, type BtcWatchConditionRouterInput } from '../lib/btc-watch-condition-router';

function assert(condition: unknown, message: string): asserts condition { if (!condition) throw new Error(message); }
function clone<T>(value: T): T { return JSON.parse(JSON.stringify(value)) as T; }

const CASES: readonly { question: string; lens: BtcQuestionLens; primary: readonly [string, string] }[] = [
  { question: 'How is BTC dominance shaping the current market gravity?', lens: 'market_gravity', primary: ['why_it_matters', 'relative_market_field'] },
  { question: 'What do current liquidity and breadth reveal about BTC market structure?', lens: 'market_structure', primary: ['current_structure', 'relative_market_field'] },
  { question: 'Where is pressure or volatility concentrated in the BTC field?', lens: 'pressure_context', primary: ['dominant_pressures', 'temporal_context'] },
  { question: 'What does the current temporal phase show in the BTC field?', lens: 'temporal_context', primary: ['temporal_context', 'dominant_pressures'] },
  { question: 'What changed in the BTC field, why does it matter, and what conditions should I watch?', lens: 'general', primary: ['what_changed', 'why_it_matters'] },
];

const boundary: BtcPublicBoundary = {
  read_only: true, static_public_snapshot: true, no_live_adapter_claim: true, no_true_live_feed_claim: true,
  no_trading_signal: true, no_forecast: true, no_price_target: true, no_investment_recommendation: true,
  backend_api_closed: true, runtime_closed: true, payment_closed: true, orion_core_protected: true, formula_weights_exposed: false,
};
const facts: BtcNarrativeFacts = {
  price_usd: 63682, change_24h_pct: -0.9702411448, change_7d_pct: 0.9366210194, change_30d_pct: 0.3611386026,
  market_cap_change_24h_pct: -0.4361350067, source_generated_at_utc: '2026-07-12T22:05:46Z', freshness: 'FRESH',
  dominance_pct: 56.2162113213, dominance_band: 'balanced', market_cap_rank: 1, market_context_label: 'low_movement',
  regime_label: 'Balanced Expansion', field_score: 60.85, direction_bias: 'Neutral → Bullish', liquidity_state: 'context fresh',
  stablecoin_share_pct: 13.6836916853, alt_breadth_24h_pct: 26.5, pressure_band: null, harmonic_tension: null,
  evidence_mode: 'no_numeric_aspect_claim', pressure_label: 'No numeric aspect claim', temporal_state: 'static_state_only',
  observation_date: '2026-07-12', temporal_limitation: 'Approved bounded static temporal state; numeric temporal metrics are unavailable.',
};
function routerInput(geometry: BtcQuestionGeometry, lens: BtcQuestionLens = geometry.lens): BtcNarrativeRouterInput {
  return { schema_version: 'btc_deterministic_narrative_router_input_v0_1', geometry, question_lens: lens, safe_reframed: false, facts, public_boundary: boundary, template_catalog_version: 'btc_narrative_template_catalog_v0_1' };
}
function watchInput(geometry: BtcQuestionGeometry): BtcWatchConditionRouterInput {
  return { schema_version: 'btc_watch_condition_router_input_v0_1', watch_profile: geometry.watch_profile, dominance_pct: facts.dominance_pct, dominance_band: facts.dominance_band, market_cap_rank: facts.market_cap_rank, regime_label: facts.regime_label, liquidity_state: facts.liquidity_state, stablecoin_share_pct: facts.stablecoin_share_pct, alt_breadth_24h_pct: facts.alt_breadth_24h_pct, pressure_label: facts.pressure_label, harmonic_tension: facts.harmonic_tension, temporal_state: facts.temporal_state, observation_date: facts.observation_date, freshness: facts.freshness };
}

const geometryJson: string[] = []; const profileSet = new Set<string>(); const primarySet = new Set<string>(); const watchProfileSet = new Set<string>(); const watchOutputSet = new Set<string>();
let generalRoute: Extract<ReturnType<typeof routeBtcDeterministicNarrative>, { ok: true }> | null = null;
for (const item of CASES) {
  const geometry = deriveBtcQuestionGeometry(item.lens, false);
  assert(geometry.lens === item.lens, `Lens mismatch for ${item.question}`);
  assert(geometry.primary_sections[0] === item.primary[0] && geometry.primary_sections[1] === item.primary[1], `Primary order mismatch for ${item.lens}`);
  const routed = routeBtcDeterministicNarrative(routerInput(geometry)); assert(routed.ok, `Router failed for ${item.lens}`);
  const routedAgain = routeBtcDeterministicNarrative(routerInput(geometry)); assert(routedAgain.ok && JSON.stringify(routed.value) === JSON.stringify(routedAgain.value), `Router nondeterministic for ${item.lens}`);
  const watched = routeBtcWatchConditions(watchInput(geometry)); assert(watched.ok, `Watch routing failed for ${item.lens}`);
  const watchedAgain = routeBtcWatchConditions(watchInput(geometry)); assert(watchedAgain.ok && JSON.stringify(watched.value) === JSON.stringify(watchedAgain.value), `Watch routing nondeterministic for ${item.lens}`);
  geometryJson.push(JSON.stringify(geometry)); profileSet.add(geometry.narrative_profile); primarySet.add(geometry.primary_sections.join(',')); watchProfileSet.add(geometry.watch_profile); watchOutputSet.add(JSON.stringify(watched.value));
  if (item.lens === 'general') generalRoute = routed;
}
assert(new Set(geometryJson).size === 5, 'Expected five unique geometries'); assert(profileSet.size === 5, 'Expected five narrative profiles'); assert(primarySet.size === 5, 'Expected five primary orders'); assert(watchProfileSet.size === 5, 'Expected five watch profiles'); assert(watchOutputSet.size === 5, 'Expected five unique watch outputs'); assert(generalRoute, 'General route missing');

const gravity = deriveBtcQuestionGeometry('market_gravity', false);
const mismatch = routeBtcDeterministicNarrative({ ...routerInput(gravity), question_lens: 'market_structure' }); assert(mismatch.ok === false && mismatch.code === 'geometry_lens_mismatch', 'geometry_lens_mismatch unreachable');
const badBoundary = routeBtcDeterministicNarrative({ ...routerInput(gravity), public_boundary: { ...boundary, no_forecast: false } as unknown as BtcPublicBoundary }); assert(badBoundary.ok === false && badBoundary.code === 'public_boundary_invalid', 'public_boundary_invalid unreachable');
const badSafety = routeBtcDeterministicNarrative({ ...routerInput(gravity), safe_reframed: true }); assert(badSafety.ok === false && badSafety.code === 'safety_overlay_invalid', 'safety_overlay_invalid unreachable');
const badFacts = routeBtcDeterministicNarrative({ ...routerInput(gravity), facts: { ...facts, price_usd: Number.NaN } }); assert(badFacts.ok === false && badFacts.code === 'fact_projection_mismatch', 'fact_projection_mismatch unreachable');
const duplicateGeometry = { ...gravity, primary_sections: ['why_it_matters', 'why_it_matters'] } as unknown as BtcQuestionGeometry; const duplicate = routeBtcDeterministicNarrative(routerInput(duplicateGeometry)); assert(duplicate.ok === false && duplicate.code === 'geometry_partition_invalid', 'duplicate section not rejected');
const noTemplateGeometry = { ...gravity, primary_sections: ['what_changed', 'relative_market_field'], supporting_sections: ['why_it_matters', 'current_structure'] } as unknown as BtcQuestionGeometry; const noTemplate = routeBtcDeterministicNarrative(routerInput(noTemplateGeometry)); assert(noTemplate.ok === false && noTemplate.code === 'unsupported_template_id', 'unsupported_template_id unreachable');
const badFocusGeometry = { ...gravity, focus_axis: 'overview' } as BtcQuestionGeometry; const badFinal = routeBtcDeterministicNarrative(routerInput(badFocusGeometry)); assert(badFinal.ok === false && badFinal.code === 'narrative_contract_failed', 'narrative_contract_failed unreachable');
const unknownLens = routeBtcDeterministicNarrative({ ...routerInput(gravity), question_lens: 'unknown' as BtcQuestionLens }); assert(unknownLens.ok === false && unknownLens.code === 'invalid_router_input', 'unknown lens not rejected');
const pressureMismatch = guardBtcNarrativeSection({ section_id: 'dominant_pressures', role: 'primary', order: 1, fact_payload: { section_id: 'dominant_pressures', pressure_band: null, harmonic_tension: null, evidence_mode: 'bounded_numeric_metric', pressure_label: 'No numeric aspect claim', stablecoin_share_pct: 13.68, temporal_state: 'static_state_only' }, read_template_id: 'pressure_interaction_read_v0_1' }); assert(!pressureMismatch, 'Pressure evidence mismatch accepted');

const labels = ['coingecko_global','coingecko_asset_markets_btc_eth_sol_ton_icp','coingecko_top250_markets','coingecko_stablecoin_sample','defillama_protocols','defillama_dex_overview','defillama_stablecoins'];
const generalGeometry = deriveBtcQuestionGeometry('general', false); const generalWatch = routeBtcWatchConditions(watchInput(generalGeometry)); assert(generalWatch.ok, 'General watch failed');
const snapshot: BtcPublicSnapshot = {
  request_id: 'btc_pub_fixture01', asset: BTC_ASSET, question: { raw: CASES[4].question, normalized: CASES[4].question, lens: 'general', safe_reframed: false, geometry: generalGeometry }, observation_time_utc: '2026-07-12T00:00:00.000Z',
  market_snapshot: { price_usd: facts.price_usd, change_24h_pct: facts.change_24h_pct, change_7d_pct: facts.change_7d_pct, change_30d_pct: facts.change_30d_pct, total_market_cap_usd: 2277899133239, volume_24h_usd: 45010057924, market_cap_change_24h_pct: facts.market_cap_change_24h_pct, source_generated_at_utc: facts.source_generated_at_utc, freshness: facts.freshness },
  btc_gravity: { dominance_pct: facts.dominance_pct, dominance_band: facts.dominance_band, market_cap_rank: facts.market_cap_rank, market_context_label: facts.market_context_label, score: 60.85 },
  market_structure: { regime_label: facts.regime_label, field_score: facts.field_score, direction_bias: facts.direction_bias, liquidity_state: facts.liquidity_state, stablecoin_share_pct: facts.stablecoin_share_pct, alt_breadth_24h_pct: facts.alt_breadth_24h_pct, context_only: true },
  aspect_pressure: { state: facts.temporal_state, pressure_band: facts.pressure_band, harmonic_tension: facts.harmonic_tension, evidence_mode: facts.evidence_mode, label: facts.pressure_label },
  temporal_context: { state: facts.temporal_state, label: 'bounded_cosmographic_metric', observation_date: facts.observation_date, metrics: null, analysis: null, limitation: facts.temporal_limitation },
  watch_conditions: [...generalWatch.value], cosmographer_read: generalRoute.value,
  source_proof: { schema_version: 'crypto_astro_snapshot_proof_public_v0_1', source_mode: 'static_public_snapshot', generated_at_utc: '2026-07-12T22:05:45Z', sources: labels.map((label, index) => ({ label, url: `https://example.com/source-${index}`, status: 'PASS' as const, fetched_at_utc: '2026-07-12T22:05:45Z', sha256: 'a'.repeat(64), bytes: index + 1 })) },
  uncertainty: { freshness: 'Fixture freshness.', question_limit: 'Fixture question limit.', temporal_limit: facts.temporal_limitation, source_limit: 'Fixture source limit.' }, boundary, generated_at_utc: '2026-07-18T00:00:00.000Z', deeper_access_route: '/access',
};
const sourceBefore = JSON.stringify(snapshot.market_snapshot); const proofBefore = JSON.stringify(snapshot.source_proof); const boundaryBefore = JSON.stringify(snapshot.boundary);
assert(guardBtcPublicSnapshot(snapshot), 'Valid public snapshot rejected'); const mutated = clone(snapshot); const changed = mutated.cosmographer_read.sections.find(s => s.section_id === 'what_changed'); assert(changed && changed.fact_payload.section_id === 'what_changed', 'what_changed payload missing'); changed.fact_payload.price_usd += 1; assert(!guardBtcPublicSnapshot(mutated), 'Mutated public fact payload accepted');
assert(JSON.stringify(snapshot.market_snapshot) === sourceBefore, 'Source facts mutated'); assert(JSON.stringify(snapshot.source_proof) === proofBefore, 'Proof mutated'); assert(JSON.stringify(snapshot.boundary) === boundaryBefore, 'Boundary mutated');

const report = { schema_version: 'btc_routing_fixture_report_v0_1', head_sha: process.env.GITHUB_SHA ?? 'LOCAL', questions_tested: CASES.length, lenses_passed: CASES.length, unique_geometries: new Set(geometryJson).size, unique_narrative_profiles: profileSet.size, unique_primary_orders: primarySet.size, unique_watch_profiles: watchProfileSet.size, unique_watch_outputs: watchOutputSet.size, determinism: 'PASS', fail_closed: 'PASS', source_mutation: 'NO', proof_mutation: 'NO', boundary_mutation: 'NO' } as const;
console.log(JSON.stringify(report));
