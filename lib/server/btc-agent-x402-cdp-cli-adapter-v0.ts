import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type {
  BtcAgentX402BaseSepoliaAdapter,
  BtcAgentX402SettleResult,
  BtcAgentX402VerifyResult,
} from "../btc-agent-x402-base-sepolia-runtime-v0";

const execFileAsync = promisify(execFile);

type X402Request = {
  x402Version: number;
  paymentPayload: Record<string, unknown>;
  paymentRequirements: Record<string, unknown>;
};

export function cdpX402CliArgs(operation: "verify" | "settle", request: X402Request): string[] {
  return [
    "x402",
    operation,
    `paymentPayload:=${JSON.stringify(request.paymentPayload)}`,
    `paymentRequirements:=${JSON.stringify(request.paymentRequirements)}`,
    `x402Version=${request.x402Version}`,
  ];
}

async function runCdpX402(
  operation: "verify" | "settle",
  request: X402Request,
  options: { cliBin: string; env: NodeJS.ProcessEnv },
): Promise<Record<string, unknown>> {
  const { stdout } = await execFileAsync(
    options.cliBin,
    cdpX402CliArgs(operation, request),
    {
      env: { ...options.env, CDP_NO_HISTORY: "1" },
      encoding: "utf8",
      maxBuffer: 1024 * 1024,
      windowsHide: true,
    },
  );
  const parsed = JSON.parse(stdout);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("CDP_X402_RESPONSE_INVALID");
  }
  return parsed as Record<string, unknown>;
}

export function createCdpCliX402BaseSepoliaAdapter(
  options: {
    cliBin?: string;
    env?: NodeJS.ProcessEnv;
  } = {},
): BtcAgentX402BaseSepoliaAdapter {
  const env = options.env ?? process.env;
  if (env.VERCEL_ENV === "production") {
    throw new Error("PRODUCTION_ENV_FORBIDDEN");
  }
  const cliBin = options.cliBin ?? env.BHRIGU_CDP_CLI_BIN ?? "cdp";

  return {
    async verify(request): Promise<BtcAgentX402VerifyResult> {
      return await runCdpX402("verify", request, { cliBin, env }) as BtcAgentX402VerifyResult;
    },
    async settle(request): Promise<BtcAgentX402SettleResult> {
      return await runCdpX402("settle", request, { cliBin, env }) as BtcAgentX402SettleResult;
    },
  };
}
