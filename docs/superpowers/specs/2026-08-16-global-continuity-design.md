# HOCKER Global Continuity — Design 2026-08-16

Status: **DESIGN FOR REVIEW**

## Goal

Permitir que ChatGPT, Codex, GitHub, Supabase, Vercel, Railway y futuros agentes/sesiones recuperen el estado operativo de HOCKER después de una interrupción sin depender del chat anterior, sin volver a auditar todo el ecosistema y sin convertir Markdown en una base de datos dinámica.

La continuidad debe registrar altas/bajas/renombres de repositorios, ramas/SHAs, PRs, merges, deployments, migraciones, cambios de fase/gate, bloqueadores, decisiones y siguiente acción. Los datos sensibles, secretos y chats crudos quedan excluidos.

## Principles

1. **Una verdad dinámica, no nueve copias.** El estado vivo reside en Context Bridge/Supabase; los repos contienen reglas durables y proyecciones mínimas.
2. **Event-driven primero; reconciliación después.** Los eventos actualizan el ledger en segundos cuando el proveedor lo permite. Un reconciliador periódico detecta eventos perdidos o drift.
3. **Append-only para historia; materialized current state para velocidad.** Nunca se pierde la secuencia de cambios, pero una nueva sesión no necesita releer todo el historial.
4. **Evidence first.** Un evento recibido no convierte por sí solo una capacidad en `verified`; los estados de readiness siguen usando evidencia reproducible.
5. **Fail closed.** Si una fuente no está disponible o una firma no valida, se conserva el último estado conocido y se marca `stale`/`unverified`.
6. **No raw chat memory.** Sólo decisiones, objetivo, bloqueadores, next action y referencias verificables.
7. **No CI como heartbeat.** GitHub Actions se reserva para código/config/tests/migraciones importantes.
8. **No auto-merge.** El sistema puede calcular readiness; `main` sólo se promueve cuando los gates del candidate exacto están verdes y el Owner autoriza.

## Official-source constraints checked 2026-08-16

### GitHub

- GitHub Apps pueden instalarse en cuentas personales y acceder a todos o a repositorios seleccionados.
- Los GitHub App webhooks entregan eventos en tiempo real de repositorios accesibles.
- El receptor valida `X-Hub-Signature-256` con HMAC-SHA256 y deduplica con `X-GitHub-Delivery`.
- El endpoint debe responder 2XX antes de 10 segundos; el procesamiento pesado debe ser asíncrono.
- GitHub no reenvía automáticamente webhooks fallidos. El sistema debe reconciliar/redeliver como backstop.
- `installation` e `installation_repositories` permiten detectar cambios de acceso a repositorios; el inventario API detecta altas/bajas/renombres aunque un evento haya fallado.
- La autenticación automatizada debe usar GitHub App installation tokens, no PAT de usuario como arquitectura final.

### Supabase

- Supabase Queues/PGMQ proporciona cola durable para procesamiento asíncrono.
- Supabase Cron permite jobs frecuentes y registra historial de ejecución.
- Edge Functions son adecuadas como webhook receivers; webhooks externos deben validar la firma del proveedor dentro de la función.
- Secrets/Vault se usan para credenciales server-only.
- El ledger y snapshots permanecen bajo grants/RLS explícitos y no se exponen a `anon`/`authenticated` salvo vistas sanitizadas aprobadas.

### Vercel

- Los Account Webhooks del dashboard requieren Pro/Enterprise; por lo tanto no son una dependencia obligatoria del diseño actual.
- Vercel REST API permite reconstruir proyectos/deployments con token server-only.
- Hobby Cron tiene frecuencia mínima diaria, por lo que no sirve como motor de continuidad casi-real-time.
- El reconciliador central debe usar Supabase Cron para backstop y Vercel REST para obtener estado cuando no haya webhook disponible.

### Railway / NOVA

- Railway ofrece webhooks por proyecto para cambios de estado de deployments y alertas.
- Railway healthchecks validan el arranque del deployment, pero no constituyen monitoreo continuo posterior.
- NOVA sólo se declara live/verificada cuando deployment identificado + SHA + `/health/ready` + heartbeat/logs + E2E Hocker One→NOVA coinciden en el candidate.

### Codex / OpenAI

- `AGENTS.md` debe ser un mapa corto de navegación y prácticas, no una enciclopedia dinámica.
- La documentación estructurada del repo funciona como sistema de registro durable; los estados mutables deben consultarse desde evidencia viva.

## Architecture

```text
Provider events / agent handoffs
       |
       v
Signed ingress adapters
(GitHub App / Railway / future providers)
       |
       v
continuity_events  -- append-only, idempotent by provider+delivery_id
       |
       +--> pgmq queue: hocker-continuity
       |          |
       |          v
       |     continuity processor
       |          |
       |          +--> Context Bridge checkpoints
       |          +--> repository_lifecycle/current state
       |          +--> provider deployment/runtime current state
       |          +--> handoff/current next action
       |
       v
context_current_state / materialized projection
       |
       +--> Hocker One recovery/status UI/API
       +--> Codex/ChatGPT bootstrap response
       +--> redacted GitHub continuity mirror

Supabase Cron
       |
       +--> reconcile GitHub installation/repositories/PR heads
       +--> reconcile Vercel deployments/projects
       +--> check stale sources / failed webhook delivery gaps
       +--> verify NOVA runtime evidence when credentials/endpoint exist
```

## Component boundaries

### 1. `continuity_events`

Append-only event ledger. Required fields:

- `id uuid`
- `project_id`
- `provider`
- `delivery_id`
- `event_type`
- `event_action`
- `resource_type`
- `resource_id`
- `repository_full_name` nullable
- `source_revision` nullable
- `occurred_at`
- `received_at`
- `payload_hash`
- `sanitized_payload jsonb`
- `processing_state`
- `processed_at`
- `error_code` nullable

Unique key: `(provider, delivery_id)`.

The raw signed HTTP body is used only transiently for signature validation; it is not persisted.

### 2. `continuity_repository_state`

One current row per GitHub repository ID. Tracks:

- GitHub stable repository ID;
- current full name/name;
- visibility/private/archive state;
- default branch;
- current head SHA;
- last push/update;
- lifecycle state: `active|archived|removed|unreachable`;
- first/last seen timestamps;
- last event/checkpoint reference.

Renames are detected by stable repository ID, not by repository name.

### 3. `continuity_provider_state`

Current state for external runtime/deployment resources. Initial scopes:

- `vercel.project`
- `vercel.deployment`
- `railway.project`
- `railway.service`
- `railway.deployment`
- `supabase.project`
- `supabase.branch`

No secrets are stored. Store provider IDs, states, timestamps, SHA/revision, environment and evidence refs.

### 4. `continuity_handoffs`

Structured intent/decision ledger for things infrastructure cannot infer:

- objective;
- current phase/gate;
- decisions made;
- blockers;
- next action;
- repo/branch/PR/SHA references;
- evidence refs;
- actor;
- created_at.

No raw transcript/message arrays.

### 5. Current-state projection

A database function/view returns a compact recovery payload:

- ecosystem repository inventory and lifecycle deltas;
- Hocker One candidate/current release state;
- NOVA runtime contract/live evidence;
- AGI evidence counts and missing gates;
- open PRs/heads for focus repos;
- last material handoff and next action;
- stale/missing providers;
- active/draft Context Bridge manifest refs.

It must be fast enough to hydrate a new session without historical scans.

### 6. GitHub App ingress

Public webhook endpoint hosted as Supabase Edge Function or Hocker One API with identical validation rules. Preferred production receiver: **Supabase Edge Function**, because the continuity ledger remains available even if Vercel/Hocker One is unavailable.

Flow:

1. read raw request body;
2. validate HMAC signature with GitHub webhook secret;
3. require `X-GitHub-Delivery` and `X-GitHub-Event`;
4. normalize allowed metadata only;
5. insert idempotently into `continuity_events`;
6. enqueue delivery ID into PGMQ;
7. return 2XX immediately;
8. processor creates/updates projections and Context Bridge checkpoint.

Initial subscribed events are limited to continuity value: installation, installation_repositories, repository, push, pull_request, workflow_run, deployment/deployment_status when applicable, release and create/delete branch/tag if needed. Permissions remain read-only unless a future separate Owner-gated capability requires writes.

### 7. Railway ingress

Signed/secret-authenticated webhook endpoint receives deployment state changes. It stores deployment/service/project IDs and state, then asynchronously verifies NOVA evidence when the event concerns the NOVA project.

A Railway `Active` state is useful evidence but not sufficient to mark NOVA fully verified because Railway does not continuously monitor the health endpoint after activation.

### 8. Reconciliation backstop

Supabase Cron runs incremental reconciliation. Target cadence: every 5 minutes for repository/provider drift while volume is small; dynamically reduce if rate limits/cost indicate no benefit.

The reconciler uses last cursors/timestamps and only fetches mutable resources since the previous checkpoint. It does not perform a full nine-repository audit each run.

For GitHub, the reconciler also detects failed/missing webhook periods and can query GitHub App webhook delivery metadata/redeliver recent failures when app credentials are configured. If redelivery is unavailable, inventory reconciliation still repairs current state and records an evidence gap.

For Vercel Hobby, reconciliation uses REST API rather than Account Webhooks.

### 9. Redundant recovery mirror

Primary truth remains Supabase. A redacted **GitHub issue** in `hocker.one` mirrors only the latest safe recovery snapshot at material milestones. Updating the issue does not create commits or consume GitHub Actions. It contains:

- last global checkpoint time;
- repository count/lifecycle changes;
- Hocker One/NOVA focus SHA/PR state;
- active blockers;
- next action;
- Context Bridge manifest/version references.

It never contains secrets, private payloads, chat transcripts or restricted-domain data.

This provides recovery when Supabase is temporarily unavailable but GitHub remains accessible. `LAST_KNOWN_STATE.md` remains a release/milestone artifact, not a realtime heartbeat.

## Repo-local projection policy

Every HOCKER repository should eventually have:

- a concise root `AGENTS.md` personalized to that repo;
- one repo-local continuity/architecture pointer (`docs/CONTINUITY.md` or equivalent);
- links to the global Context Bridge bootstrap/recovery source;
- no duplicated global percentages, repo counts or mutable provider state.

Repos with regulated/sensitive domains preserve their own data/memory isolation. The global ledger records only lifecycle/engineering metadata unless a domain explicitly authorizes more.

## Recovery procedure

A fresh ChatGPT/Codex/engineer session does:

1. read repo `AGENTS.md`;
2. read local continuity pointer;
3. query compact Context Bridge current-state projection;
4. compare repository current SHA/open PR with the last checkpoint;
5. re-query only sources marked stale or changed;
6. load latest structured handoff;
7. continue from `next_action` or record an explicit superseding decision.

A full ecosystem audit is required only when reconciliation integrity fails, schema changes materially or a high-risk release gate requests it.

## Failure handling

- Invalid webhook signature → `401/403`, no persistence.
- Duplicate delivery ID → idempotent `2XX`, no duplicate event.
- Queue processor failure → message remains/reappears after visibility timeout; event row records error without losing history.
- Provider unavailable → preserve last state, mark stale and record next reconciliation time.
- GitHub webhook delivery lost → scheduled delivery audit/redelivery where possible + inventory reconciliation.
- Supabase unavailable → provider webhook may fail; GitHub can redeliver recent App deliveries and GitHub recovery mirror retains last material snapshot.
- Vercel unavailable → continuity persists in Supabase; no loss of GitHub/hand-off history.
- Hocker One unavailable → Supabase Edge Function remains preferred ingress; UI catches up on recovery.

## Security

- GitHub App permissions start read-only and least-privilege.
- GitHub App private key, webhook secret, Vercel token and Railway webhook secret are server-only secrets; never stored in Context Bridge checkpoints.
- `continuity_events`, repository/provider state and handoffs are service-only by default; no client grants.
- Any future action that mutates provider state is a separate capability and passes Owner Gate. Continuity ingestion itself is read/evidence only.
- Payload sanitizer rejects credential-like fields and raw-content/transcript/message arrays.
- Delivery IDs and payload hashes support replay detection/audit.

## GitHub Actions budget policy

- No scheduled GitHub Actions for continuity polling or webhook redelivery.
- Markdown-only commits should not run general CI after the CI path policy reaches `main`.
- Use one final candidate CI per meaningful code/config/migration batch plus mandatory security/release checks.
- Android/emulator and other expensive workflows remain path/manual gated.

## Release gates for this feature

The continuity system can be considered complete for merge only when:

1. schema/migration tests pass;
2. webhook signature and replay tests pass;
3. GitHub event normalization tests cover repository add/remove/rename, push and PR lifecycle;
4. queue processing is idempotent and retry-safe;
5. current-state projection reproduces the observed repo inventory;
6. backstop reconciliation repairs a deliberately missed event in test/validation;
7. no raw secret/chat content is persisted;
8. Hocker One CI/typecheck/lint/build/security audit pass on one candidate SHA;
9. preview deployment is READY without new error/fatal cluster;
10. NOVA repo CI remains green for its continuity contract;
11. Context Bridge draft generated from fresh checkpoints has expected coverage and remains unactivated until Owner+AAL2;
12. `main` is merged only after the above gates are reviewed and green.

## Non-goals for this implementation

- Completing unrelated CHIDO/Hocker Ads/Wallet/Casino product logic.
- Writing restricted-domain business payloads into global memory.
- Using an LLM to infer canonical state when provider evidence exists.
- Automatically activating manifests or merging PRs.
- Replacing domain-specific release/legal gates.
