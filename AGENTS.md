
- No dummy commits for polling/rate-limit/provider builds.
- Group related documentation changes in one commit.
- Keep useful workflows; scope them with paths/concurrency/dispatch where justified.
- Do not use `[skip ci]` when it could leave required checks pending.
- `concurrency.cancel-in-progress`, caching and path filters are allowed when tested.
- During Vercel rate limits, distinguish provider quota from code failure and reuse the same safe candidate.
- Prefer GitHub Actions least-privilege permissions, full-length SHA pinning for third-party actions and OIDC federation for cloud credentials where supported.

## 9. Release

The active closure gate is the current source referenced by `docs/operations/INDEX.md`. Do not declare `production_ready` until every named gate has traceable evidence from the same applicable candidate/configuration.

- Dynamic MCP providers must flow through the canonical registry, HTTPS host allowlist and existing execution policy; no provider may bypass Hocker security gates.
- AGI federation must use canonical `agi_tasks`/`agi_runs`, `parent_run_id`, bounded delegation depth/fanout and the existing SYNTIA learning path.
- NOVA streaming must route through the unified Hocker runtime first; dedicated `nova.agi` remains compatibility fallback only.
- Operating Loop contracts are orchestration metadata only; they must reference existing thread/session/task/run/action/evidence records and must not create a second memory, queue, MCP registry, approval system or runtime router.
- Research records must preserve source URL, consulted timestamp, version/revision when available, scope, relevance, impact and risk notes before material execution.
- Candidate/approval hashes must bind the exact execution state; changed repo SHA, migration head, runtime revision, scope or expiry invalidates the approval path.
