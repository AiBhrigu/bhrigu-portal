import { createHash, randomUUID } from "node:crypto";

export const BTC_DIRECT_FX_SOURCE = "coingecko_simple_price_btc_usd";
export const BTC_DIRECT_USD_PRICE_CENTS = 4900;
export const BTC_DIRECT_QUOTE_TTL_MS = 15 * 60 * 1000;
export const BTC_DIRECT_SOURCE_STALE_MS = 120 * 1000;
export const BTC_DIRECT_SERVICE_MS = 30 * 24 * 60 * 60 * 1000;
export const BTC_DIRECT_ACTIVATION_CLAIM_TTL_MS = 5 * 60 * 1000;

export type BtcDirectQuoteState =
  | "quote_created"
  | "payment_pending"
  | "expired"
  | "manual_review"
  | "paid_confirmed"
  | "activated";
export type BtcDirectPaymentState =
  | "mempool_seen"
  | "paid_confirmed"
  | "manual_review"
  | "reorg_review";
export type BtcDirectActivationState =
  | "pending"
  | "activating"
  | "retryable"
  | "active";

export interface BtcDirectQuoteRecord {
  quoteId: string;
  applicationId: string;
  idempotencyKey: string;
  idempotencyPayloadHash: string;
  usdPriceCents: number;
  fxSource: typeof BTC_DIRECT_FX_SOURCE;
  fxRateDecimal: string;
  fxTimestamp: string;
  quoteExpiresAt: string;
  satAmountInteger: string;
  receiverAddressId: string;
  receiveAddress: string;
  quoteState: BtcDirectQuoteState;
  createdAt: string;
  updatedAt: string;
}

export interface BtcDirectPaymentRecord {
  paymentId: string;
  quoteId: string;
  txid: string;
  txVout: number;
  observedSats: string;
  blockHeight: string | null;
  blockHash: string | null;
  confirmations: number;
  paymentState: BtcDirectPaymentState;
  firstSeenAt: string;
  confirmedAt: string | null;
  updatedAt: string;
}

export interface BtcDirectActivationRecord {
  activationId: string;
  applicationId: string;
  paymentId: string;
  activationKey: string;
  state: BtcDirectActivationState;
  serviceStart: string | null;
  serviceEnd: string | null;
  createdAt: string;
  updatedAt: string;
  claimToken: string | null;
  claimedAt: string | null;
}

export interface BtcDirectPaymentStore {
  findQuoteByIdempotencyKey(key: string): Promise<BtcDirectQuoteRecord | null>;
  isAcceptedApplication(applicationId: string): Promise<boolean>;
  reserveQuote(input: BtcDirectQuoteRecord): Promise<{
    disposition: "created" | "replay" | "conflict" | "application_quote_exists" | "address_unavailable";
    quote: BtcDirectQuoteRecord | null;
  }>;
  markQuotePending(quoteId: string, at: string): Promise<BtcDirectQuoteRecord>;
  expireQuote(quoteId: string, at: string): Promise<BtcDirectQuoteRecord>;
  findQuoteByReceiverAddressId(receiverAddressId: string): Promise<BtcDirectQuoteRecord | null>;
  markQuoteState(quoteId: string, state: BtcDirectQuoteState, at: string): Promise<void>;
  findPaymentByOutput(txid: string, txVout: number): Promise<BtcDirectPaymentRecord | null>;
  upsertPayment(input: BtcDirectPaymentRecord): Promise<BtcDirectPaymentRecord>;
  findActivationByApplicationId(applicationId: string): Promise<BtcDirectActivationRecord | null>;
  reserveActivation(input: BtcDirectActivationRecord): Promise<BtcDirectActivationRecord>;
  claimActivation(activationId: string, claimToken: string, at: string, staleBefore: string): Promise<{ claimed: boolean; activation: BtcDirectActivationRecord }>;
  completeActivation(
    activationId: string,
    serviceStart: string,
    serviceEnd: string,
    at: string,
    claimToken: string
  ): Promise<BtcDirectActivationRecord>;
  failActivation(activationId: string, at: string, claimToken: string): Promise<BtcDirectActivationRecord>;
}

export interface BtcUsdQuoteSource {
  fetch(): Promise<{ rateDecimal: string; sourceTimestamp: string }>;
}

export class BtcDirectPaymentError extends Error {
  constructor(
    public code:
      | "invalid_idempotency_key"
      | "idempotency_conflict"
      | "application_not_accepted"
      | "application_quote_exists"
      | "fx_unavailable"
      | "fx_stale"
      | "address_unavailable"
      | "invalid_observation"
      | "receiver_address_unknown"
      | "output_integrity_conflict",
    message: string
  ) {
    super(message);
    this.name = "BtcDirectPaymentError";
  }
}

export async function createBtcDirectQuote(input: {
  applicationId: string;
  idempotencyKey: string;
  store: BtcDirectPaymentStore;
  source: BtcUsdQuoteSource;
  now?: () => Date;
  quoteId?: () => string;
}): Promise<BtcDirectQuoteRecord & { bip321Uri: string }> {
  const applicationId = normalizeOpaqueId(input.applicationId, 8, 160);
  const idempotencyKey = normalizeIdempotencyKey(input.idempotencyKey);
  if (!applicationId || !idempotencyKey) {
    throw new BtcDirectPaymentError(
      "invalid_idempotency_key",
      "A valid application id and idempotency key are required."
    );
  }

  const payloadHash = hashCanonical({ applicationId });
  const existing = await input.store.findQuoteByIdempotencyKey(idempotencyKey);
  if (existing) {
    if (existing.idempotencyPayloadHash !== payloadHash) {
      throw new BtcDirectPaymentError("idempotency_conflict", "Conflicting quote replay.");
    }
    return { ...existing, bip321Uri: buildBip321Uri(existing.receiveAddress, existing.satAmountInteger) };
  }

  if (!(await input.store.isAcceptedApplication(applicationId))) {
    throw new BtcDirectPaymentError(
      "application_not_accepted",
      "The application is not accepted for payment."
    );
  }

  const now = input.now ?? (() => new Date());
  const at = now();
  let provider: Awaited<ReturnType<BtcUsdQuoteSource["fetch"]>>;
  try {
    provider = await input.source.fetch();
  } catch {
    throw new BtcDirectPaymentError("fx_unavailable", "BTC/USD quote source unavailable.");
  }

  const rate = parsePositiveDecimal(provider.rateDecimal);
  const sourceTime = new Date(provider.sourceTimestamp);
  if (!rate || Number.isNaN(sourceTime.getTime())) {
    throw new BtcDirectPaymentError("fx_unavailable", "BTC/USD quote source invalid.");
  }
  const sourceAge = at.getTime() - sourceTime.getTime();
  if (sourceAge < -60_000 || sourceAge > BTC_DIRECT_SOURCE_STALE_MS) {
    throw new BtcDirectPaymentError("fx_stale", "BTC/USD quote source is stale.");
  }

  const satAmount = ceilUsdCentsToSats(BTC_DIRECT_USD_PRICE_CENTS, provider.rateDecimal);
  const createdAt = at.toISOString();
  const quote: BtcDirectQuoteRecord = {
    quoteId: input.quoteId?.() ?? `btcq_${randomUUID()}`,
    applicationId,
    idempotencyKey,
    idempotencyPayloadHash: payloadHash,
    usdPriceCents: BTC_DIRECT_USD_PRICE_CENTS,
    fxSource: BTC_DIRECT_FX_SOURCE,
    fxRateDecimal: provider.rateDecimal,
    fxTimestamp: sourceTime.toISOString(),
    quoteExpiresAt: new Date(at.getTime() + BTC_DIRECT_QUOTE_TTL_MS).toISOString(),
    satAmountInteger: satAmount.toString(),
    receiverAddressId: "",
    receiveAddress: "",
    quoteState: "quote_created",
    createdAt,
    updatedAt: createdAt,
  };

  const reserved = await input.store.reserveQuote(quote);
  if (reserved.disposition === "conflict") {
    throw new BtcDirectPaymentError("idempotency_conflict", "Conflicting quote replay.");
  }
  if (reserved.disposition === "application_quote_exists") {
    throw new BtcDirectPaymentError("application_quote_exists", "This application already has a live quote.");
  }
  if (reserved.disposition === "address_unavailable" || !reserved.quote) {
    throw new BtcDirectPaymentError("address_unavailable", "No unused receive address is available.");
  }
  if (reserved.quote.idempotencyPayloadHash !== payloadHash) {
    throw new BtcDirectPaymentError("idempotency_conflict", "Conflicting quote replay.");
  }

  const pending =
    reserved.quote.quoteState === "quote_created"
      ? await input.store.markQuotePending(reserved.quote.quoteId, now().toISOString())
      : reserved.quote;
  return { ...pending, bip321Uri: buildBip321Uri(pending.receiveAddress, pending.satAmountInteger) };
}

export async function observeBtcDirectPayment(input: {
  observation: unknown;
  store: BtcDirectPaymentStore;
  now?: () => Date;
  paymentId?: () => string;
  activationId?: () => string;
  activationEffect?: () => Promise<void>;
}): Promise<{
  quote: BtcDirectQuoteRecord;
  payment: BtcDirectPaymentRecord;
  activation: BtcDirectActivationRecord | null;
}> {
  const observation = parseObservation(input.observation);
  if (!observation) {
    throw new BtcDirectPaymentError("invalid_observation", "Invalid payment observation.");
  }
  const quote = await input.store.findQuoteByReceiverAddressId(observation.receiverAddressId);
  if (!quote) {
    throw new BtcDirectPaymentError("receiver_address_unknown", "Unknown receiver address id.");
  }

  const now = input.now ?? (() => new Date());
  const observedAt = new Date(observation.observedAt);
  const existingOutput = await input.store.findPaymentByOutput(observation.txid, observation.txVout);
  if (existingOutput && (existingOutput.quoteId !== quote.quoteId || existingOutput.observedSats !== observation.observedSats)) {
    throw new BtcDirectPaymentError("output_integrity_conflict", "Blockchain output identity conflict.");
  }
  const existingActivation = await input.store.findActivationByApplicationId(quote.applicationId);
  const firstSeenAt = existingOutput?.firstSeenAt ?? observedAt.toISOString();
  const quoteExpired = new Date(firstSeenAt).getTime() > new Date(quote.quoteExpiresAt).getTime();
  const exactAmount = observation.observedSats === quote.satAmountInteger;

  let proposedState: BtcDirectPaymentState;
  if (existingOutput?.paymentState === "paid_confirmed" && (observation.confirmations < 1 || !observation.spvVerified)) {
    proposedState = "reorg_review";
  } else if (quote.quoteState === "manual_review") {
    proposedState = "manual_review";
  } else if (existingActivation && existingOutput?.paymentId !== existingActivation.paymentId) {
    proposedState = "manual_review";
  } else if (!exactAmount || quoteExpired) {
    proposedState = "manual_review";
  } else if (observation.confirmations >= 1 && observation.spvVerified && observation.blockHeight !== null) {
    proposedState = "paid_confirmed";
  } else {
    proposedState = "mempool_seen";
  }
  const paymentState = resolvePaymentState(existingOutput?.paymentState ?? null, proposedState);

  const payment: BtcDirectPaymentRecord = {
    paymentId: existingOutput?.paymentId ?? input.paymentId?.() ?? `btcp_${randomUUID()}`,
    quoteId: quote.quoteId,
    txid: observation.txid,
    txVout: observation.txVout,
    observedSats: observation.observedSats,
    blockHeight: observation.blockHeight,
    blockHash: observation.blockHash,
    confirmations: observation.confirmations,
    paymentState,
    firstSeenAt,
    confirmedAt:
      paymentState === "paid_confirmed"
        ? existingOutput?.confirmedAt ?? observedAt.toISOString()
        : existingOutput?.confirmedAt ?? null,
    updatedAt: observedAt.toISOString(),
  };
  let storedPayment: BtcDirectPaymentRecord;
  try {
    storedPayment = await input.store.upsertPayment(payment);
  } catch (error) {
    if (error instanceof Error && error.message === "payment_output_integrity_conflict") {
      throw new BtcDirectPaymentError("output_integrity_conflict", "Blockchain output identity conflict.");
    }
    throw error;
  }

  if (storedPayment.paymentState === "mempool_seen") {
    return { quote, payment: storedPayment, activation: null };
  }
  if (storedPayment.paymentState === "manual_review" || storedPayment.paymentState === "reorg_review") {
    await input.store.markQuoteState(quote.quoteId, "manual_review", observedAt.toISOString());
    return { quote, payment: storedPayment, activation: existingActivation };
  }

  await input.store.markQuoteState(quote.quoteId, "paid_confirmed", observedAt.toISOString());
  const activation = await activateBtcDirectPayment({
    applicationId: quote.applicationId,
    payment: storedPayment,
    store: input.store,
    now,
    activationId: input.activationId,
    activationEffect: input.activationEffect,
  });
  if (activation.state === "active") {
    await input.store.markQuoteState(quote.quoteId, "activated", activation.updatedAt);
  }
  return { quote, payment: storedPayment, activation };
}

function resolvePaymentState(existing: BtcDirectPaymentState | null, proposed: BtcDirectPaymentState): BtcDirectPaymentState {
  if (existing === "manual_review") return "manual_review";
  if (existing === "reorg_review") return "reorg_review";
  if (existing === "paid_confirmed") return proposed === "reorg_review" ? "reorg_review" : "paid_confirmed";
  return proposed;
}

export async function activateBtcDirectPayment(input: {
  applicationId: string;
  payment: BtcDirectPaymentRecord;
  store: BtcDirectPaymentStore;
  now?: () => Date;
  activationId?: () => string;
  activationEffect?: () => Promise<void>;
}): Promise<BtcDirectActivationRecord> {
  const now = input.now ?? (() => new Date());
  const existingForApplication = await input.store.findActivationByApplicationId(input.applicationId);
  if (existingForApplication?.state === "active") return existingForApplication;

  const createdAt = now().toISOString();
  const reserved = await input.store.reserveActivation(
    existingForApplication ?? {
      activationId: input.activationId?.() ?? `btca_${randomUUID()}`,
      applicationId: input.applicationId,
      paymentId: input.payment.paymentId,
      activationKey: `${input.applicationId}:${input.payment.txid}`,
      state: "pending",
      serviceStart: null,
      serviceEnd: null,
      createdAt,
      updatedAt: createdAt,
      claimToken: null,
      claimedAt: null,
    }
  );
  if (reserved.state === "active") return reserved;

  const claimToken = randomUUID();
  const claimAt = now();
  const claim = await input.store.claimActivation(
    reserved.activationId,
    claimToken,
    claimAt.toISOString(),
    new Date(claimAt.getTime() - BTC_DIRECT_ACTIVATION_CLAIM_TTL_MS).toISOString()
  );
  if (!claim.claimed) return claim.activation;

  try {
    await input.activationEffect?.();
  } catch {
    return input.store.failActivation(claim.activation.activationId, now().toISOString(), claimToken);
  }

  const serviceStart = now();
  const serviceEnd = new Date(serviceStart.getTime() + BTC_DIRECT_SERVICE_MS);
  return input.store.completeActivation(
    claim.activation.activationId,
    serviceStart.toISOString(),
    serviceEnd.toISOString(),
    serviceStart.toISOString(),
    claimToken
  );
}

export async function expireBtcDirectQuote(input: {
  quote: BtcDirectQuoteRecord;
  store: BtcDirectPaymentStore;
  now?: () => Date;
}): Promise<BtcDirectQuoteRecord> {
  const now = input.now ?? (() => new Date());
  const at = now();
  if (at.getTime() <= new Date(input.quote.quoteExpiresAt).getTime()) return input.quote;
  if (["paid_confirmed", "activated"].includes(input.quote.quoteState)) return input.quote;
  return input.store.expireQuote(input.quote.quoteId, at.toISOString());
}

export function buildBip321Uri(address: string, sats: string): string {
  if (!address || !/^[A-Za-z0-9]{14,120}$/.test(address)) {
    throw new BtcDirectPaymentError("address_unavailable", "Invalid receive address.");
  }
  const amount = satsToBtcDecimal(sats);
  return `bitcoin:${address}?amount=${amount}`;
}

export function satsToBtcDecimal(sats: string): string {
  const value = BigInt(sats);
  if (value <= BigInt(0)) throw new Error("invalid_sats");
  const whole = value / BigInt(100_000_000);
  const fraction = (value % BigInt(100_000_000)).toString().padStart(8, "0").replace(/0+$/, "");
  return fraction ? `${whole}.${fraction}` : whole.toString();
}

export function ceilUsdCentsToSats(usdPriceCents: number, rateDecimal: string): bigint {
  if (!Number.isInteger(usdPriceCents) || usdPriceCents <= 0) throw new Error("invalid_usd_cents");
  const parsed = parsePositiveDecimal(rateDecimal);
  if (!parsed) throw new Error("invalid_rate");
  const numerator = BigInt(usdPriceCents) * BigInt(1_000_000) * parsed.scale;
  return ceilDiv(numerator, parsed.integer);
}

export function hashCanonical(value: unknown): string {
  return createHash("sha256").update(stableJson(value)).digest("hex");
}

function parsePositiveDecimal(value: string): { integer: bigint; scale: bigint } | null {
  const normalized = String(value).trim();
  if (!/^\d+(?:\.\d{1,40})?$/.test(normalized)) return null;
  const [whole, fraction = ""] = normalized.split(".");
  const scale = BigInt(`1${"0".repeat(fraction.length)}`);
  const integer = BigInt(whole) * scale + BigInt(fraction || "0");
  return integer > BigInt(0) ? { integer, scale } : null;
}

function ceilDiv(a: bigint, b: bigint): bigint {
  return (a + b - BigInt(1)) / b;
}

function normalizeIdempotencyKey(value: string): string | null {
  const normalized = String(value ?? "").trim();
  if (normalized.length < 16 || normalized.length > 128) return null;
  return /^[A-Za-z0-9._:-]+$/.test(normalized) ? normalized : null;
}

function normalizeOpaqueId(value: string, min: number, max: number): string | null {
  const normalized = String(value ?? "").trim();
  if (normalized.length < min || normalized.length > max) return null;
  return /^[A-Za-z0-9._:-]+$/.test(normalized) ? normalized : null;
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, child]) => `${JSON.stringify(key)}:${stableJson(child)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

type ParsedObservation = {
  receiverAddressId: string;
  txid: string;
  txVout: number;
  observedSats: string;
  confirmations: number;
  blockHeight: string | null;
  blockHash: string | null;
  observedAt: string;
  spvVerified: boolean;
};

function parseObservation(value: unknown): ParsedObservation | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const x = value as Record<string, unknown>;
  const receiverAddressId = normalizeOpaqueId(String(x.receiverAddressId ?? ""), 8, 160);
  const txid = String(x.txid ?? "").trim().toLowerCase();
  const txVout = Number(x.txVout);
  const observedSats = String(x.observedSats ?? "").trim();
  const confirmations = Number(x.confirmations);
  const blockHeight = x.blockHeight === null || x.blockHeight === undefined ? null : String(x.blockHeight).trim();
  const blockHash = x.blockHash === null || x.blockHash === undefined ? null : String(x.blockHash).trim().toLowerCase();
  const observedAt = String(x.observedAt ?? "").trim();
  const observedDate = new Date(observedAt);
  if (
    !receiverAddressId ||
    !/^[a-f0-9]{64}$/.test(txid) ||
    !Number.isInteger(txVout) ||
    txVout < 0 ||
    !/^\d+$/.test(observedSats) ||
    BigInt(observedSats) < BigInt(0) ||
    !Number.isInteger(confirmations) ||
    confirmations < 0 ||
    (blockHeight !== null && !/^\d+$/.test(blockHeight)) ||
    (blockHash !== null && !/^[a-f0-9]{64}$/.test(blockHash)) ||
    Number.isNaN(observedDate.getTime()) ||
    typeof x.spvVerified !== "boolean"
  ) {
    return null;
  }
  return {
    receiverAddressId,
    txid,
    txVout,
    observedSats,
    confirmations,
    blockHeight,
    blockHash,
    observedAt: observedDate.toISOString(),
    spvVerified: x.spvVerified,
  };
}
