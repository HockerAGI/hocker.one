# HOCKER ONE · 13-2C-I-C3-B AuthBox Login Fusion

## Objetivo

Fusionar `AuthBox.tsx` con `/login/page.tsx` sin cambiar el endpoint real de autenticación.

## Cambios

- Nuevo componente `HockerOwnerLoginSurface`.
- `/login/page.tsx` ahora renderiza una superficie 2C premium.
- `AuthBox` se reutiliza como núcleo funcional del login.
- Se conserva `/api/auth/password-login`.

## Seguridad

- No se modificó `/api/auth/password-login/route.ts`.
- No se tocó Supabase server.
- No se tocó middleware/proxy.
- No se tocó runtime.
- No se usó service role.
- Login mantiene robots noindex.
- Typecheck/build obligatorios antes de commit.

## Decisión

El valor útil de `AuthBox` se conecta al producto real en vez de quedar como componente suelto.
