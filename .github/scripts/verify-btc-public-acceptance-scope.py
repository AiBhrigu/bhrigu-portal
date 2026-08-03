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

BTC_PR114_LEGACY_SESSION_VERIFIER_SCOPE = {
    ".github/scripts/verify-btc-public-acceptance-scope.py",
    ".github/workflows/btc-pr114-legacy-session-verifier-acceptance.yml",
    "scripts/verify-btc-cosmographer-route-surface.py",
}

if os.environ.get("GITHUB_EVENT_NAME") != "pull_request":
    print("workflow_dispatch: exact PR diff gate deferred")
    raise SystemExit(0)

base = os.environ["BTC_ACCEPTANCE_BASE_SHA"]
head = os.environ["BTC_ACCEPTANCE_HEAD_SHA"]
actual = set(subprocess.check_output(
    ["git", "diff", "--name-only", base, head], text=True
).splitlines())

accepted_scopes = {
    "PASS_PUBLIC_ACCEPTANCE_EXACT_22_FILE_SCOPE": PUBLIC_ACCEPTANCE_SCOPE,
    "PASS_BTC_ENTRY_CLEAN_PREMIUM_EXACT_4_FILE_SCOPE": BTC_ENTRY_CLEAN_PREMIUM_SCOPE,
    "PASS_BTC_COSMOGRAPHER_FOUNDER_BLOCKERS_EXACT_7_FILE_SCOPE": BTC_COSMOGRAPHER_FOUNDER_BLOCKERS_REPAIR_SCOPE,
    "PASS_BTC_PR114_LEGACY_SESSION_VERIFIER_EXACT_3_FILE_SCOPE": BTC_PR114_LEGACY_SESSION_VERIFIER_SCOPE,
}

for status, expected in accepted_scopes.items():
    if actual == expected:
        print({"status": status, "changed": sorted(actual)})
        raise SystemExit(0)

raise SystemExit(
    "public acceptance scope mismatch: "
    f"actual={sorted(actual)}, actual_count={len(actual)}, "
    f"accepted_counts={sorted(len(scope) for scope in accepted_scopes.values())}"
)
