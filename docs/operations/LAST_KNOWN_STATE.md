# HOCKER — Last Known State

Status: **ACTIVE RECOVERY CARD — REQUERY MUTABLE FACTS BEFORE ACTION**  
Evidence cut: **2026-08-19 09:02 America/Tijuana**  
Scope: Hocker One + NOVA + canonical AGI Core.

**Reconsultar antes de mutar:** GitHub, Vercel y Supabase son fuentes vivas. Esta tarjeta no autoriza merges, deploys ni certificaciones por sí sola.

Detalle operativo vigente: `HANDOFF_2026-08-19.md`. Historial previo a #230: `HANDOFF_2026-08-19-PRE230.md`.

## Recovery pointers

- Producción vigente de Hocker One: `main=5ec9de77cbe38ec869b15b30f10ea455c11436f9`; Vercel `dpl_3QFyHXnHmQUvry1WsyTCQov1fVtZ` READY.
- Candidato UX/scoring: PR #243 OPEN / DRAFT / MERGEABLE, rama `feat/hocker-one-ux-limpia-20260819`, head `a33f9c543985766140119a9bc1e4df7c9200fceb`; **no está en producción**.
- Preview exact-head del candidato: `dpl_AzLV8gHFoSJ1Fo5y8uRazfnh3Eod` READY.
- CI exact-head `32268331046` (#830): FAILURE en regresión con **245/246 tests PASS**; un único contrato de continuidad desactualizado bloquea el paso. Typecheck, lint, build y audit quedaron sin ejecutar en ese run.
- `score-v3` está implementado y su snapshot exige evidencia de la versión vigente; evidencia `score-v1/score-v2` no satisface certificación `score-v3`.
- Supabase producción `yvuibbcuntqpyqiuqggd`: 16 AGIs, 16 agentes y `allow_actions=true = 0`. Reconsultar antes de cualquier mutación.
- Evidencia de certificación observada: 3 filas `agi_eval_result`; 0 filas `agi_tool_eval_result`. La evidencia runtime real observada sigue concentrada en NOVA, SYNTIA y VERTX; no existe certificación 16/16 vigente.
- Certificación Owner: **PAUSADA** hasta que el candidato tenga regresión, typecheck, lint, build, audit y Preview verificados; después requiere ceremonia humana AAL2, sin bypass ni evidencia sintética.
- `nova.agi/main`: `db417f262dfcddcad8e82f6be977415d0b0f3e89`; fallback dedicado todavía no re-certificado con deployment/revision runtime exactos.
- PR #244 de reconciliación documental fue cerrado sin merge porque compactaba historial append-only; esa eliminación se descarta, pero sus hechos verificados pueden rescatarse mediante edición aditiva.

## Next exact move

1. Eliminar el último contrato de continuidad obsoleto sin reintroducir copy inútil.
2. Revalidar CI exact-head completo: tests → typecheck → lint → build → dependency audit.
3. Revisar Preview adaptativo/accesibilidad y confirmar que el UI limpio no rompe flujos protegidos.
4. Reconsultar Supabase y Vercel; no aplicar DDL/RLS destructivo ni borrar evidencia histórica.
5. Actualizar handoff, ledger, README, AGENTS y canon sólo con evidencia final real.
6. Merge protegido únicamente con gates verdes y SHA exacto; verificar el auto-deploy productivo del merge.
7. Mantener la ceremonia Owner AAL2 separada del merge; no declarar 16/16 hasta obtener evidencia durable vigente.
8. Después de cerrar Hocker One, continuar la re-certificación de `nova.agi`.

## Regla de depuración

Todo elemento existente pasa por cuatro filtros: aporta y sigue vigente → conservar; aporta pero quedó viejo → reconstruir/adaptar; se solapa → fusionar; no ayuda a comprender, operar, recuperar o auditar → eliminar/descartar. Se aplica a código, documentación, UI, workflows, integraciones, Supabase, Vercel y `nova.agi`.

## Non-negotiables

No synthetic AAL2, manual eval rows, service-role ceremony bypass, `allow_actions` enablement, DDL por UX, external writes para hacer pasar pruebas, historical-preview substitution, blind external-runtime claims, manual production deploy si Git integration ya corresponde, ni declarar 16/16 sin evidencia durable vigente.

## Startup order

`AGENTS.md` → `docs/operations/INDEX.md` → `HANDOFF_2026-08-19.md` → esta tarjeta → planes 2026-08-19 → spec UX aprobada → requery GitHub/Vercel/Supabase.
