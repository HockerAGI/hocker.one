#!/bin/bash

echo "🧠 FIX FINAL LIMPIO..."

# BACKUP
cp -r src src_backup_$(date +%s)

# =========================
# FIX TERNARIOS
# =========================
echo "🔧 Corrigiendo ternarios..."

grep -rl 'err ? getErrorMessage(err) ||' src | while read file; do
  sed -i 's/err ? getErrorMessage(err) ||/err ? getErrorMessage(err) :/g' "$file"
done

grep -rl 'e ? getErrorMessage(e) ||' src | while read file; do
  sed -i 's/e ? getErrorMessage(e) ||/e ? getErrorMessage(e) :/g' "$file"
done

grep -rl 'health ? getErrorMessage(health) ||' src | while read file; do
  sed -i 's/health ? getErrorMessage(health) ||/health ? getErrorMessage(health) :/g' "$file"
done

# =========================
# FIX errors.ts
# =========================
echo "🧠 Corrigiendo errors.ts..."

cat > src/lib/errors.ts << 'EOF'
export function getErrorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;

  if (typeof e === "object" && e !== null && "message" in e) {
    return String((e as { message?: unknown }).message);
  }

  return String(e);
}
EOF

# =========================
# FIX guards.ts
# =========================
echo "🧠 Corrigiendo guards.ts..."

sed -i 's/(e as any)getErrorMessage()/getErrorMessage(e)/g' src/lib/guards.ts 2>/dev/null

# =========================
# LIMPIEZA
# =========================
rm -rf .next
rm -rf node_modules/.cache

# =========================
# VALIDACIÓN
# =========================
echo "🧪 Verificando..."

npx tsc --noEmit

echo "✅ FIX COMPLETADO"
