export type GitHubRuntimeReadOperation =
  | "get_repo"
  | "list_tree"
  | "read_file"
  | "compare_refs"
  | "audit_paths";

export type GitHubRuntimeWriteOperation =
  | "create_branch"
  | "upsert_file"
  | "create_pr";

export type GitHubRuntimeOperation = GitHubRuntimeReadOperation | GitHubRuntimeWriteOperation;

export type GitHubRuntimeInput = {
  repository?: string;
  owner?: string;
  repo?: string;
  ref?: string;
  path?: string;
  base?: string;
  head?: string;
  include?: string[];
  exclude?: string[];
  limit?: number;
  branch?: string;
  base_branch?: string;
  target_branch?: string;
  title?: string;
  body?: string;
  message?: string;
  content?: string;
  expected_sha?: string;
};

type GitHubRepo = {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  default_branch: string;
  html_url: string;
  pushed_at: string | null;
  updated_at: string | null;
  description: string | null;
};

type GitHubTreeEntry = {
  path?: string;
  mode?: string;
  type?: "blob" | "tree" | "commit";
  sha?: string;
  size?: number;
  url?: string;
};

type GitHubTreeResponse = {
  sha: string;
  truncated: boolean;
  tree: GitHubTreeEntry[];
};

type GitHubContentResponse = {
  name?: string;
  path?: string;
  sha?: string;
  size?: number;
  encoding?: string;
  content?: string;
  html_url?: string;
};

type GitHubCompareResponse = {
  status: string;
  ahead_by: number;
  behind_by: number;
  total_commits: number;
  html_url: string;
  commits?: Array<{ sha: string; commit?: { message?: string } }>;
  files?: Array<{ filename: string; status: string; additions?: number; deletions?: number; changes?: number }>;
};

function envValue(key: string): string {
  return String(process.env[key] ?? "").trim();
}

export function getGitHubRuntimeToken(): string {
  return envValue("HOCKER_GITHUB_TOKEN") || envValue("GITHUB_TOKEN") || envValue("GH_TOKEN");
}

export function hasGitHubRuntimeToken(): boolean {
  return getGitHubRuntimeToken().length > 0;
}

export function isGitHubWriteOperation(operation: string): operation is GitHubRuntimeWriteOperation {
  return ["create_branch", "upsert_file", "create_pr"].includes(operation);
}

export function isGitHubReadOperation(operation: string): operation is GitHubRuntimeReadOperation {
  return ["get_repo", "list_tree", "read_file", "compare_refs", "audit_paths"].includes(operation);
}

function defaultRepository(): string {
  return envValue("HOCKER_GITHUB_REPO") || envValue("GITHUB_REPOSITORY") || "HockerAGI/hocker.one";
}

function parseRepository(input: GitHubRuntimeInput): { owner: string; repo: string; fullName: string } {
  const raw = input.repository || (input.owner && input.repo ? `${input.owner}/${input.repo}` : defaultRepository());
  const [owner, repo] = String(raw).split("/").map((part) => part.trim()).filter(Boolean);

  if (!owner || !repo) {
    throw new Error("Repositorio inválido. Usa formato owner/repo.");
  }

  return { owner, repo, fullName: `${owner}/${repo}` };
}

function safePath(value: unknown): string {
  const raw = String(value || "").trim().replace(/^\/+/, "");
  if (!raw) throw new Error("Falta path.");
  if (raw.includes("..") || raw.includes("\\")) throw new Error("Path no permitido.");
  return raw;
}

function safeRef(value: unknown, fallback = "main"): string {
  const raw = String(value || fallback).trim();
  if (!raw) return fallback;
  if (raw.includes("\u0000")) throw new Error("Ref inválida.");
  return raw;
}

function encodeSegment(value: string): string {
  return encodeURIComponent(value).replace(/%2F/g, "/");
}

async function githubRequest<T>(endpoint: string, init: RequestInit = {}): Promise<T> {
  const token = getGitHubRuntimeToken();
  if (!token) throw new Error("GitHub no configurado: falta HOCKER_GITHUB_TOKEN, GITHUB_TOKEN o GH_TOKEN.");

  const response = await fetch(`https://api.github.com${endpoint}`, {
    ...init,
    cache: "no-store",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      ...(init.headers || {}),
    },
  });

  const text = await response.text();
  let payload: unknown = null;

  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = { raw: text.slice(0, 800) };
  }

  if (!response.ok) {
    const message = typeof payload === "object" && payload && "message" in payload
      ? String((payload as { message?: unknown }).message)
      : `GitHub HTTP ${response.status}`;

    const error = new Error(message);
    (error as Error & { status?: number; payload?: unknown }).status = response.status;
    (error as Error & { status?: number; payload?: unknown }).payload = payload;
    throw error;
  }

  return payload as T;
}

function trimContent(content: string): { content: string; truncated: boolean; bytes: number } {
  const max = 18000;
  const bytes = Buffer.byteLength(content, "utf8");
  if (bytes <= max) return { content, truncated: false, bytes };
  return { content: content.slice(0, max), truncated: true, bytes };
}

async function getRepo(input: GitHubRuntimeInput) {
  const { owner, repo } = parseRepository(input);
  const data = await githubRequest<GitHubRepo>(`/repos/${owner}/${repo}`);

  return {
    repository: data.full_name,
    private: data.private,
    default_branch: data.default_branch,
    description: data.description,
    html_url: data.html_url,
    pushed_at: data.pushed_at,
    updated_at: data.updated_at,
  };
}

async function listTree(input: GitHubRuntimeInput) {
  const { owner, repo, fullName } = parseRepository(input);
  const ref = safeRef(input.ref || input.head || undefined, "main");
  const requestedPath = String(input.path || "").trim().replace(/^\/+|\/+$/g, "");

  if (requestedPath && (requestedPath.includes("..") || requestedPath.includes(String.fromCharCode(92)))) {
    throw new Error("Path no permitido.");
  }

  const data = await githubRequest<GitHubTreeResponse>(`/repos/${owner}/${repo}/git/trees/${encodeURIComponent(ref)}?recursive=1`);

  const allItems = (data.tree || [])
    .filter((item) => item.path)
    .map((item) => ({ path: item.path, type: item.type, size: item.size ?? null, sha: item.sha ?? null }));

  const pathPrefix = requestedPath.toLowerCase();
  const filtered = pathPrefix
    ? allItems.filter((item) => {
        const itemPath = String(item.path || "").toLowerCase();
        return itemPath === pathPrefix || itemPath.startsWith(`${pathPrefix}/`);
      })
    : allItems;

  const requestedLimit = Math.max(1, Math.min(Number(input.limit || 500), 1200));
  const tree = filtered.slice(0, requestedLimit);

  return {
    repository: fullName,
    ref,
    path: requestedPath || null,
    total_seen: allItems.length,
    filtered_count: filtered.length,
    count: tree.length,
    truncated: Boolean(data.truncated) || filtered.length > tree.length,
    tree,
  };
}

async function readFile(input: GitHubRuntimeInput) {
  const { owner, repo, fullName } = parseRepository(input);
  const ref = safeRef(input.ref, "main");
  const path = safePath(input.path);
  const data = await githubRequest<GitHubContentResponse>(`/repos/${owner}/${repo}/contents/${encodeSegment(path)}?ref=${encodeURIComponent(ref)}`);

  if (!data.content || data.encoding !== "base64") {
    throw new Error("El path no apunta a un archivo de texto legible o GitHub no devolvió contenido base64.");
  }

  const decoded = Buffer.from(data.content.replace(/\n/g, ""), "base64").toString("utf8");
  const trimmed = trimContent(decoded);

  return {
    repository: fullName,
    ref,
    path: data.path || path,
    sha: data.sha || null,
    html_url: data.html_url || null,
    size: data.size ?? trimmed.bytes,
    truncated: trimmed.truncated,
    content: trimmed.content,
  };
}

async function compareRefs(input: GitHubRuntimeInput) {
  const { owner, repo, fullName } = parseRepository(input);
  const base = safeRef(input.base, "main");
  const head = safeRef(input.head || input.ref, "HEAD");
  const data = await githubRequest<GitHubCompareResponse>(`/repos/${owner}/${repo}/compare/${encodeURIComponent(base)}...${encodeURIComponent(head)}`);

  return {
    repository: fullName,
    base,
    head,
    status: data.status,
    ahead_by: data.ahead_by,
    behind_by: data.behind_by,
    total_commits: data.total_commits,
    html_url: data.html_url,
    commits: (data.commits || []).slice(0, 20).map((commit) => ({ sha: commit.sha, message: commit.commit?.message || "" })),
    files: (data.files || []).slice(0, 80).map((file) => ({
      filename: file.filename,
      status: file.status,
      additions: file.additions ?? 0,
      deletions: file.deletions ?? 0,
      changes: file.changes ?? 0,
    })),
  };
}

async function auditPaths(input: GitHubRuntimeInput) {
  const { owner, repo, fullName } = parseRepository(input);
  const ref = safeRef(input.ref || input.head || undefined, "main");
  const data = await githubRequest<GitHubTreeResponse>(`/repos/${owner}/${repo}/git/trees/${encodeURIComponent(ref)}?recursive=1`);

  const include = (input.include || []).map((item) => item.toLowerCase().replace(/^\/+|\/+$/g, "")).filter(Boolean);
  const exclude = (input.exclude || ["node_modules", ".next", "dist", "build"]).map((item) => item.toLowerCase().replace(/^\/+|\/+$/g, "")).filter(Boolean);

  const allItems = (data.tree || [])
    .filter((item) => item.path)
    .map((item) => ({ path: item.path, type: item.type, size: item.size ?? null, sha: item.sha ?? null }));

  const matches = allItems.filter((item) => {
    const path = String(item.path || "").toLowerCase();
    const includeOk = include.length === 0 || include.some((term) => path === term || path.startsWith(`${term}/`) || path.includes(term));
    const excludeOk = !exclude.some((term) => path === term || path.startsWith(`${term}/`) || path.includes(term));
    return includeOk && excludeOk;
  });

  const requestedLimit = Math.max(1, Math.min(Number(input.limit || 200), 500));
  const paths = matches.slice(0, requestedLimit);

  return {
    repository: fullName,
    ref,
    total_seen: allItems.length,
    matched_total: matches.length,
    count: paths.length,
    truncated: Boolean(data.truncated) || matches.length > paths.length,
    include,
    exclude,
    paths,
  };
}


type GitHubWritePlanRisk = "medium" | "high";

function safeBranchName(value: unknown, fallback: string): string {
  const raw = String(value || fallback).trim();

  if (!raw) throw new Error("Falta branch.");
  if (raw.length > 160) throw new Error("Branch demasiado largo.");
  if (
    raw.includes("..") ||
    raw.startsWith("/") ||
    raw.endsWith("/") ||
    raw.includes(String.fromCharCode(92)) ||
    raw.endsWith(".lock") ||
    /[\s~^:?*[\]\u0000]/.test(raw)
  ) {
    throw new Error("Branch no permitido.");
  }

  return raw;
}

function safeOptionalText(value: unknown, fallback = ""): string {
  return String(value ?? fallback).trim();
}

function contentStats(content: unknown): { present: boolean; bytes: number; lines: number } {
  const value = typeof content === "string" ? content : "";
  return {
    present: value.length > 0,
    bytes: Buffer.byteLength(value, "utf8"),
    lines: value.length ? value.split(/\r\n|\r|\n/).length : 0,
  };
}

function buildRollbackPlan(operation: GitHubRuntimeWriteOperation, path: string | null) {
  if (operation === "create_branch") {
    return {
      strategy: "delete_branch_if_no_pr",
      steps: [
        "Si la rama fue creada por error y no tiene PR activo, eliminar la rama propuesta.",
        "Si existe PR activo, cerrar PR antes de eliminar rama.",
      ],
    };
  }

  if (operation === "upsert_file") {
    return {
      strategy: "restore_previous_blob_or_revert_commit",
      path,
      steps: [
        "Leer SHA previo del archivo antes de ejecutar escritura.",
        "Si el archivo existía, restaurar contenido anterior en un commit de reversa.",
        "Si el archivo no existía, eliminar el archivo creado en un commit de reversa.",
      ],
    };
  }

  return {
    strategy: "close_pr_or_revert_branch",
    steps: [
      "Si el PR no debe continuar, cerrarlo sin merge.",
      "Si ya fue mergeado, generar commit de reversa con referencia al PR original.",
    ],
  };
}

export function createGitHubWriteGatePlan(operation: GitHubRuntimeWriteOperation, input: GitHubRuntimeInput) {
  const { fullName } = parseRepository(input);
  const base = safeRef(input.base || input.base_branch || input.ref || "main", "main");
  const defaultBranch = `nova/${operation}-${Date.now()}`;
  const targetBranch = safeBranchName(input.branch || input.target_branch || input.head || defaultBranch, defaultBranch);
  const missing_fields: string[] = [];
  const risk_level: GitHubWritePlanRisk = operation === "create_pr" ? "medium" : "high";
  let path: string | null = null;
  let title = safeOptionalText(input.title);
  let message = safeOptionalText(input.message);
  const stats = contentStats(input.content);

  if (operation === "upsert_file") {
    try {
      path = safePath(input.path);
    } catch {
      missing_fields.push("path");
    }

    if (!stats.present) missing_fields.push("content");
    if (!message) missing_fields.push("message");
  }

  if (operation === "create_pr") {
    if (!title) missing_fields.push("title");
    title = title || "NOVA proposed change";
  }

  if (operation === "create_branch" && !message) {
    message = `Create ${targetBranch}`;
  }

  const steps =
    operation === "create_branch"
      ? [
          "Validar repositorio y rama base.",
          "Crear rama nueva desde base solo después de aprobación owner.",
          "Registrar resultado en auditoría.",
        ]
      : operation === "upsert_file"
        ? [
            "Validar path seguro y tamaño de contenido.",
            "Leer SHA previo si el archivo existe.",
            "Aplicar cambio únicamente en rama no-main aprobada.",
            "Registrar diff, SHA previo y SHA nuevo en auditoría.",
          ]
        : [
            "Validar head/base antes de abrir PR.",
            "Crear PR draft o listo según política owner.",
            "Adjuntar resumen, rollback y evidencia de validación.",
          ];

  return {
    valid: missing_fields.length === 0,
    mode: "owner_gate",
    operation,
    repository: fullName,
    base,
    target_branch: targetBranch,
    path,
    title: title || null,
    message: message || null,
    risk_level,
    required_fields: missing_fields,
    dry_run: true,
    execute_now: false,
    owner_gate_required: true,
    required_approval_role: "owner",
    content_preview: {
      present: stats.present,
      bytes: stats.bytes,
      lines: stats.lines,
      content_returned: false,
    },
    steps,
    rollback_plan: buildRollbackPlan(operation, path),
    audit_chain: {
      required: true,
      records: ["agi_action_queue", "github_operation", "owner_decision", "execution_result"],
    },
    next_step: missing_fields.length
      ? `Completar campos requeridos: ${missing_fields.join(", ")}.`
      : "Enviar a cola segura. No ejecutar escritura hasta aprobación owner.",
  };
}


export async function executeGitHubReadOperation(operation: GitHubRuntimeReadOperation, input: GitHubRuntimeInput) {
  switch (operation) {
    case "get_repo":
      return getRepo(input);
    case "list_tree":
      return listTree(input);
    case "read_file":
      return readFile(input);
    case "compare_refs":
      return compareRefs(input);
    case "audit_paths":
      return auditPaths(input);
    default:
      throw new Error("Operación GitHub no soportada.");
  }
}

export function getGitHubExecutorStatus() {
  return {
    ok: hasGitHubRuntimeToken(),
    provider: "GitHub",
    token_present: hasGitHubRuntimeToken(),
    accepted_env: ["HOCKER_GITHUB_TOKEN", "GITHUB_TOKEN", "GH_TOKEN"],
    default_repository: defaultRepository(),
    read_operations: ["get_repo", "list_tree", "read_file", "compare_refs", "audit_paths"],
    write_operations_guarded: ["create_branch", "upsert_file", "create_pr"],
    safety: {
      read_operations_execute_now: true,
      write_operations_execute_now: false,
      write_operations_policy: "Owner Gate + dry-run + approval queue antes de tocar GitHub.",
      write_gate_phase: "12.7B-2",
      write_plan_enabled: true,
    },
  };
}
