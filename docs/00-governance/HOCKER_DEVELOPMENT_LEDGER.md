---
document_id: HOCKER-DEVELOPMENT-LEDGER
status: ACTIVE
owner: Hocker One / Owner
classification: INTERNAL
created_at: 2026-08-16
last_verified_at: 2026-08-17T01:09:29-07:00
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

PR #230 advanced four commits from prior ledger head `052060abd79f97b4018a6764607cdfa27c881c01` to exact head `00b505221f5ff8bdd112aa6a970380973d5c68f2`. The delta updates `PLATFORM_CLOSURE_2026-08-17.md`, `AgiEvalBatchControl.tsx` and the AGI/core closure regression tests. It preserves exactly 16 canonical AGIs, `allow_actions=false`, sequential execution, durable server-derived evidence and fail-closed canonical ID checks; adds a visible `Elevar sesión a AAL2` entry to the existing MFA flow; explicitly reuses an already-verified Owner TOTP factor rather than inventing a second enrollment; and proposes classifying Leaked Password Protection as `ACCEPTED_PROVIDER_PLAN_LIMITATION / FREE` for Core while leaving the provider setting visibly disabled. Exact-head GitHub Actions CI `32006651356` / run #795 is SUCCESS and PR evidence records 230/230 regressions, typecheck, lint, build, dependency audit and CodeQL/code scanning success. The PR remains draft with zero submitted reviews. Exact-head GitHub commit status is FAILURE only on Vercel with `Deployment rate limited — retry in 24 hours`; no exact-head Preview exists. Earlier READY previews on the same branch belong to older SHAs and are not promotion evidence. Do not merge until exact-head deployment and review gates close.

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

Fresh Security Advisor output still reports GraphQL exposure WARNs and the existing SECURITY DEFINER RPC WARNs governed by the exception contracts, plus leaked-password protection disabled. These warnings are not silently equivalent to global security closure.

## AGI evidence state

- canonical AGIs: 16;
- `allow_actions=false`: 16/16;
- eval infrastructure exists;
- durable certification remains incomplete until real AAL2-protected eval evidence is generated;
- PR #230 exact head `00b505221f5ff8bdd112aa6a970380973d5c68f2` is the current candidate UX/control path and remains blocked from merge by exact-head Vercel rate limiting plus draft/review gates.

Never manufacture certification by inserting feedback/eval rows directly.

## PUNTO·G architecture state

PR #4 merged documentation-only Canon `1.0-rc4` at `31accb4c1ebc965a037578431f5a017e3728df60`.

Current PUNTO·G architecture is provider-neutral for future work:

- PostgreSQL is the portable persistence contract;
- Neon is selected as the first DB provider to activate later, without becoming a domain dependency;
- Better Auth is CURRENT behind a PUNTO·G-owned identity boundary;
- object storage uses an S3-compatible port, with Cloudflare R2 candidate/preferred for first activation;
- Supabase remains a supported future migration target rather than mandatory current authority;
- Hocker One administration must use a minimized/audited PUNTO Control Contract, not direct provider-admin credentials.

This documentation merge created/configured no Neon, R2, Supabase, Vercel, KYC, PSP, domain, secret or production resource. Historical Supabase-oriented Phase 2 evidence remains historical and must not be rewritten as if it had been provider-neutral at the time.

## Repository/governance continuity

The canonical product catalog remains 10 apps even though connected engineering inventory contains 9 repositories. Repository count, runtime count and provider-project count are not product counts.

Open/historical PRs must be interpreted against current evidence:

- PR #209: historical closure snapshot; superseded operationally by current `PLATFORM_CLOSURE_2026-08-17.md`.
- PR #215: closed without merge and explicitly SUPERSEDED; its branch remains historical audit evidence, not the active Ledger authority.
- PR #213: isolated HOCKER Signal UI work; not a backend Core Integration Ready blocker, but remains a Full Launch/GA UI gate.
- PR #230: current AGI certification candidate at `00b505221f5ff8bdd112aa6a970380973d5c68f2`; draft, zero reviews and externally blocked by exact-head Vercel deployment rate limiting.
- PR #232: closed without merge and explicitly superseded by PR #230 so the Free-plan password-protection classification remains in the same executable evidence set as the AAL2/16-AGI certification candidate.

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

- Prior ledger head `052060abd79f97b4018a6764607cdfa27c881c01` advanced four commits to exact head `00b505221f5ff8bdd112aa6a970380973d5c68f2`.
- The four-commit delta modifies `docs/operations/PLATFORM_CLOSURE_2026-08-17.md`, `src/components/agi/AgiEvalBatchControl.tsx`, `tests/agi-eval-batch.test.mjs` and `tests/core-closure-reconciliation.test.mjs`.
- The visible Owner AAL2 step-up now points to the existing `/auth/mfa?returnTo=/agis` flow and explicitly reuses an already verified TOTP factor; the certification workflow remains sequential, resumable, server-derived and fail-closed around the exact 16-AGI set.
- The candidate now documents Leaked Password Protection as disabled but unavailable on the current Free plan and proposes `ACCEPTED_PROVIDER_PLAN_LIMITATION / FREE` rather than claiming the control enabled. Because this is not merged, current `main` authority remains unchanged.
- Exact-head GitHub Actions CI `32006651356` / #795 = SUCCESS; PR evidence records 230/230 regressions, typecheck, lint, build, dependency audit and CodeQL/code scanning SUCCESS.
- Exact-head GitHub Vercel status = FAILURE with `Deployment rate limited — retry in 24 hours`; no exact-head Preview exists. Earlier READY branch previews are older SHAs.
- PR #230 remains open, mergeable, draft and with zero submitted reviews. No merge is authorized.
- PR #232 was opened only for the provider-plan documentation delta and then closed without merge as superseded by #230, preserving one executable evidence set.

### NOVA continuity merge — PR #32

- `nova.agi` PR #32 merged at `db417f262dfcddcad8e82f6be977415d0b0f3e89`.
- Final head `5b7d97cf1a3302bcb5dacf9349db81ccc07e12e0` had CI #151 SUCCESS.
- Durable continuity/recovery documentation is now on `main`; current live Railway revision/readiness/logs/E2E remain unverified.

### PUNTO·G provider-neutral rc4 — PR #4

- PUNTO·G PR #4 merged documentation-only Canon `1.0-rc4` at `31accb4c1ebc965a037578431f5a017e3728df60`.
- Mandatory Supabase assumptions are superseded for future PUNTO work by provider-neutral persistence/auth/storage contracts.
- No provider or production infrastructure was activated by the merge.

## Handoff rule

At each material change, record separately:

1. current mutable pointers;
2. latest functional/security authority;
3. exact-head CI/CodeQL/deployment evidence;
4. provider/migration evidence;
5. blockers opened/closed;
6. whether the change affects Core Integration Ready, Full Launch/GA, or an optional degraded capability.

Never mark a gate green from narrative alone.