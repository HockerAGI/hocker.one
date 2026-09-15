# HOCKER One — Continuity Handoff — Operating Loop Work Session

Evidence cut: 2026-09-15
Repository: `HockerAGI/hocker.one`
PR: #371 — `feat(operating-loop): persist governed work sessions`
Base: `main` @ `cc3ecb28d23b710b65fe18b360273ee110fbd1ac`
Current feature head: `465950af98bb795be89c6b18f9cd3bcde16351a1`

## 1. Executive state

PR #371 remains **OPEN / NOT MERGED**. No production migration has been applied from this branch. The current Vercel Preview for exact head `465950af...` reached **READY** (`dpl_CYUXkdVwyENbzZUvC3zhpvDY6Ddo`).

The corrective implementation replaced the original split client-side session/event writes with atomic PostgreSQL RPCs. This was required by the pre-merge gate because the previous path could expose a session without its corresponding event after process failure.

## 2. Root-cause finding

The original persistence wrapper in commit `2701d222f706a222d66b41de8444bb7aa1020cb3` performed:

1. session INSERT;
2. separate event INSERT;
3. compensating DELETE/UPDATE on event failure.

That is not an atomic transaction boundary. The gate therefore correctly held the PR.

The corrective commit chain changed the write path to database-side functions:

- `hocker_create_work_session(...)`
- `hocker_transition_work_session(...)`

The transition function locks the current row with `FOR UPDATE`, computes `version + 1`, updates the state/version, and appends the event inside the same transaction.

## 3. Current implementation

Authoritative files on the PR branch:

- `supabase/migrations/20260913170000_hocker_operating_loop_work_sessions.sql`
- `src/lib/hocker-operating-loop/store.ts`
- `tests/hocker-operating-loop-work-session.test.mjs`

The migration:

- references existing `projects`, `agi_runs`, `agi_tasks`, and `agi_action_queue` authorities;
- uses existing project membership/operator/owner functions;
- enables RLS;
- enforces `unique (project_id, idempotency_key)` for sessions;
- enforces `unique (work_session_id, sequence)` and event idempotency;
- serializes concurrent transitions with `FOR UPDATE`;
- keeps the work-session envelope as a wrapper around existing authorities rather than creating parallel task/run/queue systems.

The store now performs create/transition writes through RPC only. Event reads remain ordinary authenticated reads.

## 4. Test correction

The latest test-only failure was caused by a stale assertion retained from the **old optimistic-concurrency implementation**:

`assert.match(store, /WORK_SESSION_CONFLICT/)`

The atomic RPC design no longer relies on client-side optimistic conflict detection; serialization is now enforced at the database row lock. The test was therefore aligned to the current contract by asserting the generic transition failure path while retaining explicit SQL assertions for invalid transitions and not-found behavior.

Do not reintroduce a client-side optimistic-conflict contract merely to satisfy the old test.

## 5. Verification status

- Vercel exact-head deployment for `465950af...`: **READY**.
- The first CI attempt for `465950af...` (`CI #1146`, run `34949209053`) failed during the Regression Tests step; Typecheck/Lint/Build/Audit were consequently skipped.
- The GitHub connector available in this session did not expose the regression-step log body, so the exact failing test name from that run is not independently re-read here.
- The test correction was committed at `465950af...` after inspecting the failing contract mismatch visible in the exact test source.

Because CI is not yet proven green on the post-correction head, **PR #371 remains HOLD**. Do not merge and do not apply the migration to production.

## 6. Production/main safety boundary

`main` remains untouched by this feature branch. The PR base is `cc3ecb28...` and the feature head is `465950af...`.

No production Supabase mutation was authorized or performed from this branch.

Before any future migration application, re-query current production schema and migration ledger. Never infer current production state from historical handoffs.

## 7. Next exact continuation sequence

1. Re-query PR #371 exact head and commit status.
2. Re-query GitHub Actions for `465950af...` and inspect the newest Regression Tests result. The target condition is a new exact-head CI run with Regression, Typecheck, Lint, Build and Full Dependency Audit all green.
3. If CI fails, inspect the actual failing assertion before changing code. Do not broaden the diff.
4. Re-query Vercel exact-head deployment and build/runtime evidence. Current Preview for `465950af...` is already READY; confirm it remains healthy.
5. Re-verify the migration against the current production Supabase schema and current migration ledger. This is a verification step only; do not apply yet.
6. Only after exact-head CI + Vercel + current-schema verification are green may the PR move from HOLD to merge review.
7. Never merge directly from this continuity handoff without a fresh state re-query.

## 8. Canon / continuity interpretation

This PR is a **candidate milestone**, not a completed production milestone. The feature branch contains the corrective atomic persistence implementation, but `main` and production remain on their prior state until a fully green gated merge occurs.

Any document claiming Work Session persistence is already merged into `main` would be incorrect at this evidence cut.

## 9. Files added/changed in the current candidate

Feature implementation:
- `supabase/migrations/20260913170000_hocker_operating_loop_work_sessions.sql`
- `src/lib/hocker-operating-loop/store.ts`
- `src/lib/hocker-operating-loop/types.ts`
- `src/lib/hocker-operating-loop/state.ts`
- `src/lib/hocker-operating-loop/hash.ts`
- `tests/hocker-operating-loop-work-session.test.mjs`

Continuity record:
- `docs/operations/HANDOFF_2026-09-15-OPERATING-LOOP-WORK-SESSION.md`

The continuity record is intentionally explicit about candidate-vs-production status so a new chat does not accidentally treat this work as merged authority.
