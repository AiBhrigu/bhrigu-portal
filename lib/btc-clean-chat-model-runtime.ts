import {
  BTC_MARKET_ENVELOPE_URLS,
  loadBtcMarketEnvelope,
  type BtcMarketEnvelopeResult,
} from "./btc-market-envelope";
import {
  loadBtcBinancePublicMarketShadow,
  type BinancePublicMarketResult,
} from "./btc-binance-public-market-source";
import { loadBtcBinanceProductionGuarded } from "./btc-binance-production-guard";
import {
  loadBtcPolymarketExpectationField,
  type BtcPolymarketExpectationResult,
} from "./btc-polymarket-expectation";
import {
  loadBtcAstroField,
  type BtcAstroEventId,
  type BtcAstroFieldResult,
  type BtcAstroPhenomenon,
} from "./btc-astro-field-client";
import {
  BTC_COSMOGRAPHER_ROUTE_SCHEMA,
  type BtcCosmographerContextRelation,
  type BtcCosmographerIntent,
  type BtcCosmographerRoute,
} from "./btc-cosmographer-route-graph";
import {
  BTC_ORIGINS_KNOWLEDGE_CAPSULE,
  buildBtcProtocolAnswer,
  type BtcCosmographerAnswerProjection,
} from "./btc-protocol-evidence";
import {
  BTC_CLEAN_CHAT_SCHEMA,
  type BtcCleanChatResponse,
  type BtcCleanEvidenceState,
  type BtcCleanLocale,
  type BtcCleanPriorTurn,
  type BtcCleanSource,
} from "./btc-clean-chat-v1";

export const BTC_CLEAN_CHAT_MODEL_ID = "gpt-5.6-sol" as const;
export const BTC_CLEAN_CHAT_PROVIDER = "DIRECT_OPENAI_API" as const;
const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const MODEL_TIMEOUT_MS = 35_000;
const MAX_PLAN_OUTPUT_TOKENS = 360;
const MAX_FINAL_OUTPUT_TOKENS = 500;
const MAX_WEB_OUTPUT_TOKENS = 360;
const MAX_MODEL_ATTEMPTS = 2;

type EvidenceTool =
  | "snapshot"
  | "binance"
  | "polymarket"
  | "astronomy"
  | "astro_btc_bridge"
  | "bitcoin_protocol"
  | "web";

type RequestType = "fact" | "explain" | "compare" | "change" | "why" | "watch" | "future" | "research" | "trading_boundary" | "other";
type ContextRelation = "new" | "follow_up" | "return" | "switch";

type Plan = {
  topic: string;
  tools: EvidenceTool[];
  polymarket_history: boolean;
  focus: string;
  request_type: RequestType;
  context_relation: ContextRelation;
  astro_bodies: string[];
  astro_phenomena: BtcAstroPhenomenon[];
  astro_timestamp_utc: string | null;
  time_start: string | null;
  time_end: string | null;
  bitcoin_event: BtcAstroEventId | null;
  protocol_subject: string | null;
  web_reason: string | null;
};

type Usage = { input_tokens: number; output_tokens: number; web_search_calls: number };
type ModelResult = { text: string; usage: Usage; payload: Record<string, unknown>; httpStatus: number };
type WebEvidence = { text: string; sources: BtcCleanSource[]; usage: Usage };

type EvidenceBundle = {
  envelope: BtcMarketEnvelopeResult | null;
  binance: BinancePublicMarketResult | null;
  polymarket: BtcPolymarketExpectationResult | null;
  astronomy: BtcAstroFieldResult | null;
  astroBridge: Record<string, unknown> | null;
  protocol: BtcCosmographerAnswerProjection | null;
  web: WebEvidence | null;
};

const TOOL_VALUES = new Set<EvidenceTool>(["snapshot", "binance", "polymarket", "astronomy", "astro_btc_bridge", "bitcoin_protocol", "web"]);
const REQUEST_VALUES = new Set<RequestType>(["fact", "explain", "compare", "change", "why", "watch", "future", "research", "trading_boundary", "other"]);
const RELATION_VALUES = new Set<ContextRelation>(["new", "follow_up", "return", "switch"]);
const BODY_VALUES = new Set(["sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto"]);
const ASTRO_PHENOMENA = new Set<BtcAstroPhenomenon>(["positions", "aspects", "stations", "ingresses", "lunar_phases"]);
const EVENT_VALUES = new Set<BtcAstroEventId>(["genesis", "halving_1", "halving_2", "halving_3", "halving_4"]);
const PROTOCOL_VALUES = new Set(["overview", "supply", "halving", "subsidy", "fees", "difficulty", "mining", "utxo", "genesis", "consensus", "blocks", "satoshi_history", "bitcoin_origin", "genesis_history"]);

const PLAN_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["topic", "tools", "polymarket_history", "focus", "request_type", "context_relation", "astro_bodies", "astro_phenomena", "astro_timestamp_utc", "time_start", "time_end", "bitcoin_event", "protocol_subject", "web_reason"],
  properties: {
    topic: { type: "string" },
    tools: { type: "array", items: { type: "string", enum: Array.from(TOOL_VALUES) } },
    polymarket_history: { type: "boolean" },
    focus: { type: "string" },
    request_type: { type: "string", enum: Array.from(REQUEST_VALUES) },
    context_relation: { type: "string", enum: Array.from(RELATION_VALUES) },
    astro_bodies: { type: "array", items: { type: "string", enum: Array.from(BODY_VALUES) } },
    astro_phenomena: { type: "array", items: { type: "string", enum: Array.from(ASTRO_PHENOMENA) } },
    astro_timestamp_utc: { type: ["string", "null"] },
    time_start: { type: ["string", "null"] },
    time_end: { type: ["string", "null"] },
    bitcoin_event: { enum: ["genesis", "halving_1", "halving_2", "halving_3", "halving_4", null] },
    protocol_subject: { type: ["string", "null"] },
    web_reason: { type: ["string", "null"] },
  },
} as const;

const SYNTHESIS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["answer", "topic"],
  properties: {
    answer: { type: "string" },
    topic: { type: "string" },
  },
} as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function directOpenAiAuth(): string {
  if (process.env.VERCEL_ENV === "production") throw new Error("DIRECT_OPENAI_PREVIEW_ONLY");
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("DIRECT_OPENAI_AUTH_UNAVAILABLE");
  return key;
}

function extractText(payload: Record<string, unknown>): string {
  if (typeof payload.output_text === "string" && payload.output_text.trim()) return payload.output_text.trim();
  const output = Array.isArray(payload.output) ? payload.output : [];
  const parts: string[] = [];
  for (const item of output) {
    if (!isRecord(item) || !Array.isArray(item.content)) continue;
    for (const content of item.content) {
      if (!isRecord(content)) continue;
      if (typeof content.text === "string" && content.text.trim()) parts.push(content.text);
      else if (typeof content.output_text === "string" && content.output_text.trim()) parts.push(content.output_text);
    }
  }
  return parts.join("\n").trim();
}

function usageFrom(payload: Record<string, unknown>): Usage {
  const usage = isRecord(payload.usage) ? payload.usage : {};
  const output = Array.isArray(payload.output) ? payload.output : [];
  return {
    input_tokens: Number(usage.input_tokens) || 0,
    output_tokens: Number(usage.output_tokens) || 0,
    web_search_calls: output.filter((item) => isRecord(item) && item.type === "web_search_call").length,
  };
}

function addUsage(target: Usage, next: Usage) {
  target.input_tokens += next.input_tokens;
  target.output_tokens += next.output_tokens;
  target.web_search_calls += next.web_search_calls;
}

class DirectOpenAiHttpError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

async function singleOpenAiResponse(body: Record<string, unknown>): Promise<ModelResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), MODEL_TIMEOUT_MS);
  try {
    const response = await fetch(OPENAI_RESPONSES_URL, {
      method: "POST",
      headers: {
        authorization: `Bearer ${directOpenAiAuth()}`,
        "content-type": "application/json",
        accept: "application/json",
      },
      cache: "no-store",
      signal: controller.signal,
      body: JSON.stringify({ model: BTC_CLEAN_CHAT_MODEL_ID, store: false, ...body }),
    });
    const payload = await response.json() as Record<string, unknown>;
    if (!response.ok) {
      const detail = isRecord(payload.error) && typeof payload.error.message === "string" ? payload.error.message : `HTTP_${response.status}`;
      throw new DirectOpenAiHttpError(`DIRECT_OPENAI_${detail}`, response.status);
    }
    return { text: extractText(payload), usage: usageFrom(payload), payload, httpStatus: response.status };
  } finally {
    clearTimeout(timer);
  }
}

function responseIncomplete(result: ModelResult): boolean {
  return result.payload.status === "incomplete" || result.payload.status === "failed" || !result.text;
}

function incompleteReason(result: ModelResult): string {
  const detail = isRecord(result.payload.incomplete_details) ? result.payload.incomplete_details : {};
  return typeof detail.reason === "string" ? detail.reason : String(result.payload.status ?? "empty");
}

function retryableHttp(error: unknown): boolean {
  return error instanceof DirectOpenAiHttpError && (error.status === 429 || error.status >= 500);
}

async function boundedModelValue<T>(
  body: Record<string, unknown>,
  parse: (result: ModelResult) => T | null,
  terminalCode: string,
): Promise<{ value: T; result: ModelResult; usage: Usage }> {
  const total: Usage = { input_tokens: 0, output_tokens: 0, web_search_calls: 0 };
  let lastReason = "unknown";
  for (let attempt = 0; attempt < MAX_MODEL_ATTEMPTS; attempt += 1) {
    try {
      const result = await singleOpenAiResponse(body);
      addUsage(total, result.usage);
      if (responseIncomplete(result)) {
        lastReason = incompleteReason(result);
        if (attempt + 1 < MAX_MODEL_ATTEMPTS) continue;
        throw new Error(`DIRECT_OPENAI_EMPTY_RESPONSE:${lastReason}`);
      }
      const value = parse(result);
      if (value !== null) return { value, result, usage: total };
      lastReason = terminalCode;
      if (attempt + 1 < MAX_MODEL_ATTEMPTS) continue;
      throw new Error(terminalCode);
    } catch (error) {
      if (attempt + 1 < MAX_MODEL_ATTEMPTS && retryableHttp(error)) continue;
      if (error instanceof Error && (error.message.startsWith("DIRECT_OPENAI_EMPTY_RESPONSE") || error.message === terminalCode)) throw error;
      if (attempt + 1 < MAX_MODEL_ATTEMPTS && !(error instanceof DirectOpenAiHttpError)) continue;
      throw error;
    }
  }
  throw new Error(`${terminalCode}:${lastReason}`);
}

function parseJson(text: string): Record<string, unknown> | null {
  try {
    const value = JSON.parse(text);
    return isRecord(value) ? value : null;
  } catch {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start < 0 || end <= start) return null;
    try {
      const value = JSON.parse(text.slice(start, end + 1));
      return isRecord(value) ? value : null;
    } catch {
      return null;
    }
  }
}

function stringOrNull(value: unknown, max = 120): string | null {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, max) : null;
}

function validIsoDate(value: unknown): string | null {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const time = new Date(`${value}T00:00:00Z`).getTime();
  return Number.isFinite(time) ? value : null;
}

function validIsoTimestamp(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const time = new Date(value).getTime();
  return Number.isFinite(time) && /(?:Z|[+-]\d{2}:\d{2})$/.test(value) ? new Date(time).toISOString() : null;
}

function normalizePlan(raw: Record<string, unknown>): Plan {
  const tools = Array.from(new Set((Array.isArray(raw.tools) ? raw.tools : []).filter((value): value is EvidenceTool => typeof value === "string" && TOOL_VALUES.has(value as EvidenceTool))));
  const bodies = Array.from(new Set((Array.isArray(raw.astro_bodies) ? raw.astro_bodies : []).filter((value): value is string => typeof value === "string" && BODY_VALUES.has(value))));
  const phenomena = Array.from(new Set((Array.isArray(raw.astro_phenomena) ? raw.astro_phenomena : []).filter((value): value is BtcAstroPhenomenon => typeof value === "string" && ASTRO_PHENOMENA.has(value as BtcAstroPhenomenon))));
  const requestType = typeof raw.request_type === "string" && REQUEST_VALUES.has(raw.request_type as RequestType) ? raw.request_type as RequestType : "other";
  const relation = typeof raw.context_relation === "string" && RELATION_VALUES.has(raw.context_relation as ContextRelation) ? raw.context_relation as ContextRelation : "new";
  const event = typeof raw.bitcoin_event === "string" && EVENT_VALUES.has(raw.bitcoin_event as BtcAstroEventId) ? raw.bitcoin_event as BtcAstroEventId : null;
  const protocolSubject = stringOrNull(raw.protocol_subject, 40);
  if ((event || tools.includes("astro_btc_bridge")) && !tools.includes("astronomy")) tools.push("astronomy");
  return {
    topic: stringOrNull(raw.topic, 80) ?? "Bitcoin",
    tools,
    polymarket_history: raw.polymarket_history === true,
    focus: stringOrNull(raw.focus, 260) ?? "Answer the user directly from the minimum sufficient evidence.",
    request_type: requestType,
    context_relation: relation,
    astro_bodies: bodies,
    astro_phenomena: phenomena.length ? phenomena : ["positions", "aspects"],
    astro_timestamp_utc: validIsoTimestamp(raw.astro_timestamp_utc),
    time_start: validIsoDate(raw.time_start),
    time_end: validIsoDate(raw.time_end),
    bitcoin_event: event,
    protocol_subject: protocolSubject && PROTOCOL_VALUES.has(protocolSubject) ? protocolSubject : null,
    web_reason: stringOrNull(raw.web_reason, 180),
  };
}

function priorContext(priorTurns: BtcCleanPriorTurn[]): string {
  if (!priorTurns.length) return "No prior conversation turns.";
  return priorTurns.slice(-8).map((turn, index) => `${index + 1}. USER: ${turn.user}\nCOSMOGRAPHER: ${turn.assistant ?? ""}\nTOPIC: ${turn.topic ?? ""}`).join("\n\n");
}

async function buildEvidencePlan(input: { locale: BtcCleanLocale; question: string; priorTurns: BtcCleanPriorTurn[] }): Promise<{ plan: Plan; usage: Usage }> {
  const instructions = `You are the semantic evidence planner for BHRIGU BTC Clean Chat V1. Reason from the user's meaning and conversation, never from keyword or prepared-question routing. Available read-only evidence: snapshot (accepted BTC structural snapshot + Snapshot Memory), binance (current/realized BTCUSDT field), polymarket (market-priced future propositions and same-contract history), astronomy (fresh canonical geocentric tropical ephemeris for arbitrary bounded UTC timestamps/intervals), astro_btc_bridge (comparison using that SAME computed astronomy packet plus independent BTC evidence), bitcoin_protocol (pinned Bitcoin mechanism/history), web (selective OpenAI native web research). Astronomy supports Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn, Uranus, Neptune and Pluto; positions, velocity/retrograde, major aspects with orb and applying/separating, stations, ingresses and lunar phases. There is no 2026-only astronomy limit. For a date/month/range set time_start and time_end as YYYY-MM-DD. For an explicit timestamp set astro_timestamp_utc. For 'now', leave all astro time fields null so runtime current UTC is used. Select only the bodies and phenomena needed; an empty body list means all bodies. Bitcoin astronomical chart/canonical launch anchor means Genesis block; set bitcoin_event=genesis. Accepted exact event IDs are genesis, halving_1, halving_2, halving_3, halving_4. When a previous turn established an event and the user says 'at that moment' or equivalent, resolve bitcoin_event from conversation rather than asking again. Never silently combine different Bitcoin anchors. Astro×BTC is temporal comparison only: convergence/divergence/insufficient evidence, never causality. Binance is present/realized. Polymarket is exact-proposition market-implied expectation, never a BHRIGU prediction/global BTC probability. Web is only for explicit current external research, unresolved material current facts, or independent verification; never blind fallback. Trading requests remain informational only. Current date is 2026-08-20. Return only the required structured object.`;
  const structured = await boundedModelValue(
    {
      instructions,
      input: `LOCALE=${input.locale}\nQUESTION=${input.question}\n\nCONVERSATION:\n${priorContext(input.priorTurns)}`,
      max_output_tokens: MAX_PLAN_OUTPUT_TOKENS,
      reasoning: { effort: "low" },
      text: { format: { type: "json_schema", name: "btc_clean_evidence_plan", strict: true, schema: PLAN_SCHEMA } },
    },
    (result) => {
      const parsed = parseJson(result.text);
      return parsed ? normalizePlan(parsed) : null;
    },
    "DIRECT_OPENAI_PLAN_INVALID",
  );
  return { plan: structured.value, usage: structured.usage };
}

function contextRelation(plan: Plan): BtcCosmographerContextRelation {
  if (plan.tools.includes("astro_btc_bridge")) return "CROSS_MODULE_BRIDGE";
  if (plan.context_relation === "follow_up") return "FOLLOW_UP";
  if (plan.context_relation === "return") return "RETURN_TO_PREVIOUS_TOPIC";
  return "NEW_TOPIC";
}

function routeIntent(plan: Plan): BtcCosmographerIntent[] {
  if (plan.request_type === "compare") return ["compare"];
  if (plan.request_type === "change") return ["change"];
  if (plan.request_type === "why") return ["reason"];
  if (plan.request_type === "watch") return ["watch"];
  if (plan.request_type === "explain") return ["explain"];
  return ["fact"];
}

function evidenceRoute(locale: BtcCleanLocale, question: string, plan: Plan): BtcCosmographerRoute {
  return {
    schema: BTC_COSMOGRAPHER_ROUTE_SCHEMA,
    locale,
    raw_question: question,
    normalized_question: question.trim(),
    domain: "bitcoin_protocol",
    subject: plan.protocol_subject ?? "overview",
    intents: routeIntent(plan),
    context_relation: contextRelation(plan),
    time_range: plan.time_start && plan.time_end ? { start: plan.time_start, end: plan.time_end, label: `${plan.time_start} — ${plan.time_end}`, source: "QUESTION" } : null,
    market_question_class: null,
    capability_id: "clean_chat_bitcoin_protocol",
    confidence: "BOUNDED",
    explicit_entities: [],
  };
}

function snapshotDigest(result: BtcMarketEnvelopeResult | null): Record<string, unknown> {
  if (!result || result.ok === false) return { available: false };
  const value = result.value;
  return { available: true, generated_at_utc: value.generated_at_utc, current: value.current, memory: { comparison_status: value.memory.comparison_status, methodology_compatible: value.memory.methodology_compatible, metrics: value.memory.metrics.slice(0, 16), transition_interpretation: value.memory.transition_interpretation }, synthesis: value.synthesis, boundary: value.boundary };
}

function binanceDigest(result: BinancePublicMarketResult | null): Record<string, unknown> {
  if (!result) return { available: false, code: "NOT_REQUESTED" };
  if (result.ok === false) return { available: false, code: result.code };
  return { available: true, retrieved_at: result.snapshot.retrieved_at, derived: result.snapshot.derived, evidence: result.snapshot.evidence.slice(0, 8).map((row) => ({ endpoint: row.endpoint_or_stream, value: row.normalized_value, freshness: row.freshness })) };
}

function polymarketDigest(result: BtcPolymarketExpectationResult | null): Record<string, unknown> {
  if (!result) return { available: false, code: "NOT_REQUESTED" };
  if (result.ok === false) return { available: false, code: result.code };
  return { available: true, as_of: result.as_of, event_complete: result.event_complete, expectation_candidates: result.expectation_candidates, markets: result.markets.filter((market) => market.quality !== "Q1_WEAK").slice(0, 10).map((market) => ({ question: market.question, semantic: market.semantic, expiry: market.expiry, probability: market.probability, best_bid: market.best_bid, best_ask: market.best_ask, spread: market.spread, depth_near_mid: market.depth_near_mid, liquidity: market.liquidity, volume: market.volume, open_interest: market.open_interest, quality: market.quality, delta_1h: market.delta_1h, delta_6h: market.delta_6h, delta_1d: market.delta_1d, delta_1w: market.delta_1w, event_url: market.event_url })), boundary: result.boundary };
}

function projectionDigest(value: BtcCosmographerAnswerProjection | null): unknown {
  return value ? { available: true, ...value } : { available: false };
}

function astroDigest(value: BtcAstroFieldResult | null): unknown {
  if (!value) return { available: false };
  const packet = value.packet;
  const take = (key: string, count: number) => Array.isArray(packet[key]) ? (packet[key] as unknown[]).slice(0, count) : packet[key];
  return {
    available: true,
    anchor: value.anchor,
    requested_at_utc: value.requested_at_utc,
    schema_version: packet.schema_version,
    mode: packet.mode,
    request: packet.request,
    snapshot: packet.snapshot,
    start_snapshot: packet.start_snapshot,
    end_snapshot: packet.end_snapshot,
    aspect_events: take("aspect_events", 140),
    stations: take("stations", 80),
    ingresses: take("ingresses", 100),
    lunar_phases: take("lunar_phases", 40),
    provenance: packet.provenance,
    boundaries: packet.boundaries,
  };
}

function extractWebSources(payload: Record<string, unknown>): BtcCleanSource[] {
  const sources = new Map<string, BtcCleanSource>();
  const output = Array.isArray(payload.output) ? payload.output : [];
  for (const item of output) {
    if (!isRecord(item) || !Array.isArray(item.content)) continue;
    for (const content of item.content) {
      if (!isRecord(content) || !Array.isArray(content.annotations)) continue;
      for (const annotation of content.annotations) {
        if (!isRecord(annotation) || annotation.type !== "url_citation" || typeof annotation.url !== "string") continue;
        const title = typeof annotation.title === "string" && annotation.title.trim() ? annotation.title.trim() : annotation.url;
        sources.set(annotation.url, { id: `web-${sources.size + 1}`, label: title.slice(0, 140), href: annotation.url, as_of: new Date().toISOString() });
      }
    }
  }
  return Array.from(sources.values()).slice(0, 8);
}

async function runBoundedWebResearch(locale: BtcCleanLocale, question: string, plan: Plan): Promise<WebEvidence> {
  const structured = await boundedModelValue(
    {
      instructions: `You are a bounded research tool for BHRIGU Clean Chat. Research only the user's material current question. Prefer primary or authoritative sources. Separate verified facts from uncertainty. Do not produce trading instructions. Return a concise source-bound research note in ${locale === "ru" ? "Russian" : "English"}.`,
      input: `QUESTION=${question}\nRESEARCH_REASON=${plan.web_reason ?? "Independent current verification required."}`,
      tools: [{ type: "web_search", search_context_size: "low" }],
      tool_choice: "auto",
      max_output_tokens: MAX_WEB_OUTPUT_TOKENS,
      reasoning: { effort: "low" },
    },
    (result) => result.text.trim() || null,
    "DIRECT_OPENAI_WEB_EMPTY",
  );
  return { text: structured.value, sources: extractWebSources(structured.result.payload), usage: structured.usage };
}

async function collectEvidence(locale: BtcCleanLocale, question: string, plan: Plan): Promise<EvidenceBundle> {
  const wants = (tool: EvidenceTool) => plan.tools.includes(tool);
  const envelopePromise: Promise<BtcMarketEnvelopeResult | null> = wants("snapshot") ? loadBtcMarketEnvelope(question, { timeoutMs: 5_000 }) : Promise.resolve(null);
  const binancePromise: Promise<BinancePublicMarketResult | null> = wants("binance") ? loadBtcBinanceProductionGuarded((signal) => loadBtcBinancePublicMarketShadow({ signal })) : Promise.resolve(null);
  const polymarketPromise: Promise<BtcPolymarketExpectationResult | null> = wants("polymarket") ? loadBtcPolymarketExpectationField({ includeHistory: plan.polymarket_history }) : Promise.resolve(null);
  const astronomyPromise: Promise<BtcAstroFieldResult | null> = wants("astronomy") ? loadBtcAstroField({ timestampUtc: plan.astro_timestamp_utc, startDate: plan.time_start, endDate: plan.time_end, bodies: plan.astro_bodies, phenomena: plan.astro_phenomena, bitcoinEvent: plan.bitcoin_event, timeoutMs: 20_000 }) : Promise.resolve(null);
  const protocol = wants("bitcoin_protocol") ? buildBtcProtocolAnswer(locale, evidenceRoute(locale, question, plan)) : null;
  const webPromise = wants("web") ? runBoundedWebResearch(locale, question, plan) : Promise.resolve(null);
  const [envelope, binance, polymarket, astronomy, web] = await Promise.all([envelopePromise, binancePromise, polymarketPromise, astronomyPromise, webPromise]);
  const astroBridge = wants("astro_btc_bridge") && astronomy ? {
    uses_same_computed_astro_field: true,
    astronomy_request: astronomy.packet.request,
    anchor: astronomy.anchor,
    btc_snapshot_available: Boolean(envelope?.ok),
    binance_available: Boolean(binance?.ok),
    polymarket_available: Boolean(polymarket?.ok),
    comparison_rule: "Compare independent temporal evidence only; classify convergence, divergence, or insufficient evidence. Coincidence is not causality.",
  } : null;
  return { envelope, binance, polymarket, astronomy, astroBridge, protocol, web };
}

function sourceRows(evidence: EvidenceBundle): BtcCleanSource[] {
  const rows: BtcCleanSource[] = [];
  if (evidence.envelope?.ok) {
    const asOf = evidence.envelope.value.current.source_generated_at_utc;
    for (const [key, href] of Object.entries(BTC_MARKET_ENVELOPE_URLS).slice(0, 4)) rows.push({ id: `snapshot-${key}`, label: `Accepted Snapshot · ${key}`, href, as_of: asOf });
  }
  if (evidence.binance?.ok) rows.push({ id: "binance-btcusdt", label: "Binance BTCUSDT public market data", href: "https://data-api.binance.vision/api/v3/ticker/24hr?symbol=BTCUSDT", as_of: evidence.binance.snapshot.retrieved_at });
  if (evidence.polymarket?.ok) for (const market of evidence.polymarket.markets.filter((item) => item.quality !== "Q1_WEAK").slice(0, 4)) rows.push({ id: `polymarket-${market.market_id}`, label: `Polymarket · ${market.question.slice(0, 100)}`, href: market.event_url, as_of: evidence.polymarket.as_of });
  if (evidence.astronomy) {
    rows.push({ id: "astronomy-canonical", label: "BHRIGU canonical ephemeris · fresh computed Astro Field", href: "https://www.bhrigu.io/crypto-astro/btc", as_of: evidence.astronomy.requested_at_utc });
    if (evidence.astronomy.anchor) rows.push({ id: `btc-anchor-${evidence.astronomy.anchor.id}`, label: `${evidence.astronomy.anchor.label} · accepted UTC anchor`, href: evidence.astronomy.anchor.source, as_of: evidence.astronomy.anchor.timestamp_utc });
  }
  if (evidence.protocol) {
    const historySource = BTC_ORIGINS_KNOWLEDGE_CAPSULE.sources[0];
    rows.push({ id: "bitcoin-protocol", label: "Bitcoin protocol source of truth", href: evidence.protocol.answer_mode === "PROTOCOL_FACT" && historySource ? historySource.url : "https://github.com/bitcoin/bitcoin", as_of: null });
  }
  if (evidence.web) rows.push(...evidence.web.sources);
  return Array.from(new Map(rows.map((row) => [row.href, row])).values()).slice(0, 12);
}

function state(requested: boolean, available: boolean): BtcCleanEvidenceState {
  if (!requested) return "NOT_REQUIRED";
  return available ? "USED" : "UNAVAILABLE";
}

async function synthesizeAnswer(locale: BtcCleanLocale, question: string, priorTurns: BtcCleanPriorTurn[], plan: Plan, evidence: EvidenceBundle): Promise<{ answer: string; topic: string; usage: Usage }> {
  const instructions = `You are BTC Cosmographer in BHRIGU Clean Chat V1. Synthesize a fresh answer to the actual user question from conversation and supplied evidence, never from prepared answer templates. Match locale exactly. Direct answer first, facts before interpretation, brief by default. Remember follow-ups, topic switches and returns. Keep fact, inference, conditional future and unknown distinct in natural language. Canonical Astro Field evidence is freshly computed from the BHRIGU geocentric tropical ephemeris for the requested UTC timestamp/interval; report exact UTC when relevant. For Bitcoin chart questions, when the evidence anchor is Genesis, explicitly say the canonical anchor being used is the Genesis block timestamp; do not silently combine it with whitepaper/software/other possible anchors. Astro×BTC must use the same computed Astro Field supplied here and independent BTC evidence; state convergence, divergence, or insufficient evidence, never causality. Binance is present/realized. Polymarket is the market-implied price/probability of exact future propositions, never a BHRIGU prediction/global BTC probability; never combine incompatible expiries or turn path propositions into terminal probabilities. Bitcoin protocol evidence describes mechanism/history, not price. Web evidence is bounded external verification and remains source-bound. Never invent unavailable evidence. Never give buy/sell/long/short/entry/exit/leverage/position-sizing instructions. Future outcomes are not established facts. Do not expose internal routing, tool names, JSON, filesystem paths, private modules, CDE or secrets. Return only the required structured object.`;
  const prompt = JSON.stringify({
    locale,
    question,
    conversation: priorTurns.slice(-8),
    plan,
    evidence: {
      accepted_snapshot_and_memory: snapshotDigest(evidence.envelope),
      binance_current_field: binanceDigest(evidence.binance),
      polymarket_expectation_field: polymarketDigest(evidence.polymarket),
      astronomy_field: astroDigest(evidence.astronomy),
      astro_btc_bridge: evidence.astroBridge ?? { available: false },
      bitcoin_protocol: projectionDigest(evidence.protocol),
      web_research: evidence.web ? { available: true, note: evidence.web.text, sources: evidence.web.sources } : { available: false },
    },
  });
  const structured = await boundedModelValue(
    {
      instructions,
      input: prompt,
      max_output_tokens: MAX_FINAL_OUTPUT_TOKENS,
      reasoning: { effort: "low" },
      text: { format: { type: "json_schema", name: "btc_clean_answer", strict: true, schema: SYNTHESIS_SCHEMA } },
    },
    (result) => {
      const parsed = parseJson(result.text);
      const answer = typeof parsed?.answer === "string" ? parsed.answer.trim() : "";
      const topic = typeof parsed?.topic === "string" ? parsed.topic.trim().slice(0, 80) : "";
      return answer && topic ? { answer, topic } : null;
    },
    "DIRECT_OPENAI_SYNTHESIS_INVALID",
  );
  return { ...structured.value, usage: structured.usage };
}

export async function runBtcCleanChatModel(input: { locale: BtcCleanLocale; question: string; priorTurns?: BtcCleanPriorTurn[] }): Promise<BtcCleanChatResponse> {
  const priorTurns = input.priorTurns ?? [];
  const totalUsage: Usage = { input_tokens: 0, output_tokens: 0, web_search_calls: 0 };
  const planned = await buildEvidencePlan({ locale: input.locale, question: input.question, priorTurns });
  addUsage(totalUsage, planned.usage);
  const evidence = await collectEvidence(input.locale, input.question, planned.plan);
  if (evidence.web) addUsage(totalUsage, evidence.web.usage);
  const synthesis = await synthesizeAnswer(input.locale, input.question, priorTurns, planned.plan, evidence);
  addUsage(totalUsage, synthesis.usage);
  const wants = (tool: EvidenceTool) => planned.plan.tools.includes(tool);
  return {
    schema_version: BTC_CLEAN_CHAT_SCHEMA,
    ok: true,
    intent: "MODEL_ORCHESTRATED",
    topic: synthesis.topic,
    answer: synthesis.answer,
    as_of: new Date().toISOString(),
    sources: sourceRows(evidence),
    evidence: {
      accepted_snapshot: state(wants("snapshot"), Boolean(evidence.envelope?.ok)),
      snapshot_memory: state(wants("snapshot"), Boolean(evidence.envelope?.ok)),
      binance_current_field: state(wants("binance"), Boolean(evidence.binance?.ok)),
      polymarket_expectation_field: state(wants("polymarket"), Boolean(evidence.polymarket?.ok)),
      astronomy_field: state(wants("astronomy"), Boolean(evidence.astronomy)),
      astro_btc_bridge: state(wants("astro_btc_bridge"), Boolean(evidence.astroBridge)),
      bitcoin_protocol: state(wants("bitcoin_protocol"), Boolean(evidence.protocol)),
      web_research: state(wants("web"), Boolean(evidence.web?.text)),
    },
    boundary: {
      no_fake_causality: true,
      no_trading_signal: true,
      future_not_established_fact: true,
      polymarket_not_bhrigu_prediction: true,
      astronomy_not_btc_causality: true,
      fact_inference_future_unknown_separated: true,
    },
    usage: { provider: BTC_CLEAN_CHAT_PROVIDER, model: BTC_CLEAN_CHAT_MODEL_ID, ...totalUsage },
  };
}
