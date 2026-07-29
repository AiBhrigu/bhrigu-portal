# BHRIGU Portal local exact-head visual validation

## Locked node

`BHRIGU_PORTAL_LOCAL_EXACT_HEAD_VISUAL_VALIDATION_HARNESS_IMPLEMENTATION_FULL_CYCLE_v0_1`

## Source of truth

- Repository: `AiBhrigu/bhrigu-portal`
- Exact application source SHA: `27737aed75059c01472ecec5e123aaed2ff10236`
- Harness branch: `agent/bhrigu-portal-local-visual-harness-v0-1`
- Production deployment: not part of this node
- Vercel write: forbidden
- x402 live transfer: forbidden

The harness branch is stacked directly on the exact application source SHA. The runner fails when any path outside the locked harness file set differs from that source.

## What the runner proves

1. The exact source SHA is an ancestor of the local harness checkout.
2. Only the locked harness paths differ from the source SHA.
3. The tracked worktree is clean.
4. `next build` completes.
5. A production-mode Next server starts on `127.0.0.1:4317`.
6. Public routes are discovered from `.next/server/pages-manifest.json`.
7. Dynamic, API, internal and protected-review routes are excluded explicitly and recorded.
8. Four additional BTC scenarios cover RU/EN overview and RU/EN first-answer dialogue states.
9. Every route is captured at desktop `1440×1200` and mobile `390×844`.
10. The audit records navigation status, page errors, first-party console and network errors, broken first-party images, document title, body presence and horizontal overflow.
11. Screenshots, per-route JSON, a Markdown summary and an HTML gallery are retained outside the repository.

## Linux clean-sync runner

The runner never repairs or mutates an old local checkout. It creates a separate clean worktree under:

`$HOME/BHRIGU_LOCAL_VISUAL`

Entry point:

```bash
bash scripts/local-visual/sync-and-run.sh
```

The script performs a clean fetch of the harness branch, installs the exact lockfile without lifecycle scripts, installs the pinned Chromium build and executes the same validation used in GitHub Actions.

## Direct execution from an already clean harness checkout

```bash
npm ci --ignore-scripts
npx playwright install chromium
npm run verify:local-visual
```

## Evidence package

Default local evidence root:

`$HOME/BHRIGU_LOCAL_VISUAL/evidence`

Repository-relative CI evidence root:

`artifacts/local-visual`

Each run contains:

- `index.html` — visual gallery
- `summary.md` — compact review table
- `manifest.json` — full machine-readable evidence
- `routes.json` — discovered and skipped routes
- `screenshots/desktop/*.png`
- `screenshots/mobile/*.png`
- `reports/desktop/*.json`
- `reports/mobile/*.json`
- `server.log`

Evidence files are never committed to the repository.

## Fail-closed blockers

A capture fails when any of the following occurs:

- page navigation fails or returns `4xx/5xx`;
- uncaught page runtime error;
- first-party request or HTTP failure;
- first-party console error;
- broken first-party image;
- horizontal overflow greater than two pixels;
- empty document title;
- empty or truncated body;
- screenshot capture failure.

External resource failures are retained as warnings rather than silently discarded.

## Boundary

This harness validates code and visuals before public promotion. It does not authorize merge, production deployment, payment activation, wallet creation, secret creation, Base Sepolia settlement or refund.
