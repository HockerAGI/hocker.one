# HOCKER ONE · 13-2C-H-E-B Inline Rollback Plan Preview

## Objetivo

Mostrar dentro de NOVA Chat un preview humano de `rollback_plan`, sin crear botón falso de reversión.

## Aplicado

- Tarjeta `Rollback disponible`.
- Resumen humano del plan.
- Campos visibles cuando existen:
  - Operación
  - Repositorio
  - Rama
  - Archivo
  - SHA anterior
  - SHA objetivo
  - Motivo / nota
- Detalles técnicos ocultos en `Ver plan completo`.
- Aviso explícito: reversión bloqueada hasta confirmar endpoint real de rollback de acciones.

## Seguridad

- No se creó botón `Revertir ahora`.
- No se llama endpoint de rollback.
- No se modifica Supabase.
- No se modifican APIs productivas.
- No se salta Owner Gate.

## Decisión UX

NOVA puede mostrar que existe un plan de reversión, pero no puede prometer reversión real hasta que exista endpoint confirmado.
