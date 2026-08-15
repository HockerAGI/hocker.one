import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

function resolveServerSupabaseConfig() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ??
    process.env.SUPABASE_URL ??
    process.env.NEXT_PUBLIC_HockerSupabase_SUPABASE_URL ??
    process.env.HockerSupabase_SUPABASE_URL ??
    "";
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.SUPABASE_PUBLISHABLE_KEY ??
    process.env.SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_HockerSupabase_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_HockerSupabase_SUPABASE_ANON_KEY ??
    process.env.HockerSupabase_SUPABASE_PUBLISHABLE_KEY ??
    process.env.HockerSupabase_SUPABASE_ANON_KEY ??
    "";

  return { supabaseUrl, supabaseKey };
}

export function hasServerSupabaseConfig() {
  const { supabaseUrl, supabaseKey } = resolveServerSupabaseConfig();
  return Boolean(supabaseUrl && supabaseKey);
}

export async function createServerSupabase() {
  const cookieStore = await cookies();
  const { supabaseUrl, supabaseKey } = resolveServerSupabaseConfig();

  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          // Blindaje contra excepciones de solo lectura en Next.js Server Components
          cookieStore.set(name, value, options);
        } catch {
          // Se silencia intencionalmente. El Middleware asume la responsabilidad de la mutación.
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set(name, "", options);
        } catch {
          // Se silencia intencionalmente.
        }
      },
    },
  });
}
