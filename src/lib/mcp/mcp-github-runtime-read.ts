/**
 * Canonical, read-only GitHub runtime tools for NOVA/AGIs when GitHub App
 * (or a non-MCP server PAT) is configured. No MCP-origin credential forwarding.
 * Real authenticated repository reads are required before marking connected.
 */
import type { McpProviderState, McpTool } from "./mcp-client";
import { assertMcpReadToolPolicy } from "./mcp-policy";
import { normalizeGitHubListCommitsArguments } from "./mcp-github-read-arguments";
import { executeGitHubReadOperation } from "@/lib/github-runtime-executor";

const PROJECT_REPOSITORIES = [
  "HockerAGI/hocker.one", "HockerAGI/nova.agi", "HockerAGI/hocker-node-agent",
] as const;

const REPO_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    owner: { type: "string" }, repo: { type: "string" },
  },
  required: ["owner", "repo"],
};

const READ_TOOLS: McpTool[] = [
  {
    name: "get_repository",
    description: "Authenticated repository metadata for an explicitly approved HOCKER repo.",
    inputSchema: REPO_SCHEMA,
  },
  {
    name: "get_file_contents",
    description: "Read an existing file on main and its real GitHub blob SHA before proposing code changes.",
    inputSchema: {
      ...REPO_SCHEMA,
      properties: {
        ...REPO_SCHEMA.properties,
        path: { type: "string" }, ref: { type: "string" },
      },
      required: ["owner", "repo", "path"],
    },
  },
  {
    name: "list_commits",
    description: "Read the real latest GitHub commits of main or a nova/ branch, including commit SHAs.",
    inputSchema: {
      ...REPO_SCHEMA,
      properties: {
        ...REPO_SCHEMA.properties,
        sha: { type: "string" }, perPage: { type: "integer", minimum: 1, maximum: 5 },
      },
    },
  },
  {
    name: "list_tree",
    description: "List repository directory paths (read only) before inspecting exact files.",
    inputSchema: {
      ...REPO_SCHEMA,
      properties: {
        ...REPO_SCHEMA.properties,
        path: { type: "string" }, ref: { type: "string" },
        limit: { type: "integer", minimum: 1, maximum: 200 },
      },
    },
  },
];

function asRecord(args: Record<string, unknown>): Record<string, unknown> {
  return args && typeof args === "object" && !Array.isArray(args) ? args : {};
}

function repoIdentity(args: Record<string, unknown>): string {
  const owner = String(args.owner ?? "").trim();
  const repo = String(args.repo ?? "").trim();
  if (!/^[A-Za-z0-9_.-]{1,100}$/.test(owner) || !/^[A-Za-z0-9_.-]{1,100}$/.test(repo) ||
      [".", ".."].includes(owner) || [".", ".."].includes(repo)) {
    throw new Error("GITHUB_RUNTIME_READ_REPOSITORY_REQUIRED");
  }
  if (args.repository !== undefined || args.repository_full_name !== undefined) {
    const explicit = String(args.repository ?? args.repository_full_name ?? "").trim();
    if (explicit.toLowerCase() !== `${owner}/${repo}`.toLowerCase()) {
      throw new Error("GITHUB_RUNTIME_READ_REPOSITORY_CONFLICT");
    }
  }
  return `${owner}/${repo}`;
}

export class GitHubRuntimeReadConnector {
  state: McpProviderState = {
    id: "github", status: "disconnected", lastPingAt: null,
    lastError: null, capabilities: [], version: null,
  };

  async initialize(): Promise<{ capabilities: string[]; version: string; tools: McpTool[] }> {
    try {
      // Do not claim a connected provider from environment metadata alone.
      for (const repository of PROJECT_REPOSITORIES) {
        const result = await executeGitHubReadOperation("get_repo", { repository });
        if (result.repository.toLowerCase() !== repository.toLowerCase()) {
          throw new Error("GITHUB_RUNTIME_READ_REPOSITORY_MISMATCH");
        }
      }
      const capabilities = READ_TOOLS.map((t) => t.name);
      this.state = {
        id: "github", status: "connected", lastPingAt: new Date().toISOString(),
        lastError: null, capabilities, version: "hocker-github-runtime-rest-read-v1",
      };
      return { capabilities, version: "hocker-github-runtime-rest-read-v1", tools: READ_TOOLS };
    } catch {
      this.state = {
        id: "github", status: "error", lastPingAt: null,
        lastError: "GITHUB_RUNTIME_AUTHENTICATED_READ_FAILED", capabilities: [], version: null,
      };
      throw new Error("GITHUB_RUNTIME_AUTHENTICATED_READ_FAILED");
    }
  }

  async executeReadTool(tool: string, input: Record<string, unknown>): Promise<unknown> {
    if (this.state.status !== "connected") throw new Error("GITHUB_RUNTIME_READ_NOT_CONNECTED");
    const args = asRecord(input);
    if (!READ_TOOLS.some((t) => t.name === tool)) {
      throw new Error("GITHUB_RUNTIME_READ_TOOL_NOT_ALLOWED");
    }
    const normalized = tool === "list_commits" ? normalizeGitHubListCommitsArguments(args) : args;
    assertMcpReadToolPolicy("github", tool, normalized);
    const repository = repoIdentity(normalized);
    if (tool === "get_repository") return executeGitHubReadOperation("get_repo", { repository });
    if (tool === "get_file_contents") {
      if (typeof args.path !== "string" || !args.path.trim()) throw new Error("GITHUB_RUNTIME_READ_PATH_REQUIRED");
      return executeGitHubReadOperation("read_file", {
        repository, path: args.path, ref: String(args.ref ?? "main"),
      });
    }
    if (tool === "list_commits") {
      return executeGitHubReadOperation("list_commits", {
        repository, ref: String(normalized.sha ?? "main"),
        limit: Number(normalized.perPage ?? 3),
      });
    }
    if (tool === "list_tree") {
      return executeGitHubReadOperation("list_tree", {
        repository, path: typeof args.path === "string" ? args.path : undefined,
        ref: String(args.ref ?? "main"),
        limit: Math.min(200, Math.max(1, Number(args.limit ?? 100) || 100)),
      });
    }
    throw new Error("GITHUB_RUNTIME_READ_TOOL_NOT_ALLOWED");
  }
}
