/**
 * Hocker ONE — MCP Provider Registry
 *
 * Central registry that manages all MCP connections for NOVA and AGIs.
 * Provides unified access to Supabase, Vercel, GitHub, OpenAI, and Base44
 * through a single interface. AGIs query the registry to discover
 * available tools and execute operations across providers.
 */

import { McpClient, type McpProviderState, type McpTool, type McpTransport } from "./mcp-client";
import {
  McpSupabaseConnector,
  createSupabaseMcpConnector,
  isSupabaseMcpConfigured,
} from "./mcp-supabase";
import {
  McpVercelConnector,
  createVercelMcpConnector,
  isVercelMcpConfigured,
} from "./mcp-vercel";
import {
  McpGitHubConnector,
  createGitHubMcpConnector,
  isGitHubMcpConfigured,
} from "./mcp-github";
import {
  McpOpenAIConnector,
  createOpenAIMcpConnector,
  isOpenAIMcpConfigured,
} from "./mcp-openai";
import { log } from "@/lib/logger";
import { alertMcpProviderDown } from "@/lib/hocker-alerts";

// ── Base44 MCP Connector ─────────────────────────────────────
// Base44 is a Superagent platform. Unlike other connectors that use
// McpClient, Base44 exposes a simple HTTP API. This lightweight
// connector provides tool definitions and status detection.

function isBase44McpConfigured(): boolean {
  return Boolean(process.env.BASE44_API_KEY?.trim());
}

const BASE44_MCP_TOOLS: McpTool[] = [
  {
    name: "chat",
    description: "Send a message to a Base44 Superagent and receive a reply",
    inputSchema: {
      type: "object",
      properties: {
        message: { type: "string", description: "The message to send to the agent" },
        session_id: { type: "string", description: "Optional session ID for conversation continuity" },
      },
      required: ["message"],
    },
  },
  {
    name: "list_apps",
    description: "List all Base44 apps available to the authenticated user",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "get_app_status",
    description: "Check the status of a specific Base44 app (ready, processing, or errored)",
    inputSchema: {
      type: "object",
      properties: {
        app_id: { type: "string", description: "The Base44 app ID to check" },
      },
      required: ["app_id"],
    },
  },
];

class McpBase44Connector {
  state: McpProviderState = {
    id: "base44",
    status: "disconnected",
    lastPingAt: null,
    lastError: null,
    capabilities: ["chat", "list_apps", "get_app_status"],
    version: "base44-mcp-v1.0.0",
  };

  private readonly baseUrl = "https://api.base44.com";
  private readonly apiKey = String(process.env.BASE44_API_KEY ?? "").trim();

  async initialize(): Promise<{ capabilities: string[]; version: string; tools: McpTool[] }> {
    if (!isBase44McpConfigured()) {
      this.state.status = "disconnected";
      this.state.lastError = "BASE44_API_KEY not configured";
      throw new Error("BASE44_API_KEY not configured");
    }
    this.state.status = "connected";
    this.state.lastError = null;
    this.state.lastPingAt = new Date().toISOString();
    return {
      capabilities: this.state.capabilities,
      version: this.state.version ?? "base44-mcp-v1.0.0",
      tools: BASE44_MCP_TOOLS,
    };
  }

  getClient(): McpClient | null {
    return null;
  }

  async ping(): Promise<boolean> {
    return isBase44McpConfigured();
  }

  disconnect(): void {
    this.state.status = "disconnected";
  }

  /**
   * Execute a Base44 tool via the Base44 REST API.
   * Unlike McpClient-based connectors, Base44 uses direct HTTP calls.
   */
  async callTool(toolName: string, args?: Record<string, unknown>): Promise<unknown> {
    if (!isBase44McpConfigured()) {
      throw new Error("BASE44_API_KEY not configured");
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.apiKey}`,
    };

    switch (toolName) {
      case "chat": {
        const message = String(args?.message ?? "").trim();
        if (!message) throw new Error("message is required for base44.chat");
        const body: Record<string, unknown> = { message };
        if (args?.session_id) body.session_id = String(args.session_id);

        const res = await fetch(`${this.baseUrl}/v1/chat`, {
          method: "POST",
          headers,
          body: JSON.stringify(body),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(`Base44 chat failed: ${res.status} ${data?.error ?? res.statusText}`);
        }
        return data;
      }

      case "list_apps": {
        const res = await fetch(`${this.baseUrl}/v1/apps`, { headers });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(`Base44 list_apps failed: ${res.status} ${data?.error ?? res.statusText}`);
        }
        return data;
      }

      case "get_app_status": {
        const appId = String(args?.app_id ?? "").trim();
        if (!appId) throw new Error("app_id is required for base44.get_app_status");

        const res = await fetch(`${this.baseUrl}/v1/apps/${encodeURIComponent(appId)}/status`, { headers });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(`Base44 get_app_status failed: ${res.status} ${data?.error ?? res.statusText}`);
        }
        return data;
      }

      default:
        throw new Error(`Unknown Base44 tool: ${toolName}`);
    }
  }
}

function createBase44McpConnector(): McpBase44Connector {
  return new McpBase44Connector();
}

export type McpRegistryProvider = {
  id: string;
  name: string;
  type: string;
  configured: boolean;
  connected: boolean;
  capabilities: string[];
  toolCount: number;
  lastPingAt: string | null;
  lastError: string | null;
};

export type McpRegistryStatus = {
  version: string;
  totalProviders: number;
  connectedProviders: number;
  configuredProviders: number;
  providers: McpRegistryProvider[];
  tools: Record<string, McpTool[]>;
};

export const MCP_REGISTRY_VERSION = "hocker-mcp-registry-v1.1.0";

type ProviderEntry = {
  id: string;
  type: string;
  connector:
    | McpSupabaseConnector
    | McpVercelConnector
    | McpGitHubConnector
    | McpOpenAIConnector
    | McpBase44Connector
    | McpClient
    | null;
  configured: boolean;
  client: McpClient | null;
};

type DynamicMcpManifest = {
  id: string;
  name: string;
  url: string;
  auth_env?: Record<string, string>;
  transport?: McpTransport;
  enabled?: boolean;
};

function allowedDynamicMcpHosts(): Set<string> {
  return new Set(String(process.env.HOCKER_MCP_ALLOWED_HOSTS ?? "").split(",").map((item) => item.trim().toLowerCase()).filter(Boolean));
}

function dynamicMcpManifests(): DynamicMcpManifest[] {
  const raw = String(process.env.HOCKER_MCP_PROVIDERS_JSON ?? "").trim();
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) throw new Error("HOCKER_MCP_PROVIDERS_JSON must be an array");
    return parsed.slice(0, 32).map((entry) => {
      const item = entry && typeof entry === "object" ? entry as Record<string, unknown> : {};
      const id = String(item.id ?? "").trim().toLowerCase();
      const name = String(item.name ?? id).trim();
      const url = String(item.url ?? "").trim();
      const authEnv = item.auth_env && typeof item.auth_env === "object" && !Array.isArray(item.auth_env)
        ? Object.fromEntries(Object.entries(item.auth_env as Record<string, unknown>).map(([header, env]) => [header, String(env)]))
        : {};
      if (!/^[a-z0-9][a-z0-9_-]{1,48}$/.test(id)) throw new Error(`Invalid dynamic MCP id: ${id}`);
      const parsedUrl = new URL(url);
      if (!["https:", "http:"].includes(parsedUrl.protocol)) throw new Error(`Invalid MCP URL protocol for ${id}`);
      const allowedHosts = allowedDynamicMcpHosts();
      if (parsedUrl.protocol !== "https:" || !allowedHosts.has(parsedUrl.hostname.toLowerCase())) {
        throw new Error(`Dynamic MCP host not allowlisted: ${parsedUrl.hostname}`);
      }
      return {
        id,
        name,
        url,
        auth_env: authEnv,
        transport: item.transport === "sse" ? "sse" : "http",
        enabled: item.enabled !== false,
      };
    });
  } catch (error) {
    log.error("MCP dynamic provider manifest invalid", {
      route: "mcp-registry",
      detail: error instanceof Error ? error.message : "invalid_manifest",
    });
    return [];
  }
}

function dynamicAuthHeaders(manifest: DynamicMcpManifest): Record<string, string> {
  return Object.fromEntries(
    Object.entries(manifest.auth_env ?? {})
      .map(([header, envName]) => [header, String(process.env[envName] ?? "").trim()])
      .filter(([, value]) => Boolean(value)),
  );
}

class McpRegistrySingleton {
  private providers: Map<string, ProviderEntry> = new Map();
  private tools: Map<string, McpTool[]> = new Map();
  private initialized = false;

  /**
   * Initialize all configured MCP providers.
   */
  async initializeAll(): Promise<McpRegistryStatus> {
    log.info("MCP Registry: initializing all providers", { route: "mcp-registry" });

    // Register providers based on configuration
    this.registerProviders();

    // Initialize each configured provider
    const entries = Array.from(this.providers.values());
    const initPromises = entries
      .filter((e) => e.configured && e.connector)
      .map(async (e) => {
        try {
          const result = await (e.connector as { initialize: () => Promise<{ capabilities: string[]; version: string; tools: McpTool[] }> }).initialize();
          this.tools.set(e.id, result.tools);
          log.info(`MCP provider ${e.id} initialized`, {
            route: "mcp-registry",
            provider: e.id,
            toolCount: result.tools.length,
          });
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : "Unknown error";
          log.error(`MCP provider ${e.id} initialization failed`, {
            route: "mcp-registry",
            provider: e.id,
            detail: msg,
          });
          alertMcpProviderDown(e.id, msg);
        }
      });

    await Promise.allSettled(initPromises);
    this.initialized = true;

    return this.getStatus();
  }

  private registerProviders(): void {
    // Supabase
    const supabaseConfigured = isSupabaseMcpConfigured();
    this.providers.set("supabase", {
      id: "supabase",
      type: "supabase",
      connector: supabaseConfigured ? createSupabaseMcpConnector() : null,
      configured: supabaseConfigured,
      client: null,
    });

    // Vercel
    const vercelConfigured = isVercelMcpConfigured();
    this.providers.set("vercel", {
      id: "vercel",
      type: "vercel",
      connector: vercelConfigured ? createVercelMcpConnector() : null,
      configured: vercelConfigured,
      client: null,
    });

    // GitHub
    const githubConfigured = isGitHubMcpConfigured();
    this.providers.set("github", {
      id: "github",
      type: "github",
      connector: githubConfigured ? createGitHubMcpConnector() : null,
      configured: githubConfigured,
      client: null,
    });

    // OpenAI
    const openaiConfigured = isOpenAIMcpConfigured();
    this.providers.set("openai", {
      id: "openai",
      type: "openai",
      connector: openaiConfigured ? createOpenAIMcpConnector() : null,
      configured: openaiConfigured,
      client: null,
    });

    // Dynamic custom MCP providers. These are server-side manifests only.
    // New providers are connected through the same McpClient/registry and default
    // to protected execution policy until a provider/tool is explicitly classified.
    for (const manifest of dynamicMcpManifests()) {
      const authHeaders = dynamicAuthHeaders(manifest);
      const configured = manifest.enabled !== false && Boolean(manifest.url);
      this.providers.set(manifest.id, {
        id: manifest.id,
        type: "custom",
        connector: configured
          ? new McpClient({
              id: manifest.id,
              name: manifest.name,
              type: "custom",
              url: manifest.url,
              authHeaders,
              transport: manifest.transport,
              enabled: true,
            })
          : null,
        configured,
        client: null,
      });
    }

    // Base44
    const base44Configured = isBase44McpConfigured();
    this.providers.set("base44", {
      id: "base44",
      type: "base44",
      connector: base44Configured ? createBase44McpConnector() : null,
      configured: base44Configured,
      client: null,
    });
  }

  /**
   * Get the status of all MCP providers.
   */
  getStatus(): McpRegistryStatus {
    const providerList: McpRegistryProvider[] = [];
    const toolsMap: Record<string, McpTool[]> = {};

    for (const [id, entry] of this.providers) {
      const state = this.getProviderState(entry);
      providerList.push({
        id,
        name: this.getProviderName(id),
        type: entry.type,
        configured: entry.configured,
        connected: state.status === "connected",
        capabilities: state.capabilities,
        toolCount: this.tools.get(id)?.length ?? 0,
        lastPingAt: state.lastPingAt,
        lastError: state.lastError,
      });
      const providerTools = this.tools.get(id);
      if (providerTools) {
        toolsMap[id] = providerTools;
      }
    }

    const configured = providerList.filter((p) => p.configured);
    const connected = providerList.filter((p) => p.connected);

    return {
      version: MCP_REGISTRY_VERSION,
      totalProviders: providerList.length,
      connectedProviders: connected.length,
      configuredProviders: configured.length,
      providers: providerList,
      tools: toolsMap,
    };
  }

  private getProviderState(entry: ProviderEntry): McpProviderState {
    if (!entry.connector) {
      return {
        id: entry.id,
        status: "disconnected",
        lastPingAt: null,
        lastError: "Not configured",
        capabilities: [],
        version: null,
      };
    }

    const connector = entry.connector as { state: McpProviderState };
    return connector.state;
  }

  private getProviderName(id: string): string {
    const names: Record<string, string> = {
      supabase: "Supabase MCP",
      vercel: "Vercel MCP",
      github: "GitHub MCP",
      openai: "OpenAI MCP",
      base44: "Base44 MCP",
    };
    return names[id] ?? id;
  }

  /**
   * Get a specific provider connector.
   */
  getProvider<T>(id: string): T | null {
    const entry = this.providers.get(id);
    if (!entry?.connector) return null;
    return entry.connector as unknown as T;
  }

  /**
   * Get the Supabase connector.
   */
  get supabase(): McpSupabaseConnector | null {
    return this.getProvider<McpSupabaseConnector>("supabase");
  }

  /**
   * Get the Vercel connector.
   */
  get vercel(): McpVercelConnector | null {
    return this.getProvider<McpVercelConnector>("vercel");
  }

  /**
   * Get the GitHub connector.
   */
  get github(): McpGitHubConnector | null {
    return this.getProvider<McpGitHubConnector>("github");
  }

  /**
   * Get the OpenAI connector.
   */
  get openai(): McpOpenAIConnector | null {
    return this.getProvider<McpOpenAIConnector>("openai");
  }

  /**
   * Get the Base44 connector.
   */
  get base44(): McpBase44Connector | null {
    return this.getProvider<McpBase44Connector>("base44");
  }

  /**
   * Execute a tool on a specific provider.
   */
  async executeTool(providerId: string, toolName: string, args?: Record<string, unknown>): Promise<unknown> {
    const entry = this.providers.get(providerId);
    if (!entry?.connector) {
      throw new Error(`MCP provider ${providerId} not found or not configured.`);
    }

    try {
      let result: unknown;

      // Base44 uses direct HTTP calls (no McpClient), so call its callTool directly
      if (providerId === "base44") {
        const base44Connector = entry.connector as { callTool: (name: string, a?: Record<string, unknown>) => Promise<unknown> };
        result = await base44Connector.callTool(toolName, args);
      } else {
        const connector = entry.connector as { getClient: () => McpClient };
        const client = connector.getClient();
        if (!client) {
          throw new Error(`MCP provider ${providerId} client not available.`);
        }
        result = await client.callTool(toolName, args);
      }

      log.info("MCP tool executed", {
        route: "mcp-registry",
        provider: providerId,
        tool: toolName,
      });
      return result;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      log.error("MCP tool execution failed", {
        route: "mcp-registry",
        provider: providerId,
        tool: toolName,
        detail: msg,
      });
      alertMcpProviderDown(providerId, msg);
      throw err;
    }
  }

  /**
   * Ping all providers and update their status.
   */
  async pingAll(): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};

    const entries = Array.from(this.providers.values());
    const pingPromises = entries
      .filter((e) => e.configured && e.connector)
      .map(async (e) => {
        try {
          const connector = e.connector as { ping: () => Promise<boolean> };
          results[e.id] = await connector.ping();
        } catch {
          results[e.id] = false;
        }
      });

    await Promise.allSettled(pingPromises);
    return results;
  }

  /**
   * Disconnect all providers.
   */
  disconnectAll(): void {
    for (const entry of this.providers.values()) {
      if (entry.connector) {
        const connector = entry.connector as { disconnect: () => void };
        connector.disconnect();
      }
    }
    this.tools.clear();
    this.initialized = false;
  }

  /**
   * Check if the registry has been initialized.
   */
  get isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Discover tools across all providers matching a query.
   */
  discoverTools(query: string): Array<{ provider: string; tool: McpTool }> {
    const results: Array<{ provider: string; tool: McpTool }> = [];
    const lowerQuery = query.toLowerCase();

    for (const [providerId, toolList] of this.tools) {
      for (const tool of toolList) {
        const matchName = tool.name.toLowerCase().includes(lowerQuery);
        const matchDesc = tool.description?.toLowerCase().includes(lowerQuery);
        if (matchName || matchDesc) {
          results.push({ provider: providerId, tool });
        }
      }
    }

    return results;
  }
}

// Singleton instance
let registryInstance: McpRegistrySingleton | null = null;

/**
 * Get the MCP registry singleton.
 */
export function getMcpRegistry(): McpRegistrySingleton {
  if (!registryInstance) {
    registryInstance = new McpRegistrySingleton();
  }
  return registryInstance;
}

/**
 * Reset the MCP registry (for testing or reinitialization).
 */
export function resetMcpRegistry(): void {
  if (registryInstance) {
    registryInstance.disconnectAll();
  }
  registryInstance = null;
}

/**
 * Check if any MCP provider is configured.
 */
export function isAnyMcpConfigured(): boolean {
  return (
    isSupabaseMcpConfigured() ||
    isVercelMcpConfigured() ||
    isGitHubMcpConfigured() ||
    isOpenAIMcpConfigured() ||
    isBase44McpConfigured() ||
    dynamicMcpManifests().length > 0
  );
}

/**
 * Get a summary of MCP configuration for the NOVA system.
 */
export function getMcpConfigurationSummary(): Record<string, { configured: boolean; required: string[] }> {
  return {
    supabase: {
      configured: isSupabaseMcpConfigured(),
      required: ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SECRET_KEY or SUPABASE_PUBLISHABLE_KEY"],
    },
    vercel: {
      configured: isVercelMcpConfigured(),
      required: ["VERCEL_TOKEN"],
    },
    github: {
      configured: isGitHubMcpConfigured(),
      required: ["GITHUB_TOKEN"],
    },
    openai: {
      configured: isOpenAIMcpConfigured(),
      required: ["OPENAI_API_KEY"],
    },
    base44: {
      configured: isBase44McpConfigured(),
      required: ["BASE44_API_KEY"],
    },
    custom: {
      configured: dynamicMcpManifests().length > 0,
      required: ["HOCKER_MCP_PROVIDERS_JSON"],
    },
  };
}
