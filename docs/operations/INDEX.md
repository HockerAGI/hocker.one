# HOCKER ONE — Operations documentation index

Status: **ACTIVE INDEX**

`docs/operations/` mantiene una sola fuente actual por propósito operativo. Documentos fechados históricos conservan valor de auditoría, pero no compiten con la autoridad actual.

## Current operating sources

| Purpose | Current source | Rule |
| --- | --- | --- |
| Detailed cross-session continuity | `HANDOFF_2026-08-19.md` | Leer primero para estado, errores ya cerrados, evidencia y siguiente gate. No duplicarlo en otras fuentes. |
| Emergency recovery card | `LAST_KNOWN_STATE.md` | Punteros compactos + siguiente movimiento. Reconsultar antes de actuar. |
| Current Core release gate | `PLATFORM_CLOSURE_2026-08-19.md` | Gate actual de PR #243 → exact-head CI/Preview → merge → producción → AAL2 → evidencia score-v3. |
| Canon/document drift | `DOC_ALIGNMENT_2026-08-19.md` | Delta actual entre publicaciones aprobadas e implementación conectada. |
| Context Bridge architecture | `CONTEXT_BRIDGE_V1.md` | Shared context architecture/security contract. |
| Context freshness | `CONTEXT_FRESHNESS_POLICY.md` | Checkpoint/manifest freshness semantics. |
| Continuity protocol | `CONTINUITY_PROTOCOL.md` | Durable recovery/checkpoint procedure. |
| Development history | `../00-governance/HOCKER_DEVELOPMENT_LEDGER.md` | Historial append-only; punteros mutables se reconsultan y no se compactan destructivamente. |
| GitHub Owner Gate | `GITHUB_OWNER_GATE.md` | GitHub action/approval boundary where applicable. |

## Authority rules

1. Production/configuration + DB/logs > `main`/migrations > executable contracts/tests > approved ADR/policies > canon > historical narrative.
2. Un Preview prueba sólo su source SHA/tree; no reutilizarlo para un head posterior.
3. Estado actual pertenece al handoff/recovery/closure; el Ledger preserva hitos append-only.
4. No crear un Markdown nuevo si una fuente actual ya cubre el propósito.
5. No usar commits como polling/heartbeat; agrupar reconciliación documental.
6. Nunca borrar migration/security/release evidence sólo para simplificar el árbol.
7. Aplicar la regla HOCKER de cuatro filtros antes de conservar, adaptar, fusionar o eliminar cualquier elemento.

## New-session startup

`AGENTS.md` → este índice → `HANDOFF_2026-08-19.md` → `LAST_KNOWN_STATE.md` → `PLATFORM_CLOSURE_2026-08-19.md` → `DOC_ALIGNMENT_2026-08-19.md` → requery GitHub/Vercel/Supabase.

Older `PLATFORM_CLOSURE_*`, `DOC_ALIGNMENT_*` y snapshots son históricos salvo que este índice los marque current.
