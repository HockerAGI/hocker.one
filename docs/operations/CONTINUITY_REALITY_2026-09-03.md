---
document_id: HOCKER-CONTINUITY-REALITY
status: ACTIVE
owner: Hocker One / Owner
classification: INTERNAL
evidence_cut: 2026-09-03T20:23:00-07:00
truth_order: production/configuration > main/migrations > executable contracts/tests > approved ADR/policies > canonical docs > vision/history
update_policy: re-query mutable provider state before every material action; append new evidence cuts
---

# HOCKER — Continuity Reality vs Canon

## 1. Purpose

This is the live reconciliation layer between the HOCKER canonical documentation and the connected technical reality. It does not replace DOC-00, DOC-02, DOC-03, DOC-05, DOC-06, DOC-07, DOC-08, DOC-09, DOC-10 or DOC-11. It records current evidence and explicit drift.

The canonical rule remains: production/configuration and executable evidence outrank derived documentation. The repository documentation itself states that production/configuration, main/migrations and executable contracts precede canonical PDFs when there is conflict.

## 2. Current mutable pointers

### GitHub

Owner: HockerAGI

Current repositories observed: **9**

1. HockerAGI/hocker.agi — public — corporate/public web.
2. HockerAGI/hocker.one — public — primary control plane.
3. HockerAGI/chido.casino — public — casino application.
4. HockerAGI/nova.agi — public — dedicated NOVA compatibility/fallback repository.
5. HockerAGI/hocker-node-agent — public — local execution agent.
6. HockerAGI/chido.lab — private — CHIDO research/simulation/evidence source.
7. HockerAGI/hocker.ads — private — Hocker Ads product/engineering source.
8. HockerAGI/chido.games — private — CHIDO B2B/RGS packaging source.
9. HockerAGI/punto.g — private — separate governed product/domain repository, not counted as one of the 10 canonical HOCKER apps unless explicitly promoted by governance.

Current hocker.one main at this cut: a355cfe74ea9971bea43c98ab8703ce29e397e01.

### Vercel

Current projects observed: **4**

- hocker-one — linked to HockerAGI/hocker.one.
- hocker.agi — linked to HockerAGI/hocker.agi.
- chido-casino — linked to HockerAGI/chido.casino.
- punto-g-web — linked to HockerAGI/punto.g.

The historical DOC-05 2026.08 count of 3 Vercel projects is therefore a superseded evidence count, not the current connected inventory.

Current Hocker ONE production deployment:
- dpl_4GsSm3oNeug7Tck8WMroAfNoJbJ6
- source SHA a355cfe74ea9971bea43c98ab8703ce29e397e01
- target production
- READY

### Supabase

Current connected projects observed: **3**

- Hocker AGI Technologies — yvuibbcuntqpyqiuqggd — ACTIVE_HEALTHY — primary production/core project.
- hocker-hardening-validation-20260830 — qjmtaxamcxqhonqwishm — ACTIVE_HEALTHY — validation project.
- chido-hardening-validation-20260806 — pswlloziztxjsjazfiiy — INACTIVE — historical validation fixture.

The primary production database remains PostgreSQL 17 in us-west-1. Validation projects are not production and must not be confused with the canonical production database.

Primary Supabase migration ledger currently includes the reconciliation migration:
- 20260903182025 — align_queue_orphan_view_with_reconciler.

## 3. Canonical counts vs infrastructure counts

These are intentionally different concepts.

| Object | Canonical count | Current technical inventory | Interpretation |
|---|---:|---:|---|
| HOCKER apps | 10 | 10 canonical product definitions | unchanged |
| Canonical AGIs | 16 | 16 registry/runtime identities | unchanged |
| GitHub engineering repositories | 5 in DOC-05 2026.08 | 9 connected | documentation baseline is stale |
| Vercel projects | 3 in DOC-05 2026.08 | 4 connected | documentation baseline is stale |
| Supabase projects | 1 production/core | 3 connected incl. validation | production count remains 1 |
| Validation projects | not part of product inventory | 2 observed | classify as validation infrastructure |

## 4. Provider/integration consolidation findings

### Keep

- GitHub, Vercel and the primary Supabase project remain core control-plane providers.
- Langfuse remains replaceable telemetry/evaluation infrastructure where enabled.
- Dedicated repos for domains with materially different release/security boundaries remain separate until measured consolidation proves safe.
- PUNTO·G remains separately governed; its repository and Vercel project are not evidence of a new canonical HOCKER app.

### Do not reintroduce

- Supabase Realtime as the command-page dependency.
- Experimental event-fabric paths that were already rolled back.
- Historical GCP/Hetzner/Firebase architecture as current baseline.

### Candidates for future reduction

No current provider can be safely removed from the connected production topology based only on this evidence cut.

The strongest proven simplification is architectural: Hocker ONE commands use the authenticated API plus polling instead of requiring Realtime, preserving the command contract while reducing one runtime dependency.

## 5. Continuity corrections closed in this cycle

### Queue orphan semantics

The operational view previously surfaced rejected historical records as orphan candidates.

Current definition is aligned to the canonical reconciler:

- queue status = executed
- no matching agi_runs row
- no orphan archive row

Post-change verification: orphan_count = 0.

The three historical HOSTIA rejected actions remain intact as evidence.

### Invalid project id classification

GET /api/commands with an invalid project id previously produced HTTP 500 because normalizeProjectId() raised a normal Error outside ApiError translation.

The common project-role boundary was corrected so invalid project identifiers return HTTP 400.

Acceptance evidence:
- CI fully green.
- Preview returned HTTP 400 for the original failing request.
- Production returned HTTP 400 for the same request.
- Valid-project unauthenticated access still returns HTTP 401.

## 6. Production smoke at this cut

- /login → HTTP 200.
- /api/commands?project_id=<invalid> → HTTP 400.
- /api/commands?project_id=hocker-one without session → HTTP 401.
- Vercel deployment → READY.
- Runtime error/fatal query for the reviewed deployment → no error/fatal entries observed.

## 7. Canonical-document drift register

The following statements in historical 2026.08 canonical PDFs must be interpreted as historical evidence, not current counts:

- “Five repositorios GitHub verificables.”
- “Tres proyectos Vercel activos.”

The current connected reality is 9 GitHub repositories and 4 Vercel projects.

This is a documentation drift condition, not a product-count change.

The 10-app and 16-AGI canon remains unchanged. Infrastructure repositories and validation projects must not be counted as additional apps or AGIs.

## 8. Open evidence gates

These remain open unless separately revalidated:

- physical Node Agent freshness/re-enrollment.
- backup/restore drill with measured RPO/RTO.
- complete current AGI tool-evaluation evidence.
- human AAL2 ceremonies where required.
- provider settings that require Dashboard-level verification.
- PUNTO·G branch protection/governance hardening.
- exact production readiness of dedicated nova.agi runtime if independently relied upon.

## 9. Operating rule

Before any material mutation:

1. Re-query GitHub main, PR and workflow state.
2. Re-query Vercel deployment and runtime state.
3. Re-query Supabase project, migration and security state.
4. Compare against this evidence cut and the canonical source responsible for the affected domain.
5. Mutate only through PR + CI + Preview + validated migration/change.
6. Run production smoke before calling the change closed.

## 10. Status

**CONTINUITY REALITY: ALIGNED for current Hocker ONE production flow.**

**DOCUMENTATION DRIFT: IDENTIFIED and explicitly classified.**

**PROVIDER REDUCTION: no safe production deletion proven by current evidence.**

**PRODUCTION: READY and smoke-validated.**
