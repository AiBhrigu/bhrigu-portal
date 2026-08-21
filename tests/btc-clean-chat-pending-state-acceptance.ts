import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

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
assert.match(component, /Сбор evidence занял слишком много времени/);
assert.match(component, /Evidence gathering took too long/);

console.log("PASS_BTC_CLEAN_CHAT_PENDING_STATE_TIMEOUT_SEMANTICS");
console.log("MODEL_CALLS=ZERO");
