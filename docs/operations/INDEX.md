# HOCKER ONE — Operations documentation index

Status: **ACTIVE INDEX**

This directory may contain historical evidence, plans and current operating contracts. The existence of two files on the same topic does not make both authoritative.

## Current operating sources

| Purpose | Current source | Rule |
| --- | --- | --- |
| Platform release/closure | `PLATFORM_CLOSURE_GATE_2026-08-14.md` | Single global fail-closed closure checklist until superseded by a dated replacement. |
| Canon/document drift | `DOC_ALIGNMENT_2026-08-15.md` | Technical alignment between approved PDF editions and observable current state. |
| Context Bridge architecture | `CONTEXT_BRIDGE_V1.md` | Architecture/security contract for normalized shared context. |
| Continuity/recovery | `CONTINUITY_PROTOCOL.md` | Single operational procedure for checkpoints, repo lifecycle reconciliation and session recovery. |
| Emergency handoff | `LAST_KNOWN_STATE.md` | Readable last material state; verify mutable facts before action. |

## Evidence and history rules

- Production/configuration and executable evidence outrank prose.
- A dated plan/spec is retained when it explains intent or migration history; it is not silently treated as current state.
- When a newer operating document supersedes an older one, mark the older document historical rather than creating a second current checklist.
- Do not duplicate the same policy into multiple differently worded Markdown files. Link to the current source and add only repo/domain-specific deltas.
- Do not delete migration, security or release evidence merely to make the tree look smaller.
- Root `INTEGRATION_VERIFICATION.md` is historical 2025 evidence and is not a current green gate.

## Cleanup rule for future changes

Before adding an operations document:

1. search this index and the repository for an existing owner of the topic;
2. update that source if its purpose is the same;
3. create a new dated document only when the old state must remain immutable for audit/history;
4. add the new current source to this index;
5. retire the previous source explicitly if authority changed.
