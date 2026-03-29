import { createClient } from "@supabase/supabase-js";

/**
 * createBrowserSupabase: Enlace estándar para la interfaz de usuario.
 */
export function createBrowserSupabase() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
  const anon = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim();

  if (!url || !anon) {
    throw new Error("Falla de enlace: Credenciales públicas de Supabase no detectadas.");
  }

  return createClient(url, anon, {
    auth: {
      persistSession: true, // Vital para la experiencia PWA
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
}
