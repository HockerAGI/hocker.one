import { createClient } from "@supabase/supabase-js";

/**
 * createBrowserSupabase: Enlace estándar para la interfaz de usuario.
 */
export function createBrowserSupabase() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
  const anon = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim();

  // 🔥 CLAVE: evitar ejecución en SSR/build
  if (typeof window === "undefined") {
    return null as any;
  }

  if (!url || !anon) {
    console.warn("[NOVA] Supabase no configurado en cliente.");
    return null as any;
  }

  return createClient(url, anon, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
}
