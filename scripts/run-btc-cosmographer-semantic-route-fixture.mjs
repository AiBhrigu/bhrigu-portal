import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const checks = [];

function check(name, passed, details = "") {
  const bounded = String(details).slice(0, 800);
  checks.push({ name, passed: Boolean(passed), details: bounded });
  console.log(`${passed ? "PASS" : "FAIL"} ${name}${bounded ? ` · ${bounded}` : ""}`);
}

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
check("domains", [
  "bitcoin_protocol", "btc_market", "snapshot_memory", "astromodule",
  "astro_btc_bridge", "methodology", "navigation",
].every((value) => routeSource.includes(`"${value}"`)));
check("context_relations", [
  "NEW_TOPIC", "FOLLOW_UP", "CROSS_MODULE_BRIDGE",
  "RETURN_TO_PREVIOUS_TOPIC", "GENUINELY_AMBIGUOUS",
].every((value) => routeSource.includes(`"${value}"`)));
check(
  "explicit_topic_precedence",
  routeSource.includes("domain !== packet.prior_domain || subject !== packet.prior_subject"),
);
check(
  "protocol_truth",
  protocolSource.includes("20,999,999.9769") &&
    protocolSource.includes("210,000") &&
    protocolSource.includes("1,050,000"),
);
check("astro_schema", astroData.schema === "bhrigu_public_astro_evidence_v0_1");
check(
  "astro_range",
  astroData.range.start === "2026-01-01" && astroData.range.end === "2026-12-31",
);
check(
  "astro_bodies",
  ["sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto"]
    .every((body) => astroData.bodies.includes(body)),
);
check(
  "jupiter_events",
  astroData.stations.some((item) => item.body === "jupiter" && item.date === "2026-03-11") &&
    astroData.ingresses.some((item) => item.body === "jupiter" && item.date === "2026-06-30"),
);
check(
  "answer_modes",
  [
    "PROTOCOL_FACT", "PROTOCOL_EXPLAIN", "MARKET_DIAGNOSIS",
    "ASTRO_INTERVAL", "ASTRO_BTC_BRIDGE", "METHODOLOGY", "NAVIGATION",
  ].every((value) => protocolSource.includes(`"${value}"`) || answerSource.includes(`"${value}"`)),
);
check(
  "astro_causality_boundary",
  astroSource.includes("не превращается в причинное утверждение") &&
    astroSource.includes("does not turn it into a causal claim"),
);
check(
  "route_before_market",
  pageSource.indexOf("routeBtcCosmographerQuestion") < pageSource.indexOf("composeBtcPublicSnapshot"),
);
check("market_only_when_needed", pageSource.includes("needsMarket(route)"));
check(
  "generic_section_renderer",
  componentSource.includes("sections.map") &&
    componentSource.includes("data-answer-section") &&
    componentSource.includes("data-answer-mode"),
);
check(
  "compact_context",
  ["cc", "cd", "cs", "ci", "ca", "cm", "ct0", "ct1", "cb"]
    .every((field) => componentSource.includes(`${field}:`)),
);
check(
  "session_tab_only",
  sessionSource.includes("window.sessionStorage") &&
    !sessionSource.includes("localStorage") &&
    !sessionSource.includes("indexedDB"),
);
check(
  "workflow_scope",
  [
    "btc-cosmographer-route-graph.ts", "btc-protocol-evidence.ts",
    "btc-public-astro-evidence.ts", "btc_public_astro_evidence_v0_1.json",
  ].every((value) => workflowSource.includes(value)),
);

const previewBase = process.env.BTC_COSMOGRAPHER_PREVIEW_BASE?.replace(/\/$/, "");
if (previewBase) await runRuntime(previewBase);

const failures = checks.filter((item) => !item.passed);
const report = {
  schema: "btc_cosmographer_semantic_route_report_v0_1",
  status: failures.length ? "FAIL" : "PASS",
  runtime_head_sha: process.env.BTC_COSMOGRAPHER_RUNTIME_HEAD_SHA ?? "LOCAL",
  check_count: checks.length,
  failure_count: failures.length,
  checks,
};
fs.mkdirSync(path.join(root, "artifacts"), { recursive: true });
fs.writeFileSync(
  path.join(root, "artifacts/btc-cosmographer-semantic-route-report.json"),
  `${JSON.stringify(report, null, 2)}\n`,
);
if (failures.length) process.exit(1);
console.log("BTC_COSMOGRAPHER_SEMANTIC_ROUTE=PASS");

function decode(value) {
  return value
    .replaceAll("&quot;", '"')
    .replaceAll("&#x27;", "'")
    .replaceAll("&#39;", "'")
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">");
}

function lastMatch(html, pattern, label) {
  const matches = Array.from(html.matchAll(pattern));
  if (!matches.length) throw new Error(`missing ${label}`);
  return decode(matches[matches.length - 1][1]);
}

function attr(html, name) {
  return lastMatch(
    html,
    new RegExp(`${name}="([^"]*)"`, "g"),
    name,
  );
}

function contextPacket(html) {
  const packet = {};
  for (const name of ["cc", "cd", "cs", "ci", "ca", "cm", "ct0", "ct1", "cb"]) {
    packet[name] = lastMatch(
      html,
      new RegExp(`<input[^>]+name="${name}"[^>]+value="([^"]*)"`, "g"),
      `context:${name}`,
    );
  }
  return packet;
}

async function getPage(base, question, packet = null) {
  const params = new URLSearchParams({ lang: "ru", q: question });
  if (packet) {
    for (const [key, value] of Object.entries(packet)) params.set(key, value);
  }
  const response = await fetch(`${base}/crypto-astro/btc/live?${params}`, {
    headers: { "Cache-Control": "no-cache" },
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const html = await response.text();
  return {
    html,
    domain: attr(html, "data-route-domain"),
    subject: attr(html, "data-route-subject"),
    relation: attr(html, "data-context-relation"),
    mode: attr(html, "data-answer-mode"),
    state: attr(html, "data-answer-state"),
  };
}

function compactResult(result) {
  return JSON.stringify({
    domain: result.domain,
    subject: result.subject,
    relation: result.relation,
    mode: result.mode,
    state: result.state,
  });
}

async function safeCase(base, row) {
  const [question, domain, subject, mode] = row;
  try {
    const result = await getPage(base, question);
    const passed =
      result.domain === domain &&
      result.subject === subject &&
      result.mode === mode;
    check(`runtime:${question}`, passed, compactResult(result));
    return { question, ...result };
  } catch (error) {
    check(`runtime:${question}`, false, error instanceof Error ? error.message : String(error));
    return null;
  }
}

async function safeTransition(name, operation, predicate) {
  try {
    const result = await operation();
    check(name, predicate(result), compactResult(result));
    return result;
  } catch (error) {
    check(name, false, error instanceof Error ? error.message : String(error));
    return null;
  }
}

async function runRuntime(base) {
  const corpus = [
    ["Какое количество монет BTC?", "bitcoin_protocol", "supply", "PROTOCOL_FACT"],
    ["Что мне нужно знать о халвинге?", "bitcoin_protocol", "halving", "PROTOCOL_EXPLAIN"],
    ["Как работают комиссии Bitcoin?", "bitcoin_protocol", "fees", "PROTOCOL_EXPLAIN"],
    ["Что такое UTXO?", "bitcoin_protocol", "utxo", "PROTOCOL_EXPLAIN"],
    ["How many BTC can exist?", "bitcoin_protocol", "supply", "PROTOCOL_FACT"],
    ["What should I know about halving?", "bitcoin_protocol", "halving", "PROTOCOL_EXPLAIN"],
    ["Что показывает гравитация BTC?", "btc_market", "btc_gravity", "MARKET_DIAGNOSIS"],
    ["Что сейчас с ликвидностью?", "btc_market", "liquidity", "MARKET_DIAGNOSIS"],
    ["Какова структура рынка BTC?", "btc_market", "market_structure", "MARKET_DIAGNOSIS"],
    ["Что изменилось с прошлого Snapshot?", "snapshot_memory", "change_memory", "MARKET_DIAGNOSIS"],
    ["Юпитер как повлиял за 6 месяцев в 2026 году?", "astromodule", "jupiter", "ASTRO_INTERVAL"],
    ["Как двигался Сатурн в 2026 году?", "astromodule", "saturn", "ASTRO_INTERVAL"],
    ["How did Jupiter move in the first six months of 2026?", "astromodule", "jupiter", "ASTRO_INTERVAL"],
    ["Какие источники использует Космограф?", "methodology", "source_and_method", "METHODOLOGY"],
    ["Какие вопросы можно задавать?", "navigation", "capabilities", "NAVIGATION"],
  ];

  const rows = [];
  for (const row of corpus) {
    const result = await safeCase(base, row);
    if (result) rows.push(result);
  }

  const market = await safeTransition(
    "seed_market_context",
    () => getPage(base, "Что показывает гравитация BTC?"),
    (result) => result.domain === "btc_market" && result.subject === "btc_gravity",
  );

  let jupiter = null;
  if (market) {
    jupiter = await safeTransition(
      "new_topic_escapes_market_context",
      () => getPage(
        base,
        "Юпитер как повлиял за 6 месяцев в 2026 году?",
        contextPacket(market.html),
      ),
      (result) =>
        result.domain === "astromodule" &&
        result.subject === "jupiter" &&
        result.relation === "NEW_TOPIC",
    );
  } else {
    check("new_topic_escapes_market_context", false, "seed unavailable");
  }

  let bridge = null;
  if (jupiter) {
    bridge = await safeTransition(
      "astro_market_bridge",
      () => getPage(base, "А ликвидность это подтверждает?", contextPacket(jupiter.html)),
      (result) =>
        result.domain === "astro_btc_bridge" &&
        result.subject === "jupiter" &&
        result.relation === "CROSS_MODULE_BRIDGE",
    );
  } else {
    check("astro_market_bridge", false, "Jupiter context unavailable");
  }

  if (bridge) {
    await safeTransition(
      "return_to_protocol",
      () => getPage(base, "Теперь вернемся к халвингу", contextPacket(bridge.html)),
      (result) =>
        result.domain === "bitcoin_protocol" &&
        result.subject === "halving" &&
        result.relation === "RETURN_TO_PREVIOUS_TOPIC",
    );
  } else {
    check("return_to_protocol", false, "bridge context unavailable");
  }

  if (market) {
    await safeTransition(
      "market_follow_up",
      () => getPage(base, "Почему это важно?", contextPacket(market.html)),
      (result) =>
        result.domain === "btc_market" &&
        result.subject === "btc_gravity" &&
        result.relation === "FOLLOW_UP",
    );
  } else {
    check("market_follow_up", false, "market context unavailable");
  }

  try {
    const repeatA = await getPage(base, "Что мне нужно знать о халвинге?");
    const repeatB = await getPage(base, "Что мне нужно знать о халвинге?");
    check(
      "repeat_determinism",
      repeatA.domain === repeatB.domain &&
        repeatA.subject === repeatB.subject &&
        repeatA.mode === repeatB.mode &&
        repeatA.state === repeatB.state,
      `${compactResult(repeatA)} / ${compactResult(repeatB)}`,
    );
  } catch (error) {
    check("repeat_determinism", false, error instanceof Error ? error.message : String(error));
  }

  check(
    "known_domain_generic_fallback_zero",
    rows.every((row) =>
      !(row.domain === "btc_market" &&
        ["supply", "halving", "jupiter", "saturn"].includes(row.subject))),
  );

  const signatures = new Map();
  for (const row of rows) {
    if (!signatures.has(row.domain)) {
      signatures.set(row.domain, `${row.subject}:${row.mode}`);
    }
  }
  check(
    "cross_domain_exact_answer_duplicates_zero",
    new Set(signatures.values()).size === signatures.size,
  );
}
