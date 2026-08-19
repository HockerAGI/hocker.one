# HOCKER — Last Known State

Status: **ACTIVE RECOVERY CARD — REQUERY MUTABLE FACTS BEFORE ACTION**  
Evidence cut: **2026-08-19 12:31 America/Tijuana**  
Scope: Hocker One + NOVA + canonical AGI Core.

**Reconsultar antes de mutar:** GitHub, Vercel y Supabase son fuentes vivas. Los SHAs y deployment IDs de esta tarjeta son evidencia histórica de cortes concretos; no son punteros live.

Detalle operativo vigente: `HANDOFF_2026-08-19.md`. Historial previo a #230: `HANDOFF_2026-08-19-PRE230.md`.

## Recovery pointers

- **Baseline funcional de producto:** merge de PR #243 `e48edf78ee2ed44d149543fa5680a3d6cb767c7a`; shell adaptativo limpio + NOVA inmersiva + AGIs decision-first + `score-v3`.
- **Corte funcional observado tras mantenimiento de framework:** `main=f5e200973de637d243b2c83e8d079ff46a8eab80`, merge de PR #250; Next `16.3.1` está promovido. Reconsultar antes de usarlo como head live.
- **Producción observada para ese corte:** Vercel `dpl_G4wjSmAWvsm9EWG2Eeruk9h3au3U`, `READY`, target `production`, exact `f5e20097...`; build completado y sin `error`/`fatal` observado en la ventana revisada.
- **Candidato #250:** `2426bc7454322d730ea656214b9c076dede17786`; CI #852, Android Debug APK #166, Android Signed Release #110 y Android Emulator QA #67 = `SUCCESS`; Emulator API 36 completó build, boot, instalación, launch, captura y no-crash; Preview `dpl_EujRiBuTuV6WC34u1DzYfG91niFQ` = `READY`.
- **Rescate de #233:** cerrado sin merge como supersedido. Dependabot no pudo rebasarlo tras edición externa; el valor útil se reconstruyó desde `main` en #250 sin arrastrar base/wrappers viejos. No queda mantenimiento Next pendiente de ese PR.
- **Continuidad semántica:** PR #249 merge `e6f12807bf705b11ef502ed53f4e4968c3620c7c` sustituyó assertions acopladas a copy/encabezados por evidencia semántica sin debilitar SHA, CI, Preview, producción, Supabase ni Owner Gate.
- **Mantenimiento aceptado:** #236 `@next/eslint-plugin-next 16.3.1`, #235 `sonner 2.0.8` y #250 `next 16.3.1`; todos promovidos después de sus gates correspondientes.
- **Mantenimiento descartado para este ciclo:** #234 Zod 4 y #237 Capacitor Android 8.5, cerrados sin merge.
- PR #213: cerrado sin merge como supersedido; valor útil adaptado/fusionado en #243 y arquitectura Signal/workspace vieja descartada.
- PR #244: cerrado sin merge; compactación destructiva del Ledger append-only descartada.
- **PRs abiertos observados:** 0 en `HockerAGI/hocker.one`; 0 en `HockerAGI/nova.agi`.
- Supabase `yvuibbcuntqpyqiuqggd`: `ACTIVE_HEALTHY`, `us-west-1`, PostgreSQL `17.6.1.063`.
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
5. Mantener Leaked Password Protection como gate del proveedor hasta que exista una acción Auth soportada y verificable; no simular el cierre mediante SQL.

## Regla de depuración

Todo elemento existente: aporta y sigue vigente → conservar; aporta pero quedó viejo → reconstruir/adaptar; se solapa → fusionar; no ayuda a comprender, operar, recuperar o auditar → eliminar/descartar.

## Non-negotiables

No synthetic AAL2, manual eval rows, service-role ceremony bypass, `allow_actions` enablement, DDL por UX, external writes para hacer pasar pruebas, historical-preview substitution, blind external-runtime claims, manual production deploy si Git integration ya corresponde, ni declarar 16/16 sin evidencia durable vigente.

## Startup order

`AGENTS.md` → `docs/operations/INDEX.md` → `HANDOFF_2026-08-19.md` → esta tarjeta → `PLATFORM_CLOSURE_2026-08-19.md` → spec UX aprobada → requery GitHub/Vercel/Supabase.