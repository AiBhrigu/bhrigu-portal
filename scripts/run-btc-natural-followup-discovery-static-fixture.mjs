import fs from "node:fs";
import { execFileSync } from "node:child_process";

const read = (path) => fs.readFileSync(path, "utf8");
const checks = [];
const check = (name, pass, details = "") => {
  checks.push({ name, pass: Boolean(pass), details });
  console.log(`${pass ? "PASS" : "FAIL"} ${name}${details ? ` ${details}` : ""}`);
};

const route = read("lib/btc-cosmographer-route-graph.ts");
const live = read("pages/crypto-astro/btc/live.tsx");
const component = read("components/btc/BtcCosmographerDialogue.tsx");
const app = read("pages/_app.js");
const document = read("pages/_document.js");
const entry = read("pages/crypto-astro/btc.tsx");
const trackedFiles = execFileSync("git", ["ls-files", "-z"], { encoding: "utf8" })
  .split("\0")
  .filter(Boolean);
const trackedPythonCaches = trackedFiles.filter((path) =>
  /(^|\/)__pycache__(\/|$)|\.py[ocd]$/i.test(path),
);
const ignoredPythonCacheProbes = [
  "scripts/__pycache__/probe.pyc",
  "scripts/probe.pyc",
  "scripts/probe.pyo",
  "scripts/probe.pyd",
].every((path) => {
  try {
    execFileSync("git", ["check-ignore", "-q", "--no-index", path]);
    return true;
  } catch {
    return false;
  }
});

check("natural_current_state", route.includes("what(?:'s|\\s+is)\\s+happening"));
check("natural_issuance", route.includes("how\\s+(?:are|do)\\s+new"));
check("methodology_precedence", route.indexOf("if (isMethodology(question))") < route.indexOf('if (market === "change_memory")'));
check("referential_divergence", route.includes("which facts create"));
check("named_calendar_date", route.includes("namedCalendarDate"));
check("return_context_inheritance", route.includes('relation === "RETURN_TO_PREVIOUS_TOPIC"'));
check(
  "market_evidence_rebinding",
  live.includes("marketEvidenceQuestion(route, activePacket)") &&
    live.includes('route.explicit_entities.includes("active_answer_reference")') &&
    live.includes("priorContext?.prior_market_question_class"),
);
check("return_packet", live.includes("parseReturnContext") && component.includes("returnContextFields"));
check("live_noindex_header", live.includes('X-Robots-Tag", "noindex, follow'));
check("dynamic_html_lang", document.includes("<Html lang={lang}>") );
check("btc_route_meta", app.includes('"/crypto-astro/btc/live"'));
check("accepted_public_knowledge", entry.includes("BTC_ACCEPTED_PUBLIC_KNOWLEDGE"));
check("json_ld", entry.includes("application/ld+json"));
check("robots", read("public/robots.txt").includes("Sitemap:"));
check("sitemap", read("public/sitemap.xml").includes("btc?lang=ru"));
check("llms", read("public/llms.txt").includes("Arbitrary live dialogue queries"));
check("tracked_python_cache_guard", trackedPythonCaches.length === 0, `count=${trackedPythonCaches.length}`);
check("working_tree_python_cache_ignored", ignoredPythonCacheProbes);
check("CLOSED_PUBLIC_STOP_REASON_LABELS", [
  "ANSWER_COMPLETE", "MISSING_EVIDENCE", "OUT_OF_SCOPE", "REPEATED_ROUTE", "MODE_TRANSITION_NOT_EXPLICIT",
  "Ответ завершён", "Answer complete",
  "Недостаточно опубликованных доказательств", "Published evidence is insufficient",
  "Запрос вне доступной области", "Request outside the supported scope",
  "Повтор не добавляет новой информации", "The repeated request adds no new information",
  "Уточните, к какому предмету перейти", "Clarify which subject to continue with",
].every((value) => component.includes(value)));
check("RAW_STOP_REASON_INTERPOLATION_ABSENT", !component.includes("turn.stop_reason ??") && !component.includes("<strong>{turn.stop_reason"));
check("REQUIRED_PUBLIC_SUBJECT_LABELS_PRESENT", [
  "general_btc_field", "Текущее состояние BTC", "Current BTC state",
  "temporal_pressure", "Временной контекст", "Temporal context",
  "unsupported_market_request", "Граница рыночного запроса", "Market request boundary",
].every((value) => component.includes(value)));
check("RAW_SUBJECT_SLUG_FALLBACK_ABSENT", !component.includes('subject.replaceAll("_", " ")'));

const failures = checks.filter((item) => !item.pass);
if (failures.length) process.exit(1);
console.log(`BTC_NATURAL_FOLLOWUP_DISCOVERY_STATIC=${checks.length}/${checks.length}_PASS`);
