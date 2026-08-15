import { BTC_DONATION_MODE, getDonationBridgeRuntimeConfig } from "./btc-donation-bridge";

export const BTC_DONATION_SESSION_PREVIEW_BRANCH = "agent/bhrigu-donation-session-support-qr-v0-1";
export const BTC_DONATION_SESSION_ACTIVATION_PREVIEW_BRANCH = "agent/bhrigu-donation-production-opening-canary-v0-1";
export const BTC_DONATION_SESSION_PRODUCTION_BRANCH = "master";
export const BTC_DONATION_SESSION_TTL_MS = 30 * 60 * 1000;

export type DonationSessionPresentationState =
  | "awaiting_payment"
  | "mempool_seen"
  | "confirmed"
  | "confirmation_lost"
  | "retired";

export type DonationSessionRuntimeConfig =
  | { enabled: false }
  | { enabled: true; databaseUrl: string; surface: "preview" | "production" };

export type DonationSessionView = {
  sessionId: string;
  state: DonationSessionPresentationState;
  createdAt: string;
  expiresAt: string;
  retiredAt: string | null;
  receiveAddress: string | null;
  bip321Uri: string | null;
  observedSats: string | null;
  confirmations: number | null;
};

type RuntimeEnv = Partial<NodeJS.ProcessEnv>;
const MAINNET_ADDRESS = /^(?:bc1[ac-hj-np-z02-9]{20,90}|[13][1-9A-HJ-NP-Za-km-z]{20,60})$/i;
const SESSION_ID = /^don_session_[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function getDonationSessionRuntimeConfig(env: RuntimeEnv = process.env): DonationSessionRuntimeConfig {
  const bridge = getDonationBridgeRuntimeConfig(env);
  if (!bridge.enabled) return { enabled: false };
  const preview =
    env.VERCEL_ENV === "preview" &&
    (env.VERCEL_GIT_COMMIT_REF === BTC_DONATION_SESSION_PREVIEW_BRANCH ||
      env.VERCEL_GIT_COMMIT_REF === BTC_DONATION_SESSION_ACTIVATION_PREVIEW_BRANCH);
  const production =
    env.VERCEL_ENV === "production" &&
    env.VERCEL_GIT_COMMIT_REF === BTC_DONATION_SESSION_PRODUCTION_BRANCH &&
    env.BTC_DONATION_MODE === BTC_DONATION_MODE;
  if (preview) return { enabled: true, databaseUrl: bridge.databaseUrl, surface: "preview" };
  if (production) return { enabled: true, databaseUrl: bridge.databaseUrl, surface: "production" };
  return { enabled: false };
}

export function normalizeDonationSessionId(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return SESSION_ID.test(normalized) ? normalized : null;
}

export function buildDonationBip321Uri(receiveAddress: string): string {
  const address = receiveAddress.trim();
  if (!MAINNET_ADDRESS.test(address)) throw new Error("invalid_donation_receive_address");
  return `bitcoin:${address}`;
}

export function donationSessionExpiresAt(createdAt: Date): string {
  return new Date(createdAt.getTime() + BTC_DONATION_SESSION_TTL_MS).toISOString();
}

export function donationSessionStateCopy(state: DonationSessionPresentationState) {
  switch (state) {
    case "awaiting_payment":
      return { label: "Awaiting payment", detail: "No Bitcoin receipt has been observed for this session." };
    case "mempool_seen":
      return { label: "Seen on network", detail: "A matching transaction output has been observed but is not yet confirmed." };
    case "confirmed":
      return { label: "Confirmed", detail: "A matching output has at least one SPV-verified confirmation." };
    case "confirmation_lost":
      return { label: "Confirmation changed", detail: "A previously confirmed output lost its confirmed state and requires observation." };
    case "retired":
      return { label: "Session retired", detail: "This receive address will never be issued to another donation session." };
  }
}
