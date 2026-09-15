import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import QRCode from "qrcode";
import {
  BTC_SUPPORT_STABLE_FALLBACK_ADDRESS,
  BTC_SUPPORT_STABLE_FALLBACK_URI,
} from "../lib/btc-support-stable-fallback";

async function run() {
  const component = await readFile("components/btc/BtcDonationSessionPreview.jsx", "utf8");
  const helper = await readFile("lib/btc-support-stable-fallback.ts", "utf8");

  assert.equal(BTC_SUPPORT_STABLE_FALLBACK_ADDRESS, "bc1qg84nvvjff86xyxd4m4y6mynwrskzt5auuvlpu4");
  assert.equal(BTC_SUPPORT_STABLE_FALLBACK_URI, `bitcoin:${BTC_SUPPORT_STABLE_FALLBACK_ADDRESS}`);
  assert.match(helper, /bc1qg84nvvjff86xyxd4m4y6mynwrskzt5auuvlpu4/);

  assert.match(component, /body\?\.errorCode === "address_unavailable"/);
  assert.match(component, /setStableFallbackActive\(true\)/);
  assert.match(component, /QRCode\.toDataURL\(BTC_SUPPORT_STABLE_FALLBACK_URI/);
  assert.match(component, /data-qr-payload=\{BTC_SUPPORT_STABLE_FALLBACK_URI\}/);
  assert.match(component, /data-stable-fallback-address/);
  assert.match(component, /navigator\.clipboard\.writeText\(BTC_SUPPORT_STABLE_FALLBACK_ADDRESS\)/);
  assert.match(component, /data-stable-fallback-copy/);
  assert.match(component, /\{stableFallbackActive && \(/);
  assert.match(component, /\{viewSession && !stableFallbackActive && \(/);
  assert.match(component, /Fresh one-time addresses are temporarily unavailable/);
  assert.match(component, /Свежие одноразовые адреса временно недоступны/);

  // The existing one-time path remains separately bound to the session response.
  assert.match(component, /QRCode\.toDataURL\(viewSession\.bip321Uri/);
  assert.match(component, /navigator\.clipboard\.writeText\(viewSession\.receiveAddress\)/);
  assert.match(component, /sessionStorage\.setItem\(SESSION_STORAGE_KEY, body\.session\.sessionId\)/);

  const qr = await QRCode.toBuffer(BTC_SUPPORT_STABLE_FALLBACK_URI, {
    errorCorrectionLevel: "M",
    margin: 2,
    width: 288,
  });
  assert.ok(qr.length > 0);

  console.log("BTC_SUPPORT_STABLE_FALLBACK_ACCEPTANCE=PASS");
  console.log("FALLBACK_ADDRESS_EXACT=PASS");
  console.log("FALLBACK_BIP321_EXACT=PASS");
  console.log("FALLBACK_LOCAL_QR=PASS");
  console.log("FALLBACK_RAW_COPY_EXACT=PASS");
  console.log("FRESH_ONE_TIME_PATH_PRESERVED=PASS");
  console.log("RETIRED_RESTART_FALLBACK_PRECEDENCE=PASS");
  console.log("RU_EN_COPY=PASS");
}

run().catch((error) => {
  console.error("BTC_SUPPORT_STABLE_FALLBACK_ACCEPTANCE=FAIL");
  console.error(error instanceof Error ? error.stack ?? error.message : "unknown_error");
  process.exitCode = 1;
});
