begin;

alter table public.owner_gate_approvals
  drop constraint if exists owner_gate_approvals_accepted_header_check;

alter table public.owner_gate_approvals
  add constraint owner_gate_approvals_accepted_header_check
  check (accepted_header in (
    'x-hocker-owner-key',
    'x-hocker-internal-key',
    'authorization',
    'supabase-session-aal2'
  ));

commit;
