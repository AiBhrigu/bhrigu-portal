import type { BtcPublicSnapshot } from "../../lib/btc-public-output-contract";
import {
  getBtcExampleRoutes,
  getBtcPublicCopy,
  type BtcPublicLocale,
} from "../../lib/btc-public-language-contract";
import { FieldAnchorGlyph, RelationGlyph } from "./BtcSurfaceGlyphs";

const LIVE_PATH = "/crypto-astro/btc/live";
const href = (locale: BtcPublicLocale, question: string, date: string) => {
  const params = [`lang=${locale}`, `q=${encodeURIComponent(question)}`];
  if (date) params.push(`d=${encodeURIComponent(date)}`);
  return `${LIVE_PATH}?${params.join("&")}`;
};

export function BtcFieldNavigation({ locale }: { locale: BtcPublicLocale }) {
  const c = getBtcPublicCopy(locale);
  return <nav className="fieldNav" aria-label={c.navAria}>
    <FieldAnchorGlyph className="fieldNavGlyph"/>
    <a href="#btc-question">{c.navQuestion}</a>
    <a href="#btc-read">{c.navRead}</a>
    <a href="#phi-field">{c.navPhi}</a>
    <a href="#snapshot-memory">{c.navMemory}</a>
    <a href="#evidence">{c.navEvidence}</a>
  </nav>;
}

export function BtcQuestionMembrane({
  locale,
  initialDate,
}: {
  locale: BtcPublicLocale;
  initialQuestion: string;
  initialDate: string;
  result: BtcPublicSnapshot | null;
}) {
  const c = getBtcPublicCopy(locale);
  const routes = getBtcExampleRoutes(locale);
  const ru = locale === "ru";
  const outcomes = ru
    ? [
        ["01", "Что изменилось", "Текущее поле и принятые изменения после последнего Snapshot."],
        ["02", "Почему это важно", "Связь рыночной структуры, ликвидности, памяти и временного контекста."],
        ["03", "Что отслеживать дальше", "Условия, которые усилят, ослабят или отменят текущее чтение."],
        ["04", "Что проверить", "Источники, актуальность, доказательства и граница вывода."],
      ]
    : [
        ["01", "What changed", "The current field and accepted changes since the latest Snapshot."],
        ["02", "Why it matters", "The relationship between structure, liquidity, memory, and temporal context."],
        ["03", "What to watch next", "Conditions that would strengthen, weaken, or invalidate the current read."],
        ["04", "What to verify", "Sources, freshness, evidence, and the inference boundary."],
      ];

  return <section id="btc-question" className="questionPanel staticRouteProof" aria-labelledby="btc-question-title">
    <div className="productOutcomeHeader">
      <p className="eyebrow">{ru ? "Первый вход" : "First entry"}</p>
      <h2 id="btc-question-title">{ru ? "Начните с готового вопроса о текущем изменении Bitcoin" : "Start with a prepared question about the current Bitcoin change"}</h2>
      <p>{ru
        ? "Каждый вход открывает чистый диалог и сохраняет один маршрут: вопрос → принятые данные → смысл → условия → доказательство."
        : "Each entry opens a clean dialogue and preserves one route: question → accepted data → meaning → conditions → evidence."}</p>
    </div>

    <div className="questionMembrane proofRouteMembrane" data-prepared-routes-before-outcomes="true">
      <header className="staticProofHeader">
        <div className="questionTitleLockup">
<FieldAnchorGlyph className="questionGlyph"/>
<div>
  <p className="eyebrow">{ru ? "Пять проверенных входов" : "Five verified entries"}</p>
  <h2>{ru ? "Выберите точный вопрос" : "Choose a precise question"}</h2>
</div>
        </div>
        <p>{ru
? "Первый маршрут отвечает на главный вопрос: что изменилось в BTC, почему это важно и за чем наблюдать дальше."
: "The first route answers the primary question: what changed in BTC, why it matters, and what to watch next."}</p>
        <div className="languageSelector" aria-label={c.language}>
<span>{c.language}</span>
<a href="/crypto-astro/btc?lang=en" aria-current={locale === "en" ? "true" : undefined} data-locale-option="en">{c.languageEn}</a>
<a href="/crypto-astro/btc?lang=ru" aria-current={locale === "ru" ? "true" : undefined} data-locale-option="ru">{c.languageRu}</a>
        </div>
      </header>
      <aside className="exampleRoutes staticExampleRoutes" aria-labelledby="example-routes-title">
        <RelationGlyph className="exampleRelationGlyph"/>
        <p className="eyebrow">{ru ? "Подготовленные вопросы" : "Prepared questions"}</p>
        <h3 id="example-routes-title">{ru ? "Пять доказательных направлений" : "Five evidence-grounded directions"}</h3>
        <p>{ru
? "Текущий Snapshot используется только там, где вопрос действительно требует рыночного слоя."
: "The current Snapshot is used only where the question genuinely requires a market layer."}</p>
        <div className="exampleRouteList">
{routes.map((route, index) => <a
  key={route.id}
  href={href(locale, route.question, initialDate)}
  data-example-route={route.id}
  data-primary-entry={index === 0 ? "true" : "false"}
  data-expected-primary={route.expected_primary_modules.join(",")}
>
  <span>{String(index + 1).padStart(2, "0")}</span>
  <b>{route.label}</b>
  <em>{route.question}</em>
  <i aria-hidden="true">→</i>
</a>)}
        </div>
      </aside>
    </div>

    <div className="productOutcomeGrid" data-outcomes-after-prepared-routes="true">
      {outcomes.map(([index, title, text]) => <article key={index}>
        <span>{index}</span>
        <h3>{title}</h3>
        <p>{text}</p>
      </article>)}
    </div>
  </section>;
}
