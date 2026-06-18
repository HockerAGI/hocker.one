# HOCKER ONE — Master Correction Pack

## Scope
I reviewed the three artifacts you provided in this session:

- `ReplitExport-HockerAGI.tar.gz`
- `HOCKER_EXPORT_20260616_155414.zip`
- `HOCKER_EXPORT_EXTREME_20260616_160753.zip`

## What the archives say
The repository is already in a mostly coherent live state. The active source tree is organized around `src/`, `_external/`, `docs/`, `android/`, `supabase/`, `scripts/`, `public/`, `.agents`, `.github`, and `.config`. The external packages are present as `_external/nova.agi` and `_external/hocker-node-agent`, and the root manifest shows Next.js 16.2.4, Capacitor 8.3.1, Supabase, Trigger.dev, Langfuse, and the Hocker-specific operational scripts.

The most important check passed: the active source tree does not show broken local imports in runtime files. The only unresolved references found by the scan are in archived/generated paths, not in the live runtime tree.

## What the documentation is telling us
The docs are consistent on one hard rule: Hocker ONE is a central control plane, not a loose execution surface. Sensitive actions must go through owner/compliance gates, and Jurix must validate the risky paths before money or execution moves. That is aligned with the compliance and control model described in the ecosystem docs. The same docs also keep Hocker ONE as the central synchronizing interface for the ecosystem. 

## Concrete corrections that are worth doing now

### 1) Expand the environment contract
The current `env.example` is too small for the variables that the repository actually reads. The code references a much wider Hocker-specific contract: Supabase, NOVA/orchestrator, GitHub worker boundary, Langfuse, Trigger.dev, runtime flags, node identity, Vercel, browser automation, and cloud command nodes.

This is the main actionable gap that should be corrected before any fresh deploy.

### 2) Keep the archive boundaries intact
The legacy files that were part of the 13-2C cleanup are already absent from the active source tree. That is correct. Do not reintroduce them into `src/` just because they appear in archival audits. They belong in archive/reference space only.

### 3) Preserve the current runtime tree
Do not overwrite the live tree with any archived copy from the zips. The right model is:
- live source tree = source of truth
- zips = recovery envelope and evidence bundle
- docs = policy and operating contract

### 4) Re-import through manifests, not by blind copy
Use the manifest approach to restore the repo if you need to reconstruct it on another device:
- `.git` for history
- `env.example.enhanced` for runtime contract
- `manifest.sample.json` for topology
- repo root mirror for content
- archive zips for recovery only

## Safe execution order in Ubuntu / Termux
1. Extract the repo.
2. Back up the current state.
3. Replace the minimal env template with the enhanced one.
4. Validate imports and hashes.
5. Run typecheck and build.
6. Commit only after the validation pass is clean.
7. Push only after the tree and env contract are consistent.

## What I would not touch yet
- Owner gate logic
- middleware/proxy security layers
- Supabase policies and auth flow
- archived `docs/archive/` materials
- current control-plane page structure
- current AGI registries and runtime router paths

## Included files
- `env.example.enhanced`
- `manifest.sample.json`
- `repo_inventory.json`
- `apply_review_notes.md`
