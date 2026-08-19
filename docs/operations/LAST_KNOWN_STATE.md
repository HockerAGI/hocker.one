# HOCKER — Last Known State

Status: **ACTIVE RECOVERY CARD — REQUERY MUTABLE FACTS BEFORE ACTION**  
Evidence cut: **2026-08-19 10:17 America/Tijuana**  
Scope: Hocker One + NOVA + canonical AGI Core.

**Reconsultar antes de mutar:** GitHub, Vercel y Supabase son fuentes vivas. Los SHAs y deployment IDs de esta tarjeta son evidencia histórica de cortes concretos; no son punteros live.

Detalle operativo vigente: `HANDOFF_2026-08-19.md`. Historial previo a #230: `HANDOFF_2026-08-19-PRE230.md`.

## Recovery pointers

- **Release funcional vigente de Hocker One:** merge de PR #243 `e48edf78ee2ed44d149543fa5680a3d6cb767c7a`.
- **Producción funcional verificada de ese release:** Vercel `dpl_81HqevySC8Ziq3KxQA1Gxy4Bw3ta`, `READY`, target `production`, exact `e48edf78...`; build sin error y sin `error`/`fatal` en la ventana revisada.
- **Candidate final de #243:** `e2cb93834e781e1f03132e767c646043413d8c36`; CI `32276318988` / #836 = `SUCCESS`; Preview `dpl_HkouMPbEWHdhfPeSNCH4pj7TYQHD` = `READY`.
- **Wrapper documental observado antes de este ajuste:** `main=12dc95e58125d603e12aab25cfd03b3a6c33a030`, PR #245 merged; Vercel `dpl_EuAcyPVvyhcXG6sTykJZHdWoo6DF` = `READY`, target `production`, exact `12dc95e5...`; sin `error`/`fatal` en la ventana revisada. Un commit documental posterior puede cambiar `main` sin cambiar el release funcional: reconsultar antes de usarlo.
- PR #213: cerrado sin merge como supersedido; valor útil adaptado/fusionado en #243 y arquitectura Signal/workspace vieja descartada.
- PR #244: cerrado sin merge; compactación destructiva del Ledger append-only descartada.
- Supabase `yvuibbcuntqpyqiuqggd`: `ACTIVE_HEALTHY`, `us-west-1`, PostgreSQL 17.6.1.063.
- Supabase Core AGI reconsultado: 16 AGIs, 16 agentes, `allow_actions=true = 0`, 3 filas históricas `agi_eval_result`, 0 filas `agi_tool_eval_result`.
- `score-v3` forma parte del release funcional; exige suite/scoring vigente y no convierte evidencia v1/v2 en certificación v3.
- Certificación Owner: **PENDIENTE DE CEREMONIA HUMANA AAL2**. El cierre técnico no equivale a 16/16 certificado.
- Leaked Password Protection: `OPEN_PROVIDER_GATE`; no se declara resuelto sin evidencia provider-side.
- `unused_index` de Supabase permanece INFO investigable; no autoriza `DROP INDEX` automático.
- Último puntero durable previo de `nova.agi/main`: `db417f262dfcddcad8e82f6be977415d0b0f3e89`; tratarlo como histórico hasta reconsultar el repositorio dedicado.

## Next exact move

1. Owner humano entra a Hocker One producción y alcanza AAL2 real.
2. Ejecutar desde `/agis` la certificación resumible `score-v3`; no insertar eval rows manualmente ni usar bypass service-role.
3. Reconsultar Supabase después de la ceremonia y aceptar 16/16 sólo con evidencia durable server-derived del suite/scoring vigente.
4. Si Core queda certificado, continuar re-certificación dedicada de `nova.agi`: deployment/revision exacta → readiness → logs/heartbeat → E2E autenticado → routing/fallback → persistencia/telemetría → rollback.

## Regla de depuración

Todo elemento existente: aporta y sigue vigente → conservar; aporta pero quedó viejo → reconstruir/adaptar; se solapa → fusionar; no ayuda a comprender, operar, recuperar o auditar → eliminar/descartar.

## Non-negotiables

No synthetic AAL2, manual eval rows, service-role ceremony bypass, `allow_actions` enablement, DDL por UX, external writes para hacer pasar pruebas, historical-preview substitution, blind external-runtime claims, manual production deploy si Git integration ya corresponde, ni declarar 16/16 sin evidencia durable vigente.

## Startup order

`AGENTS.md` → `docs/operations/INDEX.md` → `HANDOFF_2026-08-19.md` → esta tarjeta → `PLATFORM_CLOSURE_2026-08-19.md` → spec UX aprobada → requery GitHub/Vercel/Supabase.
