-- =========================================================
-- HOCKER ECOSYSTEM — CORE (projects/members/nodes/controls/events/nova/commands)
-- Idempotente y seguro para producción.
-- =========================================================

begin;

-- UUIDs
create extension if not exists pgcrypto;

-- updated_at helper (usado por varias tablas)
create or replace function public.tg_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------
-- Projects (mínimo viable si no existe)
-- ---------------------------------------------------------
do $$
begin
  if to_regclass('public.projects') is null then
    execute $sql$
      create table public.projects (
        id text primary key,
        name text,
        meta jsonb not null default '{}'::jsonb,
        created_at timestamptz not null default now()
      );
    $sql$;
  end if;
end;
$$;

-- ---------------------------------------------------------
-- Project Members
-- ---------------------------------------------------------
do $$
begin
  if to_regclass('public.project_members') is null then
    execute $sql$
      create table public.project_members (
        id uuid primary key default gen_random_uuid(),
        project_id text not null references public.projects(id) on delete cascade,
        user_id uuid not null,
        role text not null default 'viewer',
        created_at timestamptz not null default now()
      );
    $sql$;

    execute $sql$
      create unique index if not exists project_members_project_user_uniq
      on public.project_members(project_id, user_id);
    $sql$;

    -- constraint role (solo si no existe)
    execute $sql$
      do $inner$
      begin
        if not exists (
          select 1 from pg_constraint
          where conname = 'project_members_role_check'
        ) then
          alter table public.project_members
          add constraint project_members_role_check
          check (role in ('owner','admin','operator','viewer'));
        end if;
      end;
      $inner$;
    $sql$;
  end if;
end;
$$;

-- ---------------------------------------------------------
-- Helpers de roles (create or replace, no rompe)
-- ---------------------------------------------------------
create or replace function public.is_project_member(pid text)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.project_members m
    where m.project_id = pid
      and m.user_id = auth.uid()
  );
$$;

create or replace function public.is_project_admin(pid text)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.project_members m
    where m.project_id = pid
      and m.user_id = auth.uid()
      and m.role in ('owner','admin')
  );
$$;

create or replace function public.is_project_operator(pid text)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.project_members m
    where m.project_id = pid
      and m.user_id = auth.uid()
      and m.role in ('owner','admin','operator')
  );
$$;

-- ---------------------------------------------------------
-- Nodes (agentes/nodos visibles en panel)
-- ---------------------------------------------------------
do $$
begin
  if to_regclass('public.nodes') is null then
    execute $sql$
      create table public.nodes (
        id text primary key,
        project_id text not null references public.projects(id) on delete cascade,
        name text,
        type text not null default 'agent',
        status text not null default 'offline',
        last_seen_at timestamptz,
        meta jsonb not null default '{}'::jsonb,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now()
      );
    $sql$;

    execute $sql$
      create index if not exists nodes_project_idx on public.nodes(project_id);
    $sql$;

    execute $sql$
      drop trigger if exists nodes_set_updated_at on public.nodes;
      create trigger nodes_set_updated_at
      before update on public.nodes
      for each row execute function public.tg_set_updated_at();
    $sql$;
  else
    -- si ya existe, solo aseguramos columnas mínimas
    execute $sql$
      alter table public.nodes add column if not exists project_id text;
      alter table public.nodes add column if not exists name text;
      alter table public.nodes add column if not exists type text;
      alter table public.nodes add column if not exists status text;
      alter table public.nodes add column if not exists last_seen_at timestamptz;
      alter table public.nodes add column if not exists meta jsonb;
      alter table public.nodes add column if not exists created_at timestamptz;
      alter table public.nodes add column if not exists updated_at timestamptz;
    $sql$;
  end if;
end;
$$;

-- ---------------------------------------------------------
-- System Controls (Kill Switch / allow_write)
-- ---------------------------------------------------------
do $$
begin
  if to_regclass('public.system_controls') is null then
    execute $sql$
      create table public.system_controls (
        project_id text not null references public.projects(id) on delete cascade,
        id text not null default 'global',
        kill_switch boolean not null default false,
        allow_write boolean not null default false,
        meta jsonb not null default '{}'::jsonb,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now(),
        primary key (project_id, id)
      );
    $sql$;

    execute $sql$
      drop trigger if exists system_controls_set_updated_at on public.system_controls;
      create trigger system_controls_set_updated_at
      before update on public.system_controls
      for each row execute function public.tg_set_updated_at();
    $sql$;
  else
    execute $sql$
      alter table public.system_controls add column if not exists kill_switch boolean;
      alter table public.system_controls add column if not exists allow_write boolean;
      alter table public.system_controls add column if not exists meta jsonb;
      alter table public.system_controls add column if not exists created_at timestamptz;
      alter table public.system_controls add column if not exists updated_at timestamptz;
    $sql$;
  end if;
end;
$$;

-- ---------------------------------------------------------
-- Events (observabilidad real)
-- ---------------------------------------------------------
do $$
begin
  if to_regclass('public.events') is null then
    execute $sql$
      create table public.events (
        id uuid primary key default gen_random_uuid(),
        project_id text not null references public.projects(id) on delete cascade,
        node_id text,
        level text not null default 'info',
        type text not null,
        message text not null,
        data jsonb,
        created_at timestamptz not null default now()
      );
    $sql$;

    execute $sql$
      create index if not exists events_project_created_idx on public.events(project_id, created_at desc);
      create index if not exists events_project_type_idx on public.events(project_id, type);
    $sql$;

    -- constraint level (si no existe)
    execute $sql$
      do $inner$
      begin
        if not exists (select 1 from pg_constraint where conname = 'events_level_check') then
          alter table public.events
          add constraint events_level_check
          check (level in ('info','warn','error'));
        end if;
      end;
      $inner$;
    $sql$;
  else
    execute $sql$
      alter table public.events add column if not exists project_id text;
      alter table public.events add column if not exists node_id text;
      alter table public.events add column if not exists level text;
      alter table public.events add column if not exists type text;
      alter table public.events add column if not exists message text;
      alter table public.events add column if not exists data jsonb;
      alter table public.events add column if not exists created_at timestamptz;
    $sql$;
  end if;
end;
$$;

-- ---------------------------------------------------------
-- NOVA Threads / Messages (memoria real)
-- ---------------------------------------------------------
do $$
begin
  if to_regclass('public.nova_threads') is null then
    execute $sql$
      create table public.nova_threads (
        id uuid primary key,
        project_id text not null references public.projects(id) on delete cascade,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now()
      );
    $sql$;

    execute $sql$
      create index if not exists nova_threads_project_idx on public.nova_threads(project_id);
    $sql$;

    execute $sql$
      drop trigger if exists nova_threads_set_updated_at on public.nova_threads;
      create trigger nova_threads_set_updated_at
      before update on public.nova_threads
      for each row execute function public.tg_set_updated_at();
    $sql$;
  else
    execute $sql$
      alter table public.nova_threads add column if not exists updated_at timestamptz not null default now();
      alter table public.nova_threads add column if not exists project_id text;
      alter table public.nova_threads add column if not exists created_at timestamptz;
    $sql$;
  end if;

  if to_regclass('public.nova_messages') is null then
    execute $sql$
      create table public.nova_messages (
        id uuid primary key,
        project_id text not null references public.projects(id) on delete cascade,
        thread_id uuid not null references public.nova_threads(id) on delete cascade,
        role text not null,
        content text not null,
        created_at timestamptz not null default now()
      );
    $sql$;

    execute $sql$
      create index if not exists nova_messages_thread_idx on public.nova_messages(project_id, thread_id, created_at);
    $sql$;

    execute $sql$
      do $inner$
      begin
        if not exists (select 1 from pg_constraint where conname = 'nova_messages_role_check') then
          alter table public.nova_messages
          add constraint nova_messages_role_check
          check (role in ('system','user','assistant'));
        end if;
      end;
      $inner$;
    $sql$;
  end if;
end;
$$;

-- ---------------------------------------------------------
-- Commands (cola real de ejecución firmada)
-- ---------------------------------------------------------
do $$
begin
  if to_regclass('public.commands') is null then
    execute $sql$
      create table public.commands (
        id uuid primary key,
        project_id text not null references public.projects(id) on delete cascade,
        node_id text not null,
        command text not null,
        payload jsonb not null default '{}'::jsonb,

        status text not null default 'queued',
        needs_approval boolean not null default false,
        signature text not null,

        result jsonb,
        error text,

        created_at timestamptz not null default now(),
        executed_at timestamptz,
        started_at timestamptz,
        finished_at timestamptz,
        approved_at timestamptz
      );
    $sql$;

    execute $sql$
      create index if not exists commands_project_node_created_idx
      on public.commands(project_id, node_id, created_at desc);
      create index if not exists commands_project_status_idx
      on public.commands(project_id, status, created_at desc);
    $sql$;

    execute $sql$
      do $inner$
      begin
        if not exists (select 1 from pg_constraint where conname = 'commands_status_check') then
          alter table public.commands
          add constraint commands_status_check
          check (status in ('queued','needs_approval','running','done','error','canceled'));
        end if;
      end;
      $inner$;
    $sql$;
  else
    -- Si ya existe: agregamos lo que falte (sin destruir lo tuyo)
    execute $sql$
      alter table public.commands add column if not exists project_id text;
      alter table public.commands add column if not exists node_id text;
      alter table public.commands add column if not exists command text;
      alter table public.commands add column if not exists payload jsonb;
      alter table public.commands add column if not exists status text;
      alter table public.commands add column if not exists needs_approval boolean;
      alter table public.commands add column if not exists signature text;
      alter table public.commands add column if not exists result jsonb;
      alter table public.commands add column if not exists error text;
      alter table public.commands add column if not exists created_at timestamptz;
      alter table public.commands add column if not exists executed_at timestamptz;
      alter table public.commands add column if not exists started_at timestamptz;
      alter table public.commands add column if not exists finished_at timestamptz;
      alter table public.commands add column if not exists approved_at timestamptz;
    $sql$;

    -- constraint status (solo si no existe; no intentamos “reemplazar”)
    execute $sql$
      do $inner$
      begin
        if not exists (select 1 from pg_constraint where conname = 'commands_status_check') then
          alter table public.commands
          add constraint commands_status_check
          check (status in ('queued','needs_approval','running','done','error','canceled'));
        end if;
      end;
      $inner$;
    $sql$;

    execute $sql$
      create index if not exists commands_project_node_created_idx
      on public.commands(project_id, node_id, created_at desc);
      create index if not exists commands_project_status_idx
      on public.commands(project_id, status, created_at desc);
    $sql$;
  end if;
end;
$$;

-- ---------------------------------------------------------
-- Seeds mínimos (no rompe si ya existen)
-- ---------------------------------------------------------
insert into public.projects (id, name)
values ('global', 'Global')
on conflict (id) do nothing;

insert into public.system_controls (project_id, id, kill_switch, allow_write)
values ('global', 'global', false, false)
on conflict (project_id, id) do nothing;

commit;