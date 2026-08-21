import assert from "node:assert/strict";
import fs from "node:fs";

const activeEntryFiles = [
  "pages/index.js",
  "pages/crypto-astro/btc.tsx",
  "components/btc/BtcHeroQuestionLaunch.tsx",
  "components/btc/BtcBinanceCurrentVenue.tsx",
  "components/btc/BtcQuestionMembrane.tsx",
];

for (const path of activeEntryFiles) {
  const source = fs.readFileSync(path, "utf8");
  assert.match(source, /\/crypto-astro\/btc\/clean-chat/, `${path}: Clean Chat route missing`);
  assert.doesNotMatch(source, /\/crypto-astro\/btc\/live/, `${path}: legacy live route leaked into active entry`);
}

const cleanChatPage = fs.readFileSync("pages/crypto-astro/btc/clean-chat.tsx", "utf8");
assert.match(cleanChatPage, /first\(query\.q\)/, "Clean Chat must preserve prepared-question q routing");
assert.match(cleanChatPage, /first\(query\.lang\)/, "Clean Chat must preserve locale routing");
assert.match(cleanChatPage, /first\(query\.d\)/, "Clean Chat must preserve selected-date routing");
assert.match(cleanChatPage, /validObservationDate\(rawDate\)/, "Clean Chat must validate selected dates");
assert.match(cleanChatPage, /Selected date/, "Clean Chat must surface selected-date context in the question");

const llms = fs.readFileSync("public/llms.txt", "utf8");
assert.match(llms, /current Clean Chat dialogue at \/crypto-astro\/btc\/clean-chat/);
assert.match(llms, /legacy \/crypto-astro\/btc\/live route remains noindex for backward compatibility only/);

const btcPage = fs.readFileSync("pages/crypto-astro/btc.tsx", "utf8");
assert.match(btcPage, /Who is Satoshi Nakamoto and when was Bitcoin v0\.1 announced\?/);
assert.match(btcPage, /Кто такой Сатоши Накамото и когда он объявил Bitcoin v0\.1\?/);

console.log("PASS_BTC_CLEAN_CHAT_ACTIVE_LINK_CANONICALIZATION");
console.log("ACTIVE_ENTRY_FILES=5");
console.log("LEGACY_LIVE_PUBLIC_ENTRY_REFS=0");
console.log("LEGACY_LIVE_ROUTE_COMPATIBILITY=RETAINED");
