import { randomUUID } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getGitHubRuntimeToken } from "@/lib/github-runtime-executor";

type JsonRecord = Record<string, unknown>;

export type AgiActionQueueRow = {
  id: string;
  project_id: string;
  agi_id: string;
  tool_key: string | null;
  action_type: string;
  title: string;
  payload: JsonRecord;
  risk_level: string;
  dry_run: boolean;
  requires_approval: boolean;
  status: string;
  created_by: string | null;
  approved_by?: string | null;
  rejected_by?: string | null;
  executed_by?: string | null;
  approval_note?: string | null;
  rejection_note?: string | null;
  execution_result?: JsonRecord | null;
  execution_error?: string | null;
  rollback_plan?: JsonRecord | null;
  approved_at?: string | null;
  rejected_at?: string | null;
  executed_at?: string | null;
  idempotency_key?: string | null;
  trace_id?: string | null;
  request_id?: string | null;
  execution_state?: string | null;
  dead_letter_reason?: string | null;
  dead_letter_at?: string | null;
  next_attempt_at?: string | null;
  locked_at?: string | null;
  lock_owner?: string | null;
  attempt_count?: number | null;
  max_attempts?: number | null;
  last_error?: string | null;
  created_at: string;
  updated_at?: string | null;
};

type GitHubRefResponse = { ref: string; object: { sha: string; type: string; url: string } };
type GitHubContentResponse = { sha?: string; path?: string; html_url?: string };
type GitHubPutContentResponse = {
  content?: { name?: string; path?: string; sha?: string; html_url?: string };
  commit?: { sha?: string; html_url?: string };
};
type GitHubPullResponse = {
  number: number;
  state: string;
  draft?: boolean;
  html_url: string;
  head?: { ref?: string; sha?: string };
  base?: { ref?: string; sha?: string };
};


function githubExecutionMode(): "real" | "mock" {
  const raw = String(
    process.env.HOCKER_GITHUB_EXECUTION_MODE ||
      process.env.GITHUB_EXECUTION_MODE ||
      "real",
  )
    .trim()
    .toLowerCase();

  return raw === "mock" ? "mock" : "real";
}

function isMockedGithubBoundary(): boolean {
  return githubExecutionMode() === "mock";
}

function mockedGithubResult(operation: string, payload: JsonRecord, extra: JsonRecord = {}): JsonRecord {
  return {
    operation,
    mocked: true,
    github_write_executed: false,
    worker_boundary: "mocked_github_boundary_12.7Z-1E",
    checked_at: new Date().toISOString(),
    repository:
      stringValue(payload.repository) ||
      (stringValue(payload.owner) && stringValue(payload.repo)
        ? `${stringValue(payload.owner)}/${stringValue(payload.repo)}`
        : envValue("HOCKER_GITHUB_REPO") || envValue("GITHUB_REPOSITORY") || "HockerAGI/hocker.one"),
    ...extra,
  };
}

function envValue(key: string): string {
  return String(process.env[key] ?? "").trim();
}

function getAdminSupabase(): SupabaseClient {
  const url = envValue("SUPABASE_URL") || envValue("NEXT_PUBLIC_SUPABASE_URL");
  const key = envValue("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) throw new Error("Supabase admin no configurado para AGI Action Execution.");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

function asRecord(value: unknown): JsonRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as JsonRecord;
}

function stringValue(value: unknown, fallback = ""): string {
  return String(value ?? fallback).trim();
}

function encodeSegment(value: string): string {
  return encodeURIComponent(value).replace(/%2F/g, "/");
}

function allowedRepositories(): Set<string> {
  const raw =
    envValue("HOCKER_GITHUB_ALLOWED_REPOS") ||
    envValue("GITHUB_ALLOWED_REPOS") ||
    "HockerAGI/hocker.one,HockerAGI/nova.agi";

  return new Set(raw.split(",").map((item) => item.trim()).filter(Boolean));
}

function parseRepository(payload: JsonRecord): { owner: string; repo: string; fullName: string } {
  const ownerInput = stringValue(payload.owner);
  const repoInput = stringValue(payload.repo);
  const raw =
    ownerInput && repoInput
      ? `${ownerInput}/${repoInput}`
      : stringValue(payload.repository) || envValue("HOCKER_GITHUB_REPO") || envValue("GITHUB_REPOSITORY") || "HockerAGI/hocker.one";

  const [owner, repo] = raw.split("/").map((item) => item.trim()).filter(Boolean);
  if (!owner || !repo) throw new Error("Repositorio inválido. Usa formato owner/repo.");

  const fullName = `${owner}/${repo}`;
  if (!allowedRepositories().has(fullName)) {
    throw new Error(`Repositorio no permitido para ejecución AGI: ${fullName}`);
  }

  return { owner, repo, fullName };
}

function safeBranch(value: unknown, fallback = ""): string {
  const raw = stringValue(value, fallback);
  if (!raw) throw new Error("Falta branch.");
  if (raw.length > 160) throw new Error("Branch demasiado largo.");
  if (raw.includes("..") || raw.startsWith("/") || raw.endsWith("/") || raw.includes(String.fromCharCode(92)) || raw.endsWith(".lock") || /[\s~^:?*[\]\u0000]/.test(raw)) {
    throw new Error("Branch no permitido.");
  }
  return raw;
}

function allowedPathPrefixes(): string[] {
  return (
    envValue("HOCKER_GITHUB_ALLOWED_PATH_PREFIXES") ||
    "src/,app/,docs/,scripts/,supabase/migrations/,public/,package.json,next.config.js,tsconfig.json"
  )
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function safePath(value: unknown): string {
  const raw = stringValue(value).replace(/^\/+/, "");
  if (!raw) throw new Error("Falta path.");
  if (raw.includes("..") || raw.includes(String.fromCharCode(92))) throw new Error("Path no permitido.");
  if (raw.startsWith(".git/") || raw.includes("/.git/")) throw new Error("Path Git interno bloqueado.");
  if (/(\.env|\.pem|\.key|\.p12|\.pfx|private-extra-headers\.json)$/i.test(raw)) {
    throw new Error("Path sensible bloqueado.");
  }

  const allowed = allowedPathPrefixes();
  const ok = allowed.some((prefix) => raw === prefix || raw.startsWith(prefix));
  if (!ok) {
    throw new Error(`Path fuera de allowlist AGI: ${raw}`);
  }

  return raw;
}


function numberValue(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function buildLockOwner(actorId: string): string {
  return `hocker-one:${actorId}:${randomUUID()}`;
}
function buildExecutionTrace(actionId: string, actorId: string): { trace_id: string; request_id: string } {
  const trace_id = randomUUID();
  const request_id = `${actionId}:${actorId}:${randomUUID()}`;
  return { trace_id, request_id };
}

function shouldMoveToDeadLetter(attemptCount: number, maxAttempts: number, errorMessage: string): boolean {
  if (attemptCount >= maxAttempts) return true;
  const msg = String(errorMessage ?? "").toLowerCase();
  return msg.includes("forbidden") || msg.includes("not permitted") || msg.includes("invalid state");
}

function buildRollbackPlan(item: AgiActionQueueRow, result: JsonRecord): JsonRecord {
  if (item.action_type === "github.create_branch") {
    return {
      type: "github.delete_branch_if_created",
      safe: Boolean(result.created),
      repository: result.repository ?? null,
      branch: result.target_branch ?? null,
      note: result.created ? "Rollback puede eliminar la rama creada si no hay PR activo." : "La rama ya existía; rollback automático no aplica.",
    };
  }

  if (item.action_type === "github.upsert_file") {
    return {
      type: "github.restore_previous_file_sha",
      safe: Boolean(result.previous_sha),
      repository: result.repository ?? null,
      branch: result.branch ?? null,
      path: result.path ?? null,
      previous_sha: result.previous_sha ?? null,
      new_sha: result.content_sha ?? null,
      note: result.previous_sha ? "Rollback requiere restaurar contenido previo usando previous_sha." : "Archivo nuevo; rollback requiere eliminar archivo creado.",
    };
  }

  if (item.action_type === "github.create_pr") {
    return {
      type: "github.close_pr_if_created",
      safe: Boolean(result.number),
      repository: result.repository ?? null,
      pr_number: result.number ?? null,
      already_exists: result.already_exists ?? false,
      note: result.already_exists ? "PR ya existía; rollback automático no aplica." : "Rollback puede cerrar el PR draft creado.",
    };
  }

  return { type: "manual_review", safe: false };
}

async function claimApprovedQueueItem(params: {
  project_id: string;
  action_id: string;
  actor_id: string;
  item: AgiActionQueueRow;
}): Promise<AgiActionQueueRow> {
  const now = new Date().toISOString();
  const attemptCount = numberValue(params.item.attempt_count, 0);
  const maxAttempts = Math.max(1, numberValue(params.item.max_attempts, 3));
  const trace = buildExecutionTrace(params.action_id, params.actor_id);

  if (attemptCount >= maxAttempts) {
    throw new Error(`Acción agotó intentos permitidos: ${attemptCount}/${maxAttempts}`);
  }

  const sb = getAdminSupabase();
  const { data, error } = await sb
    .from("agi_action_queue")
    .update({
      status: "executing",
      executed_by: params.actor_id,
      locked_at: now,
      lock_owner: buildLockOwner(params.actor_id),
      attempt_count: attemptCount + 1,
      last_error: null,
      updated_at: now,
    })
    .eq("project_id", params.project_id)
    .eq("id", params.action_id)
    .eq("status", "approved")
    .is("locked_at", null)
    .select("*")
    .maybeSingle<AgiActionQueueRow>();

  if (error) throw new Error(error.message);

  if (!data) {
    const latest = await getQueueItem(params.project_id, params.action_id);
    throw new Error(`No se pudo reclamar lock de ejecución. Estado actual: ${latest.status}; locked_at=${latest.locked_at ?? "null"}`);
  }

  return data;
}

function ensureNotMainBranch(branch: string): void {
  const normalized = branch.toLowerCase();
  if (["main", "master", "production", "prod"].includes(normalized)) {
    throw new Error("Escritura directa a rama principal bloqueada por Owner Gate.");
  }
}

async function githubRequest<T>(endpoint: string, init: RequestInit = {}): Promise<T> {

  const method = String(init?.method || "GET").toUpperCase();
  if (isMockedGithubBoundary() && ["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    throw new Error(`Blocked real GitHub write while HOCKER_GITHUB_EXECUTION_MODE=mock: ${method}`);
  }

  const token = getGitHubRuntimeToken();
  if (!token) throw new Error("GitHub no configurado: falta HOCKER_GITHUB_TOKEN, GITHUB_TOKEN o GH_TOKEN.");

  const response = await fetch(`https://api.github.com${endpoint}`, {
    ...init,
    cache: "no-store",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...(init.headers || {}),
    },
  });

  const text = await response.text();
  let payload: unknown = null;
  try { payload = text ? JSON.parse(text) : null; } catch { payload = { raw: text.slice(0, 800) }; }

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

async function getQueueItem(projectId: string, actionId: string): Promise<AgiActionQueueRow> {
  const sb = getAdminSupabase();
  const { data, error } = await sb
    .from("agi_action_queue")
    .select("*")
    .eq("project_id", projectId)
    .eq("id", actionId)
    .maybeSingle<AgiActionQueueRow>();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("Acción AGI no encontrada.");
  return data;
}

async function patchQueueItem(actionId: string, patch: Partial<AgiActionQueueRow>): Promise<AgiActionQueueRow> {
  const sb = getAdminSupabase();
  const { data, error } = await sb
    .from("agi_action_queue")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", actionId)
    .select("*")
    .single<AgiActionQueueRow>();

  if (error || !data) throw new Error(error?.message ?? "No se pudo actualizar acción AGI.");
  return data;
}

export async function listAgiActions(params: { project_id: string; status?: string; tool_key?: string; limit?: number }): Promise<AgiActionQueueRow[]> {
  const sb = getAdminSupabase();
  const limit = Math.max(1, Math.min(Number(params.limit || 30), 100));

  let query = sb
    .from("agi_action_queue")
    .select("*")
    .eq("project_id", params.project_id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (params.status) query = query.eq("status", params.status);
  if (params.tool_key) query = query.eq("tool_key", params.tool_key);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as AgiActionQueueRow[];
}


const GUIDED_GITHUB_CHAIN_VERSION = "12.7K-2B";
const GUIDED_GITHUB_MATERIALIZER_VERSION = "12.7K-2A";
const GUIDED_GITHUB_ACTION_ORDER = ["github.create_branch", "github.upsert_file", "github.create_pr"];

function guidedGithubActionIndex(actionType: string): number {
  const index = GUIDED_GITHUB_ACTION_ORDER.indexOf(actionType);
  return index === -1 ? 999 : index;
}

function isGuidedGithubTerminal(status: unknown): boolean {
  return ["executed", "completed", "rejected", "cancelled", "canceled"].includes(String(status));
}

function isGuidedGithubExecuted(item: AgiActionQueueRow): boolean {
  return ["executed", "completed"].includes(String(item.status));
}

function guidedGithubBranchKey(item: AgiActionQueueRow): string | null {
  const payload = asRecord(item.payload);

  if (item.tool_key !== "github") return null;
  if (!GUIDED_GITHUB_ACTION_ORDER.includes(item.action_type)) return null;
  if (payload.materializer_version !== GUIDED_GITHUB_MATERIALIZER_VERSION) return null;

  const branch = stringValue(payload.target_branch ?? payload.branch ?? payload.head);
  return branch || null;
}

async function getGuidedGithubChain(projectId: string, item: AgiActionQueueRow): Promise<{ key: string; siblings: AgiActionQueueRow[] } | null> {
  const key = guidedGithubBranchKey(item);
  if (!key) return null;

  const db = getAdminSupabase();
  const { data, error } = await db
    .from("agi_action_queue")
    .select("*")
    .eq("project_id", projectId)
    .eq("tool_key", "github")
    .in("action_type", GUIDED_GITHUB_ACTION_ORDER)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);

  const siblings = ((data ?? []) as AgiActionQueueRow[])
    .filter((row) => guidedGithubBranchKey(row) === key)
    .sort((a, b) => {
      const byAction = guidedGithubActionIndex(a.action_type) - guidedGithubActionIndex(b.action_type);
      if (byAction !== 0) return byAction;
      return Date.parse(a.created_at || "") - Date.parse(b.created_at || "");
    });

  return { key, siblings };
}

async function assertGuidedGithubApprovalOrder(projectId: string, item: AgiActionQueueRow): Promise<void> {
  const chain = await getGuidedGithubChain(projectId, item);
  if (!chain) return;

  const next = chain.siblings.find((row) => !isGuidedGithubTerminal(row.status));
  if (next && next.id !== item.id) {
    throw new Error(`Cadena GitHub guiada ${GUIDED_GITHUB_CHAIN_VERSION}: primero atiende ${next.action_type}. Acción actual: ${item.action_type}.`);
  }

  const currentIndex = guidedGithubActionIndex(item.action_type);
  const previousPending = chain.siblings.find((row) => guidedGithubActionIndex(row.action_type) < currentIndex && !isGuidedGithubExecuted(row));

  if (previousPending) {
    throw new Error(`Cadena GitHub guiada ${GUIDED_GITHUB_CHAIN_VERSION}: antes de aprobar ${item.action_type}, debe ejecutarse ${previousPending.action_type}.`);
  }
}

async function assertGuidedGithubExecutionOrder(projectId: string, item: AgiActionQueueRow): Promise<void> {
  const chain = await getGuidedGithubChain(projectId, item);
  if (!chain) return;

  const next = chain.siblings.find((row) => !isGuidedGithubTerminal(row.status));
  if (next && next.id !== item.id) {
    throw new Error(`Cadena GitHub guiada ${GUIDED_GITHUB_CHAIN_VERSION}: primero atiende ${next.action_type}. Acción actual: ${item.action_type}.`);
  }

  const currentIndex = guidedGithubActionIndex(item.action_type);
  const previousPending = chain.siblings.find((row) => guidedGithubActionIndex(row.action_type) < currentIndex && !isGuidedGithubExecuted(row));

  if (previousPending) {
    throw new Error(`Cadena GitHub guiada ${GUIDED_GITHUB_CHAIN_VERSION}: antes de ejecutar ${item.action_type}, debe ejecutarse ${previousPending.action_type}.`);
  }
}


export async function decideAgiAction(params: { project_id: string; action_id: string; decision: "approve" | "reject"; actor_id: string; note?: string }): Promise<AgiActionQueueRow> {
  const item = await getQueueItem(params.project_id, params.action_id);

  if (!["needs_approval", "dry_run_queued", "queued"].includes(String(item.status))) {
    throw new Error(`La acción no está en estado aprobable: ${item.status}`);
  }

  if (params.decision === "approve") {
    await assertGuidedGithubApprovalOrder(params.project_id, item);

    return patchQueueItem(item.id, {
      status: "approved",
      approved_by: params.actor_id,
      approval_note: params.note ?? null,
      approved_at: new Date().toISOString(),
    });
  }

  return patchQueueItem(item.id, {
    status: "rejected",
    rejected_by: params.actor_id,
    rejection_note: params.note ?? null,
    rejected_at: new Date().toISOString(),
  });
}

async function executeCreateBranch(payload: JsonRecord) {
  const { owner, repo, fullName } = parseRepository(payload);
  const base = safeBranch(payload.base ?? payload.base_branch ?? payload.ref ?? "main", "main");
  const target = safeBranch(payload.branch ?? payload.target_branch ?? payload.head, "");
  ensureNotMainBranch(target);

  if (isMockedGithubBoundary()) {
    return mockedGithubResult("mocked_create_branch", payload, {
      repository: fullName,
      base,
      target_branch: target,
      created: true,
      ref: `refs/heads/${target}`,
      sha: `mock-sha-${target}`,
    });
  }


  const baseRef = await githubRequest<GitHubRefResponse>(`/repos/${owner}/${repo}/git/ref/heads/${encodeSegment(base)}`);

  try {
    const created = await githubRequest<GitHubRefResponse>(`/repos/${owner}/${repo}/git/refs`, {
      method: "POST",
      body: JSON.stringify({ ref: `refs/heads/${target}`, sha: baseRef.object.sha }),
    });

    return {
      operation: "create_branch",
      repository: fullName,
      base,
      target_branch: target,
      base_sha: baseRef.object.sha,
      created: true,
      already_exists: false,
      ref: created.ref,
      sha: created.object.sha,
    };
  } catch (error) {
    const status = (error as Error & { status?: number }).status;
    if (status !== 422) throw error;

    const existing = await githubRequest<GitHubRefResponse>(`/repos/${owner}/${repo}/git/ref/heads/${encodeSegment(target)}`);
    return {
      operation: "create_branch",
      repository: fullName,
      base,
      target_branch: target,
      base_sha: baseRef.object.sha,
      created: false,
      already_exists: true,
      ref: existing.ref,
      sha: existing.object.sha,
    };
  }
}

async function executeUpsertFile(payload: JsonRecord) {
  const { owner, repo, fullName } = parseRepository(payload);
  const branch = safeBranch(payload.branch ?? payload.target_branch ?? payload.head, "");
  const path = safePath(payload.path);
  const content = typeof payload.content === "string" ? payload.content : "";
  const message = stringValue(payload.message, `NOVA update ${path}`);
  const expectedSha = stringValue(payload.expected_sha);
  ensureNotMainBranch(branch);
  if (!content) throw new Error("Falta content para upsert_file.");

  let previousSha: string | null = null;
  try {
    const current = await githubRequest<GitHubContentResponse>(`/repos/${owner}/${repo}/contents/${encodeSegment(path)}?ref=${encodeURIComponent(branch)}`);
    previousSha = current.sha ?? null;
  } catch (error) {
    const status = (error as Error & { status?: number }).status;
    if (status !== 404) throw error;
  }

  if (previousSha && !expectedSha) {
    throw new Error("expected_sha obligatorio para modificar archivo existente.");
  }

  if (previousSha && expectedSha !== previousSha) {
    throw new Error(`expected_sha no coincide para ${path}. Esperado por payload=${expectedSha}; actual=${previousSha}`);
  }

  if (!previousSha && expectedSha && !["__new__", "CREATE", "create", "new"].includes(expectedSha)) {
    throw new Error(`expected_sha indica archivo existente pero ${path} no existe en la rama.`);
  }

  if (isMockedGithubBoundary()) {
    return mockedGithubResult("mocked_upsert_file", payload, {
      repository: fullName,
      branch,
      path,
      previous_sha: previousSha ?? null,
      expected_sha: expectedSha || (previousSha ? null : "__new__"),
      content_sha: `mock-content-sha-${Date.now()}`,
      commit_sha: `mock-commit-sha-${Date.now()}`,
      html_url: `https://github.com/${fullName}/blob/${branch}/${path}`,
    });
  }

  const result = await githubRequest<GitHubPutContentResponse>(`/repos/${owner}/${repo}/contents/${encodeSegment(path)}`, {
    method: "PUT",
    body: JSON.stringify({
      message,
      content: Buffer.from(content, "utf8").toString("base64"),
      branch,
      ...(previousSha ? { sha: previousSha } : {}),
    }),
  });

  return {
    operation: "upsert_file",
    repository: fullName,
    branch,
    path,
    message,
    previous_sha: previousSha,
    content_sha: result.content?.sha ?? null,
    commit_sha: result.commit?.sha ?? null,
    html_url: result.content?.html_url ?? result.commit?.html_url ?? null,
  };
}

async function executeCreatePr(payload: JsonRecord) {
  const { owner, repo, fullName } = parseRepository(payload);
  const base = safeBranch(payload.base ?? payload.base_branch ?? "main", "main");
  const head = safeBranch(payload.head ?? payload.branch ?? payload.target_branch, "");
  const title = stringValue(payload.title, "NOVA proposed change");
  const body = stringValue(payload.body, "Plan generado por NOVA y aprobado por owner.");
  ensureNotMainBranch(head);
  if (!title) throw new Error("Falta title para create_pr.");

  if (isMockedGithubBoundary()) {
    return mockedGithubResult("mocked_create_pr", payload, {
      repository: fullName,
      number: 12701,
      state: "open",
      draft: true,
      html_url: `https://github.com/${fullName}/pull/12701`,
      base,
      head,
      head_sha: `mock-head-sha-${head}`,
      base_sha: `mock-base-sha-${base}`,
      already_exists: false,
    });
  }

  const existingQuery = new URLSearchParams({ state: "open", head: `${owner}:${head}`, base });
  const existingPrs = await githubRequest<GitHubPullResponse[]>(
    `/repos/${owner}/${repo}/pulls?${existingQuery.toString()}`,
    { method: "GET" },
  );

  if (existingPrs[0]) {
    const existing = existingPrs[0];
    return {
      operation: "create_pr",
      repository: fullName,
      number: existing.number,
      state: existing.state,
      draft: Boolean(existing.draft),
      html_url: existing.html_url,
      base,
      head,
      head_sha: existing.head?.sha ?? null,
      base_sha: existing.base?.sha ?? null,
      already_exists: true,
    };
  }

  const pr = await githubRequest<GitHubPullResponse>(`/repos/${owner}/${repo}/pulls`, {
    method: "POST",
    body: JSON.stringify({ title, head, base, body, draft: true }),
  });

  return {
    operation: "create_pr",
    repository: fullName,
    number: pr.number,
    state: pr.state,
    draft: Boolean(pr.draft),
    html_url: pr.html_url,
    base,
    head,
    head_sha: pr.head?.sha ?? null,
    base_sha: pr.base?.sha ?? null,
    already_exists: false,
  };
}

export async function executeApprovedAgiAction(params: { project_id: string; action_id: string; actor_id: string }): Promise<AgiActionQueueRow> {
  const pending = await getQueueItem(params.project_id, params.action_id);

  if (pending.status !== "approved") throw new Error(`Acción no aprobada. Estado actual: ${pending.status}`);
  if (pending.tool_key !== "github" || !pending.action_type.startsWith("github.")) {
    throw new Error("Worker actual solo ejecuta acciones GitHub aprobadas.");
  }

  await assertGuidedGithubExecutionOrder(params.project_id, pending);

  const item = await claimApprovedQueueItem({
    project_id: params.project_id,
    action_id: params.action_id,
    actor_id: params.actor_id,
    item: pending,
  });

  try {
    const payload = asRecord(item.payload);
    const operation = item.action_type.replace(/^github\./, "");
    const result =
      operation === "create_branch"
        ? await executeCreateBranch(payload)
        : operation === "upsert_file"
          ? await executeUpsertFile(payload)
          : operation === "create_pr"
            ? await executeCreatePr(payload)
            : (() => { throw new Error(`Operación GitHub no soportada por worker: ${operation}`); })();

    const rollbackPlan = buildRollbackPlan(item, result as JsonRecord);

    return patchQueueItem(item.id, {
      status: "executed",
      executed_by: params.actor_id,
      executed_at: new Date().toISOString(),
      locked_at: null,
      lock_owner: null,
      last_error: null,
      execution_error: null,
      rollback_plan: rollbackPlan,
      execution_result: {
        ok: true,
        executed_at: new Date().toISOString(),
        worker: "github_approved_execution_worker_12.7Z-1A",
        idempotency_key: item.idempotency_key ?? null,
        attempt_count: item.attempt_count ?? null,
        result,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falla desconocida al ejecutar acción AGI.";

    await patchQueueItem(item.id, {
      status: "execution_failed",
      executed_by: params.actor_id,
      executed_at: new Date().toISOString(),
      locked_at: null,
      lock_owner: null,
      last_error: message,
      execution_error: message,
      execution_result: {
        ok: false,
        worker: "github_approved_execution_worker_12.7Z-1A",
        idempotency_key: item.idempotency_key ?? null,
        attempt_count: item.attempt_count ?? null,
      },
    });

    throw error;
  }
}
