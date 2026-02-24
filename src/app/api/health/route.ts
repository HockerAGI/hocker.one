import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";

export const runtime = "nodejs";

export async function GET() {
  try {
    const sb = createServerSupabase();
    // Verificamos conexión básica a base de datos
    const { error } = await sb.from("nodes").select("id").limit(1);
    
    // Verificamos si las variables de entorno críticas están presentes
    const envStatus = {
      triggerDev: !!process.env.TRIGGER_SECRET_KEY,
      langfuse: !!process.env.LANGFUSE_PUBLIC_KEY,
      novaAgi: !!process.env.NOVA_AGI_URL
    };

    if (error) {
      return NextResponse.json(
        { status: "degraded", error: error.message, env: envStatus },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
        status: "ok", 
        timestamp: new Date().toISOString(),
        infrastructure: "Hocker Automation Fabric Active",
        env: envStatus
    }, { status: 200 });

  } catch (err: any) {
    return NextResponse.json(
      { status: "error", error: err.message },
      { status: 500 }
    );
  }
}