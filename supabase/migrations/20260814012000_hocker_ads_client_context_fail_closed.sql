-- HOCKER ONE / HOCKER ADS — restore fail-closed client context boundary.
--
-- The July security audit classifies these client-context/history tables as
-- service-role-only. A later least-privilege migration re-granted SELECT to
-- authenticated, making the objects discoverable through the authenticated
-- GraphQL schema even though Hocker Ads tenant portal access is not yet an
-- approved or tested contract.
--
-- Keep these tables server-only until a future migration introduces explicit
-- tenant/project membership policies and corresponding authorization tests.

revoke all privileges on table public.client_context_profiles from public, anon, authenticated;
grant select, insert, update, delete on table public.client_context_profiles to service_role;

revoke all privileges on table public.client_brand_context from public, anon, authenticated;
grant select, insert, update, delete on table public.client_brand_context to service_role;

revoke all privileges on table public.client_content_history from public, anon, authenticated;
grant select, insert, update, delete on table public.client_content_history to service_role;

revoke all privileges on table public.client_campaign_history from public, anon, authenticated;
grant select, insert, update, delete on table public.client_campaign_history to service_role;

revoke all privileges on table public.client_comment_insights from public, anon, authenticated;
grant select, insert, update, delete on table public.client_comment_insights to service_role;
