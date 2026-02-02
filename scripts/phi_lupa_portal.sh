#!/usr/bin/env bash
# Φ-Lupa hardening v0.2
set +e
command -v curl >/dev/null 2>&1 || {
  echo "WARN: curl not found; network checks will be skipped" >&2
  export PHI_LUPA_SKIP_NET=1
}
export PHI_LUPA_RUNLOG="${PHI_LUPA_RUNLOG:-$HOME/orion_ai/artifacts/PHI_LUPA_PORTAL_RUN_$(date +%Y%m%d_%H%M%S).log}"
: > "$PHI_LUPA_RUNLOG" 2>/dev/null || true
exec > >(tee -a "$PHI_LUPA_RUNLOG") 2>&1
set -e

set -euo pipefail

# __PHI_LUPA_PORTAL_HARDEN_V0_3__
echo "PHI_LUPA_PORTAL: START $(date -Is)" 
set +e  # diagnostics must not hard-fail callers
PHI_LUPA_FAIL=0

BASE="https://www.bhrigu.io"
A="$HOME/orion_ai/artifacts"
D="/mnt/c/Users/top-a/Downloads"
TS="$(date +%Y%m%d_%H%M%S)"
OUT="$A/OPS_PHI_LUPA_PORTAL_${TS}.md"

mkdir -p "$A" "$D"

# route -> next page slug (best-effort)
# NOTE: this is diagnostics (LUPA), not a hard gate.
ROUTES=(
  "/:index"
  "/start:start"
  "/reading:reading"
  "/signal:signal"
  "/map:map"
  "/services:services"
  "/cosmography:cosmography"
  "/orion:orion"
  "/frey:frey"
  "/dao:dao"
  "/access:access"
  "/chronicle:chronicle"
  "/github:github"
)

fetch_js_path(){
  local html="$1"; local slug="$2"
  local js=""
  # best match: /_next/static/chunks/pages/<slug>-<hash>.js
  js="$(printf "%s" "$html" | grep -oE "/_next/static/chunks/pages/${slug}-[^\"' ]+\\.js" | head -n 1 || true)"
  if [ -z "$js" ]; then
    # fallback: any page chunk
    js="$(printf "%s" "$html" | grep -oE "/_next/static/chunks/pages/[^\"' ]+\\.js" | head -n 1 || true)"
  fi
  printf "%s" "$js"
}

count_stream(){
  # $1 = url
  # prints: phi_hits px_hits
  local url="$1"
  local phi px
  phi="$(curl -fsSL "$url" | grep -F -o -- "var(--phi-" | wc -l | tr -d ' ')" || true
  px="$(curl -fsSL "$url" | grep -F -o -- "px" | wc -l | tr -d ' ')" || true
  printf "%s %s" "${phi:-0}" "${px:-0}"
}

{
  echo "# OPS_PHI_LUPA · PORTAL (site)"
  echo "DATE: $(date -Is)"
  echo "BASE: $BASE"
  echo
  echo "Columns: phi_hits = count(var(--phi-), px_hits = count('px') in page JS chunk"
  echo
  echo "| route | js_chunk | phi_hits | px_hits | markers |"
  echo "|---|---|---:|---:|---|"

  for item in "${ROUTES[@]}"; do
    route="${item%%:*}"
    slug="${item##*:}"

    page="$BASE$route?v=$(date +%s)"
    html="$(curl -fsSL "$page")"
    js="$(fetch_js_path "$html" "$slug")"

    markers="-"
    phi_hits="0"; px_hits="0"

    if [ -n "$js" ]; then
      read -r phi_hits px_hits < <(count_stream "$BASE$js")
    fi

    if [ "$route" = "/frey" ] && [ -n "$js" ]; then
      m1="$(curl -fsSL "$BASE$js" | grep -F -c -- "__FREY_PHI_TOKENS_V1_0__" || true)"
      m2="$(curl -fsSL "$BASE$js" | grep -F -c -- "__FREY_ASKFREY_AIR2_V1_0_5__" || true)"
      m3="$(curl -fsSL "$BASE$js" | grep -F -c -- "--frey_phi_marks_v1_0:1" || true)"
      markers="marks=${m1:-0};air2=${m2:-0};vars=${m3:-0}"
    fi

    printf "| %s | %s | %s | %s | %s |\n" "$route" "${js:-NA}" "${phi_hits:-0}" "${px_hits:-0}" "$markers"
  done

  echo
  echo "Note: high px_hits is expected in compiled JS. Φ-work is about controlled overrides (tokens) in our surface blocks." 
} > "$OUT"

sha256sum "$OUT" | tee "$OUT.sha256" >/dev/null
cp -f "$OUT" "$OUT.sha256" "$D/" 2>/dev/null || true

echo "OK: $OUT"

echo "PHI_LUPA_PORTAL: END $(date -Is)" 
exit 0
