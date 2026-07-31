import fs from "node:fs";

const base = process.env.BTC_COSMOGRAPHER_PREVIEW_BASE ?? "http://127.0.0.1:3110";
const checks = [];
const failures = [];

function check(name, condition, detail = "") {
  checks.push({ name, pass: Boolean(condition), detail });
  if (!condition) failures.push({ name, detail });
}

async function page(params) {
  const url = new URL("/crypto-astro/btc/live", base);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  const response = await fetch(url);
  const text = await response.text();
  check(`http_${params.case}`, response.status === 200, `${response.status} ${url}`);
  return { url: String(url), text };
}

const annualContext = {
  cc: "btc_cosmographer_context_v0_1",
  cd: "astromodule",
  cs: "planetary_aspects",
  ci: "interval_analysis,reason,explain",
  ca: "CONFIRMED",
  cm: "",
  ct0: "2026-01-01",
  ct1: "2026-12-31",
  cb: "",
  rad: "astromodule",
  ras: "planetary_aspects",
  rat0: "2026-01-01",
  rat1: "2026-12-31",
};

const annualRu = await page({ case: "annual_ru", lang: "ru", q: "Какие аспекты планет важны в 2026 году?" });
check("annual_ru_multi_body_subject", annualRu.text.includes('data-route-subject="planetary_aspects"'));
check("annual_ru_mode", annualRu.text.includes('data-answer-mode="ASTRO_YEAR_OVERVIEW"'));
check("annual_ru_no_jupiter_fallback", !annualRu.text.includes("Юпитер: движение в периоде"));
check("annual_ru_five_windows", annualRu.text.includes("Планетарные аспекты 2026: пять главных окон"));
check("annual_ru_chronology_collapsed", annualRu.text.includes('data-complete-transitions="collapsed"'));

const follow = await page({ case: "follow_ru", lang: "ru", q: "Почему это важно?", ...annualContext });
check("follow_relation", follow.text.includes('data-semantic-context-relation="FOLLOW_UP"'));
check("follow_focused_headline", follow.text.includes("Почему именно эти окна важны"));
check("follow_no_full_transition_inventory", !follow.text.includes('data-complete-transitions="collapsed"'));

const bridge = await page({ case: "bridge_ru", lang: "ru", q: "Ликвидность подтверждает?", ...annualContext });
check("bridge_relation", bridge.text.includes('data-semantic-context-relation="CROSS_MODULE_BRIDGE"'));
check("bridge_split", bridge.text.includes('data-answer-state="SPLIT"'));
const marketIndex = bridge.text.indexOf('data-semantic-answer-section="market_layer"');
const windowsIndex = bridge.text.indexOf('data-semantic-answer-section="main_windows"');
check("bridge_market_first", marketIndex >= 0 && windowsIndex >= 0 && marketIndex < windowsIndex, `${marketIndex}/${windowsIndex}`);

const halving = await page({ case: "halving_ru", lang: "ru", q: "Теперь расскажи о халвинге", ...annualContext, cd: "astro_btc_bridge", cm: "liquidity", ca: "SPLIT" });
check("halving_topic_switch", halving.text.includes('data-route-domain="bitcoin_protocol"') && halving.text.includes('data-route-subject="halving"'));

const returnPage = await page({
  case: "return_ru",
  lang: "ru",
  q: "Вернёмся к аспектам",
  cc: "btc_cosmographer_context_v0_1",
  cd: "bitcoin_protocol",
  cs: "halving",
  ci: "explain",
  ca: "CONFIRMED",
  cm: "",
  ct0: "",
  ct1: "",
  cb: "",
  rad: "astromodule",
  ras: "planetary_aspects",
  rat0: "2026-01-01",
  rat1: "2026-12-31",
});
check("return_relation", returnPage.text.includes('data-semantic-context-relation="RETURN_TO_PREVIOUS_TOPIC"'));
check("return_subject", returnPage.text.includes('data-route-subject="planetary_aspects"'));
check("return_compact", returnPage.text.includes("Контекст аспектов 2026 восстановлен") && !returnPage.text.includes('data-complete-transitions="collapsed"'));

const annualEn = await page({ case: "annual_en", lang: "en", q: "Which planetary aspects matter in 2026?" });
check("annual_en_multi_body", annualEn.text.includes('data-route-subject="planetary_aspects"'));
check("annual_en_parity", annualEn.text.includes("Planetary aspects in 2026: five primary windows"));

const source = fs.readFileSync("components/btc/BtcCosmographerDialogue.tsx", "utf8");
check("retained_astro_hidden_fields", source.includes("retainedAstroFields") && source.includes('name={name}'));
check("session_contract_preserved", source.includes("readBtcDialogueSession") && source.includes("upsertBtcDialogueTurn"));
check("transcript_transport_absent", !annualRu.url.includes("transcript") && !source.includes('name="transcript"'));

const report = { status: failures.length ? "FAIL" : "PASS", checks: checks.length, failures, results: checks };
fs.mkdirSync("artifacts", { recursive: true });
fs.writeFileSync("artifacts/btc-public-live-multi-body-projection-report.json", JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
if (failures.length) process.exit(1);
