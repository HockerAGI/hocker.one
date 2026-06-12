import { createAdminSupabase } from "@/lib/supabase-admin";
import type { JsonObject } from "@/lib/types";

export type SyntiaMemoryStatus = "active" | "partial" | "empty" | "unavailable";

type DbRow = Record<string, unknown>;

function asText(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function compact(value: unknown, max = 360): string {
  const clean = String(value ?? "").replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
}

function safeData(value: unknown): JsonObject | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as JsonObject) : null;
}

function priorityForType(type: string): number {
  if (type === "memory.research_gate") return 100;
  if (type === "memory.correction") return 95;
  if (type === "memory.decision") return 90;
  if (type === "memory.state") return 85;
  if (type === "memory.next") return 75;
  if (type === "memory.interaction") return 20;
  return 50;
}

function newestFirst(rows: DbRow[]): DbRow[] {
  return [...rows].sort((a, b) => {
    const at = new Date(asText(a.created_at)).getTime() || 0;
    const bt = new Date(asText(b.created_at)).getTime() || 0;
    return bt - at;
  });
}

function prioritizedMemory(rows: DbRow[]): DbRow[] {
  return [...rows].sort((a, b) => {
    const pa = priorityForType(asText(a.type));
    const pb = priorityForType(asText(b.type));
    if (pa !== pb) return pb - pa;

    const at = new Date(asText(a.created_at)).getTime() || 0;
    const bt = new Date(asText(b.created_at)).getTime() || 0;
    return bt - at;
  });
}

async function safeQuery(label: string, query: PromiseLike<{ data: unknown; error: unknown }>) {
  try {
    const { data, error } = await query;
    if (error) {
      const err = error as { message?: string };
      return { label, ok: false, rows: [] as DbRow[], error: err.message || "query_error" };
    }

    return {
      label,
      ok: true,
      rows: Array.isArray(data) ? (data as DbRow[]) : [],
      error: null,
    };
  } catch (error) {
    return {
      label,
      ok: false,
      rows: [] as DbRow[],
      error: error instanceof Error ? error.message : "unknown_error",
    };
  }
}

function latestByType(rows: DbRow[], type: string) {
  const row = newestFirst(rows).find((item) => asText(item.type) === type);
  if (!row) return null;

  return {
    type,
    message: compact(row.message),
    created_at: asText(row.created_at),
    data: safeData(row.data),
  };
}

function briefMemory(row: DbRow) {
  return {
    type: asText(row.type, "memory.unknown"),
    message: compact(row.message),
    created_at: asText(row.created_at),
    level: asText(row.level, "info"),
    agi_id: asText(safeData(row.data)?.agi_id, asText(safeData(row.data)?.agi, "syntia")),
  };
}

export async function getSyntiaOperationalMemorySnapshot(projectId = "hocker-one") {
  const db = createAdminSupabase();

  const [
    events,
    threads,
    messages,
    memoryMirror,
    updateFeed,
  ] = await Promise.all([
    safeQuery(
      "events.memory",
      db
        .from("events")
        .select("id,project_id,level,type,message,data,created_at")
        .eq("project_id", projectId)
        .like("type", "memory.%")
        .order("created_at", { ascending: false })
        .limit(120),
    ),
    safeQuery(
      "nova_threads",
      db
        .from("nova_threads")
        .select("id,project_id,user_id,title,summary,meta,created_at,updated_at")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false })
        .limit(30),
    ),
    safeQuery(
      "nova_messages",
      db
        .from("nova_messages")
        .select("id,project_id,thread_id,role,content,meta,created_at")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false })
        .limit(80),
    ),
    safeQuery(
      "agi_memory_mirror",
      db
        .from("agi_memory_mirror")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false })
        .limit(50),
    ),
    safeQuery(
      "agi_update_feed",
      db
        .from("agi_update_feed")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false })
        .limit(50),
    ),
  ]);

  const sources = [events, threads, messages, memoryMirror, updateFeed];
  const workingSources = sources.filter((source) => source.ok).length;
  const memoryRows = newestFirst(events.rows);
  const prioritized = prioritizedMemory(memoryRows);

  const status: SyntiaMemoryStatus =
    workingSources === 0
      ? "unavailable"
      : memoryRows.length === 0 && messages.rows.length === 0 && memoryMirror.rows.length === 0
        ? "empty"
        : workingSources < sources.length
          ? "partial"
          : "active";

  const counts = {
    memory_events: memoryRows.length,
    memory_state: memoryRows.filter((row) => asText(row.type) === "memory.state").length,
    memory_decision: memoryRows.filter((row) => asText(row.type) === "memory.decision").length,
    memory_next: memoryRows.filter((row) => asText(row.type) === "memory.next").length,
    memory_interaction: memoryRows.filter((row) => asText(row.type) === "memory.interaction").length,
    nova_threads: threads.rows.length,
    nova_messages: messages.rows.length,
    memory_mirror: memoryMirror.rows.length,
    update_feed: updateFeed.rows.length,
  };

  const publicContext = {
    version: "12.7F-1",
    status,
    source: "supabase",
    project_id: projectId,
    generated_at: new Date().toISOString(),
    purpose: "Snapshot operacional de SYNTIA para continuidad, decisiones, pendientes y contexto vivo.",
    rules: {
      read_only: true,
      no_execution: true,
      no_actions_created: true,
      no_sensitive_data_export: true,
      owner_gate_for_writes: true,
    },
    counts,
    latest_state: latestByType(memoryRows, "memory.state"),
    latest_decision: latestByType(memoryRows, "memory.decision"),
    latest_next: latestByType(memoryRows, "memory.next"),
    recent_memory: prioritized.slice(0, 12).map(briefMemory),
    source_health: sources.map((source) => ({
      source: source.label,
      ok: source.ok,
      count: source.rows.length,
      error: source.error,
    })),
    next_step:
      "Convertir esta lectura en memoria operacional curada: dedupe, estados canónicos, decisiones owner y handoff automático para NOVA.",
  };

  return {
    ok: status !== "unavailable",
    project_id: projectId,
    generated_at: publicContext.generated_at,
    status,
    counts,
    latest_state: publicContext.latest_state,
    latest_decision: publicContext.latest_decision,
    latest_next: publicContext.latest_next,
    recent_memory: publicContext.recent_memory,
    source_health: publicContext.source_health,
    public_context: publicContext,
  };
}
