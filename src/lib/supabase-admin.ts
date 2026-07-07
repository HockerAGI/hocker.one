import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const GLOBAL_KEY = "__hocker_supabase_admin" as const;

type AdminGlobal = {
  client: SupabaseClient | null;
};

function getAdminGlobal(): AdminGlobal {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const g = globalThis as any;
  if (!g[GLOBAL_KEY]) {
    g[GLOBAL_KEY] = { client: null };
  }
  return g[GLOBAL_KEY] as AdminGlobal;
}

export function createAdminSupabase(): SupabaseClient {
  const holder = getAdminGlobal();
  if (holder.client) return holder.client;

  const url = (
    process.env.SUPABASE_URL ??
    process.env.NEXT_PUBLIC_SUPABASE_URL ??
    ""
  ).trim();

  const serviceRoleKey = (
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.SUPABASE_SECRET_KEY ??
    ""
  ).trim();

  if (!url) {
    throw new Error("SUPABASE_URL no está configurado.");
  }

  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY o SUPABASE_SECRET_KEY no está configurado.");
  }

  holder.client = createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return holder.client;
}

/**
 * Resets the cached admin client so the next call to `createAdminSupabase()`
 * creates a fresh instance. Essential during Next.js hot-reload in dev,
 * where module-level `let` variables survive across HMR cycles but env vars
 * may have changed, or the previous client may reference a stale connection.
 */
export function _resetAdminForHotReload(): void {
  const g = globalThis as Record<string, unknown>;
  delete g[GLOBAL_KEY];
}
