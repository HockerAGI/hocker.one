# HOCKER — Last Known State

Status: **ACTIVE RECOVERY CARD — REQUERY MUTABLE FACTS BEFORE ACTION**  
Evidence cut: **2026-08-19 13:32 America/Tijuana**  
Scope: Hocker One + NOVA + canonical AGI Core.

**Reconsultar antes de mutar:** GitHub, Vercel y Supabase son fuentes vivas. Los SHAs y deployment IDs de esta tarjeta son evidencia histórica de cortes concretos; no son punteros live.

Detalle operativo vigente: `HANDOFF_2026-08-19.md`. Historial previo a #230: `HANDOFF_2026-08-19-PRE230.md`. El Ledger canónico de desarrollo queda en `docs/00-governance/HOCKER_DEVELOPMENT_LEDGER.md`.

## Recovery pointers

- **Baseline funcional de Hocker One:** merge de PR #243 `e48edf78ee2ed44d149543fa5680a3d6cb767c7a`; shell adaptativo limpio + NOVA inmersiva + AGIs decision-first + `score-v3`.
- **Framework promovido:** PR #250 exact-head `2426bc7454322d730ea656214b9c076dede17786`, merge `f5e200973de637d243b2c83e8d079ff46a8eab80`; Next `16.3.1`, CI/Android/Emulator/Preview verificados antes de merge.
- **Saneamiento Next 16:** PR #252 exact-head `74c512b5b382e20f212e5db7c2c269e3261cd642`, merge `6905117dc5a6fd8c7925169755097f9d84ddf32f`; `/api/health/ping` y `/api/supply/orders` migrados de Edge deprecado a Node sin cambiar auth, roles, kill switch, idempotencia ni `allow_write`. CI #856 = `SUCCESS`; Preview `dpl_H1vCm8NLPNFhfCP1mkpFQ64csgUZ` = `READY`.
- **Cierre canónico de continuidad:** PR #253 head `3714350df5263a9f9595874fcfaa554fa542e48f`, merge `269363d8b94db779277a1950c0649a33cee6b8c7`; actualizó únicamente el Ledger append-only, preservando historia previa como evidencia y separándola de la autoridad operativa actual.
- **Producción observada post-#253:** Vercel `dpl_B5Q8J3nrnjxG8QMwpgjFswD8D8bE` = `READY`, target `production`, metadata exacta `githubCommitSha=269363d8b94db779277a1950c0649a33cee6b8c7`, alias `hockerone.vercel.app`; build completado y sin `error`/`fatal` observado en la ventana revisada.
- **Protección:** `main` de Hocker One sigue protegido y exige `Verify Hocker ONE`.
- **Rescate de #233:** cerrado sin merge como supersedido. Dependabot no pudo rebasarlo tras edición externa; el valor útil se reconstruyó desde `main` en #250 sin arrastrar base/wrappers viejos.
- **Continuidad semántica:** PR #249 sustituyó assertions acopladas a copy/encabezados por evidencia semántica sin debilitar SHA, CI, Preview, producción, Supabase ni Owner Gate.
- **Mantenimiento aceptado:** #236 `@next/eslint-plugin-next 16.3.1`, #235 `sonner 2.0.8`, #250 `next 16.3.1` y #252 migración Node runtime.
- **Mantenimiento descartado para este ciclo:** #234 Zod 4 y #237 Capacitor Android 8.5, cerrados sin merge.
- PR #213: cerrado sin merge como supersedido; valor útil adaptado/fusionado en #243 y arquitectura Signal/workspace vieja descartada.
- PR #244: cerrado sin merge; compactación destructiva del Ledger append-only descartada.
- **PRs abiertos reconsultados:** 0 en `HockerAGI/hocker.one`; 0 en `HockerAGI/nova.agi` al cierre post-#253.
- Supabase `yvuibbcuntqpyqiuqggd`: `ACTIVE_HEALTHY`, `us-west-1`, PostgreSQL `17.6.1.063` en el último corte directo.
- Supabase Core AGI: 16 AGIs, 16 agentes, `allow_actions=true = 0`, 3 filas históricas `agi_eval_result`, 0 filas `agi_tool_eval_result`; el Ledger más reciente registra 51 `agi_runs` totales y evidencia vigente todavía concentrada en 3 AGIs, por lo que no existe certificación 16/16.
- `score-v3` está desplegado; exige suite/scoring vigente y no convierte evidencia v1/v2 en certificación v3.
- Certificación Owner: **PENDIENTE DE CEREMONIA HUMANA AAL2**. El cierre técnico/documental no equivale a 16/16 certificado.
- Leaked Password Protection: `OPEN_PROVIDER_GATE`; no se simula por SQL.
- `unused_index` de Supabase permanece INFO investigable; no autoriza `DROP INDEX` automático.
- `nova.agi/main`: `5c022c5d95197e55fb4fc0eaab1a70d53224fcbf`, merge de PR #38; 0 PRs abiertos observados. No equivale a evidencia de Railway live.
- Gmail fue reconsultado tras las interrupciones. Los fallos de CI de SHAs intermedios de #252 quedan como historial superado; la alerta más reciente de #253 confirmó el Preview Vercel y el aviso de límite de Codex review es un límite de revisión, no un fallo de aplicación. No se modificaron mensajes.

## Next exact move

1. Owner humano entra a Hocker One producción y alcanza AAL2 real.
2. Ejecutar desde `/agis` la certificación resumible `score-v3`; no insertar eval rows manualmente ni usar bypass service-role.
3. Reconsultar Supabase después de la ceremonia y aceptar 16/16 sólo con evidencia durable server-derived del suite/scoring vigente.
4. Si Core queda certificado, continuar re-certificación dedicada de `nova.agi`: deployment/revision exacta → readiness → logs/heartbeat → E2E autenticado → routing/fallback → persistencia/telemetría → rollback.
5. Mantener Leaked Password Protection como gate del proveedor hasta que exista una acción Auth soportada y verificable; no simular el cierre mediante SQL.

## Regla de depuración

Todo elemento existente: aporta y sigue vigente → conservar; aporta pero quedó viejo → reconstruir/adaptar; se solapa → fusionar; no ayuda a comprender, operar, recuperar o auditar → eliminar/descartar.

## Non-negotiables

No synthetic AAL2, manual eval rows, service-role ceremony bypass, `allow_actions` enablement, DDL por UX, external writes para hacer pasar pruebas, historical-preview substitution, blind external-runtime claims, manual production deploy si Git integration ya corresponde, ni declarar 16/16 sin evidencia durable vigente.

## Startup order

`AGENTS.md` → `docs/operations/INDEX.md` → `HANDOFF_2026-08-19.md` → esta tarjeta → `PLATFORM_CLOSURE_2026-08-19.md` → `docs/00-governance/HOCKER_DEVELOPMENT_LEDGER.md` → spec UX aprobada → requery GitHub/Vercel/Supabase.
