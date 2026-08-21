import type { BtcPublicLocale } from "../../lib/btc-public-language-contract";
import { FieldAnchorGlyph } from "./BtcSurfaceGlyphs";

export function BtcHeroQuestionLaunch({
  locale,
  initialDate,
}: {
  locale: BtcPublicLocale;
  initialDate: string;
}) {
  const ru = locale === "ru";
  const primaryQuestion = ru
    ? "Что изменилось в Bitcoin с предыдущего принятого Snapshot — и почему это важно?"
    : "What changed in Bitcoin since the previous accepted Snapshot — and why does it matter?";
  const params = [`lang=${locale}`, `q=${encodeURIComponent(primaryQuestion)}`];
  if (initialDate) params.push(`d=${encodeURIComponent(initialDate)}`);
  const cleanChatHref = `/crypto-astro/btc/clean-chat?${params.join("&")}`;

  return <aside className="heroQuestionCard heroDialogueGateway" aria-labelledby="hero-dialogue-title">
    <header className="heroQuestionHeader">
      <FieldAnchorGlyph className="heroQuestionGlyph" />
      <div>
        <p className="eyebrow">{ru ? "BTC Field · первый доказанный коридор" : "BTC Field · first proven corridor"}</p>
        <h2 id="hero-dialogue-title">{ru ? "Начните с того, что изменилось в Bitcoin" : "Start with what changed in Bitcoin"}</h2>
      </div>
    </header>
    <p className="heroQuestionLead">{ru
      ? "Готовый вопрос о Bitcoin, привязанный к текущим доказательствам и явным условиям."
      : "A prepared Bitcoin question grounded in current evidence and explicit conditions."}</p>
    <div className="heroValuePath" aria-label={ru ? "Путь чтения" : "Reading path"}>
      <span>{ru ? "Изменение" : "Change"}</span>
      <span>{ru ? "Почему важно" : "Why it matters"}</span>
      <span>{ru ? "Условия" : "Conditions"}</span>
      <span>{ru ? "Граница" : "Boundary"}</span>
    </div>
    <a className="heroDialogueCta" href={cleanChatHref} data-primary-btc-change-question="true">
      {ru ? "Спросить, что изменилось в Bitcoin" : "Ask what changed in Bitcoin"}
      <span aria-hidden="true">→</span>
    </a>
    <p className="heroQuestionBoundary">
      <span>{ru ? "Без регистрации · Без оплаты" : "No account · No payment"}</span>
      <span>{ru ? "Проверенные источники" : "Verified sources"}</span>
      <small>{ru ? "Не финансовый совет и не торговый сигнал" : "Not financial advice or a trading signal"}</small>
    </p>
  </aside>;
}
