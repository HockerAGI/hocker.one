/**
 * Hocker ONE — Base MCP Client
 *
 * Provides the foundational MCP (Model Context Protocol) client for
 * connecting NOVA and AGIs to external services (Supabase, Vercel,
 * GitHub, OpenAI) without requiring external platforms.
 *
 * Implements the MCP JSON-RPC 2.0 transport over HTTP/SSE.
 */

export type McpTransport = "http" | "sse";

export type McpConnectionStatus =
  | "connected"
  | "disconnected"
  | "error"
  | "connecting";

export type McpRequest = {
  jsonrpc: "2.0";
  id: string;
  method: string;
  params?: Record<string, unknown>;
};

export type McpResponse = {
  jsonrpc: "2.0";
  id: string;
  result?: unknown;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
};

export type McpProviderConfig = {
  /** Unique identifier for this MCP provider */
  id: string;
  /** Human-readable name */
  name: string;
  /** Provider type */
  type: "supabase" | "vercel" | "github" | "openai" | "custom";
  /** Base URL for the MCP server */
  url: string;
  /** Authentication headers to include in every request */
  authHeaders?: Record<string, string>;
  /** Transport mode */
  transport?: McpTransport;
  /** Request timeout in milliseconds */
  timeoutMs?: number;
  /** Whether this provider is enabled */
  enabled?: boolean;
};

export type McpProviderState = {
  id: string;
  status: McpConnectionStatus;
  lastPingAt: string | null;
  lastError: string | null;
  capabilities: string[];
  version: string | null;
};

const DEFAULT_TIMEOUT_MS = 30_000;

export class McpClient {
  private config: McpProviderConfig;
  private state: McpProviderState;
  private requestIdCounter = 0;

  constructor(config: McpProviderConfig) {
    this.config = config;
    this.state = {
      id: config.id,
      status: "disconnected",
      lastPingAt: null,
      lastError: null,
      capabilities: [],
      version: null,
    };
  }

  get id(): string {
    return this.config.id;
  }

  get name(): string {
    return this.config.name;
  }

  get type(): string {
    return this.config.type;
  }

  get isEnabled(): boolean {
    return this.config.enabled !== false;
  }

  get status(): McpConnectionStatus {
    return this.state.status;
  }

  get stateSnapshot(): McpProviderState {
    return { ...this.state };
  }

  private nextId(): string {
    this.requestIdCounter += 1;
    return `mcp-${this.config.id}-${this.requestIdCounter}-${Date.now()}`;
  }

  private buildHeaders(): Record<string, string> {
    return {
      "Content-Type": "application/json",
      "Accept": "application/json",
      ...this.config.authHeaders,
    };
  }

  /**
   * Send a JSON-RPC 2.0 request to the MCP server.
   */
  async request(method: string, params?: Record<string, unknown>): Promise<unknown> {
    if (!this.isEnabled) {
      throw new Error(`MCP provider ${this.config.id} is disabled.`);
    }

    const mcpRequest: McpRequest = {
      jsonrpc: "2.0",
      id: this.nextId(),
      method,
      ...(params ? { params } : {}),
    };

    this.state.status = "connecting";

    try {
      const controller = new AbortController();
      const timeout = setTimeout(
        () => controller.abort(),
        this.config.timeoutMs ?? DEFAULT_TIMEOUT_MS,
      );

      const response = await fetch(this.config.url, {
        method: "POST",
        headers: this.buildHeaders(),
        body: JSON.stringify(mcpRequest),
        signal: controller.signal,
        cache: "no-store",
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        this.state.status = "error";
        this.state.lastError = `HTTP ${response.status}: ${errorText.slice(0, 200)}`;
        throw new Error(`MCP ${this.config.id} returned HTTP ${response.status}`);
      }

      const mcpResponse = (await response.json()) as McpResponse;

      if (mcpResponse.error) {
        this.state.status = "error";
        this.state.lastError = mcpResponse.error.message;
        throw new Error(`MCP ${this.config.id} error: ${mcpResponse.error.message}`);
      }

      this.state.status = "connected";
      this.state.lastPingAt = new Date().toISOString();
      this.state.lastError = null;

      return mcpResponse.result;
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        this.state.status = "error";
        this.state.lastError = "Request timed out";
        throw new Error(`MCP ${this.config.id} request timed out`);
      }
      throw err;
    }
  }

  /**
   * Initialize the MCP connection by calling the "initialize" method.
   * Discovers server capabilities and protocol version.
   */
  async initialize(): Promise<{
    capabilities: string[];
    version: string;
  }> {
    try {
      const result = (await this.request("initialize", {
        protocolVersion: "2024-11-05",
        clientInfo: {
          name: "hocker-one-nova",
          version: "1.0.0",
        },
      })) as Record<string, unknown> | null;

      const capabilities = result?.capabilities
        ? Object.keys(result.capabilities as Record<string, unknown>)
        : [];
      const serverInfo = result?.serverInfo as Record<string, unknown> | undefined;
      const version = String(serverInfo?.version ?? "unknown");

      this.state.capabilities = capabilities;
      this.state.version = version;
      this.state.status = "connected";
      this.state.lastPingAt = new Date().toISOString();

      return { capabilities, version };
    } catch (err: unknown) {
      this.state.status = "error";
      this.state.lastError = err instanceof Error ? err.message : "Initialization failed";
      throw err;
    }
  }

  /**
   * List available tools from the MCP server.
   */
  async listTools(): Promise<McpTool[]> {
    const result = (await this.request("tools/list")) as { tools?: McpTool[] } | null;
    return result?.tools ?? [];
  }

  /**
   * Call a tool on the MCP server.
   */
  async callTool(name: string, args?: Record<string, unknown>): Promise<unknown> {
    return this.request("tools/call", {
      name,
      arguments: args ?? {},
    });
  }

  /**
   * List available resources from the MCP server.
   */
  async listResources(): Promise<McpResource[]> {
    const result = (await this.request("resources/list")) as { resources?: McpResource[] } | null;
    return result?.resources ?? [];
  }

  /**
   * Read a resource from the MCP server.
   */
  async readResource(uri: string): Promise<unknown> {
    return this.request("resources/read", { uri });
  }

  /**
   * Ping the MCP server to check connectivity.
   */
  async ping(): Promise<boolean> {
    try {
      await this.request("ping");
      this.state.status = "connected";
      this.state.lastPingAt = new Date().toISOString();
      return true;
    } catch {
      this.state.status = "error";
      return false;
    }
  }

  /**
   * Disconnect and reset state.
   */
  disconnect(): void {
    this.state.status = "disconnected";
    this.state.lastError = null;
  }
}

export type McpTool = {
  name: string;
  description?: string;
  inputSchema?: Record<string, unknown>;
};

export type McpResource = {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
};
