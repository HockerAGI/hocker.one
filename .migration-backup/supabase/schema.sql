-- =========================================================
-- HOCKER.ONE — Schema consistente con el app actual
-- Snap de tablas + RLS + RPC + trigger de usuario
-- =========================================================

begin;

create extension if not exists pgcrypto;
set search_path = public;

-- -------------------------
-- Helpers de roles
-- -------------------------
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

create or replace function public.is_project_owner(pid text)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.project_members m
    where m.project_id = pid
      and m.user_id = auth.uid()
      and m.role = 'owner'
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

-- -------------------------
-- Profiles
-- -------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  role text not null default 'operator' check (role in ('owner','admin','operator','viewer')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (id = auth.uid());

create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

-- -------------------------
-- Projects + membership
-- -------------------------
create table if not exists public.projects (
  id text primary key,
  name text,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.projects enable row level security;

create policy "projects_select_if_member"
on public.projects
for select
to authenticated
using (public.is_project_member(id));

create policy "projects_insert_authenticated"
on public.projects
for insert
to authenticated
with check (true);

create policy "projects_update_owner"
on public.projects
for update
to authenticated
using (public.is_project_owner(id))
with check (public.is_project_owner(id));

create table if not exists public.project_members (
  id uuid primary key default gen_random_uuid(),
  project_id text not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'viewer' check (role in ('owner','admin','operator','viewer')),
  created_at timestamptz not null default now()
);

create unique index if not exists project_members_project_user_uniq
on public.project_members(project_id, user_id);

alter table public.project_members enable row level security;

create policy "project_members_select_if_member"
on public.project_members
for select
to authenticated
using (public.is_project_member(project_id));

create policy "project_members_insert_owner"
on public.project_members
for insert
to authenticated
with check (public.is_project_owner(project_id));

create policy "project_members_update_owner"
on public.project_members
for update
to authenticated
using (public.is_project_owner(project_id))
with check (public.is_project_owner(project_id));

create policy "project_members_delete_owner"
on public.project_members
for delete
to authenticated
using (public.is_project_owner(project_id));

-- -------------------------
-- Nodes
-- -------------------------
create table if not exists public.nodes (
  id text primary key,
  project_id text not null references public.projects(id) on delete cascade,
  name text,
  type text not null default 'agent',
  status text not null default 'offline',
  last_seen_at timestamptz,
  meta jsonb not null default '{}'::jsonb,
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists nodes_project_idx on public.nodes(project_id);

create or replace function public.tg_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists nodes_set_updated_at on public.nodes;
create trigger nodes_set_updated_at
before update on public.nodes
for each row execute function public.tg_set_updated_at();

alter table public.nodes enable row level security;

create policy "nodes_select_if_member"
on public.nodes
for select
to authenticated
using (public.is_project_member(project_id));

create policy "nodes_insert_admin"
on public.nodes
for insert
to authenticated
with check (public.is_project_admin(project_id));

create policy "nodes_update_admin"
on public.nodes
for update
to authenticated
using (public.is_project_admin(project_id))
with check (public.is_project_admin(project_id));

create policy "nodes_delete_owner"
on public.nodes
for delete
to authenticated
using (public.is_project_owner(project_id));

-- -------------------------
-- System controls
-- -------------------------
create table if not exists public.system_controls (
  project_id text not null references public.projects(id) on delete cascade,
  id text not null default 'global',
  kill_switch boolean not null default false,
  allow_write boolean not null default false,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (project_id, id)
);

drop trigger if exists system_controls_set_updated_at on public.system_controls;
create trigger system_controls_set_updated_at
before update on public.system_controls
for each row execute function public.tg_set_updated_at();

alter table public.system_controls enable row level security;

create policy "system_controls_select_if_member"
on public.system_controls
for select
to authenticated
using (public.is_project_member(project_id));

create policy "system_controls_insert_owner"
on public.system_controls
for insert
to authenticated
with check (public.is_project_owner(project_id));

create policy "system_controls_update_owner"
on public.system_controls
for update
to authenticated
using (public.is_project_owner(project_id))
with check (public.is_project_owner(project_id));

-- -------------------------
-- Commands
-- -------------------------
create table if not exists public.commands (
  id uuid primary key,
  project_id text not null references public.projects(id) on delete cascade,
  node_id text not null references public.nodes(id) on delete set null,
  command text not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'queued'
    check (status in ('queued','needs_approval','running','done','error','canceled')),
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

create index if not exists commands_project_node_created_idx
on public.commands(project_id, node_id, created_at desc);

create index if not exists commands_project_status_idx
on public.commands(project_id, status, created_at desc);

alter table public.commands enable row level security;

create policy "commands_select_if_member"
on public.commands
for select
to authenticated
using (public.is_project_member(project_id));

create policy "commands_insert_admin"
on public.commands
for insert
to authenticated
with check (public.is_project_admin(project_id));

create policy "commands_update_admin"
on public.commands
for update
to authenticated
using (public.is_project_admin(project_id))
with check (public.is_project_admin(project_id));

-- -------------------------
-- Events
-- -------------------------
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  project_id text not null references public.projects(id) on delete cascade,
  node_id text references public.nodes(id) on delete set null,
  level text not null default 'info' check (level in ('info','warn','error')),
  type text not null,
  message text not null,
  data jsonb,
  created_at timestamptz not null default now()
);

create index if not exists events_project_created_idx on public.events(project_id, created_at desc);
create index if not exists events_project_type_idx on public.events(project_id, type);

alter table public.events enable row level security;

create policy "events_select_if_member"
on public.events
for select
to authenticated
using (public.is_project_member(project_id));

create policy "events_insert_admin"
on public.events
for insert
to authenticated
with check (public.is_project_admin(project_id));

-- -------------------------
-- Audit logs
-- -------------------------
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  project_id text references public.projects(id) on delete set null,
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  context jsonb,
  created_at timestamptz not null default now()
);

create index if not exists audit_logs_project_idx on public.audit_logs(project_id);

alter table public.audit_logs enable row level security;

create policy "audit_logs_select_owner"
on public.audit_logs
for select
to authenticated
using (
  project_id is null
  or public.is_project_owner(project_id)
);

-- -------------------------
-- AGIs registry
-- -------------------------
create table if not exists public.agis (
  id text primary key,
  name text,
  description text,
  version text,
  tags text[] not null default '{}',
  meta jsonb,
  created_at timestamptz not null default now()
);

alter table public.agis enable row level security;

create policy "agis_select_authed"
on public.agis
for select
to authenticated
using (true);

create policy "agis_insert_admin"
on public.agis
for insert
to authenticated
with check (true);

create policy "agis_update_admin"
on public.agis
for update
to authenticated
using (true)
with check (true);

-- -------------------------
-- NOVA threads + messages
-- -------------------------
create table if not exists public.nova_threads (
  id uuid primary key default gen_random_uuid(),
  project_id text not null references public.projects(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  title text,
  created_at timestamptz not null default now()
);

create index if not exists nova_threads_project_idx on public.nova_threads(project_id);

alter table public.nova_threads enable row level security;

create policy "nova_threads_select_if_member"
on public.nova_threads
for select
to authenticated
using (public.is_project_member(project_id));

create policy "nova_threads_insert_if_member"
on public.nova_threads
for insert
to authenticated
with check (public.is_project_member(project_id));

create policy "nova_threads_update_if_member"
on public.nova_threads
for update
to authenticated
using (public.is_project_member(project_id))
with check (public.is_project_member(project_id));

create table if not exists public.nova_messages (
  id uuid primary key default gen_random_uuid(),
  project_id text not null references public.projects(id) on delete cascade,
  thread_id uuid not null references public.nova_threads(id) on delete cascade,
  role text not null check (role in ('system','user','assistant','nova')),
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists nova_messages_thread_idx on public.nova_messages(thread_id);
create index if not exists nova_messages_project_idx on public.nova_messages(project_id);

alter table public.nova_messages enable row level security;

create policy "nova_messages_select_if_member"
on public.nova_messages
for select
to authenticated
using (public.is_project_member(project_id));

create policy "nova_messages_insert_if_member"
on public.nova_messages
for insert
to authenticated
with check (public.is_project_member(project_id));

-- -------------------------
-- LLM usage
-- -------------------------
create table if not exists public.llm_usage (
  id uuid primary key default gen_random_uuid(),
  project_id text not null references public.projects(id) on delete cascade,
  provider text not null,
  model text,
  tokens_in int,
  tokens_out int,
  cost_usd numeric,
  meta jsonb,
  created_at timestamptz not null default now()
);

create index if not exists llm_usage_project_idx on public.llm_usage(project_id);

alter table public.llm_usage enable row level security;

create policy "llm_usage_select_if_member"
on public.llm_usage
for select
to authenticated
using (public.is_project_member(project_id));

create policy "llm_usage_insert_admin"
on public.llm_usage
for insert
to authenticated
with check (public.is_project_admin(project_id));

-- -------------------------
-- Supply
-- -------------------------
create table if not exists public.supply_products (
  id uuid primary key default gen_random_uuid(),
  project_id text not null references public.projects(id) on delete cascade,
  sku text,
  name text not null,
  description text,
  price_cents integer not null default 0 check (price_cents >= 0),
  cost_cents integer not null default 0 check (cost_cents >= 0),
  currency text not null default 'MXN',
  stock integer not null default 0,
  active boolean not null default true,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists supply_products_project_idx on public.supply_products(project_id);
create index if not exists supply_products_name_idx on public.supply_products(project_id, name);

drop trigger if exists supply_products_set_updated_at on public.supply_products;
create trigger supply_products_set_updated_at
before update on public.supply_products
for each row execute function public.tg_set_updated_at();

alter table public.supply_products enable row level security;

create policy "supply_products_select_member"
on public.supply_products
for select
to authenticated
using (public.is_project_member(project_id));

create policy "supply_products_insert_admin"
on public.supply_products
for insert
to authenticated
with check (public.is_project_admin(project_id));

create policy "supply_products_update_admin"
on public.supply_products
for update
to authenticated
using (public.is_project_admin(project_id))
with check (public.is_project_admin(project_id));

create table if not exists public.supply_orders (
  id uuid primary key default gen_random_uuid(),
  project_id text not null references public.projects(id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending','paid','producing','shipped','delivered','canceled','cancelled')),
  customer_name text,
  customer_phone text,
  total_cents integer not null default 0 check (total_cents >= 0),
  currency text not null default 'MXN',
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists supply_orders_project_idx on public.supply_orders(project_id);
create index if not exists supply_orders_created_idx on public.supply_orders(project_id, created_at desc);

drop trigger if exists supply_orders_set_updated_at on public.supply_orders;
create trigger supply_orders_set_updated_at
before update on public.supply_orders
for each row execute function public.tg_set_updated_at();

alter table public.supply_orders enable row level security;

create policy "supply_orders_select_member"
on public.supply_orders
for select
to authenticated
using (public.is_project_member(project_id));

create policy "supply_orders_insert_operator"
on public.supply_orders
for insert
to authenticated
with check (public.is_project_operator(project_id));

create policy "supply_orders_update_operator"
on public.supply_orders
for update
to authenticated
using (public.is_project_operator(project_id))
with check (public.is_project_operator(project_id));

create table if not exists public.supply_order_items (
  id uuid primary key default gen_random_uuid(),
  project_id text not null references public.projects(id) on delete cascade,
  order_id uuid not null references public.supply_orders(id) on delete cascade,
  product_id uuid references public.supply_products(id) on delete set null,
  qty integer not null check (qty > 0),
  unit_price_cents integer not null default 0 check (unit_price_cents >= 0),
  line_total_cents integer not null default 0 check (line_total_cents >= 0),
  currency text not null default 'MXN',
  created_at timestamptz not null default now()
);

create index if not exists supply_order_items_order_idx on public.supply_order_items(order_id);
create index if not exists supply_order_items_project_idx on public.supply_order_items(project_id);

alter table public.supply_order_items enable row level security;

create policy "supply_order_items_select_member"
on public.supply_order_items
for select
to authenticated
using (public.is_project_member(project_id));

create policy "supply_order_items_insert_operator"
on public.supply_order_items
for insert
to authenticated
with check (public.is_project_operator(project_id));

create policy "supply_order_items_update_operator"
on public.supply_order_items
for update
to authenticated
using (public.is_project_operator(project_id))
with check (public.is_project_operator(project_id));

create policy "supply_order_items_delete_operator"
on public.supply_order_items
for delete
to authenticated
using (public.is_project_operator(project_id));

create or replace function public.supply_create_order(
  p_project_id text,
  p_status text,
  p_customer_name text,
  p_customer_phone text,
  p_currency text,
  p_items jsonb,
  p_meta jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role_ok boolean;
  v_order_id uuid;
  v_total integer := 0;
  v_item jsonb;
  v_product_price integer;
  v_unit integer;
  v_qty integer;
  v_line integer;
  v_status text;
  v_currency text;
begin
  if auth.role() = 'service_role' then
    v_role_ok := true;
  else
    select public.is_project_operator(p_project_id) into v_role_ok;
  end if;

  if not v_role_ok then
    raise exception 'Permisos insuficientes.';
  end if;

  v_status := coalesce(nullif(trim(p_status), ''), 'pending');
  v_currency := upper(coalesce(nullif(trim(p_currency), ''), 'MXN'));

  if v_status not in ('pending','paid','producing','shipped','delivered','canceled','cancelled') then
    raise exception 'status inválido.';
  end if;

  if jsonb_typeof(p_items) <> 'array' then
    raise exception 'items debe ser array JSON.';
  end if;

  insert into public.supply_orders(project_id, status, customer_name, customer_phone, total_cents, currency, meta)
  values (
    p_project_id,
    v_status,
    nullif(trim(p_customer_name), ''),
    nullif(trim(p_customer_phone), ''),
    0,
    v_currency,
    coalesce(p_meta, '{}'::jsonb)
  )
  returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_qty := coalesce((v_item->>'qty')::int, 0);
    if v_qty < 1 then
      raise exception 'Cada item requiere qty >= 1.';
    end if;

    if (v_item ? 'unit_price_cents') and nullif(v_item->>'unit_price_cents','') is not null then
      v_unit := greatest(0, (v_item->>'unit_price_cents')::int);
    else
      v_unit := null;
    end if;

    if v_unit is null then
      if (v_item ? 'product_id') and nullif(v_item->>'product_id','') is not null then
        select p.price_cents
        into v_product_price
        from public.supply_products p
        where p.project_id = p_project_id
          and p.id = (v_item->>'product_id')::uuid;

        v_unit := coalesce(v_product_price, 0);
      else
        v_unit := 0;
      end if;
    end if;

    v_line := v_qty * v_unit;
    v_total := v_total + v_line;

    insert into public.supply_order_items(project_id, order_id, product_id, qty, unit_price_cents, line_total_cents, currency)
    values (
      p_project_id,
      v_order_id,
      case
        when (v_item ? 'product_id') and nullif(v_item->>'product_id','') is not null
        then (v_item->>'product_id')::uuid
        else null
      end,
      v_qty,
      v_unit,
      v_line,
      v_currency
    );
  end loop;

  update public.supply_orders
  set total_cents = v_total
  where id = v_order_id;

  return jsonb_build_object(
    'order', (select to_jsonb(o) from public.supply_orders o where o.id = v_order_id),
    'items', (select coalesce(jsonb_agg(to_jsonb(i)), '[]'::jsonb) from public.supply_order_items i where i.order_id = v_order_id)
  );
end;
$$;

grant execute on function public.supply_create_order(text, text, text, text, text, jsonb, jsonb) to authenticated;

-- -------------------------
-- Auth trigger
-- -------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base_role text;
  has_profiles boolean;
begin
  select exists(select 1 from public.profiles) into has_profiles;
  base_role := case when has_profiles then 'operator' else 'owner' end;

  insert into public.profiles (id, email, role)
  values (new.id, new.email, base_role)
  on conflict (id) do update set email = excluded.email;

  insert into public.projects (id, name, meta)
  values ('global', 'Global', '{}'::jsonb)
  on conflict (id) do nothing;

  insert into public.project_members (project_id, user_id, role)
  values ('global', new.id, base_role)
  on conflict (project_id, user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Seeds mínimos
insert into public.projects (id, name, meta)
values ('global', 'Global', '{}'::jsonb)
on conflict (id) do nothing;

insert into public.system_controls (project_id, id, kill_switch, allow_write, meta)
values ('global', 'global', false, false, '{}'::jsonb)
on conflict (project_id, id) do nothing;

commit;