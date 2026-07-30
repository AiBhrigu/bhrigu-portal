import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const checks = [];
const check = (name, passed, detail = "") => {
  checks.push({ name, passed, detail });
  console.log(`${passed ? "PASS" : "FAIL"} ${name}${detail ? ` ${detail}` : ""}`);
};

const routeSource = read("lib/btc-cosmographer-route-graph.ts");
const protocolSource = read("lib/btc-protocol-evidence.ts");
const astroSource = read("lib/btc-public-astro-evidence.ts");
const answerSource = read("lib/btc-cosmographer-answer.ts");
const componentSource = read("components/btc/BtcCosmographerDialogue.tsx");
const pageSource = read("pages/crypto-astro/btc/live.tsx");
const sessionSource = read("lib/btc-live-dialogue-session.ts");
const workflowSource = read(".github/workflows/btc-free-question-live-dialogue-pr.yml");
const astroData = JSON.parse(read("data/btc_public_astro_evidence_v0_1.json"));

check("route_schema", routeSource.includes("btc_cosmographer_semantic_route_graph_v0_1"));
check("context_schema", routeSource.includes("btc_cosmographer_context_v0_1"));
check("domains", ["bitcoin_protocol", "btc_market", "snapshot_memory", "astromodule", "astro_btc_bridge", "methodology", "navigation"].every((v) => routeSource.includes(`\"${v}\"`)));
check("context_relations", ["NEW_TOPIC", "FOLLOW_UP", "CROSS_MODULE_BRIDGE", "RETURN_TO_PREVIOUS_TOPIC", "GENUINELY_AMBIGUOUS"].every((v) => routeSource.includes(`\"${v}\"`)));
check("explicit_topic_precedence", routeSource.includes("domain !== packet.prior_domain || subject !== packet.prior_subject"));
check("protocol_truth", protocolSource.includes("20,999,999.9769") && protocolSource.includes("210,000") && protocolSource.includes("1,050,000"));
check("astro_schema", astroData.schema === "bhrigu_public_astro_evidence_v0_1");
check("astro_range", astroData.range.start === "2026-01-01" && astroData.range.end === "2026-12-31");
check("astro_bodies", ["sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto"].every((v) => astroData.bodies.includes(v)));
check("jupiter_events", astroData.stations.some((v) => v.body === "jupiter" && v.date === "2026-03-11") && astroData.ingresses.some((v) => v.body === "jupiter" && v.date === "2026-06-30"));
check("answer_modes", ["PROTOCOL_FACT", "PROTOCOL_EXPLAIN", "MARKET_DIAGNOSIS", "ASTRO_INTERVAL", "ASTRO_BTC_BRIDGE", "METHODOLOGY", "NAVIGATION"].every((v) => protocolSource.includes(`\"${v}\"`) || answerSource.includes(`\"${v}\"`)));
check("astro_causality_boundary", astroSource.includes("не превращается в причинное утверждение") || astroSource.includes("does not turn it into a causal claim"));
check("route_before_market", pageSource.indexOf("routeBtcCosmographerQuestion") < pageSource.indexOf("composeBtcPublicSnapshot"));
check("market_only_when_needed", pageSource.includes("needsMarket(route)"));
check("generic_section_renderer", componentSource.includes("turn.sections.map") && componentSource.includes("data-answer-mode"));
check("compact_context", ["cc", "cd", "cs", "ci", "ca", "cm", "ct0", "ct1", "cb"].every((v) => componentSource.includes(`${v}:`)));
check("session_tab_only", sessionSource.includes("window.sessionStorage") && !sessionSource.includes("localStorage") && !sessionSource.includes("indexedDB"));
check("workflow_scope", ["btc-cosmographer-route-graph.ts", "btc-protocol-evidence.ts", "btc-public-astro-evidence.ts", "btc_public_astro_evidence_v0_1.json"].every((v) => workflowSource.includes(v)));

const base = process.env.BTC_COSMOGRAPHER_PREVIEW_BASE?.replace(/\/$/, "");
if (base) await runtime(base);

const failures = checks.filter((item) => !item.passed);
fs.mkdirSync(path.join(root, "artifacts"), { recursive: true });
fs.writeFileSync(path.join(root, "artifacts/btc-cosmographer-semantic-route-report.json"), JSON.stringify({
  schema: "btc_cosmographer_semantic_route_report_v0_1",
  status: failures.length ? "FAIL" : "PASS",
  runtime_head_sha: process.env.BTC_COSMOGRAPHER_RUNTIME_HEAD_SHA ?? "LOCAL",
  checks,
}, null, 2) + "\n");
if (failures.length) process.exit(1);

function decode(value) {
  return value.replaceAll("&quot;", '"').replaceAll("&#x27;", "'").replaceAll("&#39;", "'").replaceAll("&amp;", "&").replaceAll("&lt;", "<").replaceAll("&gt;", ">");
}

function attr(html, name) {
  const match = html.match(new RegExp(`${name}=\"([^\"]*)\"`));
  if (!match) throw new Error(`missing ${name}`);
  return decode(match[1]);
}

function contextPacket(html) {
  const packet = {};
  for (const name of ["cc", "cd", "cs", "ci", "ca", "cm", "ct0", "ct1", "cb"]) {
    const match = html.match(new RegExp(`<input[^>]+name=\"${name}\"[^>]+value=\"([^\"]*)\"`));
    if (!match) throw new Error(`missing context ${name}`);
    packet[name] = decode(match[1]);
  }
  return packet;
}

async function getPage(baseUrl, question, packet = null) {
  const params = new URLSearchParams({ lang: "ru", q: question });
  if (packet) Object.entries(packet).forEach(([key, value]) => params.set(key, value));
  const response = await fetch(`${baseUrl}/crypto-astro/btc/live?${params}`, { headers: { "Cache-Control": "no-cache" } });
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${question}`);
  const html = await response.text();
  return {
    html,
    domain: attr(html, "data-route-domain"),
    subject: attr(html, "data-route-subject"),
    relation: attr(html, "data-context-relation"),
    mode: attr(html, "data-answer-mode"),
  };
}

async function runtime(baseUrl) {
  const cases = [
    ["Какое количество монет BTC?", "bitcoin_protocol", "supply", "PROTOCOL_FACT"],
    ["Что мне нужно знать о халвинге?", "bitcoin_protocol", "halving", "PROTOCOL_EXPLAIN"],
    ["Юпитер как повлиял за 6 месяцев в 2026 году?", "astromodule", "jupiter", "ASTRO_INTERVAL"],
    ["Какие источники использует Космограф?", "methodology", "source_and_method", "METHODOLOGY"],
    ["Какие вопросы можно задавать?", "navigation", "capabilities", "NAVIGATION"],
    ["How many BTC can exist?", "bitcoin_protocol", "supply", "PROTOCOL_FACT"],
    ["How did Jupiter move in the first six months of 2026?", "astromodule", "jupiter", "ASTRO_INTERVAL"],
  ];
  const outputs = [];
  for (const [question, domain, subject, mode] of cases) {
    const result = await getPage(baseUrl, question);
    check(`runtime:${question}`, result.domain === domain && result.subject === subject && result.mode === mode, JSON.stringify(result));
    outputs.push({ question, ...result, html: undefined });
  }

  const market = await getPage(baseUrl, "Что показывает гравитация BTC?");
  const jupiter = await getPage(baseUrl, "Юпитер как повлиял за 6 месяцев в 2026 году?", contextPacket(market.html));
  check("new_topic_escapes_market_context", jupiter.domain === "astromodule" && jupiter.subject === "jupiter" && jupiter.relation === "NEW_TOPIC", JSON.stringify(jupiter));

  const bridge = await getPage(baseUrl, "А ликвидность это подтверждает?", contextPacket(jupiter.html));
  check("astro_market_bridge", bridge.domain === "astro_btc_bridge" && bridge.subject === "jupiter" && bridge.relation === "CROSS_MODULE_BRIDGE", JSON.stringify(bridge));

  const halving = await getPage(baseUrl, "Теперь вернемся к халвингу", contextPacket(bridge.html));
  check("return_to_protocol", halving.domain === "bitcoin_protocol" && halving.subject === "halving" && halving.relation === "RETURN_TO_PREVIOUS_TOPIC", JSON.stringify(halving));

  const repeatA = await getPage(baseUrl, "Что мне нужно знать о халвинге?");
  const repeatB = await getPage(baseUrl, "Что мне нужно знать о халвинге?");
  check("repeat_determinism", repeatA.domain === repeatB.domain && repeatA.subject === repeatB.subject && repeatA.mode === repeatB.mode);
  check("known_domain_generic_fallback_zero", outputs.every((row) => row.domain !== "btc_market" || !["supply", "halving", "jupiter"].includes(row.subject)));
}
