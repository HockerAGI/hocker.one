---
name: Replit protected files
description: Files that cannot be removed/edited normally in this repl and the workaround
---
- `.replit` and `.replitignore` are env-managed: bash `rm`/direct edits are blocked ("Direct edits to .replit ... not allowed"). Use the matching tool/skill, never bash.
- `rm .gitignore` is blocked as a "destructive git operation" in the main agent. To change `.gitignore`, use the `write` tool (overwrite) — that is allowed.
- Destructive git commands (git commit/rm/reset/checkout/clean/rebase/restore...) are blocked in the main agent; delegate to a Project Task. Plain filesystem `rm`/`mv`/`cp` are fine.

**How to apply:** when restoring or cleaning files, exclude `.replit`/`.replitignore` from rm/cp loops, and only edit `.gitignore` via the write tool.
