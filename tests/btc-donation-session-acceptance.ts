import assert from "node:assert/strict";
import { generateKeyPairSync } from "node:crypto";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import QRCode from "qrcode";
import {
  BTC_DONATION_SESSION_PREVIEW_BRANCH,
  BTC_DONATION_SESSION_ACTIVATION_PREVIEW_BRANCH,
  buildDonationBip321Uri,
  donationSessionExpiresAt,
  donationSessionStateCopy,
  getDonationSessionRuntimeConfig,
  normalizeDonationSessionId,
} from "../lib/btc-donation-session";
import { BTC_DONATION_BRIDGE_MODE, BTC_DONATION_MODE } from "../lib/btc-donation-bridge";

const SESSION_ONE = "don_session_123e4567-e89b-42d3-a456-426614174000";
const SESSION_TWO = "don_session_123e4567-e89b-42d3-b456-426614174001";
const SESSION_THREE = "don_session_123e4567-e89b-42d3-8456-426614174002";
const ADDRESS_ONE = `bc1q${"q".repeat(37)}p`;
const ADDRESS_TWO = `bc1q${"q".repeat(37)}z`;
const ADDRESS_THREE = `bc1q${"q".repeat(36)}pa`;
const BASE = "2026-08-15T06:00:00.000Z";

async function run() {
  const { publicKey } = generateKeyPairSync("ed25519");
  const publicPem = publicKey.export({ type: "spki", format: "pem" }).toString();
  const enabledEnv = {
    VERCEL_ENV: "preview",
    VERCEL_GIT_COMMIT_REF: BTC_DONATION_SESSION_PREVIEW_BRANCH,
    BTC_DONATION_BRIDGE_MODE,
    DATABASE_URL: "postgres://fixture",
    DONATION_BRIDGE_KEY_ID: "fixture-donation-key",
    DONATION_BRIDGE_VERIFY_PUBLIC_KEY: publicPem,
  };
  const previewConfig = getDonationSessionRuntimeConfig(enabledEnv);
  assert.equal(previewConfig.enabled, true);
  assert.equal(previewConfig.enabled && previewConfig.surface, "preview");
  const activationPreview = getDonationSessionRuntimeConfig({ ...enabledEnv, VERCEL_GIT_COMMIT_REF: BTC_DONATION_SESSION_ACTIVATION_PREVIEW_BRANCH });
  assert.equal(activationPreview.enabled, true);
  assert.equal(activationPreview.enabled && activationPreview.surface, "preview");
  assert.equal(getDonationSessionRuntimeConfig({ ...enabledEnv, VERCEL_ENV: "production" }).enabled, false);
  assert.equal(getDonationSessionRuntimeConfig({ ...enabledEnv, VERCEL_GIT_COMMIT_REF: "master" }).enabled, false);
  assert.equal(getDonationSessionRuntimeConfig({ ...enabledEnv, BTC_DONATION_BRIDGE_MODE: "off" }).enabled, false);
  const productionEnv = { ...enabledEnv, VERCEL_ENV: "production", VERCEL_GIT_COMMIT_REF: "master", BTC_DONATION_MODE };
  const productionConfig = getDonationSessionRuntimeConfig(productionEnv);
  assert.equal(productionConfig.enabled, true);
  assert.equal(productionConfig.enabled && productionConfig.surface, "production");
  for (const key of ["DATABASE_URL", "DONATION_BRIDGE_KEY_ID", "DONATION_BRIDGE_VERIFY_PUBLIC_KEY", "BTC_DONATION_MODE"] as const) {
    assert.equal(getDonationSessionRuntimeConfig({ ...productionEnv, [key]: undefined }).enabled, false, `production must fail closed without ${key}`);
  }
  assert.equal(getDonationSessionRuntimeConfig({ ...productionEnv, BTC_DONATION_BRIDGE_MODE: "off" }).enabled, false);
  assert.equal(getDonationSessionRuntimeConfig({ ...productionEnv, VERCEL_GIT_COMMIT_REF: "not-master" }).enabled, false);

  assert.equal(normalizeDonationSessionId(SESSION_ONE), SESSION_ONE);
  assert.equal(normalizeDonationSessionId("don_session_not-a-uuid"), null);
  assert.equal(buildDonationBip321Uri(ADDRESS_ONE), `bitcoin:${ADDRESS_ONE}`);
  const uri = buildDonationBip321Uri(ADDRESS_ONE);
  assert(!uri.includes("?"));
  assert(!/amount=|label=|message=/i.test(uri));
  assert.equal(donationSessionExpiresAt(new Date(BASE)), "2026-08-15T06:30:00.000Z");
  for (const state of ["awaiting_payment", "mempool_seen", "confirmed", "confirmation_lost", "retired"] as const) {
    assert.ok(donationSessionStateCopy(state).label.length > 0);
  }
  const qr = await QRCode.toDataURL(uri, { width: 128, margin: 1 });
  assert.match(qr, /^data:image\/png;base64,/);
  assert(!qr.includes("http://") && !qr.includes("https://"));

  const bridgeMigration = await readFile("migrations/20260815_btc_donation_bridge_v1.sql", "utf8");
  const sessionMigration = await readFile("migrations/20260815_btc_donation_session_v1.sql", "utf8");
  assert.match(sessionMigration, /REFERENCES btc_donation_receiver_addresses/);
  assert.match(sessionMigration, /receiver_address_id TEXT NOT NULL UNIQUE/);
  assert.match(sessionMigration, /donation_session_state_regression/);
  assert.match(sessionMigration, /awaiting_payment[\s\S]*retired/);

  const db = new PGlite();
  await db.waitReady;
  try {
    await db.exec(bridgeMigration);
    await db.exec(sessionMigration);
    await db.exec(`
      INSERT INTO btc_donation_receiver_addresses(receiver_address_id,receive_address,state,created_at)
      VALUES
        ('addr_session_1','${ADDRESS_ONE}','available','${BASE}'),
        ('addr_session_2','${ADDRESS_TWO}','available','${BASE}'),
        ('addr_session_3','${ADDRESS_THREE}','available','${BASE}');
    `);

    await issueSession(db, SESSION_ONE, "2026-08-15T06:01:00.000Z", "2026-08-15T06:31:00.000Z");
    const first = await sessionAddress(db, SESSION_ONE);
    assert.equal(first, ADDRESS_ONE);
    assert.equal(await addressState(db, ADDRESS_ONE), "issued");

    let duplicateBlocked = false;
    try {
      await issueSession(db, SESSION_ONE, "2026-08-15T06:02:00.000Z", "2026-08-15T06:32:00.000Z");
    } catch { duplicateBlocked = true; }
    assert.equal(duplicateBlocked, true);
    assert.equal(await sessionAddress(db, SESSION_ONE), ADDRESS_ONE);
    assert.equal(await addressState(db, ADDRESS_TWO), "available");

    await issueSession(db, SESSION_TWO, "2026-08-15T06:03:00.000Z", "2026-08-15T06:33:00.000Z");
    assert.equal(await sessionAddress(db, SESSION_TWO), ADDRESS_TWO);
    assert.notEqual(await sessionAddress(db, SESSION_ONE), await sessionAddress(db, SESSION_TWO));

    await retireSession(db, SESSION_ONE, "2026-08-15T06:10:00.000Z");
    assert.equal(await addressState(db, ADDRESS_ONE), "retired");
    assert.equal(await sessionState(db, SESSION_ONE), "retired");
    let addressRegressionBlocked = false;
    try {
      await db.exec(`UPDATE btc_donation_receiver_addresses SET state='available',issued_session_id=NULL,issued_at=NULL,retired_at=NULL WHERE receive_address='${ADDRESS_ONE}'`);
    } catch { addressRegressionBlocked = true; }
    assert.equal(addressRegressionBlocked, true);
    let sessionRegressionBlocked = false;
    try {
      await db.exec(`UPDATE btc_donation_sessions SET session_state='awaiting_payment',retired_at=NULL WHERE session_id='${SESSION_ONE}'`);
    } catch { sessionRegressionBlocked = true; }
    assert.equal(sessionRegressionBlocked, true);

    await issueSession(db, SESSION_THREE, "2026-08-15T06:04:00.000Z", "2026-08-15T06:34:00.000Z");
    assert.equal(await sessionAddress(db, SESSION_THREE), ADDRESS_THREE);
    await db.exec(`
      INSERT INTO btc_donation_receipts(
        receipt_id,receiver_address_id,session_id,txid,tx_vout,observed_sats,confirmations,
        block_height,block_hash,spv_verified,receipt_state,first_seen_at,updated_at
      ) VALUES (
        'receipt_session_3','addr_session_3','${SESSION_THREE}','${"a".repeat(64)}',0,12345,0,
        NULL,NULL,FALSE,'mempool_seen','2026-08-15T06:05:00.000Z','2026-08-15T06:05:00.000Z'
      );
    `);
    assert.equal(await effectiveState(db, SESSION_THREE), "mempool_seen");
    await db.exec(`
      UPDATE btc_donation_receipts SET confirmations=1,block_height=910000,block_hash='${"b".repeat(64)}',
        spv_verified=TRUE,receipt_state='confirmed',updated_at='2026-08-15T06:06:00.000Z'
      WHERE receipt_id='receipt_session_3';
    `);
    assert.equal(await effectiveState(db, SESSION_THREE), "confirmed");
    await db.exec(`
      UPDATE btc_donation_receipts SET confirmations=0,block_height=NULL,block_hash=NULL,
        spv_verified=FALSE,receipt_state='confirmation_lost',updated_at='2026-08-15T06:07:00.000Z'
      WHERE receipt_id='receipt_session_3';
    `);
    assert.equal(await effectiveState(db, SESSION_THREE), "confirmation_lost");

    const beforeReceiptRetire = await sessionState(db, SESSION_THREE);
    await retireSession(db, SESSION_THREE, "2026-08-15T06:08:00.000Z");
    assert.equal(beforeReceiptRetire, "awaiting_payment");
    assert.equal(await sessionState(db, SESSION_THREE), "awaiting_payment");
    assert.equal(await addressState(db, ADDRESS_THREE), "issued");
  } finally {
    await db.close();
  }

  const component = await readFile("components/btc/BtcDonationSessionPreview.jsx", "utf8");
  const support = await readFile("pages/support.js", "utf8");
  const store = await readFile("lib/btc-donation-session-neon.ts", "utf8");
  assert.match(component, /from "qrcode"/);
  assert.match(component, /QRCode\.toDataURL/);
  assert.match(component, /Choose the amount in your wallet/);
  assert.match(component, /no amount, label, or message/);
  assert.match(component, /Synthetic receipt evidence · UI only/);
  assert.match(component, /Support BHRIGU with Bitcoin/);
  assert.match(component, /This is voluntary support for BHRIGU research, architecture, infrastructure, and public continuity\./);
  assert.match(component, /BHRIGU does not present this support as a charitable or tax-deductible contribution\./);
  assert.match(component, /Поддержать BHRIGU в Bitcoin/);
  assert.match(component, /Это добровольная поддержка исследований, архитектуры, инфраструктуры и публичного контура BHRIGU\./);
  assert.match(component, /Автоматический механизм возврата не предоставляется\./);
  assert.match(component, /Copy raw BTC address/);
  assert.match(component, /Копировать обычный BTC-адрес/);
  assert.match(component, /Do not paste the bitcoin: prefix and do not use this BIP321 QR for an exchange withdrawal form/);
  assert.match(component, /Не вставляйте префикс bitcoin: и не используйте этот BIP321 QR для формы вывода биржи/);
  assert.match(component, /navigator\.clipboard\.writeText\(viewSession\.receiveAddress\)/);
  assert.match(component, /QRCode\.toDataURL\(viewSession\.bip321Uri/);
  assert.match(component, /href=\{viewSession\.bip321Uri\}/);
  assert.match(component, /No fresh one-time Bitcoin address is available right now\. No support session was created\./);
  assert.match(component, /Сейчас нет свободного нового одноразового Bitcoin-адреса\. Сессия поддержки не создана\./);
  assert.match(component, /sessionStorage\.getItem\(SESSION_STORAGE_KEY\)/);
  assert.match(component, /sessionStorage\.setItem\(SESSION_STORAGE_KEY, body\.session\.sessionId\)/);
  assert.match(component, /fetch\(`\/api\/donation\/session\/\$\{encodeURIComponent\(storedSessionId\)\}`/);
  assert(!/api\.qrserver|quickchart|chart\.google|qr-code-generator/i.test(component));
  assert(!/bc1[ac-hj-np-z02-9]{20,90}/i.test(component));
  assert.match(support, /donationEnabled \? \(/);
  assert.match(support, /Help keep BHRIGU public\./);
  assert.match(support, /Your support helps keep/);
  assert.match(support, /BTC Field/);
  assert.match(support, /Market Cosmographer/);
  assert.match(component, /10,000 sats/);
  assert.match(component, /25,000 sats/);
  assert.match(component, /50,000 sats/);
  assert.match(component, /100,000 sats/);
  assert.match(component, /Suggestions only — choose any amount in your wallet\. The QR remains amount-free\./);
  assert.match(component, /data-support-amount-binding="none"/);
  assert.match(component, /data-donation-restart/);
  assert.match(component, /data-donation-restart-preview/);
  assert.match(component, /data-active-session-hierarchy="golden-signal-v0-1"/);
  assert.match(component, /data-primary-safety-rail/);
  assert.match(component, /data-qr-core="golden-symmetry-v0-1"/);
  assert.match(component, /data-safety-details/);
  assert.match(component, /<details className="guidance handoff" data-wallet-handoff>/);
  assert.match(component, /Bitcoin mainnet", "One session · one address", "Send exactly once", "Never share seed \/ private keys"/);
  assert.match(component, /Bitcoin mainnet", "Одна сессия · один адрес", "Отправьте ровно один раз", "Не передавайте seed \/ приватные ключи"/);
  assert.match(component, /data-receipt-progress-rail/);
  assert.match(component, /data-confirmed-gratitude/);
  assert.match(component, /Transaction observed/);
  assert.match(component, /Bitcoin confirmation/);
  assert.match(component, /BHRIGU verified/);
  assert.match(component, /Thank you for helping keep BHRIGU public\./);
  assert.match(component, /Спасибо, что помогаете BHRIGU оставаться публичным\./);
  assert.match(component, /The one-time address is retired from further use while BHRIGU waits for Bitcoin confirmation\./);
  assert.match(component, /viewSession\.state === "retired" && !viewSession\.observedSats/);
  assert.match(component, /disabled=\{busy \|\| syntheticMode\}/);
  assert.doesNotMatch(component, /!syntheticMode && viewSession\.state === "retired"/);
  assert.match(component, /onClick=\{startSession\}/);
  assert.match(support, /feature\/btc-support-conversion-atom1-v1/);
  assert.match(support, /feature\/btc-support-conversion-atom2-v1/);
  assert.match(support, /feature\/btc-support-conversion-atom3-v1/);
  assert.match(support, /main\[data-support-surface\] ~ nav\[data-prevnext\]/);
  assert.match(store, /FOR UPDATE SKIP LOCKED/);
  assert.match(store, /state='retired'/);
  assert.match(store, /NOT EXISTS \(SELECT 1 FROM btc_donation_receipts/);

  console.log("BTC_DONATION_SESSION_ACCEPTANCE=PASS");
  console.log("PREVIEW_EXACT_BRANCH_GATE=PASS");
  console.log("PRODUCTION_COMPLETE_GATE=PASS");
  console.log("BIP321_ADDRESS_ONLY=PASS");
  console.log("LOCAL_QR_DATA_URL=PASS");
  console.log("CEX_RAW_ADDRESS_HANDOFF=PASS");
  console.log("BIP321_WALLET_HANDOFF=PASS");
  console.log("ADDRESS_UNAVAILABLE_FAIL_CLOSED_COPY=PASS");
  console.log("ONE_SESSION_ONE_ADDRESS=PASS");
  console.log("IDENTICAL_SESSION_REPLAY_NO_SECOND_ISSUE=PASS");
  console.log("ABANDONED_SESSION_RETIREMENT=PASS");
  console.log("ADDRESS_NO_REUSE_TERMINAL_GUARD=PASS");
  console.log("SYNTHETIC_RECEIPT_STATES=PASS");
  console.log("NO_REAL_BTC=PASS");
}

async function issueSession(db: PGlite, sessionId: string, at: string, expiresAt: string) {
  await db.exec(`
    WITH candidate AS MATERIALIZED (
      SELECT receiver_address_id FROM btc_donation_receiver_addresses
      WHERE state='available' ORDER BY created_at,receiver_address_id FOR UPDATE SKIP LOCKED LIMIT 1
    ), issued AS (
      UPDATE btc_donation_receiver_addresses AS a
      SET state='issued',issued_session_id='${sessionId}',issued_at='${at}'
      FROM candidate WHERE a.receiver_address_id=candidate.receiver_address_id AND a.state='available'
      RETURNING a.receiver_address_id
    )
    INSERT INTO btc_donation_sessions(session_id,receiver_address_id,session_state,created_at,expires_at,retired_at,updated_at)
    SELECT '${sessionId}',issued.receiver_address_id,'awaiting_payment','${at}','${expiresAt}',NULL,'${at}' FROM issued;
  `);
}

async function retireSession(db: PGlite, sessionId: string, at: string) {
  await db.exec(`
    WITH target AS MATERIALIZED (
      SELECT s.session_id,s.receiver_address_id FROM btc_donation_sessions s
      WHERE s.session_id='${sessionId}' AND s.session_state='awaiting_payment'
        AND NOT EXISTS (SELECT 1 FROM btc_donation_receipts r WHERE r.session_id=s.session_id)
      FOR UPDATE
    ), retired_address AS (
      UPDATE btc_donation_receiver_addresses a SET state='retired',retired_at=COALESCE(a.retired_at,'${at}')
      FROM target WHERE a.receiver_address_id=target.receiver_address_id AND a.state='issued'
      RETURNING a.receiver_address_id
    )
    UPDATE btc_donation_sessions s SET session_state='retired',retired_at=COALESCE(s.retired_at,'${at}'),updated_at='${at}'
    FROM target WHERE s.session_id=target.session_id;
  `);
}

async function sessionAddress(db: PGlite, sessionId: string) {
  const q = await db.query<{ receive_address: string }>(`SELECT a.receive_address FROM btc_donation_sessions s JOIN btc_donation_receiver_addresses a ON a.receiver_address_id=s.receiver_address_id WHERE s.session_id='${sessionId}'`);
  return q.rows[0]?.receive_address ?? null;
}
async function addressState(db: PGlite, address: string) {
  const q = await db.query<{ state: string }>(`SELECT state FROM btc_donation_receiver_addresses WHERE receive_address='${address}'`);
  return q.rows[0]?.state ?? null;
}
async function sessionState(db: PGlite, sessionId: string) {
  const q = await db.query<{ session_state: string }>(`SELECT session_state FROM btc_donation_sessions WHERE session_id='${sessionId}'`);
  return q.rows[0]?.session_state ?? null;
}
async function effectiveState(db: PGlite, sessionId: string) {
  const q = await db.query<{ state: string }>(`SELECT COALESCE((SELECT receipt_state FROM btc_donation_receipts r WHERE r.session_id=s.session_id ORDER BY updated_at DESC LIMIT 1),s.session_state) AS state FROM btc_donation_sessions s WHERE s.session_id='${sessionId}'`);
  return q.rows[0]?.state ?? null;
}

run().catch((error) => {
  console.error("BTC_DONATION_SESSION_ACCEPTANCE=FAIL");
  console.error(error instanceof Error ? error.stack ?? error.message : "unknown_error");
  process.exitCode = 1;
});
