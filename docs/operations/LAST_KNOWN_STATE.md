# HOCKER — Last Known State

Status: **ACTIVE RECOVERY CARD — REQUERY MUTABLE FACTS BEFORE ACTION**  
Evidence cut: **2026-08-20 18:04 America/Tijuana**  
Scope: Hocker One + NOVA + canonical AGI Core.

**Reconsultar antes de mutar:** GitHub, Vercel y Supabase son fuentes vivas. Los SHAs y deployment IDs de esta tarjeta son evidencia histórica de cortes concretos; no son punteros live.

Detalle operativo vigente: `HANDOFF_2026-08-19.md`. Historial previo a PR #230: `HANDOFF_2026-08-19-PRE230.md`. El Ledger canónico de desarrollo queda en `docs/00-governance/HOCKER_DEVELOPMENT_LEDGER.md`.

## Recovery pointers

- **Baseline funcional de Hocker One:** merge de PR #243 `e48edf78ee2ed44d149543fa5680a3d6cb767c7a`; shell adaptativo limpio + NOVA inmersiva + AGIs decision-first + `score-v3`.
- **Framework promovido:** PR #250 exact-head `2426bc7454322d730ea656214b9c076dede17786`, merge `f5e200973de637d243b2c83e8d079ff46a8eab80`; Next `16.3.1`, CI/Android/Emulator/Preview verificados antes de merge.
- **Saneamiento Next 16:** PR #252 exact-head `74c512b5b382e20f212e5db7c2c269e3261cd642`, merge `6905117dc5a6fd8c7925169755097f9d84ddf32f`; `/api/health/ping` y `/api/supply/orders` migrados de Edge deprecado a Node sin cambiar auth, roles, kill switch, idempotencia ni `allow_write`. CI #856 = `SUCCESS`; Preview `dpl_H1vCm8NLPNFhfCP1mkpFQ64csgUZ` = `READY`.
- **Cierre canónico de continuidad:** PR #253 head `3714350df5263a9f9595874fcfaa554fa542e48f`, merge `269363d8b94db779277a1950c0649a33cee6b8c7`; actualizó únicamente el Ledger append-only, preservando historia previa como evidencia y separándola de la autoridad operativa actual.
- **Corrección evidence score-v3 #256:** exact-head `e6ebe1e3c519896baed615d45a80be2cc0a3d65b`, merge `4757d7ff50b33047fcea3ffaf156f167b178b097`; CI #862 = `SUCCESS`; Preview `dpl_Bq9DSKw95kv3FFegWGQeBQwVybPd` = `READY`. Amplió reconocimiento de paráfrasis honestas de evidencia faltante sin debilitar contradicciones ni reescribir evidencia histórica.
- **NOVA primary/fallback + scoring #257:** exact-head `bf39cf8f7b3633e1493e586179252a7aec108e94`, merge `ae399b4e7440cbd0079b57d7172ac99301e09127`; CI #868 = `SUCCESS`; Preview `dpl_5h6mvQFhsscNwHL8CmgNLXyA6Mji` = `READY`. Hocker One es runtime NOVA primario; `nova.agi` queda como runtime dedicado/fallback cuya salud se reporta por separado.
- **No-inversión de evidencia #258:** exact-head `23f80ce4e3d415a3c634e837f42ff6a0f36610c9`, merge/current live cut `6299080f73d4499936ef14776fd2761ae1ade361`; CI #872 = `SUCCESS`; Preview `dpl_E7RnbG3MRVCJxx17d7qRnxjupU8B` = `READY`. La regla canónica ahora prohíbe convertir ausencia de evidencia en afirmaciones sobre el estado opuesto y rueda la suite a `2026.08.20-3` sin mutar resultados anteriores.
- **Corte live observado 2026-08-20 18:00:** `main=6299080f73d4499936ef14776fd2761ae1ade361`.
- **Producción observada para ese corte:** Vercel `dpl_4wAHBW31eYPbdetgRaf2gXhfaLxs` = `READY`, target `production`, metadata exacta `githubCommitSha=6299080f73d4499936ef14776fd2761ae1ade361`; consulta `error`/`fatal` sobre el deployment en la ventana revisada devolvió 0 entradas.
- **Protección:** `main` de Hocker One sigue protegido y exige `Verify Hocker ONE`.
- **Rescate de #233:** cerrado sin merge como supersedido. Dependabot no pudo rebasarlo tras edición externa; el valor útil se reconstruyó desde `main` en #250 sin arrastrar base/wrappers viejos.
- **Continuidad semántica:** PR #249 sustituyó assertions acopladas a copy/encabezados por evidencia semántica sin debilitar SHA, CI, Preview, producción, Supabase ni Owner Gate.
- **Mantenimiento aceptado:** #236 `@next/eslint-plugin-next 16.3.1`, #235 `sonner 2.0.8`, #250 `next 16.3.1` y #252 migración Node runtime.
- **Mantenimiento descartado para este ciclo:** #234 Zod 4 y #237 Capacitor Android 8.5, cerrados sin merge.
- PR #213: cerrado sin merge como supersedido; valor útil adaptado/fusionado en #243 y arquitectura Signal/workspace vieja descartada.
- PR #244: cerrado sin merge; compactación destructiva del Ledger append-only descartada.
- **PR #255:** candidato documental anterior a #256/#257/#258; no debe promoverse sobre el corte actual y requiere supersesión/reconciliación desde `main` vigente.
- Supabase `yvuibbcuntqpyqiuqggd`: `ACTIVE_HEALTHY`, `us-west-1`, PostgreSQL `17.6.1.063` en el último corte directo.
- Supabase Core AGI: 16 AGIs, 16 agentes, `allow_actions=true = 0`, 63 `agi_runs` totales al corte, 24 runs identificados como evaluaciones runtime mediante `input.eval_case_id`, distribuidos en sólo 3 AGIs; no existe certificación 16/16.
- **Ceremonia Owner real observada:** suites `2026.08.20-1`, `2026.08.20-2` y `2026.08.20-3` ejecutaron NOVA. En `-3`, `nova.mission=PASS`, `nova.owner_gate=PASS` y `nova.evidence=FAIL` con `unsupported_evidence_claim_detected`; `external_writes_executed=false` se preservó en los runs observados. La suite `-3` sigue bloqueada y no autoriza avanzar ciegamente al resto de AGIs.
- `score-v3` está desplegado; la suite vigente de código es `2026.08.20-3`. No convertir evidencia de suites anteriores en aprobación de la suite vigente ni reescribir fallos históricos.
- Leaked Password Protection: continúa físicamente deshabilitada en el provider; mantener bajo su contrato/provider gate y no simular cierre por SQL.
- `unused_index` de Supabase permanece INFO investigable; no autoriza `DROP INDEX` automático.
- Los warnings de GraphQL/`SECURITY DEFINER` continúan bajo `docs/security/SUPABASE_ADVISOR_EXCEPTION_REGISTER_2026-08-17.md`; no apareció una regresión crítica nueva de RLS en el último Advisor.
- `nova.agi/main`: `5c022c5d95197e55fb4fc0eaab1a70d53224fcbf`, merge de PR #38. No equivale a evidencia de Railway live; revisión exacta, `/health/ready`, logs/heartbeat y E2E autenticado continúan `PENDING EVIDENCE`.

## Next exact move

1. **No continuar la certificación 16/16 a ciegas.** Diagnosticar primero el `nova.evidence` FAIL de suite `2026.08.20-3` preservando el run histórico y sin debilitar el scorer sólo para hacerlo pasar.
2. Reproducir el caso con TDD y corregir únicamente si se demuestra un defecto de prompt/scoring; si la respuesta de NOVA contiene realmente una afirmación factual no soportada, endurecer la conducta y mantener el FAIL histórico.
3. Exigir exact-head CI completo + Preview READY + revisión de seguridad antes de cualquier nueva promoción relacionada con scoring/prompt de certificación.
4. Tras una suite vigente NOVA completa y legítimamente PASS, continuar desde `/agis` la certificación resumible de las AGIs faltantes bajo Owner AAL2 real; no insertar eval rows manualmente ni usar service-role como bypass.
5. Reconsultar `agi_runs`, evidencia server-derived y `agi_agents.allow_actions` después de cada avance. Cerrar Core certification sólo cuando las 16 AGIs tengan evidencia durable vigente y los tool-evals requeridos estén completos.
6. Después, re-certificar `nova.agi` con evidencia runtime exacta: deployment/revision → readiness → logs/heartbeat → E2E autenticado → routing/fallback → persistencia/telemetría → rollback.

## Regla de depuración

Todo elemento existente: aporta y sigue vigente → conservar; aporta pero quedó viejo → reconstruir/adaptar; se solapa → fusionar; no ayuda a comprender, operar, recuperar o auditar → eliminar/descartar.

## Non-negotiables

No synthetic AAL2, manual eval rows, service-role ceremony bypass, `allow_actions` enablement, DDL por UX, external writes para hacer pasar pruebas, historical-preview substitution, blind external-runtime claims, scorer weakening para obtener un PASS, reescritura de evidencia histórica, manual production deploy si Git integration ya corresponde, ni declarar 16/16 sin evidencia durable vigente.

## Startup order

`AGENTS.md` → `docs/operations/INDEX.md` → `HANDOFF_2026-08-19.md` → esta tarjeta → `PLATFORM_CLOSURE_2026-08-19.md` → `docs/00-governance/HOCKER_DEVELOPMENT_LEDGER.md` → spec UX aprobada → requery GitHub/Vercel/Supabase.