/**
 * Hocker ONE — GitHub MCP Connector
 *
 * Connects NOVA and AGIs to the GitHub MCP server for direct
 * repository, issue, PR, and workflow management without needing
 * external platforms like the GitHub Web UI.
 */

import { McpClient, type McpProviderConfig, type McpTool } from "./mcp-client";
import { log } from "@/lib/logger";

export type GitHubMcpConfig = {
  /** GitHub personal access token or app token */
  githubToken: string;
  /** GitHub repository owner (e.g., "HockerAGI") */
  owner?: string;
  /** GitHub repository name (e.g., "hocker.one") */
  repo?: string;
  /** Custom MCP server URL */
  mcpServerUrl?: string;
};

const GITHUB_MCP_DEFAULT_URL = "https://api.github.com/mcp";

export class McpGitHubConnector {
  private client: McpClient;
  private config: GitHubMcpConfig;
  private initialized = false;

  constructor(config: GitHubMcpConfig) {
    this.config = config;

    const mcpUrl = config.mcpServerUrl ?? GITHUB_MCP_DEFAULT_URL;

    const providerConfig: McpProviderConfig = {
      id: "github",
      name: "GitHub MCP",
      type: "github",
      url: mcpUrl,
      authHeaders: {
        Authorization: `Bearer ${config.githubToken}`,
        Accept: "application/vnd.github.v3+json",
      },
      transport: "http",
      timeoutMs: 30_000,
      enabled: Boolean(config.githubToken),
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
   * Initialize the GitHub MCP connection.
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

      log.info("GitHub MCP initialized", {
        route: "mcp-github",
        capabilities: capabilities.join(","),
        toolCount: tools.length,
      });

      return { capabilities, version, tools };
    } catch (err: unknown) {
      log.error("GitHub MCP initialization failed", {
        route: "mcp-github",
        detail: err instanceof Error ? err.message : "Unknown error",
      });
      throw err;
    }
  }

  /**
   * List repository issues.
   */
  async listIssues(state?: "open" | "closed" | "all", limit?: number): Promise<unknown> {
    return this.client.callTool("list_issues", {
      owner: this.config.owner,
      repo: this.config.repo,
      state: state ?? "open",
      per_page: limit ?? 30,
    });
  }

  /**
   * Create a new issue.
   */
  async createIssue(title: string, body?: string, labels?: string[]): Promise<unknown> {
    return this.client.callTool("create_issue", {
      owner: this.config.owner,
      repo: this.config.repo,
      title,
      body,
      labels,
    });
  }

  /**
   * Update an issue.
   */
  async updateIssue(
    issueNumber: number,
    updates: { title?: string; body?: string; state?: "open" | "closed"; labels?: string[] },
  ): Promise<unknown> {
    return this.client.callTool("update_issue", {
      owner: this.config.owner,
      repo: this.config.repo,
      issue_number: issueNumber,
      ...updates,
    });
  }

  /**
   * List pull requests.
   */
  async listPullRequests(state?: "open" | "closed" | "all"): Promise<unknown> {
    return this.client.callTool("list_pull_requests", {
      owner: this.config.owner,
      repo: this.config.repo,
      state: state ?? "open",
    });
  }

  /**
   * Create a pull request.
   */
  async createPullRequest(
    title: string,
    body: string,
    head: string,
    base: string,
  ): Promise<unknown> {
    return this.client.callTool("create_pull_request", {
      owner: this.config.owner,
      repo: this.config.repo,
      title,
      body,
      head,
      base,
    });
  }

  /**
   * Merge a pull request.
   */
  async mergePullRequest(prNumber: number, commitMessage?: string): Promise<unknown> {
    return this.client.callTool("merge_pull_request", {
      owner: this.config.owner,
      repo: this.config.repo,
      pull_number: prNumber,
      commit_message: commitMessage,
    });
  }

  /**
   * Get repository information.
   */
  async getRepository(): Promise<unknown> {
    return this.client.callTool("get_repository", {
      owner: this.config.owner,
      repo: this.config.repo,
    });
  }

  /**
   * List repository branches.
   */
  async listBranches(): Promise<unknown> {
    return this.client.callTool("list_branches", {
      owner: this.config.owner,
      repo: this.config.repo,
    });
  }

  /**
   * Create a branch.
   */
  async createBranch(branch: string, ref?: string): Promise<unknown> {
    return this.client.callTool("create_branch", {
      owner: this.config.owner,
      repo: this.config.repo,
      branch,
      ref: ref ?? "main",
    });
  }

  /**
   * Get file contents.
   */
  async getFileContents(path: string, ref?: string): Promise<unknown> {
    return this.client.callTool("get_file_contents", {
      owner: this.config.owner,
      repo: this.config.repo,
      path,
      ref,
    });
  }

  /**
   * Create or update a file.
   */
  async createOrUpdateFile(
    path: string,
    content: string,
    message: string,
    branch?: string,
    sha?: string,
  ): Promise<unknown> {
    return this.client.callTool("create_or_update_file", {
      owner: this.config.owner,
      repo: this.config.repo,
      path,
      content,
      message,
      branch: branch ?? "main",
      sha,
    });
  }

  /**
   * List GitHub Actions workflows.
   */
  async listWorkflows(): Promise<unknown> {
    return this.client.callTool("list_workflows", {
      owner: this.config.owner,
      repo: this.config.repo,
    });
  }

  /**
   * Trigger a workflow dispatch.
   */
  async triggerWorkflow(workflowId: string, ref?: string, inputs?: Record<string, string>): Promise<unknown> {
    return this.client.callTool("trigger_workflow", {
      owner: this.config.owner,
      repo: this.config.repo,
      workflow_id: workflowId,
      ref: ref ?? "main",
      inputs,
    });
  }

  /**
   * Get workflow run status.
   */
  async getWorkflowRun(runId: number): Promise<unknown> {
    return this.client.callTool("get_workflow_run", {
      owner: this.config.owner,
      repo: this.config.repo,
      run_id: runId,
    });
  }

  /**
   * Search code in the repository.
   */
  async searchCode(query: string): Promise<unknown> {
    return this.client.callTool("search_code", {
      q: `${query} repo:${this.config.owner}/${this.config.repo}`,
    });
  }

  /**
   * Ping the GitHub MCP server.
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
   * Disconnect from the GitHub MCP server.
   */
  disconnect(): void {
    this.client.disconnect();
    this.initialized = false;
  }
}

/**
 * Create a GitHub MCP connector from environment variables.
 */
export function createGitHubMcpConnector(): McpGitHubConnector {
  return new McpGitHubConnector({
    githubToken: process.env.GITHUB_TOKEN ?? "",
    owner: process.env.GITHUB_OWNER ?? "HockerAGI",
    repo: process.env.GITHUB_REPO ?? "hocker.one",
    mcpServerUrl: process.env.GITHUB_MCP_URL,
  });
}

export function isGitHubMcpConfigured(): boolean {
  return Boolean(process.env.GITHUB_TOKEN);
}
