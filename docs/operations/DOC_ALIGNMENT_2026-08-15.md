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
7. `HockerAGI/chido.lab` — private — game factory, math/simulation/CHIDO Proof and release-evidence source, with explicit legacy migration debt.
8. `HockerAGI/chido.games` — private — immutable release consumption, partner-neutral CHIDO API/conformance and future B2B/RGS/runtime packaging.
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

The primary project is healthy at service level but still has Security Advisor WARN/INFO findings requiring object-by-object review. Its default Supabase branch metadata currently reports `MIGRATIONS_FAILED`; the branch metadata is older than subsequent production migrations, no recent branch-action logs explain the failure, and the cause must not be inferred. No reset/rebase is authorized by this document.

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

PR #213 (`feat/hocker-signal-nova-workspace-20260814`) is based on that exact `main` SHA and the current audited head `b07f0765a077fe25870321e46d397fd3a2a6527a` is **69 commits ahead and 0 behind**.

A full commit comparison reports **no deleted files** in the PR delta. All affected paths are `added` or `modified`. Therefore the suspected loss was caused by UI components being unmounted/restructured, not by source files being deleted.

Confirmed behavior changes:

- `WorkspaceBar` was unmounted from `PrivateShell`.
- `WorkspaceContext` and its state/actions remain in code.
- The removed bar contained the only located visible controls for `toggleTutorial()` and `resetWorkspace()`.
- This was a real functional discoverability regression: the controls were hidden, not the underlying capability deleted.
- The #213 branch now restores those controls compactly under `Más/Ajustes` through `WorkspaceControlsCard`, reusing the existing `WorkspaceContext` instead of restoring the old persistent bar.
- `HockerLiveBackground` and `HockerVfxLayer` were unmounted as presentation layers; no functional dependency has been established in this audit.
- Detailed secondary navigation was removed from the persistent sidebar, but route definitions remain in `hocker-navigation.ts` and are available through the command palette; this is a navigation-surface change, not route deletion.
- Password-login review found the post-login destination changed from `/owner` to `/app/nova`; the authentication validation itself was not removed in the reviewed handler.
- Supabase server-env changes broaden publishable/anon-key variable-name compatibility; no `service_role` exposure to the client was established by the reviewed diff.

The repaired #213 head passed repository CI and its exact Vercel Preview is READY with no error/fatal runtime logs in the queried preview window. It remains draft because authenticated exact-SHA mobile QA and the remaining visual/UX gates are separate evidence requirements.

## 5. Context / shared-memory reconciliation

### Codex instructions

Root `AGENTS.md` in Hocker One was stale/incomplete and contained provider-specific operational advice without current governance, Context Bridge, repo inventory, AGI/app counts, data-isolation rules or evidence-only percentage policy. PR #214 updates it into a durable repo operating contract.

`punto.g/AGENTS.md` already contains strong domain-specific isolation and safety rules. Those private-domain rules must **not** be flattened into global shared memory.

`nova.agi` had no root `AGENTS.md`; draft PR #32 adds a runtime-specific Codex contract that points to HOCKER context/governance while preserving NOVA's deployment/security boundaries and sensitive-domain isolation.

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

`src/lib/hocker-context-pack.ts` previously embedded obsolete phase labels and subjective percentages (84%, 90%, 69%, etc.). Those values had no observable denominator and violated the current evidence-only reporting rule. PR #214 removes manual phase/progress claims, keeps registries/capabilities/runtime evidence pointers and adds a regression test preventing subjective progress fields from returning.

## 6. Historical integration document

Root `INTEGRATION_VERIFICATION.md` dated 2025-07-09 claimed all four-repo integrations were verified and described Chido `gamesPaused` as fail-open. That statement conflicts with current fail-closed security posture and the expanded ecosystem. PR #214 marks it as a historical snapshot rather than deleting the history.

## 7. CHIDO Lab / CHIDO Games boundary reconciliation

The conceptual split is valid, but the repository cleanup is not finished.

Current `chido.games/main` defines:

- CHIDO Lab as game factory/math/RNG/simulation/CHIDO Proof source;
- CHIDO Games as immutable release consumer, neutral CHIDO API/conformance and future B2B/RGS/runtime boundary;
- Chido Casino as the operator/player boundary.

However `chido.lab/main` still carried pre-split `CHIDO Games` naming in its README and root package (`@hocker/chido-games`) and still compiles legacy `chido-api-contracts` / `chido-api-conformance` copies. The historical architecture spec in Lab confirms the migration rule **COPY/REBUILD FIRST -> COMPATIBILITY TEST -> SWITCH CONSUMER -> DELETE DUPLICATE LAST**, with deletion reserved for F8 after parity/cutover/rollback evidence.

Draft `chido.lab` PR #6 corrects the README boundary without deleting code. Its first CI run correctly failed because a repository boundary test required the explicit phrase `does not mutate wallet`; the README was amended to retain that executable contract. Final CI must be green before the documentation change is considered validated.

Do not delete the legacy API packages or rename the root package solely for cleanliness until cross-repository compatibility tests and consumer cutover prove they are no longer referenced.

## 8. Documentation publications requiring formal next edition

The following factual sections of the 2026-08-05 PDFs must be updated in the next approved publication cycle:

### DOC-00 — Índice Maestro / Gobierno Documental

- repository inventory: 5 -> 9 observed engineering repositories;
- platform inventory: one primary Supabase project plus one validation project must be classified;
- document drift rules should reference current Context Bridge and evidence pack workflow;
- repository count must not be confused with canonical app count.

### DOC-05 — Arquitectura Técnica y Plataforma

- inventory table must include `hocker.ads`, `chido.lab`, `chido.games`, `punto.g` with their actual roles/states;
- `nova.agi` deployment must be labeled configuration/contract present but live dedicated runtime unverified until connected health evidence exists;
- Hocker Ads is no longer documentation-only: it has app/data/test scaffolding and active EXP-01/E-060 engineering, while production providers/payments remain unverified;
- Chido Lab/Games separation and remaining F8 duplicate-cleanup debt must be recorded explicitly;
- Supabase validation project and branch-state drift must be classified.

### DOC-07 — Seguridad, Privacidad, Soberanía y Continuidad

- replace obsolete statement that repository SECURITY evidence is absent; 9/9 repos have `SECURITY.md` in this snapshot;
- preserve current Security Advisor blockers rather than marking backend clean;
- classify the validation Supabase project and its RLS/SECURITY DEFINER findings;
- preserve domain-isolation rules for PUNTO·G/Chido/Wallet/NEXPA/Trackhok.

### DOC-11 — Operación / QA / SRE / FinOps

- add Context Bridge freshness/manifest lifecycle to operational evidence;
- add Supabase branch migration-state reconciliation;
- define exact-SHA authenticated preview/mobile QA as a release artifact;
- track cross-repository compatibility/cutover evidence before F8 duplicate removal.

## 9. Current closure relationship

This document complements, not replaces, `docs/operations/PLATFORM_CLOSURE_2026-08-14.md` (PR #209). #209 remains the global fail-closed release evidence pack. Any material new blocker found here must be reflected there rather than creating a competing closure checklist.

## 10. Non-authorizations

This alignment does not authorize:

- merge to `main`;
- production DDL;
- Supabase branch reset/rebase;
- secret rotation;
- real-money casino activation;
- wallet custody/transfers;
- enabling AGI material actions;
- automatic Context Bridge manifest activation;
- creation of production infrastructure for `punto.g`;
- deletion of CHIDO Lab legacy API packages before F8 compatibility/cutover evidence.

## 11. Next evidence gates

1. Confirm final CI for the CHIDO Lab/Games boundary documentation fix.
2. Resolve or explicitly classify Supabase Security Advisor findings.
3. Reconcile `MIGRATIONS_FAILED` branch metadata without destructive assumptions.
4. Obtain current runtime deployment/health evidence for NOVA.
5. Generate real 16-AGI eval/tool evidence through the governed path.
6. Finish #213 authenticated exact-SHA mobile/visual QA.
7. Refresh Context Bridge checkpoints and create a new draft manifest.
8. Finish CHIDO cross-repo parity/consumer cutover before F8 duplicate deletion.
9. Publish formal updated DOC-00/DOC-05/DOC-07/DOC-11 from an approved editable source when the evidence set is frozen.
