import { NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase-admin";
export const runtime = "nodejs";
export async function GET() {
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
    const { error } = await sb.from("nodes").select("id").limit(1);
    if (error) {
      return NextResponse.json(
        {
          status: "degraded",
          infrastructure: "Hocker ONE Control Plane",
          checks: { ...envChecks, db: false },
          error: error.message,
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      );
    }
    return NextResponse.json(
      {
        status: "ok",
        infrastructure: "Hocker ONE Control Plane",
        checks: { ...envChecks, db: true },
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        status: "error",
        infrastructure: "Hocker ONE Control Plane",
        checks: { ...envChecks, db: false },
        error: err?.message ?? "Unexpected error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}