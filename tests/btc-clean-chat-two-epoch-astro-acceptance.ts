import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { loadBtcAstroField, BTC_TEMPORAL_ORIGIN_UTC } from "../lib/btc-astro-field-client";
import { MAX_SHORT_FINAL_OUTPUT_TOKENS, runBtcCleanChatModel } from "../lib/btc-clean-chat-model-runtime";
import { MARKET_COSMOGRAPHER_EXISTING_GLYPH_CANON_SHA256 } from "../lib/btc-existing-glyph-canon";
import type { BtcCleanAstroContinuity, BtcCleanPriorTurn } from "../lib/btc-clean-chat-v1";

const CURRENT = "2026-08-26T12:00:00.000Z";
const EXPECTED_CANON_SHA = "4034ba35df2d738e7f2cbe1d266fd9a2188aa3972ab629b9cd49f4f05258eb04";
assert.equal(MAX_SHORT_FINAL_OUTPUT_TOKENS, 480);
assert.equal(MARKET_COSMOGRAPHER_EXISTING_GLYPH_CANON_SHA256, EXPECTED_CANON_SHA);

const window = { state: "BOUNDED" as const, start_utc: "2026-05-13T15:23:51Z", peak_utc: "2026-09-03T20:53:33Z", end_utc: "2026-10-14T14:57:06Z" };
const rows = [
  { relation_id: "current:Saturn|genesis:Sun|square", transit_body: "Saturn", genesis_body: "Sun", aspect: "square", target_deg: 90, separation_deg: 90.4565, orb_deg: 0.4565, orb_limit_deg: 3, normalized_closeness: 0.1521, window },
  { relation_id: "current:Mercury|genesis:Pluto|trine", transit_body: "Mercury", genesis_body: "Pluto", aspect: "trine", target_deg: 120, separation_deg: 119.2927, orb_deg: 0.7073, orb_limit_deg: 3, normalized_closeness: 0.2357, window: { ...window, start_utc: "2026-08-24T15:18:40Z", peak_utc: "2026-08-26T03:26:04Z", end_utc: "2026-08-27T15:54:54Z" } },
];

function crossPacket(status: "COMPUTED" | "INSUFFICIENT_EVIDENCE" = "COMPUTED") {
  return {
    schema_version: "bhrigu_public_astro_field_v0_1", ok: true, mode: "cross_timestamp",
    request: { timestamp_utc: CURRENT, reference_timestamp_utc: BTC_TEMPORAL_ORIGIN_UTC, bodies: ["Sun", "Mercury", "Saturn", "Pluto"], phenomena: ["aspects", "positions"] },
    snapshot: { observation_time_utc: CURRENT, bodies: {} },
    reference_snapshot: status === "COMPUTED" ? { observation_time_utc: BTC_TEMPORAL_ORIGIN_UTC, bodies: {} } : null,
    cross_chart: status === "COMPUTED"
      ? { status, relation_count: rows.length, relations: rows }
      : { status, relation_count: 0, relations: [], reason: "REFERENCE_EPOCH_UNAVAILABLE", comparison_rule: "No cross-chart relation is emitted without both canonical public-safe epochs." },
    provenance: { engine_id: "orion_native_swisseph_canonical_v0_1", public_safe_output_only: true },
    boundaries: { prediction: false, market_causality: false, trading: false },
  };
}

function plan(overrides: Record<string, unknown> = {}) {
  return {
    topic: "Astro×BTC", tools: ["astronomy"], polymarket_history: false, focus: "Current sky to Genesis cross-chart",
    request_type: "compare", context_relation: "new", visual_focus: "bridge", astro_bodies: ["sun", "mercury", "saturn", "pluto"],
    astro_phenomena: ["positions", "aspects"], astro_timestamp_utc: CURRENT, time_start: null, time_end: null, bitcoin_event: null,
    astro_relation: "CURRENT_TO_GENESIS", temporal_request: "NONE", answer_max_lines: null, protocol_subject: null, web_reason: null,
    ...overrides,
  };
}

function responsePayload(value: unknown, input = 11, output = 7) {
  return new Response(JSON.stringify({ status: "completed", output_text: JSON.stringify(value), usage: { input_tokens: input, output_tokens: output } }), { status: 200, headers: { "content-type": "application/json" } });
}

type MockOptions = {
  planned: Record<string, unknown>;
  synthesis?: Record<string, unknown>;
  astro?: ReturnType<typeof crossPacket>;
  plannerLimit?: boolean;
  synthesisLimit?: boolean;
};

async function mockedRun(question: string, options: MockOptions, priorTurns: BtcCleanPriorTurn[] = []) {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.OPENAI_API_KEY;
  const originalAstro = process.env.BHRIGU_ASTRO_FIELD_URL;
  const originalVercel = process.env.VERCEL_ENV;
  const calls = { model: 0, astro: 0, modelBodies: [] as Record<string, unknown>[], astroBodies: [] as Record<string, unknown>[] };
  process.env.OPENAI_API_KEY = "static-mock-key";
  process.env.BHRIGU_ASTRO_FIELD_URL = "https://astro.test/api/astro_field";
  process.env.VERCEL_ENV = "preview";
  delete process.env.BTC_RESEARCH_FIELD_MODE;
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" || input instanceof URL ? input.toString() : input.url;
    const body = init?.body ? JSON.parse(String(init.body)) as Record<string, unknown> : {};
    if (url === "https://api.openai.com/v1/responses") {
      calls.model += 1; calls.modelBodies.push(body);
      if (calls.model === 1) {
        if (options.plannerLimit) return new Response(JSON.stringify({ status: "incomplete", incomplete_details: { reason: "max_output_tokens" }, usage: { input_tokens: 13, output_tokens: 360 } }), { status: 200 });
        return responsePayload(options.planned, 13, 9);
      }
      if (options.synthesisLimit) return new Response(JSON.stringify({ status: "incomplete", incomplete_details: { reason: "max_output_tokens" }, usage: { input_tokens: 31, output_tokens: 480 } }), { status: 200 });
      return responsePayload(options.synthesis ?? { answer: "Computed cross-chart relation.", topic: "Astro×BTC" }, 31, 12);
    }
    if (url === "https://astro.test/api/astro_field") {
      calls.astro += 1; calls.astroBodies.push(body);
      return new Response(JSON.stringify(options.astro ?? crossPacket()), { status: 200, headers: { "content-type": "application/json" } });
    }
    throw new Error(`unexpected fetch ${url}`);
  }) as typeof fetch;
  try {
    const result = await runBtcCleanChatModel({ locale: "ru", question, priorTurns });
    return { result, calls };
  } finally {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.OPENAI_API_KEY; else process.env.OPENAI_API_KEY = originalKey;
    if (originalAstro === undefined) delete process.env.BHRIGU_ASTRO_FIELD_URL; else process.env.BHRIGU_ASTRO_FIELD_URL = originalAstro;
    if (originalVercel === undefined) delete process.env.VERCEL_ENV; else process.env.VERCEL_ENV = originalVercel;
  }
}

const continuity: BtcCleanAstroContinuity = {
  semantic_kind: "ASTRO_BTC", astro_relation: "CURRENT_TO_GENESIS", reference_event: "genesis",
  primary_relation_id: rows[0].relation_id,
  primary_relation_signature: { transit_body: "Saturn", genesis_body: "Sun", aspect: "square" }, temporal_window: window,
};

async function runAcceptance() {
  const a0 = await mockedRun("ОКНО", { planned: plan({ tools: [], request_type: "other", visual_focus: "none", astro_relation: "NONE", temporal_request: "NONE" }), synthesis: { answer: "Какое временное окно вы хотите рассмотреть?", topic: "Bitcoin" } });
  assert.equal(a0.calls.astro, 0); assert.equal(a0.result.semantic_visual, null); assert.match(a0.result.answer, /\?/); console.log("A0_CLEAN_WINDOW=PASS");

  const a = await mockedRun("ОКНО", { planned: plan({ context_relation: "follow_up", temporal_request: "ACTIVE_RELATION_WINDOW" }), synthesis: { answer: "Активное окно: 13 мая — 14 октября 2026 UTC.", topic: "Astro×BTC window" } }, [{ user: "Покажи Astro×BTC как матрицу транзитов", assistant: "Матрица рассчитана.", topic: "Astro×BTC", continuity }]);
  assert.equal(a.calls.astro, 1); assert.equal(a.calls.model, 2); assert.equal(a.result.semantic_visual?.native?.primary_relation_id, rows[0].relation_id); assert.doesNotMatch(a.result.answer, /\?/); console.log("A_CONTEXTUAL_WINDOW=PASS");

  const b = await mockedRun("транзиты текущего неба к Genesis", { planned: plan() });
  assert.equal(b.calls.astro, 1); assert.equal(b.calls.astroBodies[0].reference_timestamp_utc, BTC_TEMPORAL_ORIGIN_UTC); assert.equal(b.calls.astroBodies[0].timestamp_utc, CURRENT); assert.equal(b.result.semantic_visual?.native?.type, "CURRENT_TO_GENESIS_MATRIX"); console.log("B_CURRENT_TO_GENESIS=PASS");

  const c = await mockedRun("Покажи Astro×BTC как матрицу транзитов", { planned: plan() });
  assert.equal(c.result.semantic_visual?.native?.rows.length, 2); assert.equal(c.result.semantic_visual?.native?.total_relations, 2); assert.equal(c.result.semantic_visual?.native?.boundary.normalized_closeness_display_order_only, true); console.log("C_NATIVE_MATRIX=PASS");

  const d = await mockedRun("Что здесь самое важное?\nОтвет максимум в 5 строках.", { planned: plan({ context_relation: "follow_up", answer_max_lines: 5 }), synthesis: { answer_lines: ["1. Saturn square Sun — ближайшая строка.", "2. Orb 0.457°.", "3. Окно активно.", "4. Это не причинность.", "5. BTC-прогноз не следует."], topic: "Astro×BTC" } }, [{ user: "матрица", assistant: "готово", topic: "Astro×BTC", continuity }]);
  assert.ok(d.result.answer.split("\n").length <= 5); const synthBody = d.calls.modelBodies[1]; assert.equal(synthBody.max_output_tokens, 480); const format = (synthBody.text as any).format; assert.equal(format.schema.properties.answer_lines.maxItems, 5); console.log("D_FIVE_LINE_CONTRACT=PASS");

  const e = await mockedRun("матрица", { planned: plan(), synthesisLimit: true });
  assert.equal(e.result.completion_state, "VISUAL_ONLY_MODEL_OUTPUT_LIMIT"); assert.equal(e.result.semantic_visual?.native?.status, "COMPUTED"); assert.ok(e.result.sources.length > 0); assert.equal(e.result.usage.input_tokens, 44); assert.equal(e.result.usage.output_tokens, 489); assert.equal(e.calls.model, 2); console.log("E_OUTPUT_LIMIT_SURVIVAL=PASS");

  await assert.rejects(() => mockedRun("матрица", { planned: plan(), plannerLimit: true }), /MODEL_OUTPUT_LIMIT/); console.log("F_PLANNER_LIMIT_FAIL_CLOSED=PASS");

  const g = await mockedRun("матрица", { planned: plan(), astro: crossPacket("INSUFFICIENT_EVIDENCE") });
  assert.equal(g.result.semantic_visual?.native?.status, "INSUFFICIENT_EVIDENCE"); assert.equal(g.result.semantic_visual?.native?.rows.length, 0); console.log("G_REFERENCE_UNAVAILABLE=PASS");

  const matrixSource = fs.readFileSync(path.join(process.cwd(), "ui/btc/BtcAstroCrossChartMatrix.tsx"), "utf8");
  assert.match(matrixSource, /FieldAnchorGlyph/); assert.match(matrixSource, /RelationGlyph/); assert.match(matrixSource, /SealedBoundaryGlyph/); assert.doesNotMatch(matrixSource, /<svg|<path/); console.log("H_GLYPH_CANON_REUSE=PASS");

  const originalFetch = globalThis.fetch; const originalAstro = process.env.BHRIGU_ASTRO_FIELD_URL; const originalVercel = process.env.VERCEL_ENV; let legacyBody: Record<string, unknown> | null = null;
  process.env.BHRIGU_ASTRO_FIELD_URL = "https://astro.test/api/astro_field"; process.env.VERCEL_ENV = "preview";
  globalThis.fetch = (async (_input: RequestInfo | URL, init?: RequestInit) => { legacyBody = JSON.parse(String(init?.body ?? "{}")); return new Response(JSON.stringify({ schema_version: "bhrigu_public_astro_field_v0_1", ok: true, mode: "timestamp", request: legacyBody, snapshot: { observation_time_utc: BTC_TEMPORAL_ORIGIN_UTC, bodies: {} }, provenance: { engine_id: "orion_native_swisseph_canonical_v0_1", public_safe_output_only: true }, boundaries: { prediction: false, market_causality: false, trading: false } }), { status: 200, headers: { "content-type": "application/json" } }); }) as typeof fetch;
  try { await loadBtcAstroField({ bitcoinEvent: "genesis", phenomena: ["positions", "aspects"] }); assert.equal("reference_timestamp_utc" in (legacyBody ?? {}), false); } finally { globalThis.fetch = originalFetch; if (originalAstro === undefined) delete process.env.BHRIGU_ASTRO_FIELD_URL; else process.env.BHRIGU_ASTRO_FIELD_URL = originalAstro; if (originalVercel === undefined) delete process.env.VERCEL_ENV; else process.env.VERCEL_ENV = originalVercel; }
  console.log("I_LEGACY_ASTRO_NO_REFERENCE=PASS");

  console.log("MODEL_CALL_BOUND_NORMAL=2"); console.log("MODEL_CALL_DELTA=ZERO"); console.log("LIVE_OPENAI_CALLS=ZERO");
}

runAcceptance().catch((error) => { console.error(error); process.exitCode = 1; });
