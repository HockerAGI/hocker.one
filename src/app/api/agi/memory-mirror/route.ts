import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { requireOwnerOrInternal } from "@/lib/hocker-owner-api-gate";
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

  let query = sb().from("agi_memory_mirror").select(memorySelect).eq("project_id", projectId).order("created_at", { ascending: false }).limit(limit(url.searchParams.get("limit"), 30, 100));
  if (!includeInactive) query = query.eq("active", true);
  if (agiId) query = query.contains("target_agi_ids", [agiId]);
  if (category) query = query.eq("category", category);
  if (clientId) query = query.eq("client_id", clientId);
  if (brandId) query = query.eq("brand_id", brandId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ ok: false, trace_id: traceId, reason: "failed_to_read_memory_mirror", error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, trace_id: traceId, project_id: projectId, agi_id: agiId, count: data?.length || 0, memory: data || [], version: HOCKER_MEMORY_MIRROR_API_VERSION });
}
