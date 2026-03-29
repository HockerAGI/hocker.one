import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  // Ruta de destino por defecto tras asegurar el perímetro
  const next = url.searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createServerSupabase();
    
    // Intercepción y validación estricta de la llave
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (error) {
      // Si la matriz rechaza el código (expirado o manipulado), abortamos el acceso
      console.error("[NOVA Auth] Falla en el protocolo de acceso:", error.message);
      
      // Redirigimos al inicio con una señal de anomalía para que el usuario sepa qué pasó
      return NextResponse.redirect(
        new URL(`/?error=${encodeURIComponent("Llave de acceso expirada o inválida.")}`, url)
      );
    }
  }

  // Si la llave es válida, abrimos las puertas hacia la Sala de Mando
  return NextResponse.redirect(new URL(next, url));
}
