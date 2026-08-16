# Global Continuity Event Ledger Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make HOCKER project continuity reconstructible across ChatGPT, Codex, GitHub, Supabase and Vercel without repeated full audits by storing material repo/platform events durably, maintaining a compact current-state projection and reconciling missed events incrementally.

**Architecture:** Supabase is the primary continuity ledger and current-state store. A read-only GitHub App sends verified webhooks to a Supabase Edge Function; accepted deliveries are persisted idempotently and queued in PGMQ, then a processor updates current projections and Context Bridge checkpoints. Supabase Cron performs incremental backstop reconciliation. A sanitized GitHub issue mirrors only the latest recovery state without commits or GitHub Actions. Provider/product business payloads remain outside the global ledger.

**Tech Stack:** Supabase Postgres, `pgmq`, `pg_cron`, `pg_net` (all verified installed), Supabase Edge Functions/Deno, GitHub App webhooks/API, Vercel REST API, existing Hocker One Context Bridge, TypeScript/Next.js.

## Global Constraints

- Implement after or in coordination with the Provider-Independent AGI Runtime and Durable Memory plan; do not create a second memory/session system.
- Global continuity records engineering/lifecycle metadata for all HOCKER repositories, but this chat does not modify other product repos beyond Hocker One/NOVA.
- No raw chats, secrets, KYC, payments, private domain payloads or restricted user data in the continuity ledger/mirror.
- GitHub App permissions begin read-only and least-privilege.
- Webhook ingestion is evidence-only; it never performs GitHub writes or provider mutations.
- Invalid GitHub HMAC is rejected before persistence.
- `(provider, delivery_id)` is idempotent; repeated webhook deliveries do not create duplicate history.
- No GitHub Actions scheduled polling. Supabase Cron is the backstop.
- Vercel Hobby is read via REST; account webhooks are not assumed.
- Context Bridge remains the operational manifest/checkpoint authority; this plan extends the evidence supply, not replaces it.
- New manifests remain draft until Owner + MFA AAL2 activation.
- Use a non-PR work branch based on #214 head, then fast-forward #214 only once the complete batch is ready, to spend one meaningful CI run.

---

## File Structure

- Create `supabase/migrations/20260816074500_global_continuity_ledger.sql` — ledger/state/handoff schema, RLS/grants, queue, helper functions.
- Create `supabase/migrations/20260816074600_global_continuity_cron.sql` — cron jobs only after functions/endpoints exist; disabled/safe defaults until secrets/config are present.
- Create `supabase/functions/hocker-continuity-github/index.ts` — GitHub HMAC ingress.
- Create `supabase/functions/hocker-continuity-process/index.ts` — queue consumer / event normalizer.
- Create `supabase/functions/hocker-continuity-reconcile/index.ts` — incremental API reconciliation.
- Create `src/lib/continuity-event-schema.ts` — shared normalized event/current-state types.
- Create `src/lib/continuity-current-state.ts` — compact recovery projection reader.
- Create `src/app/api/context-bridge/bootstrap/route.ts` — authenticated recovery/bootstrap API for Hocker One/authorized HOCKER clients.
- Modify `src/lib/project-continuity.ts` — use the new state projection/cursors instead of full scans as the default path; preserve manual reconciliation fallback.
- Modify `src/lib/context-bridge.ts` — attach new checkpoint refs/capabilities without raw event payloads.
- Modify `docs/operations/CONTINUITY_PROTOCOL.md`, `LAST_KNOWN_STATE.md`, `INDEX.md` after behavior is proven.
- Create tests: `tests/continuity-webhook-security.test.mjs`, `tests/continuity-event-normalization.test.mjs`, `tests/continuity-current-state.test.mjs`, `tests/continuity-reconciliation.test.mjs`.

---

### Task 1: Lock the security/idempotency contracts in tests

**Files:**
- Create: `tests/continuity-webhook-security.test.mjs`
- Create: `tests/continuity-event-normalization.test.mjs`

**Interfaces:**
- Tests expect a GitHub ingress that validates raw-body HMAC, requires delivery/event headers and inserts normalized metadata only.

- [ ] **Step 1: Write signature validation expectations**

```js
assert.match(githubIngress, /x-hub-signature-256/i);
assert.match(githubIngress, /timingSafeEqual|subtle\.verify/i);
assert.match(githubIngress, /x-github-delivery/i);
assert.match(githubIngress, /x-github-event/i);
```

- [ ] **Step 2: Write persistence safety expectations**

Reject source patterns that store headers/auth/raw body/transcript/messages into `sanitized_payload`.

- [ ] **Step 3: Write idempotency expectations**

Migration must contain a unique constraint/index on `(provider, delivery_id)` and upsert/do-nothing behavior.

- [ ] **Step 4: Review expected red state without running Actions**

The files/functions do not exist yet; batch implementation before one final candidate CI.

---

### Task 2: Add the append-only continuity ledger and current-state tables

**Files:**
- Create: `supabase/migrations/20260816074500_global_continuity_ledger.sql`

**Interfaces:**
- Produces `continuity_events`, `continuity_repository_state`, `continuity_provider_state`, `continuity_handoffs` and service-only functions/views.

- [ ] **Step 1: Create `continuity_events`**

Columns: UUID id, project_id, provider, delivery_id, event_type/action, resource_type/id, repository_id/full_name nullable, source_revision nullable, occurred_at/received_at, payload_hash, sanitized_payload, processing_state, processed_at, error_code, created_at.

- [ ] **Step 2: Enforce append-only semantics**

No client UPDATE/DELETE grants. Processor uses narrowly scoped server-side function for processing-state changes rather than arbitrary client DML.

- [ ] **Step 3: Create `continuity_repository_state` keyed by stable GitHub repository ID**

Track current name, visibility, archive/lifecycle state, default branch, head SHA, last push/update, first/last seen, last event/checkpoint.

- [ ] **Step 4: Create `continuity_provider_state`**

Initial resource types: `vercel.project`, `vercel.deployment`, `supabase.project`, `supabase.branch`, optional runtime resources. Provider state is metadata/evidence only.

- [ ] **Step 5: Create `continuity_handoffs`**

Store structured objective, phase/gate, decisions, blockers, next_action, repo/branch/PR/SHA/evidence refs and actor. Never transcript arrays.

- [ ] **Step 6: Enable RLS/revoke client access**

`anon` and `authenticated` have no direct table DML. Any future UI reads use a sanitized authenticated RPC/view.

---

### Task 3: Provision the durable queue using existing PGMQ

**Files:**
- Same migration or a dedicated helper section in `20260816074500_global_continuity_ledger.sql`

**Interfaces:**
- Queue name: `hocker_continuity`.
- Message body contains only internal event UUID/delivery ID, not raw webhook payload.

- [ ] **Step 1: Create queue idempotently**

Use installed `pgmq` extension; do not attempt to reinstall it.

- [ ] **Step 2: Add enqueue helper**

`enqueue_continuity_event(p_event_id uuid)` writes the event ID only.

- [ ] **Step 3: Define retry/dead-letter policy in processor logic**

Processing failure leaves/requeues message and records sanitized error code. Repeated permanent failures are surfaced in current state rather than discarded.

---

### Task 4: Implement verified GitHub App webhook ingress

**Files:**
- Create: `supabase/functions/hocker-continuity-github/index.ts`

**Interfaces:**
- Input: GitHub webhook HTTP request.
- Output: 2XX quickly after verified idempotent persistence/enqueue; 401/403 invalid signature; 400 missing required delivery/event headers.

- [ ] **Step 1: Read the raw body exactly once**

- [ ] **Step 2: Validate `X-Hub-Signature-256` against a server-only webhook secret**

Use constant-time comparison/WebCrypto. Do not parse JSON before signature validation.

- [ ] **Step 3: Normalize allowlisted metadata**

Initial events: `installation`, `installation_repositories`, `repository`, `push`, `pull_request`, `workflow_run`, `release`, and branch/tag create/delete when materially useful.

- [ ] **Step 4: Sanitize aggressively**

Store repository IDs/names, refs/SHAs, PR/workflow/deployment-like states and timestamps; omit commit message bodies/comments/files unless a specific later contract requires them.

- [ ] **Step 5: Insert idempotently and enqueue event ID**

Duplicate delivery returns 2XX with `duplicate=true` and no second queue message.

---

### Task 5: Process events into current projections and Context Bridge checkpoints

**Files:**
- Create: `supabase/functions/hocker-continuity-process/index.ts`
- Create: `src/lib/continuity-event-schema.ts`

**Interfaces:**
- Normalized processor maps one event to zero/one repository/provider current-state updates plus optional Context Bridge checkpoint trigger.

- [ ] **Step 1: Normalize repository lifecycle**

Use GitHub stable repository ID for rename detection. `repository.deleted` or a reconciliation miss does not erase history; state becomes `removed`/`unreachable` with timestamp/evidence.

- [ ] **Step 2: Normalize push/PR/workflow state**

Update head/activity/focus metadata without copying full diffs/logs into continuity tables.

- [ ] **Step 3: Generate a compact checkpoint summary**

Checkpoint references the event/state IDs and exact SHA/PR; it does not embed raw payload.

- [ ] **Step 4: Mark event processed atomically**

Only after projections/checkpoint succeed; otherwise retain retryable state.

---

### Task 6: Build the compact current-state recovery projection

**Files:**
- Create: `src/lib/continuity-current-state.ts`
- Create: `tests/continuity-current-state.test.mjs`

**Interfaces:**

```ts
export async function getHockerCurrentState(projectId: string): Promise<{
  observed_at: string;
  repositories: Array<RepositoryCurrentState>;
  focus: { hocker_one: FocusRepoState; nova_agi: FocusRepoState };
  providers: Array<ProviderCurrentState>;
  agi_evidence: AgiEvidenceSummary;
  handoff: ContinuityHandoff | null;
  manifests: { active: ManifestRef | null; draft: ManifestRef | null };
  stale_sources: string[];
}>;
```

- [ ] **Step 1: Read current-state tables, not full history**

- [ ] **Step 2: Join current AGI evidence through the existing certification snapshot**

Use explicit denominators; no subjective percentages.

- [ ] **Step 3: Add active/draft Context Bridge refs and latest handoff**

- [ ] **Step 4: Mark staleness by source last_seen/verified time**

---

### Task 7: Expose an authenticated bootstrap endpoint

**Files:**
- Create: `src/app/api/context-bridge/bootstrap/route.ts`
- Reuse project-role auth from Hocker One

**Interfaces:**
- GET returns a sanitized `getHockerCurrentState()` payload for authorized project roles.
- No secrets/provider credentials/raw payloads.

- [ ] **Step 1: Require project membership/role**

- [ ] **Step 2: Return `Cache-Control: no-store`**

- [ ] **Step 3: Include exact freshness metadata**

New ChatGPT/Codex/Hocker clients can decide what needs live re-query instead of triggering a full audit.

---

### Task 8: Convert the existing reconciler into an incremental backstop

**Files:**
- Modify: `src/lib/project-continuity.ts`
- Create: `supabase/functions/hocker-continuity-reconcile/index.ts`
- Test: `tests/continuity-reconciliation.test.mjs`

**Interfaces:**
- Reconciler accepts/reads cursors and only requests mutable resources since last seen where APIs permit.

- [ ] **Step 1: Keep the existing full inventory path as manual integrity fallback**

- [ ] **Step 2: Default to incremental GitHub reconciliation**

Compare current accessible repository IDs/heads to `continuity_repository_state`; repair missed create/delete/rename/push state.

- [ ] **Step 3: Reconcile Vercel via REST**

Track Hocker One project/current production/preview candidate metadata without Account Webhooks.

- [ ] **Step 4: Record evidence gaps**

If webhook history is missing but current state is repaired, mark historical gap explicitly; do not fabricate an event.

- [ ] **Step 5: Keep provider failures isolated**

One unavailable provider does not fail or overwrite all current state.

---

### Task 9: Schedule Supabase Cron, not GitHub Actions

**Files:**
- Create: `supabase/migrations/20260816074600_global_continuity_cron.sql`

**Interfaces:**
- Backstop cadence target starts at every 5 minutes only after validation confirms cost/rate behavior.

- [ ] **Step 1: Use existing `pg_cron` + `pg_net`**

Do not install extensions already present.

- [ ] **Step 2: Keep the production schedule disabled/config-gated until Edge Function URL/secret is configured**

A migration must not start a broken cron that spams failures.

- [ ] **Step 3: Record cron run/error evidence**

Expose repeated failures in the continuity current-state health, not via GitHub Actions.

---

### Task 10: Add the sanitized GitHub recovery mirror

**Files:**
- Hocker One code: add a small server-only mirror writer under `src/lib/continuity-github-mirror.ts` or equivalent.
- Use one dedicated GitHub issue in `hocker.one` created manually/through Owner-approved setup.

**Interfaces:**
- Updates the same issue body at material milestones; does not commit files.

- [ ] **Step 1: Define exact safe fields**

Timestamp, repository count/lifecycle delta, Hocker One/NOVA focus SHA+PR, blockers, next action, Context Bridge manifest IDs/versions.

- [ ] **Step 2: Never include private issue/PR bodies, raw event payload, secrets or restricted-domain data**

- [ ] **Step 3: Update only on material change or explicit session handoff**

No heartbeat spam/API abuse.

---

### Task 11: GitHub App setup package and manual Owner handoff

**Files:**
- Create/update operational docs only after implementation is ready.

**Manual inputs required from Owner/GitHub UI:**
- Create/install HOCKER continuity GitHub App on the HockerAGI personal account.
- Select all current HOCKER repos or explicitly approved repository access.
- Configure the Edge Function webhook URL.
- Generate/store webhook secret and GitHub App private key as server-only secrets.
- Grant only the read permissions needed for repository metadata, pull requests, workflows/deployments/releases as implemented.

- [ ] **Step 1: Leave exact permission/event checklist in runbook**

- [ ] **Step 2: Verify installation token can enumerate expected repositories**

- [ ] **Step 3: Deliver a signed test webhook and confirm one ledger row/queue item**

---

### Task 12: Validation and missed-event recovery drill

**Files:**
- Tests above
- Supabase validation project first

- [ ] **Step 1: Apply migrations/functions in validation**

- [ ] **Step 2: Replay synthetic signed GitHub fixtures**

Cover repo create/rename/archive/remove, push, PR open/update/close and workflow status.

- [ ] **Step 3: Send a duplicate delivery**

Expected one event/current-state transition only.

- [ ] **Step 4: Deliberately omit one event**

Change fixture/API state, run reconciler, verify current state repairs itself and records a historical evidence gap.

- [ ] **Step 5: Simulate provider outage**

Preserve last-known state, mark stale, no destructive resets.

- [ ] **Step 6: Verify bootstrap response is sufficient to resume a session without full inventory scans**

---

### Task 13: Final candidate verification, Context Bridge and merge gate

**Files:**
- Update `docs/operations/CONTINUITY_PROTOCOL.md`, `LAST_KNOWN_STATE.md`, `INDEX.md` after executable evidence is final.

- [ ] **Step 1: Fast-forward #214 branch once the full continuity batch is ready**

- [ ] **Step 2: Run one final Hocker One candidate CI**

Regression, typecheck, lint, build and security/dependency audit must pass.

- [ ] **Step 3: Verify exact Vercel Preview and bootstrap endpoint**

READY, authenticated, no new error/fatal cluster.

- [ ] **Step 4: Generate fresh Context Bridge checkpoints + draft**

Coverage must identify any source still stale/missing. Do not activate yet.

- [ ] **Step 5: Complete Owner + MFA AAL2 activation only after review**

Activation is a separate governed action; historical manifests remain immutable.

- [ ] **Step 6: Reconcile #213 mobile QA/security/platform closure gates**

Do not merge `main` merely because continuity is green.

- [ ] **Step 7: Merge to `main` only when both continuity plans, #213 exact mobile QA, relevant #209 security/platform gates and NOVA contract checks are green on the final reviewed candidate**

Use expected head SHA when merging to prevent a moved-head race.
