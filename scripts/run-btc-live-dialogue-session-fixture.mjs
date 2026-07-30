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
check("locale_switch_starts_clean_route_without_duplication", dialogue.includes('href={`/crypto-astro/btc/live?lang=${otherLocale}`}'));
check("source_change_disclosed", dialogue.includes('data-source-binding-changed') && dialogue.includes('data-source-changed="true"'));
check("semantic_phi_geometry_preserved", style.includes("61.803398875") && style.includes("38.196601125"));
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
const report = {
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
fs.writeFileSync(path.join(root, "artifacts/btc-live-dialogue-session-contract.json"), JSON.stringify(report, null, 2) + "\n");
if (failed.length) process.exit(1);
console.log("BTC_SESSION_LOCAL_DIALOGUE_CONTRACT=PASS");
