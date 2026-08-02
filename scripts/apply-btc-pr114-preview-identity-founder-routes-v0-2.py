#!/usr/bin/env python3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def write(path: str, value: str) -> None:
    (ROOT / path).write_text(value, encoding="utf-8")


def replace_once(path: str, old: str, new: str, label: str) -> None:
    value = read(path)
    count = value.count(old)
    if count != 1:
        raise SystemExit(f"{path}: {label}: expected one match, found {count}")
    write(path, value.replace(old, new, 1))


# ---------------------------------------------------------------------------
# Relation morphology, generic planet-subject clarification, browser markers.
# ---------------------------------------------------------------------------
runtime = "lib/btc-cosmographer-evidence-navigation-runtime.ts"
replace_once(
    runtime,
    '''  bridge_result: BtcBridgeResult | null;
  relation_resolution: BtcRelationResolution;
  clarification_target: BtcClarificationTarget | null;
''',
    '''  bridge_result: BtcBridgeResult | null;
  relation_intent_detected: boolean;
  relation_resolution: BtcRelationResolution;
  clarification_target: BtcClarificationTarget | null;
''',
    "runtime decision relation marker",
)
replace_once(
    runtime,
    '''const RELATION_OPERATOR = /impact|influence|affect|correlat|coincid|relat(?:e|ed|es|ing|ion)?|compare|versus|\\bvs\\b|повлиял|влияни|связ|совпал|корреляц|сравн|между|подтверж/i;
const UNRESOLVED_PRONOUN = /^(?:it|this|that|them|what about it|and this|это|этот|эта|они|а это|и это|там)\\b/i;
''',
    '''const RELATION_OPERATOR = /impact|influence|affect|correlat|coincid|relat(?:e|ed|es|ing|ion)?|compare|versus|\\bvs\\b|повлиял|влияни|корреляц|между|подтверж|совпад[а-яё]*|соотнос[а-яё]*|связ[а-яё]*|сравн[а-яё]*|одновремен[а-яё]*/iu;
const GENERIC_PLANET_POSITION = /(?:текущ[а-яё]*|сейчас)[^?!.]{0,48}положен[а-яё]*[^?!.]{0,24}планет[а-яё]*/iu;
const UNRESOLVED_PRONOUN = /^(?:it|this|that|them|what about it|and this|это|этот|эта|они|а это|и это|там)\\b/i;
''',
    "Russian relation morphology",
)
replace_once(
    runtime,
    '''function unique<T>(values: T[]): T[] {
  return Array.from(new Set(values));
}

function hasAstroObject(
''',
    '''function unique<T>(values: T[]): T[] {
  return Array.from(new Set(values));
}

export function detectBtcRelationIntent(rawQuestion: string): boolean {
  return RELATION_OPERATOR.test(rawQuestion.trim());
}

function hasAstroObject(
''',
    "relation detector export",
)
replace_once(
    runtime,
    '''  const question = rawQuestion.trim();
  if (!RELATION_OPERATOR.test(question)) {
''',
    '''  const question = rawQuestion.trim();
  if (!detectBtcRelationIntent(question)) {
''',
    "relation precedence detector",
)
replace_once(
    runtime,
    '''  if (relationResolution === "SECOND_DOMAIN_UNRESOLVED" || RELATION_OPERATOR.test(question)) return "RELATION_OBJECT";
''',
    '''  if (relationResolution === "SECOND_DOMAIN_UNRESOLVED" || detectBtcRelationIntent(question)) return "RELATION_OBJECT";
''',
    "clarification relation detector",
)
replace_once(
    runtime,
    '''  const bridge = bridgeResult(route, answer, source);
  const outOfScope = OUT_OF_SCOPE_TRADING.test(route.normalized_question);
  const genuinelyAmbiguous = route.context_relation === "GENUINELY_AMBIGUOUS" ||
''',
    '''  const bridge = bridgeResult(route, answer, source);
  const relationIntentDetected = detectBtcRelationIntent(route.raw_question || route.normalized_question);
  const genericPlanetSubject = GENERIC_PLANET_POSITION.test(route.normalized_question);
  const outOfScope = OUT_OF_SCOPE_TRADING.test(route.normalized_question);
  const genuinelyAmbiguous = route.context_relation === "GENUINELY_AMBIGUOUS" ||
''',
    "decision ambiguity inputs",
)
replace_once(
    runtime,
    '''  if (outOfScope) {
    routeDisposition = "STOP";
    stopReason = "OUT_OF_SCOPE";
  } else if (relationResolution === "SECOND_DOMAIN_UNRESOLVED" || answer.answer_state === "CLARIFICATION" || genuinelyAmbiguous) {
''',
    '''  if (outOfScope) {
    routeDisposition = "STOP";
    stopReason = "OUT_OF_SCOPE";
  } else if (genericPlanetSubject) {
    routeDisposition = "CLARIFY";
    target = "SUBJECT";
  } else if (relationResolution === "SECOND_DOMAIN_UNRESOLVED" || answer.answer_state === "CLARIFICATION" || genuinelyAmbiguous) {
''',
    "generic planet clarification",
)
replace_once(
    runtime,
    '''    bridge_result: bridge,
    relation_resolution: relationResolution,
    clarification_target: target,
''',
    '''    bridge_result: bridge,
    relation_intent_detected: relationIntentDetected,
    relation_resolution: relationResolution,
    clarification_target: target,
''',
    "decision relation output",
)

# ---------------------------------------------------------------------------
# Session schema reset and exact deployment binding.
# ---------------------------------------------------------------------------
session = "lib/btc-live-dialogue-session.ts"
replace_once(
    session,
    '''  BtcNextQuestionType,
  BtcRouteDisposition,
''',
    '''  BtcNextQuestionType,
  BtcRelationResolution,
  BtcRouteDisposition,
''',
    "session relation type import",
)
replace_once(
    session,
    '''export const BTC_DIALOGUE_SESSION_SCHEMA =
  "btc_cosmographer_dialogue_session_v0_2" as const;
const BTC_DIALOGUE_LEGACY_SESSION_SCHEMA =
  "btc_free_dialogue_session_v0_1" as const;
export const BTC_DIALOGUE_SESSION_KEY =
  "bhrigu:btc-free-dialogue:session:v0_1" as const;
const BTC_DIALOGUE_PREVIOUS_SESSION_KEY =
  "bhrigu:btc-cosmographer:session:v0_2" as const;
''',
    '''export const BTC_DIALOGUE_SESSION_SCHEMA =
  "btc_cosmographer_dialogue_session_v0_3" as const;
export const BTC_DIALOGUE_SESSION_KEY =
  "bhrigu:btc-cosmographer:session:v0_3" as const;
const BTC_DIALOGUE_STALE_SESSION_KEYS = [
  "bhrigu:btc-free-dialogue:session:v0_1",
  "bhrigu:btc-cosmographer:session:v0_1",
  "bhrigu:btc-cosmographer:session:v0_2",
] as const;
''',
    "session schema and keys",
)
replace_once(
    session,
    '''  bridge_result?: BtcBridgeResult | null;
  show_next_question?: boolean;
''',
    '''  bridge_result?: BtcBridgeResult | null;
  relation_intent_detected?: boolean;
  relation_resolution?: BtcRelationResolution;
  show_next_question?: boolean;
''',
    "session relation fields",
)
replace_once(
    session,
    '''  if (value.bridge_result !== undefined && value.bridge_result !== null && !["MARKET_CONFIRMED", "TEMPORAL_CONCURRENCE_ONLY", "DIVERGENCE", "INSUFFICIENT_DUAL_EVIDENCE"].includes(String(value.bridge_result))) return false;
  if (value.show_next_question !== undefined && typeof value.show_next_question !== "boolean") return false;
''',
    '''  if (value.bridge_result !== undefined && value.bridge_result !== null && !["MARKET_CONFIRMED", "TEMPORAL_CONCURRENCE_ONLY", "DIVERGENCE", "INSUFFICIENT_DUAL_EVIDENCE"].includes(String(value.bridge_result))) return false;
  if (value.relation_intent_detected !== undefined && typeof value.relation_intent_detected !== "boolean") return false;
  if (value.relation_resolution !== undefined && !["SINGLE_DOMAIN", "TWO_DOMAINS_RESOLVED", "SECOND_DOMAIN_UNRESOLVED"].includes(String(value.relation_resolution))) return false;
  if (value.show_next_question !== undefined && typeof value.show_next_question !== "boolean") return false;
''',
    "session relation validation",
)
replace_once(
    session,
    '''  if (value.schema !== BTC_DIALOGUE_SESSION_SCHEMA && value.schema !== BTC_DIALOGUE_LEGACY_SESSION_SCHEMA) return null;
''',
    '''  if (value.schema !== BTC_DIALOGUE_SESSION_SCHEMA) return null;
''',
    "strict session schema",
)
old_read = '''export function readBtcDialogueSession(
  locale: BtcPublicLocale,
  deploymentSha: string | null,
): BtcDialogueSession {
  if (!storageAvailable()) return createBtcDialogueSession(locale, deploymentSha);
  const raw = window.sessionStorage.getItem(BTC_DIALOGUE_SESSION_KEY) ??
    window.sessionStorage.getItem(BTC_DIALOGUE_PREVIOUS_SESSION_KEY);
  if (!raw) return createBtcDialogueSession(locale, deploymentSha);
  try {
    const parsed = parseBtcDialogueSession(JSON.parse(raw));
    if (!parsed) throw new Error("invalid session");
    const migrated = {
      ...parsed,
      locale,
      source_binding: {
        ...parsed.source_binding,
        deployment_sha: deploymentSha ?? parsed.source_binding.deployment_sha,
      },
    };
    window.sessionStorage.setItem(BTC_DIALOGUE_SESSION_KEY, JSON.stringify(migrated));
    window.sessionStorage.removeItem(BTC_DIALOGUE_PREVIOUS_SESSION_KEY);
    return migrated;
  } catch {
    window.sessionStorage.removeItem(BTC_DIALOGUE_SESSION_KEY);
    window.sessionStorage.removeItem(BTC_DIALOGUE_PREVIOUS_SESSION_KEY);
    return createBtcDialogueSession(locale, deploymentSha);
  }
}
'''
new_read = '''function clearStaleBtcDialogueSessionKeys(): void {
  if (!storageAvailable()) return;
  BTC_DIALOGUE_STALE_SESSION_KEYS.forEach((key) => window.sessionStorage.removeItem(key));
}

export function readBtcDialogueSession(
  locale: BtcPublicLocale,
  deploymentSha: string | null,
): BtcDialogueSession {
  if (!storageAvailable()) return createBtcDialogueSession(locale, deploymentSha);
  clearStaleBtcDialogueSessionKeys();
  const raw = window.sessionStorage.getItem(BTC_DIALOGUE_SESSION_KEY);
  if (!raw) return createBtcDialogueSession(locale, deploymentSha);
  try {
    const parsed = parseBtcDialogueSession(JSON.parse(raw));
    if (!parsed) throw new Error("invalid session");
    if (parsed.locale !== locale) throw new Error("locale changed");
    if (deploymentSha && parsed.source_binding.deployment_sha !== deploymentSha) {
      throw new Error("deployment changed");
    }
    return parsed;
  } catch {
    window.sessionStorage.removeItem(BTC_DIALOGUE_SESSION_KEY);
    clearStaleBtcDialogueSessionKeys();
    return createBtcDialogueSession(locale, deploymentSha);
  }
}
'''
replace_once(session, old_read, new_read, "deployment-bound session reader")
replace_once(
    session,
    '''    window.sessionStorage.setItem(BTC_DIALOGUE_SESSION_KEY, JSON.stringify(compacted));
    window.sessionStorage.removeItem(BTC_DIALOGUE_PREVIOUS_SESSION_KEY);
''',
    '''    window.sessionStorage.setItem(BTC_DIALOGUE_SESSION_KEY, JSON.stringify(compacted));
    clearStaleBtcDialogueSessionKeys();
''',
    "session writer stale cleanup",
)
replace_once(
    session,
    '''  window.sessionStorage.removeItem(BTC_DIALOGUE_SESSION_KEY);
  window.sessionStorage.removeItem(BTC_DIALOGUE_PREVIOUS_SESSION_KEY);
''',
    '''  window.sessionStorage.removeItem(BTC_DIALOGUE_SESSION_KEY);
  clearStaleBtcDialogueSessionKeys();
''',
    "session clear stale cleanup",
)

# ---------------------------------------------------------------------------
# Clarification-only projection and machine-visible browser state.
# ---------------------------------------------------------------------------
component = "components/btc/BtcCosmographerDialogue.tsx"
replace_once(
    component,
    '''import {
  applyBtcRuntimeAntiLoop,
  type BtcEvidenceNavigationRuntimeDecision,
} from "../../lib/btc-cosmographer-evidence-navigation-runtime";
''',
    '''import {
  applyBtcRuntimeAntiLoop,
  BTC_EVIDENCE_NAVIGATION_RUNTIME_SCHEMA,
  type BtcEvidenceNavigationRuntimeDecision,
} from "../../lib/btc-cosmographer-evidence-navigation-runtime";
''',
    "component runtime schema import",
)
replace_once(
    component,
    '''  clearBtcDialogueSession,
  latestContextTurn,
''',
    '''  BTC_DIALOGUE_SESSION_SCHEMA,
  clearBtcDialogueSession,
  latestContextTurn,
''',
    "component session schema import",
)
old_apply = '''function applyRuntimeDecisionToTurn(
  turn: BtcDialogueTurn,
  decision: BtcEvidenceNavigationRuntimeDecision,
): BtcDialogueTurn {
  return {
    ...turn,
    route_disposition: decision.route_disposition,
    primary_authority: decision.primary_authority,
    evidence_levels: decision.evidence_levels,
    btc_side_state_type: decision.btc_side_state_type,
    bridge_result: decision.bridge_result,
    show_next_question: decision.show_next_question,
    next_precise_question_type: decision.next_question_type,
    next_precise_question_text: decision.next_question_text,
    next_precise_question_fingerprint: decision.next_question_fingerprint,
    show_clarification: decision.show_clarification,
    clarification_target: decision.clarification_target,
    clarification_text: decision.clarification_text,
    clarification_fingerprint: decision.clarification_fingerprint,
    anti_loop_blocked: decision.anti_loop_blocked,
    valid_route_stop: decision.valid_route_stop,
    stop_reason: decision.stop_reason,
    context_safe_composer: decision.context_safe_composer,
  };
}
'''
new_apply = '''function applyRuntimeDecisionToTurn(
  turn: BtcDialogueTurn,
  decision: BtcEvidenceNavigationRuntimeDecision,
): BtcDialogueTurn {
  const clarificationOnly = decision.route_disposition === "CLARIFY";
  return {
    ...turn,
    answer_state: clarificationOnly ? "CLARIFICATION" : turn.answer_state,
    answer_mode: clarificationOnly ? "CLARIFICATION" : turn.answer_mode,
    headline: clarificationOnly
      ? (turn.locale === "ru" ? "Нужно уточнить предмет" : "The subject needs clarification")
      : turn.headline,
    direct_answer: clarificationOnly ? null : turn.direct_answer,
    evidence_lines: clarificationOnly ? [] : turn.evidence_lines,
    sections: clarificationOnly ? [] : turn.sections,
    route_disposition: decision.route_disposition,
    primary_authority: decision.primary_authority,
    evidence_levels: decision.evidence_levels,
    btc_side_state_type: decision.btc_side_state_type,
    bridge_result: decision.bridge_result,
    relation_intent_detected: decision.relation_intent_detected,
    relation_resolution: decision.relation_resolution,
    show_next_question: decision.show_next_question,
    next_precise_question_type: decision.next_question_type,
    next_precise_question_text: decision.next_question_text,
    next_precise_question_fingerprint: decision.next_question_fingerprint,
    show_clarification: decision.show_clarification,
    clarification_target: decision.clarification_target,
    clarification_text: decision.clarification_text,
    clarification_fingerprint: decision.clarification_fingerprint,
    anti_loop_blocked: decision.anti_loop_blocked,
    valid_route_stop: decision.valid_route_stop,
    stop_reason: decision.stop_reason,
    context_safe_composer: decision.context_safe_composer,
  };
}
'''
replace_once(component, old_apply, new_apply, "clarification-only turn projection")
replace_once(
    component,
    '''      data-bridge-result={turn.bridge_result ?? "NOT_APPLICABLE"}
      data-show-next-question={turn.show_next_question ? "true" : "false"}
      data-show-clarification={turn.show_clarification ? "true" : "false"}
''',
    '''      data-bridge-result={turn.bridge_result ?? "NOT_APPLICABLE"}
      data-relation-intent-detected={turn.relation_intent_detected ? "true" : "false"}
      data-relation-resolution={turn.relation_resolution ?? "SINGLE_DOMAIN"}
      data-clarification-target={turn.clarification_target ?? "NOT_APPLICABLE"}
      data-anti-loop-blocked={turn.anti_loop_blocked ? "true" : "false"}
      data-show-next-question={turn.show_next_question ? "true" : "false"}
      data-show-clarification={turn.show_clarification ? "true" : "false"}
''',
    "browser route markers",
)
replace_once(
    component,
    '''  return <main className="liveDialoguePage" lang={locale} data-live-dialogue="btc-cosmographer-route-v0-1" data-session-local="true">
''',
    '''  return <main
    className="liveDialoguePage"
    lang={locale}
    data-live-dialogue="btc-cosmographer-route-v0-1"
    data-session-local="true"
    data-deployment-head-sha={deploymentSourceSha ?? "UNAVAILABLE"}
    data-runtime-schema={BTC_EVIDENCE_NAVIGATION_RUNTIME_SCHEMA}
    data-session-schema={BTC_DIALOGUE_SESSION_SCHEMA}
    data-cache-policy="no-store"
  >
''',
    "deployment identity DOM marker",
)

# ---------------------------------------------------------------------------
# Exact-head response markers and no-store Preview response.
# ---------------------------------------------------------------------------
live = "pages/crypto-astro/btc/live.tsx"
replace_once(
    live,
    '''import {
  applyBtcRelationIntentPrecedence,
  buildBtcEvidenceNavigationRuntimeDecision,
  type BtcEvidenceNavigationRuntimeDecision,
} from "../../../lib/btc-cosmographer-evidence-navigation-runtime";
''',
    '''import {
  applyBtcRelationIntentPrecedence,
  BTC_EVIDENCE_NAVIGATION_RUNTIME_SCHEMA,
  buildBtcEvidenceNavigationRuntimeDecision,
  type BtcEvidenceNavigationRuntimeDecision,
} from "../../../lib/btc-cosmographer-evidence-navigation-runtime";
''',
    "live runtime schema import",
)
replace_once(
    live,
    '''import { BTC_LIVE_DIALOGUE_CSS } from "../../../lib/btc-live-dialogue-style";
''',
    '''import { BTC_LIVE_DIALOGUE_CSS } from "../../../lib/btc-live-dialogue-style";
import { BTC_DIALOGUE_SESSION_SCHEMA } from "../../../lib/btc-live-dialogue-session";
''',
    "live session schema import",
)
replace_once(
    live,
    '''function deploymentSourceSha(): string | null {
  const value = process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.GITHUB_SHA ?? null;
''',
    '''function deploymentSourceSha(): string | null {
  const value = process.env.VERCEL_GIT_COMMIT_SHA ??
    process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ??
    process.env.GITHUB_SHA ??
    null;
''',
    "deployment SHA resolution",
)
replace_once(
    live,
    '''export const getServerSideProps: GetServerSideProps<Props> = async ({ query }) => {
  const initialQuestion = first(query.q);
''',
    '''export const getServerSideProps: GetServerSideProps<Props> = async ({ query, res }) => {
  const servedDeploymentSha = deploymentSourceSha();
  res.setHeader("Cache-Control", "private, no-store, max-age=0, must-revalidate");
  res.setHeader("CDN-Cache-Control", "no-store");
  res.setHeader("Vercel-CDN-Cache-Control", "no-store");
  res.setHeader("X-BTC-Deployment-Source-Sha", servedDeploymentSha ?? "UNAVAILABLE");
  res.setHeader("X-BTC-Dialogue-Session-Schema", BTC_DIALOGUE_SESSION_SCHEMA);
  const initialQuestion = first(query.q);
''',
    "no-store server response",
)
replace_once(
    live,
    '''    deploymentSourceSha: deploymentSourceSha(),
''',
    '''    deploymentSourceSha: servedDeploymentSha,
''',
    "base deployment SHA binding",
)
replace_once(
    live,
    '''      <meta name="btc-deployment-source-sha" content={props.deploymentSourceSha ?? ""}/>
''',
    '''      <meta name="btc-deployment-source-sha" content={props.deploymentSourceSha ?? ""}/>
      <meta name="btc-runtime-schema" content={BTC_EVIDENCE_NAVIGATION_RUNTIME_SCHEMA}/>
      <meta name="btc-dialogue-session-schema" content={BTC_DIALOGUE_SESSION_SCHEMA}/>
      <meta name="btc-preview-cache-policy" content="no-store"/>
''',
    "head machine markers",
)

# ---------------------------------------------------------------------------
# Deterministic fixture additions for the two founder routes and morphology.
# ---------------------------------------------------------------------------
fixture = "scripts/run-btc-evidence-navigation-runtime-fixture.mjs"
replace_once(
    fixture,
    '''    applyBtcRelationIntentPrecedence,
    applyBtcRuntimeAntiLoop,
    buildBtcEvidenceNavigationRuntimeDecision,
''',
    '''    applyBtcRelationIntentPrecedence,
    applyBtcRuntimeAntiLoop,
    buildBtcEvidenceNavigationRuntimeDecision,
    detectBtcRelationIntent,
''',
    "fixture relation detector import",
)
insert_after_relation = '''  assert.equal(relation.route.context_relation, "CROSS_MODULE_BRIDGE");
'''
relation_tests = '''  assert.equal(relation.route.context_relation, "CROSS_MODULE_BRIDGE");

  const russianRelationForms = [
    "Высота блоков совпадала с окнами",
    "Высота блоков соотносилась с окнами",
    "Высота блоков связана с окнами",
    "Высота блоков сравнивалась с окнами",
    "Высота блоков и окна были одновременными",
  ];
  russianRelationForms.forEach((question) => assert.equal(detectBtcRelationIntent(question), true));

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
'''
replace_once(fixture, insert_after_relation, relation_tests, "founder route fixtures")
replace_once(fixture, '    checks: 41,\n', '    checks: 61,\n', "fixture check count")

# ---------------------------------------------------------------------------
# Durable exact-head local + deployed Preview browser acceptance workflow.
# ---------------------------------------------------------------------------
workflow = """name: BTC Evidence and Navigation Runtime
# Exact-head runtime, Preview identity, cache/session isolation, and founder-route acceptance.

on:
  pull_request:
    branches:
      - master
    paths:
      - .github/scripts/verify-btc-public-acceptance-scope.py
      - .github/workflows/btc-evidence-navigation-runtime-pr.yml
      - components/btc/BtcCosmographerDialogue.tsx
      - lib/btc-cosmographer-answer.ts
      - lib/btc-cosmographer-evidence-navigation-runtime.ts
      - lib/btc-live-dialogue-session.ts
      - lib/btc-live-dialogue-style.ts
      - pages/crypto-astro/btc/live.tsx
      - scripts/run-btc-evidence-navigation-runtime-fixture.mjs
  workflow_dispatch:

concurrency:
  group: btc-evidence-navigation-runtime-${{ github.event.pull_request.number || github.ref }}
  cancel-in-progress: true

permissions:
  contents: read
  issues: read

jobs:
  runtime-acceptance:
    runs-on: ubuntu-24.04
    timeout-minutes: 25
    steps:
      - name: Checkout exact candidate
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Set up Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Install locked dependencies
        run: npm ci --ignore-scripts

      - name: Verify exact product scope
        if: github.event_name == 'pull_request'
        env:
          BTC_ACCEPTANCE_BASE_SHA: ${{ github.event.pull_request.base.sha }}
          BTC_ACCEPTANCE_HEAD_SHA: ${{ github.event.pull_request.head.sha }}
        run: python3 .github/scripts/verify-btc-public-acceptance-scope.py

      - name: Verify evidence and navigation runtime
        run: node scripts/run-btc-evidence-navigation-runtime-fixture.mjs

      - name: Verify inherited BTC routing
        run: npm run verify:btc-routing

      - name: Verify production build
        run: npm run build

      - name: Verify public safety boundary
        run: |
          ! grep -RniE 'personalized (buy|sell)|guaranteed return|guaranteed profit' \\
            lib/btc-cosmographer-evidence-navigation-runtime.ts \\
            lib/btc-cosmographer-answer.ts \\
            components/btc/BtcCosmographerDialogue.tsx

  deployed-preview-acceptance:
    if: github.event_name == 'pull_request'
    needs: runtime-acceptance
    runs-on: ubuntu-24.04
    timeout-minutes: 25
    steps:
      - name: Resolve Vercel Preview and prove exact served head
        id: preview
        env:
          GH_TOKEN: ${{ github.token }}
          GH_REPOSITORY: ${{ github.repository }}
          PR_NUMBER: ${{ github.event.pull_request.number }}
          EXPECTED_HEAD: ${{ github.event.pull_request.head.sha }}
        run: |
          python3 - <<'PY'
          import json, os, re, time, urllib.parse, urllib.request

          repo = os.environ["GH_REPOSITORY"]
          pr = os.environ["PR_NUMBER"]
          expected = os.environ["EXPECTED_HEAD"]
          api = f"https://api.github.com/repos/{repo}/issues/{pr}/comments?per_page=100"
          headers = {
              "Authorization": f"Bearer {os.environ['GH_TOKEN']}",
              "Accept": "application/vnd.github+json",
              "X-GitHub-Api-Version": "2022-11-28",
              "User-Agent": "btc-pr114-preview-identity",
          }
          preview = None
          last_marker = None
          for attempt in range(150):
              request = urllib.request.Request(api, headers=headers)
              with urllib.request.urlopen(request, timeout=30) as response:
                  comments = json.load(response)
              for comment in comments:
                  if comment.get("user", {}).get("login") != "vercel[bot]":
                      continue
                  match = re.search(r"\\[Preview\\]\\((https://[^)]+\\.vercel\\.app)\\)", comment.get("body", ""))
                  if match:
                      preview = match.group(1).rstrip("/")
                      break
              if preview:
                  query = urllib.parse.urlencode({
                      "lang": "ru",
                      "preview_identity": expected,
                      "attempt": attempt,
                  })
                  url = f"{preview}/crypto-astro/btc/live?{query}"
                  page_headers = {
                      "Cache-Control": "no-cache, no-store, max-age=0",
                      "Pragma": "no-cache",
                      "User-Agent": "btc-pr114-preview-identity",
                  }
                  try:
                      page_request = urllib.request.Request(url, headers=page_headers)
                      with urllib.request.urlopen(page_request, timeout=30) as response:
                          html = response.read().decode("utf-8", errors="replace")
                          cache_control = response.headers.get("Cache-Control", "")
                          response_sha = response.headers.get("X-BTC-Deployment-Source-Sha", "")
                      markers = [
                          re.search(r'name="btc-deployment-source-sha" content="([0-9a-fA-F]{40})"', html),
                          re.search(r'data-deployment-head-sha="([0-9a-fA-F]{40})"', html),
                      ]
                      last_marker = next((item.group(1) for item in markers if item), response_sha or None)
                      if last_marker == expected and "no-store" in cache_control.lower():
                          output = os.environ["GITHUB_OUTPUT"]
                          with open(output, "a", encoding="utf-8") as stream:
                              stream.write(f"preview_base={preview}\\n")
                              stream.write(f"served_head={last_marker}\\n")
                          print(json.dumps({
                              "status": "PASS_EXACT_PREVIEW_IDENTITY",
                              "preview": preview,
                              "served_head": last_marker,
                              "cache_control": cache_control,
                          }))
                          raise SystemExit(0)
                  except Exception as error:
                      print(f"attempt={attempt} preview={preview} marker={last_marker} error={error}")
              time.sleep(5)
          raise SystemExit(f"Preview did not serve exact head {expected}; preview={preview}; last_marker={last_marker}")
          PY

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.12'

      - name: Install browser acceptance driver
        run: python -m pip install --disable-pip-version-check selenium==4.34.2

      - name: Replay founder routes on deployed desktop and mobile Preview
        env:
          PREVIEW_BASE: ${{ steps.preview.outputs.preview_base }}
          EXPECTED_HEAD: ${{ github.event.pull_request.head.sha }}
        run: |
          python3 - <<'PY'
          import json, os, time
          from urllib.parse import urlencode
          from selenium import webdriver
          from selenium.webdriver.common.by import By
          from selenium.webdriver.support.ui import WebDriverWait

          base = os.environ["PREVIEW_BASE"].rstrip("/")
          expected = os.environ["EXPECTED_HEAD"]
          session_key = "bhrigu:btc-cosmographer:session:v0_3"
          stale_keys = [
              "bhrigu:btc-free-dialogue:session:v0_1",
              "bhrigu:btc-cosmographer:session:v0_1",
              "bhrigu:btc-cosmographer:session:v0_2",
          ]

          def driver_for(width, height):
              options = webdriver.ChromeOptions()
              options.add_argument("--headless=new")
              options.add_argument("--no-sandbox")
              options.add_argument("--disable-dev-shm-usage")
              options.add_argument("--disable-gpu")
              options.add_argument("--window-size=%d,%d" % (width, height))
              driver = webdriver.Chrome(options=options)
              driver.set_window_size(width, height)
              return driver

          def wait(driver, selector):
              return WebDriverWait(driver, 25).until(
                  lambda current: current.find_element(By.CSS_SELECTOR, selector)
              )

          def open_question(driver, question, label):
              params = urlencode({
                  "lang": "ru",
                  "q": question,
                  "preview_head": expected,
                  "acceptance": label,
                  "nonce": str(time.time_ns()),
              })
              driver.get(f"{base}/crypto-astro/btc/live?{params}")
              root = wait(driver, "main[data-deployment-head-sha]")
              assert root.get_attribute("data-deployment-head-sha") == expected
              assert root.get_attribute("data-runtime-schema") == "btc_cosmographer_evidence_navigation_runtime_v0_1"
              assert root.get_attribute("data-session-schema") == "btc_cosmographer_dialogue_session_v0_3"
              assert root.get_attribute("data-cache-policy") == "no-store"
              meta = driver.find_element(By.CSS_SELECTOR, 'meta[name="btc-deployment-source-sha"]')
              assert meta.get_attribute("content") == expected
              return wait(driver, "article.cosmographerTurn")

          results = []
          for suffix, width, height in (("desktop", 1440, 1000), ("mobile", 390, 844)):
              driver = driver_for(width, height)
              try:
                  driver.get(f"{base}/crypto-astro/btc/live?lang=ru&seed={time.time_ns()}")
                  wait(driver, "main[data-deployment-head-sha]")
                  stale = {
                      "schema": "btc_cosmographer_dialogue_session_v0_3",
                      "session_id": "stale-preview-session",
                      "locale": "ru",
                      "created_at_utc": "2026-08-01T00:00:00Z",
                      "updated_at_utc": "2026-08-01T00:00:00Z",
                      "compacted": False,
                      "source_binding": {
                          "deployment_sha": "0" * 40,
                          "snapshot_generated_at_utc": None,
                      },
                      "turns": [],
                  }
                  driver.execute_script(
                      "sessionStorage.setItem(arguments[0], arguments[1]);" +
                      "sessionStorage.setItem(arguments[2], arguments[3]);" +
                      "sessionStorage.setItem(arguments[4], arguments[3]);" +
                      "sessionStorage.setItem(arguments[5], arguments[3]);",
                      session_key,
                      json.dumps(stale),
                      stale_keys[0],
                      json.dumps({"schema": "btc_free_dialogue_session_v0_1"}),
                      stale_keys[1],
                      stale_keys[2],
                  )

                  first = open_question(driver, "Текущее положение планет?", f"planet-subject-{suffix}")
                  assert first.get_attribute("data-route-disposition") == "CLARIFY"
                  assert first.get_attribute("data-clarification-target") == "SUBJECT"
                  assert first.get_attribute("data-show-next-question") == "false"
                  assert first.get_attribute("data-show-clarification") == "true"
                  assert first.get_attribute("data-anti-loop-blocked") == "false"
                  assert first.get_attribute("data-answer-mode") == "CLARIFICATION"
                  assert "этой планеты" not in first.text.casefold()
                  assert not first.find_elements(By.CSS_SELECTOR, '[data-route-surface="next-precise-question"]')
                  session = json.loads(driver.execute_script("return sessionStorage.getItem(arguments[0]);", session_key))
                  assert session["schema"] == "btc_cosmographer_dialogue_session_v0_3"
                  assert session["source_binding"]["deployment_sha"] == expected
                  assert len(session["turns"]) == 1
                  for key in stale_keys:
                      assert driver.execute_script("return sessionStorage.getItem(arguments[0]);", key) is None

                  driver.execute_script("sessionStorage.clear();")
                  second = open_question(
                      driver,
                      "В какое время высота блоков совпадала с наиболее сильными окнами?",
                      f"block-window-relation-{suffix}",
                  )
                  assert second.get_attribute("data-relation-intent-detected") == "true"
                  assert second.get_attribute("data-relation-resolution") in {
                      "SECOND_DOMAIN_UNRESOLVED",
                      "TWO_DOMAINS_RESOLVED",
                  }
                  disposition = second.get_attribute("data-route-disposition")
                  domain = second.get_attribute("data-route-domain")
                  bridge = second.get_attribute("data-bridge-result")
                  mode = second.get_attribute("data-answer-mode")
                  assert domain == "astro_btc_bridge" or disposition == "CLARIFY" or bridge == "INSUFFICIENT_DUAL_EVIDENCE"
                  assert not (domain == "bitcoin_protocol" and disposition == "CONTINUE")
                  assert mode != "PROTOCOL_EXPLAIN"
                  assert not second.find_elements(By.CSS_SELECTOR, '[data-answer-direct="true"]') if disposition == "CLARIFY" else True
                  assert "высота блока — это" not in second.text.casefold()
                  if disposition != "CONTINUE":
                      assert second.get_attribute("data-show-next-question") == "false"

                  results.append({
                      "viewport": suffix,
                      "served_head": expected,
                      "planet_route": "CLARIFY_SUBJECT",
                      "relation_intent": True,
                      "relation_resolution": second.get_attribute("data-relation-resolution"),
                      "relation_disposition": disposition,
                      "relation_domain": domain,
                  })
              finally:
                  driver.quit()

          print(json.dumps({
              "status": "PASS_DEPLOYED_EXACT_HEAD_FOUNDER_ROUTE_ACCEPTANCE",
              "preview": base,
              "expected_head": expected,
              "results": results,
          }, ensure_ascii=False, indent=2))
          PY
"""
write(".github/workflows/btc-evidence-navigation-runtime-pr.yml", workflow)

print({
    "status": "PASS_APPLY_PR114_PREVIEW_IDENTITY_AND_FOUNDER_ROUTES_V0_2",
    "retained_scope": 9,
    "additional_retained_acceptance_file": False,
})
