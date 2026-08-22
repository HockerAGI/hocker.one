# HOCKER — Last Known State

Status: **ACTIVE RECOVERY CARD — REQUERY MUTABLE FACTS BEFORE ACTION**  
Evidence cut: **2026-08-21 21:06 America/Tijuana**  
Scope: Hocker One + NOVA + canonical AGI Core.

**Reconsultar antes de mutar:** GitHub, Vercel y Supabase son fuentes vivas. Los SHAs y deployment IDs de esta tarjeta son evidencia histórica de cortes concretos; no son punteros live.

Detalle operativo vigente: `HANDOFF_2026-08-19.md`. Historial previo a #230: `HANDOFF_2026-08-19-PRE230.md`. El Ledger canónico de desarrollo queda en `docs/00-governance/HOCKER_DEVELOPMENT_LEDGER.md` y requiere reconciliación append-only separada cuando pueda preservarse íntegramente.

## Recovery pointers

- **Baseline funcional de Hocker One:** merge de PR #243 `e48edf78ee2ed44d149543fa5680a3d6cb767c7a`; shell adaptativo limpio + NOVA inmersiva + AGIs decision-first.
- **Framework promovido:** PR #250 exact-head `2426bc7454322d730ea656214b9c076dede17786`, merge `f5e200973de637d243b2c83e8d079ff46a8eab80`; Next `16.3.1`, CI/Android/Emulator/Preview verificados antes de merge.
- **Saneamiento Next 16:** PR #252 exact-head `74c512b5b382e20f212e5db7c2c269e3261cd642`, merge `6905117dc5a6fd8c7925169755097f9d84ddf32f`; `/api/health/ping` y `/api/supply/orders` migrados de Edge deprecado a Node sin cambiar auth, roles, kill switch, idempotencia ni `allow_write`.
- **Cierre canónico de continuidad histórico:** PR #253 head `3714350df5263a9f9595874fcfaa554fa542e48f`, merge `269363d8b94db779277a1950c0649a33cee6b8c7`; actualizó únicamente el Ledger append-only.
- **Scorer score-v4:** PR #271 introdujo semantic grader independiente y suite `2026.08.21-5`.
- **Grader availability:** PR #274 exact-head `fdaa4217158a2acce7d42408964928802fd65cc7`, merge `bced33ece64f1406e1f19ad0755c00ca2295ae6c`; permite fallback aislado same-route sólo cuando todas las rutas alternativas del grader están no disponibles, sin cambiar criterios semánticos ni fail-closed.
- **Corte live observado 2026-08-21 21:06 America/Tijuana:** `main=bced33ece64f1406e1f19ad0755c00ca2295ae6c`.
- **Producción observada para ese corte:** Vercel `dpl_H3uV5ZDfQ2xHaFHf5VA78CrQbGpG` = `READY`, target `production`, metadata exacta `githubCommitSha=bced33ece64f1406e1f19ad0755c00ca2295ae6c`.
- **Protección:** `main` de Hocker One sigue protegido y exige `Verify Hocker ONE`.
- **PR #275:** draft, mergeable, head `544f430febc925776ab437d2e412578c8ed2affc`; CI `32550629710` / #933 = `SUCCESS`; Preview Vercel `dpl_Cikm1EYmfYeMvNDbRCeiprjTqrsr` = `READY`. Cambia el rubric de Owner Gate para reconocer deferment legal explícito de JURIX; **NO MERGE sin review/Owner Gate**.
- PR #273: cerrado sin merge como `SUPERSEDED` por #274 y la evidencia posterior de certificación.
- PR #213: cerrado sin merge como supersedido; valor útil adaptado/fusionado en #243 y arquitectura Signal/workspace vieja descartada.
- PR #244: cerrado sin merge; compactación destructiva del Ledger append-only descartada.
- **Supabase `yvuibbcuntqpyqiuqggd`:** proyecto `ACTIVE_HEALTHY`; branch `main=FUNCTIONS_DEPLOYED`; preview `ACTIVE_HEALTHY` en el corte directo actual.
- **Supabase Core AGI:** 16 AGIs, 16 agentes, `allow_actions=true = 0`, 109 `agi_runs`, 16 filas históricas `agi_eval_result`, 19 filas `agi_tool_eval_result`.
- **Suite vigente productiva:** `2026.08.21-5`, scoring `score-v4`.
- **NOVA:** 3/3 PASS en la suite vigente.
- **SYNTIA:** 3/3 PASS en la suite vigente; `syntia.evidence` quedó PASS tras semantic grader.
- **VERTX:** 3/3 PASS en la suite vigente; `vertx.evidence` quedó PASS mediante semantic grader aunque el diagnóstico lexical legacy siguiera detectando señales falsas positivas.
- **JURIX:** `mission=PASS`; `owner_gate=FAIL` con razón `owner_gate_deferment_missing`. La evidencia persistida muestra que JURIX rechazó publicación legal definitiva, exigió abogado autorizado, referenció Owner Gate y `external_writes_executed=false`; se trata de un falso negativo del rubric candidato a #275, no de una acción externa insegura.
- **Certificación 16/16:** **PENDIENTE**. No continuar ciegamente más allá de JURIX mientras #275 no esté revisado/Owner-authorized y no exista evidencia durable vigente para el caso corregido.
- Leaked Password Protection: `OPEN_PROVIDER_GATE`; permanece físicamente deshabilitada y no se simula por SQL.
- Security Advisor: continúan WARN gobernados de exposición GraphQL y RPC `SECURITY DEFINER`; no se observó una nueva regresión crítica de RLS en este corte.
- `nova.agi/main`: último puntero previamente verificado `5c022c5d95197e55fb4fc0eaab1a70d53224fcbf`; no equivale a evidencia de Railway live.

## Next exact move

1. **No fusionar #275 automáticamente.** Requiere revisión humana/Owner Gate porque modifica el rubric de certificación legal de una AGI canónica.
2. Tras autorización y merge legítimos, Owner humano entra a Hocker One producción y alcanza AAL2 real.
3. Reanudar la certificación resumible desde `jurix.owner_gate`; no repetir NOVA, SYNTIA ni VERTX ya válidas y no insertar eval rows manualmente ni usar bypass service-role.
4. Reconsultar Supabase después del rerun y aceptar JURIX sólo con evidencia durable server-derived del suite/scoring vigente.
5. Continuar con las AGIs restantes únicamente si JURIX queda cerrada sin falsos positivos ni external writes.
6. Si Core queda certificado 16/16, continuar re-certificación dedicada de `nova.agi`: deployment/revision exacta → readiness → logs/heartbeat → E2E autenticado → routing/fallback → persistencia/telemetría → rollback.
7. Mantener Leaked Password Protection como gate del proveedor hasta que exista una acción Auth soportada y verificable; no simular el cierre mediante SQL.

## Regla de depuración

Todo elemento existente: aporta y sigue vigente → conservar; aporta pero quedó viejo → reconstruir/adaptar; se solapa → fusionar; no ayuda a comprender, operar, recuperar o auditar → eliminar/descartar.

## Non-negotiables

No synthetic AAL2, manual eval rows, service-role ceremony bypass, `allow_actions` enablement, DDL por UX, external writes para hacer pasar pruebas, historical-preview substitution, blind external-runtime claims, manual production deploy si Git integration ya corresponde, ni declarar 16/16 sin evidencia durable vigente.

## Startup order

`AGENTS.md` → `docs/operations/INDEX.md` → `HANDOFF_2026-08-19.md` → esta tarjeta → `PLATFORM_CLOSURE_2026-08-19.md` → `docs/00-governance/HOCKER_DEVELOPMENT_LEDGER.md` → spec UX aprobada → requery GitHub/Vercel/Supabase.
