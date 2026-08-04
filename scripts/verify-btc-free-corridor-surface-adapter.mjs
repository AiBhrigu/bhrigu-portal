import fs from "node:fs";

const app = fs.readFileSync("pages/_app.js", "utf8");
const adapter = fs.readFileSync("components/btc/BtcFreeCorridorSurfaceAdapter.js", "utf8");
const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));

const checks = [];
function check(name, condition) {
  checks.push({ name, passed: Boolean(condition) });
  if (!condition) throw new Error(`FAIL_${name}`);
}

check("ADAPTER_IMPORTED", app.includes('import BtcFreeCorridorSurfaceAdapter from "../components/btc/BtcFreeCorridorSurfaceAdapter"'));
check("ADAPTER_MOUNTED", app.includes("<BtcFreeCorridorSurfaceAdapter />"));
check("EXACT_60_MINUTE_CONTRACT", adapter.includes("const FREE_SESSION_DURATION_MS = 60 * 60 * 1000"));
check("TAB_LOCAL_SESSION_RETAINED", adapter.includes('bhrigu:btc-cosmographer:session:v0_3'));
check("PAID_TRANSITION_AFTER_EXPIRY", adapter.includes("FREE_SESSION_EXPIRED") === false && adapter.includes("Бесплатная сессия завершена"));
check("NEW_FREE_CONVERSATION_AVAILABLE", adapter.includes("Начать новый бесплатный разговор"));
check("PAID_CONTINUITY_ROUTE", adapter.includes("/access?lang=${locale}&intent=btc-continuity"));

const exactQuestions = [
  "Что происходит с BTC сейчас?",
  "Что изменилось с прошлого проверенного снимка?",
  "Какие сигналы сейчас расходятся и почему это важно?",
  "Что должно измениться, чтобы текущий вывод усилился или отменился?",
  "Покажи источники и время обновления данных этого чтения.",
];
exactQuestions.forEach((question, index) => check(`PUBLIC_QUESTION_${index + 1}`, adapter.includes(question)));

check("NOVICE_NAVIGATION_REWRITE", adapter.includes("Какие вопросы можно задать о BTC?"));
check("WHY_FOLLOW_UP_EXPANDS_SUBJECT", adapter.includes("Почему текущие сигналы ликвидности BTC расходятся?"));
check("WHAT_NEXT_EXPANDS_SUBJECT", adapter.includes("Какие изменения ликвидности усилят, ослабят или отменят текущий вывод по BTC?"));
check("GENERATED_NEXT_QUESTION_CONTEXTUALIZED", adapter.includes("Какие факты создают расхождение в ${label} и что его снимет?"));
check("PREVIOUS_SUBJECT_RETURN", adapter.includes("previousSubject"));
check("NEXT_QUESTION_ACTIONABLE", adapter.includes('nextStep.setAttribute("role", "button")') && adapter.includes("composerNode.requestSubmit()"));
check("FIRST_PUBLIC_CONCLUSION", adapter.includes("data-public-first-conclusion"));
check("CONDITIONS_HIERARCHY", adapter.includes("Что изменит вывод") && adapter.includes("Усилит") && adapter.includes("Ослабит") && adapter.includes("Отменит"));
check("MACHINE_METADATA_HIDDEN", adapter.includes(".answerSource .answerAuthority") && adapter.includes(".answerEvidenceMeta{display:none!important}"));
check("SOURCES_COLLAPSED", adapter.includes('details.removeAttribute("open")'));
check("MOBILE_SINGLE_COLUMN", adapter.includes("@media(max-width:680px)") && adapter.includes(".btcPublicQuestionGrid{grid-template-columns:1fr"));
check("NO_BACKEND_EXPANSION", !adapter.includes("fetch(") && !adapter.includes("axios") && !adapter.includes("WebSocket"));
check("PACKAGE_SCRIPT_PRESENT", pkg.scripts?.["verify:btc-free-corridor"] === "node scripts/verify-btc-free-corridor-surface-adapter.mjs");

console.log(JSON.stringify({
  schema: "btc_free_corridor_surface_acceptance_v0_1",
  total: checks.length,
  passed: checks.filter((item) => item.passed).length,
  checks,
}, null, 2));
