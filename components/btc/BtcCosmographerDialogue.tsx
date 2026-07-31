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

type AstroWindowProjection = {
  rank: string;
  range: string;
  start: string;
  peak: string;
  title: string;
  basis: string;
};

function parseAstroWindowBullet(
  locale: BtcPublicLocale,
  bullet: string,
): AstroWindowProjection | null {
  const parts = bullet.split(" · ");
  if (parts.length < 3) return null;
  const rank = parts[0].replace(locale === "ru" ? "Ранг " : "Rank ", "").trim();
  const range = parts[1].trim();
  const remainder = parts.slice(2).join(" · ");
  const colon = remainder.indexOf(": ");
  if (!rank || !range || colon < 0) return null;
  const peak = remainder
    .slice(0, colon)
    .replace(locale === "ru" ? "пик " : "peak ", "")
    .trim();
  const body = remainder.slice(colon + 2);
  const marker = locale === "ru" ? ". Основания: " : ". Basis: ";
  const markerIndex = body.indexOf(marker);
  if (markerIndex < 0) return null;
  const start = range.split("–")[0]?.trim() ?? "";
  return {
    rank,
    range,
    start,
    peak,
    title: body.slice(0, markerIndex).trim(),
    basis: body.slice(markerIndex + marker.length).replace(/\.$/, "").trim(),
  };
}

function publicDomainLabel(locale: BtcPublicLocale, domain: string): string {
  const labels: Record<string, [string, string]> = {
    bitcoin_protocol: ["Протокол Bitcoin", "Bitcoin Protocol"],
    btc_market: ["Рынок BTC", "BTC Market"],
    snapshot_memory: ["Память снимков", "Snapshot Memory"],
    astromodule: ["Астрономические данные", "Astronomical data"],
    astro_btc_bridge: ["Астрономия × BTC", "Astronomy × BTC"],
    methodology: ["Метод и доказательность", "Method and evidence"],
    navigation: ["Навигация по полю BTC", "BTC field navigation"],
    unsupported: ["Граница поддержки", "Support boundary"],
  };
  const value = labels[domain] ?? [domain, domain];
  return locale === "ru" ? value[0] : value[1];
}

const CANONICAL_PUBLIC_COPY: Record<BtcPublicLocale, Array<[string, string]>> = {
  ru: [
    ["Планетарные аспекты 2026: пять главных окон", "Планетарные аспекты 2026: пять окон по принятому рейтингу"],
    ["Почему именно эти окна важны", "По каким критериям выбраны эти окна"],
    ["Астрономическое окно и ликвидность проверены как независимые слои", "Астрономические данные и ликвидность сопоставлены независимо"],
    ["Халвинг запускается высотой блока", "Халвинг определяется высотой блока, а не календарной датой"],
    ["Контекст аспектов 2026 восстановлен", "Планетарные аспекты 2026: краткое продолжение"],
    ["Самая плотная тактическая связка", "Наибольшая концентрация точных аспектов"],
    ["самая плотная тактическая связка", "наибольшая концентрация точных аспектов"],
    ["многомесячный несущий слой", "долгосрочный астрономический контекст"],
    ["Медленный несущий контекст", "Долгосрочный астрономический контекст"],
    ["Внутренний анализ идёт от медленных пар к быстрым активаторам. Пользовательский ответ идёт от ближайших окон к многомесячному слою. Быстрый триггер уточняет момент, но не заменяет родительский цикл.", "Анализ начинается с долгосрочных конфигураций и переходит к более быстрым астрономическим событиям. Ответ пользователю идёт от ближайших окон к долгосрочному контексту. Более быстрое событие уточняет момент, но не заменяет долгосрочную конфигурацию."],
    ["сохранённому годовому коридору", "сохранённому годовому обзору"],
    ["Граница трактовки", "Граница вывода"],
    ["Граница моста Astro × BTC", "Граница сопоставления"],
    ["Multi-body Astro proof доступен", "Астрономические доказательства доступны"],
    ["Astro proof + Market proof", "Астрономические и рыночные доказательства доступны"],
    ["Protocol proof доступен", "Доказательства протокола доступны"],
    ["Astro proof ограничен", "Астрономические доказательства ограничены"],
    ["Market proof доступен", "Рыночные доказательства доступны"],
    ["Market proof недоступен", "Рыночные доказательства недоступны"],
    ["Method proof доступен", "Доказательства метода доступны"],
    ["Capability registry", "Реестр возможностей"],
    ["Рыночный evidence временно недоступен", "Рыночные доказательства временно недоступны"],
    ["Основные маршруты Bitcoin Corridor", "Основные маршруты поля BTC"],
    ["Навигация Bitcoin Corridor", "Навигация по полю BTC"],
    ["Astromodule", "Астрономические данные"],
  ],
  en: [
    ["Planetary aspects in 2026: five primary windows", "Planetary aspects in 2026: five windows by the accepted ranking"],
    ["Why these windows matter", "How these windows were selected"],
    ["The astronomy window and liquidity were checked as independent layers", "Astronomical data and liquidity were compared independently"],
    ["Halving is triggered by block height", "Halving is determined by block height, not a calendar date"],
    ["The 2026 aspect context is restored", "Planetary aspects in 2026: concise continuation"],
    ["The densest tactical cluster", "The highest concentration of exact aspects"],
    ["the densest tactical cluster", "the highest concentration of exact aspects"],
    ["multi-month carrier layer", "long-term astronomical context"],
    ["Slow carrier context", "Long-term astronomical context"],
    ["Internal analysis runs from slow pairs to fast activators. The public answer runs from nearer windows to the multi-month layer. A fast trigger refines timing but does not replace its parent cycle.", "Analysis begins with long-term configurations and then moves to faster astronomical events. The public answer moves from nearer windows to long-term context. A faster event refines timing but does not replace the long-term configuration."],
    ["saved annual corridor", "saved annual overview"],
    ["Interpretation boundary", "Inference boundary"],
    ["Astro × BTC bridge boundary", "Comparison boundary"],
    ["Multi-body Astro proof available", "Astronomical evidence available"],
    ["Astro proof + Market proof", "Astronomical and market evidence available"],
    ["Protocol proof available", "Protocol evidence available"],
    ["Astro proof limited", "Astronomical evidence limited"],
    ["Market proof available", "Market evidence available"],
    ["Market proof unavailable", "Market evidence unavailable"],
    ["Method proof available", "Method evidence available"],
    ["Capability registry", "Capability registry"],
    ["Market evidence is temporarily unavailable", "Market evidence is temporarily unavailable"],
    ["Main Bitcoin Corridor routes", "Main BTC field routes"],
    ["Bitcoin Corridor navigation", "BTC field navigation"],
    ["Astromodule", "Astronomical data"],
  ],
};

function canonicalPublicCopy(locale: BtcPublicLocale, value: string): string {
  return CANONICAL_PUBLIC_COPY[locale].reduce(
    (output, [source, target]) => output.replaceAll(source, target),
    value,
  );
}

function canonicalAnswerSections(
  locale: BtcPublicLocale,
  sections: BtcCosmographerAnswerProjection["sections"],
): BtcCosmographerAnswerProjection["sections"] {
  return sections.map((section) => ({
    ...section,
    label: canonicalPublicCopy(locale, section.label),
    paragraph: section.paragraph
      ? canonicalPublicCopy(locale, section.paragraph)
      : section.paragraph,
    bullets: section.bullets?.map((line) => canonicalPublicCopy(locale, line)),
  }));
}

function AstroWindowSection({
  locale,
  section,
  sectionKey,
}: {
  locale: BtcPublicLocale;
  section: NonNullable<BtcDialogueTurn["sections"]>[number];
  sectionKey: string;
}) {
  const parsed = (section.bullets ?? []).map((bullet) =>
    parseAstroWindowBullet(locale, bullet)
  );
  if (parsed.some((item) => !item)) {
    return <section
      key={sectionKey}
      data-answer-section={legacySectionId(section.id)}
      data-semantic-answer-section={section.id}
    >
      <p><strong>{section.label}.</strong></p>
      <ul>{section.bullets?.map((line, itemIndex) =>
        <li key={`${sectionKey}-${itemIndex}`}>{line}</li>
      )}</ul>
    </section>;
  }
  return <section
    key={sectionKey}
    data-answer-section={legacySectionId(section.id)}
    data-semantic-answer-section={section.id}
  >
    <p><strong>{section.label}.</strong></p>
    <div className="astroWindowGrid">
      {(parsed as AstroWindowProjection[]).map((item) =>
        <article
          className="astroWindowCard"
          data-window-start={item.start}
          data-window-rank={item.rank}
          key={`${sectionKey}-${item.range}-${item.peak}`}
        >
          <div className="astroWindowRank" aria-label={`${locale === "ru" ? "Ранг" : "Rank"} ${item.rank}`}>
            <span>{locale === "ru" ? "Ранг" : "Rank"}</span>
            <strong>{item.rank}</strong>
          </div>
          <div className="astroWindowBody">
            <div className="astroWindowRange">{item.range}</div>
            <div className="astroWindowPeak">{locale === "ru" ? "пик" : "peak"} {item.peak}</div>
            <h3 className="astroWindowTitle">{item.title}</h3>
            <p className="astroWindowBasis">{item.basis}</p>
          </div>
        </article>
      )}
    </div>
  </section>;
}

function semanticRelation(turn: BtcDialogueTurn): string {
  return turn.context_relation ?? "GENUINELY_AMBIGUOUS";
}

function exposedRelation(turn: BtcDialogueTurn): string {
  const semantic = semanticRelation(turn);
  const question = turn.user_text.trim().toLowerCase();
  if (semantic === "FOLLOW_UP" && /^why\??$/.test(question)) return "EXPLAIN_PRIOR";
  const questionClass = turn.market_question_class ?? turn.question_class;
  const intents = turn.route_intents ?? turn.question_facets;
  if (
    questionClass === "liquidity" &&
    intents.includes("confirmation") &&
    /^does\s+liquidity\s+confirm\s+it\??$/.test(question)
  ) {
    return "CONFIRM_WITH_MODULE";
  }
  return semantic;
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
    ASTRO_INTERVAL: ["Астрономические данные · период", "Astronomical data · interval"],
    ASTRO_STATE: ["Астрономические данные · состояние", "Astronomical data · state"],
    ASTRO_YEAR_OVERVIEW: ["Астрономические данные · годовой обзор", "Astronomical data · annual overview"],
    ASTRO_BTC_BRIDGE: ["Астрономия × BTC · сопоставление", "Astronomy × BTC · comparison"],
    METHODOLOGY: ["Метод и доказательность", "Method and evidence"],
    NAVIGATION: ["Навигация по полю BTC", "BTC field navigation"],
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
  const canonicalSections = canonicalAnswerSections(props.locale, props.answer.sections);
  const evidenceLines = canonicalSections
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
    headline: canonicalPublicCopy(props.locale, props.answer.headline),
    direct_answer: canonicalPublicCopy(props.locale, props.answer.direct_answer),
    evidence_lines: evidenceLines,
    contradiction_or_limit: null,
    what_would_change_the_read: null,
    source_boundary: canonicalPublicCopy(props.locale, props.answer.source_boundary),
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
    sections: canonicalSections,
    proof_label: canonicalPublicCopy(props.locale, props.answer.proof_label),
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
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
    const focusNewest = () => {
      const node = newestRef.current;
      if (!node) return;
      node.focus({ preventScroll: true });
      const absoluteTop = window.scrollY + node.getBoundingClientRect().top;
      window.scrollTo({ top: Math.max(0, absoluteTop - 18), behavior: "auto" });
    };
    focusNewest();
    const firstFrame = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(focusNewest);
    });
    const restorationGuard = window.setTimeout(focusNewest, 80);
    const lateRestorationGuard = window.setTimeout(focusNewest, 240);
    return () => {
      window.cancelAnimationFrame(firstFrame);
      window.clearTimeout(restorationGuard);
      window.clearTimeout(lateRestorationGuard);
    };
  }, [hydrated, turns.length]);

  const contextTurn = latestContextTurn(turns);
  const retainedAstroTurn = [...turns].reverse().find((turn) =>
    turn.route_subject === "planetary_aspects" &&
    (turn.route_domain === "astromodule" || turn.route_domain === "astro_btc_bridge") &&
    Boolean(turn.time_start && turn.time_end),
  );
  const retainedAstroFields = retainedAstroTurn ? {
    rad: "astromodule",
    ras: "planetary_aspects",
    rat0: retainedAstroTurn.time_start ?? "",
    rat1: retainedAstroTurn.time_end ?? "",
  } : null;
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
        <p className="eyebrow">Market Cosmographer</p>
        <h1 id="btc-cosmographer-title">{ru ? "Чтение поля BTC" : "BTC Field Read"}</h1>
        <p>{ru
          ? "Задайте вопрос о протоколе Bitcoin, рынке BTC, памяти снимков или астрономических данных. Космограф разделяет источники, выводы и границы доказательности."
          : "Ask about the Bitcoin protocol, the BTC market, snapshot memory, or astronomical data. Cosmographer keeps sources, conclusions, and evidence boundaries separate."}</p>
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
          const canonicalRelation = semanticRelation(turn);
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
              data-context-relation={exposedRelation(turn)}
              data-semantic-context-relation={canonicalRelation}
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
                  {sections.map((section) => {
                    const sectionKey = `${turn.turn_id}-${section.id}`;
                    if (section.id === "main_windows" && section.bullets?.length) {
                      return <AstroWindowSection
                        locale={turn.locale}
                        section={section}
                        sectionKey={sectionKey}
                        key={sectionKey}
                      />;
                    }
                    if (section.id === "fast_triggers" && section.bullets?.length) {
                      return <section key={sectionKey} data-answer-section={legacySectionId(section.id)} data-semantic-answer-section={section.id}>
                        <details className="answerDisclosure" data-complete-transitions="collapsed">
                          <summary>{section.label} · {section.bullets.length}</summary>
                          <ul>{section.bullets.map((line, itemIndex) => <li key={`${sectionKey}-${itemIndex}`}>{line}</li>)}</ul>
                        </details>
                      </section>;
                    }
                    return <section key={sectionKey} data-answer-section={legacySectionId(section.id)} data-semantic-answer-section={section.id}>
                      <p><strong>{section.label}.</strong></p>
                      {section.paragraph && <p>{section.paragraph}</p>}
                      {section.bullets && section.bullets.length > 0 && <ul>
                        {section.bullets.map((line, itemIndex) => <li key={`${sectionKey}-${itemIndex}`}>{line}</li>)}
                      </ul>}
                    </section>;
                  })}
                </div>}
                {turn.source_binding_changed && <p className="sourceChangedNote" data-source-changed="true">
                  {ru ? "Market Snapshot обновился между ходами; рыночная часть перестроена." : "Market Snapshot changed between turns; the market layer was rebuilt."}
                </p>}
                <footer className={newest ? "answerSource" : "answerSourceHistory"} data-answer-source-boundary="true">
                  <span>{publicDomainLabel(turn.locale, domain)}</span>
                  {observationLabel && <span data-observation-date>{observationLabel}</span>}
                  {turn.time_start && turn.time_end && <span>{turn.time_start} — {turn.time_end}</span>}
                  <span>{turn.proof_label ?? (turn.proof_available
                    ? (turn.locale === "ru" ? "Доказательства доступны" : "Evidence available")
                    : (turn.locale === "ru" ? "Доказательства недоступны" : "Evidence unavailable"))}</span>
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
        {retainedAstroFields && Object.entries(retainedAstroFields).map(([name, value]) =>
          <input key={name} type="hidden" name={name} value={value}/>
        )}
        {contextFields && Object.entries(contextFields).map(([name, value]) =>
          <input key={name} type="hidden" name={name} value={value}/>
        )}
        {legacyContextFields && Object.entries(legacyContextFields).map(([name, value]) =>
          <input key={name} type="hidden" name={name} value={value}/>
        )}
        <label>
          <span>{hasConversation
            ? (ru ? "Продолжить или начать новую тему" : "Continue or start a new topic")
            : (ru ? "Ваш вопрос о поле BTC" : "Your question about the BTC field")}</span>
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
