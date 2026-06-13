-- HOCKER ONE — Memory Mirror: idempotencia y deduplicación real (SYNTIA 12.7)
-- Objetivo:
-- Cerrar las carreras de duplicados de la memoria operativa de SYNTIA con
-- índices ÚNICOS parciales, de forma que submit/review sean idempotentes ante
-- envíos concurrentes. Sin esto, dos llamadas simultáneas pueden duplicar el
-- mismo conocimiento.
--
-- Seguridad / alcance:
-- - Solo agrega índices y limpia duplicados existentes. NO borra filas: los
--   duplicados se marcan (archived / active=false), se conserva times_seen y se
--   neutraliza su clave canónica/hash para que salgan del índice único.
-- - No cambia RLS ni políticas. Las APIs siguen usando service_role + owner gate.
-- - Idempotente: usa "if not exists" y se puede re-ejecutar sin romper.
--
-- IMPORTANTE (lo aplica el dueño en Supabase):
-- 1) Ejecutar primero el PREFLIGHT (abajo, comentado) para ver qué duplicados hay.
-- 2) Luego ejecutar este archivo completo.
--
-- ─────────────────────────────────────────────────────────────────────────────
-- PREFLIGHT (solo lectura — descomentar y correr aparte para inspeccionar):
--
-- -- Duplicados vivos en propuestas (mismo project_id + source_hash):
-- select project_id, source_hash, count(*) as n
--   from public.agi_learning_events
--  where source_hash is not null
--    and status in ('pending_review', 'approved')
--  group by project_id, source_hash
-- having count(*) > 1
--  order by n desc;
--
-- -- Duplicados en memoria publicada (mismo project_id + canonical_memory_key):
-- select project_id, canonical_memory_key, count(*) as n
--   from public.agi_memory_mirror
--  where canonical_memory_key is not null
--  group by project_id, canonical_memory_key
-- having count(*) > 1
--  order by n desc;
--
-- -- Duplicados en feed (mismo project_id + agi_id + canonical_memory_key):
-- select project_id, agi_id, canonical_memory_key, count(*) as n
--   from public.agi_update_feed
--  where canonical_memory_key is not null
--  group by project_id, agi_id, canonical_memory_key
-- having count(*) > 1
--  order by n desc;
-- ─────────────────────────────────────────────────────────────────────────────


-- ── 1) Limpieza de duplicados existentes (no destructiva) ────────────────────

-- 1a) agi_learning_events: entre propuestas VIVAS (pending_review/approved) con el
--     mismo (project_id, source_hash), conservar una (approved primero, luego la
--     más reciente) y archivar el resto. Se suma times_seen en la conservada.
--     El índice único excluye 'archived', por lo que archivar ya las saca del índice.
with ranked as (
  select
    id,
    row_number() over (
      partition by project_id, source_hash
      order by (status = 'approved') desc, created_at desc, id desc
    ) as rn,
    sum(coalesce(times_seen, 1)) over (partition by project_id, source_hash) as total_seen,
    max(last_seen_at) over (partition by project_id, source_hash) as max_seen
  from public.agi_learning_events
  where source_hash is not null
    and status in ('pending_review', 'approved')
)
update public.agi_learning_events e
set times_seen = r.total_seen,
    last_seen_at = greatest(e.last_seen_at, r.max_seen)
from ranked r
where e.id = r.id
  and r.rn = 1;

with ranked as (
  select
    id,
    row_number() over (
      partition by project_id, source_hash
      order by (status = 'approved') desc, created_at desc, id desc
    ) as rn
  from public.agi_learning_events
  where source_hash is not null
    and status in ('pending_review', 'approved')
)
update public.agi_learning_events e
set status = 'archived'
from ranked r
where e.id = r.id
  and r.rn > 1;

-- 1b) agi_memory_mirror: entre memorias con el mismo (project_id, canonical_memory_key)
--     conservar una (activa primero, luego la más reciente) sumando times_seen, y en
--     el resto: desactivar + NEUTRALIZAR canonical_memory_key (queda fuera del índice
--     único y deja de romper las lecturas .maybeSingle(); no se borra la fila).
with ranked as (
  select
    id,
    row_number() over (
      partition by project_id, canonical_memory_key
      order by active desc, created_at desc, id desc
    ) as rn,
    sum(coalesce(times_seen, 1)) over (partition by project_id, canonical_memory_key) as total_seen,
    max(last_seen_at) over (partition by project_id, canonical_memory_key) as max_seen
  from public.agi_memory_mirror
  where canonical_memory_key is not null
)
update public.agi_memory_mirror m
set times_seen = r.total_seen,
    last_seen_at = greatest(m.last_seen_at, r.max_seen)
from ranked r
where m.id = r.id
  and r.rn = 1;

with ranked as (
  select
    id,
    row_number() over (
      partition by project_id, canonical_memory_key
      order by active desc, created_at desc, id desc
    ) as rn
  from public.agi_memory_mirror
  where canonical_memory_key is not null
)
update public.agi_memory_mirror m
set active = false,
    canonical_memory_key = null
from ranked r
where m.id = r.id
  and r.rn > 1;

-- 1c) agi_update_feed: entre filas con el mismo (project_id, agi_id, canonical_memory_key)
--     conservar la más reciente sumando times_seen, y en el resto: archivar +
--     NEUTRALIZAR canonical_memory_key (sale del índice único; no se borra la fila).
with ranked as (
  select
    id,
    row_number() over (
      partition by project_id, agi_id, canonical_memory_key
      order by created_at desc, id desc
    ) as rn,
    sum(coalesce(times_seen, 1)) over (partition by project_id, agi_id, canonical_memory_key) as total_seen,
    max(last_seen_at) over (partition by project_id, agi_id, canonical_memory_key) as max_seen
  from public.agi_update_feed
  where canonical_memory_key is not null
)
update public.agi_update_feed f
set times_seen = r.total_seen,
    last_seen_at = greatest(f.last_seen_at, r.max_seen)
from ranked r
where f.id = r.id
  and r.rn = 1;

with ranked as (
  select
    id,
    row_number() over (
      partition by project_id, agi_id, canonical_memory_key
      order by created_at desc, id desc
    ) as rn
  from public.agi_update_feed
  where canonical_memory_key is not null
)
update public.agi_update_feed f
set status = 'archived',
    canonical_memory_key = null
from ranked r
where f.id = r.id
  and r.rn > 1;


-- ── 2) Índices ÚNICOS parciales (idempotencia real) ──────────────────────────

-- Propuestas vivas: una sola por (project_id, source_hash). Permite re-proponer
-- contenido previamente rechazado/archivado (esos quedan fuera del índice).
create unique index if not exists uq_agi_learning_events_live_source_hash
  on public.agi_learning_events (project_id, source_hash)
  where source_hash is not null
    and status in ('pending_review', 'approved');

-- Memoria publicada: una sola por (project_id, canonical_memory_key). Los duplicados
-- viejos quedaron con canonical_memory_key = null (paso 1b), fuera del índice.
create unique index if not exists uq_agi_memory_mirror_project_canonical_key
  on public.agi_memory_mirror (project_id, canonical_memory_key)
  where canonical_memory_key is not null;

-- Feed por AGI: una sola por (project_id, agi_id, canonical_memory_key). Los duplicados
-- viejos quedaron con canonical_memory_key = null (paso 1c), fuera del índice.
create unique index if not exists uq_agi_update_feed_project_agi_canonical_key
  on public.agi_update_feed (project_id, agi_id, canonical_memory_key)
  where canonical_memory_key is not null;
