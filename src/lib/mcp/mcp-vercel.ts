/**
 * Hocker ONE — Vercel MCP Connector
 *
 * Connects NOVA and AGIs to the official Vercel remote MCP endpoint.
 * MCP authentication is deliberately separate from the ordinary Vercel REST
 * token: only a credential explicitly provisioned for the MCP client/session
 * may be presented to mcp.vercel.com.
 */

import { McpClient, type McpProviderConfig, type McpTool } from "./mcp-client";
import { log } from "@/lib/logger";

export type VercelMcpConfig = {
  /** Access token explicitly scoped/provisioned for the Vercel MCP connection. */
  mcpAuthToken: string;
  /** Vercel team ID (optional context for tools that support it). */
  teamId?: string;
  /** Vercel project ID (optional context for tools that support it). */
  projectId?: string;
  /** Custom MCP server URL */
  mcpServerUrl?: string;
};

const VERCEL_MCP_DEFAULT_URL = "https://mcp.vercel.com";

export class McpVercelConnector {
  private client: McpClient;
  private config: VercelMcpConfig;
  private initialized = false;

  constructor(config: VercelMcpConfig) {
    this.config = config;

    const mcpUrl = config.mcpServerUrl ?? VERCEL_MCP_DEFAULT_URL;

    const providerConfig: McpProviderConfig = {
      id: "vercel",
      name: "Vercel MCP",
      type: "vercel",
      url: mcpUrl,
      authHeaders: {
        Authorization: `Bearer ${config.mcpAuthToken}`,
        ...(config.teamId ? { "X-Vercel-Team-Id": config.teamId } : {}),
      },
      transport: "http",
      timeoutMs: 30_000,
      enabled: Boolean(config.mcpAuthToken && mcpUrl),
    };

    this.client = new McpClient(providerConfig);
  }

  get isConnected(): boolean {
    return this.client.status === "connected";
  }

  get state() {
    return this.client.stateSnapshot;
  }

  /**
   * Initialize the Vercel MCP connection.
   */
  async initialize(): Promise<{
    capabilities: string[];
    version: string;
    tools: McpTool[];
  }> {
    try {
      const { capabilities, version } = await this.client.initialize();
      const tools = await this.client.listTools();
      this.initialized = true;

      log.info("Vercel MCP initialized", {
        route: "mcp-vercel",
        capabilities: capabilities.join(","),
        toolCount: tools.length,
      });

      return { capabilities, version, tools };
    } catch (err: unknown) {
      log.error("Vercel MCP initialization failed", {
        route: "mcp-vercel",
        detail: err instanceof Error ? err.message : "Unknown error",
      });
      throw err;
    }
  }

  async getDeploymentStatus(deploymentId?: string): Promise<unknown> {
    return this.client.callTool("get_deployment", {
      id: deploymentId ?? this.config.projectId,
    });
  }

  async listDeployments(limit?: number): Promise<unknown> {
    return this.client.callTool("list_deployments", {
      projectId: this.config.projectId,
      limit: limit ?? 10,
    });
  }

  async deploy(branch?: string): Promise<unknown> {
    return this.client.callTool("create_deployment", {
      projectId: this.config.projectId,
      branch,
    });
  }

  async getProject(): Promise<unknown> {
    return this.client.callTool("get_project", {
      id: this.config.projectId,
    });
  }

  async listEnvVars(): Promise<unknown> {
    return this.client.callTool("list_env_vars", {
      projectId: this.config.projectId,
    });
  }

  async setEnvVar(key: string, value: string, targets?: string[]): Promise<unknown> {
    return this.client.callTool("set_env_var", {
      projectId: this.config.projectId,
      key,
      value,
      targets: targets ?? ["production", "preview"],
    });
  }

  async removeEnvVar(key: string): Promise<unknown> {
    return this.client.callTool("remove_env_var", {
      projectId: this.config.projectId,
      key,
    });
  }

  async listDomains(): Promise<unknown> {
    return this.client.callTool("list_domains", {
      projectId: this.config.projectId,
    });
  }

  async addDomain(domain: string): Promise<unknown> {
    return this.client.callTool("add_domain", {
      projectId: this.config.projectId,
      domain,
    });
  }

  async getDeploymentLogs(deploymentId: string): Promise<unknown> {
    return this.client.callTool("get_deployment_logs", { id: deploymentId });
  }

  async ping(): Promise<boolean> {
    return this.client.ping();
  }

  getClient(): McpClient {
    return this.client;
  }

  disconnect(): void {
    this.client.disconnect();
    this.initialized = false;
  }
}

/**
 * Create a Vercel MCP connector from explicitly scoped environment variables.
 * VERCEL_TOKEN remains reserved for Vercel REST/API operations elsewhere.
 */
export function createVercelMcpConnector(): McpVercelConnector {
  return new McpVercelConnector({
    mcpAuthToken: process.env.VERCEL_MCP_AUTH_TOKEN ?? "",
    teamId: process.env.VERCEL_TEAM_ID,
    projectId: process.env.VERCEL_PROJECT_ID,
    mcpServerUrl: process.env.VERCEL_MCP_URL,
  });
}

export function isVercelMcpConfigured(): boolean {
  return Boolean(process.env.VERCEL_MCP_AUTH_TOKEN);
}
