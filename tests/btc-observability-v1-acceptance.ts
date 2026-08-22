import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import {
  normalizeAttribution,
  normalizeObservabilityId,
} from "../lib/btc-observability-contract";
import {
  BTC_OBSERVABILITY_PRICE_POLICY,
  getBtcObservabilityConfig,
  nominalOpenAiCostMicros,
  parseClientObservabilityEvent,
} from "../lib/btc-observability-server";

async function run() {
  assert.equal(normalizeObservabilityId("visit_12345678"), "visit_12345678");
  assert.equal(normalizeObservabilityId("bad id"), null);
  assert.deepEqual(normalizeAttribution({ source: "bitcointalk", medium: "forum", campaign: "btc_private_review" }), {
    source: "bitcointalk", medium: "forum", campaign: "btc_private_review",
  });
  assert.equal(normalizeAttribution({ source: "evil", medium: "tracker", campaign: "Bad Campaign!" }).source, "other");

  const secret = "s".repeat(48);
  const readSecret = "r".repeat(48);
  assert.deepEqual(getBtcObservabilityConfig({ VERCEL_ENV: "production", BHRIGU_BTC_OBSERVABILITY_MODE: "preview", BTC_OBSERVABILITY_DATABASE_URL: "postgres://fixture", BTC_OBSERVABILITY_SECRET: secret, BTC_OBSERVABILITY_READ_SECRET: readSecret }), { enabled: false });
  assert.equal(getBtcObservabilityConfig({ VERCEL_ENV: "preview", BHRIGU_BTC_OBSERVABILITY_MODE: "preview", BTC_OBSERVABILITY_DATABASE_URL: "postgres://fixture", BTC_OBSERVABILITY_SECRET: secret, BTC_OBSERVABILITY_READ_SECRET: readSecret }).enabled, true);
  assert.equal(nominalOpenAiCostMicros(3047, 149, 0), 19705);
  assert.equal(nominalOpenAiCostMicros(0, 0, 1), 10000);
  assert.equal(BTC_OBSERVABILITY_PRICE_POLICY, "openai-gpt-5.6-sol-2026-08-22-v1");

  const clientEvent = parseClientObservabilityEvent({
    eventType: "BTC_SUPPORT_PAGE_REACHED", locale: "ru", surface: "btc_support",
    observability: { visitSessionId: "visit_12345678", source: "bitcointalk", medium: "forum", campaign: "btc_private_review" },
  });
  assert(clientEvent);
  assert.equal(clientEvent.trafficSource, "bitcointalk");
  assert.equal(parseClientObservabilityEvent({ ...clientEvent, eventType: "BTC_CHAT_ANSWER_COMPLETED" }), null);
  assert.equal(parseClientObservabilityEvent({ eventType: "BTC_CHAT_OPENED", locale: "en", surface: "btc_clean_chat", question: "must never enter telemetry", observability: { visitSessionId: "visit_12345678" } }), null);
  assert.equal(parseClientObservabilityEvent({ eventType: "BTC_SUPPORT_SESSION_STARTED", locale: "en", surface: "btc_support", donationSessionId: "session_fake_12345678", observability: { visitSessionId: "visit_12345678" } }), null);
  assert.equal(parseClientObservabilityEvent({ eventType: "BTC_SUPPORT_RECEIPT_OBSERVED", locale: "en", surface: "btc_support", donationSessionId: "session_fake_12345678", observability: { visitSessionId: "visit_12345678" } }), null);

  const migration = await readFile("migrations/20260822_btc_observability_v1.sql", "utf8");
  const db = new PGlite();
  await db.waitReady;
  try {
    await db.exec(migration);
    const columns = await db.query<{ column_name: string }>(`SELECT column_name FROM information_schema.columns WHERE table_name='btc_observability_events' ORDER BY ordinal_position`);
    const names = columns.rows.map((row) => row.column_name);
    for (const forbidden of ["question", "answer", "raw_ip", "ip", "user_agent", "referrer_url", "wallet_address", "cookie_token"]) {
      assert(!names.includes(forbidden), `forbidden telemetry column: ${forbidden}`);
    }
    for (const required of ["anon_browser_key", "visit_session_id", "chat_turn_id", "donation_session_id", "input_tokens", "output_tokens", "nominal_cost_micros", "traffic_source"]) {
      assert(names.includes(required), `missing telemetry column: ${required}`);
    }
    const browser = "a".repeat(64);
    await db.exec(`INSERT INTO btc_observability_events(event_id,event_type,anon_browser_key,visit_session_id,locale,surface,traffic_source,traffic_medium) VALUES ('00000000-0000-4000-8000-000000000001','BTC_CHAT_OPENED','${browser}','visit_12345678','en','btc_clean_chat','direct','direct')`);
    await db.exec(`INSERT INTO btc_observability_events(event_id,event_type,anon_browser_key,visit_session_id,locale,surface,chat_turn_id,traffic_source,traffic_medium) VALUES ('00000000-0000-4000-8000-000000000002','BTC_CHAT_QUESTION_SENT','${browser}','visit_12345678','en','btc_clean_chat','turn_123456789','direct','direct')`);
    await db.exec(`INSERT INTO btc_observability_events(event_id,event_type,anon_browser_key,visit_session_id,locale,surface,chat_turn_id,model,input_tokens,output_tokens,web_search_calls,nominal_cost_micros,price_policy,completion_status,traffic_source,traffic_medium) VALUES ('00000000-0000-4000-8000-000000000003','BTC_CHAT_ANSWER_COMPLETED','${browser}','visit_12345678','en','btc_clean_chat','turn_123456789','gpt-5.6-sol',3047,149,0,19705,'${BTC_OBSERVABILITY_PRICE_POLICY}','completed','direct','direct')`);
    await assert.rejects(db.exec(`INSERT INTO btc_observability_events(event_id,event_type,anon_browser_key,visit_session_id,locale,surface,chat_turn_id,completion_status,traffic_source,traffic_medium) VALUES ('00000000-0000-4000-8000-000000000004','BTC_CHAT_ANSWER_COMPLETED','${browser}','visit_12345678','en','btc_clean_chat','turn_987654321','completed','direct','direct')`));
    const retention = await db.query<{ seconds: number }>(`SELECT EXTRACT(EPOCH FROM (expires_at-occurred_at))::int AS seconds FROM btc_observability_events LIMIT 1`);
    assert.equal(retention.rows[0]?.seconds, 90 * 24 * 60 * 60);
  } finally { await db.close(); }

  const api = await readFile("pages/api/btc/clean-chat-v1.ts", "utf8");
  const eventApi = await readFile("pages/api/btc/observability/v1/event.ts", "utf8");
  const client = await readFile("lib/btc-observability-client.ts", "utf8");
  const donationSessionApi = await readFile("pages/api/donation/session/index.ts", "utf8");
  assert(api.includes("BTC_CHAT_QUESTION_SENT") && api.includes("BTC_CHAT_ANSWER_COMPLETED") && api.includes("BTC_CHAT_ANSWER_FAILED"));
  assert(eventApi.includes("parseClientObservabilityEvent"));
  assert(!client.includes("navigator.userAgent"));
  assert(!client.includes("canvas"));
  assert(donationSessionApi.includes("BTC_SUPPORT_SESSION_STARTED"));
  assert(donationSessionApi.includes("result.session.sessionId"));
  console.log("BTC_OBSERVABILITY_V1_ACCEPTANCE=PASS");
  console.log("HUMANS_CLAIMED=NO");
  console.log("RAW_QUESTION_STORAGE=ZERO");
  console.log("RAW_ANSWER_STORAGE=ZERO");
  console.log("RAW_IP_STORAGE=ZERO");
  console.log("FINGERPRINTING=ZERO");
}

run().catch((error) => { console.error("BTC_OBSERVABILITY_V1_ACCEPTANCE=FAIL"); console.error(error); process.exitCode = 1; });
