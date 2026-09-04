## Evidence cut 2026-09-03 — current reconciliation

This section supersedes only the mutable operational pointers above; historical evidence remains preserved.

- Hocker One `main`: `a355cfe74ea9971bea43c98ab8703ce29e397e01` after PR #326.
- PR #325 corrected `v_queue_without_run` to match the canonical reconciler; migration `20260903182025_align_queue_orphan_view_with_reconciler` is registered in Supabase.
- PR #326 corrected invalid `project_id` classification at the common authorization boundary: invalid identifiers now return HTTP 400 instead of HTTP 500.
- CI #1052: SUCCESS across regression tests, typecheck, lint, build and dependency audit.
- Vercel production deployment: `dpl_4GsSm3oNeug7Tck8WMroAfNoJbJ6`, READY, exact source SHA `a355cfe7...`.
- Production smoke: `/login` HTTP 200; invalid `project_id` on `/api/commands` HTTP 400; unauthenticated valid project request HTTP 401.
- Reviewed production runtime window: no error/fatal entries observed.

### Current infrastructure reality

- GitHub: **9 connected engineering repositories** under HockerAGI. The five-repository count in DOC-05 2026.08 is historical and must not be read as the current connected inventory.
- Vercel: **4 connected projects**: `hocker-one`, `hocker.agi`, `chido-casino`, `punto-g-web`.
- Supabase: **1 production/core project** (`yvuibbcuntqpyqiuqggd`) plus 2 observed validation projects. The inactive `chido-hardening-validation-20260806` is classified as historical validation infrastructure, not production.
- Canonical product count remains **10 apps** and **16 AGIs**. Infrastructure repositories/projects must not be counted as products or AGIs.
- `punto.g` is a separately governed product/domain repository and Vercel project; it is not automatically a new canonical HOCKER app.

### Consolidation decision

No production provider or repository is approved for deletion from this evidence cut. The proven safe simplification is removal of the commands-page Realtime dependency in favor of authenticated API + polling; no functional loss was observed.

### New live reconciliation layer

See `docs/operations/CONTINUITY_REALITY_2026-09-03.md` for the full current reality-vs-canon matrix, provider inventory, consolidation decision and open evidence gates.
