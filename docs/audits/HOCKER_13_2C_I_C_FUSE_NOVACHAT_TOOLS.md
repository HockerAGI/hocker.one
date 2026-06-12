# HOCKER ONE · 13-2C-I-C Fuse NovaChat Legacy Tools

## Objetivo

Fusionar herramientas útiles de `src/components/NovaChat.tsx` dentro de `OwnerNovaBridge` sin crear un segundo chat.

## Fusionado

- Intenciones:
  - Criterio
  - Archivo
  - Research
  - Pensar
  - Imagen
  - Video
- Starters/prompts útiles.
- Metadata de archivos para contexto.
- Contexto `selected_intent` hacia `/api/nova/chat`.
- `allow_actions` sólo cuando el modo owner es `Ejecutar`.

## Seguridad

- No se borró `NovaChat.tsx`.
- No se ejecutan acciones desde el tool drawer.
- No se aprueban acciones desde el tool drawer.
- No se llama endpoint de ejecución desde el tool drawer.
- Los archivos se pasan sólo como metadata, no como contenido real.
- Owner Gate sigue intacto.
- `allow_actions` sólo prepara/encola borradores seguros cuando el modo es `Ejecutar`; no ejecuta.

## Decisión

El chat legacy deja de ser una pieza suelta conceptual: sus herramientas útiles pasan al flujo owner 2C.
