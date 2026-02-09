import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

/**
 * Server Supabase (Route Handlers / Server Components).
 * Usa cookies() para tomar la sesión del usuario (auth.getUser()).
 */
export function createServerSupabase() {
  const url =
    (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "").trim();
  const anon =
    (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "").trim();

  if (!url) throw new Error("SUPABASE_URL / NEXT_PUBLIC_SUPABASE_URL no está configurado.");
  if (!anon) throw new Error("SUPABASE_ANON_KEY / NEXT_PUBLIC_SUPABASE_ANON_KEY no está configurado.");

  const cookieStore = cookies();

  return createServerClient(url, anon, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: any) {
        try {
          cookieStore.set({ name, value, ...options });
        } catch {
          // En algunos contexts (server components) set puede no estar permitido.
        }
      },
      remove(name: string, options: any) {
        try {
          cookieStore.set({ name, value: "", ...options, maxAge: 0 });
        } catch {
          // ignore
        }
      },
    },
  });
}