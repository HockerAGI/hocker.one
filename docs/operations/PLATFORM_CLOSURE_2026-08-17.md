# HOCKER Core — Platform Closure Gate — 2026-08-17

Status: **OPEN / FAIL-CLOSED**  
Scope: Hocker One control plane, primary NOVA runtime, 16 canonical AGIs and integration surfaces required to scale into other HOCKER apps/services.  
Current pointer at preparation: `main=6b3b4f35820f4fb9c0906fa582dcd397d3169f88`. Re-query before acting.

This document supersedes operational use of PR #209's 2026-08-14 closure snapshot. PR #209 remains historical evidence and retains useful Cloudflare target controls; it is not current state.

## 1. Two closure levels

### Core Integration Ready

Means Hocker One can be used as the governed control/integration plane for downstream applications without implying that every optional executor, mobile release surface or regulated product is live.

Core Integration Ready is **NOT YET VERIFIED** until all mandatory gates in section 3 are closed on one frozen evidence set.

### Full Launch/GA

Includes release/mobile/provider/perimeter/credential and product-specific gates beyond the core control plane. Full Launch/GA can remain open after Core Integration Ready when the open capability is explicitly out of the integration scope and fail-closed.

No document may translate either state into a claim of being bug-free, perfectly secure or universally complete.

## 2. Closed engineering blockers

| Gate | State | Evidence summary |
|---|---|---|
| P0 provider-independent NOVA runtime + durable memory | **CLOSED** | Hocker One unified runtime is primary; durable sessions/messages, provider router, MCP reuse and fallback linkage are production ancestry. |
| Supabase migration ledger parity | **CLOSED** | PR #218/#219 reconciled complete remote history. Supabase Branching currently reaches `FUNCTIONS_DEPLOYED` with preview `ACTIVE_HEALTHY`. |
| Backend-only explicit RLS intent | **CLOSED** | PR #220; prior RLS-enabled/no-policy findings for `compliance_events`, `game_history`, `wager_progress_ledger` are absent. |
| Project membership write boundary | **CLOSED** | PR #221; membership writes narrowed to owner/admin boundary, production migration `20260817021859`. |
| Context/recovery authority semantics | **CLOSED** | PR #223/#225 separate mutable pointers from functional authority and keep the executable continuity test aligned. |
| Node Mirror liveness correctness | **CLOSED** | PR #224/#226. Liveness uses real `public.nodes.id` + `last_seen_at`, 5-minute freshness; commands/events cannot prove liveness. |
| Canonical AGI foreign-key performance debt | **CLOSED** | PR #227; production migration `20260817052915`, three dedicated `agi_id` indexes, prior `unindexed_foreign_keys` findings absent. |
| Supabase Advisor exception classification | **CLOSED** | PR #228 creates bounded exception contracts for intentional GraphQL/RPC exposure; `Leaked Password Protection` explicitly remains open. |

## 3. Mandatory blockers for Core Integration Ready

### G1 — Owner AAL2 — **OPEN**

A verified MFA factor exists, but certification endpoints require a real human Owner session stepped up to AAL2. No service identity, SQL insert or synthetic cookie may substitute for that ceremony.

Pass condition: an actual Owner AAL2 session is used through supported Hocker One/Supabase Auth flow and the resulting protected requests succeed without bypass.

### G2 — 16/16 AGI runtime certification — **OPEN**

Current durable evidence remains:

- canonical AGIs: 16;
- `allow_actions=false`: 16/16;
- `agi_eval_result`: 0;
- `agi_tool_eval_result`: 0.

Pass condition: execute existing `/api/agi/evals/run` and required `/api/agi/tools/eval` flows under Owner AAL2, one scoped evaluation at a time, persisting real evidence. Do not insert passing rows manually and do not enable writes merely to satisfy certification.

### G3 — Leaked Password Protection — **OPEN_PROVIDER_GATE**

Supabase Security Advisor still reports Leaked Password Protection disabled. This is not covered by the Advisor exception register.

Pass condition: enable through supported Supabase Auth/provider configuration, verify sign-in/recovery compatibility, then re-run Security Advisor and record absence of the finding.

## 4. Degraded capabilities that do not falsify Core Integration readiness

### Physical Node Agent — **DEGRADED / LOCAL_EXECUTION_UNAVAILABLE**

`hocker-node-1` has a historical stored `online` status but its real `last_seen_at` is from May 2026. Hocker One now correctly derives it as `sin_senal_reciente` under the 5-minute liveness contract.

This blocks local/physical execution, not the Hocker One API/control-plane integration path, provided all node-dependent actions remain fail-closed. Reclassify to active only after a real fresh heartbeat and current agent evidence.

### Dedicated NOVA Railway fallback — **DEGRADED / NOT CURRENTLY CERTIFIED**

Railway was already implemented. GitHub deployment history from `railway-app[bot]` proves a successful production deployment of `nova.agi` SHA `8be3cdc1891d740cc72d79e60d3aa35199b7efa2` on 2026-07-15, followed by deployment status `inactive` on 2026-07-29. No newer GitHub-linked Railway deployment is currently evidenced.

Do not reinstall Railway. Hocker One unified NOVA runtime remains primary. Dedicated fallback becomes certified only after current provider revision, readiness, heartbeat/logs and authenticated fallback behavior are re-evidenced.

## 5. Full Launch/GA gates

### Android / mobile exact-candidate — **FULL_LAUNCH_GATE**

Existing API 36 emulator/PWA evidence is useful historical coverage. Repeat Android API 36 and signed-release verification against the eventual frozen release SHA/configuration set before claiming mobile GA.

### Web/PWA/accessibility/performance — **FULL_LAUNCH_GATE**

PR #213 remains isolated design/UI work. Do not let unfinished Signal UI block backend Core Integration Ready, but do not call the final Hocker One user experience GA until responsive, accessibility, performance, PWA and authenticated mobile flows pass on its eventual exact head.

### Credential hygiene / secret rotation — **FULL_LAUNCH_GATE**

Privileged credential inventory and coordinated rotation remain a launch/security program. Never rotate blindly or store values in GitHub, docs, logs or AGI memory.

### Cloudflare perimeter — **PROVIDER_EVIDENCE / FULL_LAUNCH_GATE FOR AFFECTED INTERNAL ENDPOINTS**

The historical #209 target remains valid as a design control:

`NOVA / AGIs -> Cloudflare Gateway -> HOCKER MCP Portal -> Access / identity -> HOCKER MCP policy + Owner Gate -> approved providers`

Hocker One MCP policy and Owner Gate remain authoritative even if a network perimeter permits the request. Cloudflare account configuration is not currently connected/evidenced here, so no provider-state claim is made. Treat it as required only for endpoints whose launch scope depends on that perimeter.

### Regulated Casino/Wallet/KYC/financial activation — **OUTSIDE CORE / FAIL-CLOSED**

No core-closure document authorizes real-money, wallet, KYC-public, payment or regulated activation. Those products retain their own legal, security, provider and Owner gates.

## 6. Supabase security disposition

Current Advisor categories are interpreted as follows:

- authenticated GraphQL discoverability: accepted only for current objects where production verification shows RLS enabled + policy coverage; re-query after DDL/grant/policy change;
- anonymous public catalog/tier/promo reads: intentional bounded product surfaces documented in `SUPABASE_ADVISOR_EXCEPTION_REGISTER_2026-08-17.md`;
- public leaderboard/recent-wins and own-history SECURITY DEFINER RPCs: accepted only under fixed search path, bounded results and their opt-in/ownership role contracts;
- Leaked Password Protection: remains OPEN_PROVIDER_GATE;
- any new Advisor ERROR/WARN not in the exception register: new finding until reviewed.

## 7. Current decision boundary

At this cut, the remaining blockers for **Core Integration Ready** are intentionally narrow:

1. real Owner AAL2 ceremony;
2. real 16/16 AGI eval/tool-eval evidence;
3. Supabase Leaked Password Protection provider setting and verification.

Physical Node Agent availability and the dedicated Railway fallback are degraded optional capabilities, not reasons to misrepresent the primary Hocker One runtime as unavailable. Their dependent action paths must remain fail-closed.

Full Launch/GA still requires the separate release/perimeter/credential/UI/mobile gates above.
