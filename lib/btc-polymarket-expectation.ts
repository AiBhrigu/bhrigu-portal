export const BTC_POLYMARKET_EXPECTATION_SCHEMA = "bhrigu_btc_polymarket_expectation_v1" as const;

const GAMMA_BASE = "https://gamma-api.polymarket.com";
const CLOB_BASE = "https://clob.polymarket.com";
const DATA_BASE = "https://data-api.polymarket.com";
const REQUEST_TIMEOUT_MS = 6_000;
const PAGE_LIMIT = 100;
const MAX_KEYSET_PAGES = 50;
const BITCOIN_TAG_SLUG = "bitcoin" as const;
const CONDITION_ID_PATTERN = /^0x[a-fA-F0-9]{64}$/;
const MAX_USABLE_SPREAD = 0.10;
const MIN_USABLE_DEPTH_NEAR_MID = 100;
const MAX_REJECT_SPREAD = 0.25;
const MIN_REJECT_DEPTH_NEAR_MID = 10;
const MAX_STRONG_SPREAD = 0.04;
const MIN_STRONG_DEPTH_NEAR_MID = 500;

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
  resolution_rules: string;
  resolution_source: string | null;
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
  bitcoin_tag_id: string | null;
  bitcoin_tag_slug: typeof BITCOIN_TAG_SLUG;
  discovery_method: "GAMMA_EVENTS_KEYSET";
  discovery_pages: number;
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
  conditionId: string;
  question: string;
  semantic: BtcPolymarketSemantic;
  expiry: string;
  resolutionRules: string;
  resolutionSource: string | null;
  yesTokenId: string;
  liquidity: number | null;
  volume: number | null;
};

type EventDiscovery = { events: JsonRecord[]; pages: number };

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

function recordIdentity(value: unknown): string {
  return text(value) || String(finite(value) ?? "");
}

function bitcoinTagIdFromEvents(events: JsonRecord[]): string | null {
  for (const event of events) {
    const tags = Array.isArray(event.tags) ? event.tags : [];
    for (const tag of tags) {
      if (!isRecord(tag) || text(tag.slug).toLowerCase() !== BITCOIN_TAG_SLUG) continue;
      const id = recordIdentity(tag.id);
      if (id) return id;
    }
  }
  return null;
}

async function discoverAllEvents(asOfMs: number, signal?: AbortSignal): Promise<EventDiscovery> {
  const eventsById = new Map<string, JsonRecord>();
  const seenCursors = new Set<string>();
  let afterCursor: string | null = null;
  let pages = 0;

  for (;;) {
    if (pages >= MAX_KEYSET_PAGES) throw new Error("KEYSET_PAGE_LIMIT_EXCEEDED");
    const params = new URLSearchParams({
      tag_slug: BITCOIN_TAG_SLUG,
      closed: "false",
      end_date_min: new Date(asOfMs).toISOString(),
      limit: String(PAGE_LIMIT),
    });
    if (afterCursor) params.set("after_cursor", afterCursor);

    const raw = await fetchJson(`${GAMMA_BASE}/events/keyset?${params.toString()}`, signal);
    if (!isRecord(raw) || !Array.isArray(raw.events)) throw new Error("KEYSET_EVENTS_INVALID");
    pages += 1;

    for (const event of raw.events) {
      if (!isRecord(event)) throw new Error("KEYSET_EVENT_INVALID");
      const eventId = recordIdentity(event.id);
      if (!eventId) throw new Error("KEYSET_EVENT_ID_MISSING");
      if (!Array.isArray(event.markets)) throw new Error(`KEYSET_EVENT_MARKETS_MISSING:${eventId}`);
      eventsById.set(eventId, event);
    }

    const nextCursor = text(raw.next_cursor);
    if (!nextCursor) return { events: Array.from(eventsById.values()), pages };
    if (nextCursor === afterCursor || seenCursors.has(nextCursor)) throw new Error("KEYSET_CURSOR_LOOP");
    seenCursors.add(nextCursor);
    afterCursor = nextCursor;
  }
}

function marketExpiry(market: JsonRecord): string {
  for (const value of [market.endDate, market.end_date]) {
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
  const yesIndex = outcomes.findIndex((value) => /^yes$/i.test(value));
  if (yesIndex < 0) return null;
  return tokenIds[yesIndex] || null;
}

function candidateFrom(event: JsonRecord, market: JsonRecord, asOfMs: number): RawCandidate | null {
  if (market.active !== true || market.closed !== false || market.archived !== false) return null;
  if (market.acceptingOrders !== true || market.enableOrderBook !== true) return null;

  const expiry = marketExpiry(market);
  const expiryMs = new Date(expiry).getTime();
  if (!expiry || !Number.isFinite(expiryMs) || expiryMs <= asOfMs) return null;

  const question = text(market.question) || text(market.title);
  const resolutionRules = text(market.description);
  const conditionId = text(market.conditionId ?? market.condition_id);
  if (!question || !resolutionRules || !CONDITION_ID_PATTERN.test(conditionId)) return null;

  const semantic = classifySemantic(question, expiry, asOfMs);
  if (["MICRO", "NON_PRICE", "UNKNOWN"].includes(semantic)) return null;
  const yesTokenId = tokenForYes(market);
  if (!yesTokenId) return null;

  const eventId = recordIdentity(event.id);
  const eventSlug = text(event.slug);
  const marketId = recordIdentity(market.id);
  if (!eventId || !marketId || !eventSlug) return null;

  return {
    eventId,
    eventSlug,
    eventTitle: text(event.title) || text(event.question) || question,
    marketId,
    conditionId,
    question,
    semantic,
    expiry,
    resolutionRules,
    resolutionSource: text(market.resolutionSource ?? market.resolution_source) || null,
    yesTokenId,
    liquidity: finite(market.liquidityNum ?? market.liquidity),
    volume: finite(market.volumeNum ?? market.volume),
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
      resolution_rules: candidate.resolutionRules,
      resolution_source: candidate.resolutionSource,
      yes_token_id: candidate.yesTokenId,
      probability: midpoint,
      best_bid: bestBid,
      best_ask: bestAsk,
      spread,
      depth_near_mid: depthNearMid,
      liquidity: candidate.liquidity,
      volume: candidate.volume,
      open_interest: null,
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

function absoluteQuality(market: NonNullable<Awaited<ReturnType<typeof fetchBook>>>): BtcPolymarketQuality | null {
  if (market.spread > MAX_REJECT_SPREAD || market.depth_near_mid < MIN_REJECT_DEPTH_NEAR_MID) return "Q0_REJECT";
  if (market.spread > MAX_USABLE_SPREAD || market.depth_near_mid < MIN_USABLE_DEPTH_NEAR_MID) return "Q1_WEAK";
  return null;
}

function qualityTiers(markets: Array<NonNullable<Awaited<ReturnType<typeof fetchBook>>>>): Array<BtcPolymarketExpectationMarket> {
  const scored = markets.map((market) => ({ market, score: rawQualityScore(market), absolute: absoluteQuality(market) })).sort((a, b) => b.score - a.score);
  const usable = scored.filter((row) => row.absolute === null);
  const rank = new Map(usable.map((row, index) => [row.market.market_id, index]));
  const count = usable.length;

  return scored.map(({ market, score, absolute }) => {
    if (absolute) return { ...market, quality: absolute, quality_score: score, delta_1h: null, delta_6h: null, delta_1d: null, delta_1w: null };
    const index = rank.get(market.market_id) ?? count;
    const percentile = count <= 1 ? 0 : index / (count - 1);
    const strongAbsolute = market.spread <= MAX_STRONG_SPREAD && market.depth_near_mid >= MIN_STRONG_DEPTH_NEAR_MID;
    const quality: BtcPolymarketQuality = strongAbsolute && percentile <= 0.25 ? "Q3_STRONG" : "Q2_USABLE";
    return { ...market, quality, quality_score: score, delta_1h: null, delta_6h: null, delta_1d: null, delta_1w: null };
  });
}

function isUsableQuality(quality: BtcPolymarketQuality): boolean {
  return quality === "Q3_STRONG" || quality === "Q2_USABLE";
}

async function fetchOpenInterestMap(conditionIds: string[], signal?: AbortSignal): Promise<Map<string, number>> {
  const unique = Array.from(new Set(conditionIds.filter((id) => CONDITION_ID_PATTERN.test(id))));
  const chunks: string[][] = [];
  for (let index = 0; index < unique.length; index += 40) chunks.push(unique.slice(index, index + 40));
  const rows = await mapBatched(chunks, 4, async (chunk) => {
    try {
      const params = new URLSearchParams({ market: chunk.join(",") });
      const raw = await fetchJson(`${DATA_BASE}/oi?${params.toString()}`, signal);
      return Array.isArray(raw) ? raw.filter(isRecord) : [];
    } catch {
      return [] as JsonRecord[];
    }
  });
  const result = new Map<string, number>();
  for (const batch of rows) {
    for (const row of batch) {
      const conditionId = text(row.market);
      const value = finite(row.value);
      if (CONDITION_ID_PATTERN.test(conditionId) && value !== null && value >= 0) result.set(conditionId.toLowerCase(), value);
    }
  }
  return result;
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

  let discovery: EventDiscovery;
  try {
    discovery = await discoverAllEvents(asOfMs, options.signal);
  } catch {
    return { schema_version: BTC_POLYMARKET_EXPECTATION_SCHEMA, ok: false, as_of: asOf, code: "DISCOVERY_FAILED", message: "Keyset-complete Bitcoin event discovery did not complete." };
  }

  const events = discovery.events;
  const bitcoinTagId = bitcoinTagIdFromEvents(events);
  const seenMarketIds = new Set<string>();
  let discoveredMarkets = 0;
  let futureValidMarkets = 0;
  const candidates: RawCandidate[] = [];

  for (const event of events) {
    const markets = event.markets as unknown[];
    for (const rawMarket of markets) {
      if (!isRecord(rawMarket)) continue;
      const marketId = recordIdentity(rawMarket.id);
      if (!marketId || seenMarketIds.has(marketId)) continue;
      seenMarketIds.add(marketId);
      discoveredMarkets += 1;

      const expiry = marketExpiry(rawMarket);
      if (rawMarket.active === true && rawMarket.closed === false && rawMarket.archived === false && expiry && new Date(expiry).getTime() > asOfMs) futureValidMarkets += 1;
      const candidate = candidateFrom(event, rawMarket, asOfMs);
      if (candidate) candidates.push(candidate);
    }
  }

  const bookRows = (await mapBatched(candidates, 8, (candidate) => fetchBook(candidate, options.signal))).filter((value): value is NonNullable<typeof value> => Boolean(value));
  if (!bookRows.length) return { schema_version: BTC_POLYMARKET_EXPECTATION_SCHEMA, ok: false, as_of: asOf, code: candidates.length ? "CLOB_UNAVAILABLE" : "NO_USABLE_EXPECTATION_MARKETS", message: candidates.length ? "No usable two-sided CLOB books were available for current expectation markets." : "No future-valid BTC price expectation markets survived lifecycle, resolution-rule, and semantic validation." };

  const openInterest = await fetchOpenInterestMap(bookRows.map((market) => market.condition_id), options.signal);
  const books = bookRows.map((market) => ({ ...market, open_interest: openInterest.get(market.condition_id.toLowerCase()) ?? null }));
  let markets = qualityTiers(books);
  const usableMarkets = markets.filter((market) => isUsableQuality(market.quality));
  if (!usableMarkets.length) return { schema_version: BTC_POLYMARKET_EXPECTATION_SCHEMA, ok: false, as_of: asOf, code: "NO_USABLE_EXPECTATION_MARKETS", message: "Current BTC expectation books did not pass the absolute spread/depth measurement floor." };

  if (options.includeHistory) {
    const historyTargets = usableMarkets.slice(0, 12);
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
    bitcoin_tag_id: bitcoinTagId,
    bitcoin_tag_slug: BITCOIN_TAG_SLUG,
    discovery_method: "GAMMA_EVENTS_KEYSET",
    discovery_pages: discovery.pages,
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
