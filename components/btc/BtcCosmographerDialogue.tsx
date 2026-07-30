import { useEffect, useMemo, useRef, useState } from "react";
import {
  BTC_COSMOGRAPHER_CONTEXT_SCHEMA,
  type BtcCosmographerRoute,
} from "../../lib/btc-cosmographer-route-graph";
import type { BtcCosmographerAnswerProjection } from "../../lib/btc-protocol-evidence";
import {
  clearBtcDialogueSession,
  latestContextTurn,
  makeBtcDialogueTurnId,
  readBtcDialogueSession,
  upsertBtcDialogueTurn,
  type BtcDialogueTurn,
} from "../../lib/btc-live-dialogue-session";
import type { FreshnessState } from "../../lib/btc-public-output-contract";
import {
  formatBtcUtcTimestamp,
  type BtcPublicLocale,
} from "../../lib/btc-public-language-contract";
import { FieldAnchorGlyph } from "./BtcSurfaceGlyphs";

export type BtcCosmographerSourceContext = {
  state: FreshnessState;
  generated_at_utc: string | null;
  age_hours: number | null;
  proof_available: boolean;
};

type Props = {
  locale: BtcPublicLocale;
  initialQuestion: string;
  initialDate: string;
  route: BtcCosmographerRoute | null;
  answer: BtcCosmographerAnswerProjection | null;
  sourceContext: BtcCosmographerSourceContext;
  deploymentSourceSha: string | null;
  sourceBindingChanged: boolean;
  inputError: string | null;
};

const EN_MONTHS = [
  "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
  "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
];

function observationDateLabel(locale: BtcPublicLocale, value: string | null): string | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (locale === "ru") return `${String(day).padStart(2, "0")}.${String(month).padStart(2, "0")}.${year} UTC`;
  return `${String(day).padStart(2, "0")} ${EN_MONTHS[month - 1]} ${year}`;
}

function legacySectionId(id: string): string {
  if (id === "market_evidence") return "evidence";
  if (id === "market_limit") return "limit";
  if (id === "market_watch") return "change";
  return id;
}

function sourceState(
  locale: BtcPublicLocale,
  context: BtcCosmographerSourceContext,
): string {
  if (locale === "ru") {
    if (context.state === "FRESH") return "Market Snapshot проверен";
    if (context.state === "STALE_LIMITED") return "Market Snapshot ограниченно актуален";
    return "Market Snapshot временно недоступен";
  }
  if (context.state === "FRESH") return "Market Snapshot verified";
  if (context.state === "STALE_LIMITED") return "Market Snapshot is stale-limited";
  return "Market Snapshot temporarily unavailable";
}

function modeLabel(locale: BtcPublicLocale, turn: BtcDialogueTurn): string {
  const labels: Record<string, [string, string]> = {
    PROTOCOL_FACT: ["Bitcoin Protocol · факт", "Bitcoin Protocol · fact"],
    PROTOCOL_EXPLAIN: ["Bitcoin Protocol · объяснение", "Bitcoin Protocol · explanation"],
    MARKET_DIAGNOSIS: ["BTC Market · чтение", "BTC Market · read"],
    ASTRO_INTERVAL: ["Astromodule · период", "Astromodule · interval"],
    ASTRO_STATE: ["Astromodule · состояние", "Astromodule · state"],
    ASTRO_BTC_BRIDGE: ["Astro × BTC · сопоставление", "Astro × BTC · comparison"],
    METHODOLOGY: ["Метод и доказательность", "Method and evidence"],
    NAVIGATION: ["Навигация Bitcoin Corridor", "Bitcoin Corridor navigation"],
    CLARIFICATION: ["Уточнение", "Clarification"],
  };
  const value = labels[turn.answer_mode ?? "CLARIFICATION"] ?? [
    turn.answer_mode ?? "Cosmographer",
    turn.answer_mode ?? "Cosmographer",
  ];
  return locale === "ru" ? value[0] : value[1];
}

function makeTurn(props: Props): BtcDialogueTurn | null {
  if (!props.initialQuestion || !props.route || !props.answer || props.inputError) return null;
  const timestamp = props.sourceContext.generated_at_utc;
  const observationDate = props.route.time_range?.end ?? (props.initialDate || null);
  const evidenceLines = props.answer.sections
    .flatMap((section) => section.bullets ?? [])
    .slice(0, 3);
  const turnWithoutId: Omit<BtcDialogueTurn, "turn_id"> = {
    created_at_utc: timestamp ?? `${observationDate ?? "2026-01-01"}T12:00:00Z`,
    locale: props.locale,
    user_text: props.initialQuestion,
    effective_question: props.route.normalized_question,
    observation_date: observationDate,
    question_class: props.route.market_question_class,
    question_facets: props.route.intents,
    answer_state: props.answer.answer_state,
    headline: props.answer.headline,
    direct_answer: props.answer.direct_answer,
    evidence_lines: evidenceLines,
    contradiction_or_limit: null,
    what_would_change_the_read: null,
    source_boundary: props.answer.source_boundary,
    source_snapshot_generated_at_utc: timestamp,
    proof_available: props.sourceContext.proof_available || props.route.domain !== "btc_market",
    context_relation: props.route.context_relation,
    source_binding_changed: props.sourceBindingChanged,
    route_domain: props.route.domain,
    route_subject: props.route.subject,
    route_intents: props.route.intents,
    market_question_class: props.route.market_question_class,
    time_start: props.route.time_range?.start ?? null,
    time_end: props.route.time_range?.end ?? null,
    answer_mode: props.answer.answer_mode,
    sections: props.answer.sections,
    proof_label: props.answer.proof_label,
  };
  return {
    ...turnWithoutId,
    turn_id: makeBtcDialogueTurnId({
      userText: props.initialQuestion,
      route: props.route,
      answer: props.answer,
      snapshotTimestamp: timestamp,
    }),
  };
}

export function BtcCosmographerDialogue(props: Props) {
  const { locale, initialDate, sourceContext, deploymentSourceSha, inputError } = props;
  const ru = locale === "ru";
  const otherLocale: BtcPublicLocale = ru ? "en" : "ru";
  const currentTurn = useMemo(() => makeTurn(props), [
    props.locale,
    props.initialQuestion,
    props.initialDate,
    props.route,
    props.answer,
    props.sourceContext,
    props.sourceBindingChanged,
    props.inputError,
  ]);
  const [turns, setTurns] = useState<BtcDialogueTurn[]>(currentTurn ? [currentTurn] : []);
  const [compacted, setCompacted] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const newestRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    let session = readBtcDialogueSession(locale, deploymentSourceSha);
    if (currentTurn) session = upsertBtcDialogueTurn(session, currentTurn);
    setTurns(session.turns);
    setCompacted(session.compacted);
    setHydrated(true);
  }, [currentTurn, deploymentSourceSha, locale]);

  useEffect(() => {
    if (!hydrated || !newestRef.current) return;
    newestRef.current.focus({ preventScroll: true });
    newestRef.current.scrollIntoView({ block: "nearest" });
  }, [hydrated, turns.length]);

  const contextTurn = latestContextTurn(turns);
  const hasConversation = turns.length > 0;
  const contextFields = contextTurn ? {
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
  const legacyContextFields = contextTurn ? {
    fc: "btc_follow_up_context_v0_1",
    pc: contextTurn.market_question_class ?? contextTurn.question_class ?? "",
    pf: (contextTurn.route_intents ?? contextTurn.question_facets).join(","),
    ps: contextTurn.answer_state,
    pd: contextTurn.observation_date ?? "",
    pt: contextTurn.source_snapshot_generated_at_utc ?? "",
  } : null;

  const startNewConversation = () => {
    const confirmed = window.confirm(ru
      ? "Начать новый разговор и очистить историю этой вкладки?"
      : "Start a new conversation and clear this tab history?");
    if (!confirmed) return;
    clearBtcDialogueSession();
    window.location.assign(`/crypto-astro/btc/live?lang=${locale}`);
  };

  return <main
    className="liveDialoguePage"
    lang={locale}
    data-live-dialogue="btc-cosmographer-route-v0-1"
    data-session-local="true"
  >
    <header className="liveDialogueTopbar">
      <a className="liveBackLink" href={`/crypto-astro/btc?lang=${locale}`}>← BTC Field Read</a>
      <div className="liveIdentity">
        <FieldAnchorGlyph className="liveIdentityGlyph"/>
        <span>Cosmographer</span>
      </div>
      <a className="liveLocaleLink" href={`/crypto-astro/btc/live?lang=${otherLocale}`}>{otherLocale.toUpperCase()}</a>
    </header>

    <section className="liveDialogueShell" aria-labelledby="btc-cosmographer-title">
      <header className="liveDialogueIntro">
        <p className="eyebrow">Bitcoin Corridor</p>
        <h1 id="btc-cosmographer-title">{ru ? "BTC Космограф" : "BTC Cosmographer"}</h1>
        <p>{ru
          ? "Свободно переходите между протоколом Bitcoin, рынком, Snapshot Memory, Astromodule и мостом Astro × BTC. Явная новая тема сильнее прошлого контекста."
          : "Move freely between Bitcoin protocol, market, Snapshot Memory, Astromodule and the Astro × BTC bridge. An explicit new topic overrides prior context."}</p>
        <div className="liveTrustLine">
          <span>{sourceState(locale, sourceContext)}</span>
          {sourceContext.generated_at_utc && <span>{formatBtcUtcTimestamp(locale, sourceContext.generated_at_utc)}</span>}
          <span>Evidence-bound</span>
        </div>
        <div className="liveSessionLine" data-session-memory-note="tab-only">
          <span>{ru ? "Память только в этой вкладке" : "Memory only in this tab"}</span>
          <span data-session-turn-count>{ru ? `Ходов: ${turns.length}` : `Turns: ${turns.length}`}</span>
          {hasConversation && <button type="button" className="liveNewConversation" onClick={startNewConversation}>
            {ru ? "Новый разговор" : "New conversation"}
          </button>}
        </div>
        {compacted && <p className="liveCompactionNotice" role="status">
          {ru ? "Старая история сокращена; последние маршруты сохранены." : "Older history was compacted; latest routes remain."}
        </p>}
      </header>

      {inputError && <section className="dialogueFailure" role="alert">
        <strong>{ru ? "Дата не принята." : "Date not accepted."}</strong>
        <p>{inputError}</p>
      </section>}

      {hasConversation && <section
        className="liveThread"
        role="log"
        aria-live="polite"
        aria-label={ru ? "Диалог Bitcoin Corridor" : "Bitcoin Corridor dialogue"}
      >
        {turns.map((turn, index) => {
          const newest = index === turns.length - 1;
          const sections = turn.sections ?? [];
          const domain = turn.route_domain ?? "unsupported";
          const subject = turn.route_subject ?? turn.question_class ?? "unknown";
          const questionClass = turn.market_question_class ?? turn.question_class ?? "";
          const facets = (turn.route_intents ?? turn.question_facets).join(",");
          const observationLabel = observationDateLabel(turn.locale, turn.observation_date);
          return <div className="dialogueExchange" data-dialogue-turn-id={turn.turn_id} key={turn.turn_id}>
            <article className="dialogueTurn userTurn">
              <div className="turnRole">{turn.locale === "ru" ? "Вы" : "You"}</div>
              <div className="turnBody"><p>{turn.user_text}</p></div>
            </article>
            <article
              ref={newest ? newestRef : undefined}
              tabIndex={-1}
              className={`dialogueTurn ${newest ? "cosmographerTurn" : "cosmographerHistoryTurn"} dialogueState${turn.answer_state}`}
              data-answer-state={turn.answer_state}
              data-answer-mode={turn.answer_mode ?? "CLARIFICATION"}
              data-route-domain={domain}
              data-route-subject={subject}
              data-question-class={questionClass}
              data-question-facets={facets}
              data-market-question-class={questionClass}
              data-context-relation={turn.context_relation ?? "GENUINELY_AMBIGUOUS"}
            >
              <div className="turnRole">
                <FieldAnchorGlyph className="turnGlyph"/>
                <span>Cosmographer</span>
              </div>
              <div className="turnBody">
                <header className="answerHeader">
                  <p className="eyebrow">{modeLabel(turn.locale, turn)}</p>
                  {turn.headline && <h2>{turn.headline}</h2>}
                </header>
                {turn.direct_answer && <p className="answerLead" data-answer-direct="true">{turn.direct_answer}</p>}
                {sections.length > 0 && <div className="answerNarrative">
                  {sections.map((section) => <section
                    key={`${turn.turn_id}-${section.id}`}
                    data-answer-section={legacySectionId(section.id)}
                    data-semantic-answer-section={section.id}
                  >
                    <p><strong>{section.label}.</strong></p>
                    {section.paragraph && <p>{section.paragraph}</p>}
                    {section.bullets && section.bullets.length > 0 && <ul>
                      {section.bullets.map((line, itemIndex) => <li key={`${turn.turn_id}-${section.id}-${itemIndex}`}>{line}</li>)}
                    </ul>}
                  </section>)}
                </div>}
                {turn.source_binding_changed && <p className="sourceChangedNote" data-source-changed="true">
                  {ru ? "Market Snapshot обновился между ходами; рыночная часть перестроена." : "Market Snapshot changed between turns; the market layer was rebuilt."}
                </p>}
                <footer className={newest ? "answerSource" : "answerSourceHistory"} data-answer-source-boundary="true">
                  <span>{domain}</span>
                  {observationLabel && <span data-observation-date>{observationLabel}</span>}
                  {turn.time_start && turn.time_end && <span>{turn.time_start} — {turn.time_end}</span>}
                  <span>{turn.proof_label ?? (turn.proof_available ? "Proof available" : "Proof unavailable")}</span>
                  {turn.source_boundary && <span>{turn.source_boundary}</span>}
                </footer>
              </div>
            </article>
          </div>;
        })}
      </section>}

      <form
        className={hasConversation ? "liveComposer liveComposerAfterAnswer" : "liveComposer liveComposerPrimary"}
        method="get"
        action="/crypto-astro/btc/live"
      >
        <input type="hidden" name="lang" value={locale}/>
        {contextFields && Object.entries(contextFields).map(([name, value]) =>
          <input key={name} type="hidden" name={name} value={value}/>
        )}
        {legacyContextFields && Object.entries(legacyContextFields).map(([name, value]) =>
          <input key={name} type="hidden" name={name} value={value}/>
        )}
        <label>
          <span>{hasConversation
            ? (ru ? "Продолжить или начать новую тему" : "Continue or start a new topic")
            : (ru ? "Ваш вопрос в Bitcoin Corridor" : "Your Bitcoin Corridor question")}</span>
          <textarea
            name="q"
            rows={3}
            minLength={2}
            maxLength={500}
            required
            placeholder={hasConversation
              ? (ru ? "Почему это важно? Ликвидность подтверждает? Теперь о халвинге…" : "Why does it matter? Does liquidity confirm it? Now, about halving…")
              : (ru ? "Сколько может быть BTC? Что такое халвинг? Как двигался Юпитер в 2026?" : "How many BTC can exist? What is halving? How did Jupiter move in 2026?")}
          />
        </label>
        <div className="liveComposerControls">
          <label>
            <span>{ru ? "Дата наблюдения · необязательно" : "Observation date · optional"}</span>
            <input name="d" type="date" defaultValue={initialDate}/>
          </label>
          <button type="submit">{hasConversation ? (ru ? "Продолжить" : "Continue") : (ru ? "Получить ответ" : "Get answer")}</button>
        </div>
      </form>
      <p className="liveBoundary">{ru
        ? "Без регистрации · Без оплаты · Память только этой вкладки · Факты из evidence-контуров · Не прогноз и не торговый сигнал"
        : "No account · No payment · Memory only in this tab · Facts from evidence lanes · No forecast or trading signal"}</p>
    </section>
  </main>;
}
