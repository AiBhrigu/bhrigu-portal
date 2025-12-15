#!/usr/bin/env bash
set -euo pipefail

echo "== Φ gate: paste-trash in pages =="
if grep -RIn "npx vercel" pages; then
  echo "FAIL: found 'npx vercel' inside pages (paste trash)."
  exit 1
else
  echo "OK"
fi

echo "== Φ gate: tracked build artifacts =="
if git ls-files | grep -E '^(node_modules/|\.next/)'; then
  echo "FAIL: node_modules/.next tracked"
  exit 1
else
  echo "OK"
fi

echo "== Φ build =="
npm run build >/dev/null
echo "OK: build"

echo "== Φ routes (HTTP) =="
for p in / /start /reading /signal /map /services /cosmography /orion /frey /dao /access /chronicle /github /api; do
  printf "== %s ==\n" "$p"
  curl -s -o /dev/null -w "%{http_code} %{url_effective}\n" "https://www.bhrigu.io$p"
done
