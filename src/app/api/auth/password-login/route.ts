import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);

    const email = String(body?.email ?? "").trim().toLowerCase();
    const password = String(body?.password ?? "");

    if (!email || !password) {
      return NextResponse.json(
        {
          ok: false,
          message: "Completa correo y contraseña.",
        },
        { status: 400 },
      );
    }

    const supabase = await createServerSupabase();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.session || !data.user) {
      const serviceUnavailable = Boolean(error && (error.status ?? 0) >= 500);
      return NextResponse.json(
        {
          ok: false,
          message: serviceUnavailable
            ? "No se pudo validar tu acceso en este momento. Intenta nuevamente."
            : "No se pudo autenticar con esos datos. Verifica tu correo y contraseña.",
        },
        { status: serviceUnavailable ? 503 : 401 },
      );
    }

    return NextResponse.json({
      ok: true,
      redirectTo: "/owner",
      user: {
        id: data.user.id,
        email: data.user.email,
      },
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        message: "El inicio de sesión no está disponible en este entorno. Intenta nuevamente o usa Production.",
      },
      { status: 500 },
    );
  }
}
