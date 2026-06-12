import { createBrowserClient } from "@supabase/ssr";

type BrowserSupabaseClient = ReturnType<typeof createBrowserClient>;

let supabaseClientInstance: BrowserSupabaseClient | null = null;
let missingClientInstance: BrowserSupabaseClient | null = null;

function createMissingClient(): BrowserSupabaseClient {
  if (missingClientInstance) return missingClientInstance;

  missingClientInstance = new Proxy(
    {},
    {
      get() {
        throw new Error(
          "Supabase no está configurado en el cliente. Revisa NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY.",
        );
      },
    },
  ) as BrowserSupabaseClient;

  return missingClientInstance;
}

export function hasBrowserSupabaseEnv(): boolean {
  const url = String(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
  const anonKey = String(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim();
  return Boolean(url && anonKey);
}

export function createBrowserSupabase(): BrowserSupabaseClient {
  if (supabaseClientInstance) {
    return supabaseClientInstance;
  }

  const url = String(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
  const anonKey = String(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim();

  if (!url || !anonKey) {
    return createMissingClient();
  }

  supabaseClientInstance = createBrowserClient(url, anonKey);
  return supabaseClientInstance;
}

