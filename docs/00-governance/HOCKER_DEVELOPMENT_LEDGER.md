---
document_id: HOCKER-DEVELOPMENT-LEDGER
status: ACTIVE
owner: Hocker One / Owner
classification: INTERNAL
created_at: 2026-08-16
last_verified_at: 2026-08-17T03:51:27-07:00
truth_order: production/configuration > main/migrations > executable contracts/tests > approved ADR/policies > canonical docs > vision/history
update_policy: append-only milestones; mutable pointers must be re-queried before action
---

# HOCKER Development Ledger

## Purpose

Durable continuity record for the HOCKER ecosystem. It records evidence and explicit uncertainty; it does not convert repository activity into product-completion claims.

**Supersedes operational use of PR #215** while preserving PR #215 and branch `ops/hocker-development-ledger` as historical audit evidence through its final recorded cut. No historical PR or commit is deleted by this supersession.

Detailed recovery semantics are governed by `docs/operations/LAST_KNOWN_STATE.md` and `DOC_ALIGNMENT_2026-08-17-R1.md`.

## Current pointers at this evidence cut

These are mutable and must be re-queried before mutation:

- Hocker One `main`: `cd1f8ef1d148394955013252ac06b2add8c0f460` after PR #229.
- Canonical counts: 10 applications / 16 AGIs.
- Connected engineering repositories: 9.
- Connected Vercel projects: 3 (`hocker-one`, `hocker.agi`, `chido-casino`).
- Primary Supabase project: `yvuibbcuntqpyqiuqggd`.
- Supabase Branching: `main=FUNCTIONS_DEPLOYED`, preview project `ACTIVE_HEALTHY` at the latest read.
- NOVA dedicated repository `main`: `db417f262dfcddcad8e82f6be977415d0b0f3e89` after PR #32.
- PUNTO·G repository `main`: `31accb4c1ebc965a037578431f5a017e3728df60` after PR #4.
- PUNTO·G Neon development project: `PUNTO.G` / `frosty-mode-96257627`; default `main=br-little-art-au9zcb71`; isolated Phase 2B branch `phase-2b-auth-postgres=br-weathered-brook-auuuw1hi`. No Phase 2B promotion to Neon `main` is evidenced.

## Current Hocker One closure snapshot

### Closed

- P0 provider-independent NOVA runtime and durable canonical session/message store.
- Complete Supabase migration-ledger parity (#218/#219).
- Backend-only explicit RLS intent (#220).
- `project_members` owner/admin write boundary (#221).
- recovery-pointer authority semantics and executable regression alignment (#223/#225).
- Node Mirror heartbeat-only liveness (#224), followed by real-schema hotfix (#226).
- three canonical AGI foreign-key indexes (#227), production migration `20260817052915`.
- bounded Supabase Advisor exception register (#228); intentional GraphQL/RPC warnings are no longer treated as unclassified debt.
- Core Integration Ready vs Full Launch/GA continuity/closure reconciliation (#229), merged as documentation/tests only.

### Core Integration Ready blockers still open

- Owner AAL2 human ceremony.
- 16/16 durable `agi_eval_result` / required `agi_tool_eval_result` evidence.
- Supabase Leaked Password Protection provider setting and verification remains the current `main` closure requirement; PR #230 proposes a provider-plan reclassification but is not merged authority.

PR #230 is the current candidate for the resumable Owner/AAL2 certification workflow. It is not merged or certified.

See `docs/operations/PLATFORM_CLOSURE_2026-08-17.md` for the current decision boundary.

## Runtime capability status

### Hocker One / NOVA primary

Hocker One remains the primary NOVA runtime/control plane. Provider/model identity is internal telemetry; Owner Gate remains authoritative for material actions.

PR #230's latest **code-bearing** exact head is `30a414ad95c25cd0bb61b241e63d43ab786d107b`, three commits ahead of the prior ledger head `00b505221f5ff8bdd112aa6a970380973d5c68f2`. That code delta is limited to `src/app/agis/page.tsx`, `src/components/agi/AgiEvalBatchControl.tsx` and `tests/agi-eval-batch.test.mjs`. It passes the server certification snapshot into the Owner batch control and fails closed when that snapshot is partial, preventing synthetic 16-AGI reruns or unnecessary model spend from incomplete evidence. It preserves exactly 16 canonical AGIs, `allow_actions=false`, sequential execution, durable server-derived evidence, the visible existing AAL2 MFA flow and the Owner's already-verified TOTP factor. GitHub Actions CI `32011301053` / run #798 for `30a414ad...` is SUCCESS; PR evidence records regression, typecheck, lint, build and full dependency audit success, with CodeQL/code scanning also reported green.

Documentation drift for that new fail-closed condition was corrected in the editable source `docs/operations/PLATFORM_CLOSURE_2026-08-17.md` on the same PR branch, producing current PR head `1ced536e40a7610a7fed291712baed87c626371a`. The documentation now states that a partial/incomplete server certification snapshot must block batch execution rather than synthesize a full-set rerun. Current-head GitHub Actions CI `32012349597` / #799 is now `SUCCESS`. Exact-head Vercel status remains `FAILURE` with `Deployment rate limited — retry in 24 hours`; no READY Preview exists for `1ced536e...`. PR #230 remains draft, mergeable and has zero submitted reviews. Do not merge until the current exact head has a READY Vercel Preview with reviewed build/runtime logs, required review/authorization and branch-protection satisfaction.

### Physical Node Agent

State: **DEGRADED**.

Production `public.nodes` contains `hocker-node-1` with a historical `online` value but a May 2026 `last_seen_at`. PR #224/#226 removed the false-positive mirror behavior: liveness now derives from `nodes.id + last_seen_at` with a 5-minute freshness window. The current node is therefore `sin_senal_reciente` until a real agent heartbeat arrives.

No database row was rewritten merely to manufacture an offline status.

### Dedicated `nova.agi` / Railway

State: **DEGRADED / fallback not currently certified**.

PR #32 is now merged to `nova.agi/main` at `db417f262dfcddcad8e82f6be977415d0b0f3e89`. It establishes durable startup/recovery/handoff documentation and continuity contract tests; final head `5b7d97cf1a3302bcb5dacf9349db81ccc07e12e0` had CI #151 SUCCESS. It does not establish a new live deployment.

Railway was already implemented; do not reinstall it. Existing evidence shows historical deployment, but the following current-live evidence remains `PENDING EVIDENCE`:

- exact current Railway deployment revision;
- `/health/ready` against that exact revision;
- runtime logs/heartbeat for the same candidate;
- authenticated Hocker One -> NOVA E2E against it.

Hocker One unified NOVA runtime remains primary.

## Supabase security state

### Closed/remediated

- prior RLS-enabled/no-policy findings for `compliance_events`, `game_history`, `wager_progress_ledger` are absent;
- migration branch drift is closed;
- command/node duplicate-permissive policy overlap was reconciled;
- three canonical AGI unindexed-FK findings were closed by migration `20260817052915`;
- production inspection of currently reported authenticated GraphQL tables found RLS enabled with policy coverage.

### Accepted only under explicit contracts

`docs/security/SUPABASE_ADVISOR_EXCEPTION_REGISTER_2026-08-17.md` governs:

- anonymous AGI catalog/tier/promo discoverability;
- authenticated GraphQL discoverability under RLS;
- bounded SECURITY DEFINER public leaderboard/recent-wins projections;
- authenticated own-history projections.

Any new Advisor finding or weakening of those invariants reopens security review.

### Still open

- Leaked Password Protection is still disabled in directly observed provider state. Current `main` closure documents continue to treat it as open; PR #230 proposes reclassification based on Free-plan availability but has not merged.

Fresh Security Advisor output still reports the contract-governed GraphQL exposure WARNs, existing SECURITY DEFINER RPC WARNs and leaked-password protection disabled. No new RLS-disabled/no-policy critical regression was observed in this cut. These warnings are not silently equivalent to global security closure.

## AGI evidence state

- canonical AGIs: 16;
- `allow_actions=false`: 16/16;
- eval infrastructure exists;
- durable certification remains incomplete until real AAL2-protected eval evidence is generated;
- PR #230 current head `1ced536e40a7610a7fed291712baed87c626371a` is the active candidate; latest code-bearing head `30a414ad95c25cd0bb61b241e63d43ab786d107b` has full CI green, and the current documentation-aligned head now also has CI `32012349597` SUCCESS while Vercel remains blocked by provider rate limiting.
- Partial server certification snapshots now fail closed in both implementation and the editable closure source rather than triggering a synthetic full-set execution.

Never manufacture certification by inserting feedback/eval rows directly.

## PUNTO·G architecture state

PR #4 merged documentation-only Canon `1.0-rc4` at `31accb4c1ebc965a037578431f5a017e3728df60`.

Current PUNTO·G architecture remains provider-neutral:

- PostgreSQL is the portable persistence contract;
- Neon is the selected first DB provider without becoming a domain dependency;
- Better Auth is CURRENT behind a PUNTO·G-owned identity boundary;
- object storage uses an S3-compatible port, with Cloudflare R2 candidate/preferred for first activation;
- Supabase remains a supported future migration target rather than mandatory current authority;
- Hocker One administration must use a minimized/audited PUNTO Control Contract, not direct provider-admin credentials.

**Phase 2B development activation is now verified.** Open draft PR #5 (`feat/phase-2b-portable-auth-postgres`) adds the portable identity/PostgreSQL foundation, Better Auth adapter boundary, three versioned DB migrations and auth/identity tests. The implementation exact head `e386550b350e75b1ce8d9ddfc13dc1a37b60ff50` had GitHub Actions CI `32020302373` = SUCCESS. Direct Neon evidence verifies project `PUNTO.G` (`frosty-mode-96257627`) and isolated branch `phase-2b-auth-postgres` (`br-weathered-brook-auuuw1hi`) with the Phase 2B identity/Auth schema delta; Neon `main` (`br-little-art-au9zcb71`) remains separate and unpromoted. Managed Neon Auth is not provisioned.

Drift audit found `CANON.md`, ADR-0007 and `docs/operations/ENVIRONMENTS-RELEASE.md` still stated or implied that no Neon resource existed. Those editable sources were reconciled on PR #5 without changing production/provider state, producing current PR head `b43c574aa4c9964e96d51f29deaab1ac285f5915`. Exact-head GitHub Actions CI `32022459354` / run #148 = SUCCESS. PR #5 remains draft, mergeable and has zero reviews; identity/Auth/provider promotion requires human review/Owner authorization. No merge or Neon `main` promotion is authorized.

R2, KYC provider, payments, AI, hosting production and customer traffic remain unactivated/PENDING EVIDENCE. Historical Supabase-oriented Phase 2 evidence remains historical and must not be rewritten as if it had been provider-neutral at the time.

## Repository/governance continuity

The canonical product catalog remains 10 apps even though connected engineering inventory contains 9 repositories. Repository count, runtime count and provider-project count are not product counts.

Open/historical PRs must be interpreted against current evidence:

- PR #209: historical closure snapshot; superseded operationally by current `PLATFORM_CLOSURE_2026-08-17.md`.
- PR #215: closed without merge and explicitly SUPERSEDED; its branch remains historical audit evidence, not the active Ledger authority.
- PR #213: isolated HOCKER Signal UI work; not a backend Core Integration Ready blocker, but remains a Full Launch/GA UI gate.
- PR #230: current AGI certification candidate at `1ced536e40a7610a7fed291712baed87c626371a`; draft, zero reviews, documentation drift corrected, CI SUCCESS and externally blocked by exact-head Vercel deployment rate limiting.
- PR #231: active Ledger reconciliation PR at prior exact head `d10caba18f069a5711bef691c65e1538d015e735`; Vercel Preview `dpl_BqVwEeeJ6kvdPyGAiVFKuddNfZVw` is READY and GitHub returns no workflow for the Markdown-only head. It remains open, non-draft, mergeable and must still satisfy review/authorization and branch-protection policy before merge.
- PR #232: closed without merge and explicitly superseded by PR #230 so the Free-plan password-protection classification remains in the same executable evidence set as the AAL2/16-AGI certification candidate.
- PUNTO·G PR #5: current Phase 2B portable Auth/PostgreSQL candidate at `b43c574aa4c9964e96d51f29deaab1ac285f5915`; exact-head CI `32022459354` = SUCCESS, but it remains draft/zero-review and cannot be merged or promoted to Neon `main` without identity/security Owner review.

## Preserved perimeter target from historical closure work

Cloudflare target controls from PR #209 remain design evidence, not observed provider configuration:

`NOVA / AGIs -> Cloudflare Gateway -> HOCKER MCP Portal -> Access / identity -> HOCKER MCP policy + Owner Gate -> approved providers`

Network permission never replaces Hocker One MCP policy or Owner Gate. Provider evidence is required before claiming Cloudflare controls are active.

## Append-only milestones after the historical PR #215 cut

### 2026-08-16 / 2026-08-17 UTC — Recovery semantics stabilized

- PR #223 merged recovery semantics separating mutable pointers from frozen functional authority.
- PR #225 repaired the executable continuity regression that still required historical mutable pointers.

### Node liveness closure — PR #224 / #226

- RED established that commands/events must not prove node liveness.
- PR #224 moved Node Mirror liveness to `nodes.last_seen_at` and 5-minute freshness.
- Production schema verification then exposed that `public.nodes` uses primary key `id`, not `node_id`.
- PR #226 corrected the lookup under a new RED/GREEN cycle.
- Current physical node remains stale; the UI/runtime can no longer represent it as active merely from old status or command activity.

### AGI FK performance closure — PR #227

- Three genuine `unindexed_foreign_keys` findings were reproduced and classified.
- Rollback-only validation created all three indexes and left zero durable test DDL.
- Production migration registered as `20260817052915_agi_canonical_fk_indexes_20260817`.
- Git source was immediately aligned to remote version `20260817052915`.
- Performance Advisor no longer reports those three unindexed FKs.

### Supabase Advisor contract closure — PR #228

- Production inspection confirmed RLS enabled + policy coverage across the currently reported authenticated GraphQL table warnings.
- Public catalog/tier/promo reads and four SECURITY DEFINER RPC families were classified by actual contracts rather than silenced through broad revocation.
- `SUPABASE_ADVISOR_EXCEPTION_REGISTER_2026-08-17.md` made those boundaries explicit and testable.
- Leaked Password Protection remains an open provider gate.

### Core closure reconciliation — PR #229

- PR #229 recovered from its earlier RED regression and merged at `cd1f8ef1d148394955013252ac06b2add8c0f460`.
- Final head `9852ef3627e896cd6dcf502917847a517be20a71` had GitHub Actions CI `32002493287` = SUCCESS and Vercel Preview `dpl_5VyirBUYy7QzZWLwhrFvDAXjVpDG` = READY.
- It reconciles Core Integration Ready vs Full Launch/GA and historical use of #209/#215 without runtime, DDL, provider, secrets or AGI permission changes.

### AGI Owner certification candidate — PR #230

- Prior ledger head `052060abd79f97b4018a6764607cdfa27c881c01` first advanced to `00b505221f5ff8bdd112aa6a970380973d5c68f2`, adding the visible Owner AAL2 step-up, reuse of the verified TOTP factor and the provider-plan classification candidate while preserving sequential/resumable fail-closed certification.
- This cut detected a further three-commit code advance from `00b505221f5ff8bdd112aa6a970380973d5c68f2` to `30a414ad95c25cd0bb61b241e63d43ab786d107b`.
- The three-commit code delta modifies only `src/app/agis/page.tsx`, `src/components/agi/AgiEvalBatchControl.tsx` and `tests/agi-eval-batch.test.mjs`: the server certification snapshot is passed to the Owner batch control, and partial snapshots explicitly block batch execution rather than synthesizing a 16-AGI rerun.
- GitHub Actions CI `32011301053` / #798 for that code-bearing head = SUCCESS; PR evidence records regression tests, typecheck, lint, build, dependency audit and CodeQL/code scanning SUCCESS.
- Drift audit found the editable platform-closure source did not explicitly state the new partial-snapshot block. `docs/operations/PLATFORM_CLOSURE_2026-08-17.md` was therefore aligned on the same PR branch, creating current head `1ced536e40a7610a7fed291712baed87c626371a` without runtime/DDL/provider/permission changes.
- Current-head CI `32012349597` / #799 is now `SUCCESS`; exact-head Vercel status remains FAILURE with `Deployment rate limited — retry in 24 hours`. No current-head READY Preview exists.
- PR #230 remains open, mergeable, draft and with zero submitted reviews. No merge is authorized.
- PR #232 remains closed without merge as superseded by #230, preserving one executable evidence set.

### Active Ledger gate — PR #231

- Prior Ledger exact head `d10caba18f069a5711bef691c65e1538d015e735` now has Vercel Preview `dpl_BqVwEeeJ6kvdPyGAiVFKuddNfZVw` = READY; GitHub returns no workflow for the Markdown-only head.
- PR #231 remains open, non-draft and mergeable. Preview readiness does not substitute required review/authorization or branch-protection satisfaction.
- This 03:51 reconciliation creates a new Ledger exact head that must be gated independently; no previous Preview state is inherited.

### 2026-08-17 02:50 PDT — Exact-head gate refresh

- PR #230 exact head `1ced536e40a7610a7fed291712baed87c626371a`: GitHub Actions CI `32012349597` / #799 completed `SUCCESS`; Vercel commit status remains `FAILURE` solely due to `Deployment rate limited — retry in 24 hours`; PR remains draft, mergeable and zero-review, so no merge is authorized.
- PR #231 exact head `edf6c1993dcbacfe80a975a3af893ce45ca7200a`: Vercel Preview `dpl_4xun9MaSMCoeKwZsDHAuAbsohQ3H` is `READY`; no GitHub workflow is returned for the Markdown-only commit. Review/branch-protection authorization remains required.
- Production Supabase remains `ACTIVE_HEALTHY` with branch `main=FUNCTIONS_DEPLOYED`. Fresh Security Advisor output remains limited to the contract-governed GraphQL exposure WARNs, existing SECURITY DEFINER RPC WARNs and Leaked Password Protection disabled; no new RLS-disabled/no-policy critical regression was observed.
- No production DDL, RLS/grant mutation, secret change, provider activation, AGI action enablement, regulated functionality or `main` merge was executed in this audit cut.

### NOVA continuity merge — PR #32

- `nova.agi` PR #32 merged at `db417f262dfcddcad8e82f6be977415d0b0f3e89`.
- Final head `5b7d97cf1a3302bcb5dacf9349db81ccc07e12e0` had CI #151 SUCCESS.
- Durable continuity/recovery documentation is now on `main`; current live Railway revision/readiness/logs/E2E remain unverified.

### PUNTO·G provider-neutral rc4 — PR #4

- PUNTO·G PR #4 merged documentation-only Canon `1.0-rc4` at `31accb4c1ebc965a037578431f5a017e3728df60`.
- Mandatory Supabase assumptions are superseded for future PUNTO work by provider-neutral persistence/auth/storage contracts.
- No provider or production infrastructure was activated by the merge.

### 2026-08-17 03:51 PDT — PUNTO·G Phase 2B development infrastructure verified

- Detected open draft PUNTO·G PR #5, `feat: Phase 2B portable auth and PostgreSQL foundation`, initially at implementation head `e386550b350e75b1ce8d9ddfc13dc1a37b60ff50` with GitHub Actions CI `32020302373` = SUCCESS.
- PR #5 adds 21 implementation/test/migration files at that head, including a server-only Better Auth route/boundary, PostgreSQL identity repository/runtime config, identity/Auth migrations and invariant tests. No managed Neon Auth, AI, payments, KYC provider or customer traffic is activated by the PR contract.
- Direct Neon verification found project `PUNTO.G` (`frosty-mode-96257627`, PostgreSQL 18) with default branch `main` (`br-little-art-au9zcb71`) and isolated child branch `phase-2b-auth-postgres` (`br-weathered-brook-auuuw1hi`). Schema comparison confirms the identity/Auth/audit delta exists only in the child branch; no Phase 2B promotion to Neon `main` was executed.
- Drift audit found `CANON.md` still claimed no Neon resource existed, while ADR-0007's registry said provider direction did not prove resource existence and `ENVIRONMENTS-RELEASE.md` did not record the real development branch. Following PUNTO·G governance, all three editable sources were reconciled in PR #5 without changing runtime/provider production state.
- Documentation reconciliation produced current PR #5 head `b43c574aa4c9964e96d51f29deaab1ac285f5915`; exact-head CI `32022459354` / #148 = SUCCESS. PR remains draft, mergeable and has zero reviews. Because it touches identity/Auth/security and remote DB state, no merge or Neon `main` promotion is authorized without human/Owner review.
- Production HOCKER Supabase remains `ACTIVE_HEALTHY`, `main=FUNCTIONS_DEPLOYED`; current Advisor findings remain the existing contract-governed GraphQL/SECURITY DEFINER WARNs plus Leaked Password Protection disabled. No new HOCKER production DDL, RLS/grant, secret, payment, AGI action or regulated activation was executed by this audit.

## Handoff rule

At each material change, record separately:

1. current mutable pointers;
2. latest functional/security authority;
3. exact-head CI/CodeQL/deployment evidence;
4. provider/migration evidence;
5. blockers opened/closed;
6. whether the change affects Core Integration Ready, Full Launch/GA, or an optional degraded capability.

Never mark a gate green from narrative alone.