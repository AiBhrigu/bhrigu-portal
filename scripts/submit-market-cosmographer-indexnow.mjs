import { readFile } from "node:fs/promises";

const HOST = "www.bhrigu.io";
const KEY = "4bacf358739926bf386497526d746754";
const KEY_FILE = `public/${KEY}.txt`;
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`;
const ENDPOINT = "https://api.indexnow.org/indexnow";
const URLS = Object.freeze([
  "https://www.bhrigu.io/",
  "https://www.bhrigu.io/crypto-astro/btc?lang=en",
  "https://www.bhrigu.io/crypto-astro/btc?lang=ru",
]);

const DRY_RUN = process.argv.includes("--dry-run");
const MAX_KEY_ATTEMPTS = 20;
const KEY_RETRY_DELAY_MS = 30_000;

function fail(message) {
  throw new Error(message);
}

function assertCanonicalContract() {
  if (!/^[a-f0-9]{32}$/.test(KEY)) fail("IndexNow key must be 32 lowercase hex characters");
  if (URLS.length !== 3) fail(`Expected exactly 3 canonical URLs, got ${URLS.length}`);

  for (const value of URLS) {
    const url = new URL(value);
    if (url.protocol !== "https:") fail(`Non-HTTPS URL is forbidden: ${value}`);
    if (url.host !== HOST) fail(`Cross-host URL is forbidden: ${value}`);
    if (url.pathname.includes("/crypto-astro/btc/live")) fail(`Live dialogue URL is forbidden: ${value}`);
  }

  const expected = new Set([
    "https://www.bhrigu.io/",
    "https://www.bhrigu.io/crypto-astro/btc?lang=en",
    "https://www.bhrigu.io/crypto-astro/btc?lang=ru",
  ]);
  const actual = new Set(URLS);
  if (actual.size !== expected.size || [...expected].some((url) => !actual.has(url))) {
    fail("Canonical URL allowlist drift detected");
  }
}

async function assertLocalOwnershipKey() {
  const local = (await readFile(KEY_FILE, "utf8")).trim();
  if (local !== KEY) fail(`Ownership key mismatch in ${KEY_FILE}`);
}

async function waitForPublicOwnershipKey() {
  let lastStatus = "not-requested";

  for (let attempt = 1; attempt <= MAX_KEY_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetch(KEY_LOCATION, {
        headers: { "user-agent": "BHRIGU-IndexNow-Propagation/1.0" },
        cache: "no-store",
      });
      lastStatus = String(response.status);
      if (response.ok) {
        const body = (await response.text()).trim();
        if (body === KEY) {
          console.log(JSON.stringify({ gate: "PUBLIC_KEY", status: "PASS", attempt, keyLocation: KEY_LOCATION }));
          return;
        }
        lastStatus = `200-body-mismatch:${body.slice(0, 64)}`;
      }
    } catch (error) {
      lastStatus = `network-error:${error instanceof Error ? error.message : String(error)}`;
    }

    if (attempt < MAX_KEY_ATTEMPTS) {
      console.log(JSON.stringify({ gate: "PUBLIC_KEY", status: "WAIT", attempt, lastStatus }));
      await new Promise((resolve) => setTimeout(resolve, KEY_RETRY_DELAY_MS));
    }
  }

  fail(`Public IndexNow ownership key did not become verifiable: ${lastStatus}`);
}

async function submitIndexNow() {
  const payload = {
    host: HOST,
    key: KEY,
    keyLocation: KEY_LOCATION,
    urlList: URLS,
  };

  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "content-type": "application/json; charset=utf-8",
      "user-agent": "BHRIGU-IndexNow-Propagation/1.0",
    },
    body: JSON.stringify(payload),
  });

  const body = (await response.text()).trim();
  if (![200, 202].includes(response.status)) {
    fail(`IndexNow submission rejected: HTTP ${response.status}${body ? ` ${body}` : ""}`);
  }

  console.log(JSON.stringify({
    gate: "INDEXNOW_SUBMISSION",
    status: "PASS",
    httpStatus: response.status,
    submitted: URLS,
  }));
}

async function main() {
  assertCanonicalContract();
  await assertLocalOwnershipKey();

  console.log(JSON.stringify({
    gate: "CANONICAL_CONTRACT",
    status: "PASS",
    host: HOST,
    keyLocation: KEY_LOCATION,
    urlList: URLS,
    dryRun: DRY_RUN,
  }));

  if (DRY_RUN) return;

  await waitForPublicOwnershipKey();
  await submitIndexNow();
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack : String(error));
  process.exit(1);
});
