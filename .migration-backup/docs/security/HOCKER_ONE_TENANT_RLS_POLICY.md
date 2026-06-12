# HOCKER ONE — Tenant/RLS Policy

## Objetivo

Preparar Hocker ONE para escalar portales derivados sin exponer el núcleo owner-only.

## Estado 1I-B

- Contrato Tenant/RLS creado.
- Readiness API creada.
- UI `/security/rls` creada.
- Migration SQL versionada.
- No se aplican políticas destructivas sobre tablas actuales.
- No se crean sesiones reales de clientes todavía.

## Campos canónicos

- owner_id
- tenant_id
- portal_id
- grant_id
- module_id
- permission
- expires_at
- revoked_at
- audit_trace_id

## Reglas

Hocker ONE conserva control total.

Clientes:

- no entran a `/owner`
- no entran a `/dashboard`
- no entran a `/security`
- no entran a `/chido`
- solo entran a su portal derivado cuando exista auth real

## Migration preparada

Archivo:

`supabase/migrations/20260506_hocker_tenant_rls_foundation.sql`

Esta migration crea:

- `hocker_tenants`
- `hocker_portal_grants`

con RLS activo y policy service_role-only.

## Activación real futura

Antes de activar sesiones reales:

1. Aplicar migration en Supabase.
2. Validar service-role only.
3. Crear flujo de portal auth separado.
4. Mapear usuario → tenant → grant → portal.
5. Probar expiración/revocación.
6. Probar rollback.
