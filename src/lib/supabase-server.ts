import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

function resolveServerSupabaseEnv(): { url: string; key: string } {
  const url = String(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "",
  ).trim();
  const key = String(
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
      process.env.SUPABASE_PUBLISHABLE_KEY ??
      "",
  ).trim();

  return { url, key };
}

export async function createServerSupabase() {
  const cookieStore = await cookies();
  const { url, key } = resolveServerSupabaseEnv();

  if (!url || !key) {
    throw new Error(
      "Supabase server is not configured. Set NEXT_PUBLIC_SUPABASE_URL/SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY/SUPABASE_PUBLISHABLE_KEY.",
    );
  }

  return createServerClient(url, key, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set(name, value, options);
        } catch {
          // Middleware assumes responsibility for cookie mutation when server components are read-only.
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set(name, "", options);
        } catch {
          // Intentionally ignored for read-only server component contexts.
        }
      },
    },
  });
}
