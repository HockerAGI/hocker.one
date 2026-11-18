import { createSign } from "node:crypto";

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
let pendingToken: Promise<string> | null = null;

function env(name: string): string {
  return String(process.env[name] ?? "").trim();
}

export function getStaticGitHubToken(): string {
  return env("HOCKER_GITHUB_TOKEN") || env("GITHUB_TOKEN") || env("GH_TOKEN");
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

  const rawRepos = env("HOCKER_GITHUB_APP_REPOSITORIES");
  const repos = rawRepos ? rawRepos.split(",").map((x) => x.trim()) : [...DEFAULT_REPOS];
  const valid = repos.length > 0 && repos.length <= 40 && repos.every(
    (repo) => /^[A-Za-z0-9_.-]{1,100}$/.test(repo) && repo !== "." && repo !== "..",
  ) && new Set(repos).size === repos.length;
  if (!valid) return null;

  return { appId, installationId, privateKey, repositories: repos };
}

export function getGitHubRuntimeIdentityKind(): GitHubRuntimeIdentity {
  if (getStaticGitHubToken()) return "pat";
  return appIdentityConfig() ? "github_app" : "missing";
}

export function isGitHubRuntimeIdentityConfigured(): boolean {
  return getGitHubRuntimeIdentityKind() !== "missing";
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
        permissions: { contents: "write", pull_requests: "write", metadata: "read" },
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
  const expiry = typeof expiresAt === "string" ? Date.parse(expiresAt) : NaN;
  if (typeof token !== "string" || token.length < 24 ||
      !Number.isFinite(expiry) || expiry <= Date.now() + APP_TOKEN_REFRESH_MARGIN_MS) {
    throw new Error("GITHUB_APP_INSTALLATION_TOKEN_RESPONSE_INVALID");
  }

  const identity = config.appId + ":" + config.installationId + ":" + config.repositories.join(",");
  cachedToken = { token, validUntil: expiry - APP_TOKEN_REFRESH_MARGIN_MS, identity };
  return token;
}

/** Returns a short-lived GitHub installation token or the existing PAT. */
export async function getGitHubRuntimeAccessToken(): Promise<string> {
  const pat = getStaticGitHubToken();
  if (pat) return pat;
  const config = appIdentityConfig();
  if (!config) throw new Error("GITHUB_RUNTIME_IDENTITY_NOT_CONFIGURED");

  const identity = config.appId + ":" + config.installationId + ":" + config.repositories.join(",");
  if (cachedToken?.identity === identity && cachedToken.validUntil > Date.now()) {
    return cachedToken.token;
  }
  // An install ID/repository allowlist change must never reuse a previous
  // configuration's pending promise or cached access token.
  if (!pendingToken) {
    pendingToken = mintAppInstallationToken(config).finally(() => { pendingToken = null; });
  }
  return pendingToken;
}

export function requiresStaticGitHubIdentityForRepositoryCreation(): boolean {
  return getStaticGitHubToken().length > 0;
}
