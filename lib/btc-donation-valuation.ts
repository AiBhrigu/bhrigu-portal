export const DONATION_VALUATION_SOURCE = "MEMPOOL_SPACE_HISTORICAL_PRICE_V1";
export const DONATION_VALUATION_CURRENCY = "USD";
export const DONATION_VALUATION_ASSET = "BTC";
export const DONATION_VALUATION_CLASSIFICATION = "VOLUNTARY_NON_CHARITABLE_SUPPORT";
export const DONATION_VALUATION_PROVENANCE = "https://mempool.space/api/v1/historical-price";
const MAX_RAW_BODY_BYTES = 32_768;
const DECIMAL = /^(?:0|[1-9]\d{0,29})(?:\.\d{1,40})?$/;

export type DonationValuationPoint = "FIRST_SEEN" | "CONFIRMATION_1";

export type DonationValuationRecord = {
  receiptId: string;
  valuationPoint: DonationValuationPoint;
  asset: typeof DONATION_VALUATION_ASSET;
  amountSats: string;
  classification: typeof DONATION_VALUATION_CLASSIFICATION;
  noConsideration: true;
  requestedValuationTimestamp: string;
  sourceReturnedTimestamp: string;
  retrievalTimestamp: string;
  valuationSource: typeof DONATION_VALUATION_SOURCE;
  valuationSourceProvenance: string;
  btcReferencePrice: string;
  fiatReferenceCurrency: typeof DONATION_VALUATION_CURRENCY;
  fiatReferenceValue: string;
  createdAt: string;
};

export type DonationValuationStore = {
  findValuation(receiptId: string, point: DonationValuationPoint): Promise<DonationValuationRecord | null>;
  recordValuation(record: DonationValuationRecord): Promise<"created" | "replay" | "conflict">;
};

export type DonationHistoricalPriceSource = {
  fetchAt(requestedTimestamp: string): Promise<{
    sourceReturnedTimestamp: string;
    retrievalTimestamp: string;
    btcReferencePrice: string;
    provenance: string;
  }>;
};

export function createMempoolHistoricalPriceSource(input: {
  fetchImpl?: typeof fetch;
  now?: () => Date;
} = {}): DonationHistoricalPriceSource {
  const fetchImpl = input.fetchImpl ?? fetch;
  const now = input.now ?? (() => new Date());
  return {
    async fetchAt(requestedTimestamp: string) {
      const requestedMs = Date.parse(requestedTimestamp);
      if (!Number.isFinite(requestedMs)) throw new Error("donation_valuation_timestamp_invalid");
      const requestedUnix = Math.floor(requestedMs / 1000);
      const url = new URL(DONATION_VALUATION_PROVENANCE);
      url.searchParams.set("currency", DONATION_VALUATION_CURRENCY);
      url.searchParams.set("timestamp", String(requestedUnix));
      const response = await fetchImpl(url, {
        method: "GET",
        headers: { Accept: "application/json" },
        cache: "no-store",
        signal: AbortSignal.timeout(8000),
      });
      if (!response.ok) throw new Error(`donation_valuation_http_${response.status}`);
      const point = parseMempoolHistoricalPriceRaw(await response.text());
      return {
        ...point,
        retrievalTimestamp: now().toISOString(),
        provenance: url.toString(),
      };
    },
  };
}

export function parseMempoolHistoricalPriceRaw(raw: string): {
  sourceReturnedTimestamp: string;
  btcReferencePrice: string;
} {
  if (typeof raw !== "string" || raw.length === 0 || raw.length > MAX_RAW_BODY_BYTES) {
    throw new Error("donation_valuation_payload_invalid");
  }
  let parsed: unknown;
  try { parsed = JSON.parse(raw); } catch { throw new Error("donation_valuation_payload_invalid"); }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("donation_valuation_payload_invalid");
  const root = parsed as Record<string, unknown>;
  if (!Array.isArray(root.prices) || root.prices.length !== 1) throw new Error("donation_valuation_payload_invalid");
  const pricePoint = root.prices[0];
  if (!pricePoint || typeof pricePoint !== "object" || Array.isArray(pricePoint)) throw new Error("donation_valuation_payload_invalid");
  const point = pricePoint as Record<string, unknown>;
  if (Object.keys(point).sort().join(",") !== "USD,time") throw new Error("donation_valuation_payload_invalid");

  const pricesObject = raw.match(/"prices"\s*:\s*\[\s*(\{[^{}]*\})\s*\]/);
  if (!pricesObject) throw new Error("donation_valuation_payload_invalid");
  const timeMatch = pricesObject[1].match(/"time"\s*:\s*(\d{1,16})/);
  const usdMatch = pricesObject[1].match(/"USD"\s*:\s*((?:0|[1-9]\d{0,29})(?:\.\d{1,40})?)/);
  if (!timeMatch || !usdMatch) throw new Error("donation_valuation_payload_invalid");
  const timestampToken = timeMatch[1];
  const priceToken = usdMatch[1];
  if (!DECIMAL.test(priceToken) || /^0(?:\.0+)?$/.test(priceToken)) throw new Error("donation_valuation_payload_invalid");
  const timestampSeconds = Number(timestampToken);
  if (!Number.isSafeInteger(timestampSeconds) || timestampSeconds <= 0) throw new Error("donation_valuation_payload_invalid");
  if (point.time !== timestampSeconds || typeof point.USD !== "number" || !Number.isFinite(point.USD) || point.USD <= 0) {
    throw new Error("donation_valuation_payload_invalid");
  }
  return {
    sourceReturnedTimestamp: new Date(timestampSeconds * 1000).toISOString(),
    btcReferencePrice: priceToken,
  };
}

export function exactFiatReferenceValue(amountSats: string, btcReferencePrice: string): string {
  if (!/^[1-9]\d{0,18}$/.test(amountSats)) throw new Error("donation_valuation_sats_invalid");
  if (!DECIMAL.test(btcReferencePrice) || /^0(?:\.0+)?$/.test(btcReferencePrice)) throw new Error("donation_valuation_price_invalid");
  const [whole, fraction = ""] = btcReferencePrice.split(".");
  const priceInteger = BigInt(whole + fraction);
  const valueInteger = BigInt(amountSats) * priceInteger;
  const scaleDigits = fraction.length + 8;
  const digits = valueInteger.toString().padStart(scaleDigits + 1, "0");
  const intPart = digits.slice(0, -scaleDigits) || "0";
  const fracPart = digits.slice(-scaleDigits).replace(/0+$/, "");
  return fracPart ? `${intPart}.${fracPart}` : intPart;
}

export async function ensureDonationReceiptValuations(input: {
  receiptId: string;
  amountSats: string;
  firstSeenAt: string;
  observation: { confirmations: number; spvVerified: boolean; blockHeight: string | null; blockHash: string | null; observedAt: string };
  store: DonationValuationStore;
  source: DonationHistoricalPriceSource;
  now?: () => Date;
}): Promise<{ firstSeen: "created" | "replay"; confirmation1: "created" | "replay" | "not_applicable" }> {
  const firstSeen = await ensurePoint(input, "FIRST_SEEN", input.firstSeenAt);
  let confirmation1: "created" | "replay" | "not_applicable" = "not_applicable";
  if (input.observation.confirmations >= 1 && input.observation.spvVerified && input.observation.blockHeight && input.observation.blockHash) {
    confirmation1 = await ensurePoint(input, "CONFIRMATION_1", input.observation.observedAt);
  }
  return { firstSeen, confirmation1 };
}

async function ensurePoint(
  input: Parameters<typeof ensureDonationReceiptValuations>[0],
  point: DonationValuationPoint,
  requestedTimestamp: string
): Promise<"created" | "replay"> {
  const existing = await input.store.findValuation(input.receiptId, point);
  if (existing) {
    if (
      existing.amountSats !== input.amountSats ||
      existing.asset !== DONATION_VALUATION_ASSET ||
      existing.classification !== DONATION_VALUATION_CLASSIFICATION ||
      existing.noConsideration !== true ||
      existing.valuationSource !== DONATION_VALUATION_SOURCE ||
      existing.fiatReferenceCurrency !== DONATION_VALUATION_CURRENCY
    ) throw new Error("donation_valuation_conflict");
    return "replay";
  }
  let sourcePoint;
  try { sourcePoint = await input.source.fetchAt(requestedTimestamp); }
  catch { throw new Error("donation_valuation_unavailable"); }
  const createdAt = (input.now ?? (() => new Date()))().toISOString();
  const record: DonationValuationRecord = {
    receiptId: input.receiptId,
    valuationPoint: point,
    asset: DONATION_VALUATION_ASSET,
    amountSats: input.amountSats,
    classification: DONATION_VALUATION_CLASSIFICATION,
    noConsideration: true,
    requestedValuationTimestamp: new Date(requestedTimestamp).toISOString(),
    sourceReturnedTimestamp: sourcePoint.sourceReturnedTimestamp,
    retrievalTimestamp: sourcePoint.retrievalTimestamp,
    valuationSource: DONATION_VALUATION_SOURCE,
    valuationSourceProvenance: sourcePoint.provenance,
    btcReferencePrice: sourcePoint.btcReferencePrice,
    fiatReferenceCurrency: DONATION_VALUATION_CURRENCY,
    fiatReferenceValue: exactFiatReferenceValue(input.amountSats, sourcePoint.btcReferencePrice),
    createdAt,
  };
  const disposition = await input.store.recordValuation(record);
  if (disposition === "conflict") throw new Error("donation_valuation_conflict");
  return disposition;
}
