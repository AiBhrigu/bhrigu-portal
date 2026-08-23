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
  type BtcPolymarketExpectationMarket,
  type BtcPolymarketExpectationResult,
} from "./btc-polymarket-expectation";
import {
  loadBtcAstroField,
  BTC_TEMPORAL_ORIGIN_UTC,
  BTC_TEMPORAL_ORIGIN_DATE,
  BTC_PROSPECTIVE_HORIZON_DATE,
  BTC_ASTRO_CHUNK_DAYS,
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
  type BtcCleanSemanticVisual,
  type BtcCleanSource,
} from "./btc-clean-chat-v1";
import type { BtcResearchFieldModelContext } from "./btc-research-field-v1";

export const BTC_CLEAN_CHAT_MODEL_ID = "gpt-5.6-sol" as const;
export const BTC_CLEAN_CHAT_PROVIDER = "DIRECT_OPENAI_API" as const;
const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";

export function resolveBtcCleanChatModelTransport(env: Readonly<Record<string, string | undefined>> = process.env) {
  const researchPreview = env.VERCEL_ENV === "preview" && env.BTC_RESEARCH_FIELD_MODE === "preview_v1";
  if (researchPreview) {
    const endpoint = env.BTC_RESEARCH_FIELD_PREVIEW_RESPONSES_URL?.trim();
    const model = env.BTC_RESEARCH_FIELD_PREVIEW_MODEL_ID?.trim();
    const bearer = env.BTC_RESEARCH_FIELD_PREVIEW_BEARER?.trim();
    if (!endpoint || !model || !bearer || !endpoint.startsWith("https://")) {
      throw new Error("BTC_RESEARCH_FIELD_PREVIEW_PROVIDER_UNAVAILABLE");
    }
    return { endpoint, model, authEnv: "BTC_RESEARCH_FIELD_PREVIEW_BEARER" as const };
  }
  return { endpoint: OPENAI_RESPONSES_URL, model: BTC_CLEAN_CHAT_MODEL_ID, authEnv: "OPENAI_API_KEY" as const };
}
const MODEL_TIMEOUT_MS = 35_000;
const MAX_PLAN_OUTPUT_TOKENS = 360;
const MAX_FINAL_OUTPUT_TOKENS = 500;
const MAX_AUX_RETRY_OUTPUT_TOKENS = 720;
const MAX_FINAL_RETRY_OUTPUT_TOKENS = 2_000;
const MAX_WEB_OUTPUT_TOKENS = 360;
const MAX_MODEL_ATTEMPTS = 2;
const MAX_CONTEXT_TURNS = 12;

type EvidenceTool =
  | "snapshot"
  | "binance"
  | "polymarket"
  | "astronomy"
  | "astro_btc_bridge"
  | "bitcoin_protocol"
  | "web";

type RequestType = "fact" | "explain" | "compare" | "change" | "why" | "watch" | "future" | "research" | "trading_boundary" | "out_of_scope" | "other";
type ContextRelation = "new" | "follow_up" | "return" | "switch";
type VisualFocus = "none" | "market_structure" | "dominance" | "liquidity" | "rotation" | "expectation" | "astro" | "bridge";

type Plan = {
  topic: string;
  tools: EvidenceTool[];
  polymarket_history: boolean;
  focus: string;
  request_type: RequestType;
  context_relation: ContextRelation;
  visual_focus: VisualFocus;
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

type EvidenceUnavailable = Partial<Record<EvidenceTool, string>>;

type EvidenceBundle = {
  envelope: BtcMarketEnvelopeResult | null;
  binance: BinancePublicMarketResult | null;
  polymarket: BtcPolymarketExpectationResult | null;
  astronomy: BtcAstroFieldResult | null;
  astroBridge: Record<string, unknown> | null;
  protocol: BtcCosmographerAnswerProjection | null;
  web: WebEvidence | null;
  unavailable: EvidenceUnavailable;
};

const TOOL_VALUES = new Set<EvidenceTool>(["snapshot", "binance", "polymarket", "astronomy", "astro_btc_bridge", "bitcoin_protocol", "web"]);
const REQUEST_VALUES = new Set<RequestType>(["fact", "explain", "compare", "change", "why", "watch", "future", "research", "trading_boundary", "out_of_scope", "other"]);
const RELATION_VALUES = new Set<ContextRelation>(["new", "follow_up", "return", "switch"]);
const VISUAL_FOCUS_VALUES = new Set<VisualFocus>(["none", "market_structure", "dominance", "liquidity", "rotation", "expectation", "astro", "bridge"]);
const BODY_VALUES = new Set(["sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto"]);
const ASTRO_PHENOMENA = new Set<BtcAstroPhenomenon>(["positions", "aspects", "stations", "ingresses", "lunar_phases"]);
const EVENT_VALUES = new Set<BtcAstroEventId>(["genesis", "halving_1", "halving_2", "halving_3", "halving_4"]);
const PROTOCOL_VALUES = new Set(["overview", "supply", "halving", "subsidy", "fees", "difficulty", "mining", "utxo", "genesis", "consensus", "blocks", "satoshi_history", "bitcoin_origin", "genesis_history"]);

const PLAN_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["topic", "tools", "polymarket_history", "focus", "request_type", "context_relation", "visual_focus", "astro_bodies", "astro_phenomena", "astro_timestamp_utc", "time_start", "time_end", "bitcoin_event", "protocol_subject", "web_reason"],
  properties: {
    topic: { type: "string" },
    tools: { type: "array", items: { type: "string", enum: Array.from(TOOL_VALUES) } },
    polymarket_history: { type: "boolean" },
    focus: { type: "string" },
    request_type: { type: "string", enum: Array.from(REQUEST_VALUES) },
    context_relation: { type: "string", enum: Array.from(RELATION_VALUES) },
    visual_focus: { type: "string", enum: Array.from(VISUAL_FOCUS_VALUES) },
    astro_bodies: { type: "array", items: { type: "string", enum: Array.from(BODY_VALUES) } },
    astro_phenomena: { type: "array", items: { type: "string", enum: Array.from(ASTRO_PHENOMENA) } },
    astro_timestamp_utc: { type: ["string", "null"] },
    time_start: { type: ["string", "null"] },
    time_end: { type: ["string", "null"] },
    bitcoin_event: { enum: ["genesis", "halving_1", "halving_2", "halving_3", "halving_4", null] },
    protocol_subject: { enum: [...Array.from(PROTOCOL_VALUES), null] },
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
  if (process.env.VERCEL_ENV === "production" && process.env.BHRIGU_BTC_CLEAN_CHAT_PRODUCTION_ENABLE !== "1") {
    throw new Error("DIRECT_OPENAI_PRODUCTION_DISABLED");
  }
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
  const transport = resolveBtcCleanChatModelTransport();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), MODEL_TIMEOUT_MS);
  try {
    const auth = transport.authEnv === "OPENAI_API_KEY"
      ? directOpenAiAuth()
      : process.env.BTC_RESEARCH_FIELD_PREVIEW_BEARER;
    if (!auth) throw new Error("BTC_RESEARCH_FIELD_PREVIEW_PROVIDER_UNAVAILABLE");
    const response = await fetch(transport.endpoint, {
      method: "POST",
      headers: {
        authorization: `Bearer ${auth}`,
        "content-type": "application/json",
        accept: "application/json",
      },
      cache: "no-store",
      signal: controller.signal,
      body: JSON.stringify({ model: transport.model, store: false, ...body }),
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
  let attemptBody = body;
  for (let attempt = 0; attempt < MAX_MODEL_ATTEMPTS; attempt += 1) {
    try {
      const result = await singleOpenAiResponse(attemptBody);
      addUsage(total, result.usage);
      if (responseIncomplete(result)) {
        lastReason = incompleteReason(result);
        if (attempt + 1 < MAX_MODEL_ATTEMPTS) {
          if (lastReason === "max_output_tokens") {
            const currentCap = Number(attemptBody.max_output_tokens);
            if (Number.isFinite(currentCap) && currentCap > 0) {
              const retryCap = currentCap === MAX_FINAL_OUTPUT_TOKENS
                ? MAX_FINAL_RETRY_OUTPUT_TOKENS
                : Math.min(currentCap * 2, MAX_AUX_RETRY_OUTPUT_TOKENS);
              attemptBody = { ...attemptBody, max_output_tokens: retryCap };
            }
          }
          continue;
        }
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
  const visualFocus = typeof raw.visual_focus === "string" && VISUAL_FOCUS_VALUES.has(raw.visual_focus as VisualFocus) ? raw.visual_focus as VisualFocus : "none";
  const event = typeof raw.bitcoin_event === "string" && EVENT_VALUES.has(raw.bitcoin_event as BtcAstroEventId) ? raw.bitcoin_event as BtcAstroEventId : null;
  const protocolSubjectRaw = stringOrNull(raw.protocol_subject, 40);
  const protocolSubject = protocolSubjectRaw && PROTOCOL_VALUES.has(protocolSubjectRaw) ? protocolSubjectRaw : null;
  if (requestType === "out_of_scope") {
    return {
      topic: "Bitcoin Corridor",
      tools: [],
      polymarket_history: false,
      focus: "State the Bitcoin Corridor boundary briefly and invite a Bitcoin/BTC, ephemeris, Astro×BTC, market-expectation, or Bitcoin-mechanics question.",
      request_type: requestType,
      context_relation: relation,
      visual_focus: "none",
      astro_bodies: [],
      astro_phenomena: ["positions", "aspects"],
      astro_timestamp_utc: null,
      time_start: null,
      time_end: null,
      bitcoin_event: null,
      protocol_subject: null,
      web_reason: null,
    };
  }
  if ((event || tools.includes("astro_btc_bridge")) && !tools.includes("astronomy")) tools.push("astronomy");
  return {
    topic: stringOrNull(raw.topic, 80) ?? "Bitcoin",
    tools,
    polymarket_history: raw.polymarket_history === true,
    focus: stringOrNull(raw.focus, 260) ?? "Answer the user directly from the minimum sufficient evidence.",
    request_type: requestType,
    context_relation: relation,
    visual_focus: visualFocus,
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
  return priorTurns.slice(-MAX_CONTEXT_TURNS).map((turn, index) => `${index + 1}. USER: ${turn.user}\nCOSMOGRAPHER: ${turn.assistant ?? ""}\nTOPIC: ${turn.topic ?? ""}`).join("\n\n");
}

async function buildEvidencePlan(input: { locale: BtcCleanLocale; question: string; priorTurns: BtcCleanPriorTurn[]; fieldContext?: BtcResearchFieldModelContext }): Promise<{ plan: Plan; usage: Usage }> {
  const currentUtcDate = new Date().toISOString().slice(0, 10);
  const instructions = `You are the semantic evidence planner for BHRIGU BTC Clean Chat V1. Reason from the user's meaning and the whole conversation, never from keyword or prepared-question routing. PRIMARY_PRODUCT_AXIS is Bitcoin and remains persistent across the conversation until the user explicitly leaves the BTC corridor. ACTIVE_SUBJECT may change to Semenko, Phi-field, BHRIGU, Frey, astronomy, GitHub, a person or another supporting topic, but that must not be described as replacing or losing the Bitcoin product context. Bitcoin remains the primary axis. The crypto ecosystem is supporting context, not a second product and not a general crypto assistant. ETH/Ethereum, TRX/TRON, stablecoins, DeFi TVL, BTC dominance, alt breadth, liquidity, capital rotation and market structure are in scope when they clarify Bitcoin or the current crypto field around Bitcoin. A one-token follow-up like ETH or TRX after an established DeFi/liquidity/ecosystem discussion is a continuation: resolve it from conversation, do not reset context and do not force clarification. A return such as 'вернись к ETH' restores that earlier research line. Prefer the accepted BHRIGU snapshot and Snapshot Memory for ecosystem field evidence; they already carry BTC dominance, stablecoin share/cap, DeFi TVL, DEX volume, alt breadth, ETH rotation anchor, market regime and field state. Use bounded web only when a material current ecosystem fact needed for the Bitcoin relation is missing from the accepted snapshot, for example current TRON-specific evidence; web must remain source-bound and must not become general crypto browsing. Public first-party BHRIGU project context is also in scope as supporting context when the user asks about bhrigu.io, github.com/AiBhrigu, Cosmographer, Frey, ORION public material, or a supplied public BHRIGU document/PDF. A generic request such as 'check GitHub' after BHRIGU context resolves to the AiBhrigu public GitHub surface; do not infer private repositories or internals. Product method, source, privacy and data-handling questions about this BTC Cosmographer are in scope and do not require market evidence unless the question itself needs it. If an altcoin request has no research relation to Bitcoin/current crypto field and conversation does not establish one, set request_type=out_of_scope, tools=[], web_reason=null and topic=Bitcoin Corridor. Weather, travel and unrelated general knowledge are always out of scope. Ephemerides and planetary windows remain in scope even when asked directly. Available read-only evidence: snapshot (accepted BTC structural snapshot + Snapshot Memory + crypto field context), binance (current/realized BTCUSDT field), polymarket (market-priced future BTC propositions and same-contract history), astronomy (fresh canonical geocentric tropical ephemeris for arbitrary bounded UTC timestamps/intervals), astro_btc_bridge (comparison using that SAME computed astronomy packet plus independent BTC evidence), bitcoin_protocol (pinned Bitcoin mechanism/history), web (selective source-bound research inside this corridor). Choose visual_focus only when a compact data-bound visual would improve meaning: market_structure, dominance, liquidity, rotation, expectation, astro or bridge; otherwise none. Astronomy supports Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn, Uranus, Neptune and Pluto as peers; positions, velocity/retrograde, major aspects with orb and applying/separating, stations, ingresses and lunar phases. There is no 2026-only astronomy limit. The Bitcoin temporal product domain begins at the Genesis block on ${BTC_TEMPORAL_ORIGIN_DATE} and V1 prospective analysis extends through ${BTC_PROSPECTIVE_HORIZON_DATE}. For a date/month/range set time_start and time_end as YYYY-MM-DD. For a range beginning at Genesis, set time_start=${BTC_TEMPORAL_ORIGIN_DATE} and the requested end date; reserve bitcoin_event=genesis for a single-anchor Genesis chart. Long ranges are valid: runtime deterministically splits them into bounded canonical Astro windows, so never truncate a Genesis-to-now or 2027-2028 request to one year. For an explicit timestamp set astro_timestamp_utc. For 'now', leave all astro time fields null so runtime current UTC is used. Do not request web research merely to verify a canonical ephemeris calculation. Historical reconstruction is not retroactive BHRIGU point-in-time memory. Future astronomy can be computed through ${BTC_PROSPECTIVE_HORIZON_DATE}, but future BTC prices, market outcomes and causal effects are unknown and must never be represented as established facts. Select only the bodies and phenomena needed; an empty body list means all bodies. Bitcoin astronomical chart/canonical launch anchor means Genesis block; set bitcoin_event=genesis. Accepted exact event IDs are genesis, halving_1, halving_2, halving_3, halving_4. Accepted protocol_subject values are overview, supply, halving, subsidy, fees, difficulty, mining, utxo, genesis, consensus, blocks, satoshi_history, bitcoin_origin, genesis_history. Questions about Satoshi Nakamoto, his documented record, Bitcoin v0.1 announcement, or his departure use protocol_subject=satoshi_history; origin/white-paper-to-launch history uses bitcoin_origin; Genesis first-days/history uses genesis_history. When a previous turn established an event and the user says 'at that moment' or equivalent, resolve bitcoin_event from conversation rather than asking again. Never silently combine different Bitcoin anchors. Astro×BTC is temporal comparison only: convergence/divergence/insufficient evidence, never causality. Binance is present/realized. Polymarket is exact-proposition market-implied expectation, never a BHRIGU prediction/global BTC probability. Trading requests remain informational only. Persisted Research Field context, when supplied, is user-owned historical framing only: it may help resolve continuity and preferences but must never override current evidence, source authority, expiry, resolution rules, Bitcoin primary-axis law, or safety boundaries. Evidence preferences are hints, not authority. Current UTC date is ${currentUtcDate}. Return only the required structured object.`;
  const structured = await boundedModelValue(
    {
      instructions,
      input: `LOCALE=${input.locale}\nQUESTION=${input.question}\n\nCONVERSATION:\n${priorContext(input.priorTurns)}\n\nRESEARCH_FIELD_CONTEXT:\n${input.fieldContext ? JSON.stringify(input.fieldContext) : "NONE"}`,
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

const POLYMARKET_RELEVANCE_STOPWORDS = new Set([
  "a", "about", "and", "are", "as", "at", "be", "before", "by", "current", "currently", "does", "for", "from", "how", "if", "in", "is", "it", "market", "of", "on", "or", "polymarket", "price", "probability", "the", "this", "to", "what", "will",
  "биткоин", "вероятность", "для", "до", "как", "к", "на", "о", "по", "полимаркет", "рынок", "сейчас", "что", "это",
]);

function canonicalThreshold(value: string, rawNumber: string, suffix: string | undefined): string {
  const parsed = Number(rawNumber.replace(/,/g, ""));
  if (!Number.isFinite(parsed)) return value;
  const factor = suffix?.toLowerCase() === "k" ? 1_000 : suffix?.toLowerCase() === "m" ? 1_000_000 : suffix?.toLowerCase() === "b" ? 1_000_000_000 : 1;
  return ` usd${Math.round(parsed * factor)} `;
}

function normalizePolymarketProposition(value: string): string {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/\$\s*(\d[\d,]*(?:\.\d+)?)(?:\s*([kmb])\b)?/gi, (match, number, suffix) => canonicalThreshold(match, number, suffix))
    .replace(/\b(\d+(?:\.\d+)?)\s*([kmb])\b/gi, (match, number, suffix) => canonicalThreshold(match, number, suffix))
    .replace(/\b(reaching|reaches|reached)\b/g, "reach")
    .replace(/\b(hitting|hits)\b/g, "hit")
    .replace(/(^|[^a-zа-яё0-9_])(?:достигнет|достигнуть|достичь|достигает|достиг|достижение|достижения|достижении|достижением|достижению)(?=$|[^a-zа-яё0-9_])/gi, "$1reach")
    .replace(/(^|[^a-zа-яё0-9_])(?:коснется|коснётся|коснуться|касание|касания|касании|ударит)(?=$|[^a-zа-яё0-9_])/gi, "$1hit")
    .replace(/\bbtc\b/g, "bitcoin")
    .replace(/[^a-z0-9а-яё_]+/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function propositionTokens(value: string): Set<string> {
  return new Set(normalizePolymarketProposition(value).split(" ").filter((token) => token.length > 1 && !POLYMARKET_RELEVANCE_STOPWORDS.has(token)));
}

function prefixedTokens(tokens: Set<string>, prefix: string): Set<string> {
  return new Set(Array.from(tokens).filter((token) => token.startsWith(prefix)));
}

function intersects(left: Set<string>, right: Set<string>): boolean {
  for (const value of Array.from(left)) if (right.has(value)) return true;
  return false;
}

function polymarketPropositionScore(query: string, market: BtcPolymarketExpectationMarket): number {
  const queryTokens = propositionTokens(query);
  const marketTokens = propositionTokens(market.question);
  const queryThresholds = prefixedTokens(queryTokens, "usd");
  const marketThresholds = prefixedTokens(marketTokens, "usd");
  if (queryThresholds.size && !intersects(queryThresholds, marketThresholds)) return -1;

  const queryYears = new Set(Array.from(queryTokens).filter((token) => /^20\d{2}$/.test(token)));
  const marketYears = new Set(Array.from(marketTokens).filter((token) => /^20\d{2}$/.test(token)));
  if (queryYears.size && marketYears.size && !intersects(queryYears, marketYears)) return -1;

  let score = 0;
  if (queryThresholds.size && intersects(queryThresholds, marketThresholds)) score += 120;
  if (queryYears.size && intersects(queryYears, marketYears)) score += 30;
  if (queryTokens.has("reach") && marketTokens.has("reach")) score += 40;
  if (queryTokens.has("hit") && marketTokens.has("hit")) score += 40;
  for (const token of Array.from(queryTokens)) if (marketTokens.has(token)) score += 5;
  const normalizedQuery = normalizePolymarketProposition(query);
  const normalizedQuestion = normalizePolymarketProposition(market.question);
  if (normalizedQuery.includes(normalizedQuestion)) score += 80;
  return score;
}

export function selectBtcPolymarketEvidenceMarkets(query: string, result: BtcPolymarketExpectationResult | null, limit = 10): BtcPolymarketExpectationMarket[] {
  if (!result || result.ok === false || limit <= 0) return [];
  const usable = result.markets.filter((market) => market.quality === "Q3_STRONG" || market.quality === "Q2_USABLE");
  const scored = usable.map((market, index) => ({ market, index, score: polymarketPropositionScore(query, market) }));
  const relevant = scored.filter((row) => row.score > 0).sort((a, b) => b.score - a.score || a.index - b.index);
  const ordered = [...relevant, ...scored.filter((row) => !relevant.includes(row))];
  return Array.from(new Map(ordered.map((row) => [row.market.market_id, row.market])).values()).slice(0, limit);
}

const POLYMARKET_MONTH_TOKENS = new Set([
  "january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december",
  "январь", "января", "февраль", "февраля", "март", "марта", "апрель", "апреля", "май", "мая", "июнь", "июня", "июль", "июля", "август", "августа", "сентябрь", "сентября", "октябрь", "октября", "ноябрь", "ноября", "декабрь", "декабря",
]);

export function buildBtcPolymarketQueryContext(question: string, priorTurns: BtcCleanPriorTurn[]): string {
  const current = propositionTokens(question);
  const previousUser = priorTurns.at(-1)?.user ?? "";
  const previous = propositionTokens(previousUser);
  if (!previous.size) return question;

  const inherited: string[] = [];
  const inheritCategory = (currentCategory: string[], previousCategory: string[]) => {
    if (!currentCategory.length && previousCategory.length) inherited.push(...previousCategory);
  };
  const values = (tokens: Set<string>, predicate: (token: string) => boolean) => Array.from(tokens).filter(predicate);

  inheritCategory(values(current, (token) => token.startsWith("usd")), values(previous, (token) => token.startsWith("usd")));
  inheritCategory(values(current, (token) => /^20\d{2}$/.test(token)), values(previous, (token) => /^20\d{2}$/.test(token)));
  inheritCategory(values(current, (token) => POLYMARKET_MONTH_TOKENS.has(token)), values(previous, (token) => POLYMARKET_MONTH_TOKENS.has(token)));
  inheritCategory(values(current, (token) => /^(?:[1-9]|[12]\d|3[01])$/.test(token)), values(previous, (token) => /^(?:[1-9]|[12]\d|3[01])$/.test(token)));
  inheritCategory(values(current, (token) => token === "reach" || token === "hit"), values(previous, (token) => token === "reach" || token === "hit"));

  return inherited.length ? `${question} ${inherited.join(" ")}` : question;
}

function polymarketDigest(query: string, result: BtcPolymarketExpectationResult | null): Record<string, unknown> {
  if (!result) return { available: false, code: "NOT_REQUESTED" };
  if (result.ok === false) return { available: false, code: result.code };
  return { available: true, as_of: result.as_of, discovery_method: result.discovery_method, discovery_pages: result.discovery_pages, event_complete: result.event_complete, expectation_candidates: result.expectation_candidates, markets: selectBtcPolymarketEvidenceMarkets(query, result, 10).map((market) => ({ event_id: market.event_id, market_id: market.market_id, condition_id: market.condition_id, question: market.question, semantic: market.semantic, expiry: market.expiry, resolution_source: market.resolution_source, resolution_rules: market.resolution_rules, probability: market.probability, best_bid: market.best_bid, best_ask: market.best_ask, spread: market.spread, depth_near_mid: market.depth_near_mid, liquidity: market.liquidity, volume: market.volume, open_interest: market.open_interest, quality: market.quality, delta_1h: market.delta_1h, delta_6h: market.delta_6h, delta_1d: market.delta_1d, delta_1w: market.delta_1w, event_url: market.event_url })), boundary: result.boundary };
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
    temporal_scope: packet.temporal_scope,
    window_summaries: take("window_summaries", 20),
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
      instructions: `You are a bounded research tool for the BHRIGU Bitcoin Corridor. Research only material Bitcoin/BTC questions, in-scope ephemeris/Astro×BTC verification, or a current crypto-ecosystem fact that is necessary to understand Bitcoin/current crypto field context. Bitcoin remains the axis; do not expand into general altcoin coverage. Prefer the accepted BHRIGU snapshot when it already answers the field question, and use web only for a missing material fact. Prefer primary or authoritative sources. Never answer unrelated general-assistant questions such as weather or travel. Separate verified facts from uncertainty. Do not produce trading instructions. Return a concise source-bound research note in ${locale === "ru" ? "Russian" : "English"}.`,
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

async function safeEvidence<T>(
  tool: EvidenceTool,
  requested: boolean,
  unavailable: EvidenceUnavailable,
  load: () => Promise<T>,
): Promise<T | null> {
  if (!requested) return null;
  try {
    return await load();
  } catch (error) {
    unavailable[tool] = `${tool.toUpperCase()}_UNAVAILABLE`;
    console.warn("BTC_CLEAN_CHAT_EVIDENCE_UNAVAILABLE", tool, error instanceof Error ? error.message : "unknown");
    return null;
  }
}

async function collectEvidence(locale: BtcCleanLocale, question: string, plan: Plan): Promise<EvidenceBundle> {
  const wants = (tool: EvidenceTool) => plan.tools.includes(tool);
  const unavailable: EvidenceUnavailable = {};
  const envelopePromise = safeEvidence("snapshot", wants("snapshot"), unavailable, () => loadBtcMarketEnvelope(question, { timeoutMs: 5_000 }));
  const binancePromise = safeEvidence("binance", wants("binance"), unavailable, () => loadBtcBinanceProductionGuarded((signal) => loadBtcBinancePublicMarketShadow({ signal })));
  const polymarketPromise = safeEvidence("polymarket", wants("polymarket"), unavailable, () => loadBtcPolymarketExpectationField({ includeHistory: plan.polymarket_history }));
  const astronomyPromise = safeEvidence("astronomy", wants("astronomy"), unavailable, () => loadBtcAstroField({ timestampUtc: plan.astro_timestamp_utc, startDate: plan.time_start, endDate: plan.time_end, bodies: plan.astro_bodies, phenomena: plan.astro_phenomena, bitcoinEvent: plan.bitcoin_event, timeoutMs: 20_000 }));
  const webPromise = safeEvidence("web", wants("web"), unavailable, () => runBoundedWebResearch(locale, question, plan));
  const [envelope, binance, polymarket, astronomy, web] = await Promise.all([envelopePromise, binancePromise, polymarketPromise, astronomyPromise, webPromise]);

  let protocol: BtcCosmographerAnswerProjection | null = null;
  if (wants("bitcoin_protocol")) {
    try {
      protocol = buildBtcProtocolAnswer(locale, evidenceRoute(locale, question, plan));
    } catch (error) {
      unavailable.bitcoin_protocol = "BITCOIN_PROTOCOL_UNAVAILABLE";
      console.warn("BTC_CLEAN_CHAT_EVIDENCE_UNAVAILABLE", "bitcoin_protocol", error instanceof Error ? error.message : "unknown");
    }
  }

  const astroBridge = wants("astro_btc_bridge") && astronomy ? {
    uses_same_computed_astro_field: true,
    astronomy_request: astronomy.packet.request,
    anchor: astronomy.anchor,
    btc_snapshot_available: Boolean(envelope?.ok),
    binance_available: Boolean(binance?.ok),
    polymarket_available: Boolean(polymarket?.ok),
    comparison_rule: "Compare independent temporal evidence only; classify convergence, divergence, or insufficient evidence. Coincidence is not causality.",
  } : null;
  if (wants("astro_btc_bridge") && !astroBridge) unavailable.astro_btc_bridge = "ASTRO_BTC_BRIDGE_UNAVAILABLE";
  return { envelope, binance, polymarket, astronomy, astroBridge, protocol, web, unavailable };
}

export function dedupeBtcCleanSourcesFirstRanked(rows: BtcCleanSource[], limit = 12): BtcCleanSource[] {
  if (limit <= 0) return [];
  const unique: BtcCleanSource[] = [];
  const seenHrefs = new Set<string>();
  for (const row of rows) {
    if (seenHrefs.has(row.href)) continue;
    seenHrefs.add(row.href);
    unique.push(row);
    if (unique.length >= limit) break;
  }
  return unique;
}

function sourceRows(query: string, evidence: EvidenceBundle): BtcCleanSource[] {
  const rows: BtcCleanSource[] = [];
  if (evidence.envelope?.ok) {
    const asOf = evidence.envelope.value.current.source_generated_at_utc;
    for (const [key, href] of Object.entries(BTC_MARKET_ENVELOPE_URLS).slice(0, 4)) rows.push({ id: `snapshot-${key}`, label: `Accepted Snapshot · ${key}`, href, as_of: asOf });
  }
  if (evidence.binance?.ok) rows.push({ id: "binance-btcusdt", label: "Binance BTCUSDT public market data", href: "https://data-api.binance.vision/api/v3/ticker/24hr?symbol=BTCUSDT", as_of: evidence.binance.snapshot.retrieved_at });
  if (evidence.polymarket?.ok) for (const market of selectBtcPolymarketEvidenceMarkets(query, evidence.polymarket, 4)) rows.push({ id: `polymarket-${market.market_id}`, label: `Polymarket · ${market.question.slice(0, 100)}`, href: market.event_url, as_of: evidence.polymarket.as_of });
  if (evidence.astronomy) {
    rows.push({ id: "astronomy-canonical", label: "BHRIGU canonical ephemeris · fresh computed Astro Field", href: "https://www.bhrigu.io/crypto-astro/btc", as_of: evidence.astronomy.requested_at_utc });
    if (evidence.astronomy.anchor) rows.push({ id: `btc-anchor-${evidence.astronomy.anchor.id}`, label: `${evidence.astronomy.anchor.label} · accepted UTC anchor`, href: evidence.astronomy.anchor.source, as_of: evidence.astronomy.anchor.timestamp_utc });
  }
  if (evidence.protocol) {
    const sourceSection = evidence.protocol.sections.find((section) => section.id === "sources");
    const historyRows = (sourceSection?.bullets ?? []).flatMap((bullet, index) => {
      const separator = bullet.lastIndexOf("|http");
      if (separator < 0) return [];
      const label = bullet.slice(0, separator).trim();
      const href = bullet.slice(separator + 1).trim();
      if (!label || !/^https:\/\//.test(href)) return [];
      return [{ id: `bitcoin-history-${index + 1}`, label, href, as_of: null } satisfies BtcCleanSource];
    });
    if (historyRows.length) rows.push(...historyRows);
    else rows.push({ id: "bitcoin-protocol", label: "Bitcoin protocol source of truth", href: "https://github.com/bitcoin/bitcoin", as_of: null });
  }
  if (evidence.web) rows.push(...evidence.web.sources);
  return dedupeBtcCleanSourcesFirstRanked(rows, 12);
}

function compactMoney(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000_000) return `$${(value / 1_000_000_000_000).toFixed(2)}T`;
  if (abs >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (abs >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  return `$${value.toFixed(0)}`;
}

function buildSemanticVisual(locale: BtcCleanLocale, plan: Plan, evidence: EvidenceBundle): BtcCleanSemanticVisual | null {
  const ru = locale === "ru";
  if (plan.request_type === "out_of_scope" || plan.visual_focus === "none") return null;
  if (plan.visual_focus === "astro" && evidence.astronomy) return {
    kind: "ASTRO_FIELD", state: "TEMPORAL", axis_label: ru ? "Астро-поле" : "Astro field", context_label: null, metrics: [], freshness: "FRESH",
  };
  if (plan.visual_focus === "bridge" && evidence.astronomy) return {
    kind: "ASTRO_BTC", state: "TEMPORAL", axis_label: "BTC", context_label: ru ? "астро-поле · независимое сопоставление" : "astro field · independent comparison", metrics: [], freshness: evidence.envelope?.ok ? (evidence.envelope.value.current.source_freshness === "FRESH" ? "FRESH" : "LIMITED") : "UNKNOWN",
  };
  if (plan.visual_focus === "expectation" && evidence.polymarket?.ok) return {
    kind: "EXPECTATION", state: "EXPECTATION", axis_label: "BTC", context_label: ru ? "рыночные ожидания" : "market expectations", metrics: [], freshness: "FRESH",
  };
  if (!evidence.envelope?.ok) return null;
  const current = evidence.envelope.value.current;
  const state: BtcCleanSemanticVisual["state"] = evidence.envelope.value.synthesis.state === "CONFIRMATION" ? "CONFIRMATION" : evidence.envelope.value.synthesis.state === "DIVERGENCE" ? "DIVERGENCE" : "LIMITED";
  const freshness: BtcCleanSemanticVisual["freshness"] = current.source_freshness === "FRESH" ? "FRESH" : "LIMITED";
  let contextLabel = ru ? "рыночное поле" : "market field";
  let metrics: Array<{ label: string; value: string }> = [];
  if (plan.visual_focus === "liquidity") {
    contextLabel = ru ? "ликвидность · контекст" : "liquidity · context";
    metrics = [{ label: "DeFi TVL", value: compactMoney(current.defi_tvl_usd) }, { label: ru ? "Стейблкоины" : "Stablecoins", value: `${current.stablecoin_share_pct.toFixed(2)}%` }];
  } else if (plan.visual_focus === "rotation") {
    contextLabel = ru ? "ротация · контекст" : "rotation · context";
    metrics = [{ label: ru ? "Ширина 24ч" : "Breadth 24h", value: `${current.alt_breadth_24h_pct.toFixed(1)}%` }, { label: "ETH", value: `${current.eth_rotation_anchor_pct.toFixed(2)}%` }];
  } else if (plan.visual_focus === "dominance") {
    contextLabel = ru ? "относительное поле" : "relative field";
    metrics = [{ label: ru ? "Доминация BTC" : "BTC dominance", value: `${current.btc_dominance_pct.toFixed(2)}%` }, { label: ru ? "Ширина 24ч" : "Breadth 24h", value: `${current.alt_breadth_24h_pct.toFixed(1)}%` }];
  } else if (plan.visual_focus === "market_structure") {
    contextLabel = ru ? "структура рынка" : "market structure";
    metrics = [{ label: ru ? "Поле" : "Field", value: current.market_field_score.toFixed(1) }, { label: ru ? "Доминация BTC" : "BTC dominance", value: `${current.btc_dominance_pct.toFixed(2)}%` }];
  } else {
    return null;
  }
  return { kind: "BTC_FIELD", state, axis_label: "BTC", context_label: contextLabel, metrics, freshness };
}

function state(requested: boolean, available: boolean): BtcCleanEvidenceState {
  if (!requested) return "NOT_REQUIRED";
  return available ? "USED" : "UNAVAILABLE";
}

function productRuntimeDigest(): Record<string, unknown> {
  return {
    primary_product_axis: "Bitcoin",
    active_subject_policy: "Supporting subjects may change without replacing the Bitcoin product axis unless the user explicitly leaves the BTC corridor.",
    browser_conversation_continuity: "sessionStorage in the current browser session",
    server_context_forwarded: `current question plus up to ${MAX_CONTEXT_TURNS} prior completed turns`,
    model_runtime_path: "BHRIGU server -> OpenAI Responses API",
    openai_store: false,
    application_database_write_in_clean_chat_route: false,
    bitcoin_temporal_origin_utc: BTC_TEMPORAL_ORIGIN_UTC,
    prospective_analysis_horizon_utc: `${BTC_PROSPECTIVE_HORIZON_DATE}T23:59:59Z`,
    long_range_astro_orchestration: `deterministic windows of at most ${BTC_ASTRO_CHUNK_DAYS} calendar days per canonical service call`,
    historical_reconstruction_boundary: "Reconstructed historical evidence is not retroactive BHRIGU point-in-time memory.",
    prospective_boundary: "Computed future astronomy is allowed through the V1 horizon; future BTC price, market outcomes and causality remain unknown.",
    privacy_boundary: "Do not promise zero provider retention, absolute confidentiality, or end-to-end encryption unless separately proven by the applicable provider/account configuration and published policy.",
  };
}

async function synthesizeAnswer(locale: BtcCleanLocale, question: string, priorTurns: BtcCleanPriorTurn[], plan: Plan, evidence: EvidenceBundle, fieldContext?: BtcResearchFieldModelContext): Promise<{ answer: string; topic: string; usage: Usage }> {
  const instructions = `You are BTC Cosmographer in BHRIGU Clean Chat V1. Synthesize a fresh answer to the actual user question from conversation and supplied evidence, never from prepared answer templates. PRIMARY_PRODUCT_AXIS is Bitcoin and remains persistent until the user explicitly leaves the BTC corridor. ACTIVE_SUBJECT may change without replacing that product axis. Bitcoin is the central analytical axis. Crypto-ecosystem evidence is supporting context only when it helps explain Bitcoin or the current crypto field. Continue natural research lines across short follow-ups such as ETH or TRX; do not reset context or ask for clarification when prior turns make the intent clear. Allow explicit returns such as 'вернись к ETH'. Do not drift into a general crypto assistant: if plan.request_type is out_of_scope, state the Bitcoin Corridor boundary briefly rather than answering the unrelated subject. For ecosystem questions, prefer accepted Snapshot/Memory facts; if an asset-specific current fact is not present there, use supplied source-bound web evidence if available, otherwise say that the current asset-level evidence is unavailable instead of inventing it. Keep BTC's relation to the supporting context visible when the question calls for that relation. Ephemerides and planetary windows remain valid in-scope subjects. Match locale exactly. Direct answer first, facts before interpretation, brief by default. Remember follow-ups, topic switches and returns. Keep fact, inference, conditional future and unknown distinct in natural language. Canonical Astro Field evidence is freshly computed from the BHRIGU geocentric tropical ephemeris for the requested UTC timestamp/interval; report exact UTC when relevant. The Bitcoin temporal history starts at the Genesis block (${BTC_TEMPORAL_ORIGIN_UTC}). Long ranges may arrive as a compact interval_series assembled from bounded canonical windows; use temporal_scope/window_summaries and event_counts_total to preserve coverage, and say when event rows are representative samples rather than an exhaustive list. Historical reconstruction must never be described as what BHRIGU knew at that past time. Prospective 2027-2028 astronomy is computable, but future market prices/outcomes remain conditional or unknown, never facts. For Bitcoin chart questions, when the evidence anchor is Genesis, explicitly say the canonical anchor being used is the Genesis block timestamp; do not silently combine it with whitepaper/software/other possible anchors. Astro×BTC must use the same computed Astro Field supplied here and independent BTC evidence; state convergence, divergence, or insufficient evidence, never causality. Binance is present/realized. Polymarket is the market-implied price/probability of exact future propositions, never a BHRIGU prediction/global BTC probability; never combine incompatible expiries or turn path propositions into terminal probabilities. Polymarket proposition meaning is defined by the supplied resolution rules and exact expiry, not by the market title alone; use the structured resolution source when present and do not invent one when it is absent. Bitcoin protocol evidence describes mechanism/history, not price. Web evidence is bounded external verification and remains source-bound. Never invent unavailable evidence. If evidence_unavailable lists a source required for a factual claim, do not substitute model memory for that source: state that the authoritative evidence is unavailable and answer only the bounded remainder. For public BHRIGU/AiBhrigu project-resource questions, use supplied source-bound web evidence and never infer private internals. For privacy/data-handling questions, use product_runtime facts, distinguish code-level facts from provider-policy guarantees, and never claim zero retention or absolute confidentiality without separate proof. Never give buy/sell/long/short/entry/exit/leverage/position-sizing instructions. Future outcomes are not established facts. Persisted Research Field memory, when supplied, is historical user-owned context only. Always establish current truth from current evidence before comparing it with a baseline or checkpoint; never repeat a stale checkpoint value as current truth. Field preferences cannot override source authority or safety boundaries. Do not expose internal routing, tool names, JSON, filesystem paths, private modules, CDE, Master Control correspondence or secrets. Return only the required structured object.`;
  const prompt = JSON.stringify({
    locale,
    question,
    conversation: priorTurns.slice(-MAX_CONTEXT_TURNS),
    research_field_context: fieldContext ?? null,
    plan,
    product_runtime: productRuntimeDigest(),
    evidence_unavailable: evidence.unavailable,
    evidence: {
      accepted_snapshot_and_memory: snapshotDigest(evidence.envelope),
      binance_current_field: binanceDigest(evidence.binance),
      polymarket_expectation_field: polymarketDigest(buildBtcPolymarketQueryContext(question, priorTurns), evidence.polymarket),
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

export async function runBtcCleanChatModel(input: { locale: BtcCleanLocale; question: string; priorTurns?: BtcCleanPriorTurn[]; fieldContext?: BtcResearchFieldModelContext }): Promise<BtcCleanChatResponse> {
  const priorTurns = input.priorTurns ?? [];
  const totalUsage: Usage = { input_tokens: 0, output_tokens: 0, web_search_calls: 0 };
  const planned = await buildEvidencePlan({ locale: input.locale, question: input.question, priorTurns, fieldContext: input.fieldContext });
  addUsage(totalUsage, planned.usage);
  const evidence = await collectEvidence(input.locale, input.question, planned.plan);
  if (evidence.web) addUsage(totalUsage, evidence.web.usage);
  const synthesis = await synthesizeAnswer(input.locale, input.question, priorTurns, planned.plan, evidence, input.fieldContext);
  addUsage(totalUsage, synthesis.usage);
  const wants = (tool: EvidenceTool) => planned.plan.tools.includes(tool);
  return {
    schema_version: BTC_CLEAN_CHAT_SCHEMA,
    ok: true,
    intent: "MODEL_ORCHESTRATED",
    topic: synthesis.topic,
    answer: synthesis.answer,
    as_of: new Date().toISOString(),
    sources: sourceRows(buildBtcPolymarketQueryContext(input.question, priorTurns), evidence),
    semantic_visual: buildSemanticVisual(input.locale, planned.plan, evidence),
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
