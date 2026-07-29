import { readFile } from "node:fs/promises";

export const SOURCE_SHA = "27737aed75059c01472ecec5e123aaed2ff10236";
export const HARNESS_NODE = "BHRIGU_PORTAL_LOCAL_EXACT_HEAD_VISUAL_VALIDATION_HARNESS_IMPLEMENTATION_FULL_CYCLE_v0_1";

export const VIEWPORTS = Object.freeze([
  Object.freeze({ id: "desktop", width: 1440, height: 1200, locale: "en-US" }),
  Object.freeze({ id: "mobile", width: 390, height: 844, locale: "ru-RU" }),
]);

const INTERNAL_ROUTES = new Set([
  "/404",
  "/500",
  "/_api_page_disabled",
  "/_app",
  "/_document",
  "/_error",
  "/access-review",
  "/api",
]);

const BTC_SCENARIOS = Object.freeze([
  Object.freeze({
    id: "btc-overview-ru",
    path: "/crypto-astro/btc?lang=ru",
    label: "BTC overview · RU",
    locale: "ru-RU",
    source: "locked-scenario",
  }),
  Object.freeze({
    id: "btc-overview-en",
    path: "/crypto-astro/btc?lang=en",
    label: "BTC overview · EN",
    locale: "en-US",
    source: "locked-scenario",
  }),
  Object.freeze({
    id: "btc-dialogue-ru",
    path: `/crypto-astro/btc/live?lang=ru&q=${encodeURIComponent("Что происходит с BTC сейчас?")}`,
    label: "BTC free dialogue · RU first answer",
    locale: "ru-RU",
    source: "locked-scenario",
  }),
  Object.freeze({
    id: "btc-dialogue-en",
    path: `/crypto-astro/btc/live?lang=en&q=${encodeURIComponent("What is happening with BTC now?")}`,
    label: "BTC free dialogue · EN first answer",
    locale: "en-US",
    source: "locked-scenario",
  }),
]);

export async function discoverVisualRoutes({ manifestPath = ".next/server/pages-manifest.json" } = {}) {
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  const routes = [];
  const skipped = [];

  for (const route of Object.keys(manifest).sort()) {
    const reason = exclusionReason(route);
    if (reason) {
      skipped.push({ route, reason });
      continue;
    }
    routes.push({
      id: routeId(route),
      path: route,
      label: route === "/" ? "Portal home" : route,
      locale: "en-US",
      source: "pages-manifest",
    });
  }

  for (const scenario of BTC_SCENARIOS) routes.push({ ...scenario });

  const deduplicated = [];
  const seen = new Set();
  for (const route of routes) {
    const key = `${route.id}\u0000${route.path}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduplicated.push(route);
  }

  deduplicated.sort((a, b) => a.id.localeCompare(b.id) || a.path.localeCompare(b.path));
  return {
    manifest_pages: Object.keys(manifest).length,
    routes: deduplicated,
    skipped,
  };
}

function exclusionReason(route) {
  if (typeof route !== "string" || !route.startsWith("/")) return "INVALID_ROUTE";
  if (route.startsWith("/api/")) return "API_ROUTE";
  if (INTERNAL_ROUTES.has(route)) return "INTERNAL_OR_PROTECTED_ROUTE";
  if (route.includes("[") || route.includes("]")) return "DYNAMIC_ROUTE_REQUIRES_FIXTURE";
  return null;
}

function routeId(route) {
  if (route === "/") return "home";
  return route
    .replace(/^\//, "")
    .replace(/[^A-Za-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase() || "route";
}
