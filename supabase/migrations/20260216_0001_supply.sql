begin;

alter table if exists public.supply_orders
  drop constraint if exists supply_orders_status_check;

alter table if exists public.supply_orders
  add constraint supply_orders_status_check
  check (status in ('pending','paid','producing','shipped','delivered','canceled','cancelled'));

create or replace function public.supply_create_order(
  p_project_id text,
  p_customer_name text,
  p_customer_phone text,
  p_total_cents integer,
  p_currency text default 'MXN',
  p_status text default 'pending',
  p_meta jsonb default '{}'::jsonb
)
returns public.supply_orders
language plpgsql
security definer
as $$
declare
  v_status text := lower(coalesce(p_status, 'pending'));
  v_row public.supply_orders;
begin
  if v_status not in ('pending','paid','producing','shipped','delivered','canceled','cancelled') then
    raise exception 'Estado inválido para supply_create_order: %', v_status;
  end if;

  insert into public.supply_orders (
    project_id,
    status,
    customer_name,
    customer_phone,
    total_cents,
    currency,
    meta
  )
  values (
    p_project_id,
    v_status,
    p_customer_name,
    p_customer_phone,
    greatest(coalesce(p_total_cents, 0), 0),
    upper(coalesce(nullif(trim(p_currency), ''), 'MXN')),
    coalesce(p_meta, '{}'::jsonb)
  )
  returning * into v_row;

  return v_row;
end;
$$;

commit;