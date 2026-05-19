# 12.7B-1.1 — GitHub Executor Path-Aware Filter

## Objetivo
Corregir el executor GitHub real para que `list_tree` y `audit_paths` filtren rutas antes de aplicar límites de respuesta.

## Corrección
- `list_tree` ahora respeta `input.path` como prefijo real.
- `list_tree` reporta `total_seen`, `filtered_count`, `count` y `path`.
- `audit_paths` ahora consulta el árbol completo permitido, aplica `include`/`exclude` antes del `limit` y devuelve `matched_total`.
- No se toca la política de escritura: sigue protegida por Owner Gate + dry-run + approval queue.

## Pruebas esperadas
- `list_tree` sobre `src/app/api/agi/runtime` debe devolver rutas runtime reales.
- `audit_paths` con include `src/app/api/agi/runtime` y `src/lib` debe devolver rutas reales.
