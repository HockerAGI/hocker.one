#!/usr/bin/env bash
set -euo pipefail

REPO="/root/HOCKER_PUSH_REAL/hocker.one"
OUT_DIR="${NOVA_WATCH_REPORT_DIR:-$REPO/runtime/ops}"
mkdir -p "$OUT_DIR"

REPORT="$OUT_DIR/nova-watchtower-last-report.txt"
JSON="$OUT_DIR/nova-watchtower-last-status.json"
rm -f "$REPORT" "$JSON"

cd "$REPO"
exec > >(tee "$REPORT") 2>&1

STATUS="ready"
STARTED_AT="$(date -Iseconds)"

mark_alert() {
  STATUS="attention"
}

echo "=============================================="
echo " CENTINELA NOVA :: SUPERVISION HOCKER ONE"
echo "=============================================="
echo "DATE=$STARTED_AT"
echo "REPO=$REPO"
echo ""

echo "===== ESTADO GIT ====="
git status --short --branch
git log --oneline -3

echo "===== 1. PULSO DE PRODUCCION ====="
set +e
npm run ops:prod:smoke
PULSE_EXIT=$?
set -e
echo "PULSE_EXIT=$PULSE_EXIT"
if [ "$PULSE_EXIT" = "0" ]; then
  echo "OK: Pulso de Produccion estable."
else
  echo "ALERTA: Pulso de Produccion requiere revision."
  mark_alert
fi

echo "===== 2. ESCANEO DE SEGURIDAD SUPABASE ====="
set +e
npm run ops:supabase:scan
SCAN_EXIT=$?
set -e
echo "SCAN_EXIT=$SCAN_EXIT"
if [ "$SCAN_EXIT" = "0" ]; then
  echo "OK: No se detectaron comandos Supabase peligrosos."
else
  echo "ALERTA: Scanner Supabase detecto riesgo."
  mark_alert
fi

echo "===== 3. PRUEBA DE CANDADO DE BASE DE DATOS ====="
set +e
npm run ops:supabase:guard -- db push --dry-run --linked
BLOCK_EXIT=$?
set -e
echo "BLOCK_EXIT=$BLOCK_EXIT"
if [ "$BLOCK_EXIT" = "99" ]; then
  echo "OK: Candado de Base de Datos activo."
else
  echo "ALERTA: Candado de Base de Datos no bloqueo como se esperaba."
  mark_alert
fi

FINISHED_AT="$(date -Iseconds)"

echo "===== RESULTADO CENTINELA NOVA ====="
echo "STATUS=$STATUS"
echo "REPORT=$REPORT"
echo "JSON=$JSON"

printf "{\"status\":\"%s\",\"started_at\":\"%s\",\"finished_at\":\"%s\",\"report\":\"%s\"}\n" "$STATUS" "$STARTED_AT" "$FINISHED_AT" "$REPORT" > "$JSON"

if [ "$STATUS" != "ready" ]; then
  echo "CENTINELA NOVA: requiere atencion."
  exit 1
fi

echo "CENTINELA NOVA: Hocker ONE estable."
