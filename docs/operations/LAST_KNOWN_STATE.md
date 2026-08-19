# HOCKER — Last Known State

Status: **ACTIVE RECOVERY CARD — REQUERY MUTABLE FACTS BEFORE ACTION**  
Evidence cut: **2026-08-19 / America/Tijuana**  
Scope: Hocker One + NOVA + canonical AGI Core.

**Reconsultar antes de mutar:** GitHub, Vercel y Supabase son fuentes vivas; ningún SHA, deployment, contador de evidencia o estado de PR en esta tarjeta autoriza una acción sin reconsulta.

Detalle vigente: `HANDOFF_2026-08-19.md`. Historial previo a la promoción de #230: `HANDOFF_2026-08-19-PRE230.md`.

## Current recovery pointers

- Hocker One `main` verificado al iniciar la certificación unificada: `037d5f6cebdf1a44cd6b679b8e84c07bb16852d1` después de PR #239; reconsultar antes de cualquier merge.
- PR #230: MERGED; candidate `5af606d001955a56858c10fb5bb6934dc778a8c9`.
- Candidate CI #807 / `32233348527`: SUCCESS — 231/231 + typecheck + lint + build + audit.
- Candidate Vercel Preview `dpl_EVQHb1fM9vREzbTKMDzGH6SeSdTP`: READY, exact SHA.
- Production Vercel de #230 `dpl_BTizBR6fYWG6v9A1RLov95dQnDVc`: READY, exact merge SHA `6f8686f...`; reviewed `error`/`fatal` logs: none.
- Supabase `yvuibbcuntqpyqiuqggd`: 16 AGIs / 16 agents / 16 `allow_actions=false`; la primera ceremonia Owner AAL2 produjo 1 `agi_eval_result` completo (NOVA), 0 `agi_tool_eval_result`; SYNTIA conservó evidencia parcial de un caso aprobado antes de un rate limit del AI Gateway.
- Hocker One = primary NOVA runtime/control plane; `nova.agi` fallback not re-certified.
- Physical Node Agent = degraded until real heartbeat.

## Next exact move

**Cerrar Core mediante una única certificación Owner resumible.** Mantener Owner AAL2 → ejecutar sólo evidencia runtime/tool pendiente desde `/agis` → reusar evidencia válida de la suite vigente → reintentar únicamente fallos transitorios de proveedor de forma acotada → reconsultar evidencia durable y aceptar cierre sólo con certificación server-derived 16/16.

## Non-negotiables

No synthetic AAL2, manual eval rows, service-role ceremony bypass, `allow_actions` enablement, parallel full-batch fanout, historical-preview substitution, blind Railway redeploy, mass Advisor revocations, or commits used as polling.

## Startup order

`AGENTS.md` → `docs/operations/INDEX.md` → `HANDOFF_2026-08-19.md` → this card → `PLATFORM_CLOSURE_2026-08-19.md` → `DOC_ALIGNMENT_2026-08-19.md` → requery GitHub/Vercel/Supabase.
