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
export const NOVA_GITHUB_MAX_FILES = 3;

// Keep within the 16 KiB native-tool JSON argument boundary, including metadata.
export const NOVA_GITHUB_MAX_BATCH_BYTES = 12 * 1024;

export type NovaGithubFileChange = {
  path: string;
  expected_file_sha: string;
  content: string;
};

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
  /** Canonical, ordered and bounded file changes; includes the legacy one-file proposal. */
  changes: NovaGithubFileChange[];
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
    "content", "changes", "commit_message", "pr_title", "pr_body",
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
  if (!SHA_PATTERN.test(expected_base_sha)) {
    throw new Error("NOVA_GITHUB_OBSERVED_SHA_REQUIRED");
  }

  // Native tools can propose 1-3 modified files in ONE existing Owner Gate
  // lifecycle. Legacy one-file arguments remain accepted unchanged.
  const hasBatch = Object.hasOwn(data, "changes");
  if (hasBatch && ["path", "expected_file_sha", "content"].some((key) => Object.hasOwn(data, key))) {
    throw new Error("NOVA_GITHUB_PROPOSAL_MIXED_FORMS");
  }
  if (hasBatch && (!Array.isArray(data.changes) ||
      data.changes.length === 0 || data.changes.length > NOVA_GITHUB_MAX_FILES)) {
    throw new Error("NOVA_GITHUB_PROPOSAL_INVALID_FILES_COUNT");
  }

  const fileInputs: unknown[] = hasBatch
    ? data.changes as unknown[]
    : [{ path: data.path, expected_file_sha: data.expected_file_sha, content: data.content }];

  const changes: NovaGithubFileChange[] = fileInputs.map((raw) => {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
      throw new Error("NOVA_GITHUB_PROPOSAL_INVALID_FILE_CHANGE");
    }
    const file = raw as Record<string, unknown>;
    if (Object.keys(file).some((key) => !["path", "expected_file_sha", "content"].includes(key))) {
      throw new Error("NOVA_GITHUB_PROPOSAL_UNEXPECTED_ARGUMENT");
    }
    const expected_file_sha = requiredText(file, "expected_file_sha", 64);
    if (!SHA_PATTERN.test(expected_file_sha)) throw new Error("NOVA_GITHUB_OBSERVED_SHA_REQUIRED");

    const path = requiredText(file, "path", 240);
    if (!(path.startsWith("src/") || path.startsWith("docs/")) ||
        path.includes("..") || path.includes("\\") || path.includes("//") ||
        path.split("/").some((segment) => !segment || segment.startsWith(".")) ||
        /(\.pem|\.key|\.p12|\.pfx|private-extra-headers\.json)$/i.test(path)) {
      throw new Error("NOVA_GITHUB_PATH_NOT_ALLOWED");
    }

    if (typeof file.content !== "string" || !file.content.trim() ||
        Buffer.byteLength(file.content, "utf8") > MAX_CONTENT_BYTES ||
        /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|gh[pousr]_[A-Za-z0-9_]{20,}|sk-proj-[A-Za-z0-9_-]{20,}/.test(file.content)) {
      throw new Error("NOVA_GITHUB_CONTENT_INVALID_OR_SENSITIVE");
    }
    return { path, expected_file_sha, content: file.content };
  });

  if (new Set(changes.map((entry) => entry.path)).size !== changes.length) {
    throw new Error("NOVA_GITHUB_DUPLICATE_FILE_PATH");
  }
  if (changes.reduce((sum, entry) => sum + Buffer.byteLength(entry.content, "utf8"), 0) >
      NOVA_GITHUB_MAX_BATCH_BYTES) {
    throw new Error("NOVA_GITHUB_CONTENT_INVALID_OR_SENSITIVE");
  }

  const commit_message = requiredText(data, "commit_message", 180);
  const pr_title = requiredText(data, "pr_title", 180);
  const pr_body = requiredText(data, "pr_body", 3000);
  if (commit_message.length < 8 || pr_title.length < 8 || pr_body.length < 12) {
    throw new Error("NOVA_GITHUB_PROPOSAL_INCOMPLETE");
  }

  return {
    repository, branch, expected_base_sha,
    // Preserve the existing caller contract for one-file and test consumers.
    path: changes[0].path, expected_file_sha: changes[0].expected_file_sha,
    content: changes[0].content, commit_message, pr_title, pr_body,
    changes,
  };
}
