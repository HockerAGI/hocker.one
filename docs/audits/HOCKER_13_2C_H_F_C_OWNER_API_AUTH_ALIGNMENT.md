# HOCKER ONE · 13-2C-H-F-C Owner API Auth Alignment Audit

## Objetivo

Auditar por qué `/owner/nova` carga 200 mientras APIs runtime/owner responden 401 en smoke local.

## Resultado ejecutivo

- `/owner/nova` puede cargar porque pasa por layout privado y/o sesión de página.
- Las APIs runtime usan gates propios (`requireProjectRole` o `requireOwnerOrInternal`).
- El frontend ya usa `credentials: include`, así que no parece un problema básico de fetch.
- El 401 del smoke puede venir de cookie local incompleta o de falta de rol/proyecto para esos endpoints.

## Checks

- `owner_layout_requires_private_session`: `True`
- `require_private_session_uses_supabase_getUser`: `True`
- `api_lib_requireProjectRole_uses_getUser`: `True`
- `inline_fetches_use_credentials_include`: `True`
- `runtime_actions_requires_project_role`: `True`
- `owner_live_summary_uses_owner_internal_gate`: `True`
- `middleware_proxy_present`: `True`

## APIs revisadas

- `src/app/api/agi/runtime/actions/route.ts`
  - Existe: `True`
  - Métodos: `GET, POST`
  - requireProjectRole: `True`
  - requireOwnerOrInternal: `False`
  - project_id: `True`
- `src/app/api/agi/runtime/capabilities/route.ts`
  - Existe: `True`
  - Métodos: `GET, POST`
  - requireProjectRole: `True`
  - requireOwnerOrInternal: `False`
  - project_id: `True`
- `src/app/api/agi/runtime/tools/route.ts`
  - Existe: `True`
  - Métodos: `GET`
  - requireProjectRole: `True`
  - requireOwnerOrInternal: `False`
  - project_id: `True`
- `src/app/api/owner/live-summary/route.ts`
  - Existe: `True`
  - Métodos: `GET`
  - requireProjectRole: `False`
  - requireOwnerOrInternal: `True`
  - project_id: `False`

## Causas probables

- La página owner y las APIs usan Supabase auth, pero pueden no compartir cookies válidas en curl si el cookie file no contiene la sesión Supabase completa.
- El frontend sí intenta enviar cookies con credentials: include. El 401 del smoke probablemente viene del cookie file usado por curl, no necesariamente del navegador real.
- /api/owner/live-summary usa owner/internal gate, no necesariamente la misma sesión de requireProjectRole.
- /api/agi/runtime/actions exige rol de proyecto; aunque haya sesión, puede devolver 401/403 si falta project_membership o project_id correcto.

## Seguridad

- No relajar requireProjectRole.
- No bypass owner gate.
- No convertir APIs privadas en públicas.
- No usar service role desde cliente.

## Decisión

Crear endpoint diagnóstico GET seguro que reporte sólo estado de sesión/rol sin secretos, o ajustar smoke para login real con /api/auth/password-login si existe credencial owner disponible.
