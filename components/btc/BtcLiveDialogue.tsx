import { useEffect, useMemo, useRef, useState } from "react";
import type { BtcContextRelation, BtcFollowUpClarificationReason } from "../../lib/btc-live-dialogue-follow-up";
import { BTC_FOLLOW_UP_CONTEXT_SCHEMA } from "../../lib/btc-live-dialogue-follow-up";
import {
  clearBtcDialogueSession,
  latestContextTurn,
  makeBtcDialogueTurnId,
  readBtcDialogueSession,
  upsertBtcDialogueTurn,
  type BtcDialogueTurn,
} from "../../lib/btc-live-dialogue-session";
import type { BtcMarketEnvelope, BtcMarketEnvelopeFailure } from "../../lib/btc-market-envelope";
import type { BtcFailureCode, BtcPublicSnapshot, FreshnessState } from "../../lib/btc-public-output-contract";
import { buildBtcQuestionSpecificAnswer } from "../../lib/btc-executive-question-language";
import {
  formatBtcFailureMessage,
  formatBtcObservationDate,
  formatBtcUtcTimestamp,
  type BtcPublicLocale,
} from "../../lib/btc-public-language-contract";
import { factLine, narrativeLine, sectionTitle } from "../../lib/btc-public-surface-format";
import { FieldAnchorGlyph } from "./BtcSurfaceGlyphs";

export type BtcLiveFailure = {
  code: BtcFailureCode;
  message: string;
  last_verified_at_utc: string | null;
};

export type BtcLiveEnvelopeFailure = {
  code: BtcMarketEnvelopeFailure["code"];
  message: string;
  last_verified_at_utc: string | null;
};

export type BtcLiveSourceContext = {
  state: FreshnessState;
  generated_at_utc: string | null;
  age_hours: number | null;
  proof_available: boolean;
};

export type BtcLiveClarification = {
  reason: BtcFollowUpClarificationReason;
  prompt: string;
};

type Props = {
  locale: BtcPublicLocale;
  initialQuestion: string;
  effectiveQuestion: string;
  initialDate: string;
  result: BtcPublicSnapshot | null;
  failure: BtcLiveFailure | null;
  envelope: BtcMarketEnvelope | null;
  envelopeFailure: BtcLiveEnvelopeFailure | null;
  clarification: BtcLiveClarification | null;
  sourceContext: BtcLiveSourceContext;
  deploymentSourceSha: string | null;
  contextRelation: BtcContextRelation | null;
  sourceBindingChanged: boolean;
};

function sourceState(locale: BtcPublicLocale, context: BtcLiveSourceContext): string {
  if (locale === "ru") {
    if (context.state === "FRESH") return "Проверенный snapshot";
    if (context.state === "STALE_LIMITED") return "Snapshot ограниченно актуален";
    return "Источник временно недоступен";
  }
  if (context.state === "FRESH") return "Verified snapshot";
  if (context.state === "STALE_LIMITED") return "Snapshot is stale-limited";
  return "Source temporarily unavailable";
}

function buildCurrentTurn(props: Props): BtcDialogueTurn | null {
  const {
    locale,
    initialQuestion,
    effectiveQuestion,
    initialDate,
    result,
    failure,
    envelope,
    envelopeFailure,
    clarification,
    sourceContext,
    contextRelation,
    sourceBindingChanged,
  } = props;
  if (!initialQuestion) return null;

  const answer = result && envelope
    ? buildBtcQuestionSpecificAnswer(
        locale,
        effectiveQuestion || initialQuestion,
        envelope,
        result.temporal_context.observation_date,
      )
    : null;

  let answerState: BtcDialogueTurn["answer_state"] = "BOUNDED";
  let headline: string | null = null;
  let directAnswer: string | null = null;
  let evidenceLines: string[] = [];
  let contradiction: string | null = null;
  let changeCondition: string | null = null;
  let sourceBoundary: string | null = null;
  let questionClass = answer?.question_class ?? null;
  let questionFacets = answer?.question_facets ?? [];

  if (clarification) {
    answerState = "CLARIFICATION";
    headline = locale === "ru" ? "Нужно уточнить предмет" : "Clarification required";
    directAnswer = clarification.prompt;
    questionClass = null;
    questionFacets = [];
  } else if (failure) {
    answerState = "FAILURE";
    headline = locale === "ru"
      ? "Вопрос или источник не прошёл проверку"
      : "The question or source did not pass validation";
    directAnswer = formatBtcFailureMessage(locale, failure.code, failure.message);
  } else if (answer && result && envelope) {
    answerState = answer.answer_state;
    headline = answer.headline;
    directAnswer = answer.direct_answer;
    evidenceLines = answer.evidence_lines.slice(0, 3);
    contradiction = answer.contradiction_or_limit;
    changeCondition = answer.what_would_change_the_read;
    sourceBoundary = answer.source_boundary;
  } else if (result) {
    answerState = "BOUNDED";
    headline = locale === "ru"
      ? "Рыночный контекст временно недоступен"
      : "Market context is temporarily unavailable";
    directAnswer = envelopeFailure
      ? formatBtcFailureMessage(locale, envelopeFailure.code, envelopeFailure.message)
      : (locale === "ru" ? "Доступен только ограниченный источник-привязанный ответ." : "Only a bounded source-linked answer is available.");
    evidenceLines = result.cosmographer_read.sections.slice(0, 2).map((section) =>
      `${sectionTitle(locale, section.section_id)}. ${factLine(locale, section.fact_payload)} ${narrativeLine(locale, section.read_template_id, section.fact_payload)}`,
    );
  }

  const observationDate = result?.temporal_context.observation_date ?? (initialDate || null);
  const createdAt = sourceContext.generated_at_utc
    ?? (observationDate ? `${observationDate}T00:00:00Z` : "1970-01-01T00:00:00Z");
  const turnId = makeBtcDialogueTurnId({
    userText: initialQuestion,
    effectiveQuestion: effectiveQuestion || initialQuestion,
    observationDate,
    snapshotTimestamp: sourceContext.generated_at_utc,
    answerState,
    headline,
  });

  return {
    turn_id: turnId,
    created_at_utc: createdAt,
    locale,
    user_text: initialQuestion,
    effective_question: effectiveQuestion || initialQuestion,
    observation_date: observationDate,
    question_class: questionClass,
    question_facets: questionFacets,
    answer_state: answerState,
    headline,
    direct_answer: directAnswer,
    evidence_lines: evidenceLines,
    contradiction_or_limit: contradiction,
    what_would_change_the_read: changeCondition,
    source_boundary: sourceBoundary,
    source_snapshot_generated_at_utc: sourceContext.generated_at_utc,
    proof_available: sourceContext.proof_available,
    context_relation: contextRelation,
    source_binding_changed: sourceBindingChanged,
  };
}

function stateLabel(locale: BtcPublicLocale, turn: BtcDialogueTurn): string {
  if (turn.answer_state === "CLARIFICATION") return locale === "ru" ? "Уточнение" : "Clarification";
  if (turn.answer_state === "FAILURE") return locale === "ru" ? "Ответ ограничен" : "Answer limited";
  if (turn.answer_state === "BOUNDED") return locale === "ru" ? "Ограниченный ответ" : "Bounded answer";
  return locale === "ru" ? "Прямой ответ" : "Direct answer";
}

export function BtcLiveDialogue(props: Props) {
  const { locale, initialDate, sourceContext, deploymentSourceSha } = props;
  const ru = locale === "ru";
  const otherLocale: BtcPublicLocale = ru ? "en" : "ru";
  const currentTurn = useMemo(() => buildCurrentTurn(props), [
    props.locale,
    props.initialQuestion,
    props.effectiveQuestion,
    props.initialDate,
    props.result,
    props.failure,
    props.envelope,
    props.envelopeFailure,
    props.clarification,
    props.sourceContext,
    props.contextRelation,
    props.sourceBindingChanged,
  ]);
  const [turns, setTurns] = useState<BtcDialogueTurn[]>(currentTurn ? [currentTurn] : []);
  const [compacted, setCompacted] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const newestAnswerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    let session = readBtcDialogueSession(locale, deploymentSourceSha);
    if (currentTurn) session = upsertBtcDialogueTurn(session, currentTurn);
    setTurns(session.turns);
    setCompacted(session.compacted);
    setHydrated(true);
  }, [currentTurn, deploymentSourceSha, locale]);

  useEffect(() => {
    if (!hydrated || !newestAnswerRef.current) return;
    newestAnswerRef.current.focus({ preventScroll: true });
    newestAnswerRef.current.scrollIntoView({ block: "nearest" });
  }, [hydrated, turns.length]);

  const contextTurn = latestContextTurn(turns);
  const hasConversation = turns.length > 0;
  const observationDate = contextTurn?.observation_date ?? initialDate;
  const contextFields = contextTurn ? {
    fc: BTC_FOLLOW_UP_CONTEXT_SCHEMA,
    pc: contextTurn.question_class ?? "",
    pf: contextTurn.question_facets.join(","),
    ps: contextTurn.answer_state,
    pd: contextTurn.observation_date ?? "",
    pt: contextTurn.source_snapshot_generated_at_utc ?? "",
  } : null;

  const startNewConversation = () => {
    const confirmed = window.confirm(
      ru
        ? "Начать новый разговор и очистить локальную историю этой вкладки?"
        : "Start a new conversation and clear this tab's local history?",
    );
    if (!confirmed) return;
    clearBtcDialogueSession();
    window.location.assign(`/crypto-astro/btc/live?lang=${locale}`);
  };

  return <main className="liveDialoguePage" lang={locale} data-live-dialogue="btc-free-question" data-session-local="true">
    <header className="liveDialogueTopbar">
      <a className="liveBackLink" href={`/crypto-astro/btc?lang=${locale}`}>← BTC Field Read</a>
      <div className="liveIdentity"><FieldAnchorGlyph className="liveIdentityGlyph"/><span>Market Cosmographer</span></div>
      <a className="liveLocaleLink" href={`/crypto-astro/btc/live?lang=${otherLocale}`}>{otherLocale.toUpperCase()}</a>
    </header>

    <section className="liveDialogueShell" aria-labelledby="live-dialogue-title">
      <header className="liveDialogueIntro">
        <p className="eyebrow">{ru ? "Бесплатный BTC-диалог" : "Free BTC dialogue"}</p>
        <h1 id="live-dialogue-title">{ru ? "BTC Космограф" : "BTC Cosmographer"}</h1>
        <p>{ru
          ? "Продолжайте разговор в этой вкладке. Каждый новый ответ заново привязан к текущему проверенному источнику."
          : "Continue the conversation in this tab. Every new answer is freshly bound to the current verified source."}</p>
        <div className="liveTrustLine">
          <span>{sourceState(locale, sourceContext)}</span>
          {sourceContext.generated_at_utc && <span>{formatBtcUtcTimestamp(locale, sourceContext.generated_at_utc)}</span>}
          <span>{ru ? "Без прогноза" : "No forecast"}</span>
        </div>
        <div className="liveSessionLine" data-session-memory-note="tab-only">
          <span>{ru ? "Память только в этой вкладке" : "Memory only in this tab"}</span>
          <span data-session-turn-count>{ru ? `Ходов: ${turns.length}` : `Turns: ${turns.length}`}</span>
          {hasConversation && <button type="button" className="liveNewConversation" onClick={startNewConversation}>
            {ru ? "Новый разговор" : "New conversation"}
          </button>}
        </div>
        {compacted && <p className="liveCompactionNotice" role="status">
          {ru ? "Старая локальная история была компактно сокращена; последние ходы сохранены." : "Older local history was compacted; the latest turns remain available."}
        </p>}
      </header>

      {hasConversation && <section className="liveThread" role="log" aria-live="polite" aria-label={ru ? "Диалог BTC" : "BTC dialogue"}>
        {turns.map((turn, index) => {
          const newest = index === turns.length - 1;
          return <div className="dialogueExchange" data-dialogue-turn-id={turn.turn_id} key={turn.turn_id}>
            <article className="dialogueTurn userTurn">
              <div className="turnRole">{turn.locale === "ru" ? "Вы" : "You"}</div>
              <div className="turnBody"><p>{turn.user_text}</p></div>
            </article>

            <article
              ref={newest ? newestAnswerRef : undefined}
              tabIndex={-1}
              className={`dialogueTurn cosmographerTurn dialogueState${turn.answer_state}`}
              data-answer-state={turn.answer_state}
              data-question-class={turn.question_class ?? ""}
              data-question-facets={turn.question_facets.join(",")}
              data-context-relation={turn.context_relation ?? ""}
              data-source-binding-changed={turn.source_binding_changed ? "true" : "false"}
            >
              <div className="turnRole"><FieldAnchorGlyph className="turnGlyph"/><span>Cosmographer</span></div>
              <div className="turnBody">
                <header className="answerHeader">
                  <p className="eyebrow">{stateLabel(turn.locale, turn)}</p>
                  {turn.headline && <h2>{turn.headline}</h2>}
                </header>
                {turn.direct_answer && <p className="answerLead" data-answer-direct="true">{turn.direct_answer}</p>}
                {turn.evidence_lines.length > 0 && <div className="answerNarrative">
                  <section data-answer-section="evidence">
                    <p><strong>{turn.locale === "ru" ? "Доказательность вопроса." : "Question-specific evidence."}</strong></p>
                    <ul>{turn.evidence_lines.map((line, evidenceIndex) => <li key={`${turn.turn_id}-${evidenceIndex}`}>{line}</li>)}</ul>
                  </section>
                  {turn.contradiction_or_limit && <p data-answer-section="limit"><strong>{turn.locale === "ru" ? "Противоречие или граница." : "Contradiction or limit."}</strong> {turn.contradiction_or_limit}</p>}
                  {turn.what_would_change_the_read && <p data-answer-section="change"><strong>{turn.locale === "ru" ? "Что изменит чтение." : "What would change the read."}</strong> {turn.what_would_change_the_read}</p>}
                </div>}
                {turn.source_binding_changed && <p className="sourceChangedNote" data-source-changed="true">
                  {turn.locale === "ru"
                    ? "Источник обновился между ходами; этот ответ построен по новому принятому snapshot."
                    : "The source changed between turns; this answer uses the newly accepted snapshot."}
                </p>}
                {turn.source_snapshot_generated_at_utc && <footer className="answerSource" data-answer-source-boundary={turn.source_boundary ? "true" : "bounded"}>
                  {formatBtcObservationDate(turn.locale, turn.observation_date ?? "")}
                  {" · "}
                  {formatBtcUtcTimestamp(turn.locale, turn.source_snapshot_generated_at_utc)}
                  {" · "}
                  {turn.proof_available ? (turn.locale === "ru" ? "Proof доступен" : "Proof available") : (turn.locale === "ru" ? "Proof недоступен" : "Proof unavailable")}
                  {turn.source_boundary && <span>{turn.source_boundary}</span>}
                </footer>}
              </div>
            </article>
          </div>;
        })}
      </section>}

      <form className={hasConversation ? "liveComposer liveComposerAfterAnswer" : "liveComposer liveComposerPrimary"} method="get" action="/crypto-astro/btc/live">
        <input type="hidden" name="lang" value={locale}/>
        {contextFields && <>
          <input type="hidden" name="fc" value={contextFields.fc}/>
          <input type="hidden" name="pc" value={contextFields.pc}/>
          <input type="hidden" name="pf" value={contextFields.pf}/>
          <input type="hidden" name="ps" value={contextFields.ps}/>
          <input type="hidden" name="pd" value={contextFields.pd}/>
          <input type="hidden" name="pt" value={contextFields.pt}/>
        </>}
        <label>
          <span>{hasConversation ? (ru ? "Продолжить разговор" : "Continue the conversation") : (ru ? "Ваш вопрос о BTC" : "Your BTC question")}</span>
          <textarea name="q" rows={3} minLength={2} maxLength={280} required placeholder={hasConversation
            ? (ru ? "Почему? Что важнее? Ликвидность это подтверждает?" : "Why? What matters most? Does liquidity confirm it?")
            : (ru ? "Что вы хотите понять о текущем поле BTC?" : "What do you want to understand about the current BTC field?")}/>
        </label>
        <div className="liveComposerControls">
          <label>
            <span>{ru ? "Дата наблюдения · необязательно" : "Observation date · optional"}</span>
            <input name="d" type="date" defaultValue={observationDate ?? ""}/>
          </label>
          <button type="submit">{hasConversation ? (ru ? "Продолжить" : "Continue") : (ru ? "Получить ответ" : "Get answer")}</button>
        </div>
      </form>
      <p className="liveBoundary">
        {ru
          ? "Без регистрации · Без оплаты · Без лимита вопросов в интерфейсе · Память только этой вкладки · Не прогноз и не торговый сигнал"
          : "No account · No payment · No visible question quota · Memory only in this tab · No forecast or trading signal"}
      </p>
    </section>
  </main>;
}
