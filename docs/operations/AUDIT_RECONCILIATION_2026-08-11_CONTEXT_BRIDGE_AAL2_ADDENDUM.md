# HOCKER Audit Reconciliation — Context Bridge AAL2 Addendum — 2026-08-11

## Autoridad y alcance

Este addendum conserva como evidencia histórica `AUDIT_RECONCILIATION_2026-08-11_OWNER_MFA_ADDENDUM.md` y actualiza únicamente los hechos que cambiaron después de ese corte: cleanup del cliente administrativo de Chido y migración de Context Bridge a una superficie humana Owner+AAL2.

Cuando exista conflicto sobre esos puntos, prevalecen producción/configuración observable, `main`, migraciones y tests sobre el addendum anterior. No se modificaron ni rotaron credenciales durante este bloque y el documento de credenciales no fue utilizado para ejecutar pruebas.

## Estado productivo al cierre

- Hocker ONE `main`: `e66bfa8428d10dfc5a423523f3c2180555aab38c`.
- Vercel production: `dpl_91oJDuwSppjdLdNScuv81uMQZp98`, `READY`, región `sfo1`, commit GitHub verificado.
- El build productivo completó TypeScript y `npm ci` reportó `0 vulnerabilities` en el corte observado.
- Smoke anónimo de `/owner/context-bridge`: termina en la superficie `/login`; HSTS permanece activo.
- No se observaron logs `error`/`fatal` en la ventana post-deploy del deployment citado.

## PR #169 — retiro del Owner key legacy en el cliente Chido admin

Merge productivo: `05cf9d799ed13f00bd238ac42d81a5c3bdf5d859`.

Se retiraron de `AdminPanel.tsx` la lectura de `window.__HOCKER_OWNER_KEY` y el header `x-hocker-owner-key`. El cliente administrativo usa ahora únicamente la sesión Supabase; el servidor conserva la autoridad y exige Owner+AAL2 para `/api/chido/admin`.

La regresión impide reintroducir la llave compartida en ese cliente. No cambiaron KYC, depósitos, retiros, settings, ledger ni kill-switch.

Producción asociada: `dpl_Gm9izk3janEufnw3xuY1uqVruJG7`, `READY`, con smoke fail-closed y sin `error`/`fatal` en la ventana observada.

## PR #170 — Context Bridge Owner+AAL2

Merge productivo: `e66bfa8428d10dfc5a423523f3c2180555aab38c`.

### Frontera de activación

- `POST /api/context-bridge/manifests` conserva el Owner/Internal Gate para crear drafts, pero `activate=true` falla cerrado y exige MFA.
- `POST /api/context-bridge/manifests/activate` requiere `requireOwnerAal2Api()` antes de registrar evidencia o activar.
- La ruta liga la evidencia al `userId` autenticado, `current_aal`, versión del gate, acción, recurso, SHA candidato, ambiente, trace, nonce y request hash.
- `/owner/context-bridge` requiere `requireOwnerAal2Page("/owner/context-bridge")` antes de leer el manifiesto activo o mostrar el control humano de activación.
- Una identidad interna o una llave compartida ya no puede activar un manifiesto desde la API web.

### Evidencia y base de datos

Antes del merge se aplicó en producción la migración `context_bridge_owner_aal2_evidence`.

El constraint efectivo `owner_gate_approvals_accepted_header_check` admite:

- `x-hocker-owner-key`;
- `x-hocker-internal-key`;
- `authorization`;
- `supabase-session-aal2`.

`supabase-session-aal2` se usa como vocabulario de evidencia de autenticación; no representa un header HTTP enviado por el navegador.

Se conserva el contrato anterior de `record_owner_gate_approval` y `activate_context_bridge_manifest_v2`: aprobación Owner, scope por acción/recurso/proyecto, expiración a 15 minutos y consumo de un solo uso.

Security Advisor no introdujo nuevos hallazgos `ERROR` después del DDL. Los WARN/INFO globales preexistentes continúan sujetos a revisión específica por objeto.

### Validación de release

Head exacto validado antes del merge: `f812da807a768a314e3e356df465fd4f2030f699`.

- GitHub CI #514: regression tests, typecheck, lint, build y full dependency audit en `success`.
- Vercel Preview: `dpl_ofuPpEjGJQAuv8ezLqdGyMcDeeeX`, `READY`, región `sfo1`, mismo head.
- Smoke anónimo de `/owner/context-bridge`: fail-closed hacia `/login`, con `noindex` y HSTS.
- Preview runtime: sin `error`/`fatal` en la ventana observada.
- Producción: `dpl_91oJDuwSppjdLdNScuv81uMQZp98`, `READY`, commit `e66bfa8428d10dfc5a423523f3c2180555aab38c`.
- Producción runtime: sin `error`/`fatal` en la ventana post-deploy observada.

## Cambio de estado respecto al addendum anterior

El texto anterior que clasificaba Context Bridge como **HOLD para migración AAL2** queda sustituido por este estado:

**VERIFIED para el control de código/deployment que obliga Owner+AAL2 en la activación web de Context Bridge.**

Esto no equivale a afirmar que una persona Owner concreta ya completó el enrollment TOTP en producción ni que ya existe una activación humana real observada con esa sesión. Esa ceremonia sigue pendiente de evidencia conectada y debe conservarse como requisito separado.

## Residuos controlados

- Supabase Security Advisor continúa reportando `Leaked Password Protection Disabled`. El conector disponible no expone una mutación de configuración Auth; no se utilizarán tokens del documento de credenciales para saltar ese límite.
- Los WARN de GraphQL de tablas sensibles revisadas no demostraron lectura global: `anon` no tenía `SELECT` en los objetos inspeccionados y las lecturas `authenticated` estaban restringidas por RLS según usuario/rol. No se revocarán grants de forma masiva sin evaluar consumidores y políticas por objeto.
- Permanecen WARN de funciones `SECURITY DEFINER`; deben revisarse individualmente antes de cambiar privilegios para no romper funciones públicas o user-scoped intencionales.
- `HealthIndicator.tsx` conserva compatibilidad con una identidad key-based para `/api/system/status`; ese contrato no forma parte de la activación de Context Bridge y requiere una migración separada antes de retirar compatibilidad.
- La rotación de secretos permanece reservada para la etapa final controlada.

## Regla de claims

Es válido afirmar que la activación web de Context Bridge **requiere y despliega Owner+AAL2**, que el path key-based quedó draft-only y que la evidencia de aprobación se liga al usuario Owner autenticado.

No es válido afirmar que el enrollment TOTP humano ya fue observado, que todo Owner Gate del ecosistema usa MFA, que el warning de leaked-password está cerrado, que todos los WARN de GraphQL/SECURITY DEFINER están resueltos o que la auditoría global está terminada.
