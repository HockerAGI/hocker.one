import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * HOCKER ONE — SUPABASE BROWSER CLIENT (CORE EDITION)
 * Nivel: PRODUCCIÓN + REALTIME + NOVA READY
 */

let browserClient: SupabaseClient | null = null;

function validateEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url || !anon) {
    throw new Error(
      "❌ Supabase no configurado correctamente (NEXT_PUBLIC vars faltantes)"
    );
  }

  return { url, anon };
}

function createSupabaseInstance(): SupabaseClient {
  const { url, anon } = validateEnv();

  const client = createClient(url, anon, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: "hocker-one-auth",
    },
    global: {
      headers: {
        "x-client-info": "hocker-one-web",
      },
    },
  });

  // ============================
  // DEBUG CONTROL (DEV ONLY)
  // ============================
  if (process.env.NODE_ENV === "development") {
    console.log("🧠 Supabase Browser Client inicializado");
  }

  // ============================
  // ERROR WATCHER
  // ============================
  client.auth.onAuthStateChange((event, session) => {
    if (process.env.NODE_ENV === "development") {
      console.log("🔐 Auth event:", event);
    }

    if (event === "SIGNED_OUT") {
      console.warn("⚠️ Sesión cerrada en Supabase");
    }

    if (!session) {
      console.warn("⚠️ No hay sesión activa");
    }
  });

  return client;
}

/**
 * Singleton seguro (evita múltiples GoTrueClient)
 */
export function getSupabaseBrowser(): SupabaseClient {
  if (!browserClient) {
    browserClient = createSupabaseInstance();
  }
  return browserClient;
}

/**
 * Alias legacy (compatibilidad con tu código actual)
 */
export function createBrowserSupabase(): SupabaseClient {
  return getSupabaseBrowser();
}
