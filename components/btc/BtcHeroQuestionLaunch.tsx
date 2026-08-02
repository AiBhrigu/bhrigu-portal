import type { BtcPublicLocale } from "../../lib/btc-public-language-contract";
import { FieldAnchorGlyph } from "./BtcSurfaceGlyphs";

export function BtcHeroQuestionLaunch({
  locale,
}: {
  locale: BtcPublicLocale;
  initialDate: string;
}) {
  const ru = locale === "ru";
  const liveHref = `/crypto-astro/btc/live?lang=${locale}`;
  return <aside className="heroQuestionCard heroDialogueGateway" aria-labelledby="hero-dialogue-title">
    <header className="heroQuestionHeader">
      <FieldAnchorGlyph className="heroQuestionGlyph" />
      <div>
        <p className="eyebrow">{ru ? "BTC Field · первый живой коридор" : "BTC Field · first live corridor"}</p>
        <h2 id="hero-dialogue-title">{ru ? "Задайте один вопрос о Bitcoin" : "Ask one Bitcoin question"}</h2>
      </div>
    </header>
    <p className="heroQuestionLead">{ru
      ? "Одно доказательное чтение текущего поля BTC, памяти изменений, временного контекста и источников."
      : "One evidence-grounded read across the current BTC field, change memory, temporal context, and sources."}</p>
    <div className="heroValuePath" aria-label={ru ? "Путь чтения" : "Reading path"}>
      <span>{ru ? "Изменение" : "Change"}</span>
      <span>{ru ? "Смысл" : "Meaning"}</span>
      <span>{ru ? "Что дальше" : "What next"}</span>
      <span>{ru ? "Условия" : "Conditions"}</span>
    </div>
    <a className="heroDialogueCta" href={liveHref}>{ru ? "Открыть BTC Field" : "Open BTC Field"}<span aria-hidden="true">→</span></a>
    <p className="heroQuestionBoundary">
      <span>{ru ? "Без регистрации · Без оплаты" : "No account · No payment"}</span>
      <span>{ru ? "Проверенные источники" : "Verified sources"}</span>
      <small>{ru ? "Не финансовый совет и не торговый сигнал" : "Not financial advice or a trading signal"}</small>
    </p>
  </aside>;
}
