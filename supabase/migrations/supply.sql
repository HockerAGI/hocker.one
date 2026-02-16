-- ============================================
-- HOCKER.ONE — Supply (productos + órdenes)
-- ============================================

-- updated_at helper
create or replace function public.tg_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Rol operativo (owner/admin/operator)
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

-- =========================
-- Supply: products
-- =========================

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

alter table public.supply_products enable row level security;

drop policy if exists "supply_products_select_member" on public.supply_products;
create policy "supply_products_select_member"
on public.supply_products
for select
to authenticated
using (public.is_project_member(project_id));

drop policy if exists "supply_products_insert_admin" on public.supply_products;
create policy "supply_products_insert_admin"
on public.supply_products
for insert
to authenticated
with check (public.is_project_admin(project_id));

drop policy if exists "supply_products_update_admin" on public.supply_products;
create policy "supply_products_update_admin"
on public.supply_products
for update
to authenticated
using (public.is_project_admin(project_id))
with check (public.is_project_admin(project_id));

-- updated_at trigger
drop trigger if exists supply_products_set_updated_at on public.supply_products;
create trigger supply_products_set_updated_at
before update on public.supply_products
for each row execute function public.tg_set_updated_at();

-- =========================
-- Supply: orders
-- =========================

create table if not exists public.supply_orders (
  id uuid primary key default gen_random_uuid(),
  project_id text not null references public.projects(id) on delete cascade,

  status text not null default 'pending' check (status in ('pending','paid','producing','shipped','delivered','cancelled')),

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

alter table public.supply_orders enable row level security;

drop policy if exists "supply_orders_select_member" on public.supply_orders;
create policy "supply_orders_select_member"
on public.supply_orders
for select
to authenticated
using (public.is_project_member(project_id));

drop policy if exists "supply_orders_insert_operator" on public.supply_orders;
create policy "supply_orders_insert_operator"
on public.supply_orders
for insert
to authenticated
with check (public.is_project_operator(project_id));

drop policy if exists "supply_orders_update_operator" on public.supply_orders;
create policy "supply_orders_update_operator"
on public.supply_orders
for update
to authenticated
using (public.is_project_operator(project_id))
with check (public.is_project_operator(project_id));

drop trigger if exists supply_orders_set_updated_at on public.supply_orders;
create trigger supply_orders_set_updated_at
before update on public.supply_orders
for each row execute function public.tg_set_updated_at();

-- =========================
-- Supply: order items
-- =========================

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

drop policy if exists "supply_order_items_select_member" on public.supply_order_items;
create policy "supply_order_items_select_member"
on public.supply_order_items
for select
to authenticated
using (public.is_project_member(project_id));

drop policy if exists "supply_order_items_insert_operator" on public.supply_order_items;
create policy "supply_order_items_insert_operator"
on public.supply_order_items
for insert
to authenticated
with check (public.is_project_operator(project_id));

drop policy if exists "supply_order_items_update_operator" on public.supply_order_items;
create policy "supply_order_items_update_operator"
on public.supply_order_items
for update
to authenticated
using (public.is_project_operator(project_id))
with check (public.is_project_operator(project_id));

drop policy if exists "supply_order_items_delete_operator" on public.supply_order_items;
create policy "supply_order_items_delete_operator"
on public.supply_order_items
for delete
to authenticated
using (public.is_project_operator(project_id));

-- =========================
-- RPC: Atomic create order
-- =========================

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
  -- Permisos
  select public.is_project_operator(p_project_id) into v_role_ok;
  if not v_role_ok then
    raise exception 'Permisos insuficientes.';
  end if;

  v_status := coalesce(nullif(trim(p_status), ''), 'pending');
  v_currency := upper(coalesce(nullif(trim(p_currency), ''), 'MXN'));

  if v_status not in ('pending','paid','producing','shipped','delivered','cancelled') then
    raise exception 'status inválido.';
  end if;

  if jsonb_typeof(p_items) <> 'array' then
    raise exception 'items debe ser array JSON.';
  end if;

  -- Crear orden
  insert into public.supply_orders(project_id, status, customer_name, customer_phone, total_cents, currency, meta)
  values (p_project_id, v_status, nullif(trim(p_customer_name), ''), nullif(trim(p_customer_phone), ''), 0, v_currency, coalesce(p_meta, '{}'::jsonb))
  returning id into v_order_id;

  -- Insertar items
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_qty := coalesce((v_item->>'qty')::int, 0);
    if v_qty < 1 then
      raise exception 'Cada item requiere qty >= 1.';
    end if;

    -- Precio unitario
    if (v_item ? 'unit_price_cents') and nullif(v_item->>'unit_price_cents','') is not null then
      v_unit := greatest(0, (v_item->>'unit_price_cents')::int);
    else
      v_unit := null;
    end if;

    if v_unit is null then
      -- Si hay producto, usamos precio del producto
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
      case when (v_item ? 'product_id') and nullif(v_item->>'product_id','') is not null then (v_item->>'product_id')::uuid else null end,
      v_qty,
      v_unit,
      v_line,
      v_currency
    );
  end loop;

  -- Total final
  update public.supply_orders
  set total_cents = v_total
  where id = v_order_id;

  -- Retorno
  return jsonb_build_object(
    'order', (select to_jsonb(o) from public.supply_orders o where o.id = v_order_id),
    'items', (select coalesce(jsonb_agg(to_jsonb(i)), '[]'::jsonb) from public.supply_order_items i where i.order_id = v_order_id)
  );
end;
$$;

-- Permitir uso del RPC a authenticated (el control real lo hace la función)
grant execute on function public.supply_create_order(text, text, text, text, text, jsonb, jsonb) to authenticated;
