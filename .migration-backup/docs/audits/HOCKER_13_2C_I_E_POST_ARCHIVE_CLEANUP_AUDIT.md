# HOCKER ONE · 13-2C-I-E Post-Archive Repo Cleanup Audit

## Objetivo

Auditar el estado real del repositorio después de archivar legacy/pre-2C. Esta fase no borra, no fusiona y no toca código funcional.

## Resumen

- total_files_repo: `568`
- source_files_active_no_docs: `300`
- archived_files_13_2c_i_d: `13`
- duplicate_exact_groups: `2`
- same_name_different_path_groups: `5`
- archived_active_reference_issues: `0`

## Archivos legacy que quedaron vivos bajo vigilancia

### `src/components/NovaChat.tsx`

- Existe: `True`
- Líneas: `547`
- Referencias por nombre: `0`
- Referencias por stem: `7`

```text
src/app/api/nova/chat/route.ts
src/app/api/nova/chat/stream/route.ts
src/components/NovaChat.tsx
src/lib/hocker-context-pack.ts
src/lib/hocker-tool-router.ts
src/lib/nova-chat-action-drafts.ts
src/lib/nova-github-action-materializer.ts
```

### `src/components/ErrorBoundary.tsx`

- Existe: `True`
- Líneas: `111`
- Referencias por nombre: `0`
- Referencias por stem: `4`

```text
src/components/ErrorBoundary.tsx
src/components/hocker-2c/owner/OwnerShell.tsx
src/components/hocker-2c/owner/fusion/OwnerErrorBoundary.tsx
src/components/hocker-2c/owner/index.ts
```

### `src/components/SystemStatus.tsx`

- Existe: `True`
- Líneas: `227`
- Referencias por nombre: `0`
- Referencias por stem: `2`

```text
src/components/SystemStatus.tsx
src/lib/hocker-system-registry-2c.ts
```

### `src/components/AuthBox.tsx`

- Existe: `True`
- Líneas: `177`
- Referencias por nombre: `0`
- Referencias por stem: `2`

```text
src/components/AuthBox.tsx
src/components/hocker-2c/auth/HockerOwnerLoginSurface.tsx
```

### `src/lib/export-audit.ts`

- Existe: `True`
- Líneas: `81`
- Referencias por nombre: `0`
- Referencias por stem: `1`

```text
src/app/api/owner/evidence/export/route.ts
```

## Validación de archivos archivados

OK: no se detectaron referencias activas hacia archivos archivados.

## Duplicados exactos

- Hash `e3b0c44298fc`
  - `android/app/src/main/assets/public/cordova.js`
  - `android/app/src/main/assets/public/cordova_plugins.js`

- Hash `75c43c4a2c48`
  - `src/app/admin/layout.tsx`
  - `src/app/agis/layout.tsx`
  - `src/app/chat/layout.tsx`
  - `src/app/commands/layout.tsx`
  - `src/app/dashboard/layout.tsx`
  - `src/app/governance/layout.tsx`
  - `src/app/nodes/layout.tsx`
  - `src/app/supply/layout.tsx`
  - `src/app/memory/layout.tsx`
  - `src/app/chido/layout.tsx`
  - `src/app/integrations/layout.tsx`
  - `src/app/status/layout.tsx`
  - `src/app/access/layout.tsx`
  - `src/app/launch/layout.tsx`
  - `src/app/mobile/layout.tsx`
  - `src/app/security/layout.tsx`
  - `src/app/apps/layout.tsx`
  - `src/app/servicios/layout.tsx`

## Mismo nombre en varias rutas

### `layout.tsx`
- `src/app/layout.tsx`
- `src/app/admin/layout.tsx`
- `src/app/agis/layout.tsx`
- `src/app/chat/layout.tsx`
- `src/app/commands/layout.tsx`
- `src/app/dashboard/layout.tsx`
- `src/app/governance/layout.tsx`
- `src/app/nodes/layout.tsx`
- `src/app/supply/layout.tsx`
- `src/app/memory/layout.tsx`
- `src/app/chido/layout.tsx`
- `src/app/integrations/layout.tsx`
- `src/app/status/layout.tsx`
- `src/app/access/layout.tsx`
- `src/app/launch/layout.tsx`
- `src/app/mobile/layout.tsx`
- `src/app/security/layout.tsx`
- `src/app/owner/layout.tsx`
- `src/app/apps/layout.tsx`
- `src/app/servicios/layout.tsx`

### `page.tsx`
- `src/app/page.tsx`
- `src/app/agis/page.tsx`
- `src/app/chat/page.tsx`
- `src/app/commands/page.tsx`
- `src/app/dashboard/page.tsx`
- `src/app/governance/page.tsx`
- `src/app/login/page.tsx`
- `src/app/nodes/page.tsx`
- `src/app/supply/page.tsx`
- `src/app/memory/page.tsx`
- `src/app/chido/page.tsx`
- `src/app/integrations/page.tsx`
- `src/app/status/page.tsx`
- `src/app/access/page.tsx`
- `src/app/launch/page.tsx`
- `src/app/mobile/page.tsx`
- `src/app/security/page.tsx`
- `src/app/owner/page.tsx`
- `src/app/apps/page.tsx`
- `src/app/empresa/page.tsx`
- `src/app/servicios/page.tsx`
- `src/app/live/page.tsx`
- `src/app/map/page.tsx`
- `src/app/casos/page.tsx`
- `src/app/contacto/page.tsx`
- `src/app/ecosistema/page.tsx`
- `src/app/one/page.tsx`
- `src/app/seguridad/page.tsx`
- `src/app/soluciones/page.tsx`
- `src/app/app/page.tsx`
- `src/app/app/actividad/page.tsx`
- `src/app/app/ajustes/page.tsx`
- `src/app/app/ecosistema/page.tsx`
- `src/app/app/nova/page.tsx`
- `src/app/app/pendientes/page.tsx`
- `src/app/owner/actions/page.tsx`
- `src/app/owner/agis/page.tsx`
- `src/app/owner/apps/page.tsx`
- `src/app/owner/command-center/page.tsx`
- `src/app/owner/ecosystem/page.tsx`
- `src/app/owner/evidence/page.tsx`
- `src/app/owner/nova/page.tsx`
- `src/app/security/grants/page.tsx`
- `src/app/security/hardening/page.tsx`
- `src/app/security/rls/page.tsx`
- `src/app/chido/ops/page.tsx`
- `src/app/chido/actions/page.tsx`
- `src/app/chido/research-gate/page.tsx`
- `src/app/chido/approvals/page.tsx`
- `src/app/chido/signatures/page.tsx`
- `src/app/chido/preflight/page.tsx`
- `src/app/memory/review/page.tsx`
- `src/app/admin/jurix/page.tsx`
- `src/app/admin/jurix/export/page.tsx`

### `hocker-core-executor.ts`
- `src/trigger/hocker-core-executor.ts`
- `src/server/executor/hocker-core-executor.ts`

### `index.ts`
- `src/components/hocker-2c/index.ts`
- `src/components/hocker-2c/owner/index.ts`
- `src/components/hocker-2c/owner/live/index.ts`
- `src/components/hocker-2c/owner/nova/index.ts`

### `route.ts`
- `src/app/signout/route.ts`
- `src/app/auth/callback/route.ts`
- `src/app/api/commands/route.ts`
- `src/app/api/execute/route.ts`
- `src/app/api/health/route.ts`
- `src/app/api/agi/memory-mirror/route.ts`
- `src/app/api/agi/runtime/summary/route.ts`
- `src/app/api/agi/runtime/actions/route.ts`
- `src/app/api/agi/runtime/tools/route.ts`
- `src/app/api/agi/runtime/github/route.ts`
- `src/app/api/agi/runtime/context/route.ts`
- `src/app/api/agi/runtime/capabilities/route.ts`
- `src/app/api/agi/runtime/memory/route.ts`
- `src/app/api/agi/runtime/memory/write-gate/route.ts`
- `src/app/api/agi/runtime/memory/review/route.ts`
- `src/app/api/agi/runtime/memory/publication-audit/route.ts`
- `src/app/api/agi/runtime/actions/decision/route.ts`
- `src/app/api/agi/runtime/actions/execute/route.ts`
- `src/app/api/agi/updates/feed/route.ts`
- `src/app/api/agi/learning/submit/route.ts`
- `src/app/api/agi/learning/review/route.ts`
- `src/app/api/owner/live-summary/route.ts`
- `src/app/api/owner/auth-diagnostics/route.ts`
- `src/app/api/owner/evidence/export/route.ts`
- `src/app/api/auth/password-login/route.ts`
- `src/app/api/access/profile/route.ts`
- `src/app/api/access/check/route.ts`
- `src/app/api/access/portal-grants/request/route.ts`
- `src/app/api/access/portal-grants/decision/route.ts`
- `src/app/api/access/portal-grants/revoke/route.ts`
- `src/app/api/integrations/register/route.ts`
- `src/app/api/integrations/health/route.ts`
- `src/app/api/integrations/events/route.ts`
- `src/app/api/chido/actions/dry-run/route.ts`
- `src/app/api/chido/actions/execution/preflight/route.ts`
- `src/app/api/chido/actions/signature/check/route.ts`
- `src/app/api/chido/actions/approval/request/route.ts`
- `src/app/api/chido/actions/approval/decision/route.ts`
- `src/app/api/system/status/route.ts`
- `src/app/api/system/global-health/route.ts`
- `src/app/api/system/beta-readiness/route.ts`
- `src/app/api/system/mobile-sanity/route.ts`
- `src/app/api/system/security-readiness/route.ts`
- `src/app/api/system/security-hardening/route.ts`
- `src/app/api/system/tenant-rls/route.ts`
- `src/app/api/system/providers/route.ts`
- `src/app/api/system/nova/always-on/route.ts`
- `src/app/api/system/diagnostics/providers/route.ts`
- `src/app/api/supply/orders/route.ts`
- `src/app/api/supply/products/route.ts`
- `src/app/api/supply/products/[id]/route.ts`
- `src/app/api/supply/orders/[id]/route.ts`
- `src/app/api/orchestrator/cron/route.ts`
- `src/app/api/orchestrator/run/route.ts`
- `src/app/api/nova/chat/route.ts`
- `src/app/api/nova/chat/stream/route.ts`
- `src/app/api/governance/killswitch/route.ts`
- `src/app/api/events/manual/route.ts`
- `src/app/api/commands/approve/route.ts`
- `src/app/api/commands/dispatch/route.ts`
- `src/app/api/commands/reject/route.ts`

## Archivos sensibles verificados
- `src/app/api/auth/password-login/route.ts`: `True`
- `middleware.ts`: `True`
- `src/proxy.ts`: `True`
- `src/app/api/agi/runtime/actions/route.ts`: `True`
- `src/app/api/agi/runtime/actions/execute/route.ts`: `True`
- `src/app/api/agi/runtime/actions/decision/route.ts`: `True`
- `src/lib/agi-action-execution.ts`: `True`
- `src/lib/github-runtime-executor.ts`: `True`

## Decisión preliminar

- No archivar más hasta revisar `NovaChat.tsx`, `ErrorBoundary.tsx` y `SystemStatus.tsx` si siguen vivos.
- No tocar runtime/actions/auth/middleware sin fase dedicada.
- Si no hay referencias activas hacia archivados, la fase de archive quedó limpia.
- Siguiente paso recomendado: decidir si los archivos vivos son activos reales o candidatos a segunda ola de archivo.
