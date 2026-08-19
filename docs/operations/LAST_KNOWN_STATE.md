# HOCKER — Last Known State

Status: **ACTIVE RECOVERY CARD — REQUERY MUTABLE FACTS BEFORE ACTION**  
Evidence cut: **2026-08-19 12:00 America/Tijuana**  
Scope: Hocker One + NOVA + canonical AGI Core.

**Reconsultar antes de mutar:** GitHub, Vercel y Supabase son fuentes vivas. Los SHAs y deployment IDs de esta tarjeta son evidencia histórica de cortes concretos; no son punteros live.

Detalle operativo vigente: `HANDOFF_2026-08-19.md`. Historial previo a #230: `HANDOFF_2026-08-19-PRE230.md`.

## Recovery pointers

- **Baseline funcional de Hocker One:** merge de PR #243 `e48edf78ee2ed44d149543fa5680a3d6cb767c7a`; clean adaptive shell + NOVA inmersiva + AGIs decision-first + `score-v3`.
- **Corte live observado tras mantenimiento verificado:** `main=31de87b712a3327b6069426e48fbb5dc24e5d142`, merge de Sonner #235; reconsultar antes de usarlo como head actual.
- **Producción observada para ese corte:** Vercel `dpl_B3MQ66eQf1er3KUc41RaYbh9S1dp`, `READY`, target `production`, exact `31de87b...`, alias `hockerone.vercel.app`; build completado y sin `error`/`fatal` observado en la ventana revisada.
- **Mantenimiento aceptado:** #236 `@next/eslint-plugin-next 16.3.1` (dev-only) y #235 `sonner 2.0.8`; ambos pasaron sus gates exact-head antes de merge. #235 pasó CI, Signed Release, Debug APK, API 36 Emulator QA y Preview.
- **Mantenimiento aislado:** #233 Next `16.2.12 -> 16.3.1` no está promovido. El corte observado falló 1/249 tests por un contrato de hardening que fijaba literalmente `16.2.12`; al ser runtime de producción requiere un ciclo separado completo antes de considerar merge.
- **Mantenimiento descartado para este ciclo:** #234 Zod 4 y #237 Capacitor Android 8.5, cerrados sin merge.
- PR #213: cerrado sin merge como supersedido; valor útil adaptado/fusionado en #243 y arquitectura Signal/workspace vieja descartada.
- PR #244: cerrado sin merge; compactación destructiva del Ledger append-only descartada.
- Supabase `yvuibbcuntqpyqiuqggd`: `ACTIVE_HEALTHY`, `us-west-1`, PostgreSQL 17.6.1.063.
- Supabase Core AGI reconsultado: 16 AGIs, 16 agentes, `allow_actions=true = 0`, 3 filas históricas `agi_eval_result`, 0 filas `agi_tool_eval_result`.
- `score-v3` está desplegado; exige suite/scoring vigente y no convierte evidencia v1/v2 en certificación v3.
- Certificación Owner: **PENDIENTE DE CEREMONIA HUMANA AAL2**. El cierre técnico no equivale a 16/16 certificado.
- Leaked Password Protection: `OPEN_PROVIDER_GATE`; la conexión actual no expone una acción Auth soportada para modificarlo y no se simula por SQL.
- `unused_index` de Supabase permanece INFO investigable; no autoriza `DROP INDEX` automático.
- `nova.agi/main` reconsultado: `5c022c5d95197e55fb4fc0eaab1a70d53224fcbf`, merge de PR #38 de continuidad/dependency cleanup. No equivale a evidencia de Railway live.
- Gmail fue reconsultado para reconstruir las interrupciones; sus alertas se tratan como historial, no como fuente superior a GitHub/Vercel/Supabase. No se modificaron mensajes.

## Next exact move

1. Owner humano entra a Hocker One producción y alcanza AAL2 real.
2. Ejecutar desde `/agis` la certificación resumible `score-v3`; no insertar eval rows manualmente ni usar bypass service-role.
3. Reconsultar Supabase después de la ceremonia y aceptar 16/16 sólo con evidencia durable server-derived del suite/scoring vigente.
4. Si Core queda certificado, continuar re-certificación dedicada de `nova.agi`: deployment/revision exacta → readiness → logs/heartbeat → E2E autenticado → routing/fallback → persistencia/telemetría → rollback.
5. Mantener Next #233 fuera de este gate humano; resolverlo como mantenimiento de framework independiente con validación completa.

## Regla de depuración

Todo elemento existente: aporta y sigue vigente → conservar; aporta pero quedó viejo → reconstruir/adaptar; se solapa → fusionar; no ayuda a comprender, operar, recuperar o auditar → eliminar/descartar.

## Non-negotiables

No synthetic AAL2, manual eval rows, service-role ceremony bypass, `allow_actions` enablement, DDL por UX, external writes para hacer pasar pruebas, historical-preview substitution, blind external-runtime claims, manual production deploy si Git integration ya corresponde, ni declarar 16/16 sin evidencia durable vigente.

## Startup order

`AGENTS.md` → `docs/operations/INDEX.md` → `HANDOFF_2026-08-19.md` → esta tarjeta → `PLATFORM_CLOSURE_2026-08-19.md` → spec UX aprobada → requery GitHub/Vercel/Supabase.