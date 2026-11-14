/**
 * Normalize GitHub's official MCP list_commits schema without accepting
 * arbitrary model-generated argument names or values.
 * This is a pure helper: it does not make network calls or access credentials.
 */
type GitHubListCommitsInput = Record<string, unknown>;

function optionalString(value: unknown, field: string, maxLength: number): string | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "string" || value.length > maxLength) {
    throw new Error(`GITHUB_MCP_INVALID_${field.toUpperCase()}`);
  }
  const normalized = value.trim();
  if (!normalized) return undefined;
  return normalized;
}

function integerOption(value: unknown, field: string, upper: number): number | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isSafeInteger(n) || n < 1 || n > upper) {
    throw new Error(`GITHUB_MCP_INVALID_${field.toUpperCase()}`);
  }
  return n;
}

export function normalizeGitHubListCommitsArguments(input: GitHubListCommitsInput): Record<string, unknown> {
  const raw = input && typeof input === "object" && !Array.isArray(input) ? input : {};
  let owner = optionalString(raw.owner, "owner", 100);
  let repo = optionalString(raw.repo, "repo", 100);

  const fullName = optionalString(
    raw.repository_full_name ?? raw.repo_full_name ?? raw.repository,
    "repository", 220,
  );

  if (fullName) {
    const parts = fullName.split("/");
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
      throw new Error("GITHUB_MCP_INVALID_REPOSITORY");
    }
    if ((owner && owner.toLowerCase() !== parts[0].toLowerCase()) ||
        (repo && repo.toLowerCase() !== parts[1].toLowerCase())) {
      throw new Error("GITHUB_MCP_CONFLICTING_REPOSITORY");
    }
    owner = parts[0];
    repo = parts[1];
  } else if (repo?.includes("/") && !owner) {
    const parts = repo.split("/");
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
      throw new Error("GITHUB_MCP_INVALID_REPOSITORY");
    }
    [owner, repo] = parts;
  }

  if (!owner || !repo || !/^[A-Za-z0-9_.-]+$/.test(owner) || !/^[A-Za-z0-9_.-]+$/.test(repo)) {
    throw new Error("GITHUB_MCP_REPOSITORY_REQUIRED");
  }

  const normalized: Record<string, unknown> = { owner, repo };
  const sha = optionalString(raw.sha ?? raw.ref ?? raw.branch ?? raw.branch_name, "sha", 160);
  if (sha) {
    if (!/^[A-Za-z0-9_./-]+$/.test(sha) || sha.includes("..")) throw new Error("GITHUB_MCP_INVALID_SHA");
    normalized.sha = sha.replace(/^refs\/heads\//, "");
  }
  const count = integerOption(raw.perPage ?? raw.per_page ?? raw.limit, "per_page", 100);
  if (count !== undefined) normalized.perPage = count;
  const page = integerOption(raw.page, "page", 1000);
  if (page !== undefined) normalized.page = page;

  for (const field of ["author", "path", "since", "until"] as const) {
    const value = optionalString(raw[field], field, field === "path" ? 500 : 160);
    if (value) normalized[field] = value;
  }
  if (raw.fields !== undefined) {
    if (!Array.isArray(raw.fields) || raw.fields.length > 10 ||
      raw.fields.some((item) => typeof item !== "string" || !["sha", "html_url", "commit", "author", "committer"].includes(item))) {
      throw new Error("GITHUB_MCP_INVALID_FIELDS");
    }
    normalized.fields = raw.fields;
  }

  return normalized;
}
