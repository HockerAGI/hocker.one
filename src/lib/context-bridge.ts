import { createHash } from "node:crypto";
import { z } from "zod";
import { createAdminSupabase } from "@/lib/supabase-admin";

export const CONTEXT_BRIDGE_VERSION = "context-bridge-v1" as const;

export const CONTEXT_BRIDGE_PROVIDERS = [
  "chatgpt",
  "codex",
  "github",
  "google_drive",
  "supabase",
  "vercel",
] as const;

export const CONTEXT_SOURCE_PRECEDENCE = [
  "production_state",
  "git_code",
  "verified_contract",
  "approved_canon",
  "external_knowledge",
  "conversation",
] as const;

export const FORBIDDEN_RAW_FIELDS = ["raw_content", "transcript", "messages"] as const;

const SECRET_KEY = /(authorization|cookie|password|passwd|secret|token|api[_-]?key|private[_-]?key|service[_-]?role)/i;
const SECRET_VALUE = /(?:\bsk-(?:proj|admin|ant|live|test)-|\bgh[opsu]_[A-Za-z0-9_]{20,}|\bsbp_[A-Za-z0-9]{20,}|\bsb_secret_[A-Za-z0-9_-]{20,}|\bvcp_[A-Za-z0-9_-]{20,}|\bAIza[0-9A-Za-z_-]{30,}|\beyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.)/;

const CanonicalRefSchema = z.object({
  kind: z.enum(["production", "repository", "contract", "document", "conversation", "evidence"]),
  ref: z.string().trim().min(1).max(1000),
  revision: z.string().trim().min(1).max(256).optional(),
  content_hash: z.string().regex(/^[a-f0-9]{64}$/).optional(),
}).strict();

const CapabilitySchema = z.object({
  capability_key: z.string().trim().min(1).max(160).regex(/^[a-z0-9_.:-]+$/i),
  access_mode: z.enum(["read_only", "owner_gated_write", "unavailable"]),
  status: z.enum(["verified", "configured", "partial", "missing", "blocked"]),
  mutates_external: z.boolean(),
  owner_gate_required: z.boolean(),
  evidence_ref: z.string().trim().min(1).max(1000).optional(),
}).strict().superRefine((capability, ctx) => {
  if (capability.mutates_external && !capability.owner_gate_required) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["owner_gate_required"],
      message: "Toda capacidad que modifica un sistema externo requiere Owner Gate.",
    });
  }
});

export const ContextBridgeCheckpointSchema = z.object({
  project_id: z.string().trim().min(1).max(120).regex(/^[a-z0-9_.:-]+$/i).default("hocker-one"),
  source_id: z.string().trim().min(1).max(180).regex(/^[a-z0-9_.:-]+$/i),
  provider: z.enum(CONTEXT_BRIDGE_PROVIDERS),
  source_kind: z.enum(CONTEXT_SOURCE_PRECEDENCE),
  external_ref: z.string().trim().min(1).max(1000),
  source_revision: z.string().trim().min(1).max(256),
  summary: z.string().trim().min(1).max(4000),
  decisions: z.array(z.string().trim().min(1).max(1000)).max(64).default([]),
  open_items: z.array(z.string().trim().min(1).max(1000)).max(64).default([]),
  canonical_refs: z.array(CanonicalRefSchema).max(128).default([]),
  cursor: z.record(z.unknown()).default({}),
  capabilities: z.array(CapabilitySchema).max(256).default([]),
  observed_at: z.string().datetime({ offset: true }).optional(),
}).strict();

export const ContextBridgeManifestSchema = z.object({
  project_id: z.string().trim().min(1).max(120).regex(/^[a-z0-9_.:-]+$/i).default("hocker-one"),
  scope: z.enum(["global", "repository", "project", "conversation", "release"]),
  title: z.string().trim().min(1).max(240),
  summary: z.string().trim().min(1).max(4000),
  required_providers: z.array(z.enum(CONTEXT_BRIDGE_PROVIDERS)).min(1).max(CONTEXT_BRIDGE_PROVIDERS.length)
    .default([...CONTEXT_BRIDGE_PROVIDERS]),
  canonical_refs: z.array(CanonicalRefSchema).max(128).default([]),
  max_staleness_hours: z.number().int().min(1).max(720).default(168),
  activate: z.boolean().default(false),
}).strict();

export type ContextBridgeCheckpointInput = z.input<typeof ContextBridgeCheckpointSchema>;
export type ContextBridgeManifestInput = z.input<typeof ContextBridgeManifestSchema>;
type ParsedCheckpoint = z.output<typeof ContextBridgeCheckpointSchema>;

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableValue);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, child]) => [key, stableValue(child)]),
  );
}

export function containsSecretMaterial(value: unknown, depth = 0): boolean {
  if (depth > 10) return true;
  if (typeof value === "string") return SECRET_VALUE.test(value);
  if (Array.isArray(value)) return value.some((child) => containsSecretMaterial(child, depth + 1));
  if (!value || typeof value !== "object") return false;

  return Object.entries(value as Record<string, unknown>).some(
    ([key, child]) =>
      SECRET_KEY.test(key) ||
      (FORBIDDEN_RAW_FIELDS as readonly string[]).includes(key.toLowerCase()) ||
      containsSecretMaterial(child, depth + 1),
  );
}

export function contextCheckpointHash(checkpoint: ParsedCheckpoint): string {
  return createHash("sha256")
    .update(JSON.stringify(stableValue(checkpoint)))
    .digest("hex");
}

export async function createContextBridgeCheckpoint(input: ContextBridgeCheckpointInput, actor: string) {
  const checkpoint = ContextBridgeCheckpointSchema.parse(input);
  if (containsSecretMaterial(checkpoint)) {
    throw new Error("El checkpoint contiene material secreto o contenido crudo no permitido.");
  }

  const content_hash = contextCheckpointHash(checkpoint);
  const supabase = createAdminSupabase();
  const now = new Date().toISOString();
  const accessMode = checkpoint.capabilities.some((capability) => capability.mutates_external)
    ? "owner_gated_write"
    : "read_only";
  const { data, error } = await supabase
    .rpc("record_context_bridge_checkpoint", {
      p_payload: {
        ...checkpoint,
        observed_at: checkpoint.observed_at ?? now,
        source_access_mode: accessMode,
        content_hash,
        contains_secrets: false,
        captured_by: actor,
      },
    })
    .single();
  if (error) throw error;

  return {
    ...(data as Record<string, unknown>),
    context_bridge_version: CONTEXT_BRIDGE_VERSION,
    raw_content_stored: false,
    owner_gate_required_for_external_writes: true,
  };
}

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function uniqueJsonObjects(values: unknown[]): Record<string, unknown>[] {
  const seen = new Set<string>();
  const result: Record<string, unknown>[] = [];
  for (const value of values) {
    const item = record(value);
    if (Object.keys(item).length === 0) continue;
    const key = JSON.stringify(stableValue(item));
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }
  return result;
}

export async function createContextBridgeManifest(input: ContextBridgeManifestInput, actor: string) {
  const manifest = ContextBridgeManifestSchema.parse(input);
  if (containsSecretMaterial(manifest)) {
    throw new Error("El manifiesto contiene material secreto o contenido crudo no permitido.");
  }

  const supabase = createAdminSupabase();
  const { data: sourceData, error: sourceError } = await supabase
    .from("context_bridge_sources")
    .select("id, provider, source_kind, status, last_verified_at, last_checkpoint_at")
    .eq("project_id", manifest.project_id)
    .in("provider", manifest.required_providers);
  if (sourceError) throw sourceError;

  const sources = (sourceData ?? []) as Array<Record<string, unknown>>;
  const sourceIds = sources.map((source) => String(source.id ?? "")).filter(Boolean);
  let checkpoints: Array<Record<string, unknown>> = [];
  if (sourceIds.length > 0) {
    const { data: checkpointData, error: checkpointError } = await supabase
      .from("context_bridge_checkpoints")
      .select("id, source_id, external_ref, source_revision, source_kind, canonical_refs, content_hash, observed_at, created_at")
      .eq("project_id", manifest.project_id)
      .in("source_id", sourceIds)
      .order("observed_at", { ascending: false });
    if (checkpointError) throw checkpointError;
    checkpoints = (checkpointData ?? []) as Array<Record<string, unknown>>;
  }

  const latestBySource = new Map<string, Record<string, unknown>>();
  for (const checkpoint of checkpoints) {
    const sourceId = String(checkpoint.source_id ?? "");
    if (sourceId && !latestBySource.has(sourceId)) latestBySource.set(sourceId, checkpoint);
  }

  const staleBefore = Date.now() - manifest.max_staleness_hours * 60 * 60 * 1000;
  const coverage = manifest.required_providers.map((provider) => {
    const providerSources = sources.filter((source) => source.provider === provider);
    const providerCheckpoints = providerSources
      .map((source) => latestBySource.get(String(source.id ?? "")))
      .filter((item): item is Record<string, unknown> => Boolean(item))
      .sort((left, right) =>
        Date.parse(String(right.observed_at ?? "")) - Date.parse(String(left.observed_at ?? "")),
      );
    const newest = providerCheckpoints[0];
    const observedAt = newest ? Date.parse(String(newest.observed_at ?? "")) : Number.NaN;
    const status = !newest
      ? "missing"
      : !Number.isFinite(observedAt) || observedAt < staleBefore
        ? "stale"
        : "complete";
    return {
      domain_key: `provider:${provider}`,
      expected_refs: 1,
      verified_refs: status === "complete" ? 1 : 0,
      status,
      missing_refs: status === "complete" ? [] : [provider],
      evidence_refs: newest ? [String(newest.external_ref ?? "")] : [],
      verified_at: status === "complete" ? String(newest?.observed_at ?? "") : null,
    };
  });

  let capabilities: Array<Record<string, unknown>> = [];
  if (sourceIds.length > 0) {
    const { data: capabilityData, error: capabilityError } = await supabase
      .from("context_bridge_capabilities")
      .select("source_id, provider, capability_key, access_mode, status, mutates_external, owner_gate_required, evidence_ref, last_verified_at")
      .eq("project_id", manifest.project_id)
      .in("source_id", sourceIds);
    if (capabilityError) throw capabilityError;
    capabilities = (capabilityData ?? []) as Array<Record<string, unknown>>;
  }

  const checkpointIds = [...latestBySource.values()]
    .map((checkpoint) => String(checkpoint.id ?? ""))
    .filter(Boolean);
  const checkpointRefs = [...latestBySource.values()].flatMap((checkpoint) =>
    Array.isArray(checkpoint.canonical_refs) ? checkpoint.canonical_refs : [],
  );
  const canonicalRefs = uniqueJsonObjects([...manifest.canonical_refs, ...checkpointRefs]);
  const payloadWithoutHash = {
    project_id: manifest.project_id,
    scope: manifest.scope,
    title: manifest.title,
    summary: manifest.summary,
    source_ids: [...latestBySource.keys()].sort(),
    checkpoint_ids: checkpointIds.sort(),
    canonical_refs: canonicalRefs,
    capability_snapshot: capabilities,
    coverage_snapshot: coverage,
    contains_secrets: false,
    created_by: actor,
  };
  if (containsSecretMaterial(payloadWithoutHash)) {
    throw new Error("El snapshot del manifiesto contiene material secreto.");
  }
  const content_hash = createHash("sha256")
    .update(JSON.stringify(stableValue(payloadWithoutHash)))
    .digest("hex");

  const { data, error } = await supabase
    .rpc("create_context_bridge_manifest", {
      p_payload: { ...payloadWithoutHash, content_hash },
    })
    .single();
  if (error) throw error;

  return {
    manifest: data,
    coverage,
    complete: coverage.every((item) => item.status === "complete"),
    content_hash,
  };
}

export async function getActiveContextBridgeManifest(projectId = "hocker-one") {
  const supabase = createAdminSupabase();
  const { data: manifest, error } = await supabase
    .from("context_bridge_manifests")
    .select("*")
    .eq("project_id", projectId)
    .eq("state", "active")
    .maybeSingle();
  if (error) throw error;
  if (!manifest) return null;

  const { data: coverage, error: coverageError } = await supabase
    .from("context_bridge_coverage")
    .select("domain_key, expected_refs, verified_refs, status, missing_refs, evidence_refs, verified_at")
    .eq("manifest_id", manifest.id)
    .order("domain_key");
  if (coverageError) throw coverageError;

  return {
    ...manifest,
    coverage: coverage ?? [],
    context_bridge_version: CONTEXT_BRIDGE_VERSION,
  };
}
