import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminSupabase } from "@/lib/supabase-admin";
import { requireOwnerAal2Api } from "@/lib/owner-session-gate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 10;
const PROJECT = "hocker-one";
const prefix = "owner-free-inventory-v1:";
const Body = z.object({ project_id: z.literal(PROJECT), confirm: z.literal(true) }).strict();

const configured = () => process.env.NOVA_FREE_INVENTORY_ENABLED === "true";

function reply(value: Record<string, unknown>, status = 200) {
  return NextResponse.json(value, {
    status, headers: { "Cache-Control": "no-store, max-age=0" },
  });
}

export async function GET() {
  const owner = await requireOwnerAal2Api(PROJECT);
  if (!owner.ok) return owner.response;
  const date = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  const { data, error } = await createAdminSupabase().from("agi_tasks")
    .select("id,status,result_hash,created_at,completed_at,error")
    .eq("project_id", PROJECT).eq("idempotency_key", prefix + date).maybeSingle();
  if (error) return reply({ ok: false, code: "FREE_INVENTORY_STATUS_UNAVAILABLE" }, 503);

  return reply({
    ok: true, configured: configured(), already_authorized_today: Boolean(data),
    can_authorize: configured() && !data,
    task: data ?? null, mode: "one_owner_approved_supabase_inventory",
    approval: "owner_mfa_aal2", scope: "count_only",
    asynchronous_cron: true, no_model: true, model_requests: 0,
    no_tools: true, no_paid_fallback: true,
  });
}

export async function POST(request: NextRequest) {
  const owner = await requireOwnerAal2Api(PROJECT);
  if (!owner.ok) return owner.response;

  // Owner session + exact-origin explicit confirmation, never token-only approval.
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  let validOrigin = false;
  try {
    const parsed = new URL(origin || "");
    validOrigin = parsed.host === host &&
      (parsed.protocol === "https:" || (parsed.protocol === "http:" && host?.startsWith("localhost:")));
  } catch { validOrigin = false; }
  if (!validOrigin) return reply({ ok: false, code: "FREE_INVENTORY_ORIGIN_REJECTED" }, 403);
  if (!Body.safeParse(await request.json().catch(() => null)).success) {
    return reply({ ok: false, code: "FREE_INVENTORY_OWNER_CONFIRMATION_REQUIRED" }, 400);
  }
  if (!configured()) return reply({ ok: false, code: "FREE_INVENTORY_DISABLED" }, 409);
  try {
    const { data, error } = await createAdminSupabase().rpc(
      "owner_schedule_free_inventory_v1", {
        p_project_id: PROJECT, p_owner_id: owner.userId,
      },
    );
    if (error || !data || data.ok !== true || data.authorized !== true ||
        typeof data.task_id !== "string" || data.status !== "queued") {
      return reply({ ok: false, code: "FREE_INVENTORY_APPROVAL_NOT_PERSISTED" }, 409);
    }
    return reply({
      ok: true, approved: true, task_id: data.task_id,
      status: "queued", execution: "next_verified_cloudflare_cron",
      one_task_per_day: true, model_requests: 0, no_tools: true,
      no_paid_fallback: true,
    });
  } catch {
    return reply({ ok: false, code: "FREE_INVENTORY_APPROVAL_FAILED" }, 409);
  }
}
