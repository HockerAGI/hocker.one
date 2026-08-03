import { NextResponse } from "next/server";
import { runServerlessAgiWorkerOnce } from "@/lib/serverless-agi-runtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const PREVIEW_NONCE = "3933fe5dad93578cb023083e9772e565bdd9b40832557d4191f6db543c98387f";

export async function GET(req: Request): Promise<Response> {
  if (process.env.VERCEL_ENV !== "preview") {
    return new NextResponse(null, { status: 404 });
  }

  const url = new URL(req.url);
  if (url.searchParams.get("nonce") !== PREVIEW_NONCE) {
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  const assignedAgi = url.searchParams.get("agi");
  const result = await runServerlessAgiWorkerOnce({
    project_id: "hocker-one",
    assigned_agi: assignedAgi || null,
    requested_by: "preview-verification",
  });

  return NextResponse.json(result, {
    status: result.ok === false ? 502 : 200,
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}
