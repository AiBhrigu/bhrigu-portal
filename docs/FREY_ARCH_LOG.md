# FREY_ARCH_LOG

## Temporal Input Decision · v0_8 · 2026-02-25

### Decision
Temporal input remains native `type="date"`.
Version v0_8 marked stable.

### Rationale
- Frey is query-first.
- Temporal block is secondary.
- Native input stabilized visually.
- No architectural debt introduced.
- Energy preserved for core system growth.

### Future Trigger
Replace input when:
- Temporal becomes core analytical engine
- Date ranges required
- Time granularity added
- BC/AD logic appears
- Partial date states required

### Planned Upgrade Path
Controlled ISO input (YYYY-MM-DD).


2026-02-25 — Temporal Surface Isolation

Native date input is part of Layer 4 (Surface Layer) only.
It has zero coupling to Layer 1 (Core Engine).
No direct binding, no implicit dependency, no future shortcut allowed.
