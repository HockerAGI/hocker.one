import { createAdminSupabase } from "@/lib/supabase-admin";

export type PersistedRuntimeIntegration = {
  tool_key: string;
  name: string;
  provider: string;
  category: string;
  status: string;
  status_label: string;
  status_hint: string;
  implementation_status: string;
  execution_enabled: boolean;
  supports_read: boolean;
  supports_write: boolean;
  supports_realtime: boolean;
  last_checked_at: string | null;
};

type ToolRow = {
  tool_key: string;
  name: string;
  provider: string;
  category: string;
  status: string;
  supports_read: boolean;
  supports_write: boolean;
  supports_realtime: boolean;
  meta: Record<string, unknown> | null;
};

type CheckRow = {
  status: string;
  configured: boolean;
  last_checked_at: string | null;
  message: string | null;
};

function text(value: unknown, fallback = ""): string {
  const result = String(value ?? "").trim();
  return result || fallback;
}

function bool(value: unknown): boolean {
  return value === true || value === "true";
}

function labelFor(status: string): string {
  if (status === "connected" || status === "configured") return "Conectado";
  if (status === "partial") return "Parcial";
  if (status === "missing_code") return "Falta código";
  if (status === "missing_key" || status === "missing") return "Falta llave";
  if (status === "blocked") return "Bloqueado";
  return "En revisión";
}

export async function getPersistedRuntimeIntegrations(
  projectId: string,
): Promise<PersistedRuntimeIntegration[]> {
  const sb = createAdminSupabase();
  const [{ data: tools, error: toolsError }, { data: checks, error: checksError }] =
    await Promise.all([
      sb
        .from("agi_tools")
        .select(
          "tool_key,name,provider,category,status,supports_read,supports_write,supports_realtime,meta",
        )
        .order("tool_key", { ascending: true }),
      sb
        .from("agi_integration_checks")
        .select("status,configured,last_checked_at,message")
        .eq("project_id", projectId)
        .eq("tool_key", "ai_gateway")
        .order("last_checked_at", { ascending: false })
        .limit(1),
    ]);

  if (toolsError) throw new Error(`AGI_TOOLS_STATE_FAILED: ${toolsError.message}`);
  if (checksError) throw new Error(`AGI_GATEWAY_CHECK_FAILED: ${checksError.message}`);

  const latestGatewayCheck = (checks?.[0] ?? null) as CheckRow | null;

  return ((tools ?? []) as ToolRow[]).map((tool) => {
    const meta = tool.meta ?? {};
    let status = text(tool.status, "missing_key");
    let statusHint = text(meta.status_hint, "Estado pendiente de verificación.");
    let executionEnabled = bool(meta.execution_enabled);
    let lastCheckedAt: string | null = null;

    if (tool.tool_key === "ai_gateway" && latestGatewayCheck) {
      const healthy =
        latestGatewayCheck.status === "healthy" && latestGatewayCheck.configured === true;
      status = healthy ? "connected" : "partial";
      executionEnabled = healthy;
      statusHint =
        latestGatewayCheck.message ??
        (healthy
          ? "Inferencia real verificada."
          : "La última inferencia real no completó la autenticación.");
      lastCheckedAt = latestGatewayCheck.last_checked_at;
    }

    return {
      tool_key: tool.tool_key,
      name: tool.name,
      provider: tool.provider,
      category: tool.category,
      status,
      status_label: labelFor(status),
      status_hint: statusHint,
      implementation_status: text(meta.implementation_status, "missing_code"),
      execution_enabled: executionEnabled,
      supports_read: tool.supports_read,
      supports_write: tool.supports_write,
      supports_realtime: tool.supports_realtime,
      last_checked_at: lastCheckedAt,
    };
  });
}
