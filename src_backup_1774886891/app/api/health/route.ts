import { getErrorMessage } from "@/lib/errors";
import { NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase-admin";

export const runtime = "nodejs";

// Obligamos al sistema a no usar memoria caché. Queremos el pulso en tiempo real.
export const dynamic = "force-dynamic";

export async function GET() {
  // Diagnóstico de Sensores Vitales (Variables de Entorno)
  const envChecks = {
    supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseAnon: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    novaAgi: !!process.env.NOVA_AGI_URL,
    novaKey: !!process.env.NOVA_ORCHESTRATOR_KEY,
    commandHmac: !!process.env.COMMAND_HMAC_SECRET,
    langfuse: !!process.env.LANGFUSE_PUBLIC_KEY && !!process.env.LANGFUSE_SECRET_KEY,
  };

  try {
    const sb = createAdminSupabase();
    
    // Ping al Nervio Central (Base de Datos)
    const { error } = await sb.from("nodes").select("id").limit(1);

    if (error) {
      console.error("[NOVA System] Anomalía crítica: Falla de enlace con la Matriz de Datos.", getErrorMessage(error));
      return NextResponse.json(
        {
          status: "degraded",
          infrastructure: "Hocker ONE Automation Fabric",
          checks: { ...envChecks, db: false },
          error: "Pérdida de conexión con el núcleo de datos.",
          details: getErrorMessage(error),
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      );
    }

    // Si todo responde, reportamos luz verde
    return NextResponse.json(
      {
        status: "online",
        infrastructure: "Hocker ONE Automation Fabric",
        checks: { ...envChecks, db: true },
        message: "Todos los sistemas operando bajo parámetros nominales.",
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
    
  } catch (err: unknown) {
    console.error("[NOVA System] Colapso en el protocolo de diagnóstico:", err);
    return NextResponse.json(
      {
        status: "critical",
        infrastructure: "Hocker ONE Automation Fabric",
        checks: { ...envChecks, db: false },
        error: "Colapso del protocolo de diagnóstico interno.",
        details: err ? getErrorMessage(err) || "Anomalía no identificada.",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
