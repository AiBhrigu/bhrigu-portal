#!/usr/bin/env bash
set -euo pipefail

# Φ-Gate · Frey (/frey) · v0.2
# Strict on Ask Frey block only (surface rules): spacing + tokens + no random px on critical lines.

F="${1:-pages/frey.js}"
[ -f "$F" ] || { echo "FAIL: missing $F"; exit 2; }

need(){
  local pat="$1"; local label="$2"
  if ! grep -qF -- "$pat" "$F"; then
    echo "FAIL: missing: $label"
    exit 2
  fi
}

line_of(){
  local pat="$1";
  grep -nF -- "$pat" "$F" | head -n 1 || true
}

# Anchors / markers
need "--frey_phi_tokens_v1_0:1" "Φ tokens marker"
need "--phi-" "Φ variables"
need "askFreyBox" "askFreyBox token"
need "--frey_askfrey_air2_v1_0_5:1" "air marker"

# Targeted CSS lines (keep scope tight)
L_BOX="$(line_of ".askFreyBox{")"
L_Q="$(line_of ".askFreyBox .qInput{")"

[ -n "$L_BOX" ] || { echo "FAIL: .askFreyBox{ line not found"; exit 2; }
[ -n "$L_Q" ]   || { echo "FAIL: .askFreyBox .qInput{ line not found"; exit 2; }

# Convert "N:LINE" to just LINE
LINE_BOX="${L_BOX#*:}"; LINE_Q="${L_Q#*:}"

# Rules:
# - AskFreyBox must use φ tokens for gap + padding
# - qInput must use φ tokens for padding + min-height
# - avoid raw "px" on these two critical lines (allow '0 12px 34px' shadows only)

echo "OK: found critical lines"

# Box tokens
printf "%s" "$LINE_BOX" | grep -qF -- "gap:var(--phi-"     || { echo "FAIL: askFreyBox gap must use Φ token"; exit 2; }
printf "%s" "$LINE_BOX" | grep -qF -- "padding:var(--phi-"  || { echo "FAIL: askFreyBox padding must use Φ token"; exit 2; }

# Input tokens
printf "%s" "$LINE_Q" | grep -qF -- "padding:var(--phi-"     || { echo "FAIL: qInput padding must use Φ token"; exit 2; }
printf "%s" "$LINE_Q" | grep -qF -- "min-height:var(--phi-"  || { echo "FAIL: qInput min-height must use Φ token"; exit 2; }

# Hard px ban on critical lines (except box-shadow, which still has px)
# We allow px only if it's inside "box-shadow".
px_bad(){
  local s="$1"
  # remove box-shadow segments for the check
  local scrub
  scrub="$(printf "%s" "$s" | sed -E 's/box-shadow:[^;]*;//g')"
  if printf "%s" "$scrub" | grep -qE '[0-9]px'; then
    return 0
  fi
  return 1
}

if px_bad "$LINE_BOX"; then
  echo "FAIL: raw px found on askFreyBox line (outside box-shadow)"
  echo "LINE: $LINE_BOX"
  exit 2
fi

if px_bad "$LINE_Q"; then
  echo "FAIL: raw px found on qInput line (outside box-shadow)"
  echo "LINE: $LINE_Q"
  exit 2
fi


# == Φ query mode lock v0.1 (FREY_QUERY_MODE_LOCK_V0_1) ==
# rule: exactly one marker must exist in pages/frey.js
STUB_HITS="$(grep -F -c -- "__FREY_QUERY_MODE_STUB_V0_1__" pages/frey.js || true)"
LIVE_HITS="$(grep -F -c -- "__FREY_QUERY_MODE_LIVE_V0_1__" pages/frey.js || true)"
if [ "$STUB_HITS" -gt 0 ] && [ "$LIVE_HITS" -gt 0 ]; then
  echo "FAIL: query mode conflict (stub+live markers)"; exit 2;
fi
if [ "$STUB_HITS" -eq 0 ] && [ "$LIVE_HITS" -eq 0 ]; then
  echo "FAIL: missing query mode marker (stub/live)"; exit 2;
fi
if [ "$STUB_HITS" -gt 0 ]; then
  VAR_HITS="$(grep -F -c -- "--frey_query_mode_stub:1" pages/frey.js || true)"
  [ "$VAR_HITS" -gt 0 ] || { echo "FAIL: stub marker present but var missing"; exit 2; }
fi

echo "PASS: Φ-gate v0.2 (Ask Frey block)"
