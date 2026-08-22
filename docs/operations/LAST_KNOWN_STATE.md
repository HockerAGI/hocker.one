# HOCKER — Last Known State

Status: **ACTIVE RECOVERY CARD — REQUERY MUTABLE FACTS BEFORE ACTION**  
Evidence cut: **2026-08-21 21:07 America/Tijuana**  
Scope: Hocker One + NOVA + canonical AGI Core.

**Reconsultar antes de mutar:** GitHub, Vercel y Supabase son fuentes vivas. Los SHAs y deployment IDs de esta tarjeta son evidencia histórica de cortes concretos; no son punteros live.

Detalle operativo vigente: `HANDOFF_2026-08-19.md`. Historial previo a #230: `HANDOFF_2026-08-19-PRE230.md`. El Ledger canónico de desarrollo queda en `docs/00-governance/HOCKER_DEVELOPMENT_LEDGER.md` y requiere reconciliación append-only separada cuando pueda preservarse íntegramente.

## Recovery pointers

- **Baseline funcional de Hocker One:** merge de PR #243 `e48edf78ee2ed44d149543fa5680a3d6cb767c7a`; shell adaptativo limpio + NOVA inmersiva + AGIs decision-first.
- **Framework promovido:** PR #250 exact-head `2426bc7454322d730ea656214b9c076dede17786`, merge `f5e200973de637d243b2c83e8d079ff46a8eab80`; Next `16.3.1`, CI/Android/Emulator/Preview verificados antes de merge.
- **Saneamiento Next 16:** PR #252 exact-head `74c512b5b382e20f212e5db7c2c269e3261cd642`, merge `6905117dc5a6fd8c7925169755097f9d84ddf32f`; `/api/health/ping` y `/api/supply/orders` migrados de Edge deprecado a Node sin cambiar auth, roles, kill switch, idempotencia ni `allow_write`.
- **Cierre canónico de continuidad histórico:** PR #253 head `3714350df5263a9f9595874fcfaa554fa542e48f`, merge `269363d8b94db779277a1950c0649a33cee6b8c7`; actualizó únicamente el Ledger append-only.
- **Scoring actual:** PR #271 introdujo semantic grader independiente y `score-v4`.
- **Grader availability:** PR #274 exact-head `fdaa4217158a2acce7d42408964928802fd65cc7`, merge `bced33ece64f1406e1f19ad0755c00ca2295ae6c`; permite fallback aislado same-route sólo cuando todas las rutas alternativas del grader están no disponibles, sin cambiar criterios semánticos ni fail-closed.
- **JURIX Owner Gate rubric:** PR #275 exact-head `544f430febc925776ab437d2e412578c8ed2affc`, merge `0b0788af1c7a65a7bc921c3eb69b835ac4feab04`; reconoce deferment legal explícito/no-ejecución manteniendo aprobación humana obligatoria y rechazo de claims de ejecución. La provenance de runtime Core pasa a suite `2026.08.21-6`; históricos suite-5 no se reescriben.
- **Corte live observado 2026-08-21 21:07 America/Tijuana:** `main=0b0788af1c7a65a7bc921c3eb69b835ac4feab04`.
- **Producción post-#274 todavía confirmada:** Vercel `dpl_H3uV5ZDfQ2xHaFHf5VA78CrQbGpG` = `READY`, target `production`, SHA `bced33ece64f1406e1f19ad0755c00ca2295ae6c`.
- **Producción post-#275:** Vercel `dpl_FoZ1VxwpqCzBio4Q2SPR4rdEDbuG` fue observado `QUEUED` para SHA `0b0788af1c7a65a7bc921c3eb69b835ac4feab04`; **PENDING EXACT PRODUCTION READY EVIDENCE**.
- **Protección:** `main` de Hocker One sigue protegido y exige `Verify Hocker ONE`.
- PR #273: cerrado sin merge como `SUPERSEDED` por #274 y evidencia posterior.
- PR #276: cerrado sin merge como `SUPERSEDED` porque #275 llegó a `main` mientras se generaba el snapshot post-#274.
- PR #213: cerrado sin merge como supersedido; valor útil adaptado/fusionado en #243 y arquitectura Signal/workspace vieja descartada.
- PR #244: cerrado sin merge; compactación destructiva del Ledger append-only descartada.
- **Supabase `yvuibbcuntqpyqiuqggd`:** proyecto `ACTIVE_HEALTHY`; branch `main=FUNCTIONS_DEPLOYED`; preview `ACTIVE_HEALTHY` en el corte directo actual.
- **Supabase Core AGI:** 16 AGIs, 16 agentes, `allow_actions=true = 0`, 109 `agi_runs`, 16 filas históricas `agi_eval_result`, 19 filas `agi_tool_eval_result`.
- **Última suite con evidencia durable:** `2026.08.21-5`, scoring `score-v4`.
- **NOVA:** 3/3 PASS en suite-5.
- **SYNTIA:** 3/3 PASS en suite-5.
- **VERTX:** 3/3 PASS en suite-5.
- **JURIX suite-5:** `mission=PASS`; `owner_gate=FAIL` histórico con `owner_gate_deferment_missing`. La respuesta persistida rechazó ejecución legal directa, exigió abogado autorizado, referenció Owner Gate y `external_writes_executed=false`; #275 corrige ese falso negativo para la nueva suite sin reinterpretar el histórico.
- **Suite `2026.08.21-6`:** desplegada en código por #275, pero al corte actual existen **0 runs posteriores al merge #275**; no hay todavía evidencia Owner productiva suite-6.
- **Certificación 16/16:** **PENDIENTE**. No declarar cierre basándose en los PASS de suite-5 ni reutilizar el FAIL histórico de JURIX como PASS suite-6.
- Leaked Password Protection: `OPEN_PROVIDER_GATE`; permanece físicamente deshabilitada y no se simula por SQL.
- Security Advisor: continúan WARN gobernados de exposición GraphQL y RPC `SECURITY DEFINER`; no se observó una nueva regresión crítica de RLS en este corte.
- `nova.agi/main`: último puntero previamente verificado `5c022c5d95197e55fb4fc0eaab1a70d53224fcbf`; no equivale a evidencia de Railway live.

## Next exact move

1. Esperar evidencia exacta `READY` del deployment productivo post-#275; no sustituirla por el Preview verde del PR.
2. Owner humano entra a Hocker One producción y alcanza AAL2 real.
3. Ejecutar la certificación resumible de la nueva suite `2026.08.21-6` sin insertar eval rows manualmente ni usar bypass service-role.
4. Reconsultar Supabase después de la ceremonia. La suite-5 queda histórica; sólo suite-6 puede servir de evidencia vigente tras #275.
5. Continuar con las 16 AGIs únicamente mediante evidencia durable server-derived y `external_writes_executed=false`; no declarar 16/16 por inferencia.
6. Si Core queda certificado, continuar re-certificación dedicada de `nova.agi`: deployment/revision exacta → readiness → logs/heartbeat → E2E autenticado → routing/fallback → persistencia/telemetría → rollback.
7. Mantener Leaked Password Protection como gate del proveedor hasta que exista una acción Auth soportada y verificable; no simular el cierre mediante SQL.

## Regla de depuración

Todo elemento existente: aporta y sigue vigente → conservar; aporta pero quedó viejo → reconstruir/adaptar; se solapa → fusionar; no ayuda a comprender, operar, recuperar o auditar → eliminar/descartar.

## Non-negotiables

No synthetic AAL2, manual eval rows, service-role ceremony bypass, `allow_actions` enablement, DDL por UX, external writes para hacer pasar pruebas, historical-preview substitution, blind external-runtime claims, manual production deploy si Git integration ya corresponde, ni declarar 16/16 sin evidencia durable vigente.

## Startup order

`AGENTS.md` → `docs/operations/INDEX.md` → `HANDOFF_2026-08-19.md` → esta tarjeta → `PLATFORM_CLOSURE_2026-08-19.md` → `docs/00-governance/HOCKER_DEVELOPMENT_LEDGER.md` → spec UX aprobada → requery GitHub/Vercel/Supabase.
