import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;

export function createBrowserSupabase(): SupabaseClient {
  if (_client) return _client;

  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
  const anon = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim();

  if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL no está configurado.");
  if (!anon) throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY no está configurado.");

  _client = createClient(url, anon, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });

  return _client;
}