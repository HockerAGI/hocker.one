# HOCKER Operating Loop v1 — Design Specification

**Status:** DESIGN / NOT FOR PRODUCTION
**Date:** 2026-09-10 America/Tijuana
**Base SHA audited:** `2ab17d56468ba47ca980f138b3679bcc99367f30`
**Scope:** `HockerAGI/hocker.one`, `HockerAGI/nova.agi`, `HockerAGI/hocker-node-agent`

## 1. Goal

Make Hocker One the primary operator workspace for HOCKER, with NOVA as the single conversational entry point. The operator should not need to choose AGIs, models, providers, tools, branches or deployment systems for normal work. Hocker One orchestrates those choices through the existing capability, AGI, MCP, task, action, evidence and Owner Gate infrastructure.

The target human interaction is one final human approval for a prepared material execution, not approval of every deterministic step.

## 2. Non-goals

Do not introduce a second memory store, action queue, MCP registry, approval system, runtime router, or external workflow engine. Do not bypass Owner Gate/AAL2. Do not grant global `allow_actions=true`. Do not replace GitHub, Supabase or Vercel as infrastructure; remove the need for the operator to work in them manually.

## 3. Existing infrastructure to reuse

- Hocker One: NOVA chat/stream, history, capability contract/router, AGI runtime, action queue, Owner Gate/AAL2, evidence, MCP registry, GitHub executor, orchestrator, workers, context bridge.
- Supabase: `agi_sessions`, `agi_messages`, `agi_tasks`, `agi_runs`, action/evidence state and existing security/RLS model.
- `nova.agi`: dedicated runtime/fallback.
- `hocker-node-agent`: controlled local execution boundary.

## 4. Operating Loop

`intent -> current research -> local reconciliation -> capability/AGI routing -> execution plan -> automated preflight -> release/action candidate -> one Owner AAL2 approval when required -> durable execution -> verification -> evidence -> SYNTIA/knowledge distribution`.

Read-only operations may execute automatically when policy permits. Mutating operations must remain policy-gated and auditable.

## 5. Work Session

Add a logical orchestration envelope that references existing persistence rather than duplicating it.

Required state:

`planning | researching | ready | awaiting_owner | approved | executing | verifying | completed | blocked | failed | canceled`

The envelope references existing thread/session, mission/run/task/action/evidence records. It must be resumable and idempotent.

A material approval is bound to exact candidate state: repository/commit, migration head, runtime revision, evidence hash, scope, risk and expiry. If any bound state changes before execution, approval becomes invalid and the workflow returns to preflight.

## 6. Research Gate

Every material execution must record current external research before execution. Minimum record:

- source identifier
- title
- URL
- publisher/project
- version/spec revision
- published/released date when available
- consulted timestamp
- scope/relevance
- impact on the decision
- risk/compatibility notes

Primary sources are preferred. Secondary/community sources are reference-only. Research must be stored with the run/evidence package.

## 7. Release/Action Candidate

Before requesting Owner approval, Hocker One generates a single review package containing:

- objective and requested outcome
- selected capability and AGI owner
- tools/providers involved
- research sources
- risk classification
- exact code/migration/runtime state
- automated checks and results
- security findings
- rollback strategy
- expected cost/limits
- affected systems
- execution steps

No final approval request is presented while mandatory automated gates are red or unknown.

## 8. Approval Envelope

Owner approval is scoped, time-bound and non-transferable. It must reference the candidate hash and exact execution scope. Approval does not authorize unrelated work. Reuse of an approval across changed candidate state is forbidden.

AAL2 remains the authentication assurance mechanism; Owner Gate remains the authorization boundary.

## 9. Durable execution

Execution must resume from persisted state after interruption without replaying already completed non-idempotent work. Long-running work must not depend on an HTTP request remaining open. Failed steps retry only according to tool-specific idempotency and retry policy.

## 10. Hocker One UX target

NOVA becomes the main operator surface. Existing capabilities/tools/workspace panels are progressively consolidated behind the conversation. The UI exposes only capabilities whose current contract says they are available. Technical details remain available on demand.

Primary surfaces:

- Conversation
- Composer
- History
- Work/Execution state
- Action approval
- Evidence
- Artifacts
- Advanced technical details

## 11. Coding workflow target

For code work the canonical loop is:

`research -> audit current repo -> plan -> branch -> edit -> diff -> tests -> CI -> exact-head Preview -> review -> Owner approval -> merge -> production -> post-release verify -> evidence -> docs reconciliation`.

`main` is never written directly by the agent workflow. Stale branches must be revalidated against current `main`; historical branches are never merged solely because they exist.

## 12. Node execution target

Commands use `hocker-node-agent` as the execution boundary. The web control plane proposes and authorizes; the node executes within its sandbox and returns stdout/stderr/status/evidence. No direct privileged shell is embedded in the web runtime.

## 13. Files and artifacts

Files should become a governed capability using secure upload, validation/scanning, metadata, storage, extraction, permissions, provenance and artifact viewing. This is a later implementation slice and must not be mixed into the first orchestration change.

## 14. MCP compatibility

The implementation must be checked against MCP 2026-07-28 before changing the current custom client. The current client already negotiates modern discovery with legacy fallback. No SDK migration is authorized by this specification; migration is conditional on a verified compatibility gap.

## 15. Security and data rules

RLS + grants remain the joint authorization model. Sensitive tables and SECURITY DEFINER functions require consumer/use-case review before changes. Supabase advisor findings are not solved by blind revocation or index deletion.

`allow_actions=false` remains the default for AGI runtime identities.

## 16. Testing and evidence

Every implementation slice must include:

- contract/unit tests
- security tests for the affected boundary
- idempotency/retry tests where relevant
- exact-head CI
- Preview verification when user-facing
- post-release health/smoke when promoted
- evidence bound to the resulting SHA

## 17. Documentation reconciliation policy

Canonical documents are design authorities but may lag implementation. When code/configuration advances successfully:

1. verify current `main`, deployment and migration head;
2. reconcile documented claims against evidence;
3. update affected canonical/operational documents;
4. record source/version/date for external documentation;
5. update handoff/continuity records;
6. only then treat the documentation as current.

No historical handoff may override production/configuration evidence.

## 18. First implementation slice

The first code slice should implement only the orchestration contracts needed for:

`Work Session + Research Gate + Candidate + Approval Envelope`

using existing stores and Owner Gate. It must not add Files, Browser/Computer Use, new workflow engines, or broad UI redesign in the same change.

## 19. Success criteria

- Operator can initiate a material task from NOVA without selecting AGI/model/provider manually.
- System records current research before execution.
- Deterministic preflight completes automatically.
- One scoped Owner approval can release the prepared workflow.
- Workflow resumes safely after interruption.
- No duplicate memory/queue/registry is introduced.
- Every execution is verifiable and produces evidence.
- Documentation can be reconciled automatically after successful main/production promotion.
