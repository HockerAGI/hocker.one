# Provider-Independent AGI Runtime and Durable Memory Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Hocker One the primary Unified AGI Runtime, preserve NOVA/AGI identity and conversation memory across provider/model/chat changes, remove Railway as a production requirement without deleting the portable `nova.agi` fallback prematurely, and keep Owner Gate fail-closed.

**Architecture:** Hocker One owns the canonical AGI execution path and reconstructs context from a new additive AGI Session Store in Supabase. Vercel AI Gateway is the preferred inference route, direct OpenAI/Gemini/Anthropic adapters bypass Gateway when it is unavailable or out of balance, and a configured Ollama-compatible endpoint is the local/self-hosted survival route. Existing `nova_threads`/`nova_messages` remain untouched until a later retirement gate; `nova.agi` remains a portable compatibility runtime until parity is demonstrated.

**Tech Stack:** Next.js/Node 22, TypeScript, Supabase/Postgres/RLS, Vercel AI Gateway, direct provider HTTP APIs, Ollama-compatible API, existing HOCKER AGI Canon, SYNTIA Memory Write/Review Gates, GitHub PR CI.

## Global Constraints

- No direct writes to `main`; implementation occurs on an isolated work branch based on Hocker One PR #214 head and is fast-forwarded to #214 only when the batch is ready for one meaningful CI run.
- No rename/drop of `nova_threads`, `nova_messages` or `agi_chat_messages` in this plan.
- Current observed legacy data must remain recoverable: 114 `nova_threads`, 238 `nova_messages`, 0 `agi_chat_messages` at the 2026-08-16 audit snapshot.
- `allow_actions=false` and Hocker One Owner Gate remain authoritative for material actions.
- Vercel AI Gateway is primary but never the sole inference route; Gateway balance/auth/outage must not erase session state.
- Provider/model names are internal telemetry, not NOVA identity and not public chat copy.
- No raw chat is promoted to global/shared knowledge; reusable learning passes through SYNTIA.
- Full authorized session messages may be retained in the AGI Session Store under explicit retention/classification rules.
- Do not use GitHub Actions for intermediate red/green iterations. Add tests first, review them against the old behavior, batch implementation on a non-PR work branch, then run one final PR CI on the candidate head because Actions quota is constrained.
- `nova.agi`/Railway may be retired only after exact-candidate parity + rollback evidence; `railway.json` is not deleted in this plan.

---

## File Structure

### Hocker One

- Create `supabase/migrations/20260816073000_unified_agi_sessions.sql` — additive session/message schema, service-only defaults, legacy mapping/backfill functions and read helpers.
- Create `src/lib/agi-session-store.ts` — typed persistence and context-window loader.
- Create `src/lib/agi-context-builder.ts` — deterministic context assembly from session, summary, user/client and Memory Mirror scopes.
- Create `src/lib/agi-model-router.ts` — provider-independent inference contract and failover policy.
- Create `src/lib/agi-model-providers/vercel-gateway.ts` — current Gateway behavior extracted behind an adapter.
- Create `src/lib/agi-model-providers/openai.ts` — direct OpenAI fallback.
- Create `src/lib/agi-model-providers/gemini.ts` — direct Gemini fallback.
- Create `src/lib/agi-model-providers/anthropic.ts` — direct Anthropic fallback.
- Create `src/lib/agi-model-providers/ollama.ts` — configured local/self-hosted survival route.
- Create `src/lib/agi-model-providers/types.ts` — shared completion/provider types.
- Create `src/lib/agi-learning-extractor.ts` — produces sanitized learning candidates only.
- Modify `src/lib/serverless-agi-runtime.ts` — consume session/context/router, persist response, preserve evidence.
- Modify `src/app/api/nova/chat/route.ts` — Hocker One serverless becomes primary; dedicated upstream becomes compatibility fallback behind explicit config.
- Modify `src/lib/context-bridge.ts` only if needed to reference session/handoff IDs; do not put transcripts in Context Bridge.
- Modify `AGENTS.md`, `docs/operations/CONTINUITY_PROTOCOL.md`, `docs/operations/LAST_KNOWN_STATE.md` after executable behavior is verified.
- Create `tests/agi-session-store.test.mjs`.
- Create `tests/agi-provider-failover.test.mjs`.
- Create `tests/agi-context-reconstruction.test.mjs`.
- Create `tests/agi-learning-extractor.test.mjs`.
- Update `tests/serverless-agi-runtime.test.mjs` and NOVA chat route regression tests.

### NOVA repo (`HockerAGI/nova.agi`)

- Modify PR #32 branch only after Hocker One parity batch is green.
- Modify `AGENTS.md` and `docs/CONTINUITY.md` to describe `nova.agi` as portable compatibility/fallback runtime, not mandatory Railway production authority.
- Modify `DEPLOYMENT.md` and `docs/deploy/NOVA_RUNTIME.md` to make Railway one optional target among portable deployments.
- Add/update a contract test proving the repo does not claim Railway as required primary production path.
- Keep direct provider adapters and Always-On Cognitive Mesh as portability/survival assets.

---

### Task 1: Freeze existing session contracts with regression tests

**Files:**
- Create: `tests/agi-session-store.test.mjs`
- Create: `tests/agi-context-reconstruction.test.mjs`
- Inspect: `src/lib/serverless-agi-runtime.ts`
- Inspect: `src/app/api/nova/chat/route.ts`

**Interfaces:**
- Produces the executable expectations for `ensureAgiSession`, `appendAgiMessage`, `loadAgiConversationContext`, and legacy compatibility.

- [ ] **Step 1: Write session-store contract tests first**

```js
assert.match(source, /export async function ensureAgiSession/);
assert.match(source, /export async function appendAgiMessage/);
assert.match(source, /export async function loadAgiConversationContext/);
assert.doesNotMatch(migration, /drop\s+table\s+.*nova_(threads|messages)/i);
assert.doesNotMatch(migration, /alter\s+table\s+.*nova_(threads|messages)\s+rename/i);
```

- [ ] **Step 2: Add context reconstruction expectations**

Test that the builder orders context as canonical AGI policy → recent session messages → durable summary → scoped memories → operational handoff, and that provider/model is not used as AGI identity.

- [ ] **Step 3: Review the tests against current source**

Expected before implementation: new symbols/files are absent and tests would fail. Do not spend a GitHub Action run only to observe this expected red state.

---

### Task 2: Add the global AGI Session Store schema additively

**Files:**
- Create: `supabase/migrations/20260816073000_unified_agi_sessions.sql`
- Test: `tests/agi-session-store.test.mjs`

**Interfaces:**
- Produces tables `public.agi_sessions`, `public.agi_messages` and service-only helper RPCs used by `agi-session-store.ts`.

- [ ] **Step 1: Define `agi_sessions` with stable ownership/scope fields**

Use UUID primary key and explicit columns for `agi_id`, `project_id`, `tenant_id`, `user_id`, `client_id`, `app_id`, `channel`, `surface`, `title`, `summary`, `retention_policy`, `consent_state`, timestamps and `meta`.

- [ ] **Step 2: Define `agi_messages` referencing session ID**

Store role/content/classification/trace/internal provider+model/learning timestamp/meta. Add a deterministic unique legacy mapping key in `meta` or dedicated nullable `legacy_source` + `legacy_id` so backfill is idempotent.

- [ ] **Step 3: Apply fail-closed grants/RLS in the migration**

Enable RLS. Revoke direct client DML from `anon` and `authenticated`. Permit backend service identity only through server-side code/RPC; any user-facing read later must be a separate tenant-aware surface.

- [ ] **Step 4: Add an idempotent legacy backfill function**

Normalize the `nova_threads.thread_id` UUID and `nova_messages.thread_id` text mismatch by parsing only valid UUID/text associations and recording unmappable rows as reconciliation evidence rather than dropping them.

- [ ] **Step 5: Add parity queries to the migration comments/runbook**

Required verification after applying to validation first:

```sql
select count(*) from public.nova_threads;
select count(*) from public.nova_messages;
select count(*) from public.agi_sessions where meta->>'legacy_source' = 'nova_threads';
select count(*) from public.agi_messages where meta->>'legacy_source' = 'nova_messages';
```

No production DDL until validation is green and the migration diff has been reviewed.

---

### Task 3: Implement typed session persistence and dual-read/dual-write compatibility

**Files:**
- Create: `src/lib/agi-session-store.ts`
- Test: `tests/agi-session-store.test.mjs`

**Interfaces:**

```ts
export type AgiSessionRef = { session_id: string; thread_id: string };
export async function ensureAgiSession(input: EnsureAgiSessionInput): Promise<AgiSessionRef>;
export async function appendAgiMessage(input: AppendAgiMessageInput): Promise<{ id: string }>;
export async function loadAgiConversationContext(input: LoadAgiConversationContextInput): Promise<AgiConversationContext>;
export async function updateAgiSessionSummary(input: UpdateAgiSessionSummaryInput): Promise<void>;
```

- [ ] **Step 1: Implement `ensureAgiSession`**

Reuse incoming `thread_id` when it maps safely; otherwise create a new session UUID. Scope lookup by project/user/AGI, never thread alone.

- [ ] **Step 2: Implement message append**

Persist user input before inference and assistant output after inference. Provider/model metadata stays internal.

- [ ] **Step 3: Implement dual compatibility**

During the migration window, new NOVA messages write to the global tables and, only where existing consumers still require them, also write through the legacy-compatible path. Do not silently diverge; return/log a sanitized parity failure if one side fails.

- [ ] **Step 4: Implement bounded context loading**

Return recent messages plus stored summary and identifiers. Do not load the entire 238-message history into every model request.

---

### Task 4: Build deterministic multi-scope context reconstruction

**Files:**
- Create: `src/lib/agi-context-builder.ts`
- Reuse: existing HOCKER AGI Canon + SYNTIA/Memory Mirror readers
- Test: `tests/agi-context-reconstruction.test.mjs`

**Interfaces:**

```ts
export async function buildAgiInferenceContext(input: {
  agi_id: string;
  project_id: string;
  session_id: string;
  user_id?: string | null;
  client_id?: string | null;
  app_id?: string | null;
  operational_context?: Record<string, unknown>;
}): Promise<{ system: string; messages: Array<{role:string; content:string}>; evidence_refs: string[] }>;
```

- [ ] **Step 1: Reuse the canonical AGI profile as the first authority**

- [ ] **Step 2: Add recent session messages and durable summary**

- [ ] **Step 3: Add user/client memory only when scope matches**

- [ ] **Step 4: Add domain/app Memory Mirror items filtered by target AGI/freshness/sensitivity**

- [ ] **Step 5: Add operational handoff references when present**

- [ ] **Step 6: Enforce a context budget**

Trim/summarize lower-priority history, never canonical constraints or current user message. Preserve references to omitted history so it can be fetched again.

---

### Task 5: Introduce a provider-independent model router

**Files:**
- Create: `src/lib/agi-model-router.ts`
- Create: `src/lib/agi-model-providers/types.ts`
- Create: provider adapter files listed above
- Test: `tests/agi-provider-failover.test.mjs`

**Interfaces:**

```ts
export type AgiModelRoute = "vercel-gateway" | "openai-direct" | "gemini-direct" | "anthropic-direct" | "ollama";
export async function completeAgi(input: AgiCompletionInput): Promise<AgiCompletionResult>;
```

`AgiCompletionResult` includes internal `route`, provider/model, usage, latency, failures and public text; callers must not expose route details in public replies.

- [ ] **Step 1: Extract current AI Gateway behavior into its adapter**

Preserve OIDC-first, API-key auth fallback and current timeout limits.

- [ ] **Step 2: Add direct provider adapters with strict configuration detection**

Only select a route when its required server-only key/endpoint exists. Do not convert a missing credential into a public error.

- [ ] **Step 3: Add Ollama-compatible route**

Require an explicit reachable `OLLAMA_BASE_URL`; never assume `localhost` works from Vercel.

- [ ] **Step 4: Define failover policy**

Default order: Gateway → direct provider alternatives chosen by configured model alias/evals → Ollama survival. Treat 401/403, balance/quota/rate limit, provider 5xx and timeout as route failures eligible for fallback; reject malformed/safety-invalid successful payloads instead of blindly accepting them.

- [ ] **Step 5: Record failures internally**

Persist route attempts in run/telemetry evidence without leaking provider/quota/balance language to the public NOVA response.

---

### Task 6: Make Hocker One serverless NOVA primary without losing the portable runtime

**Files:**
- Modify: `src/lib/serverless-agi-runtime.ts`
- Modify: `src/app/api/nova/chat/route.ts`
- Update tests: serverless/NOVA route regressions

**Interfaces:**
- `runServerlessNovaChat` remains the primary API implementation.
- Dedicated `NOVA_AGI_URL` becomes an optional compatibility fallback controlled by an explicit mode such as `NOVA_RUNTIME_MODE=serverless_primary|dedicated_primary|serverless_only` with `serverless_primary` default after parity.

- [ ] **Step 1: Persist the user message before model inference**

- [ ] **Step 2: Build inference context through `buildAgiInferenceContext`**

- [ ] **Step 3: Call `completeAgi` instead of Gateway directly**

- [ ] **Step 4: Persist assistant response and usage/evidence**

- [ ] **Step 5: Invert route priority in `/api/nova/chat`**

Local capabilities/action-draft behavior remains unchanged. For ordinary chat, call Hocker One serverless first. Use `nova.agi` upstream only if serverless inference/runtime fails and compatibility fallback is configured.

- [ ] **Step 6: Preserve Owner Gate behavior exactly**

No provider fallback may execute actions. Deferred actions remain drafts/materialized queue entries in Hocker One only.

---

### Task 7: Add safe Learning Extractor integration

**Files:**
- Create: `src/lib/agi-learning-extractor.ts`
- Reuse: `src/lib/syntia-memory-write-gate.ts`
- Reuse: `src/lib/syntia-memory-review-gate.ts`
- Test: `tests/agi-learning-extractor.test.mjs`

**Interfaces:**

```ts
export async function extractLearningCandidate(input: {
  session_id: string;
  agi_id: string;
  user_message: string;
  assistant_message: string;
  trace_id?: string | null;
}): Promise<LearningCandidate | null>;
```

- [ ] **Step 1: Make extraction conservative**

Return null for small talk, secrets/PII, unsupported claims, one-off instructions and provider metadata.

- [ ] **Step 2: Emit only distilled candidate fields**

No transcript/message arrays. Include source refs, confidence, scope suggestion, target AGIs and retention class.

- [ ] **Step 3: Submit through the existing SYNTIA Write Gate**

Do not publish directly to Memory Mirror. Existing review/policy remains authoritative.

- [ ] **Step 4: Mark `learning_processed_at`**

Idempotently prevent duplicate extraction for the same assistant message.

---

### Task 8: Validate legacy backfill and cross-provider conversation continuity

**Files:**
- Tests from Tasks 1-7
- Validation Supabase project first

- [ ] **Step 1: Apply migration only to validation**

- [ ] **Step 2: Seed/copy a sanitized representative subset of legacy thread/message structure**

- [ ] **Step 3: Run backfill twice**

Expected: second run produces no duplicates.

- [ ] **Step 4: Verify ordering and stable session IDs**

- [ ] **Step 5: Simulate route switch**

Turn off Gateway route in test configuration after one turn, force a direct provider/mock route, and assert the second turn receives the same HOCKER session context and `agi_id=nova`.

- [ ] **Step 6: Simulate total external-provider failure**

Expected: stored user message/session survives; response is explicit survival/unavailable behavior without pretending an answer was generated. A later retry resumes the same session.

---

### Task 9: Update `nova.agi` as portable compatibility runtime

**Files in `HockerAGI/nova.agi`:**
- Modify: `AGENTS.md`
- Modify: `docs/CONTINUITY.md`
- Modify: `DEPLOYMENT.md`
- Modify: `docs/deploy/NOVA_RUNTIME.md`
- Add/update contract test under `tests/`

- [ ] **Step 1: Remove claims that Railway is the required production authority**

State that Railway/Cloud Run/other container hosts are optional deployment targets for the portable compatibility runtime.

- [ ] **Step 2: Preserve direct provider and Ollama mesh**

These remain valuable as independent fallback/survival code and parity reference.

- [ ] **Step 3: Add retirement criteria**

Do not delete `railway.json` or runtime code until Hocker One exact candidate demonstrates session, routing, worker, MCP draft, telemetry and recovery parity and a rollback route exists.

- [ ] **Step 4: Fast-forward PR #32 branch only once the NOVA batch is complete**

Run one meaningful NOVA CI, not multiple documentation-only runs.

---

### Task 10: Final candidate verification and handoff

**Files:**
- Update continuity docs only after executable evidence is green.

- [ ] **Step 1: Fast-forward Hocker One #214 to the completed work-branch head**

- [ ] **Step 2: Run the single final Hocker One candidate CI**

Required: regression tests, typecheck, lint, build, dependency/security audit.

- [ ] **Step 3: Verify exact Vercel Preview**

READY; no new error/fatal cluster; authenticated NOVA chat preserves session across at least two turns.

- [ ] **Step 4: Verify Owner Gate**

Action requests remain preview/queued-for-approval only; no direct external write.

- [ ] **Step 5: Generate a fresh Context Bridge checkpoint/draft**

Record exact SHA, session-store migration state, provider routing readiness, remaining blockers. Do not activate without Owner + MFA AAL2.

- [ ] **Step 6: Do not merge `main` yet if Global Continuity Ledger plan remains incomplete**

The final merge decision happens only after both plans and #213 mobile QA/security gates are green.
