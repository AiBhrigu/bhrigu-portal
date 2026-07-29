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
        <p className="eyebrow">{ru ? "Бесплатный диалог" : "Free dialogue"}</p>
        <h2 id="hero-dialogue-title">{ru ? "Открыть BTC Космографа" : "Open the BTC Cosmographer"}</h2>
      </div>
    </header>
    <p className="heroQuestionLead">{ru
      ? "Один вопрос — один ясный ответ, построенный по текущему проверенному BTC snapshot."
      : "One question. One clear answer grounded in the current verified BTC snapshot."}</p>
    <a className="heroDialogueCta" href={liveHref}>{ru ? "Начать бесплатный диалог" : "Start free dialogue"}<span aria-hidden="true">→</span></a>
    <p className="heroQuestionBoundary">{ru
      ? "Без регистрации · Без оплаты · Не прогноз и не торговый сигнал"
      : "No account · No payment · No forecast or trading signal"}</p>
  </aside>;
}
