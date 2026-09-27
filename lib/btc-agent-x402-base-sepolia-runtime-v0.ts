import {
  BtcAgentEvidenceError,
  BTC_AGENT_MAX_SOURCES,
  BTC_AGENT_MAX_VISIBLE_ANSWER_LINES,
  parseBtcAgentEvidenceRequestV0,
  sha256BtcAgent,
  type BtcAgentEvidenceRequestV0,
} from "./btc-agent-evidence-answer-v0";
import {
  runBtcDeclaredMachineEvidence,
  type BtcDeclaredMachineEvidenceResult,
} from "./btc-clean-chat-model-runtime";
import { nominalOpenAiCostMicros } from "./btc-observability-server";
import {
  BtcAgentX402BaseSepoliaBindingError,
  BTC_AGENT_X402_BASE_SEPOLIA_AMOUNT_ATOMIC,
  BTC_AGENT_X402_BASE_SEPOLIA_ASSET,
  BTC_AGENT_X402_BASE_SEPOLIA_NETWORK,
  BTC_AGENT_X402_BASE_SEPOLIA_PAYER_ADDRESS,
  BTC_AGENT_X402_BASE_SEPOLIA_RECEIVER_ADDRESS,
  btcAgentX402BaseSepoliaPaymentRequired,
  btcAgentX402BaseSepoliaPaymentRequirements,
  btcAgentX402CdpSettleRequest,
  btcAgentX402CdpVerifyRequest,
  decodeBtcAgentX402PaymentSignatureHeader,
  encodeBtcAgentX402PaymentRequiredHeader,
  type BtcAgentX402BaseSepoliaPaymentRequirements,
} from "./btc-agent-x402-base-sepolia-testnet-v0";

export const BTC_AGENT_X402_BASE_SEPOLIA_RUNTIME_SCHEMA =
  "bhrigu_btc_x402_base_sepolia_receipt_bound_runtime_v0" as const;
export const BTC_AGENT_X402_BASE_SEPOLIA_RECEIPT_SCHEMA =
  "bhrigu_btc_x402_base_sepolia_payment_receipt_v0" as const;
export const BTC_AGENT_X402_BASE_SEPOLIA_EVIDENCE_RESPONSE_SCHEMA =
  "bhrigu_btc_evidence_answer_base_sepolia_testnet_v0" as const;

const EVM_TRANSACTION_HASH = /^0x[0-9a-fA-F]{64}$/;
const EVM_ADDRESS = /^0x[0-9a-fA-F]{40}$/;

type EvidenceRuntime = typeof runBtcDeclaredMachineEvidence;

export type BtcAgentX402VerifyResult = {
  isValid: boolean;
  invalidReason?: string;
  invalidMessage?: string;
  payer?: string;
  extra?: unknown;
};

export type BtcAgentX402SettleResult = {
  success: boolean;
  errorReason?: string;
  errorMessage?: string;
  payer?: string;
  transaction?: string;
  network?: string;
  amount?: string;
  extra?: unknown;
};

export type BtcAgentX402BaseSepoliaAdapter = {
  verify(
    request: ReturnType<typeof btcAgentX402CdpVerifyRequest>,
  ): Promise<BtcAgentX402VerifyResult>;
  settle(
    request: ReturnType<typeof btcAgentX402CdpSettleRequest>,
  ): Promise<BtcAgentX402SettleResult>;
};

export type BtcAgentX402BaseSepoliaPaymentReceiptV0 = {
  schema_version: typeof BTC_AGENT_X402_BASE_SEPOLIA_RECEIPT_SCHEMA;
  protocol: "x402";
  network: typeof BTC_AGENT_X402_BASE_SEPOLIA_NETWORK;
  asset: typeof BTC_AGENT_X402_BASE_SEPOLIA_ASSET;
  amount_atomic: typeof BTC_AGENT_X402_BASE_SEPOLIA_AMOUNT_ATOMIC;
  payer: typeof BTC_AGENT_X402_BASE_SEPOLIA_PAYER_ADDRESS;
  receiver: typeof BTC_AGENT_X402_BASE_SEPOLIA_RECEIVER_ADDRESS;
  transaction: string;
};

export type BtcAgentX402BaseSepoliaEvidenceResponseV0 = {
  schema_version: typeof BTC_AGENT_X402_BASE_SEPOLIA_EVIDENCE_RESPONSE_SCHEMA;
  request_id: string;
  request_hash: string;
  query_class: BtcAgentEvidenceRequestV0["query_class"];
  topic: string;
  answer: string;
  as_of: string;
  sources: BtcDeclaredMachineEvidenceResult["sources"];
  evidence: BtcDeclaredMachineEvidenceResult["evidence"];
  boundary: {
    research_state_not_trade: true;
    no_trading_signal: true;
    no_financial_advice: true;
    no_fake_causality: true;
    future_not_established_fact: true;
    testnet_payment_only: true;
  };
  usage: BtcDeclaredMachineEvidenceResult["usage"] & {
    nominal_provider_cost_micros: number;
  };
  payment: BtcAgentX402BaseSepoliaPaymentReceiptV0;
  result_hash: string;
};

export type BtcAgentX402BaseSepoliaRuntimeResponse = {
  status: 200 | 402 | 413 | 422 | 502 | 503;
  headers: Record<string, string>;
  body: Record<string, unknown>;
};

export class BtcAgentX402BaseSepoliaRuntimeError extends Error {
  constructor(
    readonly code:
      | "PRODUCTION_ENV_FORBIDDEN"
      | "PAYMENT_PAYLOAD_INVALID"
      | "PAYMENT_PAYER_MISMATCH"
      | "PAYMENT_AUTHORIZATION_MISMATCH"
      | "VERIFY_FAILED"
      | "VERIFY_PAYER_MISMATCH"
      | "SETTLEMENT_FAILED"
      | "SETTLEMENT_RECEIPT_INVALID"
      | "SETTLEMENT_PAYER_MISMATCH"
      | "SETTLEMENT_NETWORK_MISMATCH"
      | "SETTLEMENT_AMOUNT_MISMATCH"
      | "CDP_ADAPTER_FAILURE",
    readonly status: 402 | 502 | 503,
  ) {
    super(code);
    this.name = "BtcAgentX402BaseSepoliaRuntimeError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function sameAddress(left: unknown, right: string): boolean {
  return typeof left === "string"
    && EVM_ADDRESS.test(left)
    && left.toLowerCase() === right.toLowerCase();
}

function assertPaymentAuthorization(
  paymentPayload: Record<string, unknown>,
  requirements: BtcAgentX402BaseSepoliaPaymentRequirements,
) {
  if (!isRecord(paymentPayload.payload)) {
    throw new BtcAgentX402BaseSepoliaRuntimeError("PAYMENT_PAYLOAD_INVALID", 402);
  }
  const signature = paymentPayload.payload.signature;
  const authorization = paymentPayload.payload.authorization;
  if (
    typeof signature !== "string"
    || !signature.startsWith("0x")
    || signature.length <= 2
    || !isRecord(authorization)
  ) {
    throw new BtcAgentX402BaseSepoliaRuntimeError("PAYMENT_PAYLOAD_INVALID", 402);
  }
  if (!sameAddress(authorization.from, BTC_AGENT_X402_BASE_SEPOLIA_PAYER_ADDRESS)) {
    throw new BtcAgentX402BaseSepoliaRuntimeError("PAYMENT_PAYER_MISMATCH", 402);
  }
  if (
    !sameAddress(authorization.to, BTC_AGENT_X402_BASE_SEPOLIA_RECEIVER_ADDRESS)
    || authorization.value !== requirements.amount
  ) {
    throw new BtcAgentX402BaseSepoliaRuntimeError("PAYMENT_AUTHORIZATION_MISMATCH", 402);
  }
}

function validateEvidenceRuntimeResult(result: BtcDeclaredMachineEvidenceResult) {
  const visibleLines = result.answer.split("\n").filter((line) => line.trim()).length;
  if (
    visibleLines < 1
    || visibleLines > BTC_AGENT_MAX_VISIBLE_ANSWER_LINES
    || result.sources.length > BTC_AGENT_MAX_SOURCES
    || result.usage.provider !== "NONE"
    || result.usage.model !== "DETERMINISTIC_EVIDENCE_V0"
    || result.usage.input_tokens !== 0
    || result.usage.output_tokens !== 0
    || result.usage.web_search_calls !== 0
  ) {
    throw new BtcAgentEvidenceError("MACHINE_RESPONSE_CONTRACT_INVALID", 503);
  }
}

async function executeReceiptBoundEvidence(
  request: BtcAgentEvidenceRequestV0,
  payment: BtcAgentX402BaseSepoliaPaymentReceiptV0,
  runtime: EvidenceRuntime,
): Promise<BtcAgentX402BaseSepoliaEvidenceResponseV0> {
  const requestHash = sha256BtcAgent(request);
  const requestId = `bhrigu-btc-base-sepolia-v0-${requestHash.slice("sha256:".length, "sha256:".length + 24)}`;
  let runtimeResult: BtcDeclaredMachineEvidenceResult;
  try {
    runtimeResult = await runtime({
      locale: request.locale,
      question: request.question,
      queryClass: request.query_class,
      protocolSubject: request.protocol_subject,
    });
  } catch (error) {
    if (error instanceof BtcAgentEvidenceError) throw error;
    if (error instanceof Error && error.message === "MACHINE_SOURCE_UNAVAILABLE") {
      throw new BtcAgentEvidenceError("MACHINE_SOURCE_UNAVAILABLE", 503);
    }
    throw error;
  }

  validateEvidenceRuntimeResult(runtimeResult);
  const nominalProviderCostMicros = nominalOpenAiCostMicros(
    runtimeResult.usage.input_tokens,
    runtimeResult.usage.output_tokens,
    runtimeResult.usage.web_search_calls,
  );
  if (nominalProviderCostMicros !== 0) {
    throw new BtcAgentEvidenceError("MACHINE_RESPONSE_CONTRACT_INVALID", 503);
  }

  const boundary = {
    research_state_not_trade: true,
    no_trading_signal: true,
    no_financial_advice: true,
    no_fake_causality: true,
    future_not_established_fact: true,
    testnet_payment_only: true,
  } as const;
  const usage = {
    ...runtimeResult.usage,
    nominal_provider_cost_micros: nominalProviderCostMicros,
  };
  const resultBasis = {
    request_hash: requestHash,
    query_class: request.query_class,
    topic: runtimeResult.topic,
    answer: runtimeResult.answer,
    sources: runtimeResult.sources,
    evidence: runtimeResult.evidence,
    boundary,
    usage,
    payment,
  };

  return {
    schema_version: BTC_AGENT_X402_BASE_SEPOLIA_EVIDENCE_RESPONSE_SCHEMA,
    request_id: requestId,
    request_hash: requestHash,
    query_class: request.query_class,
    topic: runtimeResult.topic,
    answer: runtimeResult.answer,
    as_of: runtimeResult.as_of,
    sources: runtimeResult.sources,
    evidence: runtimeResult.evidence,
    boundary,
    usage,
    payment,
    result_hash: sha256BtcAgent(resultBasis),
  };
}

function settlementReceipt(result: BtcAgentX402SettleResult): BtcAgentX402BaseSepoliaPaymentReceiptV0 {
  if (!result.success) {
    throw new BtcAgentX402BaseSepoliaRuntimeError("SETTLEMENT_FAILED", 402);
  }
  if (!sameAddress(result.payer, BTC_AGENT_X402_BASE_SEPOLIA_PAYER_ADDRESS)) {
    throw new BtcAgentX402BaseSepoliaRuntimeError("SETTLEMENT_PAYER_MISMATCH", 502);
  }
  if (result.network !== BTC_AGENT_X402_BASE_SEPOLIA_NETWORK) {
    throw new BtcAgentX402BaseSepoliaRuntimeError("SETTLEMENT_NETWORK_MISMATCH", 502);
  }
  if (result.amount !== BTC_AGENT_X402_BASE_SEPOLIA_AMOUNT_ATOMIC) {
    throw new BtcAgentX402BaseSepoliaRuntimeError("SETTLEMENT_AMOUNT_MISMATCH", 502);
  }
  if (typeof result.transaction !== "string" || !EVM_TRANSACTION_HASH.test(result.transaction)) {
    throw new BtcAgentX402BaseSepoliaRuntimeError("SETTLEMENT_RECEIPT_INVALID", 502);
  }
  return {
    schema_version: BTC_AGENT_X402_BASE_SEPOLIA_RECEIPT_SCHEMA,
    protocol: "x402",
    network: BTC_AGENT_X402_BASE_SEPOLIA_NETWORK,
    asset: BTC_AGENT_X402_BASE_SEPOLIA_ASSET,
    amount_atomic: BTC_AGENT_X402_BASE_SEPOLIA_AMOUNT_ATOMIC,
    payer: BTC_AGENT_X402_BASE_SEPOLIA_PAYER_ADDRESS,
    receiver: BTC_AGENT_X402_BASE_SEPOLIA_RECEIVER_ADDRESS,
    transaction: result.transaction,
  };
}

function errorResponse(error: unknown): BtcAgentX402BaseSepoliaRuntimeResponse {
  if (error instanceof BtcAgentEvidenceError) {
    return { status: error.status, headers: {}, body: { ok: false, code: error.code } };
  }
  if (error instanceof BtcAgentX402BaseSepoliaRuntimeError) {
    return { status: error.status, headers: {}, body: { ok: false, code: error.code } };
  }
  if (error instanceof BtcAgentX402BaseSepoliaBindingError) {
    const status = error.code === "PRODUCTION_ENV_FORBIDDEN" ? 503 : 402;
    return { status, headers: {}, body: { ok: false, code: error.code } };
  }
  return { status: 503, headers: {}, body: { ok: false, code: "RUNTIME_FAILURE" } };
}

export async function handleBtcAgentX402BaseSepoliaRuntime(
  input: {
    body: unknown;
    paymentSignatureHeader?: string;
    resourceUrl: string;
    env?: Readonly<Record<string, string | undefined>>;
  },
  options: {
    adapter: BtcAgentX402BaseSepoliaAdapter;
    evidenceRuntime?: EvidenceRuntime;
  },
): Promise<BtcAgentX402BaseSepoliaRuntimeResponse> {
  const env = input.env ?? process.env;
  if (env.VERCEL_ENV === "production") {
    return errorResponse(new BtcAgentX402BaseSepoliaRuntimeError("PRODUCTION_ENV_FORBIDDEN", 503));
  }

  try {
    const request = parseBtcAgentEvidenceRequestV0(input.body);
    const paymentRequired = btcAgentX402BaseSepoliaPaymentRequired(input.resourceUrl, env);
    const requirements = btcAgentX402BaseSepoliaPaymentRequirements(env);

    if (!input.paymentSignatureHeader) {
      return {
        status: 402,
        headers: {
          "PAYMENT-REQUIRED": encodeBtcAgentX402PaymentRequiredHeader(paymentRequired),
          "Cache-Control": "private, no-store, max-age=0, must-revalidate",
        },
        body: {
          ok: false,
          code: "PAYMENT_REQUIRED",
          runtime_schema: BTC_AGENT_X402_BASE_SEPOLIA_RUNTIME_SCHEMA,
          payment_required: paymentRequired,
        },
      };
    }

    const paymentPayload = decodeBtcAgentX402PaymentSignatureHeader(input.paymentSignatureHeader);
    assertPaymentAuthorization(paymentPayload, requirements);
    const verifyRequest = btcAgentX402CdpVerifyRequest(paymentPayload, requirements);

    let verifyResult: BtcAgentX402VerifyResult;
    try {
      verifyResult = await options.adapter.verify(verifyRequest);
    } catch {
      throw new BtcAgentX402BaseSepoliaRuntimeError("CDP_ADAPTER_FAILURE", 503);
    }
    if (!verifyResult.isValid) {
      throw new BtcAgentX402BaseSepoliaRuntimeError("VERIFY_FAILED", 402);
    }
    if (!sameAddress(verifyResult.payer, BTC_AGENT_X402_BASE_SEPOLIA_PAYER_ADDRESS)) {
      throw new BtcAgentX402BaseSepoliaRuntimeError("VERIFY_PAYER_MISMATCH", 502);
    }

    const settleRequest = btcAgentX402CdpSettleRequest(paymentPayload, requirements);
    let settleResult: BtcAgentX402SettleResult;
    try {
      settleResult = await options.adapter.settle(settleRequest);
    } catch {
      throw new BtcAgentX402BaseSepoliaRuntimeError("CDP_ADAPTER_FAILURE", 503);
    }

    const receipt = settlementReceipt(settleResult);
    const evidence = await executeReceiptBoundEvidence(
      request,
      receipt,
      options.evidenceRuntime ?? runBtcDeclaredMachineEvidence,
    );
    return {
      status: 200,
      headers: {
        "Cache-Control": "private, no-store, max-age=0, must-revalidate",
        "X-BHRIGU-x402-Testnet-Transaction": receipt.transaction,
      },
      body: { ok: true, result: evidence },
    };
  } catch (error) {
    return errorResponse(error);
  }
}
