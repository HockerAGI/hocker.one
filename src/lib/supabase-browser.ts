import { createClient } from "@supabase/supabase-js";

export function createBrowserSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  if (!url || !anon) {
    // En dev te conviene verlo de inmediato
    console.warn("Missing Supabase env vars. Fill NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }
  return createClient(url, anon);
}