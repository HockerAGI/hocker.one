---
document_id: HOCKER-DEVELOPMENT-LEDGER
status: ACTIVE-DRAFT
owner: Hocker One / Owner
classification: INTERNAL
created_at: 2026-08-16
last_verified_at: 2026-08-16T08:04:31-07:00
truth_order: production/configuration > main/migrations > executable contracts/tests > approved ADR/policies > canonical docs > vision/history
update_policy: append-only change log; snapshots may be reconciled only from evidence
---

# HOCKER Development Ledger

## Purpose
Durable continuity record for the HOCKER ecosystem. This ledger records only evidence observable from connected systems or canonical sources. `UNKNOWN` and `PENDING EVIDENCE` are intentional states, never assumptions.

## Audit scope and evidence limitations

Connected inventory on 2026-08-16 found **9 GitHub repositories** under `HockerAGI`: `hocker.one`, `hocker.agi`, `nova.agi`, `hocker-node-agent`, `chido.casino`, `chido.lab`, `chido.games`, `hocker.ads`, and `punto.g`.

Current connected provider inventory also verifies **3 Vercel projects** in team `Hocker AGI`: `hocker-one`, `hocker.agi`, and `chido-casino`; and **2 Supabase projects** in the HOCKER organization: production/shared `Hocker AGI Technologies` (`yvuibbcuntqpyqiuqggd`, ACTIVE_HEALTHY, us-west-1, Postgres 17.6.1.063) plus `chido-hardening-validation-20260806` (`pswlloziztxjsjazfiiy`, ACTIVE_HEALTHY, us-west-1, Postgres 17.6.1.155). Provider state is directly observable for these surfaces. Conversation context remains secondary evidence.

## Ecosystem snapshot

| Repository | Visibility | Canonical/product role | Verified current state | Immediate gate / next action |
|---|---|---|---|---|
| `HockerAGI/hocker.one` | public | Hocker One control plane; governance of 16 AGIs | `main` includes guarded Owner+AAL2 runtime eval and read-only tool runtime through PR #208. Open PR #209 is the global evidence-based closure gate. Open PR #214 adds continuity/context reconciliation with successful CI and READY Vercel Preview evidence in its PR record, but explicitly does not authorize merge. Open PR #213 is an isolated HOCKER Signal UI draft. PR #215 contains this global ledger; exact head `7ec606515f7a0e04c113bca988306f7eb9a40318` has GitHub Actions CI run `31951311957` = SUCCESS and Vercel Preview `dpl_GBWWHP9c2BMtkcMgVUA6bLaikPgz` = READY. PR #215 remains open, non-draft, mergeable, with zero submitted reviews. Separate branch `work/p0-provider-independent-agi-memory-20260816` has no PR and previously generated repeated Vercel Preview ERROR deployments. | Do not claim platform closure. Resolve #209 blockers; review #214 against #209 and Owner/AAL2 requirements; keep #213 isolated. PR #215 remains unmerged because no approved review is present and branch-protection requirements remain `PENDING EVIDENCE`. Do not merge the unreviewed provider-independent AGI/memory branch while preview failures remain unexplained. |
| `HockerAGI/hocker.agi` | public | corporate/public HOCKER surface | Active; open dependency PRs include TypeScript 7 (#15) and `@types/node` 26 (#12). Vercel project exists. | Dependency upgrades require compatibility/build/security evidence before merge. |
| `HockerAGI/nova.agi` | public | dedicated NOVA runtime | Open PR #32 establishes durable recovery/continuity; CI SUCCESS at recorded head. Dedicated live Railway revision, readiness, logs/heartbeat and authenticated Hocker One→NOVA E2E remain unverified in PR evidence. | Keep runtime deployment status fail-closed until exact live revision + readiness + logs + authenticated E2E are evidenced. |
| `HockerAGI/hocker-node-agent` | public | authorized local executor | Repository exists and is accessible. No fresh execution evidence was observed in the current cross-repo audit. | `PENDING EVIDENCE`: verify current main SHA, CI, allowlists, HMAC/non-root/sandbox posture and active-node evidence before asserting readiness. |
| `HockerAGI/chido.casino` | public | CHIDO Casino product | Launch Preview remains design/review only; real-money activation remains fail-closed. Vercel project exists. Shared production Supabase still contains gaming/wallet tables and functions that currently surface security-advisor WARNs. | Do not enable real money/KYC-public/regulated functionality. Resolve security-advisor findings and legal/Owner gates before any production expansion. |
| `HockerAGI/chido.lab` | private | CHIDO laboratory / upstream experimentation | Open PR #6 reconciles Lab→immutable Release Bundle→CHIDO Games ownership and explicitly preserves compatibility debt instead of deleting legacy contracts prematurely. | Keep Lab experimental; only promote immutable tested artifacts after consumer cutover and rollback evidence. |
| `HockerAGI/chido.games` | private | CHIDO Originals / B2B game runtime boundary | R3 migration is merged as DEMO/synthetic only. Open #9/#10 define Taco Heat Premium VS1 and VS1-A implementation planning; renderer, Casino integration and REAL remain out of scope. | Implement VS1-A by TDD without crossing DEMO/REAL or Casino production gates. |
| `HockerAGI/hocker.ads` | private | Hocker Ads | EXP-01 local data foundation and E-050 service/version catalog are merged. Open draft PR #18 implements E-060 order-draft/Checkout abstraction; exact-head Docs Contract, Web Core, Web Foundation and Local DB CI were all SUCCESS in the prior audit, but PR remains draft and its own scope forbids remote Supabase, Stripe, Vercel and customer traffic. | Review E-060 implementation/diff and remove draft only when semantic/security review passes. Remote provider gates remain independent; no merge solely because CI is green. |
| `HockerAGI/punto.g` | private | PUNTO·G separate platform | PRs #1/#2/#3 are merged. Main contains canonical specification, Phase 1 foundation/fail-closed policy and Phase 2 Auth/Identity/KYC foundation, including deterministic fake KYC provider and security audit records. | Next phase must preserve dedicated data/security boundaries; no real KYC/payment/production activation without provider and legal evidence. |

## Provider snapshot

### Vercel

- Team: `Hocker AGI` (`team_nEtACFYtjltFLERznYyZ40pK`).
- Projects: `hocker-one`, `hocker.agi`, `chido-casino`.
- Hocker One PR #215 exact head `7ec606515f7a0e04c113bca988306f7eb9a40318`: Preview `dpl_GBWWHP9c2BMtkcMgVUA6bLaikPgz` = `READY`; GitHub Actions CI run `31951311957` = `SUCCESS`.
- Branch `work/p0-provider-independent-agi-memory-20260816` previously produced repeated `ERROR` previews and has no open PR in connected GitHub search; it is not a merge candidate.

### Supabase

Production/shared project `yvuibbcuntqpyqiuqggd` is `ACTIVE_HEALTHY`, but security posture is **not clean**:

- current branch metadata still reports `main` status `MIGRATIONS_FAILED` while preview project status is healthy;
- multiple RLS-enabled/no-policy INFO findings remain;
- GraphQL exposure WARNs remain for anon/authenticated roles, including gaming, wallet, audit, nodes, KYC, LLM usage and other tables/views;
- SECURITY DEFINER RPC WARNs remain for public/authenticated execution;
- leaked-password protection remains disabled (WARN).

Validation project `pswlloziztxjsjazfiiy` remains `ACTIVE_HEALTHY` but was previously verified as **not clean**:

- `public.validation_settlement_marker` had RLS disabled (`ERROR`);
- multiple SECURITY DEFINER wallet/wager functions were callable by `anon` and/or `authenticated` (`WARN`);
- several RLS-enabled/no-policy INFO findings remained.

These findings block any claim that Supabase security closure is complete. They do not by themselves prove exploitability, but they require explicit intent review, grants/RLS/RPC verification and remediation evidence before closure or regulated activation.

## Canonical product/AGI relationship

The canonical HOCKER portfolio remains 10 applications and 16 AGIs per the 2026.08 documentation. Repositories are implementation boundaries, not a one-to-one app count. `chido.lab`, `chido.games`, and `punto.g` require explicit classification in the global governance inventory because they extend beyond the earlier five-repository baseline. PUNTO·G is tracked here as a separately governed platform, not silently promoted into the canonical 10-app catalog.

## Cross-cutting findings

1. **Repository inventory drift is real:** connected GitHub exposes 9 repositories, while older canonical architecture/security documents recorded 5.
2. **Provider inventory drift is also real:** direct provider access verifies 3 Vercel projects and 2 Supabase projects; the second Supabase validation project is not represented in the prior ecosystem snapshot.
3. **Supabase closure remains blocked:** production/shared project retains security WARN/INFO findings and branch state `MIGRATIONS_FAILED`; validation project previously showed at least one security `ERROR` plus wallet/wager SECURITY DEFINER WARNs.
4. **Hocker One has an unreviewed high-churn work branch:** previous repeated Vercel Preview ERROR states show that green local/code assumptions are insufficient; no main integration is allowed until exact-head preview/build failures are resolved and a PR/review gate exists.
5. **Hocker Ads E-060 progressed materially:** PR #18 exact-head CI was green across all four observed workflows, but it is still a draft and remains local/provider-neutral by contract.
6. **Ledger promotion gate is exact-head green but not fully authorized:** PR #215 head `7ec606515f7a...` has exact-head CI SUCCESS and Vercel Preview READY, but no review is approved and branch-protection requirements remain unreadable through the current integration.
7. **Regulated/destructive surfaces remain fail-closed:** CHIDO real money, Wallet/financial actions, sensitive KYC, production DDL, secret rotation, AGI material actions and equivalent high-risk changes require the canonical human/Owner gates.

## Documentation drift queue

| Area | Drift | Required treatment | Status |
|---|---|---|---|
| Global repository inventory | Canonical 2026.08 sources describe five repositories; connected inventory is nine. | Update editable DOC-00/DOC-05/DOC-07 inventory sources after classification of `chido.lab`, `chido.games`, `hocker.ads`, `punto.g`; regenerate derived PDFs only through the existing document pipeline. | PENDING OWNER CLASSIFICATION |
| Provider inventory | Prior snapshot omitted direct Vercel/Supabase provider state and second Supabase validation project. | Reconcile editable architecture/security inventory with 3 Vercel + 2 Supabase projects and explicit validation-project lifecycle/retirement policy. | OPEN DRIFT |
| Supabase security | DOC-07 describes earlier P0/P1 findings, but current advisor output contains a broader/new set including GraphQL exposure, SECURITY DEFINER execution, leaked-password protection and validation-project RLS ERROR. | Update editable security evidence/runbook source after owner/security review; remediate through migrations/configuration, then rerun advisors. | BLOCKED / ACTION REQUIRED |
| Hocker One continuity | PR #214 introduces continuity protocol, last-known-state and context reconciliation. | Review against #209 closure gate and this global ledger; merge only after required approvals/gates. | OPEN PR |
| NOVA continuity | PR #32 adds durable continuity but live Railway evidence is missing. | Preserve UNKNOWN live deployment status until exact runtime evidence exists. | OPEN PR |
| Hocker Ads | Repository has advanced into E-060 with exact-head CI green. | Reconcile APP-06 editable product/architecture sources after E-060 semantic review/stabilization; do not claim remote provider activation. | IN PROGRESS |
| CHIDO | Lab/Games split and R3 release-bundle architecture post-date older five-repo canon. | Reconcile architecture inventory and CHIDO product docs while preserving DEMO/REAL legal gates. | IN PROGRESS |
| PUNTO·G | Separately governed repo/platform not in canonical 10-app catalog. | Classify explicitly in governance docs without silently changing canonical app count. | PENDING OWNER/GOVERNANCE DECISION |

## Main/merge audit

**No automatic merge performed in this run.** Evidence-based reasons:

- Hocker One #209/#214 explicitly retain global/provider/Owner blockers.
- Hocker One #213 is draft/TDD UI work.
- Hocker One #215 head `7ec606515f7a...` has CI SUCCESS and Vercel Preview READY, but no PR review is approved and branch protection remains `PENDING EVIDENCE`.
- Hocker One provider-independent AGI/memory branch has no PR and previous multiple Vercel Preview ERROR deployments.
- NOVA #32 lacks exact live runtime/deployment/E2E evidence.
- Hocker Ads #18 is still draft; green CI does not substitute semantic/security review or its independent provider gates.
- CHIDO #9/#10 and Lab #6 are design/boundary work, not regulated-production authorizations.
- Current Supabase advisor findings and `MIGRATIONS_FAILED` branch state prevent a platform-security-closure claim.

## Required evidence for future reconciliation

For every material delta capture, when accessible: repository + SHA, PR, CI/checks, review state, deployment ID/status, migration identifier, Supabase advisor/RLS/grants evidence, runtime health/log window, security findings, documentation delta, Owner/AAL2 gate where required, and explicit next action.

## Append-only change history

### 2026-08-16 — Initial baseline

- Established ecosystem continuity ledger because no existing `HOCKER_DEVELOPMENT_LEDGER.md` was found across connected HOCKER repositories.
- Verified 9 accessible repositories under `HockerAGI`.
- Recorded current high-signal work: Hocker One closure/continuity/UI PRs; NOVA continuity PR; Hocker Ads EXP-01 E-010→E-050 progression; CHIDO Games R3 + VS1-A plan; PUNTO·G Phase 1/2 merges; CHIDO Casino Launch Preview planning.
- Identified canonical repository-count drift (5 documented vs 9 connected).
- Performed no production/provider mutation and no merge because complete promotion gates were not evidenced.

### 2026-08-16 04:07 PDT — Connected provider reconciliation

- Directly verified Vercel team and project inventory: 3 projects (`hocker-one`, `hocker.agi`, `chido-casino`).
- Directly verified Supabase inventory: production/shared HOCKER project plus `chido-hardening-validation-20260806` validation project.
- Verified Hocker One Ledger PR #215 exact-head GitHub CI SUCCESS and Vercel Preview READY.
- Detected repeated Vercel Preview ERROR deployments on unreviewed branch `work/p0-provider-independent-agi-memory-20260816`; no PR exists for that branch.
- Verified Hocker Ads E-060 draft PR #18 exact-head CI SUCCESS across Docs Contract, Web Core, Web Foundation and Local DB workflows; kept it unmerged because draft/review/provider gates remain.
- Reran Supabase security advisors. Production/shared project retains multiple WARN/INFO findings and branch state `MIGRATIONS_FAILED`; validation project has an RLS-disabled `ERROR` and multiple SECURITY DEFINER execution WARNs.
- Performed no production DDL, secret/config mutation or main merge. Updated only this governance ledger branch with evidence.

### 2026-08-16 05:07 PDT — Exact-head promotion gate verification

- Verified PR #215 head `dca5ea97cef7ba85a1f92d6bb7d04d1c0993e95f` had GitHub Actions CI run `31943561663` completed with `success`.
- Verified the same exact head had Vercel Preview `dpl_JC7D2mmqJ4qiiYFUifsyRvEVeNTq` in `READY` state.
- Verified PR #215 remained open, non-draft and mergeable, but had no submitted reviews.
- Attempted to read `main` branch-protection requirements; GitHub integration returned `403 Resource not accessible by integration`, so required-review/check policy remains `PENDING EVIDENCE` rather than assumed.
- Rechecked production/shared Supabase branch state: `main` remained `MIGRATIONS_FAILED`; security advisor findings remained materially unchanged, including GraphQL exposure, SECURITY DEFINER execution and leaked-password-protection WARNs.
- Performed no main merge, production DDL or configuration mutation because the full promotion/security gates were still not evidenced.

### 2026-08-16 06:06 PDT — Ledger head advanced and exact-head evidence reconfirmed

- PR #215 head advanced to `b1921fbed9a1c226c151dc25b6f453b67f90f25e`.
- Verified exact-head GitHub Actions CI run `31946278685` completed with `success`.
- Verified exact-head Vercel Preview `dpl_6JEyRn2qdBa9v2QHJmRoSmhgmUST` is `READY`.
- Verified PR #215 remains open, non-draft and mergeable with zero submitted reviews; branch-protection requirements remain `PENDING EVIDENCE`.
- Rechecked production/shared Supabase: branch `main` remains `MIGRATIONS_FAILED` and security advisor findings remain materially unchanged.
- Performed no merge, production DDL, secrets/configuration change, regulated activation or other high-risk mutation.

### 2026-08-16 06:55 PDT — Current ledger exact-head green; authorization gate unchanged

- Verified PR #215 head `0c4ba7c5d11e46b1c95c8af3dffe399581fd602b` had GitHub Actions CI run `31948995696` completed with `success`.
- Verified the same exact head had Vercel Preview `dpl_6KDJcteoLnYj9HGVS6Z1HAty1yqN` in `READY` state.
- Verified PR #215 remains open, non-draft and mergeable with zero submitted reviews.
- Rechecked production/shared Supabase: project remains `ACTIVE_HEALTHY`, branch `main` remains `MIGRATIONS_FAILED`, and security-advisor findings remain materially unchanged, including RLS-no-policy INFO, GraphQL exposure WARNs, SECURITY DEFINER execution WARNs, and leaked-password-protection disabled.
- Performed no main merge, production DDL, secret/configuration mutation, regulated activation or other high-risk action because authorization/branch-protection evidence remains incomplete.

### 2026-08-16 08:04 PDT — Exact-head gate closed technically; authorization still pending

- Verified PR #215 exact head `7ec606515f7a0e04c113bca988306f7eb9a40318` has GitHub Actions CI run `31951311957` completed with `success`.
- Verified Vercel Preview `dpl_GBWWHP9c2BMtkcMgVUA6bLaikPgz` for the same exact head is `READY`.
- Verified PR #215 remains open, non-draft and mergeable with zero submitted reviews; branch-protection requirements remain `PENDING EVIDENCE`.
- Rechecked provider inventory: still 3 Vercel projects and 2 Supabase projects; no inventory expansion detected.
- Rechecked production/shared Supabase: project remains `ACTIVE_HEALTHY`, branch `main` remains `MIGRATIONS_FAILED`, and security-advisor findings remain materially unchanged, including RLS-no-policy INFO, GraphQL exposure WARNs, SECURITY DEFINER execution WARNs and leaked-password-protection disabled.
- No new open PR activity was returned for the organization in the monitored interval.
- Performed no main merge, production DDL, secret/configuration mutation, regulated activation or other high-risk action because review/authorization and platform-security gates remain incomplete.
