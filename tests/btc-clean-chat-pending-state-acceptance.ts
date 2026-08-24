import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { btcCleanChatRuntimeFailureCopy } from "../ui/btc/BtcCleanChatV1";

const component = fs.readFileSync(path.resolve(process.cwd(), "ui/btc/BtcCleanChatV1.tsx"), "utf8");

assert.match(component, /CLIENT_RUNTIME_TIMEOUT_MS = 180_000/);
assert.match(component, /const controller = new AbortController\(\)/);
assert.match(component, /window\.setTimeout\(\(\) => controller\.abort\(\), CLIENT_RUNTIME_TIMEOUT_MS\)/);
assert.match(component, /signal: controller\.signal/);
assert.match(component, /window\.clearTimeout\(timeout\)/);
assert.match(component, /error instanceof DOMException && error\.name === "AbortError"/);
assert.match(component, /data-pending-state="evidence"/);
assert.match(component, /role="status" aria-live="polite"/);
assert.match(component, /Собираю evidence…/);
assert.match(component, /Gathering evidence…/);
assert.match(component, /cleanThinkingDots" aria-hidden="true"/);
assert.match(component, /grid-template-columns:152px minmax\(0,1fr\)/);
assert.doesNotMatch(component, /className="cleanThinking"/);
assert.match(component, /btcCleanChatRuntimeFailureCopy/);
assert.doesNotMatch(component, /попробуйте повторить вопрос|please try the question again/i);
assert.match(component, /Сервис временно недоступен\. Попробуйте позже\./);
assert.match(component, /The service is temporarily unavailable\. Please try later\./);

const realUserFailurePressureFixtures = [
  "Я торгую Дневные свечи и Американскую сессию я нахожусь в Москве какой план",
  "Сделай в точках, пунктирах",
  "Сделай в точках, пунктирах схему ты умеешь",
];
for (const fixture of realUserFailurePressureFixtures) {
  const nonRetryableRu = btcCleanChatRuntimeFailureCopy("ru", "MODEL_OUTPUT_LIMIT", false);
  const nonRetryableEn = btcCleanChatRuntimeFailureCopy("en", "MODEL_RESPONSE_INVALID", false);
  assert.doesNotMatch(nonRetryableRu, /попробуйте повторить|попробуйте позже/i, fixture);
  assert.doesNotMatch(nonRetryableEn, /try again|try later/i, fixture);
}
assert.equal(btcCleanChatRuntimeFailureCopy("ru", "MODEL_PROVIDER_TRANSIENT", true), "Сервис временно недоступен. Попробуйте позже.");
assert.equal(btcCleanChatRuntimeFailureCopy("en", "MODEL_TIMEOUT", true), "The service is temporarily unavailable. Please try later.");

console.log("PASS_BTC_CLEAN_CHAT_PENDING_STATE_ZERO_WASTE_FAILURE_SEMANTICS");
console.log("MODEL_CALLS=ZERO");
