#!/usr/bin/env bash
set -euo pipefail

echo "===== HOCKER FORBIDDEN SUPABASE COMMAND SCAN ====="

TMP="/tmp/hocker_forbidden_supabase_scan_hits.txt"
rm -f "$TMP"

find . -type f \
  ! -path "./.git/*" \
  ! -path "./node_modules/*" \
  ! -path "./.next/*" \
  ! -path "./docs/ops/*" \
  ! -path "./supabase/baseline-audit/*" \
  ! -path "./supabase/manual-patches/*" \
  ! -path "./supabase/README.md" \
  ! -name "hocker-forbidden-supabase-command-scan.sh" \
  ! -name "hocker-supabase-production-guard.sh" \
  | while read -r file; do
      case "$file" in
        *.sh|*.md|*package.json)
          grep -nE "supabase[[:space:]]+db[[:space:]]+push|supabase[[:space:]]+migration[[:space:]]+repair|supabase[[:space:]]+db[[:space:]]+reset" "$file" >> "$TMP" 2>/dev/null || true
        ;;
      esac
    done

if [ -s "$TMP" ]; then
  cat "$TMP"
  rm -f "$TMP"
  echo
  echo "Resultado: BLOQUEADO."
  exit 99
fi

rm -f "$TMP"
echo "OK: Sin comandos Supabase peligrosos en scripts operativos."
