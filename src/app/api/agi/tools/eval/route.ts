import { NextResponse } from "next/server";
import { z } from "zod";
import { runAgiReadOnlyToolProbe } from "@/lib/agi-read-tool-runtime";
import { canonicalAgiId } from "@/lib/hocker-agi-operational";
import { requireOwnerAal2Api } from "@/lib/owner-session-gate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const BodySchema = z.object({
  agi_id: z.string().trim().min(1).max(100),
  tool_key: z.enum(["supabase", "github"]),
}).strict();

export async function POST(req: Request): Promise<Response> {
  const owner = await requireOwnerAal2Api("hocker-one");
  if (!owner.ok) return owner.response;

  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        executed: false,
        mode: "read_only",
        error: "invalid_tool_eval_request",
      },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const result = await runAgiReadOnlyToolProbe({
      agi_id: canonicalAgiId(parsed.data.agi_id),
      tool_key: parsed.data.tool_key,
      actor_user_id: owner.userId,
    });
    return NextResponse.json(result, {
      status: 200,
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        executed: false,
        mode: "read_only",
        error: "tool_eval_failed",
        message: "Read-only tool check failed. Review evidence and logs.",
      },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }
}
