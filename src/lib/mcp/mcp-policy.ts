import { getMcpRegistry } from "@/lib/mcp/mcp-registry";

export const MCP_PROVIDER_IDS = ["supabase", "vercel", "github", "openai", "base44"] as const;
export type McpProviderId = string;
export type BuiltinMcpProviderId = (typeof MCP_PROVIDER_IDS)[number];

const PROVIDERS = new Set<string>(MCP_PROVIDER_IDS);
const DYNAMIC_PROVIDER_ID = /^[a-z0-9][a-z0-9_-]{1,48}$/i;
export function isKnownMcpProviderId(provider: string): boolean {
  const clean = String(provider ?? "").trim().toLowerCase();
  return PROVIDERS.has(clean) || DYNAMIC_PROVIDER_ID.test(clean);
}
const SENSITIVE_KEY = /(authorization|cookie|password|passwd|secret|token|api[_-]?key|private[_-]?key)/i;
const SAFE_TOOL_NAME = /^[a-z0-9_.:-]+$/i;
const SAFE_REPOSITORY_PART = /^[a-z0-9_.-]+$/i;
const SAFE_GITHUB_PATH = /^[a-z0-9_./@+()\[\] -]+$/i;
const SENSITIVE_GITHUB_READ_PATH = /(^|\/)(?:\.env(?:\.[^/]*)?|\.npmrc|\.pypirc|\.netrc|id_rsa|id_ed25519|credentials?|secrets?|[^/]*\.(?:pem|key|p12|pfx|jks|keystore)|[^/]*service[-_]?account[^/]*\.json)(?:\/|$)/i;
const MAX_ARGS_BYTES = 16 * 1024;

const DEFAULT_GITHUB_REPOSITORIES = [
  "HockerAGI/hocker.one",
  "HockerAGI/nova.agi",
  "HockerAGI/hocker-node-agent",
  "HockerAGI/chido.casino",
  "HockerAGI/hocker.agi",
  "HockerAGI/hocker.ads",
  "HockerAGI/chido.lab",
  "HockerAGI/chido.games",
  "HockerAGI/punto.g",
] as const;

const GITHUB_MUTATION_TOOLS = new Set([
  "create_branch",
  "create_file",
  "update_file",
  "create_or_update_file",
  "create_pull_request",
  "update_pull_request",
  "create_issue",
  "update_issue",
  "add_comment_to_issue",
  "add_issue_labels",
  "request_pull_request_reviewers",
  "mark_pull_request_ready_for_review",
  "repo.create_branch",
  "repo.create_commit",
  "repo.create_pr",
  "repo.create_issue",
]);

const GITHUB_FILE_TOOLS = new Set([
  "create_file",
  "update_file",
  "create_or_update_file",
  "repo.create_commit",
]);

const GITHUB_ALLOWED_PATH_PREFIXES = [
  "src/",
  "app/",
  "docs/",
  "scripts/",
  "tests/",
  "public/",
  "android/",
  "supabase/migrations/",
  ".github/workflows/",
  "package.json",
  "package-lock.json",
  "next.config.js",
  "next.config.ts",
  "tsconfig.json",
  "Dockerfile",
  "README.md",
];

const READ_ONLY_TOOLS: Record<McpProviderId, RegExp[]> = {
  supabase: [
    /^(list_tables|get_table_schema|search_docs|list_functions|get_logs)$/,
    /^(list_|get_|search_|read_|inspect_|describe_)/,
  ],
  github: [/^(list_|get_|read_|search_)/],
  vercel: [/^(list_|get_|read_|inspect_)/],
  openai: [/^(list_models|moderate|create_embedding)$/],
  base44: [/^(list_apps|get_app_status)$/],
};

export type ValidatedMcpDraft = {
  draft_id: string;
  provider: McpProviderId;
  tool: string;
  args: Record<string, unknown>;
  qualified_name: string;
};

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function hasSensitiveKey(value: unknown, depth = 0): boolean {
  if (depth > 8) return true;
  if (Array.isArray(value)) return value.some((item) => hasSensitiveKey(item, depth + 1));
  if (!value || typeof value !== "object") return false;

  return Object.entries(value as Record<string, unknown>).some(
    ([key, child]) => SENSITIVE_KEY.test(key) || hasSensitiveKey(child, depth + 1),
  );
}

function envList(name: string, fallback: readonly string[]): string[] {
  const value = String(process.env[name] ?? "").trim();
  return (value ? value.split(",") : [...fallback])
    .map((item) => item.trim())
    .filter(Boolean);
}

function allowedGithubRepositories(): Set<string> {
  return new Set(
    envList("HOCKER_GITHUB_ALLOWED_REPOS", DEFAULT_GITHUB_REPOSITORIES)
      .map((item) => item.toLowerCase()),
  );
}

function githubRepository(args: Record<string, unknown>): string {
  const explicit = String(
    args.repository_full_name ??
      args.repo_full_name ??
      args.repository ??
      "",
  ).trim();

  const combined = explicit || (
    args.owner && args.repo
      ? `${String(args.owner).trim()}/${String(args.repo).trim()}`
      : ""
  );

  const parts = combined.split("/").filter(Boolean);
  if (parts.length !== 2 || !parts.every((part) => SAFE_REPOSITORY_PART.test(part))) {
    throw new Error("La mutación GitHub requiere un repositorio explícito owner/repo.");
  }

  return `${parts[0]}/${parts[1]}`;
}

function githubReadRepository(args: Record<string, unknown>): string {
  const explicit = String(
    args.repository_full_name ??
      args.repo_full_name ??
      args.repository ??
      "",
  ).trim();
  const fallbackOwner = String(process.env.GITHUB_OWNER ?? "HockerAGI").trim();
  const fallbackRepo = String(process.env.GITHUB_REPO ?? "hocker.one").trim();
  const combined = explicit || (
    args.owner && args.repo
      ? `${String(args.owner).trim()}/${String(args.repo).trim()}`
      : `${fallbackOwner}/${fallbackRepo}`
  );

  const parts = combined.split("/").filter(Boolean);
  if (parts.length !== 2 || !parts.every((part) => SAFE_REPOSITORY_PART.test(part))) {
    throw new Error("Repositorio GitHub inválido para lectura AGI.");
  }
  return `${parts[0]}/${parts[1]}`;
}

function assertSafeGitHubBranch(value: unknown, field: string): void {
  const raw = String(value ?? "").trim();
  if (!raw) throw new Error(`La mutación GitHub requiere ${field}.`);

  const branch = raw.includes(":") ? raw.slice(raw.lastIndexOf(":") + 1) : raw;
  const normalized = branch.toLowerCase();

  if (
    branch.length > 160 ||
    branch.includes("..") ||
    branch.startsWith("/") ||
    branch.endsWith("/") ||
    branch.includes("\\") ||
    branch.endsWith(".lock") ||
    /[\s~^?*[\]\u0000]/.test(branch)
  ) {
    throw new Error(`Rama GitHub inválida en ${field}.`);
  }

  if (["main", "master", "production", "prod"].includes(normalized)) {
    throw new Error("La escritura directa a una rama principal está bloqueada.");
  }
}

function assertSafeGitHubPath(value: unknown): void {
  const path = String(value ?? "").trim().replace(/^\/+/, "");
  if (!path || path.length > 500 || !SAFE_GITHUB_PATH.test(path)) {
    throw new Error("Path GitHub inválido.");
  }
  if (path.includes("..") || path.includes("\\") || path.startsWith(".git/")) {
    throw new Error("Path GitHub fuera de política.");
  }
  if (/(^|\/)(\.env[^/]*|.*\.(pem|key|p12|pfx|jks|keystore))$/i.test(path)) {
    throw new Error("Path sensible bloqueado por Owner Gate.");
  }

  const allowed = envList("HOCKER_GITHUB_ALLOWED_PATH_PREFIXES", GITHUB_ALLOWED_PATH_PREFIXES);
  if (!allowed.some((prefix) => path === prefix || path.startsWith(prefix))) {
    throw new Error(`Path fuera de allowlist GitHub: ${path}`);
  }
}

function assertSafeGitHubReadPath(value: unknown): void {
  if (value === undefined || value === null || String(value).trim() === "") return;
  const path = String(value).trim().replace(/^\/+/, "");
  if (!path || path.length > 500 || !SAFE_GITHUB_PATH.test(path)) {
    throw new Error("Path GitHub inválido para lectura AGI.");
  }
  if (path.includes("..") || path.includes("\\") || path.startsWith(".git/")) {
    throw new Error("Path GitHub fuera de política de lectura AGI.");
  }
  if (SENSITIVE_GITHUB_READ_PATH.test(path)) {
    throw new Error("Path sensible bloqueado para lectura AGI.");
  }
}

function assertGitHubMutationPolicy(tool: string, args: Record<string, unknown>): void {
  if (!GITHUB_MUTATION_TOOLS.has(tool)) {
    throw new Error(`Mutación GitHub no permitida por Owner Gate: ${tool}`);
  }

  const repository = githubRepository(args);
  if (!allowedGithubRepositories().has(repository.toLowerCase())) {
    throw new Error(`Repositorio GitHub fuera de allowlist: ${repository}`);
  }

  if (GITHUB_FILE_TOOLS.has(tool)) {
    assertSafeGitHubPath(args.path);
    assertSafeGitHubBranch(
      args.branch ?? args.branch_name ?? args.target_branch ?? args.head_branch,
      "branch",
    );
  }

  if (tool === "create_branch" || tool === "repo.create_branch") {
    assertSafeGitHubBranch(args.branch ?? args.branch_name, "branch");
  }

  if (tool === "create_pull_request" || tool === "repo.create_pr") {
    assertSafeGitHubBranch(
      args.head ?? args.head_branch ?? args.branch ?? args.target_branch,
      "head",
    );
  }
}

export function isReadOnlyMcpTool(provider: McpProviderId, tool: string): boolean {
  const clean = String(tool || "").trim();
  const builtin = READ_ONLY_TOOLS[provider as BuiltinMcpProviderId];
  if (builtin) return builtin.some((pattern) => pattern.test(clean));
  // Dynamic MCP tools are read-only only when their tool name explicitly
  // matches the generic read contract. Everything else remains Owner Gate.
  return /^(get_|list_|read_|search_|inspect_|describe_|status|ping|health|metadata)/i.test(clean);
}

export function assertMcpReadToolPolicy(
  provider: McpProviderId,
  tool: string,
  rawArgs: Record<string, unknown>,
): void {
  const args = asRecord(rawArgs);
  if (!isReadOnlyMcpTool(provider, tool)) {
    throw new Error("Herramienta MCP no clasificada como lectura.");
  }
  if (hasSensitiveKey(args)) {
    throw new Error("Argumentos MCP de lectura contienen credenciales o secretos.");
  }
  if (Buffer.byteLength(JSON.stringify(args), "utf8") > MAX_ARGS_BYTES) {
    throw new Error("Argumentos MCP de lectura demasiado grandes.");
  }

  if (provider === "github") {
    const repository = githubReadRepository(args);
    if (!allowedGithubRepositories().has(repository.toLowerCase())) {
      throw new Error(`Repositorio GitHub fuera de allowlist de lectura: ${repository}`);
    }
    assertSafeGitHubReadPath(args.path);
  }
}

export function validateDeferredMcpDraft(raw: unknown): ValidatedMcpDraft {
  const draft = asRecord(raw);
  const provider = String(draft.provider ?? "").trim().toLowerCase();
  const tool = String(draft.tool ?? "").trim();
  const actionType = String(draft.action_type ?? "");
  const toolKey = String(draft.tool_key ?? "");
  const requiresApproval = draft.requires_approval === true;
  const target = String(draft.execution_target ?? "");
  const args = asRecord(draft.args);

  if (!isKnownMcpProviderId(provider)) throw new Error("Proveedor MCP no permitido.");
  if (!tool || tool.length > 160 || !SAFE_TOOL_NAME.test(tool)) throw new Error("Herramienta MCP inválida.");
  if (actionType !== "mcp.execute" || toolKey !== "mcp") throw new Error("Borrador MCP con contrato inválido.");
  if (!requiresApproval || target !== "hocker.one.owner-gate") throw new Error("Borrador MCP fuera del Owner Gate.");
  if (hasSensitiveKey(args)) throw new Error("Argumentos MCP contienen secretos o credenciales.");
  if (Buffer.byteLength(JSON.stringify(args), "utf8") > MAX_ARGS_BYTES) throw new Error("Argumentos MCP demasiado grandes.");

  if (provider === "github") {
    assertGitHubMutationPolicy(tool, args);
  }

  return {
    draft_id: String(draft.draft_id ?? crypto.randomUUID()),
    provider: provider as McpProviderId,
    tool,
    args,
    qualified_name: `${provider}.${tool}`,
  };
}

export async function assertMcpToolAvailable(provider: McpProviderId, tool: string): Promise<void> {
  const registry = getMcpRegistry();
  if (!registry.isInitialized) await registry.initializeAll();

  const status = registry.getStatus();
  const providerState = status.providers.find((item) => item.id === provider);
  const toolExists = (status.tools[provider] ?? []).some((item) => item.name === tool);

  if (!providerState?.configured) throw new Error(`La integración ${provider} no está configurada.`);
  if (!providerState.connected) throw new Error(`La integración ${provider} no está conectada.`);
  if (!toolExists) throw new Error(`La herramienta ${provider}.${tool} no existe en el registro conectado.`);
}

export async function executeValidatedMcpDraft(draft: ValidatedMcpDraft): Promise<unknown> {
  await assertMcpToolAvailable(draft.provider, draft.tool);

  if (isReadOnlyMcpTool(draft.provider, draft.tool)) {
    throw new Error("Una herramienta de lectura no necesita ejecución desde una cola de escritura.");
  }

  const registry = getMcpRegistry();
  return registry.executeTool(draft.provider, draft.tool, draft.args);
}
