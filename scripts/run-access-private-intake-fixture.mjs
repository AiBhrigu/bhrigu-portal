import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const outputDir = join(".tmp", "access-private-intake-fixture");
const compiledDir = join(outputDir, "out");
const harnessPath = join(outputDir, "access-private-intake-fixture.ts");
const configPath = join(outputDir, "tsconfig.json");
const tscPath = join(
  "node_modules",
  ".bin",
  process.platform === "win32" ? "tsc.cmd" : "tsc"
);

function run(command, args) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    env: process.env,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

const harness = `import { readFileSync } from "node:fs";
import { buildStoredAccessSubmissionRecord, validateAccessSubmitPayload } from "../../lib/access-submit-validation";
import {
  ACCESS_PRIVATE_INTAKE_SCHEMA,
  AccessPrivateIntakeError,
  buildAccessIdempotencySha256,
  buildAccessRequestId,
  buildPrivateAccessEnvelope,
  createAccessReviewToken,
  getAuthorizedPrivateAccessSubmission,
  getPrivateAccessDeliveryState,
  getSyntheticAccessProofContract,
  savePrivateAccessSubmission,
  type PrivateBlobClient,
} from "../../lib/access-private-intake";
import {
  AccessDeliveryError,
  deliverPrivateAccessSubmission,
  resolveAccessDeliveryConfig,
} from "../../lib/access-submit-delivery-runtime";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function buildBody(anchor: string, question: string, email: string) {
  return {
    request: {
      name: "BHRIGU INTAKE PROOF",
      email,
      subjectType: "Mixed / Not sure",
      mainQuestion: question,
      shortDescription: "Synthetic, non-personal durability proof.",
      preferredDepth: "Structured Snapshot",
    },
    subjectPayload: {
      primarySubject: "BTC intake durability",
      knownDatesRaw: anchor.slice(0, 10),
    },
    normalizedDates: [],
    derived: {
      anchorIntegrity: "partial",
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
      confirmedAt: anchor,
    },
    requestTemporalMeta: {
      accessEntryAt: anchor,
      draftStartedAt: anchor,
      dateConfirmationCompletedAt: anchor,
      requestSubmittedAt: null,
      accessEntrySource: "/access",
      resumeCount: 0,
      draftDurationMs: 1000,
      correctionRequested: false,
    },
  };
}

function createMemoryClient() {
  const objects = new Map<string, string>();
  const client: PrivateBlobClient = {
    async get(pathname) {
      const value = objects.get(pathname);
      if (value === undefined) return null;
      return {
        statusCode: 200,
        stream: new ReadableStream({
          start(controller) {
            controller.enqueue(new TextEncoder().encode(value));
            controller.close();
          },
        }),
      };
    },
    async put(pathname, value) {
      if (objects.has(pathname)) throw new Error("conflict");
      objects.set(pathname, value);
      return {};
    },
  };
  return { objects, client };
}

function deliveryEnv() {
  return {
    ACCESS_EMAIL_ENDPOINT: "https://email.invalid/send",
    ACCESS_EMAIL_API_KEY: "test-key",
    ACCESS_EMAIL_FROM: "intake@bhrigu.invalid",
    ACCESS_OPERATOR_EMAIL: "operator@bhrigu.invalid",
    ACCESS_EMAIL_REPLY_TO: "reply@bhrigu.invalid",
    ACCESS_SITE_URL: "https://www.bhrigu.io",
  };
}

async function main(): Promise<void> {
  const proof = getSyntheticAccessProofContract();
  const anchor = "2026-08-04T08:00:00.000Z";
  const body = buildBody(anchor, proof.question, proof.email);
  const validation = validateAccessSubmitPayload(body);
  assert(validation.ok, "synthetic proof payload must validate");
  const validated = validation.data;
  const idempotency = buildAccessIdempotencySha256(validated);
  const requestId = buildAccessRequestId(validated, idempotency);
  assert(
    /^BRG-20260804-[A-F0-9]{12}$/.test(requestId),
    "request id must be deterministic and bounded"
  );
  assert(
    idempotency === buildAccessIdempotencySha256(validated),
    "idempotency hash must be stable"
  );

  const reviewToken = createAccessReviewToken(idempotency, true);
  const record = buildStoredAccessSubmissionRecord(
    requestId,
    "2026-08-04T08:01:00.000Z",
    validated
  );
  const proposed = buildPrivateAccessEnvelope({
    record,
    idempotencySha256: idempotency,
    reviewToken,
  });
  assert(
    proposed.schema_version === ACCESS_PRIVATE_INTAKE_SCHEMA,
    "private schema must be locked"
  );
  assert(proposed.immutable === true, "private record must be immutable");

  const memory = createMemoryClient();
  const first = await savePrivateAccessSubmission(proposed, memory.client);
  assert(first.created, "first write must create immutable record");

  const retryRecord = buildStoredAccessSubmissionRecord(
    requestId,
    "2026-08-04T08:02:00.000Z",
    validated
  );
  const retryEnvelope = buildPrivateAccessEnvelope({
    record: retryRecord,
    idempotencySha256: idempotency,
    reviewToken: "ignored-on-retry".padEnd(43, "x"),
  });
  const second = await savePrivateAccessSubmission(
    retryEnvelope,
    memory.client
  );
  assert(!second.created, "same payload retry must reuse immutable record");
  assert(
    second.envelope.record.createdAt === record.createdAt,
    "retry must preserve original creation time"
  );
  assert(
    second.envelope.review_token === reviewToken,
    "retry must preserve original capability"
  );

  const authorized = await getAuthorizedPrivateAccessSubmission(
    requestId,
    reviewToken,
    memory.client
  );
  assert(
    authorized?.record.requestId === requestId,
    "correct capability must retrieve private record"
  );
  const denied = await getAuthorizedPrivateAccessSubmission(
    requestId,
    "wrong-token".padEnd(43, "x"),
    memory.client
  );
  assert(denied === null, "wrong capability must reveal nothing");

  let missingConfig = false;
  try {
    resolveAccessDeliveryConfig({});
  } catch (error) {
    missingConfig =
      error instanceof AccessDeliveryError &&
      error.code === "delivery_not_configured";
  }
  assert(
    missingConfig,
    "real delivery must fail closed without configuration"
  );

  const skipped = await deliverPrivateAccessSubmission({
    record,
    reviewToken,
    idempotencySha256: idempotency,
    syntheticProof: true,
    env: {},
    client: memory.client,
  });
  assert(
    skipped.syntheticSkipped,
    "synthetic storage proof must send no email"
  );

  const messages: Array<{
    to: unknown;
    subject: unknown;
    text: unknown;
    html: unknown;
    idempotencyKey: string;
  }> = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async (_input: unknown, init?: RequestInit) => {
    const headers = new Headers(init?.headers);
    const payload = JSON.parse(String(init?.body ?? "{}"));
    messages.push({
      ...payload,
      idempotencyKey: headers.get("Idempotency-Key") || "",
    });
    return new Response(JSON.stringify({ id: "email-proof" }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }) as typeof fetch;

  try {
    const delivered = await deliverPrivateAccessSubmission({
      record,
      reviewToken,
      idempotencySha256: idempotency,
      syntheticProof: false,
      env: deliveryEnv(),
      client: memory.client,
    });
    assert(
      delivered.operatorNotified && delivered.clientAcknowledged,
      "both mandatory notifications must complete"
    );

    const replay = await deliverPrivateAccessSubmission({
      record,
      reviewToken,
      idempotencySha256: idempotency,
      syntheticProof: false,
      env: deliveryEnv(),
      client: memory.client,
    });
    assert(replay.idempotentReplay, "complete retry must be idempotent");
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert(messages.length === 2, "successful retry must send no duplicate email");
  assert(
    Array.isArray(messages[0]?.to) &&
      messages[0].to[0] === "operator@bhrigu.invalid",
    "operator notification must be first"
  );
  assert(
    String(messages[0]?.text).includes("/access-review?id="),
    "operator message must contain private capability route"
  );
  assert(
    messages[0]?.idempotencyKey.includes(requestId) &&
      messages[0]?.idempotencyKey.endsWith("-operator-v0-1"),
    "operator delivery must use deterministic idempotency key"
  );
  assert(
    Array.isArray(messages[1]?.to) &&
      messages[1].to[0] === proof.email,
    "client acknowledgement must target submitted email"
  );
  assert(
    messages[1]?.idempotencyKey.includes(requestId) &&
      messages[1]?.idempotencyKey.endsWith("-client-v0-1"),
    "client delivery must use deterministic idempotency key"
  );

  const completeState = await getPrivateAccessDeliveryState(
    requestId,
    memory.client
  );
  assert(
    completeState.status === "complete" &&
      completeState.operator.sent &&
      completeState.client.sent,
    "successful delivery must have complete durable state"
  );

  const partialAnchor = "2026-08-05T08:00:00.000Z";
  const partialBody = buildBody(
    partialAnchor,
    "Prove partial delivery reconciliation.",
    "partial-proof@invalid.example"
  );
  const partialValidation = validateAccessSubmitPayload(partialBody);
  assert(partialValidation.ok, "partial proof payload must validate");
  const partialIdempotency = buildAccessIdempotencySha256(
    partialValidation.data
  );
  const partialRequestId = buildAccessRequestId(
    partialValidation.data,
    partialIdempotency
  );
  const partialRecord = buildStoredAccessSubmissionRecord(
    partialRequestId,
    "2026-08-05T08:01:00.000Z",
    partialValidation.data
  );
  const partialToken = createAccessReviewToken(
    partialIdempotency,
    false
  );
  const partialMemory = createMemoryClient();
  await savePrivateAccessSubmission(
    buildPrivateAccessEnvelope({
      record: partialRecord,
      idempotencySha256: partialIdempotency,
      reviewToken: partialToken,
    }),
    partialMemory.client
  );

  let partialCalls = 0;
  globalThis.fetch = (async () => {
    partialCalls += 1;
    if (partialCalls === 1) {
      return new Response(JSON.stringify({ id: "operator-sent" }), {
        status: 200,
      });
    }
    return new Response("client failure", { status: 500 });
  }) as typeof fetch;

  let partialReconciliation = false;
  try {
    await deliverPrivateAccessSubmission({
      record: partialRecord,
      reviewToken: partialToken,
      idempotencySha256: partialIdempotency,
      syntheticProof: false,
      env: deliveryEnv(),
      client: partialMemory.client,
    });
  } catch (error) {
    partialReconciliation =
      error instanceof AccessDeliveryError &&
      error.code === "delivery_reconciliation_required";
  } finally {
    globalThis.fetch = originalFetch;
  }
  assert(
    partialReconciliation,
    "partial provider failure must require reconciliation"
  );
  assert(
    partialCalls === 2,
    "partial proof must attempt operator then client exactly once"
  );

  const partialState = await getPrivateAccessDeliveryState(
    partialRequestId,
    partialMemory.client
  );
  assert(
    partialState.status === "reconciliation_required",
    "partial delivery must persist reconciliation state"
  );
  assert(
    partialState.operator.sent &&
      partialState.client.reserved &&
      !partialState.client.sent,
    "partial state must preserve operator success and client reservation"
  );

  let replayCalls = 0;
  globalThis.fetch = (async () => {
    replayCalls += 1;
    throw new Error("automatic resend must remain blocked");
  }) as typeof fetch;
  let replayBlocked = false;
  try {
    await deliverPrivateAccessSubmission({
      record: partialRecord,
      reviewToken: partialToken,
      idempotencySha256: partialIdempotency,
      syntheticProof: false,
      env: deliveryEnv(),
      client: partialMemory.client,
    });
  } catch (error) {
    replayBlocked =
      error instanceof AccessDeliveryError &&
      error.code === "delivery_reconciliation_required";
  } finally {
    globalThis.fetch = originalFetch;
  }
  assert(replayBlocked, "reconciliation retry must remain blocked");
  assert(replayCalls === 0, "blocked retry must send zero external messages");

  const apiSource = readFileSync("pages/api/access/submit.ts", "utf8");
  const reviewSource = readFileSync("pages/access-review.tsx", "utf8");
  const accessSource = readFileSync("pages/access.tsx", "utf8");
  const accessFormSource = readFileSync(
    "components/AccessIntakeForm.tsx",
    "utf8"
  );
  const deliverySource = readFileSync(
    "lib/access-submit-delivery-runtime.ts",
    "utf8"
  );

  assert(
    !apiSource.includes("fileAccessSubmissionPersistenceAdapter"),
    "production submit must not use local file persistence"
  );
  assert(
    apiSource.includes("savePrivateAccessSubmission"),
    "production submit must bind private storage"
  );
  assert(
    apiSource.includes("delivery_reconciliation_required"),
    "API must expose honest reconciliation state"
  );
  assert(
    reviewSource.includes("getAuthorizedPrivateAccessSubmission"),
    "operator review must require capability authorization"
  );
  assert(
    reviewSource.includes("getPrivateAccessDeliveryState"),
    "operator review must expose delivery state"
  );
  assert(
    !reviewSource.includes("listAccessReviewRecords"),
    "operator review must expose no public list mode"
  );
  assert(
    reviewSource.includes("noindex, nofollow, noarchive"),
    "operator review must be non-indexable"
  );
  assert(
    accessSource.includes("AccessClosedSurface") &&
      accessSource.includes("ACCESS_PRIVATE_INTAKE_PUBLIC_ENABLED") &&
      accessSource.includes("provePrivateAccessStoreReadable"),
    "Access wrapper must preserve containment until runtime readiness"
  );
  assert(
    accessFormSource.includes("accessWorkflowPanel"),
    "Access workflow priority repair must be present"
  );
  assert(
    accessFormSource.includes("if (!activeNotice) return null;") &&
      !accessFormSource.includes('<div className="notice noticePlaceholder"'),
    "empty notice DOM reserve must remain absent"
  );
  assert(
    apiSource.includes("bodyParser: false") &&
      apiSource.includes("ACCESS_PRIVATE_INTAKE_PUBLIC_ENABLED") &&
      apiSource.includes("ACCESS_PRIVATE_INTAKE_PROOF_SECRET") &&
      apiSource.indexOf("ACCESS_PRIVATE_INTAKE_PUBLIC_ENABLED") <
        apiSource.indexOf("await readJsonBody(req)"),
    "real request body must remain unread until runtime readiness"
  );
  assert(
    deliverySource.includes('"Idempotency-Key"'),
    "provider request must carry deterministic idempotency key"
  );

  process.stdout.write(
    "ACCESS_PRIVATE_INTAKE_DELIVERY_IDEMPOTENCY_FIXTURE=PASS" +
      String.fromCharCode(10)
  );
}

main().catch((error) => {
  process.stderr.write(
    (error instanceof Error ? error.stack || error.message : String(error)) +
      String.fromCharCode(10)
  );
  process.exit(1);
});
`;

const config = {
  compilerOptions: {
    target: "ES2022",
    module: "CommonJS",
    moduleResolution: "Node",
    strict: false,
    esModuleInterop: true,
    skipLibCheck: true,
    types: ["node"],
    lib: ["ES2022", "DOM", "DOM.Iterable"],
    rootDir: "../..",
    outDir: "out",
    noEmitOnError: true,
  },
  include: [
    "../../lib/access-models.ts",
    "../../lib/access-submit-validation.ts",
    "../../lib/access-private-intake.ts",
    "../../lib/access-submit-email.ts",
    "../../lib/access-submit-operator-email.ts",
    "../../lib/access-submit-delivery-runtime.ts",
    "access-private-intake-fixture.ts",
  ],
};

rmSync(outputDir, { recursive: true, force: true });
mkdirSync(outputDir, { recursive: true });
try {
  writeFileSync(harnessPath, harness, "utf8");
  writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`, "utf8");
  run(tscPath, ["-p", configPath]);
  run(process.execPath, [
    join(
      compiledDir,
      ".tmp",
      "access-private-intake-fixture",
      "access-private-intake-fixture.js"
    ),
  ]);
} finally {
  rmSync(outputDir, { recursive: true, force: true });
}
