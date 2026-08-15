/**
 * Hocker ONE — Base MCP Client
 *
 * Provides the foundational MCP (Model Context Protocol) client for
 * connecting NOVA and AGIs to external services (Supabase, Vercel,
 * GitHub, OpenAI) without requiring external platforms.
 *
 * Prefers the stateless MCP 2026-07-28 protocol over HTTP while retaining
 * an explicit initialize-era fallback for current stateful MCP servers.
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

export type McpNotification = {
  jsonrpc: "2.0";
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

type McpProtocolEra = "modern" | "legacy";

const DEFAULT_TIMEOUT_MS = 30_000;
const MODERN_PROTOCOL_VERSION = "2026-07-28";
const LEGACY_PROTOCOL_VERSION = "2025-11-25";
const CLIENT_INFO = {
  name: "hocker-one-nova",
  version: "1.0.0",
} as const;

class McpModernNegotiationFallbackError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "McpModernNegotiationFallbackError";
  }
}

export class McpClient {
  private config: McpProviderConfig;
  private state: McpProviderState;
  private requestIdCounter = 0;
  private protocolEra: McpProtocolEra | null = null;
  private negotiatedProtocolVersion: string | null = null;
  private sessionId: string | null = null;

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

  private modernParams(params?: Record<string, unknown>): Record<string, unknown> {
    const existingMeta = params?._meta;
    const safeMeta = existingMeta && typeof existingMeta === "object" && !Array.isArray(existingMeta)
      ? existingMeta as Record<string, unknown>
      : {};

    return {
      ...(params ?? {}),
      _meta: {
        ...safeMeta,
        "io.modelcontextprotocol/clientInfo": CLIENT_INFO,
        "io.modelcontextprotocol/clientCapabilities": {},
        "io.modelcontextprotocol/protocolVersion": MODERN_PROTOCOL_VERSION,
      },
    };
  }

  private buildHeaders(
    era: McpProtocolEra,
    method: string,
    params?: Record<string, unknown>,
  ): Record<string, string> {
    const headers: Record<string, string> = {
      ...this.config.authHeaders,
      "Content-Type": "application/json",
      "Accept": "application/json, text/event-stream",
    };

    if (era === "modern") {
      headers["MCP-Protocol-Version"] = MODERN_PROTOCOL_VERSION;
      headers["Mcp-Method"] = method;

      let routeName = "";
      if (method === "tools/call" || method === "prompts/get") {
        routeName = String(params?.name ?? "").trim();
      } else if (method === "resources/read") {
        routeName = String(params?.uri ?? "").trim();
      }

      if (routeName) headers["Mcp-Name"] = routeName;
    } else if (method !== "initialize") {
      headers["MCP-Protocol-Version"] = this.negotiatedProtocolVersion ?? LEGACY_PROTOCOL_VERSION;
      if (this.sessionId) headers["MCP-Session-Id"] = this.sessionId;
    }

    return headers;
  }

  private async requestWithEra(
    method: string,
    params: Record<string, unknown> | undefined,
    era: McpProtocolEra,
    allowModernFallback = false,
  ): Promise<unknown> {
    if (!this.isEnabled) {
      throw new Error(`MCP provider ${this.config.id} is disabled.`);
    }

    const requestParams = era === "modern" ? this.modernParams(params) : params;
    const mcpRequest: McpRequest = {
      jsonrpc: "2.0",
      id: this.nextId(),
      method,
      ...(requestParams ? { params: requestParams } : {}),
    };

    this.state.status = "connecting";

    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      this.config.timeoutMs ?? DEFAULT_TIMEOUT_MS,
    );

    try {
      const response = await fetch(this.config.url, {
        method: "POST",
        headers: this.buildHeaders(era, method, params),
        body: JSON.stringify(mcpRequest),
        signal: controller.signal,
        cache: "no-store",
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        this.state.status = "error";
        this.state.lastError = `HTTP ${response.status}: ${errorText.slice(0, 200)}`;

        if (allowModernFallback && (response.status === 400 || response.status === 404)) {
          throw new McpModernNegotiationFallbackError(
            `MCP ${this.config.id} does not accept the modern protocol probe`,
          );
        }

        throw new Error(`MCP ${this.config.id} returned HTTP ${response.status}`);
      }

      if (era === "legacy" && method === "initialize") {
        this.sessionId = response.headers.get("MCP-Session-Id");
      }

      const mcpResponse = (await response.json()) as McpResponse;

      if (mcpResponse.error) {
        this.state.status = "error";
        this.state.lastError = mcpResponse.error.message;

        if (
          allowModernFallback &&
          [-32601, -32022, -32021, -32020].includes(mcpResponse.error.code)
        ) {
          throw new McpModernNegotiationFallbackError(
            `MCP ${this.config.id} does not support ${MODERN_PROTOCOL_VERSION}`,
          );
        }

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
    } finally {
      clearTimeout(timeout);
    }
  }

  private async notifyWithEra(
    method: string,
    params: Record<string, unknown> | undefined,
    era: McpProtocolEra,
  ): Promise<void> {
    if (!this.isEnabled) {
      throw new Error(`MCP provider ${this.config.id} is disabled.`);
    }

    const notification: McpNotification = {
      jsonrpc: "2.0",
      method,
      ...(params ? { params } : {}),
    };

    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      this.config.timeoutMs ?? DEFAULT_TIMEOUT_MS,
    );

    try {
      const response = await fetch(this.config.url, {
        method: "POST",
        headers: this.buildHeaders(era, method, params),
        body: JSON.stringify(notification),
        signal: controller.signal,
        cache: "no-store",
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        this.state.status = "error";
        this.state.lastError = `HTTP ${response.status}: ${errorText.slice(0, 200)}`;
        throw new Error(`MCP ${this.config.id} notification returned HTTP ${response.status}`);
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        this.state.status = "error";
        this.state.lastError = "Request timed out";
        throw new Error(`MCP ${this.config.id} notification timed out`);
      }
      throw err;
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Send a JSON-RPC 2.0 request using the negotiated MCP era.
   * Before initialization, legacy behavior is preserved for compatibility.
   */
  async request(method: string, params?: Record<string, unknown>): Promise<unknown> {
    return this.requestWithEra(method, params, this.protocolEra ?? "legacy");
  }

  private finalizeConnection(
    result: Record<string, unknown> | null,
    era: McpProtocolEra,
  ): { capabilities: string[]; version: string } {
    const capabilities = result?.capabilities
      ? Object.keys(result.capabilities as Record<string, unknown>)
      : [];

    const responseMeta = result?._meta && typeof result._meta === "object" && !Array.isArray(result._meta)
      ? result._meta as Record<string, unknown>
      : {};
    const metaServerInfo = responseMeta["io.modelcontextprotocol/serverInfo"];
    const serverInfo = metaServerInfo && typeof metaServerInfo === "object" && !Array.isArray(metaServerInfo)
      ? metaServerInfo as Record<string, unknown>
      : result?.serverInfo as Record<string, unknown> | undefined;
    const version = String(
      serverInfo?.version ?? (era === "modern" ? MODERN_PROTOCOL_VERSION : "unknown"),
    );

    this.protocolEra = era;
    this.negotiatedProtocolVersion = String(
      result?.protocolVersion ?? (era === "modern" ? MODERN_PROTOCOL_VERSION : LEGACY_PROTOCOL_VERSION),
    );
    this.state.capabilities = capabilities;
    this.state.version = version;
    this.state.status = "connected";
    this.state.lastPingAt = new Date().toISOString();
    this.state.lastError = null;

    return { capabilities, version };
  }

  /**
   * Prefer the stateless MCP 2026-07-28 discovery flow. A compliant modern
   * server can signal unsupported discovery with HTTP 404 / method-not-found;
   * in that case negotiate the current initialize-era protocol instead.
   */
  async initialize(): Promise<{
    capabilities: string[];
    version: string;
  }> {
    try {
      const modernResult = (await this.requestWithEra(
        "server/discover",
        {},
        "modern",
        true,
      )) as Record<string, unknown> | null;

      return this.finalizeConnection(modernResult, "modern");
    } catch (err: unknown) {
      if (!(err instanceof McpModernNegotiationFallbackError)) {
        this.state.status = "error";
        this.state.lastError = err instanceof Error ? err.message : "Modern MCP discovery failed";
        throw err;
      }
    }

    try {
      const legacyResult = (await this.requestWithEra(
        "initialize",
        {
          protocolVersion: LEGACY_PROTOCOL_VERSION,
          capabilities: {},
          clientInfo: CLIENT_INFO,
        },
        "legacy",
      )) as Record<string, unknown> | null;

      const connection = this.finalizeConnection(legacyResult, "legacy");
      await this.notifyWithEra("notifications/initialized", undefined, "legacy");
      this.state.status = "connected";
      this.state.lastPingAt = new Date().toISOString();
      this.state.lastError = null;
      return connection;
    } catch (err: unknown) {
      this.state.status = "error";
      this.state.lastError = err instanceof Error ? err.message : "Legacy MCP initialization failed";
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
    this.protocolEra = null;
    this.negotiatedProtocolVersion = null;
    this.sessionId = null;
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
