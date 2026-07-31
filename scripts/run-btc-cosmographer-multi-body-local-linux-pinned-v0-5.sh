#!/usr/bin/env bash
set -euo pipefail

PINNED_SOURCE_SHA="7f6bc7fa981d851d5d7928f7809c173f3c226a09"
PINNED_BRANCH="repair/btc-cosmographer-multi-body-astro-local-rc-v0-1"
REPOSITORY_URL="https://github.com/AiBhrigu/bhrigu-portal.git"
HOST="${BTC_PINNED_V05_HOST:-127.0.0.1}"
PORT="${BTC_PINNED_V05_PORT:-4185}"
MODE="${1:-accept}"
ARTIFACT_DIR="${BTC_PINNED_V05_ARTIFACT_DIR:-artifacts/btc-pinned-v0.5}"
SERVER_PID=""
GATE_PID=""

fail() {
  echo "PINNED_V0_5_LAUNCHER=FAIL · $*" >&2
  exit 1
}

cleanup() {
  if [[ -n "$SERVER_PID" ]]; then kill "$SERVER_PID" 2>/dev/null || true; fi
  if [[ -n "$GATE_PID" ]]; then kill "$GATE_PID" 2>/dev/null || true; fi
}
trap cleanup EXIT INT TERM

resolve_repo() {
  if git rev-parse --show-toplevel >/dev/null 2>&1; then
    git rev-parse --show-toplevel
    return
  fi
  command -v git >/dev/null 2>&1 || fail "git is required"
  local workdir="${BTC_PINNED_V05_WORKDIR:-$HOME/.cache/bhrigu/btc-cosmographer-pinned-v0.5}"
  if [[ ! -d "$workdir/.git" ]]; then
    mkdir -p "$(dirname "$workdir")"
    git clone --branch "$PINNED_BRANCH" --single-branch "$REPOSITORY_URL" "$workdir"
  else
    git -C "$workdir" fetch origin "$PINNED_BRANCH"
    git -C "$workdir" checkout "$PINNED_BRANCH"
    git -C "$workdir" reset --hard "origin/$PINNED_BRANCH"
  fi
  printf '%s\n' "$workdir"
}

ROOT="$(resolve_repo)"
cd "$ROOT"

[[ "$(uname -s)" == "Linux" ]] || fail "Linux is required"
command -v node >/dev/null 2>&1 || fail "Node.js is required"
command -v npm >/dev/null 2>&1 || fail "npm is required"
command -v curl >/dev/null 2>&1 || fail "curl is required"

git cat-file -e "${PINNED_SOURCE_SHA}^{commit}" 2>/dev/null || fail "pinned source commit is unavailable"
git merge-base --is-ancestor "$PINNED_SOURCE_SHA" HEAD || fail "current checkout does not descend from pinned source SHA"

CANDIDATE_FILES=(
  "components/btc/BtcCosmographerMultiBodyAstroRc.tsx"
  "docs/research/BTC_COSMOGRAPHER_MULTI_BODY_ASTRO_CORRIDOR_LOCAL_LINUX_RELEASE_CANDIDATE_v0_1.md"
  "lib/btc-cosmographer-multi-body-astro-rc.ts"
  "pages/crypto-astro/btc/local-rc.tsx"
  "scripts/run-btc-cosmographer-multi-body-local-rc-fixture.mjs"
)
for file in "${CANDIDATE_FILES[@]}"; do
  git diff --quiet "$PINNED_SOURCE_SHA" -- "$file" || fail "pinned candidate drift: $file"
done

node - <<'NODE'
const [major, minor] = process.versions.node.split('.').map(Number);
if (major < 18 || (major === 18 && minor < 17)) {
  console.error(`Node ${process.versions.node} is unsupported; require >=18.17`);
  process.exit(1);
}
NODE

OVERLAY_HEAD_SHA="$(git rev-parse HEAD)"
mkdir -p "$ARTIFACT_DIR"
printf '%s\n' "$PINNED_SOURCE_SHA" > "$ARTIFACT_DIR/pinned-source-sha.txt"
printf '%s\n' "$OVERLAY_HEAD_SHA" > "$ARTIFACT_DIR/overlay-head-sha.txt"
printf '%s\n' "$(node --version)" > "$ARTIFACT_DIR/node-version.txt"

npm ci > "$ARTIFACT_DIR/npm-ci.log" 2>&1
BTC_COSMOGRAPHER_RUNTIME_HEAD_SHA="$PINNED_SOURCE_SHA" \
  node scripts/run-btc-cosmographer-multi-body-local-rc-fixture.mjs \
  > "$ARTIFACT_DIR/static-acceptance.log" 2>&1
BTC_LOCAL_RC=1 BTC_COSMOGRAPHER_RUNTIME_HEAD_SHA="$PINNED_SOURCE_SHA" \
  npm run build > "$ARTIFACT_DIR/next-build.log" 2>&1

BTC_LOCAL_RC=1 \
BTC_COSMOGRAPHER_RUNTIME_HEAD_SHA="$PINNED_SOURCE_SHA" \
BTC_BINANCE_FREE_OBSERVATION_ENABLED=false \
  npm run start -- -H "$HOST" -p "$PORT" > "$ARTIFACT_DIR/server.log" 2>&1 &
SERVER_PID=$!
printf '%s\n' "$SERVER_PID" > "$ARTIFACT_DIR/server.pid"

INITIAL_QUERY="%D0%9A%D0%B0%D0%BA%D0%B8%D0%B5%20%D0%B0%D1%81%D0%BF%D0%B5%D0%BA%D1%82%D1%8B%20%D0%BF%D0%BB%D0%B0%D0%BD%D0%B5%D1%82%20%D0%B2%D0%B0%D0%B6%D0%BD%D1%8B%20%D0%B2%202026%20%D0%B3%D0%BE%D0%B4%D1%83%3F"
INITIAL_URL="http://${HOST}:${PORT}/crypto-astro/btc/local-rc?lang=ru&q=${INITIAL_QUERY}"
for _ in $(seq 1 90); do
  if curl --fail --silent "$INITIAL_URL" >/dev/null; then break; fi
  sleep 1
done
curl --fail --silent "$INITIAL_URL" >/dev/null || { cat "$ARTIFACT_DIR/server.log"; fail "local route did not start"; }

if [[ "$MODE" == "serve" ]]; then
  echo "PINNED_V0_5_LOCAL_URL=$INITIAL_URL"
  if [[ "${BTC_PINNED_V05_OPEN_BROWSER:-1}" == "1" ]] && command -v xdg-open >/dev/null 2>&1; then
    xdg-open "$INITIAL_URL" >/dev/null 2>&1 || true
  fi
  echo "Press Ctrl-C to stop the pinned local server."
  wait "$SERVER_PID"
  exit 0
fi

BTC_COSMOGRAPHER_PINNED_V05_BASE="http://${HOST}:${PORT}" \
BTC_COSMOGRAPHER_PINNED_SOURCE_SHA="$PINNED_SOURCE_SHA" \
BTC_COSMOGRAPHER_OVERLAY_HEAD_SHA="$OVERLAY_HEAD_SHA" \
BTC_COSMOGRAPHER_PINNED_V05_ARTIFACT_DIR="$ARTIFACT_DIR" \
  node scripts/run-btc-cosmographer-multi-body-pinned-v0-5-semantic-acceptance.mjs \
  > "$ARTIFACT_DIR/semantic-acceptance.log" 2>&1

kill "$SERVER_PID" 2>/dev/null || true
wait "$SERVER_PID" 2>/dev/null || true
SERVER_PID=""

GATE_PORT="$((PORT + 1))"
unset BTC_LOCAL_RC
BTC_COSMOGRAPHER_RUNTIME_HEAD_SHA="$PINNED_SOURCE_SHA" \
  npm run start -- -H "$HOST" -p "$GATE_PORT" > "$ARTIFACT_DIR/closed-gate-server.log" 2>&1 &
GATE_PID=$!
printf '%s\n' "$GATE_PID" > "$ARTIFACT_DIR/closed-gate-server.pid"
for _ in $(seq 1 60); do
  code="$(curl --silent --output /dev/null --write-out '%{http_code}' "http://${HOST}:${GATE_PORT}/crypto-astro/btc/local-rc" || true)"
  if [[ "$code" == "404" ]]; then
    printf '%s\n' "PASS_LOCAL_ENV_GATE_404" > "$ARTIFACT_DIR/closed-gate-proof.txt"
    break
  fi
  sleep 1
done
[[ -f "$ARTIFACT_DIR/closed-gate-proof.txt" ]] || { cat "$ARTIFACT_DIR/closed-gate-server.log"; fail "local-only gate did not return 404"; }

kill "$GATE_PID" 2>/dev/null || true
wait "$GATE_PID" 2>/dev/null || true
GATE_PID=""

cp scripts/run-btc-cosmographer-multi-body-local-linux-pinned-v0-5.sh "$ARTIFACT_DIR/"
cp scripts/run-btc-cosmographer-multi-body-pinned-v0-5-semantic-acceptance.mjs "$ARTIFACT_DIR/"
if command -v zip >/dev/null 2>&1; then
  (cd "$ARTIFACT_DIR" && zip -q -r btc-cosmographer-pinned-v0.5-acceptance.zip . -x 'btc-cosmographer-pinned-v0.5-acceptance.zip')
fi

echo "PINNED_V0_5_LAUNCHER=PASS"
echo "PINNED_SOURCE_SHA=$PINNED_SOURCE_SHA"
echo "OVERLAY_HEAD_SHA=$OVERLAY_HEAD_SHA"
echo "ONE_TAB_REPORT=$ARTIFACT_DIR/one-tab-semantic-acceptance.html"
