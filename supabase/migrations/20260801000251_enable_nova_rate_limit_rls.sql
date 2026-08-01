alter table private.nova_rate_limit_buckets enable row level security;
revoke all on table private.nova_rate_limit_buckets from public, anon, authenticated;
grant select, insert, update, delete on table private.nova_rate_limit_buckets to service_role;
comment on table private.nova_rate_limit_buckets is 'Private NOVA distributed rate-limit state. RLS enabled; direct client access denied; service-only RPC usage.';
