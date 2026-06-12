import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { requireOwnerOrInternal } from "@/lib/hocker-owner-api-gate";
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
  return NextResponse.json({ ok: true, trace_id: traceId, project_id: projectId, agi_id: agiId, count: data?.length || 0, feed: data || [], version: HOCKER_MEMORY_MIRROR_API_VERSION });
}
