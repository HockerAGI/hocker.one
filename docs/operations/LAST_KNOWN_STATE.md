# HOCKER — Last Known State

Status: **RECOVERY SNAPSHOT — VERIFY MUTABLE FACTS BEFORE ACTING**  
Captured: 2026-08-15 / 2026-08-16 UTC boundary  
Scope: Hocker One + NOVA, with ecosystem-level repository inventory only.

This file exists so a new ChatGPT/Codex/engineer session can resume after losing the prior chat or workspace. It is not the live source of truth. Always reconcile GitHub, Supabase, Vercel and runtime evidence before making changes.

## 1. Exact continuation point

Current workstream: **Hocker One/NOVA continuity, canon alignment, regression closure and platform evidence**.

Do not resume work in CHIDO, Hocker Ads, Casino, Wallet, PUNTO·G or other product repos from this workstream; their detailed changes belong to their own repo/chat context.

### Hocker One

- `main` audit baseline: `a5f4b1838674d6f0c5d648064f8505c280303d34`.
- PR #213: `feat/hocker-signal-nova-workspace-20260814`; audited head before this continuity batch: `b07f0765a077fe25870321e46d397fd3a2a6527a`.
- PR #213 full compare: 69 commits ahead / 0 behind; no deleted files.
- Confirmed regression repaired in #213: workspace Guide/Free Mode + Reset Workspace controls restored in `Más/Ajustes` while reusing `WorkspaceContext`.
- PR #214: `audit/context-canon-reconciliation-20260815`; head before this continuity batch: `b25c73a6eaabb92fb8091c59ea0b46808441b073`.
- PR #209 remains the global fail-closed Platform Closure evidence pack; last audited head: `c9dbc576ff314692cbc065ada12030a6fdbe5332`.
- No merge to `main` is authorized until candidate checks/gates are green.

### NOVA

- `nova.agi/main` baseline observed: `b3de52a48ddbb61d13287d3f46c22da550723c33`.
- PR #32: `docs/codex-context-20260815`; head before the continuity batch: `29e24b05a808e816fcd9962460dd50f1e2aeab81`.
- Runtime already exposes `/health/ready` and has runtime-readiness + heartbeat code.
- `railway.json` points its deployment healthcheck to `/health/ready`.
- A dedicated live Railway deployment has **not** been proven healthy end-to-end by connected evidence in this workstream. Configuration is not deployment evidence.

## 2. Repository inventory

Latest full inventory observed through GitHub access: **9 repositories**.

1. `hocker.one`
2. `nova.agi`
3. `hocker-node-agent`
4. `hocker.agi`
5. `chido.casino`
6. `hocker.ads`
7. `chido.lab`
8. `chido.games`
9. `punto.g`

This is a dated inventory, not a constant. The continuity reconciler must compare repository IDs + names + default-branch SHAs against the previous checkpoint to detect additions, removals, renames, archives and activity.

## 3. AGI evidence state

Latest audited production evidence for `project_id='hocker-one'`:

- canonical AGIs registered: **16/16**;
- `allow_actions=false`: **16/16**;
- persisted `agi_eval_result` coverage: **0/16**;
- persisted `agi_tool_eval_result` coverage: **0/16**;
- completed-run presence observed during the audit: **2/16**.

These are evidence-coverage denominators only. They are not development percentages.

The canonical certification implementation evaluates eight gates per AGI. Do not create or insert passing eval evidence manually. Runtime/tool eval evidence must be generated through the governed Owner + AAL2 flow.

## 4. Supabase state

Primary project: `Hocker AGI Technologies` / `yvuibbcuntqpyqiuqggd`.

- Project service state observed healthy.
- Security Advisor still contains WARN/INFO that require object-by-object classification.
- Hocker One/NOVA backend-only tables inspected in this audit expose grants only to `service_role`; no `anon`/`authenticated` grants were found for the inspected service-only set.
- An explicit deny-by-policy migration is staged in the continuity branch to make that intent executable without adding permissive client access. It is **not** production DDL until the normal merge/migration gate authorizes it.
- Default Supabase Branching resource reports `MIGRATIONS_FAILED`, but that branch metadata dates to 2026-07-03 while production migration history continued successfully through 2026-08-14. Treat this as stale provider Branching metadata, not proof that the production database is broken. Do not reset/rebase blindly.

Validation project `chido-hardening-validation-20260806` is not a second Hocker One production backend and is outside this workstream's remediation scope.

## 5. Context Bridge state

- Context Bridge v1 is deployed and persists normalized sources/checkpoints/manifests/coverage/capabilities.
- Active historical manifest/checkpoints predate the current 2026-08-15/16 engineering state.
- Current task: emit fresh checkpoints, create a new **draft** manifest, review coverage/redaction, then activate only through human Owner + MFA AAL2.
- Never mutate the previous active manifest to make history look current.
- `AGENTS.md` = durable agent instructions.
- Context Bridge = operational continuity.
- SYNTIA/Memory Mirror = reviewed reusable learning.
- Raw chats/secrets/private-domain data are not global memory.

## 6. Actions already completed before this snapshot

- Audited all nine repositories at governance/inventory level.
- Audited Hocker One #213 against versions before it; no source files were deleted.
- Repaired the demonstrated Workspace control regression in #213.
- Reconciled stale Hocker One `AGENTS.md` and removed subjective progress percentages from `hocker-context-pack.ts` in #214.
- Marked the old 2025 integration verification as historical rather than current authority.
- Created `DOC_ALIGNMENT_2026-08-15.md` and updated the global closure evidence pack.
- Added NOVA-specific root `AGENTS.md` in PR #32.
- Verified prior heads of #209/#213/#214/#32 with their repository CI; Hocker One relevant previews were READY.

## 7. Next actions in order

1. Finish the continuity batch in Hocker One #214 and run one CI/preview verification.
2. Finish the personalized continuity batch in NOVA #32 and run one CI verification.
3. Write fresh normalized Context Bridge checkpoints from the current evidence set.
4. Create a new draft manifest; do not activate it automatically.
5. Owner performs/validates real AAL2/TOTP and activates only when coverage is complete.
6. Generate real 16-AGI eval/tool-eval evidence through the governed path.
7. Prove the dedicated NOVA runtime with an exact deployed revision + `/health/ready` response; until then keep it unverified.
8. Run #213 authenticated exact-SHA mobile QA only on the frozen candidate; avoid spending Android Actions repeatedly.
9. Reconcile remaining Hocker One/NOVA Supabase Advisor findings without broad policies.
10. Merge only after the applicable candidate gates are green.

## 8. Handoff rule

At the next material milestone, replace only the facts that changed and append exact evidence references. Do not turn this file into a chronological chat log. The Context Bridge checkpoint ledger is the history; this file is the emergency resume card.
