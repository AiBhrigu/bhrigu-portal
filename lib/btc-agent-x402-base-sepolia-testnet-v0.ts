export const BTC_AGENT_X402_BASE_SEPOLIA_TESTNET_SCHEMA =
  "bhrigu_btc_x402_base_sepolia_testnet_binding_v0" as const;
export const BTC_AGENT_X402_BASE_SEPOLIA_VERSION = 2 as const;
export const BTC_AGENT_X402_BASE_SEPOLIA_SCHEME = "exact" as const;
export const BTC_AGENT_X402_BASE_SEPOLIA_NETWORK = "eip155:84532" as const;
export const BTC_AGENT_X402_BASE_SEPOLIA_ASSET =
  "0x036CbD53842c5426634e7929541eC2318f3dCF7e" as const;
export const BTC_AGENT_X402_BASE_SEPOLIA_AMOUNT_ATOMIC = "500000" as const;
export const BTC_AGENT_X402_BASE_SEPOLIA_MAX_TIMEOUT_SECONDS = 60 as const;
export const BTC_AGENT_X402_BASE_SEPOLIA_PAYER_NAME =
  "bhrigu-x402-base-sepolia-test" as const;
export const BTC_AGENT_X402_BASE_SEPOLIA_PAYER_ADDRESS =
  "0x9f736D6922ad950337C8A336b923dBBc17216004" as const;
export const BTC_AGENT_X402_BASE_SEPOLIA_RECEIVER_NAME =
  "bhrigu-x402-base-sepolia-receiver" as const;

export const BTC_AGENT_X402_BASE_SEPOLIA_ENABLE_ENV =
  "BHRIGU_BTC_EVIDENCE_X402_BASE_SEPOLIA_ENABLED" as const;
export const BTC_AGENT_X402_BASE_SEPOLIA_RECEIVER_NAME_ENV =
  "BHRIGU_BTC_EVIDENCE_X402_BASE_SEPOLIA_RECEIVER_NAME" as const;
export const BTC_AGENT_X402_BASE_SEPOLIA_RECEIVER_ADDRESS_ENV =
  "BHRIGU_BTC_EVIDENCE_X402_BASE_SEPOLIA_RECEIVER_ADDRESS" as const;

const EVM_ADDRESS = /^0x[0-9a-fA-F]{40}$/;

export type BtcAgentX402BaseSepoliaPaymentRequirements = {
  scheme: typeof BTC_AGENT_X402_BASE_SEPOLIA_SCHEME;
  network: typeof BTC_AGENT_X402_BASE_SEPOLIA_NETWORK;
  asset: typeof BTC_AGENT_X402_BASE_SEPOLIA_ASSET;
  amount: typeof BTC_AGENT_X402_BASE_SEPOLIA_AMOUNT_ATOMIC;
  payTo: string;
  maxTimeoutSeconds: typeof BTC_AGENT_X402_BASE_SEPOLIA_MAX_TIMEOUT_SECONDS;
  extra: {
    name: "USDC";
    version: "2";
  };
};

export type BtcAgentX402BaseSepoliaPaymentRequired = {
  x402Version: typeof BTC_AGENT_X402_BASE_SEPOLIA_VERSION;
  accepts: [BtcAgentX402BaseSepoliaPaymentRequirements];
  resource: {
    url: string;
    description: "BHRIGU BTC Evidence Answer V0 · Base Sepolia testnet";
    mimeType: "application/json";
  };
  error: "PAYMENT_REQUIRED";
};

export type BtcAgentX402BaseSepoliaBinding = {
  schema_version: typeof BTC_AGENT_X402_BASE_SEPOLIA_TESTNET_SCHEMA;
  testnet_only: true;
  production_payment_enabled: false;
  public_contract_unchanged: true;
  receiver_name: typeof BTC_AGENT_X402_BASE_SEPOLIA_RECEIVER_NAME;
  pay_to: string;
};

export class BtcAgentX402BaseSepoliaBindingError extends Error {
  constructor(
    readonly code:
      | "TESTNET_BINDING_DISABLED"
      | "PRODUCTION_ENV_FORBIDDEN"
      | "RECEIVER_NAME_MISMATCH"
      | "RECEIVER_ADDRESS_MISSING"
      | "RECEIVER_ADDRESS_INVALID"
      | "RESOURCE_URL_INVALID"
      | "PAYMENT_SIGNATURE_INVALID"
      | "PAYMENT_REQUIREMENTS_MISMATCH",
  ) {
    super(code);
    this.name = "BtcAgentX402BaseSepoliaBindingError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function sameRequirements(
  value: unknown,
  expected: BtcAgentX402BaseSepoliaPaymentRequirements,
): boolean {
  if (!isRecord(value)) return false;
  return value.scheme === expected.scheme
    && value.network === expected.network
    && value.asset === expected.asset
    && value.amount === expected.amount
    && value.payTo === expected.payTo
    && value.maxTimeoutSeconds === expected.maxTimeoutSeconds;
}

export function resolveBtcAgentX402BaseSepoliaBinding(
  env: Readonly<Record<string, string | undefined>> = process.env,
): BtcAgentX402BaseSepoliaBinding {
  if (env.VERCEL_ENV === "production") {
    throw new BtcAgentX402BaseSepoliaBindingError("PRODUCTION_ENV_FORBIDDEN");
  }
  if (env[BTC_AGENT_X402_BASE_SEPOLIA_ENABLE_ENV] !== "true") {
    throw new BtcAgentX402BaseSepoliaBindingError("TESTNET_BINDING_DISABLED");
  }
  if (env[BTC_AGENT_X402_BASE_SEPOLIA_RECEIVER_NAME_ENV] !== BTC_AGENT_X402_BASE_SEPOLIA_RECEIVER_NAME) {
    throw new BtcAgentX402BaseSepoliaBindingError("RECEIVER_NAME_MISMATCH");
  }
  const payTo = env[BTC_AGENT_X402_BASE_SEPOLIA_RECEIVER_ADDRESS_ENV];
  if (!payTo) {
    throw new BtcAgentX402BaseSepoliaBindingError("RECEIVER_ADDRESS_MISSING");
  }
  if (!EVM_ADDRESS.test(payTo)) {
    throw new BtcAgentX402BaseSepoliaBindingError("RECEIVER_ADDRESS_INVALID");
  }
  return {
    schema_version: BTC_AGENT_X402_BASE_SEPOLIA_TESTNET_SCHEMA,
    testnet_only: true,
    production_payment_enabled: false,
    public_contract_unchanged: true,
    receiver_name: BTC_AGENT_X402_BASE_SEPOLIA_RECEIVER_NAME,
    pay_to: payTo,
  };
}

export function btcAgentX402BaseSepoliaPaymentRequirements(
  env: Readonly<Record<string, string | undefined>> = process.env,
): BtcAgentX402BaseSepoliaPaymentRequirements {
  const binding = resolveBtcAgentX402BaseSepoliaBinding(env);
  return {
    scheme: BTC_AGENT_X402_BASE_SEPOLIA_SCHEME,
    network: BTC_AGENT_X402_BASE_SEPOLIA_NETWORK,
    asset: BTC_AGENT_X402_BASE_SEPOLIA_ASSET,
    amount: BTC_AGENT_X402_BASE_SEPOLIA_AMOUNT_ATOMIC,
    payTo: binding.pay_to,
    maxTimeoutSeconds: BTC_AGENT_X402_BASE_SEPOLIA_MAX_TIMEOUT_SECONDS,
    extra: { name: "USDC", version: "2" },
  };
}

export function btcAgentX402BaseSepoliaPaymentRequired(
  resourceUrl: string,
  env: Readonly<Record<string, string | undefined>> = process.env,
): BtcAgentX402BaseSepoliaPaymentRequired {
  let parsed: URL;
  try {
    parsed = new URL(resourceUrl);
  } catch {
    throw new BtcAgentX402BaseSepoliaBindingError("RESOURCE_URL_INVALID");
  }
  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new BtcAgentX402BaseSepoliaBindingError("RESOURCE_URL_INVALID");
  }
  return {
    x402Version: BTC_AGENT_X402_BASE_SEPOLIA_VERSION,
    accepts: [btcAgentX402BaseSepoliaPaymentRequirements(env)],
    resource: {
      url: parsed.toString(),
      description: "BHRIGU BTC Evidence Answer V0 · Base Sepolia testnet",
      mimeType: "application/json",
    },
    error: "PAYMENT_REQUIRED",
  };
}

export function encodeBtcAgentX402PaymentRequiredHeader(
  paymentRequired: BtcAgentX402BaseSepoliaPaymentRequired,
): string {
  return Buffer.from(JSON.stringify(paymentRequired), "utf8").toString("base64");
}

export function decodeBtcAgentX402PaymentSignatureHeader(headerValue: string): Record<string, unknown> {
  try {
    const decoded = Buffer.from(headerValue, "base64").toString("utf8");
    const payload = JSON.parse(decoded);
    if (!isRecord(payload) || payload.x402Version !== BTC_AGENT_X402_BASE_SEPOLIA_VERSION) {
      throw new Error("invalid payload");
    }
    return payload;
  } catch {
    throw new BtcAgentX402BaseSepoliaBindingError("PAYMENT_SIGNATURE_INVALID");
  }
}

export function assertBtcAgentX402PaymentMatches(
  paymentPayload: Record<string, unknown>,
  requirements: BtcAgentX402BaseSepoliaPaymentRequirements,
): void {
  if (!sameRequirements(paymentPayload.accepted, requirements)) {
    throw new BtcAgentX402BaseSepoliaBindingError("PAYMENT_REQUIREMENTS_MISMATCH");
  }
}

export function btcAgentX402CdpVerifyRequest(
  paymentPayload: Record<string, unknown>,
  requirements: BtcAgentX402BaseSepoliaPaymentRequirements,
) {
  assertBtcAgentX402PaymentMatches(paymentPayload, requirements);
  return {
    x402Version: BTC_AGENT_X402_BASE_SEPOLIA_VERSION,
    paymentPayload,
    paymentRequirements: requirements,
  } as const;
}

export function btcAgentX402CdpSettleRequest(
  paymentPayload: Record<string, unknown>,
  requirements: BtcAgentX402BaseSepoliaPaymentRequirements,
) {
  assertBtcAgentX402PaymentMatches(paymentPayload, requirements);
  return {
    x402Version: BTC_AGENT_X402_BASE_SEPOLIA_VERSION,
    paymentPayload,
    paymentRequirements: requirements,
  } as const;
}
