import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const outputDir = join(".tmp", "btc-producer-contract-fixture");
const compiledDir = join(outputDir, "out");
const harnessPath = join(outputDir, "btc-producer-contract-fixture.ts");
const configPath = join(outputDir, "tsconfig.json");
const tscPath = join("node_modules", ".bin", process.platform === "win32" ? "tsc.cmd" : "tsc");
const snapshotPath = process.env.BTC_PRODUCER_SNAPSHOT_PATH;
const proofPath = process.env.BTC_PRODUCER_PROOF_PATH;
const marketFieldPath = process.env.BTC_PRODUCER_MARKET_FIELD_PATH;

if (!snapshotPath || !proofPath || !marketFieldPath) {
  console.error("BTC producer artifact paths are required");
  process.exit(2);
}

function run(command, args) {
  const result = spawnSync(command, args, { stdio: "inherit", env: process.env });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

const harness = `declare const process: { argv: string[]; stdout: { write(value: string): void }; stderr: { write(value: string): void }; exit(code: number): never };
declare function require(name: string): any;
const { readFileSync } = require("node:fs");
import { BTC_SOURCE_URLS, loadBtcStaticSource, validateCanonicalSnapshot, validateMarketField, validateSnapshotProof } from "../../lib/btc-public-static-source";
function assert(condition: unknown, message: string): asserts condition { if (!condition) throw new Error(message); }
function readJson(path: string): unknown { return JSON.parse(readFileSync(path, "utf8")); }
async function main(): Promise<void> {
  const [snapshotPath, proofPath, marketFieldPath] = process.argv.slice(2);
  assert(snapshotPath && proofPath && marketFieldPath, "Expected snapshot, proof, and market-field paths");
  const snapshot = readJson(snapshotPath);
  const proof = readJson(proofPath);
  const marketField = readJson(marketFieldPath);
  assert(validateCanonicalSnapshot(snapshot), "Producer canonical snapshot failed the BHRIGU consumer contract");
  assert(validateSnapshotProof(proof), "Producer proof packet failed the BHRIGU consumer contract");
  assert(validateMarketField(marketField), "Producer market-field packet failed the BHRIGU consumer contract");
  const payloads = new Map<string, unknown>([[BTC_SOURCE_URLS.snapshot, snapshot], [BTC_SOURCE_URLS.proof, proof], [BTC_SOURCE_URLS.marketField, marketField]]);
  const fetchImpl = (async (input: unknown) => { const value = payloads.get(String(input)); return value === undefined ? { ok: false, status: 404, json: async () => ({}) } as Response : { ok: true, status: 200, json: async () => value } as Response; }) as typeof fetch;
  const generatedAt = (snapshot as { generated_at_utc: string }).generated_at_utc;
  const loaded = await loadBtcStaticSource({ fetchImpl, now: new Date(new Date(generatedAt).getTime() + 3600000) });
  if (loaded.ok === false) throw new Error(\`Producer bundle failed the complete BHRIGU loader: \${loaded.code}\`);
  process.stdout.write("BTC_PRODUCER_COMPATIBILITY_FIXTURE=PASS\\n");
}
main().catch((error) => { process.stderr.write(\`\${error instanceof Error ? error.stack || error.message : String(error)}\\n\`); process.exit(1); });
`;

const config = {
  compilerOptions: {
    target: "ES2020",
    module: "CommonJS",
    moduleResolution: "Node",
    strict: false,
    esModuleInterop: true,
    skipLibCheck: true,
    types: [],
    rootDir: "../..",
    outDir: "out",
    noEmitOnError: true,
  },
  include: [
    "../../lib/btc-public-output-contract.ts",
    "../../lib/btc-public-static-source.ts",
    "btc-producer-contract-fixture.ts",
  ],
};

rmSync(outputDir, { recursive: true, force: true });
mkdirSync(outputDir, { recursive: true });
try {
  writeFileSync(harnessPath, harness, "utf8");
  writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`, "utf8");
  run(tscPath, ["-p", configPath]);
  run(process.execPath, [
    join(compiledDir, ".tmp", "btc-producer-contract-fixture", "btc-producer-contract-fixture.js"),
    snapshotPath,
    proofPath,
    marketFieldPath,
  ]);
} finally {
  rmSync(outputDir, { recursive: true, force: true });
}
