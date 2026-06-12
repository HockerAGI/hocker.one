import { createAdminSupabase } from "@/lib/supabase-admin";

export type HockerMemoryMirrorCount = {
  label: string;
  table: string;
  count: number | null;
  ok: boolean;
  note?: string;
};

export type HockerMemoryMirrorMemoryItem = {
  id: string;
  title: string;
  source_agi_id: string | null;
  source_agi_name: string | null;
  target_agi_ids: string[];
  retention_tier: string | null;
  times_seen: number | null;
  last_seen_at: string | null;
  created_at: string | null;
  prevents_error: boolean | null;
  active: boolean | null;
};

export type HockerMemoryMirrorFeedItem = {
  id: string;
  agi_id: string;
  title: string;
  status: string | null;
  update_type: string | null;
  retention_tier: string | null;
  times_seen: number | null;
  last_seen_at: string | null;
  created_at: string | null;
  prevents_error: boolean | null;
};

export type HockerMemoryMirrorLearningItem = {
  id: string;
  source_agi_id: string | null;
  learning_title: string;
  status: string | null;
  risk_level: string | null;
  update_type: string | null;
  times_seen: number | null;
  last_seen_at: string | null;
  created_at: string | null;
  prevents_error: boolean | null;
};

export type HockerMemoryMirrorErrorPattern = {
  id: string;
  error_title: string;
  severity: string | null;
  status: string | null;
  times_seen: number | null;
  last_seen_at: string | null;
  created_at: string | null;
};

export type HockerMemoryMirrorFeedGroup = {
  agi_id: string;
  count: number;
  latest_title: string;
  last_seen_at: string | null;
};

export type HockerMemoryMirrorLiveSummary = {
  ok: boolean;
  generated_at: string;
  mode: "memory_mirror_live";
  flow_label: string;
  counts: HockerMemoryMirrorCount[];
  approved_memory_count: number;
  active_feed_count: number;
  pending_learning_count: number;
  prevented_error_count: number;
  dedup_hits: number;
  last_sync_at: string | null;
  recent_memory: HockerMemoryMirrorMemoryItem[];
  recent_feed: HockerMemoryMirrorFeedItem[];
  feed_by_agi: HockerMemoryMirrorFeedGroup[];
  pending_learning: HockerMemoryMirrorLearningItem[];
  error_patterns: HockerMemoryMirrorErrorPattern[];
  executive_summary: string[];
};

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() && !Number.isNaN(Number(value))) return Number(value);
  return null;
}

function asString(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text || null;
}

function asBool(value: unknown): boolean | null {
  if (typeof value === "boolean") return value;
  return null;
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map((item) => String(item || "").trim()).filter(Boolean) : [];
}

function newestDate(...values: Array<string | null | undefined>): string | null {
  const valid = values
    .filter(Boolean)
    .map((value) => String(value))
    .filter((value) => !Number.isNaN(new Date(value).getTime()))
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  return valid[0] ?? null;
}

async function countTable(table: string, label: string): Promise<HockerMemoryMirrorCount> {
  const sb = createAdminSupabase();
  const { count, error } = await sb.from(table).select("*", { count: "exact", head: true });

  if (error) {
    return {
      label,
      table,
      count: null,
      ok: false,
      note: error.message,
    };
  }

  return {
    label,
    table,
    count: count ?? 0,
    ok: true,
  };
}

export async function getHockerMemoryMirrorLiveSummary(): Promise<HockerMemoryMirrorLiveSummary> {
  const sb = createAdminSupabase();

  const counts = await Promise.all([
    countTable("agi_learning_events", "Aprendizajes"),
    countTable("agi_learning_reviews", "Revisiones"),
    countTable("agi_memory_mirror", "Memorias aprobadas"),
    countTable("agi_update_feed", "Feeds AGI"),
    countTable("agi_error_patterns", "Errores prevenidos"),
    countTable("memory_archive_manifest", "Archivo frío"),
  ]);

  const { data: recentMemory } = await sb
    .from("agi_memory_mirror")
    .select("id,title,source_agi_id,source_agi_name,target_agi_ids,retention_tier,times_seen,last_seen_at,created_at,prevents_error,active")
    .order("created_at", { ascending: false })
    .limit(5);

  const { data: recentFeed } = await sb
    .from("agi_update_feed")
    .select("id,agi_id,title,status,update_type,retention_tier,times_seen,last_seen_at,created_at,prevents_error")
    .order("created_at", { ascending: false })
    .limit(8);

  const { data: feedRows } = await sb
    .from("agi_update_feed")
    .select("agi_id,title,status,last_seen_at,created_at")
    .eq("status", "active")
    .order("last_seen_at", { ascending: false })
    .limit(120);

  const { data: pendingLearning } = await sb
    .from("agi_learning_events")
    .select("id,source_agi_id,learning_title,status,risk_level,update_type,times_seen,last_seen_at,created_at,prevents_error")
    .eq("status", "pending_review")
    .order("created_at", { ascending: false })
    .limit(5);

  const { data: errorPatterns } = await sb
    .from("agi_error_patterns")
    .select("id,error_title,severity,status,times_seen,last_seen_at,created_at")
    .order("last_seen_at", { ascending: false })
    .limit(5);

  const { data: dedupRows } = await sb
    .from("agi_memory_mirror")
    .select("times_seen")
    .limit(1000);

  const memory = (recentMemory || []).map((item) => ({
    id: String(item.id),
    title: String(item.title || "Memoria sin título"),
    source_agi_id: asString(item.source_agi_id),
    source_agi_name: asString(item.source_agi_name),
    target_agi_ids: asStringArray(item.target_agi_ids),
    retention_tier: asString(item.retention_tier),
    times_seen: asNumber(item.times_seen),
    last_seen_at: asString(item.last_seen_at),
    created_at: asString(item.created_at),
    prevents_error: asBool(item.prevents_error),
    active: asBool(item.active),
  }));

  const feed = (recentFeed || []).map((item) => ({
    id: String(item.id),
    agi_id: String(item.agi_id || "agi"),
    title: String(item.title || "Actualización sin título"),
    status: asString(item.status),
    update_type: asString(item.update_type),
    retention_tier: asString(item.retention_tier),
    times_seen: asNumber(item.times_seen),
    last_seen_at: asString(item.last_seen_at),
    created_at: asString(item.created_at),
    prevents_error: asBool(item.prevents_error),
  }));

  const pending = (pendingLearning || []).map((item) => ({
    id: String(item.id),
    source_agi_id: asString(item.source_agi_id),
    learning_title: String(item.learning_title || "Aprendizaje sin título"),
    status: asString(item.status),
    risk_level: asString(item.risk_level),
    update_type: asString(item.update_type),
    times_seen: asNumber(item.times_seen),
    last_seen_at: asString(item.last_seen_at),
    created_at: asString(item.created_at),
    prevents_error: asBool(item.prevents_error),
  }));

  const errors = (errorPatterns || []).map((item) => ({
    id: String(item.id),
    error_title: String(item.error_title || "Error sin título"),
    severity: asString(item.severity),
    status: asString(item.status),
    times_seen: asNumber(item.times_seen),
    last_seen_at: asString(item.last_seen_at),
    created_at: asString(item.created_at),
  }));

  const grouped = new Map<string, HockerMemoryMirrorFeedGroup>();
  for (const row of feedRows || []) {
    const agiId = String(row.agi_id || "agi");
    const current = grouped.get(agiId);
    const latestDate = newestDate(asString(row.last_seen_at), asString(row.created_at));

    if (!current) {
      grouped.set(agiId, {
        agi_id: agiId,
        count: 1,
        latest_title: String(row.title || "Actualización activa"),
        last_seen_at: latestDate,
      });
    } else {
      grouped.set(agiId, {
        ...current,
        count: current.count + 1,
        latest_title: current.latest_title,
        last_seen_at: newestDate(current.last_seen_at, latestDate),
      });
    }
  }

  const feedByAgi = Array.from(grouped.values()).sort((a, b) => b.count - a.count || a.agi_id.localeCompare(b.agi_id));

  const approvedMemoryCount = counts.find((item) => item.table === "agi_memory_mirror")?.count ?? memory.length;
  const activeFeedCount = counts.find((item) => item.table === "agi_update_feed")?.count ?? feed.length;
  const preventedErrorCount = counts.find((item) => item.table === "agi_error_patterns")?.count ?? errors.length;
  const pendingLearningCount = pending.length;
  const dedupHits = (dedupRows || []).reduce((sum, item) => sum + Math.max(0, Number(item.times_seen || 1) - 1), 0);
  const lastSyncAt = newestDate(
    ...memory.map((item) => newestDate(item.last_seen_at, item.created_at)),
    ...feed.map((item) => newestDate(item.last_seen_at, item.created_at)),
    ...errors.map((item) => newestDate(item.last_seen_at, item.created_at)),
  );

  const executiveSummary = [
    approvedMemoryCount > 0
      ? "Memory Mirror ya tiene conocimiento aprobado y reutilizable entre AGIs."
      : "Memory Mirror está listo, pero aún no hay memorias aprobadas.",
    activeFeedCount > 0
      ? "Las AGIs ya reciben actualizaciones filtradas por función."
      : "Aún no hay feeds activos por AGI.",
    preventedErrorCount > 0
      ? "El sistema ya registra patrones para no repetir errores."
      : "Todavía no hay patrones de error preventivo registrados.",
    dedupHits > 0
      ? "La deduplicación ya detectó conocimiento repetido sin crear basura."
      : "La deduplicación está lista; falta recurrencia real para medirla.",
  ];

  return {
    ok: true,
    generated_at: new Date().toISOString(),
    mode: "memory_mirror_live",
    flow_label: "Candy Ads → Syntia → NOVA → Memory Mirror → AGIs destino",
    counts,
    approved_memory_count: approvedMemoryCount,
    active_feed_count: activeFeedCount,
    pending_learning_count: pendingLearningCount,
    prevented_error_count: preventedErrorCount,
    dedup_hits: dedupHits,
    last_sync_at: lastSyncAt,
    recent_memory: memory,
    recent_feed: feed,
    feed_by_agi: feedByAgi,
    pending_learning: pending,
    error_patterns: errors,
    executive_summary: executiveSummary,
  };
}
