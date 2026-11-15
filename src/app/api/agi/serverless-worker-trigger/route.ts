import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase-admin";
import { runUnifiedAgiWorkerOnce } from "@/lib/unified-agi-runtime";
import { AGI_STALE_BACKLOG_BLOCK_CODE, AGI_STALE_BACKLOG_READ_ERROR } from "@/lib/agi-stale-backlog-gate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type AdminSupabase = ReturnType<typeof createAdminSupabase>;

type RuntimeToken = {
  id: string;
  project_id: string;
  purpose: string;
  one_time: boolean;
  active: boolean;
  used_at: string | null;
  expires_at: string;
};

function db(): AdminSupabase {
  return createAdminSupabase();
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function suppliedToken(req: Request): { raw: string; source: "header" | "query" } | null {
  const header = String(req.headers.get("x-hocker-worker-token") ?? "").trim();
  if (header) return { raw: header, source: "header" };

  const query = String(new URL(req.url).searchParams.get("token") ?? "").trim();
  return query ? { raw: query, source: "query" } : null;
}

async function authorizeAndConsume(req: Request): Promise<RuntimeToken | null> {
  const supplied = suppliedToken(req);
  if (!supplied || supplied.raw.length < 32 || supplied.raw.length > 512) return null;

  const projectId = "hocker-one";
  const now = new Date().toISOString();
  const { data, error } = await db()
    .from("agi_runtime_tokens")
    .select("id,project_id,purpose,one_time,active,used_at,expires_at")
    .eq("project_id", projectId)
    .eq("token_hash", sha256(supplied.raw))
    .eq("active", true)
    .gt("expires_at", now)
    .maybeSingle<RuntimeToken>();

  if (error || !data) return null;

  if (supplied.source === "query" && !data.one_time) return null;

  if (data.one_time) {
    const { data: consumed, error: consumeError } = await db()
      .from("agi_runtime_tokens")
      .update({ active: false, used_at: now })
      .eq("id", data.id)
      .eq("active", true)
      .is("used_at", null)
      .select("id")
      .maybeSingle();

    if (consumeError || !consumed) return null;
    return { ...data, active: false, used_at: now };
  }

  const { data: audited, error: auditError } = await db()
    .from("agi_runtime_tokens")
    .update({ used_at: now })
    .eq("id", data.id)
    .eq("active", true)
    .select("id")
    .maybeSingle();

  if (auditError || !audited) return null;
  return { ...data, used_at: now };
}

async function execute(req: Request): Promise<Response> {
  const token = await authorizeAndConsume(req);
  if (!token) {
    return NextResponse.json(
      { ok: false, error: "UNAUTHORIZED" },
      { status: 401, headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  }

  const url = new URL(req.url);
  const assignedAgi = String(url.searchParams.get("agi") ?? "").trim() || null;
  try {
    const result = await runUnifiedAgiWorkerOnce({
      project_id: token.project_id,
      assigned_agi: assignedAgi,
      requested_by: `runtime-token:${token.purpose}`,
      oidc_token: req.headers.get("x-vercel-oidc-token"),
    });
    return NextResponse.json(result, {
      status: result.ok === false ? 502 : 200,
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch (error) {
    if (error instanceof Error && [
      AGI_STALE_BACKLOG_BLOCK_CODE,
      AGI_STALE_BACKLOG_READ_ERROR,
      "AGI_WORKER_BACKLOG_PREFLIGHT_INVALID",
    ].includes(error.message)) {
      return NextResponse.json({
        ok: false,
        processed: false,
        error: error.message,
        blocked: true,
      }, {
        status: error.message === AGI_STALE_BACKLOG_BLOCK_CODE ? 409 : 503,
        headers: { "Cache-Control": "no-store, max-age=0" },
      });
    }
    throw error;
  }
}

export async function GET(req: Request): Promise<Response> {
  return execute(req);
}

export async function POST(req: Request): Promise<Response> {
  return execute(req);
}