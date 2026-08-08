# Hocker ONE — Codex Security Review — 2026-08-07

## Status

**Connector-assisted standard security review. Production remains frozen.**

This review follows the installed Codex Security standard methodology (assets, trust boundaries, attacker-controlled inputs, sensitive operations, validation and coverage). The native Codex Security worker/scan-ID runtime is not exposed in this ChatGPT environment, so source inspection was performed through the authenticated GitHub/Supabase connectors. Coverage is therefore **partial / connector-assisted**, not a claim of native exhaustive scan completion.

Repository: `HockerAGI/hocker.one`
Version: hardening candidate branch `hardening/production-readiness-20260807`

## Threat model

### Assets
- Owner/admin authorization and Owner Gate decisions.
- `agi_action_queue` / legacy `commands` execution state.
- GitHub mutation credentials, Supabase service credentials and HMAC signing keys.
- Audit/evidence chain and rollback metadata.
- Private control-plane data and PWA/Android session data.

### Trust boundaries
- Browser/PWA/Android client → Hocker ONE API.
- Authenticated user roles → project-scoped authorization/RLS.
- Hocker ONE → Supabase privileged server access.
- Hocker ONE → NOVA / MCP / GitHub / Node Agent.
- Approved queue item → external side effect.

### Primary attacker-controlled inputs
- API request bodies and project IDs.
- Command/action payloads and tool arguments.
- LLM/MCP output proposed as actions.
- GitHub repository/branch/path inputs.

### Security invariants
- Client input never decides whether a mutation requires approval.
- Operators cannot create/mutate legacy commands.
- Unknown/high-impact commands fail closed.
- One queue item can be claimed by only one executor.
- Signing secrets are not API bearer credentials.
- Direct writes to `main`/`master`/production branches are blocked.
- Private authenticated responses are not cached by the PWA.

## Validated controls / remediated findings

1. **Legacy Owner Gate bypass — remediated.** `POST /api/commands` is owner/admin only and server policy derives risk/approval; unknown commands fail closed as R4.
2. **Legacy command RLS — validated in isolated Supabase project.** The exact migration was applied to a validation fixture. `owner` and `admin` authenticated inserts succeeded; `operator` and `member` inserts were rejected by RLS with PostgreSQL `42501`.
3. **Executor claim race — remediated.** Execution proceeds only after an UPDATE returns the actually claimed row.
4. **Signing/auth secret separation — remediated.** HMAC command-signing secrets are no longer accepted as internal API bearer credentials.
5. **Canonical AGI queue — strong control.** The execution path includes status/lock ownership, attempt limits, idempotency metadata, rollback plans, allowed repositories/paths and direct-main protection.
6. **PWA privacy — hardened.** Offline behavior is static/fail-closed and does not cache authenticated API responses.
7. **Mobile supply chain — hardened.** API 36, pinned actions and bundletool checksum verification are enforced; emulator QA is being added as a release gate.

## Residual findings / recommendations

### P0 — credential rotation is not yet provably complete
A separate credentials document contains live multi-provider secret material. No secret value is recorded in this report. Production GO remains blocked until each provider credential has been replaced, installed, smoke-tested and the predecessor revoked through that provider's secure control plane.

### P1 — production RLS migration remains unapplied by design
The owner/admin-only `commands` migration passed isolated functional validation but has not been applied to the production Supabase project. Production remains frozen until release authorization.

### Defense in depth — scope queue updates by project ID
`agi-action-execution.ts` obtains queue rows with project scope before calling its internal `patchQueueItem`, but that helper updates by action ID only. No cross-project exploit was established because callers already fetch scoped items and UUID IDs are opaque; adding `project_id` to every UPDATE predicate would reduce reliance on caller discipline.

## Coverage

Reviewed high-risk surfaces include legacy command ingestion/policy, canonical AGI execution/locking, Supabase owner/admin RLS migration and live validation, Android/PWA release controls, GitHub mutation guardrails and CI/supply-chain controls. This connector-assisted review does not assert full-file exhaustive coverage or native Codex Security worker independence.
