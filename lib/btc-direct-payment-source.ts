import type { BtcUsdQuoteSource } from "./btc-direct-payment";

const COINGECKO_SIMPLE_PRICE = "https://api.coingecko.com/api/v3/simple/price";
const MAX_RAW_BODY_BYTES = 16_384;
const DECIMAL_TOKEN = /^(?:0|[1-9]\d{0,29})(?:\.\d{1,40})?$/;

export function createCoinGeckoBtcUsdSource(input: {
  demoApiKey?: string | null;
  fetchImpl?: typeof fetch;
} = {}): BtcUsdQuoteSource {
  const fetchImpl = input.fetchImpl ?? fetch;
  return {
    async fetch() {
      const url = new URL(COINGECKO_SIMPLE_PRICE);
      url.searchParams.set("ids", "bitcoin");
      url.searchParams.set("vs_currencies", "usd");
      url.searchParams.set("include_last_updated_at", "true");
      url.searchParams.set("precision", "full");
      const headers: Record<string, string> = { Accept: "application/json" };
      const key = input.demoApiKey?.trim();
      if (key) headers["x-cg-demo-api-key"] = key;

      const response = await fetchImpl(url, {
        method: "GET",
        headers,
        signal: AbortSignal.timeout(8000),
        cache: "no-store",
      });
      if (!response.ok) throw new Error(`coingecko_http_${response.status}`);
      return parseCoinGeckoSimplePriceRaw(await response.text());
    },
  };
}

export function parseCoinGeckoSimplePriceRaw(raw: string): {
  rateDecimal: string;
  sourceTimestamp: string;
} {
  if (typeof raw !== "string" || raw.length === 0 || raw.length > MAX_RAW_BODY_BYTES) {
    throw new Error("coingecko_payload_invalid");
  }
  const bitcoinMatches = raw.match(/"bitcoin"\s*:/g) ?? [];
  if (bitcoinMatches.length !== 1) throw new Error("coingecko_payload_invalid");
  const bitcoin = /"bitcoin"\s*:\s*\{([\s\S]*?)\}/.exec(raw)?.[1];
  if (!bitcoin) throw new Error("coingecko_payload_invalid");

  const rateMatches = bitcoin.match(/"usd"\s*:\s*([^,}\s]+)/g) ?? [];
  const timestampMatches = bitcoin.match(/"last_updated_at"\s*:\s*([^,}\s]+)/g) ?? [];
  if (rateMatches.length !== 1 || timestampMatches.length !== 1) {
    throw new Error("coingecko_payload_invalid");
  }
  const rateDecimal = /"usd"\s*:\s*([^,}\s]+)/.exec(rateMatches[0])?.[1] ?? "";
  const timestampToken = /"last_updated_at"\s*:\s*([^,}\s]+)/.exec(timestampMatches[0])?.[1] ?? "";
  if (!DECIMAL_TOKEN.test(rateDecimal) || /^0(?:\.0+)?$/.test(rateDecimal)) {
    throw new Error("coingecko_payload_invalid");
  }
  if (!/^\d{1,16}$/.test(timestampToken)) throw new Error("coingecko_payload_invalid");
  const timestampSeconds = Number(timestampToken);
  if (!Number.isSafeInteger(timestampSeconds) || timestampSeconds <= 0) {
    throw new Error("coingecko_payload_invalid");
  }
  const sourceTime = new Date(timestampSeconds * 1000);
  if (Number.isNaN(sourceTime.getTime())) throw new Error("coingecko_payload_invalid");
  return { rateDecimal, sourceTimestamp: sourceTime.toISOString() };
}
