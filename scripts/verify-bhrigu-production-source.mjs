#!/usr/bin/env node

import { writeFile } from "node:fs/promises";
import { URL } from "node:url";

const EXIT = {
  PASS: 0,
  STALE_SOURCE: 20,
  REQUEST_FAILURE: 21,
  CONTRACT_FAILURE: 22,
  INVALID_INPUT: 23,
};

function parseArgs(argv) {
  const values = new Map();
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) continue;
    const key = token.slice(2);
    const value = argv[index + 1];
    if (!value || value.startsWith("--")) throw new Error(`Missing value for --${key}`);
    values.set(key, value);
    index += 1;
  }
  return {
    baseUrl: values.get("base-url"),
    expectedSha: values.get("expected-sha"),
    mode: values.get("mode") ?? "production",
    reportPath: values.get("report") ?? "bhrigu-production-source-proof.json",
    attempts: Number(values.get("attempts") ?? "1"),
    delayMs: Number(values.get("delay-ms") ?? "0"),
  };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function escaped(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function hasMeta(html, name, content) {
  const tagPattern = new RegExp(`<meta\\b[^>]*\\bname=["']${escaped(name)}["'][^>]*>`, "i");
  const tag = html.match(tagPattern)?.[0] ?? "";
  return new RegExp(`\\bcontent=["']${escaped(content)}["']`, "i").test(tag);
}

async function requestHtml(url) {
  const response = await fetch(url, {
    headers: {
      "cache-control": "no-cache",
      pragma: "no-cache",
      "user-agent": "ORION-BHRIGU-Exact-SHA-Verifier/0.1",
    },
    redirect: "follow",
    signal: AbortSignal.timeout(30_000),
  });
  return {
    status: response.status,
    finalUrl: response.url,
    html: await response.text(),
  };
}

function overviewChecks({ html, status, finalUrl }, base, expectedSha, mode) {
  const final = new URL(finalUrl);
  const expectedHost = new URL(base).host;
  const gatewayText = /Start free dialogue|Начать бесплатный диалог/i.test(html);
  const legacyEmbeddedForm = /<form\b[^>]*action=["']\/crypto-astro\/btc["']/i.test(html)
    || /Run BTC Field Read/i.test(html);
  return {
    http_200: status === 200,
    route_preserved: final.pathname === "/crypto-astro/btc",
    production_host_preserved: mode !== "production" || final.host === expectedHost,
    static_proof_marker: /data-btc-static-proof=["']true["']/i.test(html),
    head_source_meta: hasMeta(html, "btc-deployment-source-sha", expectedSha),
    main_source_attribute: new RegExp(`data-deployment-source-sha=["']${escaped(expectedSha)}["']`, "i").test(html),
    visible_source_prefix: html.includes(expectedSha.slice(0, 12)),
    dialogue_gateway: gatewayText,
    legacy_embedded_form_absent: !legacyEmbeddedForm,
  };
}

function liveChecks({ html, status, finalUrl }, base, expectedSha, mode) {
  const final = new URL(finalUrl);
  const expectedHost = new URL(base).host;
  return {
    http_200: status === 200,
    route_preserved: final.pathname === "/crypto-astro/btc/live",
    production_host_preserved: mode !== "production" || final.host === expectedHost,
    live_meta: hasMeta(html, "btc-live-dialogue", "free-question-v0-1"),
    head_source_meta: hasMeta(html, "btc-deployment-source-sha", expectedSha),
    dialogue_root: /data-live-dialogue=["']btc-free-question["']/i.test(html),
    question_class: /data-question-class=["'][^"']+["']/i.test(html),
    direct_answer: /data-answer-direct=["']true["']/i.test(html),
    evidence_section: /data-answer-section=["']evidence["']/i.test(html),
    limit_section: /data-answer-section=["']limit["']/i.test(html),
    change_section: /data-answer-section=["']change["']/i.test(html),
    source_boundary: /data-answer-source-boundary=["']true["']/i.test(html),
    generic_mixed_signals_absent: !/Mixed signals/i.test(html),
  };
}

function classify(overview, live) {
  const allChecks = [...Object.values(overview.checks), ...Object.values(live.checks)];
  if (allChecks.every(Boolean)) return "PASS";
  const requestsHealthy = overview.checks.http_200 && live.checks.http_200
    && overview.checks.route_preserved && live.checks.route_preserved;
  const exactSourceMissing = !overview.checks.head_source_meta
    || !overview.checks.main_source_attribute
    || !overview.checks.static_proof_marker;
  if (requestsHealthy && exactSourceMissing) return "STALE_SOURCE";
  return "CONTRACT_FAILURE";
}

async function main() {
  let args;
  try {
    args = parseArgs(process.argv.slice(2));
    if (!args.baseUrl) throw new Error("--base-url is required");
    if (!args.expectedSha || !/^[0-9a-f]{40}$/i.test(args.expectedSha)) throw new Error("--expected-sha must be a 40-character hexadecimal SHA");
    if (!new Set(["staged", "production"]).has(args.mode)) throw new Error("--mode must be staged or production");
    if (!Number.isInteger(args.attempts) || args.attempts < 1 || args.attempts > 60) throw new Error("--attempts must be an integer from 1 to 60");
    if (!Number.isInteger(args.delayMs) || args.delayMs < 0 || args.delayMs > 60_000) throw new Error("--delay-ms must be an integer from 0 to 60000");
  } catch (error) {
    console.error(`INVALID_INPUT: ${error.message}`);
    process.exit(EXIT.INVALID_INPUT);
  }

  const base = args.baseUrl.replace(/\/$/, "");
  let lastReport = null;

  for (let attempt = 1; attempt <= args.attempts; attempt += 1) {
    const cacheKey = `${Date.now()}-${attempt}`;
    const overviewUrl = `${base}/crypto-astro/btc?lang=en&__exact_sha=${cacheKey}`;
    const liveUrl = `${base}/crypto-astro/btc/live?lang=en&q=${encodeURIComponent("What currently drives BTC gravity?")}&__exact_sha=${cacheKey}`;

    try {
      const [overviewResponse, liveResponse] = await Promise.all([
        requestHtml(overviewUrl),
        requestHtml(liveUrl),
      ]);
      const overview = {
        url: overviewResponse.finalUrl,
        status: overviewResponse.status,
        checks: overviewChecks(overviewResponse, base, args.expectedSha, args.mode),
      };
      const live = {
        url: liveResponse.finalUrl,
        status: liveResponse.status,
        checks: liveChecks(liveResponse, base, args.expectedSha, args.mode),
      };
      const classification = classify(overview, live);
      lastReport = {
        schema_version: "bhrigu_exact_sha_production_source_proof_v0_1",
        classification,
        mode: args.mode,
        expected_sha: args.expectedSha,
        expected_sha_prefix: args.expectedSha.slice(0, 12),
        attempt,
        generated_at_utc: new Date().toISOString(),
        overview,
        live,
      };
      if (classification === "PASS") break;
    } catch (error) {
      lastReport = {
        schema_version: "bhrigu_exact_sha_production_source_proof_v0_1",
        classification: "REQUEST_FAILURE",
        mode: args.mode,
        expected_sha: args.expectedSha,
        expected_sha_prefix: args.expectedSha.slice(0, 12),
        attempt,
        generated_at_utc: new Date().toISOString(),
        error_code: error?.name ?? "Error",
        error_message: String(error?.message ?? error),
      };
    }

    if (attempt < args.attempts) await sleep(args.delayMs);
  }

  await writeFile(args.reportPath, `${JSON.stringify(lastReport, null, 2)}\n`, "utf8");
  console.log(`BHRIGU_PRODUCTION_SOURCE=${lastReport.classification} expected_sha=${args.expectedSha} report=${args.reportPath}`);

  if (lastReport.classification === "PASS") process.exit(EXIT.PASS);
  if (lastReport.classification === "STALE_SOURCE") process.exit(EXIT.STALE_SOURCE);
  if (lastReport.classification === "REQUEST_FAILURE") process.exit(EXIT.REQUEST_FAILURE);
  process.exit(EXIT.CONTRACT_FAILURE);
}

await main();
