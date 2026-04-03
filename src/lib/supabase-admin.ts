import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente administrativo del servidor.
 * Solo debe usarse en rutas server-side, jobs, crons y workers.
 */
let adminClient: SupabaseClient | null = null;

export function createAdminSupabase(): SupabaseClient {
  if (adminClient) return adminClient;

  const url = (
    process.env.SUPABASE_URL ??
    process.env.NEXT_PUBLIC_SUPABASE_URL ??
    ""
  ).trim();

  const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();

  if (!url) {
    throw new Error("SUPABASE_URL no está configurado.");
  }

  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY no está configurado.");
  }

  adminClient = createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return adminClient;
}