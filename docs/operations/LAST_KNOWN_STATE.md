# HOCKER — Last Known State

Status: **ACTIVE RECOVERY CARD — REQUERY MUTABLE FACTS BEFORE ACTION**  
Evidence cut: **2026-08-19 / America/Tijuana**  
Scope: Hocker One + NOVA + canonical AGI Core.

Detalle de continuidad, errores previos, investigación oficial y procedimiento siguiente: **`HANDOFF_2026-08-19.md`**. No duplicar aquí ese contenido.

## Current recovery pointers

- Hocker One `main` observado: `cd1f8ef1d148394955013252ac06b2add8c0f460` (PR #229). Reconsultar antes de mutar.
- PR #230 observado: draft/open/mergeable, head `1ced536e40a7610a7fed291712baed87c626371a`; latest code-bearing head `30a414ad95c25cd0bb61b241e63d43ab786d107b`.
- CI del head actual: #799 / `32012349597` = SUCCESS.
- Vercel: la cuenta volvió a producir previews READY en otras ramas, pero **no se observó Preview del exact head `1ced536e...` de #230**. Ese gate sigue OPEN.
- Supabase `yvuibbcuntqpyqiuqggd`: 16 AGIs / 16 agents / 16 `allow_actions=false` / 0 `agi_eval_result` / 0 `agi_tool_eval_result` / 1 factor MFA verificado en este corte.
- Hocker One = primary NOVA runtime/control plane; `nova.agi` = fallback/compatibilidad no re-certificado.
- Physical Node Agent = degraded hasta heartbeat real.

## Next exact move

**No merge #230 todavía.** Preferir un Vercel Dashboard `Redeploy` del mismo candidate, sin commit dummy. Exigir Preview `READY` cuyo `githubCommitSha` sea exactamente `1ced536e...`; revisar build/runtime logs. Después revalidar PR/reviews/gates, merge por expected head, comprobar production deployment, ejecutar Owner AAL2 y persistir solamente la evidencia 16/16 generada por los endpoints soportados.

## Non-negotiables

- No usar preview histórico para un head nuevo.
- No fabricar AAL2/evals con SQL, service role o cookie sintética.
- No ejecutar batch si certification snapshot es parcial.
- No habilitar `allow_actions` para satisfacer certificación.
- No redeploy/rebuild Railway a ciegas.
- No silenciar Advisors con cambios amplios.
- No gastar commits/CI sólo para polling o para reintentar un provider.
- No declarar Core verified hasta que todos los gates nombrados tengan evidencia del candidate real.

## Startup order

`AGENTS.md` → `docs/operations/INDEX.md` → `HANDOFF_2026-08-19.md` → esta card → `PLATFORM_CLOSURE_2026-08-19.md` → `DOC_ALIGNMENT_2026-08-19.md` → requery GitHub/Vercel/Supabase.
