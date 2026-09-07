import { buildBhriguBinanceAgentOsTrackARecord } from "../lib/btc-binance-agent-os-track-a";

const args = new Set(process.argv.slice(2));
const source = args.has("--rest") ? "rest" : args.has("--cli") ? "cli" : "auto";
const jsonOnly = args.has("--json");

async function main() {
  const record = await buildBhriguBinanceAgentOsTrackARecord({ source });
  if (jsonOnly) {
    console.log(JSON.stringify(record, null, 2));
    return;
  }
  console.log("BHRIGU BITCOIN RESEARCH AGENT · BINANCE AGENT OS TRACK A");
  console.log("==========================================================");
  console.log(`SOURCE PATH   ${record.source_path}`);
  console.log(`BTCUSDT       ${record.market_time.last_price_usdt} USDT`);
  console.log(`24H CHANGE    ${record.market_time.price_change_percent_24h ?? "n/a"}%`);
  console.log(`FRESHNESS     ${record.market_time.freshness_state}`);
  console.log(`OBSERVED AT   ${record.market_time.observed_at}`);
  console.log("");
  console.log("MARKET TIME   Binance Spot · BTCUSDT");
  console.log(`PROTOCOL TIME Halving epoch ${record.protocol_time.halving_epoch} · subsidy ${record.protocol_time.block_subsidy_btc} BTC`);
  console.log(`WINDOW        ${record.prospective_window.id} · ${record.prospective_window.date_utc}`);
  console.log(`MEMORY        ${record.memory.law}`);
  console.log("");
  console.log("CONFIRMATION");
  console.log(record.verification.confirmation);
  console.log("INVALIDATION");
  console.log(record.verification.invalidation);
  console.log("");
  console.log(`BOUNDARY       ${record.boundary}`);
  console.log(`TRADING        ${record.authority.trading}`);
  console.log(`WALLET ACCESS  false`);
  console.log(`PRIVATE DATA   ${record.authority.private_account_data}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
