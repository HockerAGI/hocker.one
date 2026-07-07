/**
 * Hocker ONE — OpenAI MCP Connector
 *
 * Connects NOVA and AGIs to the OpenAI MCP server for direct
 * model listing, assistant management, and completion operations
 * without needing external platforms.
 */

import { McpClient, type McpProviderConfig, type McpTool } from "./mcp-client";
import { log } from "@/lib/logger";

export type OpenAIMcpConfig = {
  /** OpenAI API key */
  apiKey: string;
  /** OpenAI organization ID (optional) */
  organizationId?: string;
  /** Custom MCP server URL (defaults to OpenAI API) */
  mcpServerUrl?: string;
  /** Default model for completions */
  defaultModel?: string;
};

const OPENAI_MCP_DEFAULT_URL = "https://api.openai.com/v1/mcp";

export class McpOpenAIConnector {
  private client: McpClient;
  private config: OpenAIMcpConfig;
  private initialized = false;

  constructor(config: OpenAIMcpConfig) {
    this.config = config;

    const mcpUrl = config.mcpServerUrl ?? OPENAI_MCP_DEFAULT_URL;

    const authHeaders: Record<string, string> = {
      Authorization: `Bearer ${config.apiKey}`,
    };
    if (config.organizationId) {
      authHeaders["OpenAI-Organization"] = config.organizationId;
    }

    const providerConfig: McpProviderConfig = {
      id: "openai",
      name: "OpenAI MCP",
      type: "openai",
      url: mcpUrl,
      authHeaders,
      transport: "http",
      timeoutMs: 60_000,
      enabled: Boolean(config.apiKey),
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
   * Initialize the OpenAI MCP connection.
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
   * List available models.
   */
  async listModels(): Promise<unknown> {
    return this.client.callTool("list_models");
  }

  /**
   * Create a chat completion.
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

  /**
   * Create an assistant.
   */
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

  /**
   * List assistants.
   */
  async listAssistants(): Promise<unknown> {
    return this.client.callTool("list_assistants");
  }

  /**
   * Create a thread.
   */
  async createThread(messages?: Array<{ role: string; content: string }>): Promise<unknown> {
    return this.client.callTool("create_thread", { messages });
  }

  /**
   * Create an embedding.
   */
  async createEmbedding(input: string | string[], model?: string): Promise<unknown> {
    return this.client.callTool("create_embedding", {
      input,
      model: model ?? "text-embedding-3-small",
    });
  }

  /**
   * Generate an image with DALL-E.
   */
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

  /**
   * Ping the OpenAI MCP server.
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
   * Disconnect from the OpenAI MCP server.
   */
  disconnect(): void {
    this.client.disconnect();
    this.initialized = false;
  }
}

/**
 * Create an OpenAI MCP connector from environment variables.
 */
export function createOpenAIMcpConnector(): McpOpenAIConnector {
  return new McpOpenAIConnector({
    apiKey: process.env.OPENAI_API_KEY ?? "",
    organizationId: process.env.OPENAI_ORG_ID,
    mcpServerUrl: process.env.OPENAI_MCP_URL,
    defaultModel: process.env.OPENAI_DEFAULT_MODEL,
  });
}

export function isOpenAIMcpConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}
