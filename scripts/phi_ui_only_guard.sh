#!/usr/bin/env bash
set -euo pipefail

# UI-only guard: strict string checks for UI-only surfaces (e.g. /frey).
# Intent: prevent accidental wiring to network calls / secrets / auth from the UI-only surface.

FILES=("pages/frey.js")
[ -f "pages/reading.js" ] && FILES+=("pages/reading.js")

FORBIDDEN_RE=(
  '\bfetch\b'
  '\bendpoints?\b'
  '\btoken(s)?\b'
  '\bapi[_-]?key\b'
  '\bauthorization\b'
  '\bbearer\b'
)

fail=0
for f in "${FILES[@]}"; do
  [ -f "$f" ] || { echo "SKIP: missing $f"; continue; }
  for re in "${FORBIDDEN_RE[@]}"; do
    if LC_ALL=C grep -nE "$re" "$f" >/dev/null; then
      echo "FAIL: $f matches /$re/"
      LC_ALL=C grep -nE "$re" "$f" || true
      fail=1
    fi
  done
done

if [ "$fail" -ne 0 ]; then
  echo "STOP: UI-only guard FAIL"
  exit 10
fi

echo "OK: UI-only guard PASS"
