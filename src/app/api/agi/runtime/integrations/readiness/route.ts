import { NextResponse } from "next/server";
import { requireOwnerAal2Api } from "@/lib/owner-session-gate";
import { executeGitHubReadOperation, hasGitHubRuntimeToken } from "@/lib/github-runtime-executor";
import { getVercelProject, hasVercelRuntimeToken } from "@/lib/vercel-runtime-executor";
import { selectGitHubReadinessProbeRepositories, summarizeEngineeringReadiness } from "@/lib/agi-engineering-integration-readiness";
import { getGitHubRuntimeIdentityKind, getGitHubRuntimeReadProbeRepositoryNames, requiresStaticGitHubIdentityForRepositoryCreation } from "@/lib/github-runtime-identity";

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

  const rawEnvironment = String(process.env.VERCEL_ENV ?? "").trim();
  const checkedEnvironment = (["production", "preview", "development"].includes(rawEnvironment)
    ? rawEnvironment : "unknown") as "production" | "preview" | "development" | "unknown";
  // A Preview token must NEVER be presented as Production readiness.
  // No provider probe runs outside the actual Production deployment.
  const productionScope = checkedEnvironment === "production";
  const githubConfigured = productionScope && hasGitHubRuntimeToken();
  const vercelConfigured = productionScope && hasVercelRuntimeToken();
  const vercelProjectId = String(process.env.VERCEL_PROJECT_ID ?? "").trim();
  // Read only the intersection of the configured App scope and the three
  // approved engineering repositories. Never claim verified on an empty set.
  // The PAT fallback retains the historical three-repository readiness check.
  const githubProbeRepositories = githubConfigured
    ? selectGitHubReadinessProbeRepositories(getGitHubRuntimeReadProbeRepositoryNames())
    : [];
  // Separate read-only probes: a failing provider must not obscure the
  // other's status or leak HTTP error payloads / authorization headers.
  const [githubRead, vercelRead] = await Promise.all([
    githubConfigured && githubProbeRepositories.length > 0
      ? Promise.all(githubProbeRepositories.map((repository) =>
          executeGitHubReadOperation("get_repo", { repository })
            .then((result) => result.repository.toLowerCase() === repository.toLowerCase())
            .catch(() => false),
        )).then((results) => results.every(Boolean))
      : Promise.resolve(false),
    vercelConfigured && vercelProjectId
      ? getVercelProject({ project_id: vercelProjectId })
          .then((project) => Boolean(project && typeof project === "object" &&
            "id" in project && project.id === vercelProjectId))
          .catch(() => false)
      : Promise.resolve(false),
  ]);
  const readiness = summarizeEngineeringReadiness({
    github_configured: githubConfigured,
    github_verified_read: githubRead,
    github_repo_creation_identity_configured: productionScope && requiresStaticGitHubIdentityForRepositoryCreation(),
    vercel_configured: vercelConfigured,
    vercel_verified_read: vercelRead,
  });

  return NextResponse.json({
    ok: true,
    project_id: PROJECT_ID,
    checked_at: new Date().toISOString(),
    checked_environment: checkedEnvironment,
    production_scope_verified: productionScope,
    github_identity_kind: productionScope ? getGitHubRuntimeIdentityKind() : "not_checked",
    github_read_probe_repositories: githubProbeRepositories,
    ...readiness,
    blockers: productionScope ? readiness.blockers
      : [...readiness.blockers, "NON_PRODUCTION_SCOPE_NOT_CERTIFIED"],
    authentication_scope: "read_only_verified_no_write_attestation",
    message: "Verificación de conexión sin escritura. Las mutaciones requieren Owner Gate.",
  }, { headers: { "Cache-Control": "no-store, max-age=0" } });
}
