/**
 * Hocker ONE — MCP Provider Registry
 *
 * Central registry that manages all MCP connections for NOVA and AGIs.
 * Provides unified access to Supabase, Vercel, GitHub, and OpenAI
 * through a single interface. AGIs query the registry to discover
 * available tools and execute operations across providers.
 */

import { McpClient, type McpProviderState, type McpTool } from "./mcp-client";
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

export const MCP_REGISTRY_VERSION = "hocker-mcp-registry-v1.0.0";

type ProviderEntry = {
  id: string;
  type: string;
  connector:
    | McpSupabaseConnector
    | McpVercelConnector
    | McpGitHubConnector
    | McpOpenAIConnector
    | null;
  configured: boolean;
  client: McpClient | null;
};

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
   * Execute a tool on a specific provider.
   */
  async executeTool(providerId: string, toolName: string, args?: Record<string, unknown>): Promise<unknown> {
    const entry = this.providers.get(providerId);
    if (!entry?.connector) {
      throw new Error(`MCP provider ${providerId} not found or not configured.`);
    }

    const connector = entry.connector as { getClient: () => McpClient };
    const client = connector.getClient();
    if (!client) {
      throw new Error(`MCP provider ${providerId} client not available.`);
    }

    try {
      const result = await client.callTool(toolName, args);
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
    isOpenAIMcpConfigured()
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
  };
}
