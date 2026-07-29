#!/usr/bin/env bash
set -euo pipefail

NODE="BHRIGU_PORTAL_LOCAL_EXACT_HEAD_VISUAL_VALIDATION_HARNESS_IMPLEMENTATION_FULL_CYCLE_v0_1"
REPOSITORY_URL="https://github.com/AiBhrigu/bhrigu-portal.git"
HARNESS_BRANCH="${BHRIGU_VISUAL_BRANCH:-agent/bhrigu-portal-local-visual-harness-v0-1}"
SOURCE_SHA="${BHRIGU_VISUAL_SOURCE_SHA:-27737aed75059c01472ecec5e123aaed2ff10236}"
ROOT="${BHRIGU_LOCAL_VISUAL_ROOT:-$HOME/BHRIGU_LOCAL_VISUAL}"
REPOSITORY="$ROOT/repository"
WORKTREE="$ROOT/worktree"
EVIDENCE="$ROOT/evidence"
BROWSERS="$ROOT/playwright-browsers"

printf 'NODE=%s\n' "$NODE"
printf 'SOURCE_SHA=%s\n' "$SOURCE_SHA"
printf 'HARNESS_BRANCH=%s\n' "$HARNESS_BRANCH"
printf 'LOCAL_ROOT=%s\n' "$ROOT"

mkdir -p "$ROOT" "$EVIDENCE" "$BROWSERS"

if [[ ! -d "$REPOSITORY/.git" ]]; then
  git clone --no-checkout "$REPOSITORY_URL" "$REPOSITORY"
fi

git -C "$REPOSITORY" fetch --prune origin \
  "+refs/heads/$HARNESS_BRANCH:refs/remotes/origin/$HARNESS_BRANCH"

git -C "$REPOSITORY" worktree remove --force "$WORKTREE" 2>/dev/null || true
rm -rf "$WORKTREE"
git -C "$REPOSITORY" worktree prune
git -C "$REPOSITORY" worktree add --detach "$WORKTREE" "refs/remotes/origin/$HARNESS_BRANCH"

cd "$WORKTREE"
ACTUAL_HEAD="$(git rev-parse HEAD)"
git merge-base --is-ancestor "$SOURCE_SHA" "$ACTUAL_HEAD"
printf 'LOCAL_HARNESS_HEAD=%s\n' "$ACTUAL_HEAD"

npm ci --ignore-scripts
PLAYWRIGHT_BROWSERS_PATH="$BROWSERS" npx playwright install chromium

PLAYWRIGHT_BROWSERS_PATH="$BROWSERS" \
BHRIGU_VISUAL_SOURCE_SHA="$SOURCE_SHA" \
BHRIGU_VISUAL_HARNESS_SHA="$ACTUAL_HEAD" \
BHRIGU_VISUAL_ARTIFACT_ROOT="$EVIDENCE" \
npm run verify:local-visual

printf 'LOCAL_VISUAL_STATUS=PASS\n'
printf 'LOCAL_VISUAL_EVIDENCE_ROOT=%s\n' "$EVIDENCE"
printf 'PRODUCTION_WRITES=0\nVERCEL_WRITES=0\nX402_LIVE_TRANSFERS=0\n'
