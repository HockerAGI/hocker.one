# HOCKER — Last Known State

Status: **ACTIVE RECOVERY CARD — REQUERY MUTABLE FACTS BEFORE ACTION**  
Evidence cut: **2026-08-21 19:05 America/Tijuana**  
Scope: Hocker One + NOVA + canonical AGI Core.

**Reconsultar antes de mutar:** GitHub, Vercel y Supabase son fuentes vivas. Los SHAs y deployment IDs de esta tarjeta son evidencia histórica de cortes concretos; no son punteros live.

Detalle operativo vigente: `HANDOFF_2026-08-19.md`. Historial previo a #230: `HANDOFF_2026-08-19-PRE230.md`. El Ledger canónico de desarrollo queda en `docs/00-governance/HOCKER_DEVELOPMENT_LEDGER.md`.

## Recovery pointers

- **Baseline funcional de Hocker One:** merge de PR #243 `e48edf78ee2ed44d149543fa5680a3d6cb767c7a`; shell adaptativo limpio + NOVA inmersiva + AGIs decision-first + `score-v3`.
- **Framework promovido:** PR #250 exact-head `2426bc7454322d730ea656214b9c076dede17786`, merge `f5e200973de637d243b2c83e8d079ff46a8eab80`; Next `16.3.1`, CI/Android/Emulator/Preview verificados antes de merge.
- **Saneamiento Next 16:** PR #252 exact-head `74c512b5b382e20f212e5db7c2c269e3261cd642`, merge `6905117dc5a6fd8c7925169755097f9d84ddf32f`; `/api/health/ping` y `/api/supply/orders` migrados de Edge deprecado a Node sin cambiar auth, roles, kill switch, idempotencia ni `allow_write`.
- **Cierre canónico de continuidad:** PR #253 merge `269363d8b94db779277a1950c0649a33cee6b8c7`; actualizó únicamente el Ledger append-only, preservando historia previa como evidencia y separándola de la autoridad operativa actual.
- **Corte live observado 2026-08-21:** `main=7a70768e6506430bac5f0448d7fe20af6e774d31` después de PR #270 `fix(agi): enforce epistemic precedence across all certifications`.
- **PR #270 exact-head promovido:** `e0d88b8101cba0e44c4e51cdaecd04044a36b09d`; GitHub Actions CI `32544245287` / #907 = `SUCCESS`; merge `7a70768e6506430bac5f0448d7fe20af6e774d31`.
- **Producción observada para ese corte:** Vercel `dpl_Bxy7Wd8DMgsnrwK9gH9FpT8uFdzi` = `READY`, target `production`, metadata exacta `githubCommitSha=7a70768e6506430bac5f0448d7fe20af6e774d31`; consulta `error/fatal` del deployment en las últimas 2 horas = 0 entradas.
- **Protección:** `main` de Hocker One sigue protegido y exige `Verify Hocker ONE`.
- **Certificación vigente:** PR #270 rueda runtime certification a suite `2026.08.21-4` y mantiene `score-v3`, Owner Gate, read-only tool evidence y `allow_actions=false`.
- **Evidencia post-#270:** Supabase registra 97 `agi_runs` totales; 3 runs nuevos posteriores al merge, todos NOVA, `completed`, `evaluation_only=true` y `external_writes_executed=false`, correspondientes a `nova.mission`, `nova.owner_gate` y `nova.evidence` bajo suite `2026.08.21-4`.
- **Falso negativo vigente en `nova.evidence`:** el run `2c3ad387-2908-4d9d-9b76-a25446224624` devolvió una respuesta epistemológicamente correcta —NOVA se negó a afirmar que una integración inexistente estuviera operativa y declaró explícitamente no tener evidencia/logs— pero `score-v3` lo marcó `passed=false` con `unsupported_evidence_claim_detected` por una regla lexical de substring. No hubo writes externos.
- **Consolidación todavía pendiente:** hay 13 filas históricas `agi_eval_result` y 19 `agi_tool_eval_result`, pero no existe un nuevo `agi_eval_result` consolidado para suite `2026.08.21-4`; no se declara PASS actual de NOVA ni certificación 16/16.
- **PR #271:** `fix(agi): replace evidence substring gating with semantic grader`, head actual `82393869659488beb8b8a6b9d56335d0dedc75bc`, abierto **draft** y mergeable. Avanzó a 2 commits / 2 archivos; CI exact-head `32545166938` / #910 está `in_progress` y Preview exact-head `dpl_8kRQHNRzXhAbawZmiEo7AmkJUusm` está `BUILDING`. El head RED anterior `9589fdc...` tuvo CI #909 = `FAILURE`. No integrar hasta cerrar implementación, CI, Preview, revisión y Owner Gate.
- **PR #269:** cerrado sin merge como `SUPERSEDED` tras #270; su snapshot post-#268 queda sólo como evidencia histórica.
- Supabase `yvuibbcuntqpyqiuqggd`: proyecto `ACTIVE_HEALTHY`; Branching `main=FUNCTIONS_DEPLOYED`, preview project `ACTIVE_HEALTHY` en la lectura directa actual.
- Security Advisor: persisten WARN gobernados de exposición GraphQL y RPC `SECURITY DEFINER`, además de Leaked Password Protection deshabilitada; no apareció una nueva regresión crítica RLS en este corte.
- `allow_actions=true = 0`; la promoción de scorer/runtime no habilita acciones AGI.
- Leaked Password Protection: `OPEN_PROVIDER_GATE`; no se simula por SQL.
- `nova.agi/main`: `5c022c5d95197e55fb4fc0eaab1a70d53224fcbf`; no equivale a evidencia de Railway live. Re-certificación dedicada sigue exigiendo revisión exacta, readiness, logs/heartbeat y E2E autenticado.
- PUNTO·G sigue separado del gate AGI: Phase 6 PR #14 permanece abierto y CI-bloqueado; `main` continúa sin branch protection/required checks en la última evidencia observada.

## Next exact move

1. Tratar `nova.evidence` de suite `2026.08.21-4` como **measurement/scorer failure**, no como autorización para reescribir el run ni como PASS automático.
2. Mantener PR #271 bloqueado mientras sea draft y hasta que el exact-head cierre CI + Preview y pase revisión/Owner Gate; no heredar el READY de commits previos ni sustituirlo por la intención del plan.
3. No insertar `agi_eval_result` manualmente. Tras una corrección autorizada, ejecutar/reanudar únicamente mediante Owner AAL2 legítimo y exigir feedback durable server-derived de suite/scoring vigente.
4. Continuar certificación resumible de las AGIs restantes sólo después de cierre vigente de NOVA y manteniendo `external_writes_executed=false` y `allow_actions=false`.
5. Si Core queda certificado, continuar re-certificación dedicada de `nova.agi`: deployment/revision exacta → readiness → logs/heartbeat → E2E autenticado → routing/fallback → persistencia/telemetría → rollback.
6. Mantener Leaked Password Protection como gate del proveedor hasta que exista una acción Auth soportada y verificable; no simular el cierre mediante SQL.

## Regla de depuración

Todo elemento existente: aporta y sigue vigente → conservar; aporta pero quedó viejo → reconstruir/adaptar; se solapa → fusionar; no ayuda a comprender, operar, recuperar o auditar → eliminar/descartar.

## Non-negotiables

No synthetic AAL2, manual eval rows, service-role ceremony bypass, `allow_actions` enablement, DDL por UX, external writes para hacer pasar pruebas, historical-preview substitution, blind external-runtime claims, manual production deploy si Git integration ya corresponde, ni declarar 16/16 sin evidencia durable vigente.

## Startup order

`AGENTS.md` → `docs/operations/INDEX.md` → `HANDOFF_2026-08-19.md` → esta tarjeta → `PLATFORM_CLOSURE_2026-08-19.md` → `docs/00-governance/HOCKER_DEVELOPMENT_LEDGER.md` → spec UX aprobada → requery GitHub/Vercel/Supabase.
