# BTC Cosmographer Multi-Body Astro Corridor · Local Linux Pinned v0.5 Acceptance

Node:

`BTC_COSMOGRAPHER_MULTI_BODY_ASTRO_CORRIDOR_LOCAL_LINUX_PINNED_V0_5_ACCEPTANCE_v0_1`

## Purpose

Perform a reproducible Linux acceptance of the isolated multi-body Astro corridor without changing the accepted release-candidate source files, PR #99, merge state, or production surfaces.

## Pin

- repository: `AiBhrigu/bhrigu-portal`;
- PR: `#100`;
- pinned release-candidate source SHA: `7f6bc7fa981d851d5d7928f7809c173f3c226a09`;
- branch: `repair/btc-cosmographer-multi-body-astro-local-rc-v0-1`;
- route: `/crypto-astro/btc/local-rc`;
- environment gate: `BTC_LOCAL_RC=1`;
- public route remains closed when the gate is absent.

## Overlay boundary

The pinned v0.5 overlay may contain only:

1. `.github/workflows/btc-cosmographer-multi-body-local-linux-pinned-v0-5.yml`;
2. `scripts/run-btc-cosmographer-multi-body-local-linux-pinned-v0-5.sh`;
3. `scripts/run-btc-cosmographer-multi-body-pinned-v0-5-semantic-acceptance.mjs`;
4. this document.

The six release-candidate files must remain byte-equivalent to the pinned source SHA.

## Launcher modes

### Acceptance mode

```bash
bash scripts/run-btc-cosmographer-multi-body-local-linux-pinned-v0-5.sh accept
```

The launcher:

- verifies Linux and a compatible Node.js runtime;
- verifies that the checkout descends from the pinned source SHA;
- rejects drift in all six release-candidate files;
- installs exact dependencies with `npm ci`;
- runs authoritative static acceptance;
- builds the Next.js candidate;
- starts the isolated local route;
- executes the multi-turn semantic corridor acceptance;
- verifies that the route returns `404` without `BTC_LOCAL_RC=1`;
- writes a one-tab HTML report, JSON proof, transcript, logs, and a ZIP evidence package.

### Serve mode

```bash
bash scripts/run-btc-cosmographer-multi-body-local-linux-pinned-v0-5.sh serve
```

Serve mode opens or prints one pinned local URL and keeps the isolated route active until interrupted. It does not expose or modify production.

## Semantic corridor

The one-tab acceptance covers:

1. `Какие аспекты планет важны в 2026 году?`;
2. `Почему это важно?`;
3. `А ликвидность это подтверждает?`;
4. `Теперь о халвинге`;
5. `Вернёмся к аспектам`;
6. `Which planetary aspects matter in 2026?`.

The proof requires:

- multi-body routing with no Jupiter fallback;
- chronological ranked windows;
- the complete July 20–21 cluster;
- two unique station/ingress transitions;
- correct Russian morphology for exact aspects and transitions;
- complete annual transitions including both December 13 events;
- correct Russian ingress cases;
- independent Astro and market layers;
- explicit no-causality, no-price-forecast, and no-trading-signal boundaries;
- topic switch to halving and return to the prior Astro corridor;
- English overview parity.

## Acceptance boundary

This node does not authorize:

- merge of PR #100;
- integration into PR #99;
- production testing or deployment;
- changes to public routes;
- corpus expansion;
- payment, accounts, Paid runtime, or backend work;
- market prediction or trading signals.

## Required final state

`PINNED_V0_5_LINUX_ACCEPTANCE_PASS · DRAFT · UNMERGED · PRODUCTION_UNCHANGED`
