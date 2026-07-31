# BTC Cosmographer Multi-Body Astro Corridor · PR #101 Public Live Visual and Information Design Acceptance v0.1

## Node

`BTC_COSMOGRAPHER_MULTI_BODY_ASTRO_CORRIDOR_PR101_PUBLIC_LIVE_VISUAL_AND_INFORMATION_DESIGN_ACCEPTANCE_v0_1`

## Scope

- source PR: #101;
- base: PR #100 exact head `86815de0c90aa26e67213e02ec3eee02012782a6`;
- public route under acceptance: `/crypto-astro/btc/live`;
- viewports: desktop `1440×1100`, mobile `390×844`;
- states: RU annual, focused follow-up, Astro × BTC bridge, halving switch, restored Astro return, EN annual parity.

## Fail-closed acceptance

The verifier must prove:

- newest answer heading and direct answer begin inside the first viewport after navigation;
- no horizontal overflow;
- five annual windows appear as chronological cards;
- significance rank and time range are separate visual fields;
- complete station/ingress chronology is closed by default and remains complete;
- the independent market layer is visually and semantically first in the bridge;
- the halving answer has no stale Astro shell;
- return uses a compact three-window recap;
- public proof labels are human-facing rather than raw route enums;
- RU/EN and desktop/mobile information structures remain equivalent;
- continuation composer is no more than one viewport after the newest answer;
- severe application browser errors are zero.

## Proven first-pass findings

The first exact-head browser pass proved:

1. the newest annual heading and direct answer were already inside the desktop first viewport;
2. horizontal overflow was absent;
3. the complete 14-item station/ingress chronology was closed by default;
4. annual windows were only CSS-framed list items: rank, range, peak, title and basis competed inside one text block;
5. the default proof layer exposed the raw route enum `astromodule`;
6. the first continuation was submitted before the initial session turn had been durably written to `sessionStorage` by hydration, so the verifier required an explicit session-ready wait.

## Targeted repair

The bounded repair adds:

- structured `astroWindowCard` markup;
- separate `astroWindowRank`, `astroWindowRange`, peak, title and basis fields;
- chronological `data-window-start` binding;
- human-facing public domain labels;
- a sessionStorage turn-count gate before each continuation traversal;
- diagnostic state output if a transition does not settle.

## Current state

`TARGETED_REPAIR_APPLIED · EXACT_HEAD_REVERIFYING · NO MERGE · NO PRODUCTION`

Final PASS is recorded only after the full desktop/mobile RU/EN screenshot artifact and machine-readable report are inspected.
