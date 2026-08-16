# HOCKER ONE — Operations documentation index

Status: **ACTIVE INDEX**

`docs/operations/` contains only current operating contracts/evidence owners. Historical checkpoints, retired integration snapshots and superseded addenda live under `docs/history/` so they remain auditable without competing with current authority.

## Current operating sources

| Purpose | Current source | Rule |
| --- | --- | --- |
| Platform release/closure | `PLATFORM_CLOSURE_GATE_2026-08-14.md` | Single global fail-closed closure checklist until superseded by a dated replacement. |
| Canon/document drift | `DOC_ALIGNMENT_2026-08-15.md` | Technical alignment between approved PDF editions and observable current state. |
| Context Bridge architecture | `CONTEXT_BRIDGE_V1.md` | Architecture/security contract for normalized shared context. |
| Continuity/recovery | `CONTINUITY_PROTOCOL.md` | Single operational procedure for checkpoints, repo lifecycle reconciliation and session recovery. |
| Emergency handoff | `LAST_KNOWN_STATE.md` | Readable last material state; verify mutable facts before action. |
| GitHub Owner Gate | `GITHUB_OWNER_GATE.md` | Current GitHub approval/action boundary where applicable. |

## Historical archive

Historical operational evidence is preserved under `docs/history/operations/`. The retired 2025 inter-repo verification is preserved under `docs/history/INTEGRATION_VERIFICATION_2025-07-09.md`.

Moving a file into history changes **location/authority**, not its evidence value. Blob contents are preserved when possible.

## Evidence and history rules

- Production/configuration and executable evidence outrank prose.
- A dated plan/spec is retained when it explains intent or migration history; it is not silently treated as current state.
- When a newer operating document supersedes an older one, archive the older document rather than maintaining two current checklists.
- Do not duplicate the same policy into multiple differently worded Markdown files. Link to the current source and add only repo/domain-specific deltas.
- Do not delete migration, security or release evidence merely to make the tree look smaller.
- Historical files must never be cited as a current green gate without revalidation against current evidence.

## Cleanup rule for future changes

Before adding an operations document:

1. search this index and the repository for an existing owner of the topic;
2. update that source if its purpose is the same;
3. create a new dated document only when the old state must remain immutable for audit/history;
4. add the new current source to this index;
5. archive the previous source explicitly if authority changed;
6. prefer one current policy/runbook per purpose, with historical evidence separated by directory rather than duplicated wording.
