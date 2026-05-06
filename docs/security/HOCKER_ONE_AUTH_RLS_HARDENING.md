# HOCKER ONE — Auth/RLS Hardening Policy

## Estado

Hocker ONE es panel maestro privado owner-only.  
Los clientes no acceden al núcleo. Usan portales derivados por servicio, producto, tenant y permisos.

## Reglas activas

- Hocker ONE mantiene `execution_lock=true`.
- `real_execution_enabled=false`.
- Owner Console requiere sesión protegida por middleware.
- Endpoints críticos de grants requieren `x-hocker-owner-key`.
- Access grants son lógicos/auditables.
- Aprobar un grant no crea sesión real.
- Revocar un grant no revoca sesión real porque todavía no existe sesión real.

## Rutas owner-only

- `/owner`
- `/dashboard`
- `/status`
- `/launch`
- `/mobile`
- `/security`
- `/security/grants`
- `/security/hardening`
- `/access`
- `/integrations`
- `/memory`
- `/governance`
- `/chido`
- `/admin`

## APIs owner-gated

- `/api/access/portal-grants/decision`
- `/api/access/portal-grants/revoke`

## APIs lógicas auditables

- `/api/access/portal-grants/request`
- `/api/access/check`
- `/api/integrations/register`
- `/api/integrations/events`

## Próxima fase: 1I-B

Definir RLS por:

- owner_id
- tenant_id
- portal_id
- grant_id
- module_id
- permission
- expires_at
- revoked_at
- audit trace

## Prohibición actual

No activar:

- usuarios cliente reales
- sesiones cliente reales
- JWTs por portal
- modificación de balances
- depósitos reales
- retiros reales
- ejecución de comandos sensibles

hasta que RLS/Tenant Hardening esté validado.
