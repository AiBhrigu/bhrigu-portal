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
  BTC_CLEAN_CHAT_SCHEMA,
  type BtcCleanChatResponse,
  type BtcCleanIntent,
  type BtcCleanLocale,
  type BtcCleanPriorTurn,
  type BtcCleanSource,
} from "./btc-clean-chat-v1";

export const BTC_CLEAN_CHAT_MODEL_ID = "openai/gpt-5.6-sol" as const;
const GATEWAY_URL = "https://ai-gateway.vercel.sh/v1/responses";
const MODEL_TIMEOUT_MS = 30_000;
const MAX_FINAL_OUTPUT_TOKENS = 500;
const MAX_PLAN_OUTPUT_TOKENS = 220;

const VALID_INTENTS = new Set<BtcCleanIntent>([
  "FIELD_CHANGE",
  "WHY_IT_MATTERS",
  "WATCH_NEXT",
  "EXPECTATION_NOW",
  "EXPECTATION_DELTA",
  "LIQUIDITY",
  "RETURN_LIQUIDITY",
  "GENERAL_FIELD",
  "TRADING_BOUNDARY",
]);

type EvidenceTool = "snapshot" | "binance" | "polymarket";

type ModelPlan = {
  intent: BtcCleanIntent;
  topic: string;
  tools: EvidenceTool[];
  expectation_history: boolean;
  focus: string;
};

type GatewayResponse = Record<string, unknown>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function gatewayAuth(): string {
  const token = process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN;
  if (!token) throw new Error("MODEL_PROVIDER_AUTH_UNAVAILABLE");
  return token;
}

function extractText(value: unknown): string {
  if (!isRecord(value)) return "";
  if (typeof value.output_text === "string" && value.output_text.trim()) return value.output_text.trim();
  const output = Array.isArray(value.output) ? value.output : [];
  const parts: string[] = [];
  for (const item of output) {
    if (!isRecord(item) || !Array.isArray(item.content)) continue;
    for (const content of item.content) {
      if (isRecord(content) && typeof content.text === "string") parts.push(content.text);
    }
  }
  return parts.join("\n").trim();
}

async function modelText(instructions: string, input: string, maxOutputTokens: number): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), MODEL_TIMEOUT_MS);
  try {
    const response = await fetch(GATEWAY_URL, {
      method: "POST",
      headers: {
        authorization: `Bearer ${gatewayAuth()}`,
        "content-type": "application/json",
        accept: "application/json",
      },
      cache: "no-store",
      signal: controller.signal,
      body: JSON.stringify({
        model: BTC_CLEAN_CHAT_MODEL_ID,
        instructions,
        input,
        max_output_tokens: maxOutputTokens,
        reasoning: { effort: "low" },
      }),
    });
    const payload = await response.json() as GatewayResponse;
    if (!response.ok) {
      const message = isRecord(payload.error) && typeof payload.error.message === "string"
        ? payload.error.message
        : `HTTP_${response.status}`;
      throw new Error(`MODEL_GATEWAY_${message}`);
    }
    const text = extractText(payload);
    if (!text) throw new Error("MODEL_EMPTY_RESPONSE");
    return text;
  } finally {
    clearTimeout(timer);
  }
}

function parseJsonObject(text: string): Record<string, unknown> | null {
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

function normalizePlan(raw: Record<string, unknown> | null): ModelPlan {
  const intent = typeof raw?.intent === "string" && VALID_INTENTS.has(raw.intent as BtcCleanIntent)
    ? raw.intent as BtcCleanIntent
    : "GENERAL_FIELD";
  const topic = typeof raw?.topic === "string" && raw.topic.trim()
    ? raw.topic.trim().slice(0, 80)
    : "btc";
  const requested = Array.isArray(raw?.tools) ? raw?.tools : [];
  const tools = requested.filter((value): value is EvidenceTool =>
    value === "snapshot" || value === "binance" || value === "polymarket"
  );
  if (!tools.includes("snapshot")) tools.unshift("snapshot");
  return {
    intent,
    topic,
    tools: Array.from(new Set(tools)),
    expectation_history: raw?.expectation_history === true,
    focus: typeof raw?.focus === "string" ? raw.focus.trim().slice(0, 240) : "Answer the user directly.",
  };
}

function priorContext(priorTurns: BtcCleanPriorTurn[]): string {
  if (!priorTurns.length) return "No prior conversation turns.";
  return priorTurns.slice(-8).map((turn, index) =>
    `${index + 1}. USER: ${turn.user}\nASSISTANT: ${turn.assistant ?? ""}\nTOPIC: ${turn.topic ?? ""}`
  ).join("\n\n");
}

async function buildEvidencePlan(input: {
  locale: BtcCleanLocale;
  question: string;
  priorTurns: BtcCleanPriorTurn[];
}): Promise<ModelPlan> {
  const instructions = `You are the planning layer for BHRIGU BTC Clean Chat V1. Understand arbitrary natural BTC questions and choose only the read-only evidence required. You are not allowed to trade or recommend trades. Snapshot means the accepted BTC field snapshot plus snapshot-to-snapshot memory. Binance means current realized BTCUSDT market evidence. Polymarket means future expectation evidence for exact propositions, never a BHRIGU prediction. Use Polymarket history when the user asks what changed in expectations. Resolve follow-ups, topic switches and returns from the supplied conversation. Return JSON only with keys: intent, topic, tools, expectation_history, focus. intent must be one of FIELD_CHANGE, WHY_IT_MATTERS, WATCH_NEXT, EXPECTATION_NOW, EXPECTATION_DELTA, LIQUIDITY, RETURN_LIQUIDITY, GENERAL_FIELD, TRADING_BOUNDARY. tools is an array containing any of snapshot, binance, polymarket. Choose binance for current price/market-state questions. Choose polymarket for future expectations. Always include snapshot. Do not infer causality from co-movement.`;
  const prompt = `LOCALE=${input.locale}\nCURRENT_QUESTION=${input.question}\n\nCONVERSATION:\n${priorContext(input.priorTurns)}`;
  return normalizePlan(parseJsonObject(await modelText(instructions, prompt, MAX_PLAN_OUTPUT_TOKENS)));
}

function snapshotDigest(result: BtcMarketEnvelopeResult | null): Record<string, unknown> {
  if (!result || result.ok === false) return { available: false };
  const value = result.value;
  const changed = value.memory.metrics
    .filter((metric) => metric.direction !== "UNCHANGED")
    .slice(0, 12)
    .map((metric) => ({
      metric: metric.metric_id,
      previous: metric.previous_value,
      current: metric.current_value,
      direction: metric.direction,
    }));
  return {
    available: true,
    generated_at_utc: value.generated_at_utc,
    current: {
      price_usd: value.current.price_usd,
      change_24h_pct: value.current.change_24h_pct,
      change_7d_pct: value.current.change_7d_pct,
      change_30d_pct: value.current.change_30d_pct,
      btc_dominance_pct: value.current.btc_dominance_pct,
      stablecoin_share_pct: value.current.stablecoin_share_pct,
      defi_tvl_usd: value.current.defi_tvl_usd,
      dex_volume_24h_usd: value.current.dex_volume_24h_usd,
      market_field_score: value.current.market_field_score,
      regime: value.current.regime,
      direction_bias: value.current.direction_bias,
      liquidity_context_state: value.current.liquidity_context_state,
      source_freshness: value.current.source_freshness,
    },
    memory: {
      comparison_status: value.memory.comparison_status,
      methodology_compatible: value.memory.methodology_compatible,
      changed_metrics: changed,
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
    discovered_events: result.discovered_events,
    expectation_candidates: result.expectation_candidates,
    markets: result.markets
      .filter((market) => market.quality !== "Q1_WEAK")
      .slice(0, 8)
      .map((market) => ({
        event_id: market.event_id,
        market_id: market.market_id,
        question: market.question,
        semantic: market.semantic,
        expiry: market.expiry,
        probability: market.probability,
        spread: market.spread,
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

function sourceRows(
  envelope: BtcMarketEnvelopeResult | null,
  binance: BinancePublicMarketResult | null,
  polymarket: BtcPolymarketExpectationResult | null,
): BtcCleanSource[] {
  const sources: BtcCleanSource[] = [];
  if (envelope && envelope.ok) {
    const asOf = envelope.value.current.source_generated_at_utc;
    for (const [key, href] of Object.entries(BTC_MARKET_ENVELOPE_URLS).slice(0, 3)) {
      sources.push({ id: `snapshot-${key}`, label: `Accepted Snapshot · ${key}`, href, as_of: asOf });
    }
  }
  if (binance && binance.ok) {
    sources.push({
      id: "binance-btcusdt",
      label: "Binance BTCUSDT public market data",
      href: "https://data-api.binance.vision/api/v3/ticker/24hr?symbol=BTCUSDT",
      as_of: binance.snapshot.retrieved_at,
    });
  }
  if (polymarket && polymarket.ok) {
    for (const market of polymarket.markets.filter((item) => item.quality !== "Q1_WEAK").slice(0, 4)) {
      sources.push({
        id: `polymarket-${market.market_id}`,
        label: `Polymarket · ${market.question.slice(0, 100)}`,
        href: market.event_url,
        as_of: polymarket.as_of,
      });
    }
  }
  return sources;
}

async function collectEvidence(plan: ModelPlan, question: string) {
  const snapshotPromise = loadBtcMarketEnvelope(question, { timeoutMs: 5_000 });
  const binancePromise: Promise<BinancePublicMarketResult | null> = plan.tools.includes("binance")
    ? loadBtcBinanceProductionGuarded((signal) => loadBtcBinancePublicMarketShadow({ signal }))
    : Promise.resolve(null);
  const polymarketPromise: Promise<BtcPolymarketExpectationResult | null> = plan.tools.includes("polymarket")
    ? loadBtcPolymarketExpectationField({ includeHistory: plan.expectation_history })
    : Promise.resolve(null);
  const [envelope, binance, polymarket] = await Promise.all([snapshotPromise, binancePromise, polymarketPromise]);
  return { envelope, binance, polymarket };
}

function evidencePrompt(
  plan: ModelPlan,
  question: string,
  locale: BtcCleanLocale,
  priorTurns: BtcCleanPriorTurn[],
  evidence: Awaited<ReturnType<typeof collectEvidence>>,
): string {
  return JSON.stringify({
    locale,
    question,
    conversation: priorTurns.slice(-8),
    plan,
    evidence: {
      accepted_snapshot_and_memory: snapshotDigest(evidence.envelope),
      binance_current_field: binanceDigest(evidence.binance),
      polymarket_expectation_field: polymarketDigest(evidence.polymarket),
    },
  });
}

async function synthesizeAnswer(
  plan: ModelPlan,
  question: string,
  locale: BtcCleanLocale,
  priorTurns: BtcCleanPriorTurn[],
  evidence: Awaited<ReturnType<typeof collectEvidence>>,
): Promise<{ answer: string; topic: string }> {
  const instructions = `You are BTC Cosmographer in BHRIGU Clean Chat V1. Answer the user's actual natural-language question freshly from the supplied evidence and conversation, not from a template. Match the user's language: Russian for ru, English for en. Preserve multi-turn continuity, references, topic switches and explicit returns. Use concise natural prose, usually 2-5 short paragraphs, within 500 output tokens. Explain simply when requested. For current market facts use Binance/current Snapshot evidence. For future expectations describe Polymarket as market-implied prices for exact propositions, never as BHRIGU's prediction or a global BTC probability. Never combine incompatible expiries or turn hit/touch markets into terminal-price probabilities. Never present future outcomes as established facts. Do not claim causality unless evidence directly establishes it; distinguish what changed, what strengthened, what weakened, what remains unexplained, and what evidence would matter next when relevant. Never provide buy/sell/long/short/entry/exit/leverage or position-sizing instructions; if asked, keep the answer informational and explain the boundary. If requested evidence is unavailable, say so directly instead of inventing it. Do not expose internal enums, routing labels, tool names, JSON, or system mechanics. Return JSON only: {"answer":"...","topic":"short natural topic label"}.`;
  const raw = parseJsonObject(await modelText(instructions, evidencePrompt(plan, question, locale, priorTurns, evidence), MAX_FINAL_OUTPUT_TOKENS));
  const answer = typeof raw?.answer === "string" ? raw.answer.trim() : "";
  if (!answer) throw new Error("MODEL_SYNTHESIS_INVALID");
  const topic = typeof raw?.topic === "string" && raw.topic.trim() ? raw.topic.trim().slice(0, 80) : plan.topic;
  return { answer, topic };
}

export async function runBtcCleanChatModel(input: {
  locale: BtcCleanLocale;
  question: string;
  priorTurns?: BtcCleanPriorTurn[];
}): Promise<BtcCleanChatResponse> {
  const priorTurns = input.priorTurns ?? [];
  const plan = await buildEvidencePlan({ locale: input.locale, question: input.question, priorTurns });
  const evidence = await collectEvidence(plan, input.question);
  const synthesis = await synthesizeAnswer(plan, input.question, input.locale, priorTurns, evidence);
  const expectationRequested = plan.tools.includes("polymarket");
  const binanceRequested = plan.tools.includes("binance");
  return {
    schema_version: BTC_CLEAN_CHAT_SCHEMA,
    ok: true,
    intent: plan.intent,
    topic: synthesis.topic,
    answer: synthesis.answer,
    as_of: new Date().toISOString(),
    sources: sourceRows(evidence.envelope, evidence.binance, evidence.polymarket),
    evidence: {
      accepted_snapshot: evidence.envelope.ok ? "USED" : "UNAVAILABLE",
      snapshot_memory: evidence.envelope.ok ? "USED" : "UNAVAILABLE",
      binance_current_field: binanceRequested
        ? (evidence.binance && evidence.binance.ok ? "USED" : "UNAVAILABLE")
        : "NOT_REQUIRED",
      polymarket_expectation_field: expectationRequested
        ? (evidence.polymarket && evidence.polymarket.ok ? "USED" : "UNAVAILABLE")
        : "NOT_REQUIRED",
    },
    boundary: {
      no_fake_causality: true,
      no_trading_signal: true,
      future_not_established_fact: true,
      polymarket_not_bhrigu_prediction: true,
    },
  };
}
