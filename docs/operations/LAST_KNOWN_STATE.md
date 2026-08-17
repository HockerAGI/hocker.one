# HOCKER — Last Known State

Status: **RECOVERY SNAPSHOT — VERIFY MUTABLE FACTS BEFORE ACTING**  
Captured evidence cut: `2026-08-17T00:18:00Z` plus PR #216 execution after that cut.  
Scope: Hocker One + NOVA + canonical AGI core, with ecosystem repository/provider inventory.

This is the emergency resume card, not the live database. Always re-query GitHub, Supabase, Vercel and applicable runtime evidence before mutating anything. Freshness rules live in `CONTEXT_FRESHNESS_POLICY.md`.

## 1. Exact continuation point

Current workstream: **Plan A — HOCKER Core Integration Ready**.

Goal: close Hocker One + NOVA + the 16 canonical AGIs as an evidence-backed integration platform for downstream HOCKER apps without enabling unrelated regulated product capabilities.

### Production authority

- Hocker One `main`: `945ed9cdeda909faa9823230d2a4f47ff84173c7`.
- Merge: PR #214, already merged/deployed; it is no longer a candidate.
- Vercel production: `dpl_BbKA86LqvHBkbTDD2vnnsdRcYmT4` = `READY`.
- Six P0 migrations from #214 are present in production through `20260816220145`.

### Active implementation

- PR #216: `feat(core): close HOCKER integration-ready gates`.
- Branch: `ops/core-integration-ready-20260816`.
- Base: production `main` above.
- PR remains **draft** while Plan A gates are executed.
- Task 1 fail-closed Context Bridge coverage passed exact-head verification at `9d50400bddfe4621830f3aa9e3703052b4757c50`: 213/213 regression tests, typecheck, lint, build and full dependency audit SUCCESS; Preview `dpl_8Z9Bzagk7yejnG4RE4dcMXCcBbk3` for that head became `READY` with no error/fatal entries in the reviewed preview window.
- Task 2 context freshness policy is being implemented after a deliberate RED gate. The PR head is mutable during this task; query GitHub before using an exact candidate SHA.

### Other Hocker One work

- PR #209 remains global fail-closed Platform Closure evidence and must be reconciled against #214/#216 evidence before promotion.
- PR #213 HOCKER Signal UI remains draft and must not overwrite/rebase away #214 runtime/security work; core backend closure takes precedence.
- PR #215 Development Ledger exists but must be refreshed before merge because repository/project state has moved since its first snapshot.

## 2. Repository inventory and branch governance

Latest connected inventory: **9 repositories**.

| Repository | Default head at evidence cut | `main` protected when observed |
| --- | --- | --- |
| `hocker.one` | `945ed9cdeda909faa9823230d2a4f47ff84173c7` | yes |
| `nova.agi` | `b3de52a48ddbb61d13287d3f46c22da550723c33` | yes |
| `hocker-node-agent` | `bc733dfb0b131c1fa7b950443ec2b16ae4bd2093` | yes |
| `hocker.agi` | `0acbadf9e01cf4eda483f9b15661b782d04e7210` | yes |
| `chido.casino` | `59ea6edb165b553695d246308aa81523a1e7a122` | yes |
| `chido.lab` | `fee9fe24764cf554c1249fccbaeedb0a2d3724ea` | no |
| `chido.games` | `32da58cfebe6a564dd832efd4884b6b514916062` | no |
| `hocker.ads` | `cae2c1917991bb61d493f62313770954e921e01b` | no |
| `punto.g` | `41ecbdcb302c2df1bd87dc79ed108bf1fff1749b` | no |

Protection drift on the last four is a supply-chain/governance action, not authorization to change their product behavior.

## 3. NOVA state

### Unified Hocker One runtime

#214 made the Hocker One unified runtime the primary path with durable `agi_sessions` / `agi_messages`, provider-independent routing, MCP read hardening and dedicated NOVA compatibility fallback.

### Dedicated `nova.agi`

- `main`: `b3de52a48ddbb61d13287d3f46c22da550723c33`.
- PR #32 adds durable continuity/recovery and has CI evidence in its own PR.
- Exact live Railway revision + `/health/ready` + logs/heartbeat + authenticated Hocker One→NOVA fallback E2E remain unverified in connected evidence.
- Until proven, dedicated runtime is not allowed to upgrade itself from compatibility/fallback to certified live dependency.

## 4. AGI evidence state

Production `project_id='hocker-one'`:

- canonical AGIs: **16/16**;
- `allow_actions=false`: **16/16**;
- status snapshot: 1 live, 3 integration, 6 development, 6 protected;
- runs: **39** total;
- enabled tool assignments: **34**, covering **15 AGIs**;
- `agi_feedback` rows `agi_eval_result`: **0**;
- `agi_feedback` rows `agi_tool_eval_result`: **0**.

Certification implementation already exists and evaluates eight gates per AGI. Durable eval evidence is stored via `agi_feedback` + referenced completed `agi_runs`; do **not** create duplicate eval tables or insert passing evidence manually.

Human Owner+AAL2 execution is required for the actual versioned eval/tool-eval routes. This remains a real gate.

## 5. Supabase state

Primary: `Hocker AGI Technologies` / `yvuibbcuntqpyqiuqggd` = `ACTIVE_HEALTHY`.

### Scoped P0

#214 P0 objects are deployed with fail-closed RLS/grants/RPC boundaries and the current migration chain is present.

### Global blockers still open

- authenticated/anon GraphQL exposure Advisor findings on existing objects;
- existing SECURITY DEFINER RPC exposure warnings;
- RLS-enabled/no-policy INFO on `compliance_events`, `game_history`, `wager_progress_ledger`;
- leaked-password protection disabled at last Advisor read;
- three current unindexed AGI FKs (`agi_agent_tools`, `agi_agents`, `agi_memory_mirror` canonical AGI references);
- duplicate permissive authenticated SELECT policies on `commands` / `nodes`;
- Supabase Branching metadata still reports default `main=MIGRATIONS_FAILED` even though primary service and production migration history are healthy.

Do not reset/rebase Branching blindly. Diagnose from logs/history/provenance.

Validation project `pswlloziztxjsjazfiiy` remains validation-only and not security-clean; `validation_settlement_marker` RLS-disabled ERROR must not be normalized into production assumptions.

## 6. Context Bridge freshness

Fresh normalized production checkpoints at `2026-08-17T00:18:00Z`:

- `github.ecosystem` — current 9-repo inventory/heads;
- `supabase.agi-evidence` — guarded AGI/eval/security state;
- `vercel.hocker-one-runtime` — production deployment/main authority;
- `chatgpt-hocker-project-handoff` — Plan A approved/active;
- `google-drive-canon` — deliberately **partial**, not complete.

Codex was intentionally **not** refreshed because no current Codex workspace/runtime handoff was directly observed in this evidence cut.

The v3 Context Bridge manifest remains `draft`. Do not activate it automatically and do not rewrite the historical active manifest.

PR #216 corrects a real coverage bug: checkpoint recency alone cannot produce provider `complete`; fresh verified capability evidence is also required and a current block remains `blocked`.

## 7. Google Drive / canon

Drive contains HOCKER sources, but this audit did not prove one unique editable source set representing the complete August canon. A credentials document was observed in Drive and is explicitly excluded from Context Bridge/Memory Mirror.

Target: identify exact canonical editable IDs + use renewable `changes.watch` / change-feed evidence. Until then Drive coverage remains partial/stale as observed.

## 8. Memory Mirror

Memory Mirror is reviewed reusable knowledge, not operational real-time memory.

Last production snapshot before this workstream:

- 35 active memories;
- 34 active approved by safety + NOVA/SYNTIA;
- 1 additional active approved by safety/NOVA but not both review flags;
- active expired: 0;
- latest material update observed: `2026-08-04T01:28:56Z`.

Do not make it look “fresh” by copying current chats/provider state into it. Operational changes belong in Context Bridge. Only reusable distilled knowledge goes through the existing review/publication pipeline.

## 9. Vercel / CI / code scanning

- Hocker One production remains `READY` on #214 main.
- PR #216 has automatic previews.
- Hocker One CI includes tests/typecheck/lint/build/full dependency audit.
- GitHub CodeQL **default setup is active**; the repo intentionally has no advanced CodeQL workflow file. Verify actual current check runs before final merge rather than assuming scanning is absent.
- External Actions are pinned by repository contract and checkout uses `persist-credentials: false` in the observed CI.

## 10. Next actions in order

1. Finish Task 2 `CONTEXT_FRESHNESS_POLICY.md` + continuity docs and return exact-head CI/Preview to green.
2. Create a new draft Context Bridge manifest only after the fail-closed coverage behavior is safely promotable; never auto-activate it.
3. Refresh PR #215 ledger and PR #209 closure gate against #214/#216 + current repo/provider facts.
4. Execute AGI certification 16/16 through human Owner+AAL2; persist real `agi_feedback`/`agi_runs` evidence.
5. Classify/remediate global Supabase security findings through validation-first narrow changes; reconcile `MIGRATIONS_FAILED` causally.
6. Prove or formally scope the dedicated NOVA fallback and Node Agent runtime evidence.
7. Reconcile branch/ruleset/supply-chain coverage for unprotected repositories without mixing product activation.
8. Freeze one final candidate and run exact-SHA PWA/Android API 36 + rollback/runbook + Context Bridge evidence gates.
9. Declare `HOCKER Core — VERIFIED / INTEGRATION READY` only when every named gate has traceable evidence.

## 11. Handoff rule

At each material milestone, update normalized Context Bridge first. Update this file only when the continuation point materially changes. Do not turn it into a chronological chat log or a fake heartbeat.
