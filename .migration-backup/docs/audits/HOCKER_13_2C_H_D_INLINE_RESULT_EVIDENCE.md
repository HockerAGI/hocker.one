# HOCKER ONE · 13-2C-H-D Inline Result + Evidence Refresh

## Objetivo

Mejorar el resultado después de ejecutar una acción aprobada desde NOVA Chat.

## Aplicado

- Resultado humano dentro del mismo chat.
- Detalles técnicos ocultos en `Ver detalles técnicos`.
- Evidencia reciente refrescada después de ejecutar.
- Estado local de acción ejecutada.
- Botón `Actualizar estado`.
- Rollback visible sólo si existe `rollback_plan`.
- No se muestra JSON crudo como respuesta principal.

## Seguridad

- No se modifican APIs productivas.
- No se toca Supabase.
- No se cambia Owner Gate.
- La ejecución sigue pasando por `/api/agi/runtime/actions/execute`.
- La autorización previa sigue siendo obligatoria.

## Decisión UX

El owner no debe cambiar de módulo para entender qué pasó.  
NOVA muestra el resultado, evidencia y detalles sólo si el owner quiere abrirlos.
