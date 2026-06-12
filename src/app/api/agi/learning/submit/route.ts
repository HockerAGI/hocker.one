import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { requireOwnerOrInternal } from "@/lib/hocker-owner-api-gate";
import { ACTION_SCOPES, HOCKER_MEMORY_MIRROR_API_VERSION, RETENTION_TIERS, RISK_LEVELS, SOURCE_TYPES, UPDATE_TYPES, agiArray, agiName, auditEvent, bool, canonicalKey, hash, intRange, jsonObject, optText, pick, sb, stringArray, text, upsertErrorPattern } from "@/lib/hocker-memory-mirror";

export const dynamic = "force-dynamic";

type SubmitInput = Record<string, unknown>;

export async function POST(req: NextRequest) {
  const traceId = randomUUID();
  const gate = requireOwnerOrInternal(req, traceId);
  if (gate) return gate;

  const input = (await req.json().catch(() => ({}))) as SubmitInput;
  const projectId = text(input.project_id, "hocker-one", 80);
  const sourceAgiId = agiArray(input.source_agi_id || input.agi_id)[0];

  if (!sourceAgiId) return NextResponse.json({ ok: false, trace_id: traceId, reason: "invalid_source_agi_id" }, { status: 400 });

  const title = text(input.learning_title || input.title, "", 220);
  const summary = text(input.learning_summary || input.summary, "", 3000);
  if (!title || !summary) return NextResponse.json({ ok: false, trace_id: traceId, reason: "learning_title_and_summary_required" }, { status: 400 });

  if (bool(input.contains_sensitive_data, false)) {
    await auditEvent({ projectId, level: "warn", type: "memory_mirror.learning.blocked_sensitive", message: `Aprendizaje bloqueado por datos sensibles: ${sourceAgiId}`, data: { trace_id: traceId, source_agi_id: sourceAgiId, title } });
    return NextResponse.json({ ok: false, trace_id: traceId, executed: false, reason: "sensitive_data_not_allowed", message: "No se registró el aprendizaje porque declara datos sensibles. Debe resumirse sin PII/secretos." }, { status: 422 });
  }

  const updateType = pick(input.update_type, UPDATE_TYPES, "agi_observation");
  const sourceType = pick(input.source_type, SOURCE_TYPES, "agi_observation");
  const riskLevel = pick(input.risk_level, RISK_LEVELS, "medium");
  const retentionTier = pick(input.retention_tier, RETENTION_TIERS, "hot");
  const actionScope = pick(input.action_scope, ACTION_SCOPES, "recommendation");
  const appliesToAgiIds = agiArray(input.applies_to_agi_ids || input.suggested_targets, [sourceAgiId]);
  const suggestedTargets = agiArray(input.suggested_targets, appliesToAgiIds);
  const sourcePlatform = optText(input.source_platform, 80);
  const clientId = optText(input.client_id, 120);
  const sourceHash = optText(input.source_hash, 128) || hash([projectId, sourceAgiId, updateType, sourceType, sourcePlatform, input.source_url, title, summary, clientId, input.brand_id, input.campaign_id, input.content_id]);
  const semanticHash = optText(input.semantic_hash, 128) || hash([title, summary, updateType, appliesToAgiIds]);
  const canonicalMemoryKey = optText(input.canonical_memory_key, 240) || canonicalKey({ agi: sourceAgiId, type: updateType, platform: sourcePlatform, client: clientId, title });

  const db = sb();
  const { data: existing, error: existingError } = await db.from("agi_learning_events").select("id,times_seen,status").eq("project_id", projectId).eq("source_hash", sourceHash).maybeSingle();
  if (existingError) return NextResponse.json({ ok: false, trace_id: traceId, reason: "duplicate_check_failed", error: existingError.message }, { status: 500 });
  if (existing?.id) {
    const now = new Date().toISOString();

    await db
      .from("agi_learning_events")
      .update({
        last_seen_at: now,
        times_seen: Number(existing.times_seen || 0) + 1,
      })
      .eq("id", existing.id);

    const { data: existingMemory } = await db
      .from("agi_memory_mirror")
      .select("id,times_seen")
      .eq("project_id", projectId)
      .eq("source_hash", sourceHash);

    for (const memory of existingMemory || []) {
      await db
        .from("agi_memory_mirror")
        .update({
          last_seen_at: now,
          times_seen: Number(memory.times_seen || 0) + 1,
        })
        .eq("id", memory.id);
    }

    const { data: existingFeed } = await db
      .from("agi_update_feed")
      .select("id,times_seen")
      .eq("project_id", projectId)
      .eq("source_hash", sourceHash);

    for (const feed of existingFeed || []) {
      await db
        .from("agi_update_feed")
        .update({
          last_seen_at: now,
          times_seen: Number(feed.times_seen || 0) + 1,
        })
        .eq("id", feed.id);
    }

    let errorPatternId: string | null = null;
    const errorPattern = optText(input.error_pattern, 1000);

    if (bool(input.prevents_error, false) && errorPattern) {
      errorPatternId = await upsertErrorPattern({
        projectId,
        agiId: sourceAgiId,
        appliesTo: appliesToAgiIds,
        platform: sourcePlatform,
        clientId,
        brandId: optText(input.brand_id, 120),
        campaignId: optText(input.campaign_id, 160),
        contentId: optText(input.content_id, 160),
        profileId: optText(input.profile_id, 160),
        title,
        errorPattern,
        preventionRule: text(input.recommended_action, summary, 1500),
        severity: riskLevel,
        canonicalKey: canonicalMemoryKey,
      });
    }

    await auditEvent({
      projectId,
      type: "memory_mirror.learning.duplicate_seen",
      message: `Aprendizaje duplicado detectado y propagado: ${sourceAgiId}`,
      data: {
        trace_id: traceId,
        learning_event_id: existing.id,
        source_agi_id: sourceAgiId,
        source_hash: sourceHash,
        memory_touched: (existingMemory || []).length,
        feed_touched: (existingFeed || []).length,
        error_pattern_id: errorPatternId,
      },
    });

    return NextResponse.json({
      ok: true,
      trace_id: traceId,
      duplicate: true,
      learning_event_id: existing.id,
      status: existing.status,
      memory_touched: (existingMemory || []).length,
      feed_touched: (existingFeed || []).length,
      error_pattern_id: errorPatternId,
      message: "Aprendizaje duplicado detectado. Se actualizó last_seen/times_seen en learning, memory, feed y patrón de error si aplica.",
    });
  }

  const { data: inserted, error } = await db.from("agi_learning_events").insert({
    project_id: projectId, source_agi_id: sourceAgiId, source_agi_name: agiName(sourceAgiId), source_module: optText(input.source_module, 160),
    learning_title: title, learning_summary: summary, learning_category: text(input.learning_category, "general", 120), evidence: jsonObject(input.evidence),
    suggested_targets: suggestedTargets, applies_to_agi_ids: appliesToAgiIds, applies_to_modules: stringArray(input.applies_to_modules), risk_level: riskLevel,
    status: "pending_review", update_type: updateType, source_type: sourceType, source_name: optText(input.source_name, 180), source_url: optText(input.source_url, 500),
    source_platform: sourcePlatform, source_hash: sourceHash, semantic_hash: semanticHash, canonical_memory_key: canonicalMemoryKey,
    client_id: clientId, brand_id: optText(input.brand_id, 120), campaign_id: optText(input.campaign_id, 160), content_id: optText(input.content_id, 160), profile_id: optText(input.profile_id, 160),
    confidence_score: intRange(input.confidence_score, 3, 1, 5), freshness_score: intRange(input.freshness_score, 3, 1, 5), valid_from: optText(input.valid_from, 80) || new Date().toISOString(),
    expires_at: optText(input.expires_at, 80), prevents_error: bool(input.prevents_error, false), error_pattern: optText(input.error_pattern, 1000), recommended_action: optText(input.recommended_action, 1500),
    action_scope: actionScope, requires_owner_approval: bool(input.requires_owner_approval, true), official_source: bool(input.official_source, sourceType === "official_source"), retention_tier: retentionTier,
    contains_sensitive_data: false, sensitive_data_note: optText(input.sensitive_data_note, 500), submitted_by: text(input.submitted_by, "hocker-one", 160),
  }).select("id,status,source_hash,canonical_memory_key").single();

  if (error) return NextResponse.json({ ok: false, trace_id: traceId, reason: "failed_to_insert_learning_event", error: error.message }, { status: 500 });

  let errorPatternId: string | null = null;
  const errorPattern = optText(input.error_pattern, 1000);
  if (bool(input.prevents_error, false) && errorPattern) {
    errorPatternId = await upsertErrorPattern({ projectId, agiId: sourceAgiId, appliesTo: appliesToAgiIds, platform: sourcePlatform, clientId, brandId: optText(input.brand_id, 120), campaignId: optText(input.campaign_id, 160), contentId: optText(input.content_id, 160), profileId: optText(input.profile_id, 160), title, errorPattern, preventionRule: text(input.recommended_action, summary, 1500), severity: riskLevel, canonicalKey: canonicalMemoryKey });
  }

  await auditEvent({ projectId, type: "memory_mirror.learning.submitted", message: `Aprendizaje enviado a revisión: ${sourceAgiId}`, data: { trace_id: traceId, learning_event_id: inserted?.id, source_agi_id: sourceAgiId, applies_to_agi_ids: appliesToAgiIds, canonical_memory_key: canonicalMemoryKey, error_pattern_id: errorPatternId } });
  return NextResponse.json({ ok: true, trace_id: traceId, executed: false, dry_run_execution: true, learning_event_id: inserted?.id, status: inserted?.status, source_hash: inserted?.source_hash, canonical_memory_key: inserted?.canonical_memory_key, error_pattern_id: errorPatternId, message: "Aprendizaje registrado como pendiente. No se compartió con otras AGIs hasta revisión.", version: HOCKER_MEMORY_MIRROR_API_VERSION });
}
