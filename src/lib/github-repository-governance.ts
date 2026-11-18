/**
 * A discovered repository is not automatically authorized for AGI mutation.
 * Read-only inspection remains available under separate GitHub read policy.
 */
const READ_ONLY_GITHUB_REPOSITORIES = new Set(["hockeragi/punto.g"]);

export function assertGithubRepositoryWriteAuthorized(repository: string): void {
  const normalized = String(repository ?? "").trim().toLowerCase();
  if (READ_ONLY_GITHUB_REPOSITORIES.has(normalized)) {
    throw new Error("Repositorio en modo solo lectura: requiere clasificación canónica y aprobación Owner antes de permitir mutaciones AGI.");
  }
}

/**
 * Explicit write boundary for NOVA/AGI executor paths. Organization membership
 * alone never authorizes a repository mutation. Other product repositories
 * require an Owner-governed allowlist change; reads remain unaffected.
 */
const DEFAULT_AGI_WRITE_REPOSITORIES = [
  "hockeragi/hocker.one",
  "hockeragi/nova.agi",
  "hockeragi/hocker-node-agent",
  "hockeragi/chido.casino",
  "hockeragi/hocker.agi",
  "hockeragi/hocker.ads",
] as const;

export function assertGithubAgiExecutionRepositoryAllowed(repository: string): void {
  const normalized = String(repository ?? "").trim().toLowerCase();
  assertGithubRepositoryWriteAuthorized(normalized);
  const allowedOrg = String(process.env.HOCKER_GITHUB_ORG || "HockerAGI").trim().toLowerCase();
  const configured = String(
    process.env.HOCKER_GITHUB_ALLOWED_REPOS ||
    process.env.GITHUB_ALLOWED_REPOS ||
    DEFAULT_AGI_WRITE_REPOSITORIES.join(","),
  );
  const allowed = new Set(configured.split(",").map((value) => value.trim().toLowerCase()).filter(Boolean));
  if (!/^[a-z0-9_.-]+\/[a-z0-9_.-]+$/.test(normalized) ||
      !normalized.startsWith(allowedOrg + "/") ||
      !allowed.has(normalized)) {
    throw new Error("GITHUB_AGI_WRITE_REPOSITORY_NOT_ALLOWED");
  }
}
