import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import {
  BTC_CLEAN_CHAT_BASE_RESERVATION_MICROS,
  BTC_CLEAN_CHAT_GLOBAL_DAY_CAP_MICROS,
  BTC_CLEAN_CHAT_GLOBAL_HOUR_CAP_MICROS,
  BTC_CLEAN_CHAT_GLOBAL_MONTH_CAP_MICROS,
  BTC_CLEAN_CHAT_WEB_RESERVATION_MICROS,
  btcCleanChatGuardKeys,
  getBtcCleanChatGuardConfig,
  newBtcCleanChatGuardClientToken,
  normalizeBtcCleanChatClientIp,
} from "../lib/btc-clean-chat-cost-guard";

const MIGRATION = "migrations/20260830_btc_clean_chat_cost_guard_v1.sql";
const BASE_MS = Date.parse("2026-08-30T00:00:00Z");
const key = (value: string) => createHash("sha256").update(value).digest("hex");
const iso = (ms: number) => new Date(ms).toISOString();

async function setup() {
  const db = new PGlite();
  await db.waitReady;
  await db.exec(await readFile(MIGRATION, "utf8"));
  return db;
}

async function reserve(db: PGlite, n: number, client: string, ip: string, atMs: number) {
  const rows = await db.query<{ disposition: string; retry_after_seconds: number }>(
    `SELECT * FROM btc_clean_chat_guard_reserve('${key(`turn-${n}`)}','${key(client)}','${key(ip)}','${iso(atMs)}',120000)`
  );
  return rows.rows[0]!;
}

async function settle(db: PGlite, n: number, atMs: number, actualMicros: number | null, state: "completed" | "failed" = "completed") {
  const actual = actualMicros === null ? "NULL" : String(actualMicros);
  await db.exec(`SELECT btc_clean_chat_guard_settle('${key(`turn-${n}`)}','${iso(atMs)}',${actual},'${state}')`);
}

async function upgrade(db: PGlite, n: number, atMs: number) {
  const rows = await db.query<{ disposition: string; retry_after_seconds: number }>(
    `SELECT * FROM btc_clean_chat_guard_upgrade('${key(`turn-${n}`)}','${iso(atMs)}',200000)`
  );
  return rows.rows[0]!;
}

async function run() {
  assert.equal(BTC_CLEAN_CHAT_BASE_RESERVATION_MICROS, 120_000);
  assert.equal(BTC_CLEAN_CHAT_WEB_RESERVATION_MICROS, 200_000);
  assert.equal(BTC_CLEAN_CHAT_GLOBAL_HOUR_CAP_MICROS, 250_000);
  assert.equal(BTC_CLEAN_CHAT_GLOBAL_DAY_CAP_MICROS, 750_000);
  assert.equal(BTC_CLEAN_CHAT_GLOBAL_MONTH_CAP_MICROS, 4_000_000);

  assert.deepEqual(getBtcCleanChatGuardConfig({ VERCEL_ENV: "development" }), { required: false, enabled: false });
  assert.deepEqual(getBtcCleanChatGuardConfig({ VERCEL_ENV: "production", BHRIGU_BTC_CLEAN_CHAT_PRODUCTION_ENABLE: "1" }), { required: true, enabled: false });
  const enabled = getBtcCleanChatGuardConfig({
    VERCEL_ENV: "production", BHRIGU_BTC_CLEAN_CHAT_PRODUCTION_ENABLE: "1", BHRIGU_BTC_CLEAN_CHAT_GUARD_MODE: "production",
    BTC_CLEAN_CHAT_ADMISSION_SECRET: "s".repeat(32), BTC_CLEAN_CHAT_GUARD_DATABASE_URL: "postgres://guard",
  });
  assert.equal(enabled.enabled, true);
  assert.equal(enabled.required, true);

  const token = newBtcCleanChatGuardClientToken();
  const keys = btcCleanChatGuardKeys("s".repeat(32), token, "203.0.113.9", "turn:12345678");
  assert.match(keys.clientKey, /^[a-f0-9]{64}$/);
  assert.match(keys.ipKey, /^[a-f0-9]{64}$/);
  assert.match(keys.admissionKey, /^[a-f0-9]{64}$/);
  assert(!keys.clientKey.includes(token));
  assert(!keys.ipKey.includes("203.0.113.9"));
  assert.equal(normalizeBtcCleanChatClientIp("203.0.113.7, 10.0.0.1"), "203.0.113.7");
  assert.equal(normalizeBtcCleanChatClientIp("not-an-ip"), "unavailable");

  const migration = await readFile(MIGRATION, "utf8");
  for (const expected of [
    /v_count >= 6/, /v_count >= 12/, /v_count >= 24/,
    /v_count >= 18/, /v_count >= 48/, /v_count >= 96/,
    /v_count >= 30/, /v_count >= 60/, /v_count >= 150/,
    /v_count >= 1/, /v_count >= 3/,
    /v_cost\+p_reservation_micros > 250000/,
    /v_cost\+p_reservation_micros > 750000/,
    /v_cost\+p_reservation_micros > 4000000/,
    /LOCK TABLE btc_clean_chat_cost_admissions IN SHARE ROW EXCLUSIVE MODE/,
  ]) assert.match(migration, expected);
  assert.doesNotMatch(migration, /raw_ip|raw_user_agent/i);

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
    for (let i = 0; i < 6; i++) {
      assert.equal((await reserve(browserRateDb, 100 + i, "browser-rate", `ip-${i}`, BASE_MS + i * 30_000)).disposition, "admitted");
      await settle(browserRateDb, 100 + i, BASE_MS + i * 30_000 + 1_000, 0);
    }
    assert.equal((await reserve(browserRateDb, 106, "browser-rate", "ip-6", BASE_MS + 6 * 30_000)).disposition, "rate_limited");
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
    assert.equal((await reserve(budgetDb, 400, "budget-a", "budget-ip-a", BASE_MS)).disposition, "admitted");
    await settle(budgetDb, 400, BASE_MS + 1_000, 120_000);
    assert.equal((await reserve(budgetDb, 401, "budget-b", "budget-ip-b", BASE_MS + 2_000)).disposition, "admitted");
    await settle(budgetDb, 401, BASE_MS + 3_000, 120_000);
    assert.equal((await reserve(budgetDb, 402, "budget-c", "budget-ip-c", BASE_MS + 4_000)).disposition, "budget_limited");
  } finally { await budgetDb.close(); }

  const upgradeDb = await setup();
  try {
    assert.equal((await reserve(upgradeDb, 500, "web-a", "web-ip-a", BASE_MS)).disposition, "admitted");
    assert.equal((await upgrade(upgradeDb, 500, BASE_MS + 500)).disposition, "admitted");
    assert.equal((await reserve(upgradeDb, 501, "web-b", "web-ip-b", BASE_MS + 1_000)).disposition, "budget_limited");
    await settle(upgradeDb, 500, BASE_MS + 2_000, 40_000);
    assert.equal((await reserve(upgradeDb, 501, "web-b", "web-ip-b", BASE_MS + 3_000)).disposition, "admitted");
  } finally { await upgradeDb.close(); }

  const api = await readFile("pages/api/btc/clean-chat-v1.ts", "utf8");
  const runtime = await readFile("lib/btc-clean-chat-model-runtime.ts", "utf8");
  assert.match(api, /getBtcCleanChatGuardConfig/);
  assert.match(api, /guardStore\.reserve/);
  assert.match(api, /beforeWebResearch/);
  assert.match(api, /guardStore!\.upgrade/);
  assert.match(api, /guardStore\.settle/);
  assert.match(api, /Retry-After/);
  assert.match(api, /COST_GUARD_UNAVAILABLE/);
  assert.match(api, /COST_GUARD_LIMITED/);
  assert.doesNotMatch(api, /clientKey.*res\.status|ipKey.*res\.status|admissionKey.*res\.status/);
  assert(runtime.indexOf('beforeWebResearch') >= 0);
  assert(runtime.indexOf('beforeWebResearch') < runtime.indexOf('collectEvidence(input.locale'));

  console.log("BTC_CLEAN_CHAT_COST_GUARD_ACCEPTANCE=PASS");
  console.log("PRODUCTION_FAIL_CLOSED_CONFIG=PASS");
  console.log("RAW_IP_STORAGE=ZERO");
  console.log("BROWSER_RATE_LIMIT=PASS");
  console.log("IP_RATE_LIMIT=PASS");
  console.log("GLOBAL_RATE_LIMIT=PASS");
  console.log("CONCURRENCY_LIMIT=PASS");
  console.log("BASE_COST_RESERVATION=PASS");
  console.log("WEB_COST_UPGRADE_BEFORE_EVIDENCE=PASS");
  console.log("GLOBAL_HOUR_DAY_MONTH_BUDGET_CAPS=PASS");
  console.log("REAL_OPENAI_CALLS=ZERO");
}

run().catch((error) => {
  console.error("BTC_CLEAN_CHAT_COST_GUARD_ACCEPTANCE=FAIL");
  console.error(error);
  process.exit(1);
});
