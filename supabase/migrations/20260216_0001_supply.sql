-- Cambia solo estos dos bloques dentro del archivo actual.

-- 1) En la definición de public.supply_orders, reemplaza esto:
--    check (status in ('pending','paid','producing','shipped','delivered','cancelled')),
-- por esto:
check (status in ('pending','paid','producing','shipped','delivered','canceled','cancelled')),

-- 2) Dentro de la RPC public.supply_create_order, reemplaza esto:
--    if v_status not in ('pending','paid','producing','shipped','delivered','cancelled') then
-- por esto:
if v_status not in ('pending','paid','producing','shipped','delivered','canceled','cancelled') then