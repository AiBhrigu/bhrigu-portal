#!/usr/bin/env bash
set -euo pipefail

base="${1:-https://www.bhrigu.io}"
echo "Run base=\"$base\""

paths=(
  /
  /start
  /reading
  /signal
  /map
  /services
  /cosmography
  /orion
  /frey
  /dao
  /access
  /chronicle
  /github
)

check_code() {
  local url="$1" expect="$2"
  local code
  code="$(curl -sS -o /dev/null -w '%{http_code}' "$url" || true)"
  echo "$code $url"
  [ "$code" = "$expect" ]
}

ok=1

for p in "${paths[@]}"; do
  echo "== $p =="
  check_code "${base}${p}" "200" || ok=0
done

echo "== /api =="
  code=$(curl -s -o /dev/null -w "%{http_code}" "$base/api")
  if [ "$code" != "410" ]; then
    echo "curl: expected /api HTTP 410, got $code"
    exit 22
  fi
check_code "${base}/api" "410" || ok=0

[ "$ok" -eq 1 ]
echo "OK"
