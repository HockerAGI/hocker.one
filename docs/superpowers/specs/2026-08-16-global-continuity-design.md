# HOCKER Global Continuity + Provider-Independent AGI Memory — Design 2026-08-16

Status: **APPROVED WITH PROVIDER/MEMORY AMENDMENT**

## Goal

Permitir que ChatGPT, Codex, GitHub, Supabase, Vercel y cualquier superficie HOCKER recuperen el estado operativo y conversacional autorizado de HOCKER después de una interrupción sin depender del chat anterior, sin volver a auditar todo el ecosistema y sin convertir Markdown en una base de datos dinámica.

La continuidad debe registrar altas/bajas/renombres de repositorios, ramas/SHAs, PRs, merges, deployments, migraciones, cambios de fase/gate, bloqueadores, decisiones y siguiente acción. Además, NOVA y las 16 AGIs deben conservar identidad, sesiones y memoria aunque cambie el modelo o proveedor de inferencia.

## Principios

1. **Una verdad dinámica, no copias por repo/proveedor.** El estado vivo reside en Context Bridge/Supabase; cada repo mantiene reglas durables y proyecciones mínimas.
2. **La AGI vive en HOCKER.** OpenAI, Gemini, Anthropic, Vercel AI Gateway u otro motor aportan inferencia; no poseen identidad, memoria ni permisos de la AGI.
3. **Memoria fuera del proveedor.** Sesiones, mensajes, handoffs y aprendizaje se persisten en HOCKER/Supabase antes de depender de una respuesta de modelo.
4. **Event-driven primero; reconciliación después.** Eventos actualizan el ledger cuando el proveedor lo permite; un backstop incremental detecta pérdidas/drift.
5. **Append-only para historia; current-state projection para velocidad.** Una sesión nueva no relee todo el historial.
6. **Evidence first y fail closed.** Estado no verificable se marca `stale`, `partial` o `unverified`.
7. **No auto-merge ni ejecución material desde la capa de memoria.** Owner Gate sigue gobernando acciones externas.
8. **No CI como heartbeat.** GitHub Actions se reserva para cambios importantes.

## Decisión sobre NOVA, Railway y Vercel AI Gateway

### Estado real observado

- `hocker.one` ya contiene `src/lib/serverless-agi-runtime.ts`, que ejecuta perfiles canónicos de AGIs mediante Vercel AI Gateway.
- `/api/nova/chat` ya puede caer al runtime serverless de Hocker One cuando `NOVA_AGI_URL`/`NOVA_ORCHESTRATOR_KEY` no existen o el upstream falla.
- `nova.agi` conserva un runtime Fastify portable con routing directo OpenAI/Gemini/Anthropic/Ollama, memoria Supabase, workers, MCP y contratos de health/readiness.
- Railway es un target histórico/portable del runtime dedicado; no debe ser dependencia de identidad o memoria.

### Arquitectura objetivo

**Ruta primaria de interacción:**

`Hocker One / otras superficies -> HOCKER Unified AGI Runtime -> model router -> Vercel AI Gateway -> proveedores`

**Fallbacks:**

1. AI Gateway primary con provider/model fallbacks.
2. Adapters directos por proveedor para bypass de Gateway cuando éste falle por auth, saldo, disponibilidad o política.
3. Motor local/self-hosted cuando esté disponible para survival mode y tareas compatibles.

**Railway:** deja de ser requisito de producción para NOVA. El repo `nova.agi` permanece como runtime portable/compatibility source hasta cerrar paridad. Railway sólo puede mantenerse temporalmente como fallback opcional durante migración; se retira cuando los gates de paridad demuestren que Hocker One + Supabase cubren chat, sesiones, workers, memoria, telemetría, MCP drafts y recuperación.

### Límite económico real

No existe arquitectura de IA que garantice inferencia ilimitada sin costo, cuota o capacidad física. Vercel AI Gateway también utiliza créditos y exige saldo incluso con BYOK. El objetivo HOCKER es **eliminar dependencia de un único proveedor/crédito**, no prometer capacidad infinita.

## Memoria en tres capas

### A. AGI Session Store — conversación durable

Persistencia de conversaciones HOCKER completas y autorizadas. Nuevo contrato aditivo:

- `agi_sessions`
- `agi_messages`

Campos mínimos de sesión:

- `id`
- `agi_id`
- `tenant_id`
- `project_id`
- `user_id`
- `client_id`
- `app_id`
- `channel`
- `surface`
- `title`
- `summary`
- `retention_policy`
- `consent_state`
- `started_at`
- `updated_at`
- `closed_at`
- `meta`

Campos mínimos de mensaje:

- `id`
- `session_id`
- `agi_id`
- `role`
- `content`
- `classification`
- `trace_id`
- `provider_internal`
- `model_internal`
- `created_at`
- `learning_processed_at`
- `meta`

`provider_internal`/`model_internal` son telemetría interna; no determinan identidad de la sesión.

### Migración sin pérdida

El sistema actual tiene datos reales en `nova_threads` y `nova_messages`. No se renombra ni elimina de golpe.

Secuencia:

1. crear tablas globales;
2. adapter de compatibilidad;
3. dual-write controlado para nuevas conversaciones;
4. backfill idempotente desde legacy;
5. dual-read con prioridad al contrato nuevo;
6. validación de conteos/hashes/orden;
7. switch de consumidores;
8. retirar legacy únicamente en un gate posterior separado.

`agi_chat_messages` existe pero no se reutiliza automáticamente; primero se documenta su propósito y se evita crear una cuarta fuente de verdad.

### B. Context Bridge — continuidad operativa

Context Bridge conserva:

- qué se estaba haciendo;
- repo/branch/PR/SHA;
- deployment/migration/gate;
- decisiones;
- blockers;
- siguiente acción;
- refs de evidencia.

No debe almacenar el transcript completo de conversaciones.

### C. Memory Mirror / SYNTIA — aprendizaje reutilizable

La conversación no se convierte automáticamente en conocimiento global. El flujo es:

`conversation/run -> Learning Extractor -> SYNTIA Write Gate -> review/policy -> Memory Mirror -> target AGIs`

Scopes:

1. session;
2. user/client;
3. domain/app;
4. canonical/global.

## Context reconstruction en cada llamada

Antes de inferencia, el Unified AGI Runtime arma contexto con:

1. identidad canónica de la AGI;
2. restricciones/Owner Gate;
3. mensajes recientes de la sesión;
4. resumen durable de la sesión cuando el historial exceda ventana;
5. memoria user/client permitida;
6. Memory Mirror de dominio relevante;
7. canon/global aplicable;
8. handoff/proceso operativo cuando la solicitud dependa del estado del proyecto.

El modelo recibe un contexto reconstruido desde HOCKER. Por eso cambiar OpenAI -> Gemini -> Claude -> local no provoca pérdida de identidad ni memoria.

## ChatGPT y otras superficies externas

- La memoria nativa de ChatGPT no se considera fuente canónica; no conserva cada detalle y los GPT personalizados no usan conversaciones anteriores.
- Una futura HOCKER App/Plugin/MCP puede consultar Context Bridge y AGI Session Store para rehidratar contexto en un chat nuevo.
- Sólo las interacciones que pasen por una superficie HOCKER autorizada pueden persistirse automáticamente en HOCKER.
- Un chat externo que nunca invoque HOCKER no puede capturarse silenciosamente; el fallback es un handoff explícito/sanitizado.

## Continuidad global de repositorios

### `continuity_events`

Ledger append-only, idempotente por `(provider, delivery_id)`, con metadata sanitizada; no guarda body crudo una vez validada la autenticidad.

### `continuity_repository_state`

Una fila actual por GitHub repository ID estable: nombre, lifecycle, visibility, default branch, head SHA, last push/update, first/last seen y last event/checkpoint.

### `continuity_provider_state`

Estado current de Vercel/Supabase y cualquier runtime opcional; nunca contiene secretos.

### `continuity_handoffs`

Objetivo, fase/gate, decisiones, blockers, next action y evidence refs.

### GitHub App ingress

Supabase Edge Function preferida:

1. validar `X-Hub-Signature-256`;
2. exigir/deduplicar `X-GitHub-Delivery`;
3. normalizar metadata;
4. persistir evento idempotente;
5. encolar PGMQ;
6. responder 2XX rápido;
7. procesar proyecciones/checkpoints async.

GitHub App read-only/least-privilege e installation tokens reemplazan PAT como arquitectura final.

### Reconciliation backstop

Supabase Cron incremental, objetivo inicial cada 5 minutos mientras costo/rate limits lo permitan. Reconcilia sólo recursos mutables/cambios desde el último cursor. No hace auditorías profundas recurrentes.

Vercel Hobby se consulta por REST; Vercel Cron diario queda como respaldo secundario, no motor principal.

## Redundant recovery mirror

Supabase es primary. Un GitHub issue sanitizado en `hocker.one` mantiene el último recovery snapshot material sin crear commits/Actions. `LAST_KNOWN_STATE.md` queda para release/hitos, no heartbeat.

## Repo-local policy

Cada repo HOCKER debe converger a:

- `AGENTS.md` corto y personalizado;
- `docs/CONTINUITY.md` o equivalente;
- puntero al bootstrap global;
- cero porcentajes, repo counts o provider states globales hardcodeados.

Dominios sensibles mantienen aislamiento; el ledger global sólo registra metadata de ingeniería/lifecycle salvo autorización explícita.

## Recovery procedure

Una nueva sesión:

1. lee `AGENTS.md`;
2. lee continuidad local;
3. consulta current-state projection;
4. resuelve la sesión AGI o último handoff relevante;
5. compara SHA/PR actual con checkpoint;
6. reconsulta sólo fuentes stale/cambiadas;
7. reconstruye contexto de conversación desde AGI Session Store + summaries + Memory Mirror;
8. continúa desde `next_action` o registra una decisión superseding.

Auditoría completa sólo cuando falla integridad de reconciliación, cambia materialmente el schema o un gate de alto riesgo lo exige.

## Security / privacy

- sesiones/mensajes con tenant/project/user boundaries y RLS/grants explícitos;
- service-role sólo backend;
- no secretos/tokens/cookies/TOTP en mensajes compartidos o checkpoints;
- clasificación y retention por sesión;
- aprendizaje reutilizable pasa por SYNTIA, no por copiar chats completos;
- raw chat de dominios restringidos no entra a memoria global;
- proveedor/modelo interno puede registrarse para FinOps/evals sin exponerse públicamente.

## GitHub Actions budget

- sin Actions programadas para continuidad;
- Markdown-only no ejecuta CI general cuando la policy esté en `main`;
- agrupar cambios y ejecutar un CI final por candidate significativo;
- workflows caros siguen path/manual gated.

## Release gates

La solución queda lista para merge sólo cuando:

1. schema/migration tests pasan;
2. backfill legacy -> AGI Session Store es idempotente y conserva conteo/orden/hashes;
3. chat serverless conserva/reconstruye sesión entre requests y después de cambio de provider;
4. AI Gateway primary + direct-provider fallback + local-survival contract tienen tests de routing/failure;
5. ninguna capa pública expone provider/model/credits como identidad NOVA;
6. Learning Extractor no promueve chats crudos a Memory Mirror;
7. GitHub webhook signature/replay tests pasan;
8. event normalization cubre repo add/remove/rename, push y PR lifecycle;
9. queue processing es idempotent/retry-safe;
10. current-state projection reproduce inventario observado;
11. backstop repara un evento omitido en validation;
12. no se persisten secretos en continuidad/memoria;
13. Hocker One tests/typecheck/lint/build/security audit pasan en candidate exacto;
14. Preview exacto está READY sin nuevo error/fatal cluster;
15. NOVA repo CI y contract tests siguen verdes;
16. Hocker One -> NOVA serverless E2E conserva thread/session y Owner Gate;
17. Context Bridge draft usa checkpoints frescos y no se activa sin Owner+AAL2;
18. Railway no es requerido para el camino primario antes de retirarlo; cualquier retiro exige paridad y rollback documentado;
19. `main` se mergea sólo después de todos los gates aplicables verdes.

## Non-goals

- afirmar inferencia ilimitada/gratuita;
- borrar `nova_threads/nova_messages` en esta fase;
- completar CHIDO/Hocker Ads/Wallet/Casino desde este flujo;
- almacenar payloads sensibles de dominios restringidos en memoria global;
- usar LLM para inferir estado si existe evidencia de proveedor;
- activar manifests o hacer auto-merge;
- sustituir gates legales/regulatorios por código.
