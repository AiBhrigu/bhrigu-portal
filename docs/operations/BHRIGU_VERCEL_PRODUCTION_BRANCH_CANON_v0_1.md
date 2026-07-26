# BHRIGU Vercel Production Branch Canon v0.1

## Status

`LOCKED · ACTIVE`

## Repository

`AiBhrigu/bhrigu-portal`

## Canonical branch roles

- `master` is the GitHub default branch, accepted development branch, pull-request target, and source of truth.
- `main` is a deployment-only mirror retained because the connected Vercel production project tracks `main`.
- Product work, repair work, and verification changes must target `master`.
- No authored feature, repair, rollback, or emergency commit may target `main` directly.

## Required topology

The only accepted steady state is:

```text
main == master
```

A temporary state where `main` is an ancestor of `master` may exist only while the automated drift guard is fast-forwarding the deployment mirror.

## Allowed transition

```text
main --fast-forward--> master SHA
```

The transition must satisfy all of the following:

1. `main` contains no commit that is absent from `master`;
2. no force update is used;
3. no history is rewritten;
4. the final `main` SHA equals the final `master` SHA;
5. the Vercel custom domain exposes the same 40-character deployment source SHA.

## Fail-closed states

The guard must stop without repair when:

- a pull request targets `main`;
- `main` is ahead of `master`;
- `main` and `master` have diverged;
- the mirror cannot be fast-forwarded;
- the custom-domain deployment does not expose the expected `master` SHA after synchronization.

No force push, merge commit into `main`, reset, branch deletion, DNS change, Vercel project reassignment, or application-code repair is authorized by this canon.

## Public deployment proof

The authoritative production route is:

`https://www.bhrigu.io/crypto-astro/btc`

Closure requires both bindings to equal the accepted `master` SHA:

- `<meta name="btc-deployment-source-sha" content="<40-char SHA>">`
- `<main data-deployment-source-sha="<40-char SHA>">`

## Operational ownership

The workflow `.github/workflows/bhrigu-production-branch-drift-guard.yml` enforces this canon.

It may:

- classify `main/master` topology;
- fast-forward `main` to `master` when and only when `main` is an ancestor;
- verify final ref identity;
- verify the public deployment source SHA;
- publish a machine-readable report.

It may not alter application files, market data, Snapshot, BTC logic, temporal routing, bilingual semantics, visual geometry, backend, payment, provider/history, forecast, trading behavior, DNS, or ORION.