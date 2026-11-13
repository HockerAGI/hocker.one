import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { requireOwnerOrInternal } from "@/lib/hocker-owner-api-gate";
import { resolveApprovedMemoryIds } from "@/lib/agi-memory-approval-read";
import type { MirrorPolicyRow } from "@/lib/agi-memory-policy";
import { HOCKER_MEMORY_MIRROR_API_VERSION, agiArray, feedSelect, limit, sb, text } from "@/lib/hocker-memory-mirror";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const traceId = randomUUID();
  const gate = requireOwnerOrInternal(req, traceId);
  if (gate) return gate;

  const url = new URL(req.url);
  const projectId = text(url.searchParams.get("project_id"), "hocker-one", 80);
  const agiId = agiArray(url.searchParams.get("agi_id"))[0];
  if (!agiId) return NextResponse.json({ ok: false, trace_id: traceId, reason: "agi_id_required", message: "Indica una de las 16 AGIs canónicas para consultar su feed." }, { status: 400 });

  const status = text(url.searchParams.get("status"), "", 40);
  const updateType = text(url.searchParams.get("update_type"), "", 80);
  const clientId = text(url.searchParams.get("client_id"), "", 120);
  const brandId = text(url.searchParams.get("brand_id"), "", 120);

  let query = sb().from("agi_update_feed").select(feedSelect).eq("project_id", projectId).eq("agi_id", agiId).order("created_at", { ascending: false }).limit(limit(url.searchParams.get("limit"), 30, 100));
  if (status) query = query.eq("status", status); else query = query.in("status", ["active", "review_required"]);
  if (updateType) query = query.eq("update_type", updateType);
  if (clientId) query = query.eq("client_id", clientId);
  if (brandId) query = query.eq("brand_id", brandId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ ok: false, trace_id: traceId, reason: "failed_to_read_agi_update_feed", error: error.message }, { status: 500 });
  let safeFeed = data ?? [];
  const mirrorIds = Array.from(new Set(safeFeed
    .filter((item) => item.status === "active" && item.memory_mirror_id)
    .map((item) => item.memory_mirror_id as string)));
  if (mirrorIds.length) {
    const { data: memories, error: memoryError } = await sb()
      .from("agi_memory_mirror")
      .select("id,project_id,active,safety_status,approved_by_nova,approved_by_syntia,approved_by_vertx,approved_by_jurix,learning_event_id,source_type,source_name,source_hash,canonical_memory_key,valid_from,expires_at")
      .eq("project_id", projectId).in("id", mirrorIds).limit(100);
    if (memoryError || !memories) {
      return NextResponse.json({ ok: false, trace_id: traceId, reason: "feed_memory_approval_read_failed" }, { status: 503 });
    }
    try {
      const approved = await resolveApprovedMemoryIds(memories as MirrorPolicyRow[], projectId);
      safeFeed = safeFeed.filter((row) =>
        row.status !== "active" || (row.memory_mirror_id !== null && approved.has(row.memory_mirror_id)));
    } catch {
      return NextResponse.json({ ok: false, trace_id: traceId, reason: "feed_memory_approval_check_failed" }, { status: 503 });
    }
  } else {
    // An active feed without linked approved memory is not deliverable.
    safeFeed = safeFeed.filter((row) => row.status !== "active");
  }
  return NextResponse.json({ ok: true, trace_id: traceId, project_id: projectId, agi_id: agiId, count: safeFeed.length, feed: safeFeed, version: HOCKER_MEMORY_MIRROR_API_VERSION });
}
