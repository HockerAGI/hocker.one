import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createContextBridgeCheckpoint } from "@/lib/context-bridge";
import { getGitHubRuntimeAccessToken } from "@/lib/github-runtime-identity";
import { requireOwnerAal2Api } from "@/lib/owner-session-gate";
import { createAdminSupabase } from "@/lib/supabase-admin";
import { CHATGPT_REVIEW_SOURCE_ID, parseHockerChatgptHandoffUrl } from "@/lib/chatgpt-handoff-review";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const Submit = z.object({
  project_id: z.literal("hocker-one"),
  handoff_url: z.string().trim().url().max(260),
  confirm: z.literal(true),
}).strict();

function json(body: Record<string, unknown>, status = 200): NextResponse {
  return NextResponse.json(body, {
    status, headers: { "Cache-Control": "no-store, max-age=0" },
  });
}

function sameOrigin(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  const host = req.headers.get("host");
  try {
    return Boolean(origin && host && new URL(origin).host === host &&
      new URL(origin).protocol === "https:");
  } catch {
    return false;
  }
}

async function githubRead<T>(path: string): Promise<T> {
  const token = await getGitHubRuntimeAccessToken().catch(() => { throw new Error("GITHUB_READ_UNAVAILABLE"); });
  const response = await fetch("https://api.github.com" + path, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: "Bearer " + token,
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "hocker-one-context-bridge",
    },
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error("GITHUB_READ_UNAVAILABLE");
  return (await response.json()) as T;
}

export async function GET() {
  const owner = await requireOwnerAal2Api("hocker-one");
  if (!owner.ok) return owner.response;
  const { data, error } = await createAdminSupabase()
    .from("context_bridge_checkpoints")
    .select("id,observed_at,source_revision,external_ref,cursor")
    .eq("project_id", "hocker-one")
    .eq("source_id", CHATGPT_REVIEW_SOURCE_ID)
    .order("observed_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) return json({ ok: false, error: "CHATGPT_REVIEW_STATUS_UNAVAILABLE" }, 503);
  const cursor = data?.cursor && typeof data.cursor === "object" ? data.cursor : {};
  return json({
    ok: true,
    latest: data ? {
      observed_at: data.observed_at,
      external_ref: data.external_ref,
      owner_reviewed: (cursor as Record<string, unknown>).review_type ===
        "owner_mfa_aal2_github_crosschecked",
    } : null,
    provider_session_verified: false,
    manifest_activated: false,
  });
}

export async function POST(request: NextRequest) {
  const owner = await requireOwnerAal2Api("hocker-one");
  if (!owner.ok) return owner.response;
  if (!sameOrigin(request)) return json({
    ok: false, stored: false, error: "CHATGPT_REVIEW_ORIGIN_REJECTED",
  }, 403);
  const parsed = Submit.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json({
    ok: false, stored: false, error: "CHATGPT_REVIEW_CONFIRMATION_REQUIRED",
  }, 400);
  const commentId = parseHockerChatgptHandoffUrl(parsed.data.handoff_url);
  if (!commentId) return json({
    ok: false, stored: false, error: "CHATGPT_REVIEW_SOURCE_NOT_ALLOWLISTED",
  }, 400);

  type GitHubComment = { id?: number; html_url?: string; issue_url?: string; body?: string };
  type GitRef = { object?: { sha?: string } };
  let comment: GitHubComment;
  let main: GitRef;
  try {
    [comment, main] = await Promise.all([
      githubRead<GitHubComment>(
        "/repos/HockerAGI/hocker.one/issues/comments/" + commentId,
      ),
      githubRead<GitRef>("/repos/HockerAGI/hocker.one/git/ref/heads/main"),
    ]);
  } catch {
    return json({
      ok: false, stored: false, error: "CHATGPT_REVIEW_GITHUB_EVIDENCE_UNAVAILABLE",
    }, 503);
  }
  const url = "https://github.com/HockerAGI/hocker.one/issues/306#issuecomment-" + commentId;
  const mainSha = String(main.object?.sha ?? "");
  const body = typeof comment.body === "string" ? comment.body : "";
  if (comment.id !== Number(commentId) ||
      comment.issue_url !== "https://api.github.com/repos/HockerAGI/hocker.one/issues/306" ||
      comment.html_url !== url || body.length < 100 ||
      !/^[a-f0-9]{40}$/.test(mainSha)) {
    return json({ ok: false, stored: false, error: "CHATGPT_REVIEW_SOURCE_IDENTITY_UNVERIFIED" }, 409);
  }

  const bodySha = createHash("sha256").update(body).digest("hex");
  const revision = "owner-reviewed-gh-comment-" + commentId + "-" + bodySha.slice(0, 16);
  try {
    // Owner-reviewed GitHub handoff is NOT an authenticated ChatGPT session.
    // Only partial capabilities can be persisted through this route.
    const checkpoint = await createContextBridgeCheckpoint({
      project_id: "hocker-one",
      source_id: CHATGPT_REVIEW_SOURCE_ID,
      provider: "chatgpt",
      source_kind: "conversation",
      external_ref: url,
      source_revision: revision,
      summary:
        "Handoff documental revisado por Owner MFA AAL2 y contrastado con GitHub " +
        "main. Identidad de sesion emitida por ChatGPT NO comprobada. " +
        "Esta revision no certifica un cuarto proveedor.",
      decisions: [
        "Conservar cobertura real 3/6 hasta disponer de prueba de sesion ChatGPT.",
        "Codex y Google Drive permanecen pendientes P0 con prioridad equivalente.",
        "La activacion del manifiesto requiere seis fuentes y nueva aprobacion Owner AAL2.",
      ],
      open_items: [
        "Comprobar identificador de origen/sesion ChatGPT verificable por proveedor.",
        "Obtener handoff de Codex desde su workspace y canon Drive 2026 autentico.",
      ],
      canonical_refs: [
        { kind: "evidence", ref: url, revision: "comment:" + commentId, content_hash: bodySha },
        { kind: "repository",
          ref: "https://github.com/HockerAGI/hocker.one/tree/" + mainSha,
          revision: mainSha },
      ],
      cursor: {
        review_type: "owner_mfa_aal2_github_crosschecked",
        source_comment_id: commentId,
        source_body_sha256: bodySha,
        github_main_sha: mainSha,
        chatgpt_provider_session_attested: false,
      },
      capabilities: [
        { capability_key: "chatgpt.normalized_handoff", access_mode: "read_only",
          status: "partial", mutates_external: false, owner_gate_required: false, evidence_ref: url },
        { capability_key: "chatgpt.project_context.read", access_mode: "read_only",
          status: "partial", mutates_external: false, owner_gate_required: false, evidence_ref: url },
      ],
    }, "owner-aal2-chatgpt-handoff-review");
    return json({
      ok: true, stored: true, content_hash: checkpoint.content_hash,
      owner_reviewed: true, github_evidence_crosschecked: true,
      provider_session_verified: false, capability_status: "partial",
      coverage_upgraded: false, manifest_activated: false,
    }, 201);
  } catch {
    return json({ ok: false, stored: false,
      error: "CHATGPT_REVIEW_PERSISTENCE_UNAVAILABLE" }, 503);
  }
}
