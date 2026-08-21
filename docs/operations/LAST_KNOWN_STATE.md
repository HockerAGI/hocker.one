# HOCKER — Last Known State

Status: **ACTIVE RECOVERY CARD — REQUERY MUTABLE FACTS BEFORE ACTION**  
Evidence cut: **2026-08-21 16:01 America/Tijuana**  
Scope: Hocker One + NOVA + canonical AGI Core.

**Reconsultar antes de mutar:** GitHub, Vercel y Supabase son fuentes vivas. Los SHAs, deployment IDs y estados de branching de esta tarjeta son evidencia de un corte concreto; no son punteros eternos.

Detalle operativo: `HANDOFF_2026-08-19.md`. Historial de gobierno: `docs/00-governance/HOCKER_DEVELOPMENT_LEDGER.md`. El Ledger conserva historia append-only y debe reconciliarse mediante un append seguro, nunca por compactación destructiva.

## Recovery pointers

- **Baseline funcional:** PR #243 `e48edf78ee2ed44d149543fa5680a3d6cb767c7a` consolidó shell adaptativo, NOVA inmersiva, AGIs decision-first y `score-v3`.
- **Router de certificación:** PR #266 fue promovido antes de este corte y eliminó el punto único de fallo del Gateway-only path conservando Owner Gate, read-only evals y `allow_actions=false`.
- **Corte live observado 2026-08-21:** `main=c15566208a6043750834292b1abbf73a6e2a002d` después de PR #268.
- **PR #268:** exact candidate `eb0a291028e91cb8ad6af2978e60aca921481852`; GitHub Actions CI `32532247633` / #901 = `SUCCESS`. El cambio protege claims condicionales/reportados en evidence scoring, elimina duplicación de pending-tool UX y rueda la certificación a suite `2026.08.21-3`. Historial previo permanece inmutable.
- **Producción observada para ese corte:** Vercel `dpl_CEPGTHZimLbt9pR9P2qxtvwwwet4` = `READY`, target `production`, metadata exacta `githubCommitSha=c15566208a6043750834292b1abbf73a6e2a002d`. Consulta `error`/`fatal` de la ventana revisada: sin entradas.
- **Protección:** `main` está protegido y exige `Verify Hocker ONE` para no-admins.
- **PR #267:** cerrado sin merge como `SUPERSEDED` por #268; no usar como autoridad actual.
- **NOVA dedicada:** `nova.agi/main=5c022c5d95197e55fb4fc0eaab1a70d53224fcbf`; exact current Railway revision, `/health/ready`, logs/heartbeat y E2E autenticado Hocker One→NOVA siguen `PENDING EVIDENCE`.
- **PUNTO·G:** `main=cf09c81cb533d1a3b65db16620fb5124748ba4cd`; `main` continúa `protected=false` y required status checks OFF. PR #14 permanece abierto y bloqueado por CI rojo; Phase 6 no está promovida.

## AGI certification state

- Canonical AGIs: **16**.
- Canonical agents: **16**.
- `allow_actions=true`: **0** en la última evidencia durable válida; no habilitar acciones para “hacer pasar” certificación.
- Owner certification sigue protegida por **AAL2** humano.
- `agi_eval_result` y `agi_tool_eval_result` deben derivarse del servidor y del suite/scoring vigente; nunca insertar filas manualmente ni reinterpretar evidencia histórica.
- La suite promovida por #268 es **`2026.08.21-3`**. El merge/deploy no constituye por sí mismo nueva evidencia 16/16; después del rollout debe reconsultarse la evidencia durable antes de afirmar progreso.
- Los resultados de suites anteriores permanecen históricos y no se reescriben retroactivamente.

## Supabase / security

- Proyecto primario `yvuibbcuntqpyqiuqggd`: `ACTIVE_HEALTHY` en este corte.
- **Contradicción de provider state abierta:** `list_branches` vuelve a reportar `main=MIGRATIONS_FAILED` (metadata de branch con `preview_project_status=ACTIVE_HEALTHY`) aunque cortes recientes habían observado `FUNCTIONS_DEPLOYED`. Tratar como **PENDING PROVIDER RECONCILIATION**; no asumir que el migration ledger está cerrado ni ejecutar reset/rebase/DDL destructivo para forzar el estado.
- Security Advisor sigue reportando WARN contractualmente conocidos de exposición GraphQL y RPC `SECURITY DEFINER`, además de Leaked Password Protection deshabilitada. No se observó en este corte una nueva regresión crítica RLS.
- Leaked Password Protection: `OPEN_PROVIDER_GATE`; no simular por SQL.

## Current blockers

1. **Certificación 16/16:** Owner AAL2 + evidencia server-derived del suite `2026.08.21-3`; no repetir/alterar evidencia válida ni fabricar tool-evals.
2. **Supabase branch-state contradiction:** resolver por evidencia de proveedor/migration ledger antes de declarar cierre de migraciones.
3. **Ledger:** snapshot interno sigue atrás de #268 y del estado actual de PUNTO·G; requiere `PENDING SAFE APPEND-ONLY RECONCILIATION` preservando íntegramente hitos históricos.
4. **PUNTO·G governance:** `main` no protegido; PR #14 continúa CI rojo.
5. **nova.agi live:** Railway exact revision/readiness/logs/authenticated E2E siguen `PENDING EVIDENCE`.

## Next exact move

1. Reconsultar Supabase provider branch/migration state; no mutar mientras exista contradicción entre `MIGRATIONS_FAILED` y evidencia anterior `FUNCTIONS_DEPLOYED`.
2. Owner humano entra a Hocker One producción y alcanza AAL2 real.
3. Ejecutar/reanudar certificación bajo suite `2026.08.21-3` desde el primer caso faltante; no insertar `agi_eval_result`/`agi_tool_eval_result` manualmente.
4. Reconsultar evidencia server-derived; declarar 16/16 sólo si las 16 AGIs y tool-evals requeridos cierran bajo el suite vigente.
5. Reconciliar el Ledger mediante append seguro una vez preservado byte-completamente su historial.
6. No promover PUNTO·G Phase 6 mientras PR #14 siga rojo y `main` carezca de enforcement.

## Non-negotiables

No synthetic AAL2, manual eval rows, service-role ceremony bypass, `allow_actions` enablement, DDL por UX, external writes para hacer pasar pruebas, historical-preview substitution, blind external-runtime claims, reset/rebase destructivo de Supabase para ocultar drift, ni declarar 16/16 sin evidencia durable vigente.

## Startup order

`AGENTS.md` → `docs/operations/INDEX.md` → `HANDOFF_2026-08-19.md` → esta tarjeta → `PLATFORM_CLOSURE_2026-08-19.md` → `docs/00-governance/HOCKER_DEVELOPMENT_LEDGER.md` → requery GitHub/Vercel/Supabase.
