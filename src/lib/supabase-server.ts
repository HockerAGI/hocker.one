import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function createServerSupabase() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          try {
            // Blindaje contra excepciones de solo lectura en Next.js Server Components
            cookieStore.set(name, value, options);
          } catch (error) {
            // Se silencia intencionalmente. El Middleware asume la responsabilidad de la mutación.
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set(name, "", options);
          } catch (error) {
            // Se silencia intencionalmente.
          }
        },
      },
    },
  );
}