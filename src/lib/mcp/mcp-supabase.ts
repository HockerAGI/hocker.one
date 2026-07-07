/**
 * Hocker ONE — Supabase MCP Connector
 *
 * Connects NOVA and AGIs to the Supabase MCP server for direct
 * database, auth, storage, and edge function operations without
 * needing external platforms like the Supabase Dashboard.
 *
 * Uses the MCP server URL: https://mcp.supabase.com/mcp
 * with project_ref parameter and Supabase server auth.
 */

import { McpClient, type McpProviderConfig, type McpTool } from "./mcp-client";
import { log } from "@/lib/logger";

export type SupabaseMcpConfig = {
  /** Supabase project URL */
  supabaseUrl: string;
  /** Supabase project ref (extracted from URL) */
  projectRef: string;
  /** MCP server URL (defaults to https://mcp.supabase.com/mcp) */
  mcpServerUrl?: string;
  /** Supabase publishable key for auth */
  publishableKey?: string;
  /** Supabase secret key for admin operations */
  secretKey?: string;
  /** Features to enable (docs, account, database, development, debugging, functions, branching) */
  features?: string[];
};

const SUPABASE_MCP_BASE_URL = "https://mcp.supabase.com/mcp";

const DEFAULT_FEATURES = [
  "docs",
  "account",
  "database",
  "development",
  "debugging",
  "functions",
  "branching",
];

function extractProjectRef(url: string): string {
  // Extract from https://yvuibbcuntqpyqiuqggd.supabase.co
  const match = url.match(/https:\/\/([a-z0-9]+)\.supabase\.co/);
  return match?.[1] ?? "";
}

export class McpSupabaseConnector {
  private client: McpClient;
  private config: SupabaseMcpConfig;
  private initialized = false;

  constructor(config: SupabaseMcpConfig) {
    this.config = config;

    const projectRef = config.projectRef || extractProjectRef(config.supabaseUrl);
    const features = config.features ?? DEFAULT_FEATURES;
    const mcpUrl =
      config.mcpServerUrl ??
      `${SUPABASE_MCP_BASE_URL}?project_ref=${projectRef}&features=${features.join(",")}`;

    const authHeaders: Record<string, string> = {};
    if (config.secretKey) {
      authHeaders["Authorization"] = `Bearer ${config.secretKey}`;
    }
    if (config.publishableKey) {
      authHeaders["X-Supabase-Publishable-Key"] = config.publishableKey;
    }

    const providerConfig: McpProviderConfig = {
      id: "supabase",
      name: "Supabase MCP",
      type: "supabase",
      url: mcpUrl,
      authHeaders,
      transport: "http",
      timeoutMs: 30_000,
      enabled: Boolean(config.supabaseUrl && (config.secretKey || config.publishableKey)),
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
   * Initialize the Supabase MCP connection.
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

      log.info("Supabase MCP initialized", {
        route: "mcp-supabase",
        capabilities: capabilities.join(","),
        toolCount: tools.length,
      });

      return { capabilities, version, tools };
    } catch (err: unknown) {
      log.error("Supabase MCP initialization failed", {
        route: "mcp-supabase",
        detail: err instanceof Error ? err.message : "Unknown error",
      });
      throw err;
    }
  }

  /**
   * Execute a SQL query against the Supabase database.
   */
  async executeQuery(sql: string, params?: Record<string, unknown>): Promise<unknown> {
    return this.client.callTool("execute_sql", { query: sql, ...params });
  }

  /**
   * List tables in the Supabase database.
   */
  async listTables(): Promise<unknown> {
    return this.client.callTool("list_tables");
  }

  /**
   * Get table schema information.
   */
  async getTableSchema(tableName: string): Promise<unknown> {
    return this.client.callTool("get_table_schema", { table: tableName });
  }

  /**
   * Insert rows into a table.
   */
  async insert(table: string, rows: Record<string, unknown>[]): Promise<unknown> {
    return this.client.callTool("insert_rows", { table, rows });
  }

  /**
   * Update rows in a table.
   */
  async update(
    table: string,
    filter: Record<string, unknown>,
    values: Record<string, unknown>,
  ): Promise<unknown> {
    return this.client.callTool("update_rows", { table, filter, values });
  }

  /**
   * Delete rows from a table.
   */
  async delete(table: string, filter: Record<string, unknown>): Promise<unknown> {
    return this.client.callTool("delete_rows", { table, filter });
  }

  /**
   * Search documentation.
   */
  async searchDocs(query: string): Promise<unknown> {
    return this.client.callTool("search_docs", { query });
  }

  /**
   * List edge functions.
   */
  async listFunctions(): Promise<unknown> {
    return this.client.callTool("list_functions");
  }

  /**
   * Deploy an edge function.
   */
  async deployFunction(name: string, code: string): Promise<unknown> {
    return this.client.callTool("deploy_function", { name, code });
  }

  /**
   * Create a database migration.
   */
  async createMigration(name: string, sql: string): Promise<unknown> {
    return this.client.callTool("create_migration", { name, sql });
  }

  /**
   * Apply a migration.
   */
  async applyMigration(name: string): Promise<unknown> {
    return this.client.callTool("apply_migration", { name });
  }

  /**
   * Get project logs.
   */
  async getLogs(service?: string, limit?: number): Promise<unknown> {
    return this.client.callTool("get_logs", { service, limit });
  }

  /**
   * Ping the Supabase MCP server.
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
   * Disconnect from the Supabase MCP server.
   */
  disconnect(): void {
    this.client.disconnect();
    this.initialized = false;
  }
}

/**
 * Create a Supabase MCP connector from environment variables.
 */
export function createSupabaseMcpConnector(): McpSupabaseConnector {
  return new McpSupabaseConnector({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    projectRef: process.env.SUPABASE_PROJECT_REF ?? "",
    mcpServerUrl: process.env.SUPABASE_MCP_URL,
    publishableKey: process.env.SUPABASE_PUBLISHABLE_KEY,
    secretKey: process.env.SUPABASE_SECRET_KEY,
    features: DEFAULT_FEATURES,
  });
}

export function isSupabaseMcpConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_PUBLISHABLE_KEY),
  );
}
