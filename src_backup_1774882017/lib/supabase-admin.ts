import { createClient } from "@supabase/supabase-js";

/**
 * createAdminSupabase: El martillo de Thor del ecosistema.
 * Se usa exclusivamente en el servidor para operaciones que ignoran las RLS.
 */
export function createAdminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

  if (!url || !key) {
    console.error("[MATRIZ CRÍTICA] Falla de configuración: Faltan credenciales administrativas (Service Role).");
    throw new Error("Protocolo de Administración no configurado.");
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
