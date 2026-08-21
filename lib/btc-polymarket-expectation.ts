export const BTC_POLYMARKET_EXPECTATION_SCHEMA = "bhrigu_btc_polymarket_expectation_v1" as const;

const GAMMA_BASE = "https://gamma-api.polymarket.com";
const CLOB_BASE = "https://clob.polymarket.com";
const REQUEST_TIMEOUT_MS = 6_000;
const PAGE_LIMIT = 100;

type JsonRecord = Record<string, unknown>;

export type BtcPolymarketSemantic =
  | "TERMINAL_BIN"
  | "TERMINAL_THRESHOLD"
  | "PATH_THRESHOLD"
  | "MILESTONE"
  | "MICRO"
  | "NON_PRICE"
  | "UNKNOWN";

export type BtcPolymarketQuality = "Q3_STRONG" | "Q2_USABLE" | "Q1_WEAK" | "Q0_REJECT";

export type BtcPolymarketExpectationMarket = {
  event_id: string;
  event_slug: string;
  event_title: string;
  market_id: string;
  condition_id: string | null;
  question: string;
  semantic: BtcPolymarketSemantic;
  expiry: string;
  yes_token_id: string;
  probability: number;
  best_bid: number;
  best_ask: number;
  spread: number;
  depth_near_mid: number;
  liquidity: number | null;
  volume: number | null;
  open_interest: number | null;
  quality: BtcPolymarketQuality;
  quality_score: number;
  delta_1h: number | null;
  delta_6h: number | null;
  delta_1d: number | null;
  delta_1w: number | null;
  event_url: string;
};

export type BtcPolymarketExpectationField = {
  schema_version: typeof BTC_POLYMARKET_EXPECTATION_SCHEMA;
  ok: true;
  as_of: string;
  bitcoin_tag_id: string;
  event_complete: true;
  discovered_events: number;
  discovered_markets: number;
  future_valid_markets: number;
  expectation_candidates: number;
  markets: BtcPolymarketExpectationMarket[];
  boundary: {
    expectation_evidence_only: true;
    global_btc_probability: false;
    prediction_claim: false;
    trading_signal: false;
    cross_expiry_aggregation: false;
  };
};

export type BtcPolymarketExpectationFailure = {
  schema_version: typeof BTC_POLYMARKET_EXPECTATION_SCHEMA;
  ok: false;
  as_of: string;
  code: "TAG_RESOLUTION_FAILED" | "DISCOVERY_FAILED" | "CLOB_UNAVAILABLE" | "NO_USABLE_EXPECTATION_MARKETS";
  message: string;
};

export type BtcPolymarketExpectationResult = BtcPolymarketExpectationField | BtcPolymarketExpectationFailure;

type HistoryPoint = { t: number; p: number };

type RawCandidate = {
  eventId: string;
  eventSlug: string;
  eventTitle: string;
  marketId: string;
  conditionId: string | null;
  question: string;
  semantic: BtcPolymarketSemantic;
  expiry: string;
  yesTokenId: string;
  liquidity: number | null;
  volume: number | null;
  openInterest: number | null;
};

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function finite(value: unknown): number | null {
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) ? number : null;
}

function parseMaybeJsonArray(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (typeof value !== "string") return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function fetchJson(url: string, outerSignal?: AbortSignal): Promise<unknown> {
  const controller = new AbortController();
  const onAbort = () => controller.abort();
  if (outerSignal?.aborted) controller.abort();
  else outerSignal?.addEventListener("abort", onAbort, { once: true });
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: { accept: "application/json", "user-agent": "BHRIGU-BTC-Cosmographer/1.0" },
      cache: "no-store",
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`HTTP_${response.status}`);
    return await response.json();
  } finally {
    clearTimeout(timer);
    outerSignal?.removeEventListener("abort", onAbort);
  }
}

async function resolveBitcoinTagId(signal?: AbortSignal): Promise<string | null> {
  try {
    const direct = await fetchJson(`${GAMMA_BASE}/tags/slug/bitcoin`, signal);
    if (isRecord(direct)) {
      const id = text(direct.id) || String(finite(direct.id) ?? "");
      if (id) return id;
    }
  } catch {
    // The list fallback remains slug-resolved and never hard-codes a tag id.
  }
  try {
    const listed = await fetchJson(`${GAMMA_BASE}/tags?slug=bitcoin`, signal);
    const rows = Array.isArray(listed) ? listed : isRecord(listed) && Array.isArray(listed.data) ? listed.data : [];
    const match = rows.find((item) => isRecord(item) && text(item.slug).toLowerCase() === "bitcoin");
    if (!isRecord(match)) return null;
    return text(match.id) || String(finite(match.id) ?? "") || null;
  } catch {
    return null;
  }
}

function responseRows(value: unknown): JsonRecord[] {
  if (Array.isArray(value)) return value.filter(isRecord);
  if (!isRecord(value)) return [];
  for (const key of ["data", "events", "markets", "results"]) {
    const rows = value[key];
    if (Array.isArray(rows)) return rows.filter(isRecord);
  }
  return [];
}

async function discoverAllEvents(tagId: string, signal?: AbortSignal): Promise<JsonRecord[]> {
  const events: JsonRecord[] = [];
  let offset = 0;
  for (;;) {
    const params = new URLSearchParams({
      tag_id: tagId,
      active: "true",
      closed: "false",
      limit: String(PAGE_LIMIT),
      offset: String(offset),
    });
    const page = responseRows(await fetchJson(`${GAMMA_BASE}/events?${params.toString()}`, signal));
    events.push(...page);
    if (page.length < PAGE_LIMIT) break;
    offset += PAGE_LIMIT;
  }
  return events;
}

async function marketsForEvent(event: JsonRecord, signal?: AbortSignal): Promise<JsonRecord[]> {
  if (Array.isArray(event.markets)) return event.markets.filter(isRecord);
  const eventId = text(event.id) || String(finite(event.id) ?? "");
  if (!eventId) return [];
  const rows: JsonRecord[] = [];
  let offset = 0;
  for (;;) {
    const params = new URLSearchParams({ event_id: eventId, limit: String(PAGE_LIMIT), offset: String(offset) });
    const page = responseRows(await fetchJson(`${GAMMA_BASE}/markets?${params.toString()}`, signal));
    rows.push(...page);
    if (page.length < PAGE_LIMIT) break;
    offset += PAGE_LIMIT;
  }
  return rows;
}

function marketExpiry(market: JsonRecord, event: JsonRecord): string {
  for (const value of [market.endDate, market.end_date, event.endDate, event.end_date]) {
    const candidate = text(value);
    if (candidate && Number.isFinite(new Date(candidate).getTime())) return new Date(candidate).toISOString();
  }
  return "";
}

function classifySemantic(question: string, expiry: string, asOfMs: number): BtcPolymarketSemantic {
  const q = question.toLowerCase();
  const expiryMs = new Date(expiry).getTime();
  if (/\b(?:up or down|5[- ]?minute|15[- ]?minute|hourly|next hour)\b/.test(q) || (expiryMs - asOfMs > 0 && expiryMs - asOfMs <= 4 * 3_600_000)) return "MICRO";
  const priceLike = /\$\s*\d|\b\d{2,3}(?:,?\d{3}|k)\b|price\s+(?:of\s+)?bitcoin|bitcoin\s+price|btc\s+price/i.test(question);
  if (!priceLike) return "NON_PRICE";
  if (/\b(?:between|range|from)\b[^?]{0,70}\b(?:and|to)\b/.test(q)) return "TERMINAL_BIN";
  if (/\b(?:hit|reach|touch|all[- ]time high|ath)\b/.test(q)) return /all[- ]time high|ath/.test(q) ? "MILESTONE" : "PATH_THRESHOLD";
  if (/\b(?:above|below|over|under|higher than|lower than|at least|at most)\b/.test(q)) {
    if (/\b(?:by|before|during|any time|at any point)\b/.test(q)) return "PATH_THRESHOLD";
    return "TERMINAL_THRESHOLD";
  }
  return "UNKNOWN";
}

function tokenForYes(market: JsonRecord): string | null {
  const outcomes = parseMaybeJsonArray(market.outcomes).map((value) => text(value));
  const tokenIds = parseMaybeJsonArray(market.clobTokenIds ?? market.clob_token_ids).map((value) => text(value));
  if (!tokenIds.length) return null;
  const yesIndex = outcomes.findIndex((value) => /^yes$/i.test(value));
  return tokenIds[yesIndex >= 0 ? yesIndex : 0] || null;
}

function candidateFrom(event: JsonRecord, market: JsonRecord, asOfMs: number): RawCandidate | null {
  if (market.active === false || market.closed === true) return null;
  const expiry = marketExpiry(market, event);
  const expiryMs = new Date(expiry).getTime();
  if (!expiry || !Number.isFinite(expiryMs) || expiryMs <= asOfMs) return null;
  const question = text(market.question) || text(market.title);
  const semantic = classifySemantic(question, expiry, asOfMs);
  if (["MICRO", "NON_PRICE", "UNKNOWN"].includes(semantic)) return null;
  const yesTokenId = tokenForYes(market);
  if (!yesTokenId) return null;
  const eventId = text(event.id) || String(finite(event.id) ?? "");
  const eventSlug = text(event.slug);
  const marketId = text(market.id) || String(finite(market.id) ?? "");
  if (!eventId || !marketId || !eventSlug || !question) return null;
  return {
    eventId,
    eventSlug,
    eventTitle: text(event.title) || text(event.question) || question,
    marketId,
    conditionId: text(market.conditionId ?? market.condition_id) || null,
    question,
    semantic,
    expiry,
    yesTokenId,
    liquidity: finite(market.liquidityNum ?? market.liquidity),
    volume: finite(market.volumeNum ?? market.volume),
    openInterest: finite(event.openInterest ?? event.open_interest ?? market.openInterest ?? market.open_interest),
  };
}

function bookLevels(value: unknown): Array<{ price: number; size: number }> {
  if (!Array.isArray(value)) return [];
  return value.flatMap((row) => {
    if (!isRecord(row)) return [];
    const price = finite(row.price);
    const size = finite(row.size);
    return price !== null && size !== null && price >= 0 && price <= 1 && size >= 0 ? [{ price, size }] : [];
  });
}

async function fetchBook(candidate: RawCandidate, signal?: AbortSignal): Promise<Omit<BtcPolymarketExpectationMarket, "quality" | "quality_score" | "delta_1h" | "delta_6h" | "delta_1d" | "delta_1w"> | null> {
  try {
    const raw = await fetchJson(`${CLOB_BASE}/book?token_id=${encodeURIComponent(candidate.yesTokenId)}`, signal);
    if (!isRecord(raw)) return null;
    const bids = bookLevels(raw.bids).sort((a, b) => b.price - a.price);
    const asks = bookLevels(raw.asks).sort((a, b) => a.price - b.price);
    if (!bids.length || !asks.length) return null;
    const bestBid = bids[0].price;
    const bestAsk = asks[0].price;
    if (bestAsk < bestBid) return null;
    const midpoint = (bestBid + bestAsk) / 2;
    const spread = bestAsk - bestBid;
    const near = 0.03;
    const depthNearMid = bids.filter((x) => x.price >= midpoint - near).reduce((sum, x) => sum + x.size, 0)
      + asks.filter((x) => x.price <= midpoint + near).reduce((sum, x) => sum + x.size, 0);
    return {
      event_id: candidate.eventId,
      event_slug: candidate.eventSlug,
      event_title: candidate.eventTitle,
      market_id: candidate.marketId,
      condition_id: candidate.conditionId,
      question: candidate.question,
      semantic: candidate.semantic,
      expiry: candidate.expiry,
      yes_token_id: candidate.yesTokenId,
      probability: midpoint,
      best_bid: bestBid,
      best_ask: bestAsk,
      spread,
      depth_near_mid: depthNearMid,
      liquidity: candidate.liquidity,
      volume: candidate.volume,
      open_interest: candidate.openInterest,
      event_url: `https://polymarket.com/event/${candidate.eventSlug}`,
    };
  } catch {
    return null;
  }
}

function rawQualityScore(market: Awaited<ReturnType<typeof fetchBook>> & object): number {
  const spreadScore = Math.max(0, 50 - market.spread * 500);
  const depthScore = Math.min(20, Math.log10((market.depth_near_mid ?? 0) + 1) * 5);
  const liquidityScore = Math.min(15, Math.log10((market.liquidity ?? 0) + 1) * 3);
  const volumeScore = Math.min(15, Math.log10((market.volume ?? 0) + 1) * 2.5);
  return spreadScore + depthScore + liquidityScore + volumeScore;
}

function qualityTiers(markets: Array<NonNullable<Awaited<ReturnType<typeof fetchBook>>>>): Array<BtcPolymarketExpectationMarket> {
  const scored = markets.map((market) => ({ market, score: rawQualityScore(market) })).sort((a, b) => b.score - a.score);
  const count = scored.length;
  return scored.map(({ market, score }, index) => {
    const percentile = count <= 1 ? 0.5 : index / (count - 1);
    const quality: BtcPolymarketQuality = percentile <= 0.25 ? "Q3_STRONG" : percentile <= 0.7 ? "Q2_USABLE" : "Q1_WEAK";
    return { ...market, quality, quality_score: score, delta_1h: null, delta_6h: null, delta_1d: null, delta_1w: null };
  });
}

async function mapBatched<T, U>(items: T[], size: number, fn: (item: T) => Promise<U>): Promise<U[]> {
  const results: U[] = [];
  for (let index = 0; index < items.length; index += size) {
    const batch = items.slice(index, index + size);
    results.push(...await Promise.all(batch.map(fn)));
  }
  return results;
}

async function fetchHistory(tokenId: string, asOfMs: number, signal?: AbortSignal): Promise<HistoryPoint[]> {
  const startTs = Math.floor((asOfMs - 8 * 24 * 3_600_000) / 1000);
  const endTs = Math.floor(asOfMs / 1000);
  const params = new URLSearchParams({ market: tokenId, startTs: String(startTs), endTs: String(endTs), fidelity: "60" });
  try {
    const raw = await fetchJson(`${CLOB_BASE}/prices-history?${params.toString()}`, signal);
    const rows = isRecord(raw) && Array.isArray(raw.history) ? raw.history : Array.isArray(raw) ? raw : [];
    return rows.flatMap((row) => {
      if (!isRecord(row)) return [];
      const t = finite(row.t);
      const p = finite(row.p);
      return t !== null && p !== null && p >= 0 && p <= 1 ? [{ t: t > 10_000_000_000 ? t : t * 1000, p }] : [];
    }).sort((a, b) => a.t - b.t);
  } catch {
    return [];
  }
}

function historicalDelta(history: HistoryPoint[], nowProbability: number, asOfMs: number, agoMs: number): number | null {
  const target = asOfMs - agoMs;
  const eligible = history.filter((point) => point.t <= target + 30 * 60_000);
  const point = eligible.length ? eligible[eligible.length - 1] : null;
  return point ? nowProbability - point.p : null;
}

export async function loadBtcPolymarketExpectationField(options: {
  includeHistory?: boolean;
  signal?: AbortSignal;
  now?: () => number;
} = {}): Promise<BtcPolymarketExpectationResult> {
  const now = options.now ?? Date.now;
  const asOfMs = now();
  const asOf = new Date(asOfMs).toISOString();
  const tagId = await resolveBitcoinTagId(options.signal);
  if (!tagId) return { schema_version: BTC_POLYMARKET_EXPECTATION_SCHEMA, ok: false, as_of: asOf, code: "TAG_RESOLUTION_FAILED", message: "Current Bitcoin tag could not be resolved by slug." };

  let events: JsonRecord[];
  try {
    events = await discoverAllEvents(tagId, options.signal);
  } catch {
    return { schema_version: BTC_POLYMARKET_EXPECTATION_SCHEMA, ok: false, as_of: asOf, code: "DISCOVERY_FAILED", message: "Event-complete Bitcoin discovery did not complete." };
  }

  const eventMarkets = await mapBatched(events, 8, async (event) => {
    try {
      return { event, markets: await marketsForEvent(event, options.signal) };
    } catch {
      return { event, markets: [] as JsonRecord[] };
    }
  });
  const discoveredMarkets = eventMarkets.reduce((sum, item) => sum + item.markets.length, 0);
  let futureValidMarkets = 0;
  const candidates: RawCandidate[] = [];
  for (const { event, markets } of eventMarkets) {
    for (const market of markets) {
      const expiry = marketExpiry(market, event);
      if (market.active !== false && market.closed !== true && expiry && new Date(expiry).getTime() > asOfMs) futureValidMarkets += 1;
      const candidate = candidateFrom(event, market, asOfMs);
      if (candidate) candidates.push(candidate);
    }
  }

  const books = (await mapBatched(candidates, 8, (candidate) => fetchBook(candidate, options.signal))).filter((value): value is NonNullable<typeof value> => Boolean(value));
  if (!books.length) return { schema_version: BTC_POLYMARKET_EXPECTATION_SCHEMA, ok: false, as_of: asOf, code: candidates.length ? "CLOB_UNAVAILABLE" : "NO_USABLE_EXPECTATION_MARKETS", message: candidates.length ? "No usable two-sided CLOB books were available for current expectation markets." : "No future-valid BTC price expectation markets survived semantic validation." };

  let markets = qualityTiers(books);
  if (options.includeHistory) {
    const historyTargets = markets.filter((market) => market.quality !== "Q1_WEAK").slice(0, 12);
    const histories = await mapBatched(historyTargets, 6, async (market) => ({ market, history: await fetchHistory(market.yes_token_id, asOfMs, options.signal) }));
    const deltaByToken = new Map(histories.map(({ market, history }) => [market.yes_token_id, {
      h1: historicalDelta(history, market.probability, asOfMs, 3_600_000),
      h6: historicalDelta(history, market.probability, asOfMs, 6 * 3_600_000),
      d1: historicalDelta(history, market.probability, asOfMs, 24 * 3_600_000),
      w1: historicalDelta(history, market.probability, asOfMs, 7 * 24 * 3_600_000),
    }]));
    markets = markets.map((market) => {
      const delta = deltaByToken.get(market.yes_token_id);
      return delta ? { ...market, delta_1h: delta.h1, delta_6h: delta.h6, delta_1d: delta.d1, delta_1w: delta.w1 } : market;
    });
  }

  return {
    schema_version: BTC_POLYMARKET_EXPECTATION_SCHEMA,
    ok: true,
    as_of: asOf,
    bitcoin_tag_id: tagId,
    event_complete: true,
    discovered_events: events.length,
    discovered_markets: discoveredMarkets,
    future_valid_markets: futureValidMarkets,
    expectation_candidates: candidates.length,
    markets,
    boundary: {
      expectation_evidence_only: true,
      global_btc_probability: false,
      prediction_claim: false,
      trading_signal: false,
      cross_expiry_aggregation: false,
    },
  };
}
