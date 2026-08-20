import assert from "node:assert/strict";

async function main() {
  const branch = process.env.VERCEL_GIT_COMMIT_REF ?? "";
  const isTarget = process.env.VERCEL_ENV === "preview" && branch === "feature/btc-clean-chat-v1-wow-preview";
  if (!isTarget) {
    console.log("BTC_CLEAN_CHAT_DIRECT_OPENAI_SMOKE=SKIP_NON_TARGET");
    return;
  }
  const key = process.env.OPENAI_API_KEY;
  assert.ok(key, "OPENAI_API_KEY_MISSING");
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { "Authorization": `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-5.6-sol",
      input: "Reply with exactly DIRECT_OPENAI_OK",
      max_output_tokens: 40,
      reasoning: { effort: "low" },
    }),
  });
  const body = await response.text();
  if (!response.ok) throw new Error(`OPENAI_${response.status} ${body}`);
  const parsed = JSON.parse(body);
  const text = (parsed.output ?? []).flatMap((item: any) => item.content ?? []).map((c: any) => c.text ?? "").join("").trim();
  assert.ok(text.includes("DIRECT_OPENAI_OK"), `UNEXPECTED_OUTPUT ${text}`);
  console.log("BTC_CLEAN_CHAT_DIRECT_OPENAI_SMOKE=PASS");
  console.log(`MODEL=${parsed.model ?? "gpt-5.6-sol"}`);
  console.log(`INPUT_TOKENS=${parsed.usage?.input_tokens ?? 0}`);
  console.log(`OUTPUT_TOKENS=${parsed.usage?.output_tokens ?? 0}`);
}

main().catch((error) => {
  console.error("BTC_CLEAN_CHAT_DIRECT_OPENAI_SMOKE=FAIL");
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
