import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { requireOwnerOrInternal } from "@/lib/hocker-owner-api-gate";
import { HOCKER_MEMORY_MIRROR_API_VERSION, RETENTION_TIERS, REVIEW_DECISIONS, REVIEW_ROLES, RISK_LEVELS, agiArray, agiName, auditEvent, bool, intRange, jsonObject, learningSelect, optText, pick, sb, stableHash, stringArray, text, upsertErrorPattern } from "@/lib/hocker-memory-mirror";

export const dynamic = "force-dynamic";

type ReviewInput = Record<string, unknown>;

export async function POST(req: NextRequest) {
  const traceId = randomUUID();
  const gate = requireOwnerOrInternal(req, traceId);
  if (gate) return gate;

  const input = (await req.json().catch(() => ({}))) as ReviewInput;
  const projectId = text(input.project_id, "hocker-one", 80);
  const learningEventId = text(input.learning_event_id, "", 80);
  if (!learningEventId) return NextResponse.json({ ok: false, trace_id: traceId, reason: "learning_event_id_required" }, { status: 400 });

  const reviewerAgiId = agiArray(input.reviewer_agi_id)[0] || "nova";
  const reviewerRole = pick(input.reviewer_role, REVIEW_ROLES, reviewerAgiId === "nova" ? "nova" : "reviewer");
  const decision = pick(input.decision, REVIEW_DECISIONS, "noted");
  const riskLevel = pick(input.risk_level, RISK_LEVELS, "medium");
  const reason = text(input.reason, "Revisión registrada.", 2000);

  const db = sb();
  const { data: learning, error: learningError } = await db.from("agi_learning_events").select(learningSelect).eq("project_id", projectId).eq("id", learningEventId).maybeSingle();
  if (learningError || !learning) return NextResponse.json({ ok: false, trace_id: traceId, reason: "learning_event_not_found", error: learningError?.message }, { status: 404 });

  const { data: review, error: reviewError } = await db.from("agi_learning_reviews").insert({
    project_id: projectId, learning_event_id: learningEventId, reviewer_agi_id: reviewerAgiId, reviewer_agi_name: text(input.reviewer_agi_name, agiName(reviewerAgiId), 160), reviewer_role: reviewerRole, decision, reason, risk_level: riskLevel, policy_notes: jsonObject(input.policy_notes),
  }).select("id").single();
  if (reviewError) return NextResponse.json({ ok: false, trace_id: traceId, reason: "failed_to_insert_review", error: reviewError.message }, { status: 500 });

  let nextStatus = learning.status as string;
  if (decision === "rejected" || decision === "needs_changes") nextStatus = "rejected";
  if (decision === "blocked") nextStatus = "blocked";

  let memoryMirrorId: string | null = null;
  const canPublish = decision === "approved" && bool(input.publish_to_memory, false) && ["nova", "syntia", "owner"].includes(reviewerRole);

  if (canPublish) {
    const targetAgiIds = agiArray(input.target_agi_ids, agiArray(learning.applies_to_agi_ids, agiArray(learning.suggested_targets, [learning.source_agi_id])));
    const sourceHash = (learning.source_hash as string | null) || stableHash([projectId, learning.id, learning.learning_title]);
    const canonicalMemoryKey = (learning.canonical_memory_key as string | null) || `memory.${learning.source_agi_id}.${learning.id}`;
    const safetyStatus = input.safety_status === "blocked" || input.safety_status === "restricted" ? input.safety_status : "safe";
    const retentionTier = pick(input.retention_tier || learning.retention_tier, RETENTION_TIERS, "hot");

    const { data: existingMemory } = await db.from("agi_memory_mirror").select("id,times_seen").eq("project_id", projectId).eq("canonical_memory_key", canonicalMemoryKey).maybeSingle();
    if (existingMemory?.id) {
      await db.from("agi_memory_mirror").update({ last_seen_at: new Date().toISOString(), times_seen: Number(existingMemory.times_seen || 0) + 1, active: safetyStatus !== "blocked" }).eq("id", existingMemory.id);
      memoryMirrorId = existingMemory.id as string;
    } else {
      const { data: memory, error: memoryError } = await db.from("agi_memory_mirror").insert({
        project_id: projectId, learning_event_id: learningEventId, title: learning.learning_title, summary: learning.learning_summary, category: learning.learning_category || "general", source_agi_id: learning.source_agi_id, source_agi_name: learning.source_agi_name,
        target_agi_ids: targetAgiIds, target_modules: stringArray(input.target_modules), memory_payload: { evidence: learning.evidence || {}, review_id: review?.id, api_version: HOCKER_MEMORY_MIRROR_API_VERSION }, usefulness_score: intRange(input.usefulness_score, 3, 1, 5), safety_status: safetyStatus,
        approved_by_nova: reviewerRole === "nova" || reviewerRole === "owner", approved_by_syntia: reviewerRole === "syntia" || reviewerRole === "owner", approved_by_vertx: reviewerRole === "vertx", approved_by_jurix: reviewerRole === "jurix", active: safetyStatus !== "blocked",
        source_hash: sourceHash, semantic_hash: learning.semantic_hash, canonical_memory_key: canonicalMemoryKey, source_type: learning.source_type, source_name: learning.source_name, source_url: learning.source_url, source_platform: learning.source_platform,
        client_id: learning.client_id, brand_id: learning.brand_id, campaign_id: learning.campaign_id, content_id: learning.content_id, profile_id: learning.profile_id, confidence_score: learning.confidence_score || 3, freshness_score: learning.freshness_score || 3,
        valid_from: learning.valid_from || new Date().toISOString(), expires_at: learning.expires_at, prevents_error: Boolean(learning.prevents_error), error_pattern: learning.error_pattern, recommended_action: learning.recommended_action, requires_owner_approval: bool(input.requires_owner_approval, Boolean(learning.requires_owner_approval)), retention_tier: retentionTier, created_by: reviewerAgiId,
      }).select("id").single();
      if (memoryError) return NextResponse.json({ ok: false, trace_id: traceId, reason: "failed_to_publish_memory", error: memoryError.message }, { status: 500 });
      memoryMirrorId = memory?.id as string;
    }

    for (const agiId of targetAgiIds) {
      const { data: existingFeed } = await db.from("agi_update_feed").select("id").eq("project_id", projectId).eq("agi_id", agiId).eq("canonical_memory_key", canonicalMemoryKey).maybeSingle();
      if (!existingFeed?.id) {
        await db.from("agi_update_feed").insert({ project_id: projectId, agi_id: agiId, learning_event_id: learningEventId, memory_mirror_id: memoryMirrorId, title: learning.learning_title, summary: learning.learning_summary, update_type: learning.update_type || "agi_observation", priority: riskLevel === "critical" ? "critical" : riskLevel === "high" ? "high" : "medium", status: safetyStatus === "blocked" ? "blocked" : "active", client_id: learning.client_id, brand_id: learning.brand_id, campaign_id: learning.campaign_id, content_id: learning.content_id, profile_id: learning.profile_id, source_hash: sourceHash, semantic_hash: learning.semantic_hash, canonical_memory_key: canonicalMemoryKey, valid_from: learning.valid_from || new Date().toISOString(), expires_at: learning.expires_at, confidence_score: learning.confidence_score || 3, freshness_score: learning.freshness_score || 3, prevents_error: Boolean(learning.prevents_error), error_pattern: learning.error_pattern, recommended_action: learning.recommended_action, requires_owner_approval: bool(input.requires_owner_approval, Boolean(learning.requires_owner_approval)), retention_tier: retentionTier });
      }
    }

    if (learning.prevents_error && learning.error_pattern) await upsertErrorPattern({ projectId, agiId: learning.source_agi_id, appliesTo: targetAgiIds, platform: learning.source_platform, clientId: learning.client_id, brandId: learning.brand_id, campaignId: learning.campaign_id, contentId: learning.content_id, profileId: learning.profile_id, title: learning.learning_title, errorPattern: learning.error_pattern, preventionRule: learning.recommended_action || learning.learning_summary, severity: riskLevel, canonicalKey: canonicalMemoryKey });
    nextStatus = safetyStatus === "blocked" ? "blocked" : "approved";
  }

  await db.from("agi_learning_events").update({ status: nextStatus, reviewed_by: reviewerAgiId, reviewed_at: new Date().toISOString() }).eq("id", learningEventId);
  await auditEvent({ projectId, level: decision === "blocked" ? "warn" : "info", type: "memory_mirror.learning.reviewed", message: `Revisión Memory Mirror: ${decision}`, data: { trace_id: traceId, learning_event_id: learningEventId, review_id: review?.id, reviewer_agi_id: reviewerAgiId, reviewer_role: reviewerRole, decision, published: Boolean(memoryMirrorId), memory_mirror_id: memoryMirrorId } });

  return NextResponse.json({ ok: true, trace_id: traceId, review_id: review?.id, learning_event_id: learningEventId, decision, status: nextStatus, published: Boolean(memoryMirrorId), memory_mirror_id: memoryMirrorId, message: memoryMirrorId ? "Aprendizaje aprobado y publicado en Memory Mirror/feed por AGI." : "Revisión registrada. No se publicó en Memory Mirror.", version: HOCKER_MEMORY_MIRROR_API_VERSION });
}
