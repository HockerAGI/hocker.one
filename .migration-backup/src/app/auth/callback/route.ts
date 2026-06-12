import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createServerSupabase();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Intercambio exitoso, acceso concedido al ecosistema
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Si la llave expira o es interceptada, cerramos la puerta limpiamente
  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}