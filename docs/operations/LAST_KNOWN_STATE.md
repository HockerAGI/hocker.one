# HOCKER — Last Known State

Status: **ACTIVE RECOVERY CARD — REQUERY MUTABLE FACTS BEFORE ACTION**  
Evidence cut: **2026-08-19 05:03 America/Tijuana**  
Scope: Hocker One + NOVA + canonical AGI Core.

**Reconsultar antes de mutar:** GitHub, Vercel y Supabase son fuentes vivas. Esta tarjeta no autoriza merges, deploys ni certificaciones por sí sola.

Detalle vigente: `HANDOFF_2026-08-19.md`. Historial previo a #230: `HANDOFF_2026-08-19-PRE230.md`.

## Recovery pointers

- Hocker One `main`: `5ec9de77cbe38ec869b15b30f10ea455c11436f9` — protegido; producción actual.
- Vercel producción: `dpl_3QFyHXnHmQUvry1WsyTCQov1fVtZ` — READY, target production, exact `5ec9de77...`.
- PR #243: OPEN / DRAFT / MERGEABLE; rama `feat/hocker-one-ux-limpia-20260819`.
- Functional head inspeccionado antes del checkpoint documental: `b0792944724668e60ff60a089be339096dabf574`, commit real `feat(ui): make NOVA immersive and simplify AGIs`, unsigned.
- Preview de ese functional head: `dpl_22QBY1LLNSTh3cHtGbzJva3Kynxv` — READY.
- CI exacto `32244656734` (#820): FAILURE. Repository checks PASS, tests PASS, **typecheck FAIL**; lint/build/audit skipped.
- Error exacto: `AgiEvalBatchControl.tsx:116`, TS18047, `progress` possibly null.
- Los commits Markdown posteriores al functional head no cambian producto; reconsultar branch head/ancestry antes de usar evidencia exact-SHA.
- Supabase `yvuibbcuntqpyqiuqggd`: 16 AGIs, 16 agentes, `allow_actions=true = 0`, 34 tool assignments habilitados.
- Evidencia humana histórica: NOVA 3/3 PASS, SYNTIA 3/3 PASS, VERTX 2/3 FAIL histórico; 3 filas `agi_eval_result` total; **sin certificación score-v3**.
- Certificación Owner: **PAUSADA** hasta endurecimiento y corpus offline 16/16 de `score-v3`.
- `nova.agi/main`: `db417f262dfcddcad8e82f6be977415d0b0f3e89`; fallback dedicado todavía no certificado con deployment/revision runtime exactos.

## Next exact move

1. Resolver por causa raíz el nullability TypeScript de `AgiEvalBatchControl`.
2. Revalidar CI exact-head completo.
3. Implementar/verificar `score-v3` con TDD y corpus offline de las 16 AGIs; no ampliar otra lista de substrings como solución principal.
4. Revisar UX/Preview adaptativo y accesibilidad.
5. Reconsultar Supabase/Vercel/`nova.agi`.
6. Merge protegido sólo con gates verdes.
7. Ceremonia Owner AAL2 humana únicamente después de score-v3 verde; evidencia server-derived, sin bypass/síntesis.
8. Actualizar canon/ledger/handoff final con resultados reales.

## Non-negotiables

No synthetic AAL2, manual eval rows, service-role ceremony bypass, `allow_actions` enablement, DDL por UX, external writes para hacer pasar pruebas, historical-preview substitution, blind external-runtime claims, manual production deploy si Git integration ya corresponde, ni declarar 16/16 sin evidencia durable vigente.

## Startup order

`AGENTS.md` → `docs/operations/INDEX.md` → `HANDOFF_2026-08-19.md` → esta tarjeta → planes 2026-08-19 → spec UX aprobada → requery GitHub/Vercel/Supabase.
