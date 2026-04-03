import { Langfuse } from "langfuse-node";
import { NextResponse } from "next/server";
import { getErrorMessage } from "@/lib/errors";
import { createServerSupabase } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const langfuse = new Langfuse({
  publicKey: process.env.LANGFUSE_PUBLIC_KEY || "dummy",
  secretKey: process.env.LANGFUSE_SECRET_KEY || "dummy",
  baseUrl: process.env.LANGFUSE_BASE_URL || "https://cloud.langfuse.com",
});

export async function POST(req: Request): Promise<NextResponse> {
  const trace = langfuse.trace({
    name: "Protocolo_Cierre_Sesion",
    metadata: { endpoint: "/signout" },
  });

  try {
    const supabase = await createServerSupabase();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { error: logError } = await supabase.from("events").insert({
        project_id: "global",
        node_id: "hocker-agi",
        level: "info",
        type: "auth.signout",
        message: `Desconexión segura: ${user.email ?? user.id} dejó el puente de mando.`,
        data: { user_id: user.id, email: user.email ?? null },
      });

      if (logError) {
        console.error("[NOVA Auth] No se pudo registrar el evento de salida:", getErrorMessage(logError));
      }
    }

    await supabase.auth.signOut();

    trace.event({ name: "CIERRE_EXITOSO", input: { userId: user?.id ?? null } });
    trace.event({ name: "OPERACION_EXITOSA" });

    return NextResponse.redirect(new URL("/", req.url), { status: 302 });
  } catch (err: unknown) {
    const message = getErrorMessage(err);
    console.error("[NOVA Auth] Error durante el cierre de sesión:", message);

    trace.event({
      name: "ERROR_SIGNOUT",
      level: "ERROR",
      output: { error: message },
    });

    return NextResponse.redirect(new URL("/", req.url), { status: 302 });
  } finally {
    await langfuse.flushAsync();
  }
}