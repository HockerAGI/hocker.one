/**
 * Hocker ONE — Vercel MCP Connector
 *
 * Connects NOVA and AGIs to the Vercel MCP server for direct
 * deployment, project, domain, and environment variable management
 * without needing external platforms like the Vercel Dashboard.
 */

import { McpClient, type McpProviderConfig, type McpTool } from "./mcp-client";
import { log } from "@/lib/logger";

export type VercelMcpConfig = {
  /** Vercel access token presented to the remote MCP server */
  vercelToken: string;
  /** Vercel team ID (optional) */
  teamId?: string;
  /** Vercel project ID (optional) */
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
        Authorization: `Bearer ${config.vercelToken}`,
        ...(config.teamId ? { "X-Vercel-Team-Id": config.teamId } : {}),
      },
      transport: "http",
      timeoutMs: 30_000,
      enabled: Boolean(config.vercelToken && mcpUrl),
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

  /**
   * Get deployment status.
   */
  async getDeploymentStatus(deploymentId?: string): Promise<unknown> {
    return this.client.callTool("get_deployment", {
      id: deploymentId ?? this.config.projectId,
    });
  }

  /**
   * List deployments for the project.
   */
  async listDeployments(limit?: number): Promise<unknown> {
    return this.client.callTool("list_deployments", {
      projectId: this.config.projectId,
      limit: limit ?? 10,
    });
  }

  /**
   * Trigger a new deployment.
   */
  async deploy(branch?: string): Promise<unknown> {
    return this.client.callTool("create_deployment", {
      projectId: this.config.projectId,
      branch,
    });
  }

  /**
   * Get project information.
   */
  async getProject(): Promise<unknown> {
    return this.client.callTool("get_project", {
      id: this.config.projectId,
    });
  }

  /**
   * List environment variables.
   */
  async listEnvVars(): Promise<unknown> {
    return this.client.callTool("list_env_vars", {
      projectId: this.config.projectId,
    });
  }

  /**
   * Set an environment variable.
   */
  async setEnvVar(key: string, value: string, targets?: string[]): Promise<unknown> {
    return this.client.callTool("set_env_var", {
      projectId: this.config.projectId,
      key,
      value,
      targets: targets ?? ["production", "preview"],
    });
  }

  /**
   * Remove an environment variable.
   */
  async removeEnvVar(key: string): Promise<unknown> {
    return this.client.callTool("remove_env_var", {
      projectId: this.config.projectId,
      key,
    });
  }

  /**
   * List domains.
   */
  async listDomains(): Promise<unknown> {
    return this.client.callTool("list_domains", {
      projectId: this.config.projectId,
    });
  }

  /**
   * Add a domain.
   */
  async addDomain(domain: string): Promise<unknown> {
    return this.client.callTool("add_domain", {
      projectId: this.config.projectId,
      domain,
    });
  }

  /**
   * Get deployment logs.
   */
  async getDeploymentLogs(deploymentId: string): Promise<unknown> {
    return this.client.callTool("get_deployment_logs", { id: deploymentId });
  }

  /**
   * Ping the Vercel MCP server.
   */
  async ping(): Promise<boolean> {
    return this.client.ping();
  }

  /**
   * Get the underlying MCP client (for registry tool execution).
   */
  getClient(): McpClient {
    return this.client;
  }

  /**
   * Disconnect from the Vercel MCP server.
   */
  disconnect(): void {
    this.client.disconnect();
    this.initialized = false;
  }
}

/**
 * Create a Vercel MCP connector from environment variables.
 */
export function createVercelMcpConnector(): McpVercelConnector {
  return new McpVercelConnector({
    vercelToken: process.env.VERCEL_TOKEN ?? "",
    teamId: process.env.VERCEL_TEAM_ID,
    projectId: process.env.VERCEL_PROJECT_ID,
    mcpServerUrl: process.env.VERCEL_MCP_URL,
  });
}

export function isVercelMcpConfigured(): boolean {
  return Boolean(process.env.VERCEL_TOKEN);
}
