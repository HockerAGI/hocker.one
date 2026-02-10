import { NextResponse } from "next/server";

export const runtime = "nodejs";

function disabled() {
  return NextResponse.json(
    {
      error:
        "Supply module deshabilitado en este build. Faltan tablas/policies supply_* en Supabase y el flujo de pagos/logística.",
    },
    { status: 501 }
  );
}

export async function GET() {
  return disabled();
}

export async function POST() {
  return disabled();
}