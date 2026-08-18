import { createHash, createPublicKey, verify as verifySignature } from "node:crypto";

export const BTC_DONATION_BRIDGE_MODE = "watch_only_bridge_v1";
export const BTC_DONATION_MODE = "bitcoin_donation_v1";
export const DONATION_BRIDGE_PROTOCOL_VERSION = "bhrigu-donation-bridge-v1";
export const DONATION_BRIDGE_KEY_ID_HEADER = "x-bhrigu-donation-bridge-key-id";
export const DONATION_BRIDGE_SIGNATURE_HEADER = "x-bhrigu-donation-bridge-signature";

export type DonationBridgeMessageKind = "address_provision" | "receipt_observation" | "capacity_read";
export type DonationReceiptState = "mempool_seen" | "confirmed" | "confirmation_lost";

type RuntimeEnv = Partial<NodeJS.ProcessEnv>;
export type DonationBridgeRuntimeConfig =
  | { enabled: false }
  | { enabled: true; databaseUrl: string; keyId: string; verifyPublicKeyPem: string };

export type DonationBridgeEnvelope<T = unknown> = {
  protocolVersion: typeof DONATION_BRIDGE_PROTOCOL_VERSION;
  keyId: string;
  messageId: string;
  messageKind: DonationBridgeMessageKind;
  createdAt: string;
  httpMethod: "POST";
  requestPath: string;
  payloadHash: string;
  payload: T;
};

export type DonationCapacityPayload = Record<string, never>;

export type DonationAddressProvisionPayload = {
  receiverAddressId: string;
  receiveAddress: string;
  createdAt: string;
};

export type DonationObservationPayload = {
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

export class DonationBridgeError extends Error {
  constructor(public code: string, message = code) {
    super(message);
  }
}

export function getDonationBridgeRuntimeConfig(env: RuntimeEnv = process.env): DonationBridgeRuntimeConfig {
  const key = env.DONATION_BRIDGE_VERIFY_PUBLIC_KEY?.trim() ?? "";
  const keyId = env.DONATION_BRIDGE_KEY_ID?.trim() ?? "";
  if (
    env.BTC_DONATION_BRIDGE_MODE !== BTC_DONATION_BRIDGE_MODE ||
    !env.DATABASE_URL?.trim() ||
    !keyId || keyId.length > 128 ||
    !key.includes("BEGIN PUBLIC KEY") || key.includes("PRIVATE KEY")
  ) {
    return { enabled: false };
  }
  return { enabled: true, databaseUrl: env.DATABASE_URL.trim(), keyId, verifyPublicKeyPem: key };
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
        .map(([key, child]) => [key, canonicalize(child)])
    );
  }
  return value;
}

export function canonicalJson(value: unknown): string {
  return JSON.stringify(canonicalize(value));
}

export function sha256Hex(value: string | Buffer): string {
  return createHash("sha256").update(value).digest("hex");
}

export function donationPayloadHash(payload: unknown): string {
  return sha256Hex(canonicalJson(payload));
}

export function donationBridgeSigningBytes(envelope: DonationBridgeEnvelope): Buffer {
  return Buffer.from(canonicalJson(envelope), "utf8");
}

function isIsoDate(value: unknown): value is string {
  return typeof value === "string" && Number.isFinite(Date.parse(value));
}

function exactKeys(value: unknown, keys: string[]): boolean {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const actual = Object.keys(value as Record<string, unknown>).sort();
  return actual.length === keys.length && actual.every((key, i) => key === [...keys].sort()[i]);
}

export function verifyDonationBridgeEnvelope(args: {
  envelope: unknown;
  signatureBase64: unknown;
  suppliedKeyId: unknown;
  expectedMethod: "POST";
  expectedPath: string;
  expectedKind: DonationBridgeMessageKind;
  config: Extract<DonationBridgeRuntimeConfig, { enabled: true }>;
  now?: () => Date;
}): DonationBridgeEnvelope {
  const { envelope, config } = args;
  if (!exactKeys(envelope, ["protocolVersion", "keyId", "messageId", "messageKind", "createdAt", "httpMethod", "requestPath", "payloadHash", "payload"])) {
    throw new DonationBridgeError("invalid_envelope");
  }
  const e = envelope as DonationBridgeEnvelope;
  if (e.protocolVersion !== DONATION_BRIDGE_PROTOCOL_VERSION) throw new DonationBridgeError("invalid_protocol");
  if (e.keyId !== config.keyId || args.suppliedKeyId !== config.keyId) throw new DonationBridgeError("unknown_key_id");
  if (e.messageKind !== args.expectedKind) throw new DonationBridgeError("wrong_message_kind");
  if (e.httpMethod !== args.expectedMethod || e.requestPath !== args.expectedPath) throw new DonationBridgeError("wrong_request_binding");
  if (!/^[A-Za-z0-9._:-]{12,160}$/.test(e.messageId)) throw new DonationBridgeError("invalid_message_id");
  if (!isIsoDate(e.createdAt)) throw new DonationBridgeError("invalid_created_at");
  const computed = donationPayloadHash(e.payload);
  if (!/^[a-f0-9]{64}$/.test(e.payloadHash) || computed !== e.payloadHash) throw new DonationBridgeError("tampered_payload");
  if (typeof args.signatureBase64 !== "string" || !/^[A-Za-z0-9+/]+={0,2}$/.test(args.signatureBase64)) {
    throw new DonationBridgeError("invalid_signature");
  }
  let signature: Buffer;
  try { signature = Buffer.from(args.signatureBase64, "base64"); } catch { throw new DonationBridgeError("invalid_signature"); }
  if (signature.length !== 64) throw new DonationBridgeError("invalid_signature");
  let publicKey;
  try { publicKey = createPublicKey(config.verifyPublicKeyPem); } catch { throw new DonationBridgeError("invalid_verify_key"); }
  if (!verifySignature(null, donationBridgeSigningBytes(e), publicKey, signature)) throw new DonationBridgeError("invalid_signature");
  return e;
}

const MAINNET_ADDRESS = /^(?:bc1[ac-hj-np-z02-9]{20,90}|[13][1-9A-HJ-NP-Za-km-z]{20,60})$/i;
const TXID = /^[a-f0-9]{64}$/;

export function parseDonationCapacityPayload(value: unknown): DonationCapacityPayload {
  if (!exactKeys(value, [])) throw new DonationBridgeError("invalid_capacity_payload");
  return value as DonationCapacityPayload;
}

export function parseDonationAddressProvisionPayload(value: unknown): DonationAddressProvisionPayload {
  if (!exactKeys(value, ["receiverAddressId", "receiveAddress", "createdAt"])) throw new DonationBridgeError("invalid_provision_payload");
  const p = value as DonationAddressProvisionPayload;
  if (!/^[A-Za-z0-9._:-]{12,160}$/.test(p.receiverAddressId)) throw new DonationBridgeError("invalid_receiver_address_id");
  if (!MAINNET_ADDRESS.test(p.receiveAddress)) throw new DonationBridgeError("invalid_mainnet_address");
  if (!isIsoDate(p.createdAt)) throw new DonationBridgeError("invalid_created_at");
  return p;
}

export function parseDonationObservationPayload(value: unknown): DonationObservationPayload {
  if (!exactKeys(value, ["receiverAddressId", "txid", "txVout", "observedSats", "confirmations", "blockHeight", "blockHash", "observedAt", "spvVerified"])) {
    throw new DonationBridgeError("invalid_observation_payload");
  }
  const p = value as DonationObservationPayload;
  if (!/^[A-Za-z0-9._:-]{12,160}$/.test(p.receiverAddressId)) throw new DonationBridgeError("invalid_receiver_address_id");
  if (!TXID.test(p.txid)) throw new DonationBridgeError("invalid_txid");
  if (!Number.isSafeInteger(p.txVout) || p.txVout < 0) throw new DonationBridgeError("invalid_vout");
  if (!/^[1-9][0-9]{0,18}$/.test(p.observedSats)) throw new DonationBridgeError("invalid_sats");
  if (!Number.isSafeInteger(p.confirmations) || p.confirmations < 0) throw new DonationBridgeError("invalid_confirmations");
  if (!isIsoDate(p.observedAt) || typeof p.spvVerified !== "boolean") throw new DonationBridgeError("invalid_chain_evidence");
  if (p.blockHeight !== null && !/^[1-9][0-9]{0,15}$/.test(p.blockHeight)) throw new DonationBridgeError("invalid_block_height");
  if (p.blockHash !== null && !TXID.test(p.blockHash)) throw new DonationBridgeError("invalid_block_hash");
  if (p.confirmations === 0) {
    if (p.spvVerified || p.blockHeight !== null || p.blockHash !== null) throw new DonationBridgeError("invalid_mempool_authority");
  } else if (!p.spvVerified || p.blockHeight === null || p.blockHash === null) {
    throw new DonationBridgeError("spv_confirmation_required");
  }
  return p;
}

export function proposedDonationReceiptState(p: DonationObservationPayload): "mempool_seen" | "confirmed" {
  return p.confirmations >= 1 && p.spvVerified && p.blockHeight !== null && p.blockHash !== null ? "confirmed" : "mempool_seen";
}

export function donationReceiptId(receiverAddressId: string, txid: string, txVout: number): string {
  return `don_receipt_${sha256Hex(`${receiverAddressId}:${txid}:${txVout}`).slice(0, 32)}`;
}
