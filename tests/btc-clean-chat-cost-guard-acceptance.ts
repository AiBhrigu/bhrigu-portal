import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import {
  BTC_CLEAN_CHAT_BASE_RESERVATION_MICROS,
  BTC_CLEAN_CHAT_INITIAL_RESERVATION_MICROS,
  BTC_CLEAN_CHAT_GLOBAL_DAY_CAP_MICROS,
  BTC_CLEAN_CHAT_GLOBAL_HOUR_CAP_MICROS,
  BTC_CLEAN_CHAT_GLOBAL_MONTH_CAP_MICROS,
  btcCleanChatGuardKeys,
  getBtcCleanChatCapacityMode,
  getBtcCleanChatGuardConfig,
  newBtcCleanChatGuardClientToken,
  normalizeBtcCleanChatClientIp,
} from "../lib/btc-clean-chat-cost-guard";
import { btcCleanChatProviderCallHardCostMicros } from "../lib/btc-clean-chat-model-runtime";
import { btcCleanChatRuntimeFailureCopy } from "../ui/btc/BtcCleanChatV1";

const MIGRATIONS = [
  "migrations/20260830_btc_clean_chat_cost_guard_v1.sql",
  "migrations/20260830_btc_clean_chat_cost_guard_v2.sql",
] as const;
const BASE_MS = Date.parse("2026-08-30T00:00:00Z");
const key = (value: string) => createHash("sha256").update(value).digest("hex");
const iso = (ms: number) => new Date(ms).toISOString();

async function setup() {
  const db = new PGlite();
  await db.waitReady;
  for (const migration of MIGRATIONS) await db.exec(await readFile(migration, "utf8"));
  return db;
}

async function reserve(db: PGlite, n: number, client: string, ip: string, atMs: number, reservationMicros: number = BTC_CLEAN_CHAT_INITIAL_RESERVATION_MICROS) {
  const rows = await db.query<{ disposition: string; retry_after_seconds: number }>(
    `SELECT * FROM btc_clean_chat_guard_reserve_v2('${key(`turn-${n}`)}','${key(client)}','${key(ip)}','${iso(atMs)}',${reservationMicros})`
  );
  return rows.rows[0]!;
}

async function reserveLegacy(db: PGlite, n: number, client: string, ip: string, atMs: number) {
  const rows = await db.query<{ disposition: string; retry_after_seconds: number }>(
    `SELECT * FROM btc_clean_chat_guard_reserve('${key(`turn-${n}`)}','${key(client)}','${key(ip)}','${iso(atMs)}',${BTC_CLEAN_CHAT_BASE_RESERVATION_MICROS})`
  );
  return rows.rows[0]!;
}

async function settle(db: PGlite, n: number, atMs: number, actualMicros: number | null, state: "completed" | "failed" = "completed") {
  const actual = actualMicros === null ? "NULL" : String(actualMicros);
  await db.exec(`SELECT btc_clean_chat_guard_settle('${key(`turn-${n}`)}','${iso(atMs)}',${actual},'${state}')`);
}

async function adjust(db: PGlite, n: number, atMs: number, targetMicros: number) {
  const rows = await db.query<{ disposition: string; retry_after_seconds: number }>(
    `SELECT * FROM btc_clean_chat_guard_adjust('${key(`turn-${n}`)}','${iso(atMs)}',${targetMicros})`
  );
  return rows.rows[0]!;
}

async function run() {
  assert.equal(BTC_CLEAN_CHAT_BASE_RESERVATION_MICROS, 120_000);
  assert.equal(BTC_CLEAN_CHAT_INITIAL_RESERVATION_MICROS, 0);
  assert.equal(BTC_CLEAN_CHAT_GLOBAL_HOUR_CAP_MICROS, 250_000);
  assert.equal(BTC_CLEAN_CHAT_GLOBAL_DAY_CAP_MICROS, 750_000);
  assert.equal(BTC_CLEAN_CHAT_GLOBAL_MONTH_CAP_MICROS, 4_000_000);
  assert.equal(getBtcCleanChatCapacityMode({}), "open");
  assert.equal(getBtcCleanChatCapacityMode({ BHRIGU_BTC_CLEAN_CHAT_CAPACITY_MODE: "hold" }), "hold");
  assert.equal(getBtcCleanChatCapacityMode({ BHRIGU_BTC_CLEAN_CHAT_CAPACITY_MODE: "open" }), "open");
  assert.equal(getBtcCleanChatCapacityMode({ BHRIGU_BTC_CLEAN_CHAT_CAPACITY_MODE: "HOLD" }), "hold");
  assert.equal(getBtcCleanChatCapacityMode({ BHRIGU_BTC_CLEAN_CHAT_CAPACITY_MODE: "unexpected" }), "hold");

  assert.deepEqual(getBtcCleanChatGuardConfig({ VERCEL_ENV: "development" }), { required: false, enabled: false });
  assert.deepEqual(
    getBtcCleanChatGuardConfig({ VERCEL_ENV: "production", BHRIGU_BTC_CLEAN_CHAT_PRODUCTION_ENABLE: "1" }),
    { required: false, enabled: false },
  );
  assert.deepEqual(
    getBtcCleanChatGuardConfig({
      VERCEL_ENV: "production", BHRIGU_BTC_CLEAN_CHAT_PRODUCTION_ENABLE: "1", BHRIGU_BTC_CLEAN_CHAT_GUARD_MODE: "production",
    }),
    { required: true, enabled: false },
  );
  const enabled = getBtcCleanChatGuardConfig({
    VERCEL_ENV: "production", BHRIGU_BTC_CLEAN_CHAT_PRODUCTION_ENABLE: "1", BHRIGU_BTC_CLEAN_CHAT_GUARD_MODE: "production",
    BTC_CLEAN_CHAT_ADMISSION_SECRET: "s".repeat(32), BTC_CLEAN_CHAT_GUARD_DATABASE_URL: "postgres://guard",
  });
  assert.equal(enabled.enabled, true);
  assert.equal(enabled.required, true);

  const normalBound = btcCleanChatProviderCallHardCostMicros({
    model: "gpt-5.6-sol", store: false, instructions: "x".repeat(8_000), input: "y".repeat(16_000), max_output_tokens: 1_200,
  });
  const webBound = btcCleanChatProviderCallHardCostMicros({
    model: "gpt-5.6-sol", store: false, instructions: "x", input: "y", tools: [{ type: "web_search" }], max_tool_calls: 1, max_output_tokens: 360,
  });
  assert(normalBound > 120_000);
  assert(webBound > 10_000);
  assert.throws(() => btcCleanChatProviderCallHardCostMicros({ model: "gpt-5.6-sol", store: false, input: "x", max_output_tokens: 360, max_tool_calls: 2 }), /TOOL_BOUND_INVALID/);
  assert.throws(() => btcCleanChatProviderCallHardCostMicros({ model: "gpt-5.6-sol", store: false, input: "x", tools: [{ type: "web_search" }], max_output_tokens: 360 }), /TOOL_BOUND_REQUIRED/);

  const token = newBtcCleanChatGuardClientToken();
  const keys = btcCleanChatGuardKeys("s".repeat(32), token, "203.0.113.9", "turn:12345678");
  assert.match(keys.clientKey, /^[a-f0-9]{64}$/);
  assert.match(keys.ipKey, /^[a-f0-9]{64}$/);
  assert.match(keys.admissionKey, /^[a-f0-9]{64}$/);
  assert(!keys.clientKey.includes(token));
  assert(!keys.ipKey.includes("203.0.113.9"));
  assert.equal(normalizeBtcCleanChatClientIp("203.0.113.7, 10.0.0.1"), "203.0.113.7");
  assert.equal(normalizeBtcCleanChatClientIp("not-an-ip"), "unavailable");

  const migrationV1 = await readFile(MIGRATIONS[0], "utf8");
  const migrationV2 = await readFile(MIGRATIONS[1], "utf8");
  for (const expected of [
    /btc_clean_chat_guard_reserve_v2/,
    /p_reservation_micros <> 0/,
    /v_count >= 10/, /v_count >= 12/, /v_count >= 24/,
    /v_count >= 18/, /v_count >= 48/, /v_count >= 96/,
    /v_count >= 30/, /v_count >= 60/, /v_count >= 150/,
    /v_count >= 1/, /v_count >= 3/,
    /v_cost\+p_reservation_micros > 250000/,
    /v_cost\+p_reservation_micros > 750000/,
    /v_cost\+p_reservation_micros > 4000000/,
    /LOCK TABLE btc_clean_chat_cost_admissions IN SHARE ROW EXCLUSIVE MODE/,
    /btc_clean_chat_guard_adjust/,
  ]) assert.match(migrationV2, expected);
  for (const expected of [/settled_micros <= reservation_micros/, /settlement_exceeds_reservation/]) assert.match(migrationV1, expected);
  assert.match(migrationV1, /v_count >= 6/);
  assert.doesNotMatch(migrationV2, /CREATE TABLE|btc_clean_chat_guard_upgrade|btc_clean_chat_guard_settle/);
  assert.doesNotMatch(`${migrationV1}\n${migrationV2}`, /raw_ip|raw_user_agent/i);

  const replayDb = await setup();
  try {
    assert.equal((await reserve(replayDb, 1, "client-a", "ip-a", BASE_MS)).disposition, "admitted");
    assert.equal((await reserve(replayDb, 1, "client-a", "ip-a", BASE_MS + 1_000)).disposition, "replay");
  } finally { await replayDb.close(); }

  const concurrencyDb = await setup();
  try {
    assert.equal((await reserve(concurrencyDb, 10, "same-client", "ip-a", BASE_MS)).disposition, "admitted");
    assert.equal((await reserve(concurrencyDb, 11, "same-client", "ip-b", BASE_MS + 1_000)).disposition, "concurrency_limited");
    await settle(concurrencyDb, 10, BASE_MS + 2_000, 0);
    assert.equal((await reserve(concurrencyDb, 11, "same-client", "ip-b", BASE_MS + 3_000)).disposition, "admitted");
  } finally { await concurrencyDb.close(); }

  const browserRateDb = await setup();
  try {
    for (let i = 0; i < 10; i++) {
      assert.equal((await reserve(browserRateDb, 100 + i, "browser-rate", `ip-${i}`, BASE_MS + i * 30_000)).disposition, "admitted");
      await settle(browserRateDb, 100 + i, BASE_MS + i * 30_000 + 1_000, 0);
    }
    assert.equal((await reserve(browserRateDb, 110, "browser-rate", "ip-10", BASE_MS + 10 * 30_000)).disposition, "rate_limited");
  } finally { await browserRateDb.close(); }

  const ipRateDb = await setup();
  try {
    for (let i = 0; i < 18; i++) {
      assert.equal((await reserve(ipRateDb, 200 + i, `client-${i}`, "shared-ip", BASE_MS + i * 20_000)).disposition, "admitted");
      await settle(ipRateDb, 200 + i, BASE_MS + i * 20_000 + 500, 0);
    }
    assert.equal((await reserve(ipRateDb, 218, "client-18", "shared-ip", BASE_MS + 18 * 20_000)).disposition, "rate_limited");
  } finally { await ipRateDb.close(); }

  const globalRateDb = await setup();
  try {
    for (let i = 0; i < 30; i++) {
      assert.equal((await reserve(globalRateDb, 300 + i, `global-client-${i}`, `global-ip-${i}`, BASE_MS + i * 10_000)).disposition, "admitted");
      await settle(globalRateDb, 300 + i, BASE_MS + i * 10_000 + 500, 0);
    }
    assert.equal((await reserve(globalRateDb, 330, "global-client-30", "global-ip-30", BASE_MS + 300_000)).disposition, "rate_limited");
  } finally { await globalRateDb.close(); }

  const budgetDb = await setup();
  try {
    for (const n of [400, 401]) {
      assert.equal((await reserve(budgetDb, n, `budget-${n}`, `budget-ip-${n}`, BASE_MS + (n - 400) * 2_000)).disposition, "admitted");
      assert.equal((await adjust(budgetDb, n, BASE_MS + (n - 400) * 2_000 + 500, 120_000)).disposition, "admitted");
      await settle(budgetDb, n, BASE_MS + (n - 400) * 2_000 + 1_000, 120_000);
    }
    assert.equal((await reserve(budgetDb, 402, "budget-402", "budget-ip-402", BASE_MS + 4_000)).disposition, "admitted");
    assert.equal((await adjust(budgetDb, 402, BASE_MS + 4_500, 120_000)).disposition, "budget_limited");
    await settle(budgetDb, 402, BASE_MS + 5_000, 0, "failed");
  } finally { await budgetDb.close(); }

  const adjustDb = await setup();
  try {
    assert.equal((await reserve(adjustDb, 500, "web-a", "web-ip-a", BASE_MS)).disposition, "admitted");
    assert.equal((await adjust(adjustDb, 500, BASE_MS + 500, 145_000)).disposition, "admitted");
    assert.equal((await adjust(adjustDb, 500, BASE_MS + 700, 40_000)).disposition, "admitted");
    assert.equal((await adjust(adjustDb, 500, BASE_MS + 900, 200_000)).disposition, "admitted");
    assert.equal((await adjust(adjustDb, 500, BASE_MS + 1_100, 260_000)).disposition, "budget_limited");
    await settle(adjustDb, 500, BASE_MS + 1_300, 40_000);
  } finally { await adjustDb.close(); }

  const settlementBoundDb = await setup();
  try {
    assert.equal((await reserve(settlementBoundDb, 600, "settle-a", "settle-ip-a", BASE_MS)).disposition, "admitted");
    assert.equal((await adjust(settlementBoundDb, 600, BASE_MS + 500, 120_000)).disposition, "admitted");
    await assert.rejects(() => settle(settlementBoundDb, 600, BASE_MS + 1_000, 120_001), /settlement_exceeds_reservation/);
    await settle(settlementBoundDb, 600, BASE_MS + 2_000, 120_000);
  } finally { await settlementBoundDb.close(); }

  const legacyRolloutDb = await setup();
  try {
    assert.equal((await reserveLegacy(legacyRolloutDb, 650, "legacy", "legacy-ip", BASE_MS)).disposition, "admitted");
    await settle(legacyRolloutDb, 650, BASE_MS + 1_000, 0);
  } finally { await legacyRolloutDb.close(); }

  const longSessionDb = await setup();
  try {
    for (let i = 0; i < 10; i++) {
      const n = 700 + i;
      const at = BASE_MS + i * 30_000;
      assert.equal((await reserve(longSessionDb, n, "human-dialogue", `human-ip-${i}`, at)).disposition, "admitted");
      assert.equal((await adjust(longSessionDb, n, at + 100, 80_000)).disposition, "admitted");
      assert.equal((await adjust(longSessionDb, n, at + 200, 5_000)).disposition, "admitted");
      assert.equal((await adjust(longSessionDb, n, at + 300, 95_000)).disposition, "admitted");
      assert.equal((await adjust(longSessionDb, n, at + 400, 10_000)).disposition, "admitted");
      await settle(longSessionDb, n, at + 500, 10_000);
    }
    assert.equal((await reserve(longSessionDb, 710, "human-dialogue", "human-ip-10", BASE_MS + 300_000)).disposition, "rate_limited");
  } finally { await longSessionDb.close(); }

  const api = await readFile("pages/api/btc/clean-chat-v1.ts", "utf8");
  const runtime = await readFile("lib/btc-clean-chat-model-runtime.ts", "utf8");
  assert.match(api, /getBtcCleanChatCapacityMode/);
  assert.match(api, /MODEL_CAPACITY_HOLD/);
  assert(api.indexOf('getBtcCleanChatCapacityMode() === "hold"') < api.indexOf('guardStore.reserve'));
  assert(api.indexOf('getBtcCleanChatCapacityMode() === "hold"') < api.indexOf('const result = await runBtcCleanChatModel'));
  assert.match(api, /getBtcCleanChatGuardConfig/);
  assert.match(api, /guardStore\.reserveV2/);
  assert.match(api, /reservationMicros: BTC_CLEAN_CHAT_INITIAL_RESERVATION_MICROS/);
  assert.match(api, /beforeProviderCall/);
  assert.match(api, /afterProviderCall/);
  assert.match(api, /guardActualSpentMicros/);
  assert.match(api, /guardStore!\.adjust/);
  assert.match(api, /BTC_CLEAN_CHAT_COST_GUARD_USAGE_ACCOUNTING_MISMATCH/);
  assert.match(api, /guardStore\.settle/);
  assert.match(api, /Retry-After/);
  assert.match(api, /COST_GUARD_UNAVAILABLE/);
  assert.match(api, /COST_GUARD_RATE_LIMITED/);
  assert.match(api, /COST_GUARD_CONCURRENCY_LIMITED/);
  assert.match(api, /COST_GUARD_BUDGET_LIMITED/);
  assert.match(api, /BTC_CLEAN_CHAT_COST_GUARD_LIMIT_DECISION/);
  assert.doesNotMatch(api, /clientKey.*res\.status|ipKey.*res\.status|admissionKey.*res\.status/);
  assert(runtime.indexOf('beforeProviderCall') >= 0);
  assert(runtime.indexOf('beforeProviderCall') < runtime.indexOf('fetch(transport.endpoint'));
  assert(runtime.indexOf('afterProviderCall') > runtime.indexOf('fetch(transport.endpoint'));
  assert.match(runtime, /max_tool_calls: 1/);
  assert.match(runtime, /Buffer\.byteLength\(serialized, \"utf8\"\)/);
  assert.match(btcCleanChatRuntimeFailureCopy("ru", "MODEL_CAPACITY_HOLD", false), /ёмкость Cosmographer/);
  assert.match(btcCleanChatRuntimeFailureCopy("ru", "COST_GUARD_RATE_LIMITED", true), /Слишком много запросов/);
  assert.match(btcCleanChatRuntimeFailureCopy("ru", "COST_GUARD_CONCURRENCY_LIMITED", true), /Предыдущий запрос/);
  assert.match(btcCleanChatRuntimeFailureCopy("ru", "COST_GUARD_BUDGET_LIMITED", true), /бюджетный предел/);
  assert.match(btcCleanChatRuntimeFailureCopy("ru", "COST_GUARD_REPLAY", false), /уже был принят/);
  assert.match(btcCleanChatRuntimeFailureCopy("ru", "COST_GUARD_UNAVAILABLE", true), /Защитный контур/);

  console.log("BTC_CLEAN_CHAT_COST_GUARD_ACCEPTANCE=PASS");
  console.log("PRODUCTION_FAIL_CLOSED_CONFIG=PASS");
  console.log("RAW_IP_STORAGE=ZERO");
  console.log("BROWSER_RATE_LIMIT=PASS");
  console.log("IP_RATE_LIMIT=PASS");
  console.log("GLOBAL_RATE_LIMIT=PASS");
  console.log("CONCURRENCY_LIMIT=PASS");
  console.log("ZERO_COST_TURN_ADMISSION=PASS");
  console.log("STAGE_AWARE_PROVIDER_HARD_COST_RESERVATION=PASS");
  console.log("LONG_SESSION_10_TURN_FALSE_POSITIVE_REPAIR=PASS");
  console.log("CAPACITY_HOLD_ZERO_PROVIDER_CONTRACT=PASS");
  console.log("REASON_SPECIFIC_GUARD_UX=PASS");
  console.log("WEB_MAX_TOOL_CALLS_ONE=PASS");
  console.log("SETTLEMENT_LE_RESERVATION=PASS");
  console.log("MERGE_SAFE_ACTIVATION_ORDER=PASS");
  console.log("GLOBAL_HOUR_DAY_MONTH_BUDGET_CAPS=PASS");
  console.log("REAL_OPENAI_CALLS=ZERO");
}

run().catch((error) => {
  console.error("BTC_CLEAN_CHAT_COST_GUARD_ACCEPTANCE=FAIL");
  console.error(error);
  process.exit(1);
});
