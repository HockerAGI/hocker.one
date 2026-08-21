# HOCKER — Last Known State

Status: **ACTIVE RECOVERY CARD — REQUERY MUTABLE FACTS BEFORE ACTION**  
Evidence cut: **2026-08-21 12:52 America/Tijuana**  
Scope: Hocker One + NOVA + canonical AGI Core.

**Reconsultar antes de mutar:** GitHub, Vercel y Supabase son fuentes vivas. Los SHAs y deployment IDs de esta tarjeta son evidencia histórica de cortes concretos; no son punteros live.

Detalle operativo vigente: `HANDOFF_2026-08-19.md`. Historial previo a #230: `HANDOFF_2026-08-19-PRE230.md`. El Ledger canónico de desarrollo queda en `docs/00-governance/HOCKER_DEVELOPMENT_LEDGER.md`.

## Recovery pointers

- **Baseline funcional de Hocker One:** merge de PR #243 `e48edf78ee2ed44d149543fa5680a3d6cb767c7a`; shell adaptativo limpio + NOVA inmersiva + AGIs decision-first + `score-v3`.
- **Framework promovido:** PR #250 exact-head `2426bc7454322d730ea656214b9c076dede17786`, merge `f5e200973de637d243b2c83e8d079ff46a8eab80`; Next `16.3.1`, CI/Android/Emulator/Preview verificados antes de merge.
- **Saneamiento Next 16:** PR #252 exact-head `74c512b5b382e20f212e5db7c2c269e3261cd642`, merge `6905117dc5a6fd8c7925169755097f9d84ddf32f`; `/api/health/ping` y `/api/supply/orders` migrados de Edge deprecado a Node sin cambiar auth, roles, kill switch, idempotencia ni `allow_write`.
- **Cierre canónico de continuidad:** PR #253 head `3714350df5263a9f9595874fcfaa554fa542e48f`, merge `269363d8b94db779277a1950c0649a33cee6b8c7`; actualizó únicamente el Ledger append-only, preservando historia previa como evidencia y separándola de la autoridad operativa actual.
- **Scorer / certificación hardening promovido:** PR #259 merge `18d96d686baff68ad4379ad051a3490370c6be8d`; preservó evidencia histórica y dejó la suite `2026.08.20-4` como corte productivo observado previo a #262.
- **Preflight final de certificación promovido con autorización Owner:** PR #262 exact-head `b361dea17a88604cd3b5407e40d2ded5a2ff3f82`, merge `cc1d63d67f4285c9b199befcd7bd735087fe43c2`; CI #888 / `32515212186` = `SUCCESS`; Preview exact-head `dpl_FFRin1FWoXUr2mc6TtCLey3TnBwh` = `READY` antes del merge. El cambio preserva fail-closed Owner Gate, evidencia histórica y `allow_actions=false`, añade tool-probes read-only, retry bounded, slicing de un caso nuevo por request, stale-lock recovery y rueda la siguiente suite candidata a `2026.08.21-1`.
- **Corte live observado 2026-08-21:** `main=cc1d63d67f4285c9b199befcd7bd735087fe43c2`.
- **Producción observada para ese corte:** Vercel `dpl_38bq6awqEVuu32XB9wWDG6ZRz1iM` = `READY`, target `production`, metadata exacta `githubCommitSha=cc1d63d67f4285c9b199befcd7bd735087fe43c2`; consulta `error`/`fatal` de las 2 horas revisadas = 0 entradas.
- **Protección:** `main` de Hocker One sigue protegido y exige `Verify Hocker ONE`.
- **Evidencia AGI durable actual:** Supabase reporta 16 AGIs, 16 agentes, `allow_actions=true = 0`, 75 `agi_runs`, 10 filas históricas `agi_eval_result`, 0 `agi_tool_eval_result`; último run durable `2026-08-21T17:33:55.451881Z`.
- **Suite histórica más reciente con evidencia:** `2026.08.20-4` tiene 3 agregados `agi_eval_result`; la evidencia previa documenta NOVA 3/3 PASS, SYNTIA 3/3 PASS y VERTX 2/3 por falso positivo de evidencia. PR #262 no reescribe ese historial.
- **Suite candidata post-#262:** `2026.08.21-1`; al corte de esta tarjeta no existe run durable posterior al merge de #262, así que no hay evidencia productiva nueva de esta suite.
- **Certificación Owner:** **PENDIENTE DE NUEVA EJECUCIÓN HUMANA AAL2 SOBRE LA SUITE VIGENTE**. El merge de #262 no equivale a 16/16 certificado.
- `score-v3` está desplegado; exige suite/scoring vigente y no convierte evidencia histórica en certificación actual.
- Leaked Password Protection: físicamente deshabilitada; se mantiene como provider gate/limitación documentada, no se simula por SQL.
- Security Advisor Supabase: persisten WARN de exposición GraphQL y RPC `SECURITY DEFINER`; no apareció nueva regresión crítica de RLS en este corte.
- `nova.agi/main`: último puntero verificado `5c022c5d95197e55fb4fc0eaab1a70d53224fcbf`; no equivale a evidencia de Railway live.

## Next exact move

1. Owner humano entra a Hocker One producción y alcanza AAL2 real.
2. Ejecutar desde `/agis` la certificación resumible sobre la suite vigente `2026.08.21-1`; no insertar eval rows manualmente ni usar bypass service-role.
3. Reconsultar Supabase después de la ceremonia y aceptar 16/16 sólo con evidencia durable server-derived de suite/scoring vigente, incluyendo tool-evals requeridos.
4. Si Core queda certificado, continuar re-certificación dedicada de `nova.agi`: deployment/revision exacta → readiness → logs/heartbeat → E2E autenticado → routing/fallback → persistencia/telemetría → rollback.
5. Mantener Leaked Password Protection como gate del proveedor hasta que exista una acción Auth soportada y verificable; no simular el cierre mediante SQL.

## Regla de depuración

Todo elemento existente: aporta y sigue vigente → conservar; aporta pero quedó viejo → reconstruir/adaptar; se solapa → fusionar; no ayuda a comprender, operar, recuperar o auditar → eliminar/descartar.

## Non-negotiables

No synthetic AAL2, manual eval rows, service-role ceremony bypass, `allow_actions` enablement, DDL por UX, external writes para hacer pasar pruebas, historical-preview substitution, blind external-runtime claims, manual production deploy si Git integration ya corresponde, ni declarar 16/16 sin evidencia durable vigente.

## Startup order

`AGENTS.md` → `docs/operations/INDEX.md` → `HANDOFF_2026-08-19.md` → esta tarjeta → `PLATFORM_CLOSURE_2026-08-19.md` → `docs/00-governance/HOCKER_DEVELOPMENT_LEDGER.md` → spec UX aprobada → requery GitHub/Vercel/Supabase.