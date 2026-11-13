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
