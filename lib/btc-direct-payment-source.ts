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
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("coingecko_payload_invalid");
  }
  if (!isRecord(parsed)) throw new Error("coingecko_payload_invalid");

  const rootMembers = scanDirectObjectMembers(raw);
  const bitcoinMembers = rootMembers.filter((member) => member.key === "bitcoin");
  if (bitcoinMembers.length !== 1 || !isRecord(parsed.bitcoin)) {
    throw new Error("coingecko_payload_invalid");
  }
  const bitcoinRaw = bitcoinMembers[0].valueRaw;
  const fields = scanDirectObjectMembers(bitcoinRaw);
  const usd = fields.filter((member) => member.key === "usd");
  const updated = fields.filter((member) => member.key === "last_updated_at");
  if (usd.length !== 1 || updated.length !== 1) throw new Error("coingecko_payload_invalid");

  const rateDecimal = usd[0].valueRaw;
  const timestampToken = updated[0].valueRaw;
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

type RawMember = { key: string; valueRaw: string };

function scanDirectObjectMembers(raw: string): RawMember[] {
  let i = skipWhitespace(raw, 0);
  if (raw[i] !== "{") throw new Error("coingecko_payload_invalid");
  i = skipWhitespace(raw, i + 1);
  const members: RawMember[] = [];
  if (raw[i] === "}") {
    if (skipWhitespace(raw, i + 1) !== raw.length) throw new Error("coingecko_payload_invalid");
    return members;
  }
  while (i < raw.length) {
    const keyToken = readJsonString(raw, i);
    const key = JSON.parse(raw.slice(i, keyToken.end)) as string;
    i = skipWhitespace(raw, keyToken.end);
    if (raw[i] !== ":") throw new Error("coingecko_payload_invalid");
    const valueStart = skipWhitespace(raw, i + 1);
    const valueEnd = scanJsonValueEnd(raw, valueStart);
    members.push({ key, valueRaw: raw.slice(valueStart, valueEnd) });
    i = skipWhitespace(raw, valueEnd);
    if (raw[i] === ",") {
      i = skipWhitespace(raw, i + 1);
      continue;
    }
    if (raw[i] === "}") {
      if (skipWhitespace(raw, i + 1) !== raw.length) throw new Error("coingecko_payload_invalid");
      return members;
    }
    throw new Error("coingecko_payload_invalid");
  }
  throw new Error("coingecko_payload_invalid");
}

function scanJsonValueEnd(raw: string, start: number): number {
  const first = raw[start];
  if (first === '"') return readJsonString(raw, start).end;
  if (first === "{" || first === "[") {
    const stack: string[] = [first === "{" ? "}" : "]"];
    let i = start + 1;
    while (i < raw.length && stack.length) {
      const ch = raw[i];
      if (ch === '"') {
        i = readJsonString(raw, i).end;
        continue;
      }
      if (ch === "{") stack.push("}");
      else if (ch === "[") stack.push("]");
      else if (ch === stack[stack.length - 1]) stack.pop();
      i += 1;
    }
    if (stack.length) throw new Error("coingecko_payload_invalid");
    return i;
  }
  let i = start;
  while (i < raw.length && !/[\s,}\]]/.test(raw[i])) i += 1;
  if (i === start) throw new Error("coingecko_payload_invalid");
  return i;
}

function readJsonString(raw: string, start: number): { end: number } {
  if (raw[start] !== '"') throw new Error("coingecko_payload_invalid");
  let i = start + 1;
  while (i < raw.length) {
    if (raw[i] === "\\") {
      i += 2;
      continue;
    }
    if (raw[i] === '"') return { end: i + 1 };
    i += 1;
  }
  throw new Error("coingecko_payload_invalid");
}

function skipWhitespace(raw: string, start: number): number {
  let i = start;
  while (i < raw.length && /\s/.test(raw[i])) i += 1;
  return i;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}
