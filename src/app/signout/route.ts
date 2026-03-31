import { getErrorMessage } from "@/lib/errors";
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
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      await supabase.from("events").insert({
        project_id: "global",
        node_id: "hocker-fabric",
        level: "info",
        type: "auth.signout",
        message: `Desconexión segura: La identidad ${user.email} ha dejado el puente de mando.`,
        data: { user_id: user.id }
      });
    }

    await supabase.auth.signOut();
    return NextResponse.redirect(new URL("/", req.url), { status: 302 });
  } catch (e: any) {
    // ... (Mantén tu gestión de errores)
  }
}
