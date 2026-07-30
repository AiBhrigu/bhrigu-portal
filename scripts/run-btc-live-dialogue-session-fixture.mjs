import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const checks = [];
const check = (name, passed, details = "") => {
  checks.push({ name, passed, details });
  if (!passed) console.error(`FAIL ${name} ${details}`);
  else console.log(`PASS ${name}`);
};

const page = read("pages/crypto-astro/btc/live.tsx");
const dialogue = read("components/btc/BtcLiveDialogue.tsx");
const session = read("lib/btc-live-dialogue-session.ts");
const followUp = read("lib/btc-live-dialogue-follow-up.ts");
const style = read("lib/btc-live-dialogue-style.ts");
const verifier = read("scripts/verify-btc-live-dialogue-surface.py");
const workflow = read(".github/workflows/btc-free-question-live-dialogue-pr.yml");

check("session_schema_locked", session.includes("btc_free_dialogue_session_v0_1") && session.includes("bhrigu:btc-free-dialogue:session:v0_1"));
check("session_storage_only", session.includes("window.sessionStorage") && !session.includes("localStorage") && !session.includes("indexedDB") && !session.includes("document.cookie"));
check("session_limits_locked", session.includes("BTC_DIALOGUE_SESSION_MAX_TURNS = 20") && session.includes("64 * 1024") && session.includes("BTC_DIALOGUE_SESSION_MIN_RETAINED_TURNS = 6"));
check("malformed_session_recovers", session.includes("removeItem(BTC_DIALOGUE_SESSION_KEY)") && session.includes("createBtcDialogueSession"));
check("compacted_session_is_persisted", session.includes("serialized !== raw") && session.includes("sessionStorage.setItem(BTC_DIALOGUE_SESSION_KEY, serialized)"));
check("compact_context_schema_locked", followUp.includes("btc_follow_up_context_v0_1") && ["fc", "pc", "pf", "ps", "pd", "pt"].every((field) => followUp.includes(`\"${field}\"`)));
check("context_packet_has_no_transcript", !followUp.includes("prior_raw_question") && !followUp.includes("prior_answer_text") && !followUp.includes("prior_evidence"));
check("seven_context_relations_present", ["EXPLAIN_PRIOR", "PRIORITY_WITHIN_PRIOR", "CONFIRM_WITH_MODULE", "COMPARE_MEMORY", "CHANGE_CONDITION", "EXPAND_RELATED_CLASS", "EXPLAIN_CONTRADICTION"].every((value) => followUp.includes(`\"${value}\"`)));
check("clarification_fail_closed_present", ["NO_PRIOR_CONTEXT", "AMBIGUOUS_REFERENT", "UNSUPPORTED_CONTEXT", "CONTEXT_STALE"].every((value) => followUp.includes(`\"${value}\"`)) && followUp.includes("CLARIFICATION_REQUIRED"));
check("unsafe_financial_requests_bounded", followUp.includes("price target") && followUp.includes("wallet") && followUp.includes("прогноз"));
check("server_resolves_before_routing", page.includes("resolveBtcFollowUp") && page.indexOf("resolveBtcFollowUp") < page.indexOf("canonicalizeBtcQuestionForRouter(effectiveQuestion)"));
check("raw_and_effective_questions_separated", page.includes("initialQuestion") && page.includes("effectiveQuestion") && dialogue.includes("effective_question"));
check("source_reloaded_each_request", page.includes("loadBtcStaticSource") && page.includes("composeBtcPublicSnapshot") && page.includes("loadBtcMarketEnvelope"));
check("thread_history_visible", dialogue.includes("turns.map") && dialogue.includes('role="log"') && dialogue.includes("dialogueExchange"));
check("new_conversation_clears_tab_session", dialogue.includes("clearBtcDialogueSession") && dialogue.includes("window.confirm") && dialogue.includes("New conversation"));
check("composer_continues_context", dialogue.includes("Continue the conversation") && dialogue.includes("BTC_FOLLOW_UP_CONTEXT_SCHEMA"));
check("no_visible_quota_or_paywall", dialogue.includes("No visible question quota") && !dialogue.includes("remaining questions") && !dialogue.includes("checkout") && !dialogue.includes("subscription") && !dialogue.includes("paywall"));
check("tab_only_memory_copy", dialogue.includes("Memory only in this tab") && dialogue.includes("Память только в этой вкладке"));
check("one_composer_only", (dialogue.match(/<form/g) || []).length === 1 && (dialogue.match(/<textarea/g) || []).length === 1);
check("locale_switch_avoids_duplicate_query", dialogue.includes('href={`/crypto-astro/btc/live?lang=${otherLocale}`}'));
check("source_change_disclosed", dialogue.includes("data-source-binding-changed") && dialogue.includes('data-source-changed="true"'));
check("semantic_phi_geometry_preserved", style.includes("61.803398875") && style.includes("38.196601125"));
check("composer_does_not_overlay_thread", !style.includes("position:sticky") && !style.includes("position:fixed"));
check("visual_session_states_required", ["1-turn", "3-turn", "8-turn", "clarification", "source-unavailable"].every((value) => verifier.toLowerCase().includes(value)));
check("workflow_exact_eight_file_scope", [
  ".github/workflows/btc-free-question-live-dialogue-pr.yml",
  "components/btc/BtcLiveDialogue.tsx",
  "lib/btc-live-dialogue-follow-up.ts",
  "lib/btc-live-dialogue-session.ts",
  "lib/btc-live-dialogue-style.ts",
  "pages/crypto-astro/btc/live.tsx",
  "scripts/run-btc-live-dialogue-session-fixture.mjs",
  "scripts/verify-btc-live-dialogue-surface.py",
].every((file) => workflow.includes(file)));
check("no_analytics_provider_or_server_storage", !dialogue.includes("analytics") && !page.includes("pages/api") && !session.includes("fetch(") && !session.includes("Blob"));

const failed = checks.filter((item) => !item.passed);
const contract = {
  schema: "btc_free_dialogue_session_contract_v0_1",
  status: failed.length ? "FAIL" : "PASS",
  runtime_head_sha: process.env.BTC_LIVE_RUNTIME_HEAD_SHA ?? "LOCAL",
  required_two_turn_chains: 12,
  required_three_turn_chains: 6,
  required_clarification_gates: 8,
  storage: "sessionStorage",
  server_transcript: false,
  checks,
};

fs.mkdirSync(path.join(root, "artifacts"), { recursive: true });
fs.writeFileSync(path.join(root, "artifacts/btc-live-dialogue-session-contract.json"), JSON.stringify(contract, null, 2) + "\n");
if (failed.length) process.exit(1);
console.log("BTC_SESSION_LOCAL_DIALOGUE_CONTRACT=PASS");

const base = process.env.BTC_LIVE_PREVIEW_BASE?.replace(/\/$/, "");
if (base) await runRuntimeAcceptance(base);

function decodeHtml(value) {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function textBetween(pageText, pattern) {
  const match = pageText.match(pattern);
  if (!match) throw new Error(`missing pattern ${pattern}`);
  return decodeHtml(match[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
}

function attribute(pageText, name) {
  const match = pageText.match(new RegExp(`${name}="([^"]*)"`));
  if (!match) throw new Error(`missing attribute ${name}`);
  return decodeHtml(match[1]);
}

function contextPacket(pageText) {
  const packet = {};
  for (const name of ["fc", "pc", "pf", "ps", "pd", "pt"]) {
    const match = pageText.match(new RegExp(`<input type="hidden" name="${name}" value="([^"]*)"`));
    if (!match) throw new Error(`missing context field ${name}`);
    packet[name] = decodeHtml(match[1]);
  }
  return packet;
}

async function getPage(baseUrl, locale, question, packet = null) {
  const params = new URLSearchParams({ lang: locale, q: question });
  if (packet) for (const [key, value] of Object.entries(packet)) params.set(key, value);
  const response = await fetch(`${baseUrl}/crypto-astro/btc/live?${params}`, { headers: { "Cache-Control": "no-cache" } });
  if (!response.ok) throw new Error(`HTTP ${response.status} for ${question}`);
  return response.text();
}

function answerProjection(pageText) {
  return {
    question_class: attribute(pageText, "data-question-class"),
    facets: attribute(pageText, "data-question-facets").split(",").filter(Boolean),
    answer_state: attribute(pageText, "data-answer-state"),
    relation: attribute(pageText, "data-context-relation"),
    headline: textBetween(pageText, /<header class="answerHeader">[\s\S]*?<h2>([\s\S]*?)<\/h2>/),
    direct: textBetween(pageText, /<p class="answerLead" data-answer-direct="true">([\s\S]*?)<\/p>/),
    evidence: textBetween(pageText, /<section data-answer-section="evidence">([\s\S]*?)<\/section>/),
  };
}

async function runRuntimeAcceptance(baseUrl) {
  const corpus = [
    ["en", "Do BTC dominance and altcoin breadth confirm BTC leadership?", "btc_gravity", "confirmation"],
    ["en", "Why does BTC dominance diverge from wider market breadth?", "btc_gravity", "reason"],
    ["en", "Do stablecoin share, DeFi TVL and DEX volume confirm current BTC liquidity conditions?", "liquidity", "confirmation"],
    ["en", "What changed in stablecoin liquidity and DeFi TVL?", "liquidity", "change"],
    ["en", "Do regime, Market Field Score and market cap confirm the current BTC structure?", "market_structure", "confirmation"],
    ["en", "Why do regime and market cap describe a split market structure?", "market_structure", "reason"],
    ["en", "Are altcoin breadth and ETH rotation broadening market participation?", "market_participation_rotation", "confirmation"],
    ["en", "What should I watch next in altcoin rotation and participation?", "market_participation_rotation", "watch"],
    ["en", "What changed in accepted Snapshot Memory since the previous verified snapshot?", "change_memory", "change"],
    ["en", "Compare the accepted Snapshot Memory with the previous checkpoint.", "change_memory", "comparison"],
    ["en", "How does the selected date change BTC temporal pressure and cycle context?", "temporal_pressure", "temporal_context"],
    ["en", "What is the current BTC field overview and why does it matter?", "general_btc_field", "reason"],
    ["ru", "Подтверждают ли доминирование BTC и ширина альткоинов лидерство BTC?", "btc_gravity", "confirmation"],
    ["ru", "Почему доминирование BTC расходится с шириной рынка?", "btc_gravity", "reason"],
    ["ru", "Подтверждают ли стейблкоины, DeFi TVL и DEX текущую ликвидность BTC?", "liquidity", "confirmation"],
    ["ru", "Что изменилось в ликвидности стейблкоинов и DeFi TVL?", "liquidity", "change"],
    ["ru", "Подтверждают ли режим, Field Score и капитализация структуру BTC?", "market_structure", "confirmation"],
    ["ru", "Почему режим и капитализация дают раздельную структуру рынка?", "market_structure", "reason"],
    ["ru", "Расширяют ли ширина альткоинов и ротация ETH участие рынка?", "market_participation_rotation", "confirmation"],
    ["ru", "За чем наблюдать дальше в ротации альткоинов и участии?", "market_participation_rotation", "watch"],
    ["ru", "Что изменила принятая память BTC по сравнению с предыдущим снимком?", "change_memory", "change"],
    ["ru", "Сравни принятую Snapshot Memory с предыдущей контрольной точкой.", "change_memory", "comparison"],
    ["ru", "Как выбранная дата меняет временное давление и цикл BTC?", "temporal_pressure", "temporal_context"],
    ["ru", "Что показывает общее поле BTC и почему это важно?", "general_btc_field", "reason"],
  ];

  const rows = [];
  for (const [locale, question, expectedClass, expectedFacet] of corpus) {
    const pageText = await getPage(baseUrl, locale, question);
    const value = answerProjection(pageText);
    if (value.question_class !== expectedClass || !value.facets.includes(expectedFacet)) throw new Error(`semantic route mismatch ${question}`);
    if (!["CONFIRMED", "SPLIT", "LIMITED"].includes(value.answer_state)) throw new Error(`state mismatch ${question}`);
    if (!value.headline || value.headline.toLowerCase() === "mixed signals" || !value.direct || !value.evidence) throw new Error(`answer contract mismatch ${question}`);
    rows.push({ locale, question, ...value });
  }

  for (const locale of ["en", "ru"]) {
    const firstByClass = new Map();
    for (const row of rows.filter((item) => item.locale === locale)) {
      if (!firstByClass.has(row.question_class)) firstByClass.set(row.question_class, `${row.headline}\u241f${row.direct}\u241f${row.evidence}`);
    }
    if (firstByClass.size !== 7 || new Set(firstByClass.values()).size !== 7) throw new Error(`cross-class diversity failed ${locale}`);
  }

  const repeatQuestion = corpus[2];
  const repeatA = answerProjection(await getPage(baseUrl, repeatQuestion[0], repeatQuestion[1]));
  const repeatB = answerProjection(await getPage(baseUrl, repeatQuestion[0], repeatQuestion[1]));
  if (JSON.stringify(repeatA) !== JSON.stringify(repeatB)) throw new Error("exact repeat determinism failed");

  const semanticReport = {
    schema: "btc_question_specific_semantic_gate_v0_1",
    status: "PASS",
    question_count: 24,
    class_accuracy: "24/24",
    facet_accuracy: "24/24",
    exact_repeat_determinism: true,
    cross_class_exact_answer_duplicates: 0,
    generic_mixed_signals_count: 0,
    rows,
  };
  fs.writeFileSync(path.join(root, "artifacts/btc-question-specific-semantic-gate.json"), JSON.stringify(semanticReport, null, 2) + "\n");

  const firstQuestions = {
    gravity_en: "Do BTC dominance and altcoin breadth confirm BTC leadership?",
    liquidity_en: "Do stablecoin share, DeFi TVL and DEX volume confirm current BTC liquidity conditions?",
    structure_en: "Do regime, Market Field Score and market cap confirm the current BTC structure?",
    participation_en: "Are altcoin breadth and ETH rotation broadening market participation?",
    memory_en: "What changed in accepted Snapshot Memory since the previous verified snapshot?",
    general_en: "What is the current BTC field overview and why does it matter?",
    gravity_ru: "Подтверждают ли доминирование BTC и ширина альткоинов лидерство BTC?",
    liquidity_ru: "Подтверждают ли стейблкоины, DeFi TVL и DEX текущую ликвидность BTC?",
    structure_ru: "Подтверждают ли режим, Field Score и капитализация структуру BTC?",
    participation_ru: "Расширяют ли ширина альткоинов и ротация ETH участие рынка?",
    memory_ru: "Что изменила принятая память BTC по сравнению с предыдущим снимком?",
    general_ru: "Что показывает общее поле BTC и почему это важно?",
  };

  const twoTurn = [
    ["en", "gravity_en", "Why?", "btc_gravity", "EXPLAIN_PRIOR", "reason"],
    ["en", "gravity_en", "Does liquidity confirm it?", "liquidity", "CONFIRM_WITH_MODULE", "confirmation"],
    ["en", "liquidity_en", "What would change this?", "liquidity", "CHANGE_CONDITION", "watch"],
    ["en", "structure_en", "What matters most?", "market_structure", "PRIORITY_WITHIN_PRIOR", "reason"],
    ["en", "participation_en", "And BTC dominance?", "btc_gravity", "EXPAND_RELATED_CLASS", "confirmation"],
    ["en", "memory_en", "Compare with the previous snapshot.", "change_memory", "COMPARE_MEMORY", "comparison"],
    ["ru", "gravity_ru", "Почему?", "btc_gravity", "EXPLAIN_PRIOR", "reason"],
    ["ru", "gravity_ru", "Ликвидность это подтверждает?", "liquidity", "CONFIRM_WITH_MODULE", "confirmation"],
    ["ru", "liquidity_ru", "Что изменит этот вывод?", "liquidity", "CHANGE_CONDITION", "watch"],
    ["ru", "structure_ru", "Что здесь важнее?", "market_structure", "PRIORITY_WITHIN_PRIOR", "reason"],
    ["ru", "participation_ru", "А доминирование BTC?", "btc_gravity", "EXPAND_RELATED_CLASS", "confirmation"],
    ["ru", "memory_ru", "Сравни с предыдущим снимком.", "change_memory", "COMPARE_MEMORY", "comparison"],
  ];

  const twoRows = [];
  for (const [locale, key, followQuestion, expectedClass, expectedRelation, expectedFacet] of twoTurn) {
    const firstPage = await getPage(baseUrl, locale, firstQuestions[key]);
    const secondPage = await getPage(baseUrl, locale, followQuestion, contextPacket(firstPage));
    const value = answerProjection(secondPage);
    if (value.question_class !== expectedClass || value.relation !== expectedRelation || !value.facets.includes(expectedFacet)) throw new Error(`two-turn mismatch ${followQuestion}`);
    twoRows.push({ locale, first: firstQuestions[key], follow_up: followQuestion, ...value });
  }

  const threeTurn = [
    ["en", "gravity_en", "Why?", "Does liquidity confirm it?", "liquidity", "CONFIRM_WITH_MODULE"],
    ["en", "liquidity_en", "What matters most?", "What would change this?", "liquidity", "CHANGE_CONDITION"],
    ["en", "structure_en", "Why is that contradiction important?", "What would change this?", "market_structure", "CHANGE_CONDITION"],
    ["en", "participation_en", "And BTC dominance?", "Compare with the previous snapshot.", "change_memory", "COMPARE_MEMORY"],
    ["ru", "gravity_ru", "Почему?", "Что изменит этот вывод?", "btc_gravity", "CHANGE_CONDITION"],
    ["ru", "general_ru", "А ликвидность?", "Почему это важно?", "liquidity", "EXPLAIN_PRIOR"],
  ];

  const threeRows = [];
  for (const [locale, key, secondQuestion, thirdQuestion, expectedClass, expectedRelation] of threeTurn) {
    const firstPage = await getPage(baseUrl, locale, firstQuestions[key]);
    const firstPacket = contextPacket(firstPage);
    if (secondQuestion.includes("contradiction")) firstPacket.ps = "SPLIT";
    const secondPage = await getPage(baseUrl, locale, secondQuestion, firstPacket);
    const thirdPage = await getPage(baseUrl, locale, thirdQuestion, contextPacket(secondPage));
    const value = answerProjection(thirdPage);
    if (value.question_class !== expectedClass || value.relation !== expectedRelation) throw new Error(`three-turn mismatch ${thirdQuestion}`);
    threeRows.push({ locale, questions: [firstQuestions[key], secondQuestion, thirdQuestion], ...value });
  }

  const basePacket = contextPacket(await getPage(baseUrl, "en", firstQuestions.gravity_en));
  const clarifications = [
    ["en", "Why?", null],
    ["en", "It?", basePacket],
    ["en", "And SOL?", basePacket],
    ["en", "Forecast BTC price next month.", basePacket],
    ["en", "Which wallet should I use?", basePacket],
    ["en", "Why?", { ...basePacket, fc: "bad-schema" }],
    ["en", "Why?", { ...basePacket, pc: "unknown" }],
    ["en", "What changed since then?", { ...basePacket, pt: "2020-01-01T00:00:00Z" }],
  ];
  const clarificationRows = [];
  for (const [locale, question, packet] of clarifications) {
    const pageText = await getPage(baseUrl, locale, question, packet);
    if (!pageText.includes("dialogueStateCLARIFICATION") || !pageText.includes('data-question-class=""')) throw new Error(`clarification gate failed ${question}`);
    clarificationRows.push({ locale, question, status: "CLARIFICATION_REQUIRED" });
  }

  const followReport = {
    schema: "btc_session_follow_up_acceptance_v0_1",
    status: "PASS",
    two_turn_count: twoRows.length,
    three_turn_count: threeRows.length,
    clarification_count: clarificationRows.length,
    two_turn: twoRows,
    three_turn: threeRows,
    clarifications: clarificationRows,
  };
  if (followReport.two_turn_count !== 12 || followReport.three_turn_count !== 6 || followReport.clarification_count !== 8) throw new Error("follow-up corpus count failed");
  fs.writeFileSync(path.join(root, "artifacts/btc-session-follow-up-gate.json"), JSON.stringify(followReport, null, 2) + "\n");
  console.log("BTC_24_QUESTION_SEMANTIC_GATE=PASS");
  console.log("BTC_SESSION_FOLLOW_UP_GATE=PASS");
}
