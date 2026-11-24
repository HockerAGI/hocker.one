import { createHash, createPrivateKey, createSign } from "node:crypto";

/**
 * Server-side GitHub identity for NOVA/AGIs.
 * A pre-existing, explicitly configured PAT takes precedence. A GitHub App
 * alternative mints short-lived, repo-scoped installation tokens.
 *
 * This module never accepts credentials from clients, queues or API arguments.
 * Do not use the installation token to create organization repositories:
 * the token is intentionally restricted to existing, approved repositories.
 */
export type GitHubRuntimeIdentity = "pat" | "github_app" | "missing";

const DEFAULT_REPOS = ["hocker.one", "nova.agi", "hocker-node-agent"] as const;
const APP_TOKEN_REFRESH_MARGIN_MS = 5 * 60_000;
let cachedToken: { token: string; validUntil: number; identity: string } | null = null;
let pendingToken: { identity: string; promise: Promise<string> } | null = null;

function env(name: string): string {
  return String(process.env[name] ?? "").trim();
}

export function getStaticGitHubToken(): string {
  return env("HOCKER_GITHUB_TOKEN") || env("GITHUB_TOKEN") || env("GH_TOKEN");
}

/** Scoped to repository creation; never overrides the App identity for normal edits. */
export function getGitHubRepositoryCreationAccessToken(): string {
  return env("HOCKER_GITHUB_REPO_CREATE_TOKEN") || getStaticGitHubToken();
}

function appIdentityConfig() {
  const appId = env("HOCKER_GITHUB_APP_ID");
  const installationId = env("HOCKER_GITHUB_APP_INSTALLATION_ID");
  const privateKey = env("HOCKER_GITHUB_APP_PRIVATE_KEY").replace(/\\n/g, "\n");
  if (!/^[1-9][0-9]{0,18}$/.test(appId) ||
      !/^[1-9][0-9]{0,18}$/.test(installationId) ||
      !/^-----BEGIN (?:RSA )?PRIVATE KEY-----/.test(privateKey) ||
      !privateKey.includes("-----END ") ||
      privateKey.length > 24000) return null;
  try {
    const key = createPrivateKey(privateKey);
    if (key.asymmetricKeyType !== "rsa" ||
        (key.asymmetricKeyDetails?.modulusLength ?? 0) < 2048) return null;
  } catch {
    // Header-shaped or truncated PEMs must never enable AGI tool grants.
    return null;
  }

  const rawRepos = env("HOCKER_GITHUB_APP_REPOSITORIES");
  const repos = rawRepos ? rawRepos.split(",").map((x) => x.trim()) : [...DEFAULT_REPOS];
  const valid = repos.length > 0 && repos.length <= 40 && repos.every(
    (repo) => /^[A-Za-z0-9_.-]{1,100}$/.test(repo) && repo !== "." && repo !== "..",
  ) && new Set(repos).size === repos.length;
  if (!valid) return null;

  return { appId, installationId, privateKey, repositories: repos };
}

/** Explicit App preference is opt-in and never silently falls back to PAT on failure. */
export function isGitHubAppPreferred(): boolean {
  return env("HOCKER_GITHUB_IDENTITY_MODE") === "github_app";
}

export function getActiveStaticGitHubTokenVariable(): string | null {
  for (const key of ["HOCKER_GITHUB_TOKEN", "GITHUB_TOKEN", "GH_TOKEN"]) {
    if (env(key)) return key;
  }
  return null;
}

export function getGitHubRuntimeIdentityKind(): GitHubRuntimeIdentity {
  if (isGitHubAppPreferred()) return appIdentityConfig() ? "github_app" : "missing";
  if (getStaticGitHubToken()) return "pat";
  return appIdentityConfig() ? "github_app" : "missing";
}

export function isGitHubRuntimeIdentityConfigured(): boolean {
  return getGitHubRuntimeIdentityKind() !== "missing";
}

/** Safe repository names for authenticated readiness probes. Never reveals credentials. */
export function getGitHubRuntimeReadProbeRepositoryNames(): string[] {
  const identity = getGitHubRuntimeIdentityKind();
  if (identity === "github_app") return [...(appIdentityConfig()?.repositories ?? [])];
  if (identity === "pat") return [...DEFAULT_REPOS];
  return [];
}

function signedAppJwt(appId: string, privateKey: string): string {
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
  const claims = Buffer.from(JSON.stringify({ iss: appId, iat: now - 30, exp: now + 540 })).toString("base64url");
  const body = header + "." + claims;
  const signer = createSign("RSA-SHA256");
  signer.update(body);
  signer.end();
  return body + "." + signer.sign(privateKey).toString("base64url");
}

async function mintAppInstallationToken(config: NonNullable<ReturnType<typeof appIdentityConfig>>): Promise<string> {
  const jwt = signedAppJwt(config.appId, config.privateKey);
  // GitHub permits narrowing an installation token's repository set and
  // permissions. This is limited to existing repositories and cannot grant
  // capabilities the GitHub App does not already have.
  const response = await fetch(
    "https://api.github.com/app/installations/" + config.installationId + "/access_tokens",
    {
      method: "POST",
      cache: "no-store",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: "Bearer " + jwt,
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        repositories: config.repositories,
        permissions: { contents: "write", pull_requests: "write" },
      }),
      signal: AbortSignal.timeout(10000),
    },
  );
  // Never include upstream token, errors, payload or JWT in logs/exceptions.
  if (response.status !== 201) throw new Error("GITHUB_APP_INSTALLATION_TOKEN_UNAVAILABLE");
  let data: unknown = null;
  try { data = await response.json(); } catch {
    throw new Error("GITHUB_APP_INSTALLATION_TOKEN_RESPONSE_INVALID");
  }
  const result = data && typeof data === "object" ? data as Record<string, unknown> : {};
  const token = result.token;
  const expiresAt = result.expires_at;
  const granted = result.permissions && typeof result.permissions === "object"
    ? result.permissions as Record<string, unknown> : {};
  if (granted.contents !== "write" || granted.pull_requests !== "write") {
    throw new Error("GITHUB_APP_INSTALLATION_PERMISSIONS_NOT_VERIFIED");
  }
  const expiry = typeof expiresAt === "string" ? Date.parse(expiresAt) : NaN;
  if (typeof token !== "string" || token.length < 24 ||
      !Number.isFinite(expiry) || expiry <= Date.now() + APP_TOKEN_REFRESH_MARGIN_MS) {
    throw new Error("GITHUB_APP_INSTALLATION_TOKEN_RESPONSE_INVALID");
  }

  const identity = appIdentityCacheKey(config);
  cachedToken = { token, validUntil: expiry - APP_TOKEN_REFRESH_MARGIN_MS, identity };
  return token;
}

/** Returns a short-lived GitHub installation token or the existing PAT. */
function appIdentityCacheKey(config: NonNullable<ReturnType<typeof appIdentityConfig>>): string {
  return createHash("sha256").update(JSON.stringify([
    config.appId, config.installationId, config.repositories, config.privateKey,
  ])).digest("hex");
}

export async function getGitHubRuntimeAccessToken(): Promise<string> {
  const identityKind = getGitHubRuntimeIdentityKind();
  if (identityKind === "pat") return getStaticGitHubToken();
  const config = identityKind === "github_app" ? appIdentityConfig() : null;
  if (!config) throw new Error("GITHUB_RUNTIME_IDENTITY_NOT_CONFIGURED");

  const identity = appIdentityCacheKey(config);
  if (cachedToken?.identity === identity && cachedToken.validUntil > Date.now()) {
    return cachedToken.token;
  }
  // An install ID/repository allowlist change must never reuse a previous
  // configuration's pending promise or cached access token.
  if (!pendingToken || pendingToken.identity !== identity) {
    const pending = { identity, promise: Promise.resolve("") };
    pending.promise = mintAppInstallationToken(config).finally(() => {
      if (pendingToken === pending) pendingToken = null;
    });
    pendingToken = pending;
  }
  return pendingToken.promise;
}

export function requiresStaticGitHubIdentityForRepositoryCreation(): boolean {
  return getGitHubRepositoryCreationAccessToken().length > 0;
}


export type GitHubAppReadinessProbe = {
  configured: boolean;
  verified_read: boolean;
  repositories_checked: string[];
  scope_complete: boolean;
  state: "app_config_missing" | "scope_not_approved" | "installation_token_unavailable" |
    "installation_permissions_unverified" | "repository_read_unverified" | "verified_read" | "provider_unavailable";
};

/**
 * Independent GitHub App probe. Never uses a PAT, never creates repository
 * changes, and only requests contents:read for approved existing repos.
 * Called exclusively behind the Owner AAL2 gate in Production.
 */
export async function probeGitHubAppReadOnly(): Promise<GitHubAppReadinessProbe> {
  const config = appIdentityConfig();
  const approved = [...DEFAULT_REPOS];
  if (!config) {
    return { configured: false, verified_read: false, repositories_checked: [],
      scope_complete: false, state: "app_config_missing" };
  }
  if (!config.repositories.every((name) => approved.includes(name as typeof DEFAULT_REPOS[number]))) {
    return { configured: true, verified_read: false, repositories_checked: [],
      scope_complete: false, state: "scope_not_approved" };
  }
  const scopeComplete = approved.every((name) => config.repositories.includes(name));
  const repositories = config.repositories.map((name) => "HockerAGI/" + name);
  const result = (state: GitHubAppReadinessProbe["state"], ok = false): GitHubAppReadinessProbe =>
    ({ configured: true, verified_read: ok, repositories_checked: ok ? repositories : [],
      scope_complete: scopeComplete, state });
  try {
    const jwt = signedAppJwt(config.appId, config.privateKey);
    const issued = await fetch(
      "https://api.github.com/app/installations/" + config.installationId + "/access_tokens",
      {
        method: "POST", cache: "no-store",
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: "Bearer " + jwt,
          "X-GitHub-Api-Version": "2022-11-28",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ repositories: config.repositories, permissions: { contents: "read" } }),
        signal: AbortSignal.timeout(8000),
      },
    );
    if (issued.status !== 201) return result("installation_token_unavailable");
    const payload: unknown = await issued.json();
    const parsed = payload && typeof payload === "object" ? payload as Record<string, unknown> : {};
    const permissions = parsed.permissions && typeof parsed.permissions === "object"
      ? parsed.permissions as Record<string, unknown> : {};
    if (permissions.contents !== "read" || permissions.pull_requests === "write") {
      return result("installation_permissions_unverified");
    }
    const token = parsed.token;
    const expiry = typeof parsed.expires_at === "string" ? Date.parse(parsed.expires_at) : NaN;
    if (typeof token !== "string" || token.length < 24 ||
        !Number.isFinite(expiry) || expiry <= Date.now() + 60_000) {
      return result("installation_token_unavailable");
    }
    const checked = await Promise.all(repositories.map(async (repository) => {
      const response = await fetch(
        "https://api.github.com/repos/" + repository.split("/").map(encodeURIComponent).join("/"),
        {
          method: "GET", cache: "no-store",
          headers: {
            Accept: "application/vnd.github+json",
            Authorization: "Bearer " + token,
            "X-GitHub-Api-Version": "2022-11-28",
          },
          signal: AbortSignal.timeout(8000),
        },
      );
      if (response.status !== 200) return false;
      const body: unknown = await response.json();
      const found = body && typeof body === "object" ? (body as Record<string, unknown>).full_name : null;
      return typeof found === "string" && found.toLowerCase() === repository.toLowerCase();
    }));
    return checked.every(Boolean) && checked.length > 0
      ? result("verified_read", true)
      : result("repository_read_unverified");
  } catch {
    // Neither credential nor upstream provider response is ever returned/logged.
    return result("provider_unavailable");
  }
}
