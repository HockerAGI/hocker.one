# NOVA / SYNTIA Memory Mirror read-gate audit — 2026-11-13

Scope: Hocker One current memory reuse and AGI update-feed readers. Source: read-only verified production SQL + canonical DOC-06/DOC-07. No historical data writes, migrations, or material Owner actions.

## Production evidence before fix
- 51 Memory Mirror records; 35 marked active and safe; 34/35 have all NOVA/SYNTIA/VERTX/JURIX approvals.
- One active Candy Ads legacy controlled-test memory has only NOVA approval yet 4 active feeds; it requires Owner approval. Do not present it as reusable knowledge.
- A second active row is linked to a `pending_review` learning event despite four flags. It has no active feed; do not treat that learning as approved.
- 16 no-learning-event-linked canonical AGI profile memories are backed by `20260804012856_agi_memory_mirror_completion.sql`, source `HOCKER AGI Canon 12.6C.1B`; allow those immutable canonical bootstrap profiles explicitly.
- Linked event/mirror canonical keys can use distinct namespaces (`run:UUID` vs `mirror:UUID`); the audit found matching source hashes for all linked active records. Do NOT rewrite historical keys merely because names differ.
- Active feed reference integrity: 20/20 have source memory, no orphan, cross-project or tenant mismatch; four reference the single incomplete-approval memory.

## Read path enforcement
- New common eligibility requires active + safe + four validations, correct project, current validity, exact source hash, and an `approved` learning event. Only the 16 versioned official canonical-profile records are exempt from needing a linked learning event.
- `src/lib/agi-context-builder.ts` filters before memories can enter inference prompts. Client/tenant filters still apply. `src/app/api/agi/memory-mirror` and `src/app/api/agi/updates/feed` filter normal active delivery while preserving explicitly requested Owner/internal audit views.
- Existing physical rows and feeds are retained for Owner review; no automatic approval/rejection or history loss. An unavailable approval-status lookup fails closed, not open.
- A passing CI test verifies the *code contract*; actual cross-role/Owner E2E requires authenticated session. Supabase service-role reads bypass RLS, so app-layer checks are mandatory. See official Supabase RLS guide.

## Follow-up acceptance
- Exact PR-head tests, TypeScript, lint, dependency audit, CodeQL, Vercel Preview READY; merge only when fully green; verify post-merge main and same production SHA.
- Confirm 33/35 active memories eligible for default reuse (34 all-four minus 1 pending-linked), 2 excluded. Confirm 16/20 feeds remain deliverable without four unapproved Candy Ads feed rows, and audit endpoints can inspect the two held rows.
- Keep `owner_gate_approvals=0` and all 16 AGIs `allow_actions=false`. No new LLM/cron/DDL/provider costs.
- Never label this an independent physical mirror or proof of post-deploy Vercel cron. The scheduled cron at 08:17 UTC requires a real logged invocation of the new SHA.
