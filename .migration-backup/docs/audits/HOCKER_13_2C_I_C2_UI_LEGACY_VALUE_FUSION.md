# HOCKER ONE · 13-2C-I-C2 UI Legacy Value Fusion

## Objetivo

Fusionar valor útil de componentes legacy visuales/operativos en Owner 2C sin borrar archivos originales.

## Fusionado

- `ErrorBoundary.tsx` → `OwnerErrorBoundary`.
- `HockerLiveStatus.tsx` / `SystemStatus.tsx` → `OwnerSystemPulsePanel` con GET seguro `/api/system/status`.
- `NovaExecutiveSurface.tsx` / `nova-executive-language.ts` → brief ejecutivo dentro de `OwnerLegacyValueFusionPanel`.
- `hocker-live-operations-registry.ts` → nodos operativos resumidos.
- `ExternalServicesSection.tsx` → integraciones desde `HOCKER_SYSTEM_REGISTRY_2C`.
- `NodeBadge.tsx` → estilo de badges de nodos.
- `EventsFeed.tsx` → se rescata concepto de actividad, pero no se copia Supabase cliente legacy.
- `AgisRegistry.tsx` → se rescata lógica de resumen, pero se conserva registry 2C como fuente oficial.

## No fusionado todavía

- `AuthBox.tsx`: requiere comparación contra `/login`.
- `export-audit.ts`: server-only; fase futura para `/api/owner/evidence/export`.
- `src/routes/jurix.ts`, `src/lib/http.ts`, `src/trigger/hocker-core-executor.ts`: backend/entrypoints sensibles.
- Runtime/actions/auth/middleware: no tocar en esta fase.

## Seguridad

- No se borró legacy.
- No se ejecutaron acciones.
- No se aprobaron acciones.
- No se tocaron endpoints de mutación.
- No se usó service role.
- Sólo se agregó GET seguro para pulso visual.
- Build/typecheck obligatorios antes de commit.
