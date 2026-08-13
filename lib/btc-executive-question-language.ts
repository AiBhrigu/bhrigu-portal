import type {
  BtcEnvelopeQuestionClass,
  BtcMarketEnvelope,
  BtcSignalDirection,
  BtcSynthesisState,
} from "./btc-market-envelope";
import type { BtcPublicLocale } from "./btc-public-language-contract";

export const BTC_EXECUTIVE_QUESTION_LANGUAGE_SCHEMA =
  "btc_executive_question_language_v0_1" as const;

export type BtcQuestionFacet =
  | "change"
  | "reason"
  | "confirmation"
  | "watch"
  | "comparison"
  | "temporal_context";

export type BtcQuestionSpecificAnswerState = "CONFIRMED" | "SPLIT" | "LIMITED";

export type BtcQuestionSpecificAnswer = {
  question_class: BtcEnvelopeQuestionClass;
  question_facets: BtcQuestionFacet[];
  answer_state: BtcQuestionSpecificAnswerState;
  headline: string;
  direct_answer: string;
  evidence_lines: string[];
  contradiction_or_limit: string;
  what_would_change_the_read: string;
  source_boundary: string;
};

const EXECUTIVE_FOCUS: Record<BtcPublicLocale, Record<BtcEnvelopeQuestionClass, string>> = {
  en: {
    btc_gravity: "This read centers on BTC dominance and whether wider participation supports or diverges from that leadership.",
    market_structure: "This read checks whether regime, Field Score, market capitalization and liquidity describe the same structure.",
    liquidity: "This read tests whether stablecoin share, DeFi TVL and DEX activity support the current BTC context.",
    market_participation_rotation: "This read focuses on whether altcoin breadth and ETH rotation are broadening participation beyond BTC.",
    change_memory: "This read compares the current accepted snapshot with the previous compatible checkpoint.",
    temporal_pressure: "This read isolates the selected date's bounded temporal context while keeping market facts tied to the accepted snapshot.",
    general_btc_field: "This read combines BTC gravity, structure, liquidity, participation and accepted change memory into one bounded overview.",
  },
  ru: {
    btc_gravity: "Это чтение сосредоточено на доминировании BTC и на том, подтверждает ли более широкое участие его лидерство или расходится с ним.",
    market_structure: "Это чтение проверяет, описывают ли режим, Field Score, капитализация и ликвидность одну и ту же структуру.",
    liquidity: "Это чтение проверяет, поддерживают ли доля стейблкоинов, DeFi TVL и активность DEX текущий контекст BTC.",
    market_participation_rotation: "Это чтение показывает, расширяют ли ширина альткоинов и ротация ETH участие за пределами BTC.",
    change_memory: "Это чтение сравнивает текущий принятый снимок с предыдущей совместимой контрольной точкой.",
    temporal_pressure: "Это чтение отделяет ограниченный временной контекст выбранной даты, сохраняя рыночные факты привязанными к принятому снимку.",
    general_btc_field: "Это чтение объединяет гравитацию BTC, структуру, ликвидность, участие и принятую память изменений в один ограниченный обзор.",
  },
};

const SYNTHESIS_CLOSE: Record<BtcPublicLocale, Record<BtcSynthesisState, string>> = {
  en: {
    CONFIRMATION: "The routed modules reinforce the same bounded interpretation.",
    DIVERGENCE: "The routed modules do not move as one field; that split is part of the result.",
    INSUFFICIENT_EVIDENCE: "The available evidence does not support a stronger conclusion.",
  },
  ru: {
    CONFIRMATION: "Маршрутизированные модули поддерживают одну ограниченную интерпретацию.",
    DIVERGENCE: "Маршрутизированные модули не движутся как единое поле; это расхождение является частью результата.",
    INSUFFICIENT_EVIDENCE: "Доступная доказательность не поддерживает более сильный вывод.",
  },
};

export function formatBtcQuestionExecutiveLead(
  locale: BtcPublicLocale,
  questionClass: BtcEnvelopeQuestionClass,
  state: BtcSynthesisState,
): string {
  return `${EXECUTIVE_FOCUS[locale][questionClass]} ${SYNTHESIS_CLOSE[locale][state]}`;
}

const WATCH_SUBJECT: Record<BtcPublicLocale, Record<BtcEnvelopeQuestionClass, string>> = {
  en: {
    btc_gravity: "BTC dominance and alt-breadth changes",
    market_structure: "regime, Field Score, market-cap and liquidity changes",
    liquidity: "stablecoin-share, DeFi TVL and DEX-volume changes",
    market_participation_rotation: "alt-breadth and ETH-rotation changes",
    change_memory: "Snapshot Delta",
    temporal_pressure: "Snapshot Delta; the selected date does not create future market facts",
    general_btc_field: "changes in BTC gravity, liquidity and participation",
  },
  ru: {
    btc_gravity: "изменениями доминирования BTC и ширины альткоинов",
    market_structure: "изменениями режима, Field Score, капитализации и ликвидности",
    liquidity: "изменениями доли стейблкоинов, DeFi TVL и объёма DEX",
    market_participation_rotation: "изменениями ширины альткоинов и ротации ETH",
    change_memory: "Snapshot Delta",
    temporal_pressure: "Snapshot Delta; выбранная дата не создаёт будущие рыночные факты",
    general_btc_field: "изменениями гравитации BTC, ликвидности и участия",
  },
};

export function formatBtcQuestionWatchNext(
  locale: BtcPublicLocale,
  questionClass: BtcEnvelopeQuestionClass,
  timestamp: string,
): string {
  const subject = WATCH_SUBJECT[locale][questionClass];
  return locale === "ru"
    ? `Наблюдайте за следующими принятыми ${subject} после ${timestamp}.`
    : `Watch the next accepted ${subject} after ${timestamp}.`;
}

export function classifyBtcQuestionFacets(question: string): BtcQuestionFacet[] {
  const q = question.toLowerCase();
  const facets: BtcQuestionFacet[] = [];
  if (/what changed|change|changed|since|delta|что измен|изменени/.test(q)) facets.push("change");
  if (/why|matter|reason|почему|важно|причин/.test(q)) facets.push("reason");
  if (/confirm|support|agree|подтверж|соглас/.test(q)) facets.push("confirmation");
  if (/watch|next|condition|наблюд|дальше|услов/.test(q)) facets.push("watch");
  if (/compare|versus|vs\b|relative|сравн|против/.test(q)) facets.push("comparison");
  if (/date|temporal|timing|phase|tension|cycle|дата|временн|фаз|напряж|цикл/.test(q)) facets.push("temporal_context");
  return facets.length ? Array.from(new Set(facets)) : ["confirmation"];
}

function fmtNumber(value: number, digits = 2): string {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: digits }).format(value);
}

function fmtSignedPct(value: number, digits = 1): string {
  const formatted = fmtNumber(Math.abs(value), digits);
  return `${value > 0 ? "+" : value < 0 ? "−" : ""}${formatted}%`;
}

function moduleState(envelope: BtcMarketEnvelope, moduleId: string): BtcSignalDirection {
  return envelope.phi_geometry.nodes.find((node) => node.id === moduleId)?.state ?? "UNAVAILABLE";
}

function answerState(envelope: BtcMarketEnvelope): BtcQuestionSpecificAnswerState {
  const [a, b] = envelope.route.primary_modules.map((id) => moduleState(envelope, id));
  if (a === "UNAVAILABLE" || b === "UNAVAILABLE") return "LIMITED";
  if (a === "BOUNDED" || b === "BOUNDED") return "SPLIT";
  if ((a === "UP" && b === "DOWN") || (a === "DOWN" && b === "UP")) return "SPLIT";
  if (a === "UNCHANGED" && b === "UNCHANGED") return "LIMITED";
  return "CONFIRMED";
}

const HEADLINES: Record<BtcPublicLocale, Record<BtcEnvelopeQuestionClass, Record<BtcQuestionSpecificAnswerState, string>>> = {
  en: {
    btc_gravity: { CONFIRMED: "BTC leadership is supported", SPLIT: "BTC leadership is not fully confirmed", LIMITED: "BTC leadership evidence is limited" },
    liquidity: { CONFIRMED: "Liquidity conditions align", SPLIT: "Liquidity conditions are internally split", LIMITED: "Liquidity evidence is limited" },
    market_structure: { CONFIRMED: "Market structure is internally consistent", SPLIT: "Market structure is not moving as one system", LIMITED: "Market-structure evidence is limited" },
    market_participation_rotation: { CONFIRMED: "Participation is broadening", SPLIT: "Participation remains selective", LIMITED: "Participation evidence is limited" },
    change_memory: { CONFIRMED: "Accepted memory shows a coherent transition", SPLIT: "Accepted memory records opposing transitions", LIMITED: "Accepted memory cannot support a strong transition" },
    temporal_pressure: { CONFIRMED: "The selected date has a bounded temporal context", SPLIT: "Temporal context and market structure remain separate", LIMITED: "Temporal context is limited" },
    general_btc_field: { CONFIRMED: "The BTC field has a coherent center", SPLIT: "The BTC field is structurally mixed", LIMITED: "The BTC field remains inconclusive" },
  },
  ru: {
    btc_gravity: { CONFIRMED: "Лидерство BTC подтверждается", SPLIT: "Лидерство BTC подтверждено не полностью", LIMITED: "Доказательность лидерства BTC ограничена" },
    liquidity: { CONFIRMED: "Условия ликвидности согласованы", SPLIT: "Условия ликвидности внутренне расходятся", LIMITED: "Доказательность ликвидности ограничена" },
    market_structure: { CONFIRMED: "Структура рынка внутренне согласована", SPLIT: "Структура рынка не движется как единая система", LIMITED: "Доказательность структуры рынка ограничена" },
    market_participation_rotation: { CONFIRMED: "Участие рынка расширяется", SPLIT: "Участие остаётся выборочным", LIMITED: "Доказательность участия ограничена" },
    change_memory: { CONFIRMED: "Принятая память показывает согласованный переход", SPLIT: "Принятая память фиксирует противоположные переходы", LIMITED: "Принятая память не поддерживает сильный вывод" },
    temporal_pressure: { CONFIRMED: "Выбранная дата имеет ограниченный временной контекст", SPLIT: "Временной контекст и структура рынка остаются раздельными", LIMITED: "Временной контекст ограничен" },
    general_btc_field: { CONFIRMED: "Поле BTC имеет согласованный центр", SPLIT: "Поле BTC структурно смешано", LIMITED: "Поле BTC остаётся неопределённым" },
  },
};

function classEvidence(locale: BtcPublicLocale, envelope: BtcMarketEnvelope, observationDate: string): string[] {
  const c = envelope.current;
  const ru = locale === "ru";
  switch (envelope.question_class) {
    case "btc_gravity":
      return [
        `${ru ? "Доминирование BTC" : "BTC dominance"}: ${fmtNumber(c.btc_dominance_pct)}%.`,
        `${ru ? "Ширина альткоинов 24ч / 7д" : "Alt breadth 24h / 7d"}: ${fmtNumber(c.alt_breadth_24h_pct, 1)}% / ${fmtNumber(c.alt_breadth_7d_pct, 1)}%.`,
        `${ru ? "Якорь ротации ETH" : "ETH rotation anchor"}: ${fmtNumber(c.eth_rotation_anchor_pct, 1)}%.`,
      ];
    case "liquidity":
      return [
        `${ru ? "Доля стейблкоинов" : "Stablecoin share"}: ${fmtNumber(c.stablecoin_share_pct)}%.`,
        `DeFi TVL: $${fmtNumber(c.defi_tvl_usd, 0)}.`,
        `${ru ? "Объём DEX за 24ч" : "DEX volume 24h"}: $${fmtNumber(c.dex_volume_24h_usd, 0)} · ${c.liquidity_context_state}.`,
      ];
    case "market_structure":
      return [
        `${ru ? "Режим" : "Regime"}: ${c.regime} · Market Field Score ${fmtNumber(c.market_field_score, 1)}.`,
        `${ru ? "Общая капитализация" : "Total market cap"}: $${fmtNumber(c.total_market_cap_usd, 0)}.`,
        `${ru ? "Изменение капитализации 24ч" : "Market-cap change 24h"}: ${fmtNumber(c.market_cap_change_24h_pct)}% · ${ru ? "концентрация top-10" : "top-10 concentration"} ${fmtNumber(c.top_10_flow_concentration_pct, 1)}%.`,
      ];
    case "market_participation_rotation":
      return [
        `${ru ? "Ширина альткоинов 24ч / 7д" : "Alt breadth 24h / 7d"}: ${fmtNumber(c.alt_breadth_24h_pct, 1)}% / ${fmtNumber(c.alt_breadth_7d_pct, 1)}%.`,
        `${ru ? "Якорь ротации ETH" : "ETH rotation anchor"}: ${fmtNumber(c.eth_rotation_anchor_pct, 1)}%.`,
        `${ru ? "Концентрация top-10" : "Top-10 concentration"}: ${fmtNumber(c.top_10_flow_concentration_pct, 1)}%.`,
      ];
    case "change_memory": {
      const relevant = envelope.memory.metrics
        .filter((metric) => metric.direction !== "UNCHANGED" || metric.transition !== "UNCHANGED")
        .slice(0, 3);
      return relevant.length
        ? relevant.map((metric) => `${metric.metric_id}: ${metric.previous_value} → ${metric.current_value}${metric.display_delta ? ` (${metric.display_delta})` : ""}.`)
        : [ru ? "Новый сопоставимый переход не подтверждён." : "No new comparable transition is confirmed."];
    }
    case "temporal_pressure":
      return [
        `${ru ? "Дата наблюдения" : "Observation date"}: ${observationDate}.`,
        `${ru ? "Временное состояние" : "Temporal state"}: ${c.bounded_temporal_context.state} · ${c.bounded_temporal_context.label}.`,
        c.bounded_temporal_context.harmonic_tension === null
          ? (ru ? "Числовое временное напряжение недоступно." : "Numeric temporal tension is unavailable.")
          : `${ru ? "Гармоническое напряжение" : "Harmonic tension"}: ${fmtNumber(c.bounded_temporal_context.harmonic_tension, 4)}.`,
      ];
    case "general_btc_field":
      return [
        `${ru ? "Принятая цена BTC" : "Accepted BTC price"}: $${fmtNumber(c.price_usd)} · 24h ${fmtSignedPct(c.change_24h_pct)} · 7d ${fmtSignedPct(c.change_7d_pct)} · 30d ${fmtSignedPct(c.change_30d_pct)}.`,
        `${ru ? "Гравитация BTC" : "BTC gravity"}: ${fmtNumber(c.btc_dominance_pct)}% dominance.`,
        `${ru ? "Структура" : "Structure"}: ${c.regime} · Field Score ${fmtNumber(c.market_field_score, 1)}.`,
        `${ru ? "Ликвидность и участие" : "Liquidity and participation"}: ${c.liquidity_context_state} · breadth ${fmtNumber(c.alt_breadth_24h_pct, 1)}% / ${fmtNumber(c.alt_breadth_7d_pct, 1)}%.`,
      ];
  }
}

function directAnswer(locale: BtcPublicLocale, envelope: BtcMarketEnvelope, state: BtcQuestionSpecificAnswerState, facets: BtcQuestionFacet[]): string {
  const ru = locale === "ru";
  const asksConfirmation = facets.includes("confirmation");
  const prefix = asksConfirmation
    ? state === "CONFIRMED" ? (ru ? "Да — в пределах принятых данных." : "Yes — within the accepted evidence.")
      : state === "SPLIT" ? (ru ? "Не полностью: релевантные сигналы расходятся." : "Not fully: the relevant signals diverge.")
      : (ru ? "Пока нет: доказательности недостаточно." : "Not yet: the evidence is insufficient.")
    : state === "CONFIRMED" ? (ru ? "Релевантные сигналы согласованы." : "The relevant signals are aligned.")
      : state === "SPLIT" ? (ru ? "Релевантные сигналы дают раздельное чтение." : "The relevant signals produce a split reading.")
      : (ru ? "Сильный вывод сейчас не поддерживается." : "A strong conclusion is not supported now.");
  const marketFactLead = envelope.question_class === "general_btc_field"
    ? (ru
        ? `Последняя принятая цена BTC: $${fmtNumber(envelope.current.price_usd)} · 24ч ${fmtSignedPct(envelope.current.change_24h_pct)} · Snapshot ${envelope.current.source_generated_at_utc}.`
        : `Latest accepted BTC price: $${fmtNumber(envelope.current.price_usd)} · 24h ${fmtSignedPct(envelope.current.change_24h_pct)} · Snapshot ${envelope.current.source_generated_at_utc}.`)
    : "";
  return `${marketFactLead}${marketFactLead ? " " : ""}${prefix} ${EXECUTIVE_FOCUS[locale][envelope.question_class]}`;
}

export function buildBtcQuestionSpecificAnswer(
  locale: BtcPublicLocale,
  question: string,
  envelope: BtcMarketEnvelope,
  observationDate: string,
): BtcQuestionSpecificAnswer {
  const facets = classifyBtcQuestionFacets(question);
  const state = answerState(envelope);
  const ru = locale === "ru";
  const primary = envelope.route.primary_modules.map((id) => `${id}:${moduleState(envelope, id)}`).join(" / ");
  return {
    question_class: envelope.question_class,
    question_facets: facets,
    answer_state: state,
    headline: HEADLINES[locale][envelope.question_class][state],
    direct_answer: directAnswer(locale, envelope, state, facets),
    evidence_lines: classEvidence(locale, envelope, observationDate),
    contradiction_or_limit: state === "CONFIRMED"
      ? (ru ? `Главное ограничение: это подтверждение относится только к ведущим модулям ${primary}.` : `Main limit: confirmation applies only to the routed primary modules ${primary}.`)
      : state === "SPLIT"
        ? (ru ? `Расхождение находится внутри ведущего маршрута ${primary}; поддерживающие модули не скрывают этот конфликт.` : `The split is inside the primary route ${primary}; supporting modules do not erase that conflict.`)
        : (ru ? `Один из ведущих модулей недоступен, нейтрален или не поддерживает направленный вывод: ${primary}.` : `A primary module is unavailable, neutral, or cannot support a directional conclusion: ${primary}.`),
    what_would_change_the_read: formatBtcQuestionWatchNext(locale, envelope.question_class, envelope.current.source_generated_at_utc),
    source_boundary: ru
      ? "Числа взяты из принятого Snapshot; ответ не является прогнозом, ценовой целью или торговым сигналом. Новый вопрос создаёт новое независимое чтение и не использует память диалога."
      : "Numbers come from the accepted Snapshot; this is not a forecast, price target, or trading signal. Each submitted question creates a new independent read and does not use dialogue memory.",
  };
}