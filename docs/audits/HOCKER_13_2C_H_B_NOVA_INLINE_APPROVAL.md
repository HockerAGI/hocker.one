# HOCKER ONE · 13-2C-H-B NOVA Inline Approval Cards

## Objetivo

Respetar el flujo solicitado: las autorizaciones deben aparecer dentro del chat de NOVA, sólo cuando una acción necesita permiso.

## Aplicado

- `OwnerNovaInlineApprovals`
- Tarjetas de autorización dentro de `/owner/nova`
- Botones:
  - Aprobar
  - Rechazar
  - Pedir ajuste
- Evidencia desplegable dentro del mismo chat.
- Refresh seguro después de decidir.
- Se usa `/api/agi/runtime/actions/decision`.
- Se usa `action_id` como llave detectada desde endpoint real.

## Seguridad

- No se ejecutan acciones.
- No se llama `/execute`.
- No se obliga al owner a cambiar de módulo.
- La decisión sigue pasando por `requireProjectRole(["owner"])`.
- No se modifican APIs productivas.

## Decisión UX

`/owner/actions` queda como respaldo administrativo.  
El flujo principal de autorización vive dentro de NOVA Chat.
