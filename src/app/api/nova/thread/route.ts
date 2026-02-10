import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * DEPRECATED: threads se manejan automáticamente vía /api/nova/chat
 */
export async function POST() {
  return NextResponse.json(
    { error: "Deprecated: usa POST /api/nova/chat (threads auto gestionados)." },
    { status: 410 }
  );
}