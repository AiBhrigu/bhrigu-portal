# BHRIGU Vercel Production Branch and Canonical Host Canon v0.2

## Status

`LOCKED · ACTIVE`

## Repository

`AiBhrigu/bhrigu-portal`

## Canonical branch roles

- `master` is the GitHub default branch, accepted development branch, pull-request target, and source of truth.
- `main` is a deployment-only mirror retained because the connected Vercel production project tracks `main`.
- Product, repair, infrastructure-binding, and verification changes target `master`.
- No authored feature, repair, rollback, or emergency commit may target `main` directly.

## Required branch topology

The only accepted steady state is:

```text
main == master
```

A temporary state where `main` is an ancestor of `master` may exist only while the automated drift guard is fast-forwarding the deployment mirror.

## Allowed branch transition

```text
main --fast-forward--> master SHA
```

The transition must satisfy all of the following:

1. `main` contains no commit absent from `master`;
2. no force update is used;
3. no history is rewritten;
4. final `main` SHA equals final `master` SHA;
5. the canonical production host exposes the same 40-character deployment source SHA.

## Canonical public host topology

```text
CANONICAL_HOST=www.bhrigu.io
SECONDARY_HOST=bhrigu.io
```

The canonical host serves the public application directly.

The secondary host must not independently serve a second public surface. Every secondary-host request must return a permanent `308` redirect to the canonical host while preserving:

- scheme: `https`;
- complete path;
- complete query string.

Accepted examples:

```text
https://bhrigu.io/
→ 308 https://www.bhrigu.io/

https://bhrigu.io/crypto-astro/btc?lang=ru
→ 308 https://www.bhrigu.io/crypto-astro/btc?lang=ru

https://bhrigu.io/crypto-astro/btc/live?q=liquidity&lang=en
→ 308 https://www.bhrigu.io/crypto-astro/btc/live?q=liquidity&lang=en
```

The source-controlled edge contract is defined in `vercel.json`.

## Public deployment proof

The authoritative production routes are:

- `https://www.bhrigu.io/`
- `https://www.bhrigu.io/crypto-astro/btc`
- `https://www.bhrigu.io/crypto-astro/btc/live`

Closure requires:

1. canonical routes return `HTTP 200` without a host redirect;
2. secondary routes return `HTTP 308`;
3. redirect targets use `www.bhrigu.io`;
4. path and query are preserved exactly;
5. following the secondary redirect reaches the canonical route;
6. the static BTC route exposes the accepted `master` SHA through:
   - `<meta name="btc-deployment-source-sha" content="<40-char SHA>">`;
   - `<main data-deployment-source-sha="<40-char SHA>">`;
   - the quiet visible 12-character SHA prefix;
7. the live BTC route exposes the accepted `master` SHA through its deployment-source `<meta>` and preserves the `btc-live-dialogue` route marker.

## Fail-closed states

The guard must stop without repair when:

- a pull request targets `main`;
- `main` is ahead of `master`;
- `main` and `master` diverge;
- the mirror cannot be fast-forwarded;
- `vercel.json` lacks the exact apex-to-`www` permanent redirect;
- the canonical host redirects to the secondary host;
- the canonical host does not expose the expected deployment SHA;
- the secondary host returns `200` instead of `308`;
- redirect scheme, host, path, or query changes;
- the followed secondary request does not reach the canonical exact-SHA surface.

## Operational ownership

The workflow `.github/workflows/bhrigu-production-branch-drift-guard.yml` enforces this canon.

It may:

- classify `main/master` topology;
- fast-forward `main` to `master` only when `main` is an ancestor;
- verify final ref identity;
- validate the source-controlled canonical-host redirect contract;
- verify the canonical edge and secondary redirect edge;
- publish machine-readable evidence.

It may not:

- force push, reset, rewrite history, or merge into `main`;
- change DNS records or reassign Vercel projects;
- alter BTC application modules, market data, Snapshot, Memory, dialogue logic, temporal routing, bilingual semantics, visual geometry, backend, payment, provider/history, forecast, trading behavior, or ORION.

## Repair boundary

Canonical-host repair is infrastructure binding only:

```text
vercel.json
.github/workflows/bhrigu-production-branch-drift-guard.yml
docs/operations/BHRIGU_VERCEL_PRODUCTION_BRANCH_CANON_v0_1.md
```

No broader application or domain migration is authorized by this canon.
