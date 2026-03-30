import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

/**
 * createServerSupabase: El túnel seguro de comunicación entre el servidor y la base de datos.
 * Optimizada para Next.js 15 con persistencia de estado vía Cookies.
 */
export async function createServerSupabase() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
  const anon = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim();

  if (!url || !anon) {
    console.error("[NOVA Server] Error Crítico: Credenciales de Supabase no detectadas en el entorno del servidor.");
    throw new Error("Protocolo de Matriz de Servidor no configurado.");
  }

  // ✅ Integración asíncrona para Next.js 15
  const cookieStore = await cookies();

  return createServerClient(url, anon, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: unknown) {
        try {
          cookieStore.set({ name, value, ...options });
        } catch (e: unknown) {
          // Es normal que falle en Server Components de lectura, lo manejamos en silencio.
        }
      },
      remove(name: string, options: unknown) {
        try {
          cookieStore.set({
            name,
            value: "",
            ...options,
            maxAge: 0,
          });
        } catch (e: unknown) {
          // Silencio administrativo en Server Components.
        }
      },
    },
  });
}
