import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * PROTOCOLO ADMINISTRATIVO (Service Role)
 * Se utiliza exclusivamente en el servidor para operaciones que ignoran las RLS.
 */
export function createAdminSupabase(): SupabaseClient {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();

  if (!url || !key) {
    console.error("[MATRIZ CRÍTICA] Falla de configuración: Credenciales administrativas ausentes.");
    throw new Error("Protocolo de Administración no configurado en el entorno.");
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
