# Φ‑CANON · Frey / Cosmography Development Standard (v0.1)

This repo follows **Φ‑protocol**: artifact‑first, deterministic atoms, and provable production state.

## 0) Roles
- **Operator** = human (time/attention is highest non‑recoverable value).
- **Frey** = epistemic navigation layer (no authority, no “confidence by tone”).
- Work is done in **ATOMS**: 1 atom → 1 commit → 1 verified deploy → 1 crystal.

## 1) Truth model (what counts as “true”)
A statement is “true” only if it is backed by artifacts:
- `OPS_RUNLOG_*` (what was executed)
- `OPS_STATUS_CRYSTAL_*` + `.sha256` (final state snapshot)
- `PATCH_*.diff` (exact code delta)
- `PROD_PROBE_*` (headers + markers + cache‑busting proof)

No artifact → no truth.

## 2) Daily order (deterministic)
1. **RECON**: repo+branch+HEAD+clean + `git pull --ff-only`.
2. **Minimal patch** (single purpose).
3. **GATES** (in order):
   - **UI‑ONLY guard** (strict forbidden‑token string checks for UI pages).
   - **Build gate**: `next build` + lint/types.
4. **Commit+push** only if all gates PASS.
5. **Prod verify** on both domains (`bhrigu.io` and `www`) with cache‑buster:
   - record headers: `age`, `x-vercel-cache`, `x-matched-path`, `x-vercel-id`
   - check HTML markers (surface tokens)
6. **Crystal** (+sha) + hard‑copy to Windows Downloads.
7. **Uploadpack**: zip range/day to stay within upload limits.

## 3) UI‑ONLY guard (strict)
The UI‑only page must not contain literal forbidden tokens (even in comments).
Typical forbidden needles:
- `fetch`, `endpoint`, `endpoints`, `token`, `authorization`, `bearer`, `api key`
Rule: if UI‑only guard FAIL → STOP, sanitize strings, re-run gate.

## 4) Probes (Φ‑lupa toolkit)
- `phi_lupa_portal` — fast portal probe (non‑blocking; helps prevent “terminal crash loops”).
- `phi_lupa_frey` — fast `/frey` surface probe (markers + headers + cache).
These are the **epistemic instruments**: they tell us what prod really serves.

## 5) Surface markers (verification anchors)
`/frey` must include stable markers used by probes:
- `FREY_SURFACE_CANON_V0_3`
- `PHI_SURFACE_V0_3`
- `PHI surface v0.3`

## 6) Packaging / upload optimization
Preferred upload set (4 files):
- `UPLOADPACK_*.zip` + `.sha256`
- matching `OPS_STATUS_CRYSTAL_*.md` + `.sha256`
Runlogs/patches live inside the zip.

## 7) STOP / FAIL gates (hard)
- repo not clean before patch/commit
- ff-only sync fails
- UI‑only guard FAIL
- build gate FAIL
- prod verify FAIL
On STOP/FAIL: still emit crystal (+sha) and do **not** push.


