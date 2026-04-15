import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { z } from "zod";

export const runtime = "edge";

// Blindaje perimetral: Ningún comando anómalo pasará de esta línea
const DispatchSchema = z.object({
  project_id: z.string().optional().default("global"),
  command: z.string().min(2, "Instrucción no válida"),
  payload: z.record(z.string(), z.any()).default({}),
  node_id: z.string().min(1).default("global_node"),
});

export async function POST(req: Request) {
  try {
    const supabase = await createServerSupabase();
    
    // Verificación estricta de identidad
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { ok: false, error: "Conexión rechazada. Identidad no verificada en el ecosistema." }, 
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const parsed = DispatchSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "Anomalía estructural en el comando enviado." },
        { status: 400 }
      );
    }

    const { project_id, command, payload, node_id } = parsed.data;

    // Inserción atómica y segura en la matriz de cola
    const { data: newCommand, error: insertError } = await supabase
      .from("commands")
      .insert({
        project_id,
        node_id,
        command,
        payload,
        status: "queued",
      })
      .select("id")
      .single();

    if (insertError) {
      throw new Error(insertError.message);
    }

    return NextResponse.json({ ok: true, command_id: newCommand.id, status: "queued" }, { status: 201 });

  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Fallo en la matriz de despacho de Hocker." },
      { status: 500 }
    );
  }
}