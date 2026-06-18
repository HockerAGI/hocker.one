import {
  HOCKER_MEMORY_MIRROR_API_VERSION,
  RETENTION_TIERS,
  REVIEW_DECISIONS,
  RISK_LEVELS,
  agiArray,
  agiName,
  auditEvent,
  bool,
  intRange,
  jsonObject,
  learningSelect,
  pick,
  sb,
  stableHash,
  stringArray,
  text,
  upsertErrorPattern,
} from "@/lib/hocker-memory-mirror";

export const SYNTIA_MEMORY_REVIEW_GATE_VERSION = "12.7H-1";

type MemoryReviewInput = Record<string, unknown>;
type GateActor = "owner" | "internal" | "session_owner" | "session_admin" | "unknown";

function compact(value: unknown, max = 360): string {
  const clean = String(value ?? "").replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
}

function isOwnerActor(actor: GateActor): boolean {
  return actor === "owner" || actor === "session_owner";
}

function statusFromDecision(decision: string, currentStatus: unknown, published: boolean): string {
  if (decision === "approved") return published ? "approved" : "approved";
  if (decision === "rejected" || decision === "needs_changes") return "rejected";
  if (decision === "blocked") return "blocked";
  return String(currentStatus || "pending_review");
}

export function getSyntiaMemoryReviewGatePublicContext() {
  return {
    version: SYNTIA_MEMORY_REVIEW_GATE_VERSION,
    memory_mirror_api_version: HOCKER_MEMORY_MIRROR_API_VERSION,
    status: "active",
    mode: "owner_review_and_hardened_publication",
    source: "hocker-one",
    rules: {
      list_is_read_only: true,
      owner_decision_required: true,
      reviewer_role_body_ignored: true,
      legacy_review_route_hardened: true,
      publish_requires_owner_actor: true,
      no_direct_main_write: true,
      no_actions_created: true,
      audit_event_required: true,
      rollback_target_next: true,
    },
    endpoints: {
      review_gate: "/api/agi/runtime/memory/review",
      review_ui: "/memory/review",
      legacy_hardened: "/api/agi/learning/review",
    },
    tables_used: {
      proposals: "public.agi_learning_events",
      reviews: "public.agi_learning_reviews",
      published_memory: "public.agi_memory_mirror",
      update_feed: "public.agi_update_feed",
      audit: "public.events",
    },
    next_step:
      "12.7I debe agregar rollback de memoria publicada, diff de publicación y auditoría restaurable.",
  };
}

export async function listSyntiaMemoryReviewQueue(projectId = "hocker-one", limit = 50) {
  const db = sb();

  const { data, error } = await db
    .from("agi_learning_events")
    .select(learningSelect)
    .eq("project_id", projectId)
    .in("status", ["pending_review", "approved", "rejected", "blocked"])
    .order("created_at", { ascending: false })
    .limit(Math.min(Math.max(limit, 1), 100));

  if (error) {
    return {
      ok: false,
      version: SYNTIA_MEMORY_REVIEW_GATE_VERSION,
      project_id: projectId,
      error: error.message,
      rows: [],
      public_context: getSyntiaMemoryReviewGatePublicContext(),
    };
  }

  const rows = (data ?? []).map((row) => ({
    id: row.id,
    project_id: row.project_id,
    source_agi_id: row.source_agi_id,
    source_agi_name: row.source_agi_name,
    title: row.learning_title,
    summary_preview: compact(row.learning_summary, 420),
    category: row.learning_category,
    status: row.status,
    update_type: row.update_type,
    source_type: row.source_type,
    risk_level: row.risk_level,
    requires_owner_approval: Boolean(row.requires_owner_approval),
    canonical_memory_key: row.canonical_memory_key,
    applies_to_agi_ids: row.applies_to_agi_ids,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }));

  const counts = rows.reduce<Record<string, number>>((acc, row) => {
    const key = String(row.status || "unknown");
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  return {
    ok: true,
    version: SYNTIA_MEMORY_REVIEW_GATE_VERSION,
    project_id: projectId,
    generated_at: new Date().toISOString(),
    counts,
    rows,
    public_context: getSyntiaMemoryReviewGatePublicContext(),
  };
}

export async function decideSyntiaMemoryReview(
  input: MemoryReviewInput,
  actor: GateActor,
  traceId: string,
) {
  const projectId = text(input.project_id, "hocker-one", 80);
  const learningEventId = text(input.learning_event_id, "", 80);
  const decision = pick(input.decision, REVIEW_DECISIONS, "noted");
  const publishToMemory = bool(input.publish_to_memory, false);
  const reason = text(input.reason, "Revisión owner registrada desde Memory Review Gate.", 2000);
  const riskLevel = pick(input.risk_level, RISK_LEVELS, "medium");

  if (!learningEventId) {
    return {
      ok: false,
      http_status: 400,
      trace_id: traceId,
      version: SYNTIA_MEMORY_REVIEW_GATE_VERSION,
      reason: "learning_event_id_required",
      published: false,
    };
  }

  if (publishToMemory && !isOwnerActor(actor)) {
    return {
      ok: false,
      http_status: 403,
      trace_id: traceId,
      version: SYNTIA_MEMORY_REVIEW_GATE_VERSION,
      reason: "publish_requires_owner_actor",
      actor,
      published: false,
      message:
        "La publicación en Memory Mirror requiere decisión owner real. No se acepta reviewer_role enviado por body.",
    };
  }

  const db = sb();

  const { data: learning, error: learningError } = await db
    .from("agi_learning_events")
    .select(learningSelect)
    .eq("project_id", projectId)
    .eq("id", learningEventId)
    .maybeSingle();

  if (learningError || !learning) {
    return {
      ok: false,
      http_status: 404,
      trace_id: traceId,
      version: SYNTIA_MEMORY_REVIEW_GATE_VERSION,
      reason: "learning_event_not_found",
      error: learningError?.message ?? null,
      published: false,
    };
  }

  const reviewerRole = isOwnerActor(actor) ? "owner" : "reviewer";
  const reviewerAgiId = isOwnerActor(actor) ? "nova" : "syntia";
  const reviewerAgiName = isOwnerActor(actor) ? "Owner Gate" : agiName(reviewerAgiId);

  const { data: review, error: reviewError } = await db
    .from("agi_learning_reviews")
    .insert({
      project_id: projectId,
      learning_event_id: learningEventId,
      reviewer_agi_id: reviewerAgiId,
      reviewer_agi_name: reviewerAgiName,
      reviewer_role: reviewerRole,
      decision,
      reason,
      risk_level: riskLevel,
      policy_notes: {
        ...jsonObject(input.policy_notes),
        gate_actor: actor,
        reviewer_role_body_ignored: true,
        version: SYNTIA_MEMORY_REVIEW_GATE_VERSION,
      },
    })
    .select("id")
    .single();

  if (reviewError) {
    return {
      ok: false,
      http_status: 500,
      trace_id: traceId,
      version: SYNTIA_MEMORY_REVIEW_GATE_VERSION,
      reason: "failed_to_insert_review",
      error: reviewError.message,
      published: false,
    };
  }

  let memoryMirrorId: string | null = null;
  let feedCreated = false;
  const feedErrors: string[] = [];

  if (decision === "approved" && publishToMemory && isOwnerActor(actor)) {
    const targetAgiIds = agiArray(
      input.target_agi_ids,
      agiArray(learning.applies_to_agi_ids, agiArray(learning.suggested_targets, [learning.source_agi_id])),
    );

    const sourceHash =
      (learning.source_hash as string | null) ||
      stableHash([projectId, learning.id, learning.learning_title]);

    const canonicalMemoryKey =
      (learning.canonical_memory_key as string | null) || `memory.${learning.source_agi_id}.${learning.id}`;

    const safetyStatus =
      input.safety_status === "blocked" || input.safety_status === "restricted"
        ? String(input.safety_status)
        : "safe";

    const retentionTier = pick(input.retention_tier || learning.retention_tier, RETENTION_TIERS, "hot");

    const { data: existingMemory } = await db
      .from("agi_memory_mirror")
      .select("id,times_seen")
      .eq("project_id", projectId)
      .eq("canonical_memory_key", canonicalMemoryKey)
      .maybeSingle();

    if (existingMemory?.id) {
      await db
        .from("agi_memory_mirror")
        .update({
          last_seen_at: new Date().toISOString(),
          times_seen: Number(existingMemory.times_seen || 0) + 1,
          active: safetyStatus !== "blocked",
        })
        .eq("id", existingMemory.id);

      memoryMirrorId = existingMemory.id as string;
    } else {
      const { data: memory, error: memoryError } = await db
        .from("agi_memory_mirror")
        .insert({
          project_id: projectId,
          learning_event_id: learningEventId,
          title: learning.learning_title,
          summary: learning.learning_summary,
          category: learning.learning_category || "general",
          source_agi_id: learning.source_agi_id,
          source_agi_name: learning.source_agi_name,
          target_agi_ids: targetAgiIds,
          target_modules: stringArray(input.target_modules),
          memory_payload: {
            evidence: learning.evidence || {},
            review_id: review?.id,
            api_version: HOCKER_MEMORY_MIRROR_API_VERSION,
            publication_gate_version: SYNTIA_MEMORY_REVIEW_GATE_VERSION,
            approved_by_actor: actor,
          },
          usefulness_score: intRange(input.usefulness_score, 3, 1, 5),
          safety_status: safetyStatus,
          approved_by_nova: true,
          approved_by_syntia: true,
          approved_by_vertx: false,
          approved_by_jurix: false,
          active: safetyStatus !== "blocked",
          source_hash: sourceHash,
          semantic_hash: learning.semantic_hash,
          canonical_memory_key: canonicalMemoryKey,
          source_type: learning.source_type,
          source_name: learning.source_name,
          source_url: learning.source_url,
          source_platform: learning.source_platform,
          client_id: learning.client_id,
          brand_id: learning.brand_id,
          campaign_id: learning.campaign_id,
          content_id: learning.content_id,
          profile_id: learning.profile_id,
          confidence_score: learning.confidence_score || 3,
          freshness_score: learning.freshness_score || 3,
          valid_from: learning.valid_from || new Date().toISOString(),
          expires_at: learning.expires_at,
          prevents_error: Boolean(learning.prevents_error),
          error_pattern: learning.error_pattern,
          recommended_action: learning.recommended_action,
          requires_owner_approval: Boolean(learning.requires_owner_approval),
          retention_tier: retentionTier,
          created_by: reviewerAgiId,
        })
        .select("id")
        .single();

      if (memoryError) {
        // Idempotencia: si otra decisión concurrente ya publicó esta memoria
        // (mismo canonical_memory_key), recuperamos la fila existente en vez de fallar.
        if ((memoryError as { code?: string }).code === "23505") {
          const { data: raced } = await db
            .from("agi_memory_mirror")
            .select("id,times_seen")
            .eq("project_id", projectId)
            .eq("canonical_memory_key", canonicalMemoryKey)
            .maybeSingle();

          if (raced?.id) {
            await db
              .from("agi_memory_mirror")
              .update({
                last_seen_at: new Date().toISOString(),
                times_seen: Number(raced.times_seen || 0) + 1,
                active: safetyStatus !== "blocked",
              })
              .eq("id", raced.id);

            memoryMirrorId = raced.id as string;
          }
        }

        if (!memoryMirrorId) {
          return {
            ok: false,
            http_status: 500,
            trace_id: traceId,
            version: SYNTIA_MEMORY_REVIEW_GATE_VERSION,
            reason: "failed_to_publish_memory",
            error: memoryError.message,
            review_id: review?.id,
            published: false,
          };
        }
      } else {
        memoryMirrorId = memory?.id as string;
      }
    }

    for (const agiId of targetAgiIds) {
      const { data: existingFeed } = await db
        .from("agi_update_feed")
        .select("id")
        .eq("project_id", projectId)
        .eq("agi_id", agiId)
        .eq("canonical_memory_key", canonicalMemoryKey)
        .maybeSingle();

      if (!existingFeed?.id) {
        const { error: feedError } = await db.from("agi_update_feed").insert({
          project_id: projectId,
          agi_id: agiId,
          learning_event_id: learningEventId,
          memory_mirror_id: memoryMirrorId,
          title: learning.learning_title,
          summary: learning.learning_summary,
          update_type: learning.update_type || "agi_observation",
          priority: riskLevel === "critical" ? "critical" : riskLevel === "high" ? "high" : "medium",
          status: safetyStatus === "blocked" ? "blocked" : "active",
          client_id: learning.client_id,
          brand_id: learning.brand_id,
          campaign_id: learning.campaign_id,
          content_id: learning.content_id,
          profile_id: learning.profile_id,
          source_hash: sourceHash,
          semantic_hash: learning.semantic_hash,
          canonical_memory_key: canonicalMemoryKey,
          valid_from: learning.valid_from || new Date().toISOString(),
          expires_at: learning.expires_at,
          confidence_score: learning.confidence_score || 3,
          freshness_score: learning.freshness_score || 3,
          prevents_error: Boolean(learning.prevents_error),
          error_pattern: learning.error_pattern,
          recommended_action: learning.recommended_action,
          requires_owner_approval: Boolean(learning.requires_owner_approval),
          retention_tier: retentionTier,
        });

        if (!feedError) {
          feedCreated = true;
        } else if ((feedError as { code?: string }).code !== "23505") {
          // 23505 = otra decisión concurrente ya creó este feed; es idempotente.
          // Cualquier otro error (esquema/permiso/constraint) es real: se reporta
          // de forma explícita y auditada en vez de fingir que el feed se publicó.
          feedErrors.push(`${agiId}: ${feedError.message}`);
        }
      }
    }

    if (learning.prevents_error && learning.error_pattern) {
      await upsertErrorPattern({
        projectId,
        agiId: learning.source_agi_id,
        appliesTo: targetAgiIds,
        platform: learning.source_platform,
        clientId: learning.client_id,
        brandId: learning.brand_id,
        campaignId: learning.campaign_id,
        contentId: learning.content_id,
        profileId: learning.profile_id,
        title: learning.learning_title,
        errorPattern: learning.error_pattern,
        preventionRule: learning.recommended_action || learning.learning_summary,
        severity: riskLevel,
        canonicalKey: canonicalMemoryKey,
      });
    }
  }

  const nextStatus = statusFromDecision(decision, learning.status, Boolean(memoryMirrorId));

  await db
    .from("agi_learning_events")
    .update({
      status: nextStatus,
      reviewed_by: reviewerAgiId,
      reviewed_at: new Date().toISOString(),
    })
    .eq("project_id", projectId)
    .eq("id", learningEventId);

  await auditEvent({
    projectId,
    level: decision === "blocked" || feedErrors.length > 0 ? "warn" : "info",
    type: "memory_review_gate.decision",
    message: `Memory Review Gate 12.7H: ${decision}`,
    data: {
      trace_id: traceId,
      learning_event_id: learningEventId,
      review_id: review?.id,
      reviewer_agi_id: reviewerAgiId,
      reviewer_role: reviewerRole,
      gate_actor: actor,
      decision,
      status: nextStatus,
      published: Boolean(memoryMirrorId),
      memory_mirror_id: memoryMirrorId,
      feed_created: feedCreated,
      feed_degraded: feedErrors.length > 0,
      feed_errors: feedErrors,
      reviewer_role_body_ignored: true,
      version: SYNTIA_MEMORY_REVIEW_GATE_VERSION,
    },
  });

  return {
    ok: true,
    http_status: 200,
    trace_id: traceId,
    version: SYNTIA_MEMORY_REVIEW_GATE_VERSION,
    review_id: review?.id,
    learning_event_id: learningEventId,
    decision,
    status: nextStatus,
    published: Boolean(memoryMirrorId),
    feed_created: feedCreated,
    feed_degraded: feedErrors.length > 0,
    feed_errors: feedErrors,
    actions_created: false,
    memory_mirror_id: memoryMirrorId,
    gate_actor: actor,
    reviewer_role: reviewerRole,
    message: memoryMirrorId
      ? feedErrors.length > 0
        ? "Aprendizaje aprobado y publicado en Memory Mirror, pero el feed quedó parcial (ver feed_errors)."
        : "Aprendizaje aprobado por Owner Gate y publicado en Memory Mirror/feed."
      : "Revisión registrada. No se publicó en Memory Mirror.",
  };
}
