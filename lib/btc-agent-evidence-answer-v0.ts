import { createHash } from "node:crypto";
import {
  runBtcDeclaredMachineEvidence,
  type BtcDeclaredMachineEvidenceResult,
  type BtcDeclaredMachineProtocolSubject,
  type BtcDeclaredMachineQueryClass,
} from "./btc-clean-chat-model-runtime";
import { nominalOpenAiCostMicros } from "./btc-observability-server";

export const BTC_AGENT_EVIDENCE_REQUEST_SCHEMA = "bhrigu_btc_evidence_answer_request_v0" as const;
export const BTC_AGENT_EVIDENCE_RESPONSE_SCHEMA = "bhrigu_btc_evidence_answer_v0" as const;
export const BTC_AGENT_MAX_REQUEST_BODY_BYTES = 4096 as const;
export const BTC_AGENT_MAX_PROVIDER_REQUEST_BYTES = 24576 as const;
export const BTC_AGENT_MAX_PROVIDER_HARD_COST_MICROS = 147520 as const;
export const BTC_AGENT_MAX_MODEL_OUTPUT_TOKENS = 480 as const;
export const BTC_AGENT_MAX_VISIBLE_ANSWER_LINES = 5 as const;
export const BTC_AGENT_MAX_SOURCES = 12 as const;

const QUERY_CLASSES = new Set<BtcDeclaredMachineQueryClass>([
  "BTC_FIELD_NOW",
  "BTC_CHANGE_MEMORY",
  "BITCOIN_PROTOCOL",
]);

const PROTOCOL_SUBJECTS = new Set<BtcDeclaredMachineProtocolSubject>([
  "overview",
  "supply",
  "halving",
  "subsidy",
  "fees",
  "difficulty",
  "mining",
  "utxo",
  "genesis",
  "consensus",
  "blocks",
  "satoshi_history",
  "bitcoin_origin",
  "genesis_history",
]);

const REQUEST_KEYS = new Set([
  "schema_version",
  "query_class",
  "locale",
  "question",
  "protocol_subject",
]);

const TRADING_INSTRUCTION = /(?:\b(?:buy|sell)\s+(?:btc|bitcoin)\b|\b(?:go|open|enter)\s+(?:a\s+)?(?:long|short)\b|\b(?:leverage|position\s+sizing|stop[- ]loss|take[- ]profit|entry\s+price|exit\s+price)\b|(?:купи|покупай|продай|продавай)\s+(?:btc|биткоин)|(?:открой|войти|входить)\s+(?:в\s+)?(?:лонг|шорт)|(?:плечо|размер\s+позиции|стоп[- ]лосс|тейк[- ]профит))/i;

export type BtcAgentEvidenceRequestV0 = {
  schema_version: typeof BTC_AGENT_EVIDENCE_REQUEST_SCHEMA;
  query_class: BtcDeclaredMachineQueryClass;
  locale: "en" | "ru";
  question: string;
  protocol_subject: BtcDeclaredMachineProtocolSubject | null;
};

export type BtcAgentPaymentReceiptV0 = {
  protocol: "x402";
  network: "eip155:8453";
  asset: "USDC";
  amount_atomic: "500000";
  payer: string;
  transaction: string;
};

export type BtcAgentEvidenceResponseV0 = {
  schema_version: typeof BTC_AGENT_EVIDENCE_RESPONSE_SCHEMA;
  request_id: string;
  request_hash: string;
  query_class: BtcDeclaredMachineQueryClass;
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
  };
  usage: BtcDeclaredMachineEvidenceResult["usage"] & {
    nominal_provider_cost_micros: number;
  };
  payment: BtcAgentPaymentReceiptV0;
  result_hash: string;
};

export class BtcAgentEvidenceError extends Error {
  constructor(
    readonly code:
      | "REQUEST_INVALID"
      | "REQUEST_TOO_LARGE"
      | "TRADING_INSTRUCTION_FORBIDDEN"
      | "MACHINE_QUERY_COST_BOUND_EXCEEDED"
      | "MACHINE_SOURCE_UNAVAILABLE"
      | "MACHINE_RESPONSE_CONTRACT_INVALID",
    readonly status: 413 | 422 | 503,
  ) {
    super(code);
    this.name = "BtcAgentEvidenceError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function canonicalValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalValue);
  if (!isRecord(value)) return value;
  return Object.fromEntries(
    Object.keys(value)
      .sort()
      .map((key) => [key, canonicalValue(value[key])]),
  );
}

export function canonicalBtcAgentJson(value: unknown): string {
  return JSON.stringify(canonicalValue(value));
}

export function sha256BtcAgent(value: unknown): string {
  return `sha256:${createHash("sha256").update(canonicalBtcAgentJson(value), "utf8").digest("hex")}`;
}

export function btcAgentRequestBodyBytes(value: unknown): number {
  return Buffer.byteLength(JSON.stringify(value), "utf8");
}

export function parseBtcAgentEvidenceRequestV0(value: unknown): BtcAgentEvidenceRequestV0 {
  if (!isRecord(value)) throw new BtcAgentEvidenceError("REQUEST_INVALID", 422);
  if (btcAgentRequestBodyBytes(value) > BTC_AGENT_MAX_REQUEST_BODY_BYTES) {
    throw new BtcAgentEvidenceError("REQUEST_TOO_LARGE", 413);
  }
  const keys = Object.keys(value);
  if (keys.length !== REQUEST_KEYS.size || keys.some((key) => !REQUEST_KEYS.has(key))) {
    throw new BtcAgentEvidenceError("REQUEST_INVALID", 422);
  }
  if (value.schema_version !== BTC_AGENT_EVIDENCE_REQUEST_SCHEMA) {
    throw new BtcAgentEvidenceError("REQUEST_INVALID", 422);
  }
  if (typeof value.query_class !== "string" || !QUERY_CLASSES.has(value.query_class as BtcDeclaredMachineQueryClass)) {
    throw new BtcAgentEvidenceError("REQUEST_INVALID", 422);
  }
  if (value.locale !== "en" && value.locale !== "ru") {
    throw new BtcAgentEvidenceError("REQUEST_INVALID", 422);
  }
  if (typeof value.question !== "string") throw new BtcAgentEvidenceError("REQUEST_INVALID", 422);
  const question = value.question.trim();
  if (question.length < 2 || question.length > 280) {
    throw new BtcAgentEvidenceError("REQUEST_INVALID", 422);
  }
  if (TRADING_INSTRUCTION.test(question)) {
    throw new BtcAgentEvidenceError("TRADING_INSTRUCTION_FORBIDDEN", 422);
  }

  const queryClass = value.query_class as BtcDeclaredMachineQueryClass;
  const protocolSubject = value.protocol_subject;
  if (queryClass === "BITCOIN_PROTOCOL") {
    if (protocolSubject !== null && (
      typeof protocolSubject !== "string"
      || !PROTOCOL_SUBJECTS.has(protocolSubject as BtcDeclaredMachineProtocolSubject)
    )) {
      throw new BtcAgentEvidenceError("REQUEST_INVALID", 422);
    }
  } else if (protocolSubject !== null) {
    throw new BtcAgentEvidenceError("REQUEST_INVALID", 422);
  }

  return {
    schema_version: BTC_AGENT_EVIDENCE_REQUEST_SCHEMA,
    query_class: queryClass,
    locale: value.locale,
    question,
    protocol_subject: protocolSubject as BtcDeclaredMachineProtocolSubject | null,
  };
}

export function assertBtcAgentProviderBounds(bounds: { serializedBytes: number; hardCostMicros: number }) {
  if (
    !Number.isSafeInteger(bounds.serializedBytes)
    || bounds.serializedBytes < 0
    || bounds.serializedBytes > BTC_AGENT_MAX_PROVIDER_REQUEST_BYTES
    || !Number.isSafeInteger(bounds.hardCostMicros)
    || bounds.hardCostMicros < 0
    || bounds.hardCostMicros > BTC_AGENT_MAX_PROVIDER_HARD_COST_MICROS
  ) {
    throw new BtcAgentEvidenceError("MACHINE_QUERY_COST_BOUND_EXCEEDED", 422);
  }
}

function validateRuntimeResult(result: BtcDeclaredMachineEvidenceResult) {
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

type MachineRuntime = typeof runBtcDeclaredMachineEvidence;

export async function executeBtcAgentEvidenceAnswerV0(
  request: BtcAgentEvidenceRequestV0,
  payment: BtcAgentPaymentReceiptV0,
  options: { runtime?: MachineRuntime } = {},
): Promise<BtcAgentEvidenceResponseV0> {
  const requestHash = sha256BtcAgent(request);
  const requestId = `bhrigu-btc-v0-${requestHash.slice("sha256:".length, "sha256:".length + 24)}`;
  const runtime = options.runtime ?? runBtcDeclaredMachineEvidence;

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

  validateRuntimeResult(runtimeResult);
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
  } as const;

  const resultBasis = {
    request_hash: requestHash,
    query_class: request.query_class,
    topic: runtimeResult.topic,
    answer: runtimeResult.answer,
    sources: runtimeResult.sources,
    evidence: runtimeResult.evidence,
    boundary,
    usage: {
      ...runtimeResult.usage,
      nominal_provider_cost_micros: nominalProviderCostMicros,
    },
    payment_contract: {
      protocol: payment.protocol,
      network: payment.network,
      asset: payment.asset,
      amount_atomic: payment.amount_atomic,
    },
  };

  return {
    schema_version: BTC_AGENT_EVIDENCE_RESPONSE_SCHEMA,
    request_id: requestId,
    request_hash: requestHash,
    query_class: request.query_class,
    topic: runtimeResult.topic,
    answer: runtimeResult.answer,
    as_of: runtimeResult.as_of,
    sources: runtimeResult.sources,
    evidence: runtimeResult.evidence,
    boundary,
    usage: {
      ...runtimeResult.usage,
      nominal_provider_cost_micros: nominalProviderCostMicros,
    },
    payment,
    result_hash: sha256BtcAgent(resultBasis),
  };
}
