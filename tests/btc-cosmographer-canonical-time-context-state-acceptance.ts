import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { routeBtcCosmographerLocalRc } from "../lib/btc-cosmographer-multi-body-astro-rc";
import { applyBtcRelationIntentPrecedence } from "../lib/btc-cosmographer-evidence-navigation-runtime";
import { buildBtcCosmographerAnswer } from "../lib/btc-cosmographer-answer";
import { specializeMarketAnswer } from "../lib/btc-cosmographer-specialized-answer";
import { buildPublicMultiBodyAnswer } from "../lib/btc-cosmographer-public-multi-body-projection";

const ROOT = process.cwd();
const CORPUS = path.join(ROOT, "tests/fixtures/btc-cosmographer-canonical-140-v0_1.csv");
const PACKETS = path.join(ROOT, "tests/fixtures/btc-cosmographer-canonical-state-packets-v0_1.json");
const sha = (file: string) => crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
assert.equal(sha(CORPUS), "ef7a08fa8c4bf764650ffce4a3cb85c7eebf6f19b1409446e5cba92ef06340bd");
assert.equal(sha(PACKETS), "631f71d5c2b095248fa3ba9c66d3739d559576e59f93bf1e35e3304f2aa3a464");

const authority = JSON.parse(fs.readFileSync(PACKETS, "utf8"));
const packets: any[] = authority.packets;
const byId = new Map(packets.map((packet) => [packet.case_id, packet]));

function routed(caseId: string) {
  const packet: any = byId.get(caseId);
  assert.ok(packet, `missing frozen packet ${caseId}`);
  const context = packet.expected_context_packet ?? null;
  const retained = packet.retained_astro_context?.value?.subject === "planetary_aspects"
    ? packet.retained_astro_context.value
    : null;
  const question = packet.target_question_exact ?? packet.raw_question;
  const base = routeBtcCosmographerLocalRc(packet.locale.toLowerCase(), question, context, undefined, retained);
  return applyBtcRelationIntentPrecedence(base, question, context, retained).route;
}

function expectRange(caseId: string, start: string, end: string) {
  const route = routed(caseId);
  assert.deepEqual([route.time_range?.start, route.time_range?.end], [start, end], `${caseId} time range`);
  return route;
}

expectRange("AD-008", "2026-01-01", "2026-12-31");
expectRange("FG-010", "2026-01-01", "2026-12-31");
expectRange("RG-027", "2026-01-01", "2026-12-31");
expectRange("AD-009", "2026-03-10", "2026-03-20");
expectRange("RG-006", "2026-03-10", "2026-03-20");
expectRange("AI-035", "2026-04-01", "2026-04-30");
expectRange("AI-039", "2026-07-04", "2026-08-06");
expectRange("AI-051", "2026-07-20", "2026-07-21");
expectRange("AD-016", "2026-07-20", "2026-07-21");
const ad016Route = routed("AD-016");
assert.equal(buildBtcCosmographerAnswer("ru", ad016Route, { snapshot: null, envelope: null }).answer_mode, "METHODOLOGY");
expectRange("AI-030", "2009-01-03", "2009-01-03");
expectRange("FG-014", "2009-01-03", "2009-01-03");

assert.equal(routed("AD-015").subject, "planetary_aspects");
assert.deepEqual([routed("AD-015").time_range?.start, routed("AD-015").time_range?.end], ["2035-01-01", "2035-12-31"]);
const ad015Answer = buildPublicMultiBodyAnswer("ru", routed("AD-015") as any, null);
assert.equal(ad015Answer.answer_mode, "CLARIFICATION");
const ai039Answer = buildPublicMultiBodyAnswer("ru", routed("AI-039") as any, null);
assert.ok(ai039Answer.sections.some((section) => section.id === "interpretation_boundary"));
const rg006Answer = buildPublicMultiBodyAnswer("ru", routed("RG-006") as any, null);
assert.ok(rg006Answer.sections.some((section) => section.id === "main_windows"));
assert.equal(routed("AI-009").subject, "temporal_pressure");
assert.equal(routed("AI-009").market_question_class, "temporal_pressure");
for (const caseId of ["AI-017", "AI-018"]) {
  const route = routed(caseId);
  assert.equal(route.domain, "snapshot_memory", `${caseId} domain`);
  assert.equal(route.subject, "change_memory", `${caseId} subject`);
  assert.equal(route.market_question_class, "change_memory", `${caseId} market class`);
}
assert.equal(routed("AI-030").subject, "genesis");
assert.equal(routed("FG-014").subject, "genesis");
assert.equal(routed("RG-014").context_relation, "CROSS_MODULE_BRIDGE");
assert.ok(routed("RG-014").explicit_entities.includes("btc_side:market"));
assert.deepEqual([routed("RG-026").time_range?.start, routed("RG-026").time_range?.end], ["2026-07-01", "2026-07-31"]);
const rg021Clarification = specializeMarketAnswer("ru", routed("RG-021"), {
  answer_state: "SPLIT", answer_mode: "MARKET_DIAGNOSIS", headline: "x", direct_answer: "x",
  sections: [], source_boundary: "x", proof_label: "x",
} as any);
assert.equal(rg021Clarification.answer_mode, "CLARIFICATION");

const ai016Setup = routeBtcCosmographerLocalRc(
  "en",
  "What changed between the current and previous accepted BTC snapshots?",
  null,
);
assert.equal(ai016Setup.domain, "snapshot_memory");
assert.equal(ai016Setup.subject, "change_memory");
assert.ok(ai016Setup.intents.includes("compare"));
assert.ok(ai016Setup.intents.includes("change"));

const priorMarket: any = {
  schema: "btc_cosmographer_context_v0_1",
  prior_domain: "btc_market", prior_subject: "general_btc_field", prior_intents: ["watch"],
  prior_answer_state: "SPLIT", prior_market_question_class: "general_btc_field",
  prior_time_start: null, prior_time_end: null, prior_snapshot_generated_at_utc: null,
};
const genesisSetup = routeBtcCosmographerLocalRc("ru", "Что известно о genesis block Bitcoin?", priorMarket);
assert.equal(genesisSetup.subject, "genesis_history");
assert.deepEqual([genesisSetup.time_range?.start, genesisSetup.time_range?.end], ["2009-01-03", "2009-01-03"]);
const genesisSetupAnswer = buildBtcCosmographerAnswer("ru", genesisSetup, {
  snapshot: null, envelope: null, priorContext: priorMarket,
});
assert.equal(genesisSetupAnswer.answer_mode, "PROTOCOL_EXPLAIN");
console.log("BTC_COSMOGRAPHER_CANONICAL_TIME_CONTEXT_STATE=PASS");
