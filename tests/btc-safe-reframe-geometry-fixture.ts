declare const process: { stdout: { write(value: string): void } };

import {
  deriveBtcQuestionGeometry,
  guardBtcQuestionGeometry,
} from "../lib/btc-question-geometry";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const ordinary = deriveBtcQuestionGeometry("general", false);
const reframed = deriveBtcQuestionGeometry("general", true);

assert(guardBtcQuestionGeometry(ordinary), "Ordinary BTC geometry failed its contract");
assert(guardBtcQuestionGeometry(reframed), "Safe-reframed BTC geometry failed its contract");
assert(ordinary.safety_overlay === "standard_public_context", "Ordinary question lost the standard public context");
assert(reframed.safety_overlay === "observable_context_only", "Safe reframe did not produce observable context only");
assert(reframed.primary_sections.length === 2, "Safe reframe lost its complete primary read route");
assert(reframed.supporting_sections.length + reframed.suppressed_sections.length === 4, "Safe reframe lost its complete section partition");
assert(reframed.route_version === ordinary.route_version, "Safe reframe escaped the deterministic route version");

process.stdout.write("BTC_SAFE_REFRAME_GEOMETRY_FIXTURE=PASS\n");
