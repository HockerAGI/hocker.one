# HOCKER Core — Platform Closure Gate 2026-08-19

Status: **OPEN — FINAL CANDIDATE EVIDENCE PENDING**

Authoritative procedure and detailed history: `HANDOFF_2026-08-19.md`.

## Closed / controlled before this gate

The evidence chain #214–#229 closed or bounded the primary NOVA runtime, durable canonical session/message storage, Context Bridge freshness, Supabase migration parity, core RLS/write boundaries, recovery semantics, Node Mirror liveness, canonical AGI FK indexes and current Advisor exception contracts.

Do not treat historical warnings or documentation ancestry as open blockers unless current connected evidence contradicts those closures.

## Current mandatory gates

| Gate | Current evidence | State |
| --- | --- | --- |
| Canonical catalog | 16 AGIs / 16 agents | GREEN |
| Action boundary | 16/16 `allow_actions=false` | GREEN |
| PR #230 deterministic code/tests | latest code-bearing `30a414ad...`; current docs-aligned head `1ced536e...` | GREEN |
| Exact-head CI | #799 / `32012349597` SUCCESS | GREEN |
| Exact-head Vercel Preview | no deployment observed for `1ced536e...` | **OPEN** |
| Preview build/runtime review | requires exact-head Preview | OPEN |
| PR review / promotion gate | #230 remains draft | OPEN |
| Production deployment after merge | merge not performed | OPEN |
| Owner session | one verified MFA factor exists; active AAL2 ceremony not yet performed | OPEN |
| Durable runtime eval evidence | `agi_eval_result=0` | OPEN |
| Durable tool eval evidence | `agi_tool_eval_result=0` | OPEN |
| 16/16 server-derived certification | requires persisted evidence above | OPEN |

## Provider-plan item

Leaked Password Protection remains a visible provider setting/risk and must not be described as enabled. PR #230 documents its Free-plan limitation separately from MFA. This item must be revisited if provider plan or launch/security scope changes; it is not permission to weaken password policy.

## Promotion sequence

1. Redeploy exact PR #230 head through Vercel without creating a dummy commit if possible.
2. Verify `READY` + exact `githubCommitSha` + build logs + runtime logs.
3. Requery PR head/reviews/checks; no stale approval or stale preview.
4. Promote/merge with expected head only.
5. Verify production deployment source SHA and runtime errors.
6. Owner logs in normally, follows `/auth/mfa?returnTo=/agis`, challenges the already-enrolled TOTP and reaches `aal2`.
7. Run the resumable pending-evidence control. If server snapshot is partial, it must stay blocked.
8. Requery durable eval rows and certification snapshot.
9. Only when 16/16 is server-derived and all candidate gates remain green may Core be declared verified/integration-ready.

## Forbidden shortcuts

Historical preview substitution, manual eval-row insertion, synthetic AAL2, service-role ceremony bypass, enabling AGI writes, parallel full-batch fanout, blind provider redeploys, mass security revocations, or changing frameworks/dependencies during the final gate solely to modernize.
