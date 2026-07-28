import type { BtcBinanceFreeObservation } from "../../lib/btc-binance-free-observation-contract";
import type { BtcPublicLocale } from "../../lib/btc-public-language-contract";

function number(locale: BtcPublicLocale, value: number, digits = 2): string {
  return new Intl.NumberFormat(locale === "ru" ? "ru-RU" : "en-US", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(value);
}

function pct(locale: BtcPublicLocale, value: number): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${number(locale, value * 100, 2)}%`;
}

function date(locale: BtcPublicLocale, value: string): string {
  return new Intl.DateTimeFormat(locale === "ru" ? "ru-RU" : "en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}

export function BtcBinanceFreeObservationPanel({
  locale,
  observation,
}: {
  locale: BtcPublicLocale;
  observation: BtcBinanceFreeObservation;
}) {
  const ru = locale === "ru";
  const o = observation.observation;
  const d = observation.derived_market;
  const c = observation.cosmographer_context;
  const e = observation.evidence_card;
  return <section
    id="binance-free-observation"
    className="readingZone zoneBinanceObservation"
    aria-labelledby="binance-free-observation-title"
    data-candidate-sha={observation.candidate_sha256}
    data-provider={o.provider}
    data-instrument={o.instrument}
    data-quote-asset={o.quote_asset}
  >
    <header className="binanceObservationHeader">
      <div>
        <p className="eyebrow">{ru ? "Свободное историческое наблюдение" : "Free historical Observation"}</p>
        <h2 id="binance-free-observation-title">BTC/USDT · {date(locale, o.target_date)}</h2>
      </div>
      <p>{ru
        ? "Отдельное наблюдение по площадке Binance Spot. Оно не заменяет текущий публичный снимок и не является глобальной ценой BTC/USD."
        : "A separate Binance Spot venue observation. It does not replace the current public snapshot and is not a global BTC/USD price."}</p>
    </header>

    <dl className="binanceObservationMetrics">
      <div><dt>{ru ? "Открытие" : "Open"}</dt><dd>{number(locale, o.open_usdt)} <small>USDT</small></dd></div>
      <div><dt>{ru ? "Максимум" : "High"}</dt><dd>{number(locale, o.high_usdt)} <small>USDT</small></dd></div>
      <div><dt>{ru ? "Минимум" : "Low"}</dt><dd>{number(locale, o.low_usdt)} <small>USDT</small></dd></div>
      <div><dt>{ru ? "Закрытие" : "Close"}</dt><dd>{number(locale, o.close_usdt)} <small>USDT</small></dd></div>
      <div><dt>{ru ? "Объём BTC" : "BTC volume"}</dt><dd>{number(locale, o.volume_btc, 4)}</dd></div>
      <div><dt>{ru ? "Сделки" : "Trades"}</dt><dd>{number(locale, o.trade_count, 0)}</dd></div>
    </dl>

    <div className="binanceObservationField">
      <article>
        <p className="eyebrow">{ru ? "Структура наблюдения" : "Observation structure"}</p>
        <h3>{ru ? "Смешанный 30-дневный тренд" : "Mixed 30-day trend"}</h3>
        <dl>
          <div><dt>1d</dt><dd>{pct(locale, d.return_1d)}</dd></div>
          <div><dt>7d</dt><dd>{pct(locale, d.return_7d)}</dd></div>
          <div><dt>30d</dt><dd>{pct(locale, d.return_30d)}</dd></div>
          <div><dt>{ru ? "Волатильность 30d" : "30d volatility"}</dt><dd>{pct(locale, d.realized_volatility_30d_annualized)}</dd></div>
          <div><dt>{ru ? "Позиция диапазона" : "Range position"}</dt><dd>{pct(locale, d.range_position_30d)}</dd></div>
          <div><dt>{ru ? "Просадка от 365d high" : "Drawdown from 365d high"}</dt><dd>{pct(locale, d.drawdown_from_trailing_365d_high)}</dd></div>
        </dl>
      </article>
      <aside>
        <p className="eyebrow">{ru ? "Контекст Космографа" : "Cosmographer context"}</p>
        <h3>{c.trend_structure === "FRAGMENTED" ? (ru ? "Фрагментированная структура" : "Fragmented structure") : c.trend_structure}</h3>
        <p>{ru
          ? "Астро-активность была выражена сильнее, чем подтверждение рыночной активностью. Это только историческое описательное совпадение."
          : "Astro activity was stronger than market-activity confirmation. This is historical descriptive co-occurrence only."}</p>
        <p className="binanceObservationBoundary">{ru
          ? "Без причинности, прогноза, торгового сигнала или инвестиционной рекомендации."
          : "No causality, forecast, trading signal, or investment recommendation."}</p>
      </aside>
    </div>

    <details className="binanceObservationEvidence">
      <summary>{ru ? "Источник, метод и границы" : "Source, method, and boundaries"}</summary>
      <div>
        <p><b>{ru ? "Источник" : "Source"}:</b> {ru ? e.attribution_ru : e.attribution_en}</p>
        <p><b>{ru ? "Период" : "Period"}:</b> {date(locale, e.observation_period.context_start)} — {date(locale, e.observation_period.context_end)}</p>
        <p><b>{ru ? "Метод" : "Method"}:</b> <code>{e.method_id}</code></p>
        <p>{e.boundary_statement}</p>
        <p>{e.independence_notice}</p>
        <p><code>{observation.candidate_sha256}</code></p>
      </div>
    </details>
  </section>;
}
