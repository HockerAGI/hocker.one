# NOVA · One Owner-approved serverless inventory per UTC day (v1)

Date: 2026-11-16. Scope: hocker.one, Cloudflare hocker-nova-coordinator, Supabase.

## Purpose

Prove that the **existing** Cloudflare five-minute Cron can complete ONE real,
Owner MFA AAL2-preapproved, count-only Supabase audit without needing a VPS.
This is **not** an LLM inference, full AGI autonomy, GitHub modification,
unrestricted tools, or a dedicated persistent runtime.

## Authentication and exact authorization

1. Owner opens Hocker One > Procesos AGI, authenticates with Supabase AAL2 MFA,
   explicitly confirms one count-only inventory (same-origin POST).
2. `public.owner_schedule_free_inventory_v1` (service_role EXECUTE only) checks
   real project ownership, exactly 16 registered AGIs, zero material action grants,
   zero active tasks and zero blocked material actions. One idempotency key per
   **UTC date** prevents repeat approval or automatic replays.
   The authorization stores the exact Vercel `VERCEL_GIT_COMMIT_SHA` and a
   fixed execution contract version. On a revision change, it is canceled
   with audit instead of being silently carried over.
3. The existing Cloudflare coordinator's **separate inventory Bearer token**
   is scoped to one internal endpoint, not the observation token. The existing
   Vercel protection bypass is just a frontend protection control, NOT an
   action authorization or provider key.
4. The approved task is held in a distinct `owner_approved_inventory` status,
   **not queued or pending**. Live database inspection confirms both generic
   workers claim only `queued` and the dispatch shim advances only
   `pending/review`. Neither can capture this one-time approval.
   The scheduled RPC selects the oldest reserved grant **across UTC midnight**
   and always applies its 20-minute expiration check.
5. The endpoint only invokes `public.run_owner_free_inventory_v1`, which
   requires the single exact approved task, expected owner, 20-minute TTL,
   `draft_only` policy, no tools, no model, one attempt and a clear
   material-action queue. It uses a project advisory transaction lock.
6. In ONE SQL transaction the RPC captures genuine count-only Supabase
   metrics, completes the task, creates a no-model run, computes SHA-256 from
   canonical PostgreSQL JSONB text, persists evidence, and writes the audit
   event. No external network call, model, MCP tool or GitHub operation occurs.
   An empty approval queue returns a verified no-work response.
7. At any time before execution, Owner MFA AAL2 can use the panel to revoke
   this approval. `public.owner_cancel_free_inventory_v1` locks the same
   authorization key, updates just its task to `canceled` and inserts
   independent audit evidence; the Cron cannot race that revocation.

## Staged SQL is NOT an applied migration

The SQL source currently lives at `supabase/proposals/owner_granted_serverless_inventory_v1.sql`,
NOT in `supabase/migrations/`. This keeps the strict migration ledger
matching actual production on both pull-request and main push CI.
The endpoints remain fail-closed while the feature is OFF.

Before activating the feature: obtain the exact committed SQL after review,
apply through the Supabase migration tool, read back the provider-generated
migration version, and move the proposal into `supabase/migrations/<actual_version>_...sql`.
Add the actual recorded `(version,name)` to the production ledger test,
then run CI/CodeQL/review on that exact revision. Never create a fake
ledger entry or claim the migration was applied before verification.

## Rollout gates

- **GitHub:** tests, TypeScript, lint, build, audit, CodeQL and Codex review
  must pass on one exact SHA; Preview must be READY. Do not merge otherwise.
- **Production:** deploy exact SHA to Hocker One and verify READY, postmerge
  CI and alias before changing Cloudflare code.
- **Migration:** apply the versioned SQL file only through Supabase migration
  protocol, verify RPC signatures, role grants and no anonymous/authenticated
  EXECUTE permission.
- **Credentials:** create one cryptographically random >=40-character token
  with production-only environment scopes in Hocker One and Cloudflare. It
  must never be printed, put in a PR, transmitted in chat or reused as
  `NOVA_COORDINATOR_READ_TOKEN`.
- **Cloudflare:** update the **existing** Worker code in place preserving two
  existing secrets + observation flag + `*/5 * * * *` Cron. Introduce only
  the new inventory enable flag and independent token. Never introduce a
  second Worker, Cron, queue or provider.
- **Real final proof:** Owner AAL2 authorizes the one inventory through UI,
  then confirm one new task and one run completed, matching SHA and audit,
  worker_id, one attempt, no inference or tools; never re-authorize to make
  a demonstration pass.
- **Failure:** keep the new inventory flag OFF if any gate fails; the existing
  observation path stays operational. If necessary restore prior Cloudflare
  Worker version without changing read credentials. A lost scheduled Cron
  results in a single canceled authorization after 20 minutes, no job retry.

## Costs and limitations

The new feature executes **zero Workers AI tokens**, therefore makes no
model request. Cloudflare, Supabase and Vercel service requests still count
toward the account's existing platform quotas; $0 incremental billing is
not guaranteed independently. Do not enable a paid fallback, router or
`allow_actions=true`.

## Next capability gate

After this true scheduled snapshot is observed, separately design an Owner
approved Free-only LLM task with exact immutable prompt hash, hard daily
model/Neuron budget, verified current billing/free-plan limits, safe
non-retryable atomic completion, direct Cloudflare fixed model and no tools.
Its authorization must remain separate from the inventory and from general
tool/action approval. No inference gate is enabled by this migration.
