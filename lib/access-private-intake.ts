import crypto from "node:crypto";

import { get as blobGet, put as blobPut } from "@vercel/blob";

import type {
  AccessSubmitRequestBodyV1,
  StoredAccessSubmissionV1,
} from "./access-models";

export const ACCESS_PRIVATE_INTAKE_SCHEMA =
  "bhrigu_private_access_submission_v0_1" as const;
export const ACCESS_PRIVATE_INTAKE_PREFIX = "access-submissions/private/v0_1";
export const ACCESS_SYNTHETIC_PROOF_HEADER =
  "BTC-FIRST-EXTERNAL-REQUEST-DURABILITY-PROOF-V0-1";

const SYNTHETIC_NAME = "BHRIGU INTAKE PROOF";
const SYNTHETIC_EMAIL = "bhrigu-intake-proof@invalid.example";
const SYNTHETIC_QUESTION =
  "Prove durable private intake, idempotency, operator retrieval, and fail-closed delivery.";

export type PrivateAccessSubmissionEnvelope = {
  schema_version: typeof ACCESS_PRIVATE_INTAKE_SCHEMA;
  request_id: string;
  created_at: string;
  idempotency_sha256: string;
  record_sha256: string;
  review_token: string;
  review_token_sha256: string;
  immutable: true;
  record: StoredAccessSubmissionV1;
};

export type PrivateAccessSaveResult = {
  created: boolean;
  envelope: PrivateAccessSubmissionEnvelope;
};

type BlobGetResult = {
  statusCode: 200 | 304;
  stream: ReadableStream<Uint8Array> | null;
};

type PrivateBlobClient = {
  get(
    pathname: string,
    options: { access: "private"; useCache?: boolean }
  ): Promise<BlobGetResult | null>;
  put(
    pathname: string,
    body: string,
    options: {
      access: "private";
      addRandomSuffix: false;
      allowOverwrite: false;
      contentType: "application/json";
      cacheControlMaxAge: number;
    }
  ): Promise<unknown>;
};

const defaultBlobClient: PrivateBlobClient = {
  get: (pathname, options) => blobGet(pathname, options) as Promise<BlobGetResult | null>,
  put: (pathname, body, options) => blobPut(pathname, body, options),
};

export class AccessPrivateIntakeError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "AccessPrivateIntakeError";
    this.code = code;
  }
}

export function isSyntheticAccessProof(
  data: AccessSubmitRequestBodyV1,
  proofHeader: string | string[] | undefined
): boolean {
  const header = Array.isArray(proofHeader) ? proofHeader[0] : proofHeader;
  return (
    header === ACCESS_SYNTHETIC_PROOF_HEADER &&
    data.request.name === SYNTHETIC_NAME &&
    data.request.email === SYNTHETIC_EMAIL &&
    data.request.subjectType === "Mixed / Not sure" &&
    data.request.mainQuestion === SYNTHETIC_QUESTION
  );
}

export function getSyntheticAccessProofContract() {
  return {
    name: SYNTHETIC_NAME,
    email: SYNTHETIC_EMAIL,
    question: SYNTHETIC_QUESTION,
    proofHeader: ACCESS_SYNTHETIC_PROOF_HEADER,
  };
}

export function buildAccessIdempotencySha256(
  data: AccessSubmitRequestBodyV1
): string {
  const anchor =
    data.requestTemporalMeta.draftStartedAt ??
    data.requestTemporalMeta.accessEntryAt ??
    data.requestVerification.confirmedAt;

  if (!anchor) {
    throw new AccessPrivateIntakeError(
      "idempotency_anchor_missing",
      "A stable submission anchor is required."
    );
  }

  return sha256(
    stableJson({
      schema_version: "bhrigu_access_idempotency_v0_1",
      anchor,
      email: data.request.email,
      subject_type: data.request.subjectType,
      main_question: data.request.mainQuestion,
      preferred_depth: data.request.preferredDepth,
    })
  );
}

export function buildAccessRequestId(
  data: AccessSubmitRequestBodyV1,
  idempotencySha256: string
): string {
  const anchor =
    data.requestTemporalMeta.draftStartedAt ??
    data.requestTemporalMeta.accessEntryAt ??
    data.requestVerification.confirmedAt ??
    new Date().toISOString();
  const date = anchor.slice(0, 10).replace(/-/g, "");
  return `BRG-${date}-${idempotencySha256.slice(0, 12).toUpperCase()}`;
}

export function createAccessReviewToken(
  idempotencySha256: string,
  syntheticProof: boolean
): string {
  if (syntheticProof) {
    return crypto
      .createHash("sha256")
      .update(`BHRIGU_SYNTHETIC_REVIEW_V0_1:${idempotencySha256}`)
      .digest("base64url");
  }
  return crypto.randomBytes(32).toString("base64url");
}

export function buildPrivateAccessEnvelope(input: {
  record: StoredAccessSubmissionV1;
  idempotencySha256: string;
  reviewToken: string;
}): PrivateAccessSubmissionEnvelope {
  const recordJson = stableJson(input.record);
  return {
    schema_version: ACCESS_PRIVATE_INTAKE_SCHEMA,
    request_id: input.record.requestId,
    created_at: input.record.createdAt,
    idempotency_sha256: input.idempotencySha256,
    record_sha256: sha256(recordJson),
    review_token: input.reviewToken,
    review_token_sha256: sha256(input.reviewToken),
    immutable: true,
    record: input.record,
  };
}

export function privateAccessPathname(requestId: string): string {
  if (!/^BRG-[0-9]{8}-[A-F0-9]{12}$/.test(requestId)) {
    throw new AccessPrivateIntakeError(
      "invalid_request_id",
      "The request identifier is invalid."
    );
  }
  return `${ACCESS_PRIVATE_INTAKE_PREFIX}/${requestId}/submitted.json`;
}

export async function savePrivateAccessSubmission(
  envelope: PrivateAccessSubmissionEnvelope,
  client: PrivateBlobClient = defaultBlobClient
): Promise<PrivateAccessSaveResult> {
  validateEnvelope(envelope);
  const pathname = privateAccessPathname(envelope.request_id);
  const existing = await readEnvelope(pathname, client);
  if (existing) return resolveExisting(existing, envelope);

  try {
    await client.put(pathname, `${stableJson(envelope)}\n`, {
      access: "private",
      addRandomSuffix: false,
      allowOverwrite: false,
      contentType: "application/json",
      cacheControlMaxAge: 60,
    });
    const stored = await readEnvelope(pathname, client);
    if (!stored) {
      throw new AccessPrivateIntakeError(
        "storage_read_after_write_failed",
        "The private record could not be read after storage."
      );
    }
    assertEnvelopeIdentity(stored, envelope);
    return { created: true, envelope: stored };
  } catch (error) {
    const raced = await readEnvelope(pathname, client).catch(() => null);
    if (raced) return resolveExisting(raced, envelope);
    if (error instanceof AccessPrivateIntakeError) throw error;
    throw new AccessPrivateIntakeError(
      "private_storage_failed",
      error instanceof Error ? error.message : "Private storage failed."
    );
  }
}

export async function getPrivateAccessSubmission(
  requestId: string,
  client: PrivateBlobClient = defaultBlobClient
): Promise<PrivateAccessSubmissionEnvelope | null> {
  return readEnvelope(privateAccessPathname(requestId), client);
}

export async function getAuthorizedPrivateAccessSubmission(
  requestId: string,
  reviewToken: string,
  client: PrivateBlobClient = defaultBlobClient
): Promise<PrivateAccessSubmissionEnvelope | null> {
  if (!reviewToken || reviewToken.length < 32) return null;
  const envelope = await getPrivateAccessSubmission(requestId, client);
  if (!envelope) return null;
  const expected = Buffer.from(envelope.review_token_sha256, "hex");
  const actual = Buffer.from(sha256(reviewToken), "hex");
  if (expected.length !== actual.length) return null;
  return crypto.timingSafeEqual(expected, actual) ? envelope : null;
}

export async function provePrivateAccessStoreReadable(
  client: PrivateBlobClient = defaultBlobClient
): Promise<void> {
  await client.get(`${ACCESS_PRIVATE_INTAKE_PREFIX}/__probe__/absent.json`, {
    access: "private",
    useCache: false,
  });
}

async function readEnvelope(
  pathname: string,
  client: PrivateBlobClient
): Promise<PrivateAccessSubmissionEnvelope | null> {
  const result = await client.get(pathname, {
    access: "private",
    useCache: false,
  });
  if (!result || result.statusCode !== 200 || !result.stream) return null;
  const text = await new Response(result.stream).text();
  const parsed = JSON.parse(text) as PrivateAccessSubmissionEnvelope;
  validateEnvelope(parsed);
  return parsed;
}

function resolveExisting(
  existing: PrivateAccessSubmissionEnvelope,
  proposed: PrivateAccessSubmissionEnvelope
): PrivateAccessSaveResult {
  assertEnvelopeIdentity(existing, proposed);
  return { created: false, envelope: existing };
}

function assertEnvelopeIdentity(
  existing: PrivateAccessSubmissionEnvelope,
  proposed: PrivateAccessSubmissionEnvelope
): void {
  if (
    existing.request_id !== proposed.request_id ||
    existing.idempotency_sha256 !== proposed.idempotency_sha256 ||
    existing.record_sha256 !== proposed.record_sha256
  ) {
    throw new AccessPrivateIntakeError(
      "duplicate_conflict",
      "An immutable record already exists for this request identifier."
    );
  }
}

function validateEnvelope(value: PrivateAccessSubmissionEnvelope): void {
  if (
    !value ||
    value.schema_version !== ACCESS_PRIVATE_INTAKE_SCHEMA ||
    value.immutable !== true ||
    value.request_id !== value.record?.requestId ||
    value.record_sha256 !== sha256(stableJson(value.record)) ||
    value.review_token_sha256 !== sha256(value.review_token)
  ) {
    throw new AccessPrivateIntakeError(
      "private_record_invalid",
      "The private intake record failed integrity validation."
    );
  }
}

function stableJson(value: unknown): string {
  return JSON.stringify(sortValue(value));
}

function sortValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, item]) => [key, sortValue(item)])
    );
  }
  return value;
}

function sha256(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}
