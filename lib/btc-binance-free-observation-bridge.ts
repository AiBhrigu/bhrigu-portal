import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  BTC_BINANCE_FREE_OBSERVATION_CANDIDATE_SHA256,
  BTC_BINANCE_FREE_OBSERVATION_DATA_PATH,
  BTC_BINANCE_FREE_OBSERVATION_FILE_SHA256,
  BtcBinanceObservationContractError,
  computeBtcBinanceObservationFileSha256,
  parseBtcBinanceFreeObservation,
  type BtcBinanceFreeObservation,
} from "./btc-binance-free-observation-contract";

export const BTC_BINANCE_FREE_OBSERVATION_FLAG = "BTC_BINANCE_FREE_OBSERVATION_ENABLED" as const;
export const BTC_BINANCE_FREE_OBSERVATION_ACTIVATION_SHA = "BTC_BINANCE_FREE_OBSERVATION_ACTIVATION_SHA" as const;

export type BtcBinanceObservationBridgeState =
  | {
      status: "READY_SHADOW";
      public_enabled: false;
      packet: null;
      candidate_sha256: string;
      fallback: "CURRENT_STATIC_BTC_CORRIDOR";
    }
  | {
      status: "READY_PUBLIC";
      public_enabled: true;
      packet: BtcBinanceFreeObservation;
      candidate_sha256: string;
      fallback: "CURRENT_STATIC_BTC_CORRIDOR";
    }
  | {
      status: "FALLBACK_STATIC";
      public_enabled: false;
      packet: null;
      candidate_sha256: null;
      reason_code:
        | "FEATURE_FLAG_VALUE_INVALID"
        | "ACTIVATION_SHA_MISSING_OR_INVALID"
        | "CANDIDATE_FILE_UNAVAILABLE"
        | "CANDIDATE_JSON_INVALID"
        | "CANDIDATE_FILE_DIGEST_INVALID"
        | "CANDIDATE_CONTRACT_INVALID";
      fallback: "CURRENT_STATIC_BTC_CORRIDOR";
    };

type BridgeOptions = {
  env?: Record<string, string | undefined>;
  candidatePath?: string;
  readText?: (path: string) => Promise<string>;
};

function parseFlag(value: string | undefined): false | true | "invalid" {
  if (value === undefined || value === "" || value === "false") return false;
  if (value === "true") return true;
  return "invalid";
}

export async function loadBtcBinanceFreeObservationBridge(
  options: BridgeOptions = {},
): Promise<BtcBinanceObservationBridgeState> {
  const env = options.env ?? process.env;
  const enabled = parseFlag(env[BTC_BINANCE_FREE_OBSERVATION_FLAG]);
  if (enabled === "invalid") {
    return { status: "FALLBACK_STATIC", public_enabled: false, packet: null, candidate_sha256: null, reason_code: "FEATURE_FLAG_VALUE_INVALID", fallback: "CURRENT_STATIC_BTC_CORRIDOR" };
  }

  let raw: string;
  try {
    const candidatePath = options.candidatePath ?? resolve(process.cwd(), BTC_BINANCE_FREE_OBSERVATION_DATA_PATH);
    raw = await (options.readText ?? ((path) => readFile(path, "utf8")))(candidatePath);
  } catch {
    return { status: "FALLBACK_STATIC", public_enabled: false, packet: null, candidate_sha256: null, reason_code: "CANDIDATE_FILE_UNAVAILABLE", fallback: "CURRENT_STATIC_BTC_CORRIDOR" };
  }

  if (computeBtcBinanceObservationFileSha256(raw) !== BTC_BINANCE_FREE_OBSERVATION_FILE_SHA256) {
    return { status: "FALLBACK_STATIC", public_enabled: false, packet: null, candidate_sha256: null, reason_code: "CANDIDATE_FILE_DIGEST_INVALID", fallback: "CURRENT_STATIC_BTC_CORRIDOR" };
  }

  let decoded: unknown;
  try {
    decoded = JSON.parse(raw);
  } catch {
    return { status: "FALLBACK_STATIC", public_enabled: false, packet: null, candidate_sha256: null, reason_code: "CANDIDATE_JSON_INVALID", fallback: "CURRENT_STATIC_BTC_CORRIDOR" };
  }

  let packet: BtcBinanceFreeObservation;
  try {
    packet = parseBtcBinanceFreeObservation(decoded);
  } catch (error) {
    if (!(error instanceof BtcBinanceObservationContractError)) throw error;
    return { status: "FALLBACK_STATIC", public_enabled: false, packet: null, candidate_sha256: null, reason_code: "CANDIDATE_CONTRACT_INVALID", fallback: "CURRENT_STATIC_BTC_CORRIDOR" };
  }

  if (!enabled) {
    return { status: "READY_SHADOW", public_enabled: false, packet: null, candidate_sha256: packet.candidate_sha256, fallback: "CURRENT_STATIC_BTC_CORRIDOR" };
  }

  if (env[BTC_BINANCE_FREE_OBSERVATION_ACTIVATION_SHA] !== BTC_BINANCE_FREE_OBSERVATION_CANDIDATE_SHA256) {
    return { status: "FALLBACK_STATIC", public_enabled: false, packet: null, candidate_sha256: null, reason_code: "ACTIVATION_SHA_MISSING_OR_INVALID", fallback: "CURRENT_STATIC_BTC_CORRIDOR" };
  }

  return { status: "READY_PUBLIC", public_enabled: true, packet, candidate_sha256: packet.candidate_sha256, fallback: "CURRENT_STATIC_BTC_CORRIDOR" };
}
