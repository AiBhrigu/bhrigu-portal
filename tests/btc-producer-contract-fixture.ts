declare const process: {
  argv: string[];
  stdout: { write(value: string): void };
  stderr: { write(value: string): void };
  exit(code: number): never;
};
declare function require(name: string): any;

const { readFileSync } = require("node:fs");

import {
  BTC_SOURCE_URLS,
  loadBtcStaticSource,
  validateCanonicalSnapshot,
  validateMarketField,
  validateSnapshotProof,
} from "../lib/btc-public-static-source";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, "utf8"));
}

async function run(): Promise<void> {
  const [snapshotPath, proofPath, marketFieldPath] = process.argv.slice(2);
  assert(snapshotPath && proofPath && marketFieldPath, "Expected snapshot, proof, and market-field file paths");

  const snapshot = readJson(snapshotPath);
  const proof = readJson(proofPath);
  const marketField = readJson(marketFieldPath);

  assert(validateCanonicalSnapshot(snapshot), "Producer canonical snapshot failed the BHRIGU consumer contract");
  assert(validateSnapshotProof(proof), "Producer proof packet failed the BHRIGU consumer contract");
  assert(validateMarketField(marketField), "Producer market-field packet failed the BHRIGU consumer contract");

  const payloads = new Map<string, unknown>([
    [BTC_SOURCE_URLS.snapshot, snapshot],
    [BTC_SOURCE_URLS.proof, proof],
    [BTC_SOURCE_URLS.marketField, marketField],
  ]);
  const fetchImpl = (async (input: unknown) => {
    const value = payloads.get(String(input));
    if (value === undefined) return { ok: false, status: 404, json: async () => ({}) } as Response;
    return { ok: true, status: 200, json: async () => value } as Response;
  }) as typeof fetch;

  const generatedAt = (snapshot as { generated_at_utc: string }).generated_at_utc;
  const now = new Date(new Date(generatedAt).getTime() + 60 * 60 * 1000);
  const loaded = await loadBtcStaticSource({ fetchImpl, now });
  assert(loaded.ok, `Producer bundle failed the complete BHRIGU loader: ${loaded.ok ? "unknown" : loaded.code}`);

  process.stdout.write("BTC_PRODUCER_COMPATIBILITY_FIXTURE=PASS\n");
}

run().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.stack || error.message : String(error)}\n`);
  process.exit(1);
});
