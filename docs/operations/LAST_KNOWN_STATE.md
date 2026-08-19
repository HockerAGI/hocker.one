# HOCKER — Last Known State

Status: **ACTIVE RECOVERY CARD — REQUERY MUTABLE FACTS BEFORE ACTION**  
Evidence cut: **2026-08-19 / America/Tijuana**  
Scope: Hocker One + NOVA + canonical AGI Core.

Detalle vigente: `HANDOFF_2026-08-19.md`. Historial previo a la promoción de #230: `HANDOFF_2026-08-19-PRE230.md`.

## Current recovery pointers

- Hocker One `main`: `6f8686f6506fd6115fd94dd9e5e8fd9a9394c9f2` después de PR #230.
- PR #230: MERGED; candidate `5af606d001955a56858c10fb5bb6934dc778a8c9`.
- Candidate CI #807 / `32233348527`: SUCCESS — 231/231 + typecheck + lint + build + audit.
- Candidate Vercel Preview `dpl_EVQHb1fM9vREzbTKMDzGH6SeSdTP`: READY, exact SHA.
- Production Vercel `dpl_BTizBR6fYWG6v9A1RLov95dQnDVc`: READY, exact merge SHA `6f8686f...`; reviewed `error`/`fatal` logs: none.
- Supabase `yvuibbcuntqpyqiuqggd`: 16 AGIs / 16 agents / 16 `allow_actions=false` / 0 `agi_eval_result` / 0 `agi_tool_eval_result` / 1 verified MFA factor.
- Hocker One = primary NOVA runtime/control plane; `nova.agi` fallback not re-certified.
- Physical Node Agent = degraded until real heartbeat.

## Next exact move

**Human Owner AAL2 ceremony + pending 16/16 runtime/tool evidence.** Login → `/agis` → `Elevar sesión a AAL2` → verify existing TOTP → ensure certification snapshot is complete → run only pending evidence sequentially → requery durable evidence/server-derived certification.

## Non-negotiables

No synthetic AAL2, manual eval rows, service-role ceremony bypass, `allow_actions` enablement, parallel full-batch fanout, historical-preview substitution, blind Railway redeploy, mass Advisor revocations, or commits used as polling.

## Startup order

`AGENTS.md` → `docs/operations/INDEX.md` → `HANDOFF_2026-08-19.md` → this card → `PLATFORM_CLOSURE_2026-08-19.md` → `DOC_ALIGNMENT_2026-08-19.md` → requery GitHub/Vercel/Supabase.
