import { NextResponse } from "next/server";
import { requireOwnerAal2Api } from "@/lib/owner-session-gate";
import { executeGitHubReadOperation, hasGitHubRuntimeToken } from "@/lib/github-runtime-executor";
import { getVercelProject, hasVercelRuntimeToken } from "@/lib/vercel-runtime-executor";
import { summarizeEngineeringReadiness } from "@/lib/agi-engineering-integration-readiness";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 15;
const PROJECT_ID = "hocker-one";

/**
 * Authenticated Owner-only, read-only status. It never accepts tokens
 * in requests, returns secret values, creates queue items or writes to providers.
 */
export async function GET(request: Request): Promise<Response> {
  const projectId = new URL(request.url).searchParams.get("project_id") ?? PROJECT_ID;
  if (projectId !== PROJECT_ID) {
    return NextResponse.json({ ok: false, error: "PROJECT_SCOPE_INVALID" }, { status: 400,
      headers: { "Cache-Control": "no-store" } });
  }
  const owner = await requireOwnerAal2Api(PROJECT_ID);
  if (!owner.ok) return owner.response;

  const githubConfigured = hasGitHubRuntimeToken();
  const vercelConfigured = hasVercelRuntimeToken();
  const vercelProjectId = String(process.env.VERCEL_PROJECT_ID ?? "").trim();
  // Separate read-only probes: a failing provider must not obscure the
  // other's status or leak HTTP error payloads / authorization headers.
  const [githubRead, vercelRead] = await Promise.all([
    githubConfigured
      ? executeGitHubReadOperation("get_repo", { repository: "HockerAGI/hocker.one" })
          .then((result) => result.repository === "HockerAGI/hocker.one")
          .catch(() => false)
      : Promise.resolve(false),
    vercelConfigured && vercelProjectId
      ? getVercelProject({ project_id: vercelProjectId })
          .then((project) => project.id === vercelProjectId)
          .catch(() => false)
      : Promise.resolve(false),
  ]);
  const readiness = summarizeEngineeringReadiness({
    github_configured: githubConfigured,
    github_verified_read: githubRead,
    vercel_configured: vercelConfigured,
    vercel_verified_read: vercelRead,
  });

  return NextResponse.json({
    ok: true,
    project_id: PROJECT_ID,
    checked_at: new Date().toISOString(),
    ...readiness,
    authentication_scope: "read_only_verified_no_write_attestation",
    message: "Verificación de conexión sin escritura. Las mutaciones requieren Owner Gate.",
  }, { headers: { "Cache-Control": "no-store, max-age=0" } });
}
