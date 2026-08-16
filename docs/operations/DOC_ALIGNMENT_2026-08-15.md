# HOCKER — DOC-ALIGNMENT / Estado observable — 2026-08-15

Status: **ACTIVE ALIGNMENT EVIDENCE — NOT A RELEASE AUTHORIZATION**  
Scope: reconciliation between the 2026.08 canonical publications and currently observable GitHub/Vercel/Supabase/runtime evidence.  
Baseline rule: production/configuration > `main`/migrations > executable contracts/tests > approved evidence > canonical publications > historical material.

## 1. Purpose

The canonical PDFs dated 2026-08-05 remain the approved human publications, but several factual inventory statements are now stale. This alignment document records the observable deltas that must be incorporated into the next formal DOC-00/DOC-05/DOC-07/DOC-11 publication. It does not silently redefine the 10 canonical apps or 16 canonical AGIs.

## 2. Current engineering inventory

### GitHub

Observed repositories: **9**

1. `HockerAGI/hocker.one` — public — Hocker One control plane.
2. `HockerAGI/nova.agi` — public — dedicated NOVA runtime/orchestrator.
3. `HockerAGI/hocker-node-agent` — public — controlled local executor.
4. `HockerAGI/hocker.agi` — public — corporate/public web.
5. `HockerAGI/chido.casino` — public — Chido operator/experience.
6. `HockerAGI/hocker.ads` — private — APP-06 engineering/product repository.
7. `HockerAGI/chido.lab` — private — math/simulation/certification lab.
8. `HockerAGI/chido.games` — private — partner-neutral game/API/runtime packaging.
9. `HockerAGI/punto.g` — private — separate governed product/domain repository; not automatically a canonical HOCKER app.

Repository inventory reconciliation: **9/9 observed repositories classified at repository level = 100% inventory coverage for this snapshot.** This percentage is inventory coverage only; it is not product completion.

All nine observed repositories currently contain `SECURITY.md`: **9/9 = 100% repository security-policy file coverage**. This supersedes older documentation that reported missing SECURITY evidence. Presence of a file is not proof that every security control is implemented.

### Vercel

Observed team: `Hocker AGI` (`hockeragi`).

Observed projects: **3**

- `hocker-one`
- `hocker.agi`
- `chido-casino`

There is no observed Vercel project for `nova.agi`. The NOVA repository contains Docker/Railway deployment contracts, but a healthy dedicated live NOVA runtime has not been established by connected evidence in this audit.

### Supabase

Observed projects: **2**

1. `Hocker AGI Technologies` (`yvuibbcuntqpyqiuqggd`) — `ACTIVE_HEALTHY` — primary shared platform project.
2. `chido-hardening-validation-20260806` (`pswlloziztxjsjazfiiy`) — `ACTIVE_HEALTHY` at project level — validation environment, not a second production backend.

The validation project currently has Security Advisor findings including an **ERROR for RLS disabled on `public.validation_settlement_marker`** plus exposed `SECURITY DEFINER` RPC warnings. Keep it classified as validation-only until explicitly remediated/reclassified or retired through a controlled lifecycle decision.

The primary project is healthy at service level but still has Security Advisor WARN/INFO findings requiring object-by-object review. Its default Supabase branch metadata currently reports `MIGRATIONS_FAILED`; no branch-action logs were available in the last 24 hours, so the cause is not inferred and no reset/rebase is authorized by this document.

## 3. Canonical products and AGIs

The catalog remains **10 canonical apps** and **16 canonical AGIs** until a formal governance decision changes those counts. Engineering repositories are not equivalent to product-count changes.

### AGI registry evidence — 2026-08-15

Read-only query against the primary Supabase project for `project_id='hocker-one'`:

- AGI rows registered: **16/16**.
- AGIs with `allow_actions=false`: **16/16 = 100% guarded/fail-closed configuration coverage**.
- AGIs with persisted `agi_eval_result`: **0/16 = 0% current runtime-eval evidence coverage**.
- AGIs with persisted `agi_tool_eval_result`: **0/16 = 0% current tool-eval evidence coverage**.
- AGIs with at least one completed `agi_runs` row: **2/16 = 12.5% run-presence coverage**.

These percentages describe only their named evidence contracts. They do **not** mean the AGIs are 0%, 12.5% or 100% developed. Current certification uses eight explicit gates per AGI in `src/lib/agi-certification.ts` and must be evaluated from the full matrix.

## 4. Hocker One / PR #213 regression reconciliation

Current `main` baseline at audit start: `a5f4b1838674d6f0c5d648064f8505c280303d34`.

PR #213 (`feat/hocker-signal-nova-workspace-20260814`) is based on that exact `main` SHA and is ahead without being behind. Therefore suspected regressions come from PR changes, not from missing newer `main` commits.

Confirmed behavior changes:

- `WorkspaceBar` was unmounted from `PrivateShell`.
- `WorkspaceContext` and its state/actions remain in code.
- The removed bar contained the only located visible controls for `toggleTutorial()` and `resetWorkspace()`.
- This is a real functional discoverability regression: the controls were hidden, not the underlying capability deleted.
- Correct remediation is to expose those controls compactly under the new `Más/Ajustes` information architecture rather than restoring the old persistent bar.
- `HockerLiveBackground` and `HockerVfxLayer` were unmounted as presentation layers; no functional dependency has been established in this audit.
- Detailed secondary navigation was removed from the persistent sidebar, but route definitions remain in `hocker-navigation.ts` and are available through the command palette; this is a navigation-surface change, not route deletion.

PR #213 remains draft and must not merge until mobile dock overlap, compact command palette behavior, health/readiness semantics, the restored workspace controls and authenticated exact-SHA QA are green.

## 5. Context / shared-memory reconciliation

### Codex instructions

Root `AGENTS.md` in Hocker One was stale/incomplete and contained provider-specific operational advice without current governance, Context Bridge, repo inventory, AGI/app counts, data-isolation rules or evidence-only percentage policy. It is updated in the accompanying reconciliation branch to become a durable repo operating contract.

`punto.g/AGENTS.md` already contains strong domain-specific isolation and safety rules. Those private-domain rules must **not** be flattened into global shared memory.

`nova.agi` currently has no root `AGENTS.md`; a separate repo PR should add one pointing to its own deployment/security contracts and the HOCKER Context Bridge without copying private-domain data.

### Context Bridge

The live Context Bridge source registry contains the expected source families (ChatGPT, Codex, GitHub, Google Drive, Supabase, Vercel), but checkpoints are stale: latest observed checkpoint is from **2026-08-09** and the active manifest is based on the earlier August evidence set.

Do not mutate the historical active manifest. Correct sequence:

1. finish current audit/reconciliation;
2. refresh provider checkpoints;
3. build a new draft manifest;
4. inspect coverage and redactions;
5. activate only through the existing Owner + MFA AAL2 path;
6. retain the prior manifest as immutable history.

The later AAL2 addendum superseded the earlier HOLD at code/deployment level, but a real human TOTP enrollment + activation ceremony remains a separate evidence gate.

### Context Pack

`src/lib/hocker-context-pack.ts` previously embedded obsolete phase labels and subjective percentages (84%, 90%, 69%, etc.). Those values had no observable denominator and violated the current evidence-only reporting rule. The reconciliation branch removes manual phase/progress claims and keeps registries, capabilities, runtime/tool state and evidence pointers.

## 6. Historical integration document

Root `INTEGRATION_VERIFICATION.md` dated 2025-07-09 claimed all four-repo integrations were verified and described Chido `gamesPaused` as fail-open. That statement conflicts with current fail-closed security posture and the expanded ecosystem. The reconciliation branch marks it as a historical snapshot rather than deleting the history.

## 7. Documentation publications requiring formal next edition

The following factual sections of the 2026-08-05 PDFs must be updated in the next approved publication cycle:

### DOC-00 — Índice Maestro / Gobierno Documental

- repository inventory: 5 -> 9 observed engineering repositories;
- platform inventory: one primary Supabase project plus one validation project must be classified;
- document drift rules should reference current Context Bridge and evidence pack workflow;
- repository count must not be confused with canonical app count.

### DOC-05 — Arquitectura Técnica y Plataforma

- inventory table must include `hocker.ads`, `chido.lab`, `chido.games`, `punto.g` with their actual roles/states;
- `nova.agi` deployment must be labeled configuration/contract present but live dedicated runtime unverified until connected health evidence exists;
- Hocker Ads is no longer documentation-only: it has app/data/test scaffolding and active EXP-01 engineering, while production providers/payments remain unverified;
- Chido Lab/Games separation must be recorded explicitly;
- Supabase validation project and branch-state drift must be classified.

### DOC-07 — Seguridad, Privacidad, Soberanía y Continuidad

- replace obsolete statement that repository SECURITY evidence is absent; 9/9 repos have `SECURITY.md` in this snapshot;
- preserve current Security Advisor blockers rather than marking backend clean;
- classify the validation Supabase project and its RLS/SECURITY DEFINER findings;
- preserve domain-isolation rules for PUNTO·G/Chido/Wallet/NEXPA/Trackhok.

### DOC-11 — Operación / QA / SRE / FinOps

- add Context Bridge freshness/manifest lifecycle to operational evidence;
- add Supabase branch migration-state reconciliation;
- define exact-SHA authenticated preview/mobile QA as a release artifact.

## 8. Current closure relationship

This document complements, not replaces, `docs/operations/PLATFORM_CLOSURE_GATE_2026-08-14.md` (PR #209). #209 remains the global fail-closed release evidence pack. Any material new blocker found here must be reflected there rather than creating a competing closure checklist.

## 9. Non-authorizations

This alignment does not authorize:

- merge to `main`;
- production DDL;
- Supabase branch reset/rebase;
- secret rotation;
- real-money casino activation;
- wallet custody/transfers;
- enabling AGI material actions;
- automatic Context Bridge manifest activation;
- creation of production infrastructure for `punto.g`.

## 10. Next evidence gates

1. Finish current repo-by-repo CI/governance/version snapshot.
2. Resolve or explicitly classify Supabase Security Advisor findings.
3. Reconcile `MIGRATIONS_FAILED` branch metadata without destructive assumptions.
4. Obtain current runtime deployment/health evidence for NOVA.
5. Generate real 16-AGI eval/tool evidence through the governed path.
6. Finish #213 UI regression/mobile/authenticated exact-SHA QA.
7. Refresh Context Bridge checkpoints and create a new draft manifest.
8. Publish formal updated DOC-00/DOC-05/DOC-07/DOC-11 from an approved editable source when the evidence set is frozen.
