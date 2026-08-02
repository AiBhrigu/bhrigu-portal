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
      ? "Космограф соединяет текущее поле BTC, принятый Snapshot, память изменений и валидированные временные методы в одном доказательном чтении."
      : "Cosmographer combines the current BTC field, the accepted Snapshot, change memory, and validated temporal methods in one evidence-grounded read."}</p>
    <div className="heroValuePath" aria-label={ru ? "Путь чтения" : "Reading path"}>
      <span>{ru ? "Что изменилось" : "What changed"}</span>
      <span>{ru ? "Почему это важно" : "Why it matters"}</span>
      <span>{ru ? "Что может произойти дальше" : "What may happen next"}</span>
      <span>{ru ? "Что изменит чтение" : "What changes the read"}</span>
    </div>
    <a className="heroDialogueCta" href={liveHref}>{ru ? "Открыть BTC Field" : "Open BTC Field"}<span aria-hidden="true">→</span></a>
    <p className="heroQuestionBoundary">{ru
      ? "Без регистрации · Без оплаты · Проверенные источники · Не финансовый совет и не торговый сигнал"
      : "No account · No payment · Verified sources · Not financial advice or a trading signal"}</p>
  </aside>;
}
