#!/usr/bin/env bash
set -euo pipefail

# phi_lupa_frey v0.1 — prod probe for /frey surface
# Writes an artifact into ~/orion_ai/artifacts and copies it to Windows Downloads.

A="$HOME/orion_ai/artifacts"
D="/mnt/c/Users/top-a/Downloads"
TS="$(date +%Y%m%d_%H%M%S)"
Q="$(date +%s)"

mkdir -p "$A" "$D"

probe_one(){
  local base="$1"
  local url="${base%/}/frey?v=$Q"
  local html="$A/.tmp_frey_${TS}_$(echo "$base" | tr -cd '[:alnum:]').html"
  local hdr="$A/.tmp_frey_${TS}_$(echo "$base" | tr -cd '[:alnum:]').hdr"

  curl -fsSL -D "$hdr" -o "$html" "$url"

  echo "URL: $url"
  echo "HEADERS:"
  grep -Ei '^(cache-control|age|x-vercel-cache|x-matched-path|x-vercel-id|strict-transport-security):' "$hdr" || true

  echo "MARKERS:"
  for m in "FREY_SURFACE_CANON_V0_3" "PHI_SURFACE_V0_3" "PHI surface v0.3"; do
    if grep -q "$m" "$html"; then echo "  OK: $m"; else echo "  MISS: $m"; fi
  done
  echo
}

OUT="$A/PROD_PROBE_PHI_LUPA_FREY_v0_1_${TS}.md"
{
  echo "# PROD PROBE · PHI_LUPA_FREY v0.1"
  echo "DATE: $(date -Iseconds)"
  echo
  echo "## TARGETS"
  probe_one "https://bhrigu.io"
  probe_one "https://www.bhrigu.io"
} > "$OUT"

sha256sum "$OUT" > "$OUT.sha256"
cp -f "$OUT" "$D/$(basename "$OUT")"
cp -f "$OUT.sha256" "$D/$(basename "$OUT").sha256"

echo "OK: $OUT"
ls -l "$D/$(basename "$OUT")" "$D/$(basename "$OUT").sha256" | sed -n '1,10p'
