-- HOCKER · SUPABASE REMOTE CHECKS
-- Solo lectura. No modifica datos.
-- Corte documentado: 2026-04-22

-- 1) Tablas core esperadas
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in (
    'projects',
    'project_members',
    'nodes',
    'commands',
    'events',
    'system_controls',
    'nova_threads',
    'nova_messages',
    'agis',
    'llm_usage',
    'audit_logs',
    'audit_exports',
    'node_heartbeats'
  )
order by table_name;

-- 2) Contrato actual de commands
select column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'commands'
order by ordinal_position;

-- 3) Policies relevantes
select schemaname, tablename, policyname, roles, cmd
from pg_policies
where schemaname = 'public'
  and tablename in (
    'commands',
    'nova_threads',
    'nova_messages',
    'system_controls',
    'audit_logs',
    'audit_exports',
    'llm_usage',
    'node_heartbeats'
  )
order by tablename, policyname;

-- 4) Nova threads / messages
select count(*) as nova_threads_count from public.nova_threads;
select count(*) as nova_messages_count from public.nova_messages;

-- 5) Events / nodes
select count(*) as nodes_count from public.nodes;
select count(*) as events_count from public.events;

-- 6) Auditoría / uso
select count(*) as audit_logs_count from public.audit_logs;
select count(*) as llm_usage_count from public.llm_usage;
select count(*) as node_heartbeats_count from public.node_heartbeats;

-- 7) Nodos esperados
select id, project_id, type, status
from public.nodes
where id in ('hocker-node-1', 'cloud-core-1')
order by id;
