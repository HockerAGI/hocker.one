# HOCKER — Last Known State

Status: **ACTIVE RECOVERY CARD — REQUERY MUTABLE FACTS BEFORE ACTION**
Evidence cut: **2026-11-25 (candidate handoff; re-query mutable facts)**
Scope: **Hocker One + NOVA + canonical AGI Core**.

Live NOVA Developer E2E evidence and Owner signoff: **https://github.com/HockerAGI/hocker.one/issues/306**.
Historical September handoff: `HANDOFF_2026-09-05-R2.md`; historical August platform closure: `PLATFORM_CLOSURE_2026-08-30.md`.
This recovery card is dated, not an independent production certification.

## Handoff operativo — 2026-11-25 (America/Tijuana)

**Estado candidato, no certificado en producción.** El índice y #306 son las autoridades; este bloque sustituye los punteros de continuación del 18 de noviembre, que se conservan abajo como historia. Reconsultar antes de operar.

- Hocker ONE main: `f79288d17d29ee10afa5afcb14e209e725f1c868`. NOVA main: `8f52a0ad6402085c8a877418996c304491bacefc`. Node Agent main: `6401aad71a5552a6e331d83d8b0b4ab62a967aa2` (lecturas GitHub de esta sesión).
- PR activo: [#474](https://github.com/HockerAGI/hocker.one/pull/474), rama `fix/owner-nova-ux-reconciliation-20261125`, draft. Consultar su HEAD exacto, CI y Preview. La revisión de Inicio `02a78989` pasó CI [45682676386](https://github.com/HockerAGI/hocker.one/actions/runs/45682676386). Primer commit de NOVA `6ab35df8` detectó cinco regresiones de aserciones de interfaz; se ajustan a la nueva estructura sin retirar las invariantes. No atribuir al siguiente SHA los resultados anteriores.
- GitHub App: la conversación documenta la autenticación, lectura 3/3, token con permisos y activación en Production el 24 de noviembre; reconsultar el diagnóstico Owner AAL2 antes de certificar estado vigente. PAT retenido para recuperación según evidencia histórica. No repetir pilotos. Escritura real bajo Owner Gate sigue pendiente; verificar IDs, estados, SHA y dependencia antes de cualquier aprobación; no mezclar las tres propuestas anteriores con el PR de UX ni fusionar su PR temporal.
- Supabase: el catálogo de permisos consultado ahora confirma RLS activa y sin SELECT/INSERT para authenticated en agi_sessions, agi_messages, agi_action_queue, agi_runs y agi_memory_mirror. Preview no usa secretos administrativos ni crea memoria paralela. Chat persistente protegido en Production; pruebas reales con el Owner solo tras publicar candidato aplicable. Inicio/Operación pueden leer datos autorizados de sesión. No inventar métricas ni confundir "sin verificar" con cero.
- UX: Inicio reorganizado, NOVA separa errores de envío/estado, controles en composer, búsqueda del historial reciente, nuevo hilo, detener recepción de stream y Markdown limitado sin HTML activo. Adjuntos, voz y traslado completo del control VFX a configuración no certificados ni habilitados por apariencia. Preservar capacidades actuales y control de acciones. No se ejecutó inferencia en esta revisión.
- Inventario al commit `6ab35df8`: 969 blobs, 63 page.tsx, 91 API route.ts, 141 archivos de tests, 113 migraciones SQL, 6 workflows y 102 archivos docs. Inventario de árbol completo, NO auditoría línea por línea ni aceptación de todas las rutas. Módulos Trabajo, Ecosistema, Operación y Más requieren matriz funcional autenticada; los cambios anteriores de Operación tienen evidencia parcial. Revisar además el warning de getSession observado en Preview y la recepción real de OTLP antes de certificar seguridad/observabilidad.
- Issues activos necesarios: hocker.one #306 y nova.agi #31. Node Agent sin issues. PRs de mantenimiento separados: Hocker ONE #473 (documental HKR Connect), #467/#466/#465; NOVA #72/#71/#70; Node Agent #47. No cerrar sin análisis ni incorporar al rediseño automáticamente.
- Siguiente paso: CI exacto y Preview del nuevo HEAD, aceptación visual de NOVA sin mutaciones, revisión funcional de módulos restantes, revisión del diff y release gates; publicar solo tras checks aplicables y aceptación. Tras Production READY exacto, validar lectura/continuidad conversacional con sesión real, GitHub/Vercel, Langfuse; luego una ceremonia Owner AAL2 consolidada del #306, certificación de escritura real existente sin repetir pilotos ni evaluaciones. Dedicado #31 y SRE/restauración siguen independientes.
- Mantener evidencia anterior: 16/16 perfiles evaluados, 48 ejecuciones de evaluación, cinco inferencias Free-only, 19/19 asignaciones read-only; verificar vigencia del alcance, no reejecutar sin cambio material. No afirmar 16 runtimes activos ni autonomía continua.
- Checkpoint Context Bridge: pendiente de publicación normalizada autorizada. Este archivo es recuperación de emergencia, no activación de manifest ni publicación de memoria. No se almacenó chat crudo, credenciales ni TOTP.

## Historical verified pointers (2026-11-18 release snapshot; not current)

- Hocker One `main=f9b34f77b9b056a99cda31199adfe963060a5a41` and Vercel Production `dpl_4GXPTL9X5GEXjo4H6vShUF3vcJ2t` READY, with `hockerone.vercel.app` assigned to this deployment.
- **MERGED PR #460** (2026-11-18): GitHub App support and disabled independent Cron monitor are deployed as code. Last checked: **0 open PRs** across `hocker.one`, `nova.agi`, `hocker-node-agent`.
- Candidate SHA `0d70e10d3fa61694683480f6b6cb39b1450530bb` completed CI rerun 44263124722 successfully: regressions, TypeScript, lint, build and **mandatory `npm audit --audit-level=high` PASS**; Codex reviewed last SHA with 0 outstanding threads; exact Preview was READY. GHSA-fc5q-39xc-vjpf was officially withdrawn, but no picomatch patch is claimed.
- GitHub App server-side Production credentials have **not** been configured; ChatGPT's connected GitHub App is not the NOVA runtime identity. `VERCEL_TOKEN` remains Preview-only; a declared `AI_GATEWAY_API_KEY` is not itself a live provider certification.
- Core AGI certification baseline: `2026.08.21-8` + `score-v5`, 16/16 profiles, 48/48 evaluations; existing scope evidence only, **not** autonomous developer E2E. Do not repeat.
- Read-only tool assignment baseline: 19/19 verified; no material writes were certified by that contract.
- Global material capability: `allow_actions=false` across all 16 AGIs at last SQL verification. Owner Gate remains required for each applicable material action.
- Cloudflare Cron historical successful observations exist. Independent absence detection is included in `main` but **not enabled** or certified for real alert delivery.
- Supabase was ACTIVE_HEALTHY at release cut; no isolated restore drill is certified and no paid branch was created.
- Historical sources remain preserved for audit; dated September/August documents are archival context, not present-day live provider truth.
- `nova.agi/main`, `hocker-node-agent/main`, provider secrets, migrations, alerts and runtime state are mutable; query them directly.

## Current architecture

- NOVA is the primary orchestrator/control plane.
- Canonical capability routing selects specialist AGIs internally; ordinary users do not manually select AGI/model/provider/tool.
- Native MCP tools are model-facing contracts; Hocker One is execution/policy/evidence boundary.
- Dynamic MCP providers reuse the canonical registry and require HTTPS host allowlisting.
- IA↔IA delegation reuses canonical tasks/runs with parent lineage and bounded depth/fan-out.
- SYNTIA learning reuses the existing Learning Extractor/Memory Mirror path.
- Streaming NOVA routes through unified Hocker runtime before dedicated compatibility fallback.
- Operating Loop contracts wrap existing state/task/run/action/evidence/Owner Gate systems rather than creating parallel authorities.

## Operating Loop v1

Design/specification: PR #367, `docs/superpowers/specs/2026-09-10-hocker-operating-loop-v1-design.md`.

Implemented in PR #368:
- WorkSessionState + transition validation.
- ResearchRecord provenance contract.
- ExecutionCandidate exact-state contract.
- ApprovalEnvelope binding contract.
- WorkSessionEnvelope references.
- Deterministic canonical JSON + SHA-256 candidate hashing.

Not yet implemented by this slice:
- Work Session persistence wrapper.
- Executable Research Gate wrapper.
- Candidate builder.
- Scoped Owner AAL2 approval execution envelope.
- Resumable orchestration runner/UX consolidation.

## Current operational freshness

Registry presence is not liveness. Re-query `agi_runs`, integration checks and node signals before current AGI/runtime claims.

## Remaining NOVA Developer release gates (scope-aware)

1. **Completed code gate:** PR #460 had mandatory audit and exact-head CI green, Codex/Preview reviewed, merged with SHA check and deployed to Production; do not reopen the retired picomatch advisory as an unresolved gate without new evidence.
2. **Owner identity and readiness:** install/configure a least-privilege GitHub App or approved alternative directly in the Vercel Production secrets manager, separately validate Vercel service credentials; new environment variables require a new deployment. Do not copy tokens from ChatGPT or paste them into issues.
3. **Genuine NOVA/AGI-origin PR:** Owner AAL2, authenticated GitHub repo reads, specialist proposal, Owner Gate, branch/file/PR, CI/Codex, rollback and durable evidence; no artificial AGI actions or permissive global `allow_actions`.
4. **SRE/recovery:** activate and validate independent missed-Cron alert delivery using controlled observation checks, then complete an isolated Supabase database + Storage restore drill with explicit cost authorization before creating billable resources.
5. Physical Node Agent is optional for the serverless scope. Do not claim 24/7 dedicated runtimes or broad voice/browser/tool parity without separate evidence.

## Release rule

Before any material action: verify current main, production deployment, migrations, relevant runtime, existing implementation, PR base/head and exact-head checks. Merge only when mandatory checks are green and mergeable. After a successful main merge, reconcile editable continuity/canonical documentation before treating the milestone as complete.
