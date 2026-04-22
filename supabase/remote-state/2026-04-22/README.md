# Supabase Remote State · 2026-04-22

Este directorio documenta el **estado remoto real** de Supabase usado por el ecosistema Hocker al corte **2026-04-22**.

## Objetivo
Dejar trazabilidad del estado SQL real mientras billing y deploy final de infraestructura siguen pendientes.

## Repos validados al momento de este snapshot
- hocker.one: `f8c476c`
- nova.agi: `bbe6954`
- hocker-node-agent: `c37a870`

## Incluye
- `schema.sql`
- `public_schema.sql`
- `auth_storage_schema.sql`
- `roles.tsv`
- `policies.tsv`
- `triggers.tsv`
- `functions.tsv`
- `CHECKS.sql`
- `RUNTIME_ALIGNMENT.md`

## No incluye
- `data.sql`

`data.sql` no se sube al repo porque contiene datos reales operativos.

## Estado operativo documentado
- Cola `commands` alineada con runtime actual:
  - `status`
  - `needs_approval`
  - `signature`
  - `approved_at`
  - `started_at`
  - `finished_at`
  - `completed_at`
- Tablas core verificadas en remoto:
  - `llm_usage`
  - `audit_logs`
  - `audit_exports`
  - `node_heartbeats`
  - `nova_threads`
  - `nova_messages`
- Nodos de prueba/operación documentados:
  - `hocker-node-1`
  - `cloud-core-1`

## Pendiente fuera de SQL
1. Billing en GCP
2. Deploy de `nova.agi`
3. URL real para `NOVA_AGI_URL` y `ORCHESTRATOR_BASE_URL`
4. Redeploy final de `hocker.one`
