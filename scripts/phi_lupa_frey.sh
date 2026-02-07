#!/usr/bin/env bash
# PHI_LUPA_FREY_COMPRESSED_CANON_V0_1 :: always use curl --compressed for HTML probes
set -euo pipefail

# PHI_LUPA_FREY_DETACHED_PROBE_FIX_V0_5
HTML="${HTML:-}"

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

  curl -fsSL --compressed -D "$hdr" -o "$html" "$url"

  echo "URL: $url"
  echo "HEADERS:"
  grep -Ei '^(cache-control|age|x-vercel-cache|x-matched-path|x-vercel-id|strict-transport-security):' "$hdr" || true

  echo "MARKERS:"
# PHI_LUPA_FREY_MARKERS_CANON_V0_2
BG_MARK="__FREY_PHI_SPACE_BG_V0_3__"
FLOW_MARK="__FREY_QUERY_FLOW_UI_ONLY_V0_4__"
# Canon checks (HTML is fetched with --compressed in prior canon patch)

  for m in "__FREY_PHI_SPACE_BG_V0_3__" "__FREY_QUERY_FLOW_UI_ONLY_V0_4__" "PHI surface v0.3"; do
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

# PHI_LUPA_FREY_DETACHED_PROBE_FIX_V0_5 :: detached prod marker probe (file-based, compressed)
phi_detached_prod_probe() {
  local q url html_tmp hdr_tmp
  q="$(date +%s)"
  url="https://bhrigu.io/frey?v=$q"
  html_tmp="$(mktemp)"
  hdr_tmp="$(mktemp)"
  # Canon markers (hardcoded)
  BG_MARK='data-frey-mark="__FREY_PHI_SPACE_BG_V0_3__"'
  FLOW_MARK='data-frey-flow="__FREY_QUERY_FLOW_UI_ONLY_V0_4__"'

  curl -fsSL --compressed -D "$hdr_tmp" "$url" > "$html_tmp" || return 1
  grep -q "$BG_MARK" "$html_tmp" || return 1
  grep -q "$FLOW_MARK" "$html_tmp" || return 1
  return 0
}


phi_detached_prod_probe || { echo "FAIL: detached prod probe"; exit 1; }
