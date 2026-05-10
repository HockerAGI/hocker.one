#!/usr/bin/env bash
set -euo pipefail

REPO="/root/HOCKER_PUSH_REAL/hocker.one"
cd "$REPO"

echo "===== HOCKER ONE PRODUCTION SMOKE TEST ====="
echo "DATE=$(date -Iseconds)"

PROD="${HOCKER_ONE_PROD_URL:-https://hocker-kkmd5fmne-hockeragi.vercel.app}"
PROD="${PROD%/}"
DEPLOYMENT_HOST="${PROD#https://}"
DEPLOYMENT_HOST="${DEPLOYMENT_HOST#http://}"

echo "PROD=$PROD"
echo "DEPLOYMENT_HOST=$DEPLOYMENT_HOST"

run_timeout() {
  local seconds="$1"
  shift

  if command -v timeout >/dev/null 2>&1; then
    timeout "$seconds" "$@"
  else
    "$@"
  fi
}

fetch() {
  local path="$1"
  run_timeout 90 vercel curl "$path" --deployment "$DEPLOYMENT_HOST" 2>/dev/null
}

check_contains() {
  local path="$1"
  local needle="$2"
  local body=""

  echo "CHECK $path"

  body="$(fetch "$path" || true)"

  if echo "$body" | grep -q "$needle"; then
    return 0
  fi

  echo "FAIL: $path no contiene $needle"
  return 1
}

check_private_route() {
  local path="$1"
  local body=""

  echo "CHECK private $path"

  body="$(fetch "$path" || true)"

  if echo "$body" | grep -Eiq "Redirecting|Acceso|Correo|Contraseña|Hocker ONE"; then
    return 0
  fi

  echo "FAIL: $path no parece protegido"
  return 1
}

check_json_ready() {
  local path="$1"
  local body=""

  echo "CHECK $path"

  body="$(fetch "$path" || true)"

  if echo "$body" | grep -q '"ok":true'; then
    return 0
  fi

  echo "FAIL: $path no responde ok:true"
  return 1
}

echo "===== PUBLICAS ====="
check_contains "/empresa" "Hocker AGI Technologies"
check_contains "/login" "Hocker ONE"
echo "OK: publicas"

echo "===== PRIVADAS ====="
for path in /apps /servicios /owner /chido /security /dashboard; do
  check_private_route "$path"
done
echo "OK: privadas protegidas"

echo "===== READINESS ====="
check_json_ready "/api/system/security-hardening"
check_json_ready "/api/system/tenant-rls"
echo "OK: readiness"

echo "===== RESULTADO ====="
echo "OK: Hocker ONE Production smoke test passed."
echo "PROD=$PROD"
