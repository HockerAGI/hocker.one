-- Cerrojo universal RLS para tablas existentes del esquema public
DO $$
DECLARE
    row record;
BEGIN
    FOR row IN
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', row.tablename);
    END LOOP;
END;
$$;

-- Revocar EXECUTE en funciones RPC existentes del esquema public
DO $$
DECLARE
    row record;
BEGIN
    FOR row IN
        SELECT p.oid::regprocedure AS proc
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public'
    LOOP
        EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC;', row.proc);
        EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM anon;', row.proc);
        EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM authenticated;', row.proc);
    END LOOP;
END;
$$;

-- Revocar privilegios por defecto para futuras funciones en public
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM authenticated;
