import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { requireOwnerOrInternal } from "@/lib/hocker-owner-api-gate";
import { resolveApprovedMemoryIds } from "@/lib/agi-memory-approval-read";
import type { MirrorPolicyRow } from "@/lib/agi-memory-policy";
import { HOCKER_MEMORY_MIRROR_API_VERSION, agiArray, memorySelect, sb, limit, text } from "@/lib/hocker-memory-mirror";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const traceId = randomUUID();
  const gate = requireOwnerOrInternal(req, traceId);
  if (gate) return gate;

  const url = new URL(req.url);
  const projectId = text(url.searchParams.get("project_id"), "hocker-one", 80);
  const agiId = agiArray(url.searchParams.get("agi_id"))[0] || null;
  const category = text(url.searchParams.get("category"), "", 120);
  const clientId = text(url.searchParams.get("client_id"), "", 120);
  const brandId = text(url.searchParams.get("brand_id"), "", 120);
  const includeInactive = url.searchParams.get("include_inactive") === "1";

  let query = sb().from("agi_memory_mirror").select(`${memorySelect},approved_by_nova,approved_by_syntia,approved_by_vertx,approved_by_jurix`).eq("project_id", projectId).order("created_at", { ascending: false }).limit(limit(url.searchParams.get("limit"), 30, 100));
  if (!includeInactive) query = query.eq("active", true).eq("safety_status", "safe")
  .eq("approved_by_nova", true).eq("approved_by_syntia", true)
  .eq("approved_by_vertx", true).eq("approved_by_jurix", true);
  if (agiId) query = query.contains("target_agi_ids", [agiId]);
  if (category) query = query.eq("category", category);
  if (clientId) query = query.eq("client_id", clientId);
  if (brandId) query = query.eq("brand_id", brandId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ ok: false, trace_id: traceId, reason: "failed_to_read_memory_mirror", error: error.message }, { status: 500 });
  // Explicit audit mode preserves old records for Owner inspection. Normal reads
  // reject unapproved source events even if the mirror row says "active".
  let visible = data ?? [];
  if (!includeInactive) {
    try {
      const approved = await resolveApprovedMemoryIds(
        visible as MirrorPolicyRow[], projectId,
      );
      visible = visible.filter((row) => approved.has(row.id));
    } catch {
      return NextResponse.json({ ok: false, trace_id: traceId, reason: "memory_approval_check_unavailable" }, { status: 503 });
    }
  }
  return NextResponse.json({ ok: true, trace_id: traceId, project_id: projectId, agi_id: agiId, count: visible.length, memory: visible, version: HOCKER_MEMORY_MIRROR_API_VERSION });
}
