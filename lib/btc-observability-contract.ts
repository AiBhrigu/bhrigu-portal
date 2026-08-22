export const BTC_OBSERVABILITY_SCHEMA = "bhrigu_btc_observability_v1" as const;
export const BTC_OBSERVABILITY_COOKIE = "bhrigu_btc_observer_v1" as const;
export const BTC_OBSERVABILITY_VISIT_KEY = "bhrigu:btc-observability:visit-v1" as const;
export const BTC_OBSERVABILITY_ATTRIBUTION_KEY = "bhrigu:btc-observability:attribution-v1" as const;

export const BTC_OBSERVABILITY_EVENT_TYPES = [
  "BTC_CHAT_OPENED",
  "BTC_CHAT_QUESTION_SENT",
  "BTC_CHAT_ANSWER_COMPLETED",
  "BTC_CHAT_ANSWER_FAILED",
  "BTC_SUPPORT_GLYPH_CLICKED",
  "BTC_SUPPORT_PAGE_REACHED",
  "BTC_SUPPORT_SESSION_STARTED",
  "BTC_SUPPORT_RECEIPT_OBSERVED",
] as const;
export type BtcObservabilityEventType = typeof BTC_OBSERVABILITY_EVENT_TYPES[number];

export const BTC_OBSERVABILITY_CLIENT_EVENTS = new Set<BtcObservabilityEventType>([
  "BTC_CHAT_OPENED",
  "BTC_SUPPORT_GLYPH_CLICKED",
  "BTC_SUPPORT_PAGE_REACHED",
  "BTC_SUPPORT_SESSION_STARTED",
  "BTC_SUPPORT_RECEIPT_OBSERVED",
]);

export type BtcObservabilityLocale = "ru" | "en";
export type BtcObservabilitySurface = "btc_clean_chat" | "btc_support";
export type BtcTrafficSource = "direct" | "bitcointalk" | "x" | "telegram" | "other";
export type BtcTrafficMedium = "direct" | "forum" | "social" | "profile" | "post" | "other";

export type BtcAttribution = {
  source: BtcTrafficSource;
  medium: BtcTrafficMedium;
  campaign: string | null;
};

export type BtcObservabilityContext = BtcAttribution & { visitSessionId: string };

const ID = /^[A-Za-z0-9_-]{8,96}$/;
const CAMPAIGN = /^[a-z0-9][a-z0-9_-]{0,63}$/;
const SOURCES = new Set<BtcTrafficSource>(["direct", "bitcointalk", "x", "telegram", "other"]);
const MEDIUMS = new Set<BtcTrafficMedium>(["direct", "forum", "social", "profile", "post", "other"]);

export function normalizeObservabilityId(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const id = value.trim();
  return ID.test(id) ? id : null;
}

export function normalizeTrafficSource(value: unknown): BtcTrafficSource {
  if (typeof value !== "string") return "other";
  const source = value.trim().toLowerCase() as BtcTrafficSource;
  return SOURCES.has(source) ? source : "other";
}

export function normalizeTrafficMedium(value: unknown): BtcTrafficMedium {
  if (typeof value !== "string") return "other";
  const medium = value.trim().toLowerCase() as BtcTrafficMedium;
  return MEDIUMS.has(medium) ? medium : "other";
}

export function normalizeTrafficCampaign(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const campaign = value.trim().toLowerCase();
  return CAMPAIGN.test(campaign) ? campaign : null;
}

export function normalizeAttribution(value: unknown): BtcAttribution {
  const item = value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
  return {
    source: normalizeTrafficSource(item.source ?? "direct"),
    medium: normalizeTrafficMedium(item.medium ?? "direct"),
    campaign: normalizeTrafficCampaign(item.campaign),
  };
}
