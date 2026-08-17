import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { routeBtcCosmographerLocalRc } from "../lib/btc-cosmographer-multi-body-astro-rc";
import { applyBtcRelationIntentPrecedence } from "../lib/btc-cosmographer-evidence-navigation-runtime";
import type { BtcCosmographerContextPacket } from "../lib/btc-cosmographer-route-graph";

function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [], cell = "", quoted = false;
  for (let i = text.charCodeAt(0) === 0xfeff ? 1 : 0; i < text.length; i += 1) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i += 1; }
      else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') { row.push(cell); cell = ""; }
    else if (ch === '\n') { row.push(cell.replace(/\r$/, "")); rows.push(row); row = []; cell = ""; }
    else cell += ch;
  }
  if (cell.length || row.length) { row.push(cell.replace(/\r$/, "")); rows.push(row); }
  const [header, ...body] = rows.filter((r) => r.some((v) => v.length));
  assert.ok(header, "canonical CSV header required");
  return body.map((values) => Object.fromEntries(header.map((key, index) => [key, values[index] ?? ""])));
}

function contextPacket(packet: any): BtcCosmographerContextPacket | null {
  const value = packet.expected_context_packet;
  if (!value) return null;
  const answerState = typeof value.prior_answer_state === "string"
    ? value.prior_answer_state
    : value.prior_answer_state?.allowed_values?.[0] ?? "CONFIRMED";
  return {
    ...value,
    prior_answer_state: answerState,
    prior_snapshot_generated_at_utc: typeof value.prior_snapshot_generated_at_utc === "string"
      ? value.prior_snapshot_generated_at_utc
      : null,
  } as BtcCosmographerContextPacket;
}

const expectedContext = (semantic: string): string | null => ({
  NEW_TOPIC: "NEW_TOPIC",
  FOLLOW_UP: "FOLLOW_UP",
  CROSS_MODULE_BRIDGE: "CROSS_MODULE_BRIDGE",
  RETURN_TO_PREVIOUS_TOPIC: "RETURN_TO_PREVIOUS_TOPIC",
  SUBJECT_OVERRIDE: "NEW_TOPIC",
  MODE_OVERRIDE: "NEW_TOPIC",
  AMBIGUOUS_NO_CONTEXT: "GENUINELY_AMBIGUOUS",
  CONFLICT_RESOLUTION: null,
} as Record<string, string | null>)[semantic] ?? null;

const root = process.cwd();
const corpus = parseCsv(fs.readFileSync(path.join(root, "tests/fixtures/btc-cosmographer-canonical-140-v0_1.csv"), "utf8"));
const packetArtifact = JSON.parse(fs.readFileSync(path.join(root, "tests/fixtures/btc-cosmographer-canonical-state-packets-v0_1.json"), "utf8"));
const packets = new Map(packetArtifact.packets.map((packet: any) => [packet.case_id, packet]));

assert.equal(corpus.length, 140, "canonical routing acceptance requires all 140 cases");
assert.equal(new Set(corpus.map((row) => row.CASE_ID)).size, 140, "canonical case IDs must be unique");
assert.equal(packets.size, 140, "canonical state packet coverage must remain 140/140");

let domainPass = 0, contextPass = 0, contextChecked = 0, falseUnsupported = 0, falseAmbiguous = 0;
for (const row of corpus) {
  const packet: any = packets.get(row.CASE_ID);
  assert.ok(packet, `missing state packet ${row.CASE_ID}`);
  const prior = contextPacket(packet);
  const retained = packet.retained_astro_context?.value ?? null;
  const initial = routeBtcCosmographerLocalRc(row.LOCALE.toLowerCase() as "ru" | "en", row.QUESTION_TEXT, prior, undefined, retained);
  const resolved = applyBtcRelationIntentPrecedence(initial, row.QUESTION_TEXT, prior, retained).route;
  assert.equal(resolved.domain, row.EXPECTED_DOMAIN, `${row.CASE_ID} domain: ${row.QUESTION_TEXT}`);
  domainPass += 1;
  if (resolved.domain === "unsupported") falseUnsupported += 1;

  const expected = expectedContext(row.EXPECTED_CONTEXT_RELATION);
  if (expected) {
    contextChecked += 1;
    assert.equal(resolved.context_relation, expected, `${row.CASE_ID} context relation: ${row.QUESTION_TEXT}`);
    contextPass += 1;
    if (expected !== "GENUINELY_AMBIGUOUS" && resolved.context_relation === "GENUINELY_AMBIGUOUS") falseAmbiguous += 1;
  }
}

assert.equal(domainPass, 140, "canonical mode/domain routing must be 140/140");
assert.equal(falseUnsupported, 0, "no canonical supported case may route to unsupported");
assert.equal(contextPass, contextChecked, "all structurally bound context relations must match");
assert.equal(contextChecked, 136, "four CONFLICT_RESOLUTION cases remain semantic Stage B authority");
assert.equal(falseAmbiguous, 0, "no supported non-ambiguous case may overclarify");

console.log(`BTC_COSMOGRAPHER_CANONICAL_ROUTING_REPAIR=PASS domain=${domainPass}/140 context=${contextPass}/${contextChecked} false_unsupported=0 false_ambiguous=0`);
