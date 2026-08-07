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
    "PASS_BTC_POSITIONING_VALUE_ENTRY_EXACT_19_FILE_SCOPE": BTC_POSITIONING_VALUE_ENTRY_SCOPE,
    "PASS_BTC_FIELD_READ_CURRENT_CAPABILITY_COPY_EXACT_6_FILE_SCOPE": BTC_FIELD_READ_CURRENT_CAPABILITY_COPY_SCOPE,
}

for status, expected in accepted_scopes.items():
    if actual == expected:
        print({"status": status, "base": base, "head": head, "changed": sorted(actual)})
        raise SystemExit(0)

raise SystemExit(
    "public acceptance scope mismatch: "
    f"base={base}, head={head}, actual={sorted(actual)}, "
    f"actual_count={len(actual)}, "
    f"accepted_counts={sorted(len(scope) for scope in accepted_scopes.values())}"
)
