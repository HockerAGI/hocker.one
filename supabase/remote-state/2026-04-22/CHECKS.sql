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
