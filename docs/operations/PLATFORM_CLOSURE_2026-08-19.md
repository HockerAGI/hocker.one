# HOCKER Core — Platform Closure Gate 2026-08-19

Status: **TECHNICAL CANDIDATE GREEN AT LAST FUNCTIONAL SHA — FINAL HEAD REVALIDATION + MERGE + HUMAN AAL2 REMAIN**

Authoritative current handoff: `HANDOFF_2026-08-19.md`.

## Closed on the last functional candidate

| Gate | Evidence | State |
| --- | --- | --- |
| Canonical catalog | 16 AGIs / 16 agents | GREEN |
| Action boundary | `allow_actions=true = 0` | GREEN |
| score-v3 implementation | versioned runner + snapshot + 16-AGI offline corpus | GREEN |
| Clean NOVA/AGI UX | immersive `/chat`; one-action compact `/agis`; simplified Owner login | GREEN |
| Functional candidate | `44bd2dbf4c389406819de88b6c309d4efe9cec2c` | GREEN |
| CI | `32274977052` / #835: tests + typecheck + lint + build + full audit | GREEN |
| Exact functional Preview | `dpl_GZxLr7AWaeuVcapXrjDCc3h6Mh8Y` READY | GREEN |
| Preview build review | errors-only build query: no build error | GREEN |
| Preview runtime review | no `error`/`fatal` entries in reviewed window | GREEN |
| Stale UI branch | PR #213 closed without merge; useful login adapted only | GREEN |
| Workflow cleanup | scoped/manual workflows retained; no redundant coverage deletion | GREEN |

The current documentary checkpoint is a child of that functional candidate. Its exact SHA must earn its own CI/Preview before merge; a green parent is not sufficient.

## Mandatory gates still open

| Gate | Current evidence | State |
| --- | --- | --- |
| Final docs-aligned head CI/Preview | must be re-queried after this checkpoint | OPEN |
| PR #243 merge | not yet production in this document cut | OPEN |
| Exact production deployment | production still points to `5ec9de77...` | OPEN |
| Owner AAL2 ceremony | human step-up required | OPEN |
| Runtime score-v3 certification | historical v1/v2 evidence does not count | OPEN |
| Tool eval evidence | observed `agi_tool_eval_result=0` | OPEN |
| Server-derived 16/16 certification | requires current durable score-v3 evidence | OPEN |
| Leaked Password Protection | provider configuration not verified enabled | OPEN_PROVIDER_GATE |
| Dedicated `nova.agi` fallback | live provider revision/readiness/E2E not certified | OPEN/DEGRADED |
| Physical Node Agent | requires real fresh heartbeat | OPEN/DEGRADED |

## Owner certification sequence after technical release

1. Owner authenticates normally in production.
2. Abre `/agis` y usa la única acción de verificación/continuación.
3. Si la sesión requiere AAL2, usar challenge/verify del TOTP existente.
4. El servidor deriva el siguiente target; el cliente no selecciona arbitrariamente una AGI.
5. Ejecutar sólo targets pendientes, secuencialmente.
6. Reconsultar `agi_runs`, `agi_feedback` y snapshot.
7. Investigar cualquier FAIL; no traducir request completion a certificación.
8. Sólo con server-derived 16/16 `score-v3` y evidencia requerida actual puede cerrarse certificación.

## Supabase

Los WARN de GraphQL/SECURITY DEFINER se aceptan únicamente bajo el registro explícito de excepciones y sus invariantes. Leaked Password Protection **no** es una excepción aceptada. `unused_index` es INFO de rendimiento y no autoriza `DROP INDEX` sin evidencia de workload/query plan/dependencias y validación reversible.

## Forbidden shortcuts

Manual eval-row insertion, synthetic AAL2/cookies, service-role substitution, enabling AGI writes, parallel full-batch fanout, blind provider redeploys, historical Preview substitution, broad grant/RLS relaxation, index deletion por Advisor INFO o framework migration durante el cierre.
