import { rmSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const outputDir = join(".tmp", "btc-producer-contract-fixture");
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

rmSync(outputDir, { recursive: true, force: true });
try {
  run(tscPath, ["-p", "tsconfig.btc-producer-contract-fixture.json"]);
  run(process.execPath, [
    join(outputDir, "tests", "btc-producer-contract-fixture.js"),
    snapshotPath,
    proofPath,
    marketFieldPath,
  ]);
} finally {
  rmSync(outputDir, { recursive: true, force: true });
}
