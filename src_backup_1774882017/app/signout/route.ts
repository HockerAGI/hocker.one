import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { Langfuse } from "langfuse-node";

export const runtime = "nodejs";

// Inicialización de la Caja Negra (Telemetría de Seguridad)
const langfuse = new Langfuse({
  publicKey: process.env.LANGFUSE_PUBLIC_KEY || "dummy",
  secretKey: process.env.LANGFUSE_SECRET_KEY || "dummy",
  baseUrl: process.env.LANGFUSE_BASE_URL || "https://cloud.langfuse.com",
});

export async function POST(req: Request) {
  const trace = langfuse.trace({ name: "Protocolo_Cierre_Sesion", metadata: { endpoint: "/api/auth/signout" } });
  
  try {
    const supabase = await createServerSupabase();
    
    // Obtenemos la identidad antes de destruir la sesión para el registro
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id || "anonimo";
    const userEmail = user?.email || "n/a";

    // Notificamos al Radar de Memoria (Events)
    if (user) {
      await supabase.from("events").insert({
        project_id: "global",
        node_id: "hocker-fabric",
        level: "info",
        type: "auth.signout",
        message: `Sesión finalizada: El usuario ${userEmail} ha abandonado el puente.`,
        data: { user_id: userId, email: userEmail }
      });
    }

    // Ejecutamos el cierre de sesión en la matriz de Supabase
    await supabase.auth.signOut();

    trace.event({ name: "CIERRE_EXITOSO", input: { userId } });
    trace.event({ name: "OPERACION_EXITOSA" });

    // Redirección al origen (Login) limpiando el rastro
    return NextResponse.redirect(new URL("/", req.url), {
      status: 302,
    });

  } catch (e: unknown) {
    console.error("[NOVA Auth] Error durante el cierre de sesión:", getErrorMessage(e));
    trace.event({ name: "ERROR_SIGNOUT", level: "ERROR", output: { error: getErrorMessage(e) } });
    
    // Aun con error, forzamos la salida hacia el inicio
    return NextResponse.redirect(new URL("/", req.url), { status: 302 });
  } finally {
    await langfuse.flushAsync();
  }
}
