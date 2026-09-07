# BHRIGU Bitcoin Research Agent · Binance Agent OS Track A

Status: bounded hackathon adapter. This is not a new BHRIGU product and does not alter the BTC Cosmographer runtime.

## Thesis

Most crypto agents collapse Bitcoin into market price and execution. BHRIGU keeps two clocks visible: Binance market time and Bitcoin protocol time, then binds both to a precommitted observation window and an append-only research-memory law.

`FIELD → WINDOW → REALITY → MEMORY`

## Read-only path

1. Prefer the official `binance-cli` public Spot ticker path with a hard five-second timeout.
2. If that path is unavailable, visibly fall back to BHRIGU's existing public Binance REST evidence layer.
3. If the existing BHRIGU `data-api.binance.vision` route is unreachable, use `api.binance.com` public Spot ticker as a final visible read-only fail-safe.
4. Never read private account state or use execution endpoints.
5. Label the path actually used in every demo record.

## Demo object

The demo combines:
- Binance Spot `BTCUSDT` market time and freshness;
- Bitcoin halving epoch 4 (`840000 → 1049999`, 3.125 BTC subsidy);
- Φ as a non-causal observation coordinate;
- the precommitted `SEP_10_2026` observation boundary;
- explicit confirmation / invalidation rules;
- immutable post-window comparison with reality.

The output is `RESEARCH_STATE_NOT_TRADE`. It contains no price target, execution authority, or private-account data.

## Verification

```bash
npm run verify:btc-binance-agent-os-track-a
npm run demo:btc-binance-agent-os-track-a
```

For deterministic REST-only demonstration:

```bash
npm run demo:btc-binance-agent-os-track-a -- --rest
```

For machine-readable output add `--json`.

## IP boundary

`Expose Meaning / Protect Mechanism` applies to every development and submission stage.

Public in this bounded Track A artifact:
- adapter contract and demo output;
- public source labels and freshness state;
- protocol-time/window/memory semantics;
- acceptance evidence and zero-financial-authority boundary.

Protected and intentionally excluded:
- ORION internals and protected-core implementation;
- private prompts, planners, evaluator contracts and corpora;
- non-public research datasets or reconstruction logic;
- credentials, account state, wallet/payment mechanisms and secrets;
- any mechanism not required to reproduce the bounded public demo.

The hackathon branch must not become a route for reconstructing the protected BHRIGU/ORION mechanism.
