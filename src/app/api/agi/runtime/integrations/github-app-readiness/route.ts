import { NextResponse } from "next/server";
import { requireOwnerAal2Api } from "@/lib/owner-session-gate";
import {
  getActiveStaticGitHubTokenVariable,
  getGitHubAppConfigurationChecks,
  getGitHubRuntimeIdentityKind,
  isGitHubAppPreferred,
  probeGitHubAppReadOnly,
} from "@/lib/github-runtime-identity";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const PROJECT_ID = "hocker-one";
const noStore = { "Cache-Control": "no-store, max-age=0" };

/**
 * Independent credential verification for the Owner.
 * No PAT or private key is returned. It does not authorize writes or
 * activate the optional GitHub App identity mode.
 */
export async function GET(request: Request): Promise<Response> {
  const requestedProject = new URL(request.url).searchParams.get("project_id") ?? PROJECT_ID;
  if (requestedProject !== PROJECT_ID) {
    return NextResponse.json({ ok: false, error: "PROJECT_SCOPE_INVALID" },
      { status: 400, headers: noStore });
  }
  const owner = await requireOwnerAal2Api(PROJECT_ID);
  if (!owner.ok) return owner.response;

  const environment = String(process.env.VERCEL_ENV ?? "").trim();
  if (environment !== "production") {
    return NextResponse.json({
      ok: false, project_id: PROJECT_ID,
      checked_environment: environment || "unknown",
      error: "NON_PRODUCTION_SCOPE_NOT_CERTIFIED",
      write_scope_verified: false,
    }, { status: 403, headers: noStore });
  }

  const app = await probeGitHubAppReadOnly();
  const canSwitch = app.verified_read && app.scope_complete;
  return NextResponse.json({
    ok: true,
    project_id: PROJECT_ID,
    checked_at: new Date().toISOString(),
    checked_environment: "production",
    active_identity: getGitHubRuntimeIdentityKind(),
    active_pat_variable: getActiveStaticGitHubTokenVariable(),
    app_mode_enabled: isGitHubAppPreferred(),
    github_app: app,
    app_configuration_checks: getGitHubAppConfigurationChecks(),
    can_switch_runtime_identity: canSwitch,
    approved_repositories_required: [
      "HockerAGI/hocker.one",
      "HockerAGI/nova.agi",
      "HockerAGI/hocker-node-agent",
    ],
    write_scope_verified: false,
    owner_gate_required_for_writes: true,
    authentication_scope: "owner_aal2_independent_github_app_read_only",
    message: "Prueba de identidad GitHub App sin escritura ni cambios de credenciales.",
  }, { headers: noStore });
}
