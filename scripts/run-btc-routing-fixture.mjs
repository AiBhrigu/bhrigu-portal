import { rmSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const outputDir = join(".tmp", "btc-routing-fixture");
const tscPath = join("node_modules", ".bin", process.platform === "win32" ? "tsc.cmd" : "tsc");

function run(command, args) {
  const result = spawnSync(command, args, { stdio: "inherit", env: process.env });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

rmSync(outputDir, { recursive: true, force: true });
try {
  run(tscPath, ["-p", "tsconfig.btc-routing-fixture.json"]);
  run(process.execPath, [join(outputDir, "tests", "btc-routing-fixture.js")]);
} finally {
  rmSync(outputDir, { recursive: true, force: true });
}
