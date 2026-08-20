import assert from "node:assert/strict";
import { runBtcCleanChatModel, BTC_CLEAN_CHAT_MODEL_ID } from "../lib/btc-clean-chat-model-runtime";

const branch = process.env.VERCEL_GIT_COMMIT_REF ?? "";
const isTarget = process.env.VERCEL_ENV === "preview" && branch === "feature/btc-clean-chat-v1-wow-preview";
if (!isTarget) {
  console.log("BTC_CLEAN_CHAT_MODEL_SMOKE=SKIP_NON_TARGET");
  process.exit(0);
}

try {
  const result = await runBtcCleanChatModel({
    locale: "en",
    question: "Is BTC gaining or losing momentum today?",
    priorTurns: [],
  });
  assert.equal(result.ok, true);
  assert.ok(result.answer.length > 40);
  assert.equal(result.boundary.no_trading_signal, true);
  console.log("BTC_CLEAN_CHAT_MODEL_SMOKE=PASS");
  console.log(`MODEL=${BTC_CLEAN_CHAT_MODEL_ID}`);
  console.log(`ANSWER_CHARS=${result.answer.length}`);
} catch (error) {
  console.error("BTC_CLEAN_CHAT_MODEL_SMOKE=FAIL");
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
