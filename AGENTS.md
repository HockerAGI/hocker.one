# HOCKER ONE — Instructions for Codex and engineering agents

This file is durable operating guidance. It is **not** the dynamic state source; current state is recovered from `docs/operations/INDEX.md` and the active handoff it points to.

## 1. Truth hierarchy

1. production/configuration, DB, logs and reproducible evidence;
2. `main`, migrations, workflows and executable contracts;
3. approved ADRs, runbooks, policies, tests and evidence packs;
4. current canonical sources;
5. vision, research and history.

If they diverge, record drift and reconcile. Never silently choose the most convenient version.

## 2. Rescue and cleanup rule

Every existing element passes four filters:
1. useful and current → keep;
2. useful but stale → rebuild/adapt;
3. overlapping → merge;
4. no value for understanding, operating, recovering or auditing → discard.

Historical evidence is never deleted merely to simplify the tree.

## 3. Non-negotiable boundaries

- Branch + PR; never write directly to `main`.
- Do not merge functional changes without applicable candidate gates green.
- Exact SHA matters: a historical Preview proves only its source tree.
- 16 canonical AGIs; `allow_actions=false` remains the baseline until a versioned capability-specific approval changes it.
- NOVA coordinates/reasons; Hocker One / Owner Gate governs material effects.
- Do not fabricate integrations, health, certification, AAL2 or evidence.
- Never store secrets, auth headers, TOTP, KYC, restricted PII or raw chats in shared memory.
- Never enable real-money, casino/wallet, KYC, surveillance/location or destructive capability merely for technical convenience.
- Uncertainty in evidence => fail closed.

## 4. Continuity

At startup:
1. read this file;
2. read `docs/operations/INDEX.md`;
3. read the active handoff;
4. read `docs/operations/LAST_KNOWN_STATE.md` and the active closure gate;
5. re-query GitHub, Vercel, Supabase and mutable providers;
6. confirm PR, branch and exact head SHA.

At a material milestone, update one current source of detail and point other sources to it. Do not duplicate the same narrative across ledger/handoff/closure/alignment and never save raw chat transcripts.

## 5. Current architecture

- Hocker One is the control plane and primary NOVA runtime path.
- `nova.agi` is the dedicated fallback/compatibility path and must be verified live before being relied upon.
- `hocker-node-agent` is local allowlisted/signed execution; it does not receive master cloud credentials.
- Shared Supabase does not mean shared authorization: project/tenant, grants and RLS remain boundaries.
- MCP/provider connectors are replaceable; an adapter being present does not mean provider readiness.
- Tool metadata/annotations are hints, not authorization. Policies + Owner Gate decide.

## 6. Development and verification

For features/bugs:
1. identify outcome, risk and consumer;
2. write/adjust a regression test for the real problem where applicable;
3. demonstrate RED;
4. minimal GREEN change;
5. regression tests, typecheck, lint, build and dependency/security gates;
6. exact-head Preview + runtime logs for functional changes;
7. merge with expected head;
8. production + logs + rollback evidence;
9. update the active handoff.

Never silence Supabase Advisors with broad grants/policies. `unused_index` is INFO, not a deletion instruction: require observation window, workload/query plans, dependencies and reversible validation.

## 7. AGI and approval model

- Current certification contract: `2026.08.21-8` + `score-v5`.
- Historical suites/scorers remain evidence history only and do not satisfy the current certifier.
- Certification batches are resumable and execute only missing targets.
- Partial snapshot => block; never synthesize a full rerun.
- Maintain sequential execution where cost/timeouts/evidence boundaries depend on it.
- If a verified TOTP factor exists, use real challenge/verification for AAL2; do not re-enroll duplicates.
- Never insert AGI evaluation rows manually to certify.
- Approval/resume paths must cover approve, reject, retry, idempotency, timeout, abort, replay and persistence.

## 8. CI / Actions / Vercel

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
