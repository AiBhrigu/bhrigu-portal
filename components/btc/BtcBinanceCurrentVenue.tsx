import React from "react";
import type { BtcBinancePublicBindingPacket } from "../../lib/btc-binance-public-binding";
import { formatBtcUtcTimestamp, type BtcPublicLocale } from "../../lib/btc-public-language-contract";

function factValue(binding: BtcBinancePublicBindingPacket, id: string): string | null {
  return binding.facts.find((item) => item.id === id)?.value ?? null;
}

function number(locale: BtcPublicLocale, value: string | null, digits = 2): string | null {
  if (value === null) return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  return new Intl.NumberFormat(locale === "ru" ? "ru-RU" : "en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(parsed);
}

function signedPercent(locale: BtcPublicLocale, value: string | null): string | null {
  const formatted = number(locale, value, 2);
  if (formatted === null || value === null) return null;
  return Number(value) > 0 ? `+${formatted}%` : `${formatted}%`;
}

function freshness(locale: BtcPublicLocale, state: BtcBinancePublicBindingPacket["freshness_state"]): string {
  if (state === "FRESH") return locale === "ru" ? "Свежие данные" : "Fresh";
  if (state === "STALE_LIMITED") return locale === "ru" ? "Ограниченная свежесть" : "Freshness limited";
  return locale === "ru" ? "Недоступно" : "Unavailable";
}

export function BtcBinanceCurrentVenuePanel({
  locale,
  binding,
}: {
  locale: BtcPublicLocale;
  binding: BtcBinancePublicBindingPacket;
}) {
  const ru = locale === "ru";
  const last = number(locale, factValue(binding, "last_price"));
  const change = signedPercent(locale, factValue(binding, "change_24h_pct"));
  const bid = number(locale, factValue(binding, "best_bid"));
  const ask = number(locale, factValue(binding, "best_ask"));
  const ready = binding.status === "READY" && last !== null;
  const observed = binding.observed_at ? formatBtcUtcTimestamp(locale, binding.observed_at) : null;
  const liveHref = `/crypto-astro/btc/live?lang=${locale}&q=${encodeURIComponent(
    ru ? "Что происходит с BTC сейчас?" : "What is happening with BTC now?",
  )}`;

  return <section
    id="binance-live-observation"
    className="readingZone binanceCurrentVenue"
    aria-labelledby="binance-live-observation-title"
    data-binance-public-corridor-live="true"
    data-binance-binding-status={binding.status}
    data-binance-freshness={binding.freshness_state}
    data-accepted-snapshot-remains-primary={String(binding.boundary.accepted_snapshot_remains_primary)}
    data-venue-specific-observation={String(binding.boundary.venue_specific_observation)}
    data-trading-authority={String(binding.boundary.trading_authority)}
  >
    <header className="binanceCurrentVenueHeader">
      <div>
        <p className="eyebrow">{ru ? "Текущее наблюдение площадки" : "Live venue observation"}</p>
        <h2 id="binance-live-observation-title">Binance Spot · BTCUSDT</h2>
      </div>
      <p>{ru
        ? "Оперативные данные одной биржевой площадки. Они дополняют, но не заменяют принятый Market Snapshot."
        : "Current data from one trading venue. It supplements but does not replace the accepted Market Snapshot."}</p>
    </header>

    {ready ? <>
      <div className="binanceCurrentVenuePrimary" data-binance-current-price="visible">
        <span>{ru ? "Последняя цена" : "Last price"}</span>
        <strong>{last} <small>USDT/BTC</small></strong>
        {observed && <time dateTime={binding.observed_at ?? undefined}>{observed}</time>}
      </div>
      <dl className="binanceCurrentVenueMetrics">
        <div data-binance-corridor-fact="change_24h_pct">
          <dt>{ru ? "Изменение 24ч" : "24h change"}</dt>
          <dd>{change ?? "—"}</dd>
        </div>
        <div data-binance-corridor-fact="best_bid">
          <dt>{ru ? "Лучшая покупка" : "Best bid"}</dt>
          <dd>{bid ? `${bid} USDT` : "—"}</dd>
        </div>
        <div data-binance-corridor-fact="best_ask">
          <dt>{ru ? "Лучшая продажа" : "Best ask"}</dt>
          <dd>{ask ? `${ask} USDT` : "—"}</dd>
        </div>
        <div data-binance-corridor-fact="freshness">
          <dt>{ru ? "Свежесть" : "Freshness"}</dt>
          <dd>{freshness(locale, binding.freshness_state)}</dd>
        </div>
      </dl>
    </> : <div className="binanceCurrentVenueUnavailable" data-binance-live-unavailable="true">
      <strong>{ru ? "Текущее наблюдение Binance временно недоступно." : "The current Binance observation is temporarily unavailable."}</strong>
      <p>{ru
        ? "BTC Field продолжает работать на принятом Market Snapshot; Binance не используется как замена основной authority."
        : "BTC Field continues on the accepted Market Snapshot; Binance is not used as a replacement for primary authority."}</p>
    </div>}

    <div className="binanceCurrentVenueBoundary">
      <p>{ru
        ? "Binance Spot BTCUSDT — цена конкретной площадки, а не глобальная цена Bitcoin, on-chain истина или торговый сигнал."
        : "Binance Spot BTCUSDT is a venue-specific price, not a global Bitcoin price, on-chain truth, or trading signal."}</p>
      {binding.source_comparison?.status === "NOT_COMPARABLE" && <p data-binance-comparison-humanized="true">{ru
        ? "Принятый Snapshot и Binance-наблюдение относятся к разному времени и базе котировки, поэтому прямое числовое сравнение здесь не выполняется."
        : "The accepted Snapshot and the Binance observation use different observation times and quote bases, so no direct numerical comparison is made here."}</p>}
      <a href={liveHref}>{ru ? "Открыть Binance evidence в диалоге →" : "Open Binance evidence in dialogue →"}</a>
    </div>

    <style jsx>{`
      .binanceCurrentVenue{position:relative;isolation:isolate;padding-top:clamp(28px,4vw,46px)}
      .binanceCurrentVenue:before{content:"";position:absolute;top:18px;left:0;width:61.803%;height:1px;background:linear-gradient(90deg,var(--blue),var(--b),transparent)}
      .binanceCurrentVenueHeader{display:grid;grid-template-columns:minmax(0,61.803fr) minmax(280px,38.197fr);gap:clamp(24px,4vw,54px);align-items:end}
      .binanceCurrentVenueHeader h2{margin:7px 0 0;font-size:clamp(27px,4vw,44px);line-height:1.05}
      .binanceCurrentVenueHeader>p{margin:0;color:var(--t2);line-height:1.55}
      .binanceCurrentVenuePrimary{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:5px 20px;align-items:end;margin-top:24px;padding:20px 0;border-block:1px solid var(--bl)}
      .binanceCurrentVenuePrimary>span{color:var(--m);font-size:9px;letter-spacing:.11em;text-transform:uppercase}
      .binanceCurrentVenuePrimary strong{grid-row:2;font-size:clamp(34px,5vw,58px);line-height:1;font-variant-numeric:tabular-nums}
      .binanceCurrentVenuePrimary small{color:var(--m);font-size:11px;font-weight:650;letter-spacing:.05em}
      .binanceCurrentVenuePrimary time{grid-column:2;grid-row:1/3;align-self:center;color:var(--m);font-size:11px}
      .binanceCurrentVenueMetrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));margin:0;border-bottom:1px solid var(--bl)}
      .binanceCurrentVenueMetrics>div{padding:14px 12px;border-left:1px solid rgba(238,232,220,.08)}
      .binanceCurrentVenueMetrics>div:first-child{border-left:0}
      .binanceCurrentVenueMetrics dt{color:var(--m);font-size:9px;letter-spacing:.08em;text-transform:uppercase}
      .binanceCurrentVenueMetrics dd{margin:6px 0 0;color:var(--t);font-size:16px;font-weight:800;font-variant-numeric:tabular-nums}
      .binanceCurrentVenueBoundary{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px 26px;align-items:start;padding:18px 0 0}
      .binanceCurrentVenueBoundary p{grid-column:1;margin:0;color:var(--t2);font-size:12px;line-height:1.55}
      .binanceCurrentVenueBoundary a{grid-column:2;grid-row:1/3;color:var(--bh);font-size:11px;font-weight:750;text-decoration:none;white-space:nowrap}
      .binanceCurrentVenueUnavailable{margin-top:24px;padding:18px;border:1px solid rgba(210,164,95,.26);border-radius:14px;background:rgba(210,164,95,.045)}
      .binanceCurrentVenueUnavailable p{margin:7px 0 0;color:var(--t2);line-height:1.55}
      @media(max-width:900px){.binanceCurrentVenueHeader{grid-template-columns:1fr}.binanceCurrentVenueMetrics{grid-template-columns:1fr 1fr}.binanceCurrentVenueBoundary{grid-template-columns:1fr}.binanceCurrentVenueBoundary a{grid-column:1;grid-row:auto;white-space:normal}.binanceCurrentVenuePrimary{grid-template-columns:1fr}.binanceCurrentVenuePrimary time{grid-column:1;grid-row:auto}}
      @media(max-width:520px){.binanceCurrentVenueMetrics{grid-template-columns:1fr}.binanceCurrentVenueMetrics>div{border-left:0;border-top:1px solid rgba(238,232,220,.08)}.binanceCurrentVenuePrimary strong{font-size:clamp(32px,10.5vw,44px)}}
    `}</style>
  </section>;
}
