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
          "Supabase no está configurado en el cliente. Revisa NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY o SUPABASE_PUBLISHABLE_KEY.",
        );
      },
    },
  ) as BrowserSupabaseClient;

  return missingClientInstance;
}

function resolveBrowserSupabaseEnv(): { url: string; key: string } {
  const url = String(process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "").trim();
  const key = String(
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
      process.env.SUPABASE_PUBLISHABLE_KEY ??
      "",
  ).trim();

  return { url, key };
}

export function hasBrowserSupabaseEnv(): boolean {
  const { url, key } = resolveBrowserSupabaseEnv();
  return Boolean(url && key);
}

export function createBrowserSupabase(): BrowserSupabaseClient {
  if (supabaseClientInstance) return supabaseClientInstance;

  const { url, key } = resolveBrowserSupabaseEnv();
  if (!url || !key) return createMissingClient();

  supabaseClientInstance = createBrowserClient(url, key);
  return supabaseClientInstance;
}
