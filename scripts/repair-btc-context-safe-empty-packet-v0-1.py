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
old_context = '''  const contextFields = contextTurn ? {
    cc: BTC_COSMOGRAPHER_CONTEXT_SCHEMA,
    cd: contextTurn.route_domain ?? "unsupported",
    cs: contextTurn.route_subject ?? contextTurn.question_class ?? "unknown",
    ci: (contextTurn.route_intents ?? contextTurn.question_facets).join(","),
    ca: contextTurn.answer_state === "BOUNDED" ? "LIMITED" : contextTurn.answer_state,
    cm: contextTurn.market_question_class ?? contextTurn.question_class ?? "",
    ct0: contextTurn.time_start ?? contextTurn.observation_date ?? "",
    ct1: contextTurn.time_end ?? contextTurn.observation_date ?? "",
    cb: contextTurn.source_snapshot_generated_at_utc ?? "",
  } : null;
'''
new_context = '''  const contextFields = contextTurn ? {
    cc: BTC_COSMOGRAPHER_CONTEXT_SCHEMA,
    cd: contextTurn.route_domain ?? "unsupported",
    cs: contextTurn.route_subject ?? contextTurn.question_class ?? "unknown",
    ci: (contextTurn.route_intents ?? contextTurn.question_facets).join(","),
    ca: contextTurn.answer_state === "BOUNDED" ? "LIMITED" : contextTurn.answer_state,
    cm: contextTurn.market_question_class ?? contextTurn.question_class ?? "",
    ct0: contextTurn.time_start ?? contextTurn.observation_date ?? "",
    ct1: contextTurn.time_end ?? contextTurn.observation_date ?? "",
    cb: contextTurn.source_snapshot_generated_at_utc ?? "",
  } : {
    cc: "",
    cd: "",
    cs: "",
    ci: "",
    ca: "",
    cm: "",
    ct0: "",
    ct1: "",
    cb: "",
  };
'''
replace_once(component, old_context, new_context, "context field source")
replace_once(
    component,
    '''        {contextFields && Object.entries(contextFields).map(([name, value]) => <input key={name} type="hidden" name={name} value={value}/>) }
''',
    '''        {Object.entries(contextFields).map(([name, value]) => <input key={name} type="hidden" name={name} value={value}/>) }
''',
    "context field render",
)

runtime = root / "lib/btc-cosmographer-evidence-navigation-runtime.ts"
replace_once(
    runtime,
    '''const UNRESOLVED_PRONOUN = /^(?:it|this|that|them|what about it|and this|это|этот|эта|они|а это|и это|там)\\b/i;
''',
    '''const UNRESOLVED_PRONOUN = /^(?:it|this|that|them|what about it|and this|это|этот|эта|они|а это|и это|там)\\b/i;
const RELATION_OBJECT_PRONOUN = /\\b(?:it|this|that|them|это|этот|эта|они|там)\\b/i;
''',
    "relation object pronoun",
)
replace_once(
    runtime,
    '''  const astroResolved = hasAstroObject(route, question, packet);
  const btcSide = explicitBtcSideType(route, question) ?? priorBtcSideType(packet);
  if (!astroResolved || !btcSide) {
    return {
      route,
      relation_resolution: "SECOND_DOMAIN_UNRESOLVED",
      btc_side_state_type: btcSide,
    };
  }
''',
    '''  const astroResolved = hasAstroObject(route, question, packet);
  const explicitBtcSide = explicitBtcSideType(route, question);
  const inheritedBtcSide = route.context_relation === "FOLLOW_UP" || route.context_relation === "CROSS_MODULE_BRIDGE"
    ? priorBtcSideType(packet)
    : null;
  const btcSide = explicitBtcSide ?? inheritedBtcSide;
  if (!astroResolved) {
    return {
      route,
      relation_resolution: "SECOND_DOMAIN_UNRESOLVED",
      btc_side_state_type: btcSide,
    };
  }
  if (!btcSide) {
    if (RELATION_OBJECT_PRONOUN.test(question)) {
      return {
        route,
        relation_resolution: "SECOND_DOMAIN_UNRESOLVED",
        btc_side_state_type: null,
      };
    }
    return {
      route,
      relation_resolution: "SINGLE_DOMAIN",
      btc_side_state_type: null,
    };
  }
''',
    "relation precedence",
)

fixture = root / "scripts/run-btc-evidence-navigation-runtime-fixture.mjs"
replace_once(
    fixture,
    '''  assert.equal(relation.route.context_relation, "CROSS_MODULE_BRIDGE");

  const unresolvedRelationRoute = {
''',
    '''  assert.equal(relation.route.context_relation, "CROSS_MODULE_BRIDGE");

  const priorProtocolPacket = {
    schema: "btc_cosmographer_context_v0_1",
    prior_domain: "bitcoin_protocol",
    prior_subject: "supply",
    prior_intents: ["fact"],
    prior_answer_state: "CONFIRMED",
    prior_market_question_class: null,
    prior_time_start: null,
    prior_time_end: null,
    prior_snapshot_generated_at_utc: "2026-08-01T18:24:47Z",
  };
  const singleDomainAstroRoute = {
    ...astroRoute,
    raw_question: "Юпитер как повлиял за 6 месяцев в 2026 году?",
    normalized_question: "юпитер как повлиял за 6 месяцев в 2026 году?",
    intents: ["interval_analysis"],
    context_relation: "NEW_TOPIC",
    time_range: {
      start: "2026-01-01",
      end: "2026-06-30",
      label: "6 months in 2026",
      source: "QUESTION",
    },
    market_question_class: null,
    explicit_entities: ["jupiter"],
  };
  const singleDomainAstro = applyBtcRelationIntentPrecedence(
    singleDomainAstroRoute,
    singleDomainAstroRoute.raw_question,
    priorProtocolPacket,
  );
  assert.equal(singleDomainAstro.relation_resolution, "SINGLE_DOMAIN");
  assert.equal(singleDomainAstro.btc_side_state_type, null);
  assert.equal(singleDomainAstro.route.domain, "astromodule");
  assert.equal(singleDomainAstro.route.context_relation, "NEW_TOPIC");

  const unresolvedRelationRoute = {
''',
    "single-domain regression fixture",
)
replace_once(fixture, '    "checks": 30,\n', '    "checks": 34,\n', "fixture check count")

print({
    "status": "PASS_CONTEXT_SAFE_PACKET_AND_RELATION_PRECEDENCE_REPAIR",
    "retained_scope": 9,
})
