#!/usr/bin/env node

import { writeFile } from "node:fs/promises";
import { URL } from "node:url";

const EXIT = { PASS: 0, STALE_SOURCE: 20, REQUEST_FAILURE: 21, CONTRACT_FAILURE: 22, INVALID_INPUT: 23 };
const FREY_REPAIR = "__FREY_MOBILE_RESULT_CONTAINMENT_AND_ACTION_ANCHOR_V0_1__";

function parseArgs(argv) {
  const values = new Map();
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith("--")) continue;
    const key = token.slice(2);
    const value = argv[i + 1];
    if (!value || value.startsWith("--")) throw new Error(`Missing value for --${key}`);
    values.set(key, value);
    i += 1;
  }
  return {
    baseUrl: values.get("base-url"),
    expectedSha: values.get("expected-sha"),
    mode: values.get("mode") ?? "production",
    reportPath: values.get("report") ?? "pr214-production-source-proof.json",
    attempts: Number(values.get("attempts") ?? "1"),
    delayMs: Number(values.get("delay-ms") ?? "0"),
  };
}

function sleep(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }
function escaped(value) { return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
function hasMeta(html, name, content) {
  const tag = html.match(new RegExp(`<meta\\b[^>]*\\bname=["']${escaped(name)}["'][^>]*>`, "i"))?.[0] ?? "";
  return new RegExp(`\\bcontent=["']${escaped(content)}["']`, "i").test(tag);
}

async function requestHtml(url) {
  const response = await fetch(url, {
    headers: {
      "cache-control": "no-cache",
      pragma: "no-cache",
      "user-agent": "ORION-BHRIGU-PR214-Exact-SHA-Verifier/0.1",
    },
    redirect: "follow",
    signal: AbortSignal.timeout(30_000),
  });
  return { status: response.status, finalUrl: response.url, html: await response.text() };
}

function baseChecks(response, expectedPath, base, mode) {
  const final = new URL(response.finalUrl);
  return {
    http_200: response.status === 200,
    route_preserved: final.pathname === expectedPath,
    production_host_preserved: mode !== "production" || final.host === new URL(base).host,
  };
}

function classify(report) {
  const requestHealthy = [report.overview, report.live, report.frey].every((item) =>
    item.checks.http_200 && item.checks.route_preserved && item.checks.production_host_preserved
  );
  if (!requestHealthy) return "CONTRACT_FAILURE";
  const all = [report.overview, report.live, report.frey].flatMap((item) => Object.values(item.checks));
  if (all.every(Boolean)) return "PASS";
  const exactSourceMissing = !report.overview.checks.head_source_meta
    || !report.overview.checks.main_source_attribute
    || !report.live.checks.head_source_meta
    || !report.frey.checks.pr214_repair_marker;
  return exactSourceMissing ? "STALE_SOURCE" : "CONTRACT_FAILURE";
}

async function main() {
  let args;
  try {
    args = parseArgs(process.argv.slice(2));
    if (!args.baseUrl) throw new Error("--base-url is required");
    if (!args.expectedSha || !/^[0-9a-f]{40}$/i.test(args.expectedSha)) throw new Error("--expected-sha must be a 40-character SHA");
    if (!new Set(["staged", "production"]).has(args.mode)) throw new Error("--mode must be staged or production");
    if (!Number.isInteger(args.attempts) || args.attempts < 1 || args.attempts > 60) throw new Error("--attempts must be 1..60");
    if (!Number.isInteger(args.delayMs) || args.delayMs < 0 || args.delayMs > 60_000) throw new Error("--delay-ms must be 0..60000");
  } catch (error) {
    console.error(`INVALID_INPUT: ${error.message}`);
    process.exit(EXIT.INVALID_INPUT);
  }

  const base = args.baseUrl.replace(/\/$/, "");
  let last = null;

  for (let attempt = 1; attempt <= args.attempts; attempt += 1) {
    const cacheKey = `${Date.now()}-${attempt}`;
    const overviewUrl = `${base}/crypto-astro/btc?lang=en&__pr214_exact_sha=${cacheKey}`;
    const liveUrl = `${base}/crypto-astro/btc/live?lang=en&q=${encodeURIComponent("What currently drives BTC gravity?")}&__pr214_exact_sha=${cacheKey}`;
    const freyUrl = `${base}/frey?lang=ru&q=${encodeURIComponent("Temporal Snapshot · 2026-08-29")}&d=2026-08-29&__pr214_exact_sha=${cacheKey}`;

    try {
      const [overviewResponse, liveResponse, freyResponse] = await Promise.all([
        requestHtml(overviewUrl), requestHtml(liveUrl), requestHtml(freyUrl),
      ]);

      const overview = {
        status: overviewResponse.status,
        url: overviewResponse.finalUrl,
        checks: {
          ...baseChecks(overviewResponse, "/crypto-astro/btc", base, args.mode),
          head_source_meta: hasMeta(overviewResponse.html, "btc-deployment-source-sha", args.expectedSha),
          main_source_attribute: new RegExp(`data-deployment-source-sha=["']${escaped(args.expectedSha)}["']`, "i").test(overviewResponse.html),
          visible_source_prefix: overviewResponse.html.includes(args.expectedSha.slice(0, 12)),
        },
      };

      const live = {
        status: liveResponse.status,
        url: liveResponse.finalUrl,
        checks: {
          ...baseChecks(liveResponse, "/crypto-astro/btc/live", base, args.mode),
          head_source_meta: hasMeta(liveResponse.html, "btc-deployment-source-sha", args.expectedSha),
          live_dialogue_marker: /name=["']btc-live-dialogue["'][^>]*content=["']semantic-route-graph-v0-1["']/i.test(liveResponse.html),
        },
      };

      const frey = {
        status: freyResponse.status,
        url: freyResponse.finalUrl,
        checks: {
          ...baseChecks(freyResponse, "/frey", base, args.mode),
          pr214_repair_marker: freyResponse.html.includes(`data-frey-mobile-repair="${FREY_REPAIR}"`),
          result_state_success: freyResponse.html.includes('data-frey-response-state="success"'),
          mobile_nav_static: freyResponse.html.includes('position:static!important'),
          mobile_nav_bottom_auto: freyResponse.html.includes('bottom:auto!important'),
        },
      };

      const candidate = { overview, live, frey };
      const classification = classify(candidate);
      last = {
        schema_version: "bhrigu_pr214_exact_sha_production_source_proof_v0_1",
        classification,
        mode: args.mode,
        expected_sha: args.expectedSha,
        expected_sha_prefix: args.expectedSha.slice(0, 12),
        pr214_repair_marker: FREY_REPAIR,
        attempt,
        generated_at_utc: new Date().toISOString(),
        ...candidate,
      };
      if (classification === "PASS") break;
    } catch (error) {
      last = {
        schema_version: "bhrigu_pr214_exact_sha_production_source_proof_v0_1",
        classification: "REQUEST_FAILURE",
        mode: args.mode,
        expected_sha: args.expectedSha,
        attempt,
        generated_at_utc: new Date().toISOString(),
        error_code: error?.name ?? "Error",
        error_message: String(error?.message ?? error),
      };
    }

    if (attempt < args.attempts) await sleep(args.delayMs);
  }

  await writeFile(args.reportPath, `${JSON.stringify(last, null, 2)}\n`, "utf8");
  console.log(`PR214_PRODUCTION_SOURCE=${last.classification} expected_sha=${args.expectedSha} report=${args.reportPath}`);
  if (last.classification === "PASS") process.exit(EXIT.PASS);
  if (last.classification === "STALE_SOURCE") process.exit(EXIT.STALE_SOURCE);
  if (last.classification === "REQUEST_FAILURE") process.exit(EXIT.REQUEST_FAILURE);
  process.exit(EXIT.CONTRACT_FAILURE);
}

await main();
