-- Compatibility cleanup for databases initialized from supabase/schema.sql.
-- The schema-era `nodes_select_if_member` policy has the same read predicate as
-- the canonical `nodes_select_member` policy applied in 20260814103957.
-- Dropping only the legacy SELECT policy prevents duplicate permissive RLS
-- evaluation without changing the current write or service-role policies.

begin;

drop policy if exists "nodes_select_if_member" on public.nodes;

commit;
