import { NextResponse } from 'next/server';
import { SystemControl } from '@/types/hocker';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { project_id, confirmation_code } = body as { project_id: string, confirmation_code: string };

    if (!project_id || confirmation_code !== "OMEGA-PROTOCOL") {
      return NextResponse.json(
        { error: "Autorización denegada. Credenciales biométricas o código inválido." },
        { status: 403 }
      );
    }

    // Aquí iría tu cliente de Supabase tipado
    const newControlState: SystemControl = {
      id: crypto.randomUUID(),
      project_id: project_id,
      kill_switch: true,
      allow_write: false,
      meta: { reason: "Manual Override", initiator: "NOVA_CORE" },
      updated_at: new Date().toISOString()
    };

    // 1. Actualizar DB
    // await supabase.from('system_controls').upsert(newControlState);

    // 2. Disparar evento a la red hocker-agi
    // await supabase.from('events').insert({...})

    return NextResponse.json({
      status: "neutralized",
      message: "NOVA: Procesos cognitivos terminados. Aislamiento de red OMEGA activado.",
      timestamp: newControlState.updated_at
    }, { status: 200 });

  } catch (error) {
    return NextResponse.json({ error: "Fallo crítico en el bus de comandos." }, { status: 500 });
  }
}
