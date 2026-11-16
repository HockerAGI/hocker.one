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
const CancelBody = z.object({
  project_id: z.literal(PROJECT), confirm: z.literal(true), task_id: z.string().uuid(),
}).strict();
const sha = () => String(process.env.VERCEL_GIT_COMMIT_SHA ?? "").trim();

const configured = () =>
  process.env.NOVA_FREE_INVENTORY_ENABLED === "true" &&
  process.env.NOVA_COORDINATOR_OBSERVE_ENABLED === "true" &&
  typeof process.env.NOVA_FREE_INVENTORY_TOKEN === "string" &&
  process.env.NOVA_FREE_INVENTORY_TOKEN.length >= 40 &&
  process.env.NOVA_FREE_INVENTORY_TOKEN.length <= 256 &&
  /^[a-f0-9]{40}$/.test(sha());

function reply(value: Record<string, unknown>, status = 200) {
  return NextResponse.json(value, {
    status, headers: { "Cache-Control": "no-store, max-age=0" },
  });
}

export async function GET() {
  const owner = await requireOwnerAal2Api(PROJECT);
  if (!owner.ok) return owner.response;
  const date = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  const sb = createAdminSupabase();
  const [today, inFlight] = await Promise.all([
    sb.from("agi_tasks")
      .select("id,status,result_hash,created_at,completed_at,error,created_by")
      .eq("project_id", PROJECT).eq("idempotency_key", prefix + date).maybeSingle(),
    sb.from("agi_tasks")
      .select("id,status,result_hash,created_at,completed_at,error,created_by")
      .eq("project_id", PROJECT)
      .eq("status", "owner_approved_inventory")
      .like("idempotency_key", prefix + "%")
      .order("created_at", { ascending: false }).limit(1),
  ]);
  if (today.error || inFlight.error) {
    return reply({ ok: false, code: "FREE_INVENTORY_STATUS_UNAVAILABLE" }, 503);
  }
  const active = inFlight.data?.[0] ?? null;
  const visible = active ?? today.data ?? null;
  return reply({
    ok: true, configured: configured(), already_authorized_today: Boolean(today.data),
    can_authorize: configured() && !today.data && !active,
    can_cancel: Boolean(active && active.created_by === owner.userId),
    task: visible ? {
      id: visible.id, status: visible.status,
      result_hash: visible.result_hash, created_at: visible.created_at,
      completed_at: visible.completed_at, error: visible.error,
    } : null,
    mode: "one_owner_approved_supabase_inventory",
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
        p_deployment_sha: sha(),
      },
    );
    if (error || !data || data.ok !== true || data.authorized !== true ||
        typeof data.task_id !== "string" || data.status !== "owner_approved_inventory") {
      return reply({ ok: false, code: "FREE_INVENTORY_APPROVAL_NOT_PERSISTED" }, 409);
    }
    return reply({
      ok: true, approved: true, task_id: data.task_id,
      status: "owner_approved_inventory", execution: "next_verified_cloudflare_cron",
      one_task_per_day: true, model_requests: 0, no_tools: true,
      no_paid_fallback: true,
    });
  } catch {
    return reply({ ok: false, code: "FREE_INVENTORY_APPROVAL_FAILED" }, 409);
  }
}


export async function DELETE(request: NextRequest) {
  const owner = await requireOwnerAal2Api(PROJECT);
  if (!owner.ok) return owner.response;
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  let validOrigin = false;
  try {
    const parsed = new URL(origin || "");
    validOrigin = parsed.host === host &&
      (parsed.protocol === "https:" || (parsed.protocol === "http:" && host?.startsWith("localhost:")));
  } catch { validOrigin = false; }
  if (!validOrigin) return reply({ ok: false, code: "FREE_INVENTORY_ORIGIN_REJECTED" }, 403);
  const parsed = CancelBody.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return reply({ ok: false, code: "FREE_INVENTORY_CANCEL_CONFIRMATION_REQUIRED" }, 400);
  }
  // Cancellation works even when execution is disabled.
  try {
    const { data, error } = await createAdminSupabase().rpc(
      "owner_cancel_free_inventory_v1", {
        p_project_id: PROJECT, p_owner_id: owner.userId,
        p_task_id: parsed.data.task_id,
      },
    );
    if (error || data?.ok !== true || data.canceled !== true ||
      data.task_id !== parsed.data.task_id || data.status !== "canceled") {
      return reply({ ok: false, code: "FREE_INVENTORY_CANCEL_UNVERIFIED" }, 409);
    }
    return reply({
      ok: true, canceled: true, task_id: data.task_id,
      status: "canceled", model_requests: 0,
    });
  } catch {
    return reply({ ok: false, code: "FREE_INVENTORY_CANCEL_FAILED" }, 409);
  }
}
