import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * DEPRECATED: prototipo antiguo.
 * El dashboard usa POST /api/nova/chat
 */
export async function POST() {
  return NextResponse.json(
    { error: "Deprecated: usa POST /api/nova/chat (este endpoint ya no ejecuta nada)." },
    { status: 410 }
  );
}