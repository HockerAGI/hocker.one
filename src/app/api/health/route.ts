import { getErrorMessage } from "@/lib/errors";
import { NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  // Escaneo de Sensores Críticos (Variables de Entorno)
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
    
    // Test de Latido en la Matriz de Datos
    const { error } = await sb.from("nodes").select("id").limit(1);

    if (error) {
      console.error("[NOVA System] Anomalía crítica en enlace de datos:", getErrorMessage(error));
      return NextResponse.json(
        {
          status: "degraded",
          infrastructure: "Hocker ONE Automation Fabric",
          checks: { ...envChecks, db: false },
          error: "Pérdida de sincronía con el núcleo de datos.",
          details: getErrorMessage(error),
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        status: "online",
        infrastructure: "Hocker ONE Automation Fabric",
        checks: { ...envChecks, db: true },
        message: "Sistemas operativos bajo parámetros nominales.",
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
    
  } catch (err: unknown) {
    const errorMsg = getErrorMessage(err);
    console.error("[NOVA System] Colapso en protocolo de diagnóstico:", errorMsg);
    return NextResponse.json(
      {
        status: "critical",
        infrastructure: "Hocker ONE Automation Fabric",
        checks: { ...envChecks, db: false },
        error: "Falla catastrófica en el diagnóstico interno.",
        details: errorMsg,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
