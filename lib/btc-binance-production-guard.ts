import type {
  BinancePublicMarketFailure,
  BinancePublicMarketResult,
} from "./btc-binance-public-market-source";

export const BTC_BINANCE_PRODUCTION_GUARD_SCHEMA = "btc_binance_production_guard_v0_1" as const;
export const BTC_BINANCE_PRODUCTION_AUXILIARY_DEADLINE_MS = 1_500 as const;
export const BTC_BINANCE_PRODUCTION_WINDOW_MS = 60_000 as const;
export const BTC_BINANCE_PRODUCTION_MAX_BUNDLES_PER_WINDOW = 10 as const;
export const BTC_BINANCE_PRODUCTION_NOMINAL_BUNDLE_WEIGHT = 42 as const;
export const BTC_BINANCE_PRODUCTION_MAX_NOMINAL_WEIGHT_PER_WINDOW = 420 as const;
export const BTC_BINANCE_PRODUCTION_TRANSIENT_FAILURE_THRESHOLD = 3 as const;
export const BTC_BINANCE_PRODUCTION_TRANSIENT_OPEN_MS = 30_000 as const;

type GuardState = {
  window_started_at_ms: number;
  admitted_bundles: number;
  open_until_ms: number;
  hard_open: boolean;
  consecutive_transient_failures: number;
  in_flight: Promise<BinancePublicMarketResult> | null;
};

const state: GuardState = {
  window_started_at_ms: 0,
  admitted_bundles: 0,
  open_until_ms: 0,
  hard_open: false,
  consecutive_transient_failures: 0,
  in_flight: null,
};

function failure(code: "BHRIGU_BINANCE_RATE_BUDGET" | "BHRIGU_BINANCE_CIRCUIT_OPEN", message: string): BinancePublicMarketFailure {
  return { ok: false, code, message };
}

function rollWindow(nowMs: number): void {
  if (state.window_started_at_ms === 0 || nowMs < state.window_started_at_ms || nowMs - state.window_started_at_ms >= BTC_BINANCE_PRODUCTION_WINDOW_MS) {
    state.window_started_at_ms = nowMs;
    state.admitted_bundles = 0;
  }
}

function admit(nowMs: number): BinancePublicMarketFailure | null {
  rollWindow(nowMs);
  if (state.hard_open || state.open_until_ms > nowMs) {
    return failure("BHRIGU_BINANCE_CIRCUIT_OPEN", "Binance auxiliary provider circuit is open; base answer remains available.");
  }
  if (state.admitted_bundles >= BTC_BINANCE_PRODUCTION_MAX_BUNDLES_PER_WINDOW) {
    return failure("BHRIGU_BINANCE_RATE_BUDGET", "Binance auxiliary provider budget is exhausted for this runtime window; base answer remains available.");
  }
  state.admitted_bundles += 1;
  return null;
}

function recordResult(result: BinancePublicMarketResult, nowMs: number): void {
  if (!("code" in result)) {
    state.consecutive_transient_failures = 0;
    const usedWeight = result.provider_used_weight_1m_max ?? null;
    if (usedWeight !== null && usedWeight > BTC_BINANCE_PRODUCTION_MAX_NOMINAL_WEIGHT_PER_WINDOW) {
      state.open_until_ms = Math.max(state.open_until_ms, state.window_started_at_ms + BTC_BINANCE_PRODUCTION_WINDOW_MS);
    }
    return;
  }
  if (result.code === "BINANCE_RATE_LIMIT_429") {
    state.open_until_ms = Math.max(state.open_until_ms, nowMs + Math.max(result.retry_after_ms ?? BTC_BINANCE_PRODUCTION_WINDOW_MS, 1_000));
    return;
  }
  if (result.code === "BINANCE_IP_BAN_418") {
    if (result.retry_after_ms === undefined) state.hard_open = true;
    else state.open_until_ms = Math.max(state.open_until_ms, nowMs + Math.max(result.retry_after_ms, 1_000));
    return;
  }
  if (result.code === "BINANCE_TIMEOUT" || result.code === "BINANCE_HTTP_ERROR") {
    state.consecutive_transient_failures += 1;
    if (state.consecutive_transient_failures >= BTC_BINANCE_PRODUCTION_TRANSIENT_FAILURE_THRESHOLD) {
      state.open_until_ms = Math.max(state.open_until_ms, nowMs + BTC_BINANCE_PRODUCTION_TRANSIENT_OPEN_MS);
      state.consecutive_transient_failures = 0;
    }
    return;
  }
  state.consecutive_transient_failures = 0;
}

export async function loadBtcBinanceProductionGuarded(
  fetcher: (signal: AbortSignal) => Promise<BinancePublicMarketResult>,
  options: { now?: () => number; deadlineMs?: number } = {},
): Promise<BinancePublicMarketResult> {
  const now = options.now ?? Date.now;
  if (state.in_flight) return state.in_flight;
  const denied = admit(now());
  if (denied) return denied;

  const controller = new AbortController();
  const deadlineMs = options.deadlineMs ?? BTC_BINANCE_PRODUCTION_AUXILIARY_DEADLINE_MS;
  const timer = setTimeout(() => controller.abort(), deadlineMs);
  const promise = (async (): Promise<BinancePublicMarketResult> => {
    try {
      const result = await fetcher(controller.signal);
      recordResult(result, now());
      return result;
    } catch {
      const result: BinancePublicMarketFailure = {
        ok: false,
        code: controller.signal.aborted ? "BINANCE_TIMEOUT" : "BINANCE_HTTP_ERROR",
        message: controller.signal.aborted
          ? "Binance auxiliary provider deadline exceeded; base answer remains available."
          : "Binance auxiliary provider request failed; base answer remains available.",
      };
      recordResult(result, now());
      return result;
    } finally {
      clearTimeout(timer);
    }
  })();

  state.in_flight = promise;
  try {
    return await promise;
  } finally {
    if (state.in_flight === promise) state.in_flight = null;
  }
}

export function getBtcBinanceProductionGuardState(): Readonly<Omit<GuardState, "in_flight"> & { in_flight: boolean }> {
  return { ...state, in_flight: state.in_flight !== null };
}

export function resetBtcBinanceProductionGuardForTests(): void {
  state.window_started_at_ms = 0;
  state.admitted_bundles = 0;
  state.open_until_ms = 0;
  state.hard_open = false;
  state.consecutive_transient_failures = 0;
  state.in_flight = null;
}
