export type ProviderReadiness = {
  configured: boolean;
  verified_read: boolean;
  state: "missing" | "verification_failed" | "verified_read";
};

export type EngineeringReadiness = {
  github: ProviderReadiness;
  vercel: ProviderReadiness;
  node_agent_required: false;
  owner_gate_required_for_writes: true;
  github_write_scope_verified: false;
  github_repo_creation_identity_configured: boolean;
  can_prepare_existing_app_proposal: boolean;
  can_prepare_new_app_bootstrap: boolean;
  blockers: string[];
};

function providerReadiness(configured: boolean, verified_read: boolean): ProviderReadiness {
  return {
    configured,
    verified_read: configured && verified_read,
    state: !configured ? "missing"
      : verified_read ? "verified_read" : "verification_failed",
  };
}

/**
 * A read-only connection proof is NOT a write-permission test.
 * Never convert provider authentication into autonomous mutation authority.
 */
export function summarizeEngineeringReadiness(input: {
  github_configured: boolean;
  github_verified_read: boolean;
  github_repo_creation_identity_configured?: boolean;
  vercel_configured: boolean;
  vercel_verified_read: boolean;
}): EngineeringReadiness {
  const github = providerReadiness(input.github_configured, input.github_verified_read);
  const vercel = providerReadiness(input.vercel_configured, input.vercel_verified_read);
  const repoCreationIdentityConfigured = input.github_repo_creation_identity_configured ?? input.github_configured;
  const blockers: string[] = [];
  if (github.verified_read && !repoCreationIdentityConfigured) {
    blockers.push("GITHUB_REPO_CREATION_IDENTITY_NOT_CONFIGURED");
  }
  if (!github.configured) blockers.push("GITHUB_RUNTIME_IDENTITY_MISSING");
  else if (!github.verified_read) blockers.push("GITHUB_AUTHENTICATED_READ_UNVERIFIED");
  if (!vercel.configured) blockers.push("VERCEL_RUNTIME_IDENTITY_MISSING");
  else if (!vercel.verified_read) blockers.push("VERCEL_AUTHENTICATED_READ_UNVERIFIED");
  return {
    github,
    vercel,
    node_agent_required: false,
    owner_gate_required_for_writes: true,
    github_write_scope_verified: false,
    github_repo_creation_identity_configured: repoCreationIdentityConfigured,
    can_prepare_existing_app_proposal: github.verified_read,
    can_prepare_new_app_bootstrap: github.verified_read && vercel.verified_read && repoCreationIdentityConfigured,
    blockers,
  };
}
