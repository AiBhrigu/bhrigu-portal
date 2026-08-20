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
  BTC_PUBLIC_ASTRO_EVIDENCE_META,
  buildAstroBtcBridgeBoundary,
  buildBtcAstroAnswer,
} from "./btc-public-astro-evidence";
import {
  BTC_MULTI_BODY_ASTRO_RC_SCHEMA,
  buildMultiBodyAstroYearAnswer,
  type BtcMultiBodyAstroRcRoute,
} from "./btc-cosmographer-multi-body-astro-rc";
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
const MAX_PLAN_OUTPUT_TOKENS = 320;
const MAX_FINAL_OUTPUT_TOKENS = 500;
const MAX_WEB_OUTPUT_TOKENS = 360;

type EvidenceTool =
  | "snapshot"
  | "binance"
  | "polymarket"
  | "astronomy"
  | "astro_btc_bridge"
  | "bitcoin_protocol"
  | "web";

type Plan = {
  topic: string;
  tools: EvidenceTool[];
  polymarket_history: boolean;
  focus: string;
  request_type: "fact" | "explain" | "compare" | "change" | "why" | "watch" | "future" | "research" | "trading_boundary" | "other";
  context_relation: "new" | "follow_up" | "return" | "switch";
  astro_subject: string | null;
  time_start: string | null;
  time_end: string | null;
  protocol_subject: string | null;
  web_reason: string | null;
};

type Usage = { input_tokens: number; output_tokens: number; web_search_calls: number };
type ModelResult = { text: string; usage: Usage; payload: Record<string, unknown> };
type WebEvidence = { text: string; sources: BtcCleanSource[]; usage: Usage };

type EvidenceBundle = {
  envelope: BtcMarketEnvelopeResult | null;
  binance: BinancePublicMarketResult | null;
  polymarket: BtcPolymarketExpectationResult | null;
  astronomy: BtcCosmographerAnswerProjection | null;
  astroBridge: BtcCosmographerAnswerProjection | null;
  protocol: BtcCosmographerAnswerProjection | null;
  web: WebEvidence | null;
};

const TOOL_VALUES = new Set<EvidenceTool>([
  "snapshot", "binance", "polymarket", "astronomy", "astro_btc_bridge", "bitcoin_protocol", "web",
]);
const REQUEST_VALUES = new Set<Plan["request_type"]>([
  "fact", "explain", "compare", "change", "why", "watch", "future", "research", "trading_boundary", "other",
]);
const RELATION_VALUES = new Set<Plan["context_relation"]>(["new", "follow_up", "return", "switch"]);
const BODY_VALUES = new Set(["sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto", "planetary_aspects"]);
const PROTOCOL_VALUES = new Set(["overview", "supply", "halving", "subsidy", "fees", "difficulty", "mining", "utxo", "genesis", "consensus", "blocks", "satoshi_history", "bitcoin_origin", "genesis_history"]);

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
      if (isRecord(content) && typeof content.text === "string") parts.push(content.text);
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

async function openAiResponse(body: Record<string, unknown>): Promise<ModelResult> {
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
      const error = isRecord(payload.error) && typeof payload.error.message === "string"
        ? payload.error.message
        : `HTTP_${response.status}`;
      throw new Error(`DIRECT_OPENAI_${error}`);
    }
    const text = extractText(payload);
    if (!text) throw new Error("DIRECT_OPENAI_EMPTY_RESPONSE");
    return { text, usage: usageFrom(payload), payload };
  } finally {
    clearTimeout(timer);
  }
}

function parseJson(text: string): Record<string, unknown> | null {
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

function stringOrNull(value: unknown, max = 120): string | null {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, max) : null;
}

function validIsoDate(value: unknown): string | null {
  if (typeof value !== "string" || value.length !== 10) return null;
  const time = new Date(`${value}T00:00:00Z`).getTime();
  return Number.isFinite(time) ? value : null;
}

function normalizePlan(raw: Record<string, unknown> | null): Plan {
  const requested = Array.isArray(raw?.tools) ? raw.tools : [];
  const tools = Array.from(new Set(requested.filter((value): value is EvidenceTool => typeof value === "string" && TOOL_VALUES.has(value as EvidenceTool))));
  if (tools.includes("astro_btc_bridge")) {
    if (!tools.includes("astronomy")) tools.push("astronomy");
    if (!tools.includes("snapshot")) tools.push("snapshot");
  }
  const astroSubject = stringOrNull(raw?.astro_subject, 40);
  const protocolSubject = stringOrNull(raw?.protocol_subject, 40);
  const requestType = typeof raw?.request_type === "string" && REQUEST_VALUES.has(raw.request_type as Plan["request_type"])
    ? raw.request_type as Plan["request_type"] : "other";
  const relation = typeof raw?.context_relation === "string" && RELATION_VALUES.has(raw.context_relation as Plan["context_relation"])
    ? raw.context_relation as Plan["context_relation"] : "new";
  return {
    topic: stringOrNull(raw?.topic, 80) ?? "Bitcoin",
    tools,
    polymarket_history: raw?.polymarket_history === true,
    focus: stringOrNull(raw?.focus, 260) ?? "Answer the user directly from the minimum sufficient evidence.",
    request_type: requestType,
    context_relation: relation,
    astro_subject: astroSubject && BODY_VALUES.has(astroSubject) ? astroSubject : null,
    time_start: validIsoDate(raw?.time_start),
    time_end: validIsoDate(raw?.time_end),
    protocol_subject: protocolSubject && PROTOCOL_VALUES.has(protocolSubject) ? protocolSubject : null,
    web_reason: stringOrNull(raw?.web_reason, 180),
  };
}

function priorContext(priorTurns: BtcCleanPriorTurn[]): string {
  if (!priorTurns.length) return "No prior conversation turns.";
  return priorTurns.slice(-8).map((turn, index) =>
    `${index + 1}. USER: ${turn.user}\nCOSMOGRAPHER: ${turn.assistant ?? ""}\nTOPIC: ${turn.topic ?? ""}`
  ).join("\n\n");
}

async function buildEvidencePlan(input: {
  locale: BtcCleanLocale;
  question: string;
  priorTurns: BtcCleanPriorTurn[];
}): Promise<{ plan: Plan; usage: Usage }> {
  const instructions = `You are the semantic planning layer for BHRIGU BTC Clean Chat V1. The user may ask arbitrary questions in Russian or English. Reason about the minimum evidence needed; do not route by keywords or prepared questions. Available read-only tools: snapshot (accepted BTC structural snapshot plus Snapshot Memory), binance (current/realized BTCUSDT market field), polymarket (market-priced future BTC propositions and same-contract history), astronomy (accepted ephemeris/planetary positions/aspects/stations/ingresses/temporal windows), astro_btc_bridge (independent comparison of astronomy timing with BTC evidence), bitcoin_protocol (pinned Bitcoin mechanism/history evidence), web (OpenAI native web search). Astronomy is first-class evidence and must not be forced into a BTC explanation. For Astro×BTC, compare independent temporal evidence only; coincidence is not causality. Use web only if the user explicitly asks for current external research, a material current fact is unresolved by the other authorities, or independent current verification is required. Never use web as blind fallback. Binance describes present/realized state. Polymarket prices exact future propositions; it does not predict BTC and must not become a global BTC probability. Use polymarket_history only for same-contract expectation change. Bitcoin protocol evidence is for mechanics/history; exact current chain state may require web verification. Resolve pronouns, follow-ups, topic switches and returns from conversation. Trading requests remain informational and must never produce execution advice. Current date is 2026-08-20. Accepted astronomy coverage is ${BTC_PUBLIC_ASTRO_EVIDENCE_META.coverage_start} through ${BTC_PUBLIC_ASTRO_EVIDENCE_META.coverage_end}. For a single planet set astro_subject to sun, moon, mercury, venus, mars, jupiter, saturn, uranus, neptune or pluto. For general planetary-aspect windows set astro_subject=planetary_aspects. For protocol use one of overview, supply, halving, subsidy, fees, difficulty, mining, utxo, genesis, consensus, blocks, satoshi_history, bitcoin_origin, genesis_history. Return JSON only with keys topic, tools, polymarket_history, focus, request_type, context_relation, astro_subject, time_start, time_end, protocol_subject, web_reason. request_type is one of fact, explain, compare, change, why, watch, future, research, trading_boundary, other. context_relation is new, follow_up, return, or switch.`;
  const result = await openAiResponse({
    instructions,
    input: `LOCALE=${input.locale}\nQUESTION=${input.question}\n\nCONVERSATION:\n${priorContext(input.priorTurns)}`,
    max_output_tokens: MAX_PLAN_OUTPUT_TOKENS,
    reasoning: { effort: "low" },
  });
  return { plan: normalizePlan(parseJson(result.text)), usage: result.usage };
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

function evidenceRoute(locale: BtcCleanLocale, question: string, plan: Plan, domain: "astromodule" | "astro_btc_bridge" | "bitcoin_protocol"): BtcCosmographerRoute {
  const start = plan.time_start;
  const end = plan.time_end;
  return {
    schema: BTC_COSMOGRAPHER_ROUTE_SCHEMA,
    locale,
    raw_question: question,
    normalized_question: question.trim(),
    domain,
    subject: domain === "bitcoin_protocol" ? (plan.protocol_subject ?? "overview") : (plan.astro_subject ?? "planetary_aspects"),
    intents: routeIntent(plan),
    context_relation: contextRelation(plan),
    time_range: start && end ? { start, end, label: `${start} — ${end}`, source: "QUESTION" } : null,
    market_question_class: null,
    capability_id: `clean_chat_${domain}`,
    confidence: "BOUNDED",
    explicit_entities: [],
  };
}

function buildAstronomy(locale: BtcCleanLocale, question: string, plan: Plan): BtcCosmographerAnswerProjection {
  const base = evidenceRoute(locale, question, plan, plan.tools.includes("astro_btc_bridge") ? "astro_btc_bridge" : "astromodule");
  if (plan.astro_subject === "planetary_aspects" || !plan.astro_subject) {
    const multi: BtcMultiBodyAstroRcRoute = {
      ...base,
      subject: "planetary_aspects",
      rc_schema: BTC_MULTI_BODY_ASTRO_RC_SCHEMA,
      rc_scope: "MULTI_BODY",
      rc_intents: ["YEAR_OVERVIEW"],
    };
    return buildMultiBodyAstroYearAnswer(locale, multi);
  }
  return buildBtcAstroAnswer(locale, base);
}

function snapshotDigest(result: BtcMarketEnvelopeResult | null): Record<string, unknown> {
  if (!result || result.ok === false) return { available: false };
  const value = result.value;
  return {
    available: true,
    generated_at_utc: value.generated_at_utc,
    current: value.current,
    memory: {
      comparison_status: value.memory.comparison_status,
      methodology_compatible: value.memory.methodology_compatible,
      metrics: value.memory.metrics.slice(0, 16),
      transition_interpretation: value.memory.transition_interpretation,
    },
    synthesis: value.synthesis,
    boundary: value.boundary,
  };
}

function binanceDigest(result: BinancePublicMarketResult | null): Record<string, unknown> {
  if (!result) return { available: false, code: "NOT_REQUESTED" };
  if (result.ok === false) return { available: false, code: result.code };
  return {
    available: true,
    retrieved_at: result.snapshot.retrieved_at,
    derived: result.snapshot.derived,
    evidence: result.snapshot.evidence.slice(0, 8).map((row) => ({
      endpoint: row.endpoint_or_stream,
      value: row.normalized_value,
      freshness: row.freshness,
    })),
  };
}

function polymarketDigest(result: BtcPolymarketExpectationResult | null): Record<string, unknown> {
  if (!result) return { available: false, code: "NOT_REQUESTED" };
  if (result.ok === false) return { available: false, code: result.code };
  return {
    available: true,
    as_of: result.as_of,
    event_complete: result.event_complete,
    expectation_candidates: result.expectation_candidates,
    markets: result.markets.filter((market) => market.quality !== "Q1_WEAK").slice(0, 10).map((market) => ({
      question: market.question,
      semantic: market.semantic,
      expiry: market.expiry,
      probability: market.probability,
      best_bid: market.best_bid,
      best_ask: market.best_ask,
      spread: market.spread,
      depth_near_mid: market.depth_near_mid,
      liquidity: market.liquidity,
      volume: market.volume,
      open_interest: market.open_interest,
      quality: market.quality,
      delta_1h: market.delta_1h,
      delta_6h: market.delta_6h,
      delta_1d: market.delta_1d,
      delta_1w: market.delta_1w,
      event_url: market.event_url,
    })),
    boundary: result.boundary,
  };
}

function projectionDigest(value: BtcCosmographerAnswerProjection | null): unknown {
  if (!value) return { available: false };
  return { available: true, ...value };
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
  const result = await openAiResponse({
    instructions: `You are a bounded research tool for BHRIGU Clean Chat. Research only the user's material current question. Prefer primary or authoritative sources. Separate verified facts from uncertainty. Do not produce trading instructions. Return a concise source-bound research note in ${locale === "ru" ? "Russian" : "English"}.`,
    input: `QUESTION=${question}\nRESEARCH_REASON=${plan.web_reason ?? "Independent current verification required."}`,
    tools: [{ type: "web_search", search_context_size: "low" }],
    tool_choice: "auto",
    max_output_tokens: MAX_WEB_OUTPUT_TOKENS,
    reasoning: { effort: "low" },
  });
  return { text: result.text, sources: extractWebSources(result.payload), usage: result.usage };
}

async function collectEvidence(locale: BtcCleanLocale, question: string, plan: Plan): Promise<EvidenceBundle> {
  const wants = (tool: EvidenceTool) => plan.tools.includes(tool);
  const envelopePromise: Promise<BtcMarketEnvelopeResult | null> = wants("snapshot")
    ? loadBtcMarketEnvelope(question, { timeoutMs: 5_000 }) : Promise.resolve(null);
  const binancePromise: Promise<BinancePublicMarketResult | null> = wants("binance")
    ? loadBtcBinanceProductionGuarded((signal) => loadBtcBinancePublicMarketShadow({ signal })) : Promise.resolve(null);
  const polymarketPromise: Promise<BtcPolymarketExpectationResult | null> = wants("polymarket")
    ? loadBtcPolymarketExpectationField({ includeHistory: plan.polymarket_history }) : Promise.resolve(null);
  const astronomy = wants("astronomy") ? buildAstronomy(locale, question, plan) : null;
  const protocol = wants("bitcoin_protocol") ? buildBtcProtocolAnswer(locale, evidenceRoute(locale, question, plan, "bitcoin_protocol")) : null;
  const webPromise = wants("web") ? runBoundedWebResearch(locale, question, plan) : Promise.resolve(null);
  const [envelope, binance, polymarket, web] = await Promise.all([envelopePromise, binancePromise, polymarketPromise, webPromise]);
  const astroBridge = wants("astro_btc_bridge") && astronomy ? buildAstroBtcBridgeBoundary(locale, astronomy) : null;
  return { envelope, binance, polymarket, astronomy, astroBridge, protocol, web };
}

function sourceRows(evidence: EvidenceBundle): BtcCleanSource[] {
  const rows: BtcCleanSource[] = [];
  if (evidence.envelope?.ok) {
    const asOf = evidence.envelope.value.current.source_generated_at_utc;
    for (const [key, href] of Object.entries(BTC_MARKET_ENVELOPE_URLS).slice(0, 4)) {
      rows.push({ id: `snapshot-${key}`, label: `Accepted Snapshot · ${key}`, href, as_of: asOf });
    }
  }
  if (evidence.binance?.ok) rows.push({
    id: "binance-btcusdt",
    label: "Binance BTCUSDT public market data",
    href: "https://data-api.binance.vision/api/v3/ticker/24hr?symbol=BTCUSDT",
    as_of: evidence.binance.snapshot.retrieved_at,
  });
  if (evidence.polymarket?.ok) {
    for (const market of evidence.polymarket.markets.filter((item) => item.quality !== "Q1_WEAK").slice(0, 4)) {
      rows.push({ id: `polymarket-${market.market_id}`, label: `Polymarket · ${market.question.slice(0, 100)}`, href: market.event_url, as_of: evidence.polymarket.as_of });
    }
  }
  if (evidence.astronomy) rows.push({
    id: "astronomy-evidence",
    label: "BHRIGU accepted astronomical evidence index",
    href: "https://www.bhrigu.io/crypto-astro/btc",
    as_of: BTC_PUBLIC_ASTRO_EVIDENCE_META.coverage_end,
  });
  if (evidence.protocol) {
    const historySource = BTC_ORIGINS_KNOWLEDGE_CAPSULE.sources[0];
    rows.push({
      id: "bitcoin-protocol",
      label: "Bitcoin protocol source of truth",
      href: evidence.protocol.answer_mode === "PROTOCOL_FACT" && historySource ? historySource.url : "https://github.com/bitcoin/bitcoin",
      as_of: null,
    });
  }
  if (evidence.web) rows.push(...evidence.web.sources);
  return Array.from(new Map(rows.map((row) => [row.href, row])).values()).slice(0, 12);
}

function state(requested: boolean, available: boolean): BtcCleanEvidenceState {
  if (!requested) return "NOT_REQUIRED";
  return available ? "USED" : "UNAVAILABLE";
}

async function synthesizeAnswer(locale: BtcCleanLocale, question: string, priorTurns: BtcCleanPriorTurn[], plan: Plan, evidence: EvidenceBundle): Promise<{ answer: string; topic: string; usage: Usage }> {
  const instructions = `You are BTC Cosmographer in BHRIGU Clean Chat V1. Synthesize a fresh answer to the user's actual question from the supplied conversation, plan and evidence. Do not use prepared answer templates. Match the requested locale exactly. Direct answer first; facts before interpretation; brief by default, normally 2–5 short paragraphs. Remember follow-ups, allow topic switches and returns, simplify when asked, and challenge or revise a prior answer when new evidence changes it. Keep FACT, INFERENCE, CONDITIONAL FUTURE and UNKNOWN epistemically distinct in natural prose without exposing technical enums. Binance is present/realized market evidence. Accepted Snapshot and Snapshot Memory are structural/current-memory evidence. Polymarket is the market-implied price/probability of exact future propositions, never a BHRIGU prediction or a global BTC probability; never combine incompatible expiries or convert path/touch propositions into terminal probabilities. Astronomy is an independent temporal field based on accepted ephemeris/positions/aspects/stations/ingresses/windows. Never say astronomy causes BTC. For Astro×BTC compare independent evidence and state convergence, divergence, or insufficient evidence; temporal coincidence alone is not causality. Bitcoin protocol evidence describes mechanism/history, not price. Web research is bounded external verification and must remain tied to its cited sources. Never invent unavailable evidence. Never give buy/sell/long/short/entry/exit/leverage/position-sizing instructions. Future outcomes are never established facts. Do not expose internal routing, tool names, technical enums, JSON or system mechanics. Return JSON only: {"answer":"...","topic":"short natural topic label"}.`;
  const prompt = JSON.stringify({
    locale,
    question,
    conversation: priorTurns.slice(-8),
    plan,
    evidence: {
      accepted_snapshot_and_memory: snapshotDigest(evidence.envelope),
      binance_current_field: binanceDigest(evidence.binance),
      polymarket_expectation_field: polymarketDigest(evidence.polymarket),
      astronomy_field: projectionDigest(evidence.astronomy),
      astro_btc_bridge: projectionDigest(evidence.astroBridge),
      bitcoin_protocol: projectionDigest(evidence.protocol),
      web_research: evidence.web ? { available: true, note: evidence.web.text, sources: evidence.web.sources } : { available: false },
    },
  });
  const result = await openAiResponse({
    instructions,
    input: prompt,
    max_output_tokens: MAX_FINAL_OUTPUT_TOKENS,
    reasoning: { effort: "low" },
  });
  const parsed = parseJson(result.text);
  const answer = typeof parsed?.answer === "string" ? parsed.answer.trim() : "";
  if (!answer) throw new Error("DIRECT_OPENAI_SYNTHESIS_INVALID");
  const topic = stringOrNull(parsed?.topic, 80) ?? plan.topic;
  return { answer, topic, usage: result.usage };
}

export async function runBtcCleanChatModel(input: {
  locale: BtcCleanLocale;
  question: string;
  priorTurns?: BtcCleanPriorTurn[];
}): Promise<BtcCleanChatResponse> {
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
    usage: {
      provider: BTC_CLEAN_CHAT_PROVIDER,
      model: BTC_CLEAN_CHAT_MODEL_ID,
      ...totalUsage,
    },
  };
}
