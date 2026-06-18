import { NextRequest } from "next/server";
import { requireOwnerOrInternal } from "@/lib/hocker-owner-api-gate";
import { createAdminSupabase } from "@/lib/supabase-admin";
import { json, toApiError } from "@/app/api/_lib";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function asInt(value: string | null, fallback: number): number {
  const n = Math.trunc(Number(value));
  return Number.isFinite(n) ? n : fallback;
}

export async function GET(req: NextRequest) {
  const gate = requireOwnerOrInternal(req);
  if (gate) return gate;

  try {
    const params = new URL(req.url).searchParams;
    const project_id = (params.get("project_id") ?? "hocker-one").trim();
    const limit = Math.max(1, Math.min(asInt(params.get("limit"), 500), 5000));

    const sb = createAdminSupabase();
    const { data, error } = await sb
      .from("audit_logs")
      .select(
        "id,project_id,actor_user_id,action,context,created_at,seq,prev_hash,row_hash,signature",
      )
      .eq("project_id", project_id)
      .order("created_at", { ascending: true })
      .order("id", { ascending: true })
      .limit(limit);

    if (error) throw error;

    return json({ ok: true, chain: data ?? [] }, 200);
  } catch (error) {
    const e = toApiError(error);
    return json({ ok: false, error: e.payload.error }, e.status);
  }
}
