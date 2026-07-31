import fs from "node:fs";
import path from "node:path";

const base = (process.env.BTC_COSMOGRAPHER_PINNED_V05_BASE ?? "http://127.0.0.1:4185").replace(/\/$/, "");
const pinnedSourceSha = process.env.BTC_COSMOGRAPHER_PINNED_SOURCE_SHA ?? "UNKNOWN";
const overlayHeadSha = process.env.BTC_COSMOGRAPHER_OVERLAY_HEAD_SHA ?? "UNKNOWN";
const outDir = path.resolve(process.env.BTC_COSMOGRAPHER_PINNED_V05_ARTIFACT_DIR ?? "artifacts/btc-pinned-v0.5");
const checks = [];
const turns = [];

function check(name, passed, details = "") {
  checks.push({ name, passed: Boolean(passed), details: String(details).slice(0, 1200) });
  console.log(`${passed ? "PASS" : "FAIL"} ${name}${details ? ` · ${String(details).slice(0, 240)}` : ""}`);
}

function decode(value) {
  return value
    .replaceAll("&quot;", '"')
    .replaceAll("&#x27;", "'")
    .replaceAll("&#39;", "'")
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&nbsp;", " ");
}

function stripHtml(value) {
  return decode(value)
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
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

async function getPage(locale, question, prior = null) {
  const params = new URLSearchParams({ lang: locale, q: question });
  if (prior) {
    for (const [key, value] of Object.entries(prior)) {
      if (value) params.set(key, value);
    }
  }
  const response = await fetch(`${base}/crypto-astro/btc/local-rc?${params}`, {
    headers: { "Cache-Control": "no-cache" },
  });
  if (!response.ok) throw new Error(`HTTP ${response.status} for ${question}`);
  const html = await response.text();
  const result = {
    locale,
    question,
    html,
    text: stripHtml(html),
    domain: attr(html, "data-route-domain"),
    subject: attr(html, "data-route-subject"),
    scope: attr(html, "data-route-scope"),
    relation: attr(html, "data-context-relation"),
    mode: attr(html, "data-answer-mode"),
    state: attr(html, "data-answer-state"),
  };
  turns.push(result);
  return result;
}

function routeSummary(turn) {
  return `${turn.domain}/${turn.subject}/${turn.scope}/${turn.relation}/${turn.mode}/${turn.state}`;
}

function assertRoute(name, turn, expected) {
  const passed = Object.entries(expected).every(([key, value]) => turn[key] === value);
  check(name, passed, routeSummary(turn));
}

const overview = await getPage("ru", "Какие аспекты планет важны в 2026 году?");
assertRoute("turn_1_ru_overview_route", overview, {
  domain: "astromodule",
  subject: "planetary_aspects",
  scope: "MULTI_BODY",
  relation: "NEW_TOPIC",
  mode: "ASTRO_YEAR_OVERVIEW",
  state: "CONFIRMED",
});
check("overview_no_jupiter_fallback", !overview.text.includes("Юпитер: движение в периоде"));
check("overview_has_ranked_windows", overview.text.includes("Планетарные аспекты 2026") && overview.text.includes("Главные окна"));
check("overview_july_cluster_complete", overview.text.includes("2026-07-20") && overview.text.includes("2026-07-21"));
check("overview_unique_transition_count", overview.text.includes("2 пересечения со станциями/ингрессиями"));
check("overview_exact_aspect_morphology", overview.text.includes("3 точных аспекта"));
check("overview_ingress_cases", ["знак Овна", "знак Близнецов", "знак Льва"].every((value) => overview.text.includes(value)));
check("overview_market_source_boundary", overview.text.includes("не используется в этом ответе"));
check("overview_interpretation_boundary", overview.text.includes("не доказывает причинное влияние на BTC") && overview.text.includes("не создаёт торговый сигнал"));
const chronology = ["2026-01-08", "2026-04-02", "2026-06-05", "2026-07-04"].map((value) => overview.text.indexOf(value));
check("overview_chronological_order", chronology.every((value, index) => value >= 0 && (index === 0 || value > chronology[index - 1])), chronology.join("/"));
check("overview_december_13_complete", overview.text.split("2026-12-13").length - 1 >= 2);

const why = await getPage("ru", "Почему это важно?", packet(overview.html));
assertRoute("turn_2_follow_up_route", why, {
  domain: "astromodule",
  subject: "planetary_aspects",
  scope: "MULTI_BODY",
  relation: "FOLLOW_UP",
  mode: "ASTRO_YEAR_OVERVIEW",
  state: "CONFIRMED",
});
check("turn_2_preserves_salience_method", why.text.includes("Почему выбраны именно эти окна"));

const bridge = await getPage("ru", "А ликвидность это подтверждает?", packet(why.html));
assertRoute("turn_3_bridge_route", bridge, {
  domain: "astro_btc_bridge",
  subject: "planetary_aspects",
  scope: "MULTI_BODY",
  relation: "CROSS_MODULE_BRIDGE",
  mode: "ASTRO_BTC_BRIDGE",
  state: "SPLIT",
});
check("turn_3_layers_remain_independent", bridge.text.includes("независим") && bridge.text.includes("не меняет астрономический факт"));

const halving = await getPage("ru", "Теперь о халвинге", packet(bridge.html));
assertRoute("turn_4_halving_route", halving, {
  domain: "bitcoin_protocol",
  subject: "halving",
  relation: "NEW_TOPIC",
  mode: "PROTOCOL_EXPLAIN",
});
check("turn_4_no_astrology_leak", !halving.text.includes("3 точных аспекта"));

const returned = await getPage("ru", "Вернёмся к аспектам", packet(halving.html));
assertRoute("turn_5_return_route", returned, {
  domain: "astromodule",
  subject: "planetary_aspects",
  scope: "MULTI_BODY",
  relation: "RETURN_TO_PREVIOUS_TOPIC",
  mode: "ASTRO_YEAR_OVERVIEW",
  state: "CONFIRMED",
});
check("turn_5_restores_corrected_overview", returned.text.includes("2 пересечения со станциями/ингрессиями") && returned.text.includes("3 точных аспекта"));

const english = await getPage("en", "Which planetary aspects matter in 2026?");
assertRoute("turn_6_en_overview_route", english, {
  domain: "astromodule",
  subject: "planetary_aspects",
  scope: "MULTI_BODY",
  relation: "NEW_TOPIC",
  mode: "ASTRO_YEAR_OVERVIEW",
  state: "CONFIRMED",
});
check("turn_6_en_boundary", english.text.includes("does not prove a causal effect on BTC") && english.text.includes("trading signal"));
check("turn_6_en_source_usage", english.text.includes("not used in this answer"));

const failures = checks.filter((item) => !item.passed);
const report = {
  schema: "btc_cosmographer_multi_body_local_linux_pinned_v0_5_semantic_acceptance_v0_1",
  node: "BTC_COSMOGRAPHER_MULTI_BODY_ASTRO_CORRIDOR_LOCAL_LINUX_PINNED_V0_5_ACCEPTANCE_v0_1",
  status: failures.length ? "FAIL" : "PASS",
  pinned_source_sha: pinnedSourceSha,
  overlay_head_sha: overlayHeadSha,
  base,
  check_count: checks.length,
  failure_count: failures.length,
  checks,
  turns: turns.map(({ html, ...turn }) => turn),
};

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, "semantic-acceptance-report.json"), `${JSON.stringify(report, null, 2)}\n`);

const escapeHtml = (value) => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;");

const rows = turns.map((turn, index) => `
<section>
  <h2>${index + 1}. ${escapeHtml(turn.question)}</h2>
  <div class="route">${escapeHtml(routeSummary(turn))}</div>
  <p>${escapeHtml(turn.text)}</p>
</section>`).join("\n");
const checkRows = checks.map((item) => `<tr><td>${item.passed ? "PASS" : "FAIL"}</td><td>${escapeHtml(item.name)}</td><td>${escapeHtml(item.details)}</td></tr>`).join("\n");
const html = `<!doctype html>
<html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>BTC Cosmographer · Pinned v0.5 Acceptance</title>
<style>body{margin:0;background:#080a0e;color:#edf1f6;font:15px/1.6 system-ui,sans-serif}main{width:min(1080px,calc(100% - 30px));margin:auto;padding:30px 0 70px}h1{font-size:clamp(30px,5vw,58px);line-height:1.05}.meta,.route{color:#93a4b7;font-family:ui-monospace,monospace;font-size:12px}.status{display:inline-block;padding:7px 11px;border:1px solid #3a4a5e;border-radius:999px}section{margin:18px 0;padding:20px;border:1px solid #293544;border-radius:14px;background:#0d1219}table{width:100%;border-collapse:collapse;margin-top:24px}th,td{border-bottom:1px solid #26313e;padding:9px;text-align:left;vertical-align:top}p{white-space:pre-wrap;color:#c3ccd7}</style></head><body><main>
<div class="status">${report.status} · ${report.check_count - report.failure_count}/${report.check_count}</div>
<h1>BTC Cosmographer · Pinned v0.5</h1>
<div class="meta">PINNED_SOURCE_SHA=${escapeHtml(pinnedSourceSha)}<br>OVERLAY_HEAD_SHA=${escapeHtml(overlayHeadSha)}<br>LOCAL_BASE=${escapeHtml(base)}</div>
${rows}
<h2>Acceptance checks</h2><table><thead><tr><th>Status</th><th>Check</th><th>Details</th></tr></thead><tbody>${checkRows}</tbody></table>
</main></body></html>`;
fs.writeFileSync(path.join(outDir, "one-tab-semantic-acceptance.html"), html);
fs.writeFileSync(path.join(outDir, "semantic-transcript.txt"), turns.map((turn, index) => `${index + 1}. ${turn.question}\n${routeSummary(turn)}\n${turn.text}\n`).join("\n"));

if (failures.length) {
  console.error(`PINNED_V0_5_SEMANTIC_ACCEPTANCE=FAIL (${failures.length})`);
  process.exit(1);
}
console.log(`PINNED_V0_5_SEMANTIC_ACCEPTANCE=PASS (${checks.length}/${checks.length})`);
