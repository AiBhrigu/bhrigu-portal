#!/usr/bin/env bash
set -euo pipefail

# PHI_LUPA_FREY_STRUCTURAL_CANON_V0_2
# Structural prod probe for /frey.
# Truth contract:
# - HTTP 200
# - __NEXT_DATA__ present
# - structural page marker present: "page":"/frey"
# Never depend on mutable UI copy like "Open Frey".

Q="$(date -u +%s)"
TMP_DIR="$(mktemp -d /tmp/phi_lupa_frey_v0_2_XXXXXX)"
trap 'rm -rf "$TMP_DIR"' EXIT

probe_one() {
  local base="$1"
  local host
  host="$(printf '%s' "$base" | sed 's#https\?://##; s#/$##')"
  local url="${base%/}/frey?v=$Q"
  local html="$TMP_DIR/${host}.html"
  local headers="$TMP_DIR/${host}.headers"
  local http page_mark next_data

  curl --compressed -sS -D "$headers" "$url" -o "$html"
  http="$(awk 'toupper($1) ~ /^HTTP\// {code=$2} END{print code}' "$headers")"

  if grep -F -q '"page":"/frey"' "$html" || grep -F -q '"page": "/frey"' "$html"; then
    page_mark="YES"
  else
    page_mark="NO"
  fi

  if grep -F -q '__NEXT_DATA__' "$html"; then
    next_data="YES"
  else
    next_data="NO"
  fi

  echo "HOST=$host"
  echo "HTTP=$http"
  echo "PAGE_MARK=$page_mark"
  echo "NEXT_DATA=$next_data"

  if [ "$http" = "200" ] && [ "$page_mark" = "YES" ] && [ "$next_data" = "YES" ]; then
    return 0
  fi
  return 1
}

probe_one "https://bhrigu.io"
probe_one "https://www.bhrigu.io"
