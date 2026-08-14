import { timingSafeEqual } from "node:crypto";

import { getAccessReviewRuntimeConfig } from "./access-intake-config";

export const BTC_DIRECT_PAYMENT_MODE = "direct_bitcoin_v1";

type RuntimeEnv = Partial<NodeJS.ProcessEnv>;

export type BtcDirectPaymentRuntimeConfig =
  | { enabled: false }
  | {
      enabled: true;
      databaseUrl: string;
      coinGeckoDemoApiKey: string | null;
    };

export function getBtcDirectPaymentRuntimeConfig(
  env: RuntimeEnv = process.env
): BtcDirectPaymentRuntimeConfig {
  const review = getAccessReviewRuntimeConfig(env);
  if (
    env.BTC_DIRECT_PAYMENT_MODE !== BTC_DIRECT_PAYMENT_MODE ||
    !env.DATABASE_URL?.trim() ||
    !review.enabled
  ) {
    return { enabled: false };
  }
  return {
    enabled: true,
    databaseUrl: env.DATABASE_URL.trim(),
    coinGeckoDemoApiKey: env.COINGECKO_DEMO_API_KEY?.trim() || null,
  };
}

export type BtcObservationRuntimeConfig =
  | { enabled: false }
  | { enabled: true; databaseUrl: string; secret: string };

export function getBtcObservationRuntimeConfig(
  env: RuntimeEnv = process.env
): BtcObservationRuntimeConfig {
  const secret = env.BTC_PAYMENT_OBSERVATION_SECRET?.trim() ?? "";
  if (
    env.BTC_DIRECT_PAYMENT_MODE !== BTC_DIRECT_PAYMENT_MODE ||
    !env.DATABASE_URL?.trim() ||
    secret.length < 32 ||
    secret.length > 256
  ) {
    return { enabled: false };
  }
  return { enabled: true, databaseUrl: env.DATABASE_URL.trim(), secret };
}

export function verifyObservationSecret(candidate: unknown, expected: string): boolean {
  if (typeof candidate !== "string") return false;
  const supplied = Buffer.from(candidate.trim());
  const target = Buffer.from(expected);
  return supplied.length === target.length && timingSafeEqual(supplied, target);
}
