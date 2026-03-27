import { createClient } from "@supabase/supabase-js";

export function createBrowserSupabase() {
  const url =
    (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "").trim();
  const anon =
    (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "").trim();

  if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL no está configurado.");
  if (!anon) throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY no está configurado.");

  return createClient(url, anon, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
}