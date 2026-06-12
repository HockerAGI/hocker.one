# HOCKER ONE · 13-2C-H-F-D Owner API Auth Diagnostic Endpoint

## Objetivo

Crear un endpoint GET seguro para diagnosticar por qué `/owner/nova` puede cargar mientras APIs runtime/owner pueden responder `401`.

## Endpoint agregado

- `/api/owner/auth-diagnostics`

## Qué reporta

- Si la solicitud llega.
- Si existe `project_id`.
- Si `requireProjectRole` valida acceso.
- Error visible de auth sin exponer secretos.
- Notas de seguridad.

## Seguridad

- No expone tokens.
- No usa service role en cliente.
- No relaja `requireProjectRole`.
- No ejecuta acciones.
- No modifica Supabase.
- No modifica endpoints productivos existentes.

## Uso esperado

`/api/owner/auth-diagnostics?project_id=hocker-one`
