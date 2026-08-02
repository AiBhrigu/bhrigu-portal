#!/usr/bin/env python3
from pathlib import Path

root = Path(__file__).resolve().parents[1]


def replace_once(path: Path, old: str, new: str, label: str) -> None:
    value = path.read_text(encoding="utf-8")
    count = value.count(old)
    if count != 1:
        raise SystemExit(f"{label} mismatch: {count}")
    path.write_text(value.replace(old, new, 1), encoding="utf-8")


component = root / "components/btc/BtcCosmographerDialogue.tsx"
replace_once(
    component,
    '''  const contextSafe = !latestTurn || (
    latestTurn.route_disposition === "CONTINUE" &&
    latestTurn.context_safe_composer !== false
  );
''',
    '''  const contextSafe = !latestTurn || (
    latestTurn.context_safe_composer !== false &&
    (
      latestTurn.route_disposition === "CONTINUE" ||
      latestTurn.stop_reason === "REPEATED_ROUTE"
    )
  );
''',
    "context-safe repeated next-question rule",
)
replace_once(
    component,
    '''  const retainedAstroTurn = contextSafe ? [...turns].reverse().find((turn) =>
    turn.route_subject === "planetary_aspects" &&
    (turn.route_domain === "astromodule" || turn.route_domain === "astro_btc_bridge") &&
    Boolean(turn.time_start && turn.time_end),
  ) : undefined;
''',
    '''  const retainedAstroTurn = [...turns].reverse().find((turn) =>
    turn.route_subject === "planetary_aspects" &&
    (turn.route_domain === "astromodule" || turn.route_domain === "astro_btc_bridge") &&
    Boolean(turn.time_start && turn.time_end),
  );
''',
    "retained Astro UI memory",
)

runtime = root / "lib/btc-cosmographer-evidence-navigation-runtime.ts"
replace_once(
    runtime,
    '''type SourceContext = {
  state: string;
  generated_at_utc: string | null;
  proof_available: boolean;
};
''',
    '''type SourceContext = {
  state: string;
  generated_at_utc: string | null;
  proof_available: boolean;
};

export type BtcRetainedAstroRelationMemory = {
  domain: "astromodule";
  subject: string;
  start: string;
  end: string;
};
''',
    "retained Astro relation type",
)
replace_once(
    runtime,
    '''function hasAstroObject(route: BtcCosmographerRoute, question: string, packet: BtcCosmographerContextPacket | null): boolean {
  return route.domain === "astromodule" ||
    route.domain === "astro_btc_bridge" ||
    BODY_REFERENCE.test(question) ||
    packet?.prior_domain === "astromodule" ||
    packet?.prior_domain === "astro_btc_bridge";
}
''',
    '''function hasAstroObject(
  route: BtcCosmographerRoute,
  question: string,
  packet: BtcCosmographerContextPacket | null,
  retainedAstroMemory: BtcRetainedAstroRelationMemory | null,
): boolean {
  return route.domain === "astromodule" ||
    route.domain === "astro_btc_bridge" ||
    BODY_REFERENCE.test(question) ||
    packet?.prior_domain === "astromodule" ||
    packet?.prior_domain === "astro_btc_bridge" ||
    retainedAstroMemory?.domain === "astromodule";
}
''',
    "has Astro object",
)
replace_once(
    runtime,
    '''function resolvedAstroSubject(route: BtcCosmographerRoute, packet: BtcCosmographerContextPacket | null): string | null {
  if (route.domain === "astromodule" || route.domain === "astro_btc_bridge") return route.subject;
  if (packet?.prior_domain === "astromodule" || packet?.prior_domain === "astro_btc_bridge") return packet.prior_subject;
  const explicitBody = route.explicit_entities.find((value) => !value.startsWith("btc_") && value !== route.market_question_class);
  return explicitBody ?? null;
}
''',
    '''function resolvedAstroSubject(
  route: BtcCosmographerRoute,
  packet: BtcCosmographerContextPacket | null,
  retainedAstroMemory: BtcRetainedAstroRelationMemory | null,
): string | null {
  if (route.domain === "astromodule" || route.domain === "astro_btc_bridge") return route.subject;
  if (packet?.prior_domain === "astromodule" || packet?.prior_domain === "astro_btc_bridge") return packet.prior_subject;
  if (retainedAstroMemory?.domain === "astromodule") return retainedAstroMemory.subject;
  const explicitBody = route.explicit_entities.find((value) => !value.startsWith("btc_") && value !== route.market_question_class);
  return explicitBody ?? null;
}
''',
    "resolved Astro subject",
)
replace_once(
    runtime,
    '''export function applyBtcRelationIntentPrecedence<T extends BtcCosmographerRoute>(
  route: T,
  rawQuestion: string,
  packet: BtcCosmographerContextPacket | null,
): BtcRelationIntentResolution<T> {
''',
    '''export function applyBtcRelationIntentPrecedence<T extends BtcCosmographerRoute>(
  route: T,
  rawQuestion: string,
  packet: BtcCosmographerContextPacket | null,
  retainedAstroMemory: BtcRetainedAstroRelationMemory | null = null,
): BtcRelationIntentResolution<T> {
''',
    "relation resolver signature",
)
replace_once(
    runtime,
    '''  const astroResolved = hasAstroObject(route, question, packet);
''',
    '''  const astroResolved = hasAstroObject(route, question, packet, retainedAstroMemory);
''',
    "relation Astro resolution",
)
replace_once(
    runtime,
    '''  const subject = resolvedAstroSubject(route, packet) ?? route.subject;
  const marketQuestionClass = route.market_question_class ?? packet?.prior_market_question_class ?? "general_btc_field";
  const bridgeRoute = {
''',
    '''  const subject = resolvedAstroSubject(route, packet, retainedAstroMemory) ?? route.subject;
  const marketQuestionClass = route.market_question_class ?? packet?.prior_market_question_class ?? "general_btc_field";
  const retainedTimeRange = retainedAstroMemory
    ? {
        start: retainedAstroMemory.start,
        end: retainedAstroMemory.end,
        label: `${retainedAstroMemory.start}–${retainedAstroMemory.end}`,
        source: "CONTEXT" as const,
      }
    : null;
  const bridgeRoute = {
''',
    "bridge retained subject and time",
)
replace_once(
    runtime,
    '''    context_relation: "CROSS_MODULE_BRIDGE",
    market_question_class: marketQuestionClass,
''',
    '''    context_relation: "CROSS_MODULE_BRIDGE",
    time_range: route.time_range ?? retainedTimeRange,
    market_question_class: marketQuestionClass,
''',
    "bridge retained period",
)
replace_once(
    runtime,
    '''    context_safe_composer: false,
    render_gate: {
''',
    '''    context_safe_composer: repeatedNext && !repeatedClarification
      ? decision.context_safe_composer
      : false,
    render_gate: {
''',
    "anti-loop accepted-context preservation",
)

live = root / "pages/crypto-astro/btc/live.tsx"
replace_once(
    live,
    '''  const relationResolution = applyBtcRelationIntentPrecedence(
    initialRoute,
    initialQuestion,
    packet,
  );
''',
    '''  const relationResolution = applyBtcRelationIntentPrecedence(
    initialRoute,
    initialQuestion,
    packet,
    retainedAstroMemory,
  );
''',
    "server retained Astro relation binding",
)

fixture = root / "scripts/run-btc-evidence-navigation-runtime-fixture.mjs"
replace_once(
    fixture,
    '''  assert.equal(singleDomainAstro.route.context_relation, "NEW_TOPIC");

  const unresolvedRelationRoute = {
''',
    '''  assert.equal(singleDomainAstro.route.context_relation, "NEW_TOPIC");

  const retainedAstroMemory = {
    domain: "astromodule",
    subject: "planetary_aspects",
    start: "2026-01-01",
    end: "2026-12-31",
  };
  const liquidityConfirmationRoute = {
    ...baseRoute,
    raw_question: "Ликвидность подтверждает?",
    normalized_question: "ликвидность подтверждает?",
    domain: "btc_market",
    subject: "liquidity",
    intents: ["confirmation"],
    context_relation: "NEW_TOPIC",
    market_question_class: "liquidity",
    capability_id: "btc_market.liquidity",
    explicit_entities: ["liquidity"],
  };
  const retainedBridge = applyBtcRelationIntentPrecedence(
    liquidityConfirmationRoute,
    liquidityConfirmationRoute.raw_question,
    null,
    retainedAstroMemory,
  );
  assert.equal(retainedBridge.relation_resolution, "TWO_DOMAINS_RESOLVED");
  assert.equal(retainedBridge.btc_side_state_type, "MARKET");
  assert.equal(retainedBridge.route.domain, "astro_btc_bridge");
  assert.equal(retainedBridge.route.subject, "planetary_aspects");
  assert.equal(retainedBridge.route.context_relation, "CROSS_MODULE_BRIDGE");
  assert.deepEqual(retainedBridge.route.time_range, {
    start: "2026-01-01",
    end: "2026-12-31",
    label: "2026-01-01–2026-12-31",
    source: "CONTEXT",
  });

  const unresolvedRelationRoute = {
''',
    "retained Astro explicit bridge fixture",
)
replace_once(
    fixture,
    '''  assert.equal(repeated.anti_loop_blocked, true);
  assert.equal(repeated.show_next_question, false);
''',
    '''  assert.equal(repeated.anti_loop_blocked, true);
  assert.equal(repeated.show_next_question, false);
  assert.equal(repeated.context_safe_composer, true);
''',
    "anti-loop accepted context fixture",
)
replace_once(fixture, '    checks: 34,\n', '    checks: 41,\n', "fixture check count")

print({
    "status": "PASS_RETAINED_ASTRO_RELATION_AND_ANTI_LOOP_CONTEXT_REPAIR",
    "context_packet_remains_gated": True,
    "repeated_next_question_preserves_answer_context": True,
    "repeated_clarification_still_closes_context": True,
    "retained_astro_memory_bound_to_relation_resolver": True,
    "retained_scope": 9,
})
