import { getMcpRegistry } from "@/lib/mcp/mcp-registry";

export const MCP_PROVIDER_IDS = ["supabase", "vercel", "github", "openai", "base44"] as const;
export type McpProviderId = (typeof MCP_PROVIDER_IDS)[number];

const PROVIDERS = new Set<string>(MCP_PROVIDER_IDS);
const SENSITIVE_KEY = /(authorization|cookie|password|passwd|secret|token|api[_-]?key|private[_-]?key)/i;
const SAFE_TOOL_NAME = /^[a-z0-9_.:-]+$/i;
const MAX_ARGS_BYTES = 16 * 1024;

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

export function isReadOnlyMcpTool(provider: McpProviderId, tool: string): boolean {
  const clean = String(tool || "").trim();
  return READ_ONLY_TOOLS[provider].some((pattern) => pattern.test(clean));
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

  if (!PROVIDERS.has(provider)) throw new Error("Proveedor MCP no permitido.");
  if (!tool || tool.length > 160 || !SAFE_TOOL_NAME.test(tool)) throw new Error("Herramienta MCP inválida.");
  if (actionType !== "mcp.execute" || toolKey !== "mcp") throw new Error("Borrador MCP con contrato inválido.");
  if (!requiresApproval || target !== "hocker.one.owner-gate") throw new Error("Borrador MCP fuera del Owner Gate.");
  if (hasSensitiveKey(args)) throw new Error("Argumentos MCP contienen secretos o credenciales.");
  if (Buffer.byteLength(JSON.stringify(args), "utf8") > MAX_ARGS_BYTES) throw new Error("Argumentos MCP demasiado grandes.");

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
