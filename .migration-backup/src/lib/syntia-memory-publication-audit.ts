import {
  HOCKER_MEMORY_MIRROR_API_VERSION,
  auditEvent,
  intRange,
  jsonObject,
  memorySelect,
  sb,
  text,
  type JsonObject,
} from "@/lib/hocker-memory-mirror";

export const SYNTIA_MEMORY_PUBLICATION_AUDIT_VERSION = "12.7I-1";

type MemoryPublicationAuditInput = Record<string, unknown>;
type GateActor = "owner" | "internal" | "session_owner" | "session_admin" | "unknown";

function compact(value: unknown, max = 420): string {
  const clean = String(value ?? "").replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
}

function isOwnerActor(actor: GateActor): boolean {
  return actor === "owner" || actor === "session_owner";
}

function safeJson(value: unknown): JsonObject {
  return jsonObject(value);
}

function findMemoryQuery(input: MemoryPublicationAuditInput, projectId: string) {
  const memoryMirrorId = text(input.memory_mirror_id || input.id, "", 120);
  const canonicalMemoryKey = text(input.canonical_memory_key, "", 260);

  let query = sb().from("agi_memory_mirror").select(memorySelect).eq("project_id", projectId);

  if (memoryMirrorId) {
    query = query.eq("id", memoryMirrorId);
  } else {
    query = query.eq("canonical_memory_key", canonicalMemoryKey);
  }

  return { query, memoryMirrorId, canonicalMemoryKey };
}

export function getSyntiaMemoryPublicationAuditPublicContext() {
  return {
    version: SYNTIA_MEMORY_PUBLICATION_AUDIT_VERSION,
    memory_mirror_api_version: HOCKER_MEMORY_MIRROR_API_VERSION,
    status: "active",
    mode: "rollback_preview_and_owner_restore_audit",
    source: "hocker-one",
    rules: {
      list_is_read_only: true,
      diff_is_read_only: true,
      preview_is_read_only: true,
      rollback_requires_owner_actor: true,
      rollback_deactivates_memory: true,
      rollback_marks_update_feed_blocked: true,
      no_direct_delete: true,
      no_direct_main_write: true,
      no_actions_created: true,
      audit_event_required: true,
      restore_snapshot_required: true,
    },
    endpoints: {
      publication_audit: "/api/agi/runtime/memory/publication-audit",
      review_gate: "/api/agi/runtime/memory/review",
      memory_review_ui: "/memory/review",
    },
    tables_used: {
      memory: "public.agi_memory_mirror",
      update_feed: "public.agi_update_feed",
      learning_events: "public.agi_learning_events",
      audit: "public.events",
    },
    next_step:
      "12.7J debe convertir NOVA Chat en generador de borradores de acción con Owner Gate, sin ejecutar directamente desde chat.",
  };
}

export async function listSyntiaMemoryPublicationAudit(projectId = "hocker-one", limit = 50) {
  const db = sb();
  const safeLimit = Math.min(Math.max(limit, 1), 100);

  const { data, error } = await db
    .from("agi_memory_mirror")
    .select(memorySelect)
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(safeLimit);

  if (error) {
    return {
      ok: false,
      version: SYNTIA_MEMORY_PUBLICATION_AUDIT_VERSION,
      project_id: projectId,
      error: error.message,
      rows: [],
      public_context: getSyntiaMemoryPublicationAuditPublicContext(),
    };
  }

  const rows = (data ?? []).map((row) => ({
    id: row.id,
    project_id: row.project_id,
    learning_event_id: row.learning_event_id,
    title: row.title,
    summary_preview: compact(row.summary),
    category: row.category,
    source_agi_id: row.source_agi_id,
    source_agi_name: row.source_agi_name,
    target_agi_ids: row.target_agi_ids,
    safety_status: row.safety_status,
    active: Boolean(row.active),
    canonical_memory_key: row.canonical_memory_key,
    confidence_score: row.confidence_score,
    freshness_score: row.freshness_score,
    retention_tier: row.retention_tier,
    times_seen: row.times_seen,
    last_seen_at: row.last_seen_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }));

  const counts = rows.reduce<Record<string, number>>((acc, row) => {
    const key = row.active ? "active" : "inactive";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  return {
    ok: true,
    version: SYNTIA_MEMORY_PUBLICATION_AUDIT_VERSION,
    project_id: projectId,
    generated_at: new Date().toISOString(),
    counts,
    rows,
    read_only: true,
    public_context: getSyntiaMemoryPublicationAuditPublicContext(),
  };
}

export async function buildSyntiaPublicationDiff(input: MemoryPublicationAuditInput) {
  const projectId = text(input.project_id, "hocker-one", 80);
  const { query, memoryMirrorId, canonicalMemoryKey } = findMemoryQuery(input, projectId);

  if (!memoryMirrorId && !canonicalMemoryKey) {
    return {
      ok: false,
      version: SYNTIA_MEMORY_PUBLICATION_AUDIT_VERSION,
      reason: "memory_mirror_id_or_canonical_memory_key_required",
      read_only: true,
      public_context: getSyntiaMemoryPublicationAuditPublicContext(),
    };
  }

  const db = sb();
  const { data: memory, error: memoryError } = await query.maybeSingle();

  if (memoryError || !memory) {
    return {
      ok: false,
      version: SYNTIA_MEMORY_PUBLICATION_AUDIT_VERSION,
      reason: "memory_not_found",
      error: memoryError?.message ?? null,
      read_only: true,
      public_context: getSyntiaMemoryPublicationAuditPublicContext(),
    };
  }

  const { data: learning } = await db
    .from("agi_learning_events")
    .select("id,learning_title,learning_summary,status,source_hash,semantic_hash,canonical_memory_key,created_at,updated_at")
    .eq("project_id", projectId)
    .eq("id", memory.learning_event_id)
    .maybeSingle();

  const { data: feedRows } = await db
    .from("agi_update_feed")
    .select("id,agi_id,status,title,summary,canonical_memory_key,memory_mirror_id,created_at,updated_at")
    .eq("project_id", projectId)
    .eq("canonical_memory_key", memory.canonical_memory_key)
    .order("created_at", { ascending: false })
    .limit(50);

  return {
    ok: true,
    version: SYNTIA_MEMORY_PUBLICATION_AUDIT_VERSION,
    project_id: projectId,
    read_only: true,
    memory: {
      id: memory.id,
      active: memory.active,
      safety_status: memory.safety_status,
      title: memory.title,
      summary_preview: compact(memory.summary, 700),
      canonical_memory_key: memory.canonical_memory_key,
      source_hash: memory.source_hash,
      semantic_hash: memory.semantic_hash,
      learning_event_id: memory.learning_event_id,
      created_at: memory.created_at,
      updated_at: memory.updated_at,
    },
    learning_event: learning
      ? {
          id: learning.id,
          status: learning.status,
          title_match: learning.learning_title === memory.title,
          summary_match: learning.learning_summary === memory.summary,
          source_hash_match: learning.source_hash === memory.source_hash,
          semantic_hash_match: learning.semantic_hash === memory.semantic_hash,
          canonical_key_match: learning.canonical_memory_key === memory.canonical_memory_key,
          created_at: learning.created_at,
          updated_at: learning.updated_at,
        }
      : null,
    update_feed: {
      count: feedRows?.length ?? 0,
      rows: (feedRows ?? []).map((row) => ({
        id: row.id,
        agi_id: row.agi_id,
        status: row.status,
        title_match: row.title === memory.title,
        summary_match: row.summary === memory.summary,
        memory_mirror_id_match: row.memory_mirror_id === memory.id,
        canonical_memory_key: row.canonical_memory_key,
        created_at: row.created_at,
        updated_at: row.updated_at,
      })),
    },
    public_context: getSyntiaMemoryPublicationAuditPublicContext(),
  };
}

export async function previewSyntiaPublishedMemoryRollback(input: MemoryPublicationAuditInput) {
  const diff = await buildSyntiaPublicationDiff(input);

  if (!diff.ok || !("memory" in diff)) {
    return {
      ...diff,
      dry_run: true,
      writes_planned: false,
      can_rollback: false,
    };
  }

  const memory = diff.memory as Record<string, unknown>;
  const isActive = Boolean(memory.active);

  return {
    ok: true,
    version: SYNTIA_MEMORY_PUBLICATION_AUDIT_VERSION,
    project_id: diff.project_id,
    dry_run: true,
    writes_planned: false,
    can_rollback: isActive,
    reason: isActive ? "ready_for_owner_rollback" : "memory_already_inactive",
    rollback_plan: {
      memory_mirror_id: memory.id,
      canonical_memory_key: memory.canonical_memory_key,
      deactivate_memory: true,
      memory_new_active: false,
      update_feed_new_status: "blocked",
      direct_delete: false,
      restore_snapshot_required: true,
      audit_event_required: true,
    },
    diff,
    public_context: getSyntiaMemoryPublicationAuditPublicContext(),
  };
}

export async function rollbackSyntiaPublishedMemory(
  input: MemoryPublicationAuditInput,
  actor: GateActor,
  traceId: string,
) {
  const projectId = text(input.project_id, "hocker-one", 80);
  const reason = text(input.reason, "Rollback owner de memoria publicada.", 2000);

  if (!isOwnerActor(actor)) {
    return {
      ok: false,
      http_status: 403,
      trace_id: traceId,
      version: SYNTIA_MEMORY_PUBLICATION_AUDIT_VERSION,
      reason: "rollback_requires_owner_actor",
      actor,
      rolled_back: false,
      public_context: getSyntiaMemoryPublicationAuditPublicContext(),
    };
  }

  const preview = await previewSyntiaPublishedMemoryRollback({ ...input, project_id: projectId });

  if (!preview.ok || !preview.can_rollback) {
    return {
      ok: false,
      http_status: 409,
      trace_id: traceId,
      version: SYNTIA_MEMORY_PUBLICATION_AUDIT_VERSION,
      reason: preview.reason || "memory_not_ready_for_rollback",
      rolled_back: false,
      preview,
    };
  }

  const memory = (preview.diff as Record<string, unknown>).memory as Record<string, unknown>;
  const memoryMirrorId = String(memory.id || "");
  const canonicalMemoryKey = String(memory.canonical_memory_key || "");
  const db = sb();

  const beforeSnapshot = {
    memory,
    learning_event: (preview.diff as Record<string, unknown>).learning_event,
    update_feed: (preview.diff as Record<string, unknown>).update_feed,
    requester_notes: safeJson(input.rollback_notes),
  };

  await auditEvent({
    projectId,
    level: "warn",
    type: "memory_publication_audit.rollback_started",
    message: "Inicio de rollback owner para memoria publicada.",
    data: {
      trace_id: traceId,
      version: SYNTIA_MEMORY_PUBLICATION_AUDIT_VERSION,
      memory_mirror_id: memoryMirrorId,
      canonical_memory_key: canonicalMemoryKey,
      gate_actor: actor,
      reason,
      before_snapshot: beforeSnapshot,
    },
  });

  const now = new Date().toISOString();

  const { error: memoryUpdateError } = await db
    .from("agi_memory_mirror")
    .update({
      active: false,
      last_seen_at: now,
      memory_payload: {
        rollback: {
          trace_id: traceId,
          version: SYNTIA_MEMORY_PUBLICATION_AUDIT_VERSION,
          actor,
          reason,
          rolled_back_at: now,
          before_snapshot: beforeSnapshot,
        },
      },
    })
    .eq("project_id", projectId)
    .eq("id", memoryMirrorId);

  if (memoryUpdateError) {
    await auditEvent({
      projectId,
      level: "error",
      type: "memory_publication_audit.rollback_failed",
      message: "Falló rollback de memoria publicada.",
      data: {
        trace_id: traceId,
        version: SYNTIA_MEMORY_PUBLICATION_AUDIT_VERSION,
        memory_mirror_id: memoryMirrorId,
        canonical_memory_key: canonicalMemoryKey,
        error: memoryUpdateError.message,
      },
    });

    return {
      ok: false,
      http_status: 500,
      trace_id: traceId,
      version: SYNTIA_MEMORY_PUBLICATION_AUDIT_VERSION,
      reason: "failed_to_deactivate_memory",
      error: memoryUpdateError.message,
      rolled_back: false,
      preview,
    };
  }

  const { data: feedRowsBefore } = await db
    .from("agi_update_feed")
    .select("id,agi_id,status,canonical_memory_key")
    .eq("project_id", projectId)
    .eq("canonical_memory_key", canonicalMemoryKey)
    .limit(100);

  const { error: feedUpdateError } = await db
    .from("agi_update_feed")
    .update({
      status: "blocked",
      result_note: `Rollback 12.7I aplicado por Owner Gate. Trace: ${traceId}`,
      updated_at: now,
    })
    .eq("project_id", projectId)
    .eq("canonical_memory_key", canonicalMemoryKey);

  await auditEvent({
    projectId,
    level: feedUpdateError ? "warn" : "info",
    type: "memory_publication_audit.rollback_completed",
    message: "Rollback owner aplicado sobre memoria publicada.",
    data: {
      trace_id: traceId,
      version: SYNTIA_MEMORY_PUBLICATION_AUDIT_VERSION,
      memory_mirror_id: memoryMirrorId,
      canonical_memory_key: canonicalMemoryKey,
      gate_actor: actor,
      reason,
      memory_active: false,
      update_feed_status: "blocked",
      feed_update_error: feedUpdateError?.message || null,
      feed_rows_before: (feedRowsBefore || []) as unknown as JsonObject[],
      restore_snapshot: beforeSnapshot,
      direct_delete: false,
      actions_created: false,
    },
  });

  return {
    ok: true,
    http_status: 200,
    trace_id: traceId,
    version: SYNTIA_MEMORY_PUBLICATION_AUDIT_VERSION,
    rolled_back: true,
    memory_mirror_id: memoryMirrorId,
    canonical_memory_key: canonicalMemoryKey,
    memory_active: false,
    update_feed_blocked: !feedUpdateError,
    update_feed_error: feedUpdateError?.message || null,
    actions_created: false,
    direct_delete: false,
    restore_snapshot_recorded: true,
    message: "Rollback aplicado. La memoria quedó inactiva, el feed quedó bloqueado y el evento de restauración quedó auditado.",
    public_context: getSyntiaMemoryPublicationAuditPublicContext(),
  };
}
