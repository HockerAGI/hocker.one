#!/usr/bin/env bash
set -euo pipefail

CMD="$*"

blocked() {
  echo "HOCKER SUPABASE PRODUCTION GUARD"
  echo "Comando bloqueado: supabase $CMD"
  echo "Motivo: la base remota de produccion es fuente de verdad y el historial CLI no esta reconciliado."
  echo "Bloqueado: db push / migration repair / db reset"
  exit 99
}

case "$CMD" in
  *"db push"*) blocked ;;
  *"migration repair"*) blocked ;;
  *"db reset"*) blocked ;;
esac

echo "Comando permitido por guardrail local: supabase $CMD"
npx supabase "$@"
