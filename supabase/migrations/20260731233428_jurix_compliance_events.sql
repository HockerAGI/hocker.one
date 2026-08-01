create table if not exists public.compliance_events (
  id uuid primary key default gen_random_uuid(),
  project_id text not null,
  category text not null default 'general',
  severity text not null default 'info',
  title text not null,
  description text not null default '',
  evidence jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  constraint compliance_events_project_id_length check (char_length(project_id) between 1 and 64),
  constraint compliance_events_category_length check (char_length(category) between 1 and 80),
  constraint compliance_events_severity_value check (severity in ('info', 'low', 'medium', 'high', 'critical')),
  constraint compliance_events_title_length check (char_length(title) between 1 and 200),
  constraint compliance_events_description_length check (char_length(description) <= 5000),
  constraint compliance_events_evidence_array check (jsonb_typeof(evidence) = 'array')
);
alter table public.compliance_events enable row level security;
revoke all on table public.compliance_events from public, anon, authenticated;
grant select, insert, update, delete on table public.compliance_events to service_role;
create index if not exists compliance_events_project_created_idx on public.compliance_events (project_id, created_at desc);
create index if not exists compliance_events_project_severity_idx on public.compliance_events (project_id, severity, created_at desc);
comment on table public.compliance_events is 'Service-only Jurix compliance evidence emitted by authenticated HOCKER runtimes.';
