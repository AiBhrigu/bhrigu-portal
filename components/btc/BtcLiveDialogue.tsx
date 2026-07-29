import type { BtcMarketEnvelope, BtcMarketEnvelopeFailure } from "../../lib/btc-market-envelope";
import type { BtcFailureCode, BtcPublicSnapshot, FreshnessState } from "../../lib/btc-public-output-contract";
import { formatBtcQuestionExecutiveLead, formatBtcQuestionWatchNext } from "../../lib/btc-executive-question-language";
import {
  formatBtcFailureMessage,
  formatBtcMemoryLabel,
  formatBtcObservationDate,
  formatBtcPlain,
  formatBtcQuestionLens,
  formatBtcStateLabel,
  formatBtcUtcTimestamp,
  formatBtcWeakening,
  type BtcPublicLocale,
} from "../../lib/btc-public-language-contract";
import {
  compact,
  factLine,
  memoryDelta,
  memoryValue,
  money,
  narrativeLine,
  pct,
  sectionTitle,
} from "../../lib/btc-public-surface-format";
import { BtcEvidenceZone } from "./BtcEvidence";
import { BtcPhiZone } from "./BtcExecutivePhi";
import { FieldAnchorGlyph, SealedBoundaryGlyph } from "./BtcSurfaceGlyphs";

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

type Props = {
  locale: BtcPublicLocale;
  initialQuestion: string;
  initialDate: string;
  result: BtcPublicSnapshot | null;
  failure: BtcLiveFailure | null;
  envelope: BtcMarketEnvelope | null;
  envelopeFailure: BtcLiveEnvelopeFailure | null;
  sourceContext: BtcLiveSourceContext;
  deploymentSourceSha: string | null;
};

function route(locale: BtcPublicLocale, question: string, date: string): string {
  const params = new URLSearchParams({ lang: locale });
  if (question) params.set("q", question);
  if (date) params.set("d", date);
  return `/crypto-astro/btc/live?${params.toString()}`;
}

function sourceState(locale: BtcPublicLocale, context: BtcLiveSourceContext): string {
  if (locale === "ru") {
    if (context.state === "FRESH") return "Проверенный снимок свежий";
    if (context.state === "STALE_LIMITED") return "Снимок ограниченно актуален";
    return "Источник временно недоступен";
  }
  if (context.state === "FRESH") return "Verified snapshot is fresh";
  if (context.state === "STALE_LIMITED") return "Snapshot is stale-limited";
  return "Source is temporarily unavailable";
}

function changedLines(locale: BtcPublicLocale, envelope: BtcMarketEnvelope): string[] {
  return envelope.memory.metrics
    .filter((metric) => metric.direction !== "UNCHANGED" || metric.transition !== "UNCHANGED")
    .slice(0, 2)
    .map((metric) => `${formatBtcMemoryLabel(locale, metric.metric_id)} ${memoryValue(locale, metric, metric.previous_value)} → ${memoryValue(locale, metric, metric.current_value)} (${memoryDelta(locale, metric)})`);
}

export function BtcLiveDialogue(props: Props) {
  const { locale, initialQuestion, initialDate, result, failure, envelope, envelopeFailure, sourceContext, deploymentSourceSha } = props;
  const ru = locale === "ru";
  const otherLocale: BtcPublicLocale = ru ? "en" : "ru";
  const changed = envelope ? changedLines(locale, envelope) : [];
  const confirms = envelope?.synthesis.confirming_modules[0]?.split(":")[0] ?? null;
  const weakens = envelope ? formatBtcWeakening(locale, envelope.synthesis.state) : null;

  return <main className="liveDialoguePage" lang={locale} data-live-dialogue="btc-free-question">
    <section className="liveDialogueStage">
      <header className="liveDialogueTopbar">
        <a className="liveBackLink" href={`/crypto-astro/btc?lang=${locale}`}>← BTC Field Read</a>
        <div className="liveIdentity"><FieldAnchorGlyph className="liveIdentityGlyph" /><span>Market Cosmographer</span></div>
        <a className="liveLocaleLink" href={route(otherLocale, initialQuestion, initialDate)}>{otherLocale.toUpperCase()}</a>
      </header>

      <div className="liveGoldenGrid">
        <section className="liveConversation" aria-labelledby="live-dialogue-title">
          <header className="liveConversationHeader">
            <div>
              <p className="eyebrow">{ru ? "Бесплатный BTC-диалог" : "Free BTC dialogue"}</p>
              <h1 id="live-dialogue-title">{ru ? "Спросите поле. Получите проверяемый ответ." : "Ask the field. Receive a verifiable answer."}</h1>
            </div>
            <p>{ru
              ? "Один вопрос проходит через текущий snapshot, детерминированный router, память изменений и Evidence."
              : "One question runs through the current snapshot, deterministic router, change memory, and Evidence."}</p>
          </header>

          <form className="liveComposer" method="get" action="/crypto-astro/btc/live">
            <input type="hidden" name="lang" value={locale} />
            <label>
              <span>{ru ? "Ваш вопрос о BTC" : "Your BTC question"}</span>
              <textarea
                name="q"
                minLength={8}
                maxLength={280}
                required
                defaultValue={initialQuestion}
                placeholder={ru ? "Что изменилось в поле BTC, почему это важно и за чем наблюдать дальше?" : "What changed in the BTC field, why does it matter, and what should I watch next?"}
              />
            </label>
            <div className="liveComposerControls">
              <label>
                <span>{ru ? "Дата наблюдения" : "Observation date"}</span>
                <input name="d" type="date" defaultValue={initialDate} />
              </label>
              <button type="submit">{ru ? "Обновить диалог" : "Update dialogue"}</button>
            </div>
          </form>

          {!initialQuestion && <article className="dialogueTurn cosmographerTurn dialogueEmptyState">
            <div className="turnRole"><FieldAnchorGlyph className="turnGlyph" /><span>Cosmographer</span></div>
            <div className="turnBody">
              <h2>{ru ? "Задайте первый вопрос" : "Ask the first question"}</h2>
              <p>{ru
                ? "Форма уже подключена к бесплатному BTC-коридору. Ответ появится здесь, а полное доказательство останется доступным ниже."
                : "The form is already connected to the free BTC corridor. The answer will appear here, with the full proof available below."}</p>
            </div>
          </article>}

          {initialQuestion && <article className="dialogueTurn userTurn">
            <div className="turnRole"><span>{ru ? "Вы" : "You"}</span></div>
            <div className="turnBody"><p>{initialQuestion}</p></div>
          </article>}

          {failure && <article className="dialogueTurn cosmographerTurn dialogueFailure" role="alert">
            <div className="turnRole"><FieldAnchorGlyph className="turnGlyph" /><span>Cosmographer</span></div>
            <div className="turnBody">
              <p className="eyebrow">{ru ? "Ответ ограничен" : "Answer limited"}</p>
              <h2>{ru ? "Источник или вопрос не прошёл проверку" : "The source or question did not pass validation"}</h2>
              <p>{formatBtcFailureMessage(locale, failure.code, failure.message)}</p>
              {failure.last_verified_at_utc && <p>{ru ? "Последняя проверка" : "Last verified"}: {formatBtcUtcTimestamp(locale, failure.last_verified_at_utc)}</p>}
            </div>
          </article>}

          {result && envelope && <article className="dialogueTurn cosmographerTurn" data-synthesis-state={envelope.synthesis.state}>
            <div className="turnRole"><FieldAnchorGlyph className="turnGlyph" /><span>Cosmographer</span></div>
            <div className="turnBody">
              <header className="answerHeader">
                <div>
                  <p className="eyebrow">{ru ? "Краткий ответ" : "Executive answer"}</p>
                  <h2>{formatBtcStateLabel(locale, envelope.synthesis.state)}</h2>
                </div>
                <span>{formatBtcObservationDate(locale, result.temporal_context.observation_date)}</span>
              </header>
              <p className="answerLead">{formatBtcQuestionExecutiveLead(locale, envelope.question_class, envelope.synthesis.state)}</p>

              <dl className="answerDecisionGrid">
                <div><dt>{ru ? "Что изменилось" : "What changed"}</dt><dd>{changed[0] ?? (ru ? "Сильного нового перехода не подтверждено." : "No strong new transition is confirmed.")}</dd></div>
                <div><dt>{ru ? "Второй сдвиг" : "Second shift"}</dt><dd>{changed[1] ?? (ru ? "Второй независимый сдвиг не подтвержден." : "No second independent shift is confirmed.")}</dd></div>
                <div><dt>{ru ? "Что подтверждает" : "What confirms"}</dt><dd>{confirms ? (ru ? `${confirms} согласуется с маршрутом вопроса.` : `${confirms} aligns with the routed question.`) : (ru ? "Независимое подтверждение ограничено." : "Independent confirmation is limited.")}</dd></div>
                <div><dt>{ru ? "Что ослабляет" : "What weakens"}</dt><dd>{weakens ?? (ru ? "Явного противоречия не выявлено." : "No explicit contradiction was found.")}</dd></div>
                <div className="watchCell"><dt>{ru ? "Что наблюдать дальше" : "What to watch next"}</dt><dd>{formatBtcQuestionWatchNext(locale, envelope.question_class, envelope.current.source_generated_at_utc)}</dd></div>
              </dl>

              <section className="liveMetricField" aria-label={ru ? "Текущие метрики BTC" : "Current BTC metrics"}>
                <div><span>BTC</span><strong>{money(envelope.current.price_usd)}</strong><small>24h {pct(envelope.current.change_24h_pct)} · 7d {pct(envelope.current.change_7d_pct)}</small></div>
                <div><span>{ru ? "Доминация" : "Dominance"}</span><strong>{pct(envelope.current.btc_dominance_pct, 2, false)}</strong><small>{ru ? "Рынок" : "Market"} {money(envelope.current.total_market_cap_usd)}</small></div>
                <div><span>Market Field</span><strong>{compact(envelope.current.market_field_score, 1)}</strong><small>{formatBtcPlain(locale, envelope.current.regime)}</small></div>
                <div><span>{ru ? "Участие" : "Breadth"}</span><strong>{pct(envelope.current.alt_breadth_24h_pct, 1, false)}</strong><small>7d {pct(envelope.current.alt_breadth_7d_pct, 1, false)}</small></div>
              </section>
            </div>
          </article>}

          {result && !envelope && <article className="dialogueTurn cosmographerTurn dialogueBounded">
            <div className="turnRole"><FieldAnchorGlyph className="turnGlyph" /><span>Cosmographer</span></div>
            <div className="turnBody">
              <p className="eyebrow">{ru ? "Ограниченное чтение" : "Bounded reading"}</p>
              <h2>{ru ? "Рыночный envelope временно недоступен" : "The market envelope is temporarily unavailable"}</h2>
              {envelopeFailure && <p>{formatBtcFailureMessage(locale, envelopeFailure.code, envelopeFailure.message)}</p>}
              <div className="boundedSections">{result.cosmographer_read.sections.slice(0, 3).map((section) => <section key={section.section_id}>
                <h3>{sectionTitle(locale, section.section_id)}</h3>
                <p>{factLine(locale, section.fact_payload)}</p>
                <p>{narrativeLine(locale, section.read_template_id, section.fact_payload)}</p>
              </section>)}</div>
            </div>
          </article>}
        </section>

        <aside className="liveEvidenceRail" aria-label={ru ? "Контекст и доказательство" : "Context and evidence"}>
          <div className="railCore">
            <SealedBoundaryGlyph />
            <p className="eyebrow">Evidence</p>
            <h2>{sourceState(locale, sourceContext)}</h2>
          </div>
          <dl className="railFacts">
            <div><dt>{ru ? "Снимок" : "Snapshot"}</dt><dd>{sourceContext.generated_at_utc ? formatBtcUtcTimestamp(locale, sourceContext.generated_at_utc) : "—"}</dd></div>
            <div><dt>Proof</dt><dd>{sourceContext.proof_available ? (ru ? "Доступен" : "Available") : (ru ? "Недоступен" : "Unavailable")}</dd></div>
            <div><dt>{ru ? "Источники" : "Sources"}</dt><dd>{result ? result.source_proof.sources.length : "—"}</dd></div>
            <div><dt>{ru ? "Линза" : "Lens"}</dt><dd>{result ? formatBtcQuestionLens(locale, result.question.lens) : "—"}</dd></div>
            {deploymentSourceSha && <div><dt>{ru ? "Публикация" : "Deployment"}</dt><dd><code>{deploymentSourceSha.slice(0, 12)}</code></dd></div>}
          </dl>
          <div className="railBoundary">
            <p>{ru
              ? "Наблюдение, вычисление и интерпретация разделены. Нет прогноза цены, торгового сигнала или инвестиционной рекомендации."
              : "Observation, calculation, and interpretation are separated. No price forecast, trading signal, or investment recommendation."}</p>
          </div>
          {envelope && <div className="railPulse">
            <span>{ru ? "Состояние" : "State"}</span>
            <strong>{formatBtcStateLabel(locale, envelope.synthesis.state)}</strong>
            <small>{ru ? "Источник" : "Source"} · {formatBtcUtcTimestamp(locale, envelope.current.source_generated_at_utc)}</small>
          </div>}
        </aside>
      </div>
    </section>

    {result && envelope && <details className="liveFullField">
      <summary>{ru ? "Открыть полный Φ-field, Memory и Evidence" : "Open full Φ-field, Memory, and Evidence"}</summary>
      <div className="liveFullFieldBody">
        <BtcPhiZone locale={locale} envelope={envelope} />
        <BtcEvidenceZone locale={locale} envelope={envelope} result={result} />
      </div>
    </details>}
  </main>;
}
