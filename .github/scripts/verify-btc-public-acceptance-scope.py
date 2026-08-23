#!/usr/bin/env python3
import os
import subprocess

PUBLIC_ACCEPTANCE_SCOPE = {
    ".github/scripts/verify-btc-public-acceptance-scope.py",
    ".github/workflows/btc-field-read-pr-visual.yml",
    ".github/workflows/btc-free-question-live-dialogue-pr.yml",
    ".github/workflows/btc-mobile-clearance-pr.yml",
    ".github/workflows/btc-public-live-multi-body-projection-apply.yml",
    ".github/workflows/btc-public-live-multi-body-projection-pr.yml",
    ".github/workflows/btc-public-live-visual-information-acceptance-pr.yml",
    ".github/workflows/btc-temporal-boundary-pr.yml",
    "components/btc/BtcCosmographerDialogue.tsx",
    "components/btc/BtcHeroQuestionLaunch.tsx",
    "components/btc/BtcQuestionMembrane.tsx",
    "docs/research/BTC_COSMOGRAPHER_PUBLIC_USER_ACCEPTANCE_REPORT_01_v0_1.md",
    "lib/btc-cosmographer-answer.ts",
    "lib/btc-cosmographer-public-multi-body-projection.ts",
    "lib/btc-cosmographer-route-graph.ts",
    "lib/btc-live-dialogue-style.ts",
    "lib/btc-product-rebalance-style.ts",
    "lib/btc-public-astro-evidence.ts",
    "pages/crypto-astro/btc.tsx",
    "scripts/run-btc-cosmographer-semantic-route-fixture.mjs",
    "scripts/verify-btc-public-acceptance-two-screen.py",
    "scripts/verify-btc-public-live-visual-information-acceptance.py",
}

BTC_ENTRY_CLEAN_PREMIUM_SCOPE = {
    ".github/scripts/verify-btc-public-acceptance-scope.py",
    "components/btc/BtcHeroQuestionLaunch.tsx",
    "lib/btc-product-rebalance-style.ts",
    "pages/crypto-astro/btc.tsx",
}

BTC_COSMOGRAPHER_FOUNDER_BLOCKERS_REPAIR_SCOPE = {
    ".github/scripts/verify-btc-public-acceptance-scope.py",
    "components/btc/BtcCosmographerDialogue.tsx",
    "lib/btc-cosmographer-route-graph.ts",
    "lib/btc-live-dialogue-style.ts",
    "lib/btc-public-astro-evidence.ts",
    "scripts/run-btc-cosmographer-semantic-route-fixture.mjs",
    "scripts/verify-btc-public-live-visual-information-acceptance.py",
}

BTC_EVIDENCE_NAVIGATION_RUNTIME_SCOPE = {
    ".github/scripts/verify-btc-public-acceptance-scope.py",
    ".github/workflows/btc-evidence-navigation-runtime-pr.yml",
    "components/btc/BtcCosmographerDialogue.tsx",
    "lib/btc-cosmographer-answer.ts",
    "lib/btc-cosmographer-evidence-navigation-runtime.ts",
    "lib/btc-live-dialogue-session.ts",
    "lib/btc-live-dialogue-style.ts",
    "pages/crypto-astro/btc/live.tsx",
    "scripts/run-btc-evidence-navigation-runtime-fixture.mjs",
}

BTC_CLARIFICATION_RESOLUTION_SCOPE = {
    ".github/scripts/verify-btc-public-acceptance-scope.py",
    ".github/workflows/btc-clarification-resolution-pr.yml",
    ".github/workflows/btc-free-question-live-dialogue-pr.yml",
    ".github/workflows/btc-public-live-visual-information-acceptance-pr.yml",
    "components/btc/BtcCosmographerDialogue.tsx",
    "lib/btc-cosmographer-evidence-navigation-runtime.ts",
    "lib/btc-cosmographer-route-graph.ts",
    "pages/crypto-astro/btc/live.tsx",
    "scripts/run-btc-evidence-navigation-runtime-fixture.mjs",
    "scripts/verify-btc-cosmographer-route-surface.py",
}

BTC_PUBLIC_CORRIDOR_PROVEN_DEFECT_REPAIR_SCOPE = {
    ".github/scripts/verify-btc-public-acceptance-scope.py",
    ".github/workflows/btc-evidence-navigation-runtime-pr.yml",
    "components/btc/BtcCosmographerDialogue.tsx",
    "lib/btc-cosmographer-answer.ts",
    "lib/btc-cosmographer-evidence-navigation-runtime.ts",
    "lib/btc-cosmographer-route-graph.ts",
    "lib/btc-live-dialogue-session.ts",
    "lib/btc-public-output-contract.ts",
    "lib/btc-public-snapshot-composer.ts",
    "pages/crypto-astro/btc/live.tsx",
    "tests/btc-public-corridor-proven-defect-repair-acceptance.ts",
}

# Canonical routing repair stays fail-closed to this exact eleven-file product/acceptance surface.
BTC_CANONICAL_ROUTING_REPAIR_SCOPE = {
    ".github/scripts/verify-btc-public-acceptance-scope.py",
    ".github/workflows/btc-clarification-resolution-pr.yml",
    ".github/workflows/btc-evidence-navigation-runtime-pr.yml",
    "lib/btc-cosmographer-answer.ts",
    "lib/btc-cosmographer-evidence-navigation-runtime.ts",
    "lib/btc-cosmographer-route-graph.ts",
    "scripts/run-btc-cosmographer-semantic-route-fixture.mjs",
    "scripts/run-btc-evidence-navigation-runtime-fixture.mjs",
    "scripts/verify-btc-public-live-visual-information-acceptance.py",
    "tests/btc-cosmographer-canonical-routing-repair-acceptance.ts",
    "tests/btc-public-corridor-proven-defect-repair-acceptance.ts",
}

# Canonical answer specialization repair: product composers + exact acceptance/CI authority only.
BTC_CANONICAL_ANSWER_SPECIALIZATION_SCOPE = {
    ".github/scripts/verify-btc-public-acceptance-scope.py",
    ".github/workflows/btc-evidence-navigation-runtime-pr.yml",
    "lib/btc-cosmographer-answer.ts",
    "lib/btc-cosmographer-specialized-answer.ts",
    "lib/btc-cosmographer-public-multi-body-projection.ts",
    "lib/btc-protocol-evidence.ts",
    "lib/btc-public-astro-evidence.ts",
    "tests/btc-cosmographer-canonical-answer-specialization-acceptance.ts",
}

# Post-merge answer-specialization setup compatibility: exact two-regression repair surface.
BTC_CANONICAL_SETUP_COMPATIBILITY_REPAIR_SCOPE = {
    ".github/scripts/verify-btc-public-acceptance-scope.py",
    "lib/btc-cosmographer-answer.ts",
    "lib/btc-public-astro-evidence.ts",
    "pages/crypto-astro/btc/live.tsx",
    "tests/btc-cosmographer-canonical-answer-specialization-acceptance.ts",
}

# Canonical AI-042 regression repair: exact planetary-stations projection bind + acceptance/CI authority.
BTC_CANONICAL_AI042_PLANETARY_STATIONS_PROJECTION_REPAIR_SCOPE = {
    ".github/scripts/verify-btc-public-acceptance-scope.py",
    ".github/workflows/btc-cosmographer-multi-body-local-rc-pr.yml",
    "lib/btc-cosmographer-public-multi-body-projection.ts",
    "tests/btc-cosmographer-canonical-time-context-state-acceptance.ts",
}

# Canonical time/context repair: exact bounded product/CI surface; existing acceptance scopes remain unchanged.
BTC_CANONICAL_TIME_CONTEXT_STATE_REPAIR_SCOPE = {
    ".github/scripts/verify-btc-public-acceptance-scope.py",
    ".github/workflows/btc-cosmographer-multi-body-local-rc-pr.yml",
    ".github/workflows/btc-free-question-live-dialogue-pr.yml",
    "lib/btc-cosmographer-evidence-navigation-runtime.ts",
    "lib/btc-cosmographer-multi-body-astro-rc.ts",
    "lib/btc-cosmographer-route-graph.ts",
    "lib/btc-cosmographer-specialized-answer.ts",
    "tests/btc-cosmographer-canonical-time-context-state-acceptance.ts",
}

BTC_POSITIONING_VALUE_ENTRY_SCOPE = {
    ".github/scripts/verify-btc-public-acceptance-scope.py",
    ".github/workflows/bhrigu-home-market-cosmographer-pr.yml",
    ".github/workflows/btc-clarification-resolution-pr.yml",
    ".github/workflows/btc-free-question-live-dialogue-pr.yml",
    ".github/workflows/btc-origins-history-pr.yml",
    ".github/workflows/btc-public-live-visual-information-acceptance-pr.yml",
    "components/BhriguPhiHeader.jsx",
    "components/btc/BtcCosmographerDialogue.tsx",
    "components/btc/BtcHeroQuestionLaunch.tsx",
    "components/btc/BtcQuestionMembrane.tsx",
    "pages/crypto-astro/btc.tsx",
    "pages/index.js",
    "scripts/run-btc-cosmographer-semantic-route-fixture.mjs",
    "scripts/run-btc-evidence-navigation-runtime-fixture.mjs",
    "scripts/verify-btc-positioning-value-entry.mjs",
    "scripts/verify-btc-public-acceptance-two-screen.py",
    "scripts/verify-btc-public-live-visual-information-acceptance.py",
    "scripts/verify-btc-natural-followup-conversations.py",
    "scripts/verify-btc-origins-history.mjs",
}

BTC_FIELD_READ_CURRENT_CAPABILITY_COPY_SCOPE = {
    ".github/scripts/verify-btc-public-acceptance-scope.py",
    ".github/workflows/btc-field-read-pr-visual.yml",
    "components/btc/BtcHeroQuestionLaunch.tsx",
    "components/btc/BtcQuestionMembrane.tsx",
    "pages/crypto-astro/btc.tsx",
    "scripts/verify-btc-positioning-value-entry.mjs",
}

BTC_PRIMARY_QUESTION_NATIVE_PRICE_SCOPE = {
    ".github/scripts/verify-btc-public-acceptance-scope.py",
    "lib/btc-executive-question-language.ts",
    "lib/btc-live-dialogue-style.ts",
}

BTC_PRIMARY_ENTRY_CHANGE_MEMORY_ALIGNMENT_SCOPE = {
    ".github/scripts/verify-btc-public-acceptance-scope.py",
    "lib/btc-binance-public-binding.ts",
    "lib/btc-cosmographer-answer.ts",
    "lib/btc-executive-question-language.ts",
    "tests/btc-binance-public-binding-acceptance.ts",
    "tests/btc-market-envelope-fixture.ts",
}

# PR180 CI closure: exact active-context anaphoric follow-up product + compatibility + acceptance authority surface.
BTC_ACTIVE_CONTEXT_ANAPHORIC_FOLLOWUP_PR180_SCOPE = {
    ".github/scripts/verify-btc-public-acceptance-scope.py",
    "lib/btc-cosmographer-answer.ts",
    "lib/btc-cosmographer-route-graph.ts",
    "lib/btc-cosmographer-specialized-answer.ts",
    "pages/crypto-astro/btc/live.tsx",
    "scripts/run-btc-natural-followup-discovery-static-fixture.mjs",
    "tests/btc-active-context-anaphoric-followup-routing-acceptance.ts",
}

# Human-dialogue repair: explicit BTC volatility over an anaphoric active Astro window.
BTC_NATURAL_ASTRO_TO_BTC_ANAPHORIC_WINDOW_BRIDGE_SCOPE = {
    ".github/scripts/verify-btc-public-acceptance-scope.py",
    ".github/workflows/btc-natural-followup-discovery-pr.yml",
    "lib/btc-cosmographer-route-graph.ts",
    "tests/btc-natural-astro-to-btc-anaphoric-window-bridge-acceptance.ts",
}

# P0 answer fidelity: fail closed when accepted BTC evidence cannot compare referenced Astro windows.
BTC_ASTRO_BTC_WINDOW_PREDICATE_FIDELITY_SCOPE = {
    ".github/scripts/verify-btc-public-acceptance-scope.py",
    ".github/workflows/btc-natural-followup-discovery-pr.yml",
    "lib/btc-cosmographer-public-multi-body-projection.ts",
    "lib/btc-cosmographer-specialized-answer.ts",
    "tests/btc-astro-btc-window-predicate-fidelity-acceptance.ts",
}

BTC_QUICK_ENTRY_PROMOTED_ROUTE_REPAIR_SCOPE = {
    ".github/scripts/verify-btc-public-acceptance-scope.py",
    ".github/workflows/btc-free-corridor-conversational-surface-pr.yml",
    "components/btc/BtcFreeCorridorSurfaceAdapter.js",
}

BTC_STATIC_ENTRY_SATOSHI_FOOTER_CI_REPAIR_SCOPE = {
    ".github/scripts/verify-btc-public-acceptance-scope.py",
    ".github/workflows/btc-field-read-pr-visual.yml",
    ".github/workflows/btc-temporal-boundary-pr.yml",
    "components/btc/BtcCosmographerDialogue.tsx",
    "lib/btc-live-dialogue-style.ts",
    "lib/btc-product-rebalance-style.ts",
    "pages/crypto-astro/btc.tsx",
}

BTC_RETURNED_READING_MOBILE_PHI_REFLOW_SCOPE = {
    ".github/scripts/verify-btc-public-acceptance-scope.py",
    "components/btc/BtcExecutivePhi.tsx",
    "lib/btc-product-rebalance-style.ts",
    "pages/crypto-astro/btc.tsx",
}

BTC_STATIC_PREPARED_QUESTIONS_TOP_SPACING_SCOPE = {
    ".github/scripts/verify-btc-public-acceptance-scope.py",
    "lib/btc-product-rebalance-style.ts",
}

BTC_SUPPORT_CONVERSION_ATOM1_SCOPE = {
    ".github/scripts/verify-btc-public-acceptance-scope.py",
    "components/btc/BtcDonationSessionPreview.jsx",
    "pages/support.js",
    "tests/btc-donation-session-acceptance.ts",
}

BTC_SUPPORT_PHI_STRUCTURED_CYBERPUNK_SCOPE = set(BTC_SUPPORT_CONVERSION_ATOM1_SCOPE)

BTC_SUPPORT_PHI_CI_AUTHORITY_REPAIR_SCOPE = {
    *BTC_SUPPORT_PHI_STRUCTURED_CYBERPUNK_SCOPE,
    ".github/workflows/btc-clean-chat-v1-pr.yml",
}

BTC_SUPPORT_CAPACITY_ADMISSION_REPAIR_SCOPE = {
    ".github/scripts/verify-btc-public-acceptance-scope.py",
    ".github/workflows/btc-binance-public-market-shadow-pr.yml",
    ".github/workflows/btc-cosmographer-canonical-140-replay-pr.yml",
    "components/btc/BtcDonationSessionPreview.jsx",
    "lib/btc-donation-session-admission.ts",
    "lib/btc-donation-session-neon.ts",
    "migrations/20260819_btc_donation_session_admission_v1.sql",
    "package.json",
    "pages/api/donation/session/index.ts",
    "pages/support.js",
    "scripts/btc-direct-payment-fresh-db-migration.ts",
    "scripts/btc-donation-receiver-agent.py",
    "tests/btc-donation-admission-acceptance.ts",
    "tests/btc-donation-session-acceptance.ts",
    "tests/btc-donation-supervisor-acceptance.ts",
}

# Binance current-live public corridor repair: exact presentation + adapter + acceptance/CI authority surface.
BTC_BINANCE_PUBLIC_CORRIDOR_CURRENT_PRICE_SCOPE = {
    ".github/scripts/verify-btc-public-acceptance-scope.py",
    ".github/workflows/btc-binance-public-corridor-current-price-pr.yml",
    "components/btc/BtcBinanceCurrentVenue.tsx",
    "lib/btc-binance-public-corridor-live.ts",
    "pages/crypto-astro/btc.tsx",
    "tests/btc-binance-public-corridor-current-price-acceptance.ts",
}

BTC_SUPPORT_PUBLIC_DISCOVERABILITY_D1_SCOPE = {
    ".github/scripts/verify-btc-public-acceptance-scope.py",
    "components/btc/PublicSupportRoute.tsx",
    "pages/crypto-astro/btc.tsx",
    "pages/index.js",
}

# PR185 Clean Chat V1 release repair: exact cumulative product + CI authority surface.
BTC_CLEAN_CHAT_V1_RELEASE_REPAIR_SCOPE = {
    ".github/scripts/verify-btc-public-acceptance-scope.py",
    ".github/workflows/btc-clean-chat-v1-pr.yml",
    "lib/btc-astro-field-client.ts",
    "lib/btc-clean-chat-model-runtime.ts",
    "lib/btc-clean-chat-v1.ts",
    "lib/btc-polymarket-expectation.ts",
    "lib/btc-protocol-evidence.ts",
    "pages/api/btc/clean-chat-v1.ts",
    "pages/crypto-astro/btc/clean-chat.tsx",
    "tests/btc-clean-chat-v1-acceptance.ts",
    "ui/btc/BtcCleanChatV1.tsx",
}

# Post-release public navigation canonicalization: active BTC entries move to Clean Chat while legacy /live remains backward-compatible.
BTC_PUBLIC_LINK_CANONICALIZATION_SCOPE = {
    ".github/scripts/verify-btc-public-acceptance-scope.py",
    ".github/workflows/bhrigu-home-market-cosmographer-pr.yml",
    ".github/workflows/btc-clean-chat-v1-pr.yml",
    "components/btc/BtcBinanceCurrentVenue.tsx",
    "components/btc/BtcHeroQuestionLaunch.tsx",
    "components/btc/BtcQuestionMembrane.tsx",
    "pages/crypto-astro/btc.tsx",
    "pages/crypto-astro/btc/clean-chat.tsx",
    "pages/index.js",
    "scripts/verify-btc-public-acceptance-two-screen.py",
    "tests/btc-clean-chat-link-canonicalization-acceptance.ts",
}

# Post-release Clean Chat pending-state resilience: presentation + bounded browser lifecycle only.
BTC_CLEAN_CHAT_PENDING_STATE_SCOPE = {
    ".github/scripts/verify-btc-public-acceptance-scope.py",
    ".github/workflows/btc-clean-chat-v1-pr.yml",
    "tests/btc-clean-chat-pending-state-acceptance.ts",
    "ui/btc/BtcCleanChatV1.tsx",
}

# Post-release traffic retention: quiet Bitcoin support entry + answer-copy provenance backlink.
BTC_CLEAN_CHAT_TRAFFIC_RETENTION_SCOPE = {
    ".github/scripts/verify-btc-public-acceptance-scope.py",
    ".github/workflows/btc-clean-chat-v1-pr.yml",
    "ui/btc/BtcCleanChatV1.tsx",
}

BTC_SUPPORT_PUBLIC_DISCOVERABILITY_D2_SCOPE = {
    ".github/scripts/verify-btc-public-acceptance-scope.py",
    "components/btc/PublicSupportRoute.tsx",
    "pages/frey.js",
    "pages/guide/frey.js",
}

# PR194 bounded public reveal: Home + BTC Overview presentation only; no runtime/source/selector mutation.
BTC_POLYMARKET_PUBLIC_REVEAL_SCOPE = {
    ".github/scripts/verify-btc-public-acceptance-scope.py",
    "lib/btc-product-rebalance-style.ts",
    "pages/crypto-astro/btc.tsx",
    "pages/index.js",
    "pages/index.module.css",
}

BTC_OBSERVABILITY_V1_SCOPE = {
    ".github/scripts/verify-btc-public-acceptance-scope.py",
    ".github/workflows/btc-clean-chat-v1-pr.yml",
    "components/btc/BtcDonationSessionPreview.jsx",
    "lib/btc-observability-client.ts",
    "lib/btc-observability-contract.ts",
    "lib/btc-observability-neon.ts",
    "lib/btc-observability-server.ts",
    "migrations/20260822_btc_observability_v1.sql",
    "pages/api/btc/clean-chat-v1.ts",
    "pages/api/btc/observability/v1/event.ts",
    "pages/api/btc/observability/v1/summary.ts",
    "pages/api/donation/session/index.ts",
    "pages/support.js",
    "scripts/btc-direct-payment-fresh-db-migration.ts",
    "tests/btc-observability-v1-acceptance.ts",
    "ui/btc/BtcCleanChatV1.tsx",
}

if os.environ.get("GITHUB_EVENT_NAME") != "pull_request":
    print("workflow_dispatch: exact PR diff gate deferred")
    raise SystemExit(0)

event_base = os.environ["BTC_ACCEPTANCE_BASE_SHA"]
head = os.environ["BTC_ACCEPTANCE_HEAD_SHA"]
base_ref = os.environ.get("GITHUB_BASE_REF", "master")
current_base = subprocess.check_output(
    ["git", "rev-parse", f"origin/{base_ref}"], text=True
).strip()

base = event_base
if current_base != event_base:
    is_forward_base = subprocess.run(
        ["git", "merge-base", "--is-ancestor", event_base, current_base],
        check=False,
    ).returncode == 0
    if not is_forward_base:
        raise SystemExit(
            "pull request base moved non-forward: "
            f"event_base={event_base}, current_base={current_base}"
        )
    base = current_base
    print({
        "status": "USE_CURRENT_FORWARD_BASE",
        "event_base": event_base,
        "current_base": current_base,
    })

actual = set(subprocess.check_output(
    ["git", "diff", "--name-only", base, head], text=True
).splitlines())

accepted_scopes = {
    "PASS_PUBLIC_ACCEPTANCE_EXACT_22_FILE_SCOPE": PUBLIC_ACCEPTANCE_SCOPE,
    "PASS_BTC_ENTRY_CLEAN_PREMIUM_EXACT_4_FILE_SCOPE": BTC_ENTRY_CLEAN_PREMIUM_SCOPE,
    "PASS_BTC_COSMOGRAPHER_FOUNDER_BLOCKERS_EXACT_7_FILE_SCOPE": BTC_COSMOGRAPHER_FOUNDER_BLOCKERS_REPAIR_SCOPE,
    "PASS_BTC_EVIDENCE_NAVIGATION_RUNTIME_EXACT_9_FILE_SCOPE": BTC_EVIDENCE_NAVIGATION_RUNTIME_SCOPE,
    "PASS_BTC_CLARIFICATION_RESOLUTION_EXACT_9_FILE_SCOPE": BTC_CLARIFICATION_RESOLUTION_SCOPE,
    "PASS_BTC_PUBLIC_CORRIDOR_PROVEN_DEFECT_REPAIR_EXACT_11_FILE_SCOPE": BTC_PUBLIC_CORRIDOR_PROVEN_DEFECT_REPAIR_SCOPE,
    "PASS_BTC_CANONICAL_ROUTING_REPAIR_EXACT_11_FILE_SCOPE": BTC_CANONICAL_ROUTING_REPAIR_SCOPE,
    "PASS_BTC_CANONICAL_ANSWER_SPECIALIZATION_EXACT_8_FILE_SCOPE": BTC_CANONICAL_ANSWER_SPECIALIZATION_SCOPE,
    "PASS_BTC_CANONICAL_SETUP_COMPATIBILITY_REPAIR_EXACT_5_FILE_SCOPE": BTC_CANONICAL_SETUP_COMPATIBILITY_REPAIR_SCOPE,
    "PASS_BTC_CANONICAL_AI042_PLANETARY_STATIONS_PROJECTION_REPAIR_EXACT_4_FILE_SCOPE": BTC_CANONICAL_AI042_PLANETARY_STATIONS_PROJECTION_REPAIR_SCOPE,
    "PASS_BTC_CANONICAL_TIME_CONTEXT_STATE_REPAIR_EXACT_8_FILE_SCOPE": BTC_CANONICAL_TIME_CONTEXT_STATE_REPAIR_SCOPE,
    "PASS_BTC_POSITIONING_VALUE_ENTRY_EXACT_19_FILE_SCOPE": BTC_POSITIONING_VALUE_ENTRY_SCOPE,
    "PASS_BTC_FIELD_READ_CURRENT_CAPABILITY_COPY_EXACT_6_FILE_SCOPE": BTC_FIELD_READ_CURRENT_CAPABILITY_COPY_SCOPE,
    "PASS_BTC_PRIMARY_QUESTION_NATIVE_PRICE_EXACT_3_FILE_SCOPE": BTC_PRIMARY_QUESTION_NATIVE_PRICE_SCOPE,
    "PASS_BTC_PRIMARY_ENTRY_CHANGE_MEMORY_ALIGNMENT_EXACT_6_FILE_SCOPE": BTC_PRIMARY_ENTRY_CHANGE_MEMORY_ALIGNMENT_SCOPE,
    "PASS_BTC_ACTIVE_CONTEXT_ANAPHORIC_FOLLOWUP_PR180_EXACT_7_FILE_SCOPE": BTC_ACTIVE_CONTEXT_ANAPHORIC_FOLLOWUP_PR180_SCOPE,
    "PASS_BTC_NATURAL_ASTRO_TO_BTC_ANAPHORIC_WINDOW_BRIDGE_EXACT_4_FILE_SCOPE": BTC_NATURAL_ASTRO_TO_BTC_ANAPHORIC_WINDOW_BRIDGE_SCOPE,
    "PASS_BTC_ASTRO_BTC_WINDOW_PREDICATE_FIDELITY_EXACT_5_FILE_SCOPE": BTC_ASTRO_BTC_WINDOW_PREDICATE_FIDELITY_SCOPE,
    "PASS_BTC_QUICK_ENTRY_PROMOTED_ROUTE_REPAIR_EXACT_3_FILE_SCOPE": BTC_QUICK_ENTRY_PROMOTED_ROUTE_REPAIR_SCOPE,
    "PASS_BTC_STATIC_ENTRY_SATOSHI_FOOTER_CI_REPAIR_EXACT_7_FILE_SCOPE": BTC_STATIC_ENTRY_SATOSHI_FOOTER_CI_REPAIR_SCOPE,
    "PASS_BTC_RETURNED_READING_MOBILE_PHI_REFLOW_EXACT_4_FILE_SCOPE": BTC_RETURNED_READING_MOBILE_PHI_REFLOW_SCOPE,
    "PASS_BTC_STATIC_PREPARED_QUESTIONS_TOP_SPACING_EXACT_2_FILE_SCOPE": BTC_STATIC_PREPARED_QUESTIONS_TOP_SPACING_SCOPE,
    "PASS_BTC_SUPPORT_CONVERSION_ATOM1_EXACT_4_FILE_SCOPE": BTC_SUPPORT_CONVERSION_ATOM1_SCOPE,
    "PASS_BTC_SUPPORT_CAPACITY_ADMISSION_REPAIR_EXACT_15_FILE_SCOPE": BTC_SUPPORT_CAPACITY_ADMISSION_REPAIR_SCOPE,
    "PASS_BTC_BINANCE_PUBLIC_CORRIDOR_CURRENT_PRICE_EXACT_6_FILE_SCOPE": BTC_BINANCE_PUBLIC_CORRIDOR_CURRENT_PRICE_SCOPE,
    "PASS_BTC_SUPPORT_PUBLIC_DISCOVERABILITY_D1_EXACT_4_FILE_SCOPE": BTC_SUPPORT_PUBLIC_DISCOVERABILITY_D1_SCOPE,
    "PASS_BTC_SUPPORT_PUBLIC_DISCOVERABILITY_D2_EXACT_4_FILE_SCOPE": BTC_SUPPORT_PUBLIC_DISCOVERABILITY_D2_SCOPE,
    "PASS_BTC_CLEAN_CHAT_V1_RELEASE_REPAIR_EXACT_11_FILE_SCOPE": BTC_CLEAN_CHAT_V1_RELEASE_REPAIR_SCOPE,
    "PASS_BTC_PUBLIC_LINK_CANONICALIZATION_EXACT_11_FILE_SCOPE": BTC_PUBLIC_LINK_CANONICALIZATION_SCOPE,
    "PASS_BTC_CLEAN_CHAT_PENDING_STATE_EXACT_4_FILE_SCOPE": BTC_CLEAN_CHAT_PENDING_STATE_SCOPE,
    "PASS_BTC_CLEAN_CHAT_TRAFFIC_RETENTION_EXACT_3_FILE_SCOPE": BTC_CLEAN_CHAT_TRAFFIC_RETENTION_SCOPE,
    "PASS_BTC_SUPPORT_PHI_CI_AUTHORITY_REPAIR_EXACT_5_FILE_SCOPE": BTC_SUPPORT_PHI_CI_AUTHORITY_REPAIR_SCOPE,
    "PASS_BTC_OBSERVABILITY_V1_EXACT_16_FILE_SCOPE": BTC_OBSERVABILITY_V1_SCOPE,
    "PASS_BTC_POLYMARKET_PUBLIC_REVEAL_EXACT_5_FILE_SCOPE": BTC_POLYMARKET_PUBLIC_REVEAL_SCOPE,
}

for status, expected in accepted_scopes.items():
    if actual == expected:
        if (
            status == "PASS_BTC_SUPPORT_CONVERSION_ATOM1_EXACT_4_FILE_SCOPE"
            and os.environ.get("GITHUB_HEAD_REF") in {
                "feature/btc-support-conversion-atom2-v1",
                "feature/btc-support-conversion-atom3-v1",
                "feature/btc-support-conversion-atom4-v1",
                "feature/btc-support-phi-structured-cyberpunk-v0-1",
            }
        ):
            branch = os.environ.get("GITHUB_HEAD_REF")
            status = {
                "feature/btc-support-conversion-atom2-v1": "PASS_BTC_SUPPORT_CONVERSION_ATOM2_EXACT_4_FILE_SCOPE",
                "feature/btc-support-conversion-atom3-v1": "PASS_BTC_SUPPORT_CONVERSION_ATOM3_EXACT_4_FILE_SCOPE",
                "feature/btc-support-conversion-atom4-v1": "PASS_BTC_SUPPORT_CONVERSION_ATOM4_EXACT_4_FILE_SCOPE",
                "feature/btc-support-phi-structured-cyberpunk-v0-1": "PASS_BTC_SUPPORT_PHI_STRUCTURED_CYBERPUNK_EXACT_4_FILE_SCOPE",
            }[branch]
        print({"status": status, "base": base, "head": head, "changed": sorted(actual)})
        raise SystemExit(0)

raise SystemExit(
    "public acceptance scope mismatch: "
    f"base={base}, head={head}, actual={sorted(actual)}, "
    f"actual_count={len(actual)}, "
    f"accepted_counts={sorted(len(scope) for scope in accepted_scopes.values())}"
)
