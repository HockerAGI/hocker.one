-- HOCKER ONE — Memory Mirror Dedup Propagation
-- Sprint 12.6F.1
-- Objetivo:
-- Permitir que agi_update_feed también registre repeticiones reales
-- sin duplicar conocimiento.

alter table public.agi_update_feed
  add column if not exists times_seen integer not null default 1,
  add column if not exists last_seen_at timestamptz not null default now();

create index if not exists idx_agi_update_feed_source_hash
  on public.agi_update_feed(project_id, source_hash);

create index if not exists idx_agi_update_feed_last_seen
  on public.agi_update_feed(project_id, agi_id, last_seen_at desc);
