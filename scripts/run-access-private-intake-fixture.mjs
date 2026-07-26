import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const outputDir = join(".tmp", "access-private-intake-fixture");
const compiledDir = join(outputDir, "out");
const harnessPath = join(outputDir, "access-private-intake-fixture.ts");
const configPath = join(outputDir, "tsconfig.json");
const tscPath = join("node_modules", ".bin", process.platform === "win32" ? "tsc.cmd" : "tsc");

function run(command, args) {
  const result = spawnSync(command, args, { stdio: "inherit", env: process.env });
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

const proof = getSyntheticAccessProofContract();
const anchor = "2026-07-26T12:00:00.000Z";
const body = {
  request: {
    name: proof.name,
    email: proof.email,
    subjectType: "Mixed / Not sure",
    mainQuestion: proof.question,
    shortDescription: "Synthetic, non-personal durability proof.",
    preferredDepth: "Structured Snapshot",
  },
  subjectPayload: { primarySubject: "BTC intake durability", knownDatesRaw: "2026-07-26" },
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
  requestVerification: { clientConfirmed: true, confirmedAt: anchor },
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

const validation = validateAccessSubmitPayload(body);
assert(validation.ok, "synthetic proof payload must validate");
const idempotency = buildAccessIdempotencySha256(validation.data);
const requestId = buildAccessRequestId(validation.data, idempotency);
assert(/^BRG-20260726-[A-F0-9]{12}$/.test(requestId), "request id must be deterministic and bounded");
assert(idempotency === buildAccessIdempotencySha256(validation.data), "idempotency hash must be stable");
const reviewToken = createAccessReviewToken(idempotency, true);
const record = buildStoredAccessSubmissionRecord(requestId, "2026-07-26T12:01:00.000Z", validation.data);
const proposed = buildPrivateAccessEnvelope({ record, idempotencySha256: idempotency, reviewToken });
assert(proposed.schema_version === ACCESS_PRIVATE_INTAKE_SCHEMA, "private schema must be locked");
assert(proposed.immutable === true, "private record must be immutable");

const objects = new Map<string, string>();
const client: PrivateBlobClient = {
  async get(pathname) {
    const value = objects.get(pathname);
    if (value === undefined) return null;
    return {
      statusCode: 200,
      stream: new ReadableStream({ start(controller) { controller.enqueue(new TextEncoder().encode(value)); controller.close(); } }),
    };
  },
  async put(pathname, value) {
    if (objects.has(pathname)) throw new Error("conflict");
    objects.set(pathname, value);
    return {};
  },
};

async function main(): Promise<void> {
  const first = await savePrivateAccessSubmission(proposed, client);
  assert(first.created, "first write must create immutable record");
  const retryRecord = buildStoredAccessSubmissionRecord(requestId, "2026-07-26T12:02:00.000Z", validation.data);
  const retryEnvelope = buildPrivateAccessEnvelope({ record: retryRecord, idempotencySha256: idempotency, reviewToken: "ignored-on-retry".padEnd(43, "x") });
  const second = await savePrivateAccessSubmission(retryEnvelope, client);
  assert(!second.created, "same payload retry must reuse the original immutable record");
  assert(second.envelope.record.createdAt === record.createdAt, "retry must preserve original creation time");
  assert(second.envelope.review_token === reviewToken, "retry must preserve original capability token");

  const authorized = await getAuthorizedPrivateAccessSubmission(requestId, reviewToken, client);
  assert(authorized?.record.requestId === requestId, "correct capability must retrieve private record");
  const denied = await getAuthorizedPrivateAccessSubmission(requestId, "wrong-token".padEnd(43, "x"), client);
  assert(denied === null, "wrong capability must reveal nothing");

  let missingConfig = false;
  try {
    resolveAccessDeliveryConfig({});
  } catch (error) {
    missingConfig = error instanceof AccessDeliveryError && error.code === "delivery_not_configured";
  }
  assert(missingConfig, "real delivery must fail closed without configuration");

  const skipped = await deliverPrivateAccessSubmission({ record, reviewToken, syntheticProof: true, env: {} });
  assert(skipped.syntheticSkipped, "synthetic storage proof must not send external email");

  const messages: Array<{ to: unknown; subject: unknown; text: unknown; html: unknown }> = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async (_input: unknown, init?: RequestInit) => {
    const payload = JSON.parse(String(init?.body ?? "{}"));
    messages.push(payload);
    return new Response(JSON.stringify({ id: "email-proof" }), { status: 200, headers: { "content-type": "application/json" } });
  }) as typeof fetch;
  try {
    const delivered = await deliverPrivateAccessSubmission({
      record,
      reviewToken,
      syntheticProof: false,
      env: {
        ACCESS_EMAIL_ENDPOINT: "https://email.invalid/send",
        ACCESS_EMAIL_API_KEY: "test-key",
        ACCESS_EMAIL_FROM: "intake@bhrigu.invalid",
        ACCESS_OPERATOR_EMAIL: "operator@bhrigu.invalid",
        ACCESS_EMAIL_REPLY_TO: "reply@bhrigu.invalid",
        ACCESS_SITE_URL: "https://www.bhrigu.io",
      },
    });
    assert(delivered.operatorNotified && delivered.clientAcknowledged, "both mandatory notifications must complete");
  } finally {
    globalThis.fetch = originalFetch;
  }
  assert(messages.length === 2, "delivery must emit exactly operator and client messages");
  assert(messages[0]?.to === "operator@bhrigu.invalid", "operator notification must be first");
  assert(String(messages[0]?.text).includes("/access-review?id="), "operator message must contain private capability route");
  assert(messages[1]?.to === proof.email, "client acknowledgement must target submitted email");
  assert(String(messages[1]?.subject).includes(requestId), "client acknowledgement must contain request id");

  const apiSource = readFileSync("pages/api/access/submit.ts", "utf8");
  const reviewSource = readFileSync("pages/access-review.tsx", "utf8");
  assert(!apiSource.includes("fileAccessSubmissionPersistenceAdapter"), "production submit must not use local file persistence");
  assert(apiSource.includes("savePrivateAccessSubmission"), "production submit must bind private storage");
  assert(reviewSource.includes("getAuthorizedPrivateAccessSubmission"), "operator review must require capability authorization");
  assert(!reviewSource.includes("listAccessReviewRecords"), "operator review must expose no public list mode");
  assert(reviewSource.includes("noindex, nofollow, noarchive"), "operator review must be non-indexable");

  process.stdout.write("ACCESS_PRIVATE_INTAKE_FIXTURE=PASS\\n");
}

main().catch((error) => {
  process.stderr.write(\`\${error instanceof Error ? error.stack || error.message : String(error)}\\n\`);
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
    join(compiledDir, ".tmp", "access-private-intake-fixture", "access-private-intake-fixture.js"),
  ]);
} finally {
  rmSync(outputDir, { recursive: true, force: true });
}
