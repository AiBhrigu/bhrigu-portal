# BTC Market Cosmographer — Binance Free Observation Public Bridge and Dual-Run Integration v0.1

## Node

`BTC_MARKET_COSMOGRAPHER_BINANCE_FREE_OBSERVATION_PUBLIC_BRIDGE_AND_DUAL_RUN_INTEGRATION_FULL_CYCLE_v0_1`

## Purpose

Introduce the accepted sanitized Binance historical Observation into `bhrigu-portal` as a server-side, additive, feature-gated panel without changing the existing BTC question answer, market envelope, source proof, or public traffic.

## Source anchors

- ORION readiness merge: `55b5e2923059694df1247cfd9090396259ab8111`
- Readiness artifact digest: `sha256:5c621068e48c7923346a547bc56801a2e17237806bf27cf5986b486347fca35e`
- Accepted candidate SHA-256: `b0bfa9c6489e5eff94233a903d6c29b9e31122c30499f84f1328e2ad19943aa3`
- Portal source base: `a8221adc926418be012f852db719a4b141bb7afc`

## Integration architecture

```text
accepted sanitized candidate JSON
        ↓
strict file digest + schema guard
        ↓
server-side bridge
        ↓
feature flag + candidate-SHA activation binding
        ↓
additive Observation panel only
```

The existing route remains:

```text
loadBtcStaticSource()
        ↓
composeBtcPublicSnapshot(source)
        ↓
loadBtcMarketEnvelope(...)
        ↓
existing three-zone BTC reading
```

The Binance packet is never passed to the public snapshot composer or Market Envelope loader.

## Feature and activation contract

Public rendering requires both:

```text
BTC_BINANCE_FREE_OBSERVATION_ENABLED=true
BTC_BINANCE_FREE_OBSERVATION_ACTIVATION_SHA=b0bfa9c6489e5eff94233a903d6c29b9e31122c30499f84f1328e2ad19943aa3
```

Default state is `OFF`.

When the flag is absent or `false`, the bridge validates the candidate in shadow mode and returns no public packet.

When the flag is invalid, the file is absent, its digest changes, its schema fails, or the activation SHA is missing or incorrect, the bridge returns `FALLBACK_STATIC`. The page continues with the current static BTC corridor.

## Public packet boundary

The committed candidate contains only:

- one Binance Spot `BTCUSDT` daily observation for `2024-04-20`;
- OHLC, BTC volume, quote volume, and trade count;
- eight bounded derived market metrics;
- compact deterministic Cosmographer context;
- provider attribution, method ID, and proof hashes;
- explicit uncertainty and rights boundary.

It does not contain provider archives, API payloads, 90-row history, private Parquet rows, private Astro vectors, paid Question state, payment state, forecast, causal claim, or trading signal.

## Dual-run acceptance

CI proves both runtime modes from the same build:

1. **Default OFF** — the existing BTC question surface renders without the Binance panel or candidate hash.
2. **SHA-bound preview ON** — the separate panel renders, while the existing question result retains exactly three reading zones and the static source proof remains present.

The visual proof checks desktop and mobile overflow, 61.803/38.197 geometry, bilingual rendering, evidence presence, and browser errors.

## Rollback

```text
BTC_BINANCE_FREE_OBSERVATION_ENABLED=false
```

No data migration or schema migration is required. The current static corridor is the fallback and remains the sole public answer source until a later activation gate.

## Current decision

```text
PUBLIC_BRIDGE_IMPLEMENTED=YES
DUAL_RUN_PROVED=YES
FEATURE_FLAG_DEFAULT_OFF=YES
PUBLIC_ACTIVATION=NO
CURRENT_STATIC_QUESTION_RESULT_CHANGED=NO
PAYMENT=NO
PAID_QUESTION=NO
```

## Next safe node

`BTC_MARKET_COSMOGRAPHER_BINANCE_FREE_OBSERVATION_PUBLIC_ACTIVATION_ACCEPTANCE_GATE_v0_1`
