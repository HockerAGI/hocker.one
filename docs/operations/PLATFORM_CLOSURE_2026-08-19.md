# HOCKER Core — Platform Closure Gate 2026-08-19

Status: **OPEN — HUMAN AAL2 + 16/16 DURABLE EVIDENCE REMAIN**

Authoritative current handoff: `HANDOFF_2026-08-19.md`.

## Closed technical/platform gates

| Gate | Evidence | State |
| --- | --- | --- |
| Canonical catalog | 16 AGIs / 16 agents | GREEN |
| Action boundary | 16/16 `allow_actions=false` | GREEN |
| Resumable/fail-closed certification UI | PR #230 merged | GREEN |
| Candidate CI | `5af606d...`, CI #807 / `32233348527`, 231/231 + typecheck/lint/build/audit | GREEN |
| Exact candidate Preview | `dpl_EVQHb1fM9vREzbTKMDzGH6SeSdTP`, READY | GREEN |
| Preview build/runtime review | build complete; no reviewed `error`/`fatal` logs | GREEN |
| Merge | `expected_head_sha=5af606d...` → `6f8686f...` | GREEN |
| Production deployment | `dpl_BTizBR6fYWG6v9A1RLov95dQnDVc`, READY, exact merge SHA | GREEN |
| Production error/fatal review | no entries in reviewed window | GREEN |

Prior #214–#229 platform closures remain controlled unless connected evidence contradicts them.

## Mandatory gates still open

| Gate | Current evidence | State |
| --- | --- | --- |
| Owner AAL2 active ceremony | 1 verified MFA factor exists; no active ceremony evidence yet | OPEN |
| Runtime eval evidence | `agi_eval_result=0` | OPEN |
| Tool eval evidence | `agi_tool_eval_result=0` | OPEN |
| Server-derived 16/16 certification | requires current durable evidence | OPEN |

## Pass sequence

1. Owner authenticates normally in production.
2. `/agis` → `Elevar sesión a AAL2` → challenge/verify existing TOTP.
3. Confirm complete certification snapshot; partial snapshot must fail closed.
4. Execute only pending targets, sequentially.
5. Requery `agi_runs`, `agi_feedback` and certification snapshot.
6. Investigate any failed case; do not translate request completion into certification.
7. When and only when server-derived certification is 16/16 and all required evidence is current, update closure to verified/integration-ready.

## Provider-plan / degraded items

- Leaked Password Protection: `ACCEPTED_PROVIDER_PLAN_LIMITATION / FREE`; visible, disabled, not a fake green.
- Physical Node Agent: DEGRADED / local execution unavailable until real heartbeat.
- Dedicated Railway NOVA: DEGRADED / fallback not currently certified.

These do not authorize dependent effects; those paths remain fail-closed.

## Forbidden shortcuts

Manual eval-row insertion, synthetic AAL2/cookies, service-role substitution, enabling AGI writes, parallel full-batch fanout, blind provider redeploys, historical preview substitution, mass security revocation, or framework migration during the ceremony.
