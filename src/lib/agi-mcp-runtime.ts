import { randomUUID } from "node:crypto";
import {
  MCP_PROVIDER_IDS,
  assertMcpReadToolPolicy,
  isReadOnlyMcpTool,
  type McpProviderId,
} from "@/lib/mcp/mcp-policy";
import { getMcpRegistry } from "@/lib/mcp/mcp-registry";
import type { AgiNativeTool, AgiToolCall, AgiToolResult } from "@/lib/agi-model-providers/types";
import { getHockerCapabilitiesContract } from "@/lib/hocker-capabilities-contract";

type JsonRecord = Record<string, unknown>;

type NativeToolOwnership = { owner_agi: string | null; support_agis: string[]; capability_keys: string[] };

function ownershipForProvider(providerId: string): NativeToolOwnership {
  const capabilities = getHockerCapabilitiesContract().capabilities.filter((capability) =>
    capability.tool_keys.some((toolKey) => toolKey === providerId),
  );
  return {
    owner_agi: capabilities[0]?.owner_agi ?? null,
    support_agis: [...new Set(capabilities.flatMap((capability) => capability.support_agis))].slice(0, 12),
    capability_keys: capabilities.map((capability) => capability.key).slice(0, 12),
  };
}

export type AgiMcpToolCall = {
  id: string;
  provider: McpProviderId;
  tool: string;
  qualified_name: string;
  args: JsonRecord;
};

export type AgiMcpToolResult = {
  id: string;
  name: string;
  executed: boolean;
  needs_approval: boolean;
  result: {
    ok: boolean;
    data?: unknown;
    error?: string;
  };
};

export type AgiMcpEnvelope = {
  reply: string;
  tool_calls: AgiMcpToolCall[];
};

const MAX_TOOL_CALLS = 8;
const MAX_TOOL_ARGS_BYTES = 16 * 1024;
const MAX_TOOL_RESULT_BYTES = 24 * 1024;
const SAFE_TOOL = /^[a-z0-9_.:-]+$/i;
const SAFE_NATIVE_TOOL = /^[a-zA-Z0-9_-]{1,64}$/;
const SENSITIVE_KEY = /(authorization|cookie|password|passwd|secret|token|api[_-]?key|private[_-]?key)/i;
const PROVIDERS = new Set<string>(MCP_PROVIDER_IDS);

const SENSITIVE_TEXT_PATTERNS: Array<[RegExp, string]> = [
  [/-----BEGIN [A-Z0-9 ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z0-9 ]*PRIVATE KEY-----/g, "[redacted-private-key]"],
  [/\bBearer\s+[A-Za-z0-9._~+/=-]{8,}\b/gi, "Bearer [redacted]"],
  [/\bsk-(?:proj-)?[A-Za-z0-9_-]{12,}\b/g, "[redacted-openai-key]"],
  [/\b(?:gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,})\b/g, "[redacted-github-token]"],
  [/\bAIza[0-9A-Za-z_-]{20,}\b/g, "[redacted-google-key]"],
  [/\bAKIA[0-9A-Z]{16}\b/g, "[redacted-aws-key]"],
  [/\b(?:sk|rk)_(?:live|test)_[A-Za-z0-9]{12,}\b/g, "[redacted-stripe-key]"],
  [/\bwhsec_[A-Za-z0-9_-]{12,}\b/g, "[redacted-webhook-secret]"],
  [/\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g, "[redacted-jwt]"],
];

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonRecord)
    : {};
}

function hasSensitiveKey(value: unknown, depth = 0): boolean {
  if (depth > 8) return true;
  if (Array.isArray(value)) return value.some((item) => hasSensitiveKey(item, depth + 1));
  if (!value || typeof value !== "object") return false;
  return Object.entries(value as JsonRecord).some(
    ([key, child]) => SENSITIVE_KEY.test(key) || hasSensitiveKey(child, depth + 1),
  );
}

function sanitizeTextValue(value: string): string {
  let text = value;
  for (const [pattern, replacement] of SENSITIVE_TEXT_PATTERNS) {
    text = text.replace(pattern, replacement);
  }
  text = text.replace(
    /((?:api[_-]?key|secret|token|password|passwd|authorization)\s*[:=]\s*["']?)[^\s"',;}{]{8,}/gi,
    "$1[redacted]",
  );
  return text.length > 12_000 ? `${text.slice(0, 11_999)}…` : text;
}

function sanitizeResult(value: unknown, qualifiedName: string, depth = 0): unknown {
  if (depth > 8) return "[truncated]";
  if (Array.isArray(value)) return value.slice(0, 100).map((item) => sanitizeResult(item, qualifiedName, depth + 1));
  if (!value || typeof value !== "object") {
    if (typeof value === "string") return sanitizeTextValue(value);
    return value;
  }

  const output: JsonRecord = {};
  for (const [key, child] of Object.entries(value as JsonRecord)) {
    if (SENSITIVE_KEY.test(key)) {
      output[key] = "[redacted]";
      continue;
    }
    if (/^vercel\.(env\.list|list_env|list_environment_variables)$/i.test(qualifiedName) && key.toLowerCase() === "value") {
      output[key] = "[redacted]";
      continue;
    }
    output[key] = sanitizeResult(child, qualifiedName, depth + 1);
  }
  return output;
}

function normalizeToolCall(raw: unknown): AgiMcpToolCall | null {
  const item = asRecord(raw);
  const qualified = String(item.name ?? item.tool ?? item.function ?? "").trim();
  if (!qualified || qualified.length > 180 || !SAFE_TOOL.test(qualified)) return null;
  const separator = qualified.indexOf(".");
  if (separator < 1) return null;

  const provider = qualified.slice(0, separator).toLowerCase();
  const tool = qualified.slice(separator + 1);
  if (!PROVIDERS.has(provider) || !tool || !SAFE_TOOL.test(tool)) return null;

  const rawArgs = item.args ?? item.arguments ?? item.input ?? {};
  const args = asRecord(rawArgs);
  if (Buffer.byteLength(JSON.stringify(args), "utf8") > MAX_TOOL_ARGS_BYTES) return null;
  if (hasSensitiveKey(args)) return null;

  return {
    id: String(item.id ?? `tc_${randomUUID()}`).slice(0, 160),
    provider: provider as McpProviderId,
    tool,
    qualified_name: `${provider}.${tool}`,
    args,
  };
}

export function parseAgiMcpEnvelope(text: string): AgiMcpEnvelope {
  const clean = String(text ?? "").trim();
  if (!clean) return { reply: "", tool_calls: [] };

  const calls: AgiMcpToolCall[] = [];
  const push = (raw: unknown) => {
    if (calls.length >= MAX_TOOL_CALLS) return;
    const normalized = normalizeToolCall(raw);
    if (normalized) calls.push(normalized);
  };

  try {
    const parsed = JSON.parse(clean) as JsonRecord;
    if (Array.isArray(parsed.tool_calls)) parsed.tool_calls.forEach(push);
    return {
      reply: String(parsed.reply ?? parsed.message ?? "").trim() || (calls.length ? "" : clean),
      tool_calls: calls,
    };
  } catch {
    // Continue with delimited/inline compatibility parsing.
  }

  const blockPattern = /<tool_call>\s*([\s\S]*?)\s*<\/tool_call>/gi;
  let match: RegExpExecArray | null;
  while (calls.length < MAX_TOOL_CALLS && (match = blockPattern.exec(clean)) !== null) {
    try {
      push(JSON.parse(String(match[1] ?? "").trim()));
    } catch {
      // Malformed tool block is ignored rather than executed.
    }
  }

  if (!calls.length) {
    const inline = /\{[^{}]*"(?:name|tool)"\s*:\s*"[^"]+"[^{}]*\}/g;
    while (calls.length < MAX_TOOL_CALLS && (match = inline.exec(clean)) !== null) {
      try {
        push(JSON.parse(match[0]));
      } catch {
        // Ignore malformed inline candidate.
      }
    }
  }

  const reply = clean
    .replace(blockPattern, "")
    .replace(/\{[^{}]*"tool_calls"\s*:\s*\[[\s\S]*?\]\s*\}/g, "")
    .trim();
  return { reply: reply || (calls.length ? "" : clean), tool_calls: calls };
}

function ownerGateDraft(call: AgiMcpToolCall): JsonRecord {
  return {
    draft_id: randomUUID(),
    action_type: "mcp.execute",
    tool_key: "mcp",
    provider: call.provider,
    tool: call.tool,
    args: call.args,
    requires_approval: true,
    execution_target: "hocker.one.owner-gate",
  };
}

async function ensureRegistry() {
  const registry = getMcpRegistry();
  if (!registry.isInitialized) await registry.initializeAll();
  return registry;
}

export async function buildAgiMcpPromptBlock(): Promise<string> {
  const registry = await ensureRegistry();
  const status = registry.getStatus();
  const connected = new Set(status.providers.filter((item) => item.connected).map((item) => item.id));
  const lines: string[] = [];

  for (const provider of status.providers) {
    if (!connected.has(provider.id)) continue;
    for (const tool of (status.tools[provider.id] ?? []).slice(0, 80)) {
      const mode = isReadOnlyMcpTool(provider.id as McpProviderId, tool.name) ? "READ" : "OWNER_GATE";
      lines.push(`- ${provider.id}.${tool.name} [${mode}]: ${String(tool.description ?? "").replace(/\s+/g, " ").slice(0, 220)}`);
    }
  }

  if (!lines.length) return "MCP: no hay herramientas conectadas; no inventes datos de integraciones.";

  return [
    "═══ HOCKER MCP TOOLS ═══",
    "Usa herramientas para consultar estado real cuando corresponda. Nunca inventes una lectura que pueda verificarse.",
    "Para invocarlas responde con un JSON válido: {\"reply\":\"mensaje natural\",\"tool_calls\":[{\"name\":\"provider.tool\",\"args\":{...}}]}",
    "Máximo 8 tool_calls. READ puede ejecutarse automáticamente. OWNER_GATE nunca se ejecuta aquí: sólo prepara un borrador para aprobación en Hocker One.",
    ...lines,
    "No incluyas credenciales, tokens, passwords, cookies ni secretos en argumentos.",
    "═══ END HOCKER MCP TOOLS ═══",
  ].join("\n");
}

export async function executeAgiMcpToolCalls(
  calls: AgiMcpToolCall[],
  options: { allow_actions: boolean },
): Promise<AgiMcpToolResult[]> {
  const registry = await ensureRegistry();
  const status = registry.getStatus();
  const results: AgiMcpToolResult[] = [];

  for (const call of calls.slice(0, MAX_TOOL_CALLS)) {
    const providerState = status.providers.find((item) => item.id === call.provider);
    const toolExists = (status.tools[call.provider] ?? []).some((tool) => tool.name === call.tool);
    if (!providerState?.configured || !providerState.connected || !toolExists) {
      results.push({
        id: call.id,
        name: call.qualified_name,
        executed: false,
        needs_approval: false,
        result: { ok: false, error: "MCP_TOOL_NOT_CONNECTED" },
      });
      continue;
    }

    if (!isReadOnlyMcpTool(call.provider, call.tool)) {
      const draft = options.allow_actions ? ownerGateDraft(call) : undefined;
      results.push({
        id: call.id,
        name: call.qualified_name,
        executed: false,
        needs_approval: Boolean(draft),
        result: {
          ok: false,
          error: draft ? "MCP_MUTATION_REQUIRES_HOCKER_ONE_OWNER_GATE" : "MCP_MUTATION_NOT_AUTHORIZED",
          data: draft,
        },
      });
      continue;
    }

    try {
      assertMcpReadToolPolicy(call.provider, call.tool, call.args);
    } catch {
      results.push({
        id: call.id,
        name: call.qualified_name,
        executed: false,
        needs_approval: false,
        result: { ok: false, error: "MCP_READ_BLOCKED_BY_POLICY" },
      });
      continue;
    }

    try {
      const raw = await registry.executeTool(call.provider, call.tool, call.args);
      results.push({
        id: call.id,
        name: call.qualified_name,
        executed: true,
        needs_approval: false,
        result: { ok: true, data: sanitizeResult(raw, call.qualified_name) },
      });
    } catch {
      results.push({
        id: call.id,
        name: call.qualified_name,
        executed: false,
        needs_approval: false,
        result: {
          ok: false,
          error: "MCP_TOOL_EXECUTION_FAILED",
        },
      });
    }
  }
  return results;
}

export function collectAgiMcpDeferredActions(results: AgiMcpToolResult[]): JsonRecord[] {
  return results
    .filter((item) => item.needs_approval && !item.executed)
    .map((item) => asRecord(item.result.data))
    .filter((item) => Object.keys(item).length > 0)
    .slice(0, MAX_TOOL_CALLS);
}

export function buildAgiMcpResultBlock(results: AgiMcpToolResult[]): string {
  const rows = results.map((item) => ({
    name: item.name,
    ok: item.result.ok,
    executed: item.executed,
    needs_approval: item.needs_approval,
    data: item.result.data,
    error: item.result.error,
  }));
  const json = JSON.stringify(rows, null, 2);
  const bounded = Buffer.byteLength(json, "utf8") <= MAX_TOOL_RESULT_BYTES
    ? json
    : `${json.slice(0, MAX_TOOL_RESULT_BYTES - 1)}…`;
  return [
    "Resultados reales de herramientas HOCKER:",
    bounded,
    "Responde ahora de forma natural usando sólo estos datos. No inventes valores faltantes. Si una acción requiere Owner Gate, dilo sin afirmar que ya se ejecutó.",
  ].join("\n\n");
}


function nativeToolName(provider: string, tool: string): string {
  const raw = `hocker__${provider}__${tool}`.replace(/[^a-zA-Z0-9_-]/g, "_");
  return raw.slice(0, 64);
}

function nativeToolDefinitionsFromStatus(status: ReturnType<ReturnType<typeof getMcpRegistry>["getStatus"]>): AgiNativeTool[] {
  const definitions: AgiNativeTool[] = [];
  for (const provider of status.providers.filter((item) => item.connected)) {
    for (const tool of status.tools[provider.id] ?? []) {
      const qualifiedName = `${provider.id}.${tool.name}`;
      const name = nativeToolName(provider.id, tool.name);
      if (!SAFE_NATIVE_TOOL.test(name)) continue;
      const parameters = tool.inputSchema && typeof tool.inputSchema === "object" && !Array.isArray(tool.inputSchema)
        ? tool.inputSchema
        : { type: "object", properties: {} };
      const ownership = ownershipForProvider(provider.id);
      definitions.push({
        name,
        qualified_name: qualifiedName,
        description: String(tool.description ?? `${qualifiedName} MCP tool`).slice(0, 900),
        parameters,
        metadata: ownership,
      });
    }
  }
  return definitions.slice(0, 96);
}

export async function buildAgiNativeMcpTools(query?: string): Promise<AgiNativeTool[]> {
  const registry = await ensureRegistry();
  const status = registry.getStatus();
  const all = nativeToolDefinitionsFromStatus(status);
  const clean = String(query ?? "").trim().toLowerCase();
  if (!clean) return all;

  const words = clean.split(/\\s+/).filter(Boolean).slice(0, 6);
  return all.filter((tool) => {
    const haystack = `${tool.qualified_name} ${tool.name} ${tool.description ?? ""}`.toLowerCase();
    return words.some((word) => haystack.includes(word));
  }).slice(0, 32);
}

export function resolveNativeMcpTool(name: string): { provider: McpProviderId; tool: string; qualified_name: string } | null {
  const match = String(name ?? "").match(/^hocker__([^_]+)__([a-z0-9_.:-]+)$/i);
  if (!match) return null;
  const provider = match[1].toLowerCase();
  const tool = match[2];
  if (!PROVIDERS.has(provider) || !tool) return null;
  return {
    provider: provider as McpProviderId,
    tool,
    qualified_name: `${provider}.${tool}`,
  };
}

export function toLegacyAgiMcpToolCalls(toolCalls: AgiToolCall[]): AgiMcpToolCall[] {
  return toolCalls.map((call) => ({
    id: call.id,
    provider: call.qualified_name.split(".")[0] as McpProviderId,
    tool: call.qualified_name.split(".").slice(1).join("."),
    qualified_name: call.qualified_name,
    args: call.args,
  }));
}

export function nativeResultsToLegacy(results: AgiToolResult[]): AgiMcpToolResult[] {
  return results.map((item) => ({
    id: item.id,
    name: item.qualified_name,
    executed: item.ok,
    needs_approval: false,
    result: item.ok ? { ok: true, data: item.result } : { ok: false, error: "NATIVE_TOOL_EXECUTION_FAILED" },
  }));
}
