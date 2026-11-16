import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminSupabase } from "@/lib/supabase-admin";
import { requireOwnerAal2Api } from "@/lib/owner-session-gate";
import { CF_FREE_MODEL } from "@/lib/cloudflare-zero-credit-policy";
import { FREE_UNIFIED_HOSTIA_KEY, freeUnifiedHostiaConfigured } from "@/lib/agi-free-unified-canary";
import { runUnifiedAgiWorkerOnce } from "@/lib/unified-agi-runtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;
const PROJECT = "hocker-one";
const RequestSchema = z.object({
  project_id: z.literal("hocker-one"), confirm: z.literal(true),
}).strict();
function reply(body: Record<string, unknown>, status = 200): NextResponse {
  return NextResponse.json(body, {
    status, headers: { "Cache-Control": "no-store, max-age=0" },
  });
}

export async function GET() {
  const owner = await requireOwnerAal2Api(PROJECT);
  if (!owner.ok) return owner.response;
  const { data, error } = await createAdminSupabase().from("agi_tasks")
    .select("id,status,created_at,completed_at,result_hash,error")
    .eq("project_id", PROJECT).eq("idempotency_key", FREE_UNIFIED_HOSTIA_KEY)
    .maybeSingle();
  if (error) return reply({ ok: false, error: "FREE_UNIFIED_STATUS_UNAVAILABLE" }, 503);
  return reply({
    ok: true, configured: freeUnifiedHostiaConfigured(),
    ready_for_single_owner_execution: freeUnifiedHostiaConfigured() && !data,
    already_started: Boolean(data), task: data ?? null, model: CF_FREE_MODEL,
    no_tools: true, no_paid_fallback: true, no_autonomous_dispatch: true,
  });
}

export async function POST(request: NextRequest) {
  // This is a different Owner ceremony from the already-completed NOVA/HOSTIA pilots.
  const owner = await requireOwnerAal2Api(PROJECT);
  if (!owner.ok) return owner.response;
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  let sameOrigin = false;
  try { sameOrigin = Boolean(origin && host && new URL(origin).host === host); }
  catch { sameOrigin = false; }
  if (!sameOrigin) return reply({ ok: false, error: "FREE_UNIFIED_ORIGIN_REJECTED" }, 403);
  const parsed = RequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return reply({ ok: false, error: "FREE_UNIFIED_EXPLICIT_CONFIRMATION_REQUIRED" }, 400);
  if (!freeUnifiedHostiaConfigured()) return reply({
    ok: false, executed: false, error: "FREE_UNIFIED_ROUTE_NOT_CONFIGURED",
    no_paid_fallback: true,
  }, 409);
  try {
    const result = await runUnifiedAgiWorkerOnce({
      project_id: PROJECT, assigned_agi: "hostia",
      requested_by: owner.userId, free_only_hostia_canary: true,
    });
    return reply({
      ...result, free_only: true, no_autonomous_dispatch: true,
      no_paid_fallback: true,
    }, result.ok === false ? 502 : 200);
  } catch (failure) {
    const code = failure instanceof Error ? failure.message : "FREE_UNIFIED_UNAVAILABLE";
    const safe = /^FREE_UNIFIED_[A-Z_]+$/.test(code)
      ? code : "FREE_UNIFIED_PREFLIGHT_BLOCKED";
    return reply({
      ok: false, executed: false, error: safe, no_paid_fallback: true,
    }, 409);
  }
}
