# HOCKER — Last Known State

Status: **ACTIVE RECOVERY CARD — REQUERY MUTABLE FACTS BEFORE ACTION**  
Evidence cut: **2026-08-21 15:04 America/Tijuana**  
Scope: Hocker One + NOVA + canonical AGI Core.

**Reconsultar antes de mutar:** GitHub, Vercel y Supabase son fuentes vivas. Los SHAs y deployment IDs de esta tarjeta son evidencia histórica de cortes concretos; no son punteros live.

Detalle operativo vigente: `HANDOFF_2026-08-19.md`. Historial previo a PR #230: `HANDOFF_2026-08-19-PRE230.md`. El Ledger canónico de desarrollo queda en `docs/00-governance/HOCKER_DEVELOPMENT_LEDGER.md` y requiere un milestone append-only separado para este corte.

## Recovery pointers

- **Baseline funcional de Hocker One:** merge de PR #243 `e48edf78ee2ed44d149543fa5680a3d6cb767c7a`; shell adaptativo limpio + NOVA inmersiva + AGIs decision-first + `score-v3`.
- **Framework promovido:** PR #250 exact-head `2426bc7454322d730ea656214b9c076dede17786`, merge `f5e200973de637d243b2c83e8d079ff46a8eab80`; Next `16.3.1`, CI/Android/Emulator/Preview verificados antes de merge.
- **Saneamiento Next 16:** PR #252 exact-head `74c512b5b382e20f212e5db7c2c269e3261cd642`, merge `6905117dc5a6fd8c7925169755097f9d84ddf32f`; `/api/health/ping` y `/api/supply/orders` migrados de Edge deprecado a Node sin cambiar auth, roles, kill switch, idempotencia ni `allow_write`.
- **Certificación Owner integrada:** PR #230/#241/#242/#243 establecieron la ceremonia resumible AAL2, evidencia durable y `score-v3`; `allow_actions=false` permanece como boundary.
- **Hardening posterior:** PR #256–#259 corrigieron falsos positivos epistemológicos de `score-v3` sin reescribir evidencia histórica.
- **Suite/productive runner:** PR #262 y PR #264 endurecieron tool-probes read-only, lock recovery, casos sintéticos autocontenidos y la suite vigente `2026.08.21-2`.
- **Fix de proveedor actual:** PR #266 exact-head `71cbb9846b2cfbb8e7b734edb01e480647fb7b11`, merge **`a91e9bc2f54afe30678d78339fb74345c019876a`**. Sustituye la ruta Gateway-only de certificación por el router unificado existente (`completeAgi`) y persiste provenance real (`route`, `route_attempts`, provider, model) en evals exitosas. Conserva suite `2026.08.21-2`, `score-v3`, no-tools/no-external-write y `allow_actions=false`.
- **CI exacto de #266:** GitHub Actions `32530368185` / #895 = `SUCCESS` (regression tests, typecheck, lint, build, full dependency audit).
- **Corte live observado 2026-08-21:** `main=a91e9bc2f54afe30678d78339fb74345c019876a`.
- **Producción observada para ese corte:** Vercel `dpl_HLez4SmLxsGJnopjx8kd6AL5B7rk` = `READY`, target `production`, metadata exacta `githubCommitSha=a91e9bc2f54afe30678d78339fb74345c019876a`; consulta `error`/`fatal` posterior al rollout sin entradas en la ventana revisada.
- **Protección:** `main` de Hocker One debe seguir tratándose como protegido y sujeto a `Verify Hocker ONE`; reconsultar branch protection antes de cualquier merge.
- **Continuidad documental previa:** PR #265 fue cerrado sin merge como `SUPERSEDED` porque describía autoridad post-#264 anterior a #266.
- Supabase `yvuibbcuntqpyqiuqggd`: Security Advisor reconsultado; no apareció una nueva regresión crítica de RLS. Persisten WARN ya gobernados de GraphQL/`SECURITY DEFINER` y Leaked Password Protection deshabilitada.
- Supabase Core AGI reconsultado: **87 `agi_runs` totales, 12 `agi_eval_result`, 19 `agi_tool_eval_result`**.
- **0 runs posteriores al merge #266** (`2026-08-21T21:54:59Z`), por lo que el router unificado está desplegado pero todavía no existe evidencia Owner de certificación producida por ese release.
- Últimos runs anteriores a #266 siguen concentrados en SYNTIA; los tres fallos más recientes son transport failures del Gateway antiguo sobre `syntia.evidence` (`vercel-ai-gateway` / `google/gemini-2.5-flash`). No reinterpretarlos como FAIL semántico de SYNTIA.
- Certificación 16/16: **INCOMPLETA**. La infraestructura de certificación está desplegada; la evidencia vigente todavía no autoriza declarar las 16 AGIs certificadas ni habilitar acciones.
- Leaked Password Protection: control físicamente deshabilitado / provider-plan gate; no simular cierre mediante SQL.
- `nova.agi/main`: último puntero documentado `5c022c5d95197e55fb4fc0eaab1a70d53224fcbf`; exact live Railway revision/readiness/logs/E2E autenticado siguen `PENDING EVIDENCE` hasta reconsulta específica.

## Next exact move

1. Owner humano entra a Hocker One producción y alcanza AAL2 real.
2. Reanudar la **misma suite `2026.08.21-2`** desde la evidencia faltante; reutilizar casos ya PASS y no repetir tool-probes válidos salvo que el contrato vigente los invalide.
3. Primer punto esperado: `syntia.evidence`. Confirmar que el nuevo runner usa `hocker-model-router`/provenance dinámica y que un proveedor disponible responde; no fijar manualmente un provider/model.
4. Reconsultar Supabase inmediatamente después. Sólo aceptar avance con evidencia durable server-derived; no insertar eval rows manualmente ni usar service-role para fabricar ceremonia.
5. Continuar AGI por AGI únicamente si la anterior queda cerrada bajo suite/scoring vigentes. Mantener `allow_actions=false` durante toda la certificación.
6. Si Core alcanza 16/16 con tool-evals requeridos, continuar re-certificación dedicada de `nova.agi`: deployment/revision exacta → readiness → logs/heartbeat → E2E autenticado → routing/fallback → persistencia/telemetría → rollback.

## Regla de depuración

Todo elemento existente: aporta y sigue vigente → conservar; aporta pero quedó viejo → reconstruir/adaptar; se solapa → fusionar; no ayuda a comprender, operar, recuperar o auditar → eliminar/descartar.

## Non-negotiables

No synthetic AAL2, manual eval rows, service-role ceremony bypass, `allow_actions` enablement, DDL por UX, external writes para hacer pasar pruebas, historical-preview substitution, blind external-runtime claims, pin manual de provider/model para forzar certificación, manual production deploy si Git integration ya corresponde, ni declarar 16/16 sin evidencia durable vigente.

## Startup order

`AGENTS.md` → `docs/operations/INDEX.md` → `HANDOFF_2026-08-19.md` → esta tarjeta → `PLATFORM_CLOSURE_2026-08-19.md` → `docs/00-governance/HOCKER_DEVELOPMENT_LEDGER.md` → spec UX aprobada → requery GitHub/Vercel/Supabase.
