import {
  BTC_OBSERVABILITY_ATTRIBUTION_KEY,
  BTC_OBSERVABILITY_VISIT_KEY,
  normalizeTrafficCampaign,
  normalizeTrafficMedium,
  normalizeTrafficSource,
  type BtcAttribution,
  type BtcObservabilityContext,
  type BtcObservabilityEventType,
  type BtcObservabilityLocale,
  type BtcObservabilitySurface,
} from "./btc-observability-contract";

function randomId(prefix: string): string {
  const value = typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  return `${prefix}_${value}`.replace(/[^A-Za-z0-9_-]/g, "_");
}

function classifyReferrer(referrer: string): BtcAttribution {
  if (!referrer) return { source: "direct", medium: "direct", campaign: null };
  try {
    const url = new URL(referrer);
    const host = url.hostname.toLowerCase();
    if (host.endsWith("bhrigu.io")) return { source: "direct", medium: "direct", campaign: null };
    if (host === "bitcointalk.org" || host.endsWith(".bitcointalk.org")) return { source: "bitcointalk", medium: "forum", campaign: null };
    if (host === "x.com" || host.endsWith(".x.com") || host === "twitter.com" || host.endsWith(".twitter.com")) return { source: "x", medium: "social", campaign: null };
    if (host === "t.me" || host.endsWith(".telegram.org")) return { source: "telegram", medium: "social", campaign: null };
  } catch {
    // Invalid referrer becomes other without retaining the raw value.
  }
  return { source: "other", medium: "other", campaign: null };
}

function readStoredAttribution(): BtcAttribution | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(BTC_OBSERVABILITY_ATTRIBUTION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return {
      source: normalizeTrafficSource(parsed.source),
      medium: normalizeTrafficMedium(parsed.medium),
      campaign: normalizeTrafficCampaign(parsed.campaign),
    };
  } catch { return null; }
}

function attributionFromPage(): BtcAttribution {
  const stored = readStoredAttribution();
  if (stored) return stored;
  const params = new URLSearchParams(window.location.search);
  const utmSource = params.get("utm_source");
  const utmMedium = params.get("utm_medium");
  const utmCampaign = params.get("utm_campaign");
  const source = utmSource ? normalizeTrafficSource(utmSource) : classifyReferrer(document.referrer).source;
  const medium = utmMedium ? normalizeTrafficMedium(utmMedium) : (utmSource ? "other" : classifyReferrer(document.referrer).medium);
  const attribution = { source, medium, campaign: normalizeTrafficCampaign(utmCampaign) } as BtcAttribution;
  try { window.sessionStorage.setItem(BTC_OBSERVABILITY_ATTRIBUTION_KEY, JSON.stringify(attribution)); } catch {}
  return attribution;
}

export function getBtcObservabilityContext(): BtcObservabilityContext | null {
  if (typeof window === "undefined") return null;
  let visitSessionId = "";
  try { visitSessionId = window.sessionStorage.getItem(BTC_OBSERVABILITY_VISIT_KEY) ?? ""; } catch {}
  if (!visitSessionId) {
    visitSessionId = randomId("visit");
    try { window.sessionStorage.setItem(BTC_OBSERVABILITY_VISIT_KEY, visitSessionId); } catch {}
  }
  return { visitSessionId, ...attributionFromPage() };
}

export function newBtcObservabilityTurnId(): string {
  return randomId("turn");
}

export function recordBtcClientEvent(args: {
  eventType: BtcObservabilityEventType;
  locale: BtcObservabilityLocale;
  surface: BtcObservabilitySurface;
  chatTurnId?: string | null;
  donationSessionId?: string | null;
}): void {
  if (typeof window === "undefined") return;
  const context = getBtcObservabilityContext();
  if (!context) return;
  void fetch("/api/btc/observability/v1/event", {
    method: "POST",
    credentials: "same-origin",
    keepalive: true,
    cache: "no-store",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({
      ...args,
      observability: context,
    }),
  }).catch(() => undefined);
}
