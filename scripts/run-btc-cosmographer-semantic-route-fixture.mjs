import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const checks = [];

function check(name, passed, details = "") {
  const bounded = String(details).slice(0, 1000);
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
check("explicit_topic_precedence", routeSource.includes("domain !== packet.prior_domain || subject !== packet.prior_subject"));
check("btc_today_market_route", routeSource.includes("btc\\s+today") && routeSource.includes('if (hasBtc) return "btc_market"'));
check("bitcoin_typo_bridge", routeSource.includes("окин") && routeSource.includes('return "astro_btc_bridge"'));
check("genesis_chart_no_fallback", routeSource.includes("bitcoin_genesis_chart"));
check("contextual_volatility", routeSource.includes("isVolatilityQuestion") && routeSource.includes("packet.prior_subject"));
check("protocol_truth", protocolSource.includes("20,999,999.9769") && protocolSource.includes("210,000") && protocolSource.includes("1,050,000"));
check("astro_schema", astroData.schema === "bhrigu_public_astro_evidence_v0_1");
check("astro_range", astroData.range.start === "2026-01-01" && astroData.range.end === "2026-12-31");
check("astro_bodies", ["sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto"].every((body) => astroData.bodies.includes(body)));
check("jupiter_events", astroData.stations.some((item) => item.body === "jupiter" && item.date === "2026-03-11") && astroData.ingresses.some((item) => item.body === "jupiter" && item.date === "2026-06-30"));
check("answer_modes", [
  "PROTOCOL_FACT", "PROTOCOL_EXPLAIN", "MARKET_DIAGNOSIS",
  "ASTRO_INTERVAL", "ASTRO_BTC_BRIDGE", "METHODOLOGY", "NAVIGATION",
].every((value) => protocolSource.includes(`"${value}"`) || answerSource.includes(`"${value}"`)));
check("no_public_jupiter_fallback", !astroSource.includes('route.subject : "jupiter"') && astroSource.includes("does not replace an unknown subject with Jupiter"));
check("chronological_timeline", astroSource.includes("Single chronology") && astroSource.includes("sort((a, b) => a.date.localeCompare(b.date)"));
check("russian_ingress_case", astroSource.includes("вход в знак") && astroSource.includes("SIGN_GENITIVE_RU"));
check("fast_planet_evidence_boundary", astroSource.includes("Месячные доказательные якоря") && astroSource.includes("точная дата в публичном индексе не опубликована"));
check("forecast_boundary", answerSource.includes("Прогнозные окна допустимы только") && componentSource.includes("Прогнозные окна только при валидированном методе"));
check("route_before_market", pageSource.indexOf("routeBtcCosmographerLocalRc") < pageSource.indexOf("composeBtcPublicSnapshot"));
check("market_only_when_needed", pageSource.includes("needsMarket(route)"));
check("generic_section_renderer", componentSource.includes("sections.map") && componentSource.includes("data-answer-section") && componentSource.includes("data-answer-mode"));
check("information_hierarchy", componentSource.includes("answerNextStep") && componentSource.includes("Источники, период и граница") && componentSource.includes("olderTurnsDisclosure"));
check("compact_context", ["cc", "cd", "cs", "ci", "ca", "cm", "ct0", "ct1", "cb"].every((field) => componentSource.includes(`${field}:`)));
check("session_tab_only", sessionSource.includes("window.sessionStorage") && !sessionSource.includes("localStorage") && !sessionSource.includes("indexedDB"));
check("workflow_scope", ["btc-cosmographer-route-graph.ts", "btc-cosmographer-answer.ts", "btc-public-astro-evidence.ts", "run-btc-cosmographer-semantic-route-fixture.mjs"].every((value) => workflowSource.includes(value)));

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
fs.writeFileSync(path.join(root, "artifacts/btc-cosmographer-semantic-route-report.json"), `${JSON.stringify(report, null, 2)}\n`);
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
  return lastMatch(html, new RegExp(`${name}="([^"]*)"`, "g"), name);
}

function contextPacket(html) {
  const packet = {};
  for (const name of ["cc", "cd", "cs", "ci", "ca", "cm", "ct0", "ct1", "cb"]) {
    packet[name] = lastMatch(html, new RegExp(`<input[^>]+name="${name}"[^>]+value="([^"]*)"`, "g"), `context:${name}`);
  }
  return packet;
}

async function getPage(base, question, packet = null) {
  const params = new URLSearchParams({ lang: "ru", q: question });
  if (packet) for (const [key, value] of Object.entries(packet)) params.set(key, value);
  const response = await fetch(`${base}/crypto-astro/btc/live?${params}`, { headers: { "Cache-Control": "no-cache" } });
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
  return JSON.stringify({ domain: result.domain, subject: result.subject, relation: result.relation, mode: result.mode, state: result.state });
}

async function safeCase(base, row) {
  const [question, domain, subject, mode] = row;
  try {
    const result = await getPage(base, question);
    const passed = result.domain === domain && result.subject === subject && result.mode === mode;
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
    ["BTC today", "btc_market", "general_btc_field", "MARKET_DIAGNOSIS"],
    ["Что сейчас с ликвидностью?", "btc_market", "liquidity", "MARKET_DIAGNOSIS"],
    ["Что изменилось с прошлого Snapshot?", "snapshot_memory", "change_memory", "MARKET_DIAGNOSIS"],
    ["аспекты планет", "astromodule", "planetary_aspects", "ASTRO_YEAR_OVERVIEW"],
    ["Какие самые напряженные дни в 2026 году у планет и их аспектов", "astromodule", "planetary_aspects", "ASTRO_YEAR_OVERVIEW"],
    ["как влияет Юпитер на Битокин?", "astro_btc_bridge", "jupiter", "ASTRO_BTC_BRIDGE"],
    ["Уран и его показатели на Биткоин", "astro_btc_bridge", "uranus", "ASTRO_BTC_BRIDGE"],
    ["Меркурий и его движения в 2026 году", "astromodule", "mercury", "ASTRO_INTERVAL"],
    ["Какие источники использует Космограф?", "methodology", "source_and_method", "METHODOLOGY"],
  ];

  const rows = [];
  for (const row of corpus) {
    const result = await safeCase(base, row);
    if (result) rows.push(result);
  }

  const annual = await safeTransition(
    "seed_multi_body_context",
    () => getPage(base, "аспекты планет"),
    (result) => result.domain === "astromodule" && result.subject === "planetary_aspects",
  );
  if (annual) {
    await safeTransition(
      "contextual_volatility_keeps_multi_body_subject",
      () => getPage(base, "какой день наиболее волатильный", contextPacket(annual.html)),
      (result) =>
        result.domain === "astromodule" &&
        result.subject === "planetary_aspects" &&
        result.relation === "FOLLOW_UP" &&
        result.html.includes("Наиболее напряжённое окно 2026"),
    );
  } else {
    check("contextual_volatility_keeps_multi_body_subject", false, "annual context unavailable");
  }

  const mercury = await safeTransition(
    "seed_mercury_context",
    () => getPage(base, "Меркурий и его движения в 2026 году"),
    (result) => result.subject === "mercury",
  );
  if (mercury) {
    await safeTransition(
      "genesis_chart_does_not_inherit_mercury_or_jupiter",
      () => getPage(base, "Где стоят планеты в генезисе карты биткоин", contextPacket(mercury.html)),
      (result) =>
        result.domain === "unsupported" &&
        result.subject === "bitcoin_genesis_chart" &&
        result.mode === "CLARIFICATION" &&
        !result.html.includes("Юпитер: движение"),
    );
    check(
      "mercury_monthly_evidence_visible",
      mercury.html.includes("Месячные доказательные якоря") &&
        mercury.html.includes("точная дата в публичном индексе не опубликована"),
    );
  } else {
    check("genesis_chart_does_not_inherit_mercury_or_jupiter", false, "Mercury context unavailable");
    check("mercury_monthly_evidence_visible", false, "Mercury context unavailable");
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
      () => getPage(base, "Юпитер как двигался за 6 месяцев в 2026 году?", contextPacket(market.html)),
      (result) => result.domain === "astromodule" && result.subject === "jupiter" && result.relation === "NEW_TOPIC",
    );
  } else {
    check("new_topic_escapes_market_context", false, "seed unavailable");
  }
  if (jupiter) {
    await safeTransition(
      "astro_market_bridge",
      () => getPage(base, "А ликвидность это подтверждает?", contextPacket(jupiter.html)),
      (result) => result.domain === "astro_btc_bridge" && result.subject === "jupiter" && result.relation === "CROSS_MODULE_BRIDGE",
    );
  } else {
    check("astro_market_bridge", false, "Jupiter context unavailable");
  }

  try {
    const repeatA = await getPage(base, "Что мне нужно знать о халвинге?");
    const repeatB = await getPage(base, "Что мне нужно знать о халвинге?");
    check("repeat_determinism", compactResult(repeatA) === compactResult(repeatB), `${compactResult(repeatA)} / ${compactResult(repeatB)}`);
  } catch (error) {
    check("repeat_determinism", false, error instanceof Error ? error.message : String(error));
  }

  check("known_domain_generic_fallback_zero", rows.every((row) => !(row.domain === "btc_market" && ["supply", "halving", "jupiter", "saturn", "mercury"].includes(row.subject))));
}
