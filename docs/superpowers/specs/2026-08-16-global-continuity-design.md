# HOCKER Global Continuity — Design 2026-08-16

Status: **DESIGN FOR REVIEW**

## Goal

Permitir que ChatGPT, Codex, GitHub, Supabase, Vercel, Railway y futuros agentes/sesiones recuperen el estado operativo de HOCKER después de una interrupción sin depender del chat anterior, sin volver a auditar todo el ecosistema y sin convertir Markdown en una base de datos dinámica.

La continuidad debe registrar altas/bajas/renombres de repositorios, ramas/SHAs, PRs, merges, deployments, migraciones, cambios de fase/gate, bloqueadores, decisiones y siguiente acción. Los datos sensibles, secretos y chats crudos quedan excluidos.

## Principles

1. **Una verdad dinámica, no nueve copias.** El estado vivo reside en Context Bridge/Supabase; los repos contienen reglas durables y proyecciones mínimas.
2. **Event-driven primero; reconciliación después.** Los eventos actualizan el ledger en segundos cuando el proveedor lo permite. Un reconciliador periódico detecta eventos perdidos o drift.
3. **Append-only para historia; current-state projection para velocidad.** Nunca se pierde la secuencia de cambios, pero una nueva sesión no necesita releer todo el historial.
4. **Evidence first.** Un evento recibido no convierte por sí solo una capacidad en `verified`; los estados de readiness siguen usando evidencia reproducible.
5. **Fail closed.** Si una fuente no está disponible o una firma/validación no es suficiente, se conserva el último estado conocido y se marca `stale`/`unverified`.
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
- `installation` e `installation_repositories` permiten detectar cambios de acceso; el inventario API detecta altas/bajas/renombres aunque un evento haya fallado.
- La autenticación automatizada final usa GitHub App installation tokens, no PAT de usuario como arquitectura permanente.

### Supabase

- Supabase Queues/PGMQ proporciona cola durable para procesamiento asíncrono.
- Supabase Cron permite jobs frecuentes y registra historial de ejecución.
- Edge Functions son adecuadas como webhook receivers; webhooks externos deben validar la autenticidad disponible del proveedor dentro de la función.
- Secrets/Vault se usan para credenciales server-only.
- Ledger y snapshots permanecen service-only por defecto con grants/RLS explícitos.

### Vercel

- Account Webhooks del dashboard requieren Pro/Enterprise; no son dependencia obligatoria del diseño actual.
- Vercel REST API permite reconstruir proyectos/deployments con token server-only.
- Hobby Cron tiene frecuencia mínima diaria, por lo que no sirve como motor casi-real-time.
- El reconciliador central usa Supabase Cron como backstop y Vercel REST para obtener estado cuando no haya webhook disponible.

### Railway / NOVA

- Railway ofrece webhooks por proyecto para cambios de estado de deployments y alertas.
- La documentación pública revisada no define una firma criptográfica de Railway para esos webhooks; por tanto se tratan como **señal advisory**, no como evidencia autenticada suficiente.
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
Ingress adapters
(GitHub App verified / Railway advisory / future providers)
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
       |          +--> repository current/lifecycle state
       |          +--> provider deployment/runtime current state
       |          +--> handoff/current next action
       |
       v
context_current_state projection
       |
       +--> Hocker One recovery/status API/UI
       +--> Codex/ChatGPT bootstrap response
       +--> redacted GitHub continuity mirror

Supabase Cron
       |
       +--> reconcile GitHub installation/repositories/PR heads
       +--> reconcile Vercel deployments/projects
       +--> check stale sources / failed webhook gaps
       +--> verify NOVA runtime evidence via Railway API + readiness when configured
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

El body HTTP crudo se usa sólo de forma transitoria para validar firmas cuando el proveedor las ofrece; no se persiste.

### 2. `continuity_repository_state`

Una fila vigente por GitHub repository ID:

- stable repository ID;
- full name/name actuales;
- visibility/private/archive state;
- default branch;
- head SHA;
- last push/update;
- lifecycle `active|archived|removed|unreachable`;
- first/last seen;
- last event/checkpoint ref.

Los renombres se detectan por repository ID estable, no por nombre.

### 3. `continuity_provider_state`

Estado actual de recursos externos. Scopes iniciales:

- `vercel.project`
- `vercel.deployment`
- `railway.project`
- `railway.service`
- `railway.deployment`
- `supabase.project`
- `supabase.branch`

No guarda secretos. Guarda provider IDs, estado, timestamps, SHA/revision, environment y evidence refs.

### 4. `continuity_handoffs`

Ledger estructurado de intención/decisiones que infraestructura no puede inferir:

- objective;
- current phase/gate;
- decisions;
- blockers;
- next action;
- repo/branch/PR/SHA refs;
- evidence refs;
- actor;
- created_at.

No almacena transcript ni arrays de mensajes crudos.

### 5. Current-state projection

Una función/vista devuelve un payload compacto de recuperación:

- inventario y lifecycle del ecosistema;
- estado release/candidate de Hocker One;
- contrato y evidencia live de NOVA;
- métricas AGI con denominadores explícitos;
- PRs/heads de repos foco;
- último handoff y next action;
- providers stale/missing;
- manifest Context Bridge active/draft refs.

Debe permitir hidratar una sesión sin escanear el historial completo.

### 6. GitHub App ingress

Receptor preferido: **Supabase Edge Function**, para que el ledger pueda seguir recibiendo actividad aunque Hocker One/Vercel esté temporalmente fuera.

Flow:

1. leer raw request body;
2. validar HMAC GitHub;
3. exigir `X-GitHub-Delivery` y `X-GitHub-Event`;
4. normalizar sólo metadata permitida;
5. insertar idempotentemente en `continuity_events`;
6. encolar delivery ID en PGMQ;
7. responder 2XX antes de 10 s;
8. processor actualiza projections/checkpoint.

Eventos iniciales de valor: installation, installation_repositories, repository, push, pull_request, workflow_run, release y create/delete de branch/tag cuando aporte lifecycle. Permisos read-only y least-privilege.

### 7. Railway/NOVA ingress

Railway webhook aporta una señal rápida de deployment status. Como la documentación pública revisada no define firma criptográfica de esos payloads:

1. el endpoint Railway usa un URL secreto no publicado como control adicional de entrada;
2. el payload se registra como `advisory` y nunca eleva NOVA a `verified` por sí solo;
3. el processor contrasta deployment/service/project ID, estado y commit con Railway Public API usando token server-only;
4. si el deployment corresponde a NOVA, verifica `/health/ready` y exige heartbeat/log evidence del mismo candidate;
5. sólo la evidencia corroborada se publica como checkpoint de producción.

Un Railway `Active` es señal útil pero insuficiente porque Railway no hace health monitoring continuo posterior al deployment.

### 8. Reconciliation backstop

Supabase Cron ejecuta reconciliación incremental. Cadencia objetivo inicial: **cada 5 minutos** para drift de repos/proveedores mientras volumen/costos sean bajos; puede reducirse si rate limits o costo lo justifican.

El reconciliador usa cursores/timestamps y consulta sólo recursos mutables. No ejecuta una auditoría profunda de todos los repos cada vez.

Para GitHub:

- reconcilia instalación, repo IDs, lifecycle, heads y PRs relevantes;
- consulta GitHub App delivery metadata para detectar fallos;
- redeliver de eventos recientes cuando credenciales/App lo permitan;
- si no hay redelivery, reconstruye current state por API y deja gap histórico explícito.

Para Vercel Hobby: usa REST API, no Account Webhooks.

Para Railway: API polling confirma o corrige los eventos advisory.

### 9. Redundant recovery mirror

Supabase sigue siendo la fuente primaria. Un **GitHub issue** en `hocker.one` mantiene un mirror sanitizado del último estado material. Actualizar un issue no crea commits ni consume GitHub Actions.

Incluye sólo:

- timestamp de checkpoint global;
- repo count/lifecycle changes;
- Hocker One/NOVA SHA/PR focus;
- blockers activos;
- next action;
- Context Bridge manifest/version refs.

Nunca incluye secretos, payloads privados, chats o datos de dominios restringidos.

`LAST_KNOWN_STATE.md` queda como artefacto de release/hito, no heartbeat realtime.

## Repo-local projection policy

Cada repo HOCKER debe converger a:

- `AGENTS.md` corto y personalizado;
- un pointer de continuidad/arquitectura local (`docs/CONTINUITY.md` o equivalente);
- referencia al bootstrap global Context Bridge;
- cero repo counts, porcentajes o provider states globales hardcodeados.

Dominios sensibles/regulados mantienen aislamiento. El ledger global registra metadata de ingeniería/lifecycle salvo autorización explícita del dominio.

## Recovery procedure

Una sesión nueva:

1. lee `AGENTS.md`;
2. lee el pointer local;
3. consulta la current-state projection de Context Bridge;
4. compara SHA/PR local contra el checkpoint;
5. reconsulta sólo fuentes stale/cambiadas;
6. carga último structured handoff;
7. continúa desde `next_action` o registra una decisión que lo sustituya.

Auditoría completa sólo cuando falla integridad de reconciliación, cambia materialmente el schema o un gate de alto riesgo lo exige.

## Failure handling

- GitHub signature inválida → `401/403`, sin persistencia.
- Duplicate delivery → idempotent `2XX`, sin evento duplicado.
- Railway webhook inesperado → advisory rechazado/ignorado hasta corroboración API.
- Queue processor failure → mensaje reaparece tras visibility timeout; historia no se pierde.
- Provider unavailable → conservar último estado, marcar stale y reintentar por backstop.
- GitHub webhook perdido → delivery audit/redelivery cuando sea posible + API reconciliation.
- Supabase temporalmente unavailable → GitHub puede redeliver deliveries recientes; GitHub recovery mirror conserva el último estado material.
- Vercel unavailable → no afecta ledger GitHub/handoffs.
- Hocker One unavailable → Supabase Edge Function sigue siendo ingress principal.

## Security

- GitHub App: read-only y least-privilege al inicio.
- GitHub private key/webhook secret, Vercel token y Railway API token son server-only y nunca aparecen en checkpoints.
- `continuity_events`, repository/provider state y handoffs son service-only por defecto.
- Cualquier mutación futura de proveedor es una capability separada bajo Owner Gate; continuity ingestion es evidencia/lectura.
- Sanitizer rechaza credenciales y raw-content/transcript/messages.
- Delivery IDs + payload hashes soportan replay detection/audit.

## GitHub Actions budget policy

- Sin scheduled GitHub Actions para polling/redelivery de continuidad.
- Markdown-only no debe correr CI general una vez que la policy alcance `main`.
- Un CI final por batch significativo de code/config/migration + controles obligatorios de release/security.
- Android/emulator y workflows caros siguen path/manual gated.

## Release gates

La continuidad queda lista para merge sólo cuando:

1. schema/migration tests pasan;
2. GitHub signature/replay tests pasan;
3. event normalization cubre repo add/remove/rename, push y PR lifecycle;
4. queue processing es idempotent/retry-safe;
5. current-state projection reproduce inventario observado;
6. backstop repara un evento omitido deliberadamente en validation;
7. no se persiste raw secret/chat content;
8. Hocker One tests/typecheck/lint/build/security audit pasan en un candidate SHA;
9. preview exacto está READY sin nuevo error/fatal cluster;
10. NOVA CI sigue verde;
11. NOVA live evidence se mantiene `unverified` hasta corroborar Railway API + SHA + readiness + heartbeat/E2E;
12. Context Bridge draft usa checkpoints frescos y no se activa sin Owner+AAL2;
13. `main` sólo se mergea después de revisar todos los gates verdes.

## Non-goals

- Completar lógica de CHIDO/Hocker Ads/Wallet/Casino desde este flujo.
- Guardar payloads sensibles de dominios restringidos en memoria global.
- Usar LLM para inferir estado cuando existe evidencia de proveedor.
- Activar manifests o hacer auto-merge.
- Sustituir gates legales/regulatorios por código.
