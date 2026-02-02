#!/usr/bin/env bash
set -euo pipefail

# PHI UI-ONLY GUARD (strict string checks)
# Scope: UI-only surfaces must NOT contain implementation triggers for network/secret/data.
# Current target: pages/frey.js (Frey surface is UI-only v0.x)

DATE="$(date -Iseconds)"
TARGETS=("pages/frey.js")

# Forbidden patterns are intentionally strict (string/regex). Keep them stable.
FORBIDDEN_REGEX=(
  'fetch[[:space:]]*\('
  'endpoints?'
  'token(s)?'
  'bearer'
  'authorization'
  'process\.env'
  'api[_-]?key'
  'secret'
)

echo "# PHI_UI_ONLY_GUARD"
echo "DATE: $DATE"
echo "TARGETS: ${TARGETS[*]}"
echo

fail=0
for t in "${TARGETS[@]}"; do
  if [ ! -f "$t" ]; then
    echo "STOP: missing target file: $t"
    exit 2
  fi

  for pat in "${FORBIDDEN_REGEX[@]}"; do
    if grep -nE "$pat" "$t" >/dev/null; then
      echo "FAIL: forbidden '$pat' in $t"
      grep -nE "$pat" "$t" | head -n 20
      echo
      fail=1
    fi
  done
done

if [ "$fail" -ne 0 ]; then
  echo "STOP: UI-only guard FAIL"
  exit 3
fi

echo "OK: UI-only guard PASS"
