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

function parseRepository(payload: JsonRecord): { owner: string; repo: string; fullName: string } {
  const raw = stringValue(payload.repository) || envValue("HOCKER_GITHUB_REPO") || envValue("GITHUB_REPOSITORY") || "HockerAGI/hocker.one";
  const [owner, repo] = raw.split("/").map((item) => item.trim()).filter(Boolean);
  if (!owner || !repo) throw new Error("Repositorio inválido. Usa formato owner/repo.");
  return { owner, repo, fullName: `${owner}/${repo}` };
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

function safePath(value: unknown): string {
  const raw = stringValue(value).replace(/^\/+/, "");
  if (!raw) throw new Error("Falta path.");
  if (raw.includes("..") || raw.includes(String.fromCharCode(92))) throw new Error("Path no permitido.");
  return raw;
}

function ensureNotMainBranch(branch: string): void {
  const normalized = branch.toLowerCase();
  if (["main", "master", "production", "prod"].includes(normalized)) {
    throw new Error("Escritura directa a rama principal bloqueada por Owner Gate.");
  }
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

export async function decideAgiAction(params: { project_id: string; action_id: string; decision: "approve" | "reject"; actor_id: string; note?: string }): Promise<AgiActionQueueRow> {
  const item = await getQueueItem(params.project_id, params.action_id);

  if (!["needs_approval", "dry_run_queued", "queued"].includes(String(item.status))) {
    throw new Error(`La acción no está en estado aprobable: ${item.status}`);
  }

  if (params.decision === "approve") {
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
  };
}

export async function executeApprovedAgiAction(params: { project_id: string; action_id: string; actor_id: string }): Promise<AgiActionQueueRow> {
  const item = await getQueueItem(params.project_id, params.action_id);

  if (item.status !== "approved") throw new Error(`Acción no aprobada. Estado actual: ${item.status}`);
  if (item.tool_key !== "github" || !item.action_type.startsWith("github.")) {
    throw new Error("Worker actual solo ejecuta acciones GitHub aprobadas.");
  }

  await patchQueueItem(item.id, { status: "executing", executed_by: params.actor_id });

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

    return patchQueueItem(item.id, {
      status: "executed",
      executed_by: params.actor_id,
      executed_at: new Date().toISOString(),
      execution_error: null,
      execution_result: {
        ok: true,
        executed_at: new Date().toISOString(),
        worker: "github_approved_execution_worker",
        result,
      },
    });
  } catch (error) {
    await patchQueueItem(item.id, {
      status: "execution_failed",
      executed_by: params.actor_id,
      executed_at: new Date().toISOString(),
      execution_error: error instanceof Error ? error.message : "Falla desconocida al ejecutar acción AGI.",
      execution_result: { ok: false, worker: "github_approved_execution_worker" },
    });
    throw error;
  }
}
