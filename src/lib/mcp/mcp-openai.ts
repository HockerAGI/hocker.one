/**
 * Hocker ONE — Explicit OpenAI-related Remote MCP Connector
 *
 * OpenAI's API can consume remote MCP servers, but the OpenAI REST API is
 * not itself treated as an MCP server here. This connector is enabled only
 * when HOCKER is given an explicit remote MCP URL and a credential scoped to
 * that server. OPENAI_API_KEY is intentionally never forwarded to MCP hosts.
 */

import { McpClient, type McpProviderConfig, type McpTool } from "./mcp-client";
import { log } from "@/lib/logger";

export type OpenAIMcpConfig = {
  /** Explicit remote MCP server URL; no OpenAI API URL fallback is assumed. */
  mcpServerUrl: string;
  /** Credential scoped to the explicit MCP server, separate from OPENAI_API_KEY. */
  authToken: string;
  /** Default OpenAI model name for MCP servers that expose model tools. */
  defaultModel?: string;
};

export class McpOpenAIConnector {
  private client: McpClient;
  private config: OpenAIMcpConfig;
  private initialized = false;

  constructor(config: OpenAIMcpConfig) {
    this.config = config;

    const authHeaders: Record<string, string> = {};
    if (config.authToken) {
      authHeaders.Authorization = `Bearer ${config.authToken}`;
    }

    const providerConfig: McpProviderConfig = {
      id: "openai",
      name: "OpenAI MCP",
      type: "openai",
      url: config.mcpServerUrl,
      authHeaders,
      transport: "http",
      timeoutMs: 60_000,
      enabled: Boolean(config.mcpServerUrl && config.authToken),
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
   * Initialize the explicitly configured remote MCP connection.
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

      log.info("OpenAI MCP initialized", {
        route: "mcp-openai",
        capabilities: capabilities.join(","),
        toolCount: tools.length,
      });

      return { capabilities, version, tools };
    } catch (err: unknown) {
      log.error("OpenAI MCP initialization failed", {
        route: "mcp-openai",
        detail: err instanceof Error ? err.message : "Unknown error",
      });
      throw err;
    }
  }

  /**
   * List available models when the explicit MCP server exposes this tool.
   */
  async listModels(): Promise<unknown> {
    return this.client.callTool("list_models");
  }

  /**
   * Create a chat completion when the explicit MCP server exposes this tool.
   */
  async chatCompletion(
    messages: Array<{ role: string; content: string }>,
    options?: {
      model?: string;
      temperature?: number;
      max_tokens?: number;
      tools?: unknown[];
    },
  ): Promise<unknown> {
    return this.client.callTool("chat_completion", {
      messages,
      model: options?.model ?? this.config.defaultModel ?? "gpt-4o",
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.max_tokens,
      tools: options?.tools,
    });
  }

  async createAssistant(
    name: string,
    instructions: string,
    model?: string,
    tools?: unknown[],
  ): Promise<unknown> {
    return this.client.callTool("create_assistant", {
      name,
      instructions,
      model: model ?? this.config.defaultModel ?? "gpt-4o",
      tools,
    });
  }

  async listAssistants(): Promise<unknown> {
    return this.client.callTool("list_assistants");
  }

  async createThread(messages?: Array<{ role: string; content: string }>): Promise<unknown> {
    return this.client.callTool("create_thread", { messages });
  }

  async createEmbedding(input: string | string[], model?: string): Promise<unknown> {
    return this.client.callTool("create_embedding", {
      input,
      model: model ?? "text-embedding-3-small",
    });
  }

  async generateImage(
    prompt: string,
    options?: { model?: string; size?: string; quality?: string },
  ): Promise<unknown> {
    return this.client.callTool("generate_image", {
      prompt,
      model: options?.model ?? "dall-e-3",
      size: options?.size ?? "1024x1024",
      quality: options?.quality ?? "standard",
    });
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
 * Create an explicit remote MCP connector from environment variables.
 * OPENAI_API_KEY remains reserved for the OpenAI API/provider router.
 */
export function createOpenAIMcpConnector(): McpOpenAIConnector {
  return new McpOpenAIConnector({
    mcpServerUrl: process.env.OPENAI_MCP_URL ?? "",
    authToken: process.env.OPENAI_MCP_AUTH_TOKEN ?? "",
    defaultModel: process.env.OPENAI_DEFAULT_MODEL,
  });
}

export function isOpenAIMcpConfigured(): boolean {
  return Boolean(process.env.OPENAI_MCP_URL && process.env.OPENAI_MCP_AUTH_TOKEN);
}
