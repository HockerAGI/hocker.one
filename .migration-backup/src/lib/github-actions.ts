type JsonRecord = Record<string, unknown>;

type GithubCommandResult = {
  command: string;
  ok: boolean;
  data?: unknown;
  note?: string;
};

function readEnv(...names: string[]): string {
  for (const name of names) {
    const value = String(process.env[name] ?? "").trim();
    if (value) return value;
  }
  return "";
}

function asString(value: unknown, fallback = ""): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return fallback;
}

function safePath(value: unknown): string {
  const raw = asString(value).trim().replace(/^\/+/, "");
  if (!raw || raw.includes("..") || raw.startsWith(".git/")) {
    throw new Error("Ruta de repo inválida o peligrosa.");
  }
  return raw;
}

function safeBranch(value: unknown): string {
  const raw = asString(value).trim();
  if (!raw) {
    const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    return `nova/${stamp}`;
  }

  if (!/^(nova|hocker)\//.test(raw)) {
    throw new Error("Por seguridad, la rama debe iniciar con nova/ o hocker/.");
  }

  if (raw.includes("..") || raw.includes(" ") || raw.startsWith("/") || raw.endsWith("/")) {
    throw new Error("Nombre de rama inválido.");
  }

  return raw;
}

function repoConfig(payload: JsonRecord) {
  const token = readEnv("HOCKER_GITHUB_TOKEN", "GITHUB_TOKEN");
  const owner = asString(payload.owner, readEnv("GITHUB_OWNER", "HOCKER_GITHUB_OWNER") || "HockerAGI");
  const repo = asString(payload.repo, readEnv("GITHUB_REPO", "HOCKER_GITHUB_REPO") || "hocker.one");
  const baseBranch = asString(payload.baseBranch, readEnv("GITHUB_DEFAULT_BRANCH") || "main");

  if (!token) {
    throw new Error("HOCKER_GITHUB_TOKEN / GITHUB_TOKEN no configurado.");
  }

  if (!owner || !repo) {
    throw new Error("GitHub owner/repo no configurado.");
  }

  return { token, owner, repo, baseBranch };
}

async function githubFetch<T>(path: string, init: RequestInit, token: string): Promise<T> {
  const res = await fetch(`https://api.github.com${path}`, {
    ...init,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(init.headers || {}),
    },
    cache: "no-store",
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : {};

  if (!res.ok) {
    const message =
      typeof data?.message === "string"
        ? data.message
        : `GitHub API falló con HTTP ${res.status}`;
    throw new Error(message);
  }

  return data as T;
}

async function getRefSha(owner: string, repo: string, branch: string, token: string): Promise<string> {
  const ref = await githubFetch<{ object?: { sha?: string } }>(
    `/repos/${owner}/${repo}/git/ref/heads/${encodeURIComponent(branch)}`,
    { method: "GET" },
    token,
  );

  const sha = ref.object?.sha;
  if (!sha) throw new Error("No se pudo leer el SHA base de GitHub.");
  return sha;
}

async function resolveTreeRef(owner: string, repo: string, ref: string, token: string): Promise<string> {
  const value = String(ref || "").trim();
  if (!value) throw new Error("Ref GitHub inválido.");
  if (/^[0-9a-f]{40}$/i.test(value)) return value;

  try {
    return await getRefSha(owner, repo, value, token);
  } catch {
    return value;
  }
}

async function branchExists(owner: string, repo: string, branch: string, token: string): Promise<boolean> {
  try {
    await getRefSha(owner, repo, branch, token);
    return true;
  } catch {
    return false;
  }
}

async function ensureBranch(owner: string, repo: string, baseBranch: string, branch: string, token: string): Promise<void> {
  if (await branchExists(owner, repo, branch, token)) return;

  const baseSha = await getRefSha(owner, repo, baseBranch, token);

  await githubFetch(
    `/repos/${owner}/${repo}/git/refs`,
    {
      method: "POST",
      body: JSON.stringify({
        ref: `refs/heads/${branch}`,
        sha: baseSha,
      }),
    },
    token,
  );
}

async function getFileSha(
  owner: string,
  repo: string,
  filePath: string,
  branch: string,
  token: string,
): Promise<string | null> {
  try {
    const file = await githubFetch<{ sha?: string; type?: string }>(
      `/repos/${owner}/${repo}/contents/${encodeURIComponent(filePath).replace(/%2F/g, "/")}?ref=${encodeURIComponent(branch)}`,
      { method: "GET" },
      token,
    );

    if (file.type && file.type !== "file") {
      throw new Error("La ruta existe pero no es archivo.");
    }

    return file.sha ?? null;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.toLowerCase().includes("not found")) return null;
    throw error;
  }
}

export async function runGithubCommand(command: string, payload: JsonRecord): Promise<GithubCommandResult> {
  const { token, owner, repo, baseBranch } = repoConfig(payload);

  if (command === "github.get_repo") {
    const repoInfo = await githubFetch<{
      id?: number;
      name?: string;
      full_name?: string;
      private?: boolean;
      default_branch?: string;
      html_url?: string;
      description?: string | null;
      visibility?: string;
      updated_at?: string;
    }>(
      `/repos/${owner}/${repo}`,
      { method: "GET" },
      token,
    );

    return {
      command,
      ok: true,
      data: {
        owner,
        repo,
        id: repoInfo.id,
        name: repoInfo.name,
        fullName: repoInfo.full_name,
        private: repoInfo.private,
        defaultBranch: repoInfo.default_branch,
        url: repoInfo.html_url,
        description: repoInfo.description,
        visibility: repoInfo.visibility,
        updatedAt: repoInfo.updated_at,
      },
    };
  }

  if (command === "github.list_tree") {
    const ref = asString(payload.ref, baseBranch);
    const treeRef = await resolveTreeRef(owner, repo, ref, token);
    const recursive = payload.recursive !== false;

    const tree = await githubFetch<{
      sha?: string;
      truncated?: boolean;
      tree?: Array<{
        path?: string;
        mode?: string;
        type?: string;
        sha?: string;
        size?: number;
        url?: string;
      }>;
    }>(
      `/repos/${owner}/${repo}/git/trees/${encodeURIComponent(treeRef)}${recursive ? "?recursive=1" : ""}`,
      { method: "GET" },
      token,
    );

    return {
      command,
      ok: true,
      data: {
        owner,
        repo,
        ref,
        treeRef,
        sha: tree.sha,
        truncated: Boolean(tree.truncated),
        files: (tree.tree ?? []).map((item) => ({
          path: item.path,
          type: item.type,
          size: item.size ?? null,
          sha: item.sha,
        })),
      },
    };
  }

  if (command === "github.read_file") {
    const filePath = safePath(payload.path);
    const ref = asString(payload.ref, baseBranch);

    const file = await githubFetch<{
      content?: string;
      encoding?: string;
      sha?: string;
      html_url?: string;
    }>(
      `/repos/${owner}/${repo}/contents/${encodeURIComponent(filePath).replace(/%2F/g, "/")}?ref=${encodeURIComponent(ref)}`,
      { method: "GET" },
      token,
    );

    const content =
      file.encoding === "base64" && file.content
        ? Buffer.from(file.content.replace(/\n/g, ""), "base64").toString("utf8")
        : "";

    return {
      command,
      ok: true,
      data: {
        owner,
        repo,
        path: filePath,
        ref,
        sha: file.sha,
        url: file.html_url,
        content,
      },
    };
  }

  if (command === "github.create_branch") {
    const branch = safeBranch(payload.branch);
    await ensureBranch(owner, repo, baseBranch, branch, token);

    return {
      command,
      ok: true,
      data: { owner, repo, baseBranch, branch },
    };
  }

  if (command === "github.upsert_file") {
    const branch = safeBranch(payload.branch);
    const filePath = safePath(payload.path);
    const content = asString(payload.content);
    const message = asString(
      payload.message,
      `chore: update ${filePath} via NOVA`,
    );

    await ensureBranch(owner, repo, baseBranch, branch, token);

    const sha = await getFileSha(owner, repo, filePath, branch, token);

    const response = await githubFetch<{
      commit?: { sha?: string; html_url?: string };
      content?: { html_url?: string };
    }>(
      `/repos/${owner}/${repo}/contents/${encodeURIComponent(filePath).replace(/%2F/g, "/")}`,
      {
        method: "PUT",
        body: JSON.stringify({
          message,
          content: Buffer.from(content, "utf8").toString("base64"),
          branch,
          ...(sha ? { sha } : {}),
        }),
      },
      token,
    );

    return {
      command,
      ok: true,
      data: {
        owner,
        repo,
        branch,
        path: filePath,
        commit: response.commit?.sha,
        commitUrl: response.commit?.html_url,
        fileUrl: response.content?.html_url,
      },
    };
  }

  if (command === "github.create_pr") {
    const branch = safeBranch(payload.branch);
    const title = asString(payload.title, "NOVA update");
    const body = asString(payload.body, "Cambio generado desde Hocker ONE / NOVA.");
    const draft = Boolean(payload.draft ?? true);

    const pr = await githubFetch<{
      number?: number;
      html_url?: string;
      state?: string;
    }>(
      `/repos/${owner}/${repo}/pulls`,
      {
        method: "POST",
        body: JSON.stringify({
          title,
          head: branch,
          base: baseBranch,
          body,
          draft,
        }),
      },
      token,
    );

    return {
      command,
      ok: true,
      data: {
        owner,
        repo,
        branch,
        baseBranch,
        number: pr.number,
        url: pr.html_url,
        state: pr.state,
      },
    };
  }

  throw new Error(`Comando GitHub no soportado: ${command}`);
}
