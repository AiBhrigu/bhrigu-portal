import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";

import { getServerSideProps } from "../pages/access-review";
import submitHandler from "../pages/api/access/submit";
import {
  ACCESS_FROM_EMAIL,
  ACCESS_INTAKE_MODE,
  ACCESS_OPERATOR_EMAIL,
  ACCESS_REVIEW_MODE,
  getAccessIntakeRuntimeConfig,
  getAccessReviewRuntimeConfig,
} from "../lib/access-intake-config";
import { isAuthorizedAccessOperator } from "../lib/access-review-auth0";
import { normalizeAccessReviewRecord } from "../lib/access-intake-neon";
import {
  clearAccessIdempotencyKeyFromLocalStorage,
  createAccessIdempotencyKey,
  loadAccessIdempotencyKeyFromLocalStorage,
  persistAccessIdempotencyKeyToLocalStorage,
} from "../lib/access-state-controller";
import {
  hashCanonicalPayload,
  processAccessIntake,
  type AccessDeliveryKind,
  type AccessIntakeDelivery,
  type AccessIntakeStore,
} from "../lib/access-intake-runtime";
import type { StoredAccessSubmissionV1 } from "../lib/access-models";

type DeliveryEntry = {
  state: "pending" | "sending" | "delivered" | "failed";
  idempotencyKey: string;
  attempts: number;
};

class MemoryStore implements AccessIntakeStore {
  byIdempotency = new Map<
    string,
    { payloadHash: string; record: StoredAccessSubmissionV1 }
  >();
  deliveries = new Map<string, DeliveryEntry>();
  events: string[] = [];
  deliveryClaimsBusy = false;

  async reserve(input: Parameters<AccessIntakeStore["reserve"]>[0]) {
    this.events.push("store:reserve");
    const existing = this.byIdempotency.get(input.idempotencyKey);
    if (existing) {
      return {
        disposition:
          existing.payloadHash === input.payloadHash
            ? ("replay" as const)
            : ("conflict" as const),
        record: existing.record,
      };
    }

    this.byIdempotency.set(input.idempotencyKey, {
      payloadHash: input.payloadHash,
      record: input.record,
    });
    for (const kind of [
      "operator_notification",
      "client_confirmation",
    ] as AccessDeliveryKind[]) {
      this.deliveries.set(`${input.record.requestId}:${kind}`, {
        state: "pending",
        idempotencyKey: input.deliveryKeys[kind],
        attempts: 0,
      });
    }
    return { disposition: "created" as const, record: input.record };
  }

  async claimDelivery(input: Parameters<AccessIntakeStore["claimDelivery"]>[0]) {
    this.events.push(`store:claim:${input.kind}`);
    const entry = this.deliveries.get(`${input.requestId}:${input.kind}`);
    if (!entry) {
      return { claimed: false, idempotencyKey: null, state: null };
    }
    if (
      this.deliveryClaimsBusy ||
      entry.state === "delivered" ||
      entry.state === "sending"
    ) {
      return { claimed: false, idempotencyKey: null, state: entry.state };
    }
    entry.state = "sending";
    entry.attempts += 1;
    return {
      claimed: true,
      idempotencyKey: entry.idempotencyKey,
      state: "sending" as const,
    };
  }

  async completeDelivery(
    input: Parameters<AccessIntakeStore["completeDelivery"]>[0]
  ) {
    this.events.push(`store:complete:${input.kind}`);
    const entry = this.deliveries.get(`${input.requestId}:${input.kind}`);
    assert(entry);
    entry.state = "delivered";
  }

  async failDelivery(input: Parameters<AccessIntakeStore["failDelivery"]>[0]) {
    this.events.push(`store:fail:${input.kind}`);
    const entry = this.deliveries.get(`${input.requestId}:${input.kind}`);
    assert(entry);
    entry.state = "failed";
  }
}

class MemoryDelivery implements AccessIntakeDelivery {
  sends: Array<{ kind: AccessDeliveryKind; idempotencyKey: string }> = [];
  failOnce: AccessDeliveryKind | null;

  constructor(failOnce: AccessDeliveryKind | null = null) {
    this.failOnce = failOnce;
  }

  async send(input: Parameters<AccessIntakeDelivery["send"]>[0]) {
    this.sends.push({
      kind: input.kind,
      idempotencyKey: input.idempotencyKey,
    });
    if (this.failOnce === input.kind) {
      this.failOnce = null;
      throw new Error("fixture_delivery_failure");
    }
    return { providerMessageId: `fixture-${input.kind}-${this.sends.length}` };
  }
}

const payload = {
  request: {
    name: "Acceptance User",
    email: "acceptance@example.com",
    subjectType: "Person",
    mainQuestion: "What is the primary phase boundary?",
    shortDescription: "A bounded private intake acceptance fixture.",
    preferredDepth: "Structured Snapshot",
  },
  subjectPayload: {
    fullNameOrIdentifier: "Acceptance User",
    birthDateRaw: "1990-01-02",
    birthTimeRaw: "",
    birthPlaceRaw: "",
  },
  normalizedDates: [
    {
      id: "birth-date",
      role: "birth_date",
      label: "Date of birth",
      raw: "1990-01-02",
      iso: "1990-01-02",
      human: "2 January 1990",
      status: "confirmed",
      required: true,
      confirmed: true,
      ambiguousCandidates: [],
    },
  ],
  derived: {
    anchorIntegrity: "complete",
    criticalMissingFields: [],
    entitiesCount: "1",
    timeScope: "One date / one point",
    sourceMaterialLevel: "None",
    likelyLevel: "Level I",
    manualEscalation: false,
    manualEscalationReasons: [],
  },
  requestVerification: {
    clientConfirmed: true,
    confirmedAt: "2026-08-09T10:00:00.000Z",
  },
  requestTemporalMeta: {
    accessEntryAt: "2026-08-09T09:55:00.000Z",
    draftStartedAt: "2026-08-09T09:56:00.000Z",
    dateConfirmationCompletedAt: "2026-08-09T10:00:00.000Z",
    requestSubmittedAt: null,
    accessEntrySource: "/access",
    resumeCount: 0,
    draftDurationMs: null,
    correctionRequested: false,
  },
};

async function run() {
  assert.deepEqual(getAccessIntakeRuntimeConfig({}), {
    enabled: false,
    reason: "closed",
  });
  assert.deepEqual(
    getAccessIntakeRuntimeConfig({
      ACCESS_PRIVATE_INTAKE_MODE: ACCESS_INTAKE_MODE,
      DATABASE_URL: "postgresql://fixture",
      RESEND_API_KEY: "re_fixture",
    }),
    { enabled: false, reason: "sender_domain_unverified" }
  );
  assert.deepEqual(
    getAccessIntakeRuntimeConfig({
      ACCESS_PRIVATE_INTAKE_MODE: ACCESS_INTAKE_MODE,
      ACCESS_RESEND_DOMAIN_VERIFIED: "true",
      DATABASE_URL: "postgresql://fixture",
      RESEND_API_KEY: "re_fixture",
    }),
    { enabled: false, reason: "private_retrieval_incomplete" }
  );

  const providerEnv = {
    ACCESS_PRIVATE_INTAKE_MODE: ACCESS_INTAKE_MODE,
    ACCESS_RESEND_DOMAIN_VERIFIED: "true",
    ACCESS_PRIVATE_REVIEW_MODE: ACCESS_REVIEW_MODE,
    DATABASE_URL: "postgresql://fixture",
    RESEND_API_KEY: "re_fixture",
    AUTH0_DOMAIN: "tenant.example.auth0.com",
    AUTH0_CLIENT_ID: "fixture-client",
    AUTH0_CLIENT_SECRET: "fixture-secret",
    AUTH0_SECRET: "00".repeat(32),
    APP_BASE_URL: "https://bhrigu-portal-git-main-aibhrigus-projects.vercel.app",
  };
  const enabled = getAccessIntakeRuntimeConfig(providerEnv);
  assert.equal(enabled.enabled, true);
  if (enabled.enabled) {
    assert.equal(enabled.operatorEmail, ACCESS_OPERATOR_EMAIL);
    assert.equal(enabled.fromEmail, ACCESS_FROM_EMAIL);
  }

  assert.equal(getAccessReviewRuntimeConfig({}).enabled, false);
  assert.equal(
    getAccessReviewRuntimeConfig(providerEnv).enabled,
    true
  );
  const { APP_BASE_URL: _appBaseUrl, ...providerEnvWithoutAppBaseUrl } = providerEnv;
  assert.equal(
    getAccessReviewRuntimeConfig(providerEnvWithoutAppBaseUrl).enabled,
    false,
    "private review must remain fail-closed without an explicit environment app base URL"
  );

  assert.equal(
    isAuthorizedAccessOperator(
      { user: { email: "AIBHRIGU@GMAIL.COM", email_verified: true } },
      ACCESS_OPERATOR_EMAIL
    ),
    true
  );
  assert.equal(
    isAuthorizedAccessOperator(
      { user: { email: "AIBHRIGU@GMAIL.COM", email_verified: false } },
      ACCESS_OPERATOR_EMAIL
    ),
    false
  );
  assert.equal(
    isAuthorizedAccessOperator(
      { user: { email: "someone@example.com", email_verified: true } },
      ACCESS_OPERATOR_EMAIL
    ),
    false
  );

  const foundingReviewRecord = normalizeAccessReviewRecord({
    kind: "PHI_BTC_TIMING_WINDOWS_FOUNDING_REQUEST",
    version: "v0_1",
    request_id: "FND-20260902-TEST",
    created_at: "2026-09-02T21:26:40.601Z",
    status: "pending_manual_review",
    locale: "en",
    name_or_handle: "Founding Acceptance",
    contact: "founding@example.com",
    primary_interest: "BITCOIN_RESEARCH",
    tracking_question: "Track the first real founding request end to end.",
    current_bitcoin_context: "Controlled acceptance fixture.",
    willingness_to_pay_after_scope_acceptance: true,
  });
  assert.equal(foundingReviewRecord?.schema, "founding_v0_1");
  if (foundingReviewRecord?.schema === "founding_v0_1") {
    assert.equal(foundingReviewRecord.data.requestId, "FND-20260902-TEST");
    assert.equal(foundingReviewRecord.data.primaryInterest, "BITCOIN_RESEARCH");
    assert.equal(foundingReviewRecord.data.willingToPayAfterScopeAcceptance, true);
  }
  assert.equal(
    normalizeAccessReviewRecord({ requestId: "BRG-20260902-LEGACY" })?.schema,
    "access_v1"
  );
  assert.equal(normalizeAccessReviewRecord({ kind: "UNKNOWN" }), null);

  assert.equal(
    hashCanonicalPayload({ b: 2, a: 1 }),
    hashCanonicalPayload({ a: 1, b: 2 })
  );
  assert.match(createAccessIdempotencyKey(), /^access-[0-9a-f-]{36}$/);

  const previousWindow = (globalThis as any).window;
  const localStorageFixture = new Map<string, string>();
  (globalThis as any).window = {
    localStorage: {
      getItem: (key: string) => localStorageFixture.get(key) ?? null,
      setItem: (key: string, value: string) =>
        localStorageFixture.set(key, value),
      removeItem: (key: string) => localStorageFixture.delete(key),
    },
  };
  const reloadSafeKey = createAccessIdempotencyKey();
  persistAccessIdempotencyKeyToLocalStorage(reloadSafeKey);
  assert.equal(loadAccessIdempotencyKeyFromLocalStorage(), reloadSafeKey);
  clearAccessIdempotencyKeyFromLocalStorage();
  assert.equal(loadAccessIdempotencyKeyFromLocalStorage(), null);
  if (previousWindow === undefined) delete (globalThis as any).window;
  else (globalThis as any).window = previousWindow;

  const store = new MemoryStore();
  const delivery = new MemoryDelivery();
  const deterministicNow = () => new Date("2026-08-09T10:01:00.000Z");
  const first = await processAccessIntake({
    payload,
    idempotencyKey: "acceptance-key-0001",
    store,
    delivery,
    now: deterministicNow,
    requestId: () => "BRG-20260809-TEST",
  });
  assert.equal(first.ok, true);
  if (first.ok) {
    assert.equal(first.statusCode, 201);
    assert.equal(first.deliveryStatus, "delivered");
  }
  assert.equal(store.byIdempotency.size, 1);
  assert.equal(delivery.sends.length, 2);
  assert.equal(store.events[0], "store:reserve");
  assert(store.events.indexOf("store:reserve") < store.events.indexOf("store:claim:operator_notification"));

  const replay = await processAccessIntake({
    payload,
    idempotencyKey: "acceptance-key-0001",
    store,
    delivery,
    now: deterministicNow,
    requestId: () => "BRG-20260809-IGNORED",
  });
  assert.equal(replay.ok, true);
  if (replay.ok) {
    assert.equal(replay.statusCode, 200);
    assert.equal(replay.requestId, "BRG-20260809-TEST");
  }
  assert.equal(delivery.sends.length, 2, "replay must not duplicate delivered email");

  const busyStore = new MemoryStore();
  busyStore.deliveryClaimsBusy = true;
  const busyDelivery = new MemoryDelivery();
  const busy = await processAccessIntake({
    payload,
    idempotencyKey: "acceptance-key-busy",
    store: busyStore,
    delivery: busyDelivery,
    now: deterministicNow,
    requestId: () => "BRG-20260809-BUSY",
  });
  assert.equal(busy.ok, true);
  if (busy.ok) {
    assert.equal(busy.statusCode, 202);
    assert.equal(busy.deliveryStatus, "pending_retry");
  }
  assert.equal(busyDelivery.sends.length, 0, "busy claims must not report delivery");

  const conflict = await processAccessIntake({
    payload: {
      ...payload,
      request: { ...payload.request, mainQuestion: "A different request" },
    },
    idempotencyKey: "acceptance-key-0001",
    store,
    delivery,
    now: deterministicNow,
    requestId: () => "BRG-20260809-CONFLICT",
  });
  assert.equal(conflict.ok, false);
  if (!conflict.ok) assert.equal(conflict.statusCode, 409);

  const retryStore = new MemoryStore();
  const retryDelivery = new MemoryDelivery("client_confirmation");
  const pending = await processAccessIntake({
    payload,
    idempotencyKey: "acceptance-key-0002",
    store: retryStore,
    delivery: retryDelivery,
    now: deterministicNow,
    requestId: () => "BRG-20260809-RETRY",
  });
  assert.equal(pending.ok, true);
  if (pending.ok) {
    assert.equal(pending.statusCode, 202);
    assert.equal(pending.deliveryStatus, "pending_retry");
  }
  assert.equal(retryStore.byIdempotency.size, 1, "email failure must not erase request");
  assert.equal(
    retryStore.deliveries.get("BRG-20260809-RETRY:client_confirmation")?.state,
    "failed"
  );

  const recovered = await processAccessIntake({
    payload,
    idempotencyKey: "acceptance-key-0002",
    store: retryStore,
    delivery: retryDelivery,
    now: deterministicNow,
    requestId: () => "BRG-20260809-IGNORED2",
  });
  assert.equal(recovered.ok, true);
  assert.equal(
    retryDelivery.sends.filter((send) => send.kind === "operator_notification").length,
    1,
    "retry must not duplicate a delivered operator notification"
  );
  assert.equal(
    retryDelivery.sends.filter((send) => send.kind === "client_confirmation").length,
    2,
    "retry must claim only the failed client delivery"
  );

  const invalidKey = await processAccessIntake({
    payload,
    idempotencyKey: "short",
    store: new MemoryStore(),
    delivery: new MemoryDelivery(),
  });
  assert.equal(invalidKey.ok, false);
  if (!invalidKey.ok) assert.equal(invalidKey.errorCode, "invalid_idempotency_key");

  const previousMode = process.env.ACCESS_PRIVATE_INTAKE_MODE;
  delete process.env.ACCESS_PRIVATE_INTAKE_MODE;
  let responseStatus = 0;
  let responseBody: any = null;
  const response = {
    setHeader() {},
    status(code: number) {
      responseStatus = code;
      return this;
    },
    json(body: unknown) {
      responseBody = body;
      return this;
    },
  };
  await submitHandler(
    { method: "POST", headers: {} } as any,
    response as any
  );
  if (previousMode === undefined) delete process.env.ACCESS_PRIVATE_INTAKE_MODE;
  else process.env.ACCESS_PRIVATE_INTAKE_MODE = previousMode;
  assert.equal(responseStatus, 503);
  assert.equal(responseBody.errorCode, "intake_temporarily_closed");

  const reviewResult = await (getServerSideProps as any)({
    req: {},
    res: { setHeader() {} },
  });
  assert.deepEqual(reviewResult, { notFound: true });

  const migration = await readFile(
    path.join(process.cwd(), "migrations/20260809_access_private_intake_v1.sql"),
    "utf8"
  );
  assert.match(migration, /idempotency_key TEXT NOT NULL UNIQUE/);
  assert.match(migration, /PRIMARY KEY \(request_id, kind\)/);

  console.log("ACCESS_PRIVATE_INTAKE_LOCAL_ACCEPTANCE=PASS");
  console.log(
    "assertions=coupled_activation,verified_email,storage_first,reload_idempotency,busy_delivery,replay,retry,closed_routes,migration"
  );
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
