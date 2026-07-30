import type {
  BtcEnvelopeQuestionClass,
  BtcMarketEnvelope,
  BtcSignalDirection,
  BtcSynthesisState,
} from "./btc-market-envelope";
import type { BtcPublicLocale } from "./btc-public-language-contract";

export const BTC_EXECUTIVE_QUESTION_LANGUAGE_SCHEMA =
  "btc_executive_question_language_v0_2" as const;

export type BtcQuestionFacet =
  | "change"
  | "reason"
  | "confirmation"
  | "watch"
  | "comparison"
  | "temporal_context";

export type BtcQuestionSpecificAnswerState = "CONFIRMED" | "SPLIT" | "LIMITED";

export type BtcQuestionAnswerContext = {
  context_relation: string | null;
  prior_question_class: BtcEnvelopeQuestionClass | null;
  resolved_facets: BtcQuestionFacet[];
  prior_answer_state: BtcQuestionSpecificAnswerState | null;
  prior_snapshot_generated_at_utc: string | null;
};

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
  if (/why|matter|reason|important|priority|indicator|metric|почему|важно|важнее|показател|метрик|причин/.test(q)) facets.push("reason");
  if (/confirm|support|agree|подтверж|соглас/.test(q)) facets.push("confirmation");
  if (/watch|next|condition|наблюд|дальше|услов/.test(q)) facets.push("watch");
  if (/compare|versus|vs\b|relative|сравн|против/.test(q)) facets.push("comparison");
  if (/date|temporal|timing|phase|tension|cycle|дата|временн|фаз|напряж|цикл/.test(q)) facets.push("temporal_context");
  return facets.length ? Array.from(new Set(facets)) : ["confirmation"];
}

function mergeFacets(question: string, context?: BtcQuestionAnswerContext): BtcQuestionFacet[] {
  return Array.from(new Set([
    ...classifyBtcQuestionFacets(question),
    ...(context?.resolved_facets ?? []),
  ]));
}

function fmtNumber(value: number, digits = 2): string {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: digits }).format(value);
}

function moduleState(envelope: BtcMarketEnvelope, moduleId: string): BtcSignalDirection {
  return envelope.phi_geometry.nodes.find((node) => node.id === moduleId)?.state ?? "UNAVAILABLE";
}

function answerState(envelope: BtcMarketEnvelope, context?: BtcQuestionAnswerContext): BtcQuestionSpecificAnswerState {
  const [a, b] = envelope.route.primary_modules.map((id) => moduleState(envelope, id));
  let current: BtcQuestionSpecificAnswerState;
  if (a === "UNAVAILABLE" || b === "UNAVAILABLE") current = "LIMITED";
  else if (a === "BOUNDED" || b === "BOUNDED") current = "SPLIT";
  else if ((a === "UP" && b === "DOWN") || (a === "DOWN" && b === "UP")) current = "SPLIT";
  else if (a === "UNCHANGED" && b === "UNCHANGED") current = "LIMITED";
  else current = "CONFIRMED";

  const relationKeepsPriorRead = [
    "EXPLAIN_PRIOR",
    "PRIORITY_WITHIN_PRIOR",
    "CHANGE_CONDITION",
    "EXPLAIN_CONTRADICTION",
  ].includes(context?.context_relation ?? "");
  if (
    context?.prior_answer_state === "SPLIT" &&
    context.prior_question_class === envelope.question_class &&
    relationKeepsPriorRead
  ) return "SPLIT";
  return current;
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

type MemoryMetric = BtcMarketEnvelope["memory"]["metrics"][number];

const MEMORY_PRIORITY = [
  "market_field_score",
  "btc_gravity_pct",
  "stablecoin_share_pct",
  "alt_breadth_24h_pct",
  "alt_breadth_7d_pct",
  "liquidity_context_state",
  "defi_tvl_usd",
  "regime_label",
];

const METRIC_LABEL: Record<BtcPublicLocale, Record<string, string>> = {
  en: {
    market_field_score: "Market Field Score",
    btc_gravity_pct: "BTC dominance",
    stablecoin_share_pct: "Stablecoin share",
    alt_breadth_24h_pct: "Alt breadth 24h",
    alt_breadth_7d_pct: "Alt breadth 7d",
    liquidity_context_state: "Liquidity context",
    defi_tvl_usd: "DeFi TVL",
    regime_label: "Market regime",
  },
  ru: {
    market_field_score: "Market Field Score",
    btc_gravity_pct: "Доминирование BTC",
    stablecoin_share_pct: "Доля стейблкоинов",
    alt_breadth_24h_pct: "Ширина альткоинов 24ч",
    alt_breadth_7d_pct: "Ширина альткоинов 7д",
    liquidity_context_state: "Контекст ликвидности",
    defi_tvl_usd: "DeFi TVL",
    regime_label: "Режим рынка",
  },
};

const METRIC_REASON: Record<BtcPublicLocale, Record<string, string>> = {
  en: {
    market_field_score: "it compresses regime, breadth and liquidity into the main structural checkpoint",
    btc_gravity_pct: "it shows whether capital remains centered on BTC or participation is diffusing",
    stablecoin_share_pct: "it is the closest accepted proxy for deployable crypto liquidity",
    alt_breadth_24h_pct: "it shows whether participation is broadening now rather than only at the BTC center",
    alt_breadth_7d_pct: "it distinguishes a durable participation shift from a one-day move",
    liquidity_context_state: "it states whether the liquidity membrane confirms or weakens the structural read",
    defi_tvl_usd: "it tests whether on-chain capital depth supports the liquidity narrative",
    regime_label: "it marks whether the field has crossed into a different structural state",
  },
  ru: {
    market_field_score: "он сводит режим, ширину и ликвидность в главный структурный контрольный показатель",
    btc_gravity_pct: "оно показывает, остаётся ли капитал сосредоточен вокруг BTC или участие рассеивается",
    stablecoin_share_pct: "это ближайший принятый индикатор доступной крипторынку ликвидности",
    alt_breadth_24h_pct: "она показывает, расширяется ли участие сейчас, а не только в центре BTC",
    alt_breadth_7d_pct: "она отделяет устойчивый сдвиг участия от однодневного движения",
    liquidity_context_state: "он показывает, подтверждает ли мембрана ликвидности структурное чтение или ослабляет его",
    defi_tvl_usd: "он проверяет, поддерживает ли глубина on-chain капитала рассказ о ликвидности",
    regime_label: "он фиксирует переход поля в другое структурное состояние",
  },
};

function rankedMemoryMetrics(envelope: BtcMarketEnvelope): MemoryMetric[] {
  const score = (metric: MemoryMetric): number => {
    const changed = metric.direction !== "UNCHANGED" || metric.transition !== "UNCHANGED";
    const priority = MEMORY_PRIORITY.indexOf(metric.metric_id);
    return (changed ? 100 : 0) + (priority < 0 ? 0 : MEMORY_PRIORITY.length - priority);
  };
  return [...envelope.memory.metrics]
    .sort((a, b) => score(b) - score(a) || a.metric_id.localeCompare(b.metric_id))
    .slice(0, 3);
}

function metricDisplayValue(metric: MemoryMetric, value: string): string {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return value;
  const unit = metric.unit.toLowerCase();
  const digits = metric.metric_id === "market_field_score"
    ? 1
    : unit.includes("%") || unit.includes("pct")
      ? 2
      : Math.abs(numeric) >= 1_000_000
        ? 0
        : 2;
  return fmtNumber(numeric, digits);
}

function metricLine(locale: BtcPublicLocale, metric: MemoryMetric, index: number): string {
  const label = METRIC_LABEL[locale][metric.metric_id] ?? metric.metric_id.replace(/_/g, " ");
  const reason = METRIC_REASON[locale][metric.metric_id]
    ?? (locale === "ru" ? "он входит в принятую сопоставимую дельту" : "it belongs to the accepted comparable delta");
  const previous = metricDisplayValue(metric, metric.previous_value);
  const current = metricDisplayValue(metric, metric.current_value);
  const delta = metric.display_delta ? ` (${metric.display_delta})` : metric.transition && metric.transition !== "UNCHANGED" ? ` (${metric.transition})` : "";
  return locale === "ru"
    ? `${index}. ${label}: ${previous} → ${current}${delta}; важен, потому что ${reason}.`
    : `${index}. ${label}: ${previous} → ${current}${delta}; it matters because ${reason}.`;
}

function classEvidence(locale: BtcPublicLocale, envelope: BtcMarketEnvelope, observationDate: string): string[] {
  const c = envelope.current;
  const ru = locale === "ru";
  switch (envelope.question_class) {
    case "btc_gravity":
      return [
        `${ru ? "Доминирование BTC" : "BTC dominance"}: ${fmtNumber(c.btc_dominance_pct)}%; ${ru ? "это задаёт центр гравитации капитала" : "this defines the capital-gravity center"}.`,
        `${ru ? "Ширина альткоинов 24ч / 7д" : "Alt breadth 24h / 7d"}: ${fmtNumber(c.alt_breadth_24h_pct, 1)}% / ${fmtNumber(c.alt_breadth_7d_pct, 1)}%; ${ru ? "она проверяет, распространяется ли движение за пределы BTC" : "this tests whether movement spreads beyond BTC"}.`,
        `${ru ? "Якорь ротации ETH" : "ETH rotation anchor"}: ${fmtNumber(c.eth_rotation_anchor_pct, 1)}%; ${ru ? "он показывает ближайший канал перераспределения участия" : "this marks the nearest participation-rotation channel"}.`,
      ];
    case "liquidity":
      return [
        `${ru ? "Доля стейблкоинов" : "Stablecoin share"}: ${fmtNumber(c.stablecoin_share_pct)}%; ${ru ? "это принятый прокси доступной ликвидности" : "this is the accepted deployable-liquidity proxy"}.`,
        `DeFi TVL: $${fmtNumber(c.defi_tvl_usd, 0)}; ${ru ? "он показывает глубину on-chain капитала без двойного счёта" : "this shows on-chain capital depth without double counting"}.`,
        `${ru ? "Объём DEX за 24ч" : "DEX volume 24h"}: $${fmtNumber(c.dex_volume_24h_usd, 0)} · ${c.liquidity_context_state}; ${ru ? "это проверка фактической активности ликвидности" : "this tests actual liquidity activity"}.`,
      ];
    case "market_structure":
      return [
        `${ru ? "Режим" : "Regime"}: ${c.regime} · Market Field Score ${fmtNumber(c.market_field_score, 1)}; ${ru ? "это главный структурный якорь" : "this is the primary structural anchor"}.`,
        `${ru ? "Общая капитализация" : "Total market cap"}: $${fmtNumber(c.total_market_cap_usd, 0)}; ${ru ? "она измеряет масштаб принятого рыночного поля" : "this measures the scale of the accepted market field"}.`,
        `${ru ? "Изменение капитализации 24ч" : "Market-cap change 24h"}: ${fmtNumber(c.market_cap_change_24h_pct)}% · ${ru ? "концентрация top-10" : "top-10 concentration"} ${fmtNumber(c.top_10_flow_concentration_pct, 1)}%; ${ru ? "вместе они показывают направление и концентрацию движения" : "together they show direction and concentration"}.`,
      ];
    case "market_participation_rotation":
      return [
        `${ru ? "Ширина альткоинов 24ч / 7д" : "Alt breadth 24h / 7d"}: ${fmtNumber(c.alt_breadth_24h_pct, 1)}% / ${fmtNumber(c.alt_breadth_7d_pct, 1)}%; ${ru ? "это мера текущего и устойчивого участия" : "this measures immediate and persistent participation"}.`,
        `${ru ? "Якорь ротации ETH" : "ETH rotation anchor"}: ${fmtNumber(c.eth_rotation_anchor_pct, 1)}%; ${ru ? "он показывает, получает ли ETH долю ротации" : "this shows whether ETH receives rotation share"}.`,
        `${ru ? "Концентрация top-10" : "Top-10 concentration"}: ${fmtNumber(c.top_10_flow_concentration_pct, 1)}%; ${ru ? "она отделяет широкое участие от узкой концентрации" : "this separates broad participation from narrow concentration"}.`,
      ];
    case "change_memory": {
      const ranked = rankedMemoryMetrics(envelope);
      return ranked.length
        ? ranked.map((metric, index) => metricLine(locale, metric, index + 1))
        : [ru ? "Новый сопоставимый переход не подтверждён." : "No new comparable transition is confirmed."];
    }
    case "temporal_pressure":
      return [
        `${ru ? "Дата наблюдения" : "Observation date"}: ${observationDate}; ${ru ? "это граница вопроса, а не источник будущих фактов" : "this bounds the question rather than creating future facts"}.`,
        `${ru ? "Временное состояние" : "Temporal state"}: ${c.bounded_temporal_context.state} · ${c.bounded_temporal_context.label}; ${ru ? "оно остаётся отделённым от рыночного Snapshot" : "it remains separate from the market Snapshot"}.`,
        c.bounded_temporal_context.harmonic_tension === null
          ? (ru ? "Числовое временное напряжение недоступно; сильный временной вывод запрещён." : "Numeric temporal tension is unavailable; a strong temporal conclusion is not allowed.")
          : `${ru ? "Гармоническое напряжение" : "Harmonic tension"}: ${fmtNumber(c.bounded_temporal_context.harmonic_tension, 4)}; ${ru ? "это ограниченный космографический показатель" : "this is a bounded cosmographic metric"}.`,
      ];
    case "general_btc_field":
      return [
        `${ru ? "Гравитация BTC" : "BTC gravity"}: ${fmtNumber(c.btc_dominance_pct)}% dominance; ${ru ? "это центр капитала" : "this is the capital center"}.`,
        `${ru ? "Структура" : "Structure"}: ${c.regime} · Field Score ${fmtNumber(c.market_field_score, 1)}; ${ru ? "это состояние поля" : "this is the field state"}.`,
        `${ru ? "Ликвидность и участие" : "Liquidity and participation"}: ${c.liquidity_context_state} · breadth ${fmtNumber(c.alt_breadth_24h_pct, 1)}% / ${fmtNumber(c.alt_breadth_7d_pct, 1)}%; ${ru ? "это проверка ширины и поддержки" : "this tests breadth and support"}.`,
      ];
  }
}

function directAnswer(
  locale: BtcPublicLocale,
  envelope: BtcMarketEnvelope,
  state: BtcQuestionSpecificAnswerState,
  facets: BtcQuestionFacet[],
  context?: BtcQuestionAnswerContext,
): string {
  const ru = locale === "ru";
  if (context?.context_relation === "PRIORITY_WITHIN_PRIOR" && envelope.question_class === "change_memory") {
    const ranked = rankedMemoryMetrics(envelope);
    const labels = ranked.map((metric) => METRIC_LABEL[locale][metric.metric_id] ?? metric.metric_id.replace(/_/g, " "));
    const priority = labels.length
      ? (ru ? `Сейчас приоритетны ${labels.join(", ")}.` : `The current priorities are ${labels.join(", ")}.`)
      : (ru ? "Сейчас нет нового сопоставимого перехода, который можно ранжировать." : "There is no new comparable transition to rank now.");
    const split = context.prior_answer_state === "SPLIT"
      ? (ru ? " Предыдущий SPLIT сохраняется: показатели нельзя свести к одной направленной истории." : " The prior SPLIT remains authoritative: the indicators cannot be reduced to one directional story.")
      : "";
    return `${priority}${split}`;
  }

  const asksConfirmation = facets.includes("confirmation");
  const prefix = asksConfirmation
    ? state === "CONFIRMED" ? (ru ? "Да — в пределах принятых данных." : "Yes — within the accepted evidence.")
      : state === "SPLIT" ? (ru ? "Не полностью: релевантные сигналы расходятся." : "Not fully: the relevant signals diverge.")
      : (ru ? "Пока нет: доказательности недостаточно." : "Not yet: the evidence is insufficient.")
    : state === "CONFIRMED" ? (ru ? "Релевантные сигналы согласованы." : "The relevant signals are aligned.")
      : state === "SPLIT" ? (ru ? "Релевантные сигналы дают раздельное чтение." : "The relevant signals produce a split reading.")
      : (ru ? "Сильный вывод сейчас не поддерживается." : "A strong conclusion is not supported now.");
  return `${prefix} ${EXECUTIVE_FOCUS[locale][envelope.question_class]}`;
}

function contradictionText(
  locale: BtcPublicLocale,
  envelope: BtcMarketEnvelope,
  state: BtcQuestionSpecificAnswerState,
  context?: BtcQuestionAnswerContext,
): string {
  const ru = locale === "ru";
  const primary = envelope.route.primary_modules.map((id) => `${id}:${moduleState(envelope, id)}`).join(" / ");
  const supporting = envelope.route.supporting_modules.map((id) => `${id}:${moduleState(envelope, id)}`).join(" / ") || (ru ? "нет" : "none");
  if (
    context?.prior_answer_state === "SPLIT" &&
    context.prior_question_class === envelope.question_class &&
    context.context_relation
  ) {
    return ru
      ? `Контекст прошлого хода был SPLIT и остаётся частью ответа. Ведущий маршрут ${primary} не даёт единого направления; поддерживающий слой ${supporting} не отменяет расхождение.`
      : `The prior turn was SPLIT and remains part of this answer. Primary route ${primary} does not provide one direction; supporting layer ${supporting} does not erase the divergence.`;
  }
  if (state === "CONFIRMED") {
    return ru
      ? `Подтверждение относится только к ведущим модулям ${primary}; поддерживающий слой ${supporting} остаётся проверкой границы.`
      : `Confirmation applies only to primary modules ${primary}; supporting layer ${supporting} remains a boundary check.`;
  }
  if (state === "SPLIT") {
    return ru
      ? `Расхождение находится внутри ведущего маршрута ${primary}; поддерживающие модули ${supporting} не скрывают этот конфликт.`
      : `The split is inside primary route ${primary}; supporting modules ${supporting} do not erase that conflict.`;
  }
  return ru
    ? `Один из ведущих модулей недоступен, нейтрален или не поддерживает направленный вывод: ${primary}.`
    : `A primary module is unavailable, neutral, or cannot support a directional conclusion: ${primary}.`;
}

function changeConditionText(
  locale: BtcPublicLocale,
  envelope: BtcMarketEnvelope,
): string {
  if (envelope.question_class !== "change_memory") {
    return formatBtcQuestionWatchNext(locale, envelope.question_class, envelope.current.source_generated_at_utc);
  }
  const labels = rankedMemoryMetrics(envelope)
    .map((metric) => METRIC_LABEL[locale][metric.metric_id] ?? metric.metric_id.replace(/_/g, " "));
  return locale === "ru"
    ? `Чтение изменит только следующий принятый Snapshot после ${envelope.current.source_generated_at_utc}, если ${labels.join(", ") || "сопоставимые показатели"} перестанут расходиться, сменят направление или сформируют новый режим.`
    : `Only the next accepted Snapshot after ${envelope.current.source_generated_at_utc} changes this read if ${labels.join(", ") || "the comparable indicators"} stop diverging, reverse direction, or establish a new regime.`;
}

function sourceBoundary(locale: BtcPublicLocale, context?: BtcQuestionAnswerContext): string {
  if (context?.context_relation) {
    return locale === "ru"
      ? "Числа заново построены из принятого Snapshot и Delta. Из прошлого хода используется только компактный контекст: класс, facets, состояние, дата и привязка источника; полный текст разговора на сервер не передаётся. Это не прогноз, ценовая цель или торговый сигнал."
      : "Numbers are rebuilt from the accepted Snapshot and Delta. Only compact prior context is used: class, facets, state, date and source binding; the full transcript is not sent to the server. This is not a forecast, price target or trading signal.";
  }
  return locale === "ru"
    ? "Числа взяты из принятого Snapshot; ответ не является прогнозом, ценовой целью или торговым сигналом."
    : "Numbers come from the accepted Snapshot; this is not a forecast, price target or trading signal.";
}

export function buildBtcQuestionSpecificAnswer(
  locale: BtcPublicLocale,
  question: string,
  envelope: BtcMarketEnvelope,
  observationDate: string,
  context?: BtcQuestionAnswerContext,
): BtcQuestionSpecificAnswer {
  const facets = mergeFacets(question, context);
  const state = answerState(envelope, context);
  return {
    question_class: envelope.question_class,
    question_facets: facets,
    answer_state: state,
    headline: HEADLINES[locale][envelope.question_class][state],
    direct_answer: directAnswer(locale, envelope, state, facets, context),
    evidence_lines: classEvidence(locale, envelope, observationDate),
    contradiction_or_limit: contradictionText(locale, envelope, state, context),
    what_would_change_the_read: changeConditionText(locale, envelope),
    source_boundary: sourceBoundary(locale, context),
  };
}
