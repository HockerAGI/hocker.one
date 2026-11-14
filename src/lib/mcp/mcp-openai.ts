/**
 * Hocker ONE — OpenAI Developer Documentation MCP (read-only).
 *
 * The OpenAI API is not a hosted model-management MCP at /v1/mcp.
 * Production inference uses the separate AGI model router and is unchanged.
 * This connector exposes only the public docs MCP tools discovered from
 * https://developers.openai.com/mcp; it never sends an OPENAI_API_KEY.
 */
import { McpClient, type McpProviderConfig, type McpTool } from "./mcp-client";
import { log } from "@/lib/logger";
import { trustedOpenAIDocsMcpUrl } from "./mcp-provider-targets";

export type OpenAIMcpConfig = {
  /** Explicitly opt-in to the free, documentation-only connector. */
  enabled?: boolean;
  mcpServerUrl?: string;
};

export class McpOpenAIConnector {
  private client: McpClient;

  constructor(config: OpenAIMcpConfig = {}) {
    const providerConfig: McpProviderConfig = {
      id: "openai",
      name: "OpenAI Developer Docs MCP (read only)",
      type: "openai",
      url: trustedOpenAIDocsMcpUrl(config.mcpServerUrl),
      authHeaders: {}, // API credentials must NEVER be sent to the docs server.
      transport: "http",
      timeoutMs: 20_000,
      enabled: config.enabled === true,
    };
    this.client = new McpClient(providerConfig);
  }

  get isConnected(): boolean { return this.client.status === "connected"; }
  get state() { return this.client.stateSnapshot; }

  async initialize(): Promise<{
    capabilities: string[];
    version: string;
    tools: McpTool[];
  }> {
    try {
      const { capabilities, version } = await this.client.initialize();
      const tools = await this.client.listTools();
      log.info("OpenAI Docs MCP initialized", {
        route: "mcp-openai",
        capabilities: capabilities.join(","),
        toolCount: tools.length,
      });
      return { capabilities, version, tools };
    } catch (err: unknown) {
      log.error("OpenAI Docs MCP initialization failed", {
        route: "mcp-openai",
        detail: err instanceof Error ? err.message : "Unknown error",
      });
      throw err;
    }
  }

  // Tool names are discovered from the official read-only docs MCP server.
  // Model listing, completions, assistants, threads and image generation
  // remain functions of the existing API provider adapters, not this MCP.
  getClient(): McpClient { return this.client; }
  async ping(): Promise<boolean> { return this.client.ping(); }
  disconnect(): void { this.client.disconnect(); }
}

export function isOpenAIMcpConfigured(): boolean {
  if (process.env.OPENAI_DOCS_MCP_ENABLED !== "true") return false;
  try {
    trustedOpenAIDocsMcpUrl(process.env.OPENAI_MCP_URL);
    return true;
  } catch { return false; }
}

export function createOpenAIMcpConnector(): McpOpenAIConnector {
  return new McpOpenAIConnector({
    enabled: isOpenAIMcpConfigured(),
    mcpServerUrl: process.env.OPENAI_MCP_URL,
  });
}
