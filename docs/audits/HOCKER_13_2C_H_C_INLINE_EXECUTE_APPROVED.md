# HOCKER ONE · 13-2C-H-C Inline Execute Approved Actions

## Objetivo

Mostrar `Ejecutar ahora` dentro del chat de NOVA únicamente cuando una acción ya esté aprobada.

## Aplicado

- `OwnerNovaInlineExecutions`
- Tarjetas de ejecución dentro de `/owner/nova`
- Botón `Ejecutar ahora`
- Evidencia previa desplegable
- Resultado visible dentro del mismo chat
- Se usa `/api/agi/runtime/actions/execute`
- Se usa `action_id` como llave detectada desde endpoint real

## Seguridad

- No aparece ejecución si la acción no está aprobada.
- No se ejecuta desde `/owner/actions`.
- No se salta Owner Gate.
- La ejecución sigue pasando por `requireProjectRole(["owner"])`.
- No se modifican APIs productivas.

## Decisión UX

El owner autoriza y ejecuta desde NOVA Chat.  
Las páginas administrativas quedan como respaldo, no como flujo principal.
