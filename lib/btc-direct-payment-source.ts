import type { BtcUsdQuoteSource } from "./btc-direct-payment";

const COINGECKO_SIMPLE_PRICE = "https://api.coingecko.com/api/v3/simple/price";

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
      const body = (await response.json()) as any;
      const rate = body?.bitcoin?.usd;
      const updated = body?.bitcoin?.last_updated_at;
      if ((typeof rate !== "number" && typeof rate !== "string") || !Number.isInteger(updated)) {
        throw new Error("coingecko_payload_invalid");
      }
      return {
        rateDecimal: String(rate),
        sourceTimestamp: new Date(updated * 1000).toISOString(),
      };
    },
  };
}
