import type { BtcMarketEnvelope, BtcMarketEnvelopeFailure } from "../../lib/btc-market-envelope";
import type { BtcFailureCode, BtcPublicSnapshot, FreshnessState } from "../../lib/btc-public-output-contract";
import { formatBtcQuestionExecutiveLead, formatBtcQuestionWatchNext } from "../../lib/btc-executive-question-language";
import {
  formatBtcFailureMessage,
  formatBtcMemoryLabel,
  formatBtcObservationDate,
  formatBtcStateLabel,
  formatBtcUtcTimestamp,
  formatBtcWeakening,
  type BtcPublicLocale,
} from "../../lib/btc-public-language-contract";
import {
  factLine,
  memoryDelta,
  memoryValue,
  narrativeLine,
  sectionTitle,
} from "../../lib/btc-public-surface-format";
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
    if (context.state === "FRESH") return "Проверенный snapshot";
    if (context.state === "STALE_LIMITED") return "Snapshot ограниченно актуален";
    return "Источник временно недоступен";
  }
  if (context.state === "FRESH") return "Verified snapshot";
  if (context.state === "STALE_LIMITED") return "Snapshot is stale-limited";
  return "Source temporarily unavailable";
}

function changedLines(locale: BtcPublicLocale, envelope: BtcMarketEnvelope): string[] {
  return envelope.memory.metrics
    .filter((metric) => metric.direction !== "UNCHANGED" || metric.transition !== "UNCHANGED")
    .slice(0, 2)
    .map((metric) => `${formatBtcMemoryLabel(locale, metric.metric_id)} ${memoryValue(locale, metric, metric.previous_value)} → ${memoryValue(locale, metric, metric.current_value)} (${memoryDelta(locale, metric)})`);
}

export function BtcLiveDialogue(props: Props) {
  const { locale, initialQuestion, initialDate, result, failure, envelope, envelopeFailure, sourceContext } = props;
  const ru = locale === "ru";
  const otherLocale: BtcPublicLocale = ru ? "en" : "ru";
  const changed = envelope ? changedLines(locale, envelope) : [];
  const confirms = envelope?.synthesis.confirming_modules[0]?.split(":")[0] ?? null;
  const weakens = envelope ? formatBtcWeakening(locale, envelope.synthesis.state) : null;
  const hasAnswer = Boolean(initialQuestion);

  return <main className="liveDialoguePage" lang={locale} data-live-dialogue="btc-free-question">
    <header className="liveDialogueTopbar">
      <a className="liveBackLink" href={`/crypto-astro/btc?lang=${locale}`}>← BTC Field Read</a>
      <div className="liveIdentity"><FieldAnchorGlyph className="liveIdentityGlyph"/><span>Market Cosmographer</span></div>
      <a className="liveLocaleLink" href={route(otherLocale, initialQuestion, initialDate)}>{otherLocale.toUpperCase()}</a>
    </header>

    <section className="liveDialogueShell" aria-labelledby="live-dialogue-title">
      <header className="liveDialogueIntro">
        <p className="eyebrow">{ru ? "Бесплатный BTC-диалог" : "Free BTC dialogue"}</p>
        <h1 id="live-dialogue-title">{ru ? "BTC Космограф" : "BTC Cosmographer"}</h1>
        <p>{ru
          ? "Один вопрос. Один ясный, проверяемый ответ."
          : "One question. One clear, verifiable answer."}</p>
        <div className="liveTrustLine"><span>{sourceState(locale,sourceContext)}</span>{sourceContext.generated_at_utc&&<span>{formatBtcUtcTimestamp(locale,sourceContext.generated_at_utc)}</span>}<span>{ru?"Без прогноза":"No forecast"}</span></div>
      </header>

      {hasAnswer&&<section className="liveThread" aria-label={ru?"Диалог":"Dialogue"}>
        <article className="dialogueTurn userTurn">
          <div className="turnRole">{ru?"Вы":"You"}</div>
          <div className="turnBody"><p>{initialQuestion}</p></div>
        </article>

        {failure&&<article className="dialogueTurn cosmographerTurn dialogueFailure" role="alert">
          <div className="turnRole"><FieldAnchorGlyph className="turnGlyph"/><span>Cosmographer</span></div>
          <div className="turnBody">
            <p className="eyebrow">{ru?"Ответ ограничен":"Answer limited"}</p>
            <h2>{ru?"Вопрос или источник не прошёл проверку":"The question or source did not pass validation"}</h2>
            <p>{formatBtcFailureMessage(locale,failure.code,failure.message)}</p>
          </div>
        </article>}

        {result&&envelope&&<article className="dialogueTurn cosmographerTurn" data-synthesis-state={envelope.synthesis.state}>
          <div className="turnRole"><FieldAnchorGlyph className="turnGlyph"/><span>Cosmographer</span></div>
          <div className="turnBody">
            <header className="answerHeader"><p className="eyebrow">{ru?"Ответ":"Answer"}</p><h2>{formatBtcStateLabel(locale,envelope.synthesis.state)}</h2></header>
            <p className="answerLead">{formatBtcQuestionExecutiveLead(locale,envelope.question_class,envelope.synthesis.state)}</p>
            <div className="answerNarrative">
              <p><strong>{ru?"Что изменилось.":"What changed."}</strong> {changed.length?changed.join(" "):(ru?"Сильного нового перехода не подтверждено.":"No strong new transition is confirmed.")}</p>
              <p><strong>{ru?"Как читать.":"How to read it."}</strong> {confirms?(ru?`${confirms} подтверждает маршрут вопроса.`:`${confirms} confirms the routed question.`):(ru?"Независимое подтверждение ограничено.":"Independent confirmation is limited.")} {weakens}</p>
              <p><strong>{ru?"Наблюдать дальше.":"Watch next."}</strong> {formatBtcQuestionWatchNext(locale,envelope.question_class,envelope.current.source_generated_at_utc)}</p>
            </div>
            <footer className="answerSource">{sourceState(locale,sourceContext)} · {formatBtcObservationDate(locale,result.temporal_context.observation_date)} · {sourceContext.proof_available?(ru?"Proof доступен":"Proof available"):(ru?"Proof недоступен":"Proof unavailable")}</footer>
          </div>
        </article>}

        {result&&!envelope&&<article className="dialogueTurn cosmographerTurn dialogueBounded">
          <div className="turnRole"><FieldAnchorGlyph className="turnGlyph"/><span>Cosmographer</span></div>
          <div className="turnBody">
            <p className="eyebrow">{ru?"Ограниченный ответ":"Bounded answer"}</p>
            <h2>{ru?"Рыночный контекст временно недоступен":"Market context is temporarily unavailable"}</h2>
            {envelopeFailure&&<p>{formatBtcFailureMessage(locale,envelopeFailure.code,envelopeFailure.message)}</p>}
            {result.cosmographer_read.sections.slice(0,2).map((section)=><p key={section.section_id}><strong>{sectionTitle(locale,section.section_id)}.</strong> {factLine(locale,section.fact_payload)} {narrativeLine(locale,section.read_template_id,section.fact_payload)}</p>)}
          </div>
        </article>}
      </section>}

      <form className={hasAnswer?"liveComposer liveComposerAfterAnswer":"liveComposer liveComposerPrimary"} method="get" action="/crypto-astro/btc/live">
        <input type="hidden" name="lang" value={locale}/>
        <label><span>{hasAnswer?(ru?"Следующий вопрос":"Ask another question"):(ru?"Ваш вопрос о BTC":"Your BTC question")}</span><textarea name="q" rows={3} minLength={8} maxLength={280} required placeholder={ru?"Что вы хотите понять о текущем поле BTC?":"What do you want to understand about the current BTC field?"}/></label>
        <div className="liveComposerControls"><label><span>{ru?"Дата наблюдения · необязательно":"Observation date · optional"}</span><input name="d" type="date" defaultValue={initialDate}/></label><button type="submit">{hasAnswer?(ru?"Продолжить":"Continue"):(ru?"Получить ответ":"Get answer")}</button></div>
      </form>
      <p className="liveBoundary">{ru?"Без регистрации · Без оплаты · Не прогноз и не торговый сигнал":"No account · No payment · No forecast or trading signal"}</p>
    </section>
  </main>;
}
