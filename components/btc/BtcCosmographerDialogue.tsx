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
import { formatBtcUtcTimestamp, type BtcPublicLocale } from "../../lib/btc-public-language-contract";
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
};

function sourceState(locale: BtcPublicLocale, context: BtcCosmographerSourceContext): string {
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
  const ru = locale === "ru";
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
  const value = labels[turn.answer_mode] ?? [turn.answer_mode, turn.answer_mode];
  return ru ? value[0] : value[1];
}

function makeTurn(props: Props): BtcDialogueTurn | null {
  if (!props.initialQuestion || !props.route || !props.answer) return null;
  const timestamp = props.sourceContext.generated_at_utc;
  const turn: Omit<BtcDialogueTurn, "turn_id"> = {
    created_at_utc: timestamp ?? `${props.route.time_range?.end ?? "2026-01-01"}T12:00:00Z`,
    locale: props.locale,
    user_text: props.initialQuestion,
    route_domain: props.route.domain,
    route_subject: props.route.subject,
    route_intents: props.route.intents,
    context_relation: props.route.context_relation,
    market_question_class: props.route.market_question_class,
    time_start: props.route.time_range?.start ?? null,
    time_end: props.route.time_range?.end ?? null,
    answer_state: props.answer.answer_state,
    answer_mode: props.answer.answer_mode,
    headline: props.answer.headline,
    direct_answer: props.answer.direct_answer,
    sections: props.answer.sections,
    source_boundary: props.answer.source_boundary,
    proof_label: props.answer.proof_label,
    source_snapshot_generated_at_utc: timestamp,
    source_binding_changed: props.sourceBindingChanged,
  };
  return {
    ...turn,
    turn_id: makeBtcDialogueTurnId({
      userText: props.initialQuestion,
      route: props.route,
      answer: props.answer,
      snapshotTimestamp: timestamp,
    }),
  };
}

export function BtcCosmographerDialogue(props: Props) {
  const { locale, initialDate, sourceContext, deploymentSourceSha } = props;
  const ru = locale === "ru";
  const otherLocale: BtcPublicLocale = ru ? "en" : "ru";
  const currentTurn = useMemo(() => makeTurn(props), [
    props.locale,
    props.initialQuestion,
    props.route,
    props.answer,
    props.sourceContext,
    props.sourceBindingChanged,
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
    cd: contextTurn.route_domain,
    cs: contextTurn.route_subject,
    ci: contextTurn.route_intents.join(","),
    ca: contextTurn.answer_state,
    cm: contextTurn.market_question_class ?? "",
    ct0: contextTurn.time_start ?? "",
    ct1: contextTurn.time_end ?? "",
    cb: contextTurn.source_snapshot_generated_at_utc ?? "",
  } : null;

  const startNewConversation = () => {
    const confirmed = window.confirm(ru
      ? "Начать новый разговор и очистить историю этой вкладки?"
      : "Start a new conversation and clear this tab history?");
    if (!confirmed) return;
    clearBtcDialogueSession();
    window.location.assign(`/crypto-astro/btc/live?lang=${locale}`);
  };

  return <main className="liveDialoguePage" lang={locale} data-live-dialogue="btc-cosmographer-route-v0-1" data-session-local="true">
    <header className="liveDialogueTopbar">
      <a className="liveBackLink" href={`/crypto-astro/btc?lang=${locale}`}>← BTC Field Read</a>
      <div className="liveIdentity"><FieldAnchorGlyph className="liveIdentityGlyph"/><span>Cosmographer</span></div>
      <a className="liveLocaleLink" href={`/crypto-astro/btc/live?lang=${otherLocale}`}>{otherLocale.toUpperCase()}</a>
    </header>

    <section className="liveDialogueShell" aria-labelledby="btc-cosmographer-title">
      <header className="liveDialogueIntro">
        <p className="eyebrow">{ru ? "Bitcoin Corridor" : "Bitcoin Corridor"}</p>
        <h1 id="btc-cosmographer-title">{ru ? "BTC Космограф" : "BTC Cosmographer"}</h1>
        <p>{ru
          ? "Свободно переходите между протоколом Bitcoin, рынком, Snapshot Memory, Astromodule и мостом Astro × BTC. Явная новая тема сильнее прошлого контекста."
          : "Move freely between Bitcoin protocol, market, Snapshot Memory, Astromodule and the Astro × BTC bridge. An explicit new topic overrides prior context."}</p>
        <div className="liveTrustLine">
          <span>{sourceState(locale, sourceContext)}</span>
          {sourceContext.generated_at_utc && <span>{formatBtcUtcTimestamp(locale, sourceContext.generated_at_utc)}</span>}
          <span>{ru ? "Evidence-bound" : "Evidence-bound"}</span>
        </div>
        <div className="liveSessionLine" data-session-memory-note="tab-only">
          <span>{ru ? "Память только в этой вкладке" : "Memory only in this tab"}</span>
          <span data-session-turn-count>{ru ? `Ходов: ${turns.length}` : `Turns: ${turns.length}`}</span>
          {hasConversation && <button type="button" className="liveNewConversation" onClick={startNewConversation}>{ru ? "Новый разговор" : "New conversation"}</button>}
        </div>
        {compacted && <p className="liveCompactionNotice" role="status">{ru ? "Старая история сокращена; последние маршруты сохранены." : "Older history was compacted; latest routes remain."}</p>}
      </header>

      {hasConversation && <section className="liveThread" role="log" aria-live="polite" aria-label={ru ? "Диалог Bitcoin Corridor" : "Bitcoin Corridor dialogue"}>
        {turns.map((turn, index) => {
          const newest = index === turns.length - 1;
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
              data-answer-mode={turn.answer_mode}
              data-route-domain={turn.route_domain}
              data-route-subject={turn.route_subject}
              data-market-question-class={turn.market_question_class ?? ""}
              data-context-relation={turn.context_relation}
            >
              <div className="turnRole"><FieldAnchorGlyph className="turnGlyph"/><span>Cosmographer</span></div>
              <div className="turnBody">
                <header className="answerHeader"><p className="eyebrow">{modeLabel(turn.locale, turn)}</p><h2>{turn.headline}</h2></header>
                <p className="answerLead" data-answer-direct="true">{turn.direct_answer}</p>
                {turn.sections.length > 0 && <div className="answerNarrative">
                  {turn.sections.map((section) => <section key={`${turn.turn_id}-${section.id}`} data-answer-section={section.id}>
                    <p><strong>{section.label}.</strong></p>
                    {section.paragraph && <p>{section.paragraph}</p>}
                    {section.bullets && section.bullets.length > 0 && <ul>{section.bullets.map((line, itemIndex) => <li key={`${turn.turn_id}-${section.id}-${itemIndex}`}>{line}</li>)}</ul>}
                  </section>)}
                </div>}
                {turn.source_binding_changed && <p className="sourceChangedNote" data-source-changed="true">{ru ? "Market Snapshot обновился между ходами; рыночная часть перестроена." : "Market Snapshot changed between turns; the market layer was rebuilt."}</p>}
                <footer className={newest ? "answerSource" : "answerSourceHistory"} data-answer-source-boundary="true">
                  <span>{turn.route_domain}</span>
                  {turn.time_start && turn.time_end && <span>{turn.time_start} — {turn.time_end}</span>}
                  <span>{turn.proof_label}</span>
                  <span>{turn.source_boundary}</span>
                </footer>
              </div>
            </article>
          </div>;
        })}
      </section>}

      <form className={hasConversation ? "liveComposer liveComposerAfterAnswer" : "liveComposer liveComposerPrimary"} method="get" action="/crypto-astro/btc/live">
        <input type="hidden" name="lang" value={locale}/>
        {contextFields && Object.entries(contextFields).map(([name, value]) => <input key={name} type="hidden" name={name} value={value}/>)}
        <label>
          <span>{hasConversation ? (ru ? "Продолжить или начать новую тему" : "Continue or start a new topic") : (ru ? "Ваш вопрос в Bitcoin Corridor" : "Your Bitcoin Corridor question")}</span>
          <textarea name="q" rows={3} minLength={2} maxLength={500} required placeholder={hasConversation
            ? (ru ? "Почему это важно? Ликвидность подтверждает? Теперь о халвинге…" : "Why does it matter? Does liquidity confirm it? Now, about halving…")
            : (ru ? "Сколько может быть BTC? Что такое халвинг? Как двигался Юпитер в 2026?" : "How many BTC can exist? What is halving? How did Jupiter move in 2026?")}/>
        </label>
        <div className="liveComposerControls">
          <label><span>{ru ? "Дата наблюдения · необязательно" : "Observation date · optional"}</span><input name="d" type="date" defaultValue={initialDate}/></label>
          <button type="submit">{hasConversation ? (ru ? "Продолжить" : "Continue") : (ru ? "Получить ответ" : "Get answer")}</button>
        </div>
      </form>
      <p className="liveBoundary">{ru
        ? "Без регистрации · Без оплаты · Память только этой вкладки · Факты из evidence-контуров · Не прогноз и не торговый сигнал"
        : "No account · No payment · Memory only in this tab · Facts from evidence lanes · No forecast or trading signal"}</p>
    </section>
  </main>;
}
