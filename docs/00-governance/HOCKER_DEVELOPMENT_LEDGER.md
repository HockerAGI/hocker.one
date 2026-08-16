---
document_id: HOCKER-DEVELOPMENT-LEDGER
status: ACTIVE-DRAFT
owner: Hocker One / Owner
classification: INTERNAL
created_at: 2026-08-16
last_verified_at: 2026-08-16T02:56:48-07:00
truth_order: production/configuration > main/migrations > executable contracts/tests > approved ADR/policies > canonical docs > vision/history
update_policy: append-only change log; snapshots may be reconciled only from evidence
---

# HOCKER Development Ledger

## Purpose
Durable continuity record for the HOCKER ecosystem. This ledger records only evidence observable from connected systems or canonical sources. `UNKNOWN` and `PENDING EVIDENCE` are intentional states, never assumptions.

## Audit scope and evidence limitations

Initial connected inventory on 2026-08-16 found **9 GitHub repositories** under `HockerAGI`: `hocker.one`, `hocker.agi`, `nova.agi`, `hocker-node-agent`, `chido.casino`, `chido.lab`, `chido.games`, `hocker.ads`, and `punto.g`.

At this audit execution GitHub is directly connected. Direct Supabase and Vercel administration connectors are not exposed to this execution, so provider state that is not preserved as repository/PR evidence is marked `PENDING EVIDENCE`; no production mutation is inferred or attempted. Conversation context available to the execution is treated as secondary evidence only.

## Ecosystem snapshot

| Repository | Visibility | Canonical/product role | Verified current state | Immediate gate / next action |
|---|---|---|---|---|
| `HockerAGI/hocker.one` | public | Hocker One control plane; governance of 16 AGIs | `main` includes guarded Owner+AAL2 runtime eval and read-only tool runtime through PR #208. Open PR #209 is the global evidence-based closure gate. Open PR #214 adds continuity/context reconciliation with successful CI and READY Vercel Preview evidence in its PR record, but explicitly does not authorize merge. Open PR #213 is an isolated HOCKER Signal UI draft. | Do not claim platform closure. Resolve #209 blockers; review #214 against #209 and Owner/AAL2 requirements before merge; keep #213 isolated until full UI gates pass. |
| `HockerAGI/hocker.agi` | public | corporate/public HOCKER surface | Active; open dependency PRs include TypeScript 7 (#15) and `@types/node` 26 (#12). | Dependency upgrades require compatibility/build/security evidence before merge. |
| `HockerAGI/nova.agi` | public | dedicated NOVA runtime | Open PR #32 establishes durable recovery/continuity; CI SUCCESS at recorded head. Dedicated live Railway revision, readiness, logs/heartbeat and authenticated Hocker One→NOVA E2E remain unverified in PR evidence. | Keep runtime deployment status fail-closed until exact live revision + readiness + logs + authenticated E2E are evidenced. |
| `HockerAGI/hocker-node-agent` | public | authorized local executor | Repository exists and is accessible. No fresh execution evidence was observed in the initial cross-repo recent-commit sample. | `PENDING EVIDENCE`: verify current main SHA, CI, allowlists, HMAC/non-root/sandbox posture and active-node evidence before asserting readiness. |
| `HockerAGI/chido.casino` | public | CHIDO Casino product | Open #48/#49 are design/plan PRs for Launch Preview DEMO and chido.games boundary; they explicitly keep real-money activation fail-closed. Dependency PRs #41/#43/#44 remain open. | Do not enable real money/KYC-public/regulated functionality. Review launch-preview plan under legal/Owner gates; test dependency upgrades separately. |
| `HockerAGI/chido.lab` | private | CHIDO laboratory / upstream experimentation | Repository exists and is private. CHIDO Games evidence refers to Lab→Games compatibility. | Preserve Lab as experimental source; only promote immutable, tested artifacts across the documented boundary. |
| `HockerAGI/chido.games` | private | CHIDO Originals / B2B game runtime boundary | R3 migration was merged as DEMO/synthetic only. Main records verified R3 baseline, provider-neutral API foundation and Lab→Games compatibility. Latest merged plan defines VS1-A Taco Heat runtime artifact/presentation trace; renderer and Casino integration remain out of scope. | Implement VS1-A by TDD without crossing DEMO/REAL or Casino production gates; keep immutable release-bundle boundary. |
| `HockerAGI/hocker.ads` | private | Hocker Ads | EXP-01 local data foundation and E-050 service/version catalog are merged. Evidence states local-only Supabase schema/migrations/RLS/pgTAP/Storage isolation and an approved but intentionally unpriced/non-purchasable EXP-01 v1. Current milestone advanced to E-060. | Continue E-060. Remote Supabase/Stripe/Vercel/customer traffic remain independent provider gates; do not infer production activation. |
| `HockerAGI/punto.g` | private | PUNTO·G separate platform | PRs #1/#2/#3 are merged. Main contains canonical specification, Phase 1 foundation/fail-closed policy and Phase 2 Auth/Identity/KYC foundation, including deterministic fake KYC provider and security audit records. | Next phase must preserve dedicated data/security boundaries; no real KYC/payment/production activation without provider and legal evidence. |

## Canonical product/AGI relationship

The canonical HOCKER portfolio remains 10 applications and 16 AGIs per the 2026.08 documentation. Repositories are implementation boundaries, not a one-to-one app count. `chido.lab`, `chido.games`, and `punto.g` require explicit classification in the global governance inventory because they extend beyond the earlier five-repository baseline. PUNTO·G is tracked here as a separately governed platform, not silently promoted into the canonical 10-app catalog.

## Cross-cutting findings

1. **Repository inventory drift is real:** connected GitHub now exposes 9 repositories, while older canonical architecture/security documents recorded 5. This is documentary drift and must be reconciled in editable governance sources before regenerated canonical artifacts claim a current inventory.
2. **Continuity work already exists but is fragmented:** Hocker One PR #214 and NOVA PR #32 add repository-specific continuity contracts. This ledger becomes the ecosystem-level index; those repository-local handoffs should remain implementation-specific rather than competing global truths.
3. **Provider evidence is incomplete in this execution:** Supabase and Vercel are referenced by repository evidence, but direct provider configuration/state was not available. Provider-specific claims therefore remain `PENDING EVIDENCE` unless an exact deployment/migration/advisor result is recorded in GitHub evidence.
4. **Main promotion is correctly gated:** several open PRs explicitly state that they do not authorize merge. No open PR was merged during this audit because the required complete gate (CI + provider evidence + security + documentation + Owner/review where applicable) was not established end-to-end from connected evidence.
5. **Regulated/destructive surfaces remain fail-closed:** CHIDO real money, Wallet/financial actions, sensitive KYC, production DDL, secret rotation, AGI material actions and equivalent high-risk changes require the canonical human/Owner gates.

## Documentation drift queue

| Area | Drift | Required treatment | Status |
|---|---|---|---|
| Global repository inventory | Canonical 2026.08 sources describe five repositories; connected inventory is nine. | Update editable DOC-00/DOC-05/DOC-07 inventory sources after classification of `chido.lab`, `chido.games`, `hocker.ads`, `punto.g`; regenerate derived PDFs only through the existing document pipeline. | PENDING EVIDENCE / OWNER CLASSIFICATION |
| Hocker One continuity | PR #214 introduces continuity protocol, last-known-state and context reconciliation. | Review against #209 closure gate and this global ledger; merge only after required approvals/gates. | OPEN PR |
| NOVA continuity | PR #32 adds durable continuity but live Railway evidence is missing. | Preserve UNKNOWN live deployment status until exact runtime evidence exists. | OPEN PR |
| Hocker Ads | Repository has advanced beyond older APP-06 description into EXP-01 implementation milestones. | Reconcile APP-06 editable product/architecture sources after E-060 boundary is stable; do not claim remote provider activation. | IN PROGRESS |
| CHIDO | New Lab/Games split and R3 release-bundle architecture post-date older five-repo canon. | Reconcile architecture inventory and CHIDO product docs while preserving DEMO/REAL legal gates. | IN PROGRESS |
| PUNTO·G | New separately governed repo/platform not in canonical 10-app catalog. | Classify explicitly in governance docs without silently changing canonical app count. | PENDING OWNER/GOVERNANCE DECISION |

## Main/merge audit

**No automatic merge performed in this baseline.** Reasons are evidence-based:

- Hocker One #209/#214 explicitly withhold merge authorization and retain global/provider/Owner blockers.
- Hocker One #213 is a draft/TDD UI branch whose own description requires additional gates.
- NOVA #32 lacks exact live runtime/deployment/E2E evidence.
- CHIDO #48/#49 are design/plan gates, not implementation-ready production changes.
- Dependency PRs require compatibility and build/security verification before promotion.

## Required evidence for future hourly reconciliation

For every material delta capture, when accessible: repository + SHA, PR, CI/checks, review state, deployment ID/status, migration identifier, Supabase advisor/RLS/grants evidence, runtime health/log window, security findings, documentation delta, Owner/AAL2 gate where required, and explicit next action.

## Append-only change history

### 2026-08-16 — Initial baseline

- Established ecosystem continuity ledger because no existing `HOCKER_DEVELOPMENT_LEDGER.md` was found across connected HOCKER repositories.
- Verified 9 accessible repositories under `HockerAGI`.
- Recorded current high-signal work: Hocker One closure/continuity/UI PRs; NOVA continuity PR; Hocker Ads EXP-01 E-010→E-050 progression; CHIDO Games R3 + VS1-A plan; PUNTO·G Phase 1/2 merges; CHIDO Casino Launch Preview planning.
- Identified canonical repository-count drift (5 documented vs 9 connected).
- Performed no production/provider mutation and no merge because complete promotion gates were not evidenced.
- Marked direct Supabase/Vercel state `PENDING EVIDENCE` for this execution rather than extrapolating from historical documents.
