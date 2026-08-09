import crypto from "node:crypto";

import { get as blobGet, put as blobPut } from "@vercel/blob";

import type {
  AccessSubmitRequestBodyV1,
  StoredAccessSubmissionV1,
} from "./access-models";

export const ACCESS_PRIVATE_INTAKE_SCHEMA =
  "bhrigu_private_access_submission_v0_2" as const;
export const ACCESS_PRIVATE_DELIVERY_EVENT_SCHEMA =
  "bhrigu_private_access_delivery_event_v0_1" as const;
export const ACCESS_PRIVATE_INTAKE_PREFIX =
  "access-submissions/private/v0_2";
export const ACCESS_SYNTHETIC_PROOF_HEADER =
  "MARKET-COSMOGRAPHER-PRIVATE-INTAKE-PROOF-V0-2";

const SYNTHETIC_NAME = "BHRIGU INTAKE PROOF";
const SYNTHETIC_EMAIL = "bhrigu-intake-proof@invalid.example";
const SYNTHETIC_QUESTION =
  "Prove durable private intake, capability retrieval, delivery idempotency, and reconciliation.";

export type AccessDeliveryChannel = "operator" | "client";
export type AccessDeliveryEventKind = "reserved" | "sent";

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

export type PrivateAccessDeliveryEvent = {
  schema_version: typeof ACCESS_PRIVATE_DELIVERY_EVENT_SCHEMA;
  request_id: string;
  idempotency_sha256: string;
  channel: AccessDeliveryChannel;
  event: AccessDeliveryEventKind;
  created_at: string;
  immutable: true;
};

export type PrivateAccessDeliveryState = {
  operator: {
    reserved: boolean;
    sent: boolean;
  };
  client: {
    reserved: boolean;
    sent: boolean;
  };
  status: "ready" | "complete" | "reconciliation_required";
};

export type PrivateAccessSaveResult = {
  created: boolean;
  envelope: PrivateAccessSubmissionEnvelope;
};

export type DeliveryReservationResult =
  | "reserved"
  | "already_reserved"
  | "already_sent";

type BlobGetResult = {
  statusCode: 200 | 304;
  stream: ReadableStream<Uint8Array> | null;
};

export type PrivateBlobClient = {
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
  get: (pathname, options) =>
    blobGet(pathname, options) as Promise<BlobGetResult | null>,
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
      schema_version: "bhrigu_access_idempotency_v0_2",
      anchor,
      payload: data,
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
      .update(`BHRIGU_SYNTHETIC_REVIEW_V0_2:${idempotencySha256}`)
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
  assertRequestId(requestId);
  return `${ACCESS_PRIVATE_INTAKE_PREFIX}/${requestId}/submitted.json`;
}

export function privateAccessDeliveryEventPathname(
  requestId: string,
  channel: AccessDeliveryChannel,
  event: AccessDeliveryEventKind
): string {
  assertRequestId(requestId);
  return `${ACCESS_PRIVATE_INTAKE_PREFIX}/${requestId}/delivery/${channel}-${event}.json`;
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
    await putImmutableJson(pathname, envelope, client);
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

export async function getPrivateAccessDeliveryState(
  requestId: string,
  client: PrivateBlobClient = defaultBlobClient
): Promise<PrivateAccessDeliveryState> {
  const [operatorReserved, operatorSent, clientReserved, clientSent] =
    await Promise.all([
      readDeliveryEvent(requestId, "operator", "reserved", client),
      readDeliveryEvent(requestId, "operator", "sent", client),
      readDeliveryEvent(requestId, "client", "reserved", client),
      readDeliveryEvent(requestId, "client", "sent", client),
    ]);

  const events = [
    operatorReserved,
    operatorSent,
    clientReserved,
    clientSent,
  ].filter((value): value is PrivateAccessDeliveryEvent => Boolean(value));
  const idempotencyBindings = new Set(
    events.map((value) => value.idempotency_sha256)
  );
  if (idempotencyBindings.size > 1) {
    throw new AccessPrivateIntakeError(
      "delivery_event_conflict",
      "Delivery events are bound to conflicting immutable submissions."
    );
  }

  const state: PrivateAccessDeliveryState = {
    operator: {
      reserved: Boolean(operatorReserved),
      sent: Boolean(operatorSent),
    },
    client: {
      reserved: Boolean(clientReserved),
      sent: Boolean(clientSent),
    },
    status: "ready",
  };

  if (state.operator.sent && state.client.sent) {
    state.status = "complete";
  } else if (
    (state.operator.reserved && !state.operator.sent) ||
    (state.client.reserved && !state.client.sent)
  ) {
    state.status = "reconciliation_required";
  }

  return state;
}

export async function reservePrivateAccessDelivery(
  requestId: string,
  idempotencySha256: string,
  channel: AccessDeliveryChannel,
  client: PrivateBlobClient = defaultBlobClient
): Promise<DeliveryReservationResult> {
  const sent = await readDeliveryEvent(requestId, channel, "sent", client);
  if (sent) {
    assertDeliveryIdentity(sent, requestId, idempotencySha256, channel, "sent");
    return "already_sent";
  }

  const pathname = privateAccessDeliveryEventPathname(
    requestId,
    channel,
    "reserved"
  );
  const existing = await readDeliveryEvent(
    requestId,
    channel,
    "reserved",
    client
  );
  if (existing) {
    assertDeliveryIdentity(
      existing,
      requestId,
      idempotencySha256,
      channel,
      "reserved"
    );
    return "already_reserved";
  }

  const proposed = buildDeliveryEvent(
    requestId,
    idempotencySha256,
    channel,
    "reserved"
  );

  try {
    await putImmutableJson(pathname, proposed, client);
    const stored = await readDeliveryEvent(
      requestId,
      channel,
      "reserved",
      client
    );
    if (!stored) {
      throw new AccessPrivateIntakeError(
        "delivery_reservation_read_after_write_failed",
        "The delivery reservation could not be verified."
      );
    }
    assertDeliveryIdentity(
      stored,
      requestId,
      idempotencySha256,
      channel,
      "reserved"
    );
    return "reserved";
  } catch (error) {
    const raced = await readDeliveryEvent(
      requestId,
      channel,
      "reserved",
      client
    ).catch(() => null);
    if (raced) {
      assertDeliveryIdentity(
        raced,
        requestId,
        idempotencySha256,
        channel,
        "reserved"
      );
      return "already_reserved";
    }
    if (error instanceof AccessPrivateIntakeError) throw error;
    throw new AccessPrivateIntakeError(
      "delivery_reservation_failed",
      error instanceof Error ? error.message : "Delivery reservation failed."
    );
  }
}

export async function markPrivateAccessDeliverySent(
  requestId: string,
  idempotencySha256: string,
  channel: AccessDeliveryChannel,
  client: PrivateBlobClient = defaultBlobClient
): Promise<void> {
  const reservation = await readDeliveryEvent(
    requestId,
    channel,
    "reserved",
    client
  );
  if (!reservation) {
    throw new AccessPrivateIntakeError(
      "delivery_reservation_missing",
      "A durable delivery reservation is required before marking delivery sent."
    );
  }
  assertDeliveryIdentity(
    reservation,
    requestId,
    idempotencySha256,
    channel,
    "reserved"
  );

  const pathname = privateAccessDeliveryEventPathname(
    requestId,
    channel,
    "sent"
  );
  const existing = await readDeliveryEvent(requestId, channel, "sent", client);
  if (existing) {
    assertDeliveryIdentity(
      existing,
      requestId,
      idempotencySha256,
      channel,
      "sent"
    );
    return;
  }

  const proposed = buildDeliveryEvent(
    requestId,
    idempotencySha256,
    channel,
    "sent"
  );

  try {
    await putImmutableJson(pathname, proposed, client);
    const stored = await readDeliveryEvent(
      requestId,
      channel,
      "sent",
      client
    );
    if (!stored) {
      throw new AccessPrivateIntakeError(
        "delivery_sent_read_after_write_failed",
        "The delivery sent marker could not be verified."
      );
    }
    assertDeliveryIdentity(
      stored,
      requestId,
      idempotencySha256,
      channel,
      "sent"
    );
  } catch (error) {
    const raced = await readDeliveryEvent(
      requestId,
      channel,
      "sent",
      client
    ).catch(() => null);
    if (raced) {
      assertDeliveryIdentity(
        raced,
        requestId,
        idempotencySha256,
        channel,
        "sent"
      );
      return;
    }
    if (error instanceof AccessPrivateIntakeError) throw error;
    throw new AccessPrivateIntakeError(
      "delivery_sent_marker_failed",
      error instanceof Error ? error.message : "Delivery sent marker failed."
    );
  }
}

export async function provePrivateAccessStoreReadable(
  client: PrivateBlobClient = defaultBlobClient
): Promise<void> {
  await client.get(`${ACCESS_PRIVATE_INTAKE_PREFIX}/__probe__/absent.json`, {
    access: "private",
    useCache: false,
  });
}

function buildDeliveryEvent(
  requestId: string,
  idempotencySha256: string,
  channel: AccessDeliveryChannel,
  event: AccessDeliveryEventKind
): PrivateAccessDeliveryEvent {
  return {
    schema_version: ACCESS_PRIVATE_DELIVERY_EVENT_SCHEMA,
    request_id: requestId,
    idempotency_sha256: idempotencySha256,
    channel,
    event,
    created_at: new Date().toISOString(),
    immutable: true,
  };
}

async function putImmutableJson(
  pathname: string,
  value: unknown,
  client: PrivateBlobClient
): Promise<void> {
  await client.put(pathname, `${stableJson(value)}\n`, {
    access: "private",
    addRandomSuffix: false,
    allowOverwrite: false,
    contentType: "application/json",
    cacheControlMaxAge: 60,
  });
}

async function readEnvelope(
  pathname: string,
  client: PrivateBlobClient
): Promise<PrivateAccessSubmissionEnvelope | null> {
  const parsed = await readPrivateJson(pathname, client);
  if (!parsed) return null;
  validateEnvelope(parsed as PrivateAccessSubmissionEnvelope);
  return parsed as PrivateAccessSubmissionEnvelope;
}

async function readDeliveryEvent(
  requestId: string,
  channel: AccessDeliveryChannel,
  event: AccessDeliveryEventKind,
  client: PrivateBlobClient
): Promise<PrivateAccessDeliveryEvent | null> {
  const pathname = privateAccessDeliveryEventPathname(
    requestId,
    channel,
    event
  );
  const parsed = await readPrivateJson(pathname, client);
  if (!parsed) return null;
  const value = parsed as PrivateAccessDeliveryEvent;
  validateDeliveryEvent(value);
  assertDeliveryIdentity(
    value,
    requestId,
    value.idempotency_sha256,
    channel,
    event
  );
  return value;
}

async function readPrivateJson(
  pathname: string,
  client: PrivateBlobClient
): Promise<unknown | null> {
  const result = await client.get(pathname, {
    access: "private",
    useCache: false,
  });
  if (!result || result.statusCode !== 200 || !result.stream) return null;
  const text = await new Response(result.stream).text();
  return JSON.parse(text) as unknown;
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
    existing.idempotency_sha256 !== proposed.idempotency_sha256
  ) {
    throw new AccessPrivateIntakeError(
      "duplicate_conflict",
      "An immutable record already exists for this request identifier."
    );
  }
}

function assertDeliveryIdentity(
  value: PrivateAccessDeliveryEvent,
  requestId: string,
  idempotencySha256: string,
  channel: AccessDeliveryChannel,
  event: AccessDeliveryEventKind
): void {
  if (
    value.request_id !== requestId ||
    value.idempotency_sha256 !== idempotencySha256 ||
    value.channel !== channel ||
    value.event !== event
  ) {
    throw new AccessPrivateIntakeError(
      "delivery_event_conflict",
      "A delivery event is bound to different immutable content."
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

function validateDeliveryEvent(value: PrivateAccessDeliveryEvent): void {
  if (
    !value ||
    value.schema_version !== ACCESS_PRIVATE_DELIVERY_EVENT_SCHEMA ||
    value.immutable !== true ||
    !/^BRG-[0-9]{8}-[A-F0-9]{12}$/.test(value.request_id) ||
    !/^[a-f0-9]{64}$/.test(value.idempotency_sha256) ||
    !["operator", "client"].includes(value.channel) ||
    !["reserved", "sent"].includes(value.event)
  ) {
    throw new AccessPrivateIntakeError(
      "delivery_event_invalid",
      "The private delivery event failed integrity validation."
    );
  }
}

function assertRequestId(requestId: string): void {
  if (!/^BRG-[0-9]{8}-[A-F0-9]{12}$/.test(requestId)) {
    throw new AccessPrivateIntakeError(
      "invalid_request_id",
      "The request identifier is invalid."
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
