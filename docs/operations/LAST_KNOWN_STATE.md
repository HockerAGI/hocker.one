# HOCKER — Last Known State

Status: **ACTIVE RECOVERY CARD — REQUERY MUTABLE FACTS BEFORE ACTION**  
Evidence cut: **2026-08-21 14:10 America/Tijuana**  
Scope: Hocker One + NOVA + canonical AGI Core.

**Reconsultar antes de mutar:** GitHub, Vercel y Supabase son fuentes vivas. Los SHAs, deployment IDs y conteos de esta tarjeta son evidencia de un corte concreto; no son punteros perpetuos.

Detalle histórico/operativo: `HANDOFF_2026-08-19.md`. Ledger canónico: `docs/00-governance/HOCKER_DEVELOPMENT_LEDGER.md`.

## Recovery pointers

- **Hocker One `main`:** `3296c83209eb9f4d2ce95f851cd7d0dde8a883ba`, merge Owner-authorized de PR #264 `fix(agi): make mission certification probes self-contained`.
- **Candidato #264 promovido:** `a749aadc9b4ff904a24e1ca940ae716556af7196`; GitHub Actions CI #891 / `32524908156` = `SUCCESS` con 260/260 regression tests, typecheck, lint, build y full dependency audit en verde.
- **Producción exacta:** Vercel `dpl_7iNcytvob3J7ExY1vPJSTAwdxe7d` = `READY`, target `production`, metadata `githubCommitSha=3296c83209eb9f4d2ce95f851cd7d0dde8a883ba`; consulta `error`/`fatal` en la ventana auditada = 0 entradas.
- **Protección:** `main` continúa protegido; cualquier promoción debe respetar `Verify Hocker ONE` y los Owner Gates aplicables.
- **PR #263:** cerrado sin merge como `SUPERSEDED`; contenía punteros post-#262 y evidencia anterior a #264.
- **PR #261:** sigue abierto pero está obsoleto para autoridad corriente; conserva evidencia histórica post-#259 y no debe promoverse sobre el corte actual sin reconciliación.
- **Supabase:** proyecto `yvuibbcuntqpyqiuqggd`; branch `main=FUNCTIONS_DEPLOYED`, preview project `ACTIVE_HEALTHY`.
- **Inventario AGI directo:** 16 AGIs / 16 agentes / `allow_actions=true = 0`.
- **Evidencia durable actual:** 86 `agi_runs` totales; 12 `agi_eval_result`; 19 `agi_tool_eval_result`.
- **Tool certification:** la ceremonia `2026.08.21-1` produjo **19/19 read-only tool probes PASS**, `external_writes_executed=false`; #264 no invalida esa evidencia por el roll de runtime suite.
- **Runtime suite vigente:** `2026.08.21-2`, scoring `score-v3`.
- **NOVA suite -2:** misión / Owner Gate / evidencia = **PASS / PASS / PASS**; aggregate durable `agi_eval_result` = PASS 3/3; `external_writes_executed=false`.
- **SYNTIA suite -2:** misión = PASS; Owner Gate = PASS; `evidence` no completó por tres fallos transitorios consecutivos del proveedor: `Free tier requests on this model are rate-limited`. No existe aggregate PASS/FAIL final de SYNTIA para -2 en este corte.
- **Certificación Core:** **NO 16/16**. No continuar como si el rate limit fuera un fallo semántico de SYNTIA ni fabricar feedback/evidence para cerrarlo.
- **Security Advisor:** sin nueva regresión crítica de RLS; persisten WARN gobernados de GraphQL/`SECURITY DEFINER` y Leaked Password Protection deshabilitada.
- **NOVA dedicada:** `nova.agi/main=5c022c5d95197e55fb4fc0eaab1a70d53224fcbf`; Railway exact live revision/readiness/logs/authenticated Hocker One→NOVA E2E siguen `PENDING EVIDENCE`.
- **PUNTO·G:** Phase 6 sigue release-gated; PR #14 permanece con exact-head CI rojo y `punto.g/main` continúa sin branch protection/required checks en el último corte verificado.

## Next exact move

1. **No repetir NOVA ni los 19 tool probes**: reutilizar únicamente evidencia exact-suite/exact-version que el servidor marque válida.
2. Reanudar la ceremonia Owner AAL2 desde `syntia.evidence` cuando el proveedor deje de rate-limitar; no introducir créditos/configuración de proveedor sin Owner/procurement gate.
3. Reconsultar `agi_runs` + `agi_feedback` después del retry. Sólo si SYNTIA completa 3/3, continuar secuencialmente con las AGIs restantes.
4. Mantener `allow_actions=false`; certificación no habilita acciones materiales automáticamente.
5. Mantener Leaked Password Protection como provider gate real; no simular cierre mediante SQL.
6. Tras Core 16/16 + tool-evals requeridos, re-certificar `nova.agi` con revision exacta → `/health/ready` → logs/heartbeat → E2E autenticado → routing/fallback → persistencia/telemetría → rollback.

## Stop conditions

Detener certificación/promoción si catálogo != 16, aparece `allow_actions=true`, AAL2 no es real, el snapshot server-derived es parcial, existe un write externo no autorizado, se intenta reinterpretar fallos de proveedor como PASS/FAIL semántico, producción deja de apuntar al release esperado o falta evidencia para afirmar un runtime externo.

## Non-negotiables

No synthetic AAL2, manual eval rows, service-role ceremony bypass, `allow_actions` enablement, DDL para hacer pasar UX/evals, external writes para superar pruebas, reescritura histórica, sustitución de exact-head evidence por previews viejos, ni declarar 16/16 sin evidencia durable vigente.

## Startup order

`AGENTS.md` → `docs/operations/INDEX.md` → `HANDOFF_2026-08-19.md` → esta tarjeta → `PLATFORM_CLOSURE_2026-08-19.md` → `docs/00-governance/HOCKER_DEVELOPMENT_LEDGER.md` → requery GitHub/Vercel/Supabase.
