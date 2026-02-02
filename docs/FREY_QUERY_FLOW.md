# FREY · QUERY FLOW SPEC (UI‑only) v0.1

Status: CANON DRAFT  
Scope: bhrigu-portal `/frey` + `/reading` (UI-only v0.1)

## 1) Purpose
We need a stable user flow for the “Query Bar” that:
- feels alive and usable today (no backend dependency),
- is **safe** (no public endpoints, no tokens, no fetch),
- is **observable** (probes + markers + artifacts),
- becomes the hard interface later when Frey runtime is ready.

## 2) Hard Constraints (UI‑only v0.1)
- **No `fetch()`** and no network calls from `/frey` (or other UI-only surfaces).
- No public API URLs, no env tokens, no embedded secrets.
- Surface must remain static-friendly and deterministic.

## 3) UX Surface (what user sees)
**/frey**
- Query Bar (input) is always readable:
  - typed text must be visible on dark background,
  - placeholder must be visible but dim.
- Live Preview block is readable and non-interactive:
  - shows sanitized echo of the query,
  - shows “templates” as UI hints (not executed logic).

**/reading**
- Receives the query via URL param, e.g. `?q=...`
- Displays “Incoming Query” card (read-only), with:
  - copy-to-clipboard button (optional later),
  - link back to `/frey` (“Refine query”),
  - link to `/access` (“Request consult”).

## 4) Data Flow (no backend)
Input → URL param → Render
- On submit (Enter):
  - navigate to `/reading?q=<encoded>`
- No storage required (no localStorage needed in v0.1).
- Optional: preserve `q` when returning back to `/frey` later.

## 5) Template Pack (UI hints only)
Templates are textual frames that help a user express intent.
They are not executed — only displayed.

Minimal set (v0.1):
- “Cosmography scan”
- “Consultation request”
- “Research / reading list”
- “Signal / pattern check”

## 6) Observability (Truth Layer)
We treat truth as: **gates + artifacts + prod probes**.

Mandatory:
- UI-only guard (strict forbidden strings)
- Build gate (`next build`)
- Prod verify on both domains with cache-busting:
  - headers: `age`, `x-vercel-cache`, `x-matched-path`, `x-vercel-id`
  - markers on `/frey`:
    - `FREY_SURFACE_CANON_V0_3`
    - `PHI_SURFACE_V0_3`

Probes:
- `scripts/phi_check.sh` (route status + `/api`=410)
- `scripts/phi_lupa_portal.sh` (surface token scan across routes)
- `scripts/phi_lupa_frey.sh` (frey-specific verify across both domains)

## 7) Next Implementation Atom (after this spec)
- Implement `/reading?q=` “Incoming Query” module (UI-only, no fetch).
- Extend `phi_lupa_frey` to confirm `/reading` preserves markers (optional).
