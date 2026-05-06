-- HOCKER ONE — Tenant/RLS Foundation
-- Version: hocker-tenant-rls-v0.1.0
-- Safe foundation migration. Does not alter existing events/commands tables.

create table if not exists public.hocker_tenants (
  id uuid primary key default gen_random_uuid(),
  tenant_id text unique not null,
  owner_id text not null,
  label text not null,
  scope text not null check (scope in ('owner', 'internal_agi', 'client_portal', 'client_user', 'auditor')),
  status text not null default 'active' check (status in ('active', 'paused', 'revoked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hocker_portal_grants (
  id uuid primary key default gen_random_uuid(),
  grant_id text unique not null,
  tenant_id text not null references public.hocker_tenants(tenant_id),
  portal_id text not null,
  grantee_email text not null,
  modules text[] not null default '{}',
  permissions text[] not null default '{}',
  blocked_permissions text[] not null default '{}',
  access_type text not null check (access_type in ('temporary', 'permanent')),
  expires_at timestamptz,
  revoked_at timestamptz,
  audit_trace_id text,
  status text not null default 'active' check (status in ('pending', 'active', 'rejected', 'revoked', 'expired')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.hocker_tenants enable row level security;
alter table public.hocker_portal_grants enable row level security;

drop policy if exists "hocker_tenants_owner_service_only" on public.hocker_tenants;
create policy "hocker_tenants_owner_service_only"
on public.hocker_tenants
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

drop policy if exists "hocker_portal_grants_owner_service_only" on public.hocker_portal_grants;
create policy "hocker_portal_grants_owner_service_only"
on public.hocker_portal_grants
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

comment on table public.hocker_tenants is 'Hocker ONE tenant registry. Owner controlled. Client access disabled until portal auth is explicitly activated.';
comment on table public.hocker_portal_grants is 'Logical portal grants prepared for future tenant RLS. Does not create real sessions by itself.';
