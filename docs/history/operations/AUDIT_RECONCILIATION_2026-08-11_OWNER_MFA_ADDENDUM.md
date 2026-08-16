# HOCKER Audit Reconciliation — Owner MFA Addendum — 2026-08-11

## Autoridad y alcance

Este addendum conserva la reconciliación base `AUDIT_RECONCILIATION_2026-08-11.md` como evidencia histórica y actualiza únicamente los controles de autenticación/Owner Gate verificados después de ese corte. Cuando exista conflicto sobre esos controles, prevalecen producción/configuración observable, `main`, tests y este addendum fechado; no sustituye DOC-00, DOC-05, DOC-06 o DOC-07.

No se modificaron ni rotaron credenciales durante este bloque. El documento de credenciales no fue utilizado para ejecutar pruebas de autorización.

## Estado productivo al cierre

- Hocker ONE `main`: `d2372ab4c9178f1b2fc5638136495e206b0ed271`.
- Vercel production: `dpl_792t9cbotqTa42Yko5YudH4wdmDJ`, `READY`, región `sfo1`, commit GitHub verificado.
- Build productivo: Next.js `16.2.12`, TypeScript completado y `npm ci` con `0 vulnerabilities` en el corte observado.
- Smokes anónimos de `/owner/actions` y `/governance`: terminan en la superficie `/login`; HSTS permanece activo.
- No se observaron logs `error`/`fatal` en la ventana post-deploy del deployment citado.

## PR #161 — Chido admin Owner-only

Merge productivo: `8640b9b80d3e824bb2a84ced6cbc7ce961211d1d`.

Se corrigió `/api/chido/admin` para impedir que una identidad interna válida pudiera ejecutar operaciones administrativas de Chido. El endpoint quedó Owner-only antes de introducir MFA. La corrección no modificó semántica de KYC, settlement, ledger ni kill-switch.

## PR #162 — sesión humana Owner + AAL2 para Chido admin

Merge productivo: `34543ca37445a225827ad79c8c0141542d0c70fc`.

Controles verificados:

- gate server-only basado en Supabase Auth;
- usuario autenticado mediante `auth.getUser()`;
- membership exacta `project_members.role = owner`;
- evaluación de `auth.mfa.getAuthenticatorAssuranceLevel()`;
- `currentLevel = aal2` requerido para acceso administrativo crítico;
- flujo `/auth/mfa` con TOTP enrollment/challenge usando las APIs MFA de Supabase;
- `/chido/admin` comprueba Owner+AAL2 antes de crear el cliente `service_role` para lecturas KYC/pagos;
- `/api/chido/admin` usa sesión Owner+AAL2 y registra el `userId` autenticado en el actor de auditoría;
- ausencia de variables Auth falla cerrado y no genera cliente Supabase inválido.

Un Preview inicial reveló un HTTP 500 cuando faltaban variables públicas de Auth. La rama fue corregida para fallar cerrado; el head final pasó CI y Preview antes de promoción.

### Límite de evidencia

Existe código, build, deployment y comportamiento fail-closed verificados. **No existe todavía evidencia conectada de que una persona Owner haya completado el enrollment TOTP en producción.** No debe describirse el factor humano como enrolado hasta observar esa ceremonia con una sesión Owner real.

## PR #163 — publicación canónica de memoria con step-up

Merge productivo: `8193084fb43c187321616ca2ba6fa15d28960e29`.

- `POST /api/agi/runtime/memory/review` exige Owner+AAL2 para el proyecto objetivo.
- `GET` conserva lectura RBAC y no publica memoria.
- La ruta legacy de review conserva identidad de servicio para revisiones no publicadoras.
- `publish_to_memory=true` en la ruta legacy añade obligatoriamente Owner+AAL2 y utiliza `session_owner` como actor efectivo.
- La semántica de publicación de SYNTIA, tablas y retención no fue ampliada.

Producción asociada a este corte intermedio: `dpl_3JDeMkR3zUZxChnLT4gpow5sTeqj`, `READY`, con smoke `/memory/review` fail-closed a login y sin `error`/`fatal` en la ventana observada.

## PR #164 — AAL2 selectivo para decisiones de alto impacto

Merge productivo final del bloque: `d2372ab4c9178f1b2fc5638136495e206b0ed271`.

La política quedó deliberadamente proporcional:

- aprobar `agi_action_queue` requiere Owner+AAL2;
- rechazar una acción conserva el gate Owner existente porque reduce riesgo;
- aprobar, firmar y encolar un command requiere Owner+AAL2;
- rechazar/cancelar un command conserva el gate owner/admin existente;
- desactivar `kill_switch` o habilitar `allow_write` requiere Owner+AAL2;
- activar contención (`kill_switch=true`, `allow_write=false`) continúa disponible para owner/admin sin fricción MFA adicional.

No se modificaron HMAC, dispatch, service identities, schema ni migraciones.

## Verificación de no-bypass de ejecución

La revisión posterior confirmó dos invariantes:

1. El worker AGI/MCP reclama acciones de forma atómica únicamente desde `status = approved`; para MCP además exige `requires_approval = true`.
2. El Hocker Node Agent y el orquestador cloud consumen únicamente commands con `status = queued` y `needs_approval = false`; el Node Agent vuelve a verificar firma HMAC antes de ejecutar.

Estado productivo observado después del hardening:

- `agi_action_queue`: 7 `executed`, 3 `rejected`, **0 `approved` pendientes**.
- `commands`: 27 `done`, 8 `canceled`, 4 `needs_approval`, **0 `queued`** en el corte consultado.
- Las 4 órdenes `needs_approval` tenían `approved_at = NULL`; aunque ya contienen firma HMAC por diseño legacy de creación, no son consumibles porque los workers filtran estado y `needs_approval` antes de verificar/ejecutar.

## Context Bridge — estado correcto

Context Bridge conserva el Owner Gate evidence-bound de un solo uso, pero la activación humana todavía depende del gate key-based. No se localizó una UI Owner que pueda completar AAL2 para `activate_context_bridge_manifest_v2`.

Por tanto:

- no se debe describir Context Bridge como AAL2-bound todavía;
- migrarlo unilateralmente a sesión MFA sin una superficie humana de activación podría bloquear operación legítima;
- estado: **HOLD para migración AAL2 hasta implementar UI Owner/session + pruebas + rollback**.

## Residuos controlados

- `AdminPanel.tsx` conserva código cliente obsoleto que intenta leer `window.__HOCKER_OWNER_KEY`; desde PR #162 `/api/chido/admin` ya no usa ese header. No se observó una asignación de esa global en el repositorio. Su retiro queda como cleanup separado para evitar reemplazar de forma riesgosa un componente grande con el conector disponible.
- `HealthIndicator.tsx` también contempla esa global, pero `/api/system/status` sigue siendo una superficie legítima Owner/internal para identidades de servicio. No debe eliminarse allí sin migrar primero el contrato de status.
- Supabase Security Advisor continúa reportando `Leaked Password Protection Disabled`; no se aplicó porque el conector actual no expone la mutación Auth/plan necesaria y no se utilizarán tokens del documento de credenciales para saltar ese límite.
- La rotación de secretos permanece reservada para la etapa final controlada.

## Regla de claims

A partir de este addendum es válido afirmar que las superficies citadas de Hocker ONE **implementan y despliegan step-up Owner+AAL2**. No es válido afirmar que existe enrollment TOTP humano verificado, que todo Owner Gate del ecosistema ya usa MFA, que Context Bridge está AAL2-bound o que los advisories de seguridad globales están completamente cerrados.
