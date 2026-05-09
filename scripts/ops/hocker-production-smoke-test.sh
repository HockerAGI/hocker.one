#!/usr/bin/env bash
set -euo pipefail

REPO="/root/HOCKER_PUSH_REAL/hocker.one"
cd "$REPO"

echo "===== HOCKER ONE PRODUCTION SMOKE TEST ====="
echo "DATE=$(date -Iseconds)"

DETECTED="$(vercel list --cwd "$REPO" --yes 2>/dev/null | grep "Production" | grep "Ready" | grep -Eo "https://[^ ]+vercel.app" | head -1 || true)"
PROD="${HOCKER_ONE_PROD_URL:-${DETECTED:-https://hocker-1vdc653wv-hockeragi.vercel.app}}"

echo "PROD=$PROD"

echo "===== PUBLICAS ====="
vercel curl /empresa --deployment "$PROD" 2>/dev/null | grep -q "Hocker AGI Technologies"
vercel curl /login --deployment "$PROD" 2>/dev/null | grep -q "Hocker ONE"
echo "OK: publicas"

echo "===== PRIVADAS ====="
for path in /apps /servicios /owner /chido /security /dashboard; do
  echo "CHECK $path"
  BODY="$(vercel curl "$path" --deployment "$PROD" 2>/dev/null | head -c 300 || true)"
  echo "$BODY" | grep -qi "Redirecting"
done
echo "OK: privadas protegidas"

echo "===== READINESS ====="
vercel curl /api/system/security-hardening --deployment "$PROD" 2>/dev/null | grep -q "\"ok\":true"
vercel curl /api/system/tenant-rls --deployment "$PROD" 2>/dev/null | grep -q "\"ok\":true"
vercel curl /api/system/security-readiness --deployment "$PROD" 2>/dev/null | grep -q "\"owner_gate\":\"blocked\""
echo "OK: readiness"

echo "===== RESULTADO ====="
echo "OK: Hocker ONE Production smoke test passed."
echo "PROD=$PROD"
