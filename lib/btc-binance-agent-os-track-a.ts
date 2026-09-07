import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { loadBtcBinancePublicMarketShadow, type BinancePublicMarketResult } from "./btc-binance-public-market-source";

const execFileAsync = promisify(execFile);

export const BHRIGU_BINANCE_AGENT_OS_TRACK_A_SCHEMA = "bhrigu_binance_agent_os_track_a_v0_1" as const;
export const BHRIGU_TRACK_A_AGENT_NAME = "BHRIGU Bitcoin Research Agent" as const;
export const BHRIGU_TRACK_A_WINDOW_ID = "SEP_10_2026" as const;
export const BHRIGU_TRACK_A_WINDOW_DATE = "2026-09-10" as const;
export const BHRIGU_TRACK_A_MEMORY_LAW = "FIELD → WINDOW → REALITY → MEMORY" as const;
export const BHRIGU_TRACK_A_BOUNDARY = "RESEARCH_STATE_NOT_TRADE" as const;
export type BhriguTrackASourcePath = "binance_cli" | "bhrigu_public_rest_fallback" | "binance_public_api_fallback";

export type BhriguTrackAMarket = {
  provider: "Binance";
  venue: "Binance Spot";
  symbol: "BTCUSDT";
  last_price_usdt: string;
  price_change_percent_24h: string | null;
  high_price_usdt_24h: string | null;
  low_price_usdt_24h: string | null;
  volume_btc_24h: string | null;
  observed_at: string;
  freshness_state: string;
  evidence_ids: string[];
};

export type BhriguTrackARecord = {
  schema_version: typeof BHRIGU_BINANCE_AGENT_OS_TRACK_A_SCHEMA;
  agent: typeof BHRIGU_TRACK_A_AGENT_NAME;
  mode: "research_only";
  boundary: typeof BHRIGU_TRACK_A_BOUNDARY;
  source_path: BhriguTrackASourcePath;
  source_note: string;
  market_time: BhriguTrackAMarket;
  protocol_time: {
    halving_epoch: 4;
    epoch_start_height: 840000;
    next_epoch_height: 1050000;
    block_subsidy_btc: 3.125;
    interpretation: "Bitcoin protocol-time coordinate; not a price forecast.";
  };
  phi_coordinate: {
    role: "observation_coordinate";
    causal_claim: false;
    price_target: false;
  };
  prospective_window: {
    id: typeof BHRIGU_TRACK_A_WINDOW_ID;
    date_utc: typeof BHRIGU_TRACK_A_WINDOW_DATE;
    role: "precommitted_observation_boundary";
    price_target: false;
    trading_signal: false;
    retroactive_rewrite: "forbidden";
  };
  verification: {
    confirmation: string;
    invalidation: string;
    source_freshness_required: true;
  };
  memory: {
    law: typeof BHRIGU_TRACK_A_MEMORY_LAW;
    next_step: "compare_precommitted_record_with_reality";
  };
  authority: {
    trading: false;
    withdrawal: false;
    transfer: false;
    private_account_data: false;
    credentials_read: false;
  };
};

type CliRunner = () => Promise<string>;
type RestLoader = () => Promise<BinancePublicMarketResult>;
type PublicApiLoader = (nowIso: string) => Promise<BhriguTrackAMarket>;

function asObject(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function parseCliMarket(stdout: string, nowIso: string): BhriguTrackAMarket | null {
  let value: unknown;
  try { value = JSON.parse(stdout.trim()); } catch { return null; }
  const root = asObject(value);
  const data = asObject(root?.data) ?? root;
  if (!data) return null;
  const symbol = text(data.symbol);
  const lastPrice = text(data.lastPrice) ?? text(data.price);
  if (symbol !== "BTCUSDT" || !lastPrice) return null;
  return {
    provider: "Binance", venue: "Binance Spot", symbol: "BTCUSDT",
    last_price_usdt: lastPrice,
    price_change_percent_24h: text(data.priceChangePercent),
    high_price_usdt_24h: text(data.highPrice),
    low_price_usdt_24h: text(data.lowPrice),
    volume_btc_24h: text(data.volume),
    observed_at: nowIso,
    freshness_state: "FRESH_AT_RETRIEVAL",
    evidence_ids: ["binance_cli:spot:ticker24hr:BTCUSDT"],
  };
}

function marketFromRest(result: BinancePublicMarketResult): BhriguTrackAMarket {
  if (result.ok === false) throw new Error(`BHRIGU_TRACK_A_MARKET_UNAVAILABLE:${result.code}`);
  const price = result.snapshot.evidence.find((item) => item.endpoint_or_stream === "/api/v3/ticker/price");
  const ticker = result.snapshot.evidence.find((item) => item.endpoint_or_stream === "/api/v3/ticker/24hr");
  const priceValue = asObject(price?.normalized_value);
  const tickerValue = asObject(ticker?.normalized_value);
  const lastPrice = text(priceValue?.price_usdt) ?? text(tickerValue?.last_price_usdt);
  if (!lastPrice) throw new Error("BHRIGU_TRACK_A_PRICE_MISSING");
  return {
    provider: "Binance", venue: "Binance Spot", symbol: "BTCUSDT",
    last_price_usdt: lastPrice,
    price_change_percent_24h: text(tickerValue?.price_change_percent),
    high_price_usdt_24h: text(tickerValue?.high_price_usdt),
    low_price_usdt_24h: text(tickerValue?.low_price_usdt),
    volume_btc_24h: text(tickerValue?.volume_btc),
    observed_at: price?.event_time ?? price?.retrieval_time ?? result.snapshot.retrieved_at,
    freshness_state: price?.freshness.state ?? "UNAVAILABLE",
    evidence_ids: [price?.evidence_id, ticker?.evidence_id].filter((id): id is string => Boolean(id)),
  };
}

export async function defaultBinancePublicApiLoader(nowIso: string): Promise<BhriguTrackAMarket> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5_000);
  try {
    const response = await fetch("https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT", {
      method: "GET", headers: { accept: "application/json" }, cache: "no-store", signal: controller.signal,
    });
    if (!response.ok) throw new Error(`BHRIGU_TRACK_A_PUBLIC_API_HTTP_${response.status}`);
    const data = asObject(await response.json());
    const symbol = text(data?.symbol);
    const lastPrice = text(data?.lastPrice);
    if (symbol !== "BTCUSDT" || !lastPrice) throw new Error("BHRIGU_TRACK_A_PUBLIC_API_SCHEMA");
    return {
      provider: "Binance", venue: "Binance Spot", symbol: "BTCUSDT", last_price_usdt: lastPrice,
      price_change_percent_24h: text(data?.priceChangePercent), high_price_usdt_24h: text(data?.highPrice),
      low_price_usdt_24h: text(data?.lowPrice), volume_btc_24h: text(data?.volume), observed_at: nowIso,
      freshness_state: "FRESH_AT_RETRIEVAL", evidence_ids: ["binance_api:api.binance.com:ticker24hr:BTCUSDT"],
    };
  } finally { clearTimeout(timer); }
}

export async function defaultBinanceCliRunner(): Promise<string> {
  const binary = process.env.BINANCE_CLI_PATH || `${process.env.HOME ?? ""}/.local/bin/binance-cli`;
  const { stdout } = await execFileAsync(binary, ["spot", "ticker24hr", "--symbol", "BTCUSDT"], {
    timeout: 5_000,
    maxBuffer: 1024 * 1024,
    env: { PATH: process.env.PATH ?? "", HOME: process.env.HOME ?? "", NODE_ENV: process.env.NODE_ENV ?? "production", BINANCE_SPOT_BASE_PATH: "https://api.binance.com" },
  });
  return stdout;
}

export async function buildBhriguBinanceAgentOsTrackARecord(options: {
  cliRunner?: CliRunner;
  restLoader?: RestLoader;
  publicApiLoader?: PublicApiLoader;
  now?: () => number;
  source?: "auto" | "cli" | "rest";
} = {}): Promise<BhriguTrackARecord> {
  const cliRunner = options.cliRunner ?? defaultBinanceCliRunner;
  const restLoader = options.restLoader ?? (() => loadBtcBinancePublicMarketShadow());
  const publicApiLoader = options.publicApiLoader ?? defaultBinancePublicApiLoader;
  const nowIso = new Date((options.now ?? Date.now)()).toISOString();
  const source = options.source ?? "auto";
  let sourcePath: BhriguTrackASourcePath;
  let sourceNote: string;
  let market: BhriguTrackAMarket | null = null;
  if (source !== "rest") {
    try { market = parseCliMarket(await cliRunner(), nowIso); } catch { market = null; }
    if (market) {
      sourcePath = "binance_cli";
      sourceNote = "Official Binance CLI read-only Spot market path.";
    } else if (source === "cli") {
      throw new Error("BHRIGU_TRACK_A_BINANCE_CLI_UNAVAILABLE");
    }
  }
  if (!market) {
    try {
      market = marketFromRest(await restLoader());
      sourcePath = "bhrigu_public_rest_fallback";
      sourceNote = "Official Binance CLI was unavailable; existing BHRIGU public Binance REST evidence path used visibly as fail-safe.";
    } catch {
      market = await publicApiLoader(nowIso);
      sourcePath = "binance_public_api_fallback";
      sourceNote = "CLI and BHRIGU data-api path were unavailable; official api.binance.com public Spot endpoint used visibly as final read-only fail-safe.";
    }
  }
  return {
    schema_version: BHRIGU_BINANCE_AGENT_OS_TRACK_A_SCHEMA,
    agent: BHRIGU_TRACK_A_AGENT_NAME,
    mode: "research_only",
    boundary: BHRIGU_TRACK_A_BOUNDARY,
    source_path: sourcePath!,
    source_note: sourceNote!,
    market_time: market,
    protocol_time: {
      halving_epoch: 4, epoch_start_height: 840000, next_epoch_height: 1050000,
      block_subsidy_btc: 3.125,
      interpretation: "Bitcoin protocol-time coordinate; not a price forecast.",
    },
    phi_coordinate: { role: "observation_coordinate", causal_claim: false, price_target: false },
    prospective_window: {
      id: BHRIGU_TRACK_A_WINDOW_ID, date_utc: BHRIGU_TRACK_A_WINDOW_DATE,
      role: "precommitted_observation_boundary", price_target: false,
      trading_signal: false, retroactive_rewrite: "forbidden",
    },
    verification: {
      confirmation: "Source is current and the precommitted window is compared with observed reality after the boundary.",
      invalidation: "If source evidence is stale or unavailable, make no live conclusion and never rewrite the precommitted record.",
      source_freshness_required: true,
    },
    memory: { law: BHRIGU_TRACK_A_MEMORY_LAW, next_step: "compare_precommitted_record_with_reality" },
    authority: {
      trading: false, withdrawal: false, transfer: false,
      private_account_data: false, credentials_read: false,
    },
  };
}
