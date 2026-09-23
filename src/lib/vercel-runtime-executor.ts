import { createHash } from "node:crypto";

export type VercelRuntimeReadOperation =
  | "get_project"
  | "list_deployments"
  | "get_deployment_logs";

export type VercelRuntimeWriteOperation = "create_project";

export type VercelRuntimeOperation =
  | VercelRuntimeReadOperation
  | VercelRuntimeWriteOperation;

export type VercelRuntimeInput = {
  project_id?: string;
  project_name?: string;
  repository?: string;
  repository_url?: string;
  framework?: string;
  root_directory?: string;
  install_command?: string;
  team_id?: string;
  deployment_id?: string;
};

function envValue(key: string): string {
  return String(process.env[key] ?? "").trim();
}

export function getVercelRuntimeToken(): string {
  return envValue("VERCEL_TOKEN");
}

export function hasVercelRuntimeToken(): boolean {
  return getVercelRuntimeToken().length > 0;
}

export function isVercelWriteOperation(operation: string): operation is VercelRuntimeWriteOperation {
  return operation === "create_project";
}

export function isVercelReadOperation(operation: string): operation is VercelRuntimeReadOperation {
  return ["get_project", "list_deployments", "get_deployment_logs"].includes(operation);
}

function teamId(input?: string): string {
  return String(input ?? envValue("VERCEL_TEAM_ID")).trim();
}

function safeProjectName(value: unknown): string {
  const raw = String(value ?? "").trim();
  if (!raw) throw new Error("Falta project_name.");
  if (raw.length > 100) throw new Error("project_name demasiado largo.");
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,99}$/.test(raw)) {
    throw new Error("project_name contiene caracteres no permitidos.");
  }
  return raw;
}

function safeRepository(value: unknown): string {
  const raw = String(value ?? "").trim();
  if (!raw) throw new Error("Falta repository.");
  const match = raw.match(/^([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)$/);
  if (!match) throw new Error("repository debe tener formato owner/repo.");
  if (match[1] !== "HockerAGI") {
    throw new Error("El executor Vercel sólo puede enlazar repos del namespace HockerAGI.");
  }
  return raw;
}

function apiQuery(params: Record<string, string | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value);
  }
  const encoded = search.toString();
  return encoded ? `?${encoded}` : "";
}

async function vercelRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const token = getVercelRuntimeToken();
  if (!token) {
    throw new Error("Vercel no configurado: falta VERCEL_TOKEN.");
  }

  const response = await fetch(`https://api.vercel.com${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
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
    const message =
      payload &&
      typeof payload === "object" &&
      "error" in payload &&
      typeof (payload as { error?: unknown }).error === "object" &&
      (payload as { error?: { message?: unknown } }).error?.message
        ? String((payload as { error: { message: unknown } }).error.message)
        : payload &&
            typeof payload === "object" &&
            "message" in payload
          ? String((payload as { message?: unknown }).message)
          : `Vercel HTTP ${response.status}`;
    const error = new Error(message);
    (error as Error & { status?: number; payload?: unknown }).status = response.status;
    (error as Error & { status?: number; payload?: unknown }).payload = payload;
    throw error;
  }

  return payload as T;
}

export async function getVercelProject(input: VercelRuntimeInput) {
  const id = String(input.project_id ?? envValue("VERCEL_PROJECT_ID")).trim();
  if (!id) throw new Error("Falta project_id.");
  return vercelRequest(`/v9/projects/${encodeURIComponent(id)}${apiQuery({ teamId: teamId(input.team_id) })}`);
}

export async function listVercelDeployments(input: VercelRuntimeInput) {
  const projectId = String(input.project_id ?? envValue("VERCEL_PROJECT_ID")).trim();
  if (!projectId) throw new Error("Falta project_id.");
  return vercelRequest(
    `/v6/deployments${apiQuery({ projectId, teamId: teamId(input.team_id), limit: "20" })}`,
  );
}

export async function getVercelDeploymentLogs(input: VercelRuntimeInput) {
  const deploymentId = String(input.deployment_id ?? "").trim();
  if (!deploymentId) throw new Error("Falta deployment_id.");
  return vercelRequest(
    `/v1/deployments/${encodeURIComponent(deploymentId)}/events${apiQuery({ teamId: teamId(input.team_id) })}`,
  );
}

export async function createVercelProject(input: VercelRuntimeInput) {
  const name = safeProjectName(input.project_name);
  const repository = safeRepository(input.repository ?? "");
  const team = teamId(input.team_id);

  const body: Record<string, unknown> = {
    name,
    gitRepository: {
      type: "github",
      repo: repository,
    },
  };

  if (input.framework) body.framework = String(input.framework).trim();
  if (input.root_directory) body.rootDirectory = String(input.root_directory).trim();
  if (input.install_command) body.installCommand = String(input.install_command).trim();

  const payload = await vercelRequest<Record<string, unknown>>(
    `/v11/projects${apiQuery({ teamId: team })}`,
    {
      method: "POST",
      body: JSON.stringify(body),
    },
  );

  return {
    ok: true,
    operation: "create_project",
    project_name: name,
    repository,
    team_id: team || null,
    created: true,
    result_hash: createHash("sha256").update(JSON.stringify(payload)).digest("hex"),
    result: payload,
  };
}

export async function executeVercelReadOperation(
  operation: VercelRuntimeReadOperation,
  input: VercelRuntimeInput,
) {
  switch (operation) {
    case "get_project":
      return getVercelProject(input);
    case "list_deployments":
      return listVercelDeployments(input);
    case "get_deployment_logs":
      return getVercelDeploymentLogs(input);
    default:
      throw new Error("Operación Vercel no soportada.");
  }
}

export function createVercelWriteGatePlan(
  operation: VercelRuntimeWriteOperation,
  input: VercelRuntimeInput,
) {
  const missing_fields: string[] = [];

  if (operation === "create_project") {
    try {
      safeProjectName(input.project_name);
    } catch {
      missing_fields.push("project_name");
    }
    try {
      safeRepository(input.repository ?? "");
    } catch {
      missing_fields.push("repository");
    }
  }

  return {
    valid: missing_fields.length === 0,
    mode: "owner_gate",
    operation,
    repository: input.repository ?? null,
    project_name: input.project_name ?? null,
    risk_level: "high",
    required_fields: missing_fields,
    dry_run: true,
    execute_now: false,
    owner_gate_required: true,
    required_approval_role: "owner",
    rollback_plan: {
      strategy: "manual_project_detach_or_delete",
      safe: false,
      note: "No se ejecuta borrado automático de proyectos Vercel. Revisión manual requerida para rollback.",
    },
    audit_chain: {
      required: true,
      records: ["agi_action_queue", "vercel_operation", "owner_decision", "execution_result"],
    },
    next_step: missing_fields.length
      ? `Completar campos requeridos: ${missing_fields.join(", ")}.`
      : "Enviar a cola segura. Ejecutar sólo después de aprobación Owner.",
  };
}

export function getVercelExecutorStatus() {
  return {
    ok: hasVercelRuntimeToken(),
    provider: "Vercel",
    token_present: hasVercelRuntimeToken(),
    accepted_env: ["VERCEL_TOKEN"],
    read_operations: ["get_project", "list_deployments", "get_deployment_logs"],
    write_operations_guarded: ["create_project"],
    safety: {
      read_operations_execute_now: true,
      write_operations_execute_now: false,
      write_operations_policy: "Owner Gate + dry-run + approval queue.",
      namespace_boundary: "HockerAGI GitHub repositories only",
    },
  };
}
