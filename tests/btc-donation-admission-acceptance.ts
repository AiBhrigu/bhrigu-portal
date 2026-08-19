import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import {
  BTC_DONATION_ADMISSION_COOKIE,
  donationAdmissionCookie,
  donationAdmissionKeys,
  getDonationAdmissionConfig,
  newDonationAdmissionClientToken,
  normalizeDonationAdmissionClientToken,
  normalizeVercelClientIp,
} from "../lib/btc-donation-session-admission";

const BRIDGE = "migrations/20260815_btc_donation_bridge_v1.sql";
const SESSION = "migrations/20260815_btc_donation_session_v1.sql";
const ADMISSION = "migrations/20260819_btc_donation_session_admission_v1.sql";
const BASE_MS = Date.parse("2026-08-19T00:00:00Z");

function sid(n: number) {
  const tail = n.toString(16).padStart(12, "0");
  return `don_session_123e4567-e89b-42d3-a456-${tail}`;
}
function key(value: string) { return createHash("sha256").update(value).digest("hex"); }
function iso(ms: number) { return new Date(ms).toISOString(); }

async function setup(addresses = 40) {
  const db = new PGlite(); await db.waitReady;
  for (const file of [BRIDGE, SESSION, ADMISSION]) await db.exec(await readFile(file, "utf8"));
  for (let i = 0; i < addresses; i++) {
    await db.exec(`INSERT INTO btc_donation_receiver_addresses(receiver_address_id,receive_address,state,created_at)
      VALUES ('admission_addr_${i}','bc1q${"q".repeat(32)}${i.toString().padStart(6, "0")}','available','${iso(BASE_MS + i * 1000)}')`);
  }
  return db;
}

async function issue(db: PGlite, n: number, clientKey: string, ipKey: string, atMs: number) {
  const expires = iso(atMs + 30 * 60 * 1000);
  const q = await db.query<{ disposition: string; retry_after_seconds: number }>(
    `SELECT * FROM btc_donation_issue_session_admitted('${sid(n)}','${clientKey}','${ipKey}','${iso(atMs)}','${expires}')`
  );
  return q.rows[0]!;
}

async function countAdmissions(db: PGlite) {
  const q = await db.query<{ n: number }>("SELECT COUNT(*)::int AS n FROM btc_donation_session_admissions");
  return q.rows[0]?.n ?? -1;
}

async function run() {
  assert.equal(getDonationAdmissionConfig({}).enabled, false);
  assert.equal(getDonationAdmissionConfig({ BTC_DONATION_ADMISSION_SECRET: "x".repeat(31) }).enabled, false);
  assert.equal(getDonationAdmissionConfig({ BTC_DONATION_ADMISSION_SECRET: "x".repeat(32) }).enabled, true);
  const token = newDonationAdmissionClientToken();
  assert.equal(normalizeDonationAdmissionClientToken(token), token);
  assert.equal(normalizeDonationAdmissionClientToken("bad"), null);
  assert.equal(normalizeVercelClientIp("203.0.113.7"), "203.0.113.7");
  assert.equal(normalizeVercelClientIp("203.0.113.7, 10.0.0.1"), "203.0.113.7");
  assert.equal(normalizeVercelClientIp("not-an-ip"), "unavailable");
  const keys = donationAdmissionKeys("s".repeat(32), token, "203.0.113.7");
  assert.match(keys.clientKey, /^[a-f0-9]{64}$/); assert.match(keys.ipKey, /^[a-f0-9]{64}$/);
  assert.notEqual(keys.clientKey, keys.ipKey); assert(!keys.clientKey.includes(token)); assert(!keys.ipKey.includes("203.0.113.7"));
  const cookie = donationAdmissionCookie(token);
  assert.match(cookie, new RegExp(`^${BTC_DONATION_ADMISSION_COOKIE}=`));
  assert.match(cookie, /HttpOnly/); assert.match(cookie, /Secure/); assert.match(cookie, /SameSite=Lax/);

  const migration = await readFile(ADMISSION, "utf8");
  assert.match(migration, /LOCK TABLE btc_donation_session_admissions IN SHARE ROW EXCLUSIVE MODE/);
  assert.match(migration, /v_count >= 2/); assert.match(migration, /v_count >= 6/);
  assert.match(migration, /v_count >= 16/); assert.match(migration, /v_count >= 12/); assert.match(migration, /v_count >= 24/);
  assert.match(migration, /address_unavailable/); assert.match(migration, /RETURN NEXT; RETURN;/);

  const browserDb = await setup(10);
  try {
    assert.equal((await issue(browserDb, 1, key("a"), key("b"), BASE_MS)).disposition, "issued");
    assert.equal((await issue(browserDb, 2, key("a"), key("b"), BASE_MS + 60_000)).disposition, "issued");
    const limited = await issue(browserDb, 3, key("a"), key("b"), BASE_MS + 120_000);
    assert.equal(limited.disposition, "rate_limited"); assert.equal(limited.retry_after_seconds, 1680);
    assert.equal((await issue(browserDb, 1, key("a"), key("b"), BASE_MS + 180_000)).disposition, "replay");
    assert.equal(await countAdmissions(browserDb), 2);
  } finally { await browserDb.close(); }

  const browserDayDb = await setup(10);
  try {
    for (let i = 0; i < 6; i++) assert.equal((await issue(browserDayDb, 20 + i, key("c"), key("d"), BASE_MS + i * 31 * 60_000)).disposition, "issued");
    assert.equal((await issue(browserDayDb, 26, key("c"), key("d"), BASE_MS + 6 * 31 * 60_000)).disposition, "rate_limited");
  } finally { await browserDayDb.close(); }

  const ipDb = await setup(20);
  try {
    for (let i = 0; i < 6; i++) assert.equal((await issue(ipDb, 40 + i, key(String.fromCharCode(101 + i)), key("e"), BASE_MS + i * 60_000)).disposition, "issued");
    assert.equal((await issue(ipDb, 46, key("k"), key("e"), BASE_MS + 6 * 60_000)).disposition, "rate_limited");
  } finally { await ipDb.close(); }

  const globalDb = await setup(20);
  try {
    for (let i = 0; i < 12; i++) assert.equal((await issue(globalDb, 60 + i, key(`global-hour-client-${i}`), key(`global-hour-ip-${i}`), BASE_MS + i * 60_000)).disposition, "issued");
    assert.equal((await issue(globalDb, 72, key("global-hour-client-12"), key("global-hour-ip-12"), BASE_MS + 12 * 60_000)).disposition, "rate_limited");
  } finally { await globalDb.close(); }

  const ipDayDb = await setup(24);
  try {
    for (let i = 0; i < 16; i++) assert.equal((await issue(ipDayDb, 90 + i, key(`ip-day-client-${i}`), key("ip-day-shared"), BASE_MS + i * 70 * 60_000)).disposition, "issued");
    assert.equal((await issue(ipDayDb, 106, key("ip-day-client-16"), key("ip-day-shared"), BASE_MS + 16 * 70 * 60_000)).disposition, "rate_limited");
  } finally { await ipDayDb.close(); }

  const globalDayDb = await setup(30);
  try {
    for (let i = 0; i < 24; i++) assert.equal((await issue(globalDayDb, 120 + i, key(`global-day-client-${i}`), key(`global-day-ip-${i}`), BASE_MS + i * 59 * 60_000)).disposition, "issued");
    assert.equal((await issue(globalDayDb, 144, key("global-day-client-24"), key("global-day-ip-24"), BASE_MS + 24 * 59 * 60_000)).disposition, "rate_limited");
  } finally { await globalDayDb.close(); }

  const emptyDb = await setup(0);
  try {
    assert.equal((await issue(emptyDb, 80, key("a"), key("b"), BASE_MS)).disposition, "address_unavailable");
    assert.equal(await countAdmissions(emptyDb), 0);
  } finally { await emptyDb.close(); }

  const api = await readFile("pages/api/donation/session/index.ts", "utf8");
  const store = await readFile("lib/btc-donation-session-neon.ts", "utf8");
  const component = await readFile("components/btc/BtcDonationSessionPreview.jsx", "utf8");
  assert.match(api, /BTC_DONATION_ADMISSION_COOKIE/); assert.match(api, /x-forwarded-for/);
  assert.match(api, /issueSessionAdmitted/); assert.match(api, /status\(429\)/); assert.match(api, /Retry-After/);
  assert.doesNotMatch(api, /console\.log|clientKey.*json|ipKey.*json/);
  assert.match(store, /btc_donation_issue_session_admitted/); assert.doesNotMatch(store, /async function issueSession\(/);
  assert.match(component, /session_rate_limited/); assert.match(component, /Fresh Bitcoin session creation is temporarily limited for safety/);
  assert.match(component, /Создание новых Bitcoin-сессий временно ограничено/);

  console.log("BTC_DONATION_ADMISSION_ACCEPTANCE=PASS");
  console.log("SAME_SESSION_REPLAY_NO_LIMIT_CONSUMPTION=PASS");
  console.log("BROWSER_2_PER_30M=PASS");
  console.log("BROWSER_6_PER_24H=PASS");
  console.log("IP_6_PER_30M=PASS");
  console.log("IP_16_PER_24H=PASS");
  console.log("GLOBAL_12_PER_1H=PASS");
  console.log("GLOBAL_24_PER_24H=PASS");
  console.log("ADDRESS_UNAVAILABLE_NO_ADMISSION_CONSUMPTION=PASS");
  console.log("RAW_IP_STORAGE=ZERO");
}

run().catch((error) => { console.error("BTC_DONATION_ADMISSION_ACCEPTANCE=FAIL"); console.error(error); process.exit(1); });
