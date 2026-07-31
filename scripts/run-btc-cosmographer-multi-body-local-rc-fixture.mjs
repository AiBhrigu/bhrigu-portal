import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const checks = [];

function check(name, passed, details = "") {
  const bounded = String(details).slice(0, 900);
  checks.push({ name, passed: Boolean(passed), details: bounded });
  console.log(`${passed ? "PASS" : "FAIL"} ${name}${bounded ? ` · ${bounded}` : ""}`);
}

const moduleSource = read("lib/btc-cosmographer-multi-body-astro-rc.ts");
const pageSource = read("pages/crypto-astro/btc/local-rc.tsx");
const componentSource = read("components/btc/BtcCosmographerMultiBodyAstroRc.tsx");
const workflowSource = read(".github/workflows/btc-cosmographer-multi-body-local-rc-pr.yml");
const astroData = JSON.parse(read("data/btc_public_astro_evidence_v0_1.json"));

check("local_env_gate", pageSource.includes('process.env.BTC_LOCAL_RC !== "1"'));
check("production_route_untouched", !pageSource.includes('pages/crypto-astro/btc/live.tsx'));
check("multi_body_subject", moduleSource.includes('subject: "planetary_aspects"'));
check("multi_body_scope", moduleSource.includes('rc_scope: "MULTI_BODY"'));
check("year_overview_mode", moduleSource.includes('"ASTRO_YEAR_OVERVIEW"'));
check("salience_dimensions", [
  "slowScale", "exactness", "durationDays", "overlapCount", "cluster",
].every((value) => moduleSource.includes(value)));
check("jupiter_default_absent", !moduleSource.includes('? route.subject : "jupiter"'));
check("chronological_sort", moduleSource.includes('sort((a, b) => a.start.localeCompare(b.start))'));
check("no_causality_boundary", moduleSource.includes("не доказывает причинное влияние на BTC"));
check("compact_astro_memory", ["rad", "ras", "rat0", "rat1"].every((value) => componentSource.includes(`name=\"${value}\"`)));
check("no_transcript_transport", !componentSource.includes("transcript") || componentSource.includes("without transporting the transcript"));
check("noindex", pageSource.includes('noindex,nofollow,noarchive'));
check("public_2026_evidence", astroData.range.start === "2026-01-01" && astroData.range.end === "2026-12-31");
check("expected_aspect_inventory", astroData.aspects.length === 9);
check("july_cluster_source", ["2026-07-20", "2026-07-21"].every((date) => astroData.aspects.some((row) => row.peak === date)));
check("slow_context_source", astroData.aspects.some((row) => row.a === "neptune" && row.b === "pluto"));
check("workflow_local_gate", workflowSource.includes("BTC_LOCAL_RC: \"1\""));
check("workflow_runtime_fixture", workflowSource.includes("BTC_COSMOGRAPHER_LOCAL_RC_BASE"));

const previewBase = process.env.BTC_COSMOGRAPHER_LOCAL_RC_BASE?.replace(/\/$/, "");
if (previewBase) await runRuntime(previewBase);

const failures = checks.filter((item) => !item.passed);
const report = {
  schema: "btc_cosmographer_multi_body_astro_local_rc_report_v0_1",
  status: failures.length ? "FAIL" : "PASS",
  runtime_head_sha: process.env.BTC_COSMOGRAPHER_RUNTIME_HEAD_SHA ?? "LOCAL",
  check_count: checks.length,
  failure_count: failures.length,
  checks,
};
fs.mkdirSync(path.join(root, "artifacts"), { recursive: true });
fs.writeFileSync(
  path.join(root, "artifacts/btc-cosmographer-multi-body-local-rc-report.json"),
  `${JSON.stringify(report, null, 2)}\n`,
);
if (failures.length) process.exit(1);
console.log("BTC_COSMOGRAPHER_MULTI_BODY_LOCAL_RC=PASS");

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

function hidden(html, name) {
  return lastMatch(
    html,
    new RegExp(`<input[^>]+name="${name}"[^>]+value="([^"]*)"`, "g"),
    `hidden:${name}`,
  );
}

function packet(html) {
  const result = {};
  for (const name of ["cc", "cd", "cs", "ci", "ca", "cm", "ct0", "ct1", "cb", "rad", "ras", "rat0", "rat1"]) {
    try {
      result[name] = hidden(html, name);
    } catch {
      result[name] = "";
    }
  }
  return result;
}

async function getPage(base, question, prior = null) {
  const params = new URLSearchParams({ lang: "ru", q: question });
  if (prior) {
    for (const [key, value] of Object.entries(prior)) {
      if (value) params.set(key, value);
    }
  }
  const response = await fetch(`${base}/crypto-astro/btc/local-rc?${params}`, {
    headers: { "Cache-Control": "no-cache" },
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const html = await response.text();
  return {
    html,
    domain: attr(html, "data-route-domain"),
    subject: attr(html, "data-route-subject"),
    scope: attr(html, "data-route-scope"),
    relation: attr(html, "data-context-relation"),
    mode: attr(html, "data-answer-mode"),
    state: attr(html, "data-answer-state"),
  };
}

function compact(result) {
  return JSON.stringify({
    domain: result.domain,
    subject: result.subject,
    scope: result.scope,
    relation: result.relation,
    mode: result.mode,
    state: result.state,
  });
}

async function transition(name, operation, predicate) {
  try {
    const result = await operation();
    check(name, predicate(result), compact(result));
    return result;
  } catch (error) {
    check(name, false, error instanceof Error ? error.message : String(error));
    return null;
  }
}

async function runRuntime(base) {
  const overview = await transition(
    "runtime_multi_body_overview_ru",
    () => getPage(base, "Какие аспекты планет важны в 2026 году?"),
    (result) =>
      result.domain === "astromodule" &&
      result.subject === "planetary_aspects" &&
      result.scope === "MULTI_BODY" &&
      result.relation === "NEW_TOPIC" &&
      result.mode === "ASTRO_YEAR_OVERVIEW" &&
      result.state === "CONFIRMED",
  );

  if (overview) {
    check("runtime_no_jupiter_fallback", !overview.html.includes("Юпитер: движение в периоде"));
    check("runtime_salience_explained", overview.html.includes("Почему выбраны именно эти окна"));
    check("runtime_july_cluster_visible", overview.html.includes("2026-07-20") && overview.html.includes("2026-07-21"));
    const jan = overview.html.indexOf("2026-01-08");
    const apr = overview.html.indexOf("2026-04-02");
    const jun = overview.html.indexOf("2026-06-05");
    const jul = overview.html.indexOf("2026-07-04");
    check(
      "runtime_chronological_windows",
      jan >= 0 && apr > jan && jun > apr && jul > jun,
      `${jan}/${apr}/${jun}/${jul}`,
    );
  }

  const why = overview
    ? await transition(
        "runtime_follow_up_significance",
        () => getPage(base, "Почему это важно?", packet(overview.html)),
        (result) =>
          result.domain === "astromodule" &&
          result.subject === "planetary_aspects" &&
          result.relation === "FOLLOW_UP" &&
          result.mode === "ASTRO_YEAR_OVERVIEW",
      )
    : null;

  const bridge = why
    ? await transition(
        "runtime_liquidity_bridge",
        () => getPage(base, "А ликвидность это подтверждает?", packet(why.html)),
        (result) =>
          result.domain === "astro_btc_bridge" &&
          result.subject === "planetary_aspects" &&
          result.relation === "CROSS_MODULE_BRIDGE" &&
          result.mode === "ASTRO_BTC_BRIDGE",
      )
    : null;

  const halving = bridge
    ? await transition(
        "runtime_explicit_halving_topic",
        () => getPage(base, "Теперь о халвинге", packet(bridge.html)),
        (result) =>
          result.domain === "bitcoin_protocol" &&
          result.subject === "halving" &&
          result.mode === "PROTOCOL_EXPLAIN",
      )
    : null;

  if (halving) {
    await transition(
      "runtime_return_to_aspects",
      () => getPage(base, "Вернёмся к аспектам", packet(halving.html)),
      (result) =>
        result.domain === "astromodule" &&
        result.subject === "planetary_aspects" &&
        result.relation === "RETURN_TO_PREVIOUS_TOPIC" &&
        result.mode === "ASTRO_YEAR_OVERVIEW",
    );
  }

  await transition(
    "runtime_multi_body_overview_en",
    () => getPage(base, "Which planetary aspects matter in 2026?"),
    (result) =>
      result.domain === "astromodule" &&
      result.subject === "planetary_aspects" &&
      result.scope === "MULTI_BODY" &&
      result.mode === "ASTRO_YEAR_OVERVIEW",
  );
}
