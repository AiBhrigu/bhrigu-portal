import type { BtcAgentPaymentReceiptV0 } from "./btc-agent-evidence-answer-v0";

export const BTC_AGENT_X402_PREVIEW_SCHEMA = "bhrigu_btc_x402_preview_boundary_v0" as const;
export const BTC_AGENT_X402_PROTOCOL_VERSION = 2 as const;
export const BTC_AGENT_X402_SCHEME = "exact" as const;
export const BTC_AGENT_X402_NETWORK = "eip155:8453" as const;
export const BTC_AGENT_X402_ASSET = "USDC" as const;
export const BTC_AGENT_X402_AMOUNT_ATOMIC = "500000" as const;

export const BTC_AGENT_X402_AUTHORITY = {
  package_family: "@x402/*",
  observed_package_version: "2.26.0",
  source_repository: "https://github.com/x402-foundation/x402",
  source_commit: "6323ec74c85607e706e0722dd294365a7fb57768",
  v2_spec: "https://github.com/x402/x402/blob/main/specs/x402-specification-v2.md",
  payment_requirements_note: "x402 V2 PaymentRequirements requires payTo; PAY_TO is intentionally unbound in this preview node.",
} as const;

export type BtcAgentX402PreviewBoundary = {
  schema_version: typeof BTC_AGENT_X402_PREVIEW_SCHEMA;
  preview_only: true;
  production_payment_enabled: false;
  payment_activation: false;
  settlement_enabled: false;
  pay_to: null;
  x402_version: typeof BTC_AGENT_X402_PROTOCOL_VERSION;
  scheme: typeof BTC_AGENT_X402_SCHEME;
  network: typeof BTC_AGENT_X402_NETWORK;
  asset: typeof BTC_AGENT_X402_ASSET;
  amount_atomic: typeof BTC_AGENT_X402_AMOUNT_ATOMIC;
  authority: typeof BTC_AGENT_X402_AUTHORITY;
};

export function btcAgentX402PreviewBoundary(): BtcAgentX402PreviewBoundary {
  return {
    schema_version: BTC_AGENT_X402_PREVIEW_SCHEMA,
    preview_only: true,
    production_payment_enabled: false,
    payment_activation: false,
    settlement_enabled: false,
    pay_to: null,
    x402_version: BTC_AGENT_X402_PROTOCOL_VERSION,
    scheme: BTC_AGENT_X402_SCHEME,
    network: BTC_AGENT_X402_NETWORK,
    asset: BTC_AGENT_X402_ASSET,
    amount_atomic: BTC_AGENT_X402_AMOUNT_ATOMIC,
    authority: BTC_AGENT_X402_AUTHORITY,
  };
}

export type BtcAgentPreviewAuthorization =
  | { ok: true; receipt: BtcAgentPaymentReceiptV0 }
  | { ok: false; code: "PAYMENT_NOT_ACTIVATED" | "PREVIEW_AUTHORIZATION_REQUIRED"; status: 402 | 503 };

export function authorizeBtcAgentPreview(
  headerValue: string | string[] | undefined,
  env: Readonly<Record<string, string | undefined>> = process.env,
): BtcAgentPreviewAuthorization {
  if (env.VERCEL_ENV !== "preview") {
    return { ok: false, code: "PAYMENT_NOT_ACTIVATED", status: 503 };
  }
  const value = Array.isArray(headerValue) ? headerValue[0] : headerValue;
  if (value !== "mock-authorized-v0") {
    return { ok: false, code: "PREVIEW_AUTHORIZATION_REQUIRED", status: 402 };
  }
  return {
    ok: true,
    receipt: {
      protocol: "x402",
      network: BTC_AGENT_X402_NETWORK,
      asset: BTC_AGENT_X402_ASSET,
      amount_atomic: BTC_AGENT_X402_AMOUNT_ATOMIC,
      payer: "PREVIEW_MOCK_PAYER",
      transaction: "PREVIEW_NO_SETTLEMENT",
    },
  };
}
