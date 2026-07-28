import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import {
  BTC_BINANCE_FREE_OBSERVATION_ACTIVATION_SHA,
  BTC_BINANCE_FREE_OBSERVATION_FLAG,
  loadBtcBinanceFreeObservationBridge,
} from "../lib/btc-binance-free-observation-bridge";
import {
  BTC_BINANCE_FREE_OBSERVATION_CANDIDATE_SHA256,
  BTC_BINANCE_FREE_OBSERVATION_DATA_PATH,
  BTC_BINANCE_FREE_OBSERVATION_FILE_SHA256,
  computeBtcBinanceObservationFileSha256,
  parseBtcBinanceFreeObservation,
} from "../lib/btc-binance-free-observation-contract";

async function main() {
  const checks: Record<string, boolean> = {};
  const candidatePath = resolve(BTC_BINANCE_FREE_OBSERVATION_DATA_PATH);
  const raw = await readFile(candidatePath, "utf8");
  const decoded = JSON.parse(raw);
  const packet = parseBtcBinanceFreeObservation(decoded);
  const runtimeHeadSha = process.env.BTC_BINANCE_RUNTIME_HEAD_SHA ?? null;

  checks.candidate_contract = packet.candidate_sha256 === BTC_BINANCE_FREE_OBSERVATION_CANDIDATE_SHA256;
  checks.candidate_file_hash = computeBtcBinanceObservationFileSha256(raw) === BTC_BINANCE_FREE_OBSERVATION_FILE_SHA256;
  checks.one_observed_row = packet.boundary.maximum_observed_rows === 1 && packet.boundary.historical_window_rows_exposed === 0;
  checks.venue_specific = packet.observation.instrument === "BTCUSDT" && packet.observation.quote_asset === "USDT";
  checks.no_public_raw_or_private_rows = packet.boundary.raw_provider_payload_exposed === false && packet.boundary.private_corpus_rows_exposed === false;
  checks.runtime_head_sha_bound = runtimeHeadSha === null || /^[a-f0-9]{40}$/.test(runtimeHeadSha);

  const shadow = await loadBtcBinanceFreeObservationBridge({ env: {} });
  checks.default_off_shadow_ready = shadow.status === "READY_SHADOW" && shadow.public_enabled === false && shadow.packet === null;

  const unbound = await loadBtcBinanceFreeObservationBridge({
    env: { [BTC_BINANCE_FREE_OBSERVATION_FLAG]: "true" },
  });
  checks.enable_requires_sha_binding = unbound.status === "FALLBACK_STATIC" && unbound.reason_code === "ACTIVATION_SHA_MISSING_OR_INVALID";

  const enabled = await loadBtcBinanceFreeObservationBridge({
    env: {
      [BTC_BINANCE_FREE_OBSERVATION_FLAG]: "true",
      [BTC_BINANCE_FREE_OBSERVATION_ACTIVATION_SHA]: BTC_BINANCE_FREE_OBSERVATION_CANDIDATE_SHA256,
    },
  });
  checks.sha_locked_preview_ready = enabled.status === "READY_PUBLIC" && enabled.packet?.candidate_sha256 === BTC_BINANCE_FREE_OBSERVATION_CANDIDATE_SHA256;

  const invalidFlag = await loadBtcBinanceFreeObservationBridge({
    env: { [BTC_BINANCE_FREE_OBSERVATION_FLAG]: "1" },
  });
  checks.invalid_flag_falls_back = invalidFlag.status === "FALLBACK_STATIC" && invalidFlag.reason_code === "FEATURE_FLAG_VALUE_INVALID";

  const root = await mkdtemp(join(tmpdir(), "btc-binance-observation-"));
  try {
    const invalidJson = join(root, "invalid.json");
    await writeFile(invalidJson, "{", "utf8");
    const invalidJsonState = await loadBtcBinanceFreeObservationBridge({ env: {}, candidatePath: invalidJson });
    checks.invalid_json_falls_back = invalidJsonState.status === "FALLBACK_STATIC" && invalidJsonState.reason_code === "CANDIDATE_FILE_DIGEST_INVALID";

    const tamperedPath = join(root, "tampered.json");
    const tampered = structuredClone(decoded);
    tampered.observation.close_usdt += 1;
    await writeFile(tamperedPath, JSON.stringify(tampered), "utf8");
    const tamperedState = await loadBtcBinanceFreeObservationBridge({ env: {}, candidatePath: tamperedPath });
    checks.tampered_candidate_falls_back = tamperedState.status === "FALLBACK_STATIC" && tamperedState.reason_code === "CANDIDATE_FILE_DIGEST_INVALID";
  } finally {
    await rm(root, { recursive: true, force: true });
  }

  const page = await readFile("pages/crypto-astro/btc.tsx", "utf8");
  checks.static_source_preserved = page.includes("const source=await loadBtcStaticSource();");
  checks.static_composer_preserved = page.includes("composeBtcPublicSnapshot(source,");
  checks.bridge_not_composer_input = !page.includes("composeBtcPublicSnapshot(observationBridge") && !page.includes("loadBtcMarketEnvelope(observationBridge");
  checks.panel_additive_only = page.includes("p.binanceObservation&&<BtcBinanceFreeObservationPanel") && page.indexOf("<BtcQuestionMembrane") < page.indexOf("p.binanceObservation&&");
  checks.no_public_api_route = !page.includes("/api/btc-binance") && !page.includes("fetch(\"/api");

  for (const [name, passed] of Object.entries(checks)) assert.equal(passed, true, name);

  const report = {
    schema_version: "btc_binance_free_observation_bridge_dual_run_acceptance_v0_1",
    node: "BTC_MARKET_COSMOGRAPHER_BINANCE_FREE_OBSERVATION_PUBLIC_BRIDGE_AND_DUAL_RUN_INTEGRATION_FULL_CYCLE_v0_1",
    status: "PASS_PUBLIC_BRIDGE_DUAL_RUN_DEFAULT_OFF",
    source_candidate_sha256: packet.candidate_sha256,
    source_artifact_digest: "sha256:5c621068e48c7923346a547bc56801a2e17237806bf27cf5986b486347fca35e",
    source_orion_merge_sha: "55b5e2923059694df1247cfd9090396259ab8111",
    portal_source_base_sha: "a8221adc926418be012f852db719a4b141bb7afc",
    runtime_head_sha: runtimeHeadSha,
    checks,
    decision: {
      public_activation: false,
      feature_flag_default_off: true,
      activation_sha_binding_required: true,
      current_static_corridor_preserved: true,
      direct_replacement: false,
      fallback: "CURRENT_STATIC_BTC_CORRIDOR",
      rollback: "DISABLE_FEATURE_FLAG_NO_DATA_MIGRATION",
    },
    next_safe_node: "BTC_MARKET_COSMOGRAPHER_BINANCE_FREE_OBSERVATION_PUBLIC_ACTIVATION_ACCEPTANCE_GATE_v0_1",
  };
  const reportPath = process.env.BTC_BINANCE_BRIDGE_REPORT;
  if (reportPath) await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(JSON.stringify(report));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
