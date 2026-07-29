import { spawn, spawnSync } from "node:child_process";
import { mkdir, open } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { HARNESS_NODE, SOURCE_SHA } from "./routes.mjs";

const sourceSha = process.env.BHRIGU_VISUAL_SOURCE_SHA || SOURCE_SHA;
const port = Number(process.env.BHRIGU_VISUAL_PORT || 4317);
const host = "127.0.0.1";
const baseUrl = `http://${host}:${port}`;
const artifactRoot = process.env.BHRIGU_VISUAL_ARTIFACT_ROOT || "artifacts/local-visual";

const ALLOWED_HARNESS_PATHS = new Set([
  ".github/workflows/bhrigu-portal-local-visual-validation.yml",
  ".gitignore",
  "docs/operations/BHRIGU_PORTAL_LOCAL_VISUAL_VALIDATION.md",
  "package-lock.json",
  "package.json",
  "scripts/local-visual/capture.mjs",
  "scripts/local-visual/routes.mjs",
  "scripts/local-visual/run.mjs",
  "scripts/local-visual/sync-and-run.sh",
]);

assertSha(sourceSha, "BHRIGU_VISUAL_SOURCE_SHA_INVALID");
verifyGitBoundary(sourceSha);
const harnessSha = git(["rev-parse", "HEAD"]);
await mkdir(artifactRoot, { recursive: true });
const serverLog = await open(path.join(artifactRoot, "server.log"), "w", 0o600);
let server = null;

console.log(JSON.stringify({
  node: HARNESS_NODE,
  phase: "PREFLIGHT_PASS",
  source_sha: sourceSha,
  harness_sha: harnessSha,
  base_url: baseUrl,
  production_writes: 0,
  vercel_writes: 0,
  x402_live_transfers: 0,
}, null, 2));

try {
  if (process.env.BHRIGU_VISUAL_SKIP_BUILD !== "1") {
    await runChecked("npm", ["run", "build"], { env: { ...process.env, GITHUB_SHA: sourceSha, VERCEL_GIT_COMMIT_SHA: sourceSha } });
  }

  server = spawn("npm", ["run", "start", "--", "--hostname", host, "--port", String(port)], {
    env: { ...process.env, NODE_ENV: "production", GITHUB_SHA: sourceSha, VERCEL_GIT_COMMIT_SHA: sourceSha },
    stdio: ["ignore", "pipe", "pipe"],
    detached: process.platform !== "win32",
  });
  pipeServerOutput(server.stdout, process.stdout, serverLog);
  pipeServerOutput(server.stderr, process.stderr, serverLog);
  await waitForServer(baseUrl, server, 75_000);

  await runChecked("node", ["scripts/local-visual/capture.mjs"], {
    env: {
      ...process.env,
      BHRIGU_VISUAL_BASE_URL: baseUrl,
      BHRIGU_VISUAL_SOURCE_SHA: sourceSha,
      BHRIGU_VISUAL_HARNESS_SHA: harnessSha,
      BHRIGU_VISUAL_ARTIFACT_ROOT: artifactRoot,
    },
  });
} finally {
  await stopServer(server);
  await serverLog.close();
}

console.log(JSON.stringify({
  node: HARNESS_NODE,
  status: "PASS",
  source_sha: sourceSha,
  harness_sha: harnessSha,
  artifact_root: artifactRoot,
}, null, 2));

function verifyGitBoundary(exactSourceSha) {
  const inside = git(["rev-parse", "--is-inside-work-tree"]);
  if (inside !== "true") fail("GIT_WORKTREE_REQUIRED");
  const ancestor = spawnSync("git", ["merge-base", "--is-ancestor", exactSourceSha, "HEAD"], { stdio: "ignore" });
  if (ancestor.status !== 0) fail("EXACT_SOURCE_SHA_NOT_ANCESTOR");

  const changed = git(["diff", "--name-only", `${exactSourceSha}...HEAD`])
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
  const unauthorized = changed.filter((item) => !ALLOWED_HARNESS_PATHS.has(item));
  if (unauthorized.length) fail(`UNAUTHORIZED_PATHS:${unauthorized.join(",")}`);

  const trackedDirty = spawnSync("git", ["diff", "--quiet"], { stdio: "ignore" }).status !== 0
    || spawnSync("git", ["diff", "--cached", "--quiet"], { stdio: "ignore" }).status !== 0;
  if (trackedDirty) fail("TRACKED_WORKTREE_MUST_BE_CLEAN");
  console.log(`EXACT_SOURCE_ANCESTRY=PASS\nAUTHORIZED_HARNESS_PATHS=${changed.length}`);
}

async function runChecked(command, args, options = {}) {
  await new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: "inherit", ...options });
    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} ${args.join(" ")} failed: code=${code} signal=${signal || "none"}`));
    });
  });
}

async function waitForServer(url, child, timeoutMs) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (child.exitCode !== null) fail(`LOCAL_SERVER_EXITED_${child.exitCode}`);
    try {
      const response = await fetch(url, { redirect: "manual", signal: AbortSignal.timeout(2_500) });
      if (response.status < 500) {
        console.log(`LOCAL_SERVER_READY=${response.status}`);
        return;
      }
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 750));
  }
  fail("LOCAL_SERVER_START_TIMEOUT");
}

function pipeServerOutput(stream, terminal, handle) {
  stream?.on("data", (chunk) => {
    terminal.write(chunk);
    handle.write(chunk).catch(() => undefined);
  });
}

async function stopServer(child) {
  if (!child || child.exitCode !== null) return;
  try {
    if (process.platform !== "win32") process.kill(-child.pid, "SIGTERM");
    else child.kill("SIGTERM");
  } catch {}
  await Promise.race([
    new Promise((resolve) => child.once("exit", resolve)),
    new Promise((resolve) => setTimeout(resolve, 5_000)),
  ]);
  if (child.exitCode === null) {
    try {
      if (process.platform !== "win32") process.kill(-child.pid, "SIGKILL");
      else child.kill("SIGKILL");
    } catch {}
  }
}

function git(args) {
  const result = spawnSync("git", args, { encoding: "utf8" });
  if (result.status !== 0) fail(`GIT_COMMAND_FAILED:${args.join(" ")}`);
  return result.stdout.trim();
}

function assertSha(value, code) {
  if (!/^[0-9a-f]{40}$/i.test(String(value))) fail(code);
}

function fail(code) {
  const error = new Error(code);
  error.code = code;
  throw error;
}
