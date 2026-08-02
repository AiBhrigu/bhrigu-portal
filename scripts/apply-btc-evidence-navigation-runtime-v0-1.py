#!/usr/bin/env python3
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def write(path: str, value: str) -> None:
    (ROOT / path).write_text(value, encoding="utf-8")


def replace_once(path: str, old: str, new: str) -> None:
    value = read(path)
    count = value.count(old)
    if count != 1:
        raise SystemExit(f"{path}: expected one exact match, found {count}")
    write(path, value.replace(old, new, 1))


def regex_once(path: str, pattern: str, replacement: str) -> None:
    value = read(path)
    updated, count = re.subn(pattern, replacement, value, count=1, flags=re.S | re.M)
    if count != 1:
        raise SystemExit(f"{path}: expected one regex match, found {count}")
    write(path, updated)


# ---------------------------------------------------------------------------
# Market-first Astro × BTC answer geometry.
# ---------------------------------------------------------------------------
answer_bridge = '''    case "astro_btc_bridge": {
      const astro = buildBtcAstroAnswer(locale, route);
      if (inputs.snapshot && inputs.envelope) {
        const market = marketAnswer(locale, route, inputs.snapshot, inputs.envelope);
        const marketLines = market.sections
          .flatMap((section) => section.bullets ?? (section.paragraph ? [section.paragraph] : []))
          .slice(0, 4);
        const astroLines = astro.sections
          .flatMap((section) => section.bullets ?? (section.paragraph ? [section.paragraph] : []))
          .slice(0, 4);
        const bridgeState = market.answer_state === "SPLIT"
          ? "SPLIT"
          : route.intents.includes("confirmation") && market.answer_state === "CONFIRMED"
            ? "CONFIRMED"
            : "LIMITED";
        const relationText = locale === "ru"
          ? "Сопоставление проверяет временную и структурную связь двух независимых доказательных слоёв."
          : "The comparison tests a temporal and structural relation between two independent evidence lanes.";
        const confirmationText = bridgeState === "SPLIT"
          ? (locale === "ru" ? "Рыночный слой расходится с заявленной связью или не подтверждает её." : "The market layer diverges from or does not confirm the proposed relation.")
          : bridgeState === "CONFIRMED"
            ? (locale === "ru" ? "Заранее объявленный рыночный критерий подтверждения выполнен." : "The predeclared market confirmation criterion is met.")
            : (locale === "ru" ? "Зафиксировано только временное совпадение; направленное подтверждение не установлено." : "Only temporal concurrence is established; directional confirmation is not established.");
        return {
          answer_state: bridgeState,
          answer_mode: "ASTRO_BTC_BRIDGE",
          headline: locale === "ru"
            ? "Состояние BTC и астрономическое окно сопоставлены без причинного утверждения"
            : "BTC-side state and the astronomical window are compared without a causal claim",
          direct_answer: locale === "ru"
            ? `Сначала состояние BTC: ${market.direct_answer} Затем астрономическое окно: ${astro.direct_answer}`
            : `BTC-side state first: ${market.direct_answer} Then the astronomical window: ${astro.direct_answer}`,
          sections: [
            {
              id: "btc_side_state",
              label: locale === "ru" ? "1 · Состояние стороны BTC" : "1 · BTC-side state",
              bullets: marketLines,
            },
            {
              id: "astro_window",
              label: locale === "ru" ? "2 · Астрономическое окно" : "2 · Astronomical window",
              bullets: astroLines,
            },
            {
              id: "relation",
              label: locale === "ru" ? "3 · Проверяемая связь" : "3 · Relation under test",
              paragraph: relationText,
            },
            {
              id: "confirmation_or_divergence",
              label: locale === "ru" ? "4 · Подтверждение или расхождение" : "4 · Confirmation or divergence",
              paragraph: confirmationText,
            },
            {
              id: "conditions",
              label: locale === "ru" ? "5 · Условия усиления и ослабления" : "5 · Strengthening and weakening conditions",
              paragraph: market.sections.find((section) => section.id === "market_watch")?.paragraph ??
                (locale === "ru" ? "Условия должны быть наблюдаемыми и привязанными к рыночным данным." : "Conditions must be observable and bound to market evidence."),
            },
            {
              id: "dual_proof",
              label: locale === "ru" ? "6 · Двойное доказательство" : "6 · Dual proof",
              bullets: [astro.proof_label, market.proof_label],
            },
            {
              id: "non_causal_boundary",
              label: locale === "ru" ? "7 · Непричинная граница" : "7 · Non-causal boundary",
              paragraph: locale === "ru"
                ? "Совпадение или подтверждение не доказывает, что астрономическая конфигурация вызвала движение BTC."
                : "Concurrence or confirmation does not prove that an astronomical configuration caused BTC movement.",
            },
            {
              id: "non_trading_boundary",
              label: locale === "ru" ? "8 · Нет торговой инструкции" : "8 · No trading instruction",
              paragraph: locale === "ru"
                ? "Сопоставление не является рекомендацией купить, продать, использовать плечо или выбрать размер позиции."
                : "The comparison is not advice to buy, sell, use leverage, or choose a position size.",
            },
          ],
          source_boundary: `${market.source_boundary} ${astro.source_boundary}`,
          proof_label: locale === "ru"
            ? "Рыночные и астрономические доказательства проверены отдельно"
            : "Market and astronomical evidence were checked independently",
        };
      }
      return buildAstroBtcBridgeBoundary(locale, astro);
    }
    case "btc_market":'''
regex_once(
    "lib/btc-cosmographer-answer.ts",
    r'    case "astro_btc_bridge": \{.*?^    case "btc_market":',
    answer_bridge,
)

# ---------------------------------------------------------------------------
# Server-side relation precedence and runtime decision binding.
# ---------------------------------------------------------------------------
replace_once(
    "pages/crypto-astro/btc/live.tsx",
    'import { buildBtcCosmographerAnswer } from "../../../lib/btc-cosmographer-answer";\n',
    'import { buildBtcCosmographerAnswer } from "../../../lib/btc-cosmographer-answer";\n'
    'import {\n'
    '  applyBtcRelationIntentPrecedence,\n'
    '  buildBtcEvidenceNavigationRuntimeDecision,\n'
    '  type BtcEvidenceNavigationRuntimeDecision,\n'
    '} from "../../../lib/btc-cosmographer-evidence-navigation-runtime";\n',
)
replace_once(
    "pages/crypto-astro/btc/live.tsx",
    '  answer: BtcCosmographerAnswerProjection | null;\n  sourceContext: BtcCosmographerSourceContext;\n',
    '  answer: BtcCosmographerAnswerProjection | null;\n  runtimeDecision: BtcEvidenceNavigationRuntimeDecision | null;\n  sourceContext: BtcCosmographerSourceContext;\n',
)
replace_once(
    "pages/crypto-astro/btc/live.tsx",
    '    route: null,\n    answer: null,\n    sourceContext,\n',
    '    route: null,\n    answer: null,\n    runtimeDecision: null,\n    sourceContext,\n',
)
replace_once(
    "pages/crypto-astro/btc/live.tsx",
    '''  const route = routeBtcCosmographerLocalRc(
    resolvedLocale.locale,
    initialQuestion,
    packet,
    initialDate || undefined,
    retainedAstroMemory,
  );
''',
    '''  const initialRoute = routeBtcCosmographerLocalRc(
    resolvedLocale.locale,
    initialQuestion,
    packet,
    initialDate || undefined,
    retainedAstroMemory,
  );
  const relationResolution = applyBtcRelationIntentPrecedence(
    initialRoute,
    initialQuestion,
    packet,
  );
  const route = relationResolution.route;
''',
)
replace_once(
    "pages/crypto-astro/btc/live.tsx",
    '''  const sourceBindingChanged = Boolean(
''',
    '''  const runtimeDecision = buildBtcEvidenceNavigationRuntimeDecision(
    resolvedLocale.locale,
    route,
    answer,
    sourceContext,
    relationResolution.relation_resolution,
    relationResolution.btc_side_state_type,
  );
  const sourceBindingChanged = Boolean(
''',
)
replace_once(
    "pages/crypto-astro/btc/live.tsx",
    '''      route,
      answer,
      sourceBindingChanged,
''',
    '''      route,
      answer,
      runtimeDecision,
      sourceBindingChanged,
''',
)

# ---------------------------------------------------------------------------
# Session persistence for geometry, dispositions, authority, and anti-loop.
# ---------------------------------------------------------------------------
replace_once(
    "lib/btc-live-dialogue-session.ts",
    '} from "./btc-cosmographer-route-graph";\nimport type {\n',
    '} from "./btc-cosmographer-route-graph";\n'
    'import type {\n'
    '  BtcBridgeResult,\n'
    '  BtcClarificationTarget,\n'
    '  BtcEvidenceLevel,\n'
    '  BtcNextQuestionType,\n'
    '  BtcRouteDisposition,\n'
    '  BtcSideStateType,\n'
    '  BtcStopReason,\n'
    '} from "./btc-cosmographer-evidence-navigation-runtime";\n'
    'import type {\n',
)
replace_once(
    "lib/btc-live-dialogue-session.ts",
    '''  sections?: BtcCosmographerSection[];
  proof_label?: string;
};
''',
    '''  sections?: BtcCosmographerSection[];
  proof_label?: string;
  route_disposition?: BtcRouteDisposition;
  primary_authority?: string;
  evidence_levels?: BtcEvidenceLevel[];
  btc_side_state_type?: BtcSideStateType | null;
  bridge_result?: BtcBridgeResult | null;
  show_next_question?: boolean;
  next_precise_question_type?: BtcNextQuestionType | null;
  next_precise_question_text?: string | null;
  next_precise_question_fingerprint?: string | null;
  show_clarification?: boolean;
  clarification_target?: BtcClarificationTarget | null;
  clarification_text?: string | null;
  clarification_fingerprint?: string | null;
  anti_loop_blocked?: boolean;
  valid_route_stop?: boolean;
  stop_reason?: BtcStopReason | null;
  context_safe_composer?: boolean;
};
''',
)
replace_once(
    "lib/btc-live-dialogue-session.ts",
    '''  if (value.proof_label !== undefined && !isText(value.proof_label, 200)) return false;
  return true;
''',
    '''  if (value.proof_label !== undefined && !isText(value.proof_label, 200)) return false;
  if (value.route_disposition !== undefined && !["CONTINUE", "CLARIFY", "STOP"].includes(String(value.route_disposition))) return false;
  if (value.primary_authority !== undefined && !isText(value.primary_authority, 160)) return false;
  if (value.evidence_levels !== undefined && !stringList(value.evidence_levels, 6, 4)) return false;
  if (value.btc_side_state_type !== undefined && value.btc_side_state_type !== null && !["MARKET", "SNAPSHOT", "PROTOCOL"].includes(String(value.btc_side_state_type))) return false;
  if (value.bridge_result !== undefined && value.bridge_result !== null && !["MARKET_CONFIRMED", "TEMPORAL_CONCURRENCE_ONLY", "DIVERGENCE", "INSUFFICIENT_DUAL_EVIDENCE"].includes(String(value.bridge_result))) return false;
  if (value.show_next_question !== undefined && typeof value.show_next_question !== "boolean") return false;
  if (value.next_precise_question_type !== undefined && value.next_precise_question_type !== null && !["FACT", "CONTRADICTION", "TIME", "EXPLICIT_BRIDGE", "PROOF"].includes(String(value.next_precise_question_type))) return false;
  if (value.next_precise_question_text !== undefined && !nullableText(value.next_precise_question_text, 500)) return false;
  if (value.next_precise_question_fingerprint !== undefined && !nullableText(value.next_precise_question_fingerprint, 800)) return false;
  if (value.show_clarification !== undefined && typeof value.show_clarification !== "boolean") return false;
  if (value.clarification_target !== undefined && value.clarification_target !== null && !["SUBJECT", "PERIOD", "RELATION_OBJECT", "ASSET"].includes(String(value.clarification_target))) return false;
  if (value.clarification_text !== undefined && !nullableText(value.clarification_text, 500)) return false;
  if (value.clarification_fingerprint !== undefined && !nullableText(value.clarification_fingerprint, 800)) return false;
  if (value.anti_loop_blocked !== undefined && typeof value.anti_loop_blocked !== "boolean") return false;
  if (value.valid_route_stop !== undefined && typeof value.valid_route_stop !== "boolean") return false;
  if (value.stop_reason !== undefined && value.stop_reason !== null && !["ANSWER_COMPLETE", "MISSING_EVIDENCE", "OUT_OF_SCOPE", "REPEATED_ROUTE", "MODE_TRANSITION_NOT_EXPLICIT"].includes(String(value.stop_reason))) return false;
  if (value.context_safe_composer !== undefined && typeof value.context_safe_composer !== "boolean") return false;
  return true;
''',
)
replace_once(
    "lib/btc-live-dialogue-session.ts",
    '''  for (let index = turns.length - 1; index >= 0; index -= 1) {
    const turn = turns[index];
    if (!(["FAILURE", "CLARIFICATION"] as string[]).includes(turn.answer_state)) return turn;
  }
''',
    '''  for (let index = turns.length - 1; index >= 0; index -= 1) {
    const turn = turns[index];
    const dispositionAllowsContext = turn.route_disposition === undefined || turn.route_disposition === "CONTINUE";
    if (
      dispositionAllowsContext &&
      turn.context_safe_composer !== false &&
      !(["FAILURE", "CLARIFICATION"] as string[]).includes(turn.answer_state)
    ) return turn;
  }
''',
)

# ---------------------------------------------------------------------------
# Dialogue projection, anti-loop, context-safe composer.
# ---------------------------------------------------------------------------
replace_once(
    "components/btc/BtcCosmographerDialogue.tsx",
    '} from "../../lib/btc-cosmographer-route-graph";\nimport type { BtcCosmographerAnswerProjection }',
    '} from "../../lib/btc-cosmographer-route-graph";\n'
    'import {\n'
    '  applyBtcRuntimeAntiLoop,\n'
    '  type BtcEvidenceNavigationRuntimeDecision,\n'
    '} from "../../lib/btc-cosmographer-evidence-navigation-runtime";\n'
    'import type { BtcCosmographerAnswerProjection }',
)
replace_once(
    "components/btc/BtcCosmographerDialogue.tsx",
    '  answer: BtcCosmographerAnswerProjection | null;\n  sourceContext: BtcCosmographerSourceContext;\n',
    '  answer: BtcCosmographerAnswerProjection | null;\n  runtimeDecision: BtcEvidenceNavigationRuntimeDecision | null;\n  sourceContext: BtcCosmographerSourceContext;\n',
)
regex_once(
    "components/btc/BtcCosmographerDialogue.tsx",
    r'function nextQuestion\(locale: BtcPublicLocale, turn: BtcDialogueTurn\): string \{.*?^\}\n\nfunction makeTurn',
    '''function applyRuntimeDecisionToTurn(
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

function makeTurn''',
)
replace_once(
    "components/btc/BtcCosmographerDialogue.tsx",
    '''  return {
    ...turnWithoutId,
    turn_id: makeBtcDialogueTurnId({
      userText: props.initialQuestion,
      route: props.route,
      answer: props.answer,
      snapshotTimestamp: timestamp,
    }),
  };
''',
    '''  const turn: BtcDialogueTurn = {
    ...turnWithoutId,
    turn_id: makeBtcDialogueTurnId({
      userText: props.initialQuestion,
      route: props.route,
      answer: props.answer,
      snapshotTimestamp: timestamp,
    }),
  };
  return props.runtimeDecision
    ? applyRuntimeDecisionToTurn(turn, props.runtimeDecision)
    : turn;
''',
)
replace_once(
    "components/btc/BtcCosmographerDialogue.tsx",
    '''      data-context-relation={turn.context_relation ?? "GENUINELY_AMBIGUOUS"}
      data-semantic-context-relation={turn.context_relation ?? "GENUINELY_AMBIGUOUS"}
''',
    '''      data-context-relation={turn.context_relation ?? "GENUINELY_AMBIGUOUS"}
      data-semantic-context-relation={turn.context_relation ?? "GENUINELY_AMBIGUOUS"}
      data-route-disposition={turn.route_disposition ?? "CONTINUE"}
      data-primary-authority={turn.primary_authority ?? "UNBOUND"}
      data-btc-side-state-type={turn.btc_side_state_type ?? "NOT_APPLICABLE"}
      data-bridge-result={turn.bridge_result ?? "NOT_APPLICABLE"}
      data-show-next-question={turn.show_next_question ? "true" : "false"}
      data-show-clarification={turn.show_clarification ? "true" : "false"}
''',
)
replace_once(
    "components/btc/BtcCosmographerDialogue.tsx",
    '''        <aside className="answerNextStep">
          <span>{turn.locale === "ru" ? "Следующий точный вопрос" : "Next precise question"}</span>
          <strong>{nextQuestion(turn.locale, turn)}</strong>
        </aside>
''',
    '''        {turn.show_clarification && turn.clarification_text && <aside className="answerClarification" data-route-surface="clarification">
          <span>{turn.locale === "ru" ? "Уточнение предмета" : "Clarification"}</span>
          <strong>{turn.clarification_text}</strong>
        </aside>}
        {turn.show_next_question && turn.next_precise_question_text && <aside className="answerNextStep" data-route-surface="next-precise-question">
          <span>{turn.locale === "ru" ? "Следующий точный вопрос" : "Next precise question"}</span>
          <strong>{turn.next_precise_question_text}</strong>
        </aside>}
        {turn.route_disposition === "STOP" && <aside className="answerRouteStop" data-route-surface="valid-stop">
          <span>{turn.locale === "ru" ? "Маршрут остановлен" : "Route stopped"}</span>
          <strong>{turn.stop_reason ?? (turn.locale === "ru" ? "Ответ завершён" : "Answer complete")}</strong>
        </aside>}
''',
)
replace_once(
    "components/btc/BtcCosmographerDialogue.tsx",
    '''            <span>{publicDomainLabel(turn.locale, domain)}</span>
            <dl className="answerEvidenceMeta" data-evidence-metadata="distinct-fields">
''',
    '''            <span>{publicDomainLabel(turn.locale, domain)}</span>
            {turn.primary_authority && <span className="answerAuthority" data-primary-authority-value={turn.primary_authority}>
              {turn.locale === "ru" ? "Primary authority" : "Primary authority"} · {turn.primary_authority}
            </span>}
            {turn.evidence_levels && <span data-evidence-levels={turn.evidence_levels.join(",")}>
              Evidence · {turn.evidence_levels.join(" → ")}
            </span>}
            {turn.bridge_result && <span data-canonical-bridge-result={turn.bridge_result}>
              Bridge result · {turn.bridge_result}
            </span>}
            <dl className="answerEvidenceMeta" data-evidence-metadata="distinct-fields">
''',
)
replace_once(
    "components/btc/BtcCosmographerDialogue.tsx",
    '''    props.answer,
    props.sourceContext,
''',
    '''    props.answer,
    props.runtimeDecision,
    props.sourceContext,
''',
)
replace_once(
    "components/btc/BtcCosmographerDialogue.tsx",
    '''  useEffect(() => {
    let session = readBtcDialogueSession(locale, deploymentSourceSha);
    if (currentTurn) session = upsertBtcDialogueTurn(session, currentTurn);
    setTurns(session.turns);
''',
    '''  useEffect(() => {
    let session = readBtcDialogueSession(locale, deploymentSourceSha);
    if (currentTurn) {
      const priorNextFingerprints = session.turns
        .map((turn) => turn.next_precise_question_fingerprint)
        .filter((value): value is string => Boolean(value));
      const priorClarificationFingerprints = session.turns
        .map((turn) => turn.clarification_fingerprint)
        .filter((value): value is string => Boolean(value));
      const turn = props.runtimeDecision
        ? applyRuntimeDecisionToTurn(
            currentTurn,
            applyBtcRuntimeAntiLoop(
              props.runtimeDecision,
              priorNextFingerprints,
              priorClarificationFingerprints,
            ),
          )
        : currentTurn;
      session = upsertBtcDialogueTurn(session, turn);
    }
    setTurns(session.turns);
''',
)
replace_once(
    "components/btc/BtcCosmographerDialogue.tsx",
    '''  const contextTurn = latestContextTurn(turns);
  const retainedAstroTurn = [...turns].reverse().find((turn) =>
''',
    '''  const latestTurn = turns.at(-1) ?? null;
  const contextSafe = !latestTurn || (
    latestTurn.route_disposition === "CONTINUE" &&
    latestTurn.context_safe_composer !== false
  );
  const clarificationPrompt = latestTurn?.route_disposition === "CLARIFY"
    ? latestTurn.clarification_text ?? (ru ? "Уточните предмет вопроса." : "Clarify the question subject.")
    : null;
  const contextTurn = contextSafe ? latestContextTurn(turns) : null;
  const retainedAstroTurn = contextSafe ? [...turns].reverse().find((turn) =>
''',
)
replace_once(
    "components/btc/BtcCosmographerDialogue.tsx",
    '''    Boolean(turn.time_start && turn.time_end),
  );
''',
    '''    Boolean(turn.time_start && turn.time_end),
  ) : undefined;
''',
)
replace_once(
    "components/btc/BtcCosmographerDialogue.tsx",
    '''          <span>{hasConversation
            ? (ru ? "Продолжить или задать новый предмет" : "Continue or introduce a new subject")
            : (ru ? "Ваш вопрос о поле BTC" : "Your question about the BTC field")}</span>
''',
    '''          <span>{clarificationPrompt ?? (hasConversation
            ? (ru ? "Продолжить или задать новый предмет" : "Continue or introduce a new subject")
            : (ru ? "Ваш вопрос о поле BTC" : "Your question about the BTC field"))}</span>
''',
)
replace_once(
    "components/btc/BtcCosmographerDialogue.tsx",
    '''            placeholder={hasConversation
              ? (ru ? "Что изменит это чтение? Как это совпадает со структурой BTC? Какие дни наиболее напряжённые?" : "What would change this read? How does it coincide with BTC structure? Which days are most intense?")
              : (ru ? "Что происходит с BTC сегодня? Какие аспекты планет наиболее напряжённые в 2026?" : "What is happening with BTC today? Which planetary aspects are most intense in 2026?")}
''',
    '''            placeholder={clarificationPrompt ?? (hasConversation
              ? (ru ? "Что изменит это чтение? Как это совпадает со структурой BTC? Какие дни наиболее напряжённые?" : "What would change this read? How does it coincide with BTC structure? Which days are most intense?")
              : (ru ? "Что происходит с BTC сегодня? Какие аспекты планет наиболее напряжённые в 2026?" : "What is happening with BTC today? Which planetary aspects are most intense in 2026?"))}
''',
)

# ---------------------------------------------------------------------------
# Quiet semantic styling for navigation surfaces and bridge geometry.
# ---------------------------------------------------------------------------
style_path = "lib/btc-live-dialogue-style.ts"
style = read(style_path)
style_marker = ".answerClarification{"
if style_marker in style:
    raise SystemExit(f"{style_path}: runtime styles already present")
style_addition = '''
.answerClarification,.answerRouteStop{display:grid;gap:5px;margin-top:18px;padding:14px 16px;border-radius:14px}.answerClarification{border:1px solid rgba(210,164,95,.34);background:rgba(210,164,95,.065)}.answerRouteStop{border:1px solid rgba(135,151,171,.24);background:rgba(135,151,171,.045)}
.answerClarification span,.answerRouteStop span{color:var(--m);font-size:9px;letter-spacing:.09em;text-transform:uppercase}.answerClarification strong,.answerRouteStop strong{color:var(--t);font-size:14px;line-height:1.45;font-weight:600;overflow-wrap:anywhere}.answerAuthority{color:var(--t2);font-family:"SFMono-Regular",Consolas,"Liberation Mono",monospace;font-size:10px}
.answerSection-btc_side_state{order:-8;border-color:rgba(210,164,95,.4);background:rgba(210,164,95,.055)}.answerSection-astro_window{order:-7}.answerSection-relation{order:-6}.answerSection-confirmation_or_divergence{order:-5}.answerSection-conditions{order:-4}.answerSection-dual_proof{order:-3}.answerSection-non_causal_boundary{order:-2}.answerSection-non_trading_boundary{order:-1}
'''
needle = "\n`;"
if needle not in style:
    raise SystemExit(f"{style_path}: closing CSS marker not found")
style = style.replace(needle, style_addition + needle, 1)
write(style_path, style)

# ---------------------------------------------------------------------------
# Exact one-product PR scope.
# ---------------------------------------------------------------------------
replace_once(
    ".github/scripts/verify-btc-public-acceptance-scope.py",
    '''BTC_COSMOGRAPHER_FOUNDER_BLOCKERS_REPAIR_SCOPE = {
    ".github/scripts/verify-btc-public-acceptance-scope.py",
    "components/btc/BtcCosmographerDialogue.tsx",
    "lib/btc-cosmographer-route-graph.ts",
    "lib/btc-live-dialogue-style.ts",
    "lib/btc-public-astro-evidence.ts",
    "scripts/run-btc-cosmographer-semantic-route-fixture.mjs",
    "scripts/verify-btc-public-live-visual-information-acceptance.py",
}
''',
    '''BTC_COSMOGRAPHER_FOUNDER_BLOCKERS_REPAIR_SCOPE = {
    ".github/scripts/verify-btc-public-acceptance-scope.py",
    "components/btc/BtcCosmographerDialogue.tsx",
    "lib/btc-cosmographer-route-graph.ts",
    "lib/btc-live-dialogue-style.ts",
    "lib/btc-public-astro-evidence.ts",
    "scripts/run-btc-cosmographer-semantic-route-fixture.mjs",
    "scripts/verify-btc-public-live-visual-information-acceptance.py",
}

BTC_EVIDENCE_NAVIGATION_RUNTIME_SCOPE = {
    ".github/scripts/verify-btc-public-acceptance-scope.py",
    ".github/workflows/btc-evidence-navigation-runtime-pr.yml",
    "components/btc/BtcCosmographerDialogue.tsx",
    "lib/btc-cosmographer-answer.ts",
    "lib/btc-cosmographer-evidence-navigation-runtime.ts",
    "lib/btc-live-dialogue-session.ts",
    "lib/btc-live-dialogue-style.ts",
    "pages/crypto-astro/btc/live.tsx",
    "scripts/run-btc-evidence-navigation-runtime-fixture.mjs",
}
''',
)
replace_once(
    ".github/scripts/verify-btc-public-acceptance-scope.py",
    '''    "PASS_BTC_COSMOGRAPHER_FOUNDER_BLOCKERS_EXACT_7_FILE_SCOPE": BTC_COSMOGRAPHER_FOUNDER_BLOCKERS_REPAIR_SCOPE,
''',
    '''    "PASS_BTC_COSMOGRAPHER_FOUNDER_BLOCKERS_EXACT_7_FILE_SCOPE": BTC_COSMOGRAPHER_FOUNDER_BLOCKERS_REPAIR_SCOPE,
    "PASS_BTC_EVIDENCE_NAVIGATION_RUNTIME_EXACT_9_FILE_SCOPE": BTC_EVIDENCE_NAVIGATION_RUNTIME_SCOPE,
''',
)

print({"status": "PASS_APPLY", "scope": "BTC_EVIDENCE_NAVIGATION_RUNTIME_EXACT_9_FILE_SCOPE"})
