alter function public.set_updated_at() set search_path = public, pg_temp;
comment on function public.set_updated_at() is 'Shared updated_at trigger with fixed object resolution path.';
