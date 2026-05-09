#!/usr/bin/env bash
set -euo pipefail

echo "===== VALIDACION TOTAL HOCKER ONE ====="
echo "DATE=$(date -Iseconds)"

echo "===== 1. SCANNER SUPABASE ====="
npm run ops:supabase:scan

echo "===== 2. PRUEBA DE CANDADO SUPABASE ====="
set +e
npm run ops:supabase:guard -- db push --dry-run --linked
BLOCK_EXIT=$?
set -e
echo "BLOCK_EXIT=$BLOCK_EXIT"
if [ "$BLOCK_EXIT" != "99" ]; then
  echo "ERROR: El candado Supabase no bloqueo db push."
  exit 1
fi

echo "===== 3. TYPECHECK ====="
npm run typecheck

echo "===== 4. BUILD ====="
npm run build

echo "===== 5. PULSO DE PRODUCCION ====="
npm run ops:prod:smoke

echo "===== RESULTADO ====="
echo "OK: Validacion Total HOCKER ONE completada."
