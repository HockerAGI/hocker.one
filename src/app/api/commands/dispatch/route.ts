import { NextResponse } from "next/server";
import { ApiError, toApiError } from "../../_lib";
import { dispatchCloudCommands } from "../_cloud";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const project_id = String(body.project_id || "global").trim();

    const authHeader = req.headers.get("authorization")?.replace("Bearer ", "")?.trim() || "";
    const expectedKey = String(process.env.COMMAND_HMAC_SECRET || "").trim();

    if (!expectedKey || authHeader !== expectedKey) {
      return NextResponse.json({ error: "Dispatch unauthorized (invalid signature)." }, { status: 401 });
    }

    const r = await dispatchCloudCommands(project_id, 10);
    return NextResponse.json({ ok: true, ...r }, { status: 200 });
  } catch (e: any) {
    const ex = toApiError(e);
    return NextResponse.json(ex.payload, { status: ex.status });
  }
}