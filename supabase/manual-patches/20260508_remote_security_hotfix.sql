-- HOCKER ONE / CHIDO :: REMOTE SECURITY HOTFIX
-- Applied manually in Supabase SQL Editor on 2026-05-08.
-- DO NOT run with supabase db push until remote baseline is reconciled.

-- Verified remote effects:
-- agent_logs: RLS enabled, anon/authenticated revoked, service_role kept.
-- supply_order_items: RLS enabled, anon/authenticated revoked, service_role kept.
-- Sensitive backend/admin functions: anon/authenticated EXECUTE revoked; service_role preserved.

-- Manual SQL applied in Supabase SQL Editor:
-- revoke all privileges on public.agent_logs from anon, authenticated;
-- revoke all privileges on public.supply_order_items from anon, authenticated;
-- alter table public.agent_logs enable row level security;
-- alter table public.supply_order_items enable row level security;
-- create service_role-only policies for both tables;
-- revoke anon/authenticated EXECUTE from backend/admin SECURITY DEFINER functions.
