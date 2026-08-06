import { useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import {
  BTC_COSMOGRAPHER_CONTEXT_SCHEMA,
  type BtcCosmographerRoute,
} from "../../lib/btc-cosmographer-route-graph";
import {
  applyBtcRuntimeAntiLoop,
  BTC_EVIDENCE_NAVIGATION_RUNTIME_SCHEMA,
  type BtcEvidenceNavigationRuntimeDecision,
} from "../../lib/btc-cosmographer-evidence-navigation-runtime";
import {
  BTC_ORIGINS_PREPARED_QUESTIONS,
  type BtcCosmographerAnswerProjection,
} from "../../lib/btc-protocol-evidence";
import {
  BTC_DIALOGUE_SESSION_SCHEMA,
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
  runtimeDecision: BtcEvidenceNavigationRuntimeDecision | null;
  sourceContext: BtcCosmographerSourceContext;
  deploymentSourceSha: string | null;
  sourceBindingChanged: boolean;
  inputError: string | null;
  pendingClarificationOriginFingerprint: string | null;
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

function publicSubjectLabel(locale: BtcPublicLocale, subject: string): string {
  const labels: Record<string, [string, string]> = {
    sun: ["Солнце", "Sun"],
    moon: ["Луна", "Moon"],
    mercury: ["Меркурий", "Mercury"],
    venus: ["Венера", "Venus"],
    mars: ["Марс", "Mars"],
    jupiter: ["Юпитер", "Jupiter"],
    saturn: ["Сатурн", "Saturn"],
    uranus: ["Уран", "Uranus"],
    neptune: ["Нептун", "Neptune"],
    pluto: ["Плутон", "Pluto"],
    planetary_aspects: ["Планетарные аспекты", "Planetary aspects"],
    bitcoin_genesis_chart: ["Карта генезиса Bitcoin", "Bitcoin genesis chart"],
    btc_gravity: ["Гравитация BTC", "BTC gravity"],
    market_structure: ["Структура рынка", "Market structure"],
    liquidity: ["Ликвидность", "Liquidity"],
    change_memory: ["Память Snapshot", "Snapshot memory"],
    halving: ["Халвинг", "Halving"],
    supply: ["Предложение BTC", "BTC supply"],
    satoshi_history: ["История Сатоши", "Satoshi history"],
    bitcoin_origin: ["Происхождение Bitcoin", "Bitcoin origins"],
    genesis_history: ["История Genesis", "Genesis history"],
  };
  const value = labels[subject];
  if (!value) return subject.replaceAll("_", " ");
  return locale === "ru" ? value[0] : value[1];
}

function turnPeriodLabel(locale: BtcPublicLocale, turn: BtcDialogueTurn): string {
  if (turn.time_start && turn.time_end) {
    const startYear = turn.time_start.slice(0, 4);
    if (turn.time_start === `${startYear}-01-01` && turn.time_end === `${startYear}-12-31`) {
      return startYear;
    }
    return turn.time_start === turn.time_end
      ? (observationDateLabel(locale, turn.time_start) ?? turn.time_start)
      : `${turn.time_start} — ${turn.time_end}`;
  }
  return observationDateLabel(locale, turn.observation_date) ?? (locale === "ru" ? "не указан" : "not specified");
}

function contextRelationLabel(locale: BtcPublicLocale, relation: string | null): string {
  const labels: Record<string, [string, string]> = {
    NEW_TOPIC: ["Новый предмет", "New subject"],
    FOLLOW_UP: ["Продолжение", "Follow-up"],
    CROSS_MODULE_BRIDGE: ["Межмодульное сопоставление", "Cross-module comparison"],
    RETURN_TO_PREVIOUS_TOPIC: ["Возврат к предмету", "Return to subject"],
    GENUINELY_AMBIGUOUS: ["Требуется уточнение", "Clarification needed"],
  };
  const value = labels[relation ?? "GENUINELY_AMBIGUOUS"] ?? labels.GENUINELY_AMBIGUOUS;
  return locale === "ru" ? value[0] : value[1];
}

function evidenceCoverageLabel(locale: BtcPublicLocale, turn: BtcDialogueTurn, domain: string): string {
  if (domain === "astromodule" || domain === "astro_btc_bridge") {
    const match = turn.source_boundary?.match(/(20\d{2}-\d{2}-\d{2})\s*[–—]\s*(20\d{2}-\d{2}-\d{2})/);
    return match ? `${match[1]} — ${match[2]}` : (locale === "ru" ? "Не опубликовано" : "Not published");
  }
  if (domain === "btc_market" || domain === "snapshot_memory") {
    return locale === "ru" ? "Принятый Market Snapshot" : "Accepted Market Snapshot";
  }
  return locale === "ru" ? "Заявленная доказательная область" : "Declared evidence lane";
}

function evidenceRevisionLabel(locale: BtcPublicLocale, turn: BtcDialogueTurn, domain: string): string {
  if (domain === "astromodule" || domain === "astro_btc_bridge") {
    const unavailable = locale === "ru"
      ? "Не опубликовано в принятом астрономическом evidence index"
      : "Not published in the accepted astronomical evidence index";
    if (domain === "astro_btc_bridge" && turn.source_snapshot_generated_at_utc) {
      return locale === "ru"
        ? `${unavailable}; Market Snapshot создан ${formatBtcUtcTimestamp(locale, turn.source_snapshot_generated_at_utc)}`
        : `${unavailable}; Market Snapshot generated ${formatBtcUtcTimestamp(locale, turn.source_snapshot_generated_at_utc)}`;
    }
    return unavailable;
  }
  if (turn.source_snapshot_generated_at_utc) {
    return formatBtcUtcTimestamp(locale, turn.source_snapshot_generated_at_utc);
  }
  return locale === "ru" ? "Не опубликовано" : "Not published";
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
  return {
    rank,
    range,
    start: range.split("–")[0]?.trim() ?? "",
    peak,
    title: body.slice(0, markerIndex).trim(),
    basis: body.slice(markerIndex + marker.length).replace(/\.$/, "").trim(),
  };
}

function publicDomainLabel(locale: BtcPublicLocale, domain: string): string {
  const labels: Record<string, [string, string]> = {
    bitcoin_protocol: ["Протокол Bitcoin", "Bitcoin Protocol"],
    btc_market: ["Рынок BTC", "BTC Market"],
    snapshot_memory: ["Память Snapshot", "Snapshot Memory"],
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
    ["Контекст аспектов 2026 восстановлен", "Планетарные аспекты 2026: краткое продолжение"],
    ["Самая плотная тактическая связка", "Наибольшая концентрация точных аспектов"],
    ["самая плотная тактическая связка", "наибольшая концентрация точных аспектов"],
    ["многомесячный несущий слой", "долгосрочный астрономический контекст"],
    ["Медленный несущий контекст", "Долгосрочный астрономический контекст"],
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
    ["Халвинг запускается высотой блока", "Халвинг определяется высотой блока, а не календарной датой"],
    ["Astromodule", "Астрономические данные"],
  ],
  en: [
    ["Planetary aspects in 2026: five primary windows", "Planetary aspects in 2026: five windows by the accepted ranking"],
    ["Why these windows matter", "How these windows were selected"],
    ["The astronomy window and liquidity were checked as independent layers", "Astronomical data and liquidity were compared independently"],
    ["The 2026 aspect context is restored", "Planetary aspects in 2026: concise continuation"],
    ["The densest tactical cluster", "The highest concentration of exact aspects"],
    ["the densest tactical cluster", "the highest concentration of exact aspects"],
    ["multi-month carrier layer", "long-term astronomical context"],
    ["Slow carrier context", "Long-term astronomical context"],
    ["Interpretation boundary", "Inference boundary"],
    ["Astro × BTC bridge boundary", "Comparison boundary"],
    ["Multi-body Astro proof available", "Astronomical evidence available"],
    ["Astro proof + Market proof", "Astronomical and market evidence available"],
    ["Protocol proof available", "Protocol evidence available"],
    ["Astro proof limited", "Astronomical evidence limited"],
    ["Market proof available", "Market evidence available"],
    ["Market proof unavailable", "Market evidence unavailable"],
    ["Method proof available", "Method evidence available"],
    ["Halving is triggered by block height", "Halving is determined by block height, not a calendar date"],
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
    PROTOCOL_FACT: ["Протокол Bitcoin · факт", "Bitcoin Protocol · fact"],
    PROTOCOL_EXPLAIN: ["Протокол Bitcoin · объяснение", "Bitcoin Protocol · explanation"],
    MARKET_DIAGNOSIS: ["Рынок BTC · текущее чтение", "BTC Market · current read"],
    ASTRO_INTERVAL: ["Астрономические данные · период", "Astronomical data · interval"],
    ASTRO_STATE: ["Астрономические данные · состояние", "Astronomical data · state"],
    ASTRO_YEAR_OVERVIEW: ["Астрономические данные · годовой обзор", "Astronomical data · annual overview"],
    ASTRO_BTC_BRIDGE: ["Астрономия × BTC · сопоставление", "Astronomy × BTC · comparison"],
    METHODOLOGY: ["Метод и доказательность", "Method and evidence"],
    NAVIGATION: ["Навигация по полю BTC", "BTC field navigation"],
    CLARIFICATION: ["Нужно уточнение", "Clarification needed"],
  };
  const value = labels[turn.answer_mode ?? "CLARIFICATION"] ?? [
    turn.answer_mode ?? "Cosmographer",
    turn.answer_mode ?? "Cosmographer",
  ];
  return locale === "ru" ? value[0] : value[1];
}

function applyRuntimeDecisionToTurn(
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

function makeTurn(props: Props): BtcDialogueTurn | null {
  if (!props.initialQuestion || !props.route || !props.answer || props.inputError) return null;
  const timestamp = props.sourceContext.generated_at_utc;
  const observationDate = props.route.time_range?.end ?? (props.initialDate || null);
  const canonicalSections = canonicalAnswerSections(props.locale, props.answer.sections);
  const evidenceLines = canonicalSections.flatMap((section) => section.bullets ?? []).slice(0, 3);
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
  const turn: BtcDialogueTurn = {
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
  const parsed = (section.bullets ?? []).map((bullet) => parseAstroWindowBullet(locale, bullet));
  if (parsed.some((item) => !item)) {
    return <section className="answerSection" data-answer-section={legacySectionId(section.id)} data-semantic-answer-section={section.id}>
      <h3>{section.label}</h3>
      <ul>{section.bullets?.map((line, itemIndex) => <li key={`${sectionKey}-${itemIndex}`}>{line}</li>)}</ul>
    </section>;
  }
  return <section className="answerSection answerWindows" data-answer-section={legacySectionId(section.id)} data-semantic-answer-section={section.id}>
    <h3>{section.label}</h3>
    <div className="astroWindowGrid">
      {(parsed as AstroWindowProjection[]).map((item) => <article
        className={`astroWindowCard ${item.rank === "1" ? "astroWindowPrimary" : ""}`}
        data-window-start={item.start}
        data-window-rank={item.rank}
        key={`${sectionKey}-${item.range}-${item.peak}`}
      >
        <div className="astroWindowRank">
          <span>{locale === "ru" ? "Ранг" : "Rank"}</span>
          <strong>{item.rank}</strong>
        </div>
        <div className="astroWindowBody">
          <div className="astroWindowRange">{item.range}</div>
          <div className="astroWindowPeak">{locale === "ru" ? "пик" : "peak"} {item.peak}</div>
          <h4>{item.title}</h4>
          <p>{item.basis}</p>
        </div>
      </article>)}
    </div>
  </section>;
}

function AnswerSections({ turn }: { turn: BtcDialogueTurn }) {
  const sections = turn.sections ?? [];
  return <div className="answerNarrative">
    {sections.map((section) => {
      const sectionKey = `${turn.turn_id}-${section.id}`;
      if (section.id === "main_windows" && section.bullets?.length) {
        return <AstroWindowSection key={sectionKey} locale={turn.locale} section={section} sectionKey={sectionKey}/>;
      }
      if (section.id === "fast_triggers" && section.bullets?.length) {
        return <section className="answerSection" key={sectionKey} data-answer-section={legacySectionId(section.id)} data-semantic-answer-section={section.id}>
          <details className="answerDisclosure" data-complete-transitions="collapsed">
            <summary>{section.label} · {section.bullets.length}</summary>
            <ul>{section.bullets.map((line, itemIndex) => <li key={`${sectionKey}-${itemIndex}`}>{line}</li>)}</ul>
          </details>
        </section>;
      }
      if (section.id === "sources" && section.bullets?.length) {
        return <section className="answerSection answerSection-sources" key={sectionKey} data-answer-section="sources" data-semantic-answer-section="sources">
          <details className="answerDisclosure answerSourceList" data-origin-source-list="true">
            <summary>{section.label} · {section.bullets.length}</summary>
            <ul>{section.bullets.map((line, itemIndex) => {
              const delimiter = line.lastIndexOf("|");
              const label = delimiter > 0 ? line.slice(0, delimiter) : line;
              const url = delimiter > 0 ? line.slice(delimiter + 1) : "";
              return <li key={`${sectionKey}-${itemIndex}`}>
                {/^https:\/\//.test(url)
                  ? <a href={url} target="_blank" rel="noreferrer">{label}</a>
                  : label}
              </li>;
            })}</ul>
          </details>
        </section>;
      }
      return <section
        className={`answerSection answerSection-${section.id}`}
        key={sectionKey}
        data-answer-section={legacySectionId(section.id)}
        data-semantic-answer-section={section.id}
      >
        <h3>{section.label}</h3>
        {section.paragraph && <p>{section.paragraph}</p>}
        {section.bullets && section.bullets.length > 0 && <ul>
          {section.bullets.map((line, itemIndex) => <li key={`${sectionKey}-${itemIndex}`}>{line}</li>)}
        </ul>}
      </section>;
    })}
  </div>;
}

function Exchange({
  turn,
  newest,
  newestRef,
}: {
  turn: BtcDialogueTurn;
  newest: boolean;
  newestRef: MutableRefObject<HTMLElement | null>;
}) {
  const domain = turn.route_domain ?? "unsupported";
  const subject = turn.route_subject ?? turn.question_class ?? "unknown";
  const questionClass = turn.market_question_class ?? turn.question_class ?? "";
  const facets = (turn.route_intents ?? turn.question_facets).join(",");
  const observationPeriod = turnPeriodLabel(turn.locale, turn);
  const evidenceCoverage = evidenceCoverageLabel(turn.locale, turn, domain);
  const evidenceRevision = evidenceRevisionLabel(turn.locale, turn, domain);
  return <div className="dialogueExchange" data-dialogue-turn-id={turn.turn_id}>
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
      data-semantic-context-relation={turn.context_relation ?? "GENUINELY_AMBIGUOUS"}
      data-route-disposition={turn.route_disposition ?? "CONTINUE"}
      data-primary-authority={turn.primary_authority ?? "UNBOUND"}
      data-btc-side-state-type={turn.btc_side_state_type ?? "NOT_APPLICABLE"}
      data-bridge-result={turn.bridge_result ?? "NOT_APPLICABLE"}
      data-relation-intent-detected={turn.relation_intent_detected ? "true" : "false"}
      data-relation-resolution={turn.relation_resolution ?? "SINGLE_DOMAIN"}
      data-clarification-target={turn.clarification_target ?? "NOT_APPLICABLE"}
      data-anti-loop-blocked={turn.anti_loop_blocked ? "true" : "false"}
      data-show-next-question={turn.show_next_question ? "true" : "false"}
      data-show-clarification={turn.show_clarification ? "true" : "false"}
    >
      <div className="turnRole"><FieldAnchorGlyph className="turnGlyph"/><span>Cosmographer</span></div>
      <div className="turnBody">
        <header className="answerHeader">
          <p className="eyebrow">{modeLabel(turn.locale, turn)}</p>
          {turn.headline && <h2>{turn.headline}</h2>}
        </header>
        {turn.direct_answer && <p className="answerLead" data-answer-direct="true">{turn.direct_answer}</p>}
        {(turn.sections ?? []).length > 0 && <AnswerSections turn={turn}/>} 
        {turn.source_binding_changed && <p className="sourceChangedNote" data-source-changed="true">
          {turn.locale === "ru" ? "Market Snapshot обновился между ходами; рыночная часть перестроена." : "Market Snapshot changed between turns; the market layer was rebuilt."}
        </p>}
        {turn.show_clarification && turn.clarification_text && <aside className="answerClarification" data-route-surface="clarification">
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
        <details open={newest} className={newest ? "answerSource" : "answerSourceHistory"} data-answer-source-boundary="true">
          <summary>{turn.locale === "ru" ? "Источники, период и граница" : "Sources, period, and boundary"}</summary>
          <div>
            <span>{publicDomainLabel(turn.locale, domain)}</span>
            <dl className="answerEvidenceMeta" data-evidence-metadata="distinct-fields">
              <div data-evidence-field="observation-period" data-evidence-value={observationPeriod}>
                <dt>{turn.locale === "ru" ? "Период наблюдения" : "Observation period"}</dt>
                <dd>{observationPeriod}</dd>
              </div>
              <div data-evidence-field="evidence-coverage" data-evidence-value={evidenceCoverage}>
                <dt>{turn.locale === "ru" ? "Покрытие evidence" : "Evidence coverage"}</dt>
                <dd>{evidenceCoverage}</dd>
              </div>
              <div data-evidence-field="evidence-revision-or-generated-time" data-evidence-value={evidenceRevision}>
                <dt>{turn.locale === "ru" ? "Ревизия / время создания evidence" : "Evidence revision / generated time"}</dt>
                <dd>{evidenceRevision}</dd>
              </div>
            </dl>
            <span>{turn.proof_label ?? (turn.proof_available
              ? (turn.locale === "ru" ? "Доказательства доступны" : "Evidence available")
              : (turn.locale === "ru" ? "Доказательства недоступны" : "Evidence unavailable"))}</span>
            {turn.source_boundary && <span>{turn.source_boundary}</span>}
          </div>
        </details>
      </div>
    </article>
  </div>;
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
    props.runtimeDecision,
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
              props.route.context_relation === "RETURN_TO_PREVIOUS_TOPIC",
            ),
          )
        : currentTurn;
      session = upsertBtcDialogueTurn(session, turn);
    }
    setTurns(session.turns);
    setCompacted(session.compacted);
    setHydrated(true);
  }, [currentTurn, deploymentSourceSha, locale]);

  useEffect(() => {
    if (!hydrated || !newestRef.current) return;
    if ("scrollRestoration" in window.history) window.history.scrollRestoration = "manual";
    const focusNewest = () => {
      const node = newestRef.current;
      if (!node) return;
      node.focus({ preventScroll: true });
      const absoluteTop = window.scrollY + node.getBoundingClientRect().top;
      window.scrollTo({ top: Math.max(0, absoluteTop - 18), behavior: "auto" });
    };
    focusNewest();
    const firstFrame = window.requestAnimationFrame(() => window.requestAnimationFrame(focusNewest));
    const guard = window.setTimeout(focusNewest, 100);
    return () => {
      window.cancelAnimationFrame(firstFrame);
      window.clearTimeout(guard);
    };
  }, [hydrated, turns.length]);

  const latestTurn = turns.at(-1) ?? null;
  const contextSafe = !latestTurn || (
    latestTurn.context_safe_composer !== false &&
    (
      latestTurn.route_disposition === "CONTINUE" ||
      latestTurn.stop_reason === "REPEATED_ROUTE"
    )
  );
  const clarificationPrompt = latestTurn?.route_disposition === "CLARIFY"
    ? latestTurn.clarification_text ?? (ru ? "Уточните предмет вопроса." : "Clarify the question subject.")
    : null;
  const clarificationPeriod = latestTurn
    ? `${latestTurn.time_start ?? ""}:${latestTurn.time_end ?? ""}`
    : "";
  const derivedClarificationOrigin = latestTurn?.route_disposition === "CLARIFY"
    ? [
        "origin",
        latestTurn.effective_question.trim().toLowerCase().replace(/\s+/g, " "),
        (latestTurn.route_subject ?? latestTurn.question_class ?? "unknown").trim().toLowerCase(),
        clarificationPeriod,
      ].join("\u241f")
    : null;
  const pendingClarificationFields = latestTurn?.route_disposition === "CLARIFY" &&
    latestTurn.clarification_target &&
    latestTurn.clarification_fingerprint
    ? {
        pof: props.pendingClarificationOriginFingerprint ?? derivedClarificationOrigin ?? latestTurn.clarification_fingerprint,
        pct: latestTurn.clarification_target,
        pcd: latestTurn.route_domain ?? "unsupported",
        pcs: latestTurn.route_subject ?? latestTurn.question_class ?? "unknown",
        pct0: latestTurn.time_start ?? "",
        pct1: latestTurn.time_end ?? "",
      }
    : null;
  const contextTurn = contextSafe ? latestContextTurn(turns) : null;
  const contextTurnIndex = contextTurn
    ? turns.findIndex((turn) => turn.turn_id === contextTurn.turn_id)
    : -1;
  const returnContextTurn = contextTurnIndex > 0
    ? turns[contextTurnIndex - 1] ?? null
    : turns.length > 1
      ? turns[turns.length - 2] ?? null
      : null;
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
  const returnContextFields = returnContextTurn ? {
    rcc: BTC_COSMOGRAPHER_CONTEXT_SCHEMA,
    rcd: returnContextTurn.route_domain ?? "unsupported",
    rcs: returnContextTurn.route_subject ?? returnContextTurn.question_class ?? "unknown",
    rci: (returnContextTurn.route_intents ?? returnContextTurn.question_facets).join(","),
    rca: returnContextTurn.answer_state === "BOUNDED" ? "LIMITED" : returnContextTurn.answer_state,
    rcm: returnContextTurn.market_question_class ?? returnContextTurn.question_class ?? "",
    rct0: returnContextTurn.time_start ?? returnContextTurn.observation_date ?? "",
    rct1: returnContextTurn.time_end ?? returnContextTurn.observation_date ?? "",
    rcb: returnContextTurn.source_snapshot_generated_at_utc ?? "",
  } : null;
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
  const hasConversation = turns.length > 0;
  const olderTurns = turns.length > 4 ? turns.slice(0, -4) : [];
  const visibleTurns = turns.slice(-4);

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
    data-deployment-head-sha={deploymentSourceSha ?? "UNAVAILABLE"}
    data-runtime-schema={BTC_EVIDENCE_NAVIGATION_RUNTIME_SCHEMA}
    data-session-schema={BTC_DIALOGUE_SESSION_SCHEMA}
    data-cache-policy="no-store"
  >
    <header className="liveDialogueTopbar">
      <a className="liveBackLink" href={`/crypto-astro/btc?lang=${locale}`}>← {ru ? "BTC Field" : "BTC Field"}</a>
      <div className="liveIdentity"><FieldAnchorGlyph className="liveIdentityGlyph"/><span>Market Cosmographer</span></div>
      <a className="liveLocaleLink" href={`/crypto-astro/btc/live?lang=${otherLocale}`}>{otherLocale.toUpperCase()}</a>
    </header>

    <section className="liveDialogueShell" aria-labelledby="btc-cosmographer-title">
      <header className="liveDialogueIntro">
        <p className="eyebrow">Market Cosmographer</p>
        <h1 id="btc-cosmographer-title">{ru ? "Чтение поля BTC" : "BTC Field Read"}</h1>
        <p>{ru
          ? "Спросите, что изменилось, почему это важно, что может произойти дальше и какие условия изменят чтение."
          : "Ask what changed, why it matters, what may happen next, and which conditions would change the read."}</p>
        <div className="liveTrustLine">
          <span>{sourceState(locale, sourceContext)}</span>
          {sourceContext.generated_at_utc && <span data-market-snapshot-generated-at>{ru ? "Market Snapshot создан" : "Market Snapshot generated"} · {formatBtcUtcTimestamp(locale, sourceContext.generated_at_utc)}</span>}
          <span>{ru ? "Источники и границы доступны" : "Sources and boundaries available"}</span>
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

      {hasConversation && <section className="liveThread" role="log" aria-live="polite" aria-label={ru ? "Диалог поля BTC" : "BTC field dialogue"}>
        {olderTurns.length > 0 && <details className="olderTurnsDisclosure">
          <summary>{ru ? `Предыдущие ходы · ${olderTurns.length}` : `Earlier turns · ${olderTurns.length}`}</summary>
          <div>{olderTurns.map((turn) => <Exchange key={turn.turn_id} turn={turn} newest={false} newestRef={newestRef}/>)}</div>
        </details>}
        {visibleTurns.map((turn, index) => <Exchange
          key={turn.turn_id}
          turn={turn}
          newest={index === visibleTurns.length - 1}
          newestRef={newestRef}
        />)}
      </section>}

      {contextTurn && <div
        className="activeContextLine"
        aria-label={ru ? "Активный контекст диалога" : "Active dialogue context"}
        data-active-context="true"
        data-active-subject={contextTurn.route_subject ?? contextTurn.question_class ?? "unknown"}
        data-active-period={turnPeriodLabel(locale, contextTurn)}
        data-active-context-relation={contextTurn.context_relation ?? "GENUINELY_AMBIGUOUS"}
      >
        <span><b>{ru ? "Активный предмет" : "Active subject"}</b> · {publicSubjectLabel(locale, contextTurn.route_subject ?? contextTurn.question_class ?? "unknown")}</span>
        <span><b>{ru ? "Период" : "Period"}</b> · {turnPeriodLabel(locale, contextTurn)}</span>
        <span><b>{ru ? "Контекст" : "Context"}</b> · {contextRelationLabel(locale, contextTurn.context_relation)}</span>
      </div>}

      {!hasConversation && <aside className="exampleRoutes staticExampleRoutes" aria-labelledby="bitcoin-origins-prepared-title" data-bitcoin-origins-prepared="true">
        <p className="eyebrow">{ru ? "История Bitcoin · проверенные источники" : "Bitcoin history · verified sources"}</p>
        <h2 id="bitcoin-origins-prepared-title">{ru ? "Пять вопросов о происхождении Bitcoin и Сатоши" : "Five questions about Bitcoin's origins and Satoshi"}</h2>
        <p>{ru
          ? "Документированные факты, поддерживаемые выводы, спорные версии и неизвестное показаны раздельно."
          : "Documented facts, supported inference, disputed claims, and unknowns are shown separately."}</p>
        <div className="exampleRouteList">
          {BTC_ORIGINS_PREPARED_QUESTIONS[locale].map((item, index) => {
            const params = [`lang=${locale}`, `q=${encodeURIComponent(item.question)}`];
            if (initialDate) params.push(`d=${encodeURIComponent(initialDate)}`);
            return <a
              key={item.id}
              href={`/crypto-astro/btc/live?${params.join("&")}`}
              data-origin-question={item.id}
              data-origin-subject={item.subject}
            >
              <span>{String(index + 1).padStart(2, "0")}</span>
              <b>{item.question}</b>
              <i aria-hidden="true">→</i>
            </a>;
          })}
        </div>
      </aside>}

      {hydrated && <form className={hasConversation ? "liveComposer liveComposerAfterAnswer" : "liveComposer liveComposerPrimary"} method="get" action="/crypto-astro/btc/live" data-session-hydrated="true">
        <input type="hidden" name="lang" value={locale}/>
        {pendingClarificationFields && Object.entries(pendingClarificationFields).map(([name, value]) => <input key={name} type="hidden" name={name} value={value}/>) }
        {retainedAstroFields && Object.entries(retainedAstroFields).map(([name, value]) => <input key={name} type="hidden" name={name} value={value}/>) }
    {returnContextFields && Object.entries(returnContextFields).map(([name, value]) => <input key={name} type="hidden" name={name} value={value}/>) }
    {Object.entries(contextFields).map(([name, value]) => <input key={name} type="hidden" name={name} value={value}/>) }
        <label>
          <span>{clarificationPrompt ?? (hasConversation
            ? (ru ? "Продолжить или задать новый предмет" : "Continue or introduce a new subject")
            : (ru ? "Ваш вопрос о поле BTC" : "Your question about the BTC field"))}</span>
          <textarea
            name="q"
            rows={3}
            minLength={2}
            maxLength={500}
            required
            placeholder={clarificationPrompt ?? (hasConversation
              ? (ru ? "Что изменит это чтение? Как это совпадает со структурой BTC? Какие дни наиболее напряжённые?" : "What would change this read? How does it coincide with BTC structure? Which days are most intense?")
              : (ru ? "Что происходит с BTC сегодня? Какие аспекты планет наиболее напряжённые в 2026?" : "What is happening with BTC today? Which planetary aspects are most intense in 2026?"))}
          />
        </label>
        <div className="liveComposerControls">
          <label>
            <span>{ru ? "Дата наблюдения · необязательно" : "Observation date · optional"}</span>
            <input name="d" type="date" defaultValue={initialDate}/>
          </label>
          <button type="submit">{hasConversation ? (ru ? "Продолжить чтение" : "Continue the read") : (ru ? "Получить чтение" : "Get the read")}</button>
        </div>
      </form>}
      <p className="liveBoundary">{ru
        ? "Без регистрации · Без оплаты · Память только этой вкладки · Не финансовый совет и не торговый сигнал · Прогнозные окна только при валидированном методе и условиях"
        : "No account · No payment · Memory only in this tab · Not financial advice or a trading signal · Forecast windows only with a validated method and conditions"}</p>
    </section>
  </main>;
}
