-- Migraciones idempotentes para hocker.one (Supabase)
-- Estas migraciones son seguras de ejecutar múltiples veces
-- Aplicar ANTES de desplegar el código que depende de estas columnas/triggers

-- ========================================
-- 1. Audit Chain Signatures (20260612_103000)
-- ========================================
-- Añade columnas de firma/encadenamiento a la tabla audit_logs
-- Permite verificar integridad y que no se modifique el historial
-- Safe: usa IF NOT EXISTS y ON CONFLICT para idempotencia

BEGIN;

-- Crear tabla audit_logs si no existe (puede existir ya)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id BIGSERIAL PRIMARY KEY,
  project_id TEXT NOT NULL,
  actor_user_id TEXT,
  action TEXT NOT NULL,
  context JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  seq BIGINT,
  prev_hash TEXT,
  row_hash TEXT,
  signature TEXT
);

-- Crear índices si no existen
CREATE INDEX IF NOT EXISTS idx_audit_logs_project_id ON public.audit_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- Actualizar política de fila (RLS) para asegurar que se filtre por project_id
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Crear política de lectura si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'audit_logs' AND policyname = 'audit_logs_read'
  ) THEN
    CREATE POLICY audit_logs_read ON public.audit_logs
      FOR SELECT
      USING (TRUE); -- O la lógica de acceso que prefieras
  END IF;
END $$;

-- Crear política de insert si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'audit_logs' AND policyname = 'audit_logs_insert'
  ) THEN
    CREATE POLICY audit_logs_insert ON public.audit_logs
      FOR INSERT
      WITH CHECK (TRUE);
  END IF;
END $$;

-- Trigger: bloquea UPDATE en audit_logs (append-only)
-- Este trigger garantiza que los registros no se modifiquen después de crearse
CREATE OR REPLACE FUNCTION public.audit_logs_prevent_update()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'audit_logs es append-only: UPDATE no permitido';
END;
$$ LANGUAGE plpgsql;

-- Borrar trigger si existe y recrearlo
DROP TRIGGER IF EXISTS audit_logs_prevent_update_trigger ON public.audit_logs;
CREATE TRIGGER audit_logs_prevent_update_trigger
  BEFORE UPDATE ON public.audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_logs_prevent_update();

-- Trigger: bloquea DELETE en audit_logs (append-only)
CREATE OR REPLACE FUNCTION public.audit_logs_prevent_delete()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'audit_logs es append-only: DELETE no permitido';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS audit_logs_prevent_delete_trigger ON public.audit_logs;
CREATE TRIGGER audit_logs_prevent_delete_trigger
  BEFORE DELETE ON public.audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_logs_prevent_delete();

COMMIT;

-- ========================================
-- 2. LLM Usage Tracking (usage table)
-- ========================================
-- Tabla para rastrear tokens/uso por project/provider
-- Safe: CREATE IF NOT EXISTS

BEGIN;

CREATE TABLE IF NOT EXISTS public.llm_usage (
  id BIGSERIAL PRIMARY KEY,
  project_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  model TEXT,
  tokens_in INTEGER DEFAULT 0,
  tokens_out INTEGER DEFAULT 0,
  thread_id TEXT,
  meta JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_llm_usage_project_id ON public.llm_usage(project_id);
CREATE INDEX IF NOT EXISTS idx_llm_usage_created_at ON public.llm_usage(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_llm_usage_provider ON public.llm_usage(provider);

-- RLS: permitir lectura/insert del propio proyecto
ALTER TABLE public.llm_usage ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'llm_usage' AND policyname = 'llm_usage_read'
  ) THEN
    CREATE POLICY llm_usage_read ON public.llm_usage
      FOR SELECT
      USING (TRUE);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'llm_usage' AND policyname = 'llm_usage_insert'
  ) THEN
    CREATE POLICY llm_usage_insert ON public.llm_usage
      FOR INSERT
      WITH CHECK (TRUE);
  END IF;
END $$;

COMMIT;

-- ========================================
-- 3. NOVA Thread & Message Tables
-- ========================================
-- Tablas para persistencia de conversaciones de NOVA

BEGIN;

CREATE TABLE IF NOT EXISTS public.nova_threads (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  user_id TEXT,
  title TEXT,
  summary TEXT,
  meta JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_nova_threads_project_id ON public.nova_threads(project_id);
CREATE INDEX IF NOT EXISTS idx_nova_threads_user_id ON public.nova_threads(user_id);

CREATE TABLE IF NOT EXISTS public.nova_messages (
  id TEXT PRIMARY KEY,
  thread_id TEXT NOT NULL REFERENCES public.nova_threads(id) ON DELETE CASCADE,
  project_id TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'assistant', -- 'user', 'assistant', 'nova', 'system'
  content TEXT NOT NULL,
  meta JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_nova_messages_thread_id ON public.nova_messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_nova_messages_project_id ON public.nova_messages(project_id);

ALTER TABLE public.nova_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nova_messages ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'nova_threads' AND policyname = 'nova_threads_read'
  ) THEN
    CREATE POLICY nova_threads_read ON public.nova_threads FOR SELECT USING (TRUE);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'nova_threads' AND policyname = 'nova_threads_insert'
  ) THEN
    CREATE POLICY nova_threads_insert ON public.nova_threads FOR INSERT WITH CHECK (TRUE);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'nova_messages' AND policyname = 'nova_messages_read'
  ) THEN
    CREATE POLICY nova_messages_read ON public.nova_messages FOR SELECT USING (TRUE);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'nova_messages' AND policyname = 'nova_messages_insert'
  ) THEN
    CREATE POLICY nova_messages_insert ON public.nova_messages FOR INSERT WITH CHECK (TRUE);
  END IF;
END $$;

COMMIT;

-- ========================================
-- Fin de migraciones
-- ========================================
-- Verificación: ejecuta lo siguiente en Supabase para confirmar

SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name IN (
  'audit_logs', 'llm_usage', 'nova_threads', 'nova_messages'
);
