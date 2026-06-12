# Supabase Remote Baseline Notes - Hocker ONE

Project ref: yvuibbcuntqpyqiuqggd

Current state:
- Remote database has real schema, policies, functions and production-like data.
- Remote database does not currently have Supabase CLI migration history registered.
- Detected: NO_SCHEMA_SUPABASE_MIGRATIONS.

Critical rule:
- Do not run npx supabase db push --linked yet.
- Do not run npx supabase migration repair yet.
- Do not run npx supabase db reset.

Manual hotfix applied:
- Recorded file: supabase/manual-patches/20260508_remote_security_hotfix.sql
- agent_logs: RLS true, service_role only.
- supply_order_items: RLS true, service_role only.
- Sensitive backend/admin functions: anon/authenticated false, service_role true.

Hocker ONE endpoint validation:
- /api/system/security-hardening -> ready.
- /api/system/tenant-rls -> ready.
- /api/system/security-readiness -> blocked without owner/internal key, expected.

Next phase:
- Create safe Supabase baseline/adoption plan before enabling normal CLI migrations.
