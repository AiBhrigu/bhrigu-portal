#!/usr/bin/env bash
set -euo pipefail

REPO="${1:-$HOME/bhrigu-portal}"
A="$HOME/orion_ai/artifacts"
D="/mnt/c/Users/top-a/Downloads"
TS="$(date +%Y%m%d_%H%M%S)"
OUT="$A/OPS_PHI_LUPA_FREY_${TS}.md"

F="$REPO/pages/frey.js"
mkdir -p "$A" "$D"

if [ ! -f "$F" ]; then
  echo "STOP: missing $F" >&2
  exit 1
fi

# Local signals (surface-only)
phi_vars="$(grep -E -o -- "--phi[-_][A-Za-z0-9_-]+" "$F" | sort -u | wc -l | tr -d " " || true)"
phi_var_uses="$(grep -F -c -- "var(--phi" "$F" || true)"
phi_marker="$(grep -F -c -- "__FREY_PHI_TOKENS_V1_0__" "$F" || true)"
ask_box="$(grep -F -c -- "askFreyBox" "$F" || true)"
qinput="$(grep -F -c -- ".qInput" "$F" || true)"
px_cnt="$(grep -E -o -- "[0-9]{1,4}px" "$F" | wc -l | tr -d " " || true)"

verdict="PASS"
reason="tokens_present"
if [ "${phi_vars:-0}" -lt 1 ] || [ "${phi_var_uses:-0}" -lt 1 ]; then
  verdict="FAIL"
  reason="phi_tokens_missing_or_unused"
fi

# PROD probe (best-effort, cache-busted)
BASE="https://www.bhrigu.io"
PAGE="$BASE/frey?v=$(date +%s)"
prod_js="NA"
prod_phi_marker="NA"
prod_phi_vars="NA"
prod_phi_uses="NA"

if command -v curl >/dev/null 2>&1; then
  HTML="$(curl -fsSL "$PAGE" || true)"
  JS="$(printf "%s" "$HTML" | grep -oE "/_next/static/chunks/pages/frey-[^\"' ]+\.js" | head -n 1 || true)"
  if [ -n "$JS" ]; then
    prod_js="$JS"
    JSC="$(curl -fsSL "$BASE$JS" || true)"
    prod_phi_marker="$(printf "%s" "$JSC" | grep -F -c -- "__FREY_PHI_TOKENS_V1_0__" || true)"
    prod_phi_vars="$(printf "%s" "$JSC" | grep -E -o -- "--phi[-_][A-Za-z0-9_-]+" | sort -u | wc -l | tr -d " " || true)"
    prod_phi_uses="$(printf "%s" "$JSC" | grep -F -c -- "var(--phi" || true)"
  fi
fi

{
  echo "# OPS · Φ-LUPA · FREY v0.1"
  echo "DATE: $(date -Is)"
  echo "REPO: $REPO"
  echo "FILE: $F"
  echo
  echo "## verdict"
  echo "VERDICT: $verdict"
  echo "REASON:  $reason"
  echo
  echo "## local_signals"
  echo "phi_vars_unique: $phi_vars"
  echo "phi_var_uses:    $phi_var_uses"
  echo "phi_marker_hits: $phi_marker"
  echo "askFreyBox_hits: $ask_box"
  echo "qInput_hits:     $qinput"
  echo "px_tokens_cnt:   $px_cnt  (info)"
  echo
  echo "## prod_probe"
  echo "page:   $PAGE"
  echo "frey_js:$prod_js"
  echo "prod_phi_marker_hits: $prod_phi_marker"
  echo "prod_phi_vars_unique: $prod_phi_vars"
  echo "prod_phi_var_uses:    $prod_phi_uses"
  echo
  echo "## snippets"
  echo "### phi_vars (first 30)"
  grep -E -o -- "--phi[-_][A-Za-z0-9_-]+" "$F" | sort -u | head -n 30 || true
  echo
  echo "### var(--phi) lines (first 20)"
  grep -nF -- "var(--phi" "$F" | head -n 20 || true
} > "$OUT"

sha256sum "$OUT" | tee "$OUT.sha256" >/dev/null
cp -f "$OUT" "$OUT.sha256" "$D/" 2>/dev/null || true
echo "OK: $OUT"
