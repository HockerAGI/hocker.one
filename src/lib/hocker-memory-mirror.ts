import { createHash } from "crypto";
import { createAdminSupabase } from "@/lib/supabase-admin";
import { HOCKER_AGI_CANON, isHockerAgiId, type HockerAgiId } from "@/lib/hocker-agi-canon";

export const HOCKER_MEMORY_MIRROR_API_VERSION = "hocker-memory-mirror-api-v0.1.0";
export type JsonObject = Record<string, unknown>;

export const RISK_LEVELS = ["low", "medium", "high", "critical"] as const;
export const UPDATE_TYPES = ["policy_update", "metric_learning", "creative_trend", "algorithm_change", "error_prevention", "platform_rule", "internal_result", "client_context", "agi_observation"] as const;
export const SOURCE_TYPES = ["official_source", "internal_metric", "campaign_result", "owner_note", "agi_observation", "client_history", "platform_event"] as const;
export const RETENTION_TIERS = ["hot", "warm", "cold", "archive"] as const;
export const ACTION_SCOPES = ["recommendation", "draft_change", "minor_action", "sensitive_action"] as const;
export const REVIEW_DECISIONS = ["approved", "rejected", "blocked", "needs_changes", "noted"] as const;
export const REVIEW_ROLES = ["nova", "syntia", "vertx", "jurix", "owner", "reviewer"] as const;

export type RiskLevel = (typeof RISK_LEVELS)[number];
export type ReviewRole = (typeof REVIEW_ROLES)[number];

const AGI_ALIASES: Record<string, HockerAgiId> = {
  candy_ads: "candy", candy: "candy", chido_gerente: "chido_gerente", chido_wins: "chido_wins", curvewind: "curvewind",
  hostia: "hostia", jurix: "jurix", nexpa: "nexpa", nova: "nova", nova_ads: "nova_ads", numia: "numia",
  pro: "pro_ia", pro_ia: "pro_ia", revia: "revia", shadows: "shadows", shadows_ia: "shadows", syntia: "syntia",
  trackhok: "trackhok", vertx: "vertx",
};

function key(value: unknown): string {
  return String(value ?? "").trim().toLowerCase().replace(/[\s-]+/g, "_").replace(/[^a-z0-9_]/g, "");
}

export function normalizeAgiId(value: unknown): HockerAgiId | null {
  const k = key(value);
  if (!k) return null;
  if (isHockerAgiId(k)) return k;
  return AGI_ALIASES[k] ?? null;
}

export function agiName(id: string): string {
  return HOCKER_AGI_CANON.find((agi) => agi.id === id)?.name ?? id;
}

export function text(value: unknown, fallback = "", max = 500): string {
  const out = String(value ?? "").trim() || fallback;
  return out.slice(0, max);
}

export function optText(value: unknown, max = 500): string | null {
  const out = String(value ?? "").trim();
  return out ? out.slice(0, max) : null;
}

export function bool(value: unknown, fallback = false): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const v = value.trim().toLowerCase();
    if (["1", "true", "yes", "si", "sí"].includes(v)) return true;
    if (["0", "false", "no"].includes(v)) return false;
  }
  return fallback;
}

export function intRange(value: unknown, fallback: number, min: number, max: number): number {
  const n = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

export function stringArray(value: unknown, max = 24): string[] {
  const raw = Array.isArray(value) ? value : typeof value === "string" ? value.split(",") : [];
  return raw.map((x) => String(x ?? "").trim()).filter(Boolean).slice(0, max);
}

export function agiArray(value: unknown, fallback: HockerAgiId[] = []): HockerAgiId[] {
  const ids = stringArray(value).map(normalizeAgiId).filter((x): x is HockerAgiId => Boolean(x));
  return Array.from(new Set(ids.length ? ids : fallback));
}

export function jsonObject(value: unknown): JsonObject {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as JsonObject) : {};
}

export function pick<T extends readonly string[]>(value: unknown, allowed: T, fallback: T[number]): T[number] {
  const v = text(value).toLowerCase();
  return allowed.includes(v) ? (v as T[number]) : fallback;
}

export function hash(parts: unknown[]): string {
  return createHash("sha256").update(parts.map((x) => typeof x === "string" ? x.trim().toLowerCase() : JSON.stringify(x ?? null)).join("|")).digest("hex");
}

export const stableHash = hash;

export function canonicalKey(input: { agi: string; type: string; platform?: string | null; client?: string | null; title: string }): string {
  return ["memory", input.agi, input.type, input.platform || "internal", input.client || "global", input.title].map(key).filter(Boolean).join(".").slice(0, 220);
}

export function limit(value: unknown, fallback = 30, max = 100): number {
  return intRange(value, fallback, 1, max);
}

export function sb() { return createAdminSupabase(); }

export const learningSelect = "id,project_id,source_agi_id,source_agi_name,source_module,learning_title,learning_summary,learning_category,evidence,suggested_targets,applies_to_agi_ids,risk_level,status,update_type,source_type,source_name,source_url,source_platform,source_hash,semantic_hash,canonical_memory_key,client_id,brand_id,campaign_id,content_id,profile_id,confidence_score,freshness_score,valid_from,expires_at,prevents_error,error_pattern,recommended_action,requires_owner_approval,retention_tier,created_at,updated_at";
export const memorySelect = "id,project_id,learning_event_id,title,summary,category,source_agi_id,source_agi_name,target_agi_ids,target_modules,source_type,source_name,source_url,source_platform,source_hash,semantic_hash,canonical_memory_key,memory_version,client_id,brand_id,campaign_id,content_id,profile_id,usefulness_score,safety_status,confidence_score,freshness_score,valid_from,expires_at,prevents_error,error_pattern,recommended_action,requires_owner_approval,retention_tier,times_seen,last_seen_at,active,created_at,updated_at";
export const feedSelect = "id,project_id,agi_id,source_id,learning_event_id,memory_mirror_id,title,summary,update_type,priority,status,client_id,brand_id,campaign_id,content_id,profile_id,source_hash,semantic_hash,canonical_memory_key,valid_from,expires_at,confidence_score,freshness_score,prevents_error,error_pattern,recommended_action,requires_owner_approval,retention_tier,seen_by_agi,applied_by_agi,applied_at,result_note,times_seen,last_seen_at,created_at,updated_at";

export async function auditEvent(input: { projectId?: string; level?: "info" | "warn" | "error"; type: string; message: string; data?: JsonObject }) {
  await sb().from("events").insert({
    project_id: input.projectId || "hocker-one",
    level: input.level || "info",
    type: input.type,
    message: input.message,
    data: { ...(input.data || {}), memory_mirror_api_version: HOCKER_MEMORY_MIRROR_API_VERSION },
  });
}

export async function upsertErrorPattern(input: {
  projectId: string; agiId: HockerAgiId; appliesTo: HockerAgiId[]; platform?: string | null; clientId?: string | null;
  brandId?: string | null; campaignId?: string | null; contentId?: string | null; profileId?: string | null;
  title: string; errorPattern: string; preventionRule: string; severity: RiskLevel; canonicalKey: string;
}) {
  const errorHash = hash([input.projectId, input.agiId, input.platform, input.clientId, input.errorPattern, input.preventionRule]);
  const db = sb();
  const { data: existing } = await db.from("agi_error_patterns").select("id,times_seen").eq("project_id", input.projectId).eq("error_hash", errorHash).maybeSingle();
  if (existing?.id) {
    await db.from("agi_error_patterns").update({ last_seen_at: new Date().toISOString(), times_seen: Number(existing.times_seen || 0) + 1, status: "active" }).eq("id", existing.id);
    return existing.id as string;
  }
  const { data, error } = await db.from("agi_error_patterns").insert({
    project_id: input.projectId, error_hash: errorHash, canonical_memory_key: input.canonicalKey, agi_id: input.agiId,
    applies_to_agi_ids: input.appliesTo, client_id: input.clientId, brand_id: input.brandId, campaign_id: input.campaignId,
    content_id: input.contentId, profile_id: input.profileId, platform: input.platform, error_title: input.title,
    error_pattern: input.errorPattern, prevention_rule: input.preventionRule, severity: input.severity, status: "active",
  }).select("id").single();
  if (error) throw error;
  return data?.id as string;
}
