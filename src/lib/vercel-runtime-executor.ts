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
  framework?: string;
  root_directory?: string;
  install_command?: string;
  team_id?: string;
  deployment_id?: string;
};

type VercelApiErrorPayload = {
  error?: {
    message?: string;
  };
  message?: string;
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

export function isVercelWriteOperation(
  operation: string,
): operation is VercelRuntimeWriteOperation {
  return operation === "create_project";
}

export function isVercelReadOperation(
  operation: string,
): operation is VercelRuntimeReadOperation {
  return (
    operation === "get_project" ||
    operation === "list_deployments" ||
    operation === "get_deployment_logs"
  );
}

function requireProjectName(value: unknown): string {
  const name = String(value ?? "").trim();
  if (!name) throw new Error("Falta project_name.");
  if (name.length > 100) throw new Error("project_name demasiado largo.");
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,99}$/.test(name)) {
    throw new Error("project_name contiene caracteres no permitidos.");
  }
  return name;
}

function requireHockerRepository(value: unknown): string {
  const repository = String(value ?? "").trim();
  if (!repository) throw new Error("Falta repository.");
  if (!/^HockerAGI\/[A-Za-z0-9_.-]+$/.test(repository)) {
    throw new Error("repository debe pertenecer a HockerAGI y tener formato owner/repo.");
  }
  return repository;
}

function buildPath(path: string, teamId: string): string {
  return teamId
    ? `${path}?${new URLSearchParams({ teamId }).toString()}`
    : path;
}

async function vercelRequest<T>(
  path: string,
  token: string,
  method = "GET",
  body?: string,
): Promise<T> {
  const response = await fetch(`https://api.vercel.com${path}`, {
    method,
    cache: "no-store",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    ...(body ? { body } : {}),
  });

  const text = await response.text();
  let payload: unknown = null;

  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = { message: text.slice(0, 800) };
  }

  if (!response.ok) {
    const details = payload as VercelApiErrorPayload;
    const message =
      details.error?.message ||
      details.message ||
      `Vercel HTTP ${response.status}`;
    throw new Error(message);
  }

  return payload as T;
}

export async function verifyVercelConnection(): Promise<boolean> {
  const token = getVercelRuntimeToken();
  if (!token) return false;

  try {
    await vercelRequest("/v2/user", token);
    return true;
  } catch {
    return false;
  }
}

export async function getVercelProject(input: VercelRuntimeInput) {
  const token = getVercelRuntimeToken();
  if (!token) throw new Error("Vercel no configurado: falta VERCEL_TOKEN.");

  const projectId = String(input.project_id ?? envValue("VERCEL_PROJECT_ID")).trim();
  if (!projectId) throw new Error("Falta project_id.");

  return vercelRequest(
    buildPath(`/v9/projects/${encodeURIComponent(projectId)}`, envValue("VERCEL_TEAM_ID")),
    token,
  );
}

export async function listVercelDeployments(input: VercelRuntimeInput) {
  const token = getVercelRuntimeToken();
  if (!token) throw new Error("Vercel no configurado: falta VERCEL_TOKEN.");

  const projectId = String(input.project_id ?? envValue("VERCEL_PROJECT_ID")).trim();
  if (!projectId) throw new Error("Falta project_id.");

  const query = new URLSearchParams({
    projectId,
    limit: "20",
  });
  const teamId = envValue("VERCEL_TEAM_ID");
  if (teamId) query.set("teamId", teamId);

  return vercelRequest(`/v6/deployments?${query.toString()}`, token);
}

export async function getVercelDeploymentLogs(input: VercelRuntimeInput) {
  const token = getVercelRuntimeToken();
  if (!token) throw new Error("Vercel no configurado: falta VERCEL_TOKEN.");

  const deploymentId = String(input.deployment_id ?? "").trim();
  if (!deploymentId) throw new Error("Falta deployment_id.");

  return vercelRequest(
    buildPath(
      `/v1/deployments/${encodeURIComponent(deploymentId)}/events`,
      envValue("VERCEL_TEAM_ID"),
    ),
    token,
  );
}

export async function createVercelProject(input: VercelRuntimeInput) {
  const token = getVercelRuntimeToken();
  if (!token) throw new Error("Vercel no configurado: falta VERCEL_TOKEN.");

  const name = requireProjectName(input.project_name);
  const repository = requireHockerRepository(input.repository);
  const teamId = envValue("VERCEL_TEAM_ID");

  const payload = {
    name,
    gitRepository: {
      type: "github",
      repo: repository,
    },
    ...(input.framework ? { framework: input.framework } : {}),
    ...(input.root_directory ? { rootDirectory: input.root_directory } : {}),
    ...(input.install_command ? { installCommand: input.install_command } : {}),
  };

  const result = await vercelRequest<Record<string, unknown>>(
    buildPath("/v11/projects", teamId),
    token,
    "POST",
    JSON.stringify(payload),
  );

  return {
    ok: true,
    operation: "create_project",
    created: true,
    project_name: name,
    repository,
    team_id: teamId || null,
    result,
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
  }
}

export function createVercelWriteGatePlan(
  operation: VercelRuntimeWriteOperation,
  input: VercelRuntimeInput,
) {
  const required_fields: string[] = [];

  if (operation === "create_project") {
    try {
      requireProjectName(input.project_name);
    } catch {
      required_fields.push("project_name");
    }

    try {
      requireHockerRepository(input.repository);
    } catch {
      required_fields.push("repository");
    }
  }

  return {
    valid: required_fields.length === 0,
    mode: "owner_gate" as const,
    operation,
    project_name: input.project_name ?? null,
    repository: input.repository ?? null,
    risk_level: "high" as const,
    required_fields,
    dry_run: true,
    execute_now: false,
    owner_gate_required: true,
    required_approval_role: "owner",
    rollback_plan: {
      strategy: "manual_project_detach_or_delete",
      safe: false,
      note: "No se ejecuta borrado automático de proyectos Vercel.",
    },
    audit_chain: {
      required: true,
      records: [
        "agi_action_queue",
        "vercel_operation",
        "owner_decision",
        "execution_result",
      ],
    },
    next_step:
      required_fields.length > 0
        ? `Completar campos requeridos: ${required_fields.join(", ")}.`
        : "Enviar a cola segura. Ejecutar sólo después de aprobación Owner.",
  };
}

export function getVercelExecutorStatus() {
  return {
    ok: hasVercelRuntimeToken(),
    provider: "Vercel",
    token_present: hasVercelRuntimeToken(),
    accepted_env: ["VERCEL_TOKEN"],
    read_operations: [
      "get_project",
      "list_deployments",
      "get_deployment_logs",
    ],
    write_operations_guarded: ["create_project"],
    safety: {
      read_operations_execute_now: true,
      write_operations_execute_now: false,
      write_operations_policy: "Owner Gate + dry-run + approval queue.",
      namespace_boundary: "HockerAGI GitHub repositories only",
    },
  };
}
