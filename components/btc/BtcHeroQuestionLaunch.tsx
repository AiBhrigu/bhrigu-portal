import { getBtcPublicCopy, type BtcPublicLocale } from "../../lib/btc-public-language-contract";
import { FieldAnchorGlyph } from "./BtcSurfaceGlyphs";

export function BtcHeroQuestionLaunch({
  locale,
  initialDate,
}: {
  locale: BtcPublicLocale;
  initialDate: string;
}) {
  const c = getBtcPublicCopy(locale);
  const ru = locale === "ru";
  return <aside className="heroQuestionCard" aria-labelledby="hero-question-title">
    <header className="heroQuestionHeader">
      <FieldAnchorGlyph className="heroQuestionGlyph" />
      <div>
        <p className="eyebrow">{ru ? "Бесплатный вопрос" : "Free question"}</p>
        <h2 id="hero-question-title">{ru ? "Спросите BTC Космографа" : "Ask the BTC Cosmographer"}</h2>
      </div>
    </header>
    <p className="heroQuestionLead">{ru
      ? "Ответ откроется в отдельном диалоговом окне и будет построен по текущему проверенному снимку, памяти изменений и Evidence."
      : "The answer opens in a dedicated dialogue window built from the current verified snapshot, change memory, and Evidence."}</p>
    <form className="heroQuestionForm" method="get" action="/crypto-astro/btc/live">
      <input type="hidden" name="lang" value={locale} />
      <label className="heroQuestionInput">
        <span>{c.questionLabel}</span>
        <textarea
          name="q"
          minLength={8}
          maxLength={280}
          required
          placeholder={c.placeholder}
        />
      </label>
      <div className="heroQuestionControls">
        <label>
          <span>{c.dateLabel}</span>
          <input name="d" type="date" defaultValue={initialDate} />
        </label>
        <button type="submit">{ru ? "Открыть диалог" : "Open dialogue"}</button>
      </div>
    </form>
    <p className="heroQuestionBoundary">{ru
      ? "Без регистрации · Без оплаты · Не прогноз и не торговый сигнал"
      : "No account · No payment · No forecast or trading signal"}</p>
  </aside>;
}
