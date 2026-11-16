/**
 * NOVA native engineering proposal contract.
 *
 * This is an Hocker ONE-local tool contract, NOT a writable GitHub MCP endpoint.
 * It only describes a candidate. Actual effects require the existing
 * agi_action_queue, Owner Gate AAL2 and the governed GitHub executor.
 */
import { assertGithubRepositoryWriteAuthorized } from "@/lib/github-repository-governance";

export const NOVA_GITHUB_PROPOSAL_TOOL = "propose_code_change";
export const NOVA_GITHUB_GUIDED_CHAIN_VERSION = "12.7K-2A";

const CORE_REPOSITORIES = new Set([
  "HockerAGI/hocker.one",
  "HockerAGI/nova.agi",
  "HockerAGI/hocker-node-agent",
]);
const SHA_PATTERN = /^[a-f0-9]{40}(?:[a-f0-9]{24})?$/i;
const MAX_CONTENT_BYTES = 12 * 1024;

export type NovaGithubCodeProposal = {
  repository: string;
  branch: string;
  expected_base_sha: string;
  path: string;
  expected_file_sha: string;
  content: string;
  commit_message: string;
  pr_title: string;
  pr_body: string;
};

function requiredText(input: Record<string, unknown>, name: string, maxLength: number): string {
  const raw = input[name];
  if (typeof raw !== "string" || !raw.trim() || raw.length > maxLength) {
    throw new Error("NOVA_GITHUB_PROPOSAL_INVALID_" + name.toUpperCase());
  }
  return raw.trim();
}

export function parseNovaGithubCodeProposal(input: unknown): NovaGithubCodeProposal {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("NOVA_GITHUB_PROPOSAL_INVALID_ARGUMENTS");
  }
  const data = input as Record<string, unknown>;
  const allowedKeys = new Set([
    "repository", "branch", "expected_base_sha", "path", "expected_file_sha",
    "content", "commit_message", "pr_title", "pr_body",
  ]);
  if (Object.keys(data).some((key) => !allowedKeys.has(key))) {
    throw new Error("NOVA_GITHUB_PROPOSAL_UNEXPECTED_ARGUMENT");
  }

  const repository = requiredText(data, "repository", 100);
  if (!CORE_REPOSITORIES.has(repository)) throw new Error("NOVA_GITHUB_REPOSITORY_NOT_AUTHORIZED");
  assertGithubRepositoryWriteAuthorized(repository);

  const branch = requiredText(data, "branch", 100);
  if (!/^nova\/[a-z0-9][a-z0-9/_-]{2,90}$/i.test(branch) ||
      branch.includes("//") || branch.includes("..") || branch.endsWith("/") ||
      branch.endsWith(".lock") || branch.split("/").some((segment) => segment.startsWith("."))) {
    throw new Error("NOVA_GITHUB_BRANCH_NOT_ALLOWED");
  }

  const expected_base_sha = requiredText(data, "expected_base_sha", 64);
  const expected_file_sha = requiredText(data, "expected_file_sha", 64);
  if (!SHA_PATTERN.test(expected_base_sha) || !SHA_PATTERN.test(expected_file_sha)) {
    throw new Error("NOVA_GITHUB_OBSERVED_SHA_REQUIRED");
  }

  const path = requiredText(data, "path", 240);
  if (!(path.startsWith("src/") || path.startsWith("docs/")) ||
      path.includes("..") || path.includes("\\") || path.includes("//") ||
      path.split("/").some((segment) => !segment || segment.startsWith(".")) ||
      /(\.pem|\.key|\.p12|\.pfx|private-extra-headers\.json)$/i.test(path)) {
    throw new Error("NOVA_GITHUB_PATH_NOT_ALLOWED");
  }

  if (typeof data.content !== "string" || !data.content.trim() ||
      Buffer.byteLength(data.content, "utf8") > MAX_CONTENT_BYTES ||
      /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|gh[pousr]_[A-Za-z0-9_]{20,}|sk-proj-[A-Za-z0-9_-]{20,}/.test(data.content)) {
    throw new Error("NOVA_GITHUB_CONTENT_INVALID_OR_SENSITIVE");
  }

  const commit_message = requiredText(data, "commit_message", 180);
  const pr_title = requiredText(data, "pr_title", 180);
  const pr_body = requiredText(data, "pr_body", 3000);
  if (commit_message.length < 8 || pr_title.length < 8 || pr_body.length < 12) {
    throw new Error("NOVA_GITHUB_PROPOSAL_INCOMPLETE");
  }

  return {
    repository, branch, expected_base_sha, path, expected_file_sha,
    content: data.content, commit_message, pr_title, pr_body,
  };
}
