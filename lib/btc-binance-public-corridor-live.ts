import {
  buildBtcBinancePublicBinding,
  decideBtcBinancePublicBinding,
  type BtcBinanceAcceptedStaticPeer,
  type BtcBinancePublicBindingPacket,
} from "./btc-binance-public-binding";
import {
  loadBtcBinancePublicMarketShadow,
  type BinancePublicMarketResult,
} from "./btc-binance-public-market-source";
import { loadBtcBinanceProductionGuarded } from "./btc-binance-production-guard";
import { routeBtcCosmographerQuestion } from "./btc-cosmographer-route-graph";
import type { BtcPublicLocale } from "./btc-public-language-contract";

export type BtcBinancePublicCorridorLiveBinding = BtcBinancePublicBindingPacket;

type PublicCorridorLiveOptions = {
  locale: BtcPublicLocale;
  staticPeer: BtcBinanceAcceptedStaticPeer | null;
  env?: Record<string, string | undefined>;
  loadMarket?: (production: boolean) => Promise<BinancePublicMarketResult>;
};

function corridorQuestion(locale: BtcPublicLocale): string {
  return locale === "ru"
    ? "Что происходит с BTC сейчас?"
    : "What is happening with BTC now?";
}

export async function loadBtcBinancePublicCorridorLive(
  options: PublicCorridorLiveOptions,
): Promise<BtcBinancePublicCorridorLiveBinding | null> {
  const env = options.env ?? process.env;
  const route = routeBtcCosmographerQuestion(
    options.locale,
    corridorQuestion(options.locale),
    null,
  );
  const decision = decideBtcBinancePublicBinding({
    route,
    vercelEnv: env.VERCEL_ENV,
    disabled: env.BHRIGU_BINANCE_PUBLIC_BINDING_DISABLE === "1",
    productionEnabled: env.BHRIGU_BINANCE_PUBLIC_PRODUCTION_ENABLE === "1",
  });

  if (!decision.fetch) return null;

  const production = env.VERCEL_ENV === "production";
  let result: BinancePublicMarketResult;
  try {
    result = options.loadMarket
      ? await options.loadMarket(production)
      : production
        ? await loadBtcBinanceProductionGuarded((signal) => loadBtcBinancePublicMarketShadow({ signal }))
        : await loadBtcBinancePublicMarketShadow();
  } catch {
    return null;
  }

  return buildBtcBinancePublicBinding({
    decision,
    result,
    staticPeer: options.staticPeer,
  });
}
