import { createBrowserClient } from "@supabase/ssr";

// PATRÓN SINGLETON: Previene la saturación de WebSockets y fugas de RAM en el cliente
let supabaseClientInstance: ReturnType<typeof createBrowserClient> | null = null;

export function createBrowserSupabase() {
  if (supabaseClientInstance) {
    return supabaseClientInstance;
  }

  const url = String(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
  const anonKey = String(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim();

  if (!url || !anonKey) {
    console.warn("[NOVA] Advertencia de Entorno: Variables de Supabase no detectadas en el cliente.");
  }

  // Se crea y se sella la conexión para uso continuo en toda la aplicación
  supabaseClientInstance = createBrowserClient(url, anonKey);
  
  return supabaseClientInstance;
}