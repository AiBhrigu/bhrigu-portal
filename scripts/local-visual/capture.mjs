import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { discoverVisualRoutes, HARNESS_NODE, SOURCE_SHA, VIEWPORTS } from "./routes.mjs";

const baseUrl = process.env.BHRIGU_VISUAL_BASE_URL || "http://127.0.0.1:4317";
const sourceSha = process.env.BHRIGU_VISUAL_SOURCE_SHA || SOURCE_SHA;
const harnessSha = process.env.BHRIGU_VISUAL_HARNESS_SHA || "local-uncommitted";
const runLabel = process.env.GITHUB_RUN_ID || new Date().toISOString().replace(/[:.]/g, "-");
const artifactRoot = process.env.BHRIGU_VISUAL_ARTIFACT_ROOT || "artifacts/local-visual";
const artifactDir = path.join(artifactRoot, `${sourceSha.slice(0, 12)}-${String(harnessSha).slice(0, 12)}-${runLabel}`);
const origin = new URL(baseUrl).origin;
const MAX_EVENT_RECORDS = 80;

await mkdir(path.join(artifactDir, "screenshots"), { recursive: true });
await mkdir(path.join(artifactDir, "reports"), { recursive: true });

const discovery = await discoverVisualRoutes();
const browser = await chromium.launch({ headless: process.env.BHRIGU_VISUAL_HEADED !== "1" });
const captures = [];

try {
  for (const viewport of VIEWPORTS) {
    for (const route of discovery.routes) {
      captures.push(await captureRoute(browser, route, viewport));
    }
  }
} finally {
  await browser.close();
}

const blockerCaptures = captures.filter((capture) => capture.blockers.length > 0);
const summary = {
  node: HARNESS_NODE,
  status: blockerCaptures.length === 0 ? "PASS" : "FAIL",
  source_sha: sourceSha,
  harness_sha: harnessSha,
  base_url: baseUrl,
  generated_at_utc: new Date().toISOString(),
  pages_manifest_count: discovery.manifest_pages,
  public_routes_and_scenarios: discovery.routes.length,
  skipped_routes: discovery.skipped,
  viewports: VIEWPORTS,
  expected_captures: discovery.routes.length * VIEWPORTS.length,
  completed_captures: captures.length,
  passing_captures: captures.length - blockerCaptures.length,
  blocking_captures: blockerCaptures.length,
  blockers: blockerCaptures.map(({ route_id, path: routePath, viewport, blockers }) => ({ route_id, path: routePath, viewport, blockers })),
  screenshots_committed_to_repository: false,
  production_writes: 0,
  vercel_writes: 0,
  x402_live_transfers: 0,
};

await writeFile(path.join(artifactDir, "manifest.json"), `${JSON.stringify({ ...summary, captures }, null, 2)}\n`, "utf8");
await writeFile(path.join(artifactDir, "routes.json"), `${JSON.stringify(discovery, null, 2)}\n`, "utf8");
await writeFile(path.join(artifactDir, "summary.md"), renderMarkdown(summary, captures), "utf8");
await writeFile(path.join(artifactDir, "index.html"), renderGallery(summary, captures), "utf8");

console.log(JSON.stringify({
  node: HARNESS_NODE,
  status: summary.status,
  source_sha: sourceSha,
  harness_sha: harnessSha,
  routes: discovery.routes.length,
  captures: captures.length,
  blockers: blockerCaptures.length,
  artifact_dir: artifactDir,
}, null, 2));
console.log(`VISUAL_ARTIFACT_DIR=${artifactDir}`);

if (blockerCaptures.length > 0) process.exitCode = 1;

async function captureRoute(browserInstance, route, viewport) {
  const context = await browserInstance.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    deviceScaleFactor: 1,
    colorScheme: "dark",
    reducedMotion: "reduce",
    locale: route.locale || viewport.locale,
    timezoneId: "Asia/Kolkata",
  });
  const page = await context.newPage();
  page.setDefaultTimeout(15_000);
  page.setDefaultNavigationTimeout(35_000);

  const consoleErrors = [];
  const consoleWarnings = [];
  const pageErrors = [];
  const requestFailures = [];
  const httpFailures = [];

  page.on("console", (message) => {
    const record = compact({
      type: message.type(),
      text: message.text(),
      url: message.location().url || null,
      line: message.location().lineNumber ?? null,
    });
    if (message.type() === "error") pushLimited(consoleErrors, record);
    if (message.type() === "warning") pushLimited(consoleWarnings, record);
  });
  page.on("pageerror", (error) => pushLimited(pageErrors, compact({ name: error.name, message: error.message })));
  page.on("requestfailed", (request) => pushLimited(requestFailures, compact({
    url: request.url(),
    method: request.method(),
    error: request.failure()?.errorText || "REQUEST_FAILED",
    first_party: isFirstParty(request.url()),
  })));
  page.on("response", (response) => {
    if (response.status() >= 400) pushLimited(httpFailures, compact({
      url: response.url(),
      status: response.status(),
      first_party: isFirstParty(response.url()),
    }));
  });

  const target = new URL(route.path, baseUrl).toString();
  let navigationStatus = null;
  let navigationError = null;
  try {
    const response = await page.goto(target, { waitUntil: "domcontentloaded" });
    navigationStatus = response?.status() ?? null;
    await page.waitForLoadState("load", { timeout: 12_000 }).catch(() => undefined);
    await page.evaluate(async () => {
      if (document.fonts?.ready) await document.fonts.ready;
    }).catch(() => undefined);
    await page.addStyleTag({ content: `
      *, *::before, *::after {
        animation-delay: 0s !important;
        animation-duration: 0s !important;
        transition-delay: 0s !important;
        transition-duration: 0s !important;
        caret-color: transparent !important;
      }
      html { scroll-behavior: auto !important; }
    ` });
    await primeLazyContent(page);
    await page.waitForTimeout(350);
  } catch (error) {
    navigationError = safeMessage(error);
  }

  const metrics = await page.evaluate(() => {
    const root = document.documentElement;
    const body = document.body;
    const images = [...document.images].map((image) => {
      const source = image.currentSrc || image.src || "";
      let firstParty = false;
      try { firstParty = new URL(source, location.href).origin === location.origin; } catch {}
      return {
        source,
        first_party: firstParty,
        complete: image.complete,
        natural_width: image.naturalWidth,
        natural_height: image.naturalHeight,
      };
    });
    return {
      title: document.title,
      body_text_length: (body?.innerText || "").trim().length,
      html_lang: root.lang || null,
      inner_width: window.innerWidth,
      scroll_width: Math.max(root.scrollWidth, body?.scrollWidth || 0),
      scroll_height: Math.max(root.scrollHeight, body?.scrollHeight || 0),
      landmark_count: document.querySelectorAll("main,header,nav,footer").length,
      heading_count: document.querySelectorAll("h1,h2,h3").length,
      link_count: document.querySelectorAll("a[href]").length,
      images,
    };
  }).catch((error) => ({ evaluation_error: safeMessage(error), images: [] }));

  const firstPartyRequestFailures = requestFailures.filter((item) => item.first_party);
  const firstPartyHttpFailures = httpFailures.filter((item) => item.first_party && !isIgnorableFirstPartyStatus(item));
  const firstPartyConsoleErrors = consoleErrors.filter((item) => !item.url || isFirstParty(item.url));
  const brokenFirstPartyImages = (metrics.images || []).filter((image) => image.first_party && image.complete && image.natural_width === 0);
  const overflowPx = typeof metrics.scroll_width === "number" ? Math.max(0, metrics.scroll_width - viewport.width) : null;

  const blockers = [];
  if (navigationError) blockers.push("NAVIGATION_ERROR");
  if (navigationStatus === null || navigationStatus >= 400) blockers.push(`NAVIGATION_STATUS_${navigationStatus ?? "NONE"}`);
  if (pageErrors.length) blockers.push("PAGE_RUNTIME_ERROR");
  if (firstPartyRequestFailures.length) blockers.push("FIRST_PARTY_REQUEST_FAILURE");
  if (firstPartyHttpFailures.length) blockers.push("FIRST_PARTY_HTTP_FAILURE");
  if (firstPartyConsoleErrors.length) blockers.push("FIRST_PARTY_CONSOLE_ERROR");
  if (brokenFirstPartyImages.length) blockers.push("BROKEN_FIRST_PARTY_IMAGE");
  if (overflowPx !== null && overflowPx > 2) blockers.push(`HORIZONTAL_OVERFLOW_${overflowPx}px`);
  if (!metrics.title) blockers.push("EMPTY_DOCUMENT_TITLE");
  if (typeof metrics.body_text_length === "number" && metrics.body_text_length < 20) blockers.push("EMPTY_OR_TRUNCATED_BODY");

  const screenshotRelative = path.join("screenshots", viewport.id, `${route.id}.png`);
  const reportRelative = path.join("reports", viewport.id, `${route.id}.json`);
  await mkdir(path.dirname(path.join(artifactDir, screenshotRelative)), { recursive: true });
  await mkdir(path.dirname(path.join(artifactDir, reportRelative)), { recursive: true });
  let screenshotError = null;
  try {
    await page.screenshot({ path: path.join(artifactDir, screenshotRelative), fullPage: true, animations: "disabled" });
  } catch (error) {
    screenshotError = safeMessage(error);
    blockers.push("SCREENSHOT_CAPTURE_FAILED");
  }

  const record = {
    route_id: route.id,
    label: route.label,
    path: route.path,
    source: route.source,
    viewport: viewport.id,
    viewport_width: viewport.width,
    viewport_height: viewport.height,
    target_url: target,
    navigation_status: navigationStatus,
    navigation_error: navigationError,
    screenshot: screenshotError ? null : screenshotRelative,
    screenshot_error: screenshotError,
    metrics: { ...metrics, images: undefined, broken_first_party_images: brokenFirstPartyImages },
    overflow_px: overflowPx,
    blockers,
    warnings: {
      console: consoleWarnings,
      external_console_errors: consoleErrors.filter((item) => item.url && !isFirstParty(item.url)),
      external_request_failures: requestFailures.filter((item) => !item.first_party),
      external_http_failures: httpFailures.filter((item) => !item.first_party),
    },
    evidence: {
      page_errors: pageErrors,
      first_party_console_errors: firstPartyConsoleErrors,
      first_party_request_failures: firstPartyRequestFailures,
      first_party_http_failures: firstPartyHttpFailures,
    },
  };

  await writeFile(path.join(artifactDir, reportRelative), `${JSON.stringify(record, null, 2)}\n`, "utf8");
  await context.close();
  return record;
}

async function primeLazyContent(page) {
  await page.evaluate(async () => {
    const root = document.scrollingElement || document.documentElement;
    const max = Math.max(0, root.scrollHeight - window.innerHeight);
    const steps = Math.min(20, Math.max(1, Math.ceil(max / 700)));
    for (let index = 0; index <= steps; index += 1) {
      window.scrollTo(0, Math.round((max * index) / steps));
      await new Promise((resolve) => setTimeout(resolve, 35));
    }
    window.scrollTo(0, 0);
  });
}

function isFirstParty(url) {
  try { return new URL(url, baseUrl).origin === origin; } catch { return false; }
}

function isIgnorableFirstPartyStatus(item) {
  try {
    const parsed = new URL(item.url);
    return item.status === 404 && parsed.pathname === "/favicon.ico";
  } catch {
    return false;
  }
}

function pushLimited(target, value) {
  if (target.length < MAX_EVENT_RECORDS) target.push(value);
}

function compact(value) {
  return JSON.parse(JSON.stringify(value, (_key, item) => typeof item === "string" ? item.slice(0, 500) : item));
}

function safeMessage(error) {
  return String(error?.message || error || "UNKNOWN_ERROR").replace(/\s+/g, " ").slice(0, 500);
}

function renderMarkdown(summary, records) {
  const rows = records.map((record) => `| ${record.viewport} | \`${record.path}\` | ${record.blockers.length ? `FAIL · ${record.blockers.join(", ")}` : "PASS"} | ${record.screenshot || "—"} |`).join("\n");
  return `# BHRIGU Portal local exact-head visual validation\n\n- Node: \`${summary.node}\`\n- Status: **${summary.status}**\n- Source SHA: \`${summary.source_sha}\`\n- Harness SHA: \`${summary.harness_sha}\`\n- Generated: ${summary.generated_at_utc}\n- Public routes and scenarios: ${summary.public_routes_and_scenarios}\n- Captures: ${summary.completed_captures}/${summary.expected_captures}\n- Blocking captures: ${summary.blocking_captures}\n- Production writes: 0\n- Vercel writes: 0\n- x402 live transfers: 0\n\n| Viewport | Route | Result | Screenshot |\n|---|---|---|---|\n${rows}\n`;
}

function renderGallery(summary, records) {
  const cards = records.map((record) => {
    const result = record.blockers.length ? `FAIL · ${record.blockers.join(", ")}` : "PASS";
    const image = record.screenshot ? `<a href="${escapeHtml(record.screenshot)}"><img loading="lazy" src="${escapeHtml(record.screenshot)}" alt="${escapeHtml(record.label)}"></a>` : "<p>No screenshot</p>";
    return `<article class="card ${record.blockers.length ? "fail" : "pass"}"><header><strong>${escapeHtml(record.viewport)} · ${escapeHtml(record.label)}</strong><span>${escapeHtml(result)}</span></header><code>${escapeHtml(record.path)}</code>${image}</article>`;
  }).join("\n");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>BHRIGU visual evidence · ${escapeHtml(summary.status)}</title><style>body{margin:0;background:#090b10;color:#e9edf5;font:14px/1.45 system-ui,sans-serif}main{max-width:1680px;margin:auto;padding:24px}h1{font-size:24px}.meta{display:flex;gap:16px;flex-wrap:wrap;color:#aeb8c8}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:18px;margin-top:24px}.card{border:1px solid #283245;border-radius:14px;background:#111622;overflow:hidden}.card.fail{border-color:#9b3f48}.card header{display:flex;justify-content:space-between;gap:12px;padding:12px 14px}.card code{display:block;padding:0 14px 12px;color:#94a3b8;overflow-wrap:anywhere}.card img{display:block;width:100%;height:auto;border-top:1px solid #283245}</style></head><body><main><h1>BHRIGU Portal visual evidence · ${escapeHtml(summary.status)}</h1><div class="meta"><span>source ${escapeHtml(summary.source_sha)}</span><span>harness ${escapeHtml(summary.harness_sha)}</span><span>${summary.completed_captures} captures</span><span>${summary.blocking_captures} blocking</span></div><section class="grid">${cards}</section></main></body></html>`;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
}
