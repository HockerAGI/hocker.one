# HOCKER ONE · 12.7Z-1A SQL normalization + idempotent GitHub worker

## Objetivo

Endurecer `agi_action_queue` y el worker GitHub aprobado para evitar doble ejecución, drift SQL y escrituras inseguras.

## Cambios

- Migración canónica aditiva para `agi_action_queue`.
- `idempotency_key` por acción.
- Índice único parcial por `project_id + idempotency_key`.
- Lock de ejecución `approved → executing` con transición atómica.
- `locked_at`, `lock_owner`, `attempt_count`, `max_attempts`, `last_error`.
- `expected_sha` obligatorio para `github.upsert_file` sobre archivo existente.
- Allowlist estricta de repositorios.
- Allowlist estricta de paths.
- Detección de PR duplicado abierto.
- `rollback_plan` mínimo por operación.
- Sin escritura directa a `main/master/production/prod`.

## Seguridad

Este cambio no ejecuta acciones por sí solo. Sólo endurece la cola y el worker usado después de aprobación owner.
