import { NextRequest, NextResponse } from "next/server";
import { collectHockerMobileSanity } from "@/lib/hocker-mobile-sanity";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const emitEvent = url.searchParams.get("emit_event") !== "0";

  const result = await collectHockerMobileSanity({
    emitEvent,
  });

  return NextResponse.json(result);
}
