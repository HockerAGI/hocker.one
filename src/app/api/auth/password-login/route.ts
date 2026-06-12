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
      return NextResponse.json(
        {
          ok: false,
          message: "Correo o contraseña incorrectos.",
        },
        { status: 401 },
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
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: "No se pudo iniciar sesión. Intenta de nuevo.",
      },
      { status: 500 },
    );
  }
}
