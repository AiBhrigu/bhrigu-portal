MODE: OPS/F

NODE=BTC_FIELD_READ_SCHEMA_AND_QUESTION_UX_REPAIR_v0_1
STATUS=IMPLEMENTATION_CONTOUR_OPEN
ISSUE=28
REPORT_BACK_TO=AiBhrigu/phi-cosmography-open#126

SOURCE_ANCHORS:
- lib/btc-public-static-source.ts
- lib/btc-public-snapshot-composer.ts
- pages/crypto-astro/btc.tsx
- tests/btc-routing-fixture.ts
- public packet: crypto_astro_market_field_public_v0_2
- public temporal key: vectors.CT_context

IMPLEMENTATION:
1. Accept and fail-close the current v0_2 market-field packet.
2. Convert sealed CT_context to bounded static temporal state internally.
3. Preserve proof and timestamp compatibility checks.
4. Preserve safe contextual reframing for out-of-bound requests.
5. Add five visible natural-language question examples.
6. Keep the form visible after input and source failures.
7. Distinguish local input failure from source-contract failure.
8. Add deterministic source-contract and question-routing coverage.

PASS_GATE:
- npm run verify:btc-routing
- npm run build
- five ordinary question fixtures complete
- contextual-reframe fixtures complete with safe_reframed=true
- v0_2 / CT_context fixture PASS
- desktop/mobile review PASS
- deployed route generates a complete BTC read

BOUNDARY:
NO_NEW_BACKEND
NO_LIVE_ADAPTER
NO_PAYMENT
NO_PREDICTIVE_OUTPUT
NO_DIRECT_ACTION_OUTPUT
NO_FORMULA_EXPOSURE
NO_ORION_CORE_EXPOSURE
NO_A_E_ACTIVATION
NO_C_T_RUNTIME_EXPANSION
NO_BROAD_REDESIGN

TEMP_PACKET_REMOVE_BEFORE_MERGE=YES
NEXT_SAFE_NODE=BTC_FIELD_READ_SCHEMA_AND_QUESTION_UX_CODE_IMPLEMENTATION_v0_1
