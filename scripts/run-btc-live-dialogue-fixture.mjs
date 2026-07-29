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

const landing = read("pages/crypto-astro/btc.tsx");
const live = read("pages/crypto-astro/btc/live.tsx");
const question = read("components/btc/BtcQuestionMembrane.tsx");
const hero = read("components/btc/BtcHeroQuestionLaunch.tsx");
const dialogue = read("components/btc/BtcLiveDialogue.tsx");
const palette = read("lib/btc-product-rebalance-style.ts");
const liveStyle = read("lib/btc-live-dialogue-style.ts");

check("static_landing_preserved", landing.includes("heroProductEntry") && landing.includes("BtcQuestionMembrane"));
check("static_five_routes_preserved", question.includes("getBtcExampleRoutes") && question.includes("data-example-route"));
check("landing_has_single_live_cta", hero.includes("heroDialogueCta") && hero.includes("/crypto-astro/btc/live"));
check("landing_has_no_question_form", !hero.includes("<form") && !question.includes("<form") && !question.includes("<textarea"));
check("example_routes_open_live_dialogue", question.includes('return`${LIVE_PATH}?'));
check("live_page_uses_existing_source", live.includes("loadBtcStaticSource") && live.includes("composeBtcPublicSnapshot") && live.includes("loadBtcMarketEnvelope"));
check("live_has_exactly_one_composer", (dialogue.match(/<form/g) || []).length === 1 && dialogue.includes("liveComposer"));
check("live_is_single_dialogue_shell", dialogue.includes("liveDialogueShell") && dialogue.includes("liveThread"));
check("dialogue_separates_user_and_cosmographer", dialogue.includes("userTurn") && dialogue.includes("cosmographerTurn"));
check("live_has_no_analytics_dashboard", !dialogue.includes("liveEvidenceRail") && !dialogue.includes("liveMetricField") && !dialogue.includes("answerDecisionGrid") && !dialogue.includes("liveFullField") && !dialogue.includes("BtcPhiZone") && !dialogue.includes("BtcEvidenceZone"));
check("live_has_no_api_payment_or_paid_surface", !live.includes("pages/api") && !dialogue.includes("checkout") && !dialogue.includes("stripe") && !dialogue.includes("subscription"));
check("phi_constants_preserved_quietly", palette.includes("61.803398875") && palette.includes("38.196601125") && liveStyle.includes("61.803398875") && liveStyle.includes("38.196601125"));
check("free_boundary_visible", hero.includes("Без регистрации") && dialogue.includes("No forecast or trading signal"));
check("protected_core_not_replaced", !live.includes("btc-binance-free-observation-bridge") && !dialogue.includes("raw_provider"));

const failed = checks.filter((item) => !item.passed);
const report = {
  schema: "btc_clean_free_dialogue_fixture_v0_1",
  status: failed.length ? "FAIL" : "PASS",
  runtime_head_sha: process.env.BTC_LIVE_RUNTIME_HEAD_SHA ?? "LOCAL",
  checks,
};
fs.mkdirSync(path.join(root, "artifacts"), { recursive: true });
fs.writeFileSync(path.join(root, "artifacts/btc-live-dialogue-contract.json"), JSON.stringify(report, null, 2) + "\n");
if (failed.length) process.exit(1);
console.log("BTC_CLEAN_FREE_DIALOGUE_CONTRACT=PASS");
