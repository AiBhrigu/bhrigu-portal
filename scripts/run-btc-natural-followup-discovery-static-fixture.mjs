import fs from "node:fs";

const read = (path) => fs.readFileSync(path, "utf8");
const checks = [];
const check = (name, pass) => {
  checks.push({ name, pass: Boolean(pass) });
  console.log(`${pass ? "PASS" : "FAIL"} ${name}`);
};

const route = read("lib/btc-cosmographer-route-graph.ts");
const live = read("pages/crypto-astro/btc/live.tsx");
const component = read("components/btc/BtcCosmographerDialogue.tsx");
const app = read("pages/_app.js");
const document = read("pages/_document.js");
const entry = read("pages/crypto-astro/btc.tsx");

check("natural_current_state", route.includes("what(?:'s|\\s+is)\\s+happening"));
check("natural_issuance", route.includes("how\\s+(?:are|do)\\s+new"));
check("methodology_precedence", route.indexOf("if (isMethodology(question))") < route.indexOf('if (market === "change_memory")'));
check("referential_divergence", route.includes("which facts create"));
check("named_calendar_date", route.includes("namedCalendarDate"));
check("return_context_inheritance", route.includes('relation === "RETURN_TO_PREVIOUS_TOPIC"'));
check("market_evidence_rebinding", live.includes("marketEvidenceQuestion(route)"));
check("return_packet", live.includes("parseReturnContext") && component.includes("returnContextFields"));
check("live_noindex_header", live.includes('X-Robots-Tag", "noindex, follow'));
check("dynamic_html_lang", document.includes("<Html lang={lang}>"));
check("btc_route_meta", app.includes('"/crypto-astro/btc/live"'));
check("accepted_public_knowledge", entry.includes("BTC_ACCEPTED_PUBLIC_KNOWLEDGE"));
check("json_ld", entry.includes("application/ld+json"));
check("robots", read("public/robots.txt").includes("Sitemap:"));
check("sitemap", read("public/sitemap.xml").includes("btc?lang=ru"));
check("llms", read("public/llms.txt").includes("Arbitrary live dialogue queries"));

const failures = checks.filter((item) => !item.pass);
if (failures.length) process.exit(1);
console.log(`BTC_NATURAL_FOLLOWUP_DISCOVERY_STATIC=PASS checks=${checks.length}`);