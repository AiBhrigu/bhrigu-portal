import type { BtcMarketEnvelope, BtcMarketEnvelopeFailure } from "../../lib/btc-market-envelope";
import type { BtcFailureCode, BtcPublicSnapshot, FreshnessState } from "../../lib/btc-public-output-contract";
import { buildBtcQuestionSpecificAnswer } from "../../lib/btc-executive-question-language";
import {
  formatBtcFailureMessage,
  formatBtcObservationDate,
  formatBtcUtcTimestamp,
  type BtcPublicLocale,
} from "../../lib/btc-public-language-contract";
import {
  factLine,
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

export function BtcLiveDialogue(props: Props) {
  const { locale, initialQuestion, initialDate, result, failure, envelope, envelopeFailure, sourceContext } = props;
  const ru = locale === "ru";
  const otherLocale: BtcPublicLocale = ru ? "en" : "ru";
  const hasAnswer = Boolean(initialQuestion);
  const answer = result && envelope
    ? buildBtcQuestionSpecificAnswer(locale, initialQuestion, envelope, result.temporal_context.observation_date)
    : null;

  return <main className="liveDialoguePage" lang={locale} data-live-dialogue="btc-free-question">
    <header className="liveDialogueTopbar">
      <a className="liveBackLink" href={`/crypto-astro/btc?lang=${locale}`}>← BTC Field Read</a>
      <div className="liveIdentity"><FieldAnchorGlyph className="liveIdentityGlyph"/><span>Market Cosmographer</span></div>
      <a className="liveLocaleLink" href={route(otherLocale, initialQuestion, initialDate)}>{otherLocale.toUpperCase()}</a>
    </header>

    <section className="liveDialogueShell" aria-labelledby="live-dialogue-title">
      <header className="liveDialogueIntro">
        <p className="eyebrow">{ru ? "Бесплатное чтение вопроса BTC" : "Free BTC question read"}</p>
        <h1 id="live-dialogue-title">{ru ? "BTC Космограф" : "BTC Cosmographer"}</h1>
        <p>{ru
          ? "Один вопрос. Один источник-привязанный ответ без памяти между запросами."
          : "One question. One source-bound answer with no memory between requests."}</p>
        <div className="liveTrustLine"><span>{sourceState(locale,sourceContext)}</span>{sourceContext.generated_at_utc&&<span>{formatBtcUtcTimestamp(locale,sourceContext.generated_at_utc)}</span>}<span>{ru?"Без прогноза":"No forecast"}</span></div>
      </header>

      {hasAnswer&&<section className="liveThread" aria-label={ru?"Чтение вопроса":"Question read"}>
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

        {answer&&result&&envelope&&<article
          className="dialogueTurn cosmographerTurn"
          data-answer-state={answer.answer_state}
          data-question-class={answer.question_class}
          data-question-facets={answer.question_facets.join(",")}
        >
          <div className="turnRole"><FieldAnchorGlyph className="turnGlyph"/><span>Cosmographer</span></div>
          <div className="turnBody">
            <header className="answerHeader"><p className="eyebrow">{ru?"Прямой ответ":"Direct answer"}</p><h2>{answer.headline}</h2></header>
            <p className="answerLead" data-answer-direct="true">{answer.direct_answer}</p>
            <div className="answerNarrative">
              <section data-answer-section="evidence">
                <p><strong>{ru?"Доказательность вопроса.":"Question-specific evidence."}</strong></p>
                <ul>{answer.evidence_lines.map((line)=><li key={line}>{line}</li>)}</ul>
              </section>
              <p data-answer-section="limit"><strong>{ru?"Противоречие или граница.":"Contradiction or limit."}</strong> {answer.contradiction_or_limit}</p>
              <p data-answer-section="change"><strong>{ru?"Что изменит чтение.":"What would change the read."}</strong> {answer.what_would_change_the_read}</p>
            </div>
            <footer className="answerSource" data-answer-source-boundary="true">
              {sourceState(locale,sourceContext)} · {formatBtcObservationDate(locale,result.temporal_context.observation_date)} · {sourceContext.proof_available?(ru?"Proof доступен":"Proof available"):(ru?"Proof недоступен":"Proof unavailable")}
              <span>{answer.source_boundary}</span>
            </footer>
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
        <label><span>{hasAnswer?(ru?"Новый независимый вопрос":"New independent question"):(ru?"Ваш вопрос о BTC":"Your BTC question")}</span><textarea name="q" rows={3} minLength={8} maxLength={280} required placeholder={ru?"Что вы хотите понять о текущем поле BTC?":"What do you want to understand about the current BTC field?"}/></label>
        <div className="liveComposerControls"><label><span>{ru?"Дата наблюдения · необязательно":"Observation date · optional"}</span><input name="d" type="date" defaultValue={initialDate}/></label><button type="submit">{hasAnswer?(ru?"Новое чтение":"New read"):(ru?"Получить ответ":"Get answer")}</button></div>
      </form>
      <p className="liveBoundary">{ru?"Без регистрации · Без оплаты · Без памяти между вопросами · Не прогноз и не торговый сигнал":"No account · No payment · No memory between questions · No forecast or trading signal"}</p>
    </section>
  </main>;
}
