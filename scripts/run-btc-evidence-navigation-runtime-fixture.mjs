#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { mkdtemp, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";

const temporary = await mkdtemp(join(tmpdir(), "btc-evidence-navigation-"));

function run(command, args) {
  const result = spawnSync(command, args, { encoding: "utf8", stdio: "pipe" });
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} failed\n${result.stdout}\n${result.stderr}`);
  }
  return result;
}

async function findModule(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    const target = join(directory, entry.name);
    if (entry.isDirectory()) {
      const nested = await findModule(target);
      if (nested) return nested;
    } else if (entry.name === "btc-cosmographer-evidence-navigation-runtime.js") {
      return target;
    }
  }
  return null;
}

const baseRoute = {
  schema: "btc_cosmographer_semantic_route_graph_v0_1",
  locale: "en",
  raw_question: "What is happening with BTC today?",
  normalized_question: "what is happening with btc today?",
  domain: "btc_market",
  subject: "general_btc_field",
  intents: ["watch"],
  context_relation: "NEW_TOPIC",
  time_range: null,
  market_question_class: "general_btc_field",
  capability_id: "btc_market.general_btc_field",
  confidence: "HIGH",
  explicit_entities: ["general_btc_field"],
};

const baseAnswer = {
  answer_state: "LIMITED",
  answer_mode: "MARKET_DIAGNOSIS",
  headline: "BTC market state",
  direct_answer: "The accepted market record is available within its declared boundary.",
  sections: [],
  source_boundary: "Accepted Market Snapshot.",
  proof_label: "Market evidence available",
};

const sourceAvailable = {
  state: "FRESH",
  generated_at_utc: "2026-08-02T00:00:00Z",
  proof_available: true,
};

const sourceUnavailable = {
  state: "UNAVAILABLE",
  generated_at_utc: null,
  proof_available: false,
};

try {
  run("npx", [
    "tsc",
    "lib/btc-cosmographer-evidence-navigation-runtime.ts",
    "--target", "ES2022",
    "--module", "commonjs",
    "--moduleResolution", "node",
    "--skipLibCheck",
    "--esModuleInterop",
    "--outDir", temporary,
  ]);

  const modulePath = await findModule(temporary);
  assert.ok(modulePath, "compiled runtime module not found");
  const runtime = await import(pathToFileURL(modulePath).href);
  const {
    applyBtcRelationIntentPrecedence,
    applyBtcRuntimeAntiLoop,
    buildBtcEvidenceNavigationRuntimeDecision,
    detectBtcRelationIntent,
  } = runtime;

  const pageSource = readFileSync("pages/crypto-astro/btc/live.tsx", "utf8");
  const componentSource = readFileSync("components/btc/BtcCosmographerDialogue.tsx", "utf8");
  const routeSource = readFileSync("lib/btc-cosmographer-route-graph.ts", "utf8");
  assert.match(pageSource, /parsePendingClarification/);
  assert.match(pageSource, /resolvePendingClarificationQuestion/);
  assert.match(componentSource, /name="pof"|pendingClarificationFields/);
  assert.ok(routeSource.includes("протокол[ауе]?\\s+(?:btc|bitcoin|биткоин)"));

  const astroRoute = {
    ...baseRoute,
    raw_question: "How does Jupiter relate to BTC market structure?",
    normalized_question: "how does jupiter relate to btc market structure?",
    domain: "astromodule",
    subject: "jupiter",
    intents: ["compare", "bridge"],
    market_question_class: "market_structure",
    capability_id: "astromodule.jupiter",
    explicit_entities: ["jupiter", "market_structure"],
  };
  const relation = applyBtcRelationIntentPrecedence(astroRoute, astroRoute.raw_question, null);
  assert.equal(relation.relation_resolution, "TWO_DOMAINS_RESOLVED");
  assert.equal(relation.btc_side_state_type, "MARKET");
  assert.equal(relation.route.domain, "astro_btc_bridge");
  assert.equal(relation.route.context_relation, "CROSS_MODULE_BRIDGE");

  const russianRelationForms = [
    "Высота блоков совпадала с окнами",
    "Высота блоков соотносилась с окнами",
    "Высота блоков связана с окнами",
    "Высота блоков сравнивалась с окнами",
    "Высота блоков и окна были одновременными",
  ];
  russianRelationForms.forEach((question) => assert.equal(detectBtcRelationIntent(question), true));

  const retainedMarsMemory = {
    domain: "astromodule",
    subject: "mars",
    start: "2026-01-01",
    end: "2026-12-31",
  };
  const priorMarsPacket = {
    schema: "btc_cosmographer_context_v0_1",
    prior_domain: "astromodule",
    prior_subject: "mars",
    prior_intents: ["interval_analysis"],
    prior_answer_state: "CONFIRMED",
    prior_market_question_class: null,
    prior_time_start: "2026-01-01",
    prior_time_end: "2026-12-31",
    prior_snapshot_generated_at_utc: null,
  };
  const explicitHalvingRoute = {
    ...baseRoute,
    locale: "ru",
    raw_question: "Халвинг и его влияние на окна в циклах",
    normalized_question: "халвинг и его влияние на окна в циклах",
    domain: "bitcoin_protocol",
    subject: "halving",
    intents: ["explain", "bridge"],
    context_relation: "NEW_TOPIC",
    time_range: null,
    market_question_class: null,
    capability_id: "bitcoin_protocol.halving",
    explicit_entities: ["halving"],
  };
  const explicitHalving = applyBtcRelationIntentPrecedence(
    explicitHalvingRoute,
    explicitHalvingRoute.raw_question,
    priorMarsPacket,
    retainedMarsMemory,
  );
  assert.equal(explicitHalving.route.domain, "bitcoin_protocol");
  assert.equal(explicitHalving.route.subject, "halving");
  assert.equal(explicitHalving.relation_resolution, "SINGLE_DOMAIN");

  const ambiguousAnswer = {
    ...baseAnswer,
    answer_state: "CLARIFICATION",
    answer_mode: "CLARIFICATION",
    direct_answer: "Clarification is required.",
  };
  const ambiguousOne = {
    ...baseRoute,
    raw_question: "неизвестный предмет один",
    normalized_question: "неизвестный предмет один",
    domain: "unsupported",
    subject: "unknown",
    intents: ["fact"],
    context_relation: "GENUINELY_AMBIGUOUS",
    market_question_class: null,
    capability_id: "unsupported.unknown",
    confidence: "LOW",
    explicit_entities: [],
  };
  const ambiguousTwo = {
    ...ambiguousOne,
    raw_question: "неизвестный предмет два",
    normalized_question: "неизвестный предмет два",
  };
  const clarificationOne = buildBtcEvidenceNavigationRuntimeDecision(
    "ru", ambiguousOne, ambiguousAnswer, sourceAvailable, "SINGLE_DOMAIN", null, "origin-test",
  );
  const clarificationTwo = buildBtcEvidenceNavigationRuntimeDecision(
    "ru", ambiguousTwo, ambiguousAnswer, sourceAvailable, "SINGLE_DOMAIN", null, "origin-test",
  );
  assert.notEqual(clarificationOne.clarification_fingerprint, clarificationTwo.clarification_fingerprint);
  const distinctResolution = applyBtcRuntimeAntiLoop(
    clarificationTwo,
    [],
    [clarificationOne.clarification_fingerprint],
  );
  assert.equal(distinctResolution.route_disposition, "CLARIFY");
  const exactRepeat = applyBtcRuntimeAntiLoop(
    clarificationOne,
    [],
    [clarificationOne.clarification_fingerprint],
  );
  assert.equal(exactRepeat.route_disposition, "STOP");
  assert.equal(exactRepeat.stop_reason, "REPEATED_ROUTE");

  const genericPlanetRoute = {
    ...astroRoute,
    raw_question: "Текущее положение планет?",
    normalized_question: "текущее положение планет?",
    domain: "astromodule",
    subject: "planetary_aspects",
    intents: ["watch"],
    context_relation: "NEW_TOPIC",
    time_range: null,
    market_question_class: null,
    capability_id: "astromodule.planetary_aspects",
    explicit_entities: ["planetary_aspects"],
  };
  const genericPlanetDecision = buildBtcEvidenceNavigationRuntimeDecision(
    "ru",
    genericPlanetRoute,
    {
      ...baseAnswer,
      answer_state: "CONFIRMED",
      answer_mode: "ASTRO_STATE",
      direct_answer: "Положение этой планеты рассчитано.",
    },
    sourceAvailable,
    "SINGLE_DOMAIN",
    null,
  );
  assert.equal(genericPlanetDecision.route_disposition, "CLARIFY");
  assert.equal(genericPlanetDecision.clarification_target, "SUBJECT");
  assert.equal(genericPlanetDecision.show_clarification, true);
  assert.equal(genericPlanetDecision.show_next_question, false);
  assert.equal(genericPlanetDecision.next_question_text, null);
  assert.equal(genericPlanetDecision.relation_intent_detected, false);

  const blockHeightRelationRoute = {
    ...baseRoute,
    locale: "ru",
    raw_question: "В какое время высота блоков совпадала с наиболее сильными окнами?",
    normalized_question: "в какое время высота блоков совпадала с наиболее сильными окнами?",
    domain: "bitcoin_protocol",
    subject: "block_height",
    intents: ["compare"],
    context_relation: "NEW_TOPIC",
    time_range: null,
    market_question_class: null,
    capability_id: "bitcoin_protocol.block_height",
    explicit_entities: ["block_height"],
  };
  const blockHeightRelation = applyBtcRelationIntentPrecedence(
    blockHeightRelationRoute,
    blockHeightRelationRoute.raw_question,
    null,
  );
  assert.equal(blockHeightRelation.relation_resolution, "SECOND_DOMAIN_UNRESOLVED");
  assert.equal(blockHeightRelation.btc_side_state_type, "PROTOCOL");
  assert.equal(blockHeightRelation.route.domain, "bitcoin_protocol");
  const blockHeightDecision = buildBtcEvidenceNavigationRuntimeDecision(
    "ru",
    blockHeightRelation.route,
    {
      ...baseAnswer,
      answer_state: "CONFIRMED",
      answer_mode: "PROTOCOL_EXPLAIN",
      direct_answer: "Высота блока — это номер блока в цепочке.",
    },
    sourceAvailable,
    blockHeightRelation.relation_resolution,
    blockHeightRelation.btc_side_state_type,
  );
  assert.equal(blockHeightDecision.relation_intent_detected, true);
  assert.equal(blockHeightDecision.route_disposition, "CLARIFY");
  assert.equal(blockHeightDecision.clarification_target, "RELATION_OBJECT");
  assert.equal(blockHeightDecision.show_next_question, false);

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
    ...astroRoute,
    raw_question: "How does Jupiter relate to it?",
    normalized_question: "how does jupiter relate to it?",
    domain: "astromodule",
    market_question_class: null,
    explicit_entities: ["jupiter"],
  };
  const unresolvedRelation = applyBtcRelationIntentPrecedence(
    unresolvedRelationRoute,
    unresolvedRelationRoute.raw_question,
    null,
  );
  assert.equal(unresolvedRelation.relation_resolution, "SECOND_DOMAIN_UNRESOLVED");
  const clarify = buildBtcEvidenceNavigationRuntimeDecision(
    "en",
    unresolvedRelation.route,
    { ...baseAnswer, answer_mode: "ASTRO_STATE", answer_state: "CLARIFICATION" },
    sourceAvailable,
    unresolvedRelation.relation_resolution,
    unresolvedRelation.btc_side_state_type,
  );
  assert.equal(clarify.route_disposition, "CLARIFY");
  assert.equal(clarify.clarification_target, "RELATION_OBJECT");
  assert.equal(clarify.show_clarification, true);
  assert.equal(clarify.show_next_question, false);
  assert.equal(clarify.next_question_text, null);

  const bridgeRoute = relation.route;
  const bridgeAnswer = {
    ...baseAnswer,
    answer_mode: "ASTRO_BTC_BRIDGE",
    answer_state: "LIMITED",
    direct_answer: "BTC-side state first, then the astronomical window.",
    proof_label: "Astronomical and market evidence available",
    source_boundary: "Dual proof is available without a causal claim.",
  };
  const noDualEvidence = buildBtcEvidenceNavigationRuntimeDecision(
    "en",
    bridgeRoute,
    bridgeAnswer,
    sourceUnavailable,
    relation.relation_resolution,
    relation.btc_side_state_type,
  );
  assert.equal(noDualEvidence.bridge_result, "INSUFFICIENT_DUAL_EVIDENCE");
  assert.equal(noDualEvidence.route_disposition, "STOP");
  assert.equal(noDualEvidence.stop_reason, "MISSING_EVIDENCE");
  assert.equal(noDualEvidence.show_next_question, false);

  const concurrence = buildBtcEvidenceNavigationRuntimeDecision(
    "en",
    bridgeRoute,
    bridgeAnswer,
    sourceAvailable,
    relation.relation_resolution,
    relation.btc_side_state_type,
  );
  assert.equal(concurrence.bridge_result, "TEMPORAL_CONCURRENCE_ONLY");
  assert.equal(concurrence.btc_side_state_type, "MARKET");

  const divergence = buildBtcEvidenceNavigationRuntimeDecision(
    "en",
    bridgeRoute,
    { ...bridgeAnswer, answer_state: "SPLIT" },
    sourceAvailable,
    relation.relation_resolution,
    relation.btc_side_state_type,
  );
  assert.equal(divergence.bridge_result, "DIVERGENCE");

  const confirmedRoute = {
    ...bridgeRoute,
    intents: [...bridgeRoute.intents, "confirmation"],
  };
  const confirmed = buildBtcEvidenceNavigationRuntimeDecision(
    "en",
    confirmedRoute,
    { ...bridgeAnswer, answer_state: "CONFIRMED" },
    sourceAvailable,
    relation.relation_resolution,
    relation.btc_side_state_type,
  );
  assert.equal(confirmed.bridge_result, "MARKET_CONFIRMED");

  const marketDecision = buildBtcEvidenceNavigationRuntimeDecision(
    "en",
    baseRoute,
    baseAnswer,
    sourceAvailable,
    "SINGLE_DOMAIN",
    null,
  );
  assert.equal(marketDecision.route_disposition, "CONTINUE");
  assert.equal(marketDecision.primary_authority, "ACCEPTED_MARKET_RECORD_AND_VERIFIED_MARKET_DERIVATIONS");
  assert.deepEqual(marketDecision.evidence_levels, ["L1", "L2", "L3"]);
  assert.equal(marketDecision.show_next_question, true);
  assert.deepEqual(marketDecision.render_gate, {
    direct_answer_relevant: true,
    user_intent_resolved: true,
    new_information_gain: true,
    mode_transition_safe: true,
    evidence_available: true,
    semantic_repeat: false,
  });

  const repeated = applyBtcRuntimeAntiLoop(
    marketDecision,
    [marketDecision.next_question_fingerprint],
    [],
  );
  assert.equal(repeated.route_disposition, "STOP");
  assert.equal(repeated.stop_reason, "REPEATED_ROUTE");
  assert.equal(repeated.anti_loop_blocked, true);
  assert.equal(repeated.show_next_question, false);
  assert.equal(repeated.context_safe_composer, true);

  const tradingRoute = {
    ...baseRoute,
    raw_question: "What leverage should I use for BTC?",
    normalized_question: "what leverage should i use for btc?",
  };
  const trading = buildBtcEvidenceNavigationRuntimeDecision(
    "en",
    tradingRoute,
    baseAnswer,
    sourceAvailable,
    "SINGLE_DOMAIN",
    null,
  );
  assert.equal(trading.route_disposition, "STOP");
  assert.equal(trading.stop_reason, "OUT_OF_SCOPE");
  assert.equal(trading.show_next_question, false);

  console.log(JSON.stringify({
    status: "PASS",
    schema: marketDecision.schema,
    checks: 61,
    route_dispositions: ["CONTINUE", "CLARIFY", "STOP"],
    bridge_results: [
      "MARKET_CONFIRMED",
      "TEMPORAL_CONCURRENCE_ONLY",
      "DIVERGENCE",
      "INSUFFICIENT_DUAL_EVIDENCE",
    ],
    render_gate: marketDecision.render_gate,
  }, null, 2));
} finally {
  await rm(temporary, { recursive: true, force: true });
}
