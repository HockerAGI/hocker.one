import { createHash } from "node:crypto";

import { getAgiCertificationSnapshot } from "@/lib/agi-certification";
import { createContextBridgeCheckpoint } from "@/lib/context-bridge";
import { createAdminSupabase } from "@/lib/supabase-admin";

const PROJECT_ID = "hocker-one";
const DEFAULT_GITHUB_OWNER = "HockerAGI";
const FOCUS_REPOSITORIES = new Set(["hocker.one", "nova.agi"]);

type GithubRepository = {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  visibility?: string;
  archived: boolean;
  default_branch: string;
  pushed_at?: string | null;
  updated_at?: string | null;
  html_url?: string;
  owner?: { login?: string };
};

type GithubRef = {
  object?: { sha?: string };
};

type GithubPull = {
  number: number;
  title?: string;
  draft?: boolean;
  updated_at?: string;
  head?: { sha?: string; ref?: string };
  base?: { ref?: string };
};

type RepositorySnapshot = {
  id: number;
  name: string;
  full_name: string;
  visibility: string;
  archived: boolean;
  default_branch: string;
  head_sha: string | null;
  pushed_at: string | null;
  updated_at: string | null;
};

type ContinuitySourceResult = {
  source: "github" | "supabase" | "vercel";
  ok: boolean;
  revision?: string;
  checkpoint_id?: string | null;
  error?: string;
};

export type ProjectContinuityResult = {
  ok: boolean;
  reconciled_at: string;
  sources: ContinuitySourceResult[];
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function sha256(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function githubToken(): string {
  const token = process.env.HOCKER_GITHUB_TOKEN ?? process.env.GITHUB_TOKEN ?? process.env.GH_TOKEN;
  if (!token) throw new Error("github_continuity_token_missing");
  return token;
}

async function githubRequest<T>(path: string): Promise<T> {
  const response = await fetch(`https://api.github.com${path}`, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${githubToken()}`,
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "hocker-one-continuity/1.0",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`github_continuity_http_${response.status}`);
  }

  return (await response.json()) as T;
}

async function listOwnerRepositories(owner: string): Promise<GithubRepository[]> {
  const all: GithubRepository[] = [];
  for (let page = 1; page <= 10; page += 1) {
    const batch = await githubRequest<GithubRepository[]>(
      `/user/repos?affiliation=owner&visibility=all&sort=full_name&direction=asc&per_page=100&page=${page}`,
    );
    all.push(...batch.filter((repo) => repo.owner?.login === owner));
    if (batch.length < 100) break;
  }
  return all;
}

async function readRepositoryHead(owner: string, repository: GithubRepository): Promise<string | null> {
  try {
    const ref = await githubRequest<GithubRef>(
      `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository.name)}/git/ref/heads/${encodeURIComponent(repository.default_branch)}`,
    );
    return ref.object?.sha ?? null;
  } catch {
    return null;
  }
}

async function listOpenPulls(owner: string, repository: string): Promise<GithubPull[]> {
  return githubRequest<GithubPull[]>(
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/pulls?state=open&per_page=100&sort=updated&direction=desc`,
  );
}

function previousRepositorySnapshots(cursor: unknown): RepositorySnapshot[] {
  const repositories = asRecord(cursor).repositories;
  if (!Array.isArray(repositories)) return [];
  return repositories
    .map((value) => asRecord(value))
    .filter((value) => typeof value.id === "number" && typeof value.full_name === "string")
    .map((value) => ({
      id: Number(value.id),
      name: String(value.name ?? ""),
      full_name: String(value.full_name),
      visibility: String(value.visibility ?? "unknown"),
      archived: value.archived === true,
      default_branch: String(value.default_branch ?? "main"),
      head_sha: typeof value.head_sha === "string" ? value.head_sha : null,
      pushed_at: typeof value.pushed_at === "string" ? value.pushed_at : null,
      updated_at: typeof value.updated_at === "string" ? value.updated_at : null,
    }));
}

function lifecycleDelta(previous: RepositorySnapshot[], current: RepositorySnapshot[]) {
  if (previous.length === 0) {
    return { baseline: true, added: [], removed: [], renamed: [], changed: [] };
  }

  const before = new Map(previous.map((repo) => [repo.id, repo]));
  const after = new Map(current.map((repo) => [repo.id, repo]));
  const added = current.filter((repo) => !before.has(repo.id)).map((repo) => repo.full_name);
  const removed = previous.filter((repo) => !after.has(repo.id)).map((repo) => repo.full_name);
  const renamed: Array<{ from: string; to: string }> = [];
  const changed: string[] = [];

  for (const repo of current) {
    const old = before.get(repo.id);
    if (!old) continue;
    if (old.full_name !== repo.full_name) renamed.push({ from: old.full_name, to: repo.full_name });
    if (
      old.head_sha !== repo.head_sha
      || old.archived !== repo.archived
      || old.pushed_at !== repo.pushed_at
    ) {
      changed.push(repo.full_name);
    }
  }

  return { baseline: false, added, removed, renamed, changed };
}

async function latestGithubCursor(): Promise<unknown> {
  const supabase = createAdminSupabase();
  const { data, error } = await supabase
    .from("context_bridge_checkpoints")
    .select("cursor")
    .eq("project_id", PROJECT_ID)
    .eq("source_id", "github.ecosystem")
    .order("observed_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data?.cursor ?? {};
}

async function reconcileGithub(): Promise<ContinuitySourceResult> {
  const owner = process.env.GITHUB_OWNER ?? DEFAULT_GITHUB_OWNER;
  const repositories = await listOwnerRepositories(owner);
  const snapshots: RepositorySnapshot[] = await Promise.all(
    repositories.map(async (repo) => ({
      id: repo.id,
      name: repo.name,
      full_name: repo.full_name,
      visibility: repo.visibility ?? (repo.private ? "private" : "public"),
      archived: repo.archived,
      default_branch: repo.default_branch,
      head_sha: await readRepositoryHead(owner, repo),
      pushed_at: repo.pushed_at ?? null,
      updated_at: repo.updated_at ?? null,
    })),
  );
  snapshots.sort((left, right) => left.full_name.localeCompare(right.full_name));

  const focus = Object.fromEntries(
    await Promise.all(
      snapshots
        .filter((repo) => FOCUS_REPOSITORIES.has(repo.name))
        .map(async (repo) => {
          const pulls = await listOpenPulls(owner, repo.name);
          return [repo.name, {
            head_sha: repo.head_sha,
            open_prs: pulls.map((pull) => ({
              number: pull.number,
              title: pull.title ?? "",
              draft: pull.draft === true,
              head_sha: pull.head?.sha ?? null,
              head_ref: pull.head?.ref ?? null,
              base_ref: pull.base?.ref ?? null,
              updated_at: pull.updated_at ?? null,
            })),
          }] as const;
        }),
    ),
  );

  const previous = previousRepositorySnapshots(await latestGithubCursor());
  const lifecycle = lifecycleDelta(previous, snapshots);
  const revision = sha256({ repositories: snapshots, focus });
  const openItems: string[] = [];
  if (lifecycle.removed.length > 0) {
    openItems.push(`Verificar que la desaparición de repos sea intencional: ${lifecycle.removed.join(", ")}`);
  }
  if (snapshots.some((repo) => !repo.head_sha)) {
    openItems.push("Hay repositorios cuyo SHA de la rama por defecto no pudo verificarse.");
  }

  const checkpoint = await createContextBridgeCheckpoint({
    project_id: PROJECT_ID,
    source_id: "github.ecosystem",
    provider: "github",
    source_kind: "git_code",
    external_ref: `github://${owner}/repositories`,
    source_revision: revision,
    summary: `Inventario GitHub reconciliado: ${snapshots.length} repositorios. Cambios desde el checkpoint anterior: +${lifecycle.added.length} / -${lifecycle.removed.length} / renombrados ${lifecycle.renamed.length} / actividad ${lifecycle.changed.length}.`,
    decisions: [],
    open_items: openItems,
    canonical_refs: snapshots.map((repo) => ({
      kind: "repository" as const,
      ref: `https://github.com/${repo.full_name}`,
      revision: repo.head_sha ?? repo.pushed_at ?? "head-unverified",
    })),
    cursor: {
      repositories: snapshots,
      lifecycle,
      focus,
      source: "github-api",
    },
    capabilities: [{
      capability_key: "github.repository_inventory",
      access_mode: "read_only",
      status: "verified",
      mutates_external: false,
      owner_gate_required: false,
      evidence_ref: `github://${owner}/repositories`,
    }],
  }, "continuity-reconciler:github");

  return {
    source: "github",
    ok: true,
    revision,
    checkpoint_id: typeof checkpoint.id === "string" ? checkpoint.id : null,
  };
}

async function reconcileSupabase(): Promise<ContinuitySourceResult> {
  const certification = await getAgiCertificationSnapshot(PROJECT_ID);
  const entries = certification.entries.map((entry) => ({
    agi_id: entry.agi_id,
    passed: entry.passed,
    total: entry.total,
    certified_for_current_scope: entry.certified_for_current_scope,
    missing: entry.missing,
  }));
  const guarded = certification.entries.filter((entry) => entry.checks.allow_actions_guarded).length;
  const runtimeEval = certification.entries.filter((entry) => entry.checks.individual_eval_suite).length;
  const toolEval = certification.entries.filter((entry) => entry.checks.tool_runtime_evidence).length;
  const runtimeEvidence = certification.entries.filter((entry) => entry.checks.runtime_evidence).length;
  const revision = sha256({
    version: certification.version,
    eval_suite_version: certification.eval_suite_version,
    tool_eval_version: certification.tool_eval_version,
    entries,
  });

  const checkpoint = await createContextBridgeCheckpoint({
    project_id: PROJECT_ID,
    source_id: "supabase.agi-evidence",
    provider: "supabase",
    source_kind: "production_state",
    external_ref: "supabase://hocker-one/agi-certification",
    source_revision: revision,
    summary: `Evidencia AGI: ${certification.entries.length}/16 perfiles evaluados por la matriz, ${guarded}/${certification.entries.length} fail-closed, ${runtimeEval}/${certification.entries.length} con eval runtime, ${toolEval}/${certification.entries.length} con tool-eval y ${certification.certified}/${certification.entries.length} certificados para su alcance actual.`,
    decisions: [],
    open_items: [
      ...(runtimeEval < certification.entries.length ? ["Completar evidencia runtime-eval mediante el flujo Owner + AAL2; no insertar resultados manualmente."] : []),
      ...(toolEval < certification.entries.length ? ["Completar evidencia tool-eval read-only mediante el flujo gobernado."] : []),
    ],
    canonical_refs: [{
      kind: "evidence",
      ref: "supabase://hocker-one/agi-certification",
      revision: certification.version,
    }],
    cursor: {
      certification_version: certification.version,
      checked_at: certification.checked_at,
      source: certification.source,
      registered: certification.entries.length,
      guarded,
      runtime_eval_evidence: runtimeEval,
      tool_eval_evidence: toolEval,
      runtime_evidence: runtimeEvidence,
      certified: certification.certified,
      pending: certification.pending,
      entries,
    },
    capabilities: [{
      capability_key: "supabase.agi_certification_read",
      access_mode: "read_only",
      status: certification.source === "supabase+code" ? "verified" : "partial",
      mutates_external: false,
      owner_gate_required: false,
      evidence_ref: "supabase://hocker-one/agi-certification",
    }],
  }, "continuity-reconciler:supabase");

  return {
    source: "supabase",
    ok: true,
    revision,
    checkpoint_id: typeof checkpoint.id === "string" ? checkpoint.id : null,
  };
}

async function reconcileVercel(): Promise<ContinuitySourceResult> {
  const deployment = {
    environment: process.env.VERCEL_ENV ?? null,
    project_id: process.env.VERCEL_PROJECT_ID ?? null,
    git_commit_sha: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
    git_commit_ref: process.env.VERCEL_GIT_COMMIT_REF ?? null,
    deployment_url: process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
    production_url: process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : null,
    region: process.env.VERCEL_REGION ?? null,
  };
  const revision = sha256(deployment);
  const verified = Boolean(deployment.environment && deployment.git_commit_sha && deployment.deployment_url);

  const checkpoint = await createContextBridgeCheckpoint({
    project_id: PROJECT_ID,
    source_id: "vercel.hocker-one-runtime",
    provider: "vercel",
    source_kind: "production_state",
    external_ref: deployment.deployment_url ?? "vercel://hocker-one/runtime",
    source_revision: deployment.git_commit_sha ?? revision,
    summary: verified
      ? `Hocker One ejecutándose en Vercel ${deployment.environment} para SHA ${deployment.git_commit_sha}.`
      : "Metadata de runtime Vercel incompleta en este entorno; no se declara deployment verificado.",
    decisions: [],
    open_items: verified ? [] : ["Verificar metadata del deployment Vercel desde un entorno productivo conectado."],
    canonical_refs: deployment.git_commit_sha ? [{
      kind: "production",
      ref: deployment.deployment_url ?? "vercel://hocker-one/runtime",
      revision: deployment.git_commit_sha,
    }] : [],
    cursor: deployment,
    capabilities: [{
      capability_key: "vercel.runtime_metadata",
      access_mode: "read_only",
      status: verified ? "verified" : "partial",
      mutates_external: false,
      owner_gate_required: false,
      evidence_ref: deployment.deployment_url ?? "vercel://hocker-one/runtime",
    }],
  }, "continuity-reconciler:vercel");

  return {
    source: "vercel",
    ok: verified,
    revision,
    checkpoint_id: typeof checkpoint.id === "string" ? checkpoint.id : null,
    ...(verified ? {} : { error: "vercel_runtime_metadata_incomplete" }),
  };
}

function failedSource(source: ContinuitySourceResult["source"], reason: unknown): ContinuitySourceResult {
  return {
    source,
    ok: false,
    error: reason instanceof Error ? reason.message : "continuity_source_failed",
  };
}

export async function reconcileProjectContinuity(): Promise<ProjectContinuityResult> {
  const reconciledAt = new Date().toISOString();
  const [github, supabase, vercel] = await Promise.allSettled([
    reconcileGithub(),
    reconcileSupabase(),
    reconcileVercel(),
  ]);

  const sources: ContinuitySourceResult[] = [
    github.status === "fulfilled" ? github.value : failedSource("github", github.reason),
    supabase.status === "fulfilled" ? supabase.value : failedSource("supabase", supabase.reason),
    vercel.status === "fulfilled" ? vercel.value : failedSource("vercel", vercel.reason),
  ];

  return {
    ok: sources.every((source) => source.ok),
    reconciled_at: reconciledAt,
    sources,
  };
}
