import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { BtcBinanceCurrentVenuePanel } from "../components/btc/BtcBinanceCurrentVenue";
import type { BtcBinancePublicBindingPacket } from "../lib/btc-binance-public-binding";
import { loadBtcBinancePublicCorridorLive } from "../lib/btc-binance-public-corridor-live";

const boundary: BtcBinancePublicBindingPacket["boundary"] = {
  venue_specific_observation: true,
  accepted_snapshot_remains_primary: true,
  base_answer_rewrite: false,
  global_btc_price_claim: false,
  raw_provider_payload_exposed: false,
  session_live_value_persistence: false,
  trading_authority: false,
  withdrawal_authority: false,
  transfer_authority: false,
};

const binding: BtcBinancePublicBindingPacket = {
  schema_version: "btc_binance_public_binding_v0_1",
  status: "READY",
  mode: "BTC_FIELD_NOW",
  preview_only: true,
  production_enabled: false,
  provider: "Binance",
  venue: "Binance Spot",
  market: "spot",
  symbol: "BTCUSDT",
  observed_at: "2026-08-20T01:02:03Z",
  retrieved_at: "2026-08-20T01:02:03Z",
  freshness_state: "FRESH",
  facts: [
    { id: "last_price", label_en: "Last price", label_ru: "Последняя цена", value: "69234.01000000", unit: "USDT/BTC", authority_layer: "RAW" },
    { id: "best_bid", label_en: "Best bid", label_ru: "Лучшая цена покупки", value: "69234.00000000", unit: "USDT/BTC", authority_layer: "RAW" },
    { id: "best_ask", label_en: "Best ask", label_ru: "Лучшая цена продажи", value: "69234.01000000", unit: "USDT/BTC", authority_layer: "RAW" },
    { id: "change_24h_pct", label_en: "Rolling 24h change", label_ru: "Изменение за скользящие 24ч", value: "7.134", unit: "%", authority_layer: "RAW" },
  ],
  proof: [],
  source_comparison: {
    status: "NOT_COMPARABLE",
    reasons: ["QUOTE_BASIS_MISMATCH", "TIME_WINDOW_MISMATCH"],
    materiality: "UNCALIBRATED",
    winner: null,
  },
  failure: null,
  boundary,
};

const en = renderToStaticMarkup(<BtcBinanceCurrentVenuePanel locale="en" binding={binding}/>);
assert.match(en, /data-binance-public-corridor-live="true"/);
assert.match(en, /Binance Spot · BTCUSDT/);
assert.match(en, /69,234\.01/);
assert.match(en, /\+7\.13%/);
assert.match(en, /69,234\.00 USDT/);
assert.match(en, /Fresh/);
assert.match(en, /supplements but does not replace the accepted Market Snapshot/);
assert.match(en, /different observation times and quote bases/);
assert.match(en, /not a global Bitcoin price, on-chain truth, or trading signal/);
assert.doesNotMatch(en, /69234\.01000000/);
assert.doesNotMatch(en, /QUOTE_BASIS_MISMATCH|TIME_WINDOW_MISMATCH/);

const ru = renderToStaticMarkup(<BtcBinanceCurrentVenuePanel locale="ru" binding={binding}/>);
assert.match(ru, /Текущее наблюдение площадки/);
assert.match(ru, /Последняя цена/);
assert.match(ru, /Изменение 24ч/);
assert.match(ru, /Свежие данные/);
assert.match(ru, /не заменяют принятый Market Snapshot/);
assert.match(ru, /разному времени и базе котировки/);
assert.doesNotMatch(ru, /69234\.01000000/);
assert.doesNotMatch(ru, /QUOTE_BASIS_MISMATCH|TIME_WINDOW_MISMATCH/);

const page = readFileSync("pages/crypto-astro/btc.tsx", "utf8");
const snapshotIndex = page.indexOf('id="snapshot-authority"');
const liveIndex = page.indexOf("<BtcBinanceCurrentVenuePanel");
const questionIndex = page.indexOf("<BtcQuestionMembrane");
assert.ok(snapshotIndex >= 0 && liveIndex > snapshotIndex && questionIndex > liveIndex, "Live Binance surface must sit after accepted Snapshot and before prepared questions");
assert.match(page, /loadBtcBinancePublicCorridorLive/);
assert.match(page, /accepted_snapshot|staticPeer/i);

const adapter = readFileSync("lib/btc-binance-public-corridor-live.ts", "utf8");
assert.match(adapter, /decideBtcBinancePublicBinding/);
assert.match(adapter, /loadBtcBinanceProductionGuarded/);
assert.match(adapter, /loadBtcBinancePublicMarketShadow/);
assert.match(adapter, /buildBtcBinancePublicBinding/);
assert.doesNotMatch(adapter, /API[_ -]?KEY|account access|withdraw/i);

const disabled = await loadBtcBinancePublicCorridorLive({
  locale: "en",
  staticPeer: null,
  env: {
    VERCEL_ENV: "production",
    BHRIGU_BINANCE_PUBLIC_BINDING_DISABLE: "1",
    BHRIGU_BINANCE_PUBLIC_PRODUCTION_ENABLE: "1",
  },
  loadMarket: async () => { throw new Error("must not fetch when disabled"); },
});
assert.equal(disabled, null);

const productionOff = await loadBtcBinancePublicCorridorLive({
  locale: "en",
  staticPeer: null,
  env: {
    VERCEL_ENV: "production",
    BHRIGU_BINANCE_PUBLIC_PRODUCTION_ENABLE: "0",
  },
  loadMarket: async () => { throw new Error("must not fetch when production gate is off"); },
});
assert.equal(productionOff, null);

console.log("BTC_BINANCE_PUBLIC_CORRIDOR_CURRENT_PRICE_SURFACE=PASS");
console.log("CURRENT_BINANCE_PRICE_VISIBLE=PASS");
console.log("DISPLAY_PRECISION_BOUNDED=PASS");
console.log("ACCEPTED_SNAPSHOT_PRIMARY=PASS");
console.log("VENUE_SPECIFIC_BOUNDARY=PASS");
console.log("MACHINE_ENUM_PUBLIC_LEAK=ZERO_ON_CORRIDOR_SURFACE");
console.log("PRODUCTION_GATE_AND_KILL_SWITCH=PRESERVED");
