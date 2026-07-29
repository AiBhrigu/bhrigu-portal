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

check("landing_has_first_viewport_question", landing.includes("heroProductEntry") && landing.includes("BtcHeroQuestionLaunch"));
check("static_five_route_component_preserved", landing.includes("BtcQuestionMembrane") && question.includes("getBtcExampleRoutes"));
check("lower_form_routes_to_live_dialogue", question.includes('const LIVE_PATH = "/crypto-astro/btc/live"') && question.includes('action={LIVE_PATH}'));
check("example_routes_open_live_dialogue", question.includes('return`${LIVE_PATH}?'));
check("hero_form_routes_to_live_dialogue", hero.includes('action="/crypto-astro/btc/live"'));
check("live_page_uses_existing_source", live.includes("loadBtcStaticSource") && live.includes("composeBtcPublicSnapshot") && live.includes("loadBtcMarketEnvelope"));
check("live_page_has_no_api_or_payment", !live.includes("pages/api") && !live.includes("payment") && !dialogue.includes("checkout") && !dialogue.includes("stripe"));
check("dialogue_separates_user_and_cosmographer", dialogue.includes("userTurn") && dialogue.includes("cosmographerTurn"));
check("dialogue_keeps_full_phi_and_evidence", dialogue.includes("BtcPhiZone") && dialogue.includes("BtcEvidenceZone") && dialogue.includes("liveFullField"));
check("phi_constants_locked", palette.includes("61.803398875") && palette.includes("38.196601125") && liveStyle.includes("61.803398875") && liveStyle.includes("38.196601125"));
check("gold_is_accent_blue_is_structure", palette.includes("--b:#d2a45f") && palette.includes("--blue:#6aa8ff") && palette.includes("--bl:rgba(106,168,255,.22)"));
check("first_screen_major_action", palette.includes("grid-template-columns:minmax(0,38.196601125fr) minmax(420px,61.803398875fr)"));
check("dialogue_major_minor_grid", liveStyle.includes("grid-template-columns:minmax(0,61.803398875fr) minmax(300px,38.196601125fr)"));
check("free_boundary_visible", hero.includes("Без регистрации") && dialogue.includes("No price forecast"));
check("existing_core_files_not_replaced", !live.includes("btc-binance-free-observation-bridge") && !dialogue.includes("raw_provider"));

const failed = checks.filter((item) => !item.passed);
const report = {
  schema: "btc_free_question_live_dialogue_fixture_v0_1",
  status: failed.length ? "FAIL" : "PASS",
  runtime_head_sha: process.env.BTC_LIVE_RUNTIME_HEAD_SHA ?? "LOCAL",
  checks,
};
fs.mkdirSync(path.join(root, "artifacts"), { recursive: true });
fs.writeFileSync(path.join(root, "artifacts/btc-live-dialogue-contract.json"), JSON.stringify(report, null, 2) + "\n");
if (failed.length) process.exit(1);
console.log("BTC_FREE_QUESTION_LIVE_DIALOGUE_CONTRACT=PASS");
