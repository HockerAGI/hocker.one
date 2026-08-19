# HOCKER — Last Known State

Status: **ACTIVE RECOVERY CARD — REQUERY MUTABLE FACTS BEFORE ACTION**  
Evidence cut: **2026-08-19 09:23 America/Tijuana**  
Scope: Hocker One + NOVA + canonical AGI Core.

**Reconsultar antes de mutar:** GitHub, Vercel y Supabase son fuentes vivas. Esta tarjeta no autoriza merges, deploys ni certificaciones por sí sola.

Detalle operativo vigente: `HANDOFF_2026-08-19.md`. Historial previo a #230: `HANDOFF_2026-08-19-PRE230.md`.

## Recovery pointers

- Producción vigente de Hocker One: `main=5ec9de77cbe38ec869b15b30f10ea455c11436f9`; Vercel `dpl_3QFyHXnHmQUvry1WsyTCQov1fVtZ` READY.
- Candidato UX/scoring de PR #243: último head funcional pre-checkpoint `44bd2dbf4c389406819de88b6c309d4efe9cec2c`; **no está en producción**.
- CI funcional exacto: `32274977052` / #835 = SUCCESS en regression tests, typecheck, lint, build y audit.
- Preview funcional exacto: `dpl_GZxLr7AWaeuVcapXrjDCc3h6Mh8Y` READY; build sin errores y sin `error`/`fatal` en la ventana runtime revisada.
- Este recovery card pertenece al checkpoint documental posterior; reconsultar su nuevo head exacto y no reutilizar el verde de `44bd2db...` para fusionarlo a ciegas.
- `score-v3` está implementado y su snapshot exige evidencia de la versión vigente; `score-v1`/`score-v2` no satisfacen certificación `score-v3`.
- Supabase producción `yvuibbcuntqpyqiuqggd`: 16 AGIs, 16 agentes y `allow_actions=true = 0`; reconsultar antes de cualquier mutación.
- Evidencia observada: 3 filas `agi_eval_result`; 0 filas `agi_tool_eval_result`. No existe certificación 16/16 `score-v3` vigente.
- Certificación Owner: **PAUSADA**; después del cierre técnico requiere ceremonia humana AAL2, sin bypass ni evidencia sintética.
- Leaked Password Protection: `OPEN_PROVIDER_GATE`; no está cerrado por documentación.
- PR #213: cerrado sin merge como supersedido; sólo se adaptó la simplificación de login.
- PR #244: cerrado sin merge; se descartó compactación destructiva del Ledger append-only.
- `nova.agi/main`: `db417f262dfcddcad8e82f6be977415d0b0f3e89`; fallback dedicado todavía no re-certificado con deployment/revision runtime exactos.

## Next exact move

1. Revalidar el head documental actual de PR #243: tests → typecheck → lint → build → audit + Preview exacto.
2. Revisar protección/reviews y fusionar sólo con `expected_head_sha` exacto.
3. Verificar auto-deploy productivo exacto y logs.
4. Mantener Owner AAL2/certificación como gate humano posterior.
5. Reconsultar Supabase; no ejecutar DDL/RLS destructivo ni borrar evidencia histórica.
6. Después de Hocker One, continuar la re-certificación de `nova.agi`.

## Regla de depuración

Todo elemento existente: aporta y sigue vigente → conservar; aporta pero quedó viejo → reconstruir/adaptar; se solapa → fusionar; no ayuda a comprender, operar, recuperar o auditar → eliminar/descartar.

## Non-negotiables

No synthetic AAL2, manual eval rows, service-role ceremony bypass, `allow_actions` enablement, DDL por UX, external writes para hacer pasar pruebas, historical-preview substitution, blind external-runtime claims, manual production deploy si Git integration ya corresponde, ni declarar 16/16 sin evidencia durable vigente.

## Startup order

`AGENTS.md` → `docs/operations/INDEX.md` → `HANDOFF_2026-08-19.md` → esta tarjeta → planes 2026-08-19 → spec UX aprobada → requery GitHub/Vercel/Supabase.
