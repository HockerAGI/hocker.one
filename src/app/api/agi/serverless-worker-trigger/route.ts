import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { createAdminSupabase } from "@/lib/supabase-admin";
import {
  runServerlessAgiWorkerOnce,
  runServerlessNovaChat,
} from "@/lib/serverless-agi-runtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type AdminSupabase = ReturnType<typeof createAdminSupabase>;
type JsonRecord = Record<string, unknown>;

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

  // Query-string credentials are accepted only for a single-use verification.
  // Recurring automation must send the token in the protected request header.
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
  const mode = String(url.searchParams.get("mode") ?? "").trim();
  if (mode === "chat_smoke") {
    if (!token.one_time || token.purpose !== "codex-pr16-chat-smoke") {
      return NextResponse.json(
        { ok: false, error: "UNAUTHORIZED" },
        { status: 401, headers: { "Cache-Control": "no-store, max-age=0" } },
      );
    }

    const { data: owner, error: ownerError } = await db()
      .from("project_members")
      .select("user_id")
      .eq("project_id", token.project_id)
      .eq("role", "owner")
      .limit(1)
      .maybeSingle<{ user_id: string }>();
    if (ownerError || !owner?.user_id) {
      return NextResponse.json(
        { ok: false, error: "OWNER_IDENTITY_NOT_AVAILABLE" },
        { status: 503, headers: { "Cache-Control": "no-store, max-age=0" } },
      );
    }

    const result = await runServerlessNovaChat({
      project_id: token.project_id,
      message:
        "Realiza una verificación operativa breve. No propongas ni ejecutes acciones externas.",
      user_id: owner.user_id,
      context_data: { source: "codex-pr16-one-time-chat-smoke", allow_actions: false },
      oidc_token: req.headers.get("x-vercel-oidc-token"),
    });
    const meta =
      result.meta && typeof result.meta === "object" && !Array.isArray(result.meta)
        ? (result.meta as JsonRecord)
        : {};

    return NextResponse.json(
      {
        ok: result.ok,
        project_id: result.project_id,
        thread_id: result.thread_id,
        trace_id: result.trace_id,
        provider: result.provider,
        model: result.model,
        agi_id: result.agi_id,
        actions_count: Array.isArray(result.actions) ? result.actions.length : 0,
        usage: meta.usage ?? null,
        persistence: meta.persistence ?? null,
        controls: meta.controls ?? null,
      },
      { status: 200, headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  }

  const assignedAgi = String(url.searchParams.get("agi") ?? "").trim() || null;
  const result = await runServerlessAgiWorkerOnce({
    project_id: token.project_id,
    assigned_agi: assignedAgi,
    requested_by: `runtime-token:${token.purpose}`,
    oidc_token: req.headers.get("x-vercel-oidc-token"),
  });

  return NextResponse.json(result, {
    status: result.ok === false ? 502 : 200,
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}

export async function GET(req: Request): Promise<Response> {
  return execute(req);
}

export async function POST(req: Request): Promise<Response> {
  return execute(req);
}
