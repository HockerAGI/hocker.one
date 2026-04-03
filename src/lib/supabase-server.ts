import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

function getSupabaseConfig(): { url: string; anon: string } {
  const url = (
    process.env.SUPABASE_URL ??
    process.env.NEXT_PUBLIC_SUPABASE_URL ??
    ""
  ).trim();

  const anon = (
    process.env.SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    ""
  ).trim();

  if (!url) {
    throw new Error("SUPABASE_URL no está configurado.");
  }

  if (!anon) {
    throw new Error("SUPABASE_ANON_KEY no está configurado.");
  }

  return { url, anon };
}

type CookieStore = Awaited<ReturnType<typeof cookies>>;

function createCookieAdapter(cookieStore: CookieStore) {
  return {
    get(name: string): string | undefined {
      return cookieStore.get(name)?.value;
    },
    set(name: string, value: string, options: CookieOptions): void {
      try {
        cookieStore.set({ name, value, ...options });
      } catch {
        // Server Components pueden ser read-only; aquí no forzamos escritura.
      }
    },
    remove(name: string, options: CookieOptions): void {
      try {
        cookieStore.set({ name, value: "", ...options, maxAge: 0 });
      } catch {
        // Sin ruido en entornos read-only.
      }
    },
  };
}

export async function createServerSupabase(): Promise<SupabaseClient> {
  const { url, anon } = getSupabaseConfig();
  const cookieStore = await cookies();

  return createServerClient(url, anon, {
    cookies: createCookieAdapter(cookieStore),
  });
}